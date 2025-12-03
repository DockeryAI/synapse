/**
 * Profile Relevance Rules Service
 *
 * Defines relevance criteria per business profile type.
 * Used to score whether a trigger is relevant to a specific profile.
 *
 * Created: 2025-11-28
 */

import type { BusinessProfileType } from './_archived/profile-detection.service';

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileRelevanceConfig {
  /** Keywords that indicate high relevance for this profile */
  relevantKeywords: string[];
  /** Keywords that indicate irrelevance (noise) */
  noiseKeywords: string[];
  /** Topics that matter for this profile */
  relevantTopics: string[];
  /** Topics to filter out */
  irrelevantTopics: string[];
  /** Weight multiplier for this profile's triggers */
  baseWeight: number;
}

export interface RelevanceCheckResult {
  isRelevant: boolean;
  score: number;
  matchedKeywords: string[];
  matchedNoiseKeywords: string[];
  reasoning: string;
}

// ============================================================================
// PROFILE RELEVANCE CONFIGS
// ============================================================================

export const PROFILE_RELEVANCE_CONFIGS: Record<BusinessProfileType | 'global-saas-b2b', ProfileRelevanceConfig> = {
  'local-service-b2b': {
    relevantKeywords: [
      'reliability', 'downtime', 'response time', 'sla', 'contract', 'vendor',
      'service agreement', 'maintenance', 'support', 'commercial', 'business',
      'office', 'facility', 'equipment', 'repair', 'installation', 'technician',
      'emergency service', 'scheduled maintenance', 'certified', 'licensed',
      'local', 'on-site', 'same day', 'warranty', 'compliance'
    ],
    noiseKeywords: [
      'viral', 'trending', 'influencer', 'lifestyle', 'fashion', 'celebrity',
      'entertainment', 'gaming', 'sports', 'politics', 'meme', 'tiktok',
      'personal brand', 'side hustle', 'passive income'
    ],
    relevantTopics: [
      'service reliability', 'vendor management', 'equipment maintenance',
      'compliance requirements', 'business operations', 'cost control'
    ],
    irrelevantTopics: [
      'consumer lifestyle', 'personal finance', 'entertainment', 'social media trends'
    ],
    baseWeight: 1.0
  },

  'local-service-b2c': {
    relevantKeywords: [
      'appointment', 'booking', 'wait time', 'customer service', 'experience',
      'convenience', 'location', 'parking', 'hours', 'availability', 'trust',
      'reviews', 'recommendation', 'family', 'kids', 'pet', 'home', 'personal',
      'affordable', 'quality', 'professional', 'friendly', 'clean', 'safe',
      'walk-in', 'same day', 'weekend', 'evening'
    ],
    noiseKeywords: [
      'enterprise', 'b2b', 'saas', 'api', 'integration', 'platform',
      'developer', 'code', 'technical', 'infrastructure', 'devops'
    ],
    relevantTopics: [
      'customer experience', 'local trust', 'convenience', 'family needs',
      'personal care', 'home services', 'appointment booking'
    ],
    irrelevantTopics: [
      'enterprise software', 'technical infrastructure', 'b2b sales'
    ],
    baseWeight: 1.0
  },

  'regional-b2b-agency': {
    relevantKeywords: [
      'roi', 'results', 'strategy', 'consulting', 'expertise', 'agency',
      'campaign', 'project', 'retainer', 'deliverables', 'kpi', 'metrics',
      'accountability', 'communication', 'reporting', 'timeline', 'budget',
      'scope', 'proposal', 'pitch', 'client', 'account', 'partner',
      'industry expertise', 'case study', 'track record', 'references'
    ],
    noiseKeywords: [
      'diy', 'tutorial', 'beginner', 'free', 'hack', 'quick fix',
      'viral', 'trending', 'influencer', 'personal brand'
    ],
    relevantTopics: [
      'agency relationships', 'professional services', 'project management',
      'roi measurement', 'expertise validation', 'vendor selection'
    ],
    irrelevantTopics: [
      'diy solutions', 'consumer products', 'entertainment'
    ],
    baseWeight: 1.0
  },

  'regional-retail-b2c': {
    relevantKeywords: [
      'store', 'location', 'inventory', 'stock', 'price', 'deal', 'sale',
      'product', 'selection', 'brand', 'quality', 'value', 'shopping',
      'return', 'exchange', 'warranty', 'delivery', 'pickup', 'online',
      'loyalty', 'rewards', 'membership', 'discount', 'promotion'
    ],
    noiseKeywords: [
      'enterprise', 'b2b', 'saas', 'developer', 'api', 'technical',
      'compliance', 'regulation', 'governance'
    ],
    relevantTopics: [
      'shopping experience', 'product availability', 'price comparison',
      'brand trust', 'customer loyalty', 'convenience'
    ],
    irrelevantTopics: [
      'enterprise software', 'technical solutions', 'b2b services'
    ],
    baseWeight: 1.0
  },

  'national-saas-b2b': {
    relevantKeywords: [
      'integration', 'api', 'platform', 'software', 'saas', 'cloud',
      'automation', 'workflow', 'dashboard', 'analytics', 'data',
      'security', 'compliance', 'soc2', 'gdpr', 'enterprise', 'scale',
      'implementation', 'onboarding', 'migration', 'support', 'uptime',
      'pricing', 'roi', 'productivity', 'efficiency', 'team', 'collaboration'
    ],
    noiseKeywords: [
      'local', 'walk-in', 'appointment', 'in-person', 'store', 'location',
      'home', 'family', 'personal', 'lifestyle', 'celebrity', 'entertainment'
    ],
    relevantTopics: [
      'software evaluation', 'integration challenges', 'vendor selection',
      'security requirements', 'team adoption', 'roi justification',
      'enterprise features', 'customer support', 'product roadmap'
    ],
    irrelevantTopics: [
      'local services', 'consumer retail', 'personal lifestyle', 'entertainment'
    ],
    baseWeight: 1.0
  },

  'national-product-b2c': {
    relevantKeywords: [
      'product', 'quality', 'review', 'rating', 'comparison', 'brand',
      'price', 'value', 'shipping', 'delivery', 'return', 'warranty',
      'authentic', 'genuine', 'sustainable', 'ethical', 'design',
      'lifestyle', 'recommendation', 'influencer', 'trending', 'popular'
    ],
    noiseKeywords: [
      'enterprise', 'b2b', 'api', 'integration', 'developer', 'technical',
      'compliance', 'soc2', 'infrastructure'
    ],
    relevantTopics: [
      'product quality', 'brand reputation', 'purchase decisions',
      'shipping experience', 'customer reviews', 'lifestyle fit'
    ],
    irrelevantTopics: [
      'enterprise software', 'technical infrastructure', 'b2b services'
    ],
    baseWeight: 1.0
  },

  'global-saas-b2b': {
    relevantKeywords: [
      // Core SaaS terms
      'integration', 'api', 'platform', 'software', 'saas', 'cloud',
      'automation', 'workflow', 'dashboard', 'analytics', 'data',
      // Global/International
      'global', 'international', 'multi-region', 'worldwide', 'emea', 'apac',
      'uk', 'europe', 'european', 'localization', 'multi-language',
      // Compliance (international focus)
      'gdpr', 'compliance', 'soc2', 'iso', 'data residency', 'privacy',
      'regulation', 'governance', 'audit', 'security',
      // Enterprise scale
      'enterprise', 'scale', 'multinational', 'global rollout', 'deployment',
      // AI/Conversational (for OpenDialog-type)
      'ai', 'conversational', 'chatbot', 'automation', 'customer service',
      'support', 'nlu', 'nlp', 'machine learning', 'bot'
    ],
    noiseKeywords: [
      'local', 'walk-in', 'appointment', 'in-person', 'store', 'location',
      'home', 'family', 'personal', 'lifestyle', 'celebrity', 'entertainment',
      'us-only', 'domestic', 'state', 'county', 'neighborhood',
      // Generic business content not specific to product
      'cto leadership', 'engineering management', 'team building',
      'career advice', 'hiring tips', 'startup culture'
    ],
    relevantTopics: [
      'software evaluation', 'integration challenges', 'vendor selection',
      'security requirements', 'international compliance', 'gdpr',
      'multi-region deployment', 'enterprise features', 'ai adoption',
      'conversational ai', 'customer service automation', 'chatbot implementation'
    ],
    irrelevantTopics: [
      'local services', 'consumer retail', 'personal lifestyle', 'entertainment',
      'generic leadership advice', 'career development', 'startup culture'
    ],
    baseWeight: 1.1 // Slightly higher weight for global enterprise
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class ProfileRelevanceService {
  /**
   * Check if text is relevant to a given profile
   */
  checkRelevance(
    text: string,
    profileType: BusinessProfileType | 'global-saas-b2b'
  ): RelevanceCheckResult {
    const config = PROFILE_RELEVANCE_CONFIGS[profileType];
    if (!config) {
      return {
        isRelevant: true,
        score: 0.5,
        matchedKeywords: [],
        matchedNoiseKeywords: [],
        reasoning: 'Unknown profile type, defaulting to neutral'
      };
    }

    const textLower = text.toLowerCase();
    const matchedKeywords: string[] = [];
    const matchedNoiseKeywords: string[] = [];

    // Check relevant keywords
    for (const keyword of config.relevantKeywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    // Check noise keywords
    for (const keyword of config.noiseKeywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchedNoiseKeywords.push(keyword);
      }
    }

    // Calculate score
    const relevanceBoost = Math.min(matchedKeywords.length * 0.15, 0.6);
    const noisePenalty = Math.min(matchedNoiseKeywords.length * 0.2, 0.5);
    const baseScore = 0.4;

    let score = baseScore + relevanceBoost - noisePenalty;
    score = Math.max(0, Math.min(1, score)) * config.baseWeight;

    // Determine relevance
    const isRelevant = score >= 0.35 && matchedNoiseKeywords.length < matchedKeywords.length + 2;

    // Build reasoning
    let reasoning = '';
    if (matchedKeywords.length > 0) {
      reasoning += `Matched: ${matchedKeywords.slice(0, 3).join(', ')}. `;
    }
    if (matchedNoiseKeywords.length > 0) {
      reasoning += `Noise: ${matchedNoiseKeywords.slice(0, 2).join(', ')}. `;
    }
    if (!reasoning) {
      reasoning = 'No strong signals detected.';
    }

    return {
      isRelevant,
      score,
      matchedKeywords,
      matchedNoiseKeywords,
      reasoning
    };
  }

  /**
   * Get relevance config for a profile
   */
  getConfig(profileType: BusinessProfileType | 'global-saas-b2b'): ProfileRelevanceConfig | null {
    return PROFILE_RELEVANCE_CONFIGS[profileType] || null;
  }

  /**
   * Check if text matches any irrelevant topics
   */
  matchesIrrelevantTopic(
    text: string,
    profileType: BusinessProfileType | 'global-saas-b2b'
  ): boolean {
    const config = PROFILE_RELEVANCE_CONFIGS[profileType];
    if (!config) return false;

    const textLower = text.toLowerCase();
    return config.irrelevantTopics.some(topic =>
      textLower.includes(topic.toLowerCase())
    );
  }

  /**
   * Get all profile types
   */
  getAllProfileTypes(): (BusinessProfileType | 'global-saas-b2b')[] {
    return Object.keys(PROFILE_RELEVANCE_CONFIGS) as (BusinessProfileType | 'global-saas-b2b')[];
  }
}

// Export singleton
export const profileRelevanceService = new ProfileRelevanceService();
