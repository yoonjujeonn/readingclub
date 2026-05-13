import { PrismaClient } from '@prisma/client';
import { AppError } from './auth.service';
import { CreateDiscussionInput, CreateCommentInput } from '../validators';
import { tokenService } from './token.service';
import { generateInsightOnThreadClose } from './insight.service';

const prisma = new PrismaClient();

export interface RecommendedTopic {
  title: string;
  content: string;
  keywords: string[];
  memoIds: string[];
}

export const discussionService = {
  async createTopic(groupId: string, userId: string, data: CreateDiscussionInput) {
    // Verify user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'FORBIDDEN', '모임 참여자만 토론 주제를 생성할 수 있습니다');
    }

    // 일일 생성 횟수 제한 (모임별 3회, KST 기준)
    const todayCount = await this.getTodayCreateCount(groupId, userId);
    if (todayCount >= 3) {
      throw new AppError(429, 'DAILY_LIMIT_EXCEEDED', '오늘 생성 가능한 횟수를 초과했습니다. 내일 다시 시도해 주세요.');
    }

    // If memoId is provided, verify it exists and belongs to this group
    if (data.memoId) {
      const memo = await prisma.memo.findUnique({ where: { id: data.memoId } });
      if (!memo) {
        throw new AppError(404, 'NOT_FOUND', '참조할 메모를 찾을 수 없습니다');
      }
      if (memo.groupId !== groupId) {
        throw new AppError(400, 'VALIDATION_ERROR', '해당 모임의 메모만 참조할 수 있습니다');
      }
    }

    const discussion = await prisma.discussion.create({
      data: {
        groupId,
        authorId: userId,
        memoId: data.memoId ?? null,
        title: data.title,
        content: data.content ?? null,
        isRecommended: false,
        status: 'active',
        endDate: data.endDate ? (() => { const d = new Date(data.endDate); d.setHours(23, 59, 59, 999); return d; })() : null,
      },
      include: {
        author: { select: { id: true, nickname: true } },
        memo: true,
      },
    });

    return discussion;
  },

  async getById(discussionId: string) {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: {
        author: { select: { id: true, nickname: true } },
        memo: { select: { id: true, content: true, pageStart: true, pageEnd: true } },
      },
    });
    if (!discussion) {
      throw new AppError(404, 'NOT_FOUND', '토론 주제를 찾을 수 없습니다');
    }
    return {
      ...discussion,
      authorNickname: discussion.author.nickname,
    };
  },

  async listTopics(groupId: string, filter?: { authorId?: string; status?: string }) {
    // 종료일 지난 active 스레드를 자동 종료 처리
    const closedThreads = await prisma.discussion.findMany({
      where: {
        groupId,
        status: 'active',
        endDate: { not: null, lt: new Date() },
      },
      select: { id: true },
    });

    if (closedThreads.length > 0) {
      await prisma.discussion.updateMany({
        where: {
          id: { in: closedThreads.map(t => t.id) },
        },
        data: { status: 'closed' },
      });

      // 종료된 스레드에 대해 비동기로 인사이트 생성 (응답 차단 안 함)
      for (const thread of closedThreads) {
        generateInsightOnThreadClose(thread.id).catch(() => {});
      }
    }

    const where: any = { groupId };
    if (filter?.authorId) {
      where.authorId = filter.authorId;
    }
    if (filter?.status) {
      where.status = filter.status;
    }

    const discussions = await prisma.discussion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, nickname: true } },
        memo: { select: { id: true, content: true, pageStart: true, pageEnd: true } },
        _count: { select: { comments: true } },
      },
    });

    return discussions.map((d: typeof discussions[number]) => ({
      id: d.id,
      groupId: d.groupId,
      authorId: d.authorId,
      memoId: d.memoId,
      title: d.title,
      content: d.content,
      isRecommended: d.isRecommended,
      isPinned: (d as any).isPinned,
      status: (d as any).status,
      endDate: (d as any).endDate,
      createdAt: d.createdAt,
      author: d.author,
      memo: d.memo,
      commentCount: d._count.comments,
    }));
  },

  async addComment(discussionId: string, userId: string, content: string) {
    // Verify discussion exists
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    });
    if (!discussion) {
      throw new AppError(404, 'NOT_FOUND', '토론 주제를 찾을 수 없습니다');
    }

    // 종료된 스레드에는 의견 작성 불가
    if (discussion.status === 'closed') {
      throw new AppError(403, 'THREAD_CLOSED', '종료된 스레드에는 의견을 작성할 수 없습니다');
    }

    // 발언권 차감
    await tokenService.consume(discussionId, userId);

    // Verify user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: discussion.groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'FORBIDDEN', '모임 참여자만 의견을 작성할 수 있습니다');
    }

    const comment = await prisma.comment.create({
      data: {
        discussionId,
        authorId: userId,
        content,
      },
      include: {
        author: { select: { id: true, nickname: true } },
      },
    });

    return comment;
  },

  async addReply(commentId: string, userId: string, content: string) {
    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { discussion: true },
    });
    if (!comment) {
      throw new AppError(404, 'NOT_FOUND', '의견을 찾을 수 없습니다');
    }

    // 종료된 스레드에는 댓글 작성 불가
    if (comment.discussion && comment.discussion.status === 'closed') {
      throw new AppError(403, 'THREAD_CLOSED', '종료된 스레드에는 댓글을 작성할 수 없습니다');
    }

    // 발언권 차감
    if (comment.discussion) {
      await tokenService.consume(comment.discussion.id, userId);
    }

    // Verify user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: comment.discussion.groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'FORBIDDEN', '모임 참여자만 댓글을 작성할 수 있습니다');
    }

    const reply = await prisma.reply.create({
      data: {
        commentId,
        authorId: userId,
        content,
      },
      include: {
        author: { select: { id: true, nickname: true } },
      },
    });

    return reply;
  },

  async getComments(discussionId: string) {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    });
    if (!discussion) {
      throw new AppError(404, 'NOT_FOUND', '토론 주제를 찾을 수 없습니다');
    }

    const comments = await prisma.comment.findMany({
      where: { discussionId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, nickname: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, nickname: true } },
          },
        },
      },
    });

    return comments;
  },

  async getRecommendations(groupId: string): Promise<RecommendedTopic[]> {
    // Fetch public memos in this group
    const publicMemos = await prisma.memo.findMany({
      where: { groupId, isPublic: true },
      select: { id: true, content: true },
    });

    // Require at least 2 public memos for recommendations
    if (publicMemos.length < 2) {
      return [];
    }

    // Simple keyword-based recommendation engine
    // Extract keywords from memo contents and generate topic candidates
    const keywordMap = new Map<string, { count: number; memoIds: string[] }>();

    for (const memo of publicMemos) {
      const words = extractKeywords(memo.content);
      for (const word of words) {
        const entry = keywordMap.get(word) || { count: 0, memoIds: [] };
        entry.count++;
        if (!entry.memoIds.includes(memo.id)) {
          entry.memoIds.push(memo.id);
        }
        keywordMap.set(word, entry);
      }
    }

    // Find keywords that appear in multiple memos
    const sharedKeywords = Array.from(keywordMap.entries())
      .filter(([, v]) => v.memoIds.length >= 2)
      .sort((a, b) => b[1].count - a[1].count);

    const recommendations: RecommendedTopic[] = [];

    if (sharedKeywords.length > 0) {
      // Generate topics from shared keywords (up to 3)
      const topKeywords = sharedKeywords.slice(0, 3);
      for (const [keyword, data] of topKeywords) {
        recommendations.push({
          title: `'${keyword}'에 대한 토론`,
          content: `여러 참여자가 '${keyword}'에 대해 메모를 남겼습니다. 이 주제에 대해 토론해보세요.`,
          keywords: [keyword],
          memoIds: data.memoIds,
        });
      }
    } else {
      // Fallback: generate a general topic from all public memos
      recommendations.push({
        title: '공유된 메모 기반 토론',
        content: '참여자들이 공유한 메모를 바탕으로 자유롭게 토론해보세요.',
        keywords: [],
        memoIds: publicMemos.map((m: { id: string; content: string }) => m.id),
      });
    }

    return recommendations;
  },

  async createFromRecommendation(groupId: string, userId: string, recommendation: RecommendedTopic) {
    // Verify user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'FORBIDDEN', '모임 참여자만 토론 주제를 생성할 수 있습니다');
    }

    const discussion = await prisma.discussion.create({
      data: {
        groupId,
        authorId: userId,
        title: recommendation.title,
        content: recommendation.content,
        isRecommended: true,
        memoId: recommendation.memoIds.length > 0 ? recommendation.memoIds[0] : null,
      },
      include: {
        author: { select: { id: true, nickname: true } },
        memo: true,
      },
    });

    return discussion;
  },

  // 종료일 수정 (방장) — 종료된 스레드를 다시 진행중으로 바꿀 수 있음
  async updateEndDate(discussionId: string, userId: string, endDate: string) {
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new AppError(404, 'NOT_FOUND', '스레드를 찾을 수 없습니다');

    const group = await prisma.group.findUnique({ where: { id: discussion.groupId } });
    if (!group || group.ownerId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '방장만 종료일을 수정할 수 있습니다');
    }

    const newEndDate = new Date(endDate);
    newEndDate.setHours(23, 59, 59, 999);
    const newStatus = newEndDate >= new Date() ? 'active' : 'closed';

    const updated = await prisma.discussion.update({
      where: { id: discussionId },
      data: { endDate: newEndDate, status: newStatus },
    });

    // 종료로 변경된 경우 인사이트 자동 생성
    if (newStatus === 'closed') {
      generateInsightOnThreadClose(discussionId).catch(() => {});
    }

    return updated;
  },

  // 대표 스레드 설정 (방장, 최대 3개)
  async pinThread(discussionId: string, userId: string) {
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new AppError(404, 'NOT_FOUND', '스레드를 찾을 수 없습니다');

    const group = await prisma.group.findUnique({ where: { id: discussion.groupId } });
    if (!group || group.ownerId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '방장만 대표 스레드를 설정할 수 있습니다');
    }

    // 최대 3개 확인
    const pinnedCount = await prisma.discussion.count({
      where: { groupId: discussion.groupId, isPinned: true },
    });
    if (pinnedCount >= 3) {
      throw new AppError(400, 'PIN_LIMIT', '대표 스레드는 최대 3개까지 설정할 수 있습니다');
    }

    return prisma.discussion.update({
      where: { id: discussionId },
      data: { isPinned: true },
    });
  },

  // 대표 스레드 해제 (방장)
  async unpinThread(discussionId: string, userId: string) {
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new AppError(404, 'NOT_FOUND', '스레드를 찾을 수 없습니다');

    const group = await prisma.group.findUnique({ where: { id: discussion.groupId } });
    if (!group || group.ownerId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '방장만 대표 스레드를 해제할 수 있습니다');
    }

    return prisma.discussion.update({
      where: { id: discussionId },
      data: { isPinned: false },
    });
  },

  // KST 기준 오늘 시작 시각 계산
  _getTodayStartKST(): Date {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const kstToday = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
    return new Date(kstToday.getTime() - kstOffset);
  },

  // 오늘 해당 모임에서 사용자가 생성한 스레드 수
  async getTodayCreateCount(groupId: string, userId: string): Promise<number> {
    const todayStart = this._getTodayStartKST();
    return prisma.discussion.count({
      where: {
        groupId,
        authorId: userId,
        createdAt: { gte: todayStart },
      },
    });
  },

  // 남은 생성 횟수 조회
  async getRemainingCount(groupId: string, userId: string): Promise<{ used: number; remaining: number; limit: number }> {
    const used = await this.getTodayCreateCount(groupId, userId);
    return { used, remaining: Math.max(0, 3 - used), limit: 3 };
  },
};

function extractKeywords(text: string): string[] {
  // Simple Korean/English keyword extraction
  // Remove common particles and short words, keep meaningful terms
  const words = text
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .map(w => w.toLowerCase());

  // Remove very common Korean particles/suffixes
  const stopWords = new Set([
    '이', '가', '은', '는', '을', '를', '의', '에', '에서', '로', '으로',
    '와', '과', '도', '만', '까지', '부터', '에게', '한테', '께',
    '하다', '되다', '있다', '없다', '이다', '아니다',
    '그', '이', '저', '것', '수', '등', '때', '더', '또',
    'the', 'is', 'at', 'in', 'on', 'and', 'or', 'to', 'of', 'for', 'a', 'an',
  ]);

  return words.filter(w => !stopWords.has(w));
}
