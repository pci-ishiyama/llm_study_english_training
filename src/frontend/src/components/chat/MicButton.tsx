import React from 'react';

interface MicButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  disabled?: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
}

/**
 * マイクボタンコンポーネント
 * - 押下中に録音（マウス・タッチ対応）
 * - 離すと自動でSTT変換
 */
const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  isTranscribing,
  disabled = false,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
}) => {
  const isActive = isRecording || isTranscribing;

  const buttonStyle: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: isRecording
      ? '#dc2626'
      : isTranscribing
        ? '#f59e0b'
        : disabled
          ? '#d1d5db'
          : '#e5e7eb',
    color: isActive ? '#ffffff' : disabled ? '#9ca3af' : '#374151',
    cursor: disabled || isTranscribing ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
    transition: 'background-color 0.15s',
    boxShadow: isRecording ? '0 0 0 4px rgba(220,38,38,0.2)' : 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  const getLabel = (): string => {
    if (isRecording) return '録音中（離すと送信）';
    if (isTranscribing) return '変換中...';
    return '音声入力';
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      disabled={disabled || isTranscribing}
      aria-label={getLabel()}
      aria-pressed={isRecording}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={(e) => {
        e.preventDefault();
        onTouchStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onTouchEnd();
      }}
    >
      {isTranscribing ? '⏳' : isRecording ? '⏹' : '🎤'}
    </button>
  );
};

export default MicButton;
