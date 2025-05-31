
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PracticeSession } from '@/types/exercise';

export const usePracticeSession = (topicId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

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
      return session;
    },
    onSuccess: (session) => {
      // Cache the new session
      queryClient.setQueryData(['current-session', topicId], session);
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ sessionId, isCorrect }: { sessionId: string; isCorrect: boolean }) => {
      const { data: currentSession } = await supabase
        .from('practice_sessions')
        .select('exercises_attempted, exercises_correct')
        .eq('id', sessionId)
        .single();

      if (currentSession) {
        const { error } = await supabase
          .from('practice_sessions')
          .update({
            exercises_attempted: (currentSession.exercises_attempted || 0) + 1,
            exercises_correct: (currentSession.exercises_correct || 0) + (isCorrect ? 1 : 0)
          })
          .eq('id', sessionId);

        if (error) throw error;
      }

      return currentSession;
    },
    onMutate: async ({ sessionId, isCorrect }) => {
      // Optimistically update the UI
      const queryKey = ['current-session', topicId];
      await queryClient.cancelQueries({ queryKey });

      const previousSession = queryClient.getQueryData(queryKey);
      
      if (previousSession) {
        queryClient.setQueryData(queryKey, (old: any) => ({
          ...old,
          exercises_attempted: (old.exercises_attempted || 0) + 1,
          exercises_correct: (old.exercises_correct || 0) + (isCorrect ? 1 : 0)
        }));
      }

      return { previousSession };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousSession) {
        queryClient.setQueryData(['current-session', topicId], context.previousSession);
      }
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('practice_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Clear current session and refresh user progress
      queryClient.removeQueries({ queryKey: ['current-session', topicId] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });

  return {
    createSession: createSessionMutation.mutate,
    isCreatingSession: createSessionMutation.isPending,
    updateProgress: updateProgressMutation.mutate,
    isUpdatingProgress: updateProgressMutation.isPending,
    completeSession: completeSessionMutation.mutate,
    isCompletingSession: completeSessionMutation.isPending,
    currentSession: queryClient.getQueryData(['current-session', topicId]) as PracticeSession | undefined,
  };
};
