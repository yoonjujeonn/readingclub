import apiClient from './client';

export const reportsApi = {
  create: (targetType: string, targetId: string, reason: string) =>
    apiClient.post('/reports', { targetType, targetId, reason }),
};
