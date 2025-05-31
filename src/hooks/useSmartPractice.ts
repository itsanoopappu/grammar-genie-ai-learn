
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface Drill {
  id: number;
  topic: string;
  level: string;
  description: string;
  estimatedTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  score?: number;
  recommended: boolean;
  priority?: 'high' | 'normal';
  reason?: string;
  source: 'ai' | 'static';
}

export const useSmartPractice = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [drillRecommendations, setDrillRecommendations] = useState<Drill[]>([]);

  const getDrillRecommendations = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      // Get AI-powered drill recommendations
      const { data: aiData, error: aiError } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'personalized-recommendations',
          userLevel: profile.level,
          user_id: user.id,
          weakTopics: [] // This will be populated based on user performance
        }
      });

      if (aiError) throw aiError;

      // Get existing completed drills from database
      const { data: completedData, error: completedError } = await supabase
        .from('drill_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('resolved', true);

      if (completedError) throw completedError;

      // Transform AI recommendations
      const aiDrills: Drill[] = (aiData?.recommendations || []).map((rec: any, index: number) => ({
        id: 1000 + index,
        topic: rec.topic,
        level: profile.level,
        description: rec.description || `AI-recommended practice for ${rec.topic}`,
        estimatedTime: rec.estimatedTime || 15,
        difficulty: rec.difficulty === 'easy' ? 'Easy' : rec.difficulty === 'hard' ? 'Hard' : 'Medium',
        completed: false,
        recommended: true,
        priority: rec.priority || 'normal',
        reason: rec.reason,
        source: 'ai' as const
      }));

      // Transform completed drills
      const completedDrills: Drill[] = (completedData || []).map((drill: any) => ({
        id: parseInt(drill.id.split('-')[0]) || Math.random() * 1000,
        topic: drill.topic,
        level: drill.level,
        description: `Completed practice session for ${drill.topic}`,
        estimatedTime: 15,
        difficulty: 'Medium' as const,
        completed: true,
        score: drill.score || 0,
        recommended: false,
        reason: drill.reason,
        source: 'static' as const
      }));

      // Add some static high-quality drills for variety
      const staticDrills: Drill[] = [
        {
          id: 2001,
          topic: 'Present Perfect vs Past Simple',
          level: profile.level,
          description: 'Master the difference between present perfect and past simple tenses',
          estimatedTime: 12,
          difficulty: 'Medium',
          completed: false,
          recommended: true,
          priority: 'high',
          reason: 'Common confusion area for learners',
          source: 'static'
        },
        {
          id: 2002,
          topic: 'Article Usage Mastery',
          level: profile.level,
          description: 'Perfect your use of a, an, the, and zero article',
          estimatedTime: 10,
          difficulty: 'Easy',
          completed: false,
          recommended: true,
          priority: 'normal',
          reason: 'Foundation skill for natural English',
          source: 'static'
        }
      ];

      setDrillRecommendations([...aiDrills, ...staticDrills, ...completedDrills]);
    } catch (error) {
      console.error('Error getting drill recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDrill = async (drill: Drill) => {
    if (!user) return;

    try {
      // Create or update drill recommendation in database
      const { error } = await supabase
        .from('drill_recommendations')
        .upsert({
          user_id: user.id,
          topic: drill.topic,
          level: drill.level,
          reason: drill.reason,
          resolved: false
        });

      if (error) throw error;

      // Here you would typically navigate to the drill practice session
      // For now, we'll just log the action
      console.log('Starting drill:', drill.topic);
      
      // In a real implementation, this would open the drill interface
      // You might want to integrate with your existing practice components
    } catch (error) {
      console.error('Error starting drill:', error);
    }
  };

  useEffect(() => {
    if (user && profile) {
      getDrillRecommendations();
    }
  }, [user, profile]);

  return {
    drillRecommendations,
    loading,
    getDrillRecommendations,
    startDrill
  };
};
