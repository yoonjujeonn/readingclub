import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { AppError } from './auth.service';

const prisma = new PrismaClient();

const getApiKey = () => process.env.GEMINI_API_KEY || '';
const getModel = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) return '';
  const model = getModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await axios.post(url, {
    system_instruction: { parts: [{ text: '당신은 콘텐츠 적합성 판별 도우미입니다. 반드시 JSON으로만 응답하세요.' }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
  }, { timeout: 15000 });
  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const reportService = {
  async create(reporterId: string, targetType: string, targetId: string, reason: string) {
    // 중복 신고 방지
    const existing = await prisma.report.findFirst({
      where: { reporterId, targetType, targetId, status: 'pending' },
    });
    if (existing) {
      throw new AppError(409, 'ALREADY_REPORTED', '이미 신고한 콘텐츠입니다.');
    }

    // 신고 대상 콘텐츠 가져오기
    let content = '';
    let bookContext = '';
    if (targetType === 'discussion') {
      const d = await prisma.discussion.findUnique({
        where: { id: targetId },
        include: { group: { include: { book: { select: { title: true, author: true, summary: true } } } } },
      });
      if (!d) throw new AppError(404, 'NOT_FOUND', '신고 대상을 찾을 수 없습니다.');
      content = `제목: ${d.title}\n내용: ${d.content || ''}`;
      bookContext = `이 모임의 책: "${d.group.book.title}" (${d.group.book.author || '미상'})\n줄거리: ${d.group.book.summary || '없음'}`;
    } else if (targetType === 'comment') {
      const c = await prisma.comment.findUnique({ where: { id: targetId } });
      if (!c) throw new AppError(404, 'NOT_FOUND', '신고 대상을 찾을 수 없습니다.');
      content = c.content;
    } else if (targetType === 'reply') {
      const r = await prisma.reply.findUnique({ where: { id: targetId } });
      if (!r) throw new AppError(404, 'NOT_FOUND', '신고 대상을 찾을 수 없습니다.');
      content = r.content;
    } else if (targetType === 'memo') {
      const m = await prisma.memo.findUnique({ where: { id: targetId } });
      if (!m) throw new AppError(404, 'NOT_FOUND', '신고 대상을 찾을 수 없습니다.');
      content = m.content;
    } else {
      throw new AppError(400, 'INVALID_TARGET', '잘못된 신고 대상입니다.');
    }

    // AI 판별
    let aiResult = '';
    try {
      const prompt = `다음 콘텐츠가 부적절한지 판별해주세요.
신고 사유: ${reason}
${bookContext ? `\n${bookContext}\n` : ''}
콘텐츠:
${content}

판별 기준:
- 욕설, 비방, 혐오 표현이 포함된 경우 → 부적절
- 스팸, 광고성 콘텐츠인 경우 → 부적절
${bookContext ? '- 해당 모임의 책과 전혀 무관한 내용인 경우 → 부적절' : ''}

다음 JSON 형식으로 응답:
{"inappropriate": true/false, "reason": "판별 이유", "category": "profanity/harassment/off_topic/spam/none"}`;

      const raw = await callGemini(prompt);
      aiResult = raw;
    } catch {
      aiResult = '{"inappropriate": false, "reason": "AI 판별 실패", "category": "none"}';
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType,
        targetId,
        reason,
        status: 'reviewed',
        aiResult,
      },
    });

    // AI가 부적절하다고 판별하면 자동 삭제
    let deleted = false;
    try {
      const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.inappropriate === true) {
          if (targetType === 'discussion') {
            // 스레드 삭제 (연관 데이터 모두 삭제, 트랜잭션)
            await prisma.$transaction(async (tx) => {
              await tx.reply.deleteMany({ where: { comment: { discussionId: targetId } } });
              await tx.comment.deleteMany({ where: { discussionId: targetId } });
              // 토큰 등 추가 연관 테이블 삭제
              try { await (tx as any).discussionToken.deleteMany({ where: { discussionId: targetId } }); } catch {}
              await tx.discussion.delete({ where: { id: targetId } });
            });
          } else if (targetType === 'comment') {
            await prisma.reply.deleteMany({ where: { commentId: targetId } });
            await prisma.comment.delete({ where: { id: targetId } });
          } else if (targetType === 'reply') {
            await prisma.reply.delete({ where: { id: targetId } });
          } else if (targetType === 'memo') {
            await prisma.memo.delete({ where: { id: targetId } });
          }
          deleted = true;
          await prisma.report.update({ where: { id: report.id }, data: { status: 'deleted' } });
        }
      }
    } catch {
      // 삭제 실패해도 신고는 유지
    }

    return { id: report.id, aiResult, deleted };
  },
};
