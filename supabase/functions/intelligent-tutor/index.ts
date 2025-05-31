
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

    const { action, user_id, topic_id, user_level, difficulty_preference, session_id } = await req.json()

    switch (action) {
      case 'get_personalized_exercises':
        return await getPersonalizedExercises(supabaseClient, user_id, topic_id, user_level)
      
      case 'evaluate_exercise':
        return await evaluateExercise(supabaseClient, req.json())
      
      case 'get_topic_recommendations':
        return await getTopicRecommendations(supabaseClient, user_id, user_level)
      
      case 'create_learning_path':
        return await createLearningPath(supabaseClient, user_id, user_level)
      
      case 'update_skill_model':
        return await updateSkillModel(supabaseClient, req.json())
      
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
    .select('skill_level, attempts_count, mastery_level')
    .eq('user_id', user_id)
    .eq('topic_id', topic_id)
    .single()

  // Calculate optimal difficulty based on skill level
  const skillLevel = userSkill?.skill_level || 0.5
  const targetDifficulty = Math.max(1, Math.min(10, Math.round(skillLevel * 10) + (Math.random() - 0.5)))

  // Get existing exercises for this topic and difficulty
  let { data: exercises } = await supabaseClient
    .from('exercises')
    .select('*')
    .eq('topic_id', topic_id)
    .gte('difficulty_level', targetDifficulty - 1)
    .lte('difficulty_level', targetDifficulty + 1)
    .limit(5)

  // If no exercises exist, generate them using AI
  if (!exercises || exercises.length === 0) {
    exercises = await generateExercisesForTopic(supabaseClient, topic_id, targetDifficulty, user_level)
  }

  // Create or update practice session
  const { data: session } = await supabaseClient
    .from('practice_sessions')
    .insert({
      user_id,
      topic_id,
      session_type: 'practice',
      difficulty_progression: [targetDifficulty]
    })
    .select()
    .single()

  return new Response(
    JSON.stringify({ 
      exercises: exercises.slice(0, 3), 
      session_id: session.id,
      target_difficulty: targetDifficulty,
      skill_level: skillLevel
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

  // Update user skill model
  await updateUserSkillLevel(supabaseClient, user_id, exercise.topic_id, isCorrect, exercise.difficulty_level)

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

async function updateUserSkillLevel(supabaseClient: any, user_id: string, topic_id: string, isCorrect: boolean, difficulty: number) {
  // Bayesian update of skill level based on performance
  const { data: currentSkill } = await supabaseClient
    .from('user_skills')
    .select('*')
    .eq('user_id', user_id)
    .eq('topic_id', topic_id)
    .single()

  let newSkillLevel, newConfidence, newMastery
  
  if (currentSkill) {
    // Update existing skill
    const currentLevel = currentSkill.skill_level
    const attempts = currentSkill.attempts_count + 1
    
    // Simple Bayesian update
    const evidence = isCorrect ? (difficulty / 10) : -(difficulty / 10) * 0.5
    newSkillLevel = Math.max(0, Math.min(1, currentLevel + evidence * 0.1))
    newConfidence = Math.max(0.1, currentSkill.confidence_interval - 0.01)
    
    // Update mastery level
    if (newSkillLevel >= 0.9) newMastery = 'expert'
    else if (newSkillLevel >= 0.75) newMastery = 'advanced'
    else if (newSkillLevel >= 0.6) newMastery = 'proficient'
    else if (newSkillLevel >= 0.4) newMastery = 'developing'
    else newMastery = 'novice'

    await supabaseClient
      .from('user_skills')
      .update({
        skill_level: newSkillLevel,
        confidence_interval: newConfidence,
        attempts_count: attempts,
        mastery_level: newMastery,
        last_practiced: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .eq('topic_id', topic_id)
  } else {
    // Create new skill record
    newSkillLevel = isCorrect ? 0.6 : 0.4
    await supabaseClient
      .from('user_skills')
      .insert({
        user_id,
        topic_id,
        skill_level: newSkillLevel,
        attempts_count: 1,
        mastery_level: newSkillLevel >= 0.6 ? 'developing' : 'novice',
        last_practiced: new Date().toISOString()
      })
  }
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

async function createLearningPath(supabaseClient: any, user_id: string, user_level: string) {
  // Get user's assessment results to determine strengths/weaknesses
  const { data: latestAssessment } = await supabaseClient
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get recommended topics
  const topicRecs = await getTopicRecommendations(supabaseClient, user_id, user_level)
  const topicsData = await topicRecs.json()
  
  const weakTopics = topicsData.recommendations
    .filter((t: any) => t.priority === 'high')
    .slice(0, 5)
    .map((t: any) => t.id)

  // Create adaptive learning path
  const { data: learningPath } = await supabaseClient
    .from('learning_paths')
    .insert({
      user_id,
      path_type: 'adaptive',
      target_level: user_level,
      recommended_next_topics: weakTopics,
      current_topic_id: weakTopics[0] || null
    })
    .select()
    .single()

  return new Response(
    JSON.stringify({ learning_path: learningPath }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
