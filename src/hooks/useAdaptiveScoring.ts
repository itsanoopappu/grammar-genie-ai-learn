
interface LevelWeights {
  [key: string]: {
    correct: number;
    incorrect: number;
  };
}

export const LEVEL_WEIGHTS: LevelWeights = {
  'A1': { correct: 1, incorrect: -2.5 },
  'A2': { correct: 2, incorrect: -2.0 },
  'B1': { correct: 3, incorrect: -1.5 },
  'B2': { correct: 4, incorrect: -1.0 },
  'C1': { correct: 6, incorrect: 0.5 },
  'C2': { correct: 8, incorrect: 0.5 }
};

export const calculateWeightedScore = (
  userAnswers: Record<string, string>,
  questions: any[]
): {
  weightedScore: number;
  levelBreakdown: Record<string, { correct: number; total: number; points: number }>;
  totalPossibleScore: number;
} => {
  let weightedScore = 0;
  let totalPossibleScore = 0;
  const levelBreakdown: Record<string, { correct: number; total: number; points: number }> = {};

  questions.forEach(question => {
    const userAnswer = userAnswers[question.id];
    const isCorrect = userAnswer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
    const level = question.level || 'B1';
    const weights = LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS['B1'];

    // Initialize level breakdown
    if (!levelBreakdown[level]) {
      levelBreakdown[level] = { correct: 0, total: 0, points: 0 };
    }

    levelBreakdown[level].total++;
    totalPossibleScore += weights.correct;

    if (isCorrect) {
      weightedScore += weights.correct;
      levelBreakdown[level].correct++;
      levelBreakdown[level].points += weights.correct;
    } else {
      weightedScore += weights.incorrect;
      levelBreakdown[level].points += weights.incorrect;
    }
  });

  return { weightedScore, levelBreakdown, totalPossibleScore };
};

export const determineAdaptiveLevel = (
  weightedScore: number,
  totalPossibleScore: number,
  levelBreakdown: Record<string, { correct: number; total: number; points: number }>
): { level: string; confidence: number } => {
  const scorePercentage = Math.max(0, (weightedScore / totalPossibleScore) * 100);
  
  // Advanced level determination based on weighted performance
  let recommendedLevel = 'A1';
  let confidence = 0;

  // Check performance at each level
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  // Find the highest level where user performed well
  for (let i = levelOrder.length - 1; i >= 0; i--) {
    const level = levelOrder[i];
    const performance = levelBreakdown[level];
    
    if (performance && performance.total > 0) {
      const levelAccuracy = performance.correct / performance.total;
      const levelScore = performance.points;
      
      // High-level performance criteria
      if (level === 'C2' && levelAccuracy >= 0.6 && levelScore > 0) {
        recommendedLevel = 'C2';
        confidence = Math.min(95, 70 + (levelAccuracy * 25));
        break;
      } else if (level === 'C1' && levelAccuracy >= 0.7 && levelScore > 0) {
        recommendedLevel = 'C1';
        confidence = Math.min(90, 65 + (levelAccuracy * 25));
        break;
      } else if (level === 'B2' && levelAccuracy >= 0.75 && levelScore > 0) {
        recommendedLevel = 'B2';
        confidence = Math.min(85, 60 + (levelAccuracy * 25));
        break;
      } else if (level === 'B1' && levelAccuracy >= 0.7 && levelScore > 0) {
        recommendedLevel = 'B1';
        confidence = Math.min(80, 55 + (levelAccuracy * 25));
        break;
      } else if (level === 'A2' && levelAccuracy >= 0.6) {
        recommendedLevel = 'A2';
        confidence = Math.min(75, 50 + (levelAccuracy * 25));
        break;
      }
    }
  }

  // Penalty for poor performance on easier levels
  if (levelBreakdown['A1'] && levelBreakdown['A1'].total > 0) {
    const a1Accuracy = levelBreakdown['A1'].correct / levelBreakdown['A1'].total;
    if (a1Accuracy < 0.5) {
      // Significant penalty for basic mistakes
      recommendedLevel = 'A1';
      confidence = Math.max(20, confidence - 30);
    }
  }

  return { level: recommendedLevel, confidence };
};

export const getNextDifficultyLevel = (
  currentLevel: string,
  lastAnswerCorrect: boolean,
  consecutiveCorrect: number,
  consecutiveWrong: number
): string => {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(currentLevel);

  console.log(`Difficulty check: current=${currentLevel}, lastCorrect=${lastAnswerCorrect}, consCorrect=${consecutiveCorrect}, consWrong=${consecutiveWrong}`);

  // Move up after 2 consecutive correct answers
  if (consecutiveCorrect >= 2 && currentIndex < levelOrder.length - 1) {
    const newLevel = levelOrder[currentIndex + 1];
    console.log(`Moving UP: ${currentLevel} → ${newLevel} (${consecutiveCorrect} consecutive correct)`);
    return newLevel;
  }
  
  // Move down after 2 consecutive wrong answers
  if (consecutiveWrong >= 2 && currentIndex > 0) {
    const newLevel = levelOrder[currentIndex - 1];
    console.log(`Moving DOWN: ${currentLevel} → ${newLevel} (${consecutiveWrong} consecutive wrong)`);
    return newLevel;
  }

  console.log(`Staying at level: ${currentLevel}`);
  return currentLevel;
};

export const useAdaptiveScoring = () => {
  return {
    LEVEL_WEIGHTS,
    calculateWeightedScore,
    determineAdaptiveLevel,
    getNextDifficultyLevel
  };
};
