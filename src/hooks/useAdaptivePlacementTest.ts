import { atom, useAtom } from 'jotai';
import { produce } from 'immer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { calculateWeightedScore, determineAdaptiveLevel, getNextDifficultyLevel } from './useAdaptiveScoring';

interface AdaptiveTestState {
  testId: string | null;
  testStarted: boolean;
  currentQuestionIndex: number;
  selectedAnswer: string;
  questions: any[];
  userAnswers: Record<string, string>;
  testCompleted: boolean;
  testResults: any | null;
  loading: boolean;
  error: string | null;
  startTime: Date | null;
  currentDifficultyLevel: string;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  adaptiveProgression: string[];
  weightedScore: number;
  questionsAsked: number;
  maxQuestions: number;
  usedGrammarTopics: string[];
  grammarPerformance: Record<string, { correct: number; total: number; accuracy: number }>;
}

const initialState: AdaptiveTestState = {
  testId: null,
  testStarted: false,
  currentQuestionIndex: 0,
  selectedAnswer: '',
  questions: [],
  userAnswers: {},
  testCompleted: false,
  testResults: null,
  loading: false,
  error: null,
  startTime: null,
  currentDifficultyLevel: 'B1',
  consecutiveCorrect: 0,
  consecutiveWrong: 0,
  adaptiveProgression: [],
  weightedScore: 0,
  questionsAsked: 0,
  maxQuestions: 15,
  usedGrammarTopics: [],
  grammarPerformance: {}
};

const adaptiveTestStateAtom = atom<AdaptiveTestState>(initialState);

