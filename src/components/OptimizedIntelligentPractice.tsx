
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, TrendingUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useAIFeedback } from '@/hooks/useAIFeedback';
import { useAuth } from '@/hooks/useAuth';
import { useAdaptiveQuestions } from '@/hooks/useAdaptiveQuestions';
import { useAdaptiveDifficulty } from '@/hooks/useAdaptiveDifficulty';
import ExerciseDisplay from './ExerciseDisplay';
import ExerciseFeedback from './ExerciseFeedback';
import LoadingState from './LoadingState';
import ErrorDisplay from './ErrorDisplay';

interface OptimizedIntelligentPracticeProps {
  topicId: string;
}

const OptimizedIntelligentPractice: React.FC<OptimizedIntelligentPracticeProps> = ({ topicId }) => {
  const { user } = useAuth();
  const { 
    createSession, 
    isCreatingSession, 
    updateProgress, 
    completeSession, 
    currentSession 
  } = usePracticeSession(topicId);
  const { getFeedback, feedback, isLoading: isGettingFeedback } = useAIFeedback();
  
  // Adaptive system hooks
  const { 
    questions, 
    isLoading: isLoadingQuestions, 
    error: questionsError, 
    loadQuestionsForLevel, 
    clearQuestions,
    getQuestionByIndex
  } = useAdaptiveQuestions();
  
  const {
    currentLevel,
    consecutiveCorrect,
    consecutiveWrong,
    lastAnswerCorrect,
    progression,
    questionsAtCurrentLevel,
    processAnswer,
    calculateNextLevel,
    updateLevel,
    mustChangeLevel,
    reset
  } = useAdaptiveDifficulty();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // STRICT ENFORCEMENT: Exactly 15 questions
  const REQUIRED_QUESTIONS = 15;
  const currentQuestion = getQuestionByIndex(currentQuestionIndex);

  // Initialize session and load first batch of questions
  useEffect(() => {
    if (user && !currentSession) {
      console.log('🎬 Initializing adaptive practice session - STRICT MODE');
      initializeSession();
    }
  }, [user, currentSession]);

  const initializeSession = async () => {
    createSession();
    reset();
    setCurrentQuestionIndex(0);
    setTotalQuestionsAsked(0);
    setUsedQuestionIds([]);
    setIsTransitioning(false);
    await loadInitialQuestions();
  };

  const loadInitialQuestions = async () => {
    console.log('🚀 Loading initial questions for level B1 - STRICT MODE');
    setIsTransitioning(true);
    try {
      const initialQuestions = await loadQuestionsForLevel('B1', [], 5);
      if (initialQuestions.length > 0) {
        setCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error('Failed to load initial questions:', error);
    } finally {
      setIsTransitioning(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !currentSession || isTransitioning) return;

    const answer = selectedOption || userAnswer;
    if (!answer.trim()) return;

    const correctAnswer = currentQuestion.correct_answer;
    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    console.log(`🎯 Answer ${totalQuestionsAsked + 1}/${REQUIRED_QUESTIONS}: ${isCorrect ? 'CORRECT' : 'INCORRECT'} for level ${currentQuestion.level}`);
    
    // Process the answer for difficulty tracking
    processAnswer(isCorrect);

    // Add to used questions
    setUsedQuestionIds(prev => [...prev, currentQuestion.id]);

    // Get AI feedback
    getFeedback({
      userAnswer: answer,
      correctAnswer: correctAnswer,
      topic: currentQuestion.question
    });

    // Update progress
    updateProgress({ sessionId: currentSession.id, isCorrect });

    setTotalQuestionsAsked(prev => prev + 1);
    setShowFeedback(true);
  };

  const nextQuestion = async () => {
    if (isTransitioning) return;

    const newTotalAsked = totalQuestionsAsked + 1;
    
    // STRICT ENFORCEMENT: Complete after exactly 15 questions
    if (newTotalAsked >= REQUIRED_QUESTIONS) {
      console.log('🏁 Completing session after EXACTLY 15 questions');
      if (currentSession) {
        await completeSession(currentSession.id);
      }
      await initializeSession();
      return;
    }

    setIsTransitioning(true);

    try {
      // Check if we must force a level change (3 questions rule)
      const nextLevel = calculateNextLevel();
      const levelWillChange = nextLevel !== currentLevel;
      const mustChange = mustChangeLevel();

      if (mustChange && !levelWillChange) {
        console.error('🚨 SYSTEM ERROR: Must change level but algorithm didn\'t provide different level');
        // Force the change anyway based on performance
        const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentIndex = levelOrder.indexOf(currentLevel);
        const fallbackLevel = currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : levelOrder[currentIndex - 1];
        updateLevel(fallbackLevel);
        await loadQuestionsAndContinue(fallbackLevel);
        return;
      }

      if (levelWillChange) {
        // Level is changing - load new questions for new level
        console.log(`🔄 Level changing to ${nextLevel}, loading new questions`);
        updateLevel(nextLevel);
        await loadQuestionsAndContinue(nextLevel);
      } else {
        // Same level - ensure we have enough questions and continue
        await ensureSufficientQuestionsAndContinue();
      }
    } catch (error) {
      console.error('Error in nextQuestion:', error);
      setIsTransitioning(false);
    }
  };

  const loadQuestionsAndContinue = async (targetLevel: string) => {
    console.log(`📥 Loading questions for level ${targetLevel}`);
    
    clearQuestions();
    const newQuestions = await loadQuestionsForLevel(targetLevel, usedQuestionIds, 5);
    
    if (newQuestions.length === 0) {
      console.error(`🚨 CRITICAL: No questions available for level ${targetLevel}`);
      // This should not happen in a properly configured system
      setIsTransitioning(false);
      return;
    }
    
    setCurrentQuestionIndex(0);
    resetAnswerState();
    setIsTransitioning(false);
  };

  const ensureSufficientQuestionsAndContinue = async () => {
    const remainingQuestions = questions.length - currentQuestionIndex - 1;
    
    if (remainingQuestions < 1) {
      console.log(`📥 Loading more questions for current level ${currentLevel}`);
      const newQuestions = await loadQuestionsForLevel(currentLevel, usedQuestionIds, 5);
      
      if (newQuestions.length === 0) {
        console.error(`🚨 CRITICAL: No more questions available for level ${currentLevel}`);
        setIsTransitioning(false);
        return;
      }
      
      setCurrentQuestionIndex(0);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
    
    resetAnswerState();
    setIsTransitioning(false);
  };

  const resetAnswerState = () => {
    setUserAnswer('');
    setSelectedOption('');
    setShowFeedback(false);
  };

  if (isCreatingSession) {
    return <LoadingState message="Starting adaptive practice..." />;
  }

  if (questionsError) {
    return <ErrorDisplay error={questionsError} onRetry={loadInitialQuestions} />;
  }

  if ((isLoadingQuestions || isTransitioning) && !currentQuestion) {
    return <LoadingState message={`Loading questions for level ${currentLevel}...`} />;
  }

  if (!currentQuestion) {
    return (
      <div className="text-center text-red-500 p-4">
        <div className="space-y-4">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-400" />
          <div>
            <h3 className="text-lg font-semibold mb-2">System Error</h3>
            <p className="text-sm">No questions available for level {currentLevel}. Assessment cannot continue.</p>
            <Button onClick={loadInitialQuestions} className="mt-4" variant="destructive">
              Restart Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (totalQuestionsAsked / REQUIRED_QUESTIONS) * 100;
  const questionsRemaining = REQUIRED_QUESTIONS - totalQuestionsAsked;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Adaptive Assessment - Question {totalQuestionsAsked + 1} of {REQUIRED_QUESTIONS}</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-purple-600 font-medium">
                  Level: {currentLevel}
                </span>
                {isTransitioning && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">~60s</span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
          
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <div className="flex flex-col space-y-1">
              {currentSession && (
                <span>Progress: {currentSession.exercises_correct || 0}/{currentSession.exercises_attempted || 0} correct</span>
              )}
              <div className="flex items-center space-x-2">
                <span>Consecutive:</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">{consecutiveCorrect}</span>
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">{consecutiveWrong}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span>Questions at {currentLevel}:</span>
                <span className="font-medium">{questionsAtCurrentLevel}/3</span>
                {questionsAtCurrentLevel >= 3 && currentLevel !== 'A1' && currentLevel !== 'C2' && (
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span>Remaining: {questionsRemaining} questions</span>
              <span>Progression: {progression.join(' → ')}</span>
              {lastAnswerCorrect !== null && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs">Last:</span>
                  {lastAnswerCorrect ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          {isTransitioning && (
            <div className="text-sm text-blue-600 mt-2 flex items-center space-x-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>Transitioning to level {currentLevel}...</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <ExerciseDisplay
            exercise={{
              id: currentQuestion.id,
              type: 'multiple-choice',
              content: {
                question: currentQuestion.question,
                options: currentQuestion.options,
                correct_answer: currentQuestion.correct_answer,
                explanation: currentQuestion.explanation
              },
              difficulty_level: currentQuestion.difficulty_score,
              estimated_time_seconds: 60
            }}
            userAnswer={userAnswer}
            selectedOption={selectedOption}
            onAnswerChange={setUserAnswer}
            onOptionChange={setSelectedOption}
            disabled={showFeedback || isTransitioning}
          />

          {showFeedback && feedback && (
            <ExerciseFeedback feedback={feedback} />
          )}

          <div className="flex justify-between">
            {!showFeedback ? (
              <Button 
                onClick={submitAnswer} 
                disabled={(!userAnswer.trim() && !selectedOption) || isGettingFeedback || isTransitioning}
                className="w-full"
              >
                {isGettingFeedback ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button 
                onClick={nextQuestion}
                className="w-full"
                disabled={isLoadingQuestions || isTransitioning}
              >
                {questionsRemaining <= 1 
                  ? 'Complete Assessment (15/15)' 
                  : `Next Question (${totalQuestionsAsked + 1}/15)`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedIntelligentPractice;
