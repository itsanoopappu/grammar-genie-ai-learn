
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, TrendingUp } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useAIFeedback } from '@/hooks/useAIFeedback';
import { useAdaptiveScoring } from '@/hooks/useAdaptiveScoring';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ExerciseDisplay from './ExerciseDisplay';
import ExerciseFeedback from './ExerciseFeedback';
import LoadingState from './LoadingState';
import ErrorDisplay from './ErrorDisplay';

interface OptimizedIntelligentPracticeProps {
  topicId: string;
}

const OptimizedIntelligentPractice: React.FC<OptimizedIntelligentPracticeProps> = ({ topicId }) => {
  const { user } = useAuth();
  const { exercises, isLoading, error, refetch } = useExercises(topicId);
  const { 
    createSession, 
    isCreatingSession, 
    updateProgress, 
    completeSession, 
    currentSession 
  } = usePracticeSession(topicId);
  const { getFeedback, feedback, isLoading: isGettingFeedback } = useAIFeedback();
  const { getNextDifficultyLevel } = useAdaptiveScoring();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentDifficultyLevel, setCurrentDifficultyLevel] = useState('B1');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<any[]>([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [maxQuestions] = useState(15);
  const [isLoadingAdaptive, setIsLoadingAdaptive] = useState(false);
  const [adaptiveProgression, setAdaptiveProgression] = useState<string[]>(['B1']);

  const currentExercise = adaptiveQuestions[currentExerciseIndex] || exercises[currentExerciseIndex];

  useEffect(() => {
    if (exercises.length > 0 && !currentSession) {
      createSession();
      loadAdaptiveQuestions('B1', []);
    }
  }, [exercises, currentSession, createSession]);

  const loadAdaptiveQuestions = async (level: string, excludeIds: string[] = []) => {
    if (!user) return;

    setIsLoadingAdaptive(true);
    console.log(`Loading adaptive questions for level: ${level}, excluding: ${excludeIds.length} questions`);
    
    try {
      const { data: newQuestions, error: questionsError } = await supabase
        .rpc('get_adaptive_questions_for_user', {
          p_user_id: user.id,
          p_current_level: level,
          p_limit: 5,
          p_exclude_question_ids: excludeIds
        });

      if (questionsError) {
        console.error('Error loading adaptive questions:', questionsError);
        return;
      }

      if (newQuestions && newQuestions.length > 0) {
        const transformedQuestions = newQuestions.map((q: any) => ({
          id: q.id,
          type: 'multiple-choice',
          content: {
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation
          },
          level: q.level,
          topic: q.topic,
          estimated_time_seconds: 60
        }));

        console.log(`✅ Loaded ${transformedQuestions.length} questions for level ${level}`);
        setAdaptiveQuestions(prev => [...prev, ...transformedQuestions]);
      } else {
        console.warn(`⚠️ No questions found for level ${level}`);
      }
    } catch (error) {
      console.error('Error in loadAdaptiveQuestions:', error);
    } finally {
      setIsLoadingAdaptive(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentExercise || !currentSession) return;

    const answer = currentExercise.type === 'multiple-choice' ? selectedOption : userAnswer;

    if (!answer.trim()) {
      return;
    }

    const correctAnswer = currentExercise.content.correct_answer;
    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    console.log(`🎯 Answer submitted: ${isCorrect ? 'CORRECT' : 'INCORRECT'} for level ${currentExercise.level || currentDifficultyLevel}`);

    // Update consecutive counters and track last answer
    setLastAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      setConsecutiveCorrect(prev => prev + 1);
      setConsecutiveWrong(0);
    } else {
      setConsecutiveWrong(prev => prev + 1);
      setConsecutiveCorrect(0);
    }

    // Get AI feedback
    getFeedback({
      userAnswer: answer,
      correctAnswer: correctAnswer,
      topic: currentExercise.content.question
    });

    // Update progress
    updateProgress({ sessionId: currentSession.id, isCorrect });

    setQuestionsAsked(prev => prev + 1);
    setShowFeedback(true);
  };

  const nextExercise = async () => {
    // Check if we should complete the session
    if (questionsAsked >= maxQuestions || 
        (questionsAsked >= 10 && Math.abs(consecutiveCorrect - consecutiveWrong) >= 4)) {
      if (currentSession) {
        await completeSession(currentSession.id);
      }
      // Reset for new session
      refetch();
      setCurrentExerciseIndex(0);
      setAdaptiveQuestions([]);
      setQuestionsAsked(0);
      setConsecutiveCorrect(0);
      setConsecutiveWrong(0);
      setLastAnswerCorrect(null);
      setCurrentDifficultyLevel('B1');
      setAdaptiveProgression(['B1']);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
      return;
    }

    // Calculate next difficulty level based on performance
    const nextLevel = getNextDifficultyLevel(
      currentDifficultyLevel,
      lastAnswerCorrect || false,
      consecutiveCorrect,
      consecutiveWrong
    );

    // Update difficulty level and progression if it changed
    if (nextLevel !== currentDifficultyLevel) {
      console.log(`🚀 DIFFICULTY CHANGE: ${currentDifficultyLevel} → ${nextLevel}`);
      setCurrentDifficultyLevel(nextLevel);
      setAdaptiveProgression(prev => [...prev, nextLevel]);
      
      // Reset consecutive counters when level changes
      setConsecutiveCorrect(0);
      setConsecutiveWrong(0);
      
      // Load new questions for the new level
      const usedQuestionIds = adaptiveQuestions.map(q => q.id);
      await loadAdaptiveQuestions(nextLevel, usedQuestionIds);
    }

    // Move to next question
    const nextQuestionIndex = currentExerciseIndex + 1;
    
    // Check if we need more questions for current level
    if (nextQuestionIndex >= adaptiveQuestions.length) {
      const usedQuestionIds = adaptiveQuestions.map(q => q.id);
      await loadAdaptiveQuestions(currentDifficultyLevel, usedQuestionIds);
    }

    setCurrentExerciseIndex(nextQuestionIndex);
    setUserAnswer('');
    setSelectedOption('');
    setShowFeedback(false);
  };

  if (isLoading || isCreatingSession) {
    return <LoadingState message="Loading adaptive practice..." />;
  }

  if (error) {
    return <ErrorDisplay error={error.message} onRetry={refetch} />;
  }

  if (!currentExercise) {
    return (
      <div className="text-center text-gray-500 p-4">
        {isLoadingAdaptive ? 'Loading questions...' : 'No exercises available for adaptive practice.'}
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
                  Level: {currentExercise.level || currentDifficultyLevel}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  ~{currentExercise.estimated_time_seconds || 60}s
                </span>
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
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span>Progression: {adaptiveProgression.join(' → ')}</span>
              {lastAnswerCorrect !== null && (
                <span className={lastAnswerCorrect ? 'text-green-600' : 'text-red-600'}>
                  Last: {lastAnswerCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>

          {isLoadingAdaptive && (
            <div className="text-sm text-blue-600 mt-2">
              Loading questions for level {currentDifficultyLevel}...
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <ExerciseDisplay
            exercise={currentExercise}
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
                onClick={nextExercise}
                className="w-full"
                disabled={isLoadingAdaptive}
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
