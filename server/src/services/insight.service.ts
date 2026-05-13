import { PrismaClient } from '@prisma/client';
import { AppError } from './auth.service';
import axios from 'axios';

const prisma = new PrismaClient();

const getApiKey = () => process.env.GEMINI_API_KEY || '';
const getModel = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new AppError(500, 'AI_NOT_CONFIGURED', 'Gemini API 키가 설정되지 않았습니다');

  const model = getModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await axios.post(url, {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  }, { timeout: 30000 });

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const insightService = {
  // 인사이트 생성 및 저장
  async generate(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        book: true,
        members: { include: { user: { select: { id: true, nickname: true } } } },
      },
    });
    if (!group) throw new AppError(404, 'NOT_FOUND', '모임을 찾을 수 없습니다');

    // 멤버 확인
    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) throw new AppError(403, 'FORBIDDEN', '모임 참여자만 인사이트를 생성할 수 있습니다');

    // 데이터 수집
    const [memos, discussions, comments] = await Promise.all([
      prisma.memo.findMany({
        where: { groupId, userId },
        orderBy: { pageStart: 'asc' },
        select: { content: true, pageStart: true, pageEnd: true },
      }),
      prisma.discussion.findMany({
        where: { groupId },
        include: {
          author: { select: { nickname: true } },
          comments: {
            include: {
              author: { select: { id: true, nickname: true } },
              replies: { include: { author: { select: { id: true, nickname: true } } } },
            },
          },
        },
      }),
      prisma.comment.count({ where: { discussion: { groupId }, authorId: userId } }),
    ]);

    // 참여 통계
    const myMemoCount = memos.length;
    const totalDiscussions = discussions.length;
    const myCommentCount = comments;
    const participantStats: Record<string, { memos: number; comments: number; replies: number }> = {};

    for (const member of group.members) {
      participantStats[member.user.nickname] = { memos: 0, comments: 0, replies: 0 };
    }

    // 각 참여자별 통계 계산
    const allMemos = await prisma.memo.findMany({
      where: { groupId },
      select: { userId: true },
    });
    for (const m of allMemos) {
      const member = group.members.find(mem => mem.userId === m.userId);
      if (member && participantStats[member.user.nickname]) {
        participantStats[member.user.nickname].memos++;
      }
    }
    for (const d of discussions) {
      for (const c of d.comments) {
        const nick = c.author.nickname;
        if (participantStats[nick]) participantStats[nick].comments++;
        for (const r of c.replies) {
          const rNick = r.author.nickname;
          if (participantStats[rNick]) participantStats[rNick].replies++;
        }
      }
    }

    // AI 요약 생성
    const memoText = memos.length > 0
      ? memos.map(m => `[p.${m.pageStart}-${m.pageEnd}] ${m.content.slice(0, 300)}`).join('\n')
      : '(작성한 메모 없음)';

    const discussionText = discussions.map(d => {
      const thread = [`주제: ${d.title}`];
      for (const c of d.comments.slice(0, 10)) {
        thread.push(`  ${c.author.nickname}: ${c.content.slice(0, 100)}`);
      }
      return thread.join('\n');
    }).join('\n\n') || '(토론 없음)';

    const systemPrompt = `당신은 독서 모임 인사이트 정리 도우미입니다. 참여자들이 책을 읽고 자유롭게 이야기를 나눈 스레드 내용을 바탕으로 인사이트를 정리해주세요. 반드시 JSON 형식으로만 응답하세요.`;
    const userPrompt = `책: ${group.book.title} (${group.book.author || '미상'})
독서 기간: ${group.readingStartDate.toISOString().slice(0, 10)} ~ ${group.readingEndDate.toISOString().slice(0, 10)}

내 메모:
${memoText}

스레드 대화 내용:
${discussionText}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "전체 활동 및 대화 요약 (3-5문장)",
  "keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3", "핵심키워드4", "핵심키워드5"],
  "highlights": ["인상 깊었던 포인트1", "인상 깊었던 포인트2", "인상 깊었던 포인트3"],
  "takeaway": "이 독서를 통해 얻은 핵심 한 줄 메시지"
}`;

    let summary = '';
    let keywords: string[] = [];
    let highlights: string[] = [];
    let takeaway = '';

    try {
      const raw = await callGemini(systemPrompt, userPrompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || '';
        keywords = parsed.keywords || [];
        highlights = parsed.highlights || [];
        takeaway = parsed.takeaway || '';
      } else {
        summary = raw;
      }
    } catch (err: any) {
      console.error('[Insight AI error]', err?.response?.data || err?.message || err);
      summary = '인사이트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }

    // DB에 저장 (upsert)
    const insight = await prisma.discussionInsight.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: {
        summary: JSON.stringify({ summary, highlights, takeaway }),
        keywords: JSON.stringify(keywords),
        participantStats: JSON.stringify(participantStats),
        memoCount: myMemoCount,
        discussionCount: totalDiscussions,
        commentCount: myCommentCount,
      },
      create: {
        groupId,
        userId,
        summary: JSON.stringify({ summary, highlights, takeaway }),
        keywords: JSON.stringify(keywords),
        participantStats: JSON.stringify(participantStats),
        memoCount: myMemoCount,
        discussionCount: totalDiscussions,
        commentCount: myCommentCount,
      },
    });

    return {
      id: insight.id,
      groupId: insight.groupId,
      bookTitle: group.book.title,
      bookAuthor: group.book.author,
      summary,
      keywords,
      highlights,
      takeaway,
      participantStats,
      memoCount: myMemoCount,
      discussionCount: totalDiscussions,
      commentCount: myCommentCount,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    };
  },

  // 저장된 인사이트 조회
  async getByGroup(groupId: string, userId: string) {
    const insight = await prisma.discussionInsight.findUnique({
      where: { groupId_userId: { groupId, userId } },
      include: {
        group: { include: { book: { select: { title: true, author: true, coverImageUrl: true } } } },
      },
    });

    if (!insight) return null;

    return {
      id: insight.id,
      groupId: insight.groupId,
      bookTitle: insight.group.book.title,
      bookAuthor: insight.group.book.author,
      bookCoverUrl: insight.group.book.coverImageUrl,
      ...JSON.parse(insight.summary),
      keywords: JSON.parse(insight.keywords),
      participantStats: JSON.parse(insight.participantStats),
      memoCount: insight.memoCount,
      discussionCount: insight.discussionCount,
      commentCount: insight.commentCount,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    };
  },

  // 내 모든 인사이트 조회
  async getMyInsights(userId: string) {
    const insights = await prisma.discussionInsight.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        group: { include: { book: { select: { title: true, author: true, coverImageUrl: true } } } },
      },
    });

    return insights.map(i => ({
      id: i.id,
      groupId: i.groupId,
      bookTitle: i.group.book.title,
      bookAuthor: i.group.book.author,
      bookCoverUrl: i.group.book.coverImageUrl,
      ...JSON.parse(i.summary),
      keywords: JSON.parse(i.keywords),
      memoCount: i.memoCount,
      discussionCount: i.discussionCount,
      commentCount: i.commentCount,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
  },
};


// 스레드 종료 시 자동 인사이트 생성 (모임의 모든 멤버에 대해)
export async function generateInsightOnThreadClose(discussionId: string) {
  try {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: {
        group: {
          include: {
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!discussion) return;

    // 모임의 모든 멤버에 대해 인사이트 생성
    for (const member of discussion.group.members) {
      try {
        await insightService.generate(discussion.groupId, member.userId);
      } catch {
        // 개별 멤버 실패해도 계속 진행
        console.error(`[Insight] 멤버 ${member.userId} 인사이트 생성 실패`);
      }
    }
  } catch (err) {
    console.error('[Insight] 스레드 종료 인사이트 생성 실패:', err);
  }
}
