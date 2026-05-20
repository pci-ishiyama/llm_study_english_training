import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '@hooks/useAuth';

const mockGetCurrentUser = vi.fn();
const mockFetchAuthSession = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockSignUp = vi.fn();
const mockConfirmSignUp = vi.fn();

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
  fetchAuthSession: () => mockFetchAuthSession(),
  signIn: (input: unknown) => mockSignIn(input),
  signOut: () => mockSignOut(),
  signUp: (input: unknown) => mockSignUp(input),
  confirmSignUp: (input: unknown) => mockConfirmSignUp(input),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with unauthenticated state when no session', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('initializes with authenticated state when session exists', async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: {
          payload: { email: 'test@example.com' },
          toString: () => 'mock-token',
        },
      },
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('login succeeds and sets user', async () => {
    mockGetCurrentUser.mockRejectedValueOnce(new Error('Not authenticated'));
    mockSignIn.mockResolvedValue({});
    mockGetCurrentUser.mockResolvedValue({ userId: 'u2' });
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: {
          payload: { email: 'login@example.com' },
          toString: () => 'token',
        },
      },
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login('login@example.com', 'password');
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('login failure sets error', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    mockSignIn.mockRejectedValue(new Error('Incorrect username or password'));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      try {
        await result.current.login('bad@example.com', 'wrong');
      } catch {
        // expected
      }
    });
    expect(result.current.error).toBe('Incorrect username or password');
  });

  it('logout clears user', async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: {
          payload: { email: 'test@example.com' },
          toString: () => 'token',
        },
      },
    });
    mockSignOut.mockResolvedValue({});
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('register calls signUp', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    mockSignUp.mockResolvedValue({});
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.register('new@example.com', 'password', 'New User');
    });
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'new@example.com' })
    );
  });

  it('confirmRegistration calls confirmSignUp', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    mockConfirmSignUp.mockResolvedValue({});
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.confirmRegistration('test@example.com', '123456');
    });
    expect(mockConfirmSignUp).toHaveBeenCalledWith({
      username: 'test@example.com',
      confirmationCode: '123456',
    });
  });

  it('getIdToken returns token string', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: { toString: () => 'id-token-value' },
      },
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const token = await result.current.getIdToken();
    expect(token).toBe('id-token-value');
  });

  it('clearError clears error state', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    mockSignIn.mockRejectedValue(new Error('Some error'));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      try { await result.current.login('x@x.com', 'x'); } catch { /* expected */ }
    });
    expect(result.current.error).not.toBeNull();
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });
});