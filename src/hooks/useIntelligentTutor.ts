
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface TopicRecommendation {
  id: string;
  name: string;
  description: string;
  level: string;
  category: string;
  skill_level: number;
  mastery_level: string;
  priority: 'high' | 'normal' | 'low';
  reason: string;
  recommended: boolean;
  assessment_driven?: boolean;
  confidence_score?: number;
  days_since_practice?: number;
}

interface AssessmentData {
  score: number;
  level: string;
  date: string;
  weaknesses: string[];
  strengths: string[];
}

export const useIntelligentTutor = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [topicRecommendations, setTopicRecommendations] = useState<TopicRecommendation[]>([]);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTopicRecommendations = async (useAssessmentData = true) => {
    if (!user || !profile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const action = useAssessmentData ? 'get_assessment_driven_recommendations' : 'get_topic_recommendations';
      
      const { data, error: functionError } = await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action,
          user_id: user.id,
          user_level: profile.level
        }
      });

      if (functionError) throw functionError;

      setTopicRecommendations(data.recommendations || []);
      
      if (data.assessment_data) {
        setAssessmentData(data.assessment_data);
      }
    } catch (err: any) {
      console.error('Error getting topic recommendations:', err);
      setError(err.message || 'Failed to get recommendations');
      
      // Fallback to basic recommendations
      try {
        const { data: fallbackData } = await supabase.functions.invoke('intelligent-tutor', {
          body: {
            action: 'get_topic_recommendations',
            user_id: user.id,
            user_level: profile.level
          }
        });
        setTopicRecommendations(fallbackData?.recommendations || []);
      } catch (fallbackErr) {
        console.error('Fallback recommendations failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPersonalizedExercises = async (topicId: string) => {
    if (!user || !profile) return null;
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'get_personalized_exercises',
          user_id: user.id,
          topic_id: topicId,
          user_level: profile.level
        }
      });

      if (functionError) throw functionError;
      return data;
    } catch (err: any) {
      console.error('Error getting personalized exercises:', err);
      throw err;
    }
  };

  const evaluateExercise = async (exerciseId: string, userAnswer: string, sessionId: string, timeTaken: number = 0) => {
    if (!user) return null;
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'evaluate_exercise',
          user_id: user.id,
          exercise_id: exerciseId,
          user_answer: userAnswer,
          session_id: sessionId,
          time_taken: timeTaken
        }
      });

      if (functionError) throw functionError;
      return data;
    } catch (err: any) {
      console.error('Error evaluating exercise:', err);
      throw err;
    }
  };

  const getAdaptiveDifficulty = async (topicId: string) => {
    if (!user) return null;
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'get_adaptive_difficulty',
          user_id: user.id,
          topic_id: topicId
        }
      });

      if (functionError) throw functionError;
      return data;
    } catch (err: any) {
      console.error('Error getting adaptive difficulty:', err);
      return { difficulty: 5, skill_level: 0.5, confidence: 0.2 };
    }
  };

  // Real-time skill updates
  const updateSkillModel = async (topicId: string, performanceData: any) => {
    if (!user) return;
    
    try {
      await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'update_skill_model',
          user_id: user.id,
          topic_id: topicId,
          performance_data: performanceData
        }
      });
    } catch (err: any) {
      console.error('Error updating skill model:', err);
    }
  };

  // Get spaced repetition due topics
  const getSpacedRepetitionTopics = async () => {
    if (!user) return [];
    
    try {
      const { data } = await supabase
        .from('user_skills')
        .select('*, grammar_topics(*)')
        .eq('user_id', user.id)
        .lte('next_review_due', new Date().toISOString())
        .order('next_review_due');

      return data || [];
    } catch (err: any) {
      console.error('Error getting spaced repetition topics:', err);
      return [];
    }
  };

  return {
    topicRecommendations,
    assessmentData,
    loading,
    error,
    getTopicRecommendations,
    getPersonalizedExercises,
    evaluateExercise,
    getAdaptiveDifficulty,
    updateSkillModel,
    getSpacedRepetitionTopics
  };
};
