import apiClient from './client';

export interface RankingUser {
  rank: number;
  id: string;
  nickname: string;
  score: number;
  profileImageUrl?: string;
}

export interface RankingTop3 {
  rank: number;
  nickname: string;
  score: number;
}

export const rankingApi = {
  getTop3: () => apiClient.get<RankingTop3[]>('/ranking/top3'),
  getAll: (limit = 20) => apiClient.get<RankingUser[]>(`/ranking?limit=${limit}`),
};
