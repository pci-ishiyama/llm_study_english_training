import { apiPost, apiPut } from './client';
import type {
  ApiResponse,
  StartSessionRequest,
  StartSessionResponse,
  EndSessionResponse,
  SendChatRequest,
  SendChatResponse,

} from '@appTypes/index';

/**
 * セッション開始
 */
export const startSession = async (
  data: StartSessionRequest,
): Promise<ApiResponse<StartSessionResponse>> => {
  return apiPost<ApiResponse<StartSessionResponse>>('/sessions', data);
};

/**
 * セッション終了
 */
export const endSession = async (
  sessionId: string,
): Promise<ApiResponse<EndSessionResponse>> => {
  return apiPut<ApiResponse<EndSessionResponse>>(
    `/sessions/${sessionId}/end`,
    {},
  );
};

/**
 * チャットメッセージ送信
 */
export const sendChat = async (
  sessionId: string,
  data: SendChatRequest,
): Promise<ApiResponse<SendChatResponse>> => {
  return apiPost<ApiResponse<SendChatResponse>>(
    `/sessions/${sessionId}/chat`,
    data,
  );
};
