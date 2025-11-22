import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY not configured in Supabase secrets')
    }

    const { endpoint, params } = await req.json()

    // Build YouTube API URL based on endpoint
    let url: string
    switch (endpoint) {
      case 'search':
        url = `https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({
          ...params,
          key: YOUTUBE_API_KEY
        })}`
        break
      case 'videos':
        url = `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({
          ...params,
          key: YOUTUBE_API_KEY
        })}`
        break
      case 'commentThreads':
        url = `https://www.googleapis.com/youtube/v3/commentThreads?${new URLSearchParams({
          ...params,
          key: YOUTUBE_API_KEY
        })}`
        break
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`)
    }

    // Call YouTube API
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('YouTube API error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
