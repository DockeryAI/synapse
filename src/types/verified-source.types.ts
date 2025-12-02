/**
 * Verified Source Types - Triggers 4.0
 *
 * CRITICAL: Source Preservation Layer
 *
 * These types ensure that raw scraped data flows through the entire
 * pipeline UNCHANGED. The LLM can score and categorize, but NEVER
 * generates or modifies source URLs, quotes, or authors.
 *
 * Problem Solved:
 * - V4/V5 had 4% source verification (1/24 sources valid)
 * - LLM was hallucinating URLs, quotes, and author names
 * - This layer preserves verbatim scraped data
 *
 * Created: 2025-12-01
 */

// ============================================================================
// CORE VERIFIED SOURCE TYPE
// ============================================================================

/**
 * Platform types for source attribution
 * Maps to actual scraper sources
 */
export type SourcePlatform =
  | 'reddit'
  | 'twitter'
  | 'youtube'
  | 'hackernews'
  | 'g2'
  | 'trustpilot'
  | 'capterra'
  | 'linkedin'
  | 'quora'
  | 'producthunt'
  | 'google_reviews'
  | 'yelp'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'clutch'
  | 'gartner'
  | 'unknown';

/**
 * Source type for multi-signal triangulation
 * Higher confidence when 2+ different types agree
 */
export type SourceType =
  | 'voc'        // Voice of Customer: reviews, testimonials
  | 'community'  // Community discussions: Reddit, forums
  | 'event'      // Event-based: product launches, announcements
  | 'executive'  // Executive/thought leader content
  | 'news'       // News articles, press releases
  | 'social';    // Social media posts

/**
 * Verification status of a source
 */
export type VerificationStatus =
  | 'verified'      // URL validated, content matches
  | 'unverified'    // Not yet validated
  | 'invalid'       // URL broken or content mismatch
  | 'archived';     // Content older than 90 days

/**
 * Immutable source record from scrapers
 *
 * CRITICAL: These fields must NEVER be modified after scraping.
 * The LLM can reference these but CANNOT generate new values.
 */
export interface VerifiedSource {
  /** Unique identifier for this source */
  id: string;

  /** Original URL exactly as scraped - NEVER modify */
  originalUrl: string;

  /** Original author/username exactly as scraped - NEVER modify */
  originalAuthor: string;

  /** Verbatim quote/content exactly as scraped - NEVER modify */
  originalContent: string;

  /** Platform where this was scraped from */
  platform: SourcePlatform;

  /** ISO timestamp of when this was scraped */
  scrapedAt: string;

  /** ISO timestamp of the original post (if available) */
  publishedAt?: string;

  /** Source type for triangulation */
  sourceType: SourceType;

  /** Verification status */
  verificationStatus: VerificationStatus;

  /** Last time URL was validated */
  lastVerifiedAt?: string;

  /** Engagement metrics (upvotes, likes, etc.) */
  engagement?: number;

  /** Competitor name if this is about a specific competitor */
  competitorName?: string;

  /** Subreddit, channel, or community name */
  communityName?: string;

  /** Post/thread title if available */
  threadTitle?: string;
}

// ============================================================================
// LLM SCORING OUTPUT (what the LLM CAN generate)
// ============================================================================

/**
 * LLM-generated scoring for a source
 *
 * The LLM can ONLY generate these fields - NEVER URLs, quotes, or authors.
 */
export interface SourceScoring {
  /** Reference to the verified source being scored */
  sourceId: string;

  /** Relevance score to the UVP (0-100) */
  relevanceScore: number;

  /** Trigger type classification */
  triggerType: 'pain_point' | 'competitor_mention' | 'buying_signal' | 'feature_request' | 'praise' | 'complaint';

  /** One-sentence summary of the insight */
  summary: string;

  /** Psychological triggers detected */
  psychologicalTriggers: string[];

  /** Buyer journey stage */
  buyerJourneyStage: 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';

  /** Buyer-product fit score (0-1) */
  buyerProductFit: number;

  /** Reasoning for the fit score */
  fitReasoning: string;
}

// ============================================================================
// TRIANGULATED TRIGGER (combines multiple verified sources)
// ============================================================================

/**
 * Confidence level based on source triangulation
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified';

/**
 * A trigger backed by verified sources
 *
 * This is the output format that replaces the hallucinated triggers.
 */
export interface TriangulatedTrigger {
  /** Unique identifier */
  id: string;

