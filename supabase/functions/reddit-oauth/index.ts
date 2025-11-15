/**
 * Edge Function: Reddit OAuth Proxy
 * Handles Reddit API authentication server-side to avoid CORS restrictions
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedditAPIRequest {
  endpoint: string;
  accessToken?: string;
  userAgent?: string;
  useAuth?: boolean;
}

// Get Reddit credentials from Supabase environment variables
const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID') || '';
const REDDIT_CLIENT_SECRET = Deno.env.get('REDDIT_CLIENT_SECRET') || '';
const REDDIT_USER_AGENT = Deno.env.get('REDDIT_USER_AGENT') || 'Synapse/1.0';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const requestData = await req.json() as RedditAPIRequest;

    // Route 1: Get OAuth access token (using server-side credentials)
    if (requestData.endpoint === '/oauth/token' || !('endpoint' in requestData)) {
      const clientId = REDDIT_CLIENT_ID;
      const clientSecret = REDDIT_CLIENT_SECRET;
      const userAgent = requestData.userAgent || REDDIT_USER_AGENT;

      console.log('[reddit-oauth] Requesting access token...');

      if (!clientId || !clientSecret) {
        throw new Error('Reddit credentials not configured in Supabase environment');
      }

      const auth = btoa(`${clientId}:${clientSecret}`);

      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[reddit-oauth] OAuth failed:', response.status, errorText);
        throw new Error(`Reddit OAuth failed: ${response.status}`);
      }

      const data = await response.json();

      console.log('[reddit-oauth] ✅ Access token obtained');

      return new Response(
        JSON.stringify({
          success: true,
          accessToken: data.access_token,
          tokenType: data.token_type,
          expiresIn: data.expires_in,
          scope: data.scope,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Route 2: Proxy authenticated Reddit API request
    if ('endpoint' in requestData) {
      const { endpoint, accessToken, userAgent = 'Synapse/1.0', useAuth = true } = requestData;

      console.log('[reddit-oauth] Proxying Reddit API request:', endpoint);

      const url = useAuth
        ? `https://oauth.reddit.com${endpoint}`
        : `https://www.reddit.com${endpoint}.json`;

      const headers: Record<string, string> = {
        'User-Agent': userAgent
      };

      if (useAuth && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        // If auth fails, try public API
        if (useAuth && response.status === 403) {
          console.warn('[reddit-oauth] Auth failed, falling back to public API');

          const publicUrl = `https://www.reddit.com${endpoint}.json`;
          const publicResponse = await fetch(publicUrl, {
            headers: { 'User-Agent': userAgent }
          });

          if (!publicResponse.ok) {
            throw new Error(`Reddit API error: ${publicResponse.status}`);
          }

          const publicData = await publicResponse.json();

          return new Response(
            JSON.stringify({
              success: true,
              data: publicData,
              usedAuth: false
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();

      const responseTime = Date.now() - startTime;
      console.log(`[reddit-oauth] ✅ Request complete in ${responseTime}ms`);

      return new Response(
        JSON.stringify({
          success: true,
          data,
          usedAuth: useAuth
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid request: must provide either OAuth credentials or API endpoint');

  } catch (error) {
    console.error('[reddit-oauth] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
