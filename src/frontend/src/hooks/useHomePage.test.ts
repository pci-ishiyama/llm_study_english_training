import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHomePage } from '@hooks/useHomePage';
import { getUser } from '@api/users';
import { getHistory } from '@api/history';
import { getScenarios } from '@api/scenarios';

vi.mock('@api/users', () => ({
  getUser: vi.fn(),
}));

vi.mock('@api/history', () => ({
  getHistory: vi.fn(),
}));

vi.mock('@api/scenarios', () => ({
  getScenarios: vi.fn(),
}));

describe('useHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the home screen view model from existing APIs', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    const todayStr = today.toISOString().replace(/\.\d{3}Z$/, '.000Z');
    const yesterdayStr = yesterday.toISOString().replace(/\.\d{3}Z$/, '.000Z');

    vi.mocked(getUser).mockResolvedValue({
      success: true,
      data: {
        userId: 'user-123',
        name: 'Taro',
        englishLevel: 'Intermediate',
        learningGoal: '\u4f1a\u8b70\u3067\u81ea\u7136\u306b\u8a71\u305b\u308b\u3088\u3046\u306b\u306a\u308b',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      error: null,
    });

    vi.mocked(getHistory).mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            sessionId: 'session-1',
            scenarioId: 'scenario-1',
            scenarioTitle: 'Daily Standup',
            overallScore: 80,
            grade: 'B',
            feedbackId: 'feedback-1',
            createdAt: todayStr,
          },
          {
            sessionId: 'session-2',
            scenarioId: 'scenario-2',
            scenarioTitle: 'Incident Report',
            overallScore: 90,
            grade: 'A',
            feedbackId: 'feedback-2',
            createdAt: yesterdayStr,
          },
        ],
      },
      error: null,
    });

    vi.mocked(getScenarios).mockResolvedValue({
      success: true,
      data: [
        {
          scenarioId: 'scenario-1',
          title: 'Daily Standup',
          description: 'Share daily updates',
          scene: 'meeting',
          difficulty: 'Beginner' as const,
          initialMessage: 'You are a Scrum Master.',
        },
        {
          scenarioId: 'scenario-3',
          title: '\u969c\u5bb3\u5831\u544a\u30df\u30fc\u30c6\u30a3\u30f3\u30b0',
          description: 'Explain an incident to the team',
          scene: 'technical',
          difficulty: 'Advanced' as const,
          initialMessage: 'You are an incident commander.',
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useHomePage('user-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    const data = result.current.data as unknown as Record<string, unknown>;
    expect(data['greetingName']).toBe('Taro');
    expect(data['weeklyCount']).toBe(2);
    expect(data['streakDays']).toBe(2);
    expect(data['averageScore']).toBe(85);
    expect((data['recommendedScenario'] as Record<string, unknown>)['scenarioId']).toBe('scenario-3');
    expect(Array.isArray(data['recentScores'])).toBe(true);
  });

  it('returns an error when user loading fails', async () => {
    vi.mocked(getUser).mockResolvedValue({
      success: false,
      data: null,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'missing',
      },
    });
    vi.mocked(getHistory).mockResolvedValue({ success: true, data: { items: [] }, error: null });
    vi.mocked(getScenarios).mockResolvedValue({ success: true, data: [], error: null });

    const { result } = renderHook(() => useHomePage('user-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
  });

  it('returns error when userId is empty string', async () => {
    const { result } = renderHook(() => useHomePage(''));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093');
  });

  it('returns error when history loading fails', async () => {
    vi.mocked(getUser).mockResolvedValue({
      success: true,
      data: {
        userId: 'user-123',
        name: 'Taro',
        englishLevel: 'Intermediate',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      error: null,
    });
    vi.mocked(getHistory).mockResolvedValue({
      success: false,
      data: null,
      error: { code: 'ERR', message: 'fail' },
    });
    vi.mocked(getScenarios).mockResolvedValue({ success: true, data: [], error: null });

    const { result } = renderHook(() => useHomePage('user-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('\u5b66\u7fd2\u5c65\u6b74\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
  });

  it('returns error when scenarios loading fails', async () => {
    vi.mocked(getUser).mockResolvedValue({
      success: true,
      data: {
        userId: 'user-123',
        name: 'Taro',
        englishLevel: 'Intermediate',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      error: null,
    });
    vi.mocked(getHistory).mockResolvedValue({
      success: true,
      data: { items: [] },
      error: null,
    });
    vi.mocked(getScenarios).mockResolvedValue({
      success: false,
      data: null,
      error: { code: 'ERR', message: 'fail' },
    });

    const { result } = renderHook(() => useHomePage('user-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('\u30b7\u30ca\u30ea\u30aa\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
  });

  it('returns error when no recommended scenario (empty scenarios list)', async () => {
    vi.mocked(getUser).mockResolvedValue({
      success: true,
      data: {
        userId: 'user-123',
        name: 'Taro',
        englishLevel: 'Intermediate',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      error: null,
    });
    vi.mocked(getHistory).mockResolvedValue({
      success: true,
      data: { items: [] },
      error: null,
    });
    vi.mocked(getScenarios).mockResolvedValue({
      success: true,
      data: [],
      error: null,
    });

    const { result } = renderHook(() => useHomePage('user-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('\u63a8\u5968\u30b7\u30ca\u30ea\u30aa\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
  });

  it('calculates averageScore as 0 when no history items', async () => {
    vi.mocked(getUser).mockResolvedValue({
      success: true,
      data: {
        userId: 'user-123',
        name: 'Taro',
        englishLevel: 'Intermediate',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      error: null,
    });
    vi.mocked(getHistory).mockResolvedValue({
      success: true,
      data: { items: [] },
      error: null,
    });
    vi.mocked(getScenarios).mockResolvedValue({
      success: true,
      data: [
        {
          scenarioId: 'scenario-1',
          title: 'Daily Standup',
          description: 'Share daily updates',
          scene: 'meeting',
          difficulty: 'Beginner' as const,
          initialMessage: 'You are a Scrum Master.',
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useHomePage('user-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    const data = result.current.data as unknown as Record<string, unknown>;
    expect(data['averageScore']).toBe(0);
    expect(data['weeklyCount']).toBe(0);
    expect(data['streakDays']).toBe(0);
  });

  it('handles non-Error thrown in load', async () => {
    vi.mocked(getUser).mockRejectedValue('string error');
    vi.mocked(getHistory).mockResolvedValue({ success: true, data: { items: [] }, error: null });
    vi.mocked(getScenarios).mockResolvedValue({ success: true, data: [], error: null });

    const { result } = renderHook(() => useHomePage('user-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('\u30db\u30fc\u30e0\u753b\u9762\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
  });
});