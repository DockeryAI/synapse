import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured in Edge Function environment')
    }

    const body = await req.json()

    // Convert simplified query format to Perplexity's native format
    let requestBody: any

    if (body.query) {
      // Simplified format from V4 services: { query: string, format?: string }
      requestBody = {
        model: body.model || 'sonar',
        messages: [
          {
            role: 'user',
            content: body.query
          }
        ]
      }
    } else if (body.messages) {
      // Native Perplexity format - pass through
      requestBody = {
        model: body.model || 'sonar',
        messages: body.messages
      }
    } else {
      throw new Error('Request must include either "query" or "messages"')
    }

    console.log('[Perplexity Proxy] Making request with model:', requestBody.model)

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Perplexity Proxy] API error:', errorText)
      throw new Error(`Perplexity API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('[Perplexity Proxy] Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})