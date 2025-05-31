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
  explanation: string;
}

interface TestResults {
  score: number;
  total: number;
  recommendedLevel: string;
  topicPerformance: Record<string, { correct: number; total: number }>;
  weakTopics: string[];
  strongTopics: string[];
  detailedFeedback: string[];
}

interface TestState {
  testId: string | null;
  testStarted: boolean;
  currentQuestion: number;
  selectedAnswer: string;
  questions: Question[];
  userAnswers: string[];
  testCompleted: boolean;
  testResults: TestResults | null;
  loading: boolean;
  testType: 'Standard' | 'Adaptive';
  timeSpent: number;
  startTime: Date | null;
}

const initialState: TestState = {
  testId: null,
  testStarted: false,
  currentQuestion: 0,
  selectedAnswer: '',
  questions: [],
  userAnswers: [],
  testCompleted: false,
  testResults: null,
  loading: false,
  testType: 'Adaptive',
  timeSpent: 0,
  startTime: null
};

const testStateAtom = atom<TestState>(initialState);

export const usePlacementTestLogic = () => {
  const [state, setState] = useAtom(testStateAtom);
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const startTest = async () => {
    setState(produce(state => { state.loading = true }));
    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'generate',
          level: profile?.level || 'A2',
          adaptive: state.testType === 'Adaptive',
          user_id: user?.id
        }
      });

      if (error) throw error;
      
      setState(produce(state => {
        state.testId = data.testId;
        state.questions = data.questions;
        state.testStarted = true;
        state.currentQuestion = 0;
        state.userAnswers = [];
        state.testCompleted = false;
        state.startTime = new Date();
        state.timeSpent = 0;
        state.loading = false;
      }));
    } catch (error) {
      console.error('Error starting test:', error);
      setState(produce(state => { state.loading = false }));
    }
  };

  const submitAnswer = async () => {
    const newAnswers = [...state.userAnswers, state.selectedAnswer];
    
    setState(produce(state => {
      state.userAnswers = newAnswers;
      state.selectedAnswer = '';
    }));

    if (state.currentQuestion < state.questions.length - 1) {
      setState(produce(state => {
        state.currentQuestion += 1;
      }));
    } else {
      // Test completed - evaluate results
      setState(produce(state => { state.loading = true }));
      try {
        const answersWithQuestions = state.questions.map((q, index) => ({
          question: q.question,
          userAnswer: newAnswers[index],
          correctAnswer: q.correct,
          topic: q.topic,
          explanation: q.explanation
        }));

        const { data, error } = await supabase.functions.invoke('placement-test', {
          body: { 
            action: 'evaluate',
            answers: answersWithQuestions,
            test_id: state.testId
          }
        });

        if (error) throw error;
        
        setState(produce(state => {
          state.testResults = data;
          state.testCompleted = true;
          state.loading = false;
        }));

        // Update user profile if new level is higher
        if (shouldUpdateLevel(profile?.level, data.recommendedLevel)) {
          await updateProfile({ 
            level: data.recommendedLevel,
            xp: (profile?.xp || 0) + 50
          });
        }
      } catch (error) {
        console.error('Error evaluating test:', error);
        setState(produce(state => { state.loading = false }));
      }
    }
  };

  const resetTest = () => {
    setState(initialState);
  };

  const setTestType = (type: 'Standard' | 'Adaptive') => {
    setState(produce(state => { state.testType = type }));
  };

  const setSelectedAnswer = (answer: string) => {
    setState(produce(state => { state.selectedAnswer = answer }));
  };

  return {
    state,
    startTest,
    submitAnswer,
    resetTest,
    setTestType,
    setSelectedAnswer
  };
};

function shouldUpdateLevel(currentLevel: string, newLevel: string): boolean {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(currentLevel || 'A1');
  const newIndex = levelOrder.indexOf(newLevel);
  return newIndex > currentIndex;
}