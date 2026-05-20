import { withRetry } from 'shared/utils/retry';

beforeAll(() => {
  process.env.RETRY_INITIAL_DELAY_MS = '1';
});

describe('withRetry', () => {
  it('初回成功時はそのまま値を返す', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('1回失敗後に成功する場合リトライして値を返す', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, 3);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('最大リトライ回数を超えた場合は最後のエラーをスローする', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('always fail'));
    await expect(withRetry(fn, 2)).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('maxRetries=0 の場合は1回だけ試行してエラーをスローする', async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error('fail'));
    await expect(withRetry(fn, 0)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
