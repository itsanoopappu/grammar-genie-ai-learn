
import { atom, useAtom } from 'jotai';
import { produce } from 'immer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface Question {
  question: string;
  options: string[];
  correct: string;
  topic: string;
  level: string;
  explanation: string;
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
  testType: 'quick' | 'comprehensive';
  timeSpent: number;
  startTime: Date | null;
  estimatedTime: number;
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
  testType: 'quick',
  timeSpent: 0,
  startTime: null,
  estimatedTime: 5
};

const testStateAtom = atom<TestState>(initialState);

export const usePlacementTestLogic = () => {
  const [state, setState] = useAtom(testStateAtom);
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const startTest = async (testType: 'quick' | 'comprehensive' = 'quick') => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
      state.testType = testType;
    }));

    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'generate',
          level: profile?.level || 'A2',
          user_id: user?.id,
          test_type: testType
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
        state.estimatedTime = data.estimatedTime || (testType === 'quick' ? 5 : 15);
        state.loading = false;
      }));
    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to start test. Please try again.';
      }));
    }
  };

  const submitAnswer = async () => {
    if (!state.selectedAnswer) return;

    const newAnswers = { ...state.userAnswers, [state.questions[state.currentQuestion].question]: state.selectedAnswer };
    
    setState(produce(state => {
      state.userAnswers = newAnswers;
      state.selectedAnswer = '';
    }));

    if (state.currentQuestion < state.questions.length - 1) {
      setState(produce(state => {
        state.currentQuestion += 1;
      }));
    } else {
      await completeTest(newAnswers);
    }
  };

  const completeTest = async (finalAnswers: Record<string, string>) => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
    }));

    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'evaluate',
          answers: finalAnswers,
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
        state.error = error.message || 'Failed to complete test. Please try again.';
      }));
    }
  };

  const resetTest = () => {
    setState(initialState);
  };

  const setSelectedAnswer = (answer: string) => {
    setState(produce(state => { state.selectedAnswer = answer }));
  };

  const previousQuestion = () => {
    if (state.currentQuestion > 0) {
      setState(produce(state => {
        state.currentQuestion -= 1;
        state.selectedAnswer = state.userAnswers[state.questions[state.currentQuestion - 1].question] || '';
      }));
    }
  };

  return {
    state,
    startTest,
    submitAnswer,
    resetTest,
    setSelectedAnswer,
    previousQuestion
  };
};

function shouldUpgradeLevel(currentLevel: string | null, newLevel: string): boolean {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(currentLevel || 'A1');
  const newIndex = levelOrder.indexOf(newLevel);
  return newIndex > currentIndex;
}
