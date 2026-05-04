import apiClient from './client';

export interface Announcement {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionSchedule {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export const dashboardApi = {
  // 초대 링크
  getInviteCode: (groupId: string) =>
    apiClient.get<{ inviteCode: string | null }>(`/groups/${groupId}/invite`),

  generateInviteCode: (groupId: string) =>
    apiClient.post<{ inviteCode: string }>(`/groups/${groupId}/invite`),

  joinByInviteCode: (code: string) =>
    apiClient.post<{ groupId: string; groupName: string }>(`/groups/invite/${code}/join`),

  // 멤버 삭제
  removeMember: (groupId: string, userId: string) =>
    apiClient.delete(`/groups/${groupId}/members/${userId}`),

  // 공지사항
  listAnnouncements: (groupId: string) =>
    apiClient.get<Announcement[]>(`/groups/${groupId}/announcements`),

  createAnnouncement: (groupId: string, data: { title: string; content: string }) =>
    apiClient.post<Announcement>(`/groups/${groupId}/announcements`, data),

  updateAnnouncement: (groupId: string, annId: string, data: { title?: string; content?: string }) =>
    apiClient.put<Announcement>(`/groups/${groupId}/announcements/${annId}`, data),

  deleteAnnouncement: (groupId: string, annId: string) =>
    apiClient.delete(`/groups/${groupId}/announcements/${annId}`),

  // 댓글/답글 삭제
  deleteComment: (commentId: string) =>
    apiClient.delete(`/comments/${commentId}`),

  deleteReply: (replyId: string) =>
    apiClient.delete(`/replies/${replyId}`),

  // 토론 일정
  listSchedules: (groupId: string) =>
    apiClient.get<DiscussionSchedule[]>(`/groups/${groupId}/schedules`),

  createSchedule: (groupId: string, data: { title: string; description?: string; startDate: string; endDate: string }) =>
    apiClient.post<DiscussionSchedule>(`/groups/${groupId}/schedules`, data),

  deleteSchedule: (groupId: string, scheduleId: string) =>
    apiClient.delete(`/groups/${groupId}/schedules/${scheduleId}`),
};
