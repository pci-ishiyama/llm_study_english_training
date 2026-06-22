// ── 共通レスポンス型 ────────────────────────────────────────────

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const defaultCorsHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const createOptionsResponse = (): ApiResponse => ({
  statusCode: 200,
  headers: defaultCorsHeaders,
  body: JSON.stringify({}),
});

export const createResponse = (
  statusCode: number,
  body: unknown,
): ApiResponse => ({
  statusCode,
  headers: defaultCorsHeaders,
  body: JSON.stringify(body),
});

// ── DynamoDB テーブル名 ─────────────────────────────────────────
export const TABLE_NAMES = {
  USERS: `it-english-users-${process.env.ENV ?? 'dev'}`,
  SCENARIOS: `it-english-scenarios-${process.env.ENV ?? 'dev'}`,
  SESSIONS: `it-english-sessions-${process.env.ENV ?? 'dev'}`,
  CHAT_LOGS: `it-english-chatlogs-${process.env.ENV ?? 'dev'}`,
  FEEDBACKS: `it-english-feedbacks-${process.env.ENV ?? 'dev'}`,
} as const;

// ── エラー型 ────────────────────────────────────────────────────
export interface AppError {
  code: string;
  message: string;
}
