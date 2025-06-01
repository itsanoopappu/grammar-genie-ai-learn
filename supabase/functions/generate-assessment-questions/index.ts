
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

// Comprehensive Grammar Topics by Category and CEF Level
const GRAMMAR_TOPICS = {
  'tenses': {
    'A1': ['Present Simple', 'Present Continuous', 'Past Simple'],
    'A2': ['Present Perfect', 'Future with "will"', 'Past Continuous'],
    'B1': ['Present Perfect Continuous', 'Past Perfect', 'Future Perfect'],
    'B2': ['Past Perfect Continuous', 'Future Continuous', 'Mixed Conditionals'],
    'C1': ['Advanced Perfect Aspects', 'Complex Temporal Relations', 'Narrative Tenses'],
    'C2': ['Subtle Tense Distinctions', 'Literary Tenses', 'Archaic Forms']
  },
  'conditionals': {
    'A1': ['Basic "if" statements'],
    'A2': ['First Conditional', 'Zero Conditional'],
    'B1': ['Second Conditional', 'Third Conditional'],
    'B2': ['Mixed Conditionals', 'Unless/Provided clauses'],
    'C1': ['Advanced Conditional Forms', 'Implied Conditionals'],
    'C2': ['Subjunctive Conditionals', 'Archaic Conditional Forms']
  },
  'modals': {
    'A1': ['Can/Cannot', 'Must/Mustn\'t'],
    'A2': ['Should/Shouldn\'t', 'May/Might'],
    'B1': ['Could/Would', 'Have to/Don\'t have to'],
    'B2': ['Modal Perfect Forms', 'Ought to/Used to'],
    'C1': ['Complex Modal Expressions', 'Modal Deduction'],
    'C2': ['Subjunctive Modals', 'Archaic Modal Forms']
  },
  'articles': {
    'A1': ['Definite Article "the"', 'Indefinite Articles "a/an"'],
    'A2': ['Zero Article', 'Articles with Countable/Uncountable'],
    'B1': ['Articles with Proper Nouns', 'Generic References'],
    'B2': ['Articles in Fixed Expressions', 'Cultural Article Usage'],
    'C1': ['Subtle Article Distinctions', 'Stylistic Article Choices'],
    'C2': ['Archaic Article Usage', 'Literary Article Forms']
  },
  'prepositions': {
    'A1': ['Basic Location Prepositions', 'Time Prepositions'],
    'A2': ['Movement Prepositions', 'Phrasal Prepositions'],
    'B1': ['Abstract Prepositions', 'Dependent Prepositions'],
    'B2': ['Complex Prepositional Phrases', 'Idiomatic Prepositions'],
    'C1': ['Subtle Prepositional Meanings', 'Register-specific Prepositions'],
    'C2': ['Archaic Prepositions', 'Literary Prepositional Usage']
  },
  'passive_voice': {
    'A1': ['Basic Passive Present'],
    'A2': ['Passive Past', 'Passive with "by"'],
    'B1': ['Passive Perfect Tenses', 'Passive Modals'],
    'B2': ['Complex Passive Structures', 'Causative Passive'],
    'C1': ['Advanced Passive Forms', 'Impersonal Passive'],
    'C2': ['Archaic Passive Forms', 'Literary Passive Usage']
  },
  'reported_speech': {
    'A1': ['Basic Reported Statements'],
    'A2': ['Reported Questions', 'Time Changes'],
    'B1': ['Reported Commands', 'Mixed Reporting'],
    'B2': ['Complex Reported Speech', 'Reporting Verbs'],
    'C1': ['Subtle Reporting Nuances', 'Literary Reporting'],
    'C2': ['Archaic Reporting Forms', 'Complex Discourse Reporting']
  }
};

