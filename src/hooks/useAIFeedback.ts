
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackRequest {
  userAnswer: string;
  correctAnswer: string;
  topic: string;
}

export const useAIFeedback = () => {
  const feedbackMutation = useMutation({
    mutationFn: async ({ userAnswer, correctAnswer, topic }: FeedbackRequest) => {
      try {
        const { data, error } = await supabase.functions.invoke('drill-recommendations', {
          body: { 
            action: 'evaluate',
            userAnswer,
            correctAnswer,
            topic
          }
        });

        if (error) {
          console.warn('AI feedback failed:', error);
          // Return fallback feedback instead of throwing
          return {
            isCorrect: userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim(),
            feedback: {
              message: userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
                ? 'Correct! Well done.' 
                : `Incorrect. The correct answer is: ${correctAnswer}`,
              tip: 'Keep practicing to improve your skills!'
            },
            correctAnswer
          };
        }

        return data;
      } catch (err) {
        console.warn('AI feedback error:', err);
        // Return fallback feedback
        return {
          isCorrect: userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim(),
          feedback: {
            message: userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
              ? 'Correct! Well done.' 
              : `Incorrect. The correct answer is: ${correctAnswer}`,
            tip: 'Keep practicing to improve your skills!'
          },
          correctAnswer
        };
      }
    },
  });

  return {
    getFeedback: feedbackMutation.mutate,
    feedback: feedbackMutation.data,
    isLoading: feedbackMutation.isPending,
    error: feedbackMutation.error,
  };
};
