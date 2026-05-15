import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NotificationType =
  | 'group_started'
  | 'group_ended'
  | 'thread_created'
  | 'thread_ended'
  | 'announcement_created';

interface CreateForGroupMembersInput {
  groupId: string;
  excludeUserId?: string;
  type: NotificationType;
  message: string;
  linkUrl: string;
  dedupeKey: string;
  discussionId?: string;
  announcementId?: string;
}

const getKstDayRange = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = formatter.format(new Date()).split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const mapNotification = (notification: any) => ({
  id: notification.id,
  type: notification.type,
  message: notification.message,
  linkUrl: notification.linkUrl,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  groupId: notification.groupId,
  groupName: notification.group?.name ?? '',
  discussionId: notification.discussionId,
  announcementId: notification.announcementId,
});

export const notificationService = {
  async createForGroupMembers(input: CreateForGroupMembersInput) {
    const members = await prisma.groupMember.findMany({
      where: {
        groupId: input.groupId,
        ...(input.excludeUserId ? { userId: { not: input.excludeUserId } } : {}),
      },
      select: { userId: true },
    });

    if (members.length === 0) return;

    await prisma.notification.createMany({
      data: members.map(member => ({
        userId: member.userId,
        groupId: input.groupId,
        discussionId: input.discussionId ?? null,
        announcementId: input.announcementId ?? null,
        type: input.type,
        message: input.message,
        linkUrl: input.linkUrl,
        dedupeKey: input.dedupeKey,
      })),
      skipDuplicates: true,
    });
  },

  async notifyThreadCreated(discussionId: string) {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: { group: { select: { id: true, name: true } } },
    });
    if (!discussion) return;

    await this.createForGroupMembers({
      groupId: discussion.groupId,
      excludeUserId: discussion.authorId,
      type: 'thread_created',
      message: `${discussion.group.name}에 새 스레드 "${discussion.title}"이 열렸습니다.`,
      linkUrl: `/discussions/${discussion.id}`,
      dedupeKey: `discussion-created:${discussion.id}`,
      discussionId: discussion.id,
    });
  },

  async notifyThreadEnded(discussionId: string) {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: { group: { select: { id: true, name: true } } },
    });
    if (!discussion) return;

    await this.createForGroupMembers({
      groupId: discussion.groupId,
      excludeUserId: discussion.authorId,
      type: 'thread_ended',
      message: `${discussion.group.name}의 스레드 "${discussion.title}"이 종료되었습니다.`,
      linkUrl: `/discussions/${discussion.id}`,
      dedupeKey: `discussion-ended:${discussion.id}`,
      discussionId: discussion.id,
    });
  },

  async notifyAnnouncementCreated(announcementId: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { group: { select: { id: true, name: true } } },
    });
    if (!announcement) return;

    await this.createForGroupMembers({
      groupId: announcement.groupId,
      excludeUserId: announcement.authorId,
      type: 'announcement_created',
      message: `${announcement.group.name}에 새 공지사항 "${announcement.title}"이 등록되었습니다.`,
      linkUrl: `/groups/${announcement.groupId}/dashboard`,
      dedupeKey: `announcement-created:${announcement.id}`,
      announcementId: announcement.id,
    });
  },

  async processGroupDateNotifications() {
    const { start, end } = getKstDayRange();
    const [startingGroups, endingGroups] = await Promise.all([
      prisma.group.findMany({
        where: { readingStartDate: { gte: start, lt: end } },
        select: { id: true, name: true },
      }),
      prisma.group.findMany({
        where: { readingEndDate: { gte: start, lt: end } },
        select: { id: true, name: true },
      }),
    ]);

    for (const group of startingGroups) {
      await this.createForGroupMembers({
        groupId: group.id,
        type: 'group_started',
        message: `${group.name}이 시작되었습니다.`,
        linkUrl: `/groups/${group.id}`,
        dedupeKey: `group-start:${group.id}`,
      });
    }

    for (const group of endingGroups) {
      await this.createForGroupMembers({
        groupId: group.id,
        type: 'group_ended',
        message: `${group.name}이 종료되었습니다.`,
        linkUrl: `/groups/${group.id}`,
        dedupeKey: `group-end:${group.id}`,
      });
    }
  },

  async list(userId: string, limit?: number) {
    await this.processGroupDateNotifications();

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { group: { select: { name: true } } },
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: items.map(mapNotification),
      unreadCount,
    };
  },

  async getUnreadCount(userId: string) {
    await this.processGroupDateNotifications();
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  startDateNotificationScheduler() {
    this.processGroupDateNotifications().catch(() => {});
    setInterval(() => {
      this.processGroupDateNotifications().catch(() => {});
    }, 60 * 60 * 1000);
  },
};
