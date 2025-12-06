/**
 * Pain Dictionary (Source-Specific)
 *
 * Different sources express pain/intent differently.
 * This dictionary maps source types to appropriate pain vocabulary.
 * Global per source, NOT per brand.
 */

export type SourceType =
  | 'consumer-reviews'      // Yelp, Google Maps
  | 'b2b-reviews'           // G2, Capterra, TrustRadius
  | 'social-emotional'      // Reddit, Twitter
  | 'social-professional'   // LinkedIn
  | 'sec-filings'           // SEC API
  | 'uk-filings'            // Companies House
  | 'job-postings'          // Job boards
  | 'earnings'              // Earnings calls
  | 'news'                  // News articles
  | 'tech-community'        // HackerNews, ProductHunt, IndieHackers
  | 'default';

export interface PainVocabulary {
  terms: string[];
  description: string;
}

/**
 * Pain dictionaries by source type
 * Each source expresses pain/intent differently
 */
export const PAIN_DICTIONARIES: Record<SourceType, PainVocabulary> = {
  'consumer-reviews': {
    description: 'Emotional, direct complaints from consumers',
    terms: [
      'terrible', 'worst', 'waste', 'disappointed', 'never again',
      'horrible', 'awful', 'rude', 'unprofessional', 'overpriced',
      'scam', 'avoid', 'nightmare', 'disaster', 'regret',
      'broken', 'late', 'slow', 'unreliable', 'poor quality',
      'would not recommend', 'stay away', 'don\'t bother',
    ],
  },
  'b2b-reviews': {
    description: 'Professional critique in B2B review platforms',
    terms: [
      'lacks', 'missing', 'wish', 'clunky', 'no support',
      'cons', 'difficult', 'steep learning curve', 'buggy', 'slow',
      'expensive', 'not intuitive', 'poor documentation', 'limited',
      'frustrating', 'outdated', 'needs improvement', 'unreliable',
      'hard to use', 'not worth', 'overpriced for', 'better alternatives',
      'would be nice if', 'hoping for', 'dealbreaker',
    ],
  },
  'social-emotional': {
    description: 'Raw, unfiltered emotional expression on social platforms',
    terms: [
      'frustrated', 'hate', 'struggling', 'nightmare', 'help',
      'rant', 'annoyed', 'can\'t believe', 'why does', 'ugh',
      'sick of', 'tired of', 'fed up', 'over it', 'done with',
      'anyone else', 'is it just me', 'need advice', 'what should I do',
      'recommendation', 'alternative', 'switching from', 'leaving',
    ],
  },
  'social-professional': {
    description: 'Professional reflections and lessons learned',
    terms: [
      'lessons learned', 'challenge', 'pivot', 'transformation',
      'what I learned', 'mistake', 'failure', 'setback', 'obstacle',
      'how we overcame', 'turning point', 'wake-up call', 'realized',
      'changed our approach', 'rethinking', 'evolving', 'adapting',
      'struggle', 'journey', 'honest reflection', 'hard truth',
    ],
  },
  'sec-filings': {
    description: 'Corporate risk disclosure and strategic intent language',
    terms: [
      'risk', 'challenge', 'headwind', 'investing in', 'priority',
      'uncertainty', 'pressure', 'decline', 'downturn', 'exposure',
      'material weakness', 'significant', 'adverse', 'negative impact',
      'strategic initiative', 'transformation', 'modernization',
      'digital', 'technology investment', 'operational efficiency',
      'cost reduction', 'restructuring', 'acquisition', 'divestiture',
    ],
  },
  'uk-filings': {
    description: 'UK corporate filing language for strategic signals',
    terms: [
      'restructuring', 'strategic review', 'material uncertainty',
      'going concern', 'trading conditions', 'market headwinds',
      'operational challenges', 'cost pressures', 'investment programme',
      'digital transformation', 'efficiency programme', 'growth strategy',
    ],
  },
  'job-postings': {
    description: 'Implicit pain signals through hiring patterns',
    terms: [
      'hiring', 'seeking', 'building team', 'scaling', 'urgent',
      'immediately', 'growing', 'expanding', 'new role', 'first hire',
      'greenfield', 'transformation', 'modernize', 'overhaul',
      'replace', 'upgrade', 'implement', 'build out', 'establish',
      'multiple positions', 'rapid growth', 'hypergrowth',
    ],
  },
  'earnings': {
    description: 'Earnings call language indicating challenges or focus areas',
    terms: [
      'below expectations', 'headwinds', 'need to improve', 'focusing on',
      'disappointed', 'challenged', 'soft', 'weakness', 'pressure',
      'investing heavily', 'priority', 'key initiative', 'transformation',
      'accelerating', 'doubling down', 'critical', 'strategic imperative',
    ],
  },
  'news': {
    description: 'News coverage signals',
    terms: [
      'announces', 'launches', 'responds to', 'addresses', 'invests in',
      'acquires', 'partners with', 'expands', 'restructures', 'lays off',
      'struggles with', 'faces', 'grapples with', 'tackles', 'overhauls',
      'amid concerns', 'following criticism', 'in response to',
    ],
  },
  'tech-community': {
    description: 'Technical community discussions and builder conversations',
    terms: [
      'problem', 'pain point', 'why I built', 'failed', 'struggled',
      'looking for', 'any recommendations', 'alternatives to', 'vs',
      'migrating from', 'switching to', 'replaced', 'ditched',
      'show HN', 'ask HN', 'feedback', 'roast my', 'critique',
      'what stack', 'how do you', 'best practices',
    ],
  },
  'default': {
    description: 'Generic pain terms for unknown sources',
    terms: [
      'problem', 'issue', 'challenge', 'difficulty', 'struggle',
      'frustrated', 'disappointed', 'need', 'want', 'looking for',
      'help', 'advice', 'recommendation', 'alternative',
    ],
  },
};

