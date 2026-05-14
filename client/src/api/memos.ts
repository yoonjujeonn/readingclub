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
    const publicMemos = all.filter((m: any) => m.visibility === 'public').map((m: any) => ({
      ...m,
      authorNickname: m.user?.nickname || '',
      isContentHidden: false,
      content: m.content || '',
    }));
    const spoilerMemos = all.filter((m: any) => m.visibility === 'spoiler').map((m: any) => ({
      ...m,
      authorNickname: m.user?.nickname || '',
      isContentHidden: !m.isOwn && !m.canView,
      content: m.content || '',
    }));
    return { data: { myMemos, publicMemos, spoilerMemos } };
  },

  create: (groupId: string, data: CreateMemoRequest) => {
    if (!data.image) {
      return apiClient.post<Memo>(`/groups/${groupId}/memos`, data);
    }

    const formData = new FormData();
    formData.append('pageStart', String(data.pageStart));
    formData.append('pageEnd', String(data.pageEnd));
    formData.append('content', data.content);
    if (data.isPublic !== undefined) formData.append('isPublic', String(data.isPublic));
    if (data.visibility) formData.append('visibility', data.visibility);
    formData.append('image', data.image);
    return apiClient.post<Memo>(`/groups/${groupId}/memos`, formData);
  },

  update: (id: string, data: Partial<CreateMemoRequest>) =>
    apiClient.put<Memo>(`/memos/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/memos/${id}`),

  updateVisibility: (id: string, visibility: MemoVisibility) =>
    apiClient.patch<Memo>(`/memos/${id}/visibility`, { visibility }),
};
