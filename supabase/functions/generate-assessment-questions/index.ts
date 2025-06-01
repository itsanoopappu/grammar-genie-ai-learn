
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
    complexity: 'Very simple sentences, present tense focus, basic vocabulary',
    difficulty_range: [10, 25]
  },
  'A2': {
    description: 'Can understand sentences and frequently used expressions related to areas of most immediate relevance.',
    complexity: 'Simple connected sentences, basic time references, familiar topics',
    difficulty_range: [25, 40]
  },
  'B1': {
    description: 'Can understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure.',
    complexity: 'Connected discourse, expressing opinions, some complex structures',
    difficulty_range: [40, 60]
  },
  'B2': {
    description: 'Can understand the main ideas of complex text on both concrete and abstract topics, including technical discussions.',
    complexity: 'Complex argumentation, nuanced meaning, sophisticated structures',
    difficulty_range: [60, 80]
  },
  'C1': {
    description: 'Can understand a wide range of demanding, longer texts, and recognise implicit meaning.',
    complexity: 'Sophisticated expression, implicit meaning, cultural nuances',
    difficulty_range: [80, 95]
  },
  'C2': {
    description: 'Can understand with ease virtually everything heard or read, express themselves spontaneously with precision.',
    complexity: 'Native-like precision, subtle distinctions, sophisticated style',
    difficulty_range: [95, 100]
  }
};

