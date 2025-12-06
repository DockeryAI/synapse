/**
 * B2B Domain Configuration
 *
 * Maps API sources to semantic domains for cross-domain unexpectedness scoring.
 * B2B buyers signal intent differently than B2C - through corporate actions.
 */

export const B2B_DOMAINS = {
  corporateFilings: ['sec-api-io', 'sec-edgar', 'sec', 'companies-house'],
  talentSignals: ['job-postings', 'linkedin-jobs', 'indeed', 'glassdoor'],
  fundingMA: ['crunchbase', 'pitchbook', 'funding-news'],
  executiveVoice: ['linkedin', 'linkedin-serper', 'earnings', 'earnings-call'],
  community: ['g2', 'capterra', 'trustradius', 'hackernews', 'reddit-professional', 'producthunt'],
  industryNews: ['serper-news', 'newsapi', 'perplexity', 'industry-news'],
  research: ['gartner', 'forrester', 'analyst-reports'],
} as const;

export type B2BDomain = keyof typeof B2B_DOMAINS;

/**
 * Get domain for a B2B source
 */
export function getB2BDomain(source: string): B2BDomain | null {
  const normalizedSource = source.toLowerCase();

  for (const [domain, sources] of Object.entries(B2B_DOMAINS)) {
    if (sources.some(s => normalizedSource.includes(s))) {
      return domain as B2BDomain;
    }
  }

  return null;
}

/**
 * Check if two sources are from different B2B domains
 */
export function areB2BSourcesCrossDomain(source1: string, source2: string): boolean {
  const domain1 = getB2BDomain(source1);
  const domain2 = getB2BDomain(source2);

  // If either is unknown, treat as different domain
  if (!domain1 || !domain2) return true;

  return domain1 !== domain2;
}

/**
 * B2B Three-Way Connection Examples
 *
 * These represent "holy shit" breakthrough moments:
 *
 * Example 1:
 * - corporateFilings: "MetLife investing in digital transformation"
 * - talentSignals: "MetLife hiring 5 AI Engineers"
 * - executiveVoice: "MetLife CTO discusses customer experience challenges"
 * = Signal: MetLife is actively buying AI solutions NOW
 *
 * Example 2:
 * - community: "Insurance CRMs are garbage, anyone switched recently?"
 * - corporateFilings: "Prudential restructuring sales operations"
 * - fundingMA: "Competitor acquired for $500M"
 * = Signal: Market in flux, timing opportunity
 */
