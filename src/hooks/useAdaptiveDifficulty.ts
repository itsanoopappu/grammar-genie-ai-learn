
import { useState, useCallback } from 'react';
import { useAdaptiveScoring } from '@/hooks/useAdaptiveScoring';

export const useAdaptiveDifficulty = () => {
  const [currentLevel, setCurrentLevel] = useState('B1');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [progression, setProgression] = useState<string[]>(['B1']);
  
  const { getNextDifficultyLevel } = useAdaptiveScoring();

  const processAnswer = useCallback((isCorrect: boolean) => {
    console.log(`🎯 Processing answer: ${isCorrect ? 'CORRECT' : 'INCORRECT'} at level ${currentLevel}`);
    
    // Update consecutive counters
    if (isCorrect) {
      setConsecutiveCorrect(prev => prev + 1);
      setConsecutiveWrong(0);
    } else {
      setConsecutiveWrong(prev => prev + 1);
      setConsecutiveCorrect(0);
    }
    
    setLastAnswerCorrect(isCorrect);
  }, [currentLevel]);

  const calculateNextLevel = useCallback(() => {
    const nextLevel = getNextDifficultyLevel(
      currentLevel,
      lastAnswerCorrect || false,
      consecutiveCorrect,
      consecutiveWrong
    );

    console.log(`📊 Difficulty calculation: current=${currentLevel}, next=${nextLevel}, consCorrect=${consecutiveCorrect}, consWrong=${consecutiveWrong}`);

    return nextLevel;
  }, [currentLevel, lastAnswerCorrect, consecutiveCorrect, consecutiveWrong, getNextDifficultyLevel]);

  const updateLevel = useCallback((newLevel: string) => {
    if (newLevel !== currentLevel) {
      console.log(`🚀 DIFFICULTY CHANGE: ${currentLevel} → ${newLevel}`);
      setCurrentLevel(newLevel);
      setProgression(prev => [...prev, newLevel]);
      
      // Reset consecutive counters when level changes
      setConsecutiveCorrect(0);
      setConsecutiveWrong(0);
      
      return true; // Level changed
    }
    return false; // Level stayed the same
  }, [currentLevel]);

  const reset = useCallback(() => {
    console.log('🔄 Resetting difficulty tracking');
    setCurrentLevel('B1');
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    setLastAnswerCorrect(null);
    setProgression(['B1']);
  }, []);

  return {
    currentLevel,
    consecutiveCorrect,
    consecutiveWrong,
    lastAnswerCorrect,
    progression,
    processAnswer,
    calculateNextLevel,
    updateLevel,
    reset
  };
};
