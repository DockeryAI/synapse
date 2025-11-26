import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY')
const APIFY_API_URL = 'https://api.apify.com/v2'

// Valid Apify Actor IDs from the marketplace
// These are verified working actors with good maintenance
const SOCIAL_ACTORS = {
  TWITTER: 'apify/tweet-scraper',  // Official Apify Twitter/X scraper
  QUORA: 'alexey/quora-questions-scraper',  // Quora questions scraper
  LINKEDIN: 'apify/linkedin-profile-scraper',  // Official LinkedIn scraper
  TRUSTPILOT: 'vdrmota/trustpilot-reviews-scraper',  // TrustPilot reviews
  G2: 'lukaskrivka/g2-reviews-scraper',  // G2 product reviews
  REDDIT: 'trudax/reddit-scraper',  // Reddit scraper - DISABLED per user request
  YOUTUBE_COMMENTS: 'bernardo/youtube-comments-scraper',  // YouTube comments
  GOOGLE_MAPS: 'compass/google-maps-scraper',  // Google Maps business info
  WEBSITE_CONTENT: 'apify/website-content-crawler',  // Official website crawler
  INSTAGRAM: 'apify/instagram-scraper'  // Instagram scraper
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
    const finalActorId = scraperType ? SOCIAL_ACTORS[scraperType as keyof typeof SOCIAL_ACTORS] : actorId
    if (!finalActorId) {
      throw new Error(`Unknown scraperType: ${scraperType}`)
    }

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
