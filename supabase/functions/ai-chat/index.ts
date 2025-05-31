
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
    const { message, sessionId } = await req.json()

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
            content: `You are an AI English grammar tutor. Your role is to:
            1. Analyze user messages for grammar errors
            2. Provide corrections with explanations
            3. Offer helpful tips and encouragement
            4. Keep responses conversational and educational
            
            When you find errors, format your response as:
            {
              "content": "Your main response text",
              "corrections": [
                {
                  "original": "incorrect text",
                  "corrected": "correct text",
                  "explanation": "why this is correct"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    const aiResponse = await openAIResponse.json()
    let responseContent = aiResponse.choices[0].message.content

    // Try to parse as JSON, fallback to plain text
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch {
      parsedResponse = {
        content: responseContent,
        corrections: []
      }
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
