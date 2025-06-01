
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

  const shouldForceChange = useCallback(() => {
    const isAtBottom = currentLevel === 'A1';
    const isAtTop = currentLevel === 'C2';
    
    // STRICT RULE: Force change after exactly 3 questions (unless at extremes)
    return questionsAtCurrentLevel >= 3 && !isAtBottom && !isAtTop;
  }, [questionsAtCurrentLevel, currentLevel]);

  const calculateNextLevel = useCallback(() => {
    const isAtBottom = currentLevel === 'A1';
    const isAtTop = currentLevel === 'C2';
    
    // STRICT ENFORCEMENT: Force change after 3 questions
    if (shouldForceChange()) {
      console.log(`🔄 FORCING level change after exactly 3 questions at ${currentLevel}`);
      
      // Analyze performance at this level for forcing direction
      const currentLevelPerformance = levelPerformanceHistory
        .filter(entry => entry.level === currentLevel)
        .slice(-3); // Last 3 answers at this level
      
      const correctCount = currentLevelPerformance.filter(entry => entry.correct).length;
      const performanceRatio = correctCount / Math.max(currentLevelPerformance.length, 1);
      
      console.log(`📊 Force direction analysis: ${correctCount}/${currentLevelPerformance.length} = ${performanceRatio}`);
      
      const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentIndex = levelOrder.indexOf(currentLevel);
      
      if (performanceRatio >= 0.67) { // 2/3 or better - move up
        const nextLevel = currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : currentLevel;
        console.log(`📈 FORCING UP: ${currentLevel} → ${nextLevel} (performance: ${performanceRatio})`);
        return nextLevel;
      } else { // Poor performance - move down
        const nextLevel = currentIndex > 0 ? levelOrder[currentIndex - 1] : currentLevel;
        console.log(`📉 FORCING DOWN: ${currentLevel} → ${nextLevel} (performance: ${performanceRatio})`);
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

    console.log(`📊 Normal adaptation: current=${currentLevel}, next=${nextLevel}, consCorrect=${consecutiveCorrect}, consWrong=${consecutiveWrong}, questionsAtLevel=${questionsAtCurrentLevel}`);

    return nextLevel;
  }, [currentLevel, lastAnswerCorrect, consecutiveCorrect, consecutiveWrong, questionsAtCurrentLevel, levelPerformanceHistory, getNextDifficultyLevel, shouldForceChange]);

  const updateLevel = useCallback((newLevel: string) => {
    if (newLevel !== currentLevel) {
      console.log(`🚀 LEVEL CHANGE: ${currentLevel} → ${newLevel} (after ${questionsAtCurrentLevel} questions)`);
      setCurrentLevel(newLevel);
      setProgression(prev => [...prev, newLevel]);
      
      // Reset counters when level changes
      setConsecutiveCorrect(0);
      setConsecutiveWrong(0);
      setQuestionsAtCurrentLevel(0);
      
      return true; // Level changed
    }
    return false; // Level stayed the same
  }, [currentLevel, questionsAtCurrentLevel]);

  const mustChangeLevel = useCallback(() => {
    return shouldForceChange();
  }, [shouldForceChange]);

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
    mustChangeLevel,
    shouldForceChange,
    reset
  };
};
