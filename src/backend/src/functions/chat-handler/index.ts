
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SynthesizeSpeechCommand, OutputFormat, VoiceId, Engine } from '@aws-sdk/client-polly';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { getDynamoDbClient } from '../../shared/clients/dynamodb';
import { getBedrockClient } from '../../shared/clients/bedrock';
import { getPollyClient, getS3Client, getSqsClient } from '../../shared/clients/aws';
import { createResponse, TABLE_NAMES } from '../../shared/types/index';
import type { ChatLogEntity } from '../../shared/types/entities';
import { withRetry } from '../../shared/utils/retry';

const MODEL_ID = 'anthropic.claude-sonnet-4-6';

// SQS送信トリガーとなる会話ターン数
const FEEDBACK_TRIGGER_TURNS = 5;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  userMessage?: string;
  conversationHistory?: ConversationMessage[];
}

interface BedrockResponse {
  content: Array<{ type: string; text: string }>;
}

/**
 * チャットハンドラー
 * - Bedrock (Claude) を呼び出してAI応答を生成
 * - Polly で音声合成して S3 に保存
 * - SQS にフィードバック生成リクエストを送信
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


    // パスパラメータから sessionId を取得
    const sessionId = event.pathParameters?.['sessionId'];
    if (!sessionId) {
      return createResponse(400, { message: 'sessionId is required' });
    }

    // リクエストボディのバリデーション
    if (!event.body) {
      return createResponse(400, { message: 'Request body is required' });
    }
    const body = JSON.parse(event.body) as ChatRequestBody;
    const { userMessage, conversationHistory = [] } = body;

    if (!userMessage) {
      return createResponse(400, { message: 'userMessage is required' });
    }

    // 環境変数チェック（テンプレートでは S3_BUCKET_AUDIO として設定）
    const audioBucketName = process.env.S3_BUCKET_AUDIO ?? process.env.AUDIO_BUCKET_NAME;
    if (!audioBucketName) {
      throw new Error('AUDIO_BUCKET_NAME environment variable is not set');
    }

    // 1. Bedrock (Claude) でAI返答を生成
    const aiMessage = await withRetry(() =>
      invokeBedrockChat(userMessage, conversationHistory),
    );

    // 2. ユーザー発言をDynamoDBに保存
    const userTurnId = randomUUID();
    const now = new Date().toISOString();
    const db = getDynamoDbClient();

    const userLog: ChatLogEntity = {
      sessionId,
      turnId: userTurnId,
      userId,
      role: 'user',
      content: userMessage,
      timestamp: now,
    };
    await db.send(new PutCommand({ TableName: TABLE_NAMES.CHAT_LOGS, Item: userLog }));



    // 3. Polly で音声合成 → S3 に保存
    const aiTurnId = randomUUID();
    const audioS3Key = await synthesizeAndUpload(aiMessage, aiTurnId, audioBucketName);

    // 4. AI返答をDynamoDBに保存
    const aiLog: ChatLogEntity = {
      sessionId,
      turnId: aiTurnId,
      userId,
      role: 'assistant',
      content: aiMessage,
      audioS3Key,
      timestamp: new Date().toISOString(),
    };
    await db.send(new PutCommand({ TableName: TABLE_NAMES.CHAT_LOGS, Item: aiLog }));

    // 5. セッションのターン数をインクリメント
    const newTotalTurns = conversationHistory.length + 1;
    await db.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.SESSIONS,
        Key: { sessionId },
        UpdateExpression: 'SET totalTurns = :turns',
        ExpressionAttributeValues: { ':turns': newTotalTurns },
      }),
    );

    // 6. 一定ターン数に達したらSQSでフィードバック生成をトリガー
    if (newTotalTurns >= FEEDBACK_TRIGGER_TURNS) {
      const feedbackQueueUrl = process.env.FEEDBACK_QUEUE_URL;
      if (!feedbackQueueUrl) {
        throw new Error('FEEDBACK_QUEUE_URL environment variable is not set');
      }
      const sqs = getSqsClient();
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: feedbackQueueUrl,
          MessageBody: JSON.stringify({ sessionId, userId }),
        }),
      );
    }

    // 7. S3署名付きURLを生成（簡易実装：S3キーをそのまま返す）
    const audioUrl = `https://${audioBucketName}.s3.amazonaws.com/${audioS3Key}`;

    return createResponse(200, {
      chatLogId: aiTurnId,
      aiMessage,
      audioUrl,
      timestamp: aiLog.timestamp,
    });
  } catch (error) {

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createResponse(500, { message });
  }
};


/**
 * Bedrock (Claude) を呼び出してAI返答テキストを生成する
 */
const invokeBedrockChat = async (
  userMessage: string,
  conversationHistory: ConversationMessage[],
): Promise<string> => {
  const bedrock = getBedrockClient();

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 512,
      system:
        'You are an English conversation partner helping IT engineers practice business English. ' +
        'Respond naturally and concisely in English. Keep responses under 3 sentences.',
      messages,
    }),
  });

  const response = await bedrock.send(command);
  const result = JSON.parse(
    new TextDecoder().decode(response.body),
  ) as BedrockResponse;

  return result.content[0]?.text ?? '';
};

/**
 * Polly で音声合成し、S3 に保存して S3 キーを返す
 */
const synthesizeAndUpload = async (
  text: string,
  turnId: string,
  bucketName: string,
): Promise<string> => {
  const polly = getPollyClient();

  const pollyResponse = await polly.send(
    new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: OutputFormat.MP3,
      VoiceId: VoiceId.Joanna,
      Engine: Engine.NEURAL,
    }),
  );

  if (!pollyResponse.AudioStream) {
    throw new Error('Polly did not return AudioStream');
  }

  const audioBytes = await pollyResponse.AudioStream.transformToByteArray();
  const s3Key = `audio/${turnId}.mp3`;

  const s3 = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: audioBytes,
      ContentType: 'audio/mpeg',
    }),
  );

  return s3Key;
};
