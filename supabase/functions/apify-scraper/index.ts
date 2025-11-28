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
  YELP: 'yin/yelp-scraper',  // Yelp business and review scraper (Item #13)

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

    // Allow scraperType to select pre-configured actors OR use direct actorId
    let finalActorId = scraperType ? SOCIAL_ACTORS[scraperType as keyof typeof SOCIAL_ACTORS] : actorId

    if (!finalActorId) {
      throw new Error('Either actorId or scraperType is required')
    }

    // Convert actor ID format: apidojo/youtube-scraper -> apidojo~youtube-scraper
    // Apify API requires tilde (~) separator, not slash (/)
    finalActorId = finalActorId.replace('/', '~')

    console.log('[Apify Edge] Starting actor:', finalActorId, scraperType ? `(${scraperType})` : '')

    // OPTIMIZATION: Add aggressive limits to ALL actors to ensure they complete fast
    // Edge Functions have a 60s hard limit, so actors MUST finish in ~45s
    const optimizedInput = {
      ...input,
      // Force fast completion for web scrapers
      maxRequestsPerCrawl: Math.min(input.maxRequestsPerCrawl || 10, 10),
      maxCrawlPages: Math.min(input.maxCrawlPages || 5, 5),
      maxConcurrency: Math.min(input.maxConcurrency || 3, 3),
      // Aggressive timeouts (in seconds)
      timeoutSecs: 40,
      requestTimeoutSecs: 15,
      pageLoadTimeoutSecs: 15,
      // Reduce memory/compute to speed up
      maxRequestRetries: 1,
      // For dedicated scrapers (Twitter, Reddit, YouTube)
      maxItems: Math.min(input.maxItems || 20, 20),
      maxTweets: Math.min(input.maxTweets || 20, 20),
      maxPosts: Math.min(input.maxPosts || 10, 10),
      maxResults: Math.min(input.maxResults || 20, 20),
    }

    // Start actor run with waitForFinish to get results inline if fast enough
    const runResponse = await fetch(
      `${APIFY_API_URL}/acts/${finalActorId}/runs?token=${APIFY_API_KEY}&waitForFinish=30`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizedInput)
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
    const initialStatus = runData.data.status

    console.log('[Apify Edge] Actor started, run ID:', runId, 'Status:', initialStatus)

    // If waitForFinish returned a completed run, get results immediately
    if (initialStatus === 'SUCCEEDED') {
      const datasetId = runData.data.defaultDatasetId
      const datasetResponse = await fetch(
        `${APIFY_API_URL}/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
      )

      if (datasetResponse.ok) {
        const results = await datasetResponse.json()
        console.log('[Apify Edge] Immediate success! Results count:', results.length)
        return new Response(
          JSON.stringify({ success: true, data: results }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Poll for completion (max 25 seconds remaining - since waitForFinish used 30s)
    const startTime = Date.now()
    const timeout = 25000 // 25 seconds more (total ~55s including waitForFinish)

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Poll every 2 seconds (faster)

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

    // Timeout reached - but try to get partial results from dataset
    console.log('[Apify Edge] Timeout reached, attempting to fetch partial results...')
    try {
      const statusResponse = await fetch(
        `${APIFY_API_URL}/actor-runs/${runId}?token=${APIFY_API_KEY}`
      )
      const statusData = await statusResponse.json()
      const datasetId = statusData.data.defaultDatasetId

      if (datasetId) {
        const datasetResponse = await fetch(
          `${APIFY_API_URL}/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
        )
        if (datasetResponse.ok) {
          const results = await datasetResponse.json()
          if (results.length > 0) {
            console.log('[Apify Edge] Returning partial results:', results.length)
            return new Response(
              JSON.stringify({ success: true, data: results, partial: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      }
    } catch (e) {
      console.log('[Apify Edge] Could not fetch partial results:', e)
    }

    // No partial results available
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
