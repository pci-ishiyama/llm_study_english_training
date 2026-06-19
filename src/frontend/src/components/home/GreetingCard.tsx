import React from 'react';

import HomeSection from './HomeSection';

interface GreetingCardProps {
  name: string;
  englishLevel: string;
  learningGoal?: string;
}

const GreetingCard: React.FC<GreetingCardProps> = ({
  name,
  englishLevel,
  learningGoal,
}) => {
  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '9999px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '12px',
    fontWeight: 700,
  };

  return (
    <HomeSection title={`こんにちは、${name}さん`}>
      <div style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0, color: '#4b5563', fontSize: '15px' }}>
          今日も IT 英会話トレーニングを進めましょう。
        </p>
        <div>
          <span style={badgeStyle}>{`現在の英語レベル: ${englishLevel}`}</span>
        </div>
        <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>
          {learningGoal && learningGoal.trim() !== ''
            ? `学習目標: ${learningGoal}`
            : '学習目標: 設定画面から登録できます'}
        </p>
      </div>
    </HomeSection>
  );
};

export default GreetingCard;
