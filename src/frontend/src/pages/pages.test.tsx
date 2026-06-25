import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@store/index';
import HomePage from '@pages/HomePage';
import SessionNewPage from '@pages/SessionNewPage';
import ChatPage from '@pages/ChatPage';
import FeedbackPage from '@pages/FeedbackPage';
import HistoryPage from '@pages/HistoryPage';
import SettingsPage from '@pages/SettingsPage';

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('Not authenticated')),
  fetchAuthSession: vi.fn().mockRejectedValue(new Error('Not authenticated')),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
}));

vi.mock('@api/scenarios', () => ({
  getScenarios: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

vi.mock('@api/sessions', () => ({
  startSession: vi.fn().mockResolvedValue({ data: { sessionId: 'test-session' }, error: null }),
  endSession: vi.fn().mockResolvedValue({ success: true, data: { status: 'completed' }, error: null }),
}));

vi.mock('@api/feedbacks', () => ({
  getFeedback: vi.fn().mockResolvedValue({ success: false, data: null, error: null }),
}));

vi.mock('@api/transcribe', () => ({
  transcribeAudio: vi.fn().mockResolvedValue({ success: true, data: { transcript: '' }, error: null }),
}));

describe('Placeholder Pages', () => {
  it('HomePage renders', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText(/ホーム/)).toBeTruthy();
  });

  it('SessionNewPage renders', () => {
    render(<MemoryRouter><SessionNewPage /></MemoryRouter>);
    expect(screen.getByText(/シナリオを選択/)).toBeTruthy();
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