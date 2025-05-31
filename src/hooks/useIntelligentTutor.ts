
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface Exercise {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'error-correction';
  content: {
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    hints?: string[];
    commonMistakes?: string[];
  };
  difficulty_level: number;
  estimated_time_seconds: number;
}

interface TopicRecommendation {
  id: string;
  name: string;
  description: string;
  level: string;
  category: string;
  difficulty_score: number;
  skill_level: number;
  mastery_level: string;
  priority: 'high' | 'normal' | 'low';
  reason: string;
  recommended: boolean;
}

interface SessionData {
  session_id: string;
  target_difficulty: number;
  skill_level: number;
}

export const useIntelligentTutor = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [topicRecommendations, setTopicRecommendations] = useState<TopicRecommendation[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const getPersonalizedExercises = async (topicId: string) => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'get_personalized_exercises',
          user_id: user.id,
          topic_id: topicId,
          user_level: profile.level || 'A2'
        }
      });

      if (error) throw error;
      
      setCurrentExercises(data.exercises);
      setSessionData({
        session_id: data.session_id,
        target_difficulty: data.target_difficulty,
        skill_level: data.skill_level
      });
      setCurrentExerciseIndex(0);
      setUserAnswer('');
      setFeedback(null);
      setShowFeedback(false);
    } catch (error) {
      console.error('Error getting personalized exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!user || !sessionData || !currentExercises[currentExerciseIndex] || !userAnswer.trim()) return;

    setLoading(true);
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'evaluate_exercise',
          user_id: user.id,
          exercise_id: currentExercises[currentExerciseIndex].id,
          user_answer: userAnswer,
          session_id: sessionData.session_id,
          time_taken: Math.round((Date.now() - startTime) / 1000)
        }
      });

      if (error) throw error;
      
      setFeedback(data);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < currentExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setUserAnswer('');
      setFeedback(null);
      setShowFeedback(false);
    }
  };

  const getTopicRecommendations = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'get_topic_recommendations',
          user_id: user.id,
          user_level: profile.level || 'A2'
        }
      });

      if (error) throw error;
      setTopicRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error getting topic recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLearningPath = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'create_learning_path',
          user_id: user.id,
          user_level: profile.level || 'A2'
        }
      });

      if (error) throw error;
      return data.learning_path;
    } catch (error) {
      console.error('Error creating learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      getTopicRecommendations();
    }
  }, [user, profile]);

  return {
    loading,
    currentExercises,
    sessionData,
    topicRecommendations,
    currentExerciseIndex,
    userAnswer,
    setUserAnswer,
    feedback,
    showFeedback,
    getPersonalizedExercises,
    submitAnswer,
    nextExercise,
    getTopicRecommendations,
    createLearningPath,
    currentExercise: currentExercises[currentExerciseIndex] || null,
    isLastExercise: currentExerciseIndex === currentExercises.length - 1,
    progress: currentExercises.length > 0 ? ((currentExerciseIndex + 1) / currentExercises.length) * 100 : 0
  };
};
