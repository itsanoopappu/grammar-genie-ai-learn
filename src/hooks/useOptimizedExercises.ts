
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useExerciseValidation } from './useExerciseValidation';
import { Exercise } from '@/types/exercise';

export const useOptimizedExercises = (topicId: string) => {
  const { user } = useAuth();
  const { normalizeExercise } = useExerciseValidation();
  const queryClient = useQueryClient();

  const {
    data: exercises = [],
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['exercises', topicId],
    queryFn: async () => {
      if (!topicId) return [];

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

      if (!data?.exercises) {
        throw new Error('No exercises returned from server');
      }

      const validExercises = data.exercises
        .map((exercise: any) => normalizeExercise(exercise))
        .filter((exercise: Exercise | null): exercise is Exercise => exercise !== null);

      if (validExercises.length === 0) {
        throw new Error('No valid exercises found');
      }

      console.log(`Loaded ${validExercises.length} exercises`);
      return validExercises;
    },
    enabled: !!user && !!topicId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const prefetchNextTopic = useMutation({
    mutationFn: async (nextTopicId: string) => {
      return queryClient.prefetchQuery({
        queryKey: ['exercises', nextTopicId],
        queryFn: async () => {
          const { data } = await supabase.functions.invoke('grammar-topics', {
            body: { 
              action: 'get_exercises',
              topic_id: nextTopicId
            }
          });
          
          return data?.exercises
            ?.map((exercise: any) => normalizeExercise(exercise))
            ?.filter((exercise: Exercise | null): exercise is Exercise => exercise !== null) || [];
        },
        staleTime: 5 * 60 * 1000,
      });
    },
  });

  return {
    exercises,
    isLoading,
    isFetching,
    error,
    refetch,
    prefetchNextTopic: prefetchNextTopic.mutate,
    isPrefetching: prefetchNextTopic.isPending,
  };
};
