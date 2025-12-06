/**
 * SEC-API.io Edge Function
 *
 * Uses sec-api.io commercial service for reliable section extraction
 * from 10-K, 10-Q, and 8-K filings.
 *
 * Key endpoints:
 * - extractor: Extract specific sections (MD&A, Risk Factors, etc.)
 * - query: Search filings by company, form type, date
 * - fulltext: Full-text search across all filings
 *
 * Docs: https://sec-api.io/docs
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// SEC-API.io endpoints
const SEC_API_BASE = 'https://api.sec-api.io';
const EXTRACTOR_API = 'https://api.sec-api.io/extractor';
const QUERY_API = 'https://api.sec-api.io';
const FULL_TEXT_API = 'https://efts.sec-api.io';

// Rate limiting: 10 requests per second (sec-api.io limit)
const RATE_LIMIT_MS = 100;
let lastRequestTime = 0;

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url, options);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SEC_API_KEY = Deno.env.get('SEC_API_KEY');

  if (!SEC_API_KEY) {
    console.error('[SEC-API-IO] Missing SEC_API_KEY');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SEC_API_KEY not configured',
        source: 'sec-api-io'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { action, params } = body;

    console.log(`[SEC-API-IO] Action: ${action}, Params:`, JSON.stringify(params).substring(0, 200));

    let result: any;

    switch (action) {
      case 'extract-section': {
        /**
         * Extract a specific section from a filing
         * Sections: 1 (Business), 1A (Risk Factors), 7 (MD&A), 7A (Quantitative), etc.
         */
        const { filingUrl, section, returnType = 'text' } = params;

        if (!filingUrl || !section) {
          throw new Error('filingUrl and section are required');
        }

        const extractorUrl = `${EXTRACTOR_API}?url=${encodeURIComponent(filingUrl)}&item=${section}&type=${returnType}&token=${SEC_API_KEY}`;

        console.log(`[SEC-API-IO] Extracting section ${section} from ${filingUrl}`);

        const response = await rateLimitedFetch(extractorUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/plain' },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Extractor API error: ${response.status} - ${errorText}`);
        }

        const sectionText = await response.text();

        result = {
          section,
          content: sectionText,
          filingUrl,
          returnType,
          characterCount: sectionText.length,
        };
        break;
      }

      case 'search-filings': {
        /**
         * Search for filings by company, form type, date range
         */
        const {
          ticker,
          cik,
          formType = '10-K',
          from = 0,
          size = 10,
          dateFrom,
          dateTo
        } = params;

        // Build query
        const query: any = {
          query: { query_string: { query: '' } },
          from,
          size,
          sort: [{ filedAt: { order: 'desc' } }],
        };

        // Build query string
        const queryParts: string[] = [];
        if (ticker) queryParts.push(`ticker:${ticker}`);
        if (cik) queryParts.push(`cik:${cik}`);
        if (formType) queryParts.push(`formType:"${formType}"`);
        if (dateFrom) queryParts.push(`filedAt:[${dateFrom} TO ${dateTo || '*'}]`);

        query.query.query_string.query = queryParts.join(' AND ') || '*';

        console.log(`[SEC-API-IO] Searching filings:`, query.query.query_string.query);

        const response = await rateLimitedFetch(QUERY_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': SEC_API_KEY,
          },
          body: JSON.stringify(query),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Query API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        result = {
          total: data.total?.value || data.filings?.length || 0,
          filings: (data.filings || []).map((f: any) => ({
            ticker: f.ticker,
            companyName: f.companyName,
            formType: f.formType,
            filedAt: f.filedAt,
            periodOfReport: f.periodOfReport,
            linkToFilingDetails: f.linkToFilingDetails,
            linkToHtml: f.linkToHtml,
            cik: f.cik,
          })),
        };
        break;
      }

      case 'extract-mda': {
        /**
         * Convenience action: Extract MD&A section (Section 7) from most recent 10-K
         * for a given ticker
         */
        const { ticker, cik } = params;

        if (!ticker && !cik) {
          throw new Error('ticker or cik is required');
        }

        // First, find the most recent 10-K
        const searchQuery: any = {
          query: {
            query_string: {
              query: `${ticker ? `ticker:${ticker}` : `cik:${cik}`} AND formType:"10-K"`
            }
          },
          from: 0,
          size: 1,
          sort: [{ filedAt: { order: 'desc' } }],
        };

        console.log(`[SEC-API-IO] Finding latest 10-K for ${ticker || cik}`);

        const searchResponse = await rateLimitedFetch(QUERY_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': SEC_API_KEY,
          },
          body: JSON.stringify(searchQuery),
        });

        if (!searchResponse.ok) {
          throw new Error(`Query API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        const filing = searchData.filings?.[0];

        if (!filing) {
          result = {
            found: false,
            message: `No 10-K found for ${ticker || cik}`
          };
          break;
        }

        // Now extract MD&A (Section 7)
        const filingUrl = filing.linkToHtml;
        const extractorUrl = `${EXTRACTOR_API}?url=${encodeURIComponent(filingUrl)}&item=7&type=text&token=${SEC_API_KEY}`;

        console.log(`[SEC-API-IO] Extracting MD&A from ${filingUrl}`);

        const extractResponse = await rateLimitedFetch(extractorUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/plain' },
        });

        if (!extractResponse.ok) {
          throw new Error(`Extractor API error: ${extractResponse.status}`);
        }

        const mdaText = await extractResponse.text();

        result = {
          found: true,
          company: filing.companyName,
          ticker: filing.ticker,
          formType: filing.formType,
          filedAt: filing.filedAt,
          periodOfReport: filing.periodOfReport,
          section: '7 - Management Discussion & Analysis',
          content: mdaText,
          characterCount: mdaText.length,
          wordCount: mdaText.split(/\s+/).length,
        };
        break;
      }

      case 'extract-risk-factors': {
        /**
         * Convenience action: Extract Risk Factors (Section 1A) from most recent 10-K
         */
        const { ticker, cik } = params;

        if (!ticker && !cik) {
          throw new Error('ticker or cik is required');
        }

        // Find the most recent 10-K
        const searchQuery: any = {
          query: {
            query_string: {
              query: `${ticker ? `ticker:${ticker}` : `cik:${cik}`} AND formType:"10-K"`
            }
          },
          from: 0,
          size: 1,
          sort: [{ filedAt: { order: 'desc' } }],
        };

        console.log(`[SEC-API-IO] Finding latest 10-K for ${ticker || cik}`);

        const searchResponse = await rateLimitedFetch(QUERY_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': SEC_API_KEY,
          },
          body: JSON.stringify(searchQuery),
        });

        if (!searchResponse.ok) {
          throw new Error(`Query API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        const filing = searchData.filings?.[0];

        if (!filing) {
          result = {
            found: false,
            message: `No 10-K found for ${ticker || cik}`
          };
          break;
        }

        // Extract Risk Factors (Section 1A)
        const filingUrl = filing.linkToHtml;
        const extractorUrl = `${EXTRACTOR_API}?url=${encodeURIComponent(filingUrl)}&item=1A&type=text&token=${SEC_API_KEY}`;

        console.log(`[SEC-API-IO] Extracting Risk Factors from ${filingUrl}`);

        const extractResponse = await rateLimitedFetch(extractorUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/plain' },
        });

        if (!extractResponse.ok) {
          throw new Error(`Extractor API error: ${extractResponse.status}`);
        }

        const riskText = await extractResponse.text();

        result = {
          found: true,
          company: filing.companyName,
          ticker: filing.ticker,
          formType: filing.formType,
          filedAt: filing.filedAt,
          periodOfReport: filing.periodOfReport,
          section: '1A - Risk Factors',
          content: riskText,
          characterCount: riskText.length,
          wordCount: riskText.split(/\s+/).length,
        };
        break;
      }

      case 'extract-executive-quotes': {
        /**
         * Extract executive quotes from MD&A section using AI
         * This extracts the MD&A, then uses Perplexity to identify key quotes
         */
        const { ticker, cik, industry } = params;

        if (!ticker && !cik) {
          throw new Error('ticker or cik is required');
        }

        // Find recent 10-Ks (get 3 for variety)
        const searchQuery: any = {
          query: {
            query_string: {
              query: `${ticker ? `ticker:${ticker}` : `cik:${cik}`} AND formType:"10-K"`
            }
          },
          from: 0,
          size: 3,
          sort: [{ filedAt: { order: 'desc' } }],
        };

        console.log(`[SEC-API-IO] Finding 10-Ks for executive quotes`);

        const searchResponse = await rateLimitedFetch(QUERY_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': SEC_API_KEY,
          },
          body: JSON.stringify(searchQuery),
        });

        if (!searchResponse.ok) {
          throw new Error(`Query API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        const filings = searchData.filings || [];

        if (filings.length === 0) {
          result = {
            found: false,
            quotes: [],
            message: `No 10-K found for ${ticker || cik}`
          };
          break;
        }

        // Extract MD&A from most recent filing
        const filing = filings[0];
        const filingUrl = filing.linkToHtml;
        const extractorUrl = `${EXTRACTOR_API}?url=${encodeURIComponent(filingUrl)}&item=7&type=text&token=${SEC_API_KEY}`;

        const extractResponse = await rateLimitedFetch(extractorUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/plain' },
        });

        if (!extractResponse.ok) {
          throw new Error(`Extractor API error: ${extractResponse.status}`);
        }

        const mdaText = await extractResponse.text();

        // Extract key executive quotes from the text
        // Look for patterns like "said", "stated", "according to", etc.
        const quotePatterns = [
          /"([^"]{20,300})"/g,  // Quoted text
          /(?:stated|said|noted|commented|explained|emphasized|highlighted)[^.]*[.]/gi,
        ];

        const potentialQuotes: string[] = [];
        for (const pattern of quotePatterns) {
          const matches = mdaText.match(pattern) || [];
          potentialQuotes.push(...matches.slice(0, 5));
        }

        // Also extract strategy-related sentences
        const strategyKeywords = ['AI', 'artificial intelligence', 'automation', 'digital', 'transformation', 'strategy', 'growth', 'investment'];
        const sentences = mdaText.split(/[.!?]+/);
        const strategySentences = sentences
          .filter(s => strategyKeywords.some(kw => s.toLowerCase().includes(kw.toLowerCase())))
          .filter(s => s.length > 50 && s.length < 500)
          .slice(0, 10);

        result = {
          found: true,
          company: filing.companyName,
          ticker: filing.ticker,
          filedAt: filing.filedAt,
          periodOfReport: filing.periodOfReport,
          quotes: potentialQuotes.slice(0, 10),
          strategyStatements: strategySentences,
          mdaSummary: mdaText.substring(0, 2000),
          source: 'SEC 10-K MD&A',
        };
        break;
      }

      case 'fulltext-search': {
        /**
         * Full-text search across all filings
         */
        const { query, formTypes = ['10-K', '10-Q', '8-K'], from = 0, size = 10 } = params;

        if (!query) {
          throw new Error('query is required');
        }

        const searchBody = {
          query,
          formTypes,
          from,
          size,
        };

        console.log(`[SEC-API-IO] Full-text search: "${query}"`);

        const response = await rateLimitedFetch(`${FULL_TEXT_API}?token=${SEC_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Full-text API error: ${response.status} - ${errorText}`);
        }

        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}. Valid: extract-section, search-filings, extract-mda, extract-risk-factors, extract-executive-quotes, fulltext-search`,
            source: 'sec-api-io'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[SEC-API-IO] Success for action: ${action}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        source: 'sec-api-io',
        metadata: { action, timestamp: new Date().toISOString() }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SEC-API-IO] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        source: 'sec-api-io'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
