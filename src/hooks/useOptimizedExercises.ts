
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
      if (!topicId) {
        console.warn('No topicId provided to useOptimizedExercises');
        return [];
      }

      console.log('Fetching exercises for topic:', topicId);
      
      try {
        const { data, error: fetchError } = await supabase.functions.invoke('grammar-topics', {
          body: { 
            action: 'get_exercises',
            topic_id: topicId
          }
        });

        if (fetchError) {
          console.error('API Error details:', fetchError);
          throw new Error(`API Error: ${fetchError.message}`);
        }

        if (!data?.exercises) {
          console.warn('No exercises returned from server for topic:', topicId);
          throw new Error('No exercises returned from server');
        }

        const validExercises = data.exercises
          .map((exercise: any) => {
            try {
              return normalizeExercise(exercise);
            } catch (normalizationError) {
              console.warn('Failed to normalize exercise:', exercise.id, normalizationError);
              return null;
            }
          })
          .filter((exercise: Exercise | null): exercise is Exercise => exercise !== null);

        if (validExercises.length === 0) {
          console.warn('No valid exercises found after normalization for topic:', topicId);
          throw new Error('No valid exercises found');
        }

        console.log(`Successfully loaded ${validExercises.length} exercises for topic ${topicId}`);
        return validExercises;
      } catch (networkError) {
        console.error('Network error fetching exercises:', networkError);
        throw networkError;
      }
    },
    enabled: !!user && !!topicId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry on client-side validation errors
      if (error?.message?.includes('No exercises returned') || 
          error?.message?.includes('No valid exercises found')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const prefetchNextTopic = useMutation({
    mutationFn: async (nextTopicId: string) => {
      if (!nextTopicId) {
        throw new Error('No nextTopicId provided for prefetching');
      }

      return queryClient.prefetchQuery({
        queryKey: ['exercises', nextTopicId],
        queryFn: async () => {
          try {
            const { data, error } = await supabase.functions.invoke('grammar-topics', {
              body: { 
                action: 'get_exercises',
                topic_id: nextTopicId
              }
            });

            if (error) {
              console.warn('Failed to prefetch exercises for topic:', nextTopicId, error);
              return [];
            }
            
            return data?.exercises
              ?.map((exercise: any) => {
                try {
                  return normalizeExercise(exercise);
                } catch {
                  return null;
                }
              })
              ?.filter((exercise: Exercise | null): exercise is Exercise => exercise !== null) || [];
          } catch (prefetchError) {
            console.warn('Prefetch error for topic:', nextTopicId, prefetchError);
            return [];
          }
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
