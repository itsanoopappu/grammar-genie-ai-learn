
// Centralized type definitions for exercises
export interface ExerciseContent {
  question: string;
  options?: string[];
  correct_answer: string; // Standardized to snake_case
  explanation: string;
  hints?: string[];
  commonMistakes?: string[];
}

export interface Exercise {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'error-correction' | 'transformation';
  content: ExerciseContent;
  difficulty_level: number;
  estimated_time_seconds: number;
  topic_id?: string;
}

export interface ExerciseAttempt {
  id?: string;
  user_id: string;
  exercise_id: string;
  session_id: string;
  user_answer: { answer: string };
  is_correct: boolean;
  time_taken_seconds?: number;
  ai_feedback?: any;
  difficulty_at_attempt?: number;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  topic_id: string;
  session_type: string;
  exercises_attempted: number;
  exercises_correct: number;
  time_spent_seconds: number;
  started_at: string;
  completed_at?: string;
}
