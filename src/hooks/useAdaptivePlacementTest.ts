
import { atom, useAtom } from 'jotai';
import { produce } from 'immer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { calculateWeightedScore, determineAdaptiveLevel, getNextDifficultyLevel } from './useAdaptiveScoring';

interface AdaptiveTestState {
  testId: string | null;
  testStarted: boolean;
  currentQuestionIndex: number;
  selectedAnswer: string;
  questions: any[];
  userAnswers: Record<string, string>;
  testCompleted: boolean;
  testResults: any | null;
  loading: boolean;
  error: string | null;
  startTime: Date | null;
  currentDifficultyLevel: string;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  adaptiveProgression: string[];
  weightedScore: number;
  questionsAsked: number;
  maxQuestions: number;
}

const initialState: AdaptiveTestState = {
  testId: null,
  testStarted: false,
  currentQuestionIndex: 0,
  selectedAnswer: '',
  questions: [],
  userAnswers: {},
  testCompleted: false,
  testResults: null,
  loading: false,
  error: null,
  startTime: null,
  currentDifficultyLevel: 'B1', // Start at B1 level
  consecutiveCorrect: 0,
  consecutiveWrong: 0,
  adaptiveProgression: [],
  weightedScore: 0,
  questionsAsked: 0,
  maxQuestions: 15
};

const adaptiveTestStateAtom = atom<AdaptiveTestState>(initialState);

