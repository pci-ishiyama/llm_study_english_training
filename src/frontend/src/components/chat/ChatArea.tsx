import React, { useEffect, useRef } from 'react';
import type { ChatLog } from '@appTypes/index';
import MessageBubble from './MessageBubble';

interface ChatAreaProps {
  chatLogs: ChatLog[];
  onPlayAudio?: (audioUrl: string) => void;
  isPlayingAudioUrl?: string | null;
  isSending?: boolean;
}

/**
 * チャットエリアコンポーネント
 * - メッセージ一覧を時系列で表示
 * - 新しいメッセージが追加されると自動スクロール
 */
const ChatArea: React.FC<ChatAreaProps> = ({
  chatLogs,
  onPlayAudio,
  isPlayingAudioUrl,
  isSending = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール（jsdom非対応のため安全に呼ぶ）
  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLogs, isSending]);

  const containerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
  };

  const typingIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '12px',
    padding: '0 8px',
  };

  const typingBubbleStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: '18px 18px 18px 4px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    color: '#6b7280',
    fontSize: '14px',
  };

  return (
    <div style={containerStyle} role="log" aria-label="チャット履歴" aria-live="polite">
      {chatLogs.length === 0 && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '14px',
          }}
        >
          AIとの会話を始めましょう
        </div>
      )}

      {chatLogs.map((log) => (
        <MessageBubble
          key={log.chatLogId}
          log={log}
          onPlayAudio={onPlayAudio}
          isPlayingAudioUrl={isPlayingAudioUrl}
        />
      ))}

      {isSending && (
        <div style={typingIndicatorStyle}>
          <div style={typingBubbleStyle}>AI が入力中...</div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatArea;
