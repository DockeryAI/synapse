/**
 * Source Quality Weighting Service
 *
 * Adjusts trigger scores based on source quality/trust level.
 * Higher quality sources (G2, Trustpilot) get boosted.
 * Lower quality sources (generic LinkedIn posts) get penalized.
 *
 * Now includes PROFILE-SPECIFIC source weighting from TRIGGER_RESEARCH.md:
 * - Local B2B: Government bids, LinkedIn jobs, CISA advisories
 * - Local B2C: Google Reviews, Yelp, Healthgrades
 * - Regional B2B: LinkedIn, RFP platforms, G2
 * - Regional Retail: CoStar, franchise expos, census data
 * - National SaaS: G2, Bombora, 6sense, BuiltWith
 * - National Product: NielsenIQ, retail buyers, social commerce
 *
 * Created: 2025-11-28
 * Updated: 2025-11-29 - Added profile-specific weighting
 */

import type { BusinessProfileType } from './profile-detection.service';

// ============================================================================
// TYPES
// ============================================================================

export type SourceTier = 'tier1' | 'tier2' | 'tier3';

export interface SourceQualityConfig {
  tier: SourceTier;
  multiplier: number;
  description: string;
}

export interface ProfileSourceWeights {
  tier1Sources: string[];
  tier2Sources: string[];
  tier3Sources: string[];
}

export interface SourceQualityResult {
  tier: SourceTier;
  multiplier: number;
  adjustedScore: number;
  reasoning: string;
}

// ============================================================================
// SOURCE CONFIGURATIONS
// ============================================================================

/**
 * Source quality tiers:
 * - Tier 1 (1.2x): High-trust product review platforms, targeted discussions
 * - Tier 2 (1.0x): Industry forums, news, professional networks
 * - Tier 3 (0.7x): Generic social, broad thought leadership
 */
const SOURCE_CONFIGS: Record<string, SourceQualityConfig> = {
  // Tier 1 - High trust product/service reviews
  'g2': { tier: 'tier1', multiplier: 1.25, description: 'B2B software reviews' },
  'g2-crowd': { tier: 'tier1', multiplier: 1.25, description: 'B2B software reviews' },
  'trustpilot': { tier: 'tier1', multiplier: 1.2, description: 'Consumer reviews' },
  'capterra': { tier: 'tier1', multiplier: 1.2, description: 'Software reviews' },
  'gartner': { tier: 'tier1', multiplier: 1.3, description: 'Enterprise analyst' },
  'forrester': { tier: 'tier1', multiplier: 1.3, description: 'Enterprise analyst' },
  'reddit-product': { tier: 'tier1', multiplier: 1.15, description: 'Product-focused Reddit' },
  'reddit': { tier: 'tier1', multiplier: 1.1, description: 'Community discussions' },
  'hackernews': { tier: 'tier1', multiplier: 1.15, description: 'Tech community' },
  'hn': { tier: 'tier1', multiplier: 1.15, description: 'Hacker News' },
  'stackoverflow': { tier: 'tier1', multiplier: 1.1, description: 'Developer Q&A' },
  'google-reviews': { tier: 'tier1', multiplier: 1.15, description: 'Google Business reviews' },
  'yelp': { tier: 'tier1', multiplier: 1.1, description: 'Local business reviews' },

  // Tier 2 - Industry and professional
  'linkedin-company': { tier: 'tier2', multiplier: 1.0, description: 'Company pages' },
  'linkedin-post': { tier: 'tier2', multiplier: 0.95, description: 'Professional posts' },
  'linkedin': { tier: 'tier2', multiplier: 0.9, description: 'Professional network' },
  'industry-forum': { tier: 'tier2', multiplier: 1.05, description: 'Industry forums' },
  'news': { tier: 'tier2', multiplier: 1.0, description: 'News articles' },
  'blog': { tier: 'tier2', multiplier: 0.95, description: 'Industry blogs' },
  'youtube-review': { tier: 'tier2', multiplier: 1.0, description: 'Video reviews' },
  'youtube': { tier: 'tier2', multiplier: 0.9, description: 'Video content' },
  'twitter': { tier: 'tier2', multiplier: 0.85, description: 'Social posts' },
  'x': { tier: 'tier2', multiplier: 0.85, description: 'X/Twitter posts' },
  'quora': { tier: 'tier2', multiplier: 0.95, description: 'Q&A platform' },

  // Tier 3 - Generic/low quality
  'facebook': { tier: 'tier3', multiplier: 0.75, description: 'Facebook posts' },
  'instagram': { tier: 'tier3', multiplier: 0.7, description: 'Instagram posts' },
  'tiktok': { tier: 'tier3', multiplier: 0.65, description: 'TikTok content' },
  'linkedin-generic': { tier: 'tier3', multiplier: 0.7, description: 'Generic LinkedIn' },
  'thought-leadership': { tier: 'tier3', multiplier: 0.6, description: 'Generic thought leadership' },
  'generic': { tier: 'tier3', multiplier: 0.7, description: 'Unknown source' },
  'unknown': { tier: 'tier3', multiplier: 0.7, description: 'Unknown source' }
};

