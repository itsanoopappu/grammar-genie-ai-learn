
import { atom, useAtom } from 'jotai';
import { produce } from 'immer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface QuestionReview {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  grammarTopic: string;
  level: string;
  options?: string[];
}

interface EnhancedAssessmentState {
  testId: string | null;
  testStarted: boolean;
  currentQuestionIndex: number;
  selectedAnswer: string;
  questions: any[];
  userAnswers: Record<string, string>;
  testCompleted: boolean;
  testResults: any | null;
  questionReviews: QuestionReview[];
  loading: boolean;
  error: string | null;
  startTime: Date | null;
}

const initialState: EnhancedAssessmentState = {
  testId: null,
  testStarted: false,
  currentQuestionIndex: 0,
  selectedAnswer: '',
  questions: [],
  userAnswers: {},
  testCompleted: false,
  testResults: null,
  questionReviews: [],
  loading: false,
  error: null,
  startTime: null
};

const enhancedAssessmentStateAtom = atom<EnhancedAssessmentState>(initialState);

export const useEnhancedAssessment = () => {
  const [state, setState] = useAtom(enhancedAssessmentStateAtom);
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const startAssessment = async () => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
    }));

    try {
      // Create new assessment
      const { data: testData, error: testError } = await supabase
        .from('placement_tests')
        .insert({
          user_id: user?.id,
          assessment_type: 'enhanced',
          total_questions: 15,
          immediate_feedback: false,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (testError) throw testError;

      // Load diverse questions across all levels
      const { data: questions, error: questionsError } = await supabase
        .from('test_questions')
        .select('*')
        .not('question', 'is', null)
        .not('correct_answer', 'is', null)
        .not('options', 'is', null)
        .limit(15);

      if (questionsError) throw questionsError;

      if (!questions || questions.length < 15) {
        throw new Error('Insufficient questions available for assessment');
      }

      // Shuffle questions for randomization
      const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

      setState(produce(state => {
        state.testId = testData.id;
        state.questions = shuffledQuestions;
        state.testStarted = true;
        state.currentQuestionIndex = 0;
        state.userAnswers = {};
        state.questionReviews = [];
        state.testCompleted = false;
        state.startTime = new Date();
        state.loading = false;
      }));
    } catch (error: any) {
      console.error('Failed to start assessment:', error);
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to start assessment';
      }));
    }
  };

  const submitAnswer = async () => {
    if (!state.selectedAnswer || !state.questions[state.currentQuestionIndex]) return;

    const currentQuestion = state.questions[state.currentQuestionIndex];
    const isCorrect = state.selectedAnswer.toLowerCase().trim() === 
                     currentQuestion.correct_answer.toLowerCase().trim();

    // Record the answer for review
    const questionReview: QuestionReview = {
      id: currentQuestion.id,
      question: currentQuestion.question,
      userAnswer: state.selectedAnswer,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect,
      explanation: currentQuestion.explanation || currentQuestion.detailed_explanation || 'No explanation available',
      grammarTopic: currentQuestion.grammar_topic || currentQuestion.topic || 'General',
      level: currentQuestion.level || 'Unknown',
      options: currentQuestion.options
    };

    setState(produce(state => {
      state.userAnswers[currentQuestion.id] = state.selectedAnswer;
      state.questionReviews.push(questionReview);
      state.selectedAnswer = '';
    }));

    // Record answer in database
    try {
      await supabase
        .from('user_question_history')
        .upsert({
          user_id: user?.id,
          question_id: currentQuestion.id,
          test_id: state.testId,
          user_answer: state.selectedAnswer,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
          seen_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,question_id'
        });
    } catch (error) {
      console.error('Error recording answer:', error);
    }
  };

  const nextQuestion = async () => {
    if (state.currentQuestionIndex >= state.questions.length - 1) {
      await completeAssessment();
      return;
    }

    setState(produce(state => {
      state.currentQuestionIndex += 1;
    }));
  };

  const completeAssessment = async () => {
    setState(produce(state => { 
      state.loading = true;
    }));

    try {
      // Enhanced level prediction algorithm
      const levelAccuracy = calculateLevelAccuracy(state.questionReviews);
      const { recommendedLevel, confidence } = predictLevel(levelAccuracy);
      
      // Calculate scores
      const correctAnswers = state.questionReviews.filter(r => r.isCorrect).length;
      const totalAnswers = state.questionReviews.length;
      const score = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
      
      // Analyze grammar performance
      const grammarBreakdown = analyzeGrammarPerformance(state.questionReviews);
      
      // Create comprehensive results
      const testResults = {
        score,
        weightedScore: calculateWeightedScore(state.questionReviews),
        recommendedLevel,
        confidence,
        totalQuestions: 15,
        questionsAnswered: totalAnswers,
        levelBreakdown: levelAccuracy,
        grammarBreakdown,
        detailedFeedback: {
          message: generateFeedbackMessage(recommendedLevel, score, confidence),
          nextSteps: generateNextSteps(recommendedLevel, grammarBreakdown)
        }
      };

      // Update test in database
      await supabase
        .from('placement_tests')
        .update({
          score,
          level: recommendedLevel,
          confidence_score: confidence,
          completed_at: new Date().toISOString()
        })
        .eq('id', state.testId);

      setState(produce(state => {
        state.testResults = testResults;
        state.testCompleted = true;
        state.loading = false;
      }));

      // Update user profile if level improved
      if (profile && shouldUpgradeLevel(profile.level, recommendedLevel)) {
        await updateProfile({ level: recommendedLevel });
      }

    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to complete assessment';
      }));
    }
  };

  const calculateLevelAccuracy = (reviews: QuestionReview[]) => {
    const levelStats: Record<string, { correct: number; total: number; accuracy: number }> = {};
    
    reviews.forEach(review => {
      const level = review.level || 'Unknown';
      if (!levelStats[level]) {
        levelStats[level] = { correct: 0, total: 0, accuracy: 0 };
      }
      levelStats[level].total += 1;
      if (review.isCorrect) {
        levelStats[level].correct += 1;
      }
    });

    // Calculate accuracy for each level
    Object.keys(levelStats).forEach(level => {
      const stats = levelStats[level];
      stats.accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
    });

    return levelStats;
  };

  const predictLevel = (levelAccuracy: Record<string, { correct: number; total: number; accuracy: number }>) => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let bestLevel = 'A1';
    let confidence = 0;

    // Find the highest level where user has good performance (>= 60% accuracy)
    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i];
      const stats = levelAccuracy[level];
      
      if (stats && stats.total >= 2 && stats.accuracy >= 0.6) {
        bestLevel = level;
        confidence = Math.min(95, Math.round(stats.accuracy * 100));
        break;
      }
    }

    // If no level has good performance, find the level with best accuracy
    if (confidence === 0) {
      let bestAccuracy = 0;
      Object.entries(levelAccuracy).forEach(([level, stats]) => {
        if (stats.total > 0 && stats.accuracy > bestAccuracy) {
          bestAccuracy = stats.accuracy;
          bestLevel = level;
          confidence = Math.round(bestAccuracy * 100);
        }
      });
    }

    return { recommendedLevel: bestLevel, confidence };
  };

  const analyzeGrammarPerformance = (reviews: QuestionReview[]) => {
    const grammarStats: Record<string, { correct: number; total: number; accuracy: number }> = {};
    
    reviews.forEach(review => {
      const topic = review.grammarTopic || 'General';
      if (!grammarStats[topic]) {
        grammarStats[topic] = { correct: 0, total: 0, accuracy: 0 };
      }
      grammarStats[topic].total += 1;
      if (review.isCorrect) {
        grammarStats[topic].correct += 1;
      }
    });

    // Calculate accuracy for each grammar topic
    Object.keys(grammarStats).forEach(topic => {
      const stats = grammarStats[topic];
      stats.accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
    });

    return grammarStats;
  };

  const calculateWeightedScore = (reviews: QuestionReview[]) => {
    const levelWeights = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
    let totalWeightedPoints = 0;
    let totalPossiblePoints = 0;

    reviews.forEach(review => {
      const weight = levelWeights[review.level as keyof typeof levelWeights] || 3;
      totalPossiblePoints += weight;
      if (review.isCorrect) {
        totalWeightedPoints += weight;
      }
    });

    return totalPossiblePoints > 0 ? totalWeightedPoints : 0;
  };

  const generateFeedbackMessage = (level: string, score: number, confidence: number) => {
    return `Based on your performance, you're at ${level} level with ${Math.round(score)}% accuracy. ` +
           `We're ${confidence}% confident in this assessment. ` +
           `Continue practicing to strengthen your skills and advance to the next level.`;
  };

  const generateNextSteps = (level: string, grammarBreakdown: Record<string, any>) => {
    const weakAreas = Object.entries(grammarBreakdown)
      .filter(([_, stats]) => stats.accuracy < 0.6)
      .map(([topic, _]) => topic);

    const steps = [
      `Focus on ${level} level content and exercises`,
      'Practice consistently for 15-20 minutes daily'
    ];

    if (weakAreas.length > 0) {
      steps.push(`Pay special attention to: ${weakAreas.slice(0, 3).join(', ')}`);
    }

    steps.push('Retake the assessment in 2-3 weeks to track progress');
    
    return steps;
  };

  const resetAssessment = () => {
    setState(initialState);
  };

  const setSelectedAnswer = (answer: string) => {
    setState(produce(state => { state.selectedAnswer = answer }));
  };

  return {
    state,
    startAssessment,
    submitAnswer,
    nextQuestion,
    resetAssessment,
    setSelectedAnswer
  };
};

function shouldUpgradeLevel(currentLevel: string | null, newLevel: string): boolean {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(currentLevel || 'A1');
  const newIndex = levelOrder.indexOf(newLevel);
  return newIndex > currentIndex;
}
