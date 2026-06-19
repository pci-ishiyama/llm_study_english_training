import React from 'react';

import HomeSection from './HomeSection';

interface ProgressPoint {
  date: string;
  score: number;
}

interface ProgressChartProps {
  scores: ProgressPoint[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ scores }) => {
  const maxScore = scores.length === 0 ? 100 : Math.max(...scores.map((point) => point.score), 100);

  const listStyle: React.CSSProperties = {
    display: 'grid',
    gap: '12px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '72px 1fr 48px',
    gap: '12px',
    alignItems: 'center',
  };

  const trackStyle: React.CSSProperties = {
    width: '100%',
    height: '10px',
    borderRadius: '9999px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  };

  return (
    <HomeSection title="学習の進捗">
      {scores.length === 0 ? (
        <p style={{ margin: 0, color: '#6b7280' }}>まだスコア履歴がありません。</p>
      ) : (
        <ul style={listStyle}>
          {scores.map((point) => {
            const barStyle: React.CSSProperties = {
              width: `${Math.max(8, Math.round((point.score / maxScore) * 100))}%`,
              height: '100%',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
            };

            return (
              <li key={`${point.date}-${point.score}`} style={rowStyle}>
                <span>{point.date}</span>
                <div style={trackStyle} aria-hidden="true">
                  <div style={barStyle} />
                </div>
                <strong>{point.score}点</strong>
              </li>
            );
          })}
        </ul>
      )}
    </HomeSection>
  );
};

export default ProgressChart;
