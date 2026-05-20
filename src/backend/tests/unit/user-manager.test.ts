import { handler } from 'functions/user-manager/index';
import type { APIGatewayProxyEvent } from 'aws-lambda';

const mockDbSend = jest.fn();

jest.mock('shared/clients/dynamodb', () => ({
  getDynamoDbClient: jest.fn(() => ({ send: mockDbSend })),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  UpdateCommand: jest.fn(),
}));

const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent =>
  ({
    httpMethod: 'POST',
    body: JSON.stringify({ email: 'test@example.com', displayName: 'Test User' }),
    headers: {},
    pathParameters: null,
    queryStringParameters: null,
    requestContext: { authorizer: { claims: { sub: 'user-123' } } },
    ...overrides,
  } as unknown as APIGatewayProxyEvent);

beforeEach(() => {
  mockDbSend.mockResolvedValue({});
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('user-manager', () => {
  // ─── 認証 ───────────────────────────────────────────────
  it('userId がない場合 401 を返す', async () => {
    const result = await handler(mockEvent({ requestContext: { authorizer: null } as never }));
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Unauthorized');
  });

  // ─── POST: ユーザー作成 ──────────────────────────────────
  it('POST: 正常なリクエストで 201 とユーザー情報を返す', async () => {
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body) as {
      userId: string;
      email: string;
      displayName: string;
      nativeLanguage: string;
      targetLevel: string;
    };
    expect(body.userId).toBe('user-123');
    expect(body.email).toBe('test@example.com');
    expect(body.displayName).toBe('Test User');
    expect(body.nativeLanguage).toBe('ja');
    expect(body.targetLevel).toBe('beginner');
  });

  it('POST: email がない場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: JSON.stringify({ displayName: 'Test User' }) }));
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('email and displayName are required');
  });

  it('POST: displayName がない場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: JSON.stringify({ email: 'test@example.com' }) }));
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('email and displayName are required');
  });

  it('POST: body が null の場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: null }));
    expect(result.statusCode).toBe(400);
  });

  it('POST: nativeLanguage と targetLevel を省略した場合デフォルト値が設定される', async () => {
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body) as { nativeLanguage: string; targetLevel: string };
    expect(body.nativeLanguage).toBe('ja');
    expect(body.targetLevel).toBe('beginner');
  });

  it('POST: nativeLanguage と targetLevel を指定した場合その値が使われる', async () => {
    const result = await handler(mockEvent({
      body: JSON.stringify({ email: 'test@example.com', displayName: 'Test User', nativeLanguage: 'en', targetLevel: 'advanced' }),
    }));
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body) as { nativeLanguage: string; targetLevel: string };
    expect(body.nativeLanguage).toBe('en');
    expect(body.targetLevel).toBe('advanced');
  });

  it('POST: DB エラー発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce(new Error('ConditionalCheckFailedException'));
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('ConditionalCheckFailedException');
  });

  // ─── GET: ユーザー取得 ───────────────────────────────────
  it('GET: pathParameters なしで自分のユーザー情報を返す', async () => {
    const mockUser = { userId: 'user-123', email: 'test@example.com', displayName: 'Test User' };
    mockDbSend.mockResolvedValueOnce({ Item: mockUser });

    const result = await handler(mockEvent({ httpMethod: 'GET' }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { userId: string };
    expect(body.userId).toBe('user-123');
  });

  it('GET: pathParameters に userId を指定して特定ユーザーを取得する', async () => {
    const mockUser = { userId: 'other-user', email: 'other@example.com', displayName: 'Other User' };
    mockDbSend.mockResolvedValueOnce({ Item: mockUser });

    const result = await handler(mockEvent({
      httpMethod: 'GET',
      pathParameters: { userId: 'other-user' },
    }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { userId: string };
    expect(body.userId).toBe('other-user');
  });

  it('GET: 存在しないユーザーの場合 404 を返す', async () => {
    mockDbSend.mockResolvedValueOnce({ Item: undefined });

    const result = await handler(mockEvent({ httpMethod: 'GET' }));
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('User not found');
  });

  it('GET: DB エラー発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce(new Error('DB read error'));

    const result = await handler(mockEvent({ httpMethod: 'GET' }));
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('DB read error');
  });

  // ─── PUT: ユーザー更新 ───────────────────────────────────
  it('PUT: 自分のユーザー情報を更新して 200 を返す', async () => {
    const updatedUser = { userId: 'user-123', email: 'test@example.com', displayName: 'Updated Name', nativeLanguage: 'ja', targetLevel: 'intermediate' };
    mockDbSend.mockResolvedValueOnce({ Attributes: updatedUser });

    const result = await handler(mockEvent({
      httpMethod: 'PUT',
      body: JSON.stringify({ displayName: 'Updated Name', nativeLanguage: 'ja', targetLevel: 'intermediate' }),
      pathParameters: { userId: 'user-123' },
    }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { displayName: string };
    expect(body.displayName).toBe('Updated Name');
  });

  it('PUT: pathParameters なしで自分のユーザー情報を更新できる', async () => {
    const updatedUser = { userId: 'user-123', displayName: 'Updated Name' };
    mockDbSend.mockResolvedValueOnce({ Attributes: updatedUser });

    const result = await handler(mockEvent({
      httpMethod: 'PUT',
      body: JSON.stringify({ displayName: 'Updated Name' }),
    }));
    expect(result.statusCode).toBe(200);
  });

  it('PUT: 他ユーザーの情報を更新しようとした場合 403 を返す', async () => {
    const result = await handler(mockEvent({
      httpMethod: 'PUT',
      body: JSON.stringify({ displayName: 'Hacked Name' }),
      pathParameters: { userId: 'other-user' },
    }));
    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Forbidden');
  });

  it('PUT: DB エラー発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce(new Error('Update failed'));

    const result = await handler(mockEvent({
      httpMethod: 'PUT',
      body: JSON.stringify({ displayName: 'Updated Name' }),
    }));
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Update failed');
  });

  // ─── 未対応メソッド ──────────────────────────────────────
  it('DELETE: 未対応メソッドで 405 を返す', async () => {
    const result = await handler(mockEvent({ httpMethod: 'DELETE' }));
    expect(result.statusCode).toBe(405);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Method Not Allowed');
  });

  // ─── Error 以外の例外 ────────────────────────────────────
  it('Error 以外の例外発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce('string error');
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Internal Server Error');
  });
});
