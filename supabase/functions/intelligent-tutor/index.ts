import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExerciseContent {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hints?: string[];
}

interface TopicData {
  id: string;
  name: string;
  level: string;
  difficulty_score: number;
  prerequisites: string[];
  learning_objectives: string[];
  common_errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { action, user_id, topic_id, user_level, difficulty_preference, session_id, performance_data } = await req.json()

    switch (action) {
      case 'get_personalized_exercises':
        return await getPersonalizedExercises(supabaseClient, user_id, topic_id, user_level)
      
      case 'evaluate_exercise':
        return await evaluateExercise(supabaseClient, req.json())
      
      case 'get_topic_recommendations':
        return await getTopicRecommendations(supabaseClient, user_id, user_level)
      
      case 'get_assessment_driven_recommendations':
        return await getAssessmentDrivenRecommendations(supabaseClient, user_id, user_level)
      
      case 'update_skill_model':
        return await updateSkillModel(supabaseClient, { user_id, topic_id, performance_data })
      
      case 'get_adaptive_difficulty':
        return await getAdaptiveDifficulty(supabaseClient, user_id, topic_id)
      
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function getPersonalizedExercises(supabaseClient: any, user_id: string, topic_id: string, user_level: string) {
  // Get user's skill level for this topic
  const { data: userSkill } = await supabaseClient
    .from('user_skills')
    .select('skill_level, attempts_count, mastery_level, confidence_interval')
    .eq('user_id', user_id)
    .eq('topic_id', topic_id)
    .single()

  // Get adaptive difficulty based on recent performance
  const adaptiveDifficulty = await getAdaptiveDifficultyLevel(supabaseClient, user_id, topic_id, userSkill)

  // Get existing exercises for this topic and difficulty
  let { data: exercises } = await supabaseClient
    .from('exercises')
    .select('*')
    .eq('topic_id', topic_id)
    .gte('difficulty_level', adaptiveDifficulty - 1)
    .lte('difficulty_level', adaptiveDifficulty + 1)
    .limit(5)

  // If no exercises exist, generate them using AI
  if (!exercises || exercises.length === 0) {
    exercises = await generateExercisesForTopic(supabaseClient, topic_id, adaptiveDifficulty, user_level)
  }

  // Create or update practice session
  const { data: session } = await supabaseClient
    .from('practice_sessions')
    .insert({
      user_id,
      topic_id,
      session_type: 'adaptive_practice',
      difficulty_progression: [adaptiveDifficulty]
    })
    .select()
    .single()

  return new Response(
    JSON.stringify({ 
      exercises: exercises.slice(0, 3), 
      session_id: session.id,
      target_difficulty: adaptiveDifficulty,
      skill_level: userSkill?.skill_level || 0.5,
      confidence: userSkill?.confidence_interval || 0.2
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAssessmentDrivenRecommendations(supabaseClient: any, user_id: string, user_level: string) {
  // Get latest assessment results
  const { data: latestAssessment } = await supabaseClient
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!latestAssessment) {
    return await getTopicRecommendations(supabaseClient, user_id, user_level)
  }

  // Get user's current skills
  const { data: userSkills } = await supabaseClient
    .from('user_skills')
    .select('*, grammar_topics(*)')
    .eq('user_id', user_id)

  // Create assessment-driven recommendations
  const weaknessTopics = latestAssessment.weaknesses || []
  const strengthTopics = latestAssessment.strengths || []
  
  // Get all topics for user's level
  const { data: allTopics } = await supabaseClient
    .from('grammar_topics')
    .select('*')
    .eq('level', latestAssessment.recommended_level || user_level)
    .order('difficulty_score')

  const recommendations = allTopics?.map(topic => {
    const userSkill = userSkills?.find(skill => skill.topic_id === topic.id)
    const skillLevel = userSkill?.skill_level || 0
    const isWeakness = weaknessTopics.includes(topic.name)
    const isStrength = strengthTopics.includes(topic.name)
    
    let priority = 'normal'
    let reason = 'Continue learning'
    let confidence = latestAssessment.overall_score / 100
    
    if (isWeakness) {
      priority = 'high'
      reason = `Identified as weakness in recent assessment (${Math.round(confidence * 100)}% confidence)`
    } else if (isStrength && skillLevel > 0.8) {
      priority = 'low'
      reason = `Strong performance in assessment - occasional review recommended`
    } else if (!userSkill) {
      priority = 'high'
      reason = 'New topic - recommended based on your level'
    } else if (skillLevel < 0.4) {
      priority = 'high'
      reason = 'Below proficiency threshold - needs improvement'
    }
    
    // Calculate days since last practice
    const daysSinceLastPractice = userSkill?.last_practiced 
      ? Math.floor((new Date().getTime() - new Date(userSkill.last_practiced).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Apply spaced repetition logic
    if (daysSinceLastPractice && daysSinceLastPractice > 7 && skillLevel > 0.6) {
      priority = 'normal'
      reason = `Due for review (last practiced ${daysSinceLastPractice} days ago)`
    }
    
    return {
      ...topic,
      skill_level: skillLevel,
      mastery_level: userSkill?.mastery_level || 'novice',
      priority,
      reason,
      recommended: priority === 'high',
      assessment_driven: isWeakness || isStrength,
      confidence_score: confidence,
      days_since_practice: daysSinceLastPractice
    }
  }).sort((a, b) => {
    // Sort by priority first, then by assessment-driven, then by confidence
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    if (a.assessment_driven && !b.assessment_driven) return -1
    if (b.assessment_driven && !a.assessment_driven) return 1
    return b.confidence_score - a.confidence_score
  }) || []

  return new Response(
    JSON.stringify({ 
      recommendations: recommendations.slice(0, 10),
      assessment_data: {
        score: latestAssessment.overall_score,
        level: latestAssessment.recommended_level,
        date: latestAssessment.created_at,
        weaknesses: weaknessTopics,
        strengths: strengthTopics
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAdaptiveDifficultyLevel(supabaseClient: any, user_id: string, topic_id: string, userSkill: any) {
  if (!userSkill) return 3 // Default difficulty for new topics

  // Get recent performance for this topic (last 10 attempts)
  const { data: recentAttempts } = await supabaseClient
    .from('exercise_attempts')
    .select('is_correct, difficulty_at_attempt, attempted_at')
    .eq('user_id', user_id)
    .order('attempted_at', { ascending: false })
    .limit(10)

  if (!recentAttempts || recentAttempts.length === 0) {
    return Math.max(1, Math.min(10, Math.round(userSkill.skill_level * 10)))
  }

  // Calculate recent success rate
  const recentSuccessRate = recentAttempts.reduce((acc, attempt) => acc + (attempt.is_correct ? 1 : 0), 0) / recentAttempts.length
  
  // Target success rate is 70-80% (optimal challenge zone)
  const targetSuccessRate = 0.75
  const currentDifficulty = userSkill.skill_level * 10
  
  let adjustedDifficulty = currentDifficulty
  
  if (recentSuccessRate > 0.85) {
    // Too easy - increase difficulty
    adjustedDifficulty = Math.min(10, currentDifficulty + 1)
  } else if (recentSuccessRate < 0.6) {
    // Too hard - decrease difficulty
    adjustedDifficulty = Math.max(1, currentDifficulty - 1)
  }
  
  return Math.round(adjustedDifficulty)
}

async function getAdaptiveDifficulty(supabaseClient: any, user_id: string, topic_id: string) {
  const { data: userSkill } = await supabaseClient
    .from('user_skills')
    .select('*')
    .eq('user_id', user_id)
    .eq('topic_id', topic_id)
    .single()

  const adaptiveDifficulty = await getAdaptiveDifficultyLevel(supabaseClient, user_id, topic_id, userSkill)

  return new Response(
    JSON.stringify({ 
      difficulty: adaptiveDifficulty,
      skill_level: userSkill?.skill_level || 0.5,
      confidence: userSkill?.confidence_interval || 0.2
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateExercisesForTopic(supabaseClient: any, topic_id: string, difficulty: number, user_level: string) {
  // Get topic information
  const { data: topic } = await supabaseClient
    .from('grammar_topics')
    .select('*')
    .eq('id', topic_id)
    .single()

  if (!topic) throw new Error('Topic not found')

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
          content: `You are an expert English grammar teacher. Create ${difficulty <= 3 ? 'beginner' : difficulty <= 6 ? 'intermediate' : 'advanced'} level exercises for the topic "${topic.name}" at CEFR level ${user_level}.

Topic description: ${topic.description}
Learning objectives: ${JSON.stringify(topic.learning_objectives)}
Common errors: ${JSON.stringify(topic.common_errors)}

Create 3 different types of exercises:
1. Multiple choice (4 options)
2. Fill in the blank 
3. Error correction

For each exercise, provide:
- Clear question
- Correct answer
- Detailed explanation
- Common mistakes to avoid
- Helpful hints

Return JSON array with this structure:
[{
  "type": "multiple-choice|fill-blank|error-correction",
  "content": {
    "question": "...",
    "options": ["..."] (for multiple choice only),
    "correctAnswer": "...",
    "explanation": "...",
    "hints": ["..."],
    "commonMistakes": ["..."]
  },
  "difficulty_level": ${difficulty},
  "estimated_time_seconds": 60
}]`
        }
      ],
      temperature: 0.7,
    }),
  })

  const aiResult = await openAIResponse.json()
  const generatedExercises = JSON.parse(aiResult.choices[0].message.content)

  // Save exercises to database
  const exercisesToInsert = generatedExercises.map((ex: any) => ({
    topic_id,
    type: ex.type,
    content: ex.content,
    difficulty_level: ex.difficulty_level,
    estimated_time_seconds: ex.estimated_time_seconds || 60
  }))

  const { data: savedExercises } = await supabaseClient
    .from('exercises')
    .insert(exercisesToInsert)
    .select()

  return savedExercises
}

async function evaluateExercise(supabaseClient: any, data: any) {
  const { user_id, exercise_id, user_answer, session_id, time_taken } = data

  // Get exercise details
  const { data: exercise } = await supabaseClient
    .from('exercises')
    .select('*, grammar_topics(*)')
    .eq('id', exercise_id)
    .single()

  const isCorrect = user_answer.toLowerCase().trim() === exercise.content.correctAnswer.toLowerCase().trim()
  
  // Generate AI feedback
  const feedback = await generateAIFeedback(exercise, user_answer, isCorrect)

  // Save exercise attempt
  await supabaseClient
    .from('exercise_attempts')
    .insert({
      user_id,
      exercise_id,
      session_id,
      user_answer: { answer: user_answer },
      is_correct: isCorrect,
      time_taken_seconds: time_taken,
      ai_feedback: feedback,
      difficulty_at_attempt: exercise.difficulty_level
    })

  // Update session progress
  await supabaseClient
    .from('practice_sessions')
    .update({
      exercises_attempted: supabaseClient.raw('exercises_attempted + 1'),
      exercises_correct: isCorrect ? supabaseClient.raw('exercises_correct + 1') : supabaseClient.raw('exercises_correct')
    })
    .eq('id', session_id)

  // Update user skill model with enhanced tracking
  await updateUserSkillLevel(supabaseClient, user_id, exercise.topic_id, isCorrect, exercise.difficulty_level, time_taken)

  return new Response(
    JSON.stringify({ 
      is_correct: isCorrect,
      feedback,
      correct_answer: exercise.content.correctAnswer,
      explanation: exercise.content.explanation
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateAIFeedback(exercise: any, userAnswer: string, isCorrect: boolean) {
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
          content: `You are a helpful English grammar tutor. Provide encouraging, specific feedback.

Exercise: ${exercise.content.question}
Correct Answer: ${exercise.content.correctAnswer}
User Answer: ${userAnswer}
Is Correct: ${isCorrect}
Topic: ${exercise.grammar_topics.name}

Provide feedback in JSON format:
{
  "message": "encouraging message",
  "explanation": "why this is correct/incorrect",
  "tip": "helpful tip for improvement",
  "encouragement": "motivational message"
}`
        }
      ],
      temperature: 0.7,
    }),
  })

  const result = await openAIResponse.json()
  return JSON.parse(result.choices[0].message.content)
}

async function updateUserSkillLevel(supabaseClient: any, user_id: string, topic_id: string, isCorrect: boolean, difficulty: number, timeTaken: number) {
  // Enhanced Bayesian update of skill level with time factor
  const { data: currentSkill } = await supabaseClient
    .from('user_skills')
    .select('*')
    .eq('user_id', user_id)
    .eq('topic_id', topic_id)
    .single()

  let newSkillLevel, newConfidence, newMastery
  
  if (currentSkill) {
    // Update existing skill with enhanced algorithm
    const currentLevel = currentSkill.skill_level
    const attempts = currentSkill.attempts_count + 1
    
    // Factor in time taken (faster = better understanding)
    const timeBonus = timeTaken < 30 ? 0.02 : timeTaken > 120 ? -0.01 : 0
    
    // Enhanced Bayesian update with difficulty and time factors
    const difficultyWeight = difficulty / 10
    const evidence = isCorrect ? 
      (difficultyWeight * 0.15 + timeBonus) : 
      -(difficultyWeight * 0.1)
    
    newSkillLevel = Math.max(0, Math.min(1, currentLevel + evidence))
    newConfidence = Math.max(0.1, currentSkill.confidence_interval - 0.005) // Increase confidence with practice
    
    // Update mastery level based on skill level and consistency
    if (newSkillLevel >= 0.9 && attempts >= 10) newMastery = 'expert'
    else if (newSkillLevel >= 0.8 && attempts >= 8) newMastery = 'advanced'
    else if (newSkillLevel >= 0.7 && attempts >= 5) newMastery = 'proficient'
    else if (newSkillLevel >= 0.5) newMastery = 'developing'
    else newMastery = 'novice'

    // Calculate next review date using spaced repetition
    const masteryMultiplier = newMastery === 'expert' ? 30 : newMastery === 'advanced' ? 14 : newMastery === 'proficient' ? 7 : 3
    const nextReviewDue = new Date()
    nextReviewDue.setDate(nextReviewDue.getDate() + masteryMultiplier)

    await supabaseClient
      .from('user_skills')
      .update({
        skill_level: newSkillLevel,
        confidence_interval: newConfidence,
        attempts_count: attempts,
        mastery_level: newMastery,
        last_practiced: new Date().toISOString(),
        next_review_due: nextReviewDue.toISOString()
      })
      .eq('user_id', user_id)
      .eq('topic_id', topic_id)
  } else {
    // Create new skill record
    newSkillLevel = isCorrect ? 0.6 : 0.4
    const nextReviewDue = new Date()
    nextReviewDue.setDate(nextReviewDue.getDate() + 3) // New topics review in 3 days
    
    await supabaseClient
      .from('user_skills')
      .insert({
        user_id,
        topic_id,
        skill_level: newSkillLevel,
        attempts_count: 1,
        mastery_level: newSkillLevel >= 0.6 ? 'developing' : 'novice',
        last_practiced: new Date().toISOString(),
        next_review_due: nextReviewDue.toISOString()
      })
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateSkillModel(supabaseClient: any, data: any) {
  const { user_id, topic_id, performance_data } = data
  
  if (!user_id || !topic_id || !performance_data) {
    throw new Error('Missing required parameters')
  }

  const { isCorrect, difficulty = 5, timeTaken = 60 } = performance_data
  
  await updateUserSkillLevel(
    supabaseClient, 
    user_id, 
    topic_id, 
    isCorrect, 
    difficulty, 
    timeTaken
  )
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getTopicRecommendations(supabaseClient: any, user_id: string, user_level: string) {
  // Get user's current skills
  const { data: userSkills } = await supabaseClient
    .from('user_skills')
    .select('*, grammar_topics(*)')
    .eq('user_id', user_id)

  // Get all topics for user's level
  const { data: allTopics } = await supabaseClient
    .from('grammar_topics')
    .select('*')
    .eq('level', user_level)
    .order('difficulty_score')

  // Algorithm to recommend topics
  const recommendations = allTopics?.map(topic => {
    const userSkill = userSkills?.find(skill => skill.topic_id === topic.id)
    const skillLevel = userSkill?.skill_level || 0
    
    let priority = 'normal'
    let reason = 'Continue learning'
    
    if (!userSkill) {
      priority = 'high'
      reason = 'New topic to explore'
    } else if (skillLevel < 0.4) {
      priority = 'high'
      reason = 'Needs improvement'
    } else if (skillLevel > 0.8) {
      priority = 'low'
      reason = 'Strong performance - review occasionally'
    }
    
    return {
      ...topic,
      skill_level: skillLevel,
      mastery_level: userSkill?.mastery_level || 'novice',
      priority,
      reason,
      recommended: priority === 'high'
    }
  }).sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    return a.difficulty_score - b.difficulty_score
  })

  return new Response(
    JSON.stringify({ recommendations: recommendations?.slice(0, 10) || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}