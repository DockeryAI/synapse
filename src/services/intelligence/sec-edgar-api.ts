/**
 * SEC EDGAR API Service
 *
 * Mines SEC filings (earnings calls, 10-K reports) for industry pain points,
 * executive priorities, and market concerns that competitors ignore.
 *
 * FREE API - No key required. Just set User-Agent header with email.
 *
 * Use Cases:
 * - Earnings call transcripts → Executive priorities, market concerns
 * - 10-K filings → Risk factors, industry challenges
 * - 8-K filings → Material events, strategic changes
 *
 * Rate Limit: 10 requests/second
 */

// ============================================================================
// Types
// ============================================================================

export interface SECFiling {
  id: string;
  companyName: string;
  ticker?: string;
  cik: string;
  formType: string; // 10-K, 10-Q, 8-K, etc.
  filedAt: string;
  periodOfReport?: string;
  description: string;
  fileUrl: string;
  size?: number;
}

export interface SECSearchResult {
  filings: SECFiling[];
  totalHits: number;
  query: string;
  timestamp: string;
}

export interface SECInsight {
  type: 'risk_factor' | 'executive_priority' | 'market_concern' | 'strategic_initiative' | 'pain_point';
  text: string;
  source: {
    company: string;
    formType: string;
    filedAt: string;
    fileUrl: string;
  };
  relevanceScore: number;
  keywords: string[];
}

export interface SECIntelligenceResult {
  insights: SECInsight[];
  companies: string[];
  filingCount: number;
  query: string;
  timestamp: string;
}

// ============================================================================
// SEC EDGAR API Service
// ============================================================================

