import React from 'react';
import { useNavigate } from 'react-router-dom';

import type { Scenario } from '@appTypes/index';
import HomeSection from './HomeSection';

interface RecommendedScenarioCardProps {
  scenario: Scenario;
}

const RecommendedScenarioCard: React.FC<RecommendedScenarioCardProps> = ({ scenario }) => {
  const navigate = useNavigate();

  const buttonStyle: React.CSSProperties = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  };

  const metaStyle: React.CSSProperties = {
    margin: 0,
    color: '#6b7280',
    fontSize: '14px',
  };

  return (
    <HomeSection title="今日の推奨シナリオ">
      <div style={{ display: 'grid', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '22px', color: '#111827' }}>{scenario.title}</h3>
          <p style={{ ...metaStyle, marginTop: '8px' }}>{scenario.description}</p>
        </div>
        <p style={metaStyle}>{`シーン: ${scenario.scene}`}</p>
        <p style={metaStyle}>{`難易度: ${scenario.difficulty}`}</p>
        <div>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => {
              navigate('/session/new');
            }}
          >
            トレーニングを開始
          </button>
        </div>
      </div>
    </HomeSection>
  );
};

export default RecommendedScenarioCard;
