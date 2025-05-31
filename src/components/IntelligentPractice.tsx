
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useExerciseValidation } from '@/hooks/useExerciseValidation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useApiCache } from '@/hooks/useApiCache';
import { Target, Clock } from 'lucide-react';
import { Exercise, ExerciseAttempt, PracticeSession } from '@/types/exercise';
import ExerciseDisplay from './ExerciseDisplay';
import ExerciseFeedback from './ExerciseFeedback';
import LoadingState from './LoadingState';
import ErrorDisplay from './ErrorDisplay';

interface IntelligentPracticeProps {
  topicId: string;
}

const IntelligentPractice: React.FC<IntelligentPracticeProps> = ({ topicId }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { validateExercise, normalizeExercise } = useExerciseValidation();
  const { error, handleError, clearError } = useErrorHandler();
  const cache = useApiCache<Exercise[]>();
  
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentExercise = exercises[currentExerciseIndex];

  useEffect(() => {
    if (topicId) {
      fetchExercises();
    }
  }, [topicId]);

  const fetchExercises = async () => {
    if (!user) return;
    
    setLoading(true);
    clearError();
    
    try {
      // Check cache first
      const cacheKey = `exercises-${topicId}`;
      const cachedExercises = cache.get(cacheKey);
      
      if (cachedExercises) {
        setExercises(cachedExercises);
        await createSession();
        setLoading(false);
        return;
      }

      console.log('Fetching exercises for topic:', topicId);
      
      const { data, error: fetchError } = await supabase.functions.invoke('grammar-topics', {
        body: { 
          action: 'get_exercises',
          topic_id: topicId
        }
      });

      if (fetchError) {
        throw new Error(`API Error: ${fetchError.message}`);
      }

      if (!data || !data.exercises || data.exercises.length === 0) {
        throw new Error('No exercises were returned from the server');
      }

      console.log('Received exercises data:', data);

      // Validate and normalize exercises
      const validExercises = data.exercises
        .map((exercise: any) => normalizeExercise(exercise))
        .filter((exercise: Exercise | null): exercise is Exercise => exercise !== null);

      if (validExercises.length === 0) {
        throw new Error('No valid exercises found after validation');
      }

      console.log(`Using ${validExercises.length} valid exercises out of ${data.exercises.length}`);

      setExercises(validExercises);
      cache.set(cacheKey, validExercises);
      await createSession();
      resetExerciseState();

    } catch (err) {
      handleError(err, 'fetchExercises');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!user) return;

    try {
      const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          topic_id: topicId,
          session_type: 'practice',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);
    } catch (err) {
      handleError(err, 'createSession');
    }
  };

  const resetExerciseState = () => {
    setCurrentExerciseIndex(0);
    setUserAnswer('');
    setSelectedOption('');
    setShowFeedback(false);
    setFeedback(null);
  };

  const submitAnswer = async () => {
    if (!currentExercise || !sessionId || submitting) return;

    const answer = currentExercise.type === 'multiple-choice' ? selectedOption : userAnswer;

    if (!answer.trim()) {
      handleError('Please provide an answer before submitting', 'submitAnswer');
      return;
    }

    setSubmitting(true);
    clearError();

    try {
      const correctAnswer = currentExercise.content.correct_answer;
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      // Save attempt to database
      const attemptData: Omit<ExerciseAttempt, 'id'> = {
        user_id: user!.id,
        exercise_id: currentExercise.id,
        session_id: sessionId,
        user_answer: { answer },
        is_correct: isCorrect,
        time_taken_seconds: 30, // Could be tracked more accurately
        difficulty_at_attempt: currentExercise.difficulty_level
      };

      const { error: attemptError } = await supabase
        .from('exercise_attempts')
        .insert(attemptData);

      if (attemptError) {
        console.warn('Failed to save attempt:', attemptError);
      }

      // Get AI feedback (optional, don't fail if it doesn't work)
      let aiFeedback = null;
      try {
        const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('drill-recommendations', {
          body: { 
            action: 'evaluate',
            userAnswer: answer,
            correctAnswer: correctAnswer,
            topic: currentExercise.content.question
          }
        });

        if (!feedbackError) {
          aiFeedback = feedbackData;
        }
      } catch (feedbackErr) {
        console.warn('AI feedback failed:', feedbackErr);
      }

      // Prepare feedback
      const feedbackResult = aiFeedback || {
        isCorrect,
        feedback: {
          message: isCorrect 
            ? 'Correct! Well done.' 
            : `Incorrect. The correct answer is: ${correctAnswer}`,
          tip: currentExercise.content.explanation
        },
        correctAnswer,
        explanation: currentExercise.content.explanation
      };

      setFeedback(feedbackResult);
      setShowFeedback(true);

      // Update session progress
      await updateSessionProgress(isCorrect);

    } catch (err) {
      handleError(err, 'submitAnswer');
    } finally {
      setSubmitting(false);
    }
  };

  const updateSessionProgress = async (isCorrect: boolean) => {
    if (!sessionId) return;

    try {
      const { data: currentSession } = await supabase
        .from('practice_sessions')
        .select('exercises_attempted, exercises_correct')
        .eq('id', sessionId)
        .single();

      if (currentSession) {
        await supabase
          .from('practice_sessions')
          .update({
            exercises_attempted: (currentSession.exercises_attempted || 0) + 1,
            exercises_correct: (currentSession.exercises_correct || 0) + (isCorrect ? 1 : 0)
          })
          .eq('id', sessionId);
      }
    } catch (err) {
      console.warn('Failed to update session progress:', err);
    }
  };

  const nextExercise = async () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
      setFeedback(null);
      clearError();
    } else {
      // Complete session
      await completeSession();
      // Reset for new session
      fetchExercises();
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from('practice_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (err) {
      console.warn('Failed to complete session:', err);
    }
  };

  if (loading) {
    return <LoadingState message="Loading exercises..." />;
  }

  if (error) {
    return <ErrorDisplay error={error.message} onRetry={fetchExercises} />;
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
                disabled={(!userAnswer.trim() && !selectedOption) || submitting}
                className="w-full"
              >
                {submitting ? 'Checking...' : 'Submit Answer'}
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

export default IntelligentPractice;
