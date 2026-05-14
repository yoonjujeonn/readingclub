import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const getApiKey = () => process.env.GEMINI_API_KEY || '';
const getModel = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// 키워드 추출
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    '이', '가', '은', '는', '을', '를', '의', '에', '에서', '로', '으로',
    '와', '과', '도', '만', '까지', '부터', '에게', '한테', '께',
    '하다', '되다', '있다', '없다', '이다', '아니다',
    '그', '저', '것', '수', '등', '때', '더', '또', '대해', '대한',
    'the', 'is', 'at', 'in', 'on', 'and', 'or', 'to', 'of', 'for', 'a', 'an',
  ]);

  return text
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .map(w => w.toLowerCase())
    .filter(w => !stopWords.has(w));
}

// TF 벡터 생성
function buildTfVector(keywords: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const word of keywords) {
    tf.set(word, (tf.get(word) || 0) + 1);
  }
  return tf;
}

// Cosine Similarity 계산
function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, val] of vecA) {
    normA += val * val;
    if (vecB.has(key)) {
      dotProduct += val * vecB.get(key)!;
    }
  }
  for (const [, val] of vecB) {
    normB += val * val;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) return '';

  const model = getModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await axios.post(url, {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
  }, { timeout: 15000 });

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export interface SimilarThread {
  id: string;
  title: string;
  content: string | null;
  authorNickname: string;
  similarity: number;
  commonKeywords: string[];
  status: string;
  commentCount: number;
  createdAt: Date;
}

export const similarThreadService = {
  async findSimilar(groupId: string, title: string, content?: string): Promise<SimilarThread[]> {
    // 1. 같은 모임의 기존 스레드 가져오기
    const existingThreads = await prisma.discussion.findMany({
      where: { groupId },
      include: {
        author: { select: { nickname: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (existingThreads.length === 0) return [];

    // 2. 입력 텍스트의 키워드 벡터 생성
    const inputText = `${title} ${content || ''}`;
    const inputKeywords = extractKeywords(inputText);
    const inputVector = buildTfVector(inputKeywords);

    // 3. 각 스레드와 cosine similarity 계산
    const scored = existingThreads.map(thread => {
      const threadText = `${thread.title} ${thread.content || ''}`;
      const threadKeywords = extractKeywords(threadText);
      const threadVector = buildTfVector(threadKeywords);
      const similarity = cosineSimilarity(inputVector, threadVector);

      // 공통 키워드 추출
      const inputSet = new Set(inputKeywords);
      const commonKeywords = [...new Set(threadKeywords.filter(k => inputSet.has(k)))].slice(0, 5);

      return {
        thread,
        similarity,
        commonKeywords,
      };
    });

    // 4. 유사도 순 정렬, 상위 5개 선택
    scored.sort((a, b) => b.similarity - a.similarity);
    const top5 = scored.filter(s => s.similarity > 0.1).slice(0, 5);

    if (top5.length === 0) return [];

    // 5. AI 최종 유사도 판별
    let aiFiltered = top5;
    try {
      const systemPrompt = `당신은 스레드 유사도 판별 도우미입니다. 새 스레드와 기존 스레드들의 유사도를 판별해주세요. 반드시 JSON 배열로만 응답하세요.`;
      const userPrompt = `새 스레드:
제목: ${title}
내용: ${content || '(없음)'}

기존 스레드 후보:
${top5.map((s, i) => `${i + 1}. 제목: ${s.thread.title} / 내용: ${(s.thread.content || '').slice(0, 100)}`).join('\n')}

위 후보 중 새 스레드와 실제로 유사한 주제를 다루는 것만 선택해주세요.
응답 형식 (유사한 스레드 번호 배열만): [1, 3, 5] 형태로 응답. 유사한 게 없으면 []`;

      const raw = await callGemini(systemPrompt, userPrompt);
      const match = raw.match(/\[[\s\S]*?\]/);
      if (match) {
        const indices: number[] = JSON.parse(match[0]);
        aiFiltered = indices
          .filter(i => i >= 1 && i <= top5.length)
          .map(i => top5[i - 1]);
      }
    } catch {
      // AI 실패 시 cosine similarity 결과 그대로 사용
    }

    return aiFiltered.map(({ thread, similarity, commonKeywords }) => ({
      id: thread.id,
      title: thread.title,
      content: thread.content,
      authorNickname: thread.author.nickname,
      similarity: Math.round(similarity * 100),
      commonKeywords,
      status: (thread as any).status || 'active',
      commentCount: thread._count.comments,
      createdAt: thread.createdAt,
    }));
  },
};
