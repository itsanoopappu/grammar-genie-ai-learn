
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, TrendingUp, AlertCircle } from 'lucide-react';
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
    clearQuestions 
  } = useAdaptiveQuestions();
  
  const {
    currentLevel,
    consecutiveCorrect,
    consecutiveWrong,
    lastAnswerCorrect,
    progression,
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
  const [maxQuestions] = useState(15);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize session and load first batch of questions
  useEffect(() => {
    if (user && !currentSession) {
      console.log('🎬 Initializing adaptive practice session');
      createSession();
      reset();
      loadInitialQuestions();
    }
  }, [user, currentSession, createSession]);

  const loadInitialQuestions = async () => {
    console.log('🚀 Loading initial questions for level B1');
    await loadQuestionsForLevel('B1', [], 5);
    setCurrentQuestionIndex(0);
  };

  const loadMoreQuestionsIfNeeded = async (level: string) => {
    // If we're near the end of current questions or level changed, load more
    if (currentQuestionIndex >= questions.length - 2 || questions.length === 0) {
      console.log(`📥 Loading more questions for level ${level}`);
      const newQuestions = await loadQuestionsForLevel(level, usedQuestionIds, 5);
      
      if (newQuestions.length === 0) {
        console.warn(`⚠️ No more questions available for level ${level}`);
        return false;
      }
      
      setCurrentQuestionIndex(0);
      return true;
    }
    return true;
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !currentSession) return;

    const answer = selectedOption || userAnswer;
    if (!answer.trim()) return;

    const correctAnswer = currentQuestion.correct_answer;
    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    console.log(`🎯 Answer submitted: ${isCorrect ? 'CORRECT' : 'INCORRECT'} for level ${currentQuestion.level}`);
    console.log(`🔍 Question level: ${currentQuestion.level}, Current difficulty: ${currentLevel}`);
    
    // Validate question level matches current difficulty
    if (currentQuestion.level !== currentLevel) {
      console.error(`❌ LEVEL MISMATCH! Question level: ${currentQuestion.level}, Expected: ${currentLevel}`);
    }

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
    // Check if we should complete the session
    if (questionsAsked >= maxQuestions || 
        (questionsAsked >= 10 && Math.abs(consecutiveCorrect - consecutiveWrong) >= 4)) {
      if (currentSession) {
        await completeSession(currentSession.id);
      }
      // Reset for new session
      console.log('🏁 Session completed, resetting');
      reset();
      clearQuestions();
      setCurrentQuestionIndex(0);
      setQuestionsAsked(0);
      setUsedQuestionIds([]);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
      await loadInitialQuestions();
      return;
    }

    // Calculate next difficulty level
    const nextLevel = calculateNextLevel();
    const levelChanged = updateLevel(nextLevel);

    if (levelChanged) {
      // Level changed - clear current questions and load new ones
      console.log(`🔄 Level changed to ${nextLevel}, loading new questions`);
      clearQuestions();
      await loadQuestionsForLevel(nextLevel, usedQuestionIds, 5);
      setCurrentQuestionIndex(0);
    } else {
      // Same level - move to next question or load more if needed
      const canProceed = await loadMoreQuestionsIfNeeded(currentLevel);
      if (canProceed) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }

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

  if (isLoadingQuestions && questions.length === 0) {
    return <LoadingState message={`Loading questions for level ${currentLevel}...`} />;
  }

  if (!currentQuestion) {
    return (
      <div className="text-center text-gray-500 p-4">
        {isLoadingQuestions ? `Loading questions for level ${currentLevel}...` : 'No questions available for adaptive practice.'}
      </div>
    );
  }

  const progress = (questionsAsked / maxQuestions) * 100;

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
                {currentQuestion.level !== currentLevel && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
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
              <span>Consecutive: ✓{consecutiveCorrect} ✗{consecutiveWrong}</span>
              <span>Q Level: {currentQuestion.level} | Target: {currentLevel}</span>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span>Progression: {progression.join(' → ')}</span>
              {lastAnswerCorrect !== null && (
                <span className={lastAnswerCorrect ? 'text-green-600' : 'text-red-600'}>
                  Last: {lastAnswerCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>

          {isLoadingQuestions && (
            <div className="text-sm text-blue-600 mt-2">
              Loading questions for level {currentLevel}...
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
            disabled={showFeedback}
          />

          {showFeedback && feedback && (
            <ExerciseFeedback feedback={feedback} />
          )}

          <div className="flex justify-between">
            {!showFeedback ? (
              <Button 
                onClick={submitAnswer} 
                disabled={(!userAnswer.trim() && !selectedOption) || isGettingFeedback}
                className="w-full"
              >
                {isGettingFeedback ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button 
                onClick={nextQuestion}
                className="w-full"
                disabled={isLoadingQuestions}
              >
                {questionsAsked >= maxQuestions || (questionsAsked >= 10 && Math.abs(consecutiveCorrect - consecutiveWrong) >= 4) 
                  ? 'Complete Practice' 
                  : 'Next Question'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedIntelligentPractice;