// Comprehensive Subject Topics - 200+ diverse topics
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

      console.log(`Starting grammar-subject-CEF combination generation system`);

      // Phase 1: Get or select unused grammar-subject-CEF combination
      const selectedCombination = await selectUnusedGrammarCombination(supabaseClient);
      console.log(`Selected combination: Grammar: ${selectedCombination.grammar_topic} (${selectedCombination.grammar_category}), Subject: ${selectedCombination.subject_topic} (${selectedCombination.subject_category}), Level: ${selectedCombination.cef_level}`);

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
                grammar_topic: { type: "string" },
                grammar_category: { type: "string" },
                subject_category: { type: "string" },
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
                "question", "options", "correct_answer", "topic", "level", "grammar_topic",
                "grammar_category", "subject_category", "explanation", "detailed_explanation", 
                "first_principles_explanation", "wrong_answer_explanations", "difficulty_score", 
                "topic_tags", "question_type"
              ],
              additionalProperties: false
            }
          }
        },
        required: ["questions"],
        additionalProperties: false
      }

      let allQuestions: any[] = [];

      // Phase 2: Generate questions for the selected level with grammar-subject combination
      const currentLevel = selectedCombination.cef_level;
      console.log(`Generating grammar-focused questions for CEF level ${currentLevel}`);
      
      const levelCriteria = CEF_LEVEL_CRITERIA[currentLevel as keyof typeof CEF_LEVEL_CRITERIA];

      // Create comprehensive grammar-subject-based prompt
      const grammarSubjectSystemPrompt = `You are an expert English grammar assessment creator specializing in CEF (Common European Framework) levels with deep grammatical expertise.

CRITICAL CEF LEVEL ${currentLevel} SPECIFICATIONS:
${levelCriteria.description}
COMPLEXITY LEVEL: ${levelCriteria.complexity}
DIFFICULTY SCORE RANGE: ${levelCriteria.difficulty_range[0]}-${levelCriteria.difficulty_range[1]}

MANDATORY GRAMMAR FOCUS: "${selectedCombination.grammar_topic}" (Category: ${selectedCombination.grammar_category})
SUBJECT CONTEXT: "${selectedCombination.subject_topic}" (Category: ${selectedCombination.subject_category})

CRITICAL GRAMMAR-FOCUSED GENERATION REQUIREMENTS:
1. PRIMARY FOCUS: All questions MUST test the specific grammar point "${selectedCombination.grammar_topic}"
2. SECONDARY CONTEXT: Use "${selectedCombination.subject_topic}" as the thematic context for the grammar testing
3. GRAMMAR CENTRALITY: The grammatical aspect must be the core of what's being tested, not the subject knowledge
4. AUTHENTIC INTEGRATION: Seamlessly integrate grammar testing within realistic "${selectedCombination.subject_topic}" scenarios
5. LEVEL APPROPRIATENESS: Ensure grammar complexity matches ${currentLevel} level exactly

QUALITY REQUIREMENTS FOR GRAMMAR TESTING:
1. Each question must have a clear grammatical objective focused on "${selectedCombination.grammar_topic}"
2. Distractors must represent common grammatical errors related to this grammar point
3. Context must feel natural and relevant to "${selectedCombination.subject_topic}"
4. Questions must test functional grammar use, not abstract rules
5. Ensure cultural neutrality while maintaining subject authenticity

GRAMMAR-SUBJECT INTEGRATION EXAMPLES:
- If testing "Present Perfect" with "Travel experiences": Focus on Perfect aspect usage in travel contexts
- If testing "Conditionals" with "Cooking": Focus on conditional structures in recipe/cooking scenarios
- If testing "Passive Voice" with "Technology": Focus on passive construction in tech-related contexts

Each question MUST include:
- Clear grammar focus on "${selectedCombination.grammar_topic}"
- Subject context from "${selectedCombination.subject_topic}"
- Comprehensive grammatical explanation
- Detailed linguistic analysis of the grammar point
- First principles explanation of the grammatical rule
- Specific explanations for why each wrong answer represents a grammatical error
- Accurate difficulty score within the specified range
- Topic tags including both grammar and subject elements`;

      const userPrompt = `Generate exactly ${questionsPerLevel} completely original English grammar assessment questions for CEF level ${currentLevel}.

STRICT REQUIREMENTS:
- ALL questions must focus primarily on testing "${selectedCombination.grammar_topic}" grammar
- Use "${selectedCombination.subject_topic}" as the contextual setting for grammar testing
- Questions must be exactly ${currentLevel} level difficulty for the specific grammar point
- Each question must clearly test understanding of "${selectedCombination.grammar_topic}"
- Distractors must represent realistic grammar errors for this specific point
- Context must be authentic to "${selectedCombination.subject_topic}" scenarios
- Grammar must be the primary testing objective, subject knowledge secondary
- Difficulty scores must be within ${levelCriteria.difficulty_range[0]}-${levelCriteria.difficulty_range[1]} range

GRAMMAR TESTING FOCUS:
Create questions where learners must demonstrate understanding of "${selectedCombination.grammar_topic}" 
within realistic "${selectedCombination.subject_topic}" communication scenarios.
The grammar point should be naturally integrated but clearly the focus of assessment.`;

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: grammarSubjectSystemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "grammar_subject_assessment_questions",
              strict: true,
              schema: questionsSchema
            }
          },
          temperature: 0.7 // Balanced temperature for quality and variety
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
      
      // Phase 3: Quality validation and enhancement
      const validatedQuestions = [];
      for (const question of questionsData.questions) {
        // Validate and set combination data
        question.level = currentLevel;
        question.topic = selectedCombination.subject_topic;
        question.grammar_topic = selectedCombination.grammar_topic;
        question.grammar_category = selectedCombination.grammar_category;
        question.subject_category = selectedCombination.subject_category;

        // Validate difficulty score range
        if (question.difficulty_score < levelCriteria.difficulty_range[0] || 
            question.difficulty_score > levelCriteria.difficulty_range[1]) {
          console.warn(`Difficulty score ${question.difficulty_score} outside range for ${currentLevel}`);
          question.difficulty_score = Math.max(levelCriteria.difficulty_range[0], 
            Math.min(levelCriteria.difficulty_range[1], question.difficulty_score));
        }

        // Enhance topic tags with grammar and subject information
        if (!question.topic_tags.includes(selectedCombination.grammar_category)) {
          question.topic_tags.push(selectedCombination.grammar_category);
        }
        if (!question.topic_tags.includes(selectedCombination.subject_category)) {
          question.topic_tags.push(selectedCombination.subject_category);
        }
        if (!question.topic_tags.includes('grammar-focused')) {
          question.topic_tags.push('grammar-focused');
        }

        validatedQuestions.push(question);
      }

      allQuestions = allQuestions.concat(validatedQuestions);
      console.log(`Successfully generated ${validatedQuestions.length} grammar-focused questions`);
      
      console.log(`Total grammar-subject-CEF questions generated: ${allQuestions.length}`);
      
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
          grammar_topic: q.grammar_topic,
          grammar_category: q.grammar_category,
          subject_category: q.subject_category,
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
        console.error('Grammar-subject questions insertion error:', insertError);
        throw new Error(`Failed to store grammar-subject questions: ${insertError.message}`);
      }

      // Phase 4: Update combination usage tracking
      await updateGrammarCombinationUsage(supabaseClient, selectedCombination);

      console.log('Successfully inserted grammar-subject questions:', insertedQuestions?.length);

      return new Response(
        JSON.stringify({ 
          success: true,
          questionsGenerated: allQuestions.length,
          selectedCombination: selectedCombination,
          grammarSubjectEnhancements: [
            'Grammar-Subject-CEF combination tracking implemented',
            'Primary focus on grammatical competency testing', 
            'Subject context integration for authentic scenarios',
            'Intelligent combination selection and tracking',
            'Quality grammar assessment within subject contexts',
            `${questionsPerLevel} unique grammar-focused questions generated`
          ],
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
    console.error('Grammar-subject question generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate grammar-subject questions. Please check your OpenAI API key and try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

// Helper function to select unused grammar-subject-CEF combination
async function selectUnusedGrammarCombination(supabaseClient: any) {
  // Generate all possible combinations
  const allCombinations: any[] = [];
  
  // Create combinations for each CEF level
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    // Get grammar topics for this level
    for (const [grammarCategory, levelTopics] of Object.entries(GRAMMAR_TOPICS)) {
      const grammarTopicsForLevel = levelTopics[level as keyof typeof levelTopics] || [];
      
      for (const grammarTopic of grammarTopicsForLevel) {
        // Combine with subject topics
        for (const [subjectCategory, subjectTopics] of Object.entries(COMPREHENSIVE_TOPICS)) {
          for (const subjectTopic of subjectTopics) {
            allCombinations.push({
              grammar_topic: grammarTopic,
              grammar_category: grammarCategory,
              subject_topic: subjectTopic,
              subject_category: subjectCategory,
              cef_level: level
            });
          }
        }
      }
    }
  }

  console.log(`Total possible grammar-subject-CEF combinations: ${allCombinations.length}`);

  // Get combinations that haven't been used recently or have been used least
  const { data: usedCombinations } = await supabaseClient
    .from('grammar_topic_combinations')
    .select('grammar_topic, subject_topic, cef_level, questions_generated, last_used_at')
    .order('last_used_at', { ascending: true })

  const usedCombinationKeys = new Set(
    usedCombinations?.map((c: any) => `${c.grammar_topic}|${c.subject_topic}|${c.cef_level}`) || []
  );
  
  // Find unused combinations first
  const unusedCombinations = allCombinations.filter(combo => 
    !usedCombinationKeys.has(`${combo.grammar_topic}|${combo.subject_topic}|${combo.cef_level}`)
  );
  
  if (unusedCombinations.length > 0) {
    // Randomly select from unused combinations
    const randomIndex = Math.floor(Math.random() * unusedCombinations.length);
    console.log(`Selected from ${unusedCombinations.length} unused combinations`);
    return unusedCombinations[randomIndex];
  }
  
  // If all combinations have been used, select the least recently used
  const leastUsedCombination = usedCombinations?.[0];
  if (leastUsedCombination) {
    const combinationData = allCombinations.find(c => 
      c.grammar_topic === leastUsedCombination.grammar_topic &&
      c.subject_topic === leastUsedCombination.subject_topic &&
      c.cef_level === leastUsedCombination.cef_level
    );
    if (combinationData) {
      console.log(`Selected least recently used combination`);
      return combinationData;
    }
  }
  
  // Fallback: select random combination
  const randomIndex = Math.floor(Math.random() * allCombinations.length);
  console.log(`Fallback: selected random combination`);
  return allCombinations[randomIndex];
}

// Helper function to update grammar combination usage
async function updateGrammarCombinationUsage(supabaseClient: any, selectedCombination: any) {
  const { error } = await supabaseClient
    .from('grammar_topic_combinations')
    .upsert({
      grammar_topic: selectedCombination.grammar_topic,
      grammar_category: selectedCombination.grammar_category,
      subject_topic: selectedCombination.subject_topic,
      subject_category: selectedCombination.subject_category,
      cef_level: selectedCombination.cef_level,
      questions_generated: 5, // 5 questions per combination
      last_used_at: new Date().toISOString()
    }, {
      onConflict: 'grammar_topic,subject_topic,cef_level'
    });

  if (error) {
    console.error(`Error updating grammar combination usage:`, error);
  } else {
    console.log(`Successfully tracked grammar combination usage`);
  }
}