// Platform-specific keywords to detect source type
const PLATFORM_KEYWORDS: Record<string, string[]> = {
  'g2': ['g2.com', 'g2 crowd', 'g2crowd', 'g2 review'],
  'trustpilot': ['trustpilot.com', 'trustpilot'],
  'capterra': ['capterra.com', 'capterra'],
  'gartner': ['gartner.com', 'gartner peer insights', 'magic quadrant'],
  'forrester': ['forrester.com', 'forrester wave'],
  'reddit': ['reddit.com', 'r/', 'subreddit'],
  'hackernews': ['news.ycombinator.com', 'hacker news', 'hn'],
  'linkedin': ['linkedin.com', 'linkedin'],
  'youtube': ['youtube.com', 'youtu.be'],
  'twitter': ['twitter.com', 'x.com'],
  'facebook': ['facebook.com', 'fb.com'],
  'instagram': ['instagram.com'],
  'tiktok': ['tiktok.com'],
  'quora': ['quora.com'],
  'google-reviews': ['google review', 'google maps', 'google business']
};

// Tier multipliers for fallback
const TIER_MULTIPLIERS: Record<SourceTier, number> = {
  'tier1': 1.15,
  'tier2': 1.0,
  'tier3': 0.7
};

// ============================================================================
// PROFILE-SPECIFIC SOURCE WEIGHTING
// From TRIGGER_RESEARCH.md - different sources matter more for different profiles
// ============================================================================

