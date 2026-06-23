"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/functions/history-manager/index.ts
var history_manager_exports = {};
__export(history_manager_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(history_manager_exports);
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// src/shared/clients/dynamodb.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var _client;
var getDynamoDbClient = () => {
  if (!_client) {
    const base = new import_client_dynamodb.DynamoDBClient({});
    _client = import_lib_dynamodb.DynamoDBDocumentClient.from(base, {
      marshallOptions: {
        removeUndefinedValues: true
      }
    });
  }
  return _client;
};

// src/shared/types/index.ts
var defaultCorsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};
var createOptionsResponse = () => ({
  statusCode: 200,
  headers: defaultCorsHeaders,
  body: JSON.stringify({})
});
var createResponse = (statusCode, body) => ({
  statusCode,
  headers: defaultCorsHeaders,
  body: JSON.stringify(body)
});
var TABLE_NAMES = {
  USERS: `it-english-users-${process.env.ENV ?? "dev"}`,
  SCENARIOS: `it-english-scenarios-${process.env.ENV ?? "dev"}`,
  SESSIONS: `it-english-sessions-${process.env.ENV ?? "dev"}`,
  CHAT_LOGS: `it-english-chatlogs-${process.env.ENV ?? "dev"}`,
  FEEDBACKS: `it-english-feedbacks-${process.env.ENV ?? "dev"}`
};

// src/functions/history-manager/index.ts
var handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS")
      return createOptionsResponse();
    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.["sub"];
    if (!userId)
      return createResponse(401, { code: "UNAUTHORIZED", message: "Unauthorized" });
    const sessionId = event.pathParameters?.sessionId;
    const isLogsRequest = event.resource?.endsWith("/logs") ?? false;
    if (sessionId && isLogsRequest) {
      return await getChatLogs(sessionId, userId);
    }
    return await getHistory(userId, event);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return createResponse(500, { code: "INTERNAL_SERVER_ERROR", message });
  }
};
var getHistory = async (userId, event) => {
  const limit = parseInt(event.queryStringParameters?.limit ?? "20", 10);
  const lastKey = event.queryStringParameters?.nextToken ? JSON.parse(Buffer.from(event.queryStringParameters.nextToken, "base64").toString()) : void 0;
  const db = getDynamoDbClient();
  const result = await db.send(new import_lib_dynamodb2.QueryCommand({
    TableName: TABLE_NAMES.SESSIONS,
    IndexName: "userId-startedAt-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
    ScanIndexForward: false,
    Limit: limit,
    ExclusiveStartKey: lastKey
  }));
  const nextToken = result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64") : void 0;
  return createResponse(200, {
    sessions: result.Items ?? [],
    count: result.Count ?? 0,
    nextToken
  });
};
var getChatLogs = async (sessionId, userId) => {
  const db = getDynamoDbClient();
  const result = await db.send(new import_lib_dynamodb2.QueryCommand({
    TableName: TABLE_NAMES.CHAT_LOGS,
    KeyConditionExpression: "sessionId = :sid",
    ExpressionAttributeValues: { ":sid": sessionId, ":uid": userId },
    FilterExpression: "userId = :uid",
    ScanIndexForward: true
  }));
  return createResponse(200, { logs: result.Items ?? [], count: result.Count ?? 0 });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
