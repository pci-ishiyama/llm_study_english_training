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

// src/functions/session-manager/index.ts
var session_manager_exports = {};
__export(session_manager_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(session_manager_exports);
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

// src/functions/session-manager/index.ts
var import_crypto = require("crypto");
var handler = async (event) => {
  try {
    const method = event.httpMethod;
    if (method === "OPTIONS")
      return createOptionsResponse();
    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.["sub"];
    if (!userId)
      return createResponse(401, { code: "UNAUTHORIZED", message: "Unauthorized" });
    const sessionId = event.pathParameters?.sessionId;
    const resource = event.resource ?? "";
    switch (method) {
      case "POST":
        return await startSession(event, userId);
      case "GET":
        if (resource.endsWith("/scenarios") || resource === "/scenarios") {
          return await listScenarios();
        }
        return sessionId ? await getSession(sessionId, userId) : await listSessions(userId);
      case "PUT":
        if (!sessionId)
          return createResponse(400, { code: "VALIDATION_ERROR", message: "sessionId is required" });
        return await endSession(sessionId, userId);
      default:
        return createResponse(405, { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return createResponse(500, { code: "INTERNAL_SERVER_ERROR", message });
  }
};
var startSession = async (event, userId) => {
  const body = JSON.parse(event.body ?? "{}");
  if (!body.scenarioId)
    return createResponse(400, { code: "VALIDATION_ERROR", message: "scenarioId is required" });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const session = {
    sessionId: (0, import_crypto.randomUUID)(),
    userId,
    scenarioId: body.scenarioId,
    status: "active",
    startedAt: now,
    totalTurns: 0
  };
  const db = getDynamoDbClient();
  await db.send(new import_lib_dynamodb2.PutCommand({ TableName: TABLE_NAMES.SESSIONS, Item: session }));
  return createResponse(201, session);
};
var getSession = async (sessionId, userId) => {
  const db = getDynamoDbClient();
  const result = await db.send(new import_lib_dynamodb2.GetCommand({ TableName: TABLE_NAMES.SESSIONS, Key: { sessionId } }));
  if (!result.Item)
    return createResponse(404, { code: "NOT_FOUND", message: "Session not found" });
  if (result.Item.userId !== userId)
    return createResponse(403, { code: "FORBIDDEN", message: "Forbidden" });
  return createResponse(200, result.Item);
};
var listSessions = async (userId) => {
  const db = getDynamoDbClient();
  const result = await db.send(new import_lib_dynamodb2.QueryCommand({
    TableName: TABLE_NAMES.SESSIONS,
    IndexName: "userId-startedAt-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
    ScanIndexForward: false,
    Limit: 20
  }));
  return createResponse(200, { sessions: result.Items ?? [], count: result.Count ?? 0 });
};
var listScenarios = async () => {
  const db = getDynamoDbClient();
  const result = await db.send(new import_lib_dynamodb2.ScanCommand({
    TableName: TABLE_NAMES.SCENARIOS,
    FilterExpression: "isActive = :active",
    ExpressionAttributeValues: { ":active": true }
  }));
  const difficultyMap = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced"
  };
  const scenarios = (result.Items ?? []).map((item) => {
    const scenario = item;
    return {
      scenarioId: scenario.scenarioId,
      title: scenario.title,
      description: scenario.description,
      scene: scenario.category,
      difficulty: difficultyMap[scenario.difficulty],
      initialMessage: scenario.systemPrompt
    };
  });
  return createResponse(200, scenarios);
};
var endSession = async (sessionId, userId) => {
  const db = getDynamoDbClient();
  const result = await db.send(new import_lib_dynamodb2.UpdateCommand({
    TableName: TABLE_NAMES.SESSIONS,
    Key: { sessionId },
    UpdateExpression: "SET #st = :st, endedAt = :ea",
    ExpressionAttributeNames: { "#st": "status" },
    ExpressionAttributeValues: { ":st": "completed", ":ea": (/* @__PURE__ */ new Date()).toISOString(), ":uid": userId },
    ConditionExpression: "userId = :uid AND #st = :active",
    ReturnValues: "ALL_NEW"
  }));
  return createResponse(200, result.Attributes);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
