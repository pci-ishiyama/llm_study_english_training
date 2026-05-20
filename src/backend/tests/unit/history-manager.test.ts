import { handler } from 'functions/history-manager/index';
import type { APIGatewayProxyEvent } from 'aws-lambda';

const mockDbSend = jest.fn();

jest.mock('shared/clients/dynamodb', () => ({
  getDynamoDbClient: jest.fn(() => ({ send: mockDbSend })),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  QueryCommand: jest.fn(),
}));

const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent =>
  ({
    httpMethod: 'GET',
    body: null,
    headers: {},
    pathParameters: null,
    queryStringParameters: null,
    resource: '/history',
    requestContext: { authorizer: { claims: { sub: 'user-123' } } },
    ...overrides,
  } as unknown as APIGatewayProxyEvent);

beforeEach(() => {
  mockDbSend.mockResolvedValue({ Items: [], Count: 0 });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('history-manager', () => {
  // ─── 認証 ───────────────────────────────────────────────
  it('userId がない場合 401 を返す', async () => {
    const result = await handler(mockEvent({ requestContext: { authorizer: null } as never }));
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Unauthorized');
  });

  // ─── GET: 履歴一覧 ──────────────────────────────────────
  it('GET /history: セッション履歴一覧を返す', async () => {
    const mockSessions = [
      { sessionId: 'session-001', userId: 'user-123', scenarioId: 'scenario-001', status: 'completed' },
      { sessionId: 'session-002', userId: 'user-123', scenarioId: 'scenario-002', status: 'completed' },
    ];
    mockDbSend.mockResolvedValueOnce({ Items: mockSessions, Count: 2 });

    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { sessions: unknown[]; count: number; nextToken?: string };
    expect(body.sessions).toHaveLength(2);
    expect(body.count).toBe(2);
    expect(body.nextToken).toBeUndefined();
  });

  it('GET /history: Items が undefined の場合も空配列を返す', async () => {
    mockDbSend.mockResolvedValueOnce({ Items: undefined, Count: undefined });

    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { sessions: unknown[]; count: number };
    expect(body.sessions).toHaveLength(0);
    expect(body.count).toBe(0);
  });

  it('GET /history: limit クエリパラメータを受け付ける', async () => {
    mockDbSend.mockResolvedValueOnce({ Items: [], Count: 0 });

    const result = await handler(mockEvent({
      queryStringParameters: { limit: '5' },
    }));
    expect(result.statusCode).toBe(200);
    // QueryCommand に Limit: 5 が渡されていることを確認
    const queryCommandMock = jest.requireMock('@aws-sdk/lib-dynamodb').QueryCommand as jest.Mock;
    const callArg = queryCommandMock.mock.calls[0][0] as { Limit: number };
    expect(callArg.Limit).toBe(5);
  });

  it('GET /history: LastEvaluatedKey がある場合 nextToken を返す', async () => {
    const lastKey = { sessionId: 'session-001', userId: 'user-123' };
    mockDbSend.mockResolvedValueOnce({ Items: [], Count: 0, LastEvaluatedKey: lastKey });

    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { nextToken: string };
    expect(body.nextToken).toBeDefined();
    // nextToken は base64 エンコードされた JSON
    const decoded = JSON.parse(Buffer.from(body.nextToken, 'base64').toString()) as typeof lastKey;
    expect(decoded).toEqual(lastKey);
  });

  it('GET /history: nextToken クエリパラメータを ExclusiveStartKey として渡す', async () => {
    const lastKey = { sessionId: 'session-001', userId: 'user-123' };
    const nextToken = Buffer.from(JSON.stringify(lastKey)).toString('base64');
    mockDbSend.mockResolvedValueOnce({ Items: [], Count: 0 });

    const result = await handler(mockEvent({
      queryStringParameters: { nextToken },
    }));
    expect(result.statusCode).toBe(200);
    const queryCommandMock = jest.requireMock('@aws-sdk/lib-dynamodb').QueryCommand as jest.Mock;
    const callArg = queryCommandMock.mock.calls[0][0] as { ExclusiveStartKey: typeof lastKey };
    expect(callArg.ExclusiveStartKey).toEqual(lastKey);
  });

  // ─── GET: チャットログ ───────────────────────────────────
  it('GET /sessions/:id/logs: チャットログ一覧を返す', async () => {
    const mockLogs = [
      { logId: 'log-001', sessionId: 'session-001', userId: 'user-123', role: 'user', message: 'Hello' },
      { logId: 'log-002', sessionId: 'session-001', userId: 'user-123', role: 'assistant', message: 'Hi!' },
    ];
    mockDbSend.mockResolvedValueOnce({ Items: mockLogs, Count: 2 });

    const result = await handler(mockEvent({
      pathParameters: { sessionId: 'session-001' },
      resource: '/sessions/{sessionId}/logs',
    }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { logs: unknown[]; count: number };
    expect(body.logs).toHaveLength(2);
    expect(body.count).toBe(2);
  });

  it('GET /sessions/:id/logs: ログが空の場合も 200 を返す', async () => {
    mockDbSend.mockResolvedValueOnce({ Items: undefined, Count: undefined });

    const result = await handler(mockEvent({
      pathParameters: { sessionId: 'session-001' },
      resource: '/sessions/{sessionId}/logs',
    }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { logs: unknown[]; count: number };
    expect(body.logs).toHaveLength(0);
    expect(body.count).toBe(0);
  });

  it('GET /sessions/:id/logs: sessionId はあるが resource が /logs で終わらない場合は履歴一覧を返す', async () => {
    mockDbSend.mockResolvedValueOnce({ Items: [], Count: 0 });

    const result = await handler(mockEvent({
      pathParameters: { sessionId: 'session-001' },
      resource: '/sessions/{sessionId}',
    }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { sessions: unknown[] };
    // sessions キーが存在すること（履歴一覧のレスポンス形式）
    expect(body).toHaveProperty('sessions');
  });

  // ─── エラーハンドリング ──────────────────────────────────
  it('DB エラー発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce(new Error('DynamoDB connection failed'));

    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('DynamoDB connection failed');
  });

  it('Error 以外の例外発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce('unknown error');

    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Internal Server Error');
  });
});
