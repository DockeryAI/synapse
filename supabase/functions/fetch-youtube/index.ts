import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
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

    const body = await req.json()

    // Support both old format (action) and new format (endpoint)
    const action = body.action
    const endpoint = body.endpoint
    const params = body.params || {}

    // Build YouTube API URL based on action or endpoint
    let url: string

    // Handle old format with 'action' field
    if (action === 'trending') {
      // Get trending videos (use chart=mostPopular)
      const trendingParams = {
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: body.region || 'US',
        maxResults: body.maxResults || 50,
        key: YOUTUBE_API_KEY
      }
      if (body.category) {
        trendingParams.videoCategoryId = body.category
      }
      url = `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams(trendingParams)}`
    } else if (action === 'search') {
      // Search videos
      url = `https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({
        part: 'snippet',
        q: body.query,
        type: 'video',
        maxResults: body.maxResults || 20,
        key: YOUTUBE_API_KEY
      })}`
    } else if (action === 'comments') {
      // Get comments for a video
      url = `https://www.googleapis.com/youtube/v3/commentThreads?${new URLSearchParams({
        part: 'snippet',
        videoId: body.videoId,
        maxResults: body.maxResults || 100,
        key: YOUTUBE_API_KEY
      })}`
    }
    // Handle new format with 'endpoint' field
    else if (endpoint) {
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
    } else {
      throw new Error('Either action or endpoint must be specified')
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
