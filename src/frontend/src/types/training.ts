// ===========================
// 対話トレーニング画面（SCR-003）型定義
// ===========================

export type TrainingStatus =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'sending'
  | 'receiving'
  | 'playing';

export interface TranscribeRequest {
  audio: Blob;
}

export interface TranscribeResponse {
  transcript: string;
}

export interface FeedbackPollingResult {
  feedbackId: string;
  sessionId: string;
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  suggestions: string[];
  detailedFeedback: string;
  createdAt: string;
}
