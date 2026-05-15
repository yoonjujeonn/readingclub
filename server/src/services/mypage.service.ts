import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from './auth.service';
import { profanityService } from './profanity.service';

const prisma = new PrismaClient();

export const mypageService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'NOT_FOUND', '사용자를 찾을 수 없습니다');
    const { activityService } = await import('./activity.service');
    const grade = activityService.getGrade(user.activityScore);
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      provider: user.provider,
      activityScore: user.activityScore,
      grade: { name: grade.name, emoji: grade.emoji },
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
    // 닉네임 욕설 필터링
    const check = profanityService.check(nickname);
    if (!check.isClean) {
      throw new AppError(400, 'PROFANITY_DETECTED', '부적절한 표현이 포함되어 있습니다. 수정 후 다시 시도해주세요.');
    }

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

  async getRecommendedGroups(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 내가 참여한 모임의 책 정보 가져오기
    const myMemberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const myGroupIds = myMemberships.map(m => m.groupId);

    if (myGroupIds.length === 0) return [];

    const myGroups = await prisma.group.findMany({
      where: { id: { in: myGroupIds } },
      include: { book: true },
    });

    // 내 책들에서 키워드 추출
    const myKeywords = new Set<string>();
    for (const g of myGroups) {
      extractWords(g.book.title).forEach(w => myKeywords.add(w));
      if (g.book.author) extractWords(g.book.author).forEach(w => myKeywords.add(w));
      if (g.book.summary) extractWords(g.book.summary).forEach(w => myKeywords.add(w));
    }

    // 내가 참여하지 않은 모임 중 아직 인원이 안 찬 모임
    const candidateGroups = await prisma.group.findMany({
      where: {
        id: { notIn: myGroupIds },
        readingEndDate: { gte: todayStart },
      },
      include: {
        book: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 유사도 점수 계산
    const scored = candidateGroups.map(g => {
      const groupWords = new Set<string>();
      extractWords(g.book.title).forEach(w => groupWords.add(w));
      if (g.book.author) extractWords(g.book.author).forEach(w => groupWords.add(w));
      if (g.book.summary) extractWords(g.book.summary).forEach(w => groupWords.add(w));
      if (g.description) extractWords(g.description).forEach(w => groupWords.add(w));

      // 교집합 크기 = 유사도 점수
      let score = 0;
      for (const word of groupWords) {
        if (myKeywords.has(word)) score++;
      }

      return { group: g, score };
    });

    // 점수 높은 순 정렬, 상위 5개
    scored.sort((a, b) => b.score - a.score);
    const top = scored.filter(s => s.score > 0).slice(0, 5);

    // 유사도 매칭이 부족하면 최신 모임으로 채우기
    if (top.length < 3) {
      const remaining = scored.filter(s => s.score === 0).slice(0, 3 - top.length);
      top.push(...remaining);
    }

    return top.map(({ group: g, score }) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      maxMembers: g.maxMembers,
      currentMembers: g._count.members,
      readingStartDate: g.readingStartDate,
      readingEndDate: g.readingEndDate,
      discussionDate: g.discussionDate,
      score,
      book: {
        id: g.book.id,
        title: g.book.title,
        author: g.book.author,
        coverImageUrl: g.book.coverImageUrl,
      },
    }));
  },

  async updateProfileImage(userId: string, profileImageUrl: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: profileImageUrl || null },
    });
    return { id: user.id, email: user.email, nickname: user.nickname, profileImageUrl: user.profileImageUrl, createdAt: user.createdAt };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'NOT_FOUND', '사용자를 찾을 수 없습니다');
    if (!user.passwordHash) throw new AppError(400, 'SOCIAL_ACCOUNT', '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError(401, 'INVALID_CREDENTIALS', '현재 비밀번호가 올바르지 않습니다');

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  },

  async softDeleteAccount(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'NOT_FOUND', '사용자를 찾을 수 없습니다');

    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        nickname: `탈퇴한사용자_${userId.slice(0, 8)}`,
        email: `deleted_${userId}@deleted.local`,
      },
    });
  },
};

function extractWords(text: string): string[] {
  return text
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .map(w => w.toLowerCase());
}
