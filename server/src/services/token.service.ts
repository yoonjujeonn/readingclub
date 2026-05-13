import { PrismaClient } from '@prisma/client';
import { AppError } from './auth.service';

const prisma = new PrismaClient();
const DEFAULT_TOKENS = 10;

export const tokenService = {
  // 발언권 조회 (없으면 자동 생성)
  async getOrCreate(discussionId: string, userId: string) {
    let token = await prisma.discussionToken.findUnique({
      where: { discussionId_userId: { discussionId, userId } },
    });
    if (!token) {
      token = await prisma.discussionToken.create({
        data: { discussionId, userId, remaining: DEFAULT_TOKENS },
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
    return prisma.discussionToken.update({
      where: { discussionId_userId: { discussionId, userId } },
      data: { requested: true },
    });
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
    return prisma.discussionToken.update({
      where: { discussionId_userId: { discussionId, userId: targetUserId } },
      data: { remaining: token.remaining + amount, requested: false },
    });
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
};
