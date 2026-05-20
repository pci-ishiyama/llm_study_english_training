import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

import type { User } from '@appTypes/index';

// ===========================
// 型定義
// ===========================

export interface AuthState {
  userId: string | null;
  email: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ===========================
// 初期状態
// ===========================

const initialState: AuthState = {
  userId: null,
  email: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ===========================
// 非同期アクション
// ===========================

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth');
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      const email = (idToken?.payload['email'] as string | undefined) ?? '';
      return { userId: currentUser.userId, email };
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : '認証情報の取得に失敗しました',
      );
    }
  },
);

// ===========================
// スライス
// ===========================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(
      state,
      action: PayloadAction<{ userId: string; email: string }>,
    ) {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.isAuthenticated = true;
      state.error = null;
    },
    setUserProfile(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.userId = null;
      state.email = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.userId = action.payload.userId;
        state.email = action.payload.email;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const {
  setUser,
  setUserProfile,
  clearAuth,
  setAuthError,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
