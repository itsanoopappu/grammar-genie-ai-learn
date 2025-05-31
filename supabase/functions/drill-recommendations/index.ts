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
    const { action, topic, level, user_id, userAnswer, correctAnswer, userLevel, weakTopics } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (action === 'generate') {
      // Check for existing drill
      const { data: existingDrill } = await supabaseClient
        .from('drill_recommendations')
        .select('drill_data')
        .eq('topic', topic)
        .eq('level', level)
        .not('drill_data', 'is', null)
        .limit(1)
        .single()

      if (existingDrill?.drill_data) {
        return new Response(
          JSON.stringify({ exercises: existingDrill.drill_data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate new exercises using OpenAI
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
              content: `You are an expert English grammar tutor creating exercises for ${level} level students.
              Focus on the topic: ${topic}
              ${weakTopics ? `Pay special attention to these weak areas: ${weakTopics.join(', ')}` : ''}`
            },
            {
              role: 'user',
              content: `Generate 5 grammar exercises in this JSON format:
              {
                "exercises": [
                  {
                    "type": "fill-blank" or "multiple-choice" or "transformation",
                    "question": "question text",
                    "options": ["array", "of", "options"] (for multiple-choice only),
                    "answer": "correct answer",
                    "explanation": "clear explanation",
                    "difficulty": number 1-5,
                    "grammarConcept": {
                      "name": "name of the grammar concept being tested",
                      "explanation": "detailed explanation of the grammar concept",
                      "examples": ["example1", "example2"],
                      "tips": ["tip1", "tip2"],
                      "commonMistakes": ["mistake1", "mistake2"],
                      "resources": [
                        {
                          "title": "resource title",
                          "type": "video/article/exercise",
                          "description": "brief description"
                        }
                      ]
                    }
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
      const exercises = JSON.parse(aiData.choices[0].message.content).exercises

      // Store exercises in database
      await supabaseClient
        .from('drill_recommendations')
        .insert({
          user_id,
          topic,
          level,
          drill_data: exercises,
          recommended_at: new Date().toISOString()
        })

      return new Response(
        JSON.stringify({ exercises }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'evaluate') {
      const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
      const baseXP = 10
      const xpGained = isCorrect ? baseXP : Math.round(baseXP * 0.3)

      // Get grammar concept explanation if user got it wrong
      let conceptExplanation = null
      if (!isCorrect) {
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
                content: 'You are an expert English grammar tutor helping students understand their mistakes.'
              },
              {
                role: 'user',
                content: `The student answered "${userAnswer}" for a question where "${correctAnswer}" was correct.
                Provide a detailed explanation of the grammar concept and why the correct answer is right.
                Include examples and common mistakes to avoid.`
              }
            ],
            temperature: 0.7
          })
        })

        if (openAIResponse.ok) {
          const aiData = await openAIResponse.json()
          conceptExplanation = aiData.choices[0].message.content
        }
      }

      return new Response(
        JSON.stringify({
          isCorrect,
          xpGained,
          feedback: isCorrect ? getPositiveFeedback() : getConstructiveFeedback(),
          nextRecommendation: getNextRecommendation(isCorrect, topic, level),
          conceptExplanation
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'personalized-recommendations') {
      const recommendations = await generatePersonalizedRecommendations(userLevel, weakTopics)
      
      return new Response(
        JSON.stringify({ recommendations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get-concept-explanation') {
      const { concept } = await req.json()
      
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
              content: 'You are an expert English grammar tutor providing detailed explanations of grammar concepts.'
            },
            {
              role: 'user',
              content: `Explain the grammar concept "${concept}" in detail. Include:
              1. Basic definition and usage
              2. Examples of correct usage
              3. Common mistakes to avoid
              4. Tips for remembering the rules
              5. Practice suggestions`
            }
          ],
          temperature: 0.7
        })
      })

      if (!openAIResponse.ok) {
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
      }

      const aiData = await openAIResponse.json()
      const explanation = aiData.choices[0].message.content

      return new Response(
        JSON.stringify({ explanation }),
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

function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().trim().replace(/[.,!?]/g, '')
}

function getPositiveFeedback(): string {
  const messages = [
    'Excellent! You\'re mastering this grammar point.',
    'Perfect! Your understanding is really improving.',
    'Great work! You\'ve got this concept down.',
    'Outstanding! Keep up the excellent progress.',
    'Wonderful! You\'re becoming more confident with grammar.'
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

function getConstructiveFeedback(): string {
  const messages = [
    'Good attempt! Review the explanation and try similar exercises.',
    'You\'re on the right track! Practice makes perfect.',
    'Keep trying! Understanding grammar takes time and practice.',
    'Nice effort! Focus on the grammar rule and try again.',
    'Don\'t worry! Everyone learns at their own pace.'
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

function getNextRecommendation(isCorrect: boolean, topic: string, level: string): string {
  if (isCorrect) {
    return `Try more advanced ${topic} exercises or explore a new grammar topic.`
  } else {
    return `Practice more ${topic} exercises at ${level} level to strengthen your understanding.`
  }
}

async function generatePersonalizedRecommendations(userLevel: string, weakTopics: string[]) {
  const levelTopics = {
    'A1': ['Present Simple', 'Articles', 'Plural Nouns', 'Basic Prepositions'],
    'A2': ['Past Simple', 'Present Perfect', 'Future Forms', 'Comparatives'],
    'B1': ['Present Perfect Continuous', 'Conditionals', 'Passive Voice', 'Modal Verbs'],
    'B2': ['Advanced Conditionals', 'Subjunctive', 'Complex Sentences', 'Reported Speech']
  }
  
  const topics = levelTopics[userLevel] || levelTopics['A1']
  const recommendations = []
  
  // Prioritize weak topics
  if (weakTopics && weakTopics.length > 0) {
    weakTopics.forEach(topic => {
      if (topics.includes(topic)) {
        recommendations.push({
          topic,
          priority: 'high',
          reason: 'Identified as area needing improvement',
          estimatedTime: 15,
          difficulty: 'medium'
        })
      }
    })
  }
  
  // Add general level-appropriate topics
  topics.slice(0, 3).forEach(topic => {
    if (!recommendations.find(r => r.topic === topic)) {
      recommendations.push({
        topic,
        priority: 'normal',
        reason: `Recommended for ${userLevel} level`,
        estimatedTime: 12,
        difficulty: 'medium'
      })
    }
  })
  
  return recommendations.slice(0, 5)
}