
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
      // Generate questions using OpenAI
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
6. Wrong answer explanations for each incorrect option
7. Appropriate difficulty score (1-100)
8. Relevant topic tags

Focus on these grammar topics: tenses, conditionals, passive voice, reported speech, modal verbs, articles, prepositions, relative clauses, sentence structure, word formation.

Ensure questions test practical language use, not just theoretical knowledge.

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks.`
            },
            {
              role: 'user',
              content: `Generate ${count} English assessment questions for ${level} level. Return as JSON with this exact structure:
              {
                "questions": [
                  {
                    "question": "Complete the sentence: If I _____ you yesterday, I would have told you the news.",
                    "options": ["saw", "had seen", "have seen", "see"],
                    "correct_answer": "had seen",
                    "topic": "Third Conditional",
                    "level": "${level}",
                    "explanation": "Third conditional uses 'had + past participle' in the if-clause for unreal past situations.",
                    "detailed_explanation": "The third conditional describes hypothetical situations in the past. The structure is: If + past perfect, would have + past participle. Here 'had seen' indicates the past perfect form needed for the condition that didn't happen.",
                    "first_principles_explanation": "English conditionals express different degrees of reality and time. The third conditional specifically deals with counterfactual past events - things that didn't happen but we imagine their consequences. The past perfect (had + past participle) signals this unreality in past time, creating a logical framework for expressing regret, missed opportunities, or alternative histories.",
                    "wrong_answer_explanations": {
                      "saw": "Simple past 'saw' would be used in first conditional (present real situations), not third conditional (past unreal).",
                      "have seen": "Present perfect 'have seen' doesn't fit the third conditional structure which requires past perfect.",
                      "see": "Base form 'see' is incorrect here as it doesn't establish the past timeframe needed for third conditional."
                    },
                    "difficulty_score": 75,
                    "topic_tags": ["conditionals", "past_perfect", "hypothetical_situations"],
                    "question_type": "multiple_choice"
                  }
                ]
              }`
            }
          ],
          temperature: 0.3
        })
      });

      if (!openAIResponse.ok) {
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
      }

      const aiData = await openAIResponse.json();
      let aiContent = aiData.choices[0].message.content;
      
      console.log('Raw AI response:', aiContent);
      
      // Clean the response to remove markdown code blocks if present
      if (aiContent.includes('```json')) {
        aiContent = aiContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      // Remove any leading/trailing whitespace
      aiContent = aiContent.trim();
      
      console.log('Cleaned AI response:', aiContent);
      
      let questionsData;
      try {
        questionsData = JSON.parse(aiContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Content that failed to parse:', aiContent);
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
      }
      
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
