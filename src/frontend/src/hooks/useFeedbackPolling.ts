import { useState, useEffect, useRef, useCallback } from 'react';
import { getFeedback } from '@api/feedbacks';
import type { Feedback } from '@appTypes/index';

const POLLING_INTERVAL_MS = 5000;
const MAX_POLLING_COUNT = 24; // 最大2分間ポーリング

export interface UseFeedbackPollingReturn {
  feedback: Feedback | null;
  isFeedbackLoading: boolean;
  startPolling: (sessionId: string) => void;
  stopPolling: () => void;
}

/**
 * フィードバック取得ポーリングフック
 * - SQS経由で非同期生成されるフィードバックを定期取得
 * - 最大2分間ポーリングし、取得できたら停止
 */
export const useFeedbackPolling = (): UseFeedbackPollingReturn => {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);

  const stopPolling = useCallback((): void => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsFeedbackLoading(false);
    countRef.current = 0;
  }, []);

  const startPolling = useCallback(
    (sessionId: string): void => {
      stopPolling();
      sessionIdRef.current = sessionId;
      countRef.current = 0;
      setIsFeedbackLoading(true);

      intervalRef.current = setInterval(() => {
        countRef.current += 1;

        if (countRef.current > MAX_POLLING_COUNT) {
          stopPolling();
          return;
        }

        const currentSessionId = sessionIdRef.current;
        if (currentSessionId === null) return;

        void getFeedback(currentSessionId).then((response) => {
          if (response.success && response.data !== null) {
            setFeedback(response.data);
            stopPolling();
          }
        });
      }, POLLING_INTERVAL_MS);
    },
    [stopPolling],
  );

  // アンマウント時にポーリングを停止
  useEffect(() => {
    return (): void => {
      stopPolling();
    };
  }, [stopPolling]);

  return { feedback, isFeedbackLoading, startPolling, stopPolling };
};
