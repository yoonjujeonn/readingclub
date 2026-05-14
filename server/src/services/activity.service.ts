import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ActivityType = 'memo' | 'thread' | 'comment' | 'reply' | 'join';

export interface Grade {
  name: string;
  emoji: string;
  minScore: number;
  defaultTokens: number;
}

const GRADES: Grade[] = [
  { name: '마스터', emoji: '⭐', minScore: 100, defaultTokens: 20 },
  { name: '전문가', emoji: '💬', minScore: 50, defaultTokens: 16 },
  { name: '독서가', emoji: '📖', minScore: 20, defaultTokens: 13 },
  { name: '새싹', emoji: '🌱', minScore: 0, defaultTokens: 10 },
];

export const activityService = {
  // 등급 계산
  getGrade(score: number): Grade {
    return GRADES.find(g => score >= g.minScore) || GRADES[GRADES.length - 1];
  },

  // 등급별 기본 발언권 수
  getDefaultTokens(score: number): number {
    return this.getGrade(score).defaultTokens;
  },

  // 오늘 해당 활동으로 이미 포인트를 받았는지 확인
  async hasEarnedToday(userId: string, type: ActivityType): Promise<boolean> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 각 활동 타입별로 오늘 생성된 것이 있는지 확인
    switch (type) {
      case 'memo':
        return (await prisma.memo.count({ where: { userId, createdAt: { gte: todayStart } } })) > 1;
      case 'thread':
        return (await prisma.discussion.count({ where: { authorId: userId, createdAt: { gte: todayStart } } })) > 1;
      case 'comment':
        return (await prisma.comment.count({ where: { authorId: userId, createdAt: { gte: todayStart } } })) > 1;
      case 'reply':
        return (await prisma.reply.count({ where: { authorId: userId, createdAt: { gte: todayStart } } })) > 1;
      case 'join':
        return (await prisma.groupMember.count({ where: { userId, joinedAt: { gte: todayStart } } })) > 1;
      default:
        return true;
    }
  },

  // 점수 추가 (하루 최대 1점/항목)
  async addPoint(userId: string, type: ActivityType): Promise<void> {
    const alreadyEarned = await this.hasEarnedToday(userId, type);
    if (alreadyEarned) return; // 오늘 이미 해당 활동으로 포인트 받음

    await prisma.user.update({
      where: { id: userId },
      data: { activityScore: { increment: 1 } },
    });
  },

  // 사용자 등급 정보 조회
  async getUserGradeInfo(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { activityScore: true } });
    const score = user?.activityScore || 0;
    const grade = this.getGrade(score);
    const gradeIndex = GRADES.indexOf(grade);
    // GRADES는 높은 등급부터 정렬: [마스터, 전문가, 독서가, 새싹]
    // 다음 등급은 현재보다 한 단계 위 (index - 1)
    const nextGrade = gradeIndex > 0 ? GRADES[gradeIndex - 1] : null;

    return {
      score,
      grade: { name: grade.name, emoji: grade.emoji },
      defaultTokens: grade.defaultTokens,
      nextGrade: nextGrade ? { name: nextGrade.name, emoji: nextGrade.emoji, pointsNeeded: nextGrade.minScore - score } : null,
    };
  },

  // 오늘 퀘스트 진행도
  async getDailyQuests(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [memos, threads, comments, replies, joins] = await Promise.all([
      prisma.memo.count({ where: { userId, createdAt: { gte: todayStart } } }),
      prisma.discussion.count({ where: { authorId: userId, createdAt: { gte: todayStart } } }),
      prisma.comment.count({ where: { authorId: userId, createdAt: { gte: todayStart } } }),
      prisma.reply.count({ where: { authorId: userId, createdAt: { gte: todayStart } } }),
      prisma.groupMember.count({ where: { userId, joinedAt: { gte: todayStart } } }),
    ]);

    return [
      { type: 'memo', label: '메모 작성', done: memos > 0, count: memos },
      { type: 'thread', label: '스레드 생성', done: threads > 0, count: threads },
      { type: 'comment', label: '의견 작성', done: comments > 0, count: comments },
      { type: 'reply', label: '댓글 작성', done: replies > 0, count: replies },
      { type: 'join', label: '모임 참여', done: joins > 0, count: joins },
    ];
  },
};
