import { apiGet } from './client';

import type { ApiResponse, Feedback } from '@appTypes/index';

/**
 * フィードバック取得
 */
export const getFeedback = async (
  sessionId: string,
): Promise<ApiResponse<Feedback>> => {
  return apiGet<Feedback>(`/sessions/${sessionId}/feedback`);
};
