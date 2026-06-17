import { useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  confirmSignIn,
  getCurrentUser,
  fetchAuthSession,
  type SignInInput,
  type SignInOutput,
  type SignUpInput,
} from 'aws-amplify/auth';

export interface AuthUser {
  userId: string;
  email: string;
}

export interface PendingChallenge {
  email: string;
  nextStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED';
  missingAttributes?: string[];
}

export interface LoginResult {
  nextStep: SignInOutput['nextStep']['signInStep'];
  missingAttributes?: string[];
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingChallenge: PendingChallenge | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeNewPassword: (newPassword: string, name?: string) => Promise<void>;
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
  const [pendingChallenge, setPendingChallenge] = useState<PendingChallenge | null>(null);

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
    async (email: string, password: string): Promise<LoginResult> => {
      setIsLoading(true);
      setError(null);
      setPendingChallenge(null);
      try {
        const input: SignInInput = { username: email, password };
        const result = await signIn(input);
        const nextStep = result.nextStep.signInStep;

        if (nextStep === 'DONE') {
          await checkCurrentUser();
          return { nextStep };
        }

        if (nextStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          const missingAttributes = result.nextStep.missingAttributes;
          setPendingChallenge({
            email,
            nextStep,
            missingAttributes,
          });
          setUser(null);
          return {
            nextStep,
            missingAttributes,
          };
        }

        throw new Error(`未対応のサインインステップです: ${nextStep}`);
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

  const completeNewPassword = useCallback(
    async (newPassword: string, name?: string): Promise<void> => {
      if (pendingChallenge === null) {
        throw new Error('初回パスワード変更が必要なログイン状態ではありません');
      }

      setIsLoading(true);
      setError(null);
      try {
        const trimmedName = name?.trim();
        const userAttributes =
          trimmedName === undefined || trimmedName === ''
            ? undefined
            : { name: trimmedName };

        const result = await confirmSignIn({
          challengeResponse: newPassword,
          options: userAttributes === undefined ? undefined : { userAttributes },
        });

        if (result.nextStep.signInStep !== 'DONE') {
          throw new Error(`未対応のサインインステップです: ${result.nextStep.signInStep}`);
        }

        setPendingChallenge(null);
        await checkCurrentUser();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '初回パスワード変更に失敗しました';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [pendingChallenge],
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut();
      setUser(null);
      setPendingChallenge(null);
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
    pendingChallenge,
    login,
    completeNewPassword,
    logout,
    register,
    confirmRegistration,
    getIdToken,
    clearError,
  };
};