  /** LLM-generated title (from scoring, not source content) */
  title: string;

  /** LLM-generated summary (from scoring, not source content) */
  executiveSummary: string;

  /** Trigger category */
  category: 'fear' | 'desire' | 'pain-point' | 'objection' | 'motivation' | 'trust' | 'urgency';

  /** Verified sources backing this trigger (NEVER hallucinated) */
  verifiedSources: VerifiedSource[];

  /** LLM scoring for each source */
  sourceScorings: SourceScoring[];

  /** Confidence based on triangulation */
  confidence: ConfidenceLevel;

  /** Number of unique source types (higher = more confidence) */
  sourceTypeCount: number;

  /** Number of unique platforms (higher = more confidence) */
  platformCount: number;

  /** Average relevance score across sources */
  avgRelevanceScore: number;

  /** Whether any source is less than 7 days old */
  isTimeSensitive: boolean;

  /** Buyer journey stage (most common across sources) */
  buyerJourneyStage: 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';

  /** Average buyer-product fit */
  buyerProductFit: number;
}

// ============================================================================
// CONFIDENCE SCORING UTILITIES
// ============================================================================

/**
 * Calculate confidence level from source count and diversity
 *
 * HIGH (80-100): 3+ sources from 2+ platforms
 * MEDIUM (50-79): 2 sources OR 1 high-engagement source
 * LOW (20-49): 1 source only
 * UNVERIFIED (<20): No verified sources
 */
export function calculateConfidence(
  sources: VerifiedSource[],
  scorings: SourceScoring[]
): { level: ConfidenceLevel; score: number } {
  const verifiedSources = sources.filter(s => s.verificationStatus === 'verified');

  if (verifiedSources.length === 0) {
    return { level: 'unverified', score: 0 };
  }

  // Count unique platforms and source types
  const platforms = new Set(verifiedSources.map(s => s.platform));
  const sourceTypes = new Set(verifiedSources.map(s => s.sourceType));

  // Base score from source count
  let score = Math.min(verifiedSources.length * 20, 60);

  // Bonus for platform diversity (up to 20 points)
  score += Math.min((platforms.size - 1) * 10, 20);

  // Bonus for source type diversity (up to 20 points)
  score += Math.min((sourceTypes.size - 1) * 10, 20);

  // Average relevance boost (up to 10 points)
  if (scorings.length > 0) {
    const avgRelevance = scorings.reduce((sum, s) => sum + s.relevanceScore, 0) / scorings.length;
    score += avgRelevance / 10;
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine level
  let level: ConfidenceLevel;
  if (score >= 80) {
    level = 'high';
  } else if (score >= 50) {
    level = 'medium';
  } else if (score >= 20) {
    level = 'low';
  } else {
    level = 'unverified';
  }

  return { level, score };
}

/**
 * Check if a source is fresh (less than 90 days old)
 */
export function isSourceFresh(source: VerifiedSource): boolean {
  if (!source.publishedAt && !source.scrapedAt) {
    return false;
  }

  const timestamp = source.publishedAt || source.scrapedAt;
  const date = new Date(timestamp);
  const now = new Date();
  const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  return daysDiff <= 90;
}

/**
 * Validate a URL domain matches claimed platform
 */
export function validatePlatformUrl(url: string, platform: SourcePlatform): boolean {
  const platformDomains: Record<SourcePlatform, string[]> = {
    reddit: ['reddit.com', 'redd.it'],
    twitter: ['twitter.com', 'x.com', 't.co'],
    youtube: ['youtube.com', 'youtu.be'],
    hackernews: ['news.ycombinator.com'],
    g2: ['g2.com'],
    trustpilot: ['trustpilot.com'],
    capterra: ['capterra.com'],
    linkedin: ['linkedin.com'],
    quora: ['quora.com'],
    producthunt: ['producthunt.com'],
    google_reviews: ['google.com', 'maps.google.com'],
    yelp: ['yelp.com'],
    facebook: ['facebook.com', 'fb.com'],
    instagram: ['instagram.com'],
    tiktok: ['tiktok.com'],
    clutch: ['clutch.co'],
    gartner: ['gartner.com'],
    unknown: [],
  };

  const domains = platformDomains[platform];
  if (domains.length === 0) {
    return true; // Can't validate unknown platforms
  }

  try {
    const urlObj = new URL(url);
    return domains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}
