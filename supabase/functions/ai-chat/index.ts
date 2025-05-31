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
    const { message, context } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle test answer evaluation
    if (context?.isTestActive && context?.userTestAnswer && context?.currentQuestion) {
      const isCorrect = context.userTestAnswer.toLowerCase().trim() === 
                        context.currentQuestion.correctAnswer.toLowerCase().trim();
      
      // Update user skills if we have user_id
      if (context.user_id) {
        try {
          await supabaseClient.functions.invoke('intelligent-tutor', {
            body: {
              action: 'update_skill_model',
              user_id: context.user_id,
              topic_id: context.currentTopic || 'grammar',
              performance_data: {
                isCorrect,
                difficulty: 5,
                timeTaken: 30
              }
            }
          });
        } catch (error) {
          console.error('Error updating user skills:', error);
        }
      }

      // Generate feedback response
      return new Response(
        JSON.stringify({
          response: isCorrect 
            ? `That's correct! ${context.currentQuestion.explanation}` 
            : `Not quite. The correct answer is "${context.currentQuestion.correctAnswer}". ${context.currentQuestion.explanation}`,
          grammarCard: null,
          testQuestion: null,
          isTestActive: false,
          progressUpdate: {
            topicId: context.currentTopic || 'grammar',
            isCorrect,
            xpGain: isCorrect ? 10 : 5
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are GrammarAI, an expert English grammar tutor specializing in ${context?.userLevel || 'intermediate'} level instruction. Your role is to:

1. FIRST PRINCIPLES TEACHING:
   - Break down complex grammar concepts into fundamental building blocks
   - Explain WHY rules exist, not just WHAT they are
   - Show how basic principles combine to form more complex structures
   - Connect new concepts to previously learned fundamentals

2. SITUATIONAL CONTEXT:
   - Provide real-world examples showing when and why to use specific grammar
   - Explain how context changes meaning and usage
   - Demonstrate how formal vs informal situations affect grammar choices
   - Show cultural and regional variations in usage

3. ADAPTIVE TEACHING:
   - Start with user's current level (${context?.userLevel})
   - Gradually increase complexity as understanding improves
   - Identify and address gaps in foundational knowledge
   - Provide more challenging examples when basics are mastered

4. TESTING AND FEEDBACK:
   - Generate appropriate test questions based on user level
   - Provide detailed explanations for both correct and incorrect answers
   - Use mistakes as teaching opportunities
   - Track progress and adjust difficulty accordingly

5. STRUCTURED OUTPUT: Always respond with a JSON object containing:
   {
     "response": "Your conversational message",
     "grammarCard": {
       "name": "Grammar topic name",
       "level": "CEFR level",
       "description": "Clear explanation focusing on first principles",
       "examples": ["Example 1", "Example 2"],
       "situations": [
         { "context": "Situation description", "usage": "How/why to use it" }
       ],
       "rulesChange": [
         { "situation": "When context changes", "newRule": "How the rule adapts" }
       ]
     },
     "testQuestion": {
       "question": "Test question text",
       "type": "multiple-choice" or "text-input",
       "options": ["Option 1", "Option 2"] (for multiple-choice),
       "correctAnswer": "Correct answer",
       "explanation": "Why this is correct"
     },
     "isTestActive": boolean,
     "progressUpdate": {
       "topicId": "Grammar topic ID",
       "isCorrect": boolean,
       "xpGain": number
     }
   }

Current Topic: ${context?.currentTopic || 'Not specified'}
Chat History: ${JSON.stringify(context?.chatHistory || [])}

Remember to:
- Focus on understanding over memorization
- Explain WHY rules work the way they do
- Show how grammar reflects meaning and intent
- Make connections between related concepts
- Use real-world examples that resonate with learners

IMPORTANT: When the user asks to test their skills or knowledge, ALWAYS include a testQuestion in your response with a clear question, options (for multiple-choice), correctAnswer, and explanation. Set isTestActive to true.`

    console.log('Making OpenAI API request...')
    
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error('OpenAI API error:', openAIResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openAIResponse.status} ${errorText}`)
    }

    const aiResponse = await openAIResponse.json()
    console.log('OpenAI response:', JSON.stringify(aiResponse, null, 2))

    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      console.error('No choices in OpenAI response:', aiResponse)
      throw new Error('No response generated from OpenAI')
    }

    let responseContent = aiResponse.choices[0].message?.content

    if (!responseContent) {
      console.error('No content in OpenAI response choice:', aiResponse.choices[0])
      throw new Error('No content in OpenAI response')
    }

    // Parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.log('Failed to parse as JSON, creating structured response:', parseError)
      parsedResponse = {
        response: responseContent,
        grammarCard: null,
        testQuestion: null,
        isTestActive: false,
        progressUpdate: null
      }
    }

    // Update user skills if there's a progress update
    if (parsedResponse.progressUpdate && context?.user_id) {
      try {
        const { data: userSkill } = await supabaseClient
          .from('user_skills')
          .select('*')
          .eq('user_id', context.user_id)
          .eq('topic_id', parsedResponse.progressUpdate.topicId)
          .single()

        const skillUpdate = {
          user_id: context.user_id,
          topic_id: parsedResponse.progressUpdate.topicId,
          skill_level: userSkill 
            ? Math.min(1, userSkill.skill_level + (parsedResponse.progressUpdate.isCorrect ? 0.1 : -0.05))
            : parsedResponse.progressUpdate.isCorrect ? 0.6 : 0.4,
          attempts_count: (userSkill?.attempts_count || 0) + 1,
          last_practiced: new Date().toISOString()
        }

        if (userSkill) {
          await supabaseClient
            .from('user_skills')
            .update(skillUpdate)
            .eq('id', userSkill.id)
        } else {
          await supabaseClient
            .from('user_skills')
            .insert(skillUpdate)
        }
      } catch (error) {
        console.error('Error updating user skills:', error)
      }
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "I'm having trouble right now. Please try again later.",
        grammarCard: null,
        testQuestion: null,
        isTestActive: false,
        progressUpdate: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})