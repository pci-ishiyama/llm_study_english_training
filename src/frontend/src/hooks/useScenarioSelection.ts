import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getScenarios } from '@api/scenarios';
import { startSession } from '@api/sessions';
import type { DifficultyFilter, Scenario } from '@appTypes/index';

export interface UseScenarioSelectionReturn {
  scenarios: Scenario[];
  selectedId: string | null;
  difficulty: DifficultyFilter;
  isLoading: boolean;
  isStarting: boolean;
  error: string | null;
  setDifficulty: (d: DifficultyFilter) => void;
  setSelectedId: (id: string) => void;
  handleStart: () => Promise<void>;
}

/**
 * シナリオ選択画面の状態管理フック
 * - difficulty 変更時にシナリオ一覧を再取得
 * - handleStart でセッション作成 → 対話画面へ遷移
 */
export const useScenarioSelection = (): UseScenarioSelectionReturn => {
  const navigate = useNavigate();

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [difficulty, setDifficultyState] = useState<DifficultyFilter>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // difficulty 変更時にシナリオ一覧を再取得
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    void getScenarios(difficulty).then((response) => {
      if (response.success && response.data !== null) {
        setScenarios(response.data);
      } else {
        setError('シナリオの取得に失敗しました');
        setScenarios([]);
      }
      setIsLoading(false);
    }).catch(() => {
      setError('シナリオの取得に失敗しました');
      setScenarios([]);
      setIsLoading(false);
    });
  }, [difficulty]);

  const setDifficulty = (d: DifficultyFilter): void => {
    setDifficultyState(d);
    setSelectedId(null); // フィルター変更時は選択をリセット
  };

  const handleStart = async (): Promise<void> => {
    if (selectedId === null) return;

    setIsStarting(true);
    setError(null);

    try {
      const response = await startSession({ scenarioId: selectedId });
      if (response.success && response.data !== null) {
        void navigate(`/session/${response.data.sessionId}/chat`);
      } else {
        setError('セッションの開始に失敗しました');
      }
    } catch {
      setError('セッションの開始に失敗しました');
    } finally {
      setIsStarting(false);
    }
  };

  return {
    scenarios,
    selectedId,
    difficulty,
    isLoading,
    isStarting,
    error,
    setDifficulty,
    setSelectedId,
    handleStart,
  };
};
