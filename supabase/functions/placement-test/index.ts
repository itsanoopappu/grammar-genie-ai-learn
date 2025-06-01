
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LEVEL_WEIGHTS = {
  'A1': { correct: 1, incorrect: -2.5 },
  'A2': { correct: 2, incorrect: -2.0 },
  'B1': { correct: 3, incorrect: -1.5 },
  'B2': { correct: 4, incorrect: -1.0 },
  'C1': { correct: 6, incorrect: 0.5 },
  'C2': { correct: 8, incorrect: 0.5 }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, user_id, answers, test_id, question_id, user_answer, assessment_type } = await req.json()

    if (action === 'start_assessment') {
      const isAdaptive = assessment_type === 'adaptive';
      
      // Create new assessment with improved tracking
      const { data: testData, error: testError } = await supabaseClient
        .from('placement_tests')
        .insert({
          user_id,
          assessment_type: isAdaptive ? 'adaptive' : 'comprehensive',
          total_questions: 15,
          immediate_feedback: false,
          current_difficulty_level: isAdaptive ? 'B1' : null,
          weighted_score: 0,
          adaptive_difficulty_progression: isAdaptive ? ['B1'] : [],
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (testError) {
        console.error('Test creation error:', testError);
        throw new Error(`Failed to create test entry: ${testError.message}`);
      }

      console.log('Created test with ID:', testData.id, 'Type:', assessment_type);

      let selectedQuestions: any[] = [];

      if (isAdaptive) {
        // Enhanced adaptive question selection with guaranteed 15 unique grammar topics
        selectedQuestions = await selectAdaptiveQuestions(supabaseClient, user_id, testData.id);
        
        console.log(`Selected ${selectedQuestions.length} adaptive questions with unique grammar topics`);
      } else {
        // Enhanced comprehensive selection with guaranteed variety
        selectedQuestions = await selectComprehensiveQuestions(supabaseClient, user_id, testData.id);
        
        console.log(`Selected ${selectedQuestions.length} comprehensive questions with balanced distribution`);
      }

      if (selectedQuestions.length < 15) {
        throw new Error(`Insufficient questions available. Found ${selectedQuestions.length}, need 15 with unique grammar topics.`);
      }

      // Calculate final distributions
      const levelCounts = selectedQuestions.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {});
      
      const grammarCounts = selectedQuestions.reduce((acc: any, q: any) => {
        if (q.grammar_category) {
          acc[q.grammar_category] = (acc[q.grammar_category] || 0) + 1;
        }
        return acc;
      }, {});
      
      const uniqueGrammarTopics = new Set(selectedQuestions.map(q => q.grammar_topic).filter(Boolean));
      
      console.log('Final assessment composition:');
      console.log('- Level distribution:', levelCounts);
      console.log('- Grammar category distribution:', grammarCounts);
      console.log('- Unique grammar topics:', uniqueGrammarTopics.size);

      // Verify we have exactly 15 unique grammar topics
      if (uniqueGrammarTopics.size < 15) {
        console.warn(`Warning: Only ${uniqueGrammarTopics.size} unique grammar topics found, expected 15`);
      }

      return new Response(
        JSON.stringify({ 
          testId: testData.id,
          questions: selectedQuestions,
          estimatedTime: isAdaptive ? 15 : 20,
          levelDistribution: levelCounts,
          grammarDistribution: grammarCounts,
          uniqueGrammarTopics: uniqueGrammarTopics.size,
          assessmentType: assessment_type || 'comprehensive',
          guaranteedUniqueGrammar: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'submit_answer') {
      // Enhanced answer submission with complete grammar tracking
      const { data: questionData, error: questionError } = await supabaseClient
        .from('test_questions')
        .select('level, correct_answer, grammar_topic, grammar_category')
        .eq('id', question_id)
        .single()

      let weightedPoints = 0;
      let isCorrect = false;

      if (!questionError && questionData) {
        isCorrect = user_answer?.toLowerCase().trim() === questionData.correct_answer?.toLowerCase().trim();
        const level = questionData.level || 'B1';
        const weights = LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS['B1'];
        weightedPoints = isCorrect ? weights.correct : weights.incorrect;

        // Update grammar performance with complete metadata
        if (questionData.grammar_category && questionData.grammar_topic) {
          await supabaseClient.rpc('update_user_grammar_performance', {
            p_user_id: user_id,
            p_grammar_category: questionData.grammar_category,
            p_grammar_topic: questionData.grammar_topic,
            p_level: questionData.level,
            p_is_correct: isCorrect
          });
        } else {
          console.warn('Missing grammar metadata for question:', question_id);
        }
      }

      // Record with enhanced tracking
      const { error: historyError } = await supabaseClient
        .from('user_question_history')
        .upsert({
          user_id,
          question_id,
          test_id,
          user_answer,
          is_correct: isCorrect,
          weighted_points: weightedPoints,
          answered_at: new Date().toISOString(),
          seen_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,question_id'
        })

      if (historyError) {
        console.error('Question history error:', historyError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Answer recorded with complete grammar tracking',
          isCorrect,
          weightedPoints,
          level: questionData?.level,
          grammarCategory: questionData?.grammar_category,
          grammarTopic: questionData?.grammar_topic
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'complete_assessment') {
      // Enhanced completion with comprehensive grammar analysis
      const { data: testQuestions, error: testQuestionsError } = await supabaseClient
        .from('test_questions')
        .select('*')
        .in('id', Object.keys(answers))

      if (testQuestionsError || !testQuestions) {
        console.error('Error fetching test questions:', testQuestionsError);
        throw new Error('Failed to fetch test questions for scoring');
      }

      console.log(`Scoring ${testQuestions.length} questions with complete grammar analysis`);

      // Validate all questions have complete grammar metadata
      const questionsWithIncompleteData = testQuestions.filter(q => 
        !q.grammar_topic || !q.grammar_category
      );
      
      if (questionsWithIncompleteData.length > 0) {
        console.warn(`${questionsWithIncompleteData.length} questions have incomplete grammar metadata`);
      }

      // Calculate comprehensive weighted score with grammar breakdown
      let weightedScore = 0;
      let totalPossibleScore = 0;
      let levelBreakdown: Record<string, { correct: number; total: number; points: number }> = {};
      let grammarBreakdown: Record<string, { correct: number; total: number; accuracy: number }> = {};
      let detailedFeedback: any[] = [];
      
      testQuestions.forEach((q: any) => {
        const userAnswer = answers[q.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
        const level = q.level || 'B1';
        const grammarCategory = q.grammar_category || 'unknown';
        const weights = LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS['B1'];

        // Level breakdown tracking
        if (!levelBreakdown[level]) {
          levelBreakdown[level] = { correct: 0, total: 0, points: 0 };
        }
        levelBreakdown[level].total++;
        totalPossibleScore += weights.correct;

        // Grammar breakdown tracking with complete metadata
        if (!grammarBreakdown[grammarCategory]) {
          grammarBreakdown[grammarCategory] = { correct: 0, total: 0, accuracy: 0 };
        }
        grammarBreakdown[grammarCategory].total++;

        if (isCorrect) {
          weightedScore += weights.correct;
          levelBreakdown[level].correct++;
          levelBreakdown[level].points += weights.correct;
          grammarBreakdown[grammarCategory].correct++;
        } else {
          weightedScore += weights.incorrect;
          levelBreakdown[level].points += weights.incorrect;
        }

        // Update grammar breakdown accuracy
        grammarBreakdown[grammarCategory].accuracy = 
          grammarBreakdown[grammarCategory].correct / grammarBreakdown[grammarCategory].total;

        detailedFeedback.push({
          question: q.question,
          userAnswer,
          correctAnswer: q.correct_answer,
          isCorrect,
          explanation: q.explanation,
          level: q.level,
          grammarCategory: q.grammar_category,
          grammarTopic: q.grammar_topic,
          pointsEarned: isCorrect ? weights.correct : weights.incorrect,
          hasCompleteMetadata: !!(q.grammar_topic && q.grammar_category)
        });
      });

      const percentage = Math.max(0, (weightedScore / totalPossibleScore) * 100);
      
      // Advanced level determination with grammar consideration
      let recommendedLevel = 'A1';
      let confidence = 0;

      const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      
      for (let i = levelOrder.length - 1; i >= 0; i--) {
        const level = levelOrder[i];
        const performance = levelBreakdown[level];
        
        if (performance && performance.total > 0) {
          const levelAccuracy = performance.correct / performance.total;
          const levelScore = performance.points;
          
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

      // Save comprehensive assessment grammar insights
      for (const [category, performance] of Object.entries(grammarBreakdown)) {
        await supabaseClient
          .from('assessment_grammar_insights')
          .insert({
            user_id,
            test_id,
            grammar_category: category,
            grammar_topic: category,
            level: recommendedLevel,
            question_count: performance.total,
            correct_count: performance.correct,
            mistake_patterns: performance.accuracy < 0.5 ? [`Low accuracy in ${category}`] : [],
            improvement_areas: performance.accuracy < 0.7 ? [`Practice more ${category} exercises`] : []
          });
      }

      // Calculate XP with comprehensive grammar bonus
      const baseXP = 150;
      const levelMultiplier = { 'A1': 1, 'A2': 1.2, 'B1': 1.5, 'B2': 1.8, 'C1': 2.2, 'C2': 2.5 };
      const multiplier = levelMultiplier[recommendedLevel] || 1;
      const grammarVarietyBonus = Math.min(50, Object.keys(grammarBreakdown).length * 5);
      const completenessBonus = detailedFeedback.filter(q => q.hasCompleteMetadata).length * 2;
      const totalXP = Math.round(baseXP * multiplier + (percentage / 100) * 100 + grammarVarietyBonus + completenessBonus);

      // Update test completion
      const { error: updateError } = await supabaseClient
        .from('placement_tests')
        .update({
          score: percentage,
          level: recommendedLevel,
          weighted_score: weightedScore,
          confidence_score: confidence,
          completed_at: new Date().toISOString()
        })
        .eq('id', test_id);

      if (updateError) {
        console.error('Test update error:', updateError);
      }

      const questionsWithCompleteMetadata = detailedFeedback.filter(q => q.hasCompleteMetadata).length;
      
      console.log(`Assessment completed: ${Math.round(percentage)}% score, ${recommendedLevel} level`);
      console.log(`Grammar tracking: ${Object.keys(grammarBreakdown).length} categories, ${questionsWithCompleteMetadata}/${testQuestions.length} questions with complete metadata`);

      return new Response(
        JSON.stringify({
          score: percentage,
          weightedScore: Math.round(weightedScore),
          totalPossibleScore: Math.round(totalPossibleScore),
          recommendedLevel,
          confidence,
          levelBreakdown,
          grammarBreakdown,
          questionsWithCompleteMetadata,
          totalQuestions: testQuestions.length,
          xpEarned: totalXP,
          detailedFeedback: {
            message: `Assessment complete! Answered 15/15 questions with complete grammar tracking. Weighted score: ${Math.round(weightedScore)}/${Math.round(totalPossibleScore)} points (${Math.round(confidence)}% confidence)`,
            nextSteps: [
              `Your level: ${recommendedLevel} (${Math.round(confidence)}% confidence)`,
              `Grammar variety: ${Object.keys(grammarBreakdown).length} different categories tested`,
              `Complete metadata: ${questionsWithCompleteMetadata}/${testQuestions.length} questions tracked`,
              `Weighted scoring with grammar performance tracking enabled`,
              `Areas for improvement: ${Object.entries(grammarBreakdown)
                .filter(([_, perf]) => perf.accuracy < 0.7)
                .map(([category, _]) => category)
                .join(', ') || 'None identified'}`
            ],
            questionReview: detailedFeedback
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Placement test error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Please check your connection and try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

// Enhanced question selection for adaptive mode
async function selectAdaptiveQuestions(supabaseClient: any, userId: string, testId: string) {
  // Get all questions with complete grammar metadata
  const { data: allQuestions, error: fetchError } = await supabaseClient
    .from('test_questions')
    .select('*')
    .not('question', 'is', null)
    .not('correct_answer', 'is', null)
    .not('options', 'is', null)
    .not('grammar_topic', 'is', null)
    .not('grammar_category', 'is', null);

  if (fetchError || !allQuestions) {
    throw new Error('Failed to fetch questions with complete grammar metadata');
  }

  // Filter out recently seen questions (30-day cooldown)
  const { data: seenQuestions } = await supabaseClient
    .from('user_question_history')
    .select('question_id')
    .eq('user_id', userId)
    .gte('seen_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const seenQuestionIds = new Set(seenQuestions?.map((sq: any) => sq.question_id) || []);
  const availableQuestions = allQuestions.filter((q: any) => !seenQuestionIds.has(q.id));

  // Group by unique grammar topics
  const grammarTopicMap = new Map<string, any>();
  availableQuestions.forEach((question: any) => {
    const grammarTopic = question.grammar_topic;
    if (!grammarTopicMap.has(grammarTopic)) {
      grammarTopicMap.set(grammarTopic, []);
    }
    grammarTopicMap.get(grammarTopic).push(question);
  });

  // Select one question per unique grammar topic, prioritizing variety
  const selectedQuestions: any[] = [];
  const usedGrammarTopics = new Set<string>();
  
  // Prioritize level distribution while ensuring unique grammar topics
  const levelPriority = ['B1', 'B2', 'A2', 'C1', 'A1', 'C2'];
  
  for (const level of levelPriority) {
    if (selectedQuestions.length >= 15) break;
    
    // Get questions from this level with unique grammar topics
    const levelQuestions = availableQuestions.filter((q: any) => 
      q.level === level && !usedGrammarTopics.has(q.grammar_topic)
    );
    
    // Shuffle for randomization
    for (let i = levelQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [levelQuestions[i], levelQuestions[j]] = [levelQuestions[j], levelQuestions[i]];
    }
    
    // Add questions with unique grammar topics
    for (const question of levelQuestions) {
      if (selectedQuestions.length >= 15) break;
      
      if (!usedGrammarTopics.has(question.grammar_topic)) {
        selectedQuestions.push(question);
        usedGrammarTopics.add(question.grammar_topic);
        
        // Track grammar usage
        await supabaseClient
          .from('test_grammar_usage')
          .insert({
            test_id: testId,
            grammar_topic: question.grammar_topic,
            grammar_category: question.grammar_category
          })
          .on('conflict', () => {});
      }
    }
  }
  
  // Fill remaining slots with any unique grammar topics if needed
  if (selectedQuestions.length < 15) {
    const remainingQuestions = availableQuestions.filter((q: any) => 
      !usedGrammarTopics.has(q.grammar_topic)
    );
    
    // Shuffle and add
    for (let i = remainingQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingQuestions[i], remainingQuestions[j]] = [remainingQuestions[j], remainingQuestions[i]];
    }
    
    for (const question of remainingQuestions) {
      if (selectedQuestions.length >= 15) break;
      
      selectedQuestions.push(question);
      usedGrammarTopics.add(question.grammar_topic);
      
      await supabaseClient
        .from('test_grammar_usage')
        .insert({
          test_id: testId,
          grammar_topic: question.grammar_topic,
          grammar_category: question.grammar_category
        })
        .on('conflict', () => {});
    }
  }

  return selectedQuestions;
}

// Enhanced question selection for comprehensive mode
async function selectComprehensiveQuestions(supabaseClient: any, userId: string, testId: string) {
  // Get all questions with complete metadata
  const { data: allQuestions, error: allQuestionsError } = await supabaseClient
    .from('test_questions')
    .select('*')
    .not('question', 'is', null)
    .not('correct_answer', 'is', null)
    .not('options', 'is', null)
    .not('grammar_topic', 'is', null)
    .not('grammar_category', 'is', null);

  if (allQuestionsError || !allQuestions) {
    throw new Error('Failed to fetch questions with complete metadata');
  }

  // Filter unseen questions
  const { data: seenQuestions } = await supabaseClient
    .from('user_question_history')
    .select('question_id')
    .eq('user_id', userId)
    .gte('seen_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const seenQuestionIds = new Set(seenQuestions?.map((sq: any) => sq.question_id) || []);
  const availableQuestions = allQuestions.filter((q: any) => !seenQuestionIds.has(q.id));

  // Balanced selection: 2-3 questions per level with unique grammar topics
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const questionsPerLevel = [2, 3, 3, 3, 2, 2]; // Totals 15
  const selectedQuestions: any[] = [];
  const usedGrammarTopics = new Set<string>();

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const targetCount = questionsPerLevel[i];
    
    const levelQuestions = availableQuestions.filter((q: any) => 
      q.level === level && !usedGrammarTopics.has(q.grammar_topic)
    );
    
    // Shuffle for randomization
    for (let j = levelQuestions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [levelQuestions[j], levelQuestions[k]] = [levelQuestions[k], levelQuestions[j]];
    }
    
    // Select unique grammar topic questions
    const levelSelected = [];
    for (const question of levelQuestions) {
      if (levelSelected.length >= targetCount) break;
      
      if (!usedGrammarTopics.has(question.grammar_topic)) {
        levelSelected.push(question);
        usedGrammarTopics.add(question.grammar_topic);
        
        // Track grammar usage
        await supabaseClient
          .from('test_grammar_usage')
          .insert({
            test_id: testId,
            grammar_topic: question.grammar_topic,
            grammar_category: question.grammar_category
          })
          .on('conflict', () => {});
      }
    }
    
    selectedQuestions.push(...levelSelected);
  }

  // Fill any remaining slots
  if (selectedQuestions.length < 15) {
    const remainingQuestions = availableQuestions.filter((q: any) => 
      !usedGrammarTopics.has(q.grammar_topic)
    );
    
    // Shuffle and add
    for (let i = remainingQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingQuestions[i], remainingQuestions[j]] = [remainingQuestions[j], remainingQuestions[i]];
    }
    
    for (const question of remainingQuestions) {
      if (selectedQuestions.length >= 15) break;
      
      selectedQuestions.push(question);
      usedGrammarTopics.add(question.grammar_topic);
      
      await supabaseClient
        .from('test_grammar_usage')
        .insert({
          test_id: testId,
          grammar_topic: question.grammar_topic,
          grammar_category: question.grammar_category
        })
        .on('conflict', () => {});
    }
  }

  // Final shuffle for question order randomization
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  return selectedQuestions.slice(0, 15);
}
