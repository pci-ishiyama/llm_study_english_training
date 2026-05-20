import { useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  type SignInInput,
  type SignUpInput,
} from 'aws-amplify/auth';

export interface AuthUser {
  userId: string;
  email: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  confirmRegistration: (email: string, code: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  clearError: () => void;
}

/**
 * Cognito 認証フック
 * ログイン・ログアウト・サインアップ・トークン取得を提供する
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初回マウント時に認証状態を確認
  useEffect(() => {
    void checkCurrentUser();
  }, []);

  const checkCurrentUser = async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      const email =
        (idToken?.payload['email'] as string | undefined) ?? '';

      setUser({
        userId: currentUser.userId,
        email,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const input: SignInInput = { username: email, password };
        await signIn(input);
        await checkCurrentUser();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'ログインに失敗しました';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ログアウトに失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const input: SignUpInput = {
          username: email,
          password,
          options: {
            userAttributes: {
              email,
              name,
            },
          },
        };
        await signUp(input);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '登録に失敗しました';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const confirmRegistration = useCallback(
    async (email: string, code: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await confirmSignUp({ username: email, confirmationCode: code });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '確認コードの検証に失敗しました';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    register,
    confirmRegistration,
    getIdToken,
    clearError,
  };
};
