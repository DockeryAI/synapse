/**
 * Reddit SMB Analyzer Service
 *
 * Enhanced Reddit integration for SMB market intelligence.
 * Expands subreddit coverage for SMB communities and implements
 * pattern detection for high-intent buying signals.
 *
 * Features:
 * - SMB-specific subreddit targeting (r/smallbusiness, r/Entrepreneur, etc.)
 * - "Asking for recommendations" pattern detection
 * - Comment-level sentiment analysis
 * - Competitor mention extraction
 * - Buying intent classification
 *
 * Created: 2025-12-01
 * Phase: Triggers 3.0 - Phase 2 (SMB Signal Pipeline)
 */

import type { BusinessProfileType } from './profile-detection.service';
import { competitorAttributionService } from './competitor-attribution.service';

// ============================================================================
// TYPES
// ============================================================================

export interface RedditSMBPost {
  id: string;
  title: string;
  body: string;
  subreddit: string;
  author: string;
  url: string;
  score: number;
  numComments: number;
  createdUtc: number;
  permalink: string;
}

export interface RedditSMBComment {
  id: string;
  body: string;
  author: string;
  score: number;
  createdUtc: number;
  parentId: string;
  postId: string;
  subreddit: string;
  permalink: string;
}

export interface RecommendationRequest {
  /** The original post/comment text */
  text: string;
  /** Type of recommendation being sought */
  type: 'software' | 'service' | 'tool' | 'vendor' | 'agency' | 'consultant' | 'general';
  /** Specific category being asked about */
  category?: string;
  /** Budget mentioned if any */
  budgetMentioned?: string;
  /** Urgency indicators */
  urgencyLevel: 'immediate' | 'soon' | 'researching' | 'unknown';
  /** Company size indicators */
  companySizeIndicator?: 'solo' | 'small-team' | 'growing' | 'established' | 'unknown';
  /** Confidence in this being a genuine recommendation request */
  confidence: number;
  /** Source URL */
  url: string;
  /** Timestamp */
  timestamp: string;
}

export interface SMBSignal {
  /** Unique identifier */
  id: string;
  /** Signal type */
  type: 'recommendation-request' | 'pain-point' | 'competitor-complaint' | 'switching-intent' | 'success-story' | 'question';
  /** The extracted insight */
  insight: string;
  /** Original text */
  rawText: string;
  /** Source subreddit */
  subreddit: string;
  /** Source URL */
  url: string;
  /** Upvotes/score */
  score: number;
  /** Sentiment */
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  /** Competitor mentioned if any */
  competitorMentioned?: string;
  /** Confidence score */
  confidence: number;
  /** Timestamp */
  timestamp: string;
  /** Business profile relevance */
  profileRelevance: BusinessProfileType[];
}

export interface RedditSMBAnalysisResult {
  /** Detected recommendation requests */
  recommendationRequests: RecommendationRequest[];
  /** All extracted SMB signals */
  signals: SMBSignal[];
  /** Summary statistics */
  stats: {
    totalPostsAnalyzed: number;
    totalCommentsAnalyzed: number;
    recommendationRequestsFound: number;
    painPointsFound: number;
    competitorMentions: number;
    switchingIntentSignals: number;
  };
  /** Subreddits searched */
  subredditsSearched: string[];
  /** Search query used */
  searchQuery: string;
  /** Analysis timestamp */
  timestamp: string;
}

// ============================================================================
// SMB SUBREDDIT CONFIGURATION
// ============================================================================

/**
 * SMB-focused subreddits by business profile
 */