// Comprehensive Topic Database - 200+ diverse topics
const COMPREHENSIVE_TOPICS = {
  'daily_life': [
    'Morning routines', 'Shopping for groceries', 'Cooking dinner', 'House cleaning', 'Personal hygiene',
    'Getting dressed', 'Public transportation', 'Walking the dog', 'Watching television', 'Reading newspapers',
    'Making breakfast', 'Doing laundry', 'Paying bills', 'Taking medicine', 'Sleeping habits',
    'Weekend activities', 'Family dinners', 'Neighborhood walks', 'Home maintenance', 'Garden care'
  ],
  'work_professional': [
    'Job interviews', 'Office meetings', 'Email communication', 'Project deadlines', 'Team collaboration',
    'Performance reviews', 'Business presentations', 'Customer service', 'Workplace conflicts', 'Career development',
    'Remote working', 'Office politics', 'Time management', 'Professional networking', 'Salary negotiations',
    'Training sessions', 'Conference calls', 'Business travel', 'Office equipment', 'Work-life balance'
  ],
  'education_learning': [
    'University lectures', 'Library research', 'Student assignments', 'Exam preparation', 'Classroom discussions',
    'Online courses', 'Study groups', 'Academic writing', 'Laboratory experiments', 'Field trips',
    'Graduation ceremonies', 'Student loans', 'Campus life', 'Professor meetings', 'Academic conferences',
    'Language learning', 'Skill development', 'Educational technology', 'Scholarship applications', 'Academic stress'
  ],
  'health_wellness': [
    'Doctor appointments', 'Exercise routines', 'Healthy eating', 'Mental health', 'Medical procedures',
    'Pharmacy visits', 'Dental care', 'Yoga classes', 'Meditation practices', 'Sleep disorders',
    'Stress management', 'Physical therapy', 'Vision care', 'Preventive medicine', 'Emergency care',
    'Wellness programs', 'Fitness goals', 'Nutrition planning', 'Health insurance', 'Alternative medicine'
  ],
  'travel_transportation': [
    'Airport security', 'Hotel reservations', 'Tourist attractions', 'Cultural experiences', 'Local cuisine',
    'Travel planning', 'Passport procedures', 'Currency exchange', 'Language barriers', 'Transportation tickets',
    'Map navigation', 'Travel insurance', 'Luggage packing', 'Time zone changes', 'Travel photography',
    'Adventure tourism', 'Business trips', 'Family vacations', 'Solo travel', 'Eco-tourism'
  ],
  'technology_digital': [
    'Social media', 'Online shopping', 'Video streaming', 'Digital payments', 'Cybersecurity',
    'Smartphone usage', 'Internet browsing', 'Cloud storage', 'Software updates', 'Digital privacy',
    'Artificial intelligence', 'Virtual reality', 'Online gaming', 'Digital photography', 'E-books',
    'Tech support', 'App development', 'Digital marketing', 'Online banking', 'Tech trends'
  ],
  'entertainment_culture': [
    'Movie theaters', 'Music concerts', 'Art galleries', 'Theater performances', 'Sports events',
    'Television shows', 'Book clubs', 'Music festivals', 'Cultural traditions', 'Local festivals',
    'Celebrity news', 'Fashion trends', 'Dance classes', 'Photography exhibitions', 'Comedy shows',
    'Gaming tournaments', 'Craft workshops', 'Cultural exchange', 'Heritage sites', 'Street art'
  ],
  'environment_nature': [
    'Climate change', 'Recycling programs', 'Wildlife conservation', 'National parks', 'Ocean pollution',
    'Renewable energy', 'Gardening tips', 'Weather patterns', 'Natural disasters', 'Sustainable living',
    'Environmental activism', 'Green technology', 'Organic farming', 'Carbon footprint', 'Biodiversity',
    'Eco-friendly products', 'Water conservation', 'Air quality', 'Forest protection', 'Animal rights'
  ],
  'food_dining': [
    'Restaurant experiences', 'Cooking techniques', 'Food allergies', 'International cuisine', 'Recipe sharing',
    'Food delivery', 'Kitchen equipment', 'Meal planning', 'Dietary restrictions', 'Food safety',
    'Farmers markets', 'Food criticism', 'Culinary traditions', 'Cooking shows', 'Food photography',
    'Wine tasting', 'Street food', 'Food festivals', 'Cooking classes', 'Food waste'
  ],
  'relationships_social': [
    'Making friends', 'Dating experiences', 'Family relationships', 'Marriage ceremonies', 'Conflict resolution',
    'Social gatherings', 'Community events', 'Volunteer work', 'Neighborhood activities', 'Cultural differences',
    'Generational gaps', 'Social etiquette', 'Personal boundaries', 'Friendship maintenance', 'Social anxiety',
    'Group dynamics', 'Communication skills', 'Empathy development', 'Social responsibility', 'Cultural integration'
  ]
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

      console.log(`Starting topic-based question generation with unlimited variety system`);

      // Phase 1: Get or select unused topic
      const selectedTopic = await selectUnusedTopic(supabaseClient);
      console.log(`Selected topic: ${selectedTopic.name} (${selectedTopic.category})`);

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

      // Phase 2: Generate questions for each level with topic-based approach
      for (const currentLevel of levels) {
        console.log(`Generating topic-based questions for CEF level ${currentLevel} on topic: ${selectedTopic.name}`);
        
        const levelCriteria = CEF_LEVEL_CRITERIA[currentLevel as keyof typeof CEF_LEVEL_CRITERIA];

        // Create comprehensive topic-based prompt
        const topicBasedSystemPrompt = `You are an expert English language assessment creator specializing in CEF (Common European Framework) levels. 

CRITICAL CEF LEVEL ${currentLevel} SPECIFICATIONS:
${levelCriteria.description}
COMPLEXITY LEVEL: ${levelCriteria.complexity}
DIFFICULTY SCORE RANGE: ${levelCriteria.difficulty_range[0]}-${levelCriteria.difficulty_range[1]}

TOPIC FOCUS: "${selectedTopic.name}" (Category: ${selectedTopic.category})

TOPIC-BASED GENERATION REQUIREMENTS:
1. ALL questions must be grounded in real-world scenarios related to "${selectedTopic.name}"
2. Create authentic, meaningful contexts that naturally require ${currentLevel}-level English
3. Ensure questions test language skills within the topic domain
4. Use vocabulary and situations appropriate for "${selectedTopic.name}"
5. Make questions feel like genuine communication needs in this topic area

QUALITY REQUIREMENTS:
1. Each question must test authentic ${currentLevel}-level competency within the topic context
2. Distractors must be plausible but clearly incorrect for ${currentLevel} learners
3. Questions must reflect real-world language use in "${selectedTopic.name}" situations
4. Avoid academic/artificial language constructions
5. Ensure cultural neutrality and accessibility

VARIETY REQUIREMENTS:
1. Use different question types: ${QUESTION_TYPES.slice(0, 4).join(', ')}
2. Vary sentence length and complexity within ${currentLevel} parameters
3. Include different sub-contexts within "${selectedTopic.name}"
4. Test both receptive and productive knowledge
5. Create 5 completely unique questions about different aspects of "${selectedTopic.name}"

Each question MUST include:
- Comprehensive explanation (why the answer is correct)
- Detailed grammatical/linguistic analysis
- First principles explanation (underlying language rule)
- Specific explanations for why each wrong answer is incorrect
- Accurate difficulty score within the specified range
- Topic tags including "${selectedTopic.name}" and related terms`;

        const userPrompt = `Generate exactly ${questionsPerLevel} completely original English assessment questions for CEF level ${currentLevel}.

STRICT REQUIREMENTS:
- ALL questions must be exactly ${currentLevel} level difficulty
- Every question must be grounded in real "${selectedTopic.name}" scenarios
- Use realistic, communicative contexts related to "${selectedTopic.name}"
- Ensure each question tests genuine ${currentLevel} competency within this topic
- Questions must be completely unique and contextually different
- Difficulty scores must be within ${levelCriteria.difficulty_range[0]}-${levelCriteria.difficulty_range[1]} range
- Topic must be set to "${selectedTopic.name}" for all questions

CONTEXT EXAMPLES for "${selectedTopic.name}":
Create questions that could realistically occur when someone is dealing with ${selectedTopic.name} situations.
Make each question feel like a genuine language need someone might have in this context.`;

        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: topicBasedSystemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "topic_based_assessment_questions",
                strict: true,
                schema: questionsSchema
              }
            },
            temperature: 0.8 // Higher temperature for more variety within topic
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
        
        // Phase 3: Quality validation
        const validatedQuestions = [];
        for (const question of questionsData.questions) {
          // Validate level consistency
          if (question.level !== currentLevel) {
            console.warn(`Question level mismatch: expected ${currentLevel}, got ${question.level}`);
            question.level = currentLevel;
          }

          // Validate difficulty score range
          if (question.difficulty_score < levelCriteria.difficulty_range[0] || 
              question.difficulty_score > levelCriteria.difficulty_range[1]) {
            console.warn(`Difficulty score ${question.difficulty_score} outside range for ${currentLevel}`);
            question.difficulty_score = Math.max(levelCriteria.difficulty_range[0], 
              Math.min(levelCriteria.difficulty_range[1], question.difficulty_score));
          }

          // Ensure topic consistency
          question.topic = selectedTopic.name;
          
          // Add topic category to tags if not present
          if (!question.topic_tags.includes(selectedTopic.category)) {
            question.topic_tags.push(selectedTopic.category);
          }

          validatedQuestions.push(question);
        }

        allQuestions = allQuestions.concat(validatedQuestions);
        console.log(`Successfully generated ${validatedQuestions.length} topic-based questions for level ${currentLevel}`);
      }
      
      console.log(`Total topic-based questions generated: ${allQuestions.length} for topic: ${selectedTopic.name}`);
      
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
        console.error('Topic-based questions insertion error:', insertError);
        throw new Error(`Failed to store topic-based questions: ${insertError.message}`);
      }

      // Phase 4: Update topic usage tracking
      await updateTopicUsage(supabaseClient, selectedTopic, levels);

      console.log('Successfully inserted topic-based questions:', insertedQuestions?.length);

      // Generate report
      const levelCounts = insertedQuestions?.reduce((acc: any, q: any) => {
        acc[q.level] = (acc[q.level] || 0) + 1;
        return acc;
      }, {});

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
          selectedTopic: selectedTopic,
          levelDistribution: levelCounts,
          topicBasedEnhancements: [
            'Topic-based unlimited variety system implemented',
            'Real-world context grounding for all questions', 
            'Intelligent topic selection and tracking',
            'CEF level appropriateness within topic contexts',
            '5 unique questions per level per topic'
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
    console.error('Topic-based question generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate topic-based questions. Please check your OpenAI API key and try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

// Helper function to select unused topic
async function selectUnusedTopic(supabaseClient: any) {
  // Flatten all topics into a single array with categories
  const allTopics: any[] = [];
  Object.entries(COMPREHENSIVE_TOPICS).forEach(([category, topics]) => {
    topics.forEach(topic => {
      allTopics.push({
        name: topic,
        category: category
      });
    });
  });

  // Get topics that haven't been used recently or have been used least
  const { data: usedTopics } = await supabaseClient
    .from('used_topics')
    .select('topic_name, questions_generated, last_used_at')
    .order('last_used_at', { ascending: true })

  const usedTopicNames = new Set(usedTopics?.map((t: any) => t.topic_name) || []);
  
  // Find unused topics first
  const unusedTopics = allTopics.filter(topic => !usedTopicNames.has(topic.name));
  
  if (unusedTopics.length > 0) {
    // Randomly select from unused topics
    const randomIndex = Math.floor(Math.random() * unusedTopics.length);
    return unusedTopics[randomIndex];
  }
  
  // If all topics have been used, select the least recently used
  const leastUsedTopic = usedTopics?.[0];
  if (leastUsedTopic) {
    const topicData = allTopics.find(t => t.name === leastUsedTopic.topic_name);
    if (topicData) return topicData;
  }
  
  // Fallback: select random topic
  const randomIndex = Math.floor(Math.random() * allTopics.length);
  return allTopics[randomIndex];
}

// Helper function to update topic usage
async function updateTopicUsage(supabaseClient: any, selectedTopic: any, levels: string[]) {
  for (const level of levels) {
    const { error } = await supabaseClient
      .from('used_topics')
      .upsert({
        topic_name: selectedTopic.name,
        topic_category: selectedTopic.category,
        cef_level: level,
        questions_generated: 5, // 5 questions per level
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'topic_name,cef_level'
      });

    if (error) {
      console.error(`Error updating topic usage for ${selectedTopic.name} at ${level}:`, error);
    }
  }
}
