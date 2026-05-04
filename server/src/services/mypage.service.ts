import { PrismaClient } from '@prisma/client';
import { AppError } from './auth.service';

const prisma = new PrismaClient();

export const mypageService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'NOT_FOUND', '사용자를 찾을 수 없습니다');
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      createdAt: user.createdAt,
    };
  },

  async getMyGroups(userId: string) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      include: {
        group: {
          include: {
            book: true,
            _count: { select: { members: true } },
          },
        },
      },
    });

    return memberships.map((m: typeof memberships[number]) => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      maxMembers: m.group.maxMembers,
      readingStartDate: m.group.readingStartDate,
      readingEndDate: m.group.readingEndDate,
      discussionDate: m.group.discussionDate,
      createdAt: m.group.createdAt,
      memberCount: m.group._count.members,
      role: m.role,
      readingProgress: m.readingProgress,
      joinedAt: m.joinedAt,
      book: {
        id: m.group.book.id,
        title: m.group.book.title,
        author: m.group.book.author,
        coverImageUrl: m.group.book.coverImageUrl,
        summary: m.group.book.summary,
      },
    }));
  },

  async getMyMemos(userId: string) {
    const memos = await prisma.memo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        group: {
          include: {
            book: { select: { id: true, title: true } },
          },
        },
      },
    });

    return memos.map((m: typeof memos[number]) => ({
      id: m.id,
      groupId: m.groupId,
      groupName: m.group.name,
      bookTitle: m.group.book.title,
      pageStart: m.pageStart,
      pageEnd: m.pageEnd,
      content: m.content,
      isPublic: m.isPublic,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  },

  async checkNickname(nickname: string, userId?: string) {
    const existing = await prisma.user.findFirst({
      where: {
        nickname,
        ...(userId ? { NOT: { id: userId } } : {}),
      },
    });
    return { available: !existing };
  },

  async updateNickname(userId: string, nickname: string) {
    const existing = await prisma.user.findFirst({
      where: { nickname, NOT: { id: userId } },
    });
    if (existing) {
      throw new AppError(409, 'DUPLICATE_NICKNAME', '이미 사용 중인 닉네임입니다');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      createdAt: user.createdAt,
    };
  },

  async getMyDiscussions(userId: string) {
    const discussions = await prisma.discussion.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        group: {
          include: {
            book: { select: { id: true, title: true } },
          },
        },
        _count: { select: { comments: true } },
      },
    });

    return discussions.map((d: typeof discussions[number]) => ({
      id: d.id,
      groupId: d.groupId,
      groupName: d.group.name,
      bookTitle: d.group.book.title,
      title: d.title,
      content: d.content,
      isRecommended: d.isRecommended,
      commentCount: d._count.comments,
      createdAt: d.createdAt,
    }));
  },
};
