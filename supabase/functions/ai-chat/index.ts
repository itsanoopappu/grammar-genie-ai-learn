
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, sessionId, userLevel } = await req.json()

    const systemPrompt = `You are GrammarAI, an expert English grammar tutor specializing in ${userLevel || 'intermediate'} level instruction. Your role is to:

1. GRAMMAR ANALYSIS: Carefully analyze user messages for grammar errors, including:
   - Subject-verb agreement
   - Tense consistency
   - Article usage (a, an, the)
   - Preposition errors
   - Sentence structure issues
   - Punctuation mistakes

2. EDUCATIONAL RESPONSE: Provide helpful, encouraging feedback that:
   - Explains WHY something is correct or incorrect
   - Offers memory techniques or rules
   - Gives additional examples
   - Adapts complexity to user's level

3. STRUCTURED OUTPUT: Format your response as JSON with:
   - "content": Your main educational response
   - "corrections": Array of specific grammar corrections
   - "tips": Array of helpful grammar tips
   - "difficulty": Rate the concepts discussed (1-5)
   - "encouragement": Positive reinforcement message

Be patient, encouraging, and focus on one or two key grammar points per response to avoid overwhelming the user.`

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })

    const aiResponse = await openAIResponse.json()
    let responseContent = aiResponse.choices[0].message.content

    // Try to parse as JSON, fallback to structured format
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch {
      parsedResponse = {
        content: responseContent,
        corrections: [],
        tips: [],
        difficulty: 2,
        encouragement: "Keep practicing! Every mistake is a learning opportunity."
      }
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        content: "I'm having trouble right now. Please try again later.",
        corrections: [],
        tips: [],
        difficulty: 1,
        encouragement: "Don't worry, we'll get through this together!"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
