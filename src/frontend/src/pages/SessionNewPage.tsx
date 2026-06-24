import React from 'react';

import { useScenarioSelection } from '@hooks/useScenarioSelection';
import DifficultyFilter from '@components/scenario/DifficultyFilter';
import ScenarioList from '@components/scenario/ScenarioList';

/**
 * SCR-002 シナリオ選択画面
 * - 難易度フィルターでシナリオを絞り込み
 * - シナリオを選択して対話セッションを開始する
 */
const SessionNewPage: React.FC = () => {
  const {
    scenarios,
    selectedId,
    difficulty,
    isLoading,
    isStarting,
    error,
    setDifficulty,
    setSelectedId,
    handleStart,
  } = useScenarioSelection();

  return (
    <main style={{ padding: '40px 24px', maxWidth: '960px', margin: '0 auto' }}>
      {/* ページタイトル */}
      <h1 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 700, color: '#111827' }}>
        シナリオを選択
      </h1>

      {/* 難易度フィルター */}
      <DifficultyFilter value={difficulty} onChange={setDifficulty} />

      {/* エラー表示 */}
      {error !== null && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* シナリオ一覧 / ローディング */}
      {isLoading ? (
        <div
          style={{
            marginTop: '48px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '16px',
          }}
        >
          読み込み中...
        </div>
      ) : (
        <ScenarioList
          scenarios={scenarios}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {/* 開始ボタン */}
      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => { void handleStart(); }}
          disabled={selectedId === null || isStarting}
          style={{
            padding: '12px 32px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor:
              selectedId === null || isStarting ? '#93c5fd' : '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '16px',
            cursor: selectedId === null || isStarting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {isStarting ? '開始中...' : '開始する'}
        </button>
      </div>
    </main>
  );
};

export default SessionNewPage;
