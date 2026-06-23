import { apiGet, apiPut } from './client';

import type { ApiResponse, User, UpdateUserRequest } from '@appTypes/index';

/**
 * ユーザー情報取得
 * userId は既存呼び出し互換のため受け取るが、API 契約は /users/me を使用する
 */
export const getUser = async (_userId: string): Promise<ApiResponse<User>> => {
  return apiGet<User>('/users/me');
};

/**
 * ユーザー情報更新
 * userId は既存呼び出し互換のため受け取るが、API 契約は /users/me を使用する
 */
export const updateUser = async (
  _userId: string,
  data: UpdateUserRequest,
): Promise<ApiResponse<User>> => {
  return apiPut<User>('/users/me', data);
};
