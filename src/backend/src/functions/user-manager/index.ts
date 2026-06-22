import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDynamoDbClient } from '../../shared/clients/dynamodb';

import { createOptionsResponse, createResponse, TABLE_NAMES } from '../../shared/types/index';
import type { UserEntity } from '../../shared/types/entities';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    if (method === 'OPTIONS') return createOptionsResponse();

    const claims = event.requestContext.authorizer?.claims as Record<string, string> | undefined;
    const tokenUserId = claims?.['sub'];

    if (!tokenUserId) return createResponse(401, { code: 'UNAUTHORIZED', message: 'Unauthorized' });


    const pathUserId = event.pathParameters?.userId;

    switch (method) {


      case 'POST': return await createUser(event, tokenUserId);
      case 'GET':  return await getUser(pathUserId ?? tokenUserId, claims);
      case 'PUT':  return await updateUser(event, pathUserId ?? tokenUserId, tokenUserId);

      default:     return createResponse(405, { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';

    return createResponse(500, { code: 'INTERNAL_SERVER_ERROR', message });
  }
};


const createUser = async (
  event: APIGatewayProxyEvent,
  userId: string,
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body ?? '{}') as Partial<UserEntity>;
  if (!body.email || !body.displayName) {

    return createResponse(400, { code: 'VALIDATION_ERROR', message: 'email and displayName are required' });
  }
  const now = new Date().toISOString();
  const user: UserEntity = {
    userId,
    email: body.email,
    displayName: body.displayName,
    nativeLanguage: body.nativeLanguage ?? 'ja',
    targetLevel: body.targetLevel ?? 'beginner',
    createdAt: now,
    updatedAt: now,
  };
  const db = getDynamoDbClient();
  await db.send(new PutCommand({ TableName: TABLE_NAMES.USERS, Item: user, ConditionExpression: 'attribute_not_exists(userId)' }));
  return createResponse(201, user);
};


const getUser = async (
  userId: string,
  claims?: Record<string, string>,
): Promise<APIGatewayProxyResult> => {
  const db = getDynamoDbClient();
  const result = await db.send(new GetCommand({ TableName: TABLE_NAMES.USERS, Key: { userId } }));


  if (!result.Item) {
    const fallbackUser: UserEntity = {
      userId,
      email: claims?.email ?? `${userId}@example.com`,
      displayName:
        claims?.name ??
        claims?.['cognito:username'] ??
        claims?.email ??
        'User',
      nativeLanguage: 'ja',
      targetLevel: 'beginner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.send(new PutCommand({
      TableName: TABLE_NAMES.USERS,
      Item: fallbackUser,
      ConditionExpression: 'attribute_not_exists(userId)',
    }));

    return createResponse(200, fallbackUser);
  }
  return createResponse(200, result.Item);
};

const updateUser = async (event: APIGatewayProxyEvent, userId: string, tokenUserId: string): Promise<APIGatewayProxyResult> => {

  if (userId !== tokenUserId) return createResponse(403, { code: 'FORBIDDEN', message: 'Forbidden' });
  const body = JSON.parse(event.body ?? '{}') as Partial<UserEntity>;
  const now = new Date().toISOString();
  const db = getDynamoDbClient();
  const result = await db.send(new UpdateCommand({
    TableName: TABLE_NAMES.USERS,
    Key: { userId },
    UpdateExpression: 'SET displayName = :dn, nativeLanguage = :nl, targetLevel = :tl, updatedAt = :ua',
    ExpressionAttributeValues: { ':dn': body.displayName, ':nl': body.nativeLanguage, ':tl': body.targetLevel, ':ua': now },
    ConditionExpression: 'attribute_exists(userId)',
    ReturnValues: 'ALL_NEW',
  }));
  return createResponse(200, result.Attributes);
};