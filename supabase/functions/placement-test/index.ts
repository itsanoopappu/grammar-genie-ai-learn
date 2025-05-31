import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pre-generated questions for faster loading
const QUICK_ASSESSMENT_QUESTIONS = [
  {
    question: "Choose the correct sentence:",
    options: ["I am going to school", "I going to school", "I go to school yesterday", "I will went to school"],
    correct: "I am going to school",
    topic: "Basic Present Continuous",
    level: "A1",
    explanation: "Present continuous uses 'am/is/are + verb-ing' for actions happening now."
  },
  {
    question: "Complete: She _____ finished her homework.",
    options: ["have", "has", "had", "having"],
    correct: "has",
    topic: "Present Perfect",
    level: "A2",
    explanation: "Use 'has' with third person singular (she/he/it) in present perfect."
  },
  {
    question: "If I _____ rich, I would travel the world.",
    options: ["am", "was", "were", "will be"],
    correct: "were",
    topic: "Conditionals",
    level: "B1",
    explanation: "Second conditional uses 'were' for all persons after 'if'."
  },
  {
    question: "The report _____ by the deadline.",
    options: ["must complete", "must be completed", "must completing", "must to complete"],
    correct: "must be completed",
    topic: "Passive Voice",
    level: "B2",
    explanation: "Passive voice with modal verbs: modal + be + past participle."
  },
  {
    question: "Had I known about the meeting, I _____ attended.",
    options: ["would have", "will have", "had", "would"],
    correct: "would have",
    topic: "Third Conditional",
    level: "C1",
    explanation: "Third conditional: Had + subject + past participle, subject + would have + past participle."
  }
];

