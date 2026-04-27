import { PrismaClient } from '@prisma/client';
import { AppError } from './auth.service';
import { CreateMemoInput, UpdateMemoInput } from '../validators';

const prisma = new PrismaClient();

export const memoService = {
  async create(groupId: string, userId: string, data: CreateMemoInput) {
    // Verify user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'FORBIDDEN', '모임 참여자만 메모를 작성할 수 있습니다');
    }

    if (data.pageEnd > member.readingProgress) {
      throw new AppError(400, 'INVALID_PAGE_RANGE', `아직 읽지 않은 페이지입니다. 현재 읽은 페이지: ${member.readingProgress}`);
    }

    const memo = await prisma.memo.create({
      data: {
        groupId,
        userId,
        pageStart: data.pageStart,
        pageEnd: data.pageEnd,
        content: data.content,
        isPublic: data.isPublic ?? false,
      },
      include: {
        user: { select: { id: true, nickname: true } },
      },
    });

    return memo;
  },

  async update(memoId: string, userId: string, data: UpdateMemoInput) {
    const memo = await prisma.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new AppError(404, 'NOT_FOUND', '메모를 찾을 수 없습니다');
    }
    if (memo.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '본인의 메모만 수정할 수 있습니다');
    }

    const updated = await prisma.memo.update({
      where: { id: memoId },
      data: {
        ...(data.pageStart !== undefined && { pageStart: data.pageStart }),
        ...(data.pageEnd !== undefined && { pageEnd: data.pageEnd }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
      include: {
        user: { select: { id: true, nickname: true } },
      },
    });

    return updated;
  },

  async delete(memoId: string, userId: string) {
    const memo = await prisma.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new AppError(404, 'NOT_FOUND', '메모를 찾을 수 없습니다');
    }
    if (memo.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '본인의 메모만 삭제할 수 있습니다');
    }

    await prisma.memo.delete({ where: { id: memoId } });
  },

  async updateVisibility(memoId: string, userId: string, isPublic: boolean) {
    const memo = await prisma.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new AppError(404, 'NOT_FOUND', '메모를 찾을 수 없습니다');
    }
    if (memo.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '본인의 메모만 공개 여부를 변경할 수 있습니다');
    }

    const updated = await prisma.memo.update({
      where: { id: memoId },
      data: { isPublic },
      include: {
        user: { select: { id: true, nickname: true } },
      },
    });

    return updated;
  },

  async listByGroup(groupId: string, userId: string) {
    // Get user's reading progress in this group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'FORBIDDEN', '모임 참여자만 메모를 조회할 수 있습니다');
    }

    const readingProgress = member.readingProgress;

    // Fetch all memos: own memos (all) + others' public memos only
    const memos = await prisma.memo.findMany({
      where: {
        groupId,
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, nickname: true } },
      },
    });

    // Apply reading progress-based content visibility
    const result = memos.map((memo: typeof memos[number]) => {
      const isOwn = memo.userId === userId;
      // For own memos, always show full content
      // For others' memos, hide content if user hasn't read up to page_end
      const canView = isOwn || memo.pageEnd <= readingProgress;

      return {
        id: memo.id,
        groupId: memo.groupId,
        userId: memo.userId,
        pageStart: memo.pageStart,
        pageEnd: memo.pageEnd,
        content: canView ? memo.content : null,
        isPublic: memo.isPublic,
        createdAt: memo.createdAt,
        updatedAt: memo.updatedAt,
        isOwn,
        canView,
        user: memo.user,
      };
    });

    return result;
  },
};
