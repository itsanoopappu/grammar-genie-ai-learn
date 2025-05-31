
import { Exercise } from '@/types/exercise';

export const useExerciseValidation = () => {
  const validateExercise = (exercise: any): exercise is Exercise => {
    if (!exercise || typeof exercise !== 'object') {
      console.warn('Exercise validation failed: not an object');
      return false;
    }
    
    if (!exercise.type || typeof exercise.type !== 'string') {
      console.warn('Exercise validation failed: invalid type');
      return false;
    }
    
    if (!exercise.content || typeof exercise.content !== 'object') {
      console.warn('Exercise validation failed: invalid content');
      return false;
    }
    
    if (!exercise.difficulty_level || typeof exercise.difficulty_level !== 'number') {
      console.warn('Exercise validation failed: invalid difficulty_level');
      return false;
    }

    const content = exercise.content;
    if (!content.question || typeof content.question !== 'string') {
      console.warn('Exercise validation failed: invalid question');
      return false;
    }

    // Check for correct_answer (standardized field)
    if (!content.correct_answer || typeof content.correct_answer !== 'string' || content.correct_answer.trim() === '') {
      console.warn('Exercise validation failed: missing or invalid correct_answer');
      return false;
    }

    // Validate options for multiple-choice
    if (exercise.type.toLowerCase().includes('multiple') || exercise.type.toLowerCase().includes('choice')) {
      if (!Array.isArray(content.options) || content.options.length === 0) {
        console.warn('Exercise validation failed: invalid options for multiple choice');
        return false;
      }
    }

    return true;
  };

  const normalizeExercise = (exercise: any): Exercise | null => {
    if (!validateExercise(exercise)) {
      return null;
    }

    // Ensure consistent field naming
    return {
      ...exercise,
      content: {
        ...exercise.content,
        correct_answer: exercise.content.correct_answer || exercise.content.correctAnswer || '',
        options: exercise.content.options || []
      }
    };
  };

  return {
    validateExercise,
    normalizeExercise
  };
};
