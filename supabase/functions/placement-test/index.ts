
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const grammarQuestions = {
  A1: [
    {
      question: "Choose the correct form: 'I ___ a student.'",
      options: ["am", "is", "are", "be"],
      correct: "am",
      topic: "Present tense of 'be'",
      explanation: "Use 'am' with 'I' in present tense."
    },
    {
      question: "What is the plural of 'child'?",
      options: ["childs", "children", "childes", "child"],
      correct: "children",
      topic: "Irregular plurals",
      explanation: "'Child' has an irregular plural form 'children'."
    }
  ],
  A2: [
    {
      question: "Choose the correct form: 'Yesterday I ___ to the store.'",
      options: ["go", "went", "goes", "going"],
      correct: "went",
      topic: "Past simple",
      explanation: "Use past simple 'went' for completed actions in the past."
    }
  ],
  B1: [
    {
      question: "Choose the correct form: 'If I ___ you, I would study harder.'",
      options: ["am", "was", "were", "be"],
      correct: "were",
      topic: "Conditional sentences",
      explanation: "Use 'were' in hypothetical conditional sentences."
    }
  ]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, level, answers } = await req.json()

    if (action === 'generate') {
      const questions = grammarQuestions[level] || grammarQuestions.A1
      return new Response(
        JSON.stringify({ questions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'evaluate') {
      let score = 0
      const totalQuestions = answers.length
      const results = []

      answers.forEach((answer: any, index: number) => {
        const isCorrect = answer.userAnswer === answer.correctAnswer
        if (isCorrect) score++
        
        results.push({
          ...answer,
          isCorrect,
          explanation: answer.explanation
        })
      })

      const percentage = (score / totalQuestions) * 100
      let recommendedLevel = 'A1'
      
      if (percentage >= 90) recommendedLevel = 'B2'
      else if (percentage >= 75) recommendedLevel = 'B1'
      else if (percentage >= 60) recommendedLevel = 'A2'

      return new Response(
        JSON.stringify({
          score: percentage,
          correctAnswers: score,
          totalQuestions,
          recommendedLevel,
          results
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
