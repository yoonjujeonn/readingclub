import apiClient from './client';
import type { NotificationItem } from '../types';

export const notificationsApi = {
  list: (limit?: number) =>
    apiClient.get<{ items: NotificationItem[]; unreadCount: number }>('/me/notifications', {
      params: limit ? { limit } : undefined,
    }),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/me/notifications/unread-count'),

  markRead: (id: string) =>
    apiClient.patch(`/me/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch('/me/notifications/read-all'),
};
