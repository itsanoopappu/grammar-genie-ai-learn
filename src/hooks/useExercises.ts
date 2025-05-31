
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useExerciseValidation } from './useExerciseValidation';
import { Exercise, ExerciseAttempt } from '@/types/exercise';

export const useExercises = (topicId: string) => {
  const { user } = useAuth();
  const { normalizeExercise } = useExerciseValidation();
  const queryClient = useQueryClient();

  const {
    data: exercises = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['exercises', topicId],
    queryFn: async () => {
      if (!user || !topicId) return [];

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

      // Validate and normalize exercises
      const validExercises = data.exercises
        .map((exercise: any) => normalizeExercise(exercise))
        .filter((exercise: Exercise | null): exercise is Exercise => exercise !== null);

      if (validExercises.length === 0) {
        throw new Error('No valid exercises found after validation');
      }

      console.log(`Using ${validExercises.length} valid exercises out of ${data.exercises.length}`);
      return validExercises;
    },
    enabled: !!user && !!topicId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ exerciseId, answer, sessionId, isCorrect }: {
      exerciseId: string;
      answer: string;
      sessionId: string;
      isCorrect: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Save attempt to database
      const attemptData: Omit<ExerciseAttempt, 'id'> = {
        user_id: user.id,
        exercise_id: exerciseId,
        session_id: sessionId,
        user_answer: { answer },
        is_correct: isCorrect,
        time_taken_seconds: 30,
        difficulty_at_attempt: 1 // Will be updated with actual difficulty
      };

      const { error: attemptError } = await supabase
        .from('exercise_attempts')
        .insert(attemptData);

      if (attemptError) {
        throw attemptError;
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['session-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });

  return {
    exercises,
    isLoading,
    error,
    refetch,
    submitAnswer: submitAnswerMutation.mutate,
    isSubmitting: submitAnswerMutation.isPending,
  };
};
