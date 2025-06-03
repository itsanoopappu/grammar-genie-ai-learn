
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Exercise, ExerciseAttempt } from '@/types/exercise';

interface SessionResults {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  xpEarned: number;
}

export const usePracticeSession = (exercises: Exercise[]) => {
  const { user } = useAuth();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createSession = async (topicId: string) => {
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
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  const submitAnswer = async () => {
    if (!exercises[currentExerciseIndex] || !sessionId) return;

    setLoading(true);
    const currentExercise = exercises[currentExerciseIndex];
    const answer = currentExercise.type === 'multiple-choice' ? selectedOption : userAnswer;

    try {
      const correctAnswer = currentExercise.content.correct_answer;
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      // Save attempt
      const attemptData: Omit<ExerciseAttempt, 'id'> = {
        user_id: user!.id,
        exercise_id: currentExercise.id,
        session_id: sessionId,
        user_answer: { answer },
        is_correct: isCorrect,
        time_taken_seconds: 30,
        difficulty_at_attempt: currentExercise.difficulty_level
      };

      await supabase.from('exercise_attempts').insert(attemptData);

      // Update score
      if (isCorrect) {
        setScore(prev => prev + 1);
      }

      // Set feedback
      setFeedback({
        isCorrect,
        feedback: {
          message: isCorrect ? 'Correct! Well done.' : `Incorrect. The correct answer is: ${correctAnswer}`,
          tip: currentExercise.content.explanation
        },
        correctAnswer,
        explanation: currentExercise.content.explanation
      });

    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedOption('');
      setFeedback(null);
    } else {
      // Complete session
      const results: SessionResults = {
        totalQuestions: exercises.length,
        correctAnswers: score,
        accuracy: (score / exercises.length) * 100,
        xpEarned: score * 10
      };
      setSessionResults(results);
      setSessionCompleted(true);
    }
  };

  const restartSession = () => {
    setCurrentExerciseIndex(0);
    setScore(0);
    setFeedback(null);
    setUserAnswer('');
    setSelectedOption('');
    setSessionCompleted(false);
    setSessionResults(null);
  };

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
