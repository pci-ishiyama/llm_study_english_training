import React from 'react';
import type { Scenario } from '@appTypes/index';
import ScenarioCard from './ScenarioCard';

interface ScenarioListProps {
  scenarios: Scenario[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ScenarioList: React.FC<ScenarioListProps> = ({ scenarios, selectedId, onSelect }) => {
  if (scenarios.length === 0) {
    return (
      <div
        style={{
          marginTop: '32px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '16px',
          padding: '40px 0',
        }}
      >
        該当するシナリオがありません
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}
    >
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.scenarioId}
          scenario={scenario}
          isSelected={selectedId === scenario.scenarioId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default ScenarioList;
