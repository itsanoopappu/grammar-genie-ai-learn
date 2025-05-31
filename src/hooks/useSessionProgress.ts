
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSessionProgress = (sessionId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessionProgress, isLoading } = useQuery({
    queryKey: ['session-progress', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!user,
    staleTime: 30 * 1000, // 30 seconds - session data changes frequently
    refetchInterval: 30 * 1000, // Refetch every 30 seconds during active session
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ 
      exercises_attempted, 
      exercises_correct 
    }: { 
      exercises_attempted: number; 
      exercises_correct: number; 
    }) => {
      if (!sessionId) throw new Error('No session ID');

      const { error } = await supabase
        .from('practice_sessions')
        .update({
          exercises_attempted,
          exercises_correct,
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['session-progress', sessionId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['session-progress', sessionId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['session-progress', sessionId], (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousData };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(
        ['session-progress', sessionId], 
        context?.previousData
      );
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['session-progress', sessionId] });
    },
  });

  return {
    sessionProgress,
    isLoading,
    updateSession: updateSessionMutation.mutate,
    isUpdating: updateSessionMutation.isPending,
  };
};
