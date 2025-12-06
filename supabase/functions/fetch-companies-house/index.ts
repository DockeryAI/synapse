/**
 * UK Companies House Edge Function
 *
 * Fetches company data from UK Companies House API:
 * - Company profile (status, type, registered address)
 * - Officers (directors, secretaries)
 * - Persons with Significant Control (PSC) - ownership >25%
 * - Filing history (accounts, confirmation statements)
 *
 * API Docs: https://developer.company-information.service.gov.uk/
 * Rate Limit: 600 requests per 5 minutes
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CH_API_BASE = 'https://api.company-information.service.gov.uk';

interface CompaniesHouseRequest {
  action: 'search' | 'company' | 'officers' | 'psc' | 'filings' | 'full';
  params: {
    query?: string;
    companyNumber?: string;
    limit?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('COMPANIES_HOUSE_API_KEY');
    if (!apiKey) {
      return jsonResponse(500, {
        success: false,
        error: 'COMPANIES_HOUSE_API_KEY not configured',
        source: 'companies-house',
      });
    }

    const { action, params }: CompaniesHouseRequest = await req.json();

    // Basic Auth: API key as username, empty password
    const authHeader = 'Basic ' + btoa(`${apiKey}:`);

    let result: any;

    switch (action) {
      case 'search': {
        const { query, limit = 10 } = params;
        if (!query) {
          return jsonResponse(400, { success: false, error: 'Missing query parameter' });
        }

        console.log(`[CompaniesHouse] Searching: ${query}`);

        const searchUrl = `${CH_API_BASE}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${limit}`;
        const response = await fetch(searchUrl, {
          headers: { Authorization: authHeader },
        });

        if (!response.ok) {
          throw new Error(`Companies House API error: ${response.status}`);
        }

        result = await response.json();
        break;
      }

      case 'company': {
        const { companyNumber } = params;
        if (!companyNumber) {
          return jsonResponse(400, { success: false, error: 'Missing companyNumber parameter' });
        }

        console.log(`[CompaniesHouse] Fetching company: ${companyNumber}`);

        const response = await fetch(`${CH_API_BASE}/company/${companyNumber}`, {
          headers: { Authorization: authHeader },
        });

        if (!response.ok) {
          throw new Error(`Companies House API error: ${response.status}`);
        }

        result = await response.json();
        break;
      }

      case 'officers': {
        const { companyNumber, limit = 50 } = params;
        if (!companyNumber) {
          return jsonResponse(400, { success: false, error: 'Missing companyNumber parameter' });
        }

        console.log(`[CompaniesHouse] Fetching officers: ${companyNumber}`);

        const response = await fetch(
          `${CH_API_BASE}/company/${companyNumber}/officers?items_per_page=${limit}`,
          { headers: { Authorization: authHeader } }
        );

        if (!response.ok) {
          throw new Error(`Companies House API error: ${response.status}`);
        }

        result = await response.json();
        break;
      }

      case 'psc': {
        const { companyNumber } = params;
        if (!companyNumber) {
          return jsonResponse(400, { success: false, error: 'Missing companyNumber parameter' });
        }

        console.log(`[CompaniesHouse] Fetching PSC: ${companyNumber}`);

        const response = await fetch(
          `${CH_API_BASE}/company/${companyNumber}/persons-with-significant-control`,
          { headers: { Authorization: authHeader } }
        );

        if (!response.ok) {
          throw new Error(`Companies House API error: ${response.status}`);
        }

        result = await response.json();
        break;
      }

      case 'filings': {
        const { companyNumber, limit = 20 } = params;
        if (!companyNumber) {
          return jsonResponse(400, { success: false, error: 'Missing companyNumber parameter' });
        }

        console.log(`[CompaniesHouse] Fetching filings: ${companyNumber}`);

        const response = await fetch(
          `${CH_API_BASE}/company/${companyNumber}/filing-history?items_per_page=${limit}`,
          { headers: { Authorization: authHeader } }
        );

        if (!response.ok) {
          throw new Error(`Companies House API error: ${response.status}`);
        }

        result = await response.json();
        break;
      }

      case 'full': {
        // Full company profile with all data
        const { companyNumber } = params;
        if (!companyNumber) {
          return jsonResponse(400, { success: false, error: 'Missing companyNumber parameter' });
        }

        console.log(`[CompaniesHouse] Fetching full profile: ${companyNumber}`);

        // Fetch all endpoints in parallel
        const [companyRes, officersRes, pscRes, filingsRes] = await Promise.all([
          fetch(`${CH_API_BASE}/company/${companyNumber}`, {
            headers: { Authorization: authHeader },
          }),
          fetch(`${CH_API_BASE}/company/${companyNumber}/officers?items_per_page=50`, {
            headers: { Authorization: authHeader },
          }),
          fetch(`${CH_API_BASE}/company/${companyNumber}/persons-with-significant-control`, {
            headers: { Authorization: authHeader },
          }),
          fetch(`${CH_API_BASE}/company/${companyNumber}/filing-history?items_per_page=20`, {
            headers: { Authorization: authHeader },
          }),
        ]);

        const [company, officers, psc, filings] = await Promise.all([
          companyRes.ok ? companyRes.json() : null,
          officersRes.ok ? officersRes.json() : null,
          pscRes.ok ? pscRes.json() : null,
          filingsRes.ok ? filingsRes.json() : null,
        ]);

        result = {
          company,
          officers: officers?.items || [],
          psc: psc?.items || [],
          filings: filings?.items || [],
        };
        break;
      }

      default:
        return jsonResponse(400, {
          success: false,
          error: `Invalid action: ${action}`,
          source: 'companies-house',
        });
    }

    return jsonResponse(200, {
      success: true,
      data: result,
      source: 'companies-house',
      metadata: { action, params },
    });
  } catch (error: any) {
    console.error('[CompaniesHouse] Error:', error);
    return jsonResponse(500, {
      success: false,
      error: error.message || 'Internal server error',
      source: 'companies-house',
    });
  }
});

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
