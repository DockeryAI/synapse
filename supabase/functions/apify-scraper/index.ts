import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY')
const APIFY_API_URL = 'https://api.apify.com/v2'

// Verified actor IDs from official Apify sources (2025-11-26)
// These have been confirmed to exist and work via API
const SOCIAL_ACTORS = {
  TWITTER: 'apidojo/tweet-scraper',  // Updated to working Twitter/X scraper (2025-11-26)
  FACEBOOK: 'apify/facebook-posts-scraper',  // Official Apify Facebook scraper
  INSTAGRAM: 'apify/instagram-scraper',  // Official Apify Instagram scraper
  LINKEDIN: 'curious_coder/linkedin-post-search-scraper',  // Requires cookie param - user must provide LinkedIn session cookie
  LINKEDIN_PROFILE: 'curious_coder/linkedin-profile-scraper',  // Requires rental payment
  TIKTOK: 'clockworks/tiktok-scraper',  // Actively maintained TikTok scraper
  REDDIT: 'trudax/reddit-scraper',  // Updated to paid actor (verified 2025-11-26)
  YOUTUBE: 'apidojo/youtube-scraper',  // Working YouTube scraper - use keywords[] input (verified 2025-11-26)
  YOUTUBE_COMMENTS: 'streamers/youtube-comments-scraper',  // Dedicated comments scraper
  GOOGLE_MAPS: 'compass/google-maps-reviews-scraper',  // Google Maps reviews
  WEBSITE_CONTENT: 'apify/website-content-crawler',  // Website content extraction

  // Fallback scrapers for unsupported platforms
  QUORA: 'apify/web-scraper',  // No dedicated Quora actor exists
  TRUSTPILOT: 'apify/web-scraper',  // Use generic scraper as fallback
  G2: 'apify/web-scraper'  // Use generic scraper as fallback
}

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
    const { actorId, input, scraperType } = await req.json()

    if (!APIFY_API_KEY) {
      throw new Error('Apify API key not configured in Edge Function environment')
    }

    if (!actorId) {
      throw new Error('actorId is required')
    }

    // Allow scraperType to select pre-configured actors
    let finalActorId = scraperType ? SOCIAL_ACTORS[scraperType as keyof typeof SOCIAL_ACTORS] : actorId
    if (!finalActorId) {
      throw new Error(`Unknown scraperType: ${scraperType}`)
    }

    // Convert actor ID format: apidojo/youtube-scraper -> apidojo~youtube-scraper
    // Apify API requires tilde (~) separator, not slash (/)
    finalActorId = finalActorId.replace('/', '~')

    console.log('[Apify Edge] Starting actor:', finalActorId, scraperType ? `(${scraperType})` : '')

    // Start actor run
    const runResponse = await fetch(
      `${APIFY_API_URL}/acts/${finalActorId}/runs?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      }
    )

    if (!runResponse.ok) {
      const errorText = await runResponse.text()

      // Handle actor not found errors gracefully
      if (runResponse.status === 404) {
        console.warn(`[Apify Edge] Actor ${finalActorId} not found, returning empty results`)
        return new Response(
          JSON.stringify({ success: true, data: [] }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      throw new Error(`Apify API error (${runResponse.status}): ${errorText}`)
    }

    const runData = await runResponse.json()
    const runId = runData.data.id

    console.log('[Apify Edge] Actor started, run ID:', runId)

    // Poll for completion (max 55 seconds for Edge Function timeout)
    const startTime = Date.now()
    const timeout = 55000 // 55 seconds max (Edge Functions timeout at 60s)

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 3000)) // Poll every 3 seconds

      const statusResponse = await fetch(
        `${APIFY_API_URL}/actor-runs/${runId}?token=${APIFY_API_KEY}`
      )

      if (!statusResponse.ok) {
        throw new Error(`Failed to check status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      const status = statusData.data.status

      console.log('[Apify Edge] Status:', status)

      if (status === 'SUCCEEDED') {
        // Get dataset items
        const datasetId = statusData.data.defaultDatasetId
        const datasetResponse = await fetch(
          `${APIFY_API_URL}/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
        )

        if (!datasetResponse.ok) {
          throw new Error(`Failed to get results: ${datasetResponse.status}`)
        }

        const results = await datasetResponse.json()
        console.log('[Apify Edge] Success! Results count:', results.length)

        return new Response(
          JSON.stringify({ success: true, data: results }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        const errorMsg = statusData.data.statusMessage || 'Unknown error'
        throw new Error(`Actor run ${status}: ${errorMsg}`)
      }

      // Still running, continue polling
    }

    // Timeout reached
    throw new Error('Actor run timed out after 55 seconds')

  } catch (error) {
    console.error('[Apify Edge] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
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
