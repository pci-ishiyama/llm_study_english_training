import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockInstance),
      isAxiosError: vi.fn(() => false),
    },
  };
});

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    tokens: { idToken: { toString: () => 'mock-token' } },
  }),
}));

describe('API modules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('users module exports getUser and updateUser', async () => {
    const users = await import('@api/users');
    expect(typeof users.getUser).toBe('function');
    expect(typeof users.updateUser).toBe('function');
  });

  it('scenarios module exports getScenarios and getScenario', async () => {
    const scenarios = await import('@api/scenarios');
    expect(typeof scenarios.getScenarios).toBe('function');
    expect(typeof scenarios.getScenario).toBe('function');
  });

  it('sessions module exports startSession, endSession, sendChat', async () => {
    const sessions = await import('@api/sessions');
    expect(typeof sessions.startSession).toBe('function');
    expect(typeof sessions.endSession).toBe('function');
    expect(typeof sessions.sendChat).toBe('function');
  });

  it('feedbacks module exports getFeedback', async () => {
    const feedbacks = await import('@api/feedbacks');
    expect(typeof feedbacks.getFeedback).toBe('function');
  });

  it('history module exports getHistory', async () => {
    const history = await import('@api/history');
    expect(typeof history.getHistory).toBe('function');
  });

  it('client module exports apiGet, apiPost, apiPut, apiDelete', async () => {
    const client = await import('@api/client');
    expect(typeof client.apiGet).toBe('function');
    expect(typeof client.apiPost).toBe('function');
    expect(typeof client.apiPut).toBe('function');
    expect(typeof client.apiDelete).toBe('function');
  });
});