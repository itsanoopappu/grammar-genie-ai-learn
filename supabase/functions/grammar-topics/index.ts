import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    const { action, level, category } = await req.json()

    if (action === 'get_topics') {
      // Get topics from database
      const { data: topics, error } = await supabaseClient
        .from('grammar_topics')
        .select(`
          id,
          name,
          description,
          level,
          category,
          difficulty_score,
          prerequisites,
          learning_objectives,
          common_errors
        `)
        .order('difficulty_score')

      if (error) throw error;

      // If no topics exist, generate them
      if (!topics || topics.length === 0) {
        const generatedTopics = await generateGrammarTopics(supabaseClient);
        return new Response(
          JSON.stringify({ topics: generatedTopics }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ topics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get_exercises') {
      const { topic_id } = await req.json()
      
      // Get exercises for topic
      const { data: exercises, error } = await supabaseClient
        .from('exercises')
        .select('*')
        .eq('topic_id', topic_id)
        .order('difficulty_level')

      if (error) throw error;

      // If no exercises exist, generate them
      if (!exercises || exercises.length === 0) {
        const generatedExercises = await generateExercises(supabaseClient, topic_id);
        return new Response(
          JSON.stringify({ exercises: generatedExercises }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ exercises }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function generateGrammarTopics(supabaseClient) {
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
          content: 'You are an expert English grammar curriculum designer.'
        },
        {
          role: 'user',
          content: `Generate a comprehensive list of English grammar topics for all CEFR levels (A1-C2).
          Format as JSON array with:
          {
            name: topic name,
            description: clear description,
            level: CEFR level,
            category: grammar category,
            difficulty_score: 1-100,
            prerequisites: [],
            learning_objectives: [],
            common_errors: []
          }`
        }
      ]
    })
  })

  const aiData = await openAIResponse.json()
  const topics = JSON.parse(aiData.choices[0].message.content)

  // Insert topics into database
  const { data, error } = await supabaseClient
    .from('grammar_topics')
    .insert(topics)
    .select()

  if (error) throw error
  return data
}

async function generateExercises(supabaseClient, topicId) {
  // Get topic details
  const { data: topic } = await supabaseClient
    .from('grammar_topics')
    .select('*')
    .eq('id', topicId)
    .single()

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
          content: 'You are an expert English grammar exercise creator.'
        },
        {
          role: 'user',
          content: `Create 5 exercises for the topic: ${topic.name} (${topic.level})
          Include different types (multiple-choice, fill-blank, transformation).
          Format as JSON array with:
          {
            type: exercise type,
            content: {
              question: text,
              options: [] (for multiple-choice),
              correct_answer: string,
              explanation: string
            },
            difficulty_level: 1-10
          }`
        }
      ]
    })
  })

  const aiData = await openAIResponse.json()
  const exercises = JSON.parse(aiData.choices[0].message.content)

  // Insert exercises into database
  const { data, error } = await supabaseClient
    .from('exercises')
    .insert(exercises.map(ex => ({
      ...ex,
      topic_id: topicId
    })))
    .select()

  if (error) throw error
  return data
}