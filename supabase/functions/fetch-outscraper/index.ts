import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OUTSCRAPER_API_KEY = Deno.env.get('OUTSCRAPER_API_KEY')
    if (!OUTSCRAPER_API_KEY) {
      throw new Error('OUTSCRAPER_API_KEY not configured in Supabase secrets')
    }

    const reqBody = await req.json()

    // Support both formats: direct query or endpoint + params
    const endpoint = reqBody.endpoint || '/maps/search-v2'
    const params = reqBody.params || {
      query: reqBody.query,
      limit: reqBody.limit || 10
    }
    const method = reqBody.method || 'GET'
    const body = reqBody.body

    const url = `https://api.app.outscraper.com${endpoint}${
      params ? '?' + new URLSearchParams(params) : ''
    }`

    const response = await fetch(url, {
      method,
      headers: {
        'X-API-KEY': OUTSCRAPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    })
  } catch (error) {
    console.error('OutScraper API error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
