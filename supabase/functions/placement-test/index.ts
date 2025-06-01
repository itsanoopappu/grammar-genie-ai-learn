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
      
      // Create new assessment with adaptive support
      const { data: testData, error: testError } = await supabaseClient
        .from('placement_tests')
        .insert({
          user_id,
          assessment_type: isAdaptive ? 'adaptive' : 'comprehensive',
          total_questions: isAdaptive ? 15 : 15,
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
        // Use adaptive question selection starting at B1
        const { data: adaptiveQuestions, error: adaptiveError } = await supabaseClient
          .rpc('get_adaptive_questions_for_user', {
            p_user_id: user_id,
            p_current_level: 'B1',
            p_limit: 5,
            p_exclude_question_ids: []
          });

        if (adaptiveError) {
          console.error('Adaptive questions error:', adaptiveError);
          throw new Error('Failed to get adaptive questions');
        }

        selectedQuestions = adaptiveQuestions || [];
        console.log(`Selected ${selectedQuestions.length} adaptive questions starting at B1`);
      } else {
        // First, check what questions are actually available in the database
        const { data: allQuestions, error: allQuestionsError } = await supabaseClient
          .from('test_questions')
          .select('id, question, level, topic')
          .not('question', 'is', null)
          .not('level', 'is', null)

        if (allQuestionsError) {
          console.error('Error fetching all questions:', allQuestionsError);
          throw new Error('Failed to check available questions');
        }

        console.log(`Total questions in database: ${allQuestions?.length || 0}`);
        
        if (!allQuestions || allQuestions.length === 0) {
          throw new Error('No questions found in database. Please generate questions first.');
        }

        // Balanced selection logic for comprehensive test
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const questionsPerLevel = 2;
        const extraQuestions = 3;

        for (let i = 0; i < levels.length; i++) {
          const level = levels[i];
          const targetCount = questionsPerLevel + (i < extraQuestions ? 1 : 0);
          
          const { data: levelQuestions, error: questionsError } = await supabaseClient
            .from('test_questions')
            .select('*')
            .eq('level', level)
            .not('question', 'is', null)
            .not('correct_answer', 'is', null)
            .limit(targetCount * 2)

          if (questionsError) {
            console.error(`Questions fetch error for level ${level}:`, questionsError);
            continue;
          }

          if (!levelQuestions || levelQuestions.length === 0) {
            console.warn(`No questions available for level ${level}`);
            continue;
          }

          // Filter unseen questions
          if (user_id) {
            const { data: seenQuestions } = await supabaseClient
              .from('user_question_history')
              .select('question_id')
              .eq('user_id', user_id)
              .in('question_id', levelQuestions.map(q => q.id))

            const seenQuestionIds = new Set(seenQuestions?.map(sq => sq.question_id) || []);
            const unseenQuestions = levelQuestions.filter(q => !seenQuestionIds.has(q.id));
            
            const questionsToAdd = unseenQuestions.slice(0, targetCount);
            selectedQuestions = selectedQuestions.concat(questionsToAdd);
          } else {
            const questionsToAdd = levelQuestions.slice(0, targetCount);
            selectedQuestions = selectedQuestions.concat(questionsToAdd);
          }
        }

        // Fill remaining if needed
        if (selectedQuestions.length < 15) {
          const existingIds = selectedQuestions.map(q => q.id);
          const { data: additionalQuestions, error: additionalError } = await supabaseClient
            .from('test_questions')
            .select('*')
            .not('question', 'is', null)
            .not('correct_answer', 'is', null)
            .not('id', 'in', `(${existingIds.length > 0 ? existingIds.join(',') : 'null'})`)
            .limit(15 - selectedQuestions.length)

          if (!additionalError && additionalQuestions) {
            selectedQuestions = selectedQuestions.concat(additionalQuestions);
          }
        }

        // Shuffle for variety
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }

        selectedQuestions = selectedQuestions.slice(0, 15);
      }

      if (selectedQuestions.length === 0) {
        throw new Error('No suitable questions found. Please generate more questions.');
      }

      const finalLevelCounts = selectedQuestions.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {});
      console.log('Final assessment level distribution:', finalLevelCounts);

      return new Response(
        JSON.stringify({ 
          testId: testData.id,
          questions: selectedQuestions,
          estimatedTime: isAdaptive ? 15 : 20,
          levelDistribution: finalLevelCounts,
          assessmentType: assessment_type || 'comprehensive'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'submit_answer') {
      // Enhanced answer submission with weighted scoring
      const { data: questionData, error: questionError } = await supabaseClient
        .from('test_questions')
        .select('level, correct_answer')
        .eq('id', question_id)
        .single()

      let weightedPoints = 0;
      let isCorrect = false;

      if (!questionError && questionData) {
        isCorrect = user_answer?.toLowerCase().trim() === questionData.correct_answer?.toLowerCase().trim();
        const level = questionData.level || 'B1';
        const weights = LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS['B1'];
        weightedPoints = isCorrect ? weights.correct : weights.incorrect;
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
          message: 'Answer recorded',
          isCorrect,
          weightedPoints,
          level: questionData?.level
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'complete_assessment') {
      // Enhanced completion with weighted scoring
      const { data: testQuestions, error: testQuestionsError } = await supabaseClient
        .from('test_questions')
        .select('*')
        .in('id', Object.keys(answers))

      if (testQuestionsError || !testQuestions) {
        console.error('Error fetching test questions:', testQuestionsError);
        throw new Error('Failed to fetch test questions for scoring');
      }

      console.log(`Scoring ${testQuestions.length} questions with weighted system`);

      // Calculate weighted score
      let weightedScore = 0;
      let totalPossibleScore = 0;
      let levelBreakdown: Record<string, { correct: number; total: number; points: number }> = {};
      let detailedFeedback: any[] = [];
      
      testQuestions.forEach((q: any) => {
        const userAnswer = answers[q.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
        const level = q.level || 'B1';
        const weights = LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS['B1'];

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

        detailedFeedback.push({
          question: q.question,
          userAnswer,
          correctAnswer: q.correct_answer,
          isCorrect,
          explanation: q.explanation,
          level: q.level,
          pointsEarned: isCorrect ? weights.correct : weights.incorrect
        });
      });

      const percentage = Math.max(0, (weightedScore / totalPossibleScore) * 100);
      
      // Advanced level determination with weighted scoring
      let recommendedLevel = 'A1';
      let confidence = 0;

      // Check performance at each level with weighted criteria
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

      // Penalty for poor basic performance
      if (levelBreakdown['A1'] && levelBreakdown['A1'].total > 0) {
        const a1Accuracy = levelBreakdown['A1'].correct / levelBreakdown['A1'].total;
        if (a1Accuracy < 0.5) {
          recommendedLevel = 'A1';
          confidence = Math.max(20, confidence - 30);
        }
      }

      // Calculate XP with weighted bonus
      const baseXP = 150;
      const levelMultiplier = { 'A1': 1, 'A2': 1.2, 'B1': 1.5, 'B2': 1.8, 'C1': 2.2, 'C2': 2.5 };
      const multiplier = levelMultiplier[recommendedLevel] || 1;
      const totalXP = Math.round(baseXP * multiplier + (percentage / 100) * 100);

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

      console.log(`Assessment completed: ${Math.round(percentage)}% score, ${recommendedLevel} level, weighted score: ${Math.round(weightedScore)}/${Math.round(totalPossibleScore)}`);

      return new Response(
        JSON.stringify({
          score: percentage,
          weightedScore: Math.round(weightedScore),
          totalPossibleScore: Math.round(totalPossibleScore),
          recommendedLevel,
          confidence,
          levelBreakdown,
          xpEarned: totalXP,
          detailedFeedback: {
            message: `Assessment complete! Weighted score: ${Math.round(weightedScore)}/${Math.round(totalPossibleScore)} points (${Math.round(confidence)}% confidence)`,
            nextSteps: [
              `Your level: ${recommendedLevel} (${Math.round(confidence)}% confidence)`,
              `Weighted scoring applied: easier mistakes penalized more heavily`,
              `A1 errors cost -2.5 points, while C2 correct answers earn +8 points`
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
