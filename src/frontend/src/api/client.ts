import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { ApiError, ApiResponse } from '@appTypes/index';

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

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'success' in value && 'data' in value && 'error' in value;
};

const normalizeError = (value: unknown): ApiError => {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const error = value as { code?: unknown; message?: unknown; details?: unknown };
    return {
      code: typeof error.code === 'string' ? error.code : 'ERROR',
      message: typeof error.message === 'string' ? error.message : 'Unexpected error',
      details:
        typeof error.details === 'object' && error.details !== null
          ? (error.details as Record<string, unknown>)
          : undefined,
    };
  }

  return {
    code: 'ERROR',
    message: 'Unexpected error',
  };
};

const normalizeApiResponse = <T>(
  response: AxiosResponse<T>,
): ApiResponse<T> => {
  if (isApiResponse<T>(response.data)) {
    return response.data;
  }

  if (response.status >= 400) {
    return {
      success: false,
      data: null,
      error: normalizeError(response.data),
    };
  }

  return {
    success: true,
    data: response.data,
    error: null,
  };
};

/**
 * GET リクエストヘルパー
 */
export const apiGet = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.get<T>(url, config);
  return normalizeApiResponse(response);
};

/**
 * POST リクエストヘルパー
 */
export const apiPost = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.post<T>(url, data, config);
  return normalizeApiResponse(response);
};

/**
 * PUT リクエストヘルパー
 */
export const apiPut = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.put<T>(url, data, config);
  return normalizeApiResponse(response);
};

/**
 * DELETE リクエストヘルパー
 */
export const apiDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.delete<T>(url, config);
  return normalizeApiResponse(response);
};
