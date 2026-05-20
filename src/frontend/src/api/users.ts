import { apiGet, apiPut } from './client';

import type { ApiResponse, User, UpdateUserRequest } from '@appTypes/index';

/**
 * ユーザー情報取得
 */
export const getUser = async (userId: string): Promise<ApiResponse<User>> => {
  return apiGet<ApiResponse<User>>(`/users/${userId}`);
};

/**
 * ユーザー情報更新
 */
export const updateUser = async (
  userId: string,
  data: UpdateUserRequest,
): Promise<ApiResponse<User>> => {
  return apiPut<ApiResponse<User>>(`/users/${userId}`, data);
};
