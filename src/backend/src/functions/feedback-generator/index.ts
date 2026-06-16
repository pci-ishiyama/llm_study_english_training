import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { SQSEvent } from 'aws-lambda';
import { getDynamoDbClient } from '../../shared/clients/dynamodb';
import { getBedrockClient } from '../../shared/clients/bedrock';
import { TABLE_NAMES } from '../../shared/types/index';
import type { ChatLogEntity, FeedbackEntity } from '../../shared/types/entities';
import { withRetry } from '../../shared/utils/retry';
import { randomUUID } from 'crypto';

const MODEL_ID = 'anthropic.claude-sonnet-4-6';

interface FeedbackResult {
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  suggestions: string[];
  detailedFeedback: string;
}

interface BedrockResponse {
  content: Array<{ type: string; text: string }>;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body) as { sessionId?: string; userId?: string };
    if (!body.sessionId || !body.userId) {
      throw new Error('sessionId and userId are required in SQS message body');
    }
    await generateFeedback(body.sessionId, body.userId);
  }
};

const generateFeedback = async (sessionId: string, userId: string): Promise<void> => {
  const db = getDynamoDbClient();
  const logsResult = await db.send(new QueryCommand({
    TableName: TABLE_NAMES.CHAT_LOGS,
    KeyConditionExpression: 'sessionId = :sid',
    ExpressionAttributeValues: { ':sid': sessionId },
    ScanIndexForward: true,
  }));
  const logs = (logsResult.Items ?? []) as ChatLogEntity[];
  if (logs.length === 0) return;

  const feedback = await withRetry(() => invokeFeedbackGeneration(logs));

  const feedbackEntity: FeedbackEntity = {
    feedbackId: randomUUID(),
    sessionId,
    userId,
    overallScore: feedback.overallScore,
    grammarScore: feedback.grammarScore,
    vocabularyScore: feedback.vocabularyScore,
    fluencyScore: feedback.fluencyScore,
    suggestions: feedback.suggestions,
    detailedFeedback: feedback.detailedFeedback,
    createdAt: new Date().toISOString(),
  };
  await db.send(new PutCommand({ TableName: TABLE_NAMES.FEEDBACKS, Item: feedbackEntity }));
};

const invokeFeedbackGeneration = async (logs: ChatLogEntity[]): Promise<FeedbackResult> => {
  const bedrock = getBedrockClient();
  const conversation = logs.map((log) => log.role.toUpperCase() + ': ' + log.content).join('\n');
  const jsonTemplate = JSON.stringify({
    overallScore: 0, grammarScore: 0, vocabularyScore: 0,
    fluencyScore: 0, suggestions: [], detailedFeedback: '',
  });
  const prompt = [
    'Analyze the following English conversation and provide feedback in JSON format.',
    'Conversation:', conversation, '',
    'Respond ONLY with valid JSON in this exact format:', jsonTemplate,
  ].join('\n');

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const response = await bedrock.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body)) as BedrockResponse;
  const text = result.content[0]?.text ?? '{}';
  return JSON.parse(text) as FeedbackResult;
};