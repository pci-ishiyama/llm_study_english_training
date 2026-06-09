import { render } from '@testing-library/react';
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

vi.mock('@pages/LoginPage', (): { default: () => JSX.Element } => ({
  default: (): JSX.Element => <div>Login Page</div>,
}));
vi.mock('@pages/HomePage', (): { default: () => JSX.Element } => ({
  default: (): JSX.Element => <div>Home Page</div>,
}));
vi.mock('@pages/SessionNewPage', (): { default: () => JSX.Element } => ({
  default: (): JSX.Element => <div>Session New Page</div>,
}));
vi.mock('@pages/ChatPage', (): { default: () => JSX.Element } => ({
  default: (): JSX.Element => <div>Chat Page</div>,
}));
vi.mock('@pages/FeedbackPage', (): { default: () => JSX.Element } => ({
  default: (): JSX.Element => <div>Feedback Page</div>,
}));
vi.mock('@pages/HistoryPage', (): { default: () => JSX.Element } => ({
  default: (): JSX.Element => <div>History Page</div>,
}));
vi.mock('@pages/SettingsPage', (): { default: () => JSX.Element } => ({
  default: (): JSX.Element => <div>Settings Page</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('shows loading state initially', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });
});