
import { useState, useCallback } from 'react';
import { useAdaptiveScoring } from '@/hooks/useAdaptiveScoring';

export const useAdaptiveDifficulty = () => {
  const [currentLevel, setCurrentLevel] = useState('B1');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [progression, setProgression] = useState<string[]>(['B1']);
  const [questionsAtCurrentLevel, setQuestionsAtCurrentLevel] = useState(0);
  const [levelPerformanceHistory, setLevelPerformanceHistory] = useState<Array<{level: string, correct: boolean}>>([]);
  
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
    setQuestionsAtCurrentLevel(prev => prev + 1);
    
    // Track performance history for this level
    setLevelPerformanceHistory(prev => [
      ...prev,
      { level: currentLevel, correct: isCorrect }
    ]);
  }, [currentLevel]);

  const calculateNextLevel = useCallback(() => {
    const isAtBottom = currentLevel === 'A1';
    const isAtTop = currentLevel === 'C2';
    
    // Check if we need to force a level change due to stagnation (3+ questions at same level)
    const shouldForceChange = questionsAtCurrentLevel >= 3 && !isAtBottom && !isAtTop;
    
    if (shouldForceChange) {
      console.log(`🔄 FORCING level change after ${questionsAtCurrentLevel} questions at ${currentLevel}`);
      
      // Analyze recent performance at this level to decide direction
      const recentPerformance = levelPerformanceHistory
        .filter(entry => entry.level === currentLevel)
        .slice(-3); // Last 3 answers at this level
      
      const correctCount = recentPerformance.filter(entry => entry.correct).length;
      const performanceRatio = correctCount / recentPerformance.length;
      
      console.log(`📊 Performance analysis: ${correctCount}/${recentPerformance.length} = ${performanceRatio}`);
      
      // Force direction based on performance
      const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentIndex = levelOrder.indexOf(currentLevel);
      
      if (performanceRatio >= 0.67) { // 2/3 or better
        // Move up if possible
        const nextLevel = currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : currentLevel;
        console.log(`📈 FORCING UP: ${currentLevel} → ${nextLevel} (performance: ${performanceRatio})`);
        return nextLevel;
      } else if (performanceRatio <= 0.33) { // 1/3 or worse
        // Move down if possible
        const nextLevel = currentIndex > 0 ? levelOrder[currentIndex - 1] : currentLevel;
        console.log(`📉 FORCING DOWN: ${currentLevel} → ${nextLevel} (performance: ${performanceRatio})`);
        return nextLevel;
      } else {
        // Borderline performance - slight preference to move up for engagement
        const nextLevel = currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : currentLevel;
        console.log(`🎯 FORCING UP (borderline): ${currentLevel} → ${nextLevel} (performance: ${performanceRatio})`);
        return nextLevel;
      }
    }
    
    // Normal adaptation logic (2 consecutive correct/wrong)
    const nextLevel = getNextDifficultyLevel(
      currentLevel,
      lastAnswerCorrect || false,
      consecutiveCorrect,
      consecutiveWrong
    );

    console.log(`📊 Normal difficulty calculation: current=${currentLevel}, next=${nextLevel}, consCorrect=${consecutiveCorrect}, consWrong=${consecutiveWrong}, questionsAtLevel=${questionsAtCurrentLevel}`);

    return nextLevel;
  }, [currentLevel, lastAnswerCorrect, consecutiveCorrect, consecutiveWrong, questionsAtCurrentLevel, levelPerformanceHistory, getNextDifficultyLevel]);

  const updateLevel = useCallback((newLevel: string) => {
    if (newLevel !== currentLevel) {
      console.log(`🚀 DIFFICULTY CHANGE: ${currentLevel} → ${newLevel} (after ${questionsAtCurrentLevel} questions)`);
      setCurrentLevel(newLevel);
      setProgression(prev => [...prev, newLevel]);
      
      // Reset consecutive counters and level question count when level changes
      setConsecutiveCorrect(0);
      setConsecutiveWrong(0);
      setQuestionsAtCurrentLevel(0);
      
      return true; // Level changed
    }
    return false; // Level stayed the same
  }, [currentLevel, questionsAtCurrentLevel]);

  const reset = useCallback(() => {
    console.log('🔄 Resetting difficulty tracking');
    setCurrentLevel('B1');
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    setLastAnswerCorrect(null);
    setProgression(['B1']);
    setQuestionsAtCurrentLevel(0);
    setLevelPerformanceHistory([]);
  }, []);

  return {
    currentLevel,
    consecutiveCorrect,
    consecutiveWrong,
    lastAnswerCorrect,
    progression,
    questionsAtCurrentLevel,
    processAnswer,
    calculateNextLevel,
    updateLevel,
    reset
  };
};
