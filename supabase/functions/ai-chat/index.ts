
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
    const { message, context } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    const systemPrompt = `You are GrammarAI, an expert English grammar tutor specializing in ${context?.userLevel || 'intermediate'} level instruction. Your role is to:

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

3. STRUCTURED OUTPUT: Always respond with a JSON object containing:
   - "response": Your main educational response
   - "corrections": Array of specific grammar corrections (if any)
   - "suggestions": Array of helpful grammar tips
   - "grammarScore": Rate the grammar quality (1-100)

Be patient, encouraging, and focus on one or two key grammar points per response to avoid overwhelming the user.`

    console.log('Making OpenAI API request...')
    
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

    // Try to parse as JSON, fallback to structured format
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.log('Failed to parse as JSON, creating structured response:', parseError)
      parsedResponse = {
        response: responseContent,
        corrections: [],
        suggestions: [],
        grammarScore: 85
      }
    }

    // Ensure required fields exist
    if (!parsedResponse.response) {
      parsedResponse.response = responseContent
    }
    if (!parsedResponse.corrections) {
      parsedResponse.corrections = []
    }
    if (!parsedResponse.suggestions) {
      parsedResponse.suggestions = []
    }
    if (!parsedResponse.grammarScore) {
      parsedResponse.grammarScore = 85
    }

    console.log('Returning parsed response:', parsedResponse)

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
        corrections: [],
        suggestions: [],
        grammarScore: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
