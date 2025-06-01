
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
          immediate_feedback: true,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (testError) {
        console.error('Test creation error:', testError);
        throw new Error(`Failed to create test entry: ${testError.message}`);
      }

      // Get unseen questions for user using the database function
      const { data: questions, error: questionsError } = await supabaseClient
        .rpc('get_unseen_questions_for_user', {
          p_user_id: user_id,
          p_limit: 15
        })

      if (questionsError) {
        console.error('Questions fetch error:', questionsError);
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
      }

      if (!questions || questions.length === 0) {
        throw new Error('No available questions found. Please contact support.');
      }

      // Create test questions entries
      const { error: testQuestionsError } = await supabaseClient
        .from('test_questions')
        .update({ test_id: testData.id })
        .in('id', questions.map(q => q.id))

      if (testQuestionsError) {
        console.error('Test questions assignment error:', testQuestionsError);
      }

      return new Response(
        JSON.stringify({ 
          testId: testData.id,
          questions: questions.slice(0, 15), // Ensure exactly 15 questions
          estimatedTime: 20
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'submit_answer') {
      // Get question details for feedback
      const { data: question, error: questionError } = await supabaseClient
        .from('test_questions')
        .select('*')
        .eq('id', question_id)
        .single()

      if (questionError) {
        throw new Error(`Failed to fetch question: ${questionError.message}`);
      }

      const isCorrect = user_answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      
      // Record that user has seen this question
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

      // Prepare feedback response
      const feedback = {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        detailedExplanation: question.detailed_explanation,
        firstPrinciplesExplanation: question.first_principles_explanation,
        wrongAnswerExplanations: question.wrong_answer_explanations,
        topic: question.topic,
        level: question.level
      };

      return new Response(
        JSON.stringify(feedback),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'complete_assessment') {
      const { data: questions, error: questionsError } = await supabaseClient
        .from('test_questions')
        .select('*')
        .eq('test_id', test_id)

      if (questionsError) {
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
      }

      // Enhanced scoring algorithm
      let totalScore = 0;
      let levelScores = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
      let topicPerformance: Record<string, { correct: number; total: number }> = {};
      
      questions.forEach((q: any) => {
        const userAnswer = answers[q.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
        
        if (isCorrect) {
          totalScore++;
          levelScores[q.level as keyof typeof levelScores]++;
        }
        
        if (!topicPerformance[q.topic]) {
          topicPerformance[q.topic] = { correct: 0, total: 0 };
        }
        topicPerformance[q.topic].total++;
        if (isCorrect) {
          topicPerformance[q.topic].correct++;
        }
      });

      const percentage = (totalScore / questions.length) * 100;
      
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
            totalQuestions: questions.length,
            totalCorrect: totalScore
          },
          next_steps: [
            `Focus on ${weaknesses.slice(0, 3).join(', ') || 'advanced concepts'} for improvement`,
            `Continue practicing ${recommendedLevel} level content`,
            'Take another assessment in 4-6 weeks to track progress'
          ]
        });

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
            ]
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
