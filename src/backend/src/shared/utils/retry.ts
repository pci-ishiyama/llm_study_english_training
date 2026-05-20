/**
 * Exponential Backoff リトライユーティリティ
 * ルール9: Bedrock呼び出しはExponential Backoffで最大3回リトライ
 */

const INITIAL_DELAY_MS = parseInt(process.env.RETRY_INITIAL_DELAY_MS ?? "500", 10);
const MAX_RETRIES = 3;

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt);
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
