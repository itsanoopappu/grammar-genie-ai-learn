import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, Target, Clock, CheckCircle, XCircle, Lightbulb, AlertTriangle } from 'lucide-react';

interface Exercise {
  id: string;
  type: 'fill-blank' | 'multiple-choice' | 'transformation';
  content: {
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    hints?: string[];
  };
  difficulty_level: number;
  estimated_time_seconds: number;
}

interface IntelligentPracticeProps {
  topicId: string;
}

const IntelligentPractice: React.FC<IntelligentPracticeProps> = ({ topicId }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (topicId) {
      fetchExercises();
    }
  }, [topicId]);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching exercises for topic:', topicId);
      
      const { data, error } = await supabase.functions.invoke('grammar-topics', {
        body: { 
          action: 'get_exercises',
          topic_id: topicId
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Received exercises data:', data);

      if (!data || !data.exercises || data.exercises.length === 0) {
        throw new Error('No exercises were returned from the server');
      }

      // Validate exercises data
      const validExercises = data.exercises.filter((exercise: any) => {
        if (!exercise || !exercise.content) {
          console.warn('Invalid exercise structure:', exercise);
          return false;
        }
        
        if (!exercise.content.correctAnswer) {
          console.warn('Exercise missing correctAnswer:', exercise);
          return false;
        }
        
        return true;
      });

      if (validExercises.length === 0) {
        throw new Error('No valid exercises found - all exercises are missing required data');
      }

      console.log(`Using ${validExercises.length} valid exercises out of ${data.exercises.length}`);

      // Create a new practice session
      const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user?.id,
          topic_id: topicId,
          session_type: 'practice',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw sessionError;
      }

      setExercises(validExercises);
      setSessionId(session.id);
      setCurrentExerciseIndex(0);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError(`Failed to load exercises: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise) {
      setError('No current exercise available');
      return;
    }

    // Enhanced defensive check for correctAnswer
    const correctAnswer = currentExercise.content?.correctAnswer;
    if (!correctAnswer || typeof correctAnswer !== 'string' || correctAnswer.trim() === '') {
      console.error('Current exercise missing or invalid correctAnswer:', currentExercise);
      setError('This exercise has invalid data. Please try the next exercise.');
      return;
    }

    let answer = currentExercise.type === 'multiple-choice' 
      ? selectedOption 
      : userAnswer;

    // Ensure answer is a string and handle undefined/null cases
    if (typeof answer !== 'string') {
      answer = String(answer || '');
    }

    if (!answer.trim()) {
      setError('Please provide an answer before submitting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Submitting answer:', answer);
      console.log('Correct answer:', correctAnswer);

      // Safe comparison with proper null checking and defensive programming
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      // Save attempt
      await supabase
        .from('exercise_attempts')
        .insert({
          user_id: user?.id,
          exercise_id: currentExercise.id,
          session_id: sessionId,
          user_answer: { answer },
          is_correct: isCorrect
        });

      // Get AI feedback
      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'evaluate',
          userAnswer: answer,
          correctAnswer: correctAnswer,
          topic: currentExercise.content.question
        }
      });

      if (error) {
        console.warn('Failed to get AI feedback, using basic feedback:', error);
        // Provide basic feedback if AI service fails
        setFeedback({
          isCorrect,
          feedback: {
            message: isCorrect 
              ? 'Correct! Well done.' 
              : `Incorrect. The correct answer is: ${correctAnswer}`,
            tip: currentExercise.content.explanation
          }
        });
      } else {
        setFeedback(data);
      }

      setShowFeedback(true);

      // Update session progress - get current values first, then update
      if (sessionId) {
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
      }

    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextExercise = async () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
      setFeedback(null);
      setError(null);
    } else {
      // Complete session
      try {
        await supabase
          .from('practice_sessions')
          .update({
            completed_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        // Reset state for new session
        fetchExercises();
      } catch (err) {
        console.error('Error completing session:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-2" />
          <span className="text-red-500 font-medium">Error</span>
        </div>
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchExercises} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  if (!currentExercise) {
    return (
      <div className="text-center text-gray-500 p-4">
        No exercises available for this topic.
      </div>
    );
  }

  // Additional safety check for exercise data
  if (!currentExercise.content || !currentExercise.content.correctAnswer) {
    return (
      <div className="text-center p-4">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-orange-500 mr-2" />
          <span className="text-orange-500 font-medium">Invalid Exercise Data</span>
        </div>
        <p className="text-gray-600 mb-4">This exercise has incomplete data.</p>
        <Button onClick={nextExercise} className="mt-4">
          Skip to Next Exercise
        </Button>
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-lg font-medium">{currentExercise.content.question}</p>
          </div>

          {currentExercise.type === 'multiple-choice' && currentExercise.content.options && (
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="grid gap-2">
                {currentExercise.content.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} disabled={showFeedback} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {currentExercise.type === 'fill-blank' && (
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={showFeedback}
            />
          )}

          {currentExercise.type === 'transformation' && (
            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Transform the sentence..."
              disabled={showFeedback}
            />
          )}

          {currentExercise.content.hints && currentExercise.content.hints.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Hints:</span>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {currentExercise.content.hints.map((hint, index) => (
                  <li key={index} className="text-sm text-yellow-700">{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {showFeedback && feedback && (
            <div className={`p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center space-x-2 mb-2">
                {feedback.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={feedback.isCorrect ? 'text-green-800' : 'text-red-800'}>
                  {feedback.isCorrect ? 'Correct!' : 'Not quite right'}
                </span>
              </div>
              <p className={feedback.isCorrect ? 'text-green-700' : 'text-red-700'}>
                {feedback.feedback?.message || 'No feedback available'}
              </p>
              {feedback.feedback?.tip && (
                <p className="text-blue-700 mt-2">
                  <Lightbulb className="h-4 w-4 inline mr-1" />
                  {feedback.feedback.tip}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between">
            {!showFeedback ? (
              <Button 
                onClick={submitAnswer} 
                disabled={(!userAnswer.trim() && !selectedOption) || loading}
                className="w-full"
              >
                {loading ? 'Checking...' : 'Submit Answer'}
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
