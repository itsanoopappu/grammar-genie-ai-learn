
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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
    reset
  } = useAdaptiveDifficulty();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [maxQuestions] = useState(15); // Enforce 15 questions minimum
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false);

  const currentQuestion = getQuestionByIndex(currentQuestionIndex);

  // Initialize session and load first batch of questions
  useEffect(() => {
    if (user && !currentSession) {
      console.log('🎬 Initializing adaptive practice session');
      initializeSession();
    }
  }, [user, currentSession]);

  const initializeSession = async () => {
    createSession();
    reset();
    setCurrentQuestionIndex(0);
    setQuestionsAsked(0);
    setUsedQuestionIds([]);
    await loadInitialQuestions();
  };

  const loadInitialQuestions = async () => {
    console.log('🚀 Loading initial questions for level B1');
    try {
      const initialQuestions = await loadQuestionsForLevel('B1', [], 5);
      if (initialQuestions.length > 0) {
        setCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error('Failed to load initial questions:', error);
    }
  };

  const ensureQuestionsAvailable = async (targetLevel: string): Promise<boolean> => {
    // Check if we have enough questions remaining for this level
    const remainingQuestions = questions.length - currentQuestionIndex - 1;
    
    if (remainingQuestions < 2) {
      console.log(`📥 Loading more questions for level ${targetLevel} (${remainingQuestions} remaining)`);
      setIsLevelTransitioning(true);
      
      try {
        const newQuestions = await loadQuestionsForLevel(targetLevel, usedQuestionIds, 5);
        
        if (newQuestions.length === 0) {
          console.warn(`⚠️ No more questions available for level ${targetLevel}`);
          setIsLevelTransitioning(false);
          return false;
        }
        
        // Reset to start of new question pool
        setCurrentQuestionIndex(0);
        setIsLevelTransitioning(false);
        return true;
      } catch (error) {
        console.error('Error loading questions:', error);
        setIsLevelTransitioning(false);
        return false;
      }
    }
    
    return true;
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !currentSession) return;

    const answer = selectedOption || userAnswer;
    if (!answer.trim()) return;

    const correctAnswer = currentQuestion.correct_answer;
    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    console.log(`🎯 Answer ${questionsAsked + 1}/15: ${isCorrect ? 'CORRECT' : 'INCORRECT'} for level ${currentQuestion.level}`);
    console.log(`📊 Current state: Level ${currentLevel}, ${questionsAtCurrentLevel} questions at this level`);
    
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

    setQuestionsAsked(prev => prev + 1);
    setShowFeedback(true);
  };

  const nextQuestion = async () => {
    const newQuestionsAsked = questionsAsked + 1;
    
    // ENFORCE 15 QUESTION MINIMUM - only complete after exactly 15 questions
    if (newQuestionsAsked >= maxQuestions) {
      console.log('🏁 Completing session after 15 questions');
      if (currentSession) {
        await completeSession(currentSession.id);
      }
      await initializeSession();
      return;
    }

    // Calculate next difficulty level
    const nextLevel = calculateNextLevel();
    const levelChanged = updateLevel(nextLevel);

    if (levelChanged) {
      // Level changed - clear current questions and load new ones for the new level
      console.log(`🔄 Level changed to ${nextLevel}, transitioning questions`);
      setIsLevelTransitioning(true);
      clearQuestions();
      
      try {
        const newQuestions = await loadQuestionsForLevel(nextLevel, usedQuestionIds, 5);
        if (newQuestions.length > 0) {
          setCurrentQuestionIndex(0);
        } else {
          // Fallback: try to continue with current questions if new level has none
          console.warn(`⚠️ No questions for level ${nextLevel}, staying with current questions`);
          setCurrentQuestionIndex(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error loading questions for new level:', error);
        setCurrentQuestionIndex(prev => prev + 1);
      } finally {
        setIsLevelTransitioning(false);
      }
    } else {
      // Same level - ensure we have questions available and move to next
      const canProceed = await ensureQuestionsAvailable(currentLevel);
      if (canProceed) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // No more questions available, complete session early
        console.log('🏁 No more questions available, completing session');
        if (currentSession) {
          await completeSession(currentSession.id);
        }
        await initializeSession();
        return;
      }
    }

    // Reset answer state
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

  if ((isLoadingQuestions || isLevelTransitioning) && !currentQuestion) {
    return <LoadingState message={`Loading questions for level ${currentLevel}...`} />;
  }

  if (!currentQuestion) {
    return (
      <div className="text-center text-gray-500 p-4">
        <div className="space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold mb-2">No Questions Available</h3>
            <p className="text-sm">No questions available for adaptive practice at level {currentLevel}.</p>
            <Button onClick={loadInitialQuestions} className="mt-4">
              Retry Loading Questions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (questionsAsked / maxQuestions) * 100;
  const hasLevelMismatch = currentQuestion.level !== currentLevel;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Adaptive Practice - Question {questionsAsked + 1} of {maxQuestions}</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-purple-600 font-medium">
                  Level: {currentLevel}
                </span>
                {hasLevelMismatch && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                {isLevelTransitioning && (
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
                <span className="font-medium">{questionsAtCurrentLevel}</span>
                {questionsAtCurrentLevel >= 3 && currentLevel !== 'A1' && currentLevel !== 'C2' && (
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
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
              {hasLevelMismatch && (
                <span className="text-xs text-red-600">
                  Question: {currentQuestion.level} ≠ Target: {currentLevel}
                </span>
              )}
            </div>
          </div>

          {(isLoadingQuestions || isLevelTransitioning) && (
            <div className="text-sm text-blue-600 mt-2 flex items-center space-x-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>Loading questions for level {currentLevel}...</span>
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
            disabled={showFeedback || isLevelTransitioning}
          />

          {showFeedback && feedback && (
            <ExerciseFeedback feedback={feedback} />
          )}

          <div className="flex justify-between">
            {!showFeedback ? (
              <Button 
                onClick={submitAnswer} 
                disabled={(!userAnswer.trim() && !selectedOption) || isGettingFeedback || isLevelTransitioning}
                className="w-full"
              >
                {isGettingFeedback ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button 
                onClick={nextQuestion}
                className="w-full"
                disabled={isLoadingQuestions || isLevelTransitioning}
              >
                {questionsAsked + 1 >= maxQuestions 
                  ? 'Complete Practice (15/15)' 
                  : `Next Question (${questionsAsked + 1}/15)`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedIntelligentPractice;
