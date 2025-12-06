/**
 * SEC EDGAR Proxy Edge Function
 *
 * Proxies requests to SEC EDGAR API to bypass CORS restrictions.
 * The SEC.gov API doesn't allow browser-based requests due to CORS.
 *
 * Endpoints:
 * - search: Full-text search across filings
 * - company: Get company submissions/filing history
 * - facts: Get XBRL company facts (financials)
 * - full: Get complete company profile with financials
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SEC_SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index';
const SEC_SUBMISSIONS_URL = 'https://data.sec.gov/submissions';
const SEC_FACTS_URL = 'https://data.sec.gov/api/xbrl/companyfacts';
const USER_AGENT = 'SynapseEngine/1.0 (support@synapseengine.com)';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();

    let response: Response;
    let data: any;

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

        if (!response.ok) throw new Error(`SEC API error: ${response.status}`);
        data = await response.json();
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

        if (!response.ok) throw new Error(`SEC API error: ${response.status}`);
        data = await response.json();
        break;
      }

      case 'facts': {
        // Get XBRL company facts (financials)
        const { cik } = params;
        const paddedCik = cik.padStart(10, '0');

        console.log(`[SEC-EDGAR-PROXY] Fetching XBRL facts: ${paddedCik}`);

        response = await fetch(`${SEC_FACTS_URL}/CIK${paddedCik}.json`, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) throw new Error(`SEC API error: ${response.status}`);
        const rawFacts = await response.json();

        // Extract key financial metrics
        data = extractFinancials(rawFacts);
        break;
      }

      case 'full': {
        // Full company profile with financials
        const { cik } = params;
        const paddedCik = cik.padStart(10, '0');

        console.log(`[SEC-EDGAR-PROXY] Fetching full profile: ${paddedCik}`);

        // Fetch submissions and facts in parallel
        const [submissionsRes, factsRes] = await Promise.all([
          fetch(`${SEC_SUBMISSIONS_URL}/CIK${paddedCik}.json`, {
            headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
          }),
          fetch(`${SEC_FACTS_URL}/CIK${paddedCik}.json`, {
            headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
          }),
        ]);

        const submissions = submissionsRes.ok ? await submissionsRes.json() : null;
        const rawFacts = factsRes.ok ? await factsRes.json() : null;

        // Extract recent filings (last 10)
        const recentFilings = submissions?.filings?.recent
          ? {
              forms: submissions.filings.recent.form?.slice(0, 10) || [],
              filingDates: submissions.filings.recent.filingDate?.slice(0, 10) || [],
              descriptions: submissions.filings.recent.primaryDocDescription?.slice(0, 10) || [],
              accessionNumbers: submissions.filings.recent.accessionNumber?.slice(0, 10) || [],
            }
          : null;

        data = {
          company: {
            name: submissions?.name,
            cik: submissions?.cik,
            sic: submissions?.sic,
            sicDescription: submissions?.sicDescription,
            fiscalYearEnd: submissions?.fiscalYearEnd,
            stateOfIncorporation: submissions?.stateOfIncorporation,
            addresses: submissions?.addresses,
            phone: submissions?.phone,
            website: submissions?.website,
          },
          financials: rawFacts ? extractFinancials(rawFacts) : null,
          recentFilings,
          executives: extractExecutives(submissions),
        };
        break;
      }

      case 'lookup': {
        // Lookup company by ticker symbol
        const { ticker } = params;

        console.log(`[SEC-EDGAR-PROXY] Looking up ticker: ${ticker}`);

        // Search for the company by ticker
        const searchParams = new URLSearchParams({
          q: `"${ticker}"`,
          dateRange: 'custom',
          startdt: getDateMonthsAgo(12),
          enddt: getToday(),
          forms: '10-K,10-Q',
          from: '0',
          size: '5',
        });

        response = await fetch(`${SEC_SEARCH_URL}?${searchParams.toString()}`, {
          headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        });

        if (!response.ok) throw new Error(`SEC API error: ${response.status}`);
        const searchResult = await response.json();

        // Extract CIK from first result
        if (searchResult?.hits?.hits?.[0]) {
          const hit = searchResult.hits.hits[0]._source;
          data = {
            cik: hit.ciks?.[0],
            companyName: hit.display_names?.[0],
            ticker: ticker.toUpperCase(),
          };
        } else {
          data = null;
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid action. Valid: search, company, facts, full, lookup',
            source: 'sec-edgar'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Transform to standardized format
    const result = {
      success: true,
      data,
      source: 'sec-edgar',
      metadata: { action, params }
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SEC-EDGAR-PROXY] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        source: 'sec-edgar'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Extract key financial metrics from XBRL company facts
 */