/**
 * Map API source names to source types
 */
const SOURCE_TYPE_MAP: Record<string, SourceType> = {
  // Consumer reviews
  'yelp': 'consumer-reviews',
  'google-maps': 'consumer-reviews',
  'google-reviews': 'consumer-reviews',
  'facebook': 'consumer-reviews',
  'trustpilot': 'consumer-reviews',

  // B2B reviews
  'g2': 'b2b-reviews',
  'capterra': 'b2b-reviews',
  'trustradius': 'b2b-reviews',
  'gartner': 'b2b-reviews',

  // Social emotional
  'reddit': 'social-emotional',
  'twitter': 'social-emotional',
  'twitter-api': 'social-emotional',

  // Social professional
  'linkedin': 'social-professional',
  'linkedin-serper': 'social-professional',

  // Corporate filings
  'sec-api-io': 'sec-filings',
  'sec-edgar': 'sec-filings',
  'sec': 'sec-filings',
  'companies-house': 'uk-filings',

  // Job postings
  'job-postings': 'job-postings',
  'linkedin-jobs': 'job-postings',
  'indeed': 'job-postings',

  // Earnings
  'earnings': 'earnings',
  'earnings-call': 'earnings',

  // News
  'serper': 'news',
  'serper-news': 'news',
  'newsapi': 'news',
  'perplexity': 'news',

  // Tech community
  'hackernews': 'tech-community',
  'producthunt': 'tech-community',
  'indiehackers': 'tech-community',
};

/**
 * Get source type from API source name
 */
export function getSourceType(source: string): SourceType {
  const normalized = source.toLowerCase().trim();
  return SOURCE_TYPE_MAP[normalized] ?? 'default';
}

/**
 * Get pain vocabulary for a source
 */
export function getPainVocabulary(source: string): PainVocabulary {
  const sourceType = getSourceType(source);
  return PAIN_DICTIONARIES[sourceType];
}

/**
 * Check if text contains pain terms for the given source
 */
export function matchesPainDictionary(text: string, source: string): boolean {
  const lowerText = text.toLowerCase();
  const vocabulary = getPainVocabulary(source);

  return vocabulary.terms.some(term => lowerText.includes(term.toLowerCase()));
}

/**
 * Get all matched pain terms in text
 */
export function getMatchedPainTerms(text: string, source: string): string[] {
  const lowerText = text.toLowerCase();
  const vocabulary = getPainVocabulary(source);

  return vocabulary.terms.filter(term => lowerText.includes(term.toLowerCase()));
}
