/**
 * SEC EDGAR Proxy Edge Function
 *
 * Proxies requests to SEC EDGAR API to bypass CORS restrictions.
 * The SEC.gov API doesn't allow browser-based requests due to CORS.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SEC_SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index';
const SEC_SUBMISSIONS_URL = 'https://data.sec.gov/submissions';
const USER_AGENT = 'SynapseEngine/1.0 (support@synapseengine.com)';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();

    let response: Response;

    switch (action) {
      case 'search': {
        const { query, formTypes, dateRange, limit = 20 } = params;

        const searchParams = new URLSearchParams({
          q: query,
          dateRange: 'custom',
          startdt: dateRange?.start || getDateMonthsAgo(12),
          enddt: dateRange?.end || getToday(),
          forms: formTypes?.join(',') || '10-K,10-Q,8-K',
          from: '0',
          size: String(limit),
        });

        console.log(`[SEC-EDGAR-PROXY] Searching: ${query}`);

        response = await fetch(`${SEC_SEARCH_URL}?${searchParams.toString()}`, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        });
        break;
      }

      case 'company': {
        const { cik } = params;
        const paddedCik = cik.padStart(10, '0');

        console.log(`[SEC-EDGAR-PROXY] Fetching company: ${paddedCik}`);

        response = await fetch(`${SEC_SUBMISSIONS_URL}/CIK${paddedCik}.json`, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        });
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (!response.ok) {
      console.error(`[SEC-EDGAR-PROXY] SEC API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `SEC API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SEC-EDGAR-PROXY] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}