function extractFinancials(facts: any): any {
  const usGaap = facts?.facts?.['us-gaap'] || {};

  // Helper to get most recent value from an array of facts
  const getMostRecent = (concept: string, unit: string = 'USD'): any => {
    const data = usGaap[concept]?.units?.[unit];
    if (!data || data.length === 0) return null;

    // Sort by end date descending, filter for annual (10-K) filings
    const sorted = data
      .filter((d: any) => d.form === '10-K' || d.form === '10-Q')
      .sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());

    return sorted[0] || null;
  };

  // Get last 4 annual values for trend analysis
  const getAnnualTrend = (concept: string, unit: string = 'USD'): any[] => {
    const data = usGaap[concept]?.units?.[unit];
    if (!data || data.length === 0) return [];

    return data
      .filter((d: any) => d.form === '10-K')
      .sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime())
      .slice(0, 4);
  };

  const revenue = getMostRecent('Revenues') || getMostRecent('RevenueFromContractWithCustomerExcludingAssessedTax');
  const netIncome = getMostRecent('NetIncomeLoss');
  const totalAssets = getMostRecent('Assets');
  const totalLiabilities = getMostRecent('Liabilities');
  const stockholdersEquity = getMostRecent('StockholdersEquity');
  const eps = getMostRecent('EarningsPerShareBasic', 'USD/shares');

  // Revenue trend for YoY calculation
  const revenueTrend = getAnnualTrend('Revenues');
  const currentRevenue = revenueTrend[0]?.val;
  const priorRevenue = revenueTrend[1]?.val;
  const revenueGrowth = currentRevenue && priorRevenue
    ? ((currentRevenue - priorRevenue) / priorRevenue * 100).toFixed(1)
    : null;

  return {
    revenue: revenue ? {
      value: revenue.val,
      period: revenue.end,
      form: revenue.form,
      formatted: formatCurrency(revenue.val),
    } : null,
    revenueGrowthYoY: revenueGrowth ? `${revenueGrowth}%` : null,
    netIncome: netIncome ? {
      value: netIncome.val,
      period: netIncome.end,
      form: netIncome.form,
      formatted: formatCurrency(netIncome.val),
      profitable: netIncome.val > 0,
    } : null,
    totalAssets: totalAssets ? {
      value: totalAssets.val,
      formatted: formatCurrency(totalAssets.val),
    } : null,
    totalLiabilities: totalLiabilities ? {
      value: totalLiabilities.val,
      formatted: formatCurrency(totalLiabilities.val),
    } : null,
    stockholdersEquity: stockholdersEquity ? {
      value: stockholdersEquity.val,
      formatted: formatCurrency(stockholdersEquity.val),
    } : null,
    eps: eps ? {
      value: eps.val,
      period: eps.end,
    } : null,
    fiscalPeriod: revenue?.end || netIncome?.end || null,
  };
}

/**
 * Extract executives from company filings
 * Note: SEC doesn't have a direct executives endpoint, but names appear in filings
 */
function extractExecutives(submissions: any): any[] {
  // The submissions endpoint doesn't include executives directly
  // Would need to parse proxy filings (DEF 14A) for compensation data
  // For now, return empty - will be enriched by Perplexity
  return [];
}

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}
