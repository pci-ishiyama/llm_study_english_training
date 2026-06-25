import React from 'react';
import type { ChatLog } from '@appTypes/index';

interface MessageBubbleProps {
  log: ChatLog;
  onPlayAudio?: (audioUrl: string) => void;
  isPlayingAudioUrl?: string | null;
}

/**
 * メッセージバブルコンポーネント
 * - USER: 右寄せ（青）
 * - AI: 左寄せ（白）＋音声再生ボタン
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ log, onPlayAudio, isPlayingAudioUrl }) => {
  const isUser = log.speaker === 'USER';
  const isAI = log.speaker === 'AI';
  const isPlaying = isPlayingAudioUrl === log.audioUrl && log.audioUrl !== undefined;

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: '12px',
    padding: '0 8px',
  };

  const bubbleStyle: React.CSSProperties = {
    maxWidth: '72%',
    padding: '12px 16px',
    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    backgroundColor: isUser ? '#2563eb' : '#ffffff',
    color: isUser ? '#ffffff' : '#111827',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: isUser ? 'none' : '1px solid #e5e7eb',
    fontSize: '15px',
    lineHeight: 1.6,
    wordBreak: 'break-word',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    marginBottom: '4px',
    color: isUser ? '#93c5fd' : '#6b7280',
    textAlign: isUser ? 'right' : 'left',
  };

  const audioButtonStyle: React.CSSProperties = {
    marginTop: '8px',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    backgroundColor: isPlaying ? '#dbeafe' : '#f9fafb',
    color: isPlaying ? '#1d4ed8' : '#374151',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <div style={wrapperStyle}>
      <div>
        <p style={labelStyle}>{isUser ? 'You' : 'AI'}</p>
        <div style={bubbleStyle}>
          <p style={{ margin: 0 }}>{log.messageText}</p>
          {isAI && log.audioUrl !== undefined && onPlayAudio !== undefined && (
            <button
              type="button"
              style={audioButtonStyle}
              onClick={() => {
                if (log.audioUrl !== undefined) {
                  onPlayAudio(log.audioUrl);
                }
              }}
              aria-label={isPlaying ? '再生中' : '音声を再生'}
            >
              {isPlaying ? '🔊 再生中...' : '🔊 音声を再生'}
            </button>
          )}
          {log.translation !== undefined && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: '12px',
                color: isUser ? '#bfdbfe' : '#9ca3af',
                borderTop: `1px solid ${isUser ? 'rgba(255,255,255,0.2)' : '#f3f4f6'}`,
                paddingTop: '6px',
              }}
            >
              {log.translation}
            </p>
          )}
        </div>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '11px',
            color: '#9ca3af',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {new Date(log.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
