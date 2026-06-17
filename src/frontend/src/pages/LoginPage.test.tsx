import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import LoginPage from '@pages/LoginPage';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockCompleteNewPassword = vi.fn();
const mockClearError = vi.fn();
let mockIsLoading = false;
let mockError: string | null = null;

let mockPendingChallenge: {
  email: string;
  nextStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED';
  missingAttributes?: string[];
} | null = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

vi.mock('@hooks/useAuth', () => ({
  useAuth: (): {
    login: typeof mockLogin;
    completeNewPassword: typeof mockCompleteNewPassword;
    isLoading: boolean;
    error: string | null;
    clearError: typeof mockClearError;
    pendingChallenge: typeof mockPendingChallenge;
  } => ({
    login: mockLogin,
    completeNewPassword: mockCompleteNewPassword,
    isLoading: mockIsLoading,
    error: mockError,
    clearError: mockClearError,
    pendingChallenge: mockPendingChallenge,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPendingChallenge = null;
    mockIsLoading = false;
    mockError = null;
  });

  it('navigates to home after completed login', async () => {
    mockLogin.mockResolvedValue({ nextStep: 'DONE' });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows new password form when login requires password change', async () => {
    mockLogin.mockImplementation(() => {
      mockPendingChallenge = {
        email: 'user@example.com',
        nextStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED',
        missingAttributes: ['name'],
      };
      return {
        nextStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED',
        missingAttributes: ['name'],
      };
    });
    const user = userEvent.setup();

    const { rerender } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'TempPass123!');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'TempPass123!');
    });

    rerender(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: '初回パスワード変更' })).toBeInTheDocument();
    expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submits new password and navigates after completing required password change', async () => {
    mockPendingChallenge = {
      email: 'user@example.com',
      nextStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED',
      missingAttributes: ['name'],
    };
    mockCompleteNewPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('新しいパスワード'), 'NewPass123!');
    await user.type(screen.getByLabelText('お名前'), 'New User');
    await user.click(screen.getByRole('button', { name: '新しいパスワードを設定' }));

    await waitFor(() => {
      expect(mockCompleteNewPassword).toHaveBeenCalledWith('NewPass123!', 'New User');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('does not navigate when login returns a follow-up step other than done', async () => {
    mockLogin.mockResolvedValue({ nextStep: 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE' });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'Password123!');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('hides the name input when no missing attributes are requested', () => {
    mockPendingChallenge = {
      email: 'user@example.com',
      nextStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED',
    };

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument();
    expect(screen.queryByLabelText('お名前')).not.toBeInTheDocument();
  });

  it('shows loading indicators for login and password change actions', () => {
    mockIsLoading = true;
    mockError = '認証エラー';
    mockPendingChallenge = {
      email: 'user@example.com',
      nextStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED',
      missingAttributes: ['name'],
    };

    const { rerender } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('認証エラー')).toBeInTheDocument();
    expect(screen.queryByText('新しいパスワードを設定')).not.toBeInTheDocument();

    mockPendingChallenge = null;
    rerender(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
  });
});
