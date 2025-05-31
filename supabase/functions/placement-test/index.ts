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
    const { action, level, adaptive, user_id, answers, test_id } = await req.json()

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
          user_id,
          level,
          test_type: adaptive ? 'adaptive' : 'standard',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (testError) throw testError

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
              content: `You are an expert English grammar assessment system. Generate 10 grammar questions suitable for ${level} level students. Each question should test a different grammar concept.`
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
      })

      if (!openAIResponse.ok) {
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
      }

      const aiData = await openAIResponse.json()
      const generatedQuestions = JSON.parse(aiData.choices[0].message.content).questions

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
            explanation: q.explanation,
            level
          }))
        )

      if (questionsError) throw questionsError

      return new Response(
        JSON.stringify({ 
          questions: generatedQuestions,
          testId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'evaluate') {
      // Update test questions with user answers
      for (const answer of answers) {
        await supabaseClient
          .from('test_questions')
          .update({
            user_answer: answer.userAnswer,
            is_correct: answer.userAnswer === answer.correctAnswer
          })
          .eq('test_id', test_id)
          .eq('question', answer.question)
      }

      // Calculate results
      const score = answers.filter(a => a.userAnswer === a.correctAnswer).length
      const percentage = (score / answers.length) * 100
      let recommendedLevel = 'A1'
      
      if (percentage >= 90) recommendedLevel = 'C1'
      else if (percentage >= 80) recommendedLevel = 'B2'
      else if (percentage >= 70) recommendedLevel = 'B1'
      else if (percentage >= 60) recommendedLevel = 'A2'

      // Calculate topic performance
      const topicPerformance = {}
      const weakTopics = []
      const strongTopics = []

      answers.forEach(answer => {
        if (!topicPerformance[answer.topic]) {
          topicPerformance[answer.topic] = { correct: 0, total: 0 }
        }
        topicPerformance[answer.topic].total++
        if (answer.userAnswer === answer.correctAnswer) {
          topicPerformance[answer.topic].correct++
        }
      })

      Object.entries(topicPerformance).forEach(([topic, perf]: [string, any]) => {
        const percentage = (perf.correct / perf.total) * 100
        if (percentage < 60) weakTopics.push(topic)
        if (percentage >= 80) strongTopics.push(topic)
      })

      // Update test completion
      await supabaseClient
        .from('placement_tests')
        .update({
          score: percentage,
          level: recommendedLevel,
          completed_at: new Date().toISOString()
        })
        .eq('id', test_id)

      return new Response(
        JSON.stringify({
          score,
          total: answers.length,
          recommendedLevel,
          topicPerformance,
          weakTopics,
          strongTopics,
          detailedFeedback: [
            `You scored ${percentage.toFixed(1)}% overall.`,
            `Your recommended level is ${recommendedLevel}.`,
            weakTopics.length > 0 ? `Focus on improving: ${weakTopics.join(', ')}` : 'Great job across all topics!',
            strongTopics.length > 0 ? `You're particularly strong in: ${strongTopics.join(', ')}` : ''
          ].filter(Boolean)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})