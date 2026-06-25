import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ChatArea from '@components/chat/ChatArea';
import InputArea from '@components/chat/InputArea';
import AudioPlayer from '@components/chat/AudioPlayer';
import ErrorMessage from '@components/common/ErrorMessage';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { useChat } from '@hooks/useChat';
import { useFeedbackPolling } from '@hooks/useFeedbackPolling';
import { endSession } from '@api/sessions';
import { endSessionFulfilled, clearSessionError, setAudioUrl } from '@store/sessionSlice';
import type { RootState } from '@store/index';

/**
 * SCR-003 対話トレーニング画面
 * - テキスト入力・音声入力でAIと英語会話練習
 * - AI応答をTTSで音声再生
 * - SQS非同期でフィードバックを取得
 */
const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentSession = useSelector((state: RootState) => state.session.currentSession);
  const currentScenario = useSelector((state: RootState) => state.session.currentScenario);
  const audioUrl = useSelector((state: RootState) => state.session.audioUrl);
  const isAudioPlaying = useSelector((state: RootState) => state.session.isAudioPlaying);

  const { chatLogs, isSending, error, sendMessage } = useChat();
  const { feedback, startPolling } = useFeedbackPolling();

  const [isEndingSession, setIsEndingSession] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  // セッションが存在しない場合はホームへリダイレクト
  useEffect(() => {
    if (!sessionId) {
      void navigate('/');
    }
  }, [sessionId, navigate]);

  // 5ターン目以降でフィードバックポーリング開始
  useEffect(() => {
    if (sessionId && chatLogs.length >= 5) {
      startPolling(sessionId);
    }
  }, [chatLogs.length, sessionId, startPolling]);

  const handleSend = useCallback(
    (message: string): void => {
      if (!sessionId) return;
      void sendMessage(sessionId, message);
    },
    [sessionId, sendMessage],
  );

  const handlePlayAudio = useCallback(
    (url: string): void => {
      setPlayingAudioUrl(url);
      dispatch(setAudioUrl(url));
    },
    [dispatch],
  );

  const handleAudioEnded = useCallback((): void => {
    setPlayingAudioUrl(null);
  }, []);

  const handleEndSession = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    setIsEndingSession(true);
    setEndError(null);
    try {
      const response = await endSession(sessionId);
      if (response.success) {
        dispatch(endSessionFulfilled());
        void navigate('/');
      } else {
        setEndError('セッションの終了に失敗しました');
      }
    } catch {
      setEndError('セッションの終了に失敗しました');
    } finally {
      setIsEndingSession(false);
    }
  }, [sessionId, dispatch, navigate]);

  const handleDismissError = useCallback((): void => {
    dispatch(clearSessionError());
  }, [dispatch]);

  if (!sessionId) {
    return <LoadingSpinner fullScreen message="セッションを確認中..." />;
  }

  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 60px)',
    backgroundColor: '#f8fafc',
  };

  const headerStyle: React.CSSProperties = {
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
  };

  const endButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '13px',
    fontWeight: 600,
    cursor: isEndingSession ? 'not-allowed' : 'pointer',
    opacity: isEndingSession ? 0.6 : 1,
  };

  const statusBadgeStyle: React.CSSProperties = {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: isAudioPlaying ? '#dbeafe' : isSending ? '#fef3c7' : '#d1fae5',
    color: isAudioPlaying ? '#1d4ed8' : isSending ? '#92400e' : '#065f46',
  };

  return (
    <div style={pageStyle}>
      {/* ヘッダー */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={titleStyle}>
            {currentScenario?.title ?? '対話トレーニング'}
          </h1>
          <span style={statusBadgeStyle}>
            {isAudioPlaying ? '🔊 再生中' : isSending ? '⏳ 送信中' : '✅ 待機中'}
          </span>
        </div>
        <button
          type="button"
          style={endButtonStyle}
          onClick={() => { void handleEndSession(); }}
          disabled={isEndingSession}
        >
          {isEndingSession ? '終了中...' : 'セッション終了'}
        </button>
      </div>

      {/* エラー表示 */}
      {(error !== null || endError !== null) && (
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <ErrorMessage
            message={error ?? endError ?? ''}
            onDismiss={handleDismissError}
          />
        </div>
      )}

      {/* フィードバックバナー */}
      {feedback !== null && (
        <div
          style={{
            margin: '8px 16px',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
          role="status"
        >
          <div>
            <p style={{ fontSize: '14px', color: '#166534', fontWeight: 600, margin: 0 }}>
              📊 フィードバックが届きました！
            </p>
            <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px', margin: 0 }}>
              {`総合スコア: ${feedback.overallScore}点`}
            </p>
          </div>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => {
              if (sessionId) {
                void navigate(`/session/${sessionId}/feedback`);
              }
            }}
          >
            詳細を見る
          </button>
        </div>
      )}

      {/* チャットエリア */}
      <ChatArea
        chatLogs={chatLogs}
        onPlayAudio={handlePlayAudio}
        isPlayingAudioUrl={playingAudioUrl}
        isSending={isSending}
      />

      {/* 入力エリア */}
      <InputArea
        onSend={handleSend}
        disabled={isSending || currentSession?.status === 'completed'}
      />

      {/* 音声プレイヤー（非表示） */}
      <AudioPlayer
        audioUrl={audioUrl}
        onEnded={handleAudioEnded}
      />
    </div>
  );
};

export default ChatPage;
