import React from 'react';
import type { FeedbackPollingResult } from '@appTypes/training';

interface FeedbackBannerProps {
  feedback: FeedbackPollingResult;
  onViewDetail: () => void;
}

/**
 * フィードバックバナーコンポーネント
 * - SQS非同期処理で生成されたフィードバックを通知
 * - 詳細ページへのリンクを提供
 */
const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ feedback, onViewDetail }) => {
  const bannerStyle: React.CSSProperties = {
    margin: '8px 16px',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  };

  const textStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#166534',
    fontWeight: 600,
  };

  const subTextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#4ade80',
    marginTop: '2px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <div style={bannerStyle} role="status" aria-label="フィードバックが届きました">
      <div>
        <p style={textStyle}>📊 フィードバックが届きました！</p>
        <p style={subTextStyle}>{`総合スコア: ${feedback.overallScore}点`}</p>
      </div>
      <button type="button" style={buttonStyle} onClick={onViewDetail}>
        詳細を見る
      </button>
    </div>
  );
};

export default FeedbackBanner;
