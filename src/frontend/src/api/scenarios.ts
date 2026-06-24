import { apiGet } from './client';
import type { ApiResponse, DifficultyFilter, Scenario } from '@appTypes/index';

export type { DifficultyFilter };

/** シナリオ一覧取得     */
export const getScenarios = async (
  difficulty?: DifficultyFilter,
): Promise<ApiResponse<Scenario[]>> => {
  const query =
    difficulty !== undefined && difficulty !== 'all'
      ? `?difficulty=${difficulty}`
      : '';
  return apiGet<Scenario[]>(`/scenarios${query}`);
};

/** シナリオ詳細取得 */
export const getScenario = async (
  scenarioId: string,
): Promise<ApiResponse<Scenario>> => {
  return apiGet<Scenario>(`/scenarios/${scenarioId}`);
};