export const useAdaptivePlacementTest = () => {
  const [state, setState] = useAtom(adaptiveTestStateAtom);
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const startAdaptiveTest = async () => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
    }));

    try {
      // Create new adaptive assessment
      const { data: testData, error: testError } = await supabase
        .from('placement_tests')
        .insert({
          user_id: user?.id,
          assessment_type: 'adaptive',
          total_questions: state.maxQuestions,
          immediate_feedback: false,
          current_difficulty_level: 'B1',
          weighted_score: 0,
          adaptive_difficulty_progression: ['B1'],
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (testError) throw testError;

      // Get initial questions using adaptive function
      const { data: initialQuestions, error: questionsError } = await supabase
        .rpc('get_adaptive_questions_for_user', {
          p_user_id: user?.id,
          p_current_level: 'B1',
          p_limit: 3,
          p_exclude_question_ids: []
        });

      if (questionsError) throw questionsError;

      if (!initialQuestions || initialQuestions.length === 0) {
        throw new Error('No questions available for adaptive assessment');
      }

      setState(produce(state => {
        state.testId = testData.id;
        state.questions = initialQuestions;
        state.testStarted = true;
        state.currentQuestionIndex = 0;
        state.userAnswers = {};
        state.testCompleted = false;
        state.startTime = new Date();
        state.currentDifficultyLevel = 'B1';
        state.adaptiveProgression = ['B1'];
        state.questionsAsked = 0;
        state.loading = false;
      }));
    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to start adaptive assessment';
      }));
    }
  };

  const submitAdaptiveAnswer = async () => {
    if (!state.selectedAnswer || !state.questions[state.currentQuestionIndex]) return;

    setState(produce(state => { 
      state.loading = true;
    }));

    try {
      const currentQuestion = state.questions[state.currentQuestionIndex];
      const isCorrect = state.selectedAnswer.toLowerCase().trim() === 
                       currentQuestion.correct_answer.toLowerCase().trim();

      // Calculate weighted points for this answer
      const level = currentQuestion.level;
      const weights = {
        'A1': { correct: 1, incorrect: -2.5 },
        'A2': { correct: 2, incorrect: -2.0 },
        'B1': { correct: 3, incorrect: -1.5 },
        'B2': { correct: 4, incorrect: -1.0 },
        'C1': { correct: 6, incorrect: 0.5 },
        'C2': { correct: 8, incorrect: 0.5 }
      };
      const levelWeights = weights[level as keyof typeof weights] || weights['B1'];
      const pointsEarned = isCorrect ? levelWeights.correct : levelWeights.incorrect;

      // Record answer with enhanced tracking
      const { error: historyError } = await supabase
        .from('user_question_history')
        .upsert({
          user_id: user?.id,
          question_id: currentQuestion.id,
          test_id: state.testId,
          user_answer: state.selectedAnswer,
          is_correct: isCorrect,
          weighted_points: pointsEarned,
          answered_at: new Date().toISOString(),
          seen_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,question_id'
        });

      if (historyError) {
        console.error('Question history error:', historyError);
      }

      // Update state with answer and adaptive logic
      setState(produce(state => {
        state.userAnswers[currentQuestion.id] = state.selectedAnswer;
        state.weightedScore += pointsEarned;
        state.questionsAsked += 1;
        
        // Update consecutive counters
        if (isCorrect) {
          state.consecutiveCorrect += 1;
          state.consecutiveWrong = 0;
        } else {
          state.consecutiveWrong += 1;
          state.consecutiveCorrect = 0;
        }

        // Determine next difficulty level
        const nextLevel = getNextDifficultyLevel(
          state.currentDifficultyLevel,
          isCorrect,
          state.consecutiveCorrect,
          state.consecutiveWrong
        );

        if (nextLevel !== state.currentDifficultyLevel) {
          state.currentDifficultyLevel = nextLevel;
          state.adaptiveProgression.push(nextLevel);
        }

        state.loading = false;
        state.selectedAnswer = '';
      }));

    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to submit answer';
      }));
    }
  };

  const loadNextAdaptiveQuestion = async () => {
    if (shouldCompleteTest()) {
      await completeAdaptiveTest();
      return;
    }

    setState(produce(state => { 
      state.loading = true;
    }));

    try {
      // Get already asked question IDs
      const askedQuestionIds = state.questions.slice(0, state.currentQuestionIndex + 1).map(q => q.id);

      // Get next adaptive questions
      const { data: nextQuestions, error: questionsError } = await supabase
        .rpc('get_adaptive_questions_for_user', {
          p_user_id: user?.id,
          p_current_level: state.currentDifficultyLevel,
          p_limit: 2,
          p_exclude_question_ids: askedQuestionIds
        });

      if (questionsError) throw questionsError;

      if (!nextQuestions || nextQuestions.length === 0) {
        // No more questions available, complete test
        await completeAdaptiveTest();
        return;
      }

      setState(produce(state => {
        // Add new questions to the pool
        state.questions = [...state.questions, ...nextQuestions];
        state.currentQuestionIndex += 1;
        state.loading = false;
      }));

    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to load next question';
      }));
    }
  };

  const shouldCompleteTest = () => {
    // Complete test if we've asked enough questions or have high confidence
    return state.questionsAsked >= state.maxQuestions || 
           state.questionsAsked >= 10 && Math.abs(state.consecutiveCorrect - state.consecutiveWrong) >= 4;
  };

  const completeAdaptiveTest = async () => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
    }));

    try {
      // Calculate final weighted score and level
      const answeredQuestions = state.questions.slice(0, state.currentQuestionIndex + 1);
      const { weightedScore, levelBreakdown, totalPossibleScore } = calculateWeightedScore(
        state.userAnswers, 
        answeredQuestions
      );

      const { level: recommendedLevel, confidence } = determineAdaptiveLevel(
        weightedScore, 
        totalPossibleScore, 
        levelBreakdown
      );

      const percentageScore = Math.max(0, (weightedScore / totalPossibleScore) * 100);

      // Calculate XP with weighted bonus
      const baseXP = 150;
      const levelMultiplier = {
        'A1': 1, 'A2': 1.2, 'B1': 1.5, 'B2': 1.8, 'C1': 2.2, 'C2': 2.5
      };
      const multiplier = levelMultiplier[recommendedLevel as keyof typeof levelMultiplier] || 1;
      const totalXP = Math.round(baseXP * multiplier + (percentageScore / 100) * 100);

      // Update test completion
      const { error: updateError } = await supabase
        .from('placement_tests')
        .update({
          score: percentageScore,
          level: recommendedLevel,
          weighted_score: weightedScore,
          confidence_score: confidence,
          adaptive_difficulty_progression: state.adaptiveProgression,
          completed_at: new Date().toISOString()
        })
        .eq('id', state.testId);

      if (updateError) {
        console.error('Test update error:', updateError);
      }

      // Create detailed results
      const testResults = {
        score: percentageScore,
        weightedScore,
        recommendedLevel,
        confidence,
        totalQuestions: state.questionsAsked,
        adaptiveProgression: state.adaptiveProgression,
        levelBreakdown,
        xpEarned: totalXP,
        detailedFeedback: {
          message: `Adaptive assessment complete! Weighted score: ${Math.round(weightedScore)}/${Math.round(totalPossibleScore)} points (${Math.round(confidence)}% confidence)`,
          nextSteps: [
            `Your adaptive level: ${recommendedLevel} (${Math.round(confidence)}% confidence)`,
            `Questions adapted from ${state.adaptiveProgression.join(' → ')}`,
            `Weighted scoring applied: easier mistakes penalized more heavily`
          ]
        }
      };

      setState(produce(state => {
        state.testResults = testResults;
        state.testCompleted = true;
        state.loading = false;
      }));

      // Update user profile
      if (profile && recommendedLevel) {
        const shouldUpdateLevel = shouldUpgradeLevel(profile.level, recommendedLevel);
        const updates: any = {
          xp: (profile.xp || 0) + totalXP
        };
        
        if (shouldUpdateLevel) {
          updates.level = recommendedLevel;
        }
        
        await updateProfile(updates);
      }

    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to complete adaptive assessment';
      }));
    }
  };

  const resetAdaptiveTest = () => {
    setState(initialState);
  };

  const setSelectedAnswer = (answer: string) => {
    setState(produce(state => { state.selectedAnswer = answer }));
  };

  return {
    state,
    startAdaptiveTest,
    submitAdaptiveAnswer,
    loadNextAdaptiveQuestion,
    resetAdaptiveTest,
    setSelectedAnswer
  };
};

function shouldUpgradeLevel(currentLevel: string | null, newLevel: string): boolean {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(currentLevel || 'A1');
  const newIndex = levelOrder.indexOf(newLevel);
  return newIndex > currentIndex;
}
