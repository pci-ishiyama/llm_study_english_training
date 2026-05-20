import { handler } from 'functions/session-manager/index';
import type { APIGatewayProxyEvent } from 'aws-lambda';

const mockDbSend = jest.fn();

jest.mock('shared/clients/dynamodb', () => ({
  getDynamoDbClient: jest.fn(() => ({ send: mockDbSend })),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  QueryCommand: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mock-session-uuid'),
}));

const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent =>
  ({
    httpMethod: 'POST',
    body: JSON.stringify({ scenarioId: 'scenario-001' }),
    headers: {},
    pathParameters: null,
    queryStringParameters: null,
    resource: '/sessions',
    requestContext: { authorizer: { claims: { sub: 'user-123' } } },
    ...overrides,
  } as unknown as APIGatewayProxyEvent);

beforeEach(() => {
  mockDbSend.mockResolvedValue({});
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('session-manager', () => {
  // ─── 認証 ───────────────────────────────────────────────
  it('userId がない場合 401 を返す', async () => {
    const result = await handler(mockEvent({ requestContext: { authorizer: null } as never }));
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Unauthorized');
  });

  // ─── POST: セッション開始 ────────────────────────────────
  it('POST: 正常なリクエストで 201 とセッション情報を返す', async () => {
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body) as {
      sessionId: string;
      userId: string;
      scenarioId: string;
      status: string;
      totalTurns: number;
    };
    expect(body.sessionId).toBe('mock-session-uuid');
    expect(body.userId).toBe('user-123');
    expect(body.scenarioId).toBe('scenario-001');
    expect(body.status).toBe('active');
    expect(body.totalTurns).toBe(0);
  });

  it('POST: scenarioId がない場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: JSON.stringify({}) }));
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('scenarioId is required');
  });

  it('POST: body が null の場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: null }));
    expect(result.statusCode).toBe(400);
  });

  it('POST: DB エラー発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce(new Error('DynamoDB error'));
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('DynamoDB error');
  });

  it('POST: Error 以外の例外発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce('unknown error');
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Internal Server Error');
  });

  // ─── GET: セッション一覧 ─────────────────────────────────
  it('GET: sessionId なしでセッション一覧を返す', async () => {
    const mockSessions = [
      { sessionId: 'session-001', userId: 'user-123', scenarioId: 'scenario-001', status: 'completed' },
      { sessionId: 'session-002', userId: 'user-123', scenarioId: 'scenario-002', status: 'active' },
    ];
    mockDbSend.mockResolvedValueOnce({ Items: mockSessions, Count: 2 });

    const result = await handler(mockEvent({ httpMethod: 'GET' }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { sessions: unknown[]; count: number };
    expect(body.sessions).toHaveLength(2);
    expect(body.count).toBe(2);
  });

  it('GET: セッション一覧が空の場合も 200 を返す', async () => {
    mockDbSend.mockResolvedValueOnce({ Items: undefined, Count: undefined });

    const result = await handler(mockEvent({ httpMethod: 'GET' }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { sessions: unknown[]; count: number };
    expect(body.sessions).toHaveLength(0);
    expect(body.count).toBe(0);
  });

  // ─── GET: セッション詳細 ─────────────────────────────────
  it('GET: sessionId ありで特定セッションを返す', async () => {
    const mockSession = { sessionId: 'session-001', userId: 'user-123', scenarioId: 'scenario-001', status: 'active' };
    mockDbSend.mockResolvedValueOnce({ Item: mockSession });

    const result = await handler(mockEvent({
      httpMethod: 'GET',
      pathParameters: { sessionId: 'session-001' },
    }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { sessionId: string };
    expect(body.sessionId).toBe('session-001');
  });

  it('GET: 存在しないセッションの場合 404 を返す', async () => {
    mockDbSend.mockResolvedValueOnce({ Item: undefined });

    const result = await handler(mockEvent({
      httpMethod: 'GET',
      pathParameters: { sessionId: 'not-exist' },
    }));
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Session not found');
  });

  it('GET: 他ユーザーのセッションにアクセスした場合 403 を返す', async () => {
    const otherSession = { sessionId: 'session-001', userId: 'other-user', scenarioId: 'scenario-001', status: 'active' };
    mockDbSend.mockResolvedValueOnce({ Item: otherSession });

    const result = await handler(mockEvent({
      httpMethod: 'GET',
      pathParameters: { sessionId: 'session-001' },
    }));
    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Forbidden');
  });

  // ─── PUT: セッション終了 ─────────────────────────────────
  it('PUT: sessionId ありでセッションを終了し 200 を返す', async () => {
    const updatedSession = {
      sessionId: 'session-001',
      userId: 'user-123',
      status: 'completed',
      endedAt: '2024-01-01T00:00:00.000Z',
    };
    mockDbSend.mockResolvedValueOnce({ Attributes: updatedSession });

    const result = await handler(mockEvent({
      httpMethod: 'PUT',
      pathParameters: { sessionId: 'session-001' },
    }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { status: string };
    expect(body.status).toBe('completed');
  });

  it('PUT: sessionId なしの場合 400 を返す', async () => {
    const result = await handler(mockEvent({
      httpMethod: 'PUT',
      pathParameters: null,
    }));
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('sessionId is required');
  });

  // ─── 未対応メソッド ──────────────────────────────────────
  it('DELETE: 未対応メソッドで 405 を返す', async () => {
    const result = await handler(mockEvent({ httpMethod: 'DELETE' }));
    expect(result.statusCode).toBe(405);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Method Not Allowed');
  });
});
