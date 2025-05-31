
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
        explanation: 'Use base form with I/you/we/they',
        difficulty: 1
      },
      {
        type: 'multiple-choice',
        question: 'She ___ English every day.',
        options: ['study', 'studies', 'studying', 'studied'],
        answer: 'studies',
        explanation: 'Add -s/-es with he/she/it in present simple',
        difficulty: 1
      }
    ]
  },
  'Past Simple': {
    A2: [
      {
        type: 'fill-blank',
        question: 'Yesterday I ___ (go) to the cinema.',
        answer: 'went',
        explanation: 'Go becomes went in past simple',
        difficulty: 2
      },
      {
        type: 'transformation',
        question: 'Transform to past simple: "She walks to school."',
        answer: 'She walked to school.',
        explanation: 'Regular verbs add -ed in past simple',
        difficulty: 2
      }
    ]
  },
  'Present Perfect': {
    B1: [
      {
        type: 'fill-blank',
        question: 'I ___ (never/see) such a beautiful sunset.',
        answer: 'have never seen',
        explanation: 'Present perfect: have/has + past participle',
        difficulty: 3
      },
      {
        type: 'multiple-choice',
        question: 'How long ___ you ___ English?',
        options: ['do/study', 'have/studied', 'are/studying', 'did/study'],
        answer: 'have/studied',
        explanation: 'Use present perfect for actions continuing to the present',
        difficulty: 3
      }
    ]
  },
  'Conditionals': {
    B2: [
      {
        type: 'fill-blank',
        question: 'If I ___ (be) you, I would accept the offer.',
        answer: 'were',
        explanation: 'Use "were" for all subjects in second conditional',
        difficulty: 4
      },
      {
        type: 'transformation',
        question: 'Rewrite using third conditional: "He didn\'t study, so he failed."',
        answer: 'If he had studied, he wouldn\'t have failed.',
        explanation: 'Third conditional: If + past perfect, would have + past participle',
        difficulty: 5
      }
    ]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, topic, level, userAnswer, correctAnswer, userLevel, weakTopics } = await req.json()

    if (action === 'generate') {
      let exercises = []
      
      // Get template exercises if available
      const templateExercises = drillTemplates[topic]?.[level] || []
      exercises.push(...templateExercises)
      
      // Generate AI-powered exercises for variety
      if (exercises.length < 5) {
        try {
          const aiPrompt = `Generate 3 grammar exercises for topic "${topic}" at ${level} level. 
          ${weakTopics ? `Focus on these weak areas: ${weakTopics.join(', ')}.` : ''}
          
          Return JSON format:
          {
            "exercises": [
              {
                "type": "fill-blank" or "multiple-choice" or "transformation",
                "question": "question text with ___ for blanks",
                "options": ["array", "of", "options"] (for multiple-choice only),
                "answer": "correct answer",
                "explanation": "clear explanation why this is correct",
                "difficulty": number 1-5
              }
            ]
          }`

          const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are an expert English grammar teacher creating educational exercises. 
                  Focus on ${level} level difficulty. Make questions practical and engaging.
                  Always provide clear explanations that help students understand the grammar rule.`
                },
                {
                  role: 'user',
                  content: aiPrompt
                }
              ],
              temperature: 0.8,
              max_tokens: 1000
            })
          })

          const aiResponse = await openAIResponse.json()
          const generatedContent = JSON.parse(aiResponse.choices[0].message.content)
          exercises.push(...generatedContent.exercises)
        } catch (aiError) {
          console.error('AI generation failed:', aiError)
        }
      }
      
      // Shuffle and limit exercises
      exercises = exercises.sort(() => Math.random() - 0.5).slice(0, 10)
      
      return new Response(
        JSON.stringify({ 
          exercises,
          metadata: {
            topic,
            level,
            difficulty: calculateAverageDifficulty(exercises),
            estimatedTime: exercises.length * 1.5 // 1.5 minutes per exercise
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'evaluate') {
      const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
      const baseXP = 10
      const difficultyMultiplier = 1.2 // Could be based on actual difficulty
      const xpGained = isCorrect ? Math.round(baseXP * difficultyMultiplier) : Math.round(baseXP * 0.3)
      
      let feedback = ''
      if (isCorrect) {
        feedback = getPositiveFeedback()
      } else {
        feedback = getConstructiveFeedback()
      }
      
      return new Response(
        JSON.stringify({
          isCorrect,
          xpGained,
          feedback,
          encouragement: isCorrect ? 'Great job! 🎉' : 'Keep practicing! 💪',
          nextRecommendation: getNextRecommendation(isCorrect, topic, level)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'personalized-recommendations') {
      // Generate personalized drill recommendations based on user performance
      const recommendations = await generatePersonalizedRecommendations(userLevel, weakTopics)
      
      return new Response(
        JSON.stringify({ recommendations }),
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

function calculateAverageDifficulty(exercises: any[]): number {
  if (exercises.length === 0) return 1
  const total = exercises.reduce((sum, ex) => sum + (ex.difficulty || 1), 0)
  return Math.round(total / exercises.length)
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
    A1: ['Present Simple', 'Articles', 'Plural Nouns', 'Basic Prepositions'],
    A2: ['Past Simple', 'Present Perfect', 'Future Forms', 'Comparatives'],
    B1: ['Present Perfect Continuous', 'Conditionals', 'Passive Voice', 'Modal Verbs'],
    B2: ['Advanced Conditionals', 'Subjunctive', 'Complex Sentences', 'Reported Speech']
  }
  
  const topics = levelTopics[userLevel] || levelTopics.A1
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
