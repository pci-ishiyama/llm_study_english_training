import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChat } from '@api/sessions';
import {
  sendChatPending,
  sendChatFulfilled,
  sendChatRejected,
} from '@store/sessionSlice';
import type { RootState } from '@store/index';
import type { ChatLog } from '@appTypes/index';

export interface UseChatReturn {
  chatLogs: ChatLog[];
  isSending: boolean;
  error: string | null;
  sendMessage: (sessionId: string, userMessage: string) => Promise<void>;
}

/**
 * チャットメッセージ送受信フック
 * - ユーザーメッセージを楽観的更新で即時追加
 * - POST /sessions/{sessionId}/chat でAI応答を取得
 */
export const useChat = (): UseChatReturn => {
  const dispatch = useDispatch();
  const chatLogs = useSelector((state: RootState) => state.session.chatLogs);
  const isSending = useSelector((state: RootState) => state.session.isSending);
  const error = useSelector((state: RootState) => state.session.error);

  const sendMessage = useCallback(
    async (sessionId: string, userMessage: string): Promise<void> => {
      if (!userMessage.trim()) return;

      dispatch(sendChatPending(userMessage));

      try {
        const conversationHistory = chatLogs
          .filter((log) => log.speaker === 'USER' || log.speaker === 'AI')
          .map((log) => ({
            role: log.speaker === 'USER' ? ('user' as const) : ('assistant' as const),
            content: log.messageText,
          }));

        const response = await sendChat(sessionId, {
          userMessage,
          messageType: 'text',
          conversationHistory,
        } as Parameters<typeof sendChat>[1]);

        if (response.success && response.data !== null) {
          dispatch(sendChatFulfilled(response.data));
        } else {
          dispatch(sendChatRejected(response.error?.message ?? 'メッセージの送信に失敗しました'));
        }
      } catch {
        dispatch(sendChatRejected('メッセージの送信に失敗しました'));
      }
    },
    [dispatch, chatLogs],
  );

  return { chatLogs, isSending, error, sendMessage };
};
