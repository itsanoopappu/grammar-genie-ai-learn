
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CEF Level Frameworks and Criteria
const CEF_LEVEL_CRITERIA = {
  'A1': {
    description: 'Can understand and use familiar everyday expressions and very basic phrases aimed at the satisfaction of needs of a concrete type.',
    grammar: ['Present simple', 'Basic articles (a/an/the)', 'Personal pronouns', 'Possessive adjectives', 'Basic prepositions of place/time', 'Simple questions with do/does'],
    vocabulary: ['Basic personal information', 'Family members', 'Numbers 1-100', 'Days/months', 'Basic food/drinks', 'Common objects'],
    complexity: 'Very simple sentences, basic word order, present tense focus',
    difficulty_range: [10, 25]
  },
  'A2': {
    description: 'Can understand sentences and frequently used expressions related to areas of most immediate relevance.',
    grammar: ['Past simple', 'Future with going to', 'Present continuous', 'Comparative adjectives', 'Can/could for ability', 'Some/any'],
    vocabulary: ['Shopping', 'Local geography', 'Employment', 'Travel basics', 'Health and body', 'Hobbies'],
    complexity: 'Simple connected sentences, basic time references, familiar topics',
    difficulty_range: [25, 40]
  },
  'B1': {
    description: 'Can understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure.',
    grammar: ['Present perfect', 'First conditional', 'Passive voice basics', 'Relative clauses (who/which)', 'Modal verbs (should/must)', 'Used to'],
    vocabulary: ['Abstract concepts', 'Work and career', 'Education', 'Technology basics', 'Environment', 'Social issues'],
    complexity: 'Connected discourse, expressing opinions, some complex structures',
    difficulty_range: [40, 60]
  },
  'B2': {
    description: 'Can understand the main ideas of complex text on both concrete and abstract topics, including technical discussions.',
    grammar: ['Second/third conditionals', 'Advanced passive voice', 'Reported speech', 'Mixed conditionals', 'Perfect modals', 'Advanced relative clauses'],
    vocabulary: ['Professional terminology', 'Academic language', 'Complex emotions', 'Cultural topics', 'Science and technology', 'Politics and society'],
    complexity: 'Complex argumentation, nuanced meaning, sophisticated structures',
    difficulty_range: [60, 80]
  },
  'C1': {
    description: 'Can understand a wide range of demanding, longer texts, and recognise implicit meaning.',
    grammar: ['Mixed conditionals', 'Inversion', 'Cleft sentences', 'Advanced participle clauses', 'Subjunctive mood', 'Complex noun phrases'],
    vocabulary: ['Idiomatic expressions', 'Professional jargon', 'Literary language', 'Academic discourse', 'Specialized terminology'],
    complexity: 'Sophisticated expression, implicit meaning, cultural nuances',
    difficulty_range: [80, 95]
  },
  'C2': {
    description: 'Can understand with ease virtually everything heard or read, express themselves spontaneously with precision.',
    grammar: ['All advanced structures', 'Subtle meaning distinctions', 'Register variation', 'Complex embedded clauses', 'Advanced discourse markers'],
    vocabulary: ['Near-native fluency', 'Literary and poetic language', 'Highly specialized terms', 'Cultural references', 'Nuanced expressions'],
    complexity: 'Native-like precision, subtle distinctions, sophisticated style',
    difficulty_range: [95, 100]
  }
};

