import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const BUZZSUMO_API_KEY = Deno.env.get('BUZZSUMO_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { topic, limit = 20, sortBy = 'shares', days = 30 } = await req.json()

    if (!BUZZSUMO_API_KEY) {
      console.log('[BuzzSumo] API key not configured - returning empty results')
      return new Response(
        JSON.stringify({ success: true, data: [], source: 'buzzsumo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[BuzzSumo] Fetching content performance for:', topic)

    // BuzzSumo API endpoint for content analysis
    const url = new URL('https://app.buzzsumo.com/api/content/search')
    url.searchParams.set('q', topic)
    url.searchParams.set('num_results', limit.toString())
    url.searchParams.set('sort', sortBy) // shares, engagement, links
    url.searchParams.set('begin_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    url.searchParams.set('end_date', new Date().toISOString().split('T')[0])

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': BUZZSUMO_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Synapse/1.0'
      }
    })

    if (!response.ok) {
      console.error('[BuzzSumo] API error:', response.status, response.statusText)

      // Return empty results on API failure
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          source: 'buzzsumo',
          error: `BuzzSumo API error: ${response.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    // Transform BuzzSumo data to standard format
    const transformedData = data.results?.map((item: any) => ({
      title: item.title,
      url: item.url,
      domain: item.domain_name,
      publishedDate: item.published_date,
      shares: {
        total: item.total_shares,
        facebook: item.facebook_shares,
        twitter: item.twitter_shares,
        linkedin: item.linkedin_shares,
        pinterest: item.pinterest_shares
      },
      engagement: {
        engagements: item.total_engagements,
        comments: item.total_comments
      },
      content: {
        excerpt: item.excerpt,
        wordCount: item.word_count,
        type: item.content_type
      },
      metrics: {
        evergreen_score: item.evergreen_score,
        amplifiers: item.num_amplifiers
      }
    })) || []

    console.log(`[BuzzSumo] Success! Found ${transformedData.length} content pieces`)

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedData,
        source: 'buzzsumo',
        metadata: {
          query: topic,
          resultsCount: transformedData.length,
          sortBy,
          dateRange: `${days} days`
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('[BuzzSumo] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || String(error),
        source: 'buzzsumo'
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