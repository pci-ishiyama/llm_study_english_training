// ── 共通レスポンス型 ────────────────────────────────────────────

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const defaultCorsHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const createSuccessResponse = <T>(
  statusCode: number,
  data: T,
): ApiResponse => ({
  statusCode,
  headers: defaultCorsHeaders,
  body: JSON.stringify({
    success: true,
    data,
    error: null,
  }),
});

export const createErrorResponse = (
  statusCode: number,
  error: ApiErrorBody,
): ApiResponse => ({
  statusCode,
  headers: defaultCorsHeaders,
  body: JSON.stringify({
    success: false,
    data: null,
    error,
  }),
});

export const createOptionsResponse = (): ApiResponse => ({
  statusCode: 200,
  headers: defaultCorsHeaders,
  body: JSON.stringify({
    success: true,
    data: null,
    error: null,
  }),
});

export const createResponse = (
  statusCode: number,
  body: unknown,
): ApiResponse => {
  if (statusCode >= 400) {
    const errorBody = body as { code?: string; message?: string; details?: Record<string, unknown> };
    return createErrorResponse(statusCode, {
      code: errorBody.code ?? 'ERROR',
      message: errorBody.message ?? 'Unexpected error',
      details: errorBody.details,
    });
  }

  return createSuccessResponse(statusCode, body);
};

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
