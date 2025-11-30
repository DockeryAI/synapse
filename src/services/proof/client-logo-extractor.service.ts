/**
 * Client Logo Extractor Service
 *
 * Extracts client/partner logos from "Trusted By" sections.
 * Identifies recognizable brand names for credibility proof.
 *
 * Created: 2025-11-29 (Phase 7.4)
 */

import { SerperAPI } from '@/services/intelligence/serper-api';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedLogo {
  companyName: string;              // Company name
  isRecognizable: boolean;          // Is it a well-known brand?
  category?: 'fortune500' | 'enterprise' | 'startup' | 'agency' | 'other';
  industry?: string;
  logoUrl?: string;                 // If we can extract it
  sourceUrl: string;                // Page where found
}

export interface ClientLogoResult {
  brandName: string;
  logos: ExtractedLogo[];
  totalCount: number;
  recognizableCount: number;
  fortune500Count: number;
  enterpriseCount: number;
  fetchedAt: Date;
}

// ============================================================================
// RECOGNIZABLE BRANDS DATABASE
// ============================================================================

// Use word boundaries (\b) to prevent partial matches like "intel" in "intelligent"
const FORTUNE_500_PATTERNS = [
  /\bwalmart\b/i, /\bamazon\b/i, /\bapple\b/i, /\bcvs\b/i, /\bunitedhealth\b/i,
  /\bberkshire\b/i, /\bmckesson\b/i, /\bamerisource\b/i, /\balphabet\b/i, /\bgoogle\b/i,
  /\bexxon\b/i, /\bat&t\b/i, /\bcostco\b/i, /\bcigna\b/i, /\bcardinal\b/i,
  /\bchevron\b/i, /\bwalgreens\b/i, /\bkroger\b/i, /\bmarathon\b/i, /\bfannie mae\b/i,
  /\bjpmorgan\b/i, /\bverizon\b/i, /\bford\b/i, /\bgeneral motors\b/i, /\bmicrosoft\b/i,
  /\banthem\b/i, /\bhome depot\b/i, /\bboeing\b/i, /\bwells fargo\b/i, /\bcitigroup\b/i,
  /\bcomcast\b/i, /\bphillips 66\b/i, /\bvalero\b/i, /\bdell\b/i, /\btarget\b/i,
  /\bups\b/i, /\bfedex\b/i, /\bjohnson & johnson\b/i, /\bstate farm\b/i, /\bmetlife\b/i,
  /\bprocter & gamble\b/i, /\bp&g\b/i, /\bpfizer\b/i, /\bibm\b/i, /\bintel\b/i,
  /\bdisney\b/i, /\bcoca-cola\b/i, /\bpepsico\b/i, /\bcisco\b/i, /\boracle\b/i,
  /\bsalesforce\b/i, /\badobe\b/i, /\bnetflix\b/i, /\bpaypal\b/i, /\bnvidia\b/i,
  /\buber\b/i, /\bairbnb\b/i, /\bslack\b/i, /\bzoom\b/i, /\bshopify\b/i,
  /\bstripe\b/i, /\bsquare\b/i, /\btwilio\b/i, /\bdatadog\b/i, /\bsnowflake\b/i,
  /\bhubspot\b/i, /\bzendesk\b/i, /\batlassian\b/i, /\bservicenow\b/i, /\bworkday\b/i
];

const ENTERPRISE_PATTERNS = [
  /\baccenture\b/i, /\bdeloitte\b/i, /\bmckinsey\b/i, /\bpwc\b/i, /\bkpmg\b/i, /\bey\b/i,
  /\bbain\b/i, /\bbcg\b/i, /\bbooz allen\b/i, /\bcapgemini\b/i, /\bcognizant\b/i,
  /\binfosys\b/i, /\bwipro\b/i, /\btcs\b/i, /\bhcl\b/i, /\btech mahindra\b/i,
  /\bsap\b/i, /\bsiemens\b/i, /\bphilips\b/i, /\bge\b/i, /\bgeneral electric\b/i,
  /\b3m\b/i, /\bhoneywell\b/i, /\blockheed\b/i, /\braytheon\b/i, /\bnorthrop\b/i,
  /\bcaterpillar\b/i, /\bjohn deere\b/i, /\btoyota\b/i, /\bhonda\b/i, /\bbmw\b/i,
  /\bmercedes\b/i, /\bvolkswagen\b/i, /\baudi\b/i, /\bporsche\b/i, /\btesla\b/i
];

