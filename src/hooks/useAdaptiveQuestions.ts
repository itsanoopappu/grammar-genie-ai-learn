
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
        
        // Try to get questions from adjacent levels as fallback
        const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentIndex = levelOrder.indexOf(level);
        const adjacentLevels = [];
        
        if (currentIndex > 0) adjacentLevels.push(levelOrder[currentIndex - 1]);
        if (currentIndex < levelOrder.length - 1) adjacentLevels.push(levelOrder[currentIndex + 1]);
        
        console.log(`🔄 Trying fallback levels: ${adjacentLevels.join(', ')}`);
        
        for (const fallbackLevel of adjacentLevels) {
          const { data: fallbackQuestions } = await supabase
            .rpc('get_adaptive_questions_for_user', {
              p_user_id: user.id,
              p_current_level: fallbackLevel,
              p_limit: limit,
              p_exclude_question_ids: excludeQuestionIds
            });
          
          if (fallbackQuestions && fallbackQuestions.length > 0) {
            console.log(`✅ Found ${fallbackQuestions.length} fallback questions from level ${fallbackLevel}`);
            const transformedQuestions = fallbackQuestions.map((q: any) => ({
              id: q.id,
              question: q.question,
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              level: q.level,
              topic: q.topic,
              difficulty_score: q.difficulty_score
            }));
            
            setQuestions(transformedQuestions);
            return transformedQuestions;
          }
        }
        
        setError(`No questions available for level ${level} or adjacent levels`);
        return [];
      }

      // Validate that questions match the requested level (or are from fallback)
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

      console.log(`✅ Loaded ${transformedQuestions.length} questions for level ${level}`);
      
      // Log if any questions don't match the expected level
      const levelMismatches = transformedQuestions.filter(q => q.level !== level);
      if (levelMismatches.length > 0) {
        console.warn(`⚠️ Found ${levelMismatches.length} questions with different levels than requested (${level}):`, 
          levelMismatches.map(q => `${q.id}: ${q.level}`));
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

  const getQuestionByIndex = useCallback((index: number): AdaptiveQuestion | null => {
    return questions[index] || null;
  }, [questions]);

  const addQuestions = useCallback((newQuestions: AdaptiveQuestion[]) => {
    setQuestions(prev => [...prev, ...newQuestions]);
  }, []);

  return {
    questions,
    isLoading,
    error,
    loadQuestionsForLevel,
    clearQuestions,
    getQuestionByIndex,
    addQuestions
  };
};