export const useAdaptivePlacementTest = () => {
  const [state, setState] = useAtom(adaptiveTestStateAtom);
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const startAdaptiveTest = async () => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
    }));

    try {
      // Create new adaptive assessment
      const { data: testData, error: testError } = await supabase
        .from('placement_tests')
        .insert({
          user_id: user?.id,
          assessment_type: 'adaptive',
          total_questions: 15,
          immediate_feedback: false,
          current_difficulty_level: 'B1',
          weighted_score: 0,
          adaptive_difficulty_progression: ['B1'],
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (testError) throw testError;

      // Load exactly 15 questions with unique grammar topics
      const allQuestions = await loadAdaptiveQuestionPool(testData.id);
      
      if (allQuestions.length < 15) {
        throw new Error(`Insufficient questions available. Found ${allQuestions.length}, need 15.`);
      }

      setState(produce(state => {
        state.testId = testData.id;
        state.questions = allQuestions;
        state.testStarted = true;
        state.currentQuestionIndex = 0;
        state.userAnswers = {};
        state.testCompleted = false;
        state.startTime = new Date();
        state.currentDifficultyLevel = 'B1';
        state.adaptiveProgression = ['B1'];
        state.questionsAsked = 0;
        state.usedGrammarTopics = allQuestions.map(q => q.grammar_topic).filter(Boolean);
        state.grammarPerformance = {};
        state.loading = false;
      }));
    } catch (error: any) {
      console.error('Failed to start adaptive assessment:', error);
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to start adaptive assessment';
      }));
    }
  };

  const loadAdaptiveQuestionPool = async (testId: string) => {
    console.log('🔍 Starting adaptive question pool loading...');
    
    // First, let's check what questions exist in the database
    const { data: allQuestionsRaw, error: questionsError } = await supabase
      .from('test_questions')
      .select('*');

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      throw questionsError;
    }

    if (!allQuestionsRaw || allQuestionsRaw.length === 0) {
      console.error('❌ No questions found in database at all');
      throw new Error('No questions available in database');
    }

    console.log(`📊 Total questions in database: ${allQuestionsRaw.length}`);

    // Analyze what data we have
    const questionsWithBasicData = allQuestionsRaw.filter(q => 
      q.question && q.correct_answer && q.options
    );
    console.log(`📝 Questions with basic data (question, answer, options): ${questionsWithBasicData.length}`);

    const questionsWithGrammarTopic = questionsWithBasicData.filter(q => q.grammar_topic);
    console.log(`🎯 Questions with grammar_topic: ${questionsWithGrammarTopic.length}`);

    const questionsWithGrammarCategory = questionsWithBasicData.filter(q => q.grammar_category);
    console.log(`📂 Questions with grammar_category: ${questionsWithGrammarCategory.length}`);

    const questionsWithCompleteGrammar = questionsWithBasicData.filter(q => 
      q.grammar_topic && q.grammar_category
    );
    console.log(`✅ Questions with complete grammar metadata: ${questionsWithCompleteGrammar.length}`);

    // Use the most restrictive set that still gives us enough questions
    let workingQuestions = questionsWithCompleteGrammar;
    
    if (workingQuestions.length < 15) {
      console.warn('⚠️ Not enough questions with complete grammar metadata, falling back to questions with grammar_topic only');
      workingQuestions = questionsWithGrammarTopic;
      
      if (workingQuestions.length < 15) {
        console.warn('⚠️ Not enough questions with grammar_topic, falling back to all questions with basic data');
        workingQuestions = questionsWithBasicData;
        
        if (workingQuestions.length < 15) {
          throw new Error(`Insufficient questions in database. Found ${workingQuestions.length} usable questions, need at least 15.`);
        }
      }
    }

    console.log(`🎲 Working with ${workingQuestions.length} questions`);

    // Filter out recently seen questions (last 30 days)
    let questionPool = workingQuestions;
    if (user) {
      const { data: seenQuestions } = await supabase
        .from('user_question_history')
        .select('question_id')
        .eq('user_id', user.id)
        .gte('seen_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const seenQuestionIds = new Set(seenQuestions?.map(sq => sq.question_id) || []);
      questionPool = workingQuestions.filter(q => !seenQuestionIds.has(q.id));
      console.log(`📋 After filtering seen questions: ${questionPool.length} (${seenQuestionIds.size} seen in last 30 days)`);
    }

    // Group by unique identifiers (prefer grammar_topic, fallback to question text)
    const uniqueTopicMap = new Map<string, any[]>();
    questionPool.forEach(question => {
      const uniqueKey = question.grammar_topic || `question_${question.id}`;
      if (!uniqueTopicMap.has(uniqueKey)) {
        uniqueTopicMap.set(uniqueKey, []);
      }
      uniqueTopicMap.get(uniqueKey)!.push(question);
    });

    const availableTopics = Array.from(uniqueTopicMap.keys());
    console.log(`🎯 Found ${availableTopics.length} unique topics/questions`);

    if (availableTopics.length < 15) {
      throw new Error(`Insufficient unique topics/questions. Found ${availableTopics.length}, need 15.`);
    }

    // Select 15 unique questions
    const selectedQuestions: any[] = [];
    const usedTopics = new Set<string>();
    
    // Shuffle topics for randomization
    const shuffledTopics = [...availableTopics].sort(() => Math.random() - 0.5);
    
    // For each topic, select the best question
    for (const topic of shuffledTopics) {
      if (selectedQuestions.length >= 15) break;
      
      const topicQuestions = uniqueTopicMap.get(topic)!;
      
      // Sort questions by level preference: B1 first, then adjacent levels
      const sortedQuestions = topicQuestions.sort((a, b) => {
        const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const aIndex = levelOrder.indexOf(a.level || 'B1');
        const bIndex = levelOrder.indexOf(b.level || 'B1');
        
        // Prefer B1 first
        if ((a.level || 'B1') === 'B1' && (b.level || 'B1') !== 'B1') return -1;
        if ((b.level || 'B1') === 'B1' && (a.level || 'B1') !== 'B1') return 1;
        
        // Then prefer adjacent levels to B1 (A2, B2)
        const b1Index = levelOrder.indexOf('B1');
        const aDistance = Math.abs(aIndex - b1Index);
        const bDistance = Math.abs(bIndex - b1Index);
        
        if (aDistance !== bDistance) return aDistance - bDistance;
        
        // Finally, random selection within same priority
        return Math.random() - 0.5;
      });
      
      // Select the best question for this topic
      const selectedQuestion = sortedQuestions[0];
      selectedQuestions.push(selectedQuestion);
      usedTopics.add(topic);
      
      console.log(`✅ Selected topic/question "${topic}" with level ${selectedQuestion.level || 'unknown'}`);
      
      // Track grammar usage for this test (only if we have the data)
      if (selectedQuestion.grammar_topic && selectedQuestion.grammar_category) {
        await supabase
          .from('test_grammar_usage')
          .insert({
            test_id: testId,
            grammar_topic: selectedQuestion.grammar_topic,
            grammar_category: selectedQuestion.grammar_category
          });
      }
    }

    // Final shuffle of selected questions for random order
    const finalQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

    // Log final distribution
    const levelDistribution = finalQuestions.reduce((acc: any, q: any) => {
      const level = q.level || 'unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    
    console.log('🎉 Final selection completed:');
    console.log(`📊 Level distribution:`, levelDistribution);
    console.log(`🔤 Unique topics selected: ${usedTopics.size}`);
    console.log(`📝 Total questions: ${finalQuestions.length}`);
    
    return finalQuestions.slice(0, 15); // Ensure exactly 15 questions
  };

  const submitAdaptiveAnswer = async () => {
    if (!state.selectedAnswer || !state.questions[state.currentQuestionIndex]) return;

    setState(produce(state => { 
      state.loading = true;
    }));

    try {
      const currentQuestion = state.questions[state.currentQuestionIndex];
      const isCorrect = state.selectedAnswer.toLowerCase().trim() === 
                       currentQuestion.correct_answer.toLowerCase().trim();

      // Calculate weighted points for this answer
      const level = currentQuestion.level;
      const weights = {
        'A1': { correct: 1, incorrect: -2.5 },
        'A2': { correct: 2, incorrect: -2.0 },
        'B1': { correct: 3, incorrect: -1.5 },
        'B2': { correct: 4, incorrect: -1.0 },
        'C1': { correct: 6, incorrect: 0.5 },
        'C2': { correct: 8, incorrect: 0.5 }
      };
      const levelWeights = weights[level as keyof typeof weights] || weights['B1'];
      const pointsEarned = isCorrect ? levelWeights.correct : levelWeights.incorrect;

      // Update grammar performance tracking with complete metadata (if available)
      if (currentQuestion.grammar_category && currentQuestion.grammar_topic) {
        await supabase.rpc('update_user_grammar_performance', {
          p_user_id: user?.id,
          p_grammar_category: currentQuestion.grammar_category,
          p_grammar_topic: currentQuestion.grammar_topic,
          p_level: currentQuestion.level,
          p_is_correct: isCorrect
        });
      }

      // Record answer with enhanced tracking
      const { error: historyError } = await supabase
        .from('user_question_history')
        .upsert({
          user_id: user?.id,
          question_id: currentQuestion.id,
          test_id: state.testId,
          user_answer: state.selectedAnswer,
          is_correct: isCorrect,
          weighted_points: pointsEarned,
          answered_at: new Date().toISOString(),
          seen_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,question_id'
        });

      if (historyError) {
        console.error('Question history error:', historyError);
      }

      // Update state with answer and adaptive logic
      setState(produce(state => {
        state.userAnswers[currentQuestion.id] = state.selectedAnswer;
        state.weightedScore += pointsEarned;
        state.questionsAsked += 1;
        
        // Update grammar performance tracking in state (if available)
        const grammarCategory = currentQuestion.grammar_category || 'general';
        if (!state.grammarPerformance[grammarCategory]) {
          state.grammarPerformance[grammarCategory] = { correct: 0, total: 0, accuracy: 0 };
        }
        state.grammarPerformance[grammarCategory].total += 1;
        if (isCorrect) {
          state.grammarPerformance[grammarCategory].correct += 1;
        }
        state.grammarPerformance[grammarCategory].accuracy = 
          state.grammarPerformance[grammarCategory].correct / state.grammarPerformance[grammarCategory].total;
        
        // Update consecutive counters for adaptive difficulty
        if (isCorrect) {
          state.consecutiveCorrect += 1;
          state.consecutiveWrong = 0;
        } else {
          state.consecutiveWrong += 1;
          state.consecutiveCorrect = 0;
        }

        // Determine next difficulty level for adaptive flow
        const nextLevel = getNextDifficultyLevel(
          state.currentDifficultyLevel,
          isCorrect,
          state.consecutiveCorrect,
          state.consecutiveWrong
        );

        if (nextLevel !== state.currentDifficultyLevel) {
          state.currentDifficultyLevel = nextLevel;
          state.adaptiveProgression.push(nextLevel);
        }

        state.loading = false;
        state.selectedAnswer = '';
      }));

    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to submit answer';
      }));
    }
  };

  const loadNextAdaptiveQuestion = async () => {
    // Check if we've completed all 15 questions
    if (state.currentQuestionIndex >= 14 || state.questionsAsked >= 15) {
      await completeAdaptiveTest();
      return;
    }

    setState(produce(state => {
      state.currentQuestionIndex += 1;
    }));
  };

  const completeAdaptiveTest = async () => {
    setState(produce(state => { 
      state.loading = true;
      state.error = null;
    }));

    try {
      // Calculate final weighted score and level
      const answeredQuestions = state.questions.slice(0, Math.min(state.currentQuestionIndex + 1, 15));
      const { weightedScore, levelBreakdown, totalPossibleScore } = calculateWeightedScore(
        state.userAnswers, 
        answeredQuestions
      );

      const { level: recommendedLevel, confidence } = determineAdaptiveLevel(
        weightedScore, 
        totalPossibleScore, 
        levelBreakdown
      );

      const percentageScore = Math.max(0, (weightedScore / totalPossibleScore) * 100);

      // Save assessment grammar insights for all grammar categories (if available)
      for (const [category, performance] of Object.entries(state.grammarPerformance)) {
        await supabase
          .from('assessment_grammar_insights')
          .insert({
            user_id: user?.id,
            test_id: state.testId,
            grammar_category: category,
            grammar_topic: category,
            level: recommendedLevel,
            question_count: performance.total,
            correct_count: performance.correct,
            mistake_patterns: performance.accuracy < 0.5 ? [`Low accuracy in ${category}`] : [],
            improvement_areas: performance.accuracy < 0.7 ? [`Practice more ${category} exercises`] : []
          });
      }

      // Calculate XP with weighted bonus
      const baseXP = 150;
      const levelMultiplier = {
        'A1': 1, 'A2': 1.2, 'B1': 1.5, 'B2': 1.8, 'C1': 2.2, 'C2': 2.5
      };
      const multiplier = levelMultiplier[recommendedLevel as keyof typeof levelMultiplier] || 1;
      const grammarVarietyBonus = Math.min(50, state.usedGrammarTopics.length * 3);
      const totalXP = Math.round(baseXP * multiplier + (percentageScore / 100) * 100 + grammarVarietyBonus);

      // Update test completion
      const { error: updateError } = await supabase
        .from('placement_tests')
        .update({
          score: percentageScore,
          level: recommendedLevel,
          weighted_score: weightedScore,
          confidence_score: confidence,
          adaptive_difficulty_progression: state.adaptiveProgression,
          completed_at: new Date().toISOString()
        })
        .eq('id', state.testId);

      if (updateError) {
        console.error('Test update error:', updateError);
      }

      // Create detailed results with complete grammar breakdown
      const testResults = {
        score: percentageScore,
        weightedScore,
        recommendedLevel,
        confidence,
        totalQuestions: 15,
        questionsAnswered: Math.min(state.questionsAsked, 15),
        adaptiveProgression: state.adaptiveProgression,
        levelBreakdown,
        grammarBreakdown: state.grammarPerformance,
        grammarTopicsUsed: state.usedGrammarTopics.length,
        xpEarned: totalXP,
        detailedFeedback: {
          message: `Adaptive assessment complete! Answered ${Math.min(state.questionsAsked, 15)}/15 questions with ${state.usedGrammarTopics.length} unique grammar topics. Weighted score: ${Math.round(weightedScore)}/${Math.round(totalPossibleScore)} points (${Math.round(confidence)}% confidence)`,
          nextSteps: [
            `Your adaptive level: ${recommendedLevel} (${Math.round(confidence)}% confidence)`,
            `Questions adapted through levels: ${state.adaptiveProgression.join(' → ')}`,
            `Grammar variety achieved: ${state.usedGrammarTopics.length} unique topics covered`,
            `Weighted scoring applied: easier mistakes penalized more heavily`,
            `Grammar performance tracked across ${Object.keys(state.grammarPerformance).length} categories`
          ]
        }
      };

      setState(produce(state => {
        state.testResults = testResults;
        state.testCompleted = true;
        state.loading = false;
      }));

      // Update user profile
      if (profile && recommendedLevel) {
        const shouldUpdateLevel = shouldUpgradeLevel(profile.level, recommendedLevel);
        const updates: any = {
          xp: (profile.xp || 0) + totalXP
        };
        
        if (shouldUpdateLevel) {
          updates.level = recommendedLevel;
        }
        
        await updateProfile(updates);
      }

    } catch (error: any) {
      setState(produce(state => { 
        state.loading = false;
        state.error = error.message || 'Failed to complete adaptive assessment';
      }));
    }
  };

  const resetAdaptiveTest = () => {
    setState(initialState);
  };

  const setSelectedAnswer = (answer: string) => {
    setState(produce(state => { state.selectedAnswer = answer }));
  };

  return {
    state,
    startAdaptiveTest,
    submitAdaptiveAnswer,
    loadNextAdaptiveQuestion,
    resetAdaptiveTest,
    setSelectedAnswer
  };
};

function shouldUpgradeLevel(currentLevel: string | null, newLevel: string): boolean {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(currentLevel || 'A1');
  const newIndex = levelOrder.indexOf(newLevel);
  return newIndex > currentIndex;
}
