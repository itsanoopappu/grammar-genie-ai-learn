
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const comprehensiveQuestions = {
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
    },
    {
      question: "Complete: 'She ___ coffee every morning.'",
      options: ["drink", "drinks", "drinking", "drank"],
      correct: "drinks",
      topic: "Present simple - third person",
      explanation: "Add 's' to verbs with he/she/it in present simple."
    },
    {
      question: "Choose the correct article: '___ apple is red.'",
      options: ["A", "An", "The", "No article"],
      correct: "The",
      topic: "Definite articles",
      explanation: "Use 'the' when referring to a specific apple."
    },
    {
      question: "What time is it? It's ___ o'clock.",
      options: ["three", "third", "three's", "tree"],
      correct: "three",
      topic: "Numbers and time",
      explanation: "Use cardinal numbers for telling time."
    }
  ],
  A2: [
    {
      question: "Choose the correct form: 'Yesterday I ___ to the store.'",
      options: ["go", "went", "goes", "going"],
      correct: "went",
      topic: "Past simple",
      explanation: "Use past simple 'went' for completed actions in the past."
    },
    {
      question: "Complete: 'I ___ lived here for five years.'",
      options: ["am", "have", "has", "will"],
      correct: "have",
      topic: "Present perfect",
      explanation: "Use 'have' with I/you/we/they in present perfect."
    },
    {
      question: "Choose the correct preposition: 'The book is ___ the table.'",
      options: ["in", "on", "at", "by"],
      correct: "on",
      topic: "Prepositions of place",
      explanation: "Use 'on' for objects resting on a surface."
    },
    {
      question: "Which is correct? 'There ___ many people at the party.'",
      options: ["was", "were", "is", "are"],
      correct: "were",
      topic: "There was/were",
      explanation: "Use 'were' with plural nouns in past tense."
    },
    {
      question: "Complete: 'If it rains, I ___ stay home.'",
      options: ["will", "would", "am", "have"],
      correct: "will",
      topic: "First conditional",
      explanation: "Use 'will' in the main clause of first conditional."
    }
  ],
  B1: [
    {
      question: "Choose the correct form: 'If I ___ you, I would study harder.'",
      options: ["am", "was", "were", "be"],
      correct: "were",
      topic: "Second conditional",
      explanation: "Use 'were' with all subjects in hypothetical conditionals."
    },
    {
      question: "Complete: 'The report ___ by tomorrow.'",
      options: ["will finish", "will be finished", "will finishing", "will have finish"],
      correct: "will be finished",
      topic: "Future passive",
      explanation: "Use 'will be + past participle' for future passive voice."
    },
    {
      question: "Which is correct? 'I wish I ___ speak French fluently.'",
      options: ["can", "could", "will", "would"],
      correct: "could",
      topic: "Wishes about present ability",
      explanation: "Use 'could' to express wishes about present abilities."
    },
    {
      question: "Choose: 'Despite ___ hard, he failed the exam.'",
      options: ["study", "studying", "to study", "studied"],
      correct: "studying",
      topic: "Despite + gerund",
      explanation: "Use gerund (-ing) after 'despite'."
    },
    {
      question: "Complete: 'By the time you arrive, I ___ cooking.'",
      options: ["will finish", "will have finished", "finish", "finished"],
      correct: "will have finished",
      topic: "Future perfect",
      explanation: "Use future perfect for actions completed before a future time."
    }
  ],
  B2: [
    {
      question: "Choose: 'Had I known about the meeting, I ___ attended.'",
      options: ["will have", "would have", "will", "would"],
      correct: "would have",
      topic: "Third conditional inversion",
      explanation: "Inverted conditionals use 'would have' in the main clause."
    },
    {
      question: "Complete: 'The more you practice, ___ you become.'",
      options: ["the better", "better", "the best", "best"],
      correct: "the better",
      topic: "Comparative structures",
      explanation: "Use 'the + comparative' in parallel structures."
    },
    {
      question: "Which is correct? 'She suggested ___ the meeting.'",
      options: ["to postpone", "postponing", "postpone", "postponed"],
      correct: "postponing",
      topic: "Suggest + gerund",
      explanation: "Use gerund after 'suggest'."
    },
    {
      question: "Choose: 'Not only ___ talented, but also hardworking.'",
      options: ["she is", "is she", "she", "is"],
      correct: "is she",
      topic: "Inversion after negative expressions",
      explanation: "Invert subject and auxiliary after 'not only'."
    },
    {
      question: "Complete: 'I'd rather you ___ smoke in here.'",
      options: ["don't", "didn't", "won't", "wouldn't"],
      correct: "didn't",
      topic: "Would rather + past tense",
      explanation: "Use past tense after 'would rather' for present preferences."
    }
  ]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, level, answers, adaptive } = await req.json()

    if (action === 'generate') {
      let questions = []
      
      if (adaptive) {
        // Adaptive test - start with A2, adjust based on performance
        const levels = ['A1', 'A2', 'B1', 'B2']
        const startLevel = level || 'A2'
        const startIndex = levels.indexOf(startLevel)
        
        // Get 2 questions from each level around the start level
        for (let i = Math.max(0, startIndex - 1); i < Math.min(levels.length, startIndex + 2); i++) {
          const levelQuestions = comprehensiveQuestions[levels[i]] || []
          questions.push(...levelQuestions.slice(0, 2))
        }
      } else {
        questions = comprehensiveQuestions[level] || comprehensiveQuestions.A1
      }
      
      // Shuffle questions for variety
      questions = questions.sort(() => Math.random() - 0.5)
      
      return new Response(
        JSON.stringify({ questions: questions.slice(0, 10) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'evaluate') {
      let score = 0
      const totalQuestions = answers.length
      const results = []
      const topicPerformance = {}

      answers.forEach((answer: any, index: number) => {
        const isCorrect = answer.userAnswer === answer.correctAnswer
        if (isCorrect) score++
        
        const topic = answer.topic || 'General'
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 }
        }
        topicPerformance[topic].total++
        if (isCorrect) topicPerformance[topic].correct++
        
        results.push({
          ...answer,
          isCorrect,
          explanation: answer.explanation
        })
      })

      const percentage = (score / totalQuestions) * 100
      let recommendedLevel = 'A1'
      
      if (percentage >= 90) recommendedLevel = 'C1'
      else if (percentage >= 80) recommendedLevel = 'B2'
      else if (percentage >= 70) recommendedLevel = 'B1'
      else if (percentage >= 60) recommendedLevel = 'A2'

      // Generate detailed feedback
      const weakTopics = Object.entries(topicPerformance)
        .filter(([_, perf]: [string, any]) => (perf.correct / perf.total) < 0.6)
        .map(([topic, _]) => topic)

      const strongTopics = Object.entries(topicPerformance)
        .filter(([_, perf]: [string, any]) => (perf.correct / perf.total) >= 0.8)
        .map(([topic, _]) => topic)

      return new Response(
        JSON.stringify({
          score: percentage,
          correctAnswers: score,
          totalQuestions,
          recommendedLevel,
          results,
          topicPerformance,
          weakTopics,
          strongTopics,
          detailedFeedback: generateDetailedFeedback(percentage, weakTopics, strongTopics)
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

function generateDetailedFeedback(percentage: number, weakTopics: string[], strongTopics: string[]) {
  let feedback = []
  
  if (percentage >= 90) {
    feedback.push("Excellent work! You have a strong command of English grammar.")
  } else if (percentage >= 70) {
    feedback.push("Good job! You have a solid foundation in English grammar.")
  } else if (percentage >= 50) {
    feedback.push("You're making progress! Focus on the areas that need improvement.")
  } else {
    feedback.push("Keep practicing! Everyone starts somewhere, and consistent practice will help you improve.")
  }

  if (strongTopics.length > 0) {
    feedback.push(`You're particularly strong in: ${strongTopics.join(', ')}.`)
  }

  if (weakTopics.length > 0) {
    feedback.push(`Focus on improving: ${weakTopics.join(', ')}.`)
  }

  return feedback
}
