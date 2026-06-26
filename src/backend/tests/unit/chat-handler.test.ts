import { handler } from 'functions/chat-handler/index';
import type { APIGatewayProxyEvent } from 'aws-lambda';

const mockDbSend = jest.fn();
const mockBedrockSend = jest.fn();
const mockPollySend = jest.fn();
const mockS3Send = jest.fn().mockResolvedValue({});
const mockSqsSend = jest.fn().mockResolvedValue({});

jest.mock('shared/clients/dynamodb', () => ({
  getDynamoDbClient: jest.fn(() => ({ send: mockDbSend })),
}));

jest.mock('shared/clients/bedrock', () => ({
  getBedrockClient: jest.fn(() => ({ send: mockBedrockSend })),
}));

jest.mock('shared/clients/aws', () => ({
  getPollyClient: jest.fn(() => ({ send: mockPollySend })),
  getS3Client: jest.fn(() => ({ send: mockS3Send })),
  getSqsClient: jest.fn(() => ({ send: mockSqsSend })),
}));

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  InvokeModelCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-polly', () => ({
  SynthesizeSpeechCommand: jest.fn(),
  OutputFormat: { MP3: 'mp3' },
  VoiceId: { Joanna: 'Joanna' },
  Engine: { NEURAL: 'neural' },
}));

jest.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-sqs', () => ({
  SendMessageCommand: jest.fn(),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
}));

const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent =>
  ({
    httpMethod: 'POST',
    body: JSON.stringify({ userMessage: 'Hello', conversationHistory: [] }),
    headers: {},
    pathParameters: { sessionId: 'session-001' },
    queryStringParameters: null,
    requestContext: { authorizer: { claims: { sub: 'user-123' } } },
    ...overrides,
  } as unknown as APIGatewayProxyEvent);

const makeBedrockBody = (text: string) =>
  new TextEncoder().encode(JSON.stringify({ content: [{ type: 'text', text }] }));

beforeEach(() => {
  process.env.BEDROCK_REGION = 'us-east-1';
  process.env.AUDIO_BUCKET_NAME = 'test-bucket';
  process.env.FEEDBACK_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/test-queue';
  mockDbSend.mockResolvedValue({});
  mockBedrockSend.mockResolvedValue({ body: makeBedrockBody('Hello! How can I help you?') });
  mockPollySend.mockResolvedValue({
    AudioStream: { transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])) },
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('chat-handler', () => {
  it('認証済みリクエストで 200 を返す', async () => {
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { aiMessage: string };
    expect(body.aiMessage).toBe('Hello! How can I help you?');
  });

  it('userId がない場合 401 を返す', async () => {
    const result = await handler(mockEvent({ requestContext: { authorizer: null } as never }));
    expect(result.statusCode).toBe(401);
  });

    it('sessionId がない場合 400 を返す', async () => {
    const result = await handler(mockEvent({ pathParameters: null }));
    expect(result.statusCode).toBe(400);
  });

  it('userMessage がない場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: JSON.stringify({}) }));
    expect(result.statusCode).toBe(400);
  });

  it('body が null の場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: null }));
    expect(result.statusCode).toBe(400);
  });

    it('conversationHistory を省略しても正常動作する', async () => {
    const result = await handler(mockEvent({
      body: JSON.stringify({ userMessage: 'Hello' }),
    }));
    expect(result.statusCode).toBe(200);
  });

    it('5ターン目に SQS へフィードバックリクエストを送信する', async () => {
    const history = Array.from({ length: 4 }, (_, i) => ({ role: 'user' as const, content: String(i) }));
    const result = await handler(mockEvent({
      body: JSON.stringify({ userMessage: 'Hello', conversationHistory: history }),
    }));
    expect(result.statusCode).toBe(200);
  });

  it('Bedrock が content[0] を返さない場合でも 200 を返す', async () => {
    mockBedrockSend.mockResolvedValueOnce({
      body: new TextEncoder().encode(JSON.stringify({ content: [] })),
    });
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(200);
  });

  it('AUDIO_BUCKET_NAME 未設定時に 500 を返す', async () => {
    delete process.env.AUDIO_BUCKET_NAME;
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    process.env.AUDIO_BUCKET_NAME = 'test-bucket';
  });

  it('Polly が AudioStream を返さない場合に 500 を返す', async () => {
    mockPollySend.mockResolvedValueOnce({ AudioStream: null });
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
  });

    it('FEEDBACK_QUEUE_URL 未設定時でも 5 ターン目は 500 を返す', async () => {
    delete process.env.FEEDBACK_QUEUE_URL;
    const history = Array.from({ length: 4 }, (_, i) => ({ role: 'user' as const, content: String(i) }));
    const result = await handler(mockEvent({
      body: JSON.stringify({ userMessage: 'Hello', conversationHistory: history }),
    }));
    expect(result.statusCode).toBe(500);
    process.env.FEEDBACK_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/test-queue';
  });

  it('DB エラー発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce(new Error('DB error'));
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('DB error');
  });

  it('Error 以外の例外発生時に 500 を返す', async () => {
    mockDbSend.mockRejectedValueOnce('string error');
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Internal Server Error');
  });
});