// Question type templates for variety
const QUESTION_TYPES = [
  'grammar_identification',
  'error_correction', 
  'sentence_completion',
  'transformation',
  'multiple_choice_comprehension',
  'context_based_usage',
  'collocation_selection',
  'register_appropriateness'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, count = 30, level = 'mixed' } = await req.json()

    if (action === 'generate_questions') {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const questionsPerLevel = 5;

      console.log(`Starting enhanced question generation with duplicate prevention and quality assurance`);

      // Phase 1: Analyze existing content for duplicate prevention
      const { data: existingQuestions } = await supabaseClient
        .from('test_questions')
        .select('question, topic, level, difficulty_score')

      const existingContent = existingQuestions || [];
      console.log(`Analyzing ${existingContent.length} existing questions for duplicate prevention`);

      // Phase 2: Analyze topic distribution per level
      const topicDistribution = existingContent.reduce((acc: any, q: any) => {
        if (!acc[q.level]) acc[q.level] = {};
        if (!acc[q.level][q.topic]) acc[q.level][q.topic] = 0;
        acc[q.level][q.topic]++;
        return acc;
      }, {});

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
                "question", "options", "correct_answer", "topic", "level",
                "explanation", "detailed_explanation", "first_principles_explanation",
                "wrong_answer_explanations", "difficulty_score", "topic_tags", "question_type"
              ],
              additionalProperties: false
            }
          }
        },
        required: ["questions"],
        additionalProperties: false
      }

      let allQuestions: any[] = [];

      // Phase 3: Generate questions for each level with enhanced quality controls
      for (const currentLevel of levels) {
        console.log(`Generating enhanced questions for CEF level ${currentLevel}`);
        
        const levelCriteria = CEF_LEVEL_CRITERIA[currentLevel as keyof typeof CEF_LEVEL_CRITERIA];
        const existingTopicsForLevel = Object.keys(topicDistribution[currentLevel] || {});
        const leastUsedTopics = levelCriteria.grammar.filter(topic => 
          !existingTopicsForLevel.includes(topic) || 
          (topicDistribution[currentLevel]?.[topic] || 0) < 3
        );

        // Create comprehensive prompt with CEF criteria
        const enhancedSystemPrompt = `You are an expert English language assessment creator specializing in CEF (Common European Framework) levels. 

CRITICAL CEF LEVEL ${currentLevel} SPECIFICATIONS:
${levelCriteria.description}

REQUIRED GRAMMAR FOCUS: ${levelCriteria.grammar.join(', ')}
VOCABULARY DOMAINS: ${levelCriteria.vocabulary.join(', ')}
COMPLEXITY LEVEL: ${levelCriteria.complexity}
DIFFICULTY SCORE RANGE: ${levelCriteria.difficulty_range[0]}-${levelCriteria.difficulty_range[1]}

PRIORITY TOPICS (underrepresented): ${leastUsedTopics.slice(0, 3).join(', ')}

EXISTING CONTENT ANALYSIS:
- Total existing questions for ${currentLevel}: ${existingContent.filter(q => q.level === currentLevel).length}
- Avoid these overused topics: ${existingTopicsForLevel.slice(0, 5).join(', ')}

QUALITY REQUIREMENTS:
1. Each question must test authentic ${currentLevel}-level competency
2. Distractors must be plausible but clearly incorrect for ${currentLevel} learners
3. Questions must reflect real-world language use contexts
4. Avoid academic/artificial language constructions
5. Ensure cultural neutrality and accessibility

VARIETY REQUIREMENTS:
1. Use different question types: ${QUESTION_TYPES.slice(0, 4).join(', ')}
2. Vary sentence length and complexity within ${currentLevel} parameters
3. Include different contexts (work, social, academic, personal)
4. Test both receptive and productive knowledge

DUPLICATE PREVENTION:
- Questions must be completely original and unique
- Avoid similar sentence structures to existing content
- Use fresh vocabulary combinations
- Create novel contexts and scenarios

Each question MUST include:
- Comprehensive explanation (why the answer is correct)
- Detailed grammatical/linguistic analysis
- First principles explanation (underlying language rule)
- Specific explanations for why each wrong answer is incorrect
- Accurate difficulty score within the specified range
- Relevant topic tags for categorization`;

        const userPrompt = `Generate exactly ${questionsPerLevel} completely original English assessment questions for CEF level ${currentLevel}.

STRICT REQUIREMENTS:
- ALL questions must be exactly ${currentLevel} level difficulty
- Focus on underrepresented topics: ${leastUsedTopics.slice(0, 3).join(', ')}
- Use realistic, communicative contexts
- Ensure each question tests genuine ${currentLevel} competency
- Questions must be completely unique and original
- Include varied question types and formats
- Difficulty scores must be within ${levelCriteria.difficulty_range[0]}-${levelCriteria.difficulty_range[1]} range`;

        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: enhancedSystemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "cef_assessment_questions",
                strict: true,
                schema: questionsSchema
              }
            },
            temperature: 0.7 // Increased for more variety
          })
        });

        if (!openAIResponse.ok) {
          const errorData = await openAIResponse.json();
          console.error(`OpenAI API error for level ${currentLevel}:`, errorData);
          throw new Error(`OpenAI API error for level ${currentLevel}: ${openAIResponse.statusText}`);
        }

        const aiData = await openAIResponse.json();
        
        if (aiData.choices[0].message.refusal) {
          console.error(`OpenAI refused the request for level ${currentLevel}:`, aiData.choices[0].message.refusal);
          throw new Error(`OpenAI refused the request for level ${currentLevel}`);
        }

        if (!aiData.choices[0].message.content) {
          console.error(`No content received from OpenAI for level ${currentLevel}`);
          throw new Error(`No content received from OpenAI for level ${currentLevel}`);
        }

        const questionsData = JSON.parse(aiData.choices[0].message.content);
        
        // Phase 4: Quality validation and duplicate checking
        const validatedQuestions = [];
        for (const question of questionsData.questions) {
          // Validate level consistency
          if (question.level !== currentLevel) {
            console.warn(`Question level mismatch: expected ${currentLevel}, got ${question.level}`);
            continue;
          }

          // Validate difficulty score range
          if (question.difficulty_score < levelCriteria.difficulty_range[0] || 
              question.difficulty_score > levelCriteria.difficulty_range[1]) {
            console.warn(`Difficulty score ${question.difficulty_score} outside range for ${currentLevel}`);
            question.difficulty_score = Math.max(levelCriteria.difficulty_range[0], 
              Math.min(levelCriteria.difficulty_range[1], question.difficulty_score));
          }

          // Basic duplicate check (simple string similarity)
          const isDuplicate = existingContent.some(existing => 
            existing.question.toLowerCase().includes(question.question.toLowerCase().substring(0, 20)) ||
            question.question.toLowerCase().includes(existing.question.toLowerCase().substring(0, 20))
          );

          if (!isDuplicate) {
            validatedQuestions.push(question);
          } else {
            console.warn(`Potential duplicate detected, skipping question`);
          }
        }

        allQuestions = allQuestions.concat(validatedQuestions);
        console.log(`Successfully generated and validated ${validatedQuestions.length} questions for level ${currentLevel}`);
      }
      
      console.log(`Total enhanced questions generated: ${allQuestions.length}`);
      
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
      
      // Insert enhanced questions into database
      const { data: insertedQuestions, error: insertError } = await supabaseClient
        .from('test_questions')
        .insert(transformedQuestions)
        .select()

      if (insertError) {
        console.error('Enhanced questions insertion error:', insertError);
        throw new Error(`Failed to store enhanced questions: ${insertError.message}`);
      }

      console.log('Successfully inserted enhanced CEF-compliant questions:', insertedQuestions?.length);

      // Generate quality report
      const finalLevelCounts = insertedQuestions?.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {});

      const topicVariety = insertedQuestions?.reduce((acc: any, q: any) => {
        if (!acc[q.level]) acc[q.level] = new Set();
        acc[q.level].add(q.topic);
        return acc;
      }, {});

      const varietyReport = Object.keys(topicVariety || {}).reduce((acc: any, level) => {
        acc[level] = topicVariety[level].size;
        return acc;
      }, {});

      console.log('Enhanced generation completed - Level distribution:', finalLevelCounts);
      console.log('Topic variety per level:', varietyReport);

      // Get updated total distribution
      const { data: updatedDistribution } = await supabaseClient
        .from('test_questions')
        .select('level')
        .not('level', 'is', null)

      const updatedLevelCounts = updatedDistribution?.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {}) || {};

      return new Response(
        JSON.stringify({ 
          success: true,
          questionsGenerated: allQuestions.length,
          levelDistribution: finalLevelCounts,
          topicVarietyPerLevel: varietyReport,
          qualityEnhancements: [
            'CEF level compliance verified',
            'Duplicate prevention implemented', 
            'Topic variety optimization',
            'Difficulty score calibration',
            'Quality validation applied'
          ],
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
    console.error('Enhanced question generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate enhanced CEF-compliant questions. Please check your OpenAI API key and try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
