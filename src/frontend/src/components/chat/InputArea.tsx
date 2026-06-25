import React, { useState, useCallback, useRef, useEffect } from 'react';
import MicButton from './MicButton';
import { useAudioRecorder } from '@hooks/useAudioRecorder';

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * 入力エリアコンポーネント
 * - テキスト入力 + 送信ボタン
 * - マイクボタン（音声入力→STT→自動送信）
 * - Enterキーで送信（Shift+Enterで改行）
 */
const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled = false }) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscribed = useCallback(
    (text: string): void => {
      if (text.trim()) {
        onSend(text.trim());
      }
    },
    [onSend],
  );

  const { isRecording, isTranscribing, transcribeError, startRecording, stopRecording } =
    useAudioRecorder(handleTranscribed);

  const handleSend = useCallback((): void => {
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInputText('');
  }, [inputText, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const containerStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '22px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    lineHeight: 1.5,
    resize: 'none',
    outline: 'none',
    minHeight: '44px',
    maxHeight: '120px',
    overflowY: 'auto',
    backgroundColor: disabled ? '#f9fafb' : '#ffffff',
    color: '#111827',
    fontFamily: 'inherit',
  };

  const sendButtonStyle: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor:
      inputText.trim() && !disabled ? '#2563eb' : '#d1d5db',
    color: '#ffffff',
    cursor: inputText.trim() && !disabled ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
    transition: 'background-color 0.15s',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#dc2626',
    padding: '0 4px',
  };

  return (
    <div style={containerStyle}>
      {transcribeError !== null && <p style={errorStyle}>{transcribeError}</p>}
      <div style={inputRowStyle}>
        <MicButton
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          disabled={disabled}
          onMouseDown={() => {
            void startRecording();
          }}
          onMouseUp={stopRecording}
          onTouchStart={() => {
            void startRecording();
          }}
          onTouchEnd={stopRecording}
        />
        <textarea
          ref={textareaRef}
          style={textareaStyle}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording
              ? '録音中...'
              : isTranscribing
                ? '変換中...'
                : 'メッセージを入力（Enterで送信）'
          }
          disabled={disabled || isRecording || isTranscribing}
          rows={1}
          aria-label="メッセージ入力"
        />
        <button
          type="button"
          style={sendButtonStyle}
          onClick={handleSend}
          disabled={!inputText.trim() || disabled}
          aria-label="送信"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default InputArea;
