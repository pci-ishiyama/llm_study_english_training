import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * axios インスタンス
 * - リクエスト時に Cognito ID トークンを Authorization ヘッダーに自動付与
 * - レスポンスエラー時に 401 → ログインページへリダイレクト
 */
const createApiClient = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_API_ENDPOINT as string;

  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // リクエストインターセプター: ID トークンを付与
  instance.interceptors.request.use(
    async (
      config: InternalAxiosRequestConfig,
    ): Promise<InternalAxiosRequestConfig> => {
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (idToken) {
          config.headers.set('Authorization', `Bearer ${idToken}`);
        }
      } catch {
        // 未認証の場合はトークンなしで送信
      }
      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  // レスポンスインターセプター: 401 時はログインページへ
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

export const apiClient: AxiosInstance = createApiClient();

/**
 * GET リクエストヘルパー
 */
export const apiGet = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

/**
 * POST リクエストヘルパー
 */
export const apiPost = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

/**
 * PUT リクエストヘルパー
 */
export const apiPut = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

/**
 * DELETE リクエストヘルパー
 */
export const apiDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};
