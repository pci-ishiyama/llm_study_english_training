import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@store/index';
import HomePage from '@pages/HomePage';
import SessionNewPage from '@pages/SessionNewPage';
import ChatPage from '@pages/ChatPage';
import FeedbackPage from '@pages/FeedbackPage';
import HistoryPage from '@pages/HistoryPage';
import SettingsPage from '@pages/SettingsPage';

const mockGetScenarios = vi.fn();
const mockStartSession = vi.fn();

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('Not authenticated')),
  fetchAuthSession: vi.fn().mockRejectedValue(new Error('Not authenticated')),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
}));

vi.mock('@api/scenarios', () => ({
  getScenarios: (...args: unknown[]): unknown => mockGetScenarios(...args),
}));

vi.mock('@api/sessions', () => ({
  startSession: (...args: unknown[]): unknown => mockStartSession(...args),
  endSession: vi.fn().mockResolvedValue({ success: true, data: { status: 'completed' }, error: null }),
}));

vi.mock('@api/feedbacks', () => ({
  getFeedback: vi.fn().mockResolvedValue({ success: false, data: null, error: null }),
}));

vi.mock('@api/transcribe', () => ({
  transcribeAudio: vi.fn().mockResolvedValue({ success: true, data: { transcript: '' }, error: null }),
}));

const mockScenario = {
  scenarioId: 'scenario-1',
  title: 'Daily Standup',
  description: 'Share daily updates',
  scene: 'meeting',
  difficulty: 'Beginner' as const,
  initialMessage: 'You are a Scrum Master.',
};

describe('Placeholder Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetScenarios.mockResolvedValue({ success: true, data: [], error: null });
    mockStartSession.mockResolvedValue({ success: true, data: { sessionId: 'test-session' }, error: null });
  });

  it('HomePage renders', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText(/ホーム/)).toBeTruthy();
  });

  it('SessionNewPage renders', () => {
    render(<MemoryRouter><SessionNewPage /></MemoryRouter>);
    expect(screen.getByText(/シナリオを選択/)).toBeTruthy();
  });

  it('SessionNewPage shows loading state', async () => {
    // ローディング中の状態をテスト
    let resolveScenarios: (value: unknown) => void;
    mockGetScenarios.mockReturnValue(
      new Promise((resolve) => { resolveScenarios = resolve; })
    );
    render(<MemoryRouter><SessionNewPage /></MemoryRouter>);
    expect(screen.getByText('読み込み中...')).toBeTruthy();
    // ロード完了
    resolveScenarios!({ success: true, data: [], error: null });
    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).toBeNull();
    });
  });

  it('SessionNewPage shows error when getScenarios fails', async () => {
    mockGetScenarios.mockResolvedValue({ success: false, data: null, error: { code: 'ERR', message: 'fail' } });
    render(<MemoryRouter><SessionNewPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('シナリオの取得に失敗しました')).toBeTruthy();
    });
  });

  it('SessionNewPage shows scenarios and allows selection', async () => {
    mockGetScenarios.mockResolvedValue({ success: true, data: [mockScenario], error: null });
    render(<MemoryRouter><SessionNewPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Daily Standup')).toBeTruthy();
    });
    // シナリオを選択
    fireEvent.click(screen.getByText('Daily Standup'));
    // 開始ボタンが有効になる
    const startButton = screen.getByRole('button', { name: /開始する/ });
    expect(startButton).toBeTruthy();
  });

  it('SessionNewPage shows isStarting state when starting session', async () => {
    mockGetScenarios.mockResolvedValue({ success: true, data: [mockScenario], error: null });
    let resolveStart: (value: unknown) => void;
    mockStartSession.mockReturnValue(
      new Promise((resolve) => { resolveStart = resolve; })
    );
    render(
      <MemoryRouter initialEntries={['/session/new']}>
        <Routes>
          <Route path="/session/new" element={<SessionNewPage />} />
          <Route path="/session/:sessionId/chat" element={<div>Chat Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Daily Standup')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('Daily Standup'));
    fireEvent.click(screen.getByRole('button', { name: /開始する/ }));
    await waitFor(() => {
      expect(screen.getByText('開始中...')).toBeTruthy();
    });
    resolveStart!({ success: true, data: { sessionId: 'new-session' }, error: null });
  });

  it('SessionNewPage shows error when startSession fails', async () => {
    mockGetScenarios.mockResolvedValue({ success: true, data: [mockScenario], error: null });
    mockStartSession.mockResolvedValue({ success: false, data: null, error: { code: 'ERR', message: 'fail' } });
    render(<MemoryRouter><SessionNewPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Daily Standup')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('Daily Standup'));
    fireEvent.click(screen.getByRole('button', { name: /開始する/ }));
    await waitFor(() => {
      expect(screen.getByText('セッションの開始に失敗しました')).toBeTruthy();
    });
  });

  it('ChatPage renders with sessionId', () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/session/test-session-id/chat']}>
          <Routes>
            <Route path="/session/:sessionId/chat" element={<ChatPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    // チャット画面がレンダリングされることを確認（チャット履歴エリアの存在で確認）
    expect(screen.getByRole('log', { name: 'チャット履歴' })).toBeTruthy();
  });

  it('FeedbackPage renders', () => {
    render(<MemoryRouter><FeedbackPage /></MemoryRouter>);
    expect(screen.getByText(/フィードバック/)).toBeTruthy();
  });

  it('HistoryPage renders', () => {
    render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    expect(screen.getByText(/学習履歴/)).toBeTruthy();
  });

  it('SettingsPage renders', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    expect(screen.getByText(/設定/)).toBeTruthy();
  });
});