// ── DynamoDB エンティティ型定義 ────────────────────────────────

export interface UserEntity {
  userId: string;
  email: string;
  name: string;
  englishLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  learningGoal?: string;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

export interface ScenarioEntity {
  scenarioId: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  systemPrompt: string;
  isActive: boolean;
  createdAt: string;
}

export interface SessionEntity {
  sessionId: string;
  userId: string;
  scenarioId: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  endedAt?: string;
  totalTurns: number;
  ttl?: number;
}

export interface ChatLogEntity {
  sessionId: string;
  turnId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  audioS3Key?: string;
  timestamp: string;
  ttl?: number;
}

export interface FeedbackEntity {
  feedbackId: string;
  sessionId: string;
  userId: string;
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  suggestions: string[];
  detailedFeedback: string;
  createdAt: string;
  ttl?: number;
}
