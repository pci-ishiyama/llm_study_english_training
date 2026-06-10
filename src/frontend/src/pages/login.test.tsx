import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '@pages/LoginPage';

const mockLogin = vi.fn();
const mockClearError = vi.fn();
const mockNavigate = vi.fn();
const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn<() => {
    login: typeof mockLogin;
    isLoading: boolean;
    error: string | null;
    clearError: typeof mockClearError;
  }>(() => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  })),
}));

vi.mock('@hooks/useAuth', (): {
  useAuth: typeof mockUseAuth;
} => ({
  useAuth: mockUseAuth,
}));

vi.mock('react-router-dom', async (): Promise<typeof import('react-router-dom')> => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return { ...actual, useNavigate: (): typeof mockNavigate => mockNavigate };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  it('renders login form', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByText(/IT English Trainee/i)).toBeTruthy();
    expect(screen.getByPlaceholderText('example@company.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    expect(screen.getByText('ログイン')).toBeTruthy();
  });

  it('calls login on form submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText('example@company.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByText('ログイン'));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123'));
  });

  it('shows error message when error exists', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials',
      clearError: mockClearError,
    });

    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByText('Invalid credentials')).toBeTruthy();
  });
});