const COMPREHENSIVE_QUESTIONS = {
  A1: [
    {
      question: "What _____ your name?",
      options: ["is", "are", "am", "be"],
      correct: "is",
      topic: "Verb To Be",
      explanation: "Use 'is' with singular subjects like 'name'."
    },
    {
      question: "I _____ from Spain.",
      options: ["am", "is", "are", "be"],
      correct: "am",
      topic: "Verb To Be",
      explanation: "Use 'am' with 'I'."
    }
  ],
  A2: [
    {
      question: "Yesterday I _____ to the cinema.",
      options: ["go", "went", "going", "goes"],
      correct: "went",
      topic: "Past Simple",
      explanation: "Past simple of 'go' is 'went'."
    },
    {
      question: "She _____ watching TV right now.",
      options: ["is", "are", "am", "be"],
      correct: "is",
      topic: "Present Continuous",
      explanation: "Present continuous: is/am/are + verb-ing."
    }
  ],
  B1: [
    {
      question: "I _____ never been to Paris.",
      options: ["have", "has", "had", "am"],
      correct: "have",
      topic: "Present Perfect",
      explanation: "Present perfect with 'I' uses 'have'."
    },
    {
      question: "If it rains tomorrow, we _____ stay inside.",
      options: ["will", "would", "shall", "should"],
      correct: "will",
      topic: "First Conditional",
      explanation: "First conditional: if + present, will + infinitive."
    }
  ],
  B2: [
    {
      question: "The house _____ built in 1990.",
      options: ["is", "was", "has", "had"],
      correct: "was",
      topic: "Passive Voice",
      explanation: "Past passive: was/were + past participle."
    },
    {
      question: "I wish I _____ more time to study.",
      options: ["have", "had", "has", "having"],
      correct: "had",
      topic: "Subjunctive",
      explanation: "Wish + past simple for present situations."
    }
  ],
  C1: [
    {
      question: "_____ the weather been better, we would have gone hiking.",
      options: ["Had", "Has", "Have", "If"],
      correct: "Had",
      topic: "Inversion",
      explanation: "Inverted third conditional starts with 'Had'."
    },
    {
      question: "She speaks English _____ she were a native speaker.",
      options: ["as if", "like", "such as", "as"],
      correct: "as if",
      topic: "Comparisons",
      explanation: "'As if' is used for hypothetical comparisons."
    }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, level = 'A2', user_id, answers, test_id, test_type = 'quick' } = await req.json()

    if (action === 'generate') {
      // Map test_type to valid enum values: 'quick' -> 'standard', 'comprehensive' -> 'adaptive'
      const dbTestType = test_type === 'quick' ? 'standard' : 'adaptive'
      
      // Create test entry with valid enum value
      const { data: testData, error: testError } = await supabaseClient
        .from('placement_tests')
        .insert({
          user_id,
          test_type: dbTestType,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (testError) {
        console.error('Test creation error:', testError);
        throw new Error(`Failed to create test entry: ${testError.message}`);
      }

      let questions = [];
      
      if (test_type === 'quick') {
        // Use pre-generated questions for speed
        questions = QUICK_ASSESSMENT_QUESTIONS;
      } else {
        // Generate comprehensive questions using AI
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
                content: `Generate 15 English grammar assessment questions spanning levels A1-C1. Include varied question types: multiple choice, fill-in-the-blank, and error correction. Focus on: tenses, conditionals, passive voice, reported speech, modal verbs, and complex sentence structures.`
              },
              {
                role: 'user',
                content: `Create questions in this format:
                {
                  "questions": [
                    {
                      "question": "question text",
                      "options": ["option1", "option2", "option3", "option4"],
                      "correct": "correct option",
                      "topic": "grammar topic",
                      "level": "A1|A2|B1|B2|C1",
                      "explanation": "explanation"
                    }
                  ]
                }`
              }
            ],
            temperature: 0.3
          })
        });

        if (openAIResponse.ok) {
          const aiData = await openAIResponse.json();
          questions = JSON.parse(aiData.choices[0].message.content).questions;
        } else {
          // Fallback to comprehensive pre-generated questions
          questions = [
            ...COMPREHENSIVE_QUESTIONS.A1,
            ...COMPREHENSIVE_QUESTIONS.A2,
            ...COMPREHENSIVE_QUESTIONS.B1,
            ...COMPREHENSIVE_QUESTIONS.B2,
            ...COMPREHENSIVE_QUESTIONS.C1
          ];
        }
      }

      // Store questions
      const { error: questionsError } = await supabaseClient
        .from('test_questions')
        .insert(
          questions.map((q: any, index: number) => ({
            test_id: testData.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct,
            topic: q.topic,
            explanation: q.explanation,
            level: q.level || level,
            question_order: index
          }))
        )

      if (questionsError) {
        console.error('Questions insertion error:', questionsError);
        throw new Error(`Failed to store questions: ${questionsError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          questions,
          testId: testData.id,
          estimatedTime: test_type === 'quick' ? 5 : 15
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'evaluate') {
      const { data: questions, error: questionsError } = await supabaseClient
        .from('test_questions')
        .select('*')
        .eq('test_id', test_id)
        .order('question_order');

      if (questionsError) {
        console.error('Questions fetch error:', questionsError);
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
      }

      // Enhanced scoring algorithm
      let totalScore = 0;
      let levelScores = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
      let topicPerformance: Record<string, { correct: number; total: number }> = {};
      
      questions.forEach((q: any) => {
        const userAnswer = answers[q.id] || answers[q.question] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
        
        if (isCorrect) {
          totalScore++;
          levelScores[q.level as keyof typeof levelScores]++;
        }
        
        if (!topicPerformance[q.topic]) {
          topicPerformance[q.topic] = { correct: 0, total: 0 };
        }
        topicPerformance[q.topic].total++;
        if (isCorrect) {
          topicPerformance[q.topic].correct++;
        }
      });

      const percentage = (totalScore / questions.length) * 100;
      
      // Advanced level determination
      let recommendedLevel = 'A1';
      if (levelScores.C1 >= 2) recommendedLevel = 'C1';
      else if (levelScores.B2 >= 2 && percentage >= 70) recommendedLevel = 'B2';
      else if (levelScores.B1 >= 2 && percentage >= 60) recommendedLevel = 'B1';
      else if (levelScores.A2 >= 2 && percentage >= 50) recommendedLevel = 'A2';
      else if (percentage >= 40) recommendedLevel = 'A1';

      // Analyze strengths and weaknesses
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      Object.entries(topicPerformance).forEach(([topic, result]) => {
        const topicScore = (result.correct / result.total) * 100;
        if (topicScore >= 75) {
          strengths.push(topic);
        } else if (topicScore <= 50) {
          weaknesses.push(topic);
        }
      });

      // Calculate XP reward based on test type and performance
      const baseXP = test_type === 'comprehensive' ? 100 : 50;
      const bonusXP = Math.floor(percentage / 10) * 5;
      const totalXP = baseXP + bonusXP;

      // Update test completion
      const { error: updateError } = await supabaseClient
        .from('placement_tests')
        .update({
          score: percentage,
          level: recommendedLevel,
          completed_at: new Date().toISOString()
        })
        .eq('id', test_id);

      if (updateError) {
        console.error('Test update error:', updateError);
        throw new Error(`Failed to update test: ${updateError.message}`);
      }

      // Store assessment results
      await supabaseClient
        .from('assessment_results')
        .insert({
          user_id,
          assessment_type: `placement_${test_type}`,
          overall_score: percentage,
          recommended_level: recommendedLevel,
          topics_assessed: Object.keys(topicPerformance),
          strengths,
          weaknesses,
          detailed_analysis: {
            levelScores,
            topicPerformance,
            totalQuestions: questions.length,
            totalCorrect: totalScore
          },
          next_steps: [
            `Focus on ${weaknesses.slice(0, 3).join(', ')} for improvement`,
            `Continue practicing ${recommendedLevel} level content`,
            'Take another assessment in 2-3 weeks to track progress'
          ]
        });

      return new Response(
        JSON.stringify({
          score: percentage,
          recommendedLevel,
          strengths,
          weaknesses,
          topicPerformance,
          levelBreakdown: levelScores,
          xpEarned: totalXP,
          detailedFeedback: {
            message: `Great job! You scored ${Math.round(percentage)}% and demonstrated ${recommendedLevel} level proficiency.`,
            nextSteps: [
              `Your strongest areas: ${strengths.slice(0, 3).join(', ') || 'Building foundation'}`,
              `Areas for improvement: ${weaknesses.slice(0, 3).join(', ') || 'Continue current level'}`,
              'Practice regularly with Smart Practice recommendations'
            ]
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Placement test error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Please check your connection and try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})