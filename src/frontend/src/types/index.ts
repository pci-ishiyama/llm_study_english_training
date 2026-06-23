// ===========================
// 共通レスポンス型
// ===========================

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ===========================
// ユーザー
// ===========================

export type EnglishLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface User {
  userId: string;
  name: string;
  englishLevel: EnglishLevel;
  learningGoal?: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  name: string;
  englishLevel: EnglishLevel;
  learningGoal?: string;
}

// ===========================
// シナリオ
// ===========================

export interface Scenario {
  scenarioId: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  systemPrompt: string;
  lastScore?: number;
  lastPlayedAt?: string;
  initialMessage?: string;
}

// ===========================
// セッション
// ===========================

export type SessionStatus = 'active' | 'completed';

export interface Session {
  sessionId: string;
  scenarioId: string;
  status: SessionStatus;
  chatLogs?: ChatLog[];
  createdAt: string;
}

export interface StartSessionRequest {
  scenarioId: string;
}

export interface StartSessionResponse {
  sessionId: string;
  scenarioId: string;
  initialMessage: string;
  audioUrl: string;
  createdAt: string;
}

export interface EndSessionResponse {
  sessionId: string;
  feedbackId: string;
  status: string;
}

// ===========================
// チャット
// ===========================

export type Speaker = 'USER' | 'AI';

export interface ChatLog {
  chatLogId: string;
  speaker: Speaker;
  messageText: string;
  audioUrl?: string;
  translation?: string;
  timestamp: string;
}

export interface SendChatRequest {
  userMessage: string;
  messageType: 'text';
}

export interface SendChatResponse {
  chatLogId: string;
  aiMessage: string;
  audioUrl: string;
  translation: string;
  timestamp: string;
}

// ===========================
// フィードバック
// ===========================

export type FeedbackGrade = 'A' | 'B' | 'C' | 'D';
export type FeedbackStatus = 'generating' | 'completed' | 'failed';

export interface FeedbackScores {
  grammar: number;
  fluency: number;
  itVocabulary: number;
}

export interface Correction {
  original: string;
  improved: string;
  explanation: string;
}

export interface KeyPhrase {
  phrase: string;
  usage: string;
  example: string;
}

export interface Feedback {
  feedbackId: string;
  sessionId: string;
  scenarioId: string;
  overallScore: number;
  grade: FeedbackGrade;
  scores: FeedbackScores;
  corrections: Correction[];
  keyPhrases: KeyPhrase[];
  overallComment: string;
  status: FeedbackStatus;
  createdAt: string;
}

// ===========================
// 学習履歴
// ===========================

export interface HistoryItem {
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  overallScore: number;
  grade: FeedbackGrade;
  feedbackId: string;
  createdAt: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  nextToken?: string;
}

// ===========================
// ダッシュボード
// ===========================

export interface DashboardData {
  weeklyCount: number;
  streakDays: number;
  averageScore: number;
  recentScores: { date: string; score: number }[];
  recommendedScenario: Scenario;
}