// ============================================================================
// SERVICE
// ============================================================================

class ClientLogoExtractorService {
  private serperApi = SerperAPI;

  /**
   * Main entry point - extract client logos for a brand
   */
  async extractClientLogos(brandName: string, websiteUrl?: string): Promise<ClientLogoResult> {
    console.log('[ClientLogoExtractor] Starting for:', brandName);

    const result: ClientLogoResult = {
      brandName,
      logos: [],
      totalCount: 0,
      recognizableCount: 0,
      fortune500Count: 0,
      enterpriseCount: 0,
      fetchedAt: new Date()
    };

    try {
      // Search for "trusted by" / "our customers" pages
      const clientPages = await this.findClientPages(brandName, websiteUrl);

      // Extract company names from search results
      for (const page of clientPages) {
        const logos = this.extractLogosFromSearchResult(page);
        result.logos.push(...logos);
      }

      // Deduplicate
      result.logos = this.deduplicateLogos(result.logos);

      // Count categories
      result.totalCount = result.logos.length;
      result.recognizableCount = result.logos.filter(l => l.isRecognizable).length;
      result.fortune500Count = result.logos.filter(l => l.category === 'fortune500').length;
      result.enterpriseCount = result.logos.filter(l => l.category === 'enterprise').length;

      console.log('[ClientLogoExtractor] Found:', {
        total: result.totalCount,
        recognizable: result.recognizableCount,
        fortune500: result.fortune500Count
      });

    } catch (error) {
      console.warn('[ClientLogoExtractor] Error:', error);
    }

    return result;
  }

  /**
   * Find pages with client logos via search
   */
  private async findClientPages(brandName: string, websiteUrl?: string): Promise<{ title: string; snippet: string; link: string }[]> {
    const results: { title: string; snippet: string; link: string }[] = [];

    try {
      const siteQuery = websiteUrl ? `site:${new URL(websiteUrl).hostname}` : `"${brandName}"`;
      const queries = [
        `${siteQuery} "trusted by"`,
        `${siteQuery} "our customers"`,
        `${siteQuery} "companies that use"`,
        `${siteQuery} customers clients logos`
      ];

      for (const query of queries.slice(0, 2)) {
        const searchResults = await this.serperApi.searchGoogle(query);
        results.push(...searchResults.slice(0, 5));
      }
    } catch (error) {
      console.warn('[ClientLogoExtractor] Search error:', error);
    }

    return results;
  }

  /**
   * Extract company names from search result text
   */
  private extractLogosFromSearchResult(result: { title: string; snippet: string; link: string }): ExtractedLogo[] {
    const logos: ExtractedLogo[] = [];
    const text = `${result.title} ${result.snippet}`;

    // Extract company names mentioned
    const companyNames = this.extractCompanyNames(text);

    for (const name of companyNames) {
      const logo: ExtractedLogo = {
        companyName: name,
        isRecognizable: false,
        sourceUrl: result.link
      };

      // Check if Fortune 500
      for (const pattern of FORTUNE_500_PATTERNS) {
        if (pattern.test(name)) {
          logo.isRecognizable = true;
          logo.category = 'fortune500';
          break;
        }
      }

      // Check if Enterprise (if not Fortune 500)
      if (!logo.isRecognizable) {
        for (const pattern of ENTERPRISE_PATTERNS) {
          if (pattern.test(name)) {
            logo.isRecognizable = true;
            logo.category = 'enterprise';
            break;
          }
        }
      }

      logos.push(logo);
    }

    return logos;
  }

