import apiClient from './client';
import type { CreateGroupRequest, GroupCard, GroupDetail, PaginatedResult } from '../types';

export const groupsApi = {
  list: async (params?: { search?: string; page?: number }) => {
    const res = await apiClient.get('/groups', { params });
    // 서버 응답: { items, total, page, limit, totalPages }
    const d = res.data;
    const items = (d.items || []).map((g: any) => ({
      ...g,
      currentMembers: g.currentMembers ?? g.memberCount ?? 0,
    }));
    return { data: { data: items, total: d.total, page: d.page, totalPages: d.totalPages } };
  },

  create: (data: CreateGroupRequest) =>
    apiClient.post<GroupDetail>('/groups', data),

  getDetail: (id: string) =>
    apiClient.get<GroupDetail>(`/groups/${id}`),

  join: (id: string) =>
    apiClient.post(`/groups/${id}/join`),

  update: (id: string, data: Partial<CreateGroupRequest>) =>
    apiClient.put(`/groups/${id}`, data),

  updateProgress: (id: string, readingProgress: number) =>
    apiClient.patch(`/groups/${id}/progress`, { readingProgress }),

  delete: (id: string) =>
    apiClient.delete(`/groups/${id}`),

  leave: (id: string) =>
    apiClient.delete(`/groups/${id}/leave`),
};
