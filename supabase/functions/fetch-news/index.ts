import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || Deno.env.get('VITE_NEWS_API_KEY')

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
    const { type, query, location, industry, keywords, limit } = await req.json()

    if (!NEWS_API_KEY || NEWS_API_KEY === 'your_news_api_key_here') {
      // Return empty results if API key not configured
      console.log('[News Edge] API key not configured, returning empty results')
      return new Response(
        JSON.stringify({
          success: true,
          articles: [],
          message: 'News API key not configured. Please add a valid NEWS_API_KEY to enable news features.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    let requestBody: any

    if (type === 'industry') {
      // Industry news request
      // Use OR logic for broader keyword matching - any keyword match counts
      const keywordArray = keywords && keywords.length > 0 ? keywords : [industry]

      // Build simple keyword OR query (NewsAPI.ai format)
      // Search for articles matching ANY keyword
      const keywordOr = keywordArray.map(keyword => ({ keyword }))

      requestBody = {
        query: {
          $query: {
            $and: [
              {
                $or: keywordOr
              },
              { lang: 'eng' }
            ]
          },
          $filter: {
            forceMaxDataTimeWindow: '31'
          }
        },
        resultType: 'articles',
        articlesSortBy: 'date',
        articlesCount: limit || 20,
        apiKey: NEWS_API_KEY
      }

      console.log('[News Edge] Searching with', keywordArray.length, 'keywords:', keywordArray.slice(0, 5).join(', '))
      console.log('[News Edge] Query structure:', JSON.stringify(requestBody.query, null, 2))
    } else if (type === 'local') {
      // Local news request
      requestBody = {
        query: {
          $query: {
            $and: [
              { keyword: location },
              { lang: 'eng' }
            ]
          },
          $filter: {
            forceMaxDataTimeWindow: '31'
          }
        },
        resultType: 'articles',
        articlesSortBy: 'date',
        articlesCount: limit || 15,
        apiKey: NEWS_API_KEY
      }
    } else {
      throw new Error('Invalid type. Use "industry" or "local"')
    }

    console.log('[News Edge] Fetching news:', type, query || location)
    console.log('[News Edge] Request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://newsapi.ai/api/v1/article/getArticles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[News Edge] API response error:', response.status, errorText)
      throw new Error(`News API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    console.log('[News Edge] API response keys:', Object.keys(data))
    console.log('[News Edge] Articles array length:', data.articles?.results?.length || 0)
    console.log('[News Edge] Full response structure:', JSON.stringify(data, null, 2).substring(0, 500))

    // Transform newsapi.ai response to match expected format
    const articles = (data.articles?.results || []).map((article: any) => ({
      title: article.title || '',
      description: article.body || article.description || '',
      url: article.url || '',
      publishedAt: article.dateTime || article.date || new Date().toISOString(),
      source: article.source?.title || 'Unknown',
      author: article.authors?.[0]?.name || article.author,
      content: article.body || article.content,
      relevanceScore: 75 // Default score
    }))

    return new Response(
      JSON.stringify({ success: true, articles }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('[News Edge] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
