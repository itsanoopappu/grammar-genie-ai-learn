
import { atom, useAtom } from 'jotai';
import { produce } from 'immer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  topic: string;
  level: string;
  explanation: string;
  detailed_explanation?: string;
  first_principles_explanation?: string;
  wrong_answer_explanations?: Record<string, string>;
  difficulty_score?: number;
}

interface TestResults {
  score: number;
  total?: number;
  recommendedLevel: string;
  topicPerformance: Record<string, { correct: number; total: number }>;
  levelBreakdown: Record<string, number>;
  weaknesses: string[];
  strengths: string[];
  xpEarned: number;
  detailedFeedback: {
    message: string;
    nextSteps: string[];
    questionReview?: any[];
  };
}

interface TestState {
  testId: string | null;
  testStarted: boolean;
  currentQuestion: number;
  selectedAnswer: string;
  questions: Question[];
  userAnswers: Record<string, string>;
  testCompleted: boolean;
  testResults: TestResults | null;
  loading: boolean;
  error: string | null;
  timeSpent: number;
  startTime: Date | null;
}

const initialState: TestState = {
  testId: null,
  testStarted: false,
  currentQuestion: 0,
  selectedAnswer: '',
  questions: [],
  userAnswers: {},
  testCompleted: false,
  testResults: null,
  loading: false,
  error: null,
  timeSpent: 0,
  startTime: null
};

const testStateAtom = atom<TestState>(initialState);

export const usePlacementTestLogic = () => {
  const [state, setState] = useAtom(testStateAtom);
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const startTest = async () => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
    }));

    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'start_assessment',
          user_id: user?.id
        }
      });

      if (error) throw error;
      
      setState(produce(state => {
        state.testId = data.testId;
        state.questions = data.questions;
        state.testStarted = true;
        state.currentQuestion = 0;
        state.userAnswers = {};
        state.testCompleted = false;
        state.startTime = new Date();
        state.timeSpent = 0;
        state.loading = false;
      }));
    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to start assessment. Please try again.';
      }));
    }
  };

  const submitAnswer = async () => {
    if (!state.selectedAnswer || !state.questions[state.currentQuestion]) return;

    setState(produce(state => { 
      state.loading = true;
    }));

    try {
      const currentQuestion = state.questions[state.currentQuestion];
      
      // Submit answer without getting immediate feedback
      const { error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'submit_answer',
          user_id: user?.id,
          test_id: state.testId,
          question_id: currentQuestion.id,
          user_answer: state.selectedAnswer
        }
      });

      if (error) throw error;

      setState(produce(state => {
        state.userAnswers[currentQuestion.id] = state.selectedAnswer;
        state.loading = false;
        state.selectedAnswer = '';
      }));

    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to submit answer. Please try again.';
      }));
    }
  };

  const nextQuestion = () => {
    if (state.currentQuestion < state.questions.length - 1) {
      setState(produce(state => {
        state.currentQuestion += 1;
      }));
    } else {
      completeTest();
    }
  };

  const completeTest = async () => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
    }));

    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'complete_assessment',
          answers: state.userAnswers,
          test_id: state.testId
        }
      });

      if (error) throw error;
      
      setState(produce(state => {
        state.testResults = data;
        state.testCompleted = true;
        state.loading = false;
      }));

      // Update user profile with new level and XP
      if (profile && data.recommendedLevel && data.xpEarned) {
        const shouldUpdateLevel = shouldUpgradeLevel(profile.level, data.recommendedLevel);
        const updates: any = {
          xp: (profile.xp || 0) + data.xpEarned
        };
        
        if (shouldUpdateLevel) {
          updates.level = data.recommendedLevel;
        }
        
        await updateProfile(updates);
      }
    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to complete assessment. Please try again.';
      }));
    }
  };

  const resetTest = () => {
    setState(initialState);
  };

  const setSelectedAnswer = (answer: string) => {
    setState(produce(state => { state.selectedAnswer = answer }));
  };

  const generateQuestions = async (count: number = 100, level: string = 'mixed') => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-assessment-questions', {
        body: { 
          action: 'generate_questions',
          count,
          level
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to generate questions:', error);
      throw error;
    }
  };

  return {
    state,
    startTest,
    submitAnswer,
    nextQuestion,
    resetTest,
    setSelectedAnswer,
    generateQuestions
  };
};

function shouldUpgradeLevel(currentLevel: string | null, newLevel: string): boolean {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(currentLevel || 'A1');
  const newIndex = levelOrder.indexOf(newLevel);
  return newIndex > currentIndex;
}
