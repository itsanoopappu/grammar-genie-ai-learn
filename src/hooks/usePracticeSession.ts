
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Exercise, ExerciseAttempt } from '@/types/exercise';

interface SessionResults {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  xpEarned: number;
}

interface FeedbackData {
  isCorrect: boolean;
  feedback: {
    message: string;
    tip?: string;
    explanation?: string;
  };
  correctAnswer: string;
  explanation?: string;
}

export const usePracticeSession = (exercises: Exercise[]) => {
  const { user } = useAuth();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createSession = useCallback(async (topicId: string) => {
    if (!user) return;

    try {
      const { data: session, error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          topic_id: topicId,
          session_type: 'practice',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(session.id);
      return session.id;
    } catch (err) {
      console.error('Error creating session:', err);
      return null;
    }
  }, [user]);

  const submitAnswer = useCallback(async () => {
    if (!exercises[currentExerciseIndex] || !sessionId || !user) return;

    setLoading(true);
    const currentExercise = exercises[currentExerciseIndex];
    const answer = currentExercise.type === 'multiple-choice' ? selectedOption : userAnswer;

    try {
      const correctAnswer = currentExercise.content.correct_answer;
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      // Save attempt with proper error handling
      const attemptData: Omit<ExerciseAttempt, 'id'> = {
        user_id: user.id,
        exercise_id: currentExercise.id,
        session_id: sessionId,
        user_answer: { answer },
        is_correct: isCorrect,
        time_taken_seconds: 30,
        difficulty_at_attempt: currentExercise.difficulty_level
      };

      const { error: attemptError } = await supabase
        .from('exercise_attempts')
        .insert(attemptData);

      if (attemptError) {
        console.error('Error saving attempt:', attemptError);
      }

      // Update score
      if (isCorrect) {
        setScore(prev => prev + 1);
      }

      // Set proper feedback with detailed information
      setFeedback({
        isCorrect,
        feedback: {
          message: isCorrect 
            ? 'Correct! Well done.' 
            : `Incorrect. The correct answer is: ${correctAnswer}`,
          tip: currentExercise.content.explanation,
          explanation: currentExercise.content.explanation
        },
        correctAnswer,
        explanation: currentExercise.content.explanation
      });

    } catch (err) {
      console.error('Error submitting answer:', err);
      setFeedback({
        isCorrect: false,
        feedback: {
          message: 'Error submitting answer. Please try again.',
        },
        correctAnswer: currentExercise.content.correct_answer
      });
    } finally {
      setLoading(false);
    }
  }, [exercises, currentExerciseIndex, sessionId, user, selectedOption, userAnswer]);

  const loadNextExercise = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedOption('');
      setFeedback(null);
    } else {
      // Complete session with proper results calculation
      const results: SessionResults = {
        totalQuestions: exercises.length,
        correctAnswers: score,
        accuracy: exercises.length > 0 ? (score / exercises.length) * 100 : 0,
        xpEarned: score * 10
      };
      setSessionResults(results);
      setSessionCompleted(true);
    }
  }, [currentExerciseIndex, exercises.length, score]);

  const restartSession = useCallback(() => {
    setCurrentExerciseIndex(0);
    setScore(0);
    setFeedback(null);
    setUserAnswer('');
    setSelectedOption('');
    setSessionCompleted(false);
    setSessionResults(null);
    setSessionId(null);
  }, []);

  return {
    currentExerciseIndex,
    score,
    feedback,
    userAnswer,
    selectedOption,
    sessionCompleted,
    sessionResults,
    loading,
    setCurrentExerciseIndex,
    setUserAnswer,
    setSelectedOption,
    submitAnswer,
    loadNextExercise,
    restartSession,
    createSession
  };
};
