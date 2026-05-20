import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Session,
  ChatLog,
  Scenario,
  StartSessionResponse,
  SendChatResponse,

} from '@appTypes/index';

// ===========================
// 型定義
// ===========================

export interface SessionState {
  currentSession: Session | null;
  currentScenario: Scenario | null;
  chatLogs: ChatLog[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  audioUrl: string | null;
  isAudioPlaying: boolean;
}

// ===========================
// 初期状態
// ===========================

const initialState: SessionState = {
  currentSession: null,
  currentScenario: null,
  chatLogs: [],
  isLoading: false,
  isSending: false,
  error: null,
  audioUrl: null,
  isAudioPlaying: false,
};

// ===========================
// スライス
// ===========================

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSessionPending(state) {
      state.isLoading = true;
      state.error = null;
    },
    startSessionFulfilled(
      state,
      action: PayloadAction<{
        response: StartSessionResponse;
        scenario: Scenario;
      }>,
    ) {
      const { response, scenario } = action.payload;
      state.currentSession = {
        sessionId: response.sessionId,
        scenarioId: response.scenarioId,
        status: 'active',
        createdAt: response.createdAt,
      };
      state.currentScenario = scenario;
      state.chatLogs = [
        {
          chatLogId: `init-${response.sessionId}`,
          speaker: 'AI',
          messageText: response.initialMessage,
          audioUrl: response.audioUrl,
          timestamp: response.createdAt,
        },
      ];
      state.audioUrl = response.audioUrl;
      state.isLoading = false;
    },
    startSessionRejected(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    sendChatPending(state, action: PayloadAction<string>) {
      state.isSending = true;
      state.error = null;
      // ユーザーメッセージを即時追加（楽観的更新）
      const userLog: ChatLog = {
        chatLogId: `user-${Date.now()}`,
        speaker: 'USER',
        messageText: action.payload,
        timestamp: new Date().toISOString(),
      };
      state.chatLogs.push(userLog);
    },
    sendChatFulfilled(state, action: PayloadAction<SendChatResponse>) {
      const aiLog: ChatLog = {
        chatLogId: action.payload.chatLogId,
        speaker: 'AI',
        messageText: action.payload.aiMessage,
        audioUrl: action.payload.audioUrl,
        translation: action.payload.translation,
        timestamp: action.payload.timestamp,
      };
      state.chatLogs.push(aiLog);
      state.audioUrl = action.payload.audioUrl;
      state.isSending = false;
    },
    sendChatRejected(state, action: PayloadAction<string>) {
      state.isSending = false;
      state.error = action.payload;
      // 楽観的更新で追加したユーザーメッセージを削除
      state.chatLogs.pop();
    },
    endSessionFulfilled(state) {
      if (state.currentSession) {
        state.currentSession.status = 'completed';
      }
    },
    setAudioPlaying(state, action: PayloadAction<boolean>) {
      state.isAudioPlaying = action.payload;
    },
    setAudioUrl(state, action: PayloadAction<string | null>) {
      state.audioUrl = action.payload;
    },
    clearSession() {
      return initialState;
    },
    clearSessionError(state) {
      state.error = null;
    },
  },
});

export const {
  startSessionPending,
  startSessionFulfilled,
  startSessionRejected,
  sendChatPending,
  sendChatFulfilled,
  sendChatRejected,
  endSessionFulfilled,
  setAudioPlaying,
  setAudioUrl,
  clearSession,
  clearSessionError,
} = sessionSlice.actions;

export default sessionSlice.reducer;
