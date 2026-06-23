import { apiGet } from './client';

import type { ApiResponse, Scenario } from '@appTypes/index';

/**
 * シナリオ一覧取得
 */
export const getScenarios = async (): Promise<ApiResponse<Scenario[]>> => {
  return apiGet<Scenario[]>('/scenarios');
};

/**
 * シナリオ詳細取得
 */
export const getScenario = async (
  scenarioId: string,
): Promise<ApiResponse<Scenario>> => {
  return apiGet<Scenario>(`/scenarios/${scenarioId}`);
};
