import { describe, it, expect } from 'vitest';
import { store } from '@store/index';
import {
  setUser,
  setUserProfile,
  clearAuth,
  setAuthError,
  clearAuthError,
} from '@store/authSlice';
import {
  startSessionPending,
  startSessionFulfilled,
  startSessionRejected,
  sendChatPending,
  sendChatFulfilled,
  sendChatRejected,
  endSessionFulfilled,
  setAudioPlaying,
  setAudioUrl,
  clearSession,
  clearSessionError,
} from '@store/sessionSlice';

describe('authSlice', () => {
  it('initial state is correct', () => {
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
    expect(state.error).toBeNull();
  });

  it('setUser sets userId and isAuthenticated', () => {
    store.dispatch(setUser({ userId: 'u1', email: 'test@example.com' }));
    const state = store.getState().auth;
    expect(state.userId).toBe('u1');
    expect(state.email).toBe('test@example.com');
    expect(state.isAuthenticated).toBe(true);
  });

  it('setUserProfile sets user profile', () => {
    store.dispatch(setUserProfile({
      userId: 'u1',
      name: 'Test User',
      englishLevel: 'Intermediate',
      createdAt: '2024-01-01T00:00:00Z',
    }));
    const state = store.getState().auth;
    expect(state.user?.name).toBe('Test User');
  });

  it('setAuthError sets error', () => {
    store.dispatch(setAuthError('Login failed'));
    const state = store.getState().auth;
    expect(state.error).toBe('Login failed');
  });

  it('clearAuthError clears error', () => {
    store.dispatch(clearAuthError());
    const state = store.getState().auth;
    expect(state.error).toBeNull();
  });

  it('clearAuth resets state', () => {
    store.dispatch(clearAuth());
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
    expect(state.user).toBeNull();
  });
});

describe('sessionSlice', () => {
  const mockScenario = {
    scenarioId: 's1',
    title: 'Test Scenario',
    description: 'desc',
    scene: 'office',
    difficulty: 'Intermediate' as const,
  };

  const mockStartResponse = {
    sessionId: 'sess1',
    scenarioId: 's1',
    initialMessage: 'Hello!',
    audioUrl: 'https://s3.example.com/audio.mp3',
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('initial state is correct', () => {
    store.dispatch(clearSession());
    const state = store.getState().session;
    expect(state.currentSession).toBeNull();
    expect(state.chatLogs).toHaveLength(0);
    expect(state.isLoading).toBe(false);
  });

  it('startSessionPending sets isLoading', () => {
    store.dispatch(startSessionPending());
    expect(store.getState().session.isLoading).toBe(true);
  });

  it('startSessionFulfilled sets session and chatLogs', () => {
    store.dispatch(startSessionFulfilled({ response: mockStartResponse, scenario: mockScenario }));
    const state = store.getState().session;
    expect(state.currentSession?.sessionId).toBe('sess1');
    expect(state.chatLogs).toHaveLength(1);
    expect(state.chatLogs[0].speaker).toBe('AI');
    expect(state.isLoading).toBe(false);
  });

  it('startSessionRejected sets error', () => {
    store.dispatch(clearSession());
    store.dispatch(startSessionRejected('Failed to start'));
    const state = store.getState().session;
    expect(state.error).toBe('Failed to start');
    expect(state.isLoading).toBe(false);
  });

  it('sendChatPending adds user message optimistically', () => {
    store.dispatch(startSessionFulfilled({ response: mockStartResponse, scenario: mockScenario }));
    store.dispatch(sendChatPending('Hello AI'));
    const state = store.getState().session;
    expect(state.isSending).toBe(true);
    const lastLog = state.chatLogs[state.chatLogs.length - 1];
    expect(lastLog.speaker).toBe('USER');
    expect(lastLog.messageText).toBe('Hello AI');
  });

  it('sendChatFulfilled adds AI message', () => {
    store.dispatch(sendChatFulfilled({
      chatLogId: 'cl1',
      aiMessage: 'Hi there!',
      audioUrl: 'https://s3.example.com/reply.mp3',
      translation: 'こんにちは！',
      timestamp: '2024-01-01T00:01:00Z',
    }));
    const state = store.getState().session;
    expect(state.isSending).toBe(false);
    const lastLog = state.chatLogs[state.chatLogs.length - 1];
    expect(lastLog.speaker).toBe('AI');
    expect(lastLog.messageText).toBe('Hi there!');
  });

  it('sendChatRejected removes optimistic user message', () => {
    store.dispatch(sendChatPending('Oops'));
    const beforeLen = store.getState().session.chatLogs.length;
    store.dispatch(sendChatRejected('Network error'));
    const state = store.getState().session;
    expect(state.chatLogs).toHaveLength(beforeLen - 1);
    expect(state.error).toBe('Network error');
  });

  it('endSessionFulfilled sets status to completed', () => {
    store.dispatch(endSessionFulfilled());
    expect(store.getState().session.currentSession?.status).toBe('completed');
  });

  it('setAudioPlaying toggles audio state', () => {
    store.dispatch(setAudioPlaying(true));
    expect(store.getState().session.isAudioPlaying).toBe(true);
    store.dispatch(setAudioPlaying(false));
    expect(store.getState().session.isAudioPlaying).toBe(false);
  });

  it('setAudioUrl sets audio url', () => {
    store.dispatch(setAudioUrl('https://s3.example.com/new.mp3'));
    expect(store.getState().session.audioUrl).toBe('https://s3.example.com/new.mp3');
    store.dispatch(setAudioUrl(null));
    expect(store.getState().session.audioUrl).toBeNull();
  });

  it('clearSessionError clears error', () => {
    store.dispatch(sendChatRejected('some error'));
    store.dispatch(clearSessionError());
    expect(store.getState().session.error).toBeNull();
  });

  it('clearSession resets to initial state', () => {
    store.dispatch(clearSession());
    const state = store.getState().session;
    expect(state.currentSession).toBeNull();
    expect(state.chatLogs).toHaveLength(0);
  });
});