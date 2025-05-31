
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Clock } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useAIFeedback } from '@/hooks/useAIFeedback';
import ExerciseDisplay from './ExerciseDisplay';
import ExerciseFeedback from './ExerciseFeedback';
import LoadingState from './LoadingState';
import ErrorDisplay from './ErrorDisplay';

interface OptimizedIntelligentPracticeProps {
  topicId: string;
}

const OptimizedIntelligentPractice: React.FC<OptimizedIntelligentPracticeProps> = ({ topicId }) => {
  const { exercises, isLoading, error, refetch } = useExercises(topicId);
  const { 
    createSession, 
    isCreatingSession, 
    updateProgress, 
    completeSession, 
    currentSession 
  } = usePracticeSession(topicId);
  const { getFeedback, feedback, isLoading: isGettingFeedback } = useAIFeedback();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const currentExercise = exercises[currentExerciseIndex];

  useEffect(() => {
    if (exercises.length > 0 && !currentSession) {
      createSession();
    }
  }, [exercises, currentSession, createSession]);

  const submitAnswer = async () => {
    if (!currentExercise || !currentSession) return;

    const answer = currentExercise.type === 'multiple-choice' ? selectedOption : userAnswer;

    if (!answer.trim()) {
      return;
    }

    const correctAnswer = currentExercise.content.correct_answer;
    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    // Get AI feedback
    getFeedback({
      userAnswer: answer,
      correctAnswer: correctAnswer,
      topic: currentExercise.content.question
    });

    // Update progress with optimistic updates
    updateProgress({ sessionId: currentSession.id, isCorrect });

    setShowFeedback(true);
  };

  const nextExercise = async () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
    } else {
      // Complete session
      if (currentSession) {
        await completeSession(currentSession.id);
      }
      // Reset for new session
      refetch();
      setCurrentExerciseIndex(0);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
    }
  };

  if (isLoading || isCreatingSession) {
    return <LoadingState message="Loading exercises..." />;
  }

  if (error) {
    return <ErrorDisplay error={error.message} onRetry={refetch} />;
  }

  if (!currentExercise) {
    return (
      <div className="text-center text-gray-500 p-4">
        No exercises available for this topic.
      </div>
    );
  }

  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Exercise {currentExerciseIndex + 1} of {exercises.length}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                ~{currentExercise.estimated_time_seconds || 60}s
              </span>
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
          
          {currentSession && (
            <div className="text-sm text-gray-600 mt-2">
              Progress: {currentSession.exercises_correct || 0}/{currentSession.exercises_attempted || 0} correct
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
              >
                {currentExerciseIndex === exercises.length - 1 ? 'Complete Practice' : 'Next Exercise'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedIntelligentPractice;
