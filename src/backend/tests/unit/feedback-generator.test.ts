import { handler } from 'functions/feedback-generator/index';
import type { SQSEvent } from 'aws-lambda';

const mockDbSend = jest.fn();

jest.mock('shared/clients/dynamodb', () => ({
  getDynamoDbClient: jest.fn(() => ({ send: mockDbSend })),
}));

jest.mock('shared/clients/bedrock', () => ({
  getBedrockClient: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({
      body: new TextEncoder().encode(JSON.stringify({
        content: [{ type: 'text', text: JSON.stringify({
          overallScore: 80, grammarScore: 75, vocabularyScore: 85,
          fluencyScore: 80, suggestions: ['Practice more'], detailedFeedback: 'Good job!',
        }) }],
      })),
    }),
  })),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  QueryCommand: jest.fn(),
  PutCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  InvokeModelCommand: jest.fn(),
}));

const mockLogs = [
  { sessionId: 'session-abc', turnId: 'turn-1', userId: 'user-123', role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
  { sessionId: 'session-abc', turnId: 'turn-2', userId: 'user-123', role: 'assistant', content: 'Hi there!', timestamp: '2024-01-01T00:00:01Z' },
];

const mockSqsEvent = (body: Record<string, unknown>): SQSEvent => ({
  Records: [{
    messageId: 'msg-001', receiptHandle: 'receipt-001',
    body: JSON.stringify(body),
    attributes: { ApproximateReceiveCount: '1', SentTimestamp: '1234567890', SenderId: 'sender-001', ApproximateFirstReceiveTimestamp: '1234567890' },
    messageAttributes: {}, md5OfBody: 'md5', eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:us-east-1:123:test', awsRegion: 'us-east-1',
  }],
});

beforeEach(() => {
  process.env.BEDROCK_REGION = 'us-east-1';
  mockDbSend.mockResolvedValue({ Items: mockLogs, Count: 2 });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('feedback-generator', () => {
  it('sessionId と userId が含まれる SQS メッセージを正常処理する', async () => {
    await expect(handler(mockSqsEvent({ sessionId: 'session-abc', userId: 'user-123' }))).resolves.toBeUndefined();
  });

  it('sessionId がない場合エラーをスローする', async () => {
    await expect(handler(mockSqsEvent({ userId: 'user-123' }))).rejects.toThrow(
      'sessionId and userId are required in SQS message body',
    );
  });

  it('userId がない場合エラーをスローする', async () => {
    await expect(handler(mockSqsEvent({ sessionId: 'session-abc' }))).rejects.toThrow(
      'sessionId and userId are required in SQS message body',
    );
  });

  it('チャットログが空の場合は何もしない', async () => {
    mockDbSend.mockResolvedValueOnce({ Items: [], Count: 0 });
    await expect(handler(mockSqsEvent({ sessionId: 'session-empty', userId: 'user-123' }))).resolves.toBeUndefined();
  });

  it('DynamoDB が Items を返さない場合は何もしない', async () => {
    mockDbSend.mockResolvedValueOnce({ Count: 0 });
    await expect(handler(mockSqsEvent({ sessionId: 'session-no-items', userId: 'user-123' }))).resolves.toBeUndefined();
  });

  it('Bedrock が content[0] を返さない場合は空オブジェクトとして処理する', async () => {
    const { getBedrockClient } = jest.requireMock('shared/clients/bedrock') as {
      getBedrockClient: jest.Mock;
    };
    getBedrockClient.mockReturnValueOnce({
      send: jest.fn().mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({ content: [] })),
      }),
    });
    await expect(handler(mockSqsEvent({ sessionId: 'session-abc', userId: 'user-123' }))).resolves.toBeUndefined();
  });
});
