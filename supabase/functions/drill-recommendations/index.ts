
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const drillTemplates = {
  'Present Simple': {
    A1: [
      {
        type: 'fill-blank',
        question: 'I ___ (work) in an office.',
        answer: 'work',
        explanation: 'Use base form with I/you/we/they'
      },
      {
        type: 'multiple-choice',
        question: 'She ___ English every day.',
        options: ['study', 'studies', 'studying', 'studied'],
        answer: 'studies',
        explanation: 'Add -s/-es with he/she/it in present simple'
      }
    ]
  },
  'Past Simple': {
    A2: [
      {
        type: 'fill-blank',
        question: 'Yesterday I ___ (go) to the cinema.',
        answer: 'went',
        explanation: 'Go becomes went in past simple'
      }
    ]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, topic, level, userAnswer, correctAnswer } = await req.json()

    if (action === 'generate') {
      const drills = drillTemplates[topic]?.[level] || []
      
      if (drills.length === 0) {
        // Generate AI-powered drill using OpenAI
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
                content: `Create a grammar drill for topic "${topic}" at level "${level}". Return JSON format:
                {
                  "exercises": [
                    {
                      "type": "fill-blank" or "multiple-choice",
                      "question": "question text with ___ for blanks",
                      "options": ["array", "of", "options"] (for multiple-choice only),
                      "answer": "correct answer",
                      "explanation": "why this is correct"
                    }
                  ]
                }`
              }
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        })

        const aiResponse = await openAIResponse.json()
        const generatedDrills = JSON.parse(aiResponse.choices[0].message.content)
        
        return new Response(
          JSON.stringify(generatedDrills),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ exercises: drills }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'evaluate') {
      const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
      const xpGained = isCorrect ? 10 : 5
      
      return new Response(
        JSON.stringify({
          isCorrect,
          xpGained,
          feedback: isCorrect ? 'Excellent! Keep it up!' : 'Good try! Review the explanation and try again.'
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