const SMB_SUBREDDITS: Record<BusinessProfileType, string[]> = {
  'local-service-b2b': [
    'smallbusiness',
    'Entrepreneur',
    'msp', // Managed Service Providers
    'sysadmin',
    'ITManagers',
    'HVAC',
    'commercialcleaning',
    'PropertyManagement',
    'facilities',
  ],
  'local-service-b2c': [
    'smallbusiness',
    'Entrepreneur',
    'dentistry',
    'Salons',
    'restaurantowners',
    'fitness',
    'HealthcareIT',
    'physicaltherapy',
  ],
  'regional-b2b-agency': [
    'agency',
    'marketing',
    'digital_marketing',
    'advertising',
    'PPC',
    'SEO',
    'socialmedia',
    'Accounting',
    'consulting',
  ],
  'regional-retail-b2c': [
    'franchise',
    'restaurantowners',
    'retailnews',
    'ecommerce',
    'shopify',
    'FulfillmentByAmazon',
  ],
  'national-saas-b2b': [
    'SaaS',
    'startups',
    'Entrepreneur',
    'ProductManagement',
    'sales',
    'CustomerSuccess',
    'B2BMarketing',
    'GrowthHacking',
  ],
  'national-product-b2c': [
    'ecommerce',
    'FulfillmentByAmazon',
    'DTC',
    'Entrepreneur',
    'shopify',
    'AmazonSeller',
    'dropship',
  ],
  'global-saas-b2b': [
    'SaaS',
    'startups',
    'Entrepreneur',
    'ProductManagement',
    'sales',
    'devops',
    'sysadmin',
    'CRM',
  ],
};

/**
 * General SMB subreddits (always include)
 */
const GENERAL_SMB_SUBREDDITS = [
  'smallbusiness',
  'Entrepreneur',
  'startups',
  'business',
  'AskSmallBusiness',
];

/**
 * Recommendation request patterns
 * These indicate someone is actively seeking product/service recommendations
 */
const RECOMMENDATION_PATTERNS: Array<{ pattern: RegExp; type: RecommendationRequest['type']; weight: number }> = [
  // Direct recommendation asks
  { pattern: /(?:can anyone|anyone|somebody|someone) recommend/i, type: 'general', weight: 1.0 },
  { pattern: /(?:looking for|searching for|need) (?:a |an )?(?:good |reliable |affordable )?(?:recommendation|suggestion)/i, type: 'general', weight: 0.95 },
  { pattern: /what (?:do you|does everyone|would you) (?:use|recommend|suggest)/i, type: 'general', weight: 0.9 },
  { pattern: /(?:best|top|recommended) (?:software|tool|service|platform|solution|app)/i, type: 'software', weight: 0.85 },

  // Software/Tool specific
  { pattern: /(?:looking for|need|searching for) (?:a |an )?(?:CRM|ERP|POS|software|tool|platform|app)/i, type: 'software', weight: 0.9 },
  { pattern: /what (?:CRM|ERP|software|tool|platform) (?:do you|should I|would you)/i, type: 'software', weight: 0.9 },
  { pattern: /(?:alternatives? to|replacement for|instead of|better than) \w+/i, type: 'software', weight: 0.85 },

  // Service/Vendor specific
  { pattern: /(?:looking for|need|hiring|searching for) (?:a |an )?(?:agency|consultant|contractor|vendor|freelancer)/i, type: 'agency', weight: 0.9 },
  { pattern: /(?:can you|anyone) recommend (?:a |an )?(?:good |reliable )?(?:agency|consultant|contractor|vendor)/i, type: 'agency', weight: 0.95 },
  { pattern: /(?:who do you use for|what company do you use for)/i, type: 'vendor', weight: 0.85 },

  // General help seeking
  { pattern: /(?:help me find|help finding|where can I find)/i, type: 'general', weight: 0.7 },
  { pattern: /any (?:suggestions|recommendations|ideas) for/i, type: 'general', weight: 0.8 },
];

/**
 * Pain point patterns
 */
