import { handler } from 'functions/transcribe-handler/index';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { TranscriptionJobStatus } from '@aws-sdk/client-transcribe';

const mockTranscribeSend = jest.fn();
const mockS3Send = jest.fn().mockResolvedValue({});

jest.mock('@aws-sdk/client-transcribe', () => ({
  TranscribeClient: jest.fn(() => ({ send: mockTranscribeSend })),
  StartTranscriptionJobCommand: jest.fn(),
  GetTranscriptionJobCommand: jest.fn(),
  TranscriptionJobStatus: {
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    IN_PROGRESS: 'IN_PROGRESS',
    QUEUED: 'QUEUED',
  },
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({ send: mockS3Send })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

// fetch のモック
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent =>
  ({
    httpMethod: 'POST',
    body: JSON.stringify({
      audio: Buffer.from('fake-audio-data').toString('base64'),
      mimeType: 'audio/webm',
    }),
    headers: { 'content-type': 'application/json' },
    isBase64Encoded: false,
    pathParameters: null,
    queryStringParameters: null,
    requestContext: { authorizer: { claims: { sub: 'user-123' } } },
    ...overrides,
  } as unknown as APIGatewayProxyEvent);

const makeTranscribeCompletedResponse = (transcript: string) => ({
  TranscriptionJob: {
    TranscriptionJobStatus: TranscriptionJobStatus.COMPLETED,
    Transcript: {
      TranscriptFileUri: 'https://s3.amazonaws.com/bucket/transcript.json',
    },
  },
});

beforeEach(() => {
  process.env.S3_BUCKET_AUDIO = 'test-audio-bucket';
  process.env.TRANSCRIBE_POLL_INTERVAL_MS = '0';
  process.env.TRANSCRIBE_POLL_MAX_ATTEMPTS = '3';

  mockS3Send.mockResolvedValue({});
  mockTranscribeSend
    .mockResolvedValueOnce({}) // StartTranscriptionJobCommand
    .mockResolvedValueOnce(makeTranscribeCompletedResponse('Hello world')); // GetTranscriptionJobCommand

  mockFetch.mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({
      results: { transcripts: [{ transcript: 'Hello world' }] },
    }),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('transcribe-handler', () => {
  it('正常な音声データで 200 と transcript を返す', async () => {
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body) as { success: boolean; transcript: string };
    expect(body.success).toBe(true);
    expect(body.transcript).toBe('Hello world');
  });

  it('userId がない場合 401 を返す', async () => {
    const result = await handler(mockEvent({ requestContext: { authorizer: null } as never }));
    expect(result.statusCode).toBe(401);
  });

  it('body が null の場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: null }));
    expect(result.statusCode).toBe(400);
  });

  it('JSON ボディで audio フィールドがない場合 400 を返す', async () => {
    const result = await handler(mockEvent({ body: JSON.stringify({ mimeType: 'audio/webm' }) }));
    expect(result.statusCode).toBe(400);
  });

  it('S3_BUCKET_AUDIO 未設定時に 500 を返す', async () => {
    delete process.env.S3_BUCKET_AUDIO;
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    process.env.S3_BUCKET_AUDIO = 'test-audio-bucket';
  });

  it('isBase64Encoded=true の場合（multipart/form-data）も正常動作する', async () => {
    const result = await handler(
      mockEvent({
        isBase64Encoded: true,
        body: Buffer.from('fake-audio-data').toString('base64'),
        headers: { 'content-type': 'audio/webm' },
      }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('Transcribe ジョブが FAILED の場合 500 を返す', async () => {
    mockTranscribeSend
      .mockResolvedValueOnce({}) // StartTranscriptionJobCommand
      .mockResolvedValueOnce({
        TranscriptionJob: {
          TranscriptionJobStatus: TranscriptionJobStatus.FAILED,
          FailureReason: 'Invalid audio format',
        },
      });
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toContain('Invalid audio format');
  });

  it('Transcribe ジョブがタイムアウトした場合 500 を返す', async () => {
    mockTranscribeSend
      .mockResolvedValueOnce({}) // StartTranscriptionJobCommand
      .mockResolvedValue({
        TranscriptionJob: {
          TranscriptionJobStatus: TranscriptionJobStatus.IN_PROGRESS,
        },
      });
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toContain('timed out');
  });

  it('Transcript URI が missing の場合 500 を返す', async () => {
    mockTranscribeSend
      .mockResolvedValueOnce({}) // StartTranscriptionJobCommand
      .mockResolvedValueOnce({
        TranscriptionJob: {
          TranscriptionJobStatus: TranscriptionJobStatus.COMPLETED,
          Transcript: { TranscriptFileUri: undefined },
        },
      });
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toContain('Transcript URI is missing');
  });

  it('transcript fetch が失敗した場合 500 を返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toContain('Failed to fetch transcript');
  });

  it('mimeType が wav の場合も正常動作する', async () => {
    const result = await handler(
      mockEvent({
        body: JSON.stringify({
          audio: Buffer.from('fake-audio-data').toString('base64'),
          mimeType: 'audio/wav',
        }),
      }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('mimeType が不明な場合は webm にフォールバックする', async () => {
    const result = await handler(
      mockEvent({
        body: JSON.stringify({
          audio: Buffer.from('fake-audio-data').toString('base64'),
          mimeType: 'audio/unknown',
        }),
      }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('Error 以外の例外発生時に 500 を返す', async () => {
    mockS3Send.mockRejectedValueOnce('string error');
    const result = await handler(mockEvent());
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body) as { message: string };
    expect(body.message).toBe('Internal Server Error');
  });
});
