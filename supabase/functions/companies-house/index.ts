/**
 * Companies House API Edge Function
 *
 * UK company intelligence for competitive analysis.
 * Provides: company filings, officers, PSC (ownership), insolvency events.
 *
 * Rate limit: 600 requests per 5 minutes (500ms between requests for safety)
 * Returns 429 with Retry-After header on exceed.
 *
 * Docs: https://developer.company-information.service.gov.uk/
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const API_BASE = 'https://api.company-information.service.gov.uk';

// Rate limiting: 500ms between requests (safe margin for 600/5min limit)
const RATE_LIMIT_MS = 500;
let lastRequestTime = 0;

async function rateLimitedFetch(url: string, headers: Record<string, string>): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();

  const response = await fetch(url, { headers });

  // Handle 429 with exponential backoff
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
    console.log(`[COMPANIES-HOUSE] Rate limited, waiting ${retryAfter}s`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return fetch(url, { headers });
  }

  return response;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const API_KEY = Deno.env.get('COMPANIES_HOUSE_API_KEY');

  if (!API_KEY) {
    console.error('[COMPANIES-HOUSE] Missing COMPANIES_HOUSE_API_KEY');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'COMPANIES_HOUSE_API_KEY not configured',
        source: 'companies-house'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Basic auth header (API key as username, empty password)
  const authHeader = 'Basic ' + btoa(`${API_KEY}:`);
  const headers = {
    'Authorization': authHeader,
    'Accept': 'application/json',
  };

  try {
    const body = await req.json();
    const { action, params } = body;

    console.log(`[COMPANIES-HOUSE] Action: ${action}, Params:`, JSON.stringify(params).substring(0, 200));

    let result: any;

    switch (action) {
      case 'search-companies': {
        /**
         * Search for companies by name
         * Returns basic company info for matching companies
         */
        const { query, itemsPerPage = 20, startIndex = 0 } = params;

        if (!query) {
          throw new Error('query is required');
        }

        const url = `${API_BASE}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${itemsPerPage}&start_index=${startIndex}`;

        console.log(`[COMPANIES-HOUSE] Searching companies: "${query}"`);

        const response = await rateLimitedFetch(url, headers);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Search API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        result = {
          total: data.total_results,
          companies: (data.items || []).map((c: any) => ({
            companyNumber: c.company_number,
            title: c.title,
            companyStatus: c.company_status,
            companyType: c.company_type,
            dateOfCreation: c.date_of_creation,
            address: c.address_snippet,
            sic_codes: c.sic_codes,
          })),
        };
        break;
      }

      case 'get-company': {
        /**
         * Get company profile by company number
         * Returns full company details
         */
        const { companyNumber } = params;

        if (!companyNumber) {
          throw new Error('companyNumber is required');
        }

        const url = `${API_BASE}/company/${companyNumber}`;

        console.log(`[COMPANIES-HOUSE] Getting company: ${companyNumber}`);

        const response = await rateLimitedFetch(url, headers);

        if (!response.ok) {
          if (response.status === 404) {
            result = { found: false, message: `Company ${companyNumber} not found` };
            break;
          }
          const errorText = await response.text();
          throw new Error(`Company API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        result = {
          found: true,
          companyNumber: data.company_number,
          name: data.company_name,
          status: data.company_status,
          type: data.type,
          dateOfCreation: data.date_of_creation,
          dateOfCessation: data.date_of_cessation,
          jurisdiction: data.jurisdiction,
          sicCodes: data.sic_codes,
          registeredOffice: data.registered_office_address,
          accounts: data.accounts,
          confirmationStatement: data.confirmation_statement,
          hasInsolvencyHistory: data.has_insolvency_history,
          hasCharges: data.has_charges,
          previousCompanyNames: data.previous_company_names,
        };
        break;
      }

      case 'get-filing-history': {
        /**
         * Get company filing history
         * Returns recent filings (accounts, confirmation statements, etc.)
         */
        const { companyNumber, category, itemsPerPage = 25, startIndex = 0 } = params;

        if (!companyNumber) {
          throw new Error('companyNumber is required');
        }

        let url = `${API_BASE}/company/${companyNumber}/filing-history?items_per_page=${itemsPerPage}&start_index=${startIndex}`;
        if (category) {
          url += `&category=${category}`;
        }

        console.log(`[COMPANIES-HOUSE] Getting filing history: ${companyNumber}`);

        const response = await rateLimitedFetch(url, headers);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Filing history API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        result = {
          total: data.total_count,
          filings: (data.items || []).map((f: any) => ({
            category: f.category,
            type: f.type,
            description: f.description,
            date: f.date,
            actionDate: f.action_date,
            barcode: f.barcode,
            documentMetadata: f.links?.document_metadata,
          })),
        };
        break;
      }

      case 'get-officers': {
        /**
         * Get company officers (directors, secretaries)
         * Useful for tracking leadership changes
         */
        const { companyNumber, itemsPerPage = 35, startIndex = 0 } = params;

        if (!companyNumber) {
          throw new Error('companyNumber is required');
        }

        const url = `${API_BASE}/company/${companyNumber}/officers?items_per_page=${itemsPerPage}&start_index=${startIndex}`;

        console.log(`[COMPANIES-HOUSE] Getting officers: ${companyNumber}`);

        const response = await rateLimitedFetch(url, headers);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Officers API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        result = {
          total: data.total_results,
          activeCount: data.active_count,
          resignedCount: data.resigned_count,
          officers: (data.items || []).map((o: any) => ({
            name: o.name,
            role: o.officer_role,
            appointedOn: o.appointed_on,
            resignedOn: o.resigned_on,
            nationality: o.nationality,
            occupation: o.occupation,
            countryOfResidence: o.country_of_residence,
            address: o.address,
          })),
        };
        break;
      }

      case 'get-psc': {
        /**
         * Get persons with significant control (PSC)
         * Ownership changes >25% - useful for detecting acquisitions
         */
        const { companyNumber, itemsPerPage = 25, startIndex = 0 } = params;

        if (!companyNumber) {
          throw new Error('companyNumber is required');
        }

        const url = `${API_BASE}/company/${companyNumber}/persons-with-significant-control?items_per_page=${itemsPerPage}&start_index=${startIndex}`;

        console.log(`[COMPANIES-HOUSE] Getting PSC: ${companyNumber}`);

        const response = await rateLimitedFetch(url, headers);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`PSC API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        result = {
          total: data.total_results,
          activeCount: data.active_count,
          ceasedCount: data.ceased_count,
          psc: (data.items || []).map((p: any) => ({
            name: p.name,
            kind: p.kind,
            notifiedOn: p.notified_on,
            ceasedOn: p.ceased_on,
            naturesOfControl: p.natures_of_control,
            address: p.address,
            nationality: p.nationality,
            countryOfResidence: p.country_of_residence,
            // For corporate PSCs
            companyNumber: p.identification?.legal_authority,
          })),
        };
        break;
      }

      case 'get-insolvency': {
        /**
         * Get insolvency history
         * Useful for detecting competitor weakness
         */
        const { companyNumber } = params;

        if (!companyNumber) {
          throw new Error('companyNumber is required');
        }

        const url = `${API_BASE}/company/${companyNumber}/insolvency`;

        console.log(`[COMPANIES-HOUSE] Getting insolvency: ${companyNumber}`);

        const response = await rateLimitedFetch(url, headers);

        if (!response.ok) {
          if (response.status === 404) {
            result = { found: false, hasInsolvency: false, message: 'No insolvency data' };
            break;
          }
          const errorText = await response.text();
          throw new Error(`Insolvency API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        result = {
          found: true,
          hasInsolvency: true,
          status: data.status,
          cases: (data.cases || []).map((c: any) => ({
            type: c.type,
            number: c.number,
            dates: c.dates,
            practitioners: c.practitioners,
          })),
        };
        break;
      }

      case 'competitor-intel': {
        /**
         * Convenience action: Get full competitor intelligence
         * Combines company profile, recent filings, and officers
         */
        const { companyName, companyNumber: providedNumber } = params;

        if (!companyName && !providedNumber) {
          throw new Error('companyName or companyNumber is required');
        }

        let targetCompanyNumber = providedNumber;

        // If no company number, search for it
        if (!targetCompanyNumber && companyName) {
          const searchUrl = `${API_BASE}/search/companies?q=${encodeURIComponent(companyName)}&items_per_page=5`;
          const searchResponse = await rateLimitedFetch(searchUrl, headers);

          if (!searchResponse.ok) {
            throw new Error(`Search failed: ${searchResponse.status}`);
          }

          const searchData = await searchResponse.json();
          const match = searchData.items?.[0];

          if (!match) {
            result = { found: false, message: `No company found matching "${companyName}"` };
            break;
          }

          targetCompanyNumber = match.company_number;
        }

        console.log(`[COMPANIES-HOUSE] Getting competitor intel for: ${targetCompanyNumber}`);

        // Fetch company profile, filings, and officers in parallel
        const [profileRes, filingsRes, officersRes] = await Promise.all([
          rateLimitedFetch(`${API_BASE}/company/${targetCompanyNumber}`, headers),
          rateLimitedFetch(`${API_BASE}/company/${targetCompanyNumber}/filing-history?items_per_page=10`, headers),
          rateLimitedFetch(`${API_BASE}/company/${targetCompanyNumber}/officers?items_per_page=10`, headers),
        ]);

        const profile = profileRes.ok ? await profileRes.json() : null;
        const filings = filingsRes.ok ? await filingsRes.json() : null;
        const officers = officersRes.ok ? await officersRes.json() : null;

        if (!profile) {
          result = { found: false, message: `Company ${targetCompanyNumber} not found` };
          break;
        }

        // Extract key intelligence
        const recentFilings = (filings?.items || []).slice(0, 5).map((f: any) => ({
          type: f.type,
          description: f.description,
          date: f.date,
        }));

        const currentOfficers = (officers?.items || [])
          .filter((o: any) => !o.resigned_on)
          .slice(0, 5)
          .map((o: any) => ({
            name: o.name,
            role: o.officer_role,
            appointedOn: o.appointed_on,
          }));

        const recentAppointments = (officers?.items || [])
          .filter((o: any) => {
            const appointedDate = new Date(o.appointed_on);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return appointedDate > sixMonthsAgo;
          })
          .map((o: any) => ({
            name: o.name,
            role: o.officer_role,
            appointedOn: o.appointed_on,
          }));

        const recentResignations = (officers?.items || [])
          .filter((o: any) => {
            if (!o.resigned_on) return false;
            const resignedDate = new Date(o.resigned_on);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return resignedDate > sixMonthsAgo;
          })
          .map((o: any) => ({
            name: o.name,
            role: o.officer_role,
            resignedOn: o.resigned_on,
          }));

        result = {
          found: true,
          companyNumber: profile.company_number,
          name: profile.company_name,
          status: profile.company_status,
          type: profile.type,
          dateOfCreation: profile.date_of_creation,
          sicCodes: profile.sic_codes,
          hasInsolvencyHistory: profile.has_insolvency_history,
          registeredOffice: profile.registered_office_address,
          recentFilings,
          currentOfficers,
          recentAppointments,
          recentResignations,
          intelligence: {
            leadershipChanges: recentAppointments.length + recentResignations.length,
            isActive: profile.company_status === 'active',
            hasRecentActivity: recentFilings.length > 0,
          },
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}. Valid: search-companies, get-company, get-filing-history, get-officers, get-psc, get-insolvency, competitor-intel`,
            source: 'companies-house'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[COMPANIES-HOUSE] Success for action: ${action}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        source: 'companies-house',
        metadata: { action, timestamp: new Date().toISOString() }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[COMPANIES-HOUSE] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        source: 'companies-house'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
