import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * エラーメッセージコンポーネント
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '4px 12px',
    fontSize: '13px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle} role="alert">
      <span style={{ fontSize: '18px' }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>{message}</p>
        {(onRetry ?? onDismiss) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#dc2626',
                  color: '#fff',
                }}
              >
                再試行
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  color: '#dc2626',
                  border: '1px solid #dc2626',
                }}
              >
                閉じる
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
