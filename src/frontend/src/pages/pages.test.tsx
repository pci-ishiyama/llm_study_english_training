import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
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

describe('Placeholder Pages', () => {
  it('HomePage renders', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText(/ホーム/)).toBeTruthy();
  });

  it('SessionNewPage renders', () => {
    render(<MemoryRouter><SessionNewPage /></MemoryRouter>);
    expect(screen.getByText(/シナリオ選択/)).toBeTruthy();
  });

  it('ChatPage renders', () => {
    render(<MemoryRouter><ChatPage /></MemoryRouter>);
    expect(screen.getByText(/チャット/)).toBeTruthy();
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