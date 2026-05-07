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
};
