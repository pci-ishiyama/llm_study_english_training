import React from 'react';

import HomeSection from './HomeSection';

interface LearningStatusCardProps {
  weeklyCount: number;
  streakDays: number;
  averageScore: number;
}

const LearningStatusCard: React.FC<LearningStatusCardProps> = ({
  weeklyCount,
  streakDays,
  averageScore,
}) => {
  const listStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    margin: 0,
  };

  const itemStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  };

  const labelStyle: React.CSSProperties = {
    margin: 0,
    color: '#6b7280',
    fontSize: '13px',
  };

  const valueStyle: React.CSSProperties = {
    margin: '8px 0 0',
    color: '#111827',
    fontSize: '28px',
    fontWeight: 700,
  };

  return (
    <HomeSection title="学習ステータス">
      <dl style={listStyle}>
        <div style={itemStyle}>
          <dt style={labelStyle}>今週の実施回数</dt>
          <dd style={valueStyle}>{weeklyCount}回</dd>
        </div>
        <div style={itemStyle}>
          <dt style={labelStyle}>連続学習日数</dt>
          <dd style={valueStyle}>{streakDays}日</dd>
        </div>
        <div style={itemStyle}>
          <dt style={labelStyle}>平均スコア</dt>
          <dd style={valueStyle}>{averageScore}点</dd>
        </div>
      </dl>
    </HomeSection>
  );
};

export default LearningStatusCard;
