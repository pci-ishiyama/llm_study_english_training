import React from 'react';
import { useNavigate } from 'react-router-dom';

import ErrorMessage from '@components/common/ErrorMessage';
import LoadingSpinner from '@components/common/LoadingSpinner';
import GreetingCard from '@components/home/GreetingCard';
import LearningStatusCard from '@components/home/LearningStatusCard';
import ProgressChart from '@components/home/ProgressChart';
import QuickStartActions from '@components/home/QuickStartActions';
import RecommendedScenarioCard from '@components/home/RecommendedScenarioCard';
import { useAuth } from '@hooks/useAuth';
import { useHomePage } from '@hooks/useHomePage';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading, error, data, reload } = useHomePage(user?.userId ?? '');

  const pageStyle: React.CSSProperties = {
    padding: '32px 24px 56px',
    maxWidth: '1120px',
    margin: '0 auto',
    display: 'grid',
    gap: '24px',
  };

  const actionRowStyle: React.CSSProperties = {
    display: 'grid',
    gap: '24px',
  };

  const secondaryActionStyle: React.CSSProperties = {
    justifySelf: 'start',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    fontWeight: 600,
    cursor: 'pointer',
  };

  if (isLoading) {
    return (
      <main style={pageStyle}>
        <LoadingSpinner message="読み込み中..." />
      </main>
    );
  }

  if (error !== null || data === null) {
    return (
      <main style={pageStyle}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>🏠 ホーム</h2>
        <ErrorMessage
          message={error ?? 'ホーム画面の読み込みに失敗しました'}
          onRetry={() => {
            void reload();
          }}
        />
        <button
          type="button"
          onClick={() => {
            void reload();
          }}
          style={secondaryActionStyle}
        >
          再読み込み
        </button>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <GreetingCard
        name={data.greetingName}
        englishLevel={data.englishLevel}
        learningGoal={data.learningGoal}
      />
      <LearningStatusCard
        weeklyCount={data.weeklyCount}
        streakDays={data.streakDays}
        averageScore={data.averageScore}
      />
      <RecommendedScenarioCard scenario={data.recommendedScenario} />
      <div style={actionRowStyle}>
        <QuickStartActions
          onOpenScenarios={() => {
            navigate('/session/new');
          }}
          onOpenHistory={() => {
            navigate('/history');
          }}
        />
        <button
          type="button"
          onClick={() => {
            navigate('/settings');
          }}
          style={secondaryActionStyle}
        >
          プロフィールを編集
        </button>
      </div>
      <ProgressChart scores={data.recentScores} />
    </main>
  );
};

export default HomePage;

