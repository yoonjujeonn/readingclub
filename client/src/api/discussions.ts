import apiClient from './client';
import type {
  Comment,
  CreateDiscussionRequest,
  Discussion,
  RecommendedTopic,
} from '../types';

export const discussionsApi = {
  listByGroup: (groupId: string, params?: { authorId?: string }) =>
    apiClient.get<Discussion[]>(`/groups/${groupId}/discussions`, { params }),

  create: (groupId: string, data: CreateDiscussionRequest) =>
    apiClient.post<Discussion>(`/groups/${groupId}/discussions`, data),

  getById: (discussionId: string) =>
    apiClient.get<Discussion>(`/discussions/${discussionId}`),

  getComments: async (discussionId: string) => {
    const res = await apiClient.get<any[]>(`/discussions/${discussionId}/comments`);
    // Map server response (author.nickname) to flat authorNickname
    res.data = res.data.map((c: any) => ({
      ...c,
      authorId: c.authorId || c.author?.id,
      authorNickname: c.authorNickname || c.author?.nickname || '알 수 없음',
      replies: (c.replies || []).map((r: any) => ({
        ...r,
        authorId: r.authorId || r.author?.id,
        authorNickname: r.authorNickname || r.author?.nickname || '알 수 없음',
      })),
    }));
    return res as { data: Comment[] };
  },

  addComment: (discussionId: string, content: string) =>
    apiClient.post<Comment>(`/discussions/${discussionId}/comments`, { content }),

  addReply: (commentId: string, content: string) =>
    apiClient.post(`/comments/${commentId}/replies`, { content }),

  getRecommendations: (groupId: string) =>
    apiClient.get<RecommendedTopic[]>(`/groups/${groupId}/discussions/recommendations`),

  updateEndDate: (discussionId: string, endDate: string) =>
    apiClient.patch(`/discussions/${discussionId}/end-date`, { endDate }),

  pinThread: (discussionId: string) =>
    apiClient.post(`/discussions/${discussionId}/pin`),

  unpinThread: (discussionId: string) =>
    apiClient.delete(`/discussions/${discussionId}/pin`),

  // 발언권
  getTokens: (discussionId: string) =>
    apiClient.get<{ remaining: number; requested: boolean }>(`/discussions/${discussionId}/tokens`),

  requestTokens: (discussionId: string) =>
    apiClient.post(`/discussions/${discussionId}/tokens/request`),

  getTokenRequests: (discussionId: string) =>
    apiClient.get<any[]>(`/discussions/${discussionId}/tokens/requests`),

  grantTokens: (discussionId: string, userId: string, amount: number) =>
    apiClient.post(`/discussions/${discussionId}/tokens/grant`, { userId, amount }),
};