const PAIN_POINT_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /(?:frustrated|frustrating|hate|annoying|annoyed) (?:with|by|that)/i, category: 'frustration' },
  { pattern: /(?:struggle|struggling|hard|difficult|impossible) to/i, category: 'difficulty' },
  { pattern: /(?:waste|wasting|spent|spending) (?:too much |so much )?(?:time|money|hours)/i, category: 'inefficiency' },
  { pattern: /(?:doesn't work|not working|broken|buggy|unreliable)/i, category: 'quality' },
  { pattern: /(?:too expensive|overpriced|can't afford|budget)/i, category: 'cost' },
  { pattern: /(?:no support|terrible support|bad customer service)/i, category: 'support' },
  { pattern: /(?:switched|switching|migrating|moving) (?:from|away from)/i, category: 'switching' },
];

/**
 * Switching intent patterns
 */
const SWITCHING_INTENT_PATTERNS: Array<{ pattern: RegExp; urgency: 'immediate' | 'soon' | 'researching' }> = [
  { pattern: /(?:need to switch|have to switch|must switch|switching) (?:asap|immediately|now|this week)/i, urgency: 'immediate' },
  { pattern: /(?:contract is up|contract ending|subscription ending|renewal coming)/i, urgency: 'soon' },
  { pattern: /(?:considering switching|thinking about switching|might switch|planning to switch)/i, urgency: 'researching' },
  { pattern: /(?:just cancelled|just left|dropped|ditched)/i, urgency: 'immediate' },
  { pattern: /(?:looking to replace|need a replacement|replacing)/i, urgency: 'soon' },
];

/**
 * Company size indicators
 */
const COMPANY_SIZE_PATTERNS: Array<{ pattern: RegExp; size: RecommendationRequest['companySizeIndicator'] }> = [
  { pattern: /(?:just me|solo|solopreneur|one-man|one-person|myself)/i, size: 'solo' },
  { pattern: /(?:small team|few employees|2-10|under 10|less than 10)/i, size: 'small-team' },
  { pattern: /(?:growing|scaling|hiring|expanding|10-50|under 50)/i, size: 'growing' },
  { pattern: /(?:established|50\+|100\+|enterprise|large team)/i, size: 'established' },
];

/**
 * Budget indicators
 */
const BUDGET_PATTERNS: Array<{ pattern: RegExp; range: string }> = [
  { pattern: /(?:free|no budget|can't spend|zero budget)/i, range: '$0' },
  { pattern: /(?:under \$50|less than \$50|\$20-50|cheap)/i, range: '$0-50/mo' },
  { pattern: /(?:\$50-100|\$100|around \$100|about \$100)/i, range: '$50-100/mo' },
  { pattern: /(?:\$100-500|\$200|\$300|\$500|few hundred)/i, range: '$100-500/mo' },
  { pattern: /(?:\$500-1000|\$1000|\$1k|around a thousand)/i, range: '$500-1k/mo' },
  { pattern: /(?:\$1000\+|\$2000|\$5000|enterprise|unlimited budget)/i, range: '$1k+/mo' },
];

// ============================================================================
// SERVICE
// ============================================================================

class RedditSMBAnalyzerService {
  /**
   * Get SMB-relevant subreddits for a business profile
   */
  getSubredditsForProfile(profileType: BusinessProfileType): string[] {
    const profileSubreddits = SMB_SUBREDDITS[profileType] || [];
    const combined = [...new Set([...GENERAL_SMB_SUBREDDITS, ...profileSubreddits])];
    return combined;
  }

  /**
   * Analyze Reddit posts/comments for SMB signals
   */
  analyzeContent(
    posts: RedditSMBPost[],
    comments: RedditSMBComment[],
    profileType?: BusinessProfileType
  ): RedditSMBAnalysisResult {
    const recommendationRequests: RecommendationRequest[] = [];
    const signals: SMBSignal[] = [];
    let competitorMentions = 0;
    let switchingIntentSignals = 0;
    let painPointsFound = 0;

    // Analyze posts
    for (const post of posts) {
      const fullText = `${post.title} ${post.body}`;

      // Check for recommendation requests
      const recRequest = this.detectRecommendationRequest(fullText, post.url, post.createdUtc);
      if (recRequest) {
        recommendationRequests.push(recRequest);
        signals.push(this.createSignal('recommendation-request', recRequest.text, fullText, post));
      }

      // Check for pain points
      const painPoint = this.detectPainPoint(fullText);
      if (painPoint) {
        painPointsFound++;
        signals.push(this.createSignal('pain-point', painPoint, fullText, post));
      }

      // Check for switching intent
      const switchingIntent = this.detectSwitchingIntent(fullText);
      if (switchingIntent) {
        switchingIntentSignals++;
        signals.push(this.createSignal('switching-intent', switchingIntent.text, fullText, post, switchingIntent.urgency));
      }

      // Check for competitor mentions
      const competitors = competitorAttributionService.extractCompetitorMentions(fullText);
      if (competitors.primaryCompetitor) {
        competitorMentions++;
        if (competitors.isCompetitorDisplacement) {
          signals.push(this.createSignal(
            'competitor-complaint',
            `${competitors.displacementType} ${competitors.primaryCompetitor}`,
            fullText,
            post
          ));
        }
      }
    }

    // Analyze comments
    for (const comment of comments) {
      // Check for recommendation requests in comments
      const recRequest = this.detectRecommendationRequest(comment.body, comment.permalink, comment.createdUtc);
      if (recRequest) {
        recommendationRequests.push(recRequest);
      }

      // Check for pain points
      const painPoint = this.detectPainPoint(comment.body);
      if (painPoint) {
        painPointsFound++;
        signals.push({
          id: comment.id,
          type: 'pain-point',
          insight: painPoint,
          rawText: comment.body,
          subreddit: comment.subreddit,
          url: comment.permalink,
          score: comment.score,
          sentiment: 'negative',
          confidence: 0.7,
          timestamp: new Date(comment.createdUtc * 1000).toISOString(),
          profileRelevance: profileType ? [profileType] : [],
        });
      }
    }

    // Determine subreddits searched
    const subredditsSearched = [...new Set([
      ...posts.map(p => p.subreddit),
      ...comments.map(c => c.subreddit),
    ])];

    return {
      recommendationRequests,
      signals,
      stats: {
        totalPostsAnalyzed: posts.length,
        totalCommentsAnalyzed: comments.length,
        recommendationRequestsFound: recommendationRequests.length,
        painPointsFound,
        competitorMentions,
        switchingIntentSignals,
      },
      subredditsSearched,
      searchQuery: '', // Set by caller
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detect recommendation request patterns
   */
  detectRecommendationRequest(
    text: string,
    url: string,
    timestamp: number
  ): RecommendationRequest | null {
    let bestMatch: { type: RecommendationRequest['type']; weight: number } | null = null;

    for (const { pattern, type, weight } of RECOMMENDATION_PATTERNS) {
      if (pattern.test(text)) {
        if (!bestMatch || weight > bestMatch.weight) {
          bestMatch = { type, weight };
        }
      }
    }

    if (!bestMatch || bestMatch.weight < 0.6) {
      return null;
    }

    // Detect urgency
    let urgencyLevel: RecommendationRequest['urgencyLevel'] = 'unknown';
    for (const { pattern, urgency } of SWITCHING_INTENT_PATTERNS) {
      if (pattern.test(text)) {
        urgencyLevel = urgency;
        break;
      }
    }

    // Detect company size
    let companySizeIndicator: RecommendationRequest['companySizeIndicator'] = 'unknown';
    for (const { pattern, size } of COMPANY_SIZE_PATTERNS) {
      if (pattern.test(text)) {
        companySizeIndicator = size;
        break;
      }
    }

    // Detect budget
    let budgetMentioned: string | undefined;
    for (const { pattern, range } of BUDGET_PATTERNS) {
      if (pattern.test(text)) {
        budgetMentioned = range;
        break;
      }
    }

    return {
      text: text.slice(0, 500), // Truncate for storage
      type: bestMatch.type,
      urgencyLevel,
      companySizeIndicator,
      budgetMentioned,
      confidence: bestMatch.weight,
      url,
      timestamp: new Date(timestamp * 1000).toISOString(),
    };
  }

  /**
   * Detect pain point patterns
   */
  detectPainPoint(text: string): string | null {
    for (const { pattern, category } of PAIN_POINT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        // Extract context around the match
        const matchIndex = text.indexOf(match[0]);
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(text.length, matchIndex + match[0].length + 100);
        const context = text.slice(start, end).trim();
        return `[${category}] ${context}`;
      }
    }
    return null;
  }

  /**
   * Detect switching intent
   */
  detectSwitchingIntent(text: string): { text: string; urgency: 'immediate' | 'soon' | 'researching' } | null {
    for (const { pattern, urgency } of SWITCHING_INTENT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const matchIndex = text.indexOf(match[0]);
        const start = Math.max(0, matchIndex - 30);
        const end = Math.min(text.length, matchIndex + match[0].length + 80);
        return {
          text: text.slice(start, end).trim(),
          urgency,
        };
      }
    }
    return null;
  }

  /**
   * Create an SMB signal from detected patterns
   */
  private createSignal(
    type: SMBSignal['type'],
    insight: string,
    rawText: string,
    post: RedditSMBPost,
    urgency?: string
  ): SMBSignal {
    // Detect sentiment
    let sentiment: SMBSignal['sentiment'] = 'neutral';
    if (/frustrated|hate|annoying|terrible|worst|awful/i.test(rawText)) {
      sentiment = 'negative';
    } else if (/love|great|amazing|best|excellent|perfect/i.test(rawText)) {
      sentiment = 'positive';
    } else if (/but|however|although|mixed/i.test(rawText)) {
      sentiment = 'mixed';
    }

    // Check for competitor
    const competitors = competitorAttributionService.extractCompetitorMentions(rawText);

    return {
      id: `${post.id}-${type}`,
      type,
      insight,
      rawText: rawText.slice(0, 1000),
      subreddit: post.subreddit,
      url: post.url || `https://reddit.com${post.permalink}`,
      score: post.score,
      sentiment,
      competitorMentioned: competitors.primaryCompetitor,
      confidence: type === 'recommendation-request' ? 0.9 : 0.7,
      timestamp: new Date(post.createdUtc * 1000).toISOString(),
      profileRelevance: [],
    };
  }

  /**
   * Generate optimized search queries for SMB signals
   */
  generateSearchQueries(
    industry: string,
    productCategory: string,
    profileType: BusinessProfileType
  ): string[] {
    const queries: string[] = [];

    // Recommendation request queries
    queries.push(`"looking for" OR "recommend" ${productCategory}`);
    queries.push(`"best ${productCategory}" OR "top ${productCategory}"`);
    queries.push(`"alternative to" ${productCategory}`);

    // Pain point queries
    queries.push(`"frustrated with" OR "hate" ${productCategory}`);
    queries.push(`"switching from" OR "replacing" ${productCategory}`);

    // Industry-specific
    queries.push(`${industry} software recommendations`);
    queries.push(`${industry} "what do you use"`);

    return queries;
  }

  /**
   * Filter signals by relevance to a specific profile
   */
  filterByProfile(
    signals: SMBSignal[],
    profileType: BusinessProfileType
  ): SMBSignal[] {
    const relevantSubreddits = new Set(this.getSubredditsForProfile(profileType));

    return signals.filter(signal => {
      // Include if from a relevant subreddit
      if (relevantSubreddits.has(signal.subreddit)) {
        return true;
      }
      // Include if explicitly marked as relevant
      if (signal.profileRelevance.includes(profileType)) {
        return true;
      }
      // Include general signals with high confidence
      if (signal.confidence >= 0.85 && GENERAL_SMB_SUBREDDITS.includes(signal.subreddit)) {
        return true;
      }
      return false;
    });
  }

  /**
   * Get high-intent signals (most actionable)
   */
  getHighIntentSignals(result: RedditSMBAnalysisResult): SMBSignal[] {
    return result.signals.filter(signal => {
      // High intent: recommendation requests with urgency
      if (signal.type === 'recommendation-request') {
        return true;
      }
      // High intent: switching intent
      if (signal.type === 'switching-intent') {
        return true;
      }
      // High intent: competitor complaints with high score
      if (signal.type === 'competitor-complaint' && signal.score >= 10) {
        return true;
      }
      return false;
    });
  }
}

// Export singleton
export const redditSMBAnalyzerService = new RedditSMBAnalyzerService();

// Export class for testing
export { RedditSMBAnalyzerService };
