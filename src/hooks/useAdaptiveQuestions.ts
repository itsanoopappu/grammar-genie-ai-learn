
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
  ) => {
    if (!user) {
      setError('User not authenticated');
      return [];
    }

    setIsLoading(true);
    setError(null);
    
    console.log(`🔄 Loading ${limit} questions for level: ${level}, excluding: ${excludeQuestionIds.length} questions`);
    
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
        console.warn(`⚠️ No questions found for level ${level}`);
        setError(`No questions available for level ${level}`);
        return [];
      }

      // Validate that all questions match the requested level
      const validQuestions = newQuestions.filter((q: any) => q.level === level);
      const invalidQuestions = newQuestions.filter((q: any) => q.level !== level);
      
      if (invalidQuestions.length > 0) {
        console.warn(`⚠️ Found ${invalidQuestions.length} questions with wrong level:`, 
          invalidQuestions.map(q => `${q.id} (${q.level})`));
      }

      const transformedQuestions = validQuestions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        level: q.level,
        topic: q.topic,
        difficulty_score: q.difficulty_score
      }));

      console.log(`✅ Loaded ${transformedQuestions.length} valid questions for level ${level}`);
      
      // Verify all questions are for the correct level
      const levelMismatch = transformedQuestions.find(q => q.level !== level);
      if (levelMismatch) {
        console.error(`❌ Level mismatch detected! Expected ${level}, got ${levelMismatch.level}`);
      }

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

  return {
    questions,
    isLoading,
    error,
    loadQuestionsForLevel,
    clearQuestions
  };
};
