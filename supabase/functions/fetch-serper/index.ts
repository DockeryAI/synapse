import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY')
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY not configured in Supabase secrets')
    }

    const body = await req.json()

    // Support both formats: direct params or endpoint + params
    const endpoint = body.endpoint || '/search'
    const params = body.params || body

    const url = `https://google.serper.dev${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    })
  } catch (error) {
    console.error('Serper API error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
