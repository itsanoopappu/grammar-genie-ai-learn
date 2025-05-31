import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TopicProgress {
  id: string;
  user_id: string;
  topic: string;
  level: string;
  correct: number;
  incorrect: number;
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  last_attempt: string;
}

export const useUserProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTopicProgress = async (topic: string, level: string, isCorrect: boolean) => {
    try {
      const existingProgress = progress.find(p => p.topic === topic && p.level === level);

      if (existingProgress) {
        const updates = {
          correct: isCorrect ? existingProgress.correct + 1 : existingProgress.correct,
          incorrect: isCorrect ? existingProgress.incorrect : existingProgress.incorrect + 1,
          confidence: calculateConfidence(
            isCorrect ? existingProgress.correct + 1 : existingProgress.correct,
            isCorrect ? existingProgress.incorrect : existingProgress.incorrect + 1
          ),
          last_attempt: new Date().toISOString()
        };

        const { error } = await supabase
          .from('user_progress')
          .update(updates)
          .eq('id', existingProgress.id);

        if (error) throw error;

        setProgress(prev => prev.map(p => 
          p.id === existingProgress.id ? { ...p, ...updates } : p
        ));
      } else {
        const { data, error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user?.id,
            topic,
            level,
            correct: isCorrect ? 1 : 0,
            incorrect: isCorrect ? 0 : 1,
            confidence: 'low',
            last_attempt: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        setProgress(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getTopicMasteryStatus = (topic: string, level: string): 'mastered' | 'in-progress' | 'not-started' => {
    const topicProgress = progress.find(p => p.topic === topic && p.level === level);

    if (!topicProgress) {
      return 'not-started';
    }

    const totalAttempts = topicProgress.correct + topicProgress.incorrect;
    const successRate = (topicProgress.correct / totalAttempts) * 100;

    if (successRate >= 80 && totalAttempts >= 5) {
      return 'mastered';
    }

    return 'in-progress';
  };

  return {
    progress,
    loading,
    updateTopicProgress,
    getTopicMasteryStatus,
    refetch: fetchProgress
  };
};

function calculateConfidence(correct: number, incorrect: number): 'low' | 'medium' | 'high' | 'unknown' {
  const total = correct + incorrect;
  if (total < 3) return 'unknown';

  const successRate = (correct / total) * 100;
  if (successRate >= 80) return 'high';
  if (successRate >= 60) return 'medium';
  return 'low';
}