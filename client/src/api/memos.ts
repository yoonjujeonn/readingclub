import apiClient from './client';
import type { CreateMemoRequest, Memo, MemoVisibility } from '../types';

export const memosApi = {
  listByGroup: async (groupId: string) => {
    const res = await apiClient.get<any[]>(`/groups/${groupId}/memos`);
    const all = res.data || [];
    const myMemos = all.filter((m: any) => m.isOwn).map((m: any) => ({
      ...m,
      authorNickname: m.user?.nickname || '',
    }));
    const publicMemos = all.filter((m: any) => !m.isOwn && m.visibility === 'public').map((m: any) => ({
      ...m,
      authorNickname: m.user?.nickname || '',
      isContentHidden: false,
      content: m.content || '',
    }));
    const spoilerMemos = all.filter((m: any) => !m.isOwn && m.visibility === 'spoiler').map((m: any) => ({
      ...m,
      authorNickname: m.user?.nickname || '',
      isContentHidden: !m.canView,
      content: m.content || '',
    }));
    return { data: { myMemos, publicMemos, spoilerMemos } };
  },

  create: (groupId: string, data: CreateMemoRequest) =>
    apiClient.post<Memo>(`/groups/${groupId}/memos`, data),

  update: (id: string, data: Partial<CreateMemoRequest>) =>
    apiClient.put<Memo>(`/memos/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/memos/${id}`),

  updateVisibility: (id: string, visibility: MemoVisibility) =>
    apiClient.patch<Memo>(`/memos/${id}/visibility`, { visibility }),
};
