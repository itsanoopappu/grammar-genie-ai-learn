
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdaptiveQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  level: string;
  topic: string;
  difficulty_score: number;
}

export const useAdaptiveQuestions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestionsForLevel = useCallback(async (
    level: string, 
    excludeQuestionIds: string[] = [], 
    limit: number = 5
  ): Promise<AdaptiveQuestion[]> => {
    if (!user) {
      setError('User not authenticated');
      return [];
    }

    setIsLoading(true);
    setError(null);
    
    console.log(`🔄 Loading ${limit} questions for EXACT level: ${level}, excluding: ${excludeQuestionIds.length} questions`);
    
    try {
      const { data: newQuestions, error: questionsError } = await supabase
        .rpc('get_adaptive_questions_for_user', {
          p_user_id: user.id,
          p_current_level: level,
          p_limit: limit,
          p_exclude_question_ids: excludeQuestionIds
        });

      if (questionsError) {
        console.error('❌ Error loading adaptive questions:', questionsError);
        setError(`Failed to load questions: ${questionsError.message}`);
        return [];
      }

      if (!newQuestions || newQuestions.length === 0) {
        console.error(`❌ NO QUESTIONS FOUND for level ${level} - System requires questions for each level`);
        setError(`No questions available for level ${level}. Assessment cannot continue.`);
        return [];
      }

      // STRICT VALIDATION: All questions must match requested level
      const levelMismatches = newQuestions.filter((q: any) => q.level !== level);
      if (levelMismatches.length > 0) {
        console.error(`❌ LEVEL MISMATCH DETECTED: ${levelMismatches.length} questions don't match level ${level}:`, 
          levelMismatches.map((q: any) => `${q.id}: ${q.level}`));
        setError(`Questions loaded don't match requested level ${level}`);
        return [];
      }

      const transformedQuestions = newQuestions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        level: q.level,
        topic: q.topic,
        difficulty_score: q.difficulty_score
      }));

      console.log(`✅ Loaded ${transformedQuestions.length} questions for level ${level} - ALL VERIFIED`);

      setQuestions(transformedQuestions);
      return transformedQuestions;
    } catch (error) {
      console.error('❌ Error in loadQuestionsForLevel:', error);
      setError(`Failed to load questions: ${error}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearQuestions = useCallback(() => {
    console.log('🧹 Clearing current question pool');
    setQuestions([]);
    setError(null);
  }, []);

  const getQuestionByIndex = useCallback((index: number): AdaptiveQuestion | null => {
    return questions[index] || null;
  }, [questions]);

  const addQuestions = useCallback((newQuestions: AdaptiveQuestion[]) => {
    setQuestions(prev => [...prev, ...newQuestions]);
  }, []);

  const hasQuestionsForLevel = useCallback((level: string): boolean => {
    return questions.some(q => q.level === level);
  }, [questions]);

  return {
    questions,
    isLoading,
    error,
    loadQuestionsForLevel,
    clearQuestions,
    getQuestionByIndex,
    addQuestions,
    hasQuestionsForLevel
  };
};