const PROFILE_SOURCE_WEIGHTS: Record<BusinessProfileType, ProfileSourceWeights> = {
  'local-service-b2b': {
    tier1Sources: [
      'government-bids', 'bidnet', 'governmentbids', 'gsa',
      'linkedin-jobs', 'glassdoor', 'cisa', 'industry-forum',
      'boma', 'facility-management', 'google-reviews'
    ],
    tier2Sources: [
      'linkedin', 'industry-news', 'trade-publication', 'conference'
    ],
    tier3Sources: [
      'facebook', 'instagram', 'tiktok', 'consumer-review'
    ]
  },

  'local-service-b2c': {
    tier1Sources: [
      'google-reviews', 'yelp', 'healthgrades', 'zocdoc',
      'opentable', 'tripadvisor', 'mindbody', 'classpass',
      'styleseat', 'vagaro', 'facebook-reviews'
    ],
    tier2Sources: [
      'facebook', 'nextdoor', 'local-news', 'community-forum'
    ],
    tier3Sources: [
      'linkedin', 'b2b-platform', 'enterprise-review', 'g2'
    ]
  },

  'regional-b2b-agency': {
    tier1Sources: [
      'linkedin', 'clutch', 'g2', 'rfp-platform', 'upwork',
      'industry-publication', 'journal-of-accountancy', 'ad-age'
    ],
    tier2Sources: [
      'case-study', 'webinar', 'conference', 'award', 'blog'
    ],
    tier3Sources: [
      'facebook', 'instagram', 'consumer-review', 'yelp'
    ]
  },

  'regional-retail-b2c': {
    tier1Sources: [
      'costar', 'loopnet', 'franchise-expo', 'census-data',
      'consumer-intent', 'google-reviews', 'facebook'
    ],
    tier2Sources: [
      'real-estate-platform', 'market-research', 'local-news'
    ],
    tier3Sources: [
      'linkedin', 'b2b-platform', 'enterprise-review'
    ]
  },

  'national-saas-b2b': {
    tier1Sources: [
      'g2', 'gartner', 'forrester', 'capterra', 'trustradius',
      'bombora', '6sense', 'builtwith', 'wappalyzer', 'datanyze',
      'reddit', 'hackernews', 'stackoverflow'
    ],
    tier2Sources: [
      'linkedin', 'crunchbase', 'techcrunch', 'industry-blog',
      'youtube-review', 'podcast'
    ],
    tier3Sources: [
      'facebook', 'instagram', 'tiktok', 'consumer-review', 'yelp'
    ]
  },

  'national-product-b2c': {
    tier1Sources: [
      'nielseniq', 'circana', 'iri', 'spins', 'amazon-reviews',
      'tiktok-shop', 'instagram-shop', 'retail-buyer', 'trade-show'
    ],
    tier2Sources: [
      'influencer', 'youtube-review', 'reddit', 'trustpilot',
      'google-trends', 'social-commerce'
    ],
    tier3Sources: [
      'linkedin', 'b2b-platform', 'enterprise-review', 'g2'
    ]
  },

  'global-saas-b2b': {
    tier1Sources: [
      'g2', 'gartner', 'forrester', 'capterra-eu', 'trustpilot-uk',
      'bombora', '6sense', 'reddit', 'hackernews', 'linkedin'
    ],
    tier2Sources: [
      'industry-analyst', 'conference', 'webinar', 'case-study',
      'compliance-publication', 'gdpr-resource'
    ],
    tier3Sources: [
      'facebook', 'instagram', 'tiktok', 'consumer-review', 'local-review'
    ]
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class SourceQualityService {
  /**
   * Get quality adjustment for a source
   */
  getQualityAdjustment(
    source: string | undefined,
    url?: string,
    content?: string
  ): SourceQualityResult {
    const normalizedSource = this.normalizeSource(source, url, content);
    const config = SOURCE_CONFIGS[normalizedSource] || SOURCE_CONFIGS['generic'];

    return {
      tier: config.tier,
      multiplier: config.multiplier,
      adjustedScore: 0, // Will be set by caller
      reasoning: `${config.description} (${config.tier}, ${config.multiplier}x)`
    };
  }

  /**
   * Apply quality adjustment to a score
   */
  applyQualityAdjustment(
    baseScore: number,
    source: string | undefined,
    url?: string,
    content?: string
  ): SourceQualityResult {
    const quality = this.getQualityAdjustment(source, url, content);
    quality.adjustedScore = Math.min(1, baseScore * quality.multiplier);
    return quality;
  }

  /**
   * Detect source tier from content
   */
  detectSourceTier(content: string): SourceTier {
    const contentLower = content.toLowerCase();

    // Check for tier 1 indicators
    const tier1Indicators = [
      'review', 'rating', 'stars', 'verified purchase', 'customer feedback',
      'g2', 'trustpilot', 'capterra', 'reddit.com', 'r/', 'hackernews'
    ];
    if (tier1Indicators.some(ind => contentLower.includes(ind))) {
      return 'tier1';
    }

    // Check for tier 3 indicators
    const tier3Indicators = [
      'thought leader', 'influencer', 'viral', 'trending', 'hot take',
      'my thoughts on', 'unpopular opinion', 'here\'s why', 'thread',
      'career advice', 'life hack', 'motivation'
    ];
    if (tier3Indicators.some(ind => contentLower.includes(ind))) {
      return 'tier3';
    }

    // Default to tier 2
    return 'tier2';
  }

  /**
   * Check if source is high-quality product discussion
   */
  isProductDiscussion(source: string | undefined, content: string): boolean {
    const config = SOURCE_CONFIGS[this.normalizeSource(source)];
    if (config?.tier === 'tier1') return true;

    const productIndicators = [
      'using', 'tried', 'switched to', 'migrated from', 'compared',
      'pros and cons', 'experience with', 'review of', 'feedback on',
      'implementation', 'integration', 'feature request', 'bug', 'issue'
    ];

    const contentLower = content.toLowerCase();
    return productIndicators.filter(ind => contentLower.includes(ind)).length >= 2;
  }

  /**
   * Get all source configs
   */
  getAllConfigs(): Record<string, SourceQualityConfig> {
    return { ...SOURCE_CONFIGS };
  }

  /**
   * Get profile-specific quality adjustment
   * Uses profile-aware source weighting from TRIGGER_RESEARCH.md
   */
  getProfileAwareQualityAdjustment(
    source: string | undefined,
    profileType: BusinessProfileType,
    url?: string,
    content?: string
  ): SourceQualityResult {
    const normalizedSource = this.normalizeSource(source, url, content);
    const profileWeights = PROFILE_SOURCE_WEIGHTS[profileType] || PROFILE_SOURCE_WEIGHTS['national-saas-b2b'];

    // Check profile-specific tier assignment
    let tier: SourceTier = 'tier2'; // Default
    let multiplier = TIER_MULTIPLIERS['tier2'];

    if (profileWeights.tier1Sources.some(s => normalizedSource.includes(s) || s.includes(normalizedSource))) {
      tier = 'tier1';
      multiplier = 1.3; // Higher boost for profile-specific tier1
    } else if (profileWeights.tier3Sources.some(s => normalizedSource.includes(s) || s.includes(normalizedSource))) {
      tier = 'tier3';
      multiplier = 0.6; // Higher penalty for profile-specific tier3
    } else if (profileWeights.tier2Sources.some(s => normalizedSource.includes(s) || s.includes(normalizedSource))) {
      tier = 'tier2';
      multiplier = 1.0;
    } else {
      // Fall back to general source config
      const config = SOURCE_CONFIGS[normalizedSource];
      if (config) {
        tier = config.tier;
        multiplier = config.multiplier;
      }
    }

    return {
      tier,
      multiplier,
      adjustedScore: 0,
      reasoning: `Profile-aware: ${profileType} weights ${normalizedSource} as ${tier} (${multiplier}x)`
    };
  }

  /**
   * Apply profile-aware quality adjustment to a score
   */
  applyProfileAwareQualityAdjustment(
    baseScore: number,
    source: string | undefined,
    profileType: BusinessProfileType,
    url?: string,
    content?: string
  ): SourceQualityResult {
    const quality = this.getProfileAwareQualityAdjustment(source, profileType, url, content);
    quality.adjustedScore = Math.min(1, baseScore * quality.multiplier);
    return quality;
  }

  /**
   * Get source weights for a specific profile
   */
  getProfileSourceWeights(profileType: BusinessProfileType): ProfileSourceWeights {
    return PROFILE_SOURCE_WEIGHTS[profileType] || PROFILE_SOURCE_WEIGHTS['national-saas-b2b'];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private normalizeSource(
    source: string | undefined,
    url?: string,
    content?: string
  ): string {
    // Check URL first
    if (url) {
      const urlLower = url.toLowerCase();
      for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        if (keywords.some(k => urlLower.includes(k))) {
          return platform;
        }
      }
    }

    // Check source string
    if (source) {
      const sourceLower = source.toLowerCase().trim();

      // Direct match
      if (SOURCE_CONFIGS[sourceLower]) {
        return sourceLower;
      }

      // Keyword match
      for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        if (keywords.some(k => sourceLower.includes(k))) {
          return platform;
        }
      }

      // Common variations
      if (sourceLower.includes('linkedin')) return 'linkedin';
      if (sourceLower.includes('reddit')) return 'reddit';
      if (sourceLower.includes('youtube')) return 'youtube';
      if (sourceLower.includes('twitter') || sourceLower.includes('x.com')) return 'twitter';
    }

    // Check content for platform indicators
    if (content) {
      const contentLower = content.toLowerCase();
      for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        if (keywords.some(k => contentLower.includes(k))) {
          return platform;
        }
      }
    }

    return 'generic';
  }
}

// Export singleton
export const sourceQualityService = new SourceQualityService();
