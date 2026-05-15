import { PrismaClient } from '@prisma/client';
import { AppError } from './auth.service';

const prisma = new PrismaClient();

export const tokenService = {
  // 발언권 조회 (없으면 등급 기반으로 자동 생성)
  async getOrCreate(discussionId: string, userId: string) {
    let token = await prisma.discussionToken.findUnique({
      where: { discussionId_userId: { discussionId, userId } },
    });
    if (!token) {
      const { activityService } = await import('./activity.service');
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { activityScore: true } });
      const defaultTokens = activityService.getDefaultTokens(user?.activityScore || 0);
      token = await prisma.discussionToken.create({
        data: { discussionId, userId, remaining: defaultTokens },
      });
    }
    return token;
  },

  // 발언권 차감 (의견/댓글 작성 시 호출)
  async consume(discussionId: string, userId: string) {
    // 모임장은 발언권 제한 없음
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (discussion) {
      const group = await prisma.group.findUnique({ where: { id: discussion.groupId } });
      if (group && group.ownerId === userId) return; // 모임장은 차감 안 함
    }

    const token = await this.getOrCreate(discussionId, userId);
    if (token.remaining <= 0) {
      throw new AppError(403, 'NO_TOKENS', '발언권이 부족합니다. 모임장에게 추가 요청하세요.');
    }
    return prisma.discussionToken.update({
      where: { discussionId_userId: { discussionId, userId } },
      data: { remaining: token.remaining - 1 },
    });
  },

  // 발언권 추가 요청 (참여자 → 모임장)
  async requestTokens(discussionId: string, userId: string) {
    const token = await this.getOrCreate(discussionId, userId);
    if (token.requested) {
      throw new AppError(409, 'ALREADY_REQUESTED', '이미 발언권을 요청했습니다.');
    }
    const updated = await prisma.discussionToken.update({
      where: { discussionId_userId: { discussionId, userId } },
      data: { requested: true },
    });

    // 모임장에게 알림 전송
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: { group: { select: { id: true, name: true, ownerId: true } } },
    });
    if (discussion) {
      const requester = await prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } });
      await prisma.notification.create({
        data: {
          userId: discussion.group.ownerId,
          groupId: discussion.groupId,
          discussionId,
          type: 'token_requested',
          message: `[${discussion.title}]에서 ${requester?.nickname || '참여자'}님이 발언권을 요청했습니다`,
          linkUrl: `/groups/${discussion.groupId}/dashboard#tokenRequests`,
          dedupeKey: `token-request:${discussionId}:${userId}:${Date.now()}`,
        },
      }).catch(() => {}); // 중복 시 무시
    }

    return updated;
  },

  // 발언권 지급 (모임장)
  async grantTokens(discussionId: string, targetUserId: string, amount: number, ownerId: string) {
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new AppError(404, 'NOT_FOUND', '스레드를 찾을 수 없습니다');

    const group = await prisma.group.findUnique({ where: { id: discussion.groupId } });
    if (!group || group.ownerId !== ownerId) {
      throw new AppError(403, 'FORBIDDEN', '방장만 발언권을 지급할 수 있습니다');
    }

    const token = await this.getOrCreate(discussionId, targetUserId);
    const updated = await prisma.discussionToken.update({
      where: { discussionId_userId: { discussionId, userId: targetUserId } },
      data: { remaining: token.remaining + amount, requested: false },
    });

    // 지급받은 유저에게 알림 전송
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        groupId: discussion.groupId,
        discussionId,
        type: 'token_granted',
        message: `[${discussion.title}]에서 발언권 ${amount}개가 지급되었습니다`,
        linkUrl: `/discussions/${discussionId}`,
        dedupeKey: `token-grant:${discussionId}:${targetUserId}:${Date.now()}`,
      },
    }).catch(() => {});

    return updated;
  },

  // 스레드의 발언권 요청 목록 조회 (모임장용)
  async listRequests(discussionId: string, ownerId: string) {
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new AppError(404, 'NOT_FOUND', '스레드를 찾을 수 없습니다');

    const group = await prisma.group.findUnique({ where: { id: discussion.groupId } });
    if (!group || group.ownerId !== ownerId) {
      throw new AppError(403, 'FORBIDDEN', '방장만 요청 목록을 조회할 수 있습니다');
    }

    return prisma.discussionToken.findMany({
      where: { discussionId, requested: true },
      include: { user: { select: { id: true, nickname: true } } },
    });
  },

  // 그룹 전체에서 발언권 요청이 있는 스레드 목록 (모임장용)
  async listRequestedThreads(groupId: string, ownerId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.ownerId !== ownerId) {
      throw new AppError(403, 'FORBIDDEN', '방장만 조회할 수 있습니다');
    }

    const tokens = await prisma.discussionToken.findMany({
      where: {
        requested: true,
        discussion: { groupId },
      },
      include: {
        user: { select: { id: true, nickname: true } },
        discussion: { select: { id: true, title: true, status: true } },
      },
    });

    // 스레드별로 그룹핑
    const grouped: Record<string, { discussion: any; requests: any[] }> = {};
    for (const t of tokens) {
      if (!grouped[t.discussionId]) {
        grouped[t.discussionId] = { discussion: t.discussion, requests: [] };
      }
      grouped[t.discussionId].requests.push({ id: t.id, userId: t.userId, nickname: t.user.nickname, remaining: t.remaining });
    }

    return Object.values(grouped);
  },
};
