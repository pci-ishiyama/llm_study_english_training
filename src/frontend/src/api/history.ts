import { apiGet } from './client';

import type { ApiResponse, HistoryResponse } from '@appTypes/index';

/**
 * 学習履歴一覧取得
 */
export const getHistory = async (params?: {
  limit?: number;
  nextToken?: string;
}): Promise<ApiResponse<HistoryResponse>> => {
  return apiGet<HistoryResponse>('/users/me/history', { params });
};