  /**
   * Extract company names from text
   */
  private extractCompanyNames(text: string): string[] {
    const names: string[] = [];
    const textLower = text.toLowerCase();

    // Only extract customer names if text contains customer-related context
    const hasCustomerContext = /trusted by|used by|customers include|clients include|companies like|our customers|our clients|work with|partnered with|chosen by|case stud|success stor/i.test(text);

    // Pattern: Company names are usually capitalized words
    // Look for patterns like "Trusted by Google, Microsoft, Amazon"
    const listPatterns = [
      /(?:trusted by|used by|customers include|clients include|companies like)[:\s]+([^.]+)/gi,
      /(?:including|such as|like)\s+([A-Z][A-Za-z\s,&]+(?:,\s*[A-Z][A-Za-z\s&]+)+)/g
    ];

    for (const pattern of listPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          // Split by comma and clean up
          const companies = match[1].split(/,|and/).map(s => s.trim()).filter(s => s.length > 1);
          names.push(...companies);
        }
      }
    }

    // Only look for standalone brand names if the text has customer context
    // This prevents matching "GE" in unrelated contexts
    if (!hasCustomerContext) {
      return [...new Set(names)].slice(0, 20);
    }

    // Map patterns to proper capitalized names
    const brandNameMap: Record<string, string> = {
      'intel': 'Intel', 'ibm': 'IBM', 'amazon': 'Amazon', 'google': 'Google',
      'microsoft': 'Microsoft', 'apple': 'Apple', 'disney': 'Disney',
      'salesforce': 'Salesforce', 'adobe': 'Adobe', 'oracle': 'Oracle',
      'cisco': 'Cisco', 'nvidia': 'NVIDIA', 'dell': 'Dell', 'hp': 'HP',
      'ge': 'GE', 'siemens': 'Siemens', 'sap': 'SAP', 'tesla': 'Tesla',
      'toyota': 'Toyota', 'honda': 'Honda', 'bmw': 'BMW', 'mercedes': 'Mercedes',
      'netflix': 'Netflix', 'uber': 'Uber', 'airbnb': 'Airbnb', 'slack': 'Slack',
      'zoom': 'Zoom', 'shopify': 'Shopify', 'stripe': 'Stripe', 'twilio': 'Twilio',
      'hubspot': 'HubSpot', 'zendesk': 'Zendesk', 'atlassian': 'Atlassian',
      'deloitte': 'Deloitte', 'accenture': 'Accenture', 'mckinsey': 'McKinsey',
      'pwc': 'PwC', 'kpmg': 'KPMG', 'boeing': 'Boeing', 'fedex': 'FedEx'
    };

    for (const pattern of [...FORTUNE_500_PATTERNS, ...ENTERPRISE_PATTERNS]) {
      const match = text.match(pattern);
      if (match) {
        const matchedName = match[0].toLowerCase();
        // Use proper capitalization from map, or capitalize first letter
        const properName = brandNameMap[matchedName] ||
          match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
        names.push(properName);
      }
    }

    return [...new Set(names)].slice(0, 20); // Max 20 unique names
  }

  /**
   * Deduplicate logos by company name
   */
  private deduplicateLogos(logos: ExtractedLogo[]): ExtractedLogo[] {
    const seen = new Map<string, ExtractedLogo>();

    for (const logo of logos) {
      const key = logo.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!seen.has(key)) {
        seen.set(key, logo);
      } else {
        // Keep the one with more info
        const existing = seen.get(key)!;
        if (logo.isRecognizable && !existing.isRecognizable) {
          seen.set(key, logo);
        }
      }
    }

    return Array.from(seen.values());
  }
}

export const clientLogoExtractorService = new ClientLogoExtractorService();
export default clientLogoExtractorService;