// Get Supabase URL for edge function proxy
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class SECEdgarAPIService {
  private readonly FILING_URL = 'https://www.sec.gov/Archives/edgar/data';

  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 100; // 100ms = 10 req/sec

  /**
   * Call SEC EDGAR via Edge Function proxy to bypass CORS
   */
  private async callEdgeProxy(action: string, params: Record<string, unknown>): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve =>
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();

    return fetch(`${SUPABASE_URL}/functions/v1/sec-edgar-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action, params }),
    });
  }

  /**
   * Full-text search across all SEC filings
   * Great for finding industry-wide pain points and trends
   * Routes through Edge Function proxy to bypass CORS
   */
  async searchFilings(params: {
    query: string;
    formTypes?: string[]; // e.g., ['10-K', '10-Q', '8-K']
    dateRange?: { start: string; end: string }; // YYYY-MM-DD format
    limit?: number;
  }): Promise<SECSearchResult> {
    const { query, formTypes, dateRange, limit = 20 } = params;

    console.log(`[SEC-EDGAR] Searching filings for: "${query}"`);

    try {
      const response = await this.callEdgeProxy('search', {
        query,
        formTypes,
        dateRange: dateRange || {
          start: this.getDateMonthsAgo(12),
          end: this.getToday()
        },
        limit
      });

      if (!response.ok) {
        console.warn(`[SEC-EDGAR] Search failed: ${response.status}`);
        return this.emptySearchResult(query);
      }

      const data = await response.json();

      // Parse SEC response format
      const filings: SECFiling[] = (data.hits?.hits || []).map((hit: any) => ({
        id: hit._id,
        companyName: hit._source?.entity || 'Unknown',
        ticker: hit._source?.tickers?.[0] || undefined,
        cik: hit._source?.ciks?.[0] || '',
        formType: hit._source?.form || '',
        filedAt: hit._source?.filed || '',
        periodOfReport: hit._source?.period_of_report || undefined,
        description: hit._source?.display_names?.[0] || '',
        fileUrl: this.buildFilingUrl(hit._source?.ciks?.[0], hit._source?.adsh),
        size: hit._source?.file_size || undefined,
      }));

      console.log(`[SEC-EDGAR] Found ${filings.length} filings`);

      return {
        filings,
        totalHits: data.hits?.total?.value || filings.length,
        query,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[SEC-EDGAR] Search error:', error);
      return this.emptySearchResult(query);
    }
  }

  /**
   * Get company submission history and recent filings
   * Routes through Edge Function proxy to bypass CORS
   */
  async getCompanyFilings(cik: string): Promise<SECFiling[]> {
    // Pad CIK to 10 digits
    const paddedCik = cik.padStart(10, '0');

    console.log(`[SEC-EDGAR] Fetching filings for CIK: ${paddedCik}`);

    try {
      const response = await this.callEdgeProxy('company', { cik: paddedCik });

      if (!response.ok) {
        console.warn(`[SEC-EDGAR] Company lookup failed: ${response.status}`);
        return [];
      }

      const data = await response.json();

      const filings: SECFiling[] = [];
      const recent = data.filings?.recent;

      if (recent) {
        const count = Math.min(recent.form?.length || 0, 20);

        for (let i = 0; i < count; i++) {
          filings.push({
            id: recent.accessionNumber?.[i] || `filing-${i}`,
            companyName: data.name || 'Unknown',
            ticker: data.tickers?.[0] || undefined,
            cik: paddedCik,
            formType: recent.form?.[i] || '',
            filedAt: recent.filingDate?.[i] || '',
            periodOfReport: recent.reportDate?.[i] || undefined,
            description: recent.primaryDocDescription?.[i] || '',
            fileUrl: this.buildFilingUrl(paddedCik, recent.accessionNumber?.[i]),
          });
        }
      }

      console.log(`[SEC-EDGAR] Found ${filings.length} filings for ${data.name || paddedCik}`);

      return filings;
    } catch (error) {
      console.error('[SEC-EDGAR] Company filings error:', error);
      return [];
    }
  }

  /**
   * Mine intelligence from SEC filings for a given industry/topic
   * Extracts risk factors, executive priorities, and pain points
   */
  async mineIndustryIntelligence(params: {
    industry: string;
    keywords?: string[];
    limit?: number;
  }): Promise<SECIntelligenceResult> {
    const { industry, keywords = [], limit = 10 } = params;

    console.log(`[SEC-EDGAR] Mining intelligence for industry: ${industry}`);

    // Broaden narrow industry terms for SEC search
    // SEC filings use formal industry terminology, not product-specific terms
    const broadenedTerms = this.broadenIndustryTerms(industry);
    const searchIndustry = broadenedTerms.length > 0
      ? `(${broadenedTerms.map(t => `"${t}"`).join(' OR ')})`
      : `"${industry}"`;

    console.log(`[SEC-EDGAR] Broadened search: ${searchIndustry}`);

    // PHASE M FIX: Simpler queries that SEC full-text search can handle
    // The AND clause with long phrases was returning 0 results
    // SEC EDGAR full-text search is primitive - use simpler terms
    const searchQueries = [
      // Simple industry term searches (no complex AND)
      searchIndustry,
      // Add common risk keywords that appear in 10-Ks
      `${broadenedTerms[0] || industry} risk`,
      `${broadenedTerms[0] || industry} competition`,
    ];

    const allInsights: SECInsight[] = [];
    const companiesSet = new Set<string>();
    let totalFilings = 0;

    // Search each query type
    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries for speed
      const results = await this.searchFilings({
        query,
        formTypes: ['10-K', '10-Q'], // Include quarterly reports too for more results
        limit: Math.ceil(limit / 2), // More per query since we have fewer queries
      });

      totalFilings += results.filings.length;

      // Extract insights from each filing
      for (const filing of results.filings) {
        companiesSet.add(filing.companyName);

        // Create insight from filing metadata
        // (Full text extraction would require fetching the actual document)
        const insight: SECInsight = {
          type: this.categorizeInsight(query),
          text: `${filing.companyName} (${filing.formType}): ${filing.description || 'See filing for details'}`,
          source: {
            company: filing.companyName,
            formType: filing.formType,
            filedAt: filing.filedAt,
            fileUrl: filing.fileUrl,
          },
          relevanceScore: 0.7, // Default relevance
          keywords: this.extractKeywords(query),
        };

        allInsights.push(insight);
      }
    }

    console.log(`[SEC-EDGAR] Mined ${allInsights.length} insights from ${totalFilings} filings`);

    return {
      insights: allInsights,
      companies: Array.from(companiesSet),
      filingCount: totalFilings,
      query: industry,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search for competitor filings to find their stated challenges
   */
  async searchCompetitorInsights(competitors: string[]): Promise<SECInsight[]> {
    const insights: SECInsight[] = [];

    for (const competitor of competitors.slice(0, 5)) { // Limit to 5 competitors
      const results = await this.searchFilings({
        query: `"${competitor}" AND ("risk" OR "challenge" OR "competition")`,
        formTypes: ['10-K', '10-Q'],
        limit: 3,
      });

      for (const filing of results.filings) {
        insights.push({
          type: 'risk_factor',
          text: `Competitor "${competitor}" - ${filing.description || 'Annual/Quarterly Report'}`,
          source: {
            company: filing.companyName,
            formType: filing.formType,
            filedAt: filing.filedAt,
            fileUrl: filing.fileUrl,
          },
          relevanceScore: 0.8,
          keywords: ['competitor', competitor.toLowerCase()],
        });
      }
    }

    return insights;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Broaden narrow industry terms to SEC-friendly terminology
   * SEC filings use formal industry categories, not product-specific jargon
   */
  private broadenIndustryTerms(industry: string): string[] {
    const lowerIndustry = industry.toLowerCase();
    const broadTerms: string[] = [];

    // AI/ML related
    if (lowerIndustry.includes('ai') || lowerIndustry.includes('artificial intelligence') ||
        lowerIndustry.includes('agent') || lowerIndustry.includes('machine learning')) {
      broadTerms.push(
        'artificial intelligence',
        'machine learning',
        'automation',
        'digital transformation',
        'enterprise software'
      );
    }

    // Insurance related
    if (lowerIndustry.includes('insurance') || lowerIndustry.includes('insurtech')) {
      broadTerms.push(
        'insurance',
        'insurtech',
        'property and casualty',
        'claims processing',
        'underwriting'
      );
    }

    // Fintech/Finance
    if (lowerIndustry.includes('fintech') || lowerIndustry.includes('financial') ||
        lowerIndustry.includes('banking') || lowerIndustry.includes('payment')) {
      broadTerms.push(
        'financial technology',
        'fintech',
        'banking',
        'payment processing',
        'financial services'
      );
    }

    // Healthcare
    if (lowerIndustry.includes('health') || lowerIndustry.includes('medical') ||
        lowerIndustry.includes('pharma') || lowerIndustry.includes('biotech')) {
      broadTerms.push(
        'healthcare',
        'medical technology',
        'pharmaceuticals',
        'biotechnology',
        'health information'
      );
    }

    // SaaS/Software
    if (lowerIndustry.includes('saas') || lowerIndustry.includes('software') ||
        lowerIndustry.includes('cloud') || lowerIndustry.includes('platform')) {
      broadTerms.push(
        'software',
        'cloud computing',
        'enterprise software',
        'software as a service',
        'technology'
      );
    }

    // E-commerce/Retail
    if (lowerIndustry.includes('ecommerce') || lowerIndustry.includes('retail') ||
        lowerIndustry.includes('commerce')) {
      broadTerms.push(
        'e-commerce',
        'retail',
        'consumer',
        'digital commerce',
        'online retail'
      );
    }

    // Cybersecurity
    if (lowerIndustry.includes('security') || lowerIndustry.includes('cyber')) {
      broadTerms.push(
        'cybersecurity',
        'information security',
        'data protection',
        'network security',
        'security software'
      );
    }

    // Marketing/Advertising
    if (lowerIndustry.includes('marketing') || lowerIndustry.includes('advertising') ||
        lowerIndustry.includes('martech')) {
      broadTerms.push(
        'digital marketing',
        'advertising',
        'marketing technology',
        'customer acquisition',
        'media'
      );
    }

    // If no specific match, use the original term plus generic tech terms
    if (broadTerms.length === 0) {
      broadTerms.push(industry);
      // Add generic enterprise terms for fallback
      broadTerms.push('technology', 'software', 'enterprise');
    }

    return broadTerms;
  }

  private buildFilingUrl(cik: string, accession: string): string {
    if (!cik || !accession) return '';
    const cleanCik = cik.replace(/^0+/, '');
    const cleanAccession = accession.replace(/-/g, '');
    return `${this.FILING_URL}/${cleanCik}/${cleanAccession}`;
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDateMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0];
  }

  private categorizeInsight(query: string): SECInsight['type'] {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('risk') || lowerQuery.includes('challenge')) return 'risk_factor';
    if (lowerQuery.includes('strategic') || lowerQuery.includes('initiative')) return 'strategic_initiative';
    if (lowerQuery.includes('market') || lowerQuery.includes('trend')) return 'market_concern';
    if (lowerQuery.includes('priority') || lowerQuery.includes('investment')) return 'executive_priority';
    return 'pain_point';
  }

  private extractKeywords(query: string): string[] {
    // Extract quoted phrases and key terms
    const quoted = query.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
    return quoted.slice(0, 5);
  }

  private emptySearchResult(query: string): SECSearchResult {
    return {
      filings: [],
      totalHits: 0,
      query,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton
export const secEdgarAPI = new SECEdgarAPIService();

// Export class for testing
export { SECEdgarAPIService };
