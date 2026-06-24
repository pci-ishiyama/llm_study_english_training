import React from 'react';
import type { Scenario } from '@appTypes/index';

interface ScenarioCardProps {
  scenario: Scenario;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const DIFFICULTY_BADGE: Record<
  Scenario['difficulty'],
  { label: string; backgroundColor: string; color: string }
> = {
  Beginner: { label: '初級', backgroundColor: '#d1fae5', color: '#065f46' },
  Intermediate: { label: '中級', backgroundColor: '#fef3c7', color: '#92400e' },
  Advanced: { label: '上級', backgroundColor: '#fee2e2', color: '#991b1b' },
};

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, isSelected, onSelect }) => {
  const badge = DIFFICULTY_BADGE[scenario.difficulty];

  const cardStyle: React.CSSProperties = {
    padding: '16px',
    borderRadius: '12px',
    border: isSelected ? '2px solid #2563eb' : '2px solid #e5e7eb',
    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
    cursor: 'pointer',
    boxShadow: isSelected
      ? '0 0 0 3px rgba(37,99,235,0.2)'
      : '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'all 0.15s',
    display: 'grid',
    gap: '8px',
  };

  return (
    <div
      role="button"
      tabIndex={0}
      style={cardStyle}
      onClick={() => { onSelect(scenario.scenarioId); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(scenario.scenarioId);
        }
      }}
    >
      {/* タイトル */}
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
        {scenario.title}
      </h3>

      {/* 説明 */}
      <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
        {scenario.description}
      </p>

      {/* バッジ・推定時間 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span
          style={{
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: badge.backgroundColor,
            color: badge.color,
          }}
        >
          {badge.label}
        </span>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {`シーン: ${scenario.scene}`}
        </span>
      </div>
    </div>
  );
};

export default ScenarioCard;
