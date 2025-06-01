
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

    const { action, count = 200, level = 'mixed' } = await req.json()

    if (action === 'generate_questions') {
      // First, check current question distribution
      const { data: currentDistribution } = await supabaseClient
        .from('test_questions')
        .select('level')
        .not('level', 'is', null)

      const levelCounts = currentDistribution?.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {}) || {};

      console.log('Current question distribution:', levelCounts);

      // Define target distribution - prioritize underrepresented levels
      const minQuestionsPerLevel = 50;
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const levelsNeedingQuestions = levels.filter(level => (levelCounts[level] || 0) < minQuestionsPerLevel);
      
      console.log('Levels needing more questions:', levelsNeedingQuestions);

      // Calculate questions to generate per level
      let questionsPerLevel: Record<string, number> = {};
      
      if (levelsNeedingQuestions.length > 0) {
        // Prioritize underrepresented levels
        const questionsForNeededLevels = Math.floor(count * 0.8); // 80% for needed levels
        const questionsForOtherLevels = count - questionsForNeededLevels;
        
        levelsNeedingQuestions.forEach(level => {
          const needed = minQuestionsPerLevel - (levelCounts[level] || 0);
          questionsPerLevel[level] = Math.min(needed, Math.floor(questionsForNeededLevels / levelsNeedingQuestions.length));
        });
        
        // Distribute remaining questions
        const remainingQuestions = count - Object.values(questionsPerLevel).reduce((sum, count) => sum + count, 0);
        if (remainingQuestions > 0) {
          const remainingPerLevel = Math.floor(remainingQuestions / levels.length);
          levels.forEach(level => {
            questionsPerLevel[level] = (questionsPerLevel[level] || 0) + remainingPerLevel;
          });
        }
      } else {
        // Balanced distribution
        const basePerLevel = Math.floor(count / levels.length);
        const remainder = count % levels.length;
        
        levels.forEach((level, index) => {
          questionsPerLevel[level] = basePerLevel + (index < remainder ? 1 : 0);
        });
      }

      console.log('Planned question generation:', questionsPerLevel);

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
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      option: { type: "string" },
                      explanation: { type: "string" }
                    },
                    required: ["option", "explanation"],
                    additionalProperties: false
                  }
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

      let allQuestions: any[] = [];

      // Generate questions for each level
      for (const [currentLevel, questionsForThisLevel] of Object.entries(questionsPerLevel)) {
        if (questionsForThisLevel === 0) continue;
        
        console.log(`Generating ${questionsForThisLevel} questions for level ${currentLevel}`);

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
6. Wrong answer explanations for each incorrect option (as an array of objects with option and explanation)
7. Appropriate difficulty score (1-100)
8. Relevant topic tags

Focus on these grammar topics: tenses, conditionals, passive voice, reported speech, modal verbs, articles, prepositions, relative clauses, sentence structure, word formation.

Ensure questions test practical language use, not just theoretical knowledge.

CRITICAL: ALL questions must be exactly ${currentLevel} level. Do not generate questions for other levels.

For ${currentLevel} level:
${currentLevel === 'A1' ? '- Basic present/past tense, simple vocabulary, basic sentence structure' : ''}
${currentLevel === 'A2' ? '- Present perfect, future tense, basic conditionals, everyday vocabulary' : ''}
${currentLevel === 'B1' ? '- Complex tenses, intermediate conditionals, passive voice basics, wider vocabulary' : ''}
${currentLevel === 'B2' ? '- Advanced conditionals, complex passive voice, reported speech, sophisticated vocabulary' : ''}
${currentLevel === 'C1' ? '- Nuanced grammar, advanced vocabulary, complex sentence structures, subtle distinctions' : ''}
${currentLevel === 'C2' ? '- Expert-level grammar, sophisticated vocabulary, native-like distinctions, literary language' : ''}`
              },
              {
                role: 'user',
                content: `Generate exactly ${questionsForThisLevel} English assessment questions for ${currentLevel} level ONLY. Each question must have exactly 4 options with one correct answer. All questions MUST be ${currentLevel} level difficulty.`
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
          console.error(`OpenAI API error for level ${currentLevel}:`, errorData);
          throw new Error(`OpenAI API error for level ${currentLevel}: ${openAIResponse.statusText} - ${JSON.stringify(errorData)}`);
        }

        const aiData = await openAIResponse.json();
        
        if (aiData.choices[0].message.refusal) {
          console.error(`OpenAI refused the request for level ${currentLevel}:`, aiData.choices[0].message.refusal);
          throw new Error(`OpenAI refused the request for level ${currentLevel}: ${aiData.choices[0].message.refusal}`);
        }

        if (!aiData.choices[0].message.content) {
          console.error(`No content received from OpenAI for level ${currentLevel}`);
          throw new Error(`No content received from OpenAI for level ${currentLevel}`);
        }

        const questionsData = JSON.parse(aiData.choices[0].message.content);
        allQuestions = allQuestions.concat(questionsData.questions);
        
        console.log(`Successfully generated ${questionsData.questions.length} questions for level ${currentLevel}`);
      }
      
      console.log(`Total questions generated: ${allQuestions.length}`);
      
      // Transform wrong_answer_explanations from array to object format for database
      const transformedQuestions = allQuestions.map((q: any) => {
        const wrongAnswerExplanationsObj: Record<string, string> = {};
        q.wrong_answer_explanations.forEach((item: any) => {
          wrongAnswerExplanationsObj[item.option] = item.explanation;
        });
        
        return {
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          topic: q.topic,
          level: q.level,
          explanation: q.explanation,
          detailed_explanation: q.detailed_explanation,
          first_principles_explanation: q.first_principles_explanation,
          wrong_answer_explanations: wrongAnswerExplanationsObj,
          difficulty_score: q.difficulty_score,
          topic_tags: q.topic_tags,
          question_type: q.question_type
        };
      });
      
      // Insert questions into database
      const { data: insertedQuestions, error: insertError } = await supabaseClient
        .from('test_questions')
        .insert(transformedQuestions)
        .select()

      if (insertError) {
        console.error('Questions insertion error:', insertError);
        throw new Error(`Failed to store questions: ${insertError.message}`);
      }

      console.log('Successfully inserted questions into database:', insertedQuestions?.length);

      // Log level distribution
      const finalLevelCounts = insertedQuestions?.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {});
      console.log('Generated level distribution:', finalLevelCounts);

      // Get updated total distribution
      const { data: updatedDistribution } = await supabaseClient
        .from('test_questions')
        .select('level')
        .not('level', 'is', null)

      const updatedLevelCounts = updatedDistribution?.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {}) || {};

      console.log('Updated total database distribution:', updatedLevelCounts);

      return new Response(
        JSON.stringify({ 
          success: true,
          questionsGenerated: allQuestions.length,
          levelDistribution: finalLevelCounts,
          totalDatabaseDistribution: updatedLevelCounts,
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
