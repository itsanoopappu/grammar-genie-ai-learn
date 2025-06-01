
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, user_id, answers, test_id, question_id, user_answer } = await req.json()

    if (action === 'start_assessment') {
      // Create new comprehensive assessment
      const { data: testData, error: testError } = await supabaseClient
        .from('placement_tests')
        .insert({
          user_id,
          assessment_type: 'comprehensive',
          total_questions: 15,
          immediate_feedback: false,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (testError) {
        console.error('Test creation error:', testError);
        throw new Error(`Failed to create test entry: ${testError.message}`);
      }

      console.log('Created test with ID:', testData.id);

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
      
      // Log level distribution
      const levelCounts = allQuestions?.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {}) || {};
      console.log('Available questions by level:', levelCounts);

      if (!allQuestions || allQuestions.length === 0) {
        throw new Error('No questions found in database. Please generate questions first.');
      }

      // Get balanced questions across all available levels
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const questionsPerLevel = 2; // 2-3 questions per level for 15 total
      const extraQuestions = 3; // 15 - (6 * 2)
      let selectedQuestions: any[] = [];

      console.log('Attempting to get balanced questions...');

      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const targetCount = questionsPerLevel + (i < extraQuestions ? 1 : 0);
        
        console.log(`Trying to get ${targetCount} questions for level ${level}`);

        // Simplified query - just get questions for this level
        const { data: levelQuestions, error: questionsError } = await supabaseClient
          .from('test_questions')
          .select('*')
          .eq('level', level)
          .not('question', 'is', null)
          .not('correct_answer', 'is', null)
          .limit(targetCount * 2) // Get more than needed for variety

        if (questionsError) {
          console.error(`Questions fetch error for level ${level}:`, questionsError);
          continue;
        }

        if (!levelQuestions || levelQuestions.length === 0) {
          console.warn(`No questions available for level ${level}`);
          continue;
        }

        console.log(`Found ${levelQuestions.length} questions for level ${level}`);

        // Filter out questions the user has already seen
        if (user_id) {
          const { data: seenQuestions } = await supabaseClient
            .from('user_question_history')
            .select('question_id')
            .eq('user_id', user_id)
            .in('question_id', levelQuestions.map(q => q.id))

          const seenQuestionIds = new Set(seenQuestions?.map(sq => sq.question_id) || []);
          const unseenQuestions = levelQuestions.filter(q => !seenQuestionIds.has(q.id));
          
          console.log(`${unseenQuestions.length} unseen questions for level ${level}`);
          
          // Take the required number of questions for this level
          const questionsToAdd = unseenQuestions.slice(0, targetCount);
          selectedQuestions = selectedQuestions.concat(questionsToAdd);
        } else {
          // If no user_id, just take random questions
          const questionsToAdd = levelQuestions.slice(0, targetCount);
          selectedQuestions = selectedQuestions.concat(questionsToAdd);
        }

        console.log(`Added ${Math.min(levelQuestions.length, targetCount)} questions for level ${level}`);
      }

      // If we don't have enough questions, get any available questions
      if (selectedQuestions.length < 15) {
        console.log(`Only got ${selectedQuestions.length} questions, need to fill remaining...`);
        
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
          console.log(`Added ${additionalQuestions.length} additional questions`);
        }
      }

      // Shuffle the questions for variety
      for (let i = selectedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
      }

      // Limit to exactly 15 questions
      selectedQuestions = selectedQuestions.slice(0, 15);

      if (selectedQuestions.length === 0) {
        throw new Error('No suitable questions found. Please generate more questions or check the database.');
      }

      // Log the final distribution
      const finalLevelCounts = selectedQuestions.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {});
      console.log('Final assessment level distribution:', finalLevelCounts);
      console.log(`Selected ${selectedQuestions.length} questions for assessment`);

      return new Response(
        JSON.stringify({ 
          testId: testData.id,
          questions: selectedQuestions,
          estimatedTime: 20,
          levelDistribution: finalLevelCounts
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'submit_answer') {
      // Record that user has seen this question (no immediate feedback)
      const { error: historyError } = await supabaseClient
        .from('user_question_history')
        .insert({
          user_id,
          question_id,
          test_id,
          seen_at: new Date().toISOString()
        })

      if (historyError) {
        console.error('Question history error:', historyError);
      }

      // Simply acknowledge answer submission without feedback
      return new Response(
        JSON.stringify({ success: true, message: 'Answer recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'complete_assessment') {
      // Get the questions for this test from the database
      const { data: testQuestions, error: testQuestionsError } = await supabaseClient
        .from('test_questions')
        .select('*')
        .in('id', Object.keys(answers))

      if (testQuestionsError || !testQuestions) {
        console.error('Error fetching test questions:', testQuestionsError);
        throw new Error('Failed to fetch test questions for scoring');
      }

      console.log(`Scoring ${testQuestions.length} questions`);

      // Enhanced scoring algorithm
      let totalScore = 0;
      let levelScores = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
      let topicPerformance: Record<string, { correct: number; total: number }> = {};
      let detailedFeedback: any[] = [];
      
      testQuestions.forEach((q: any) => {
        const userAnswer = answers[q.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
        
        if (isCorrect) {
          totalScore++;
          if (q.level && levelScores.hasOwnProperty(q.level)) {
            levelScores[q.level as keyof typeof levelScores]++;
          }
        }
        
        if (q.topic) {
          if (!topicPerformance[q.topic]) {
            topicPerformance[q.topic] = { correct: 0, total: 0 };
          }
          topicPerformance[q.topic].total++;
          if (isCorrect) {
            topicPerformance[q.topic].correct++;
          }
        }

        // Store detailed feedback for post-assessment review
        detailedFeedback.push({
          question: q.question,
          userAnswer,
          correctAnswer: q.correct_answer,
          isCorrect,
          explanation: q.explanation || 'No explanation available',
          detailedExplanation: q.detailed_explanation,
          firstPrinciplesExplanation: q.first_principles_explanation,
          wrongAnswerExplanations: q.wrong_answer_explanations,
          topic: q.topic,
          level: q.level
        });
      });

      const percentage = (totalScore / testQuestions.length) * 100;
      
      // Advanced level determination
      let recommendedLevel = 'A1';
      if (levelScores.C2 >= 2) recommendedLevel = 'C2';
      else if (levelScores.C1 >= 2) recommendedLevel = 'C1';
      else if (levelScores.B2 >= 2 && percentage >= 70) recommendedLevel = 'B2';
      else if (levelScores.B1 >= 2 && percentage >= 60) recommendedLevel = 'B1';
      else if (levelScores.A2 >= 2 && percentage >= 50) recommendedLevel = 'A2';
      else if (percentage >= 40) recommendedLevel = 'A1';

      // Analyze strengths and weaknesses
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      Object.entries(topicPerformance).forEach(([topic, result]) => {
        const topicScore = (result.correct / result.total) * 100;
        if (topicScore >= 75) {
          strengths.push(topic);
        } else if (topicScore <= 50) {
          weaknesses.push(topic);
        }
      });

      // Calculate XP reward
      const baseXP = 100;
      const bonusXP = Math.floor(percentage / 10) * 10;
      const totalXP = baseXP + bonusXP;

      // Update test completion
      const { error: updateError } = await supabaseClient
        .from('placement_tests')
        .update({
          score: percentage,
          level: recommendedLevel,
          completed_at: new Date().toISOString()
        })
        .eq('id', test_id);

      if (updateError) {
        console.error('Test update error:', updateError);
      }

      // Store assessment results
      await supabaseClient
        .from('assessment_results')
        .insert({
          user_id,
          assessment_type: 'comprehensive_placement',
          overall_score: percentage,
          recommended_level: recommendedLevel,
          topics_assessed: Object.keys(topicPerformance),
          strengths,
          weaknesses,
          detailed_analysis: {
            levelScores,
            topicPerformance,
            totalQuestions: testQuestions.length,
            totalCorrect: totalScore,
            detailedFeedback
          },
          next_steps: [
            `Focus on ${weaknesses.slice(0, 3).join(', ') || 'advanced concepts'} for improvement`,
            `Continue practicing ${recommendedLevel} level content`,
            'Take another assessment in 4-6 weeks to track progress'
          ]
        });

      console.log(`Assessment completed: ${Math.round(percentage)}% score, ${recommendedLevel} level`);

      return new Response(
        JSON.stringify({
          score: percentage,
          recommendedLevel,
          strengths,
          weaknesses,
          topicPerformance,
          levelBreakdown: levelScores,
          xpEarned: totalXP,
          detailedFeedback: {
            message: `Excellent work! You scored ${Math.round(percentage)}% and demonstrated ${recommendedLevel} level proficiency.`,
            nextSteps: [
              `Your strongest areas: ${strengths.slice(0, 3).join(', ') || 'Building foundation skills'}`,
              `Focus areas for improvement: ${weaknesses.slice(0, 3).join(', ') || 'Continue current level practice'}`,
              'Use Smart Practice for targeted skill development'
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
