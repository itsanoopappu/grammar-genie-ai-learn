import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate required environment variables
const validateEnv = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate environment variables before proceeding
    validateEnv();

    const { action, questions, answers, test_id } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (action === 'generate') {
      // First create a new test entry
      const { data: testData, error: testError } = await supabaseClient
        .from('placement_tests')
        .insert({
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (testError) {
        throw new Error(`Failed to create test entry: ${testError.message}`);
      }

      const testId = testData.id

      // Generate questions using OpenAI
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert English grammar assessment system. Generate 10 grammar questions suitable for assessing English proficiency.'
            },
            {
              role: 'user',
              content: `Generate questions in this JSON format:
              {
                "questions": [
                  {
                    "question": "question text",
                    "options": ["option1", "option2", "option3", "option4"],
                    "correct": "correct option",
                    "topic": "grammar topic",
                    "explanation": "explanation of the correct answer"
                  }
                ]
              }`
            }
          ],
          temperature: 0.7
        })
      }).catch(error => {
        throw new Error(`OpenAI API request failed: ${error.message}`);
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.text();
        throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorData}`);
      }

      const aiData = await openAIResponse.json();
      const generatedQuestions = JSON.parse(aiData.choices[0].message.content).questions;

      // Store questions in database
      const { error: questionsError } = await supabaseClient
        .from('test_questions')
        .insert(
          generatedQuestions.map((q: any) => ({
            test_id: testId,
            question: q.question,
            options: q.options,
            correct_answer: q.correct,
            topic: q.topic,
            explanation: q.explanation
          }))
        )

      if (questionsError) {
        throw new Error(`Failed to store questions: ${questionsError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          questions: generatedQuestions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            topic: q.topic,
            level: q.level
          })),
          testId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'evaluate') {
      if (!questions || !answers) {
        throw new Error('Missing required parameters: questions and answers are required');
      }

      // Calculate results
      const score = Object.values(answers).filter((answer, index) => 
        answer === questions[index].correct_answer
      ).length;
      
      const percentage = (score / questions.length) * 100;
      
      let recommendedLevel = 'A1';
      if (percentage >= 90) recommendedLevel = 'C1';
      else if (percentage >= 80) recommendedLevel = 'B2';
      else if (percentage >= 70) recommendedLevel = 'B1';
      else if (percentage >= 60) recommendedLevel = 'A2';

      // Group questions by topic for analysis
      const topicResults = questions.reduce((acc, q, index) => {
        const topic = q.topic;
        if (!acc[topic]) {
          acc[topic] = { correct: 0, total: 0 };
        }
        acc[topic].total++;
        if (answers[q.id] === q.correct_answer) {
          acc[topic].correct++;
        }
        return acc;
      }, {});

      // Analyze strengths and weaknesses
      const strengths = [];
      const weaknesses = [];
      Object.entries(topicResults).forEach(([topic, result]: [string, any]) => {
        const topicScore = (result.correct / result.total) * 100;
        if (topicScore >= 80) {
          strengths.push(`Strong understanding of ${topic}`);
        } else if (topicScore <= 60) {
          weaknesses.push(`Need to improve ${topic}`);
        }
      });

      return new Response(
        JSON.stringify({
          score,
          level: recommendedLevel,
          strengths,
          weaknesses,
          topicsAssessed: Object.keys(topicResults),
          detailedAnalysis: topicResults,
          nextSteps: [
            'Review the topics listed in your weaknesses',
            'Practice exercises focusing on your weak areas',
            'Consider taking another test in 2-3 weeks to track progress'
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'If this error persists, please ensure all required environment variables are set in your Supabase project settings.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})