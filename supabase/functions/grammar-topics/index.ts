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

    // Read request body once and destructure all possible parameters
    const { action, level, category, topic_id } = await req.json()

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
    console.error('Error in grammar-topics function:', error);
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
  try {
    // Get topic details
    const { data: topic } = await supabaseClient
      .from('grammar_topics')
      .select('*')
      .eq('id', topicId)
      .single()

    if (!topic) {
      throw new Error('Topic not found');
    }

    console.log('Generating exercises for topic:', topic.name);

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
            content: 'You are an expert English grammar exercise creator. Always ensure each exercise has a valid correct_answer field.'
          },
          {
            role: 'user',
            content: `Create 5 exercises for the topic: ${topic.name} (${topic.level})
            Include different types (multiple-choice, fill-blank, transformation).
            IMPORTANT: Always include a correct_answer field (snake_case) with a non-empty string value.
            Format as JSON array with:
            {
              type: exercise type,
              content: {
                question: text,
                options: [] (for multiple-choice),
                correct_answer: string (REQUIRED - never empty, use snake_case),
                explanation: string
              },
              difficulty_level: 1-10
            }`
          }
        ]
      })
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiData = await openAIResponse.json()
    let exercises = JSON.parse(aiData.choices[0].message.content)

    console.log('Raw AI exercises:', JSON.stringify(exercises, null, 2));

    // Enhanced validation and filtering with support for both field names
    exercises = exercises.filter((exercise, index) => {
      console.log(`Validating exercise ${index}:`, exercise);
      
      // Check if exercise has all required properties
      if (!exercise || typeof exercise !== 'object') {
        console.log(`Exercise ${index} failed: not an object`);
        return false;
      }
      
      if (!exercise.type || typeof exercise.type !== 'string') {
        console.log(`Exercise ${index} failed: invalid type`);
        return false;
      }
      
      if (!exercise.content || typeof exercise.content !== 'object') {
        console.log(`Exercise ${index} failed: invalid content`);
        return false;
      }
      
      if (!exercise.difficulty_level || typeof exercise.difficulty_level !== 'number') {
        console.log(`Exercise ${index} failed: invalid difficulty_level`);
        return false;
      }

      // Validate content object
      const content = exercise.content;
      if (!content.question || typeof content.question !== 'string') {
        console.log(`Exercise ${index} failed: invalid question`);
        return false;
      }

      // Critical: Ensure correct_answer exists and is a non-empty string
      // Support both correct_answer and correctAnswer for compatibility
      let correctAnswer = content.correct_answer || content.correctAnswer;
      if (!correctAnswer || typeof correctAnswer !== 'string' || correctAnswer.trim() === '') {
        console.log(`Exercise ${index} failed: missing or invalid correct_answer`);
        return false;
      }

      // Validate options array for multiple-choice
      if (exercise.type.toLowerCase().includes('multiple') || exercise.type.toLowerCase().includes('choice')) {
        if (!Array.isArray(content.options) || content.options.length === 0) {
          console.log(`Exercise ${index} failed: invalid options for multiple choice`);
          return false;
        }
      }

      console.log(`Exercise ${index} passed validation`);
      return true;
    });

    console.log(`Filtered to ${exercises.length} valid exercises`);

    if (exercises.length === 0) {
      throw new Error('No valid exercises were generated');
    }

    // Transform and insert valid exercises into database with consistent field naming
    const exercisesToInsert = exercises.map(ex => {
      // Ensure correct_answer is properly mapped and use snake_case
      const correctAnswer = ex.content.correct_answer || ex.content.correctAnswer;
      
      return {
        type: ex.type,
        topic_id: topicId,
        difficulty_level: ex.difficulty_level,
        content: {
          question: ex.content.question,
          options: ex.content.options || [],
          correct_answer: correctAnswer, // Use snake_case to match database
          explanation: ex.content.explanation || 'No explanation provided'
        }
      };
    });

    console.log('Exercises to insert:', JSON.stringify(exercisesToInsert, null, 2));

    const { data, error } = await supabaseClient
      .from('exercises')
      .insert(exercisesToInsert)
      .select()

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Successfully inserted exercises:', data);
    return data;
  } catch (error) {
    console.error('Error in generateExercises:', error);
    throw error;
  }
}
