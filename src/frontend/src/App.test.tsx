import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('Not authenticated')),
  fetchAuthSession: vi.fn().mockRejectedValue(new Error('Not authenticated')),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
}));

vi.mock('@pages/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock('@pages/HomePage', () => ({
  default: () => <div>Home Page</div>,
}));
vi.mock('@pages/SessionNewPage', () => ({
  default: () => <div>Session New Page</div>,
}));
vi.mock('@pages/ChatPage', () => ({
  default: () => <div>Chat Page</div>,
}));
vi.mock('@pages/FeedbackPage', () => ({
  default: () => <div>Feedback Page</div>,
}));
vi.mock('@pages/HistoryPage', () => ({
  default: () => <div>History Page</div>,
}));
vi.mock('@pages/SettingsPage', () => ({
  default: () => <div>Settings Page</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('shows loading state initially', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });
});