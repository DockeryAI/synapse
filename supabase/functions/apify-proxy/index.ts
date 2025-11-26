/**
 * Apify Proxy Edge Function
 *
 * Securely proxies Apify API requests to avoid CORS issues.
 * API key is stored server-side in Supabase Edge Function secrets.
 *
 * @module apify-proxy
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ApifyRequest {
  action: 'run' | 'status' | 'dataset';
  actorId?: string;
  runId?: string;
  datasetId?: string;
  input?: any;
  format?: string;
  limit?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY not configured in Edge Function secrets');
    }

    const request: ApifyRequest = await req.json();
    const { action, actorId, runId, datasetId, input, format, limit } = request;

    let url: string;
    let options: RequestInit;

    switch (action) {
      case 'run':
        // Start an actor run
        if (!actorId) {
          throw new Error('actorId required for run action');
        }
        url = `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`;
        options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input || {}),
        };
        break;

      case 'status':
        // Check run status
        if (!runId) {
          throw new Error('runId required for status action');
        }
        url = `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`;
        options = {
          method: 'GET',
        };
        break;

      case 'dataset':
        // Get dataset results
        if (!datasetId) {
          throw new Error('datasetId required for dataset action');
        }
        const params = new URLSearchParams({
          token: APIFY_API_KEY,
          ...(format && { format }),
          ...(limit && { limit: limit.toString() }),
        });
        url = `https://api.apify.com/v2/datasets/${datasetId}/items?${params}`;
        options = {
          method: 'GET',
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[Apify Proxy] ${action} request:`, url.replace(APIFY_API_KEY, '***'));

    // Make the request to Apify
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('[Apify Proxy] API error:', data);
      throw new Error(data.error?.message || `Apify API error: ${response.status}`);
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Apify Proxy] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('not configured') ? 503 : 500,
      }
    );
  }
});