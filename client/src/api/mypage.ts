import apiClient from './client';
import type { Discussion, GroupCard, Memo, User } from '../types';

export const mypageApi = {
  getProfile: () =>
    apiClient.get<User>('/me/profile'),

  getGroups: () =>
    apiClient.get<GroupCard[]>('/me/groups'),

  getMemos: () =>
    apiClient.get<Memo[]>('/me/memos'),

  getDiscussions: () =>
    apiClient.get<Discussion[]>('/me/discussions'),

  checkNickname: (nickname: string) =>
    apiClient.get<{ available: boolean }>(`/me/check-nickname?nickname=${encodeURIComponent(nickname)}`),

  updateNickname: (nickname: string) =>
    apiClient.patch<User>('/me/nickname', { nickname }),

  getRecommendedGroups: () =>
    apiClient.get<any[]>('/me/recommended-groups'),
};
