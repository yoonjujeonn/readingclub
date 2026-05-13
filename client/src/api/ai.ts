import apiClient from './client';

export interface AiTopic {
  title: string;
  content: string;
}

export const aiApi = {
  suggestTopics: (groupId: string) =>
    apiClient.post<{ topics: AiTopic[] }>(`/groups/${groupId}/ai/topics`),

  summarizeThread: (discussionId: string) =>
    apiClient.post<{ summary: string }>(`/discussions/${discussionId}/ai/summary`),

  generateInsight: (groupId: string) =>
    apiClient.post<{ insight: string }>(`/groups/${groupId}/ai/insight`),

  // 인사이트 저장 기능
  generateAndSaveInsight: (groupId: string) =>
    apiClient.post<any>(`/groups/${groupId}/insights`),

  getSavedInsight: (groupId: string) =>
    apiClient.get<any>(`/groups/${groupId}/insights`),

  getMyInsights: () =>
    apiClient.get<any[]>('/me/insights'),
};
