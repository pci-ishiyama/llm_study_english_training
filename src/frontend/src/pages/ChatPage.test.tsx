import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@store/authSlice';
import sessionReducer from '@store/sessionSlice';
import ChatPage from '@pages/ChatPage';
import type { SessionState } from '@store/sessionSlice';

// ─── モック ──────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

vi.mock('@api/sessions', () => ({
  endSession: vi.fn().mockResolvedValue({ success: true, data: { status: 'completed' }, error: null }),
}));

vi.mock('@api/feedbacks', () => ({
  getFeedback: vi.fn().mockResolvedValue({ success: false, data: null, error: null }),
}));

vi.mock('@api/transcribe', () => ({
  transcribeAudio: vi.fn().mockResolvedValue({ success: true, data: { transcript: '' }, error: null }),
}));

vi.mock('@hooks/useChat', () => ({
  useChat: vi.fn().mockReturnValue({
    chatLogs: [],
    isSending: false,
    error: null,
    sendMessage: vi.fn(),
  }),
}));

vi.mock('@hooks/useFeedbackPolling', () => ({
  useFeedbackPolling: vi.fn().mockReturnValue({
    feedback: null,
    isFeedbackLoading: false,
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
  }),
}));

// ─── ヘルパー ─────────────────────────────────────────────────

const defaultSessionState: SessionState = {
  currentSession: {
    sessionId: 'test-session-id',
    scenarioId: 'scenario-001',
    status: 'active' as const,
    createdAt: '2026-06-24T00:00:00Z',
  },
  currentScenario: {
    scenarioId: 'scenario-001',
    title: 'Daily Standup',
    description: 'Practice standup meetings',
    scene: 'meeting',
    difficulty: 'Beginner' as const,
    initialMessage: 'Hello!',
  },
  chatLogs: [],
  isLoading: false,
  isSending: false,
  error: null,
  audioUrl: null,
  isAudioPlaying: false,
};

const createTestStore = (sessionOverrides: Partial<SessionState> = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      session: sessionReducer,
    },
    preloadedState: {
      session: { ...defaultSessionState, ...sessionOverrides },
    },
  });
};

const renderChatPage = (sessionId = 'test-session-id', storeOverrides: Partial<SessionState> = {}) => {
  const testStore = createTestStore(storeOverrides);
  return render(
    <Provider store={testStore}>
      <MemoryRouter initialEntries={[`/session/${sessionId}/chat`]}>
        <Routes>
          <Route path="/session/:sessionId/chat" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

// ─── テスト ───────────────────────────────────────────────────

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('シナリオタイトルとセッション終了ボタンが表示される', () => {
    renderChatPage();
    expect(screen.getByText('Daily Standup')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'セッション終了' })).toBeTruthy();
  });

  it('チャットエリアが表示される', () => {
    renderChatPage();
    expect(screen.getByRole('log', { name: 'チャット履歴' })).toBeTruthy();
  });

  it('入力エリアが表示される', () => {
    renderChatPage();
    expect(screen.getByRole('textbox', { name: 'メッセージ入力' })).toBeTruthy();
  });

  it('送信ボタンが表示される', () => {
    renderChatPage();
    expect(screen.getByRole('button', { name: '送信' })).toBeTruthy();
  });

  it('マイクボタンが表示される', () => {
    renderChatPage();
    expect(screen.getByRole('button', { name: '音声入力' })).toBeTruthy();
  });

  it('セッション終了ボタンをクリックするとendSessionが呼ばれる', async () => {
    const { endSession } = await import('@api/sessions');
    renderChatPage();

    fireEvent.click(screen.getByRole('button', { name: 'セッション終了' }));

    await waitFor(() => {
      expect(endSession).toHaveBeenCalledWith('test-session-id');
    });
  });

  it('セッション終了成功後にホームへ遷移する', async () => {
    renderChatPage();

    fireEvent.click(screen.getByRole('button', { name: 'セッション終了' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('セッション終了失敗時にエラーが表示される', async () => {
    const { endSession } = await import('@api/sessions');
    vi.mocked(endSession).mockResolvedValueOnce({
      success: false,
      data: null,
      error: { code: 'ERROR', message: 'Failed' },
    });

    renderChatPage();

    fireEvent.click(screen.getByRole('button', { name: 'セッション終了' }));

    await waitFor(() => {
      expect(screen.getByText('セッションの終了に失敗しました')).toBeTruthy();
    });
  });

  it('シナリオ情報がない場合はデフォルトタイトルを表示する', () => {
    renderChatPage('test-session-id', {
      currentScenario: null,
    });
    expect(screen.getByText('対話トレーニング')).toBeTruthy();
  });

    it('送信中はステータスバッジが「送信中」になる', async () => {
    // useChat モックを送信中状態に変更
    const { useChat } = vi.mocked(await import('@hooks/useChat'));
    useChat.mockReturnValue({
      chatLogs: [],
      isSending: true,
      error: null,
      sendMessage: vi.fn(),
    });

    renderChatPage();
    // isSending=true のとき ChatArea が「AI が入力中...」を表示する
    expect(screen.getByText('AI が入力中...')).toBeTruthy();
  });

  it('フィードバックが届いたらバナーが表示される', async () => {
    const { useFeedbackPolling } = vi.mocked(await import('@hooks/useFeedbackPolling'));
    useFeedbackPolling.mockReturnValue({
      feedback: {
        feedbackId: 'fb-001',
        sessionId: 'test-session-id',
        scenarioId: 'scenario-001',
        overallScore: 85,
        grade: 'B' as const,
        scores: { grammar: 80, fluency: 85, itVocabulary: 90 },
        corrections: [],
        keyPhrases: [],
        overallComment: 'Good job!',
        status: 'completed' as const,
        createdAt: '2026-06-24T00:00:00Z',
      },
      isFeedbackLoading: false,
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
    });

    renderChatPage();
    expect(screen.getByText('📊 フィードバックが届きました！')).toBeTruthy();
    expect(screen.getByText('総合スコア: 85点')).toBeTruthy();
  });
});
