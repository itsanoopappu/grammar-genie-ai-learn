
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GrammarTopic {
  id: string;
  name: string;
  description: string;
  level: string;
  category: string;
  difficulty_score: number;
  prerequisites: string[];
  learning_objectives: string[];
  common_errors: string[];
}

export const useTopics = () => {
  return useQuery({
    queryKey: ['grammar-topics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('grammar-topics', {
        body: { action: 'get_topics' }
      });

      if (error) {
        throw new Error(`Failed to load grammar topics: ${error.message}`);
      }

      return data.topics as GrammarTopic[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - topics don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
