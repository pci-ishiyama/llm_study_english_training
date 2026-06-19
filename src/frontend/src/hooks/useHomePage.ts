import { useCallback, useEffect, useMemo, useState } from 'react';

import { getHistory } from '@api/history';
import { getScenarios } from '@api/scenarios';
import { getUser } from '@api/users';
import type { DashboardData, HistoryItem, Scenario, User } from '@appTypes/index';

export interface HomePageViewData extends DashboardData {
  greetingName: string;
  englishLevel: User['englishLevel'];
  learningGoal?: string;
}

export interface UseHomePageResult {
  isLoading: boolean;
  error: string | null;
  data: HomePageViewData | null;
  reload: () => Promise<void>;
}

const isWithinLastDays = (value: string, days: number, now: Date): boolean => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const diffMs = now.getTime() - date.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
};

const calculateStreakDays = (items: HistoryItem[]): number => {
  const uniqueDates = new Set(
    items.map((item) => new Date(item.createdAt).toISOString().slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();

  let key = cursor.toISOString().slice(0, 10);
  while (uniqueDates.has(key)) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    key = cursor.toISOString().slice(0, 10);
  }

  return streak;
};

const pickRecommendedScenario = (
  scenarios: Scenario[],
  historyItems: HistoryItem[],
): Scenario | null => {
  if (scenarios.length === 0) {
    return null;
  }

  const practicedIds = new Set(historyItems.map((item) => item.scenarioId));
  return scenarios.find((scenario) => !practicedIds.has(scenario.scenarioId)) ?? scenarios[0];
};

const buildRecentScores = (
  items: HistoryItem[],
): DashboardData['recentScores'] => {
  return items
    .slice(0, 7)
    .reverse()
    .map((item) => ({
      date: item.createdAt.slice(5, 10),
      score: item.overallScore,
    }));
};

export const useHomePage = (userId: string): UseHomePageResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HomePageViewData | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (userId === '') {
      setError('\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093');
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [userRes, historyRes, scenariosRes] = await Promise.all([
        getUser(userId),
        getHistory({ limit: 10 }),
        getScenarios(),
      ]);

      if (!userRes.success || userRes.data === null) {
        throw new Error('\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }
      if (!historyRes.success || historyRes.data === null) {
        throw new Error('\u5b66\u7fd2\u5c65\u6b74\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }
      if (!scenariosRes.success || scenariosRes.data === null) {
        throw new Error('\u30b7\u30ca\u30ea\u30aa\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      const items = historyRes.data.items;
      const now = new Date();
      const recommendedScenario = pickRecommendedScenario(scenariosRes.data, items);

      if (recommendedScenario === null) {
        throw new Error('\u63a8\u5968\u30b7\u30ca\u30ea\u30aa\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      const averageScore =
        items.length === 0
          ? 0
          : Math.round(
              items.reduce((sum, item) => sum + item.overallScore, 0) / items.length,
            );

      setData({
        greetingName: userRes.data.name,
        englishLevel: userRes.data.englishLevel,
        learningGoal: userRes.data.learningGoal,
        weeklyCount: items.filter((item) => isWithinLastDays(item.createdAt, 7, now)).length,
        streakDays: calculateStreakDays(items),
        averageScore,
        recentScores: buildRecentScores(items),
        recommendedScenario,
      });
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error ? err.message : '\u30db\u30fc\u30e0\u753b\u9762\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f',
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({
      isLoading,
      error,
      data,
      reload: load,
    }),
    [data, error, isLoading, load],
  );
};