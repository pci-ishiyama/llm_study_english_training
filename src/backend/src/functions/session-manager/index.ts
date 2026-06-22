import { GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDynamoDbClient } from '../../shared/clients/dynamodb';
import { createOptionsResponse, createResponse, TABLE_NAMES } from '../../shared/types/index';
import type { ScenarioEntity, SessionEntity } from '../../shared/types/entities';
import { randomUUID } from 'crypto';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    if (method === 'OPTIONS') return createOptionsResponse();

    const claims = event.requestContext.authorizer?.claims as Record<string, string> | undefined;
    const userId = claims?.['sub'];
    if (!userId) return createResponse(401, { code: 'UNAUTHORIZED', message: 'Unauthorized' });

    const sessionId = event.pathParameters?.sessionId;
    const resource = event.resource ?? '';

    switch (method) {
      case 'POST':
        return await startSession(event, userId);
      case 'GET':
        if (resource.endsWith('/scenarios') || resource === '/scenarios') {
          return await listScenarios();
        }
        return sessionId ? await getSession(sessionId, userId) : await listSessions(userId);
      case 'PUT':
        if (!sessionId) return createResponse(400, { code: 'VALIDATION_ERROR', message: 'sessionId is required' });
        return await endSession(sessionId, userId);
      default:
        return createResponse(405, { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createResponse(500, { code: 'INTERNAL_SERVER_ERROR', message });
  }
};

const startSession = async (event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body ?? '{}') as { scenarioId?: string };
  if (!body.scenarioId) return createResponse(400, { code: 'VALIDATION_ERROR', message: 'scenarioId is required' });

  const now = new Date().toISOString();
  const session: SessionEntity = {
    sessionId: randomUUID(),
    userId,
    scenarioId: body.scenarioId,
    status: 'active',
    startedAt: now,
    totalTurns: 0,
  };

  const db = getDynamoDbClient();
  await db.send(new PutCommand({ TableName: TABLE_NAMES.SESSIONS, Item: session }));
  return createResponse(201, session);
};

const getSession = async (sessionId: string, userId: string): Promise<APIGatewayProxyResult> => {
  const db = getDynamoDbClient();
  const result = await db.send(new GetCommand({ TableName: TABLE_NAMES.SESSIONS, Key: { sessionId } }));
  if (!result.Item) return createResponse(404, { code: 'NOT_FOUND', message: 'Session not found' });
  if ((result.Item as SessionEntity).userId !== userId) return createResponse(403, { code: 'FORBIDDEN', message: 'Forbidden' });
  return createResponse(200, result.Item);
};

const listSessions = async (userId: string): Promise<APIGatewayProxyResult> => {
  const db = getDynamoDbClient();
  const result = await db.send(new QueryCommand({
    TableName: TABLE_NAMES.SESSIONS,
    IndexName: 'userId-startedAt-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false,
    Limit: 20,
  }));
  return createResponse(200, { sessions: result.Items ?? [], count: result.Count ?? 0 });
};

const listScenarios = async (): Promise<APIGatewayProxyResult> => {
  const db = getDynamoDbClient();
  const result = await db.send(new ScanCommand({
    TableName: TABLE_NAMES.SCENARIOS,
    FilterExpression: 'isActive = :active',
    ExpressionAttributeValues: { ':active': true },
  }));

  const difficultyMap: Record<ScenarioEntity['difficulty'], 'Beginner' | 'Intermediate' | 'Advanced'> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  const scenarios = (result.Items ?? []).map((item) => {
    const scenario = item as ScenarioEntity;
    return {
      scenarioId: scenario.scenarioId,
      title: scenario.title,
      description: scenario.description,
      scene: scenario.category,
      difficulty: difficultyMap[scenario.difficulty],
      initialMessage: scenario.systemPrompt,
    };
  });

  return createResponse(200, scenarios);
};

const endSession = async (sessionId: string, userId: string): Promise<APIGatewayProxyResult> => {
  const db = getDynamoDbClient();
  const result = await db.send(new UpdateCommand({
    TableName: TABLE_NAMES.SESSIONS,
    Key: { sessionId },
    UpdateExpression: 'SET #st = :st, endedAt = :ea',
    ExpressionAttributeNames: { '#st': 'status' },
    ExpressionAttributeValues: { ':st': 'completed', ':ea': new Date().toISOString(), ':uid': userId },
    ConditionExpression: 'userId = :uid AND #st = :active',
    ReturnValues: 'ALL_NEW',
  }));
  return createResponse(200, result.Attributes);
};