import axios from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type MockApiInstance = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  interceptors: {
    request: { use: ReturnType<typeof vi.fn> };
    response: { use: ReturnType<typeof vi.fn> };
  };
};

const mockApiInstance: MockApiInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockApiInstance),
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

  afterEach(() => {
    vi.resetModules();
  });

  it('getUser calls GET /users/:id', async () => {
    const response = { success: true, data: { userId: 'u1' }, error: null };
    mockApiInstance.get.mockResolvedValue({ data: response });

    const { getUser } = await import('@api/users');
    const result = await getUser('u1');

    expect(mockApiInstance.get).toHaveBeenCalledWith('/users/u1', undefined);
    expect(result).toEqual(response);
  });

  it('updateUser calls PUT /users/:id', async () => {
    const payload = { name: 'Test User', englishLevel: 'Intermediate' as const };
    const response = { success: true, data: { userId: 'u1' }, error: null };
    mockApiInstance.put.mockResolvedValue({ data: response });

    const { updateUser } = await import('@api/users');
    const result = await updateUser('u1', payload);

    expect(mockApiInstance.put).toHaveBeenCalledWith('/users/u1', payload, undefined);
    expect(result).toEqual(response);
  });

  it('getScenarios calls GET /scenarios', async () => {
    const response = { success: true, data: [], error: null };
    mockApiInstance.get.mockResolvedValue({ data: response });

    const { getScenarios } = await import('@api/scenarios');
    const result = await getScenarios();

    expect(mockApiInstance.get).toHaveBeenCalledWith('/scenarios', undefined);
    expect(result).toEqual(response);
  });

  it('getScenario calls GET /scenarios/:id', async () => {
    const response = { success: true, data: { scenarioId: 's1' }, error: null };
    mockApiInstance.get.mockResolvedValue({ data: response });

    const { getScenario } = await import('@api/scenarios');
    const result = await getScenario('s1');

    expect(mockApiInstance.get).toHaveBeenCalledWith('/scenarios/s1', undefined);
    expect(result).toEqual(response);
  });

  it('startSession calls POST /sessions', async () => {
    const payload = { scenarioId: 's1' };
    const response = { success: true, data: { sessionId: 'sess1' }, error: null };
    mockApiInstance.post.mockResolvedValue({ data: response });

    const { startSession } = await import('@api/sessions');
    const result = await startSession(payload);

    expect(mockApiInstance.post).toHaveBeenCalledWith('/sessions', payload, undefined);
    expect(result).toEqual(response);
  });

  it('endSession calls PUT /sessions/:id/end', async () => {
    const response = { success: true, data: { status: 'completed' }, error: null };
    mockApiInstance.put.mockResolvedValue({ data: response });

    const { endSession } = await import('@api/sessions');
    const result = await endSession('sess1');

    expect(mockApiInstance.put).toHaveBeenCalledWith('/sessions/sess1/end', {}, undefined);
    expect(result).toEqual(response);
  });

  it('sendChat calls POST /sessions/:id/chat', async () => {
    const payload = { userMessage: 'Hello', messageType: 'text' as const };
    const response = { success: true, data: { chatLogId: 'c1' }, error: null };
    mockApiInstance.post.mockResolvedValue({ data: response });

    const { sendChat } = await import('@api/sessions');
    const result = await sendChat('sess1', payload);

    expect(mockApiInstance.post).toHaveBeenCalledWith('/sessions/sess1/chat', payload, undefined);
    expect(result).toEqual(response);
  });

  it('getFeedback calls GET /sessions/:id/feedback', async () => {
    const response = { success: true, data: { feedbackId: 'f1' }, error: null };
    mockApiInstance.get.mockResolvedValue({ data: response });

    const { getFeedback } = await import('@api/feedbacks');
    const result = await getFeedback('sess1');

    expect(mockApiInstance.get).toHaveBeenCalledWith('/sessions/sess1/feedback', undefined);
    expect(result).toEqual(response);
  });

  it('getHistory calls GET /history with params', async () => {
    const params = { limit: 10, nextToken: 'token-1' };
    const response = { success: true, data: { items: [] }, error: null };
    mockApiInstance.get.mockResolvedValue({ data: response });

    const { getHistory } = await import('@api/history');
    const result = await getHistory(params);

    expect(mockApiInstance.get).toHaveBeenCalledWith('/history', { params });
    expect(result).toEqual(response);
  });

  it('apiDelete returns response data', async () => {
    const response = { success: true };
    mockApiInstance.delete.mockResolvedValue({ data: response });

    const { apiDelete } = await import('@api/client');
    const result = await apiDelete('/resource/1');

    expect(mockApiInstance.delete).toHaveBeenCalledWith('/resource/1', undefined);
    expect(result).toEqual(response);
  });

  it('registers a 401 response interceptor that rejects the error', async () => {
    vi.resetModules();
    mockApiInstance.interceptors.response.use.mockClear();

    await import('@api/client');
    const successHandler = mockApiInstance.interceptors.response.use.mock.calls[0]?.[0] as
      | ((value: unknown) => unknown)
      | undefined;
    const responseInterceptor = mockApiInstance.interceptors.response.use.mock.calls[0]?.[1] as
      | ((error: unknown) => Promise<never>)
      | undefined;

    expect(successHandler).toBeTruthy();
    expect(responseInterceptor).toBeTruthy();

    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    await expect(responseInterceptor?.({ response: { status: 401 } })).rejects.toEqual({
      response: { status: 401 },
    });
  });
});