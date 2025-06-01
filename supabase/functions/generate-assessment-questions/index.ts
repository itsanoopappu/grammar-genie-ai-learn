
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, count = 50, level = 'A2' } = await req.json()

    if (action === 'generate_questions') {
      // Define the corrected JSON schema for structured outputs
      const questionsSchema = {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 4,
                  maxItems: 4
                },
                correct_answer: { type: "string" },
                topic: { type: "string" },
                level: { type: "string" },
                explanation: { type: "string" },
                detailed_explanation: { type: "string" },
                first_principles_explanation: { type: "string" },
                wrong_answer_explanations: {
                  type: "object",
                  additionalProperties: { type: "string" }
                },
                difficulty_score: {
                  type: "integer",
                  minimum: 1,
                  maximum: 100
                },
                topic_tags: {
                  type: "array",
                  items: { type: "string" }
                },
                question_type: { type: "string" }
              },
              required: [
                "question", 
                "options", 
                "correct_answer", 
                "topic", 
                "level",
                "explanation", 
                "detailed_explanation", 
                "first_principles_explanation",
                "wrong_answer_explanations", 
                "difficulty_score", 
                "topic_tags", 
                "question_type"
              ],
              additionalProperties: false
            }
          }
        },
        required: ["questions"],
        additionalProperties: false
      }

      console.log('Generating questions with OpenAI Structured Outputs...')

      // Generate questions using OpenAI with Structured Outputs
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
              content: `You are an expert English language assessment creator. Generate high-quality English grammar and language assessment questions with comprehensive explanations using first principles.

Each question should have:
1. Clear, unambiguous question text
2. Four plausible options (one correct, three distractors)
3. Brief explanation for the correct answer
4. Detailed explanation covering the grammatical rule/principle
5. First principles explanation connecting to fundamental language concepts
6. Wrong answer explanations for each incorrect option (as an object with option text as keys)
7. Appropriate difficulty score (1-100)
8. Relevant topic tags

Focus on these grammar topics: tenses, conditionals, passive voice, reported speech, modal verbs, articles, prepositions, relative clauses, sentence structure, word formation.

Ensure questions test practical language use, not just theoretical knowledge.`
            },
            {
              role: 'user',
              content: `Generate ${count} English assessment questions for ${level} level. Each question must have exactly 4 options with one correct answer.`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "assessment_questions",
              strict: true,
              schema: questionsSchema
            }
          },
          temperature: 0.3
        })
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${openAIResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      const aiData = await openAIResponse.json();
      console.log('OpenAI response received:', aiData);
      
      // Handle potential refusals or errors
      if (aiData.choices[0].message.refusal) {
        console.error('OpenAI refused the request:', aiData.choices[0].message.refusal);
        throw new Error(`OpenAI refused the request: ${aiData.choices[0].message.refusal}`);
      }

      if (!aiData.choices[0].message.content) {
        console.error('No content received from OpenAI');
        throw new Error('No content received from OpenAI');
      }

      // With structured outputs, the content is guaranteed to be valid JSON
      const questionsData = JSON.parse(aiData.choices[0].message.content);
      
      console.log('Successfully parsed questions:', questionsData.questions.length);
      
      // Insert questions into database
      const { data: insertedQuestions, error: insertError } = await supabaseClient
        .from('test_questions')
        .insert(
          questionsData.questions.map((q: any) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            topic: q.topic,
            level: q.level,
            explanation: q.explanation,
            detailed_explanation: q.detailed_explanation,
            first_principles_explanation: q.first_principles_explanation,
            wrong_answer_explanations: q.wrong_answer_explanations,
            difficulty_score: q.difficulty_score,
            topic_tags: q.topic_tags,
            question_type: q.question_type
          }))
        )
        .select()

      if (insertError) {
        console.error('Questions insertion error:', insertError);
        throw new Error(`Failed to store questions: ${insertError.message}`);
      }

      console.log('Successfully inserted questions into database:', insertedQuestions?.length);

      return new Response(
        JSON.stringify({ 
          success: true,
          questionsGenerated: questionsData.questions.length,
          questions: insertedQuestions
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Generate questions error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate questions. Please check your OpenAI API key and try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
