import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDynamoDbClient } from '../../shared/clients/dynamodb';
import { createResponse, TABLE_NAMES } from '../../shared/types/index';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const claims = event.requestContext.authorizer?.claims as Record<string, string> | undefined;
    const userId = claims?.['sub'];
    if (!userId) return createResponse(401, { message: 'Unauthorized' });

    const sessionId = event.pathParameters?.sessionId;
    const isLogsRequest = event.resource?.endsWith('/logs') ?? false;

    if (sessionId && isLogsRequest) {
      return await getChatLogs(sessionId, userId);
    }
    return await getHistory(userId, event);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createResponse(500, { message });
  }
};

const getHistory = async (userId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const limit = parseInt(event.queryStringParameters?.limit ?? '20', 10);
  const lastKey = event.queryStringParameters?.nextToken
    ? (JSON.parse(Buffer.from(event.queryStringParameters.nextToken, 'base64').toString()) as Record<string, unknown>)
    : undefined;

  const db = getDynamoDbClient();
  const result = await db.send(new QueryCommand({
    TableName: TABLE_NAMES.SESSIONS,
    IndexName: 'userId-startedAt-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false,
    Limit: limit,
    ExclusiveStartKey: lastKey,
  }));

  const nextToken: string | undefined = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : undefined;

  return createResponse(200, { sessions: result.Items ?? [], count: result.Count ?? 0, nextToken });
};

const getChatLogs = async (sessionId: string, userId: string): Promise<APIGatewayProxyResult> => {
  const db = getDynamoDbClient();
  const result = await db.send(new QueryCommand({
    TableName: TABLE_NAMES.CHAT_LOGS,
    KeyConditionExpression: 'sessionId = :sid',
    ExpressionAttributeValues: { ':sid': sessionId, ':uid': userId },
    FilterExpression: 'userId = :uid',
    ScanIndexForward: true,
  }));
  return createResponse(200, { logs: result.Items ?? [], count: result.Count ?? 0 });
};