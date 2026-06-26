import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  TranscriptionJobStatus,
} from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { createResponse } from '../../shared/types/index';

const TRANSCRIBE_REGION = process.env.TRANSCRIBE_REGION ?? process.env.DYNAMODB_REGION ?? 'ap-northeast-1';
const POLL_INTERVAL_MS = parseInt(process.env.TRANSCRIBE_POLL_INTERVAL_MS ?? '1000', 10);
const POLL_MAX_ATTEMPTS = parseInt(process.env.TRANSCRIBE_POLL_MAX_ATTEMPTS ?? '30', 10);

let _transcribe: TranscribeClient | undefined;
let _s3: S3Client | undefined;

const getTranscribeClient = (): TranscribeClient => {
  if (!_transcribe) {
    _transcribe = new TranscribeClient({ region: TRANSCRIBE_REGION });
  }
  return _transcribe;
};

const getS3Client = (): S3Client => {
  if (!_s3) {
    _s3 = new S3Client({ region: TRANSCRIBE_REGION });
  }
  return _s3;
};

interface TranscribeRequestBody {
  audio?: string;       // Base64エンコードされた音声データ（multipart/form-data 非対応のため）
  mimeType?: string;    // 例: 'audio/webm', 'audio/wav'
}

/**
 * 音声データを Amazon Transcribe でテキストに変換する
 * フロントエンドは multipart/form-data で Blob を送信するため、
 * API Gateway の Binary Media Types 設定が必要。
 * ここでは Base64 エンコードされたボディを受け取る。
 */
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // 認証チェック
    const claims = event.requestContext.authorizer?.claims as
      | Record<string, string>
      | undefined;
    const userId = claims?.['sub'];
    if (!userId) {
      return createResponse(401, { message: 'Unauthorized' });
    }

    // 環境変数チェック
    const audioBucketName = process.env.S3_BUCKET_AUDIO;
    if (!audioBucketName) {
      throw new Error('S3_BUCKET_AUDIO environment variable is not set');
    }

    // リクエストボディのパース
    if (!event.body) {
      return createResponse(400, { message: 'Request body is required' });
    }

    let audioBuffer: Buffer;
    let mediaFormat: string;

    if (event.isBase64Encoded) {
      // API Gateway Binary Media Types 経由（multipart/form-data）
      audioBuffer = Buffer.from(event.body, 'base64');
      const contentType = event.headers['content-type'] ?? event.headers['Content-Type'] ?? '';
      mediaFormat = resolveMediaFormat(contentType);
    } else {
      // JSON ボディ経由（Base64エンコードされた音声データ）
      const body = JSON.parse(event.body) as TranscribeRequestBody;
      if (!body.audio) {
        return createResponse(400, { message: 'audio is required' });
      }
      audioBuffer = Buffer.from(body.audio, 'base64');
      mediaFormat = resolveMediaFormat(body.mimeType ?? '');
    }

    // S3 に音声ファイルをアップロード
    const jobId = randomUUID();
    const s3Key = `transcribe-input/${userId}/${jobId}.${mediaFormat}`;
    const s3 = getS3Client();

    await s3.send(
      new PutObjectCommand({
        Bucket: audioBucketName,
        Key: s3Key,
        Body: audioBuffer,
        ContentType: `audio/${mediaFormat}`,
      }),
    );

    // Amazon Transcribe ジョブを開始
    const transcribe = getTranscribeClient();
    const jobName = `it-english-${jobId}`;
    const mediaUri = `s3://${audioBucketName}/${s3Key}`;

    await transcribe.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: 'en-US',
        MediaFormat: mediaFormat as 'webm' | 'wav' | 'mp3' | 'mp4' | 'ogg' | 'flac',
        Media: { MediaFileUri: mediaUri },
        Settings: {
          ShowSpeakerLabels: false,
          MaxSpeakerLabels: undefined,
        },
      }),
    );

    // ジョブ完了をポーリング
    const transcript = await pollTranscriptionJob(transcribe, jobName);

    // 一時ファイルを S3 から削除（非同期・エラーは無視）
    s3.send(new DeleteObjectCommand({ Bucket: audioBucketName, Key: s3Key })).catch(() => undefined);

    return createResponse(200, {
      success: true,
      transcript,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createResponse(500, { message });
  }
};

/**
 * Transcribe ジョブの完了をポーリングして文字起こし結果を返す
 */
const pollTranscriptionJob = async (
  transcribe: TranscribeClient,
  jobName: string,
): Promise<string> => {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const result = await transcribe.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }),
    );

    const job = result.TranscriptionJob;
    const status = job?.TranscriptionJobStatus;

    if (status === TranscriptionJobStatus.COMPLETED) {
      const transcriptUri = job?.Transcript?.TranscriptFileUri;
      if (!transcriptUri) {
        throw new Error('Transcript URI is missing');
      }
      return await fetchTranscriptText(transcriptUri);
    }

    if (status === TranscriptionJobStatus.FAILED) {
      const reason = job?.FailureReason ?? 'Unknown failure';
      throw new Error(`Transcription job failed: ${reason}`);
    }

    // IN_PROGRESS / QUEUED の場合は待機
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Transcription job timed out');
};

/**
 * Transcribe が生成した JSON ファイルから文字起こしテキストを取得する
 */
const fetchTranscriptText = async (transcriptUri: string): Promise<string> => {
  const response = await fetch(transcriptUri);
  if (!response.ok) {
    throw new Error(`Failed to fetch transcript: ${response.statusText}`);
  }
  const json = await response.json() as {
    results?: { transcripts?: Array<{ transcript: string }> };
  };
  return json.results?.transcripts?.[0]?.transcript ?? '';
};

/**
 * Content-Type または mimeType から Transcribe の MediaFormat を解決する
 */
const resolveMediaFormat = (contentTypeOrMime: string): string => {
  const lower = contentTypeOrMime.toLowerCase();
  if (lower.includes('webm')) return 'webm';
  if (lower.includes('wav')) return 'wav';
  if (lower.includes('mp4')) return 'mp4';
  if (lower.includes('ogg')) return 'ogg';
  if (lower.includes('flac')) return 'flac';
  if (lower.includes('mp3')) return 'mp3';
  // デフォルトは webm（ブラウザの MediaRecorder デフォルト）
  return 'webm';
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
