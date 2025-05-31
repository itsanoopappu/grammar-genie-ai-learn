import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface Exercise {
  type: 'fill-blank' | 'multiple-choice' | 'transformation';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: number;
}

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

export const useUnifiedPractice = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  // Drill management state
  const [drillRecommendations, setDrillRecommendations] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Active drill state
  const [drillInProgress, setDrillInProgress] = useState(false);
  const [currentDrill, setCurrentDrill] = useState<Drill | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [exerciseResult, setExerciseResult] = useState<any>(null);
  const [drillScore, setDrillScore] = useState(0);

  const staticDrills: Drill[] = [
    {
      id: 1,
      topic: 'Present Perfect Tense',
      level: 'B1',
      description: 'Master the present perfect tense with real-world examples',
      estimatedTime: 15,
      difficulty: 'Medium',
      completed: false,
      recommended: true,
      priority: 'high',
      reason: 'Essential for intermediate level',
      source: 'static'
    },
    {
      id: 2,
      topic: 'Conditional Sentences',
      level: 'B2',
      description: 'Practice all types of conditional sentences',
      estimatedTime: 20,
      difficulty: 'Hard',
      completed: false,
      recommended: true,
      priority: 'high',
      reason: 'Challenging but important for fluency',
      source: 'static'
    },
    {
      id: 3,
      topic: 'Article Usage',
      level: 'A2',
      description: 'Learn when to use a, an, the, or no article',
      estimatedTime: 10,
      difficulty: 'Easy',
      completed: true,
      score: 85,
      recommended: false,
      source: 'static'
    },
    {
      id: 4,
      topic: 'Modal Verbs',
      level: 'B1',
      description: 'Practice using can, could, may, might, must, should',
      estimatedTime: 18,
      difficulty: 'Medium',
      completed: false,
      recommended: true,
      priority: 'normal',
      reason: 'Good for expanding expression',
      source: 'static'
    }
  ];

  useEffect(() => {
    if (user && profile) {
      loadDrillRecommendations();
    }
  }, [user, profile]);

  const loadDrillRecommendations = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Get AI-powered drill recommendations
      const { data: aiData, error: aiError } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'personalized-recommendations',
          userLevel: profile.level,
          user_id: user?.id,
          weakTopics: []
        }
      });

      let aiDrills: Drill[] = [];
      if (!aiError && aiData?.recommendations) {
        aiDrills = aiData.recommendations.map((rec: any, index: number) => ({
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
      }

      // Get completed drills
      const { data: completedData } = await supabase
        .from('drill_recommendations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('resolved', true);

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

      setDrillRecommendations([...aiDrills, ...staticDrills, ...completedDrills]);
    } catch (error) {
      console.error('Error loading drill recommendations:', error);
      // Fallback to static drills only
      setDrillRecommendations(staticDrills);
    } finally {
      setLoading(false);
    }
  };

  const startDrill = async (drill: Drill) => {
    setCurrentDrill(drill);
    setLoading(true);
    
    try {
      // Check for existing drill data first
      const { data: existingDrill } = await supabase
        .from('drill_recommendations')
        .select('*')
        .eq('topic', drill.topic)
        .eq('level', drill.level)
        .eq('user_id', user?.id)
        .eq('resolved', false)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (existingDrill?.drill_data) {
        const exercises = Array.isArray(existingDrill.drill_data) 
          ? (existingDrill.drill_data as unknown as Exercise[])
          : [];
          
        setExercises(exercises);
        setDrillInProgress(true);
        setCurrentExercise(0);
        setDrillScore(0);
        setUserAnswer('');
        setSelectedOption('');
        setShowFeedback(false);
        setLoading(false);
        return;
      }

      // Generate new exercises using the grammar-topics function
      const { data, error } = await supabase.functions.invoke('grammar-topics', {
        body: { 
          action: 'generate_exercises',
          topic: drill.topic,
          level: drill.level,
          count: 5,
          userLevel: profile?.level
        }
      });

      if (error) throw error;
      
      // Store the drill data for resumption
      await supabase
        .from('drill_recommendations')
        .upsert({
          user_id: user?.id,
          topic: drill.topic,
          level: drill.level,
          reason: drill.reason,
          resolved: false,
          drill_data: data.exercises
        });

      setExercises(data.exercises || []);
      setDrillInProgress(true);
      setCurrentExercise(0);
      setDrillScore(0);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
    } catch (error) {
      console.error('Error starting drill:', error);
      // Fallback exercises for demonstration
      const fallbackExercises: Exercise[] = [
        {
          type: 'multiple-choice',
          question: `Choose the correct form for ${drill.topic}:`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          answer: 'Option A',
          explanation: `This is the correct form for ${drill.topic}.`,
          difficulty: 1
        }
      ];
      setExercises(fallbackExercises);
      setDrillInProgress(true);
      setCurrentExercise(0);
      setDrillScore(0);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const currentExerciseData = exercises[currentExercise];
    const answer = currentExerciseData.type === 'multiple-choice' ? selectedOption : userAnswer;
    
    if (!answer.trim()) return;

    setLoading(true);
    try {
      // Evaluate the answer
      const isCorrect = answer.toLowerCase().trim() === currentExerciseData.answer.toLowerCase().trim();
      
      setExerciseResult({
        isCorrect,
        feedback: isCorrect ? 'Great job!' : `The correct answer is: ${currentExerciseData.answer}`,
        xpGained: isCorrect ? 10 : 5
      });
      
      setShowFeedback(true);
      
      if (isCorrect) {
        setDrillScore(prev => prev + 1);
      }

      // Award XP
      if (profile) {
        const xpGained = isCorrect ? 10 : 5;
        await updateProfile({ xp: (profile.xp || 0) + xpGained });
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
      setExerciseResult(null);
    } else {
      completeDrill();
    }
  };

  const completeDrill = async () => {
    const finalScore = exercises.length > 0 ? (drillScore / exercises.length) * 100 : 0;
    
    // Mark drill as resolved in database
    if (currentDrill) {
      await supabase
        .from('drill_recommendations')
        .update({ 
          resolved: true,
          score: finalScore
        })
        .eq('topic', currentDrill.topic)
        .eq('level', currentDrill.level)
        .eq('user_id', user?.id);
    }
    
    // Reset state
    setDrillInProgress(false);
    setCurrentDrill(null);
    setExercises([]);
    setCurrentExercise(0);
    setUserAnswer('');
    setSelectedOption('');
    setShowFeedback(false);
    setExerciseResult(null);
    setDrillScore(0);
    
    // Reload recommendations to show completion
    loadDrillRecommendations();
  };

  return {
    drillRecommendations,
    loading,
    drillInProgress,
    currentDrill,
    exercises,
    currentExercise,
    userAnswer,
    selectedOption,
    showFeedback,
    exerciseResult,
    drillScore,
    setUserAnswer,
    setSelectedOption,
    startDrill,
    submitAnswer,
    nextExercise,
    completeDrill,
    loadDrillRecommendations
  };
};