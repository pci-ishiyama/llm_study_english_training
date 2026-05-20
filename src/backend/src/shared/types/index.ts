// ── 共通レスポンス型 ────────────────────────────────────────────

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}


export const createResponse = (
  statusCode: number,


  body: unknown,
): ApiResponse => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  },
  body: JSON.stringify(body),
});

// ── DynamoDB テーブル名 ─────────────────────────────────────────
export const TABLE_NAMES = {
  USERS: `it-english-trainee-users-${process.env.ENV ?? 'dev'}`,
  SCENARIOS: `it-english-trainee-scenarios-${process.env.ENV ?? 'dev'}`,
  SESSIONS: `it-english-trainee-sessions-${process.env.ENV ?? 'dev'}`,
  CHAT_LOGS: `it-english-trainee-chat-logs-${process.env.ENV ?? 'dev'}`,
  FEEDBACKS: `it-english-trainee-feedbacks-${process.env.ENV ?? 'dev'}`,
} as const;

// ── エラー型 ────────────────────────────────────────────────────
export interface AppError {
  code: string;
  message: string;
}
