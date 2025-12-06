/**
 * Twitter API v2 Edge Function
 *
 * Uses native Twitter API v2 with OAuth 2.0 App-Only authentication
 * to search for tweets containing category terms plus pain language.
 *
 * PHASE 20B: Direct Twitter API integration (eliminates Apify middleman)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TwitterSearchRequest {
  query: string;
  maxResults?: number;
  lang?: string;
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

interface TwitterSearchResponse {
  data?: TwitterTweet[];
  meta?: {
    newest_id: string;
    oldest_id: string;
    result_count: number;
  };
  errors?: Array<{
    title: string;
    detail: string;
    type: string;
  }>;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY');
    const TWITTER_API_SECRET = Deno.env.get('TWITTER_API_SECRET');

    console.log('[Twitter API] Checking credentials:', {
      hasApiKey: !!TWITTER_API_KEY,
      hasApiSecret: !!TWITTER_API_SECRET,
      apiKeyLength: TWITTER_API_KEY?.length || 0
    });

    if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
      throw new Error('Twitter API credentials not configured');
    }

    const request: TwitterSearchRequest = await req.json();
    const { query, maxResults = 20, lang = 'en' } = request;

    console.log('[Twitter API] Searching for:', { query, maxResults, lang });

    // Get OAuth 2.0 Bearer Token (App-Only auth)
    const bearerToken = await getBearerToken(TWITTER_API_KEY, TWITTER_API_SECRET);

    // Search recent tweets (last 7 days)
    // Twitter API v2: lang must be in query, not as separate parameter
    const searchUrl = new URL('https://api.twitter.com/2/tweets/search/recent');
    const fullQuery = lang ? `${query} lang:${lang}` : query;
    searchUrl.searchParams.set('query', fullQuery);
    searchUrl.searchParams.set('max_results', maxResults.toString());
    searchUrl.searchParams.set('tweet.fields', 'created_at,author_id,public_metrics');

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'User-Agent': 'Synapse-VoC/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Twitter API] Request failed:', response.status, errorText);
      console.error('[Twitter API] Search URL was:', searchUrl.toString());

      // Return empty results instead of failing
      return new Response(
        JSON.stringify({
          data: [],
          error: `Twitter API error: ${response.status} - ${errorText}`,
          success: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Don't fail the entire VoC flow
        }
      );
    }

    const data: TwitterSearchResponse = await response.json();

    // Transform to standard format for VoC processing
    const tweets = (data.data || []).map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      authorId: tweet.author_id,
      engagement: tweet.public_metrics ? {
        retweets: tweet.public_metrics.retweet_count,
        likes: tweet.public_metrics.like_count,
        replies: tweet.public_metrics.reply_count,
        quotes: tweet.public_metrics.quote_count,
      } : null,
      sourceUrl: `https://twitter.com/i/status/${tweet.id}`,
      platform: 'Twitter',
    }));

    console.log(`[Twitter API] Found ${tweets.length} tweets`);

    return new Response(
      JSON.stringify({
        data: tweets,
        success: true,
        meta: data.meta
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Twitter API] Error:', error);

    return new Response(
      JSON.stringify({
        data: [],
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Don't fail the VoC flow
      }
    );
  }
});

/**
 * Get OAuth 2.0 Bearer Token using App-Only authentication
 * This is more reliable than user auth for search operations
 */
async function getBearerToken(apiKey: string, apiSecret: string): Promise<string> {
  // Encode credentials for Basic auth
  const credentials = btoa(`${apiKey}:${apiSecret}`);

  const response = await fetch('https://api.twitter.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Bearer token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}