import React from 'react';

interface QuickStartActionsProps {
  onOpenScenarios: () => void;
  onOpenHistory: () => void;
}

const QuickStartActions: React.FC<QuickStartActionsProps> = ({
  onOpenScenarios,
  onOpenHistory,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  };

  const actionStyle: React.CSSProperties = {
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #dbeafe',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <nav aria-label="クイックスタート" style={containerStyle}>
      <button type="button" onClick={onOpenScenarios} style={actionStyle}>
        シナリオ一覧を見る
      </button>
      <button type="button" onClick={onOpenHistory} style={actionStyle}>
        学習履歴を見る
      </button>
    </nav>
  );
};

export default QuickStartActions;
