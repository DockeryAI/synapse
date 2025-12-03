/**
 * Profile Router Service
 *
 * Routes signals to appropriate processing pipelines based on business profile type.
 * Implements profile-specific signal weighting, source prioritization, and trigger
 * customization as defined in the Triggers 3.0 architecture.
 *
 * Phase 3: Profile-Specific Pipelines
 *
 * Core Responsibilities:
 * 1. Route incoming signals to profile-specific processors
 * 2. Apply profile-aware source weights
 * 3. Configure trigger generation parameters per profile
 * 4. Manage profile-specific confidence thresholds
 *
 * Created: 2025-12-01
 */

import { profileDetectionService, type BusinessProfileType, type BusinessProfileAnalysis, type ProfileTriggerConfig } from './_archived/profile-detection.service';
import { sourceQualityService, type ProfileSourceWeights } from './_archived/source-quality.service';
import { recencyCalculatorService, type TriggerEventType } from './recency-calculator.service';
import { confidenceScorerService, type ConfidenceLevel } from './confidence-scorer.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export type SignalCategory =
  | 'competitor-complaint'
  | 'recommendation-request'
  | 'feature-comparison'
  | 'switching-intent'
  | 'pain-point-expression'
  | 'budget-discussion'
  | 'growth-signal'
  | 'churn-risk'
  | 'life-event'
  | 'seasonal-demand'
  | 'contract-renewal'
  | 'expansion-signal';

export interface RawSignal {
  id: string;
  source: string;
  url?: string;
  content: string;
  timestamp: Date;
  author?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface ProcessedSignal extends RawSignal {
  profileType: BusinessProfileType;
  category: SignalCategory;
  recencyScore: number;
  sourceQualityScore: number;
  confidenceLevel: ConfidenceLevel;
  compositeScore: number;
  processingPipeline: 'local' | 'regional' | 'national';
  routingReason: string;
}

export interface RoutingDecision {
  profileType: BusinessProfileType;
  pipeline: 'local' | 'regional' | 'national';
  prioritySources: string[];
  signalCategories: SignalCategory[];
  confidenceThreshold: number;
  recencyWeight: number;
  geographicFilter?: GeographicFilter;
}

export interface GeographicFilter {
  enabled: boolean;
  radiusMiles: number;
  primaryMarket?: string;
  regions?: string[];
}

export interface ProfileRoutingConfig {
  profileType: BusinessProfileType;
  pipeline: 'local' | 'regional' | 'national';
  signalPriorities: SignalCategory[];
  sourceWeights: ProfileSourceWeights;
  triggerConfig: ProfileTriggerConfig;
  confidenceThreshold: number;
  recencyDecayRate: 'fast' | 'normal' | 'slow';
  geographicFilter: GeographicFilter;
  seasonalPatterns?: SeasonalPattern[];
}

export interface SeasonalPattern {
  name: string;
  startMonth: number; // 1-12
  endMonth: number;
  signalBoost: number; // Multiplier for signals during this period
  relevantCategories: SignalCategory[];
}

export interface RouterStats {
  signalsProcessed: number;
  byPipeline: {
    local: number;
    regional: number;
    national: number;
  };
  byProfile: Record<BusinessProfileType, number>;
  averageConfidence: number;
  averageRecency: number;
}

// ============================================================================
// PROFILE ROUTING CONFIGURATIONS
// ============================================================================

const PROFILE_ROUTING_CONFIGS: Record<BusinessProfileType, ProfileRoutingConfig> = {
  'local-service-b2b': {
    profileType: 'local-service-b2b',
    pipeline: 'local',
    signalPriorities: [
      'competitor-complaint',
      'recommendation-request',
      'growth-signal',
      'contract-renewal',
      'pain-point-expression'
    ],
    sourceWeights: {
      tier1Sources: ['google-reviews', 'linkedin-jobs', 'industry-forum', 'government-bids'],
      tier2Sources: ['linkedin', 'yelp', 'reddit'],
      tier3Sources: ['facebook', 'instagram', 'tiktok']
    },
    triggerConfig: {
      priorityTriggers: ['reliability', 'downtime-fear', 'compliance', 'response-time', 'local-expertise'],
      prioritySources: ['google-reviews', 'industry-forums', 'linkedin-local'],
      uvpEmphasis: ['response-time', 'slas', 'local-reputation', 'certifications'],
      languageStyle: 'professional'
    },
    confidenceThreshold: 0.55, // Higher bar for B2B
    recencyDecayRate: 'normal',
    geographicFilter: {
      enabled: true,
      radiusMiles: 50
    },
    seasonalPatterns: [
      {
        name: 'Q4 Budget Planning',
        startMonth: 10,
        endMonth: 12,
        signalBoost: 1.3,
        relevantCategories: ['budget-discussion', 'contract-renewal', 'growth-signal']
      },
      {
        name: 'HVAC Summer Peak',
        startMonth: 5,
        endMonth: 8,
        signalBoost: 1.4,
        relevantCategories: ['pain-point-expression', 'competitor-complaint', 'recommendation-request']
      }
    ]
  },

  'local-service-b2c': {
    profileType: 'local-service-b2c',
    pipeline: 'local',
    signalPriorities: [
      'recommendation-request',
      'competitor-complaint',
      'life-event',
      'seasonal-demand',
      'pain-point-expression'
    ],
    sourceWeights: {
      tier1Sources: ['google-reviews', 'yelp', 'nextdoor', 'facebook-reviews'],
      tier2Sources: ['facebook', 'reddit', 'local-news'],
      tier3Sources: ['linkedin', 'g2', 'capterra']
    },
    triggerConfig: {
      priorityTriggers: ['trust-safety', 'convenience', 'price-anxiety', 'quality-concern', 'availability'],
      prioritySources: ['google-reviews', 'yelp', 'facebook', 'nextdoor'],
      uvpEmphasis: ['proximity', 'reviews', 'personal-touch', 'experience'],
      languageStyle: 'local'
    },
    confidenceThreshold: 0.45, // Lower bar for high-volume B2C
    recencyDecayRate: 'fast', // Reviews age quickly for B2C
    geographicFilter: {
      enabled: true,
      radiusMiles: 25
    },
    seasonalPatterns: [
      {
        name: 'New Year Resolutions',
        startMonth: 1,
        endMonth: 2,
        signalBoost: 1.5,
        relevantCategories: ['recommendation-request', 'life-event']
      },
      {
        name: 'Back to School',
        startMonth: 8,
        endMonth: 9,
        signalBoost: 1.3,
        relevantCategories: ['recommendation-request', 'seasonal-demand']
      },
      {
        name: 'Holiday Season',
        startMonth: 11,
        endMonth: 12,
        signalBoost: 1.4,
        relevantCategories: ['seasonal-demand', 'recommendation-request']
      }
    ]
  },

  'regional-b2b-agency': {
    profileType: 'regional-b2b-agency',
    pipeline: 'regional',
    signalPriorities: [
      'switching-intent',
      'churn-risk',
      'recommendation-request',
      'contract-renewal',
      'growth-signal'
    ],
    sourceWeights: {
      tier1Sources: ['linkedin', 'clutch', 'g2', 'rfp-platform'],
      tier2Sources: ['reddit', 'industry-blog', 'case-study'],
      tier3Sources: ['facebook', 'yelp', 'consumer-review']
    },
    triggerConfig: {
      priorityTriggers: ['roi-skepticism', 'expertise-doubt', 'past-failures', 'accountability', 'results'],
      prioritySources: ['linkedin', 'clutch', 'g2', 'case-studies'],
      uvpEmphasis: ['results', 'industry-expertise', 'process', 'track-record'],
      languageStyle: 'professional'
    },
    confidenceThreshold: 0.60, // Higher bar for agency services
    recencyDecayRate: 'slow', // Longer sales cycles
    geographicFilter: {
      enabled: true,
      radiusMiles: 150
    },
    seasonalPatterns: [
      {
        name: 'Q1 New Budget',
        startMonth: 1,
        endMonth: 3,
        signalBoost: 1.4,
        relevantCategories: ['budget-discussion', 'switching-intent', 'recommendation-request']
      },
      {
        name: 'Q4 Planning',
        startMonth: 10,
        endMonth: 12,
        signalBoost: 1.3,
        relevantCategories: ['contract-renewal', 'churn-risk', 'budget-discussion']
      },
      {
        name: 'Tax Season',
        startMonth: 2,
        endMonth: 4,
        signalBoost: 1.5,
        relevantCategories: ['pain-point-expression', 'recommendation-request']
      }
    ]
  },

  'regional-retail-b2c': {
    profileType: 'regional-retail-b2c',
    pipeline: 'regional',
    signalPriorities: [
      'expansion-signal',
      'competitor-complaint',
      'seasonal-demand',
      'pain-point-expression',
      'recommendation-request'
    ],
    sourceWeights: {
      tier1Sources: ['google-reviews', 'facebook', 'franchise-forum', 'costar'],
      tier2Sources: ['yelp', 'reddit', 'local-news'],
      tier3Sources: ['linkedin', 'g2', 'b2b-platform']
    },
    triggerConfig: {
      priorityTriggers: ['availability', 'consistency', 'value', 'brand-trust', 'convenience'],
      prioritySources: ['google-reviews', 'social-media', 'local-news'],
      uvpEmphasis: ['locations', 'promotions', 'brand-trust', 'selection'],
      languageStyle: 'consumer'
    },
    confidenceThreshold: 0.50,
    recencyDecayRate: 'normal',
    geographicFilter: {
      enabled: true,
      radiusMiles: 100
    },
    seasonalPatterns: [
      {
        name: 'Holiday Retail',
        startMonth: 10,
        endMonth: 12,
        signalBoost: 1.6,
        relevantCategories: ['seasonal-demand', 'competitor-complaint', 'expansion-signal']
      },
      {
        name: 'Summer Travel',
        startMonth: 6,
        endMonth: 8,
        signalBoost: 1.3,
        relevantCategories: ['seasonal-demand', 'recommendation-request']
      }
    ]
  },

  'national-saas-b2b': {
    profileType: 'national-saas-b2b',
    pipeline: 'national',
    signalPriorities: [
      'switching-intent',
      'churn-risk',
      'feature-comparison',
      'competitor-complaint',
      'growth-signal'
    ],
    sourceWeights: {
      tier1Sources: ['g2', 'capterra', 'reddit', 'hackernews', 'trustradius'],
      tier2Sources: ['linkedin', 'youtube', 'industry-blog'],
      tier3Sources: ['facebook', 'instagram', 'tiktok']
    },
    triggerConfig: {
      priorityTriggers: ['integration-fear', 'adoption-risk', 'vendor-lock-in', 'security', 'support'],
      prioritySources: ['g2', 'reddit', 'hackernews', 'linkedin', 'capterra'],
      uvpEmphasis: ['security', 'support', 'migration-path', 'integrations', 'uptime'],
      languageStyle: 'technical'
    },
    confidenceThreshold: 0.55,
    recencyDecayRate: 'normal',
    geographicFilter: {
      enabled: false,
      radiusMiles: 0
    },
    seasonalPatterns: [
      {
        name: 'Annual Contract Renewal',
        startMonth: 10,
        endMonth: 12,
        signalBoost: 1.5,
        relevantCategories: ['churn-risk', 'switching-intent', 'contract-renewal']
      },
      {
        name: 'Q1 Implementation',
        startMonth: 1,
        endMonth: 3,
        signalBoost: 1.3,
        relevantCategories: ['switching-intent', 'feature-comparison', 'growth-signal']
      }
    ]
  },

  'national-product-b2c': {
    profileType: 'national-product-b2c',
    pipeline: 'national',
    signalPriorities: [
      'competitor-complaint',
      'feature-comparison',
      'recommendation-request',
      'seasonal-demand',
      'pain-point-expression'
    ],
    sourceWeights: {
      tier1Sources: ['reddit', 'amazon-reviews', 'youtube', 'tiktok'],
      tier2Sources: ['instagram', 'influencer', 'product-hunt'],
      tier3Sources: ['linkedin', 'g2', 'b2b-platform']
    },
    triggerConfig: {
      priorityTriggers: ['quality-doubt', 'comparison-shopping', 'social-proof', 'returns', 'authenticity'],
      prioritySources: ['amazon-reviews', 'tiktok', 'influencer', 'reddit', 'youtube'],
      uvpEmphasis: ['differentiation', 'social-proof', 'value', 'quality', 'brand-story'],
      languageStyle: 'consumer'
    },
    confidenceThreshold: 0.40, // Lower bar for high-volume consumer signals
    recencyDecayRate: 'fast', // Consumer trends move fast
    geographicFilter: {
      enabled: false,
      radiusMiles: 0
    },
    seasonalPatterns: [
      {
        name: 'Black Friday/Cyber Monday',
        startMonth: 11,
        endMonth: 11,
        signalBoost: 2.0,
        relevantCategories: ['feature-comparison', 'competitor-complaint', 'seasonal-demand']
      },
      {
        name: 'Prime Day',
        startMonth: 7,
        endMonth: 7,
        signalBoost: 1.8,
        relevantCategories: ['feature-comparison', 'recommendation-request']
      },
      {
        name: 'Back to School',
        startMonth: 8,
        endMonth: 9,
        signalBoost: 1.4,
        relevantCategories: ['seasonal-demand', 'recommendation-request']
      }
    ]
  },

  'global-saas-b2b': {
    profileType: 'global-saas-b2b',
    pipeline: 'national', // Uses national pipeline with global extensions
    signalPriorities: [
      'switching-intent',
      'churn-risk',
      'feature-comparison',
      'growth-signal',
      'expansion-signal'
    ],
    sourceWeights: {
      tier1Sources: ['g2', 'gartner', 'forrester', 'linkedin', 'reddit'],
      tier2Sources: ['hackernews', 'industry-analyst', 'conference'],
      tier3Sources: ['facebook', 'instagram', 'local-review']
    },
    triggerConfig: {
      priorityTriggers: ['integration-fear', 'vendor-lock-in', 'compliance', 'data-residency', 'localization'],
      prioritySources: ['g2', 'reddit', 'linkedin', 'gartner', 'forrester'],
      uvpEmphasis: ['gdpr-compliance', 'multi-region', 'enterprise-security', 'localization', 'data-sovereignty'],
      languageStyle: 'technical'
    },
    confidenceThreshold: 0.60, // Higher bar for enterprise deals
    recencyDecayRate: 'slow', // Long enterprise sales cycles
    geographicFilter: {
      enabled: true,
      radiusMiles: 0, // Uses region filter instead
      regions: ['EMEA', 'APAC', 'Americas']
    },
    seasonalPatterns: [
      {
        name: 'Fiscal Year End (EMEA)',
        startMonth: 3,
        endMonth: 4,
        signalBoost: 1.4,
        relevantCategories: ['budget-discussion', 'contract-renewal', 'switching-intent']
      },
      {
        name: 'Q4 Enterprise Buying',
        startMonth: 10,
        endMonth: 12,
        signalBoost: 1.5,
        relevantCategories: ['churn-risk', 'switching-intent', 'expansion-signal']
      }
    ]
  }
};

// Signal category detection patterns
const SIGNAL_CATEGORY_PATTERNS: Record<SignalCategory, RegExp[]> = {
  'competitor-complaint': [
    /hate|awful|terrible|worst|disappointed|frustrat|annoyed|angry|fed up with/i,
    /switch(?:ing|ed)?\s+(?:away\s+)?from/i,
    /leaving|left|abandoned|dropped/i,
    /not\s+(?:happy|satisfied|impressed)/i
  ],
  'recommendation-request': [
    /recommend(?:ation)?s?|suggest(?:ion)?s?|advice/i,
    /looking\s+for|searching\s+for|need\s+(?:a|an)/i,
    /what\s+(?:do\s+you|would\s+you|should\s+I)/i,
    /anyone\s+(?:know|use|tried|recommend)/i,
    /best\s+(?:option|choice|alternative)/i
  ],
  'feature-comparison': [
    /compare|comparison|vs\.?|versus/i,
    /difference\s+between/i,
    /better\s+than|worse\s+than/i,
    /pros?\s+(?:and|&)\s+cons?/i,
    /which\s+(?:one|is\s+better)/i
  ],
  'switching-intent': [
    /switch(?:ing|ed)?\s+to/i,
    /migrat(?:e|ing|ion)/i,
    /replac(?:e|ing|ement)/i,
    /moving\s+(?:to|from)/i,
    /considering|evaluating|exploring/i
  ],
  'pain-point-expression': [
    /struggle|struggling|pain|painful|frustrat/i,
    /problem|issue|challenge|difficult/i,
    /can't|cannot|unable|impossible/i,
    /wish\s+(?:I|we|they)|if\s+only/i
  ],
  'budget-discussion': [
    /budget|pricing|cost|expensive|cheap/i,
    /afford|investment|ROI|payback/i,
    /quote|estimate|proposal/i,
    /annual|monthly|per\s+seat/i
  ],
  'growth-signal': [
    /growing|growth|expand(?:ing)?|scaling/i,
    /hiring|new\s+(?:hire|team|office|location)/i,
    /funding|raised|series\s+[A-Z]/i,
    /acquisition|acquired|merger/i
  ],
  'churn-risk': [
    /cancel(?:ing|led)?|churn(?:ed|ing)?/i,
    /not\s+renewing|won't\s+renew/i,
    /looking\s+for\s+alternatives?/i,
    /end(?:ing)?\s+(?:our|my)\s+(?:contract|subscription)/i
  ],
  'life-event': [
    /mov(?:e|ed|ing)\s+to|relocated|new\s+(?:home|house|apartment)/i,
    /engag(?:ed|ement)|wedding|married|baby|pregnant/i,
    /graduat(?:ed|ing)|new\s+job|promot(?:ed|ion)/i,
    /retire(?:d|ing|ment)/i
  ],
  'seasonal-demand': [
    /holiday|christmas|thanksgiving|easter|summer|winter|spring|fall/i,
    /back\s+to\s+school|new\s+year/i,
    /seasonal|peak\s+season|off\s+season/i
  ],
  'contract-renewal': [
    /renewal|renew(?:ing)?|contract\s+(?:up|end|expir)/i,
    /annual\s+review|renegotiat/i,
    /term\s+(?:end|up)/i
  ],
  'expansion-signal': [
    /new\s+location|opening|launch(?:ing)?/i,
    /franchise|franchis(?:e|ing)/i,
    /territory|region|market\s+expansion/i,
    /international|global\s+expansion/i
  ]
};

// ============================================================================
// SERVICE
// ============================================================================

class ProfileRouterService {
  private routingStats: RouterStats = {
    signalsProcessed: 0,
    byPipeline: { local: 0, regional: 0, national: 0 },
    byProfile: {} as Record<BusinessProfileType, number>,
    averageConfidence: 0,
    averageRecency: 0
  };

  /**
   * Get routing configuration for a profile type
   */
  getRoutingConfig(profileType: BusinessProfileType): ProfileRoutingConfig {
    return PROFILE_ROUTING_CONFIGS[profileType];
  }

  /**
   * Determine routing decision for a brand based on UVP
   */
  getRoutingDecision(
    uvp: CompleteUVP,
    brandData?: any
  ): RoutingDecision {
    // Detect profile from UVP
    const profileAnalysis = profileDetectionService.detectProfile(uvp, brandData);
    const config = this.getRoutingConfig(profileAnalysis.profileType);

    return {
      profileType: profileAnalysis.profileType,
      pipeline: config.pipeline,
      prioritySources: config.sourceWeights.tier1Sources,
      signalCategories: config.signalPriorities,
      confidenceThreshold: config.confidenceThreshold,
      recencyWeight: this.getRecencyWeight(config.recencyDecayRate),
      geographicFilter: config.geographicFilter
    };
  }

  /**
   * Process and route a raw signal through the appropriate pipeline
   */
  processSignal(
    signal: RawSignal,
    profileType: BusinessProfileType
  ): ProcessedSignal {
    const config = this.getRoutingConfig(profileType);

    // Detect signal category
    const category = this.detectSignalCategory(signal.content);

    // Calculate recency score
    const recencyResult = recencyCalculatorService.calculateRecency(
      signal.timestamp,
      this.mapCategoryToEventType(category)
    );

    // Calculate source quality score
    const sourceQuality = sourceQualityService.getProfileAwareQualityAdjustment(
      signal.source,
      profileType,
      signal.url,
      signal.content
    );

    // Calculate composite score
    let compositeScore = recencyResult.score * sourceQuality.multiplier;

    // Apply seasonal boost if applicable
    const seasonalBoost = this.getSeasonalBoost(config, category);
    compositeScore *= seasonalBoost;

    // Apply priority category boost
    const priorityIndex = config.signalPriorities.indexOf(category);
    if (priorityIndex !== -1) {
      const priorityBoost = 1 + (0.1 * (config.signalPriorities.length - priorityIndex));
      compositeScore *= priorityBoost;
    }

    // Determine confidence level
    const confidenceLevel = this.determineConfidenceLevel(compositeScore, config.confidenceThreshold);

    // Update stats
    this.updateStats(profileType, config.pipeline, compositeScore, recencyResult.score);

    return {
      ...signal,
      profileType,
      category,
      recencyScore: recencyResult.score,
      sourceQualityScore: sourceQuality.multiplier,
      confidenceLevel,
      compositeScore: Math.min(1, compositeScore),
      processingPipeline: config.pipeline,
      routingReason: `Profile ${profileType} routes to ${config.pipeline} pipeline. Category: ${category}, Recency: ${recencyResult.ageCategory}, Source: ${sourceQuality.tier}`
    };
  }

  /**
   * Batch process multiple signals
   */
  processSignals(
    signals: RawSignal[],
    profileType: BusinessProfileType
  ): ProcessedSignal[] {
    return signals.map(signal => this.processSignal(signal, profileType));
  }

  /**
   * Filter signals by confidence threshold
   */
  filterByConfidence(
    signals: ProcessedSignal[],
    minLevel: ConfidenceLevel = 'medium'
  ): ProcessedSignal[] {
    const levelOrder: ConfidenceLevel[] = ['low', 'medium', 'high'];
    const minIndex = levelOrder.indexOf(minLevel);

    return signals.filter(signal => {
      const signalIndex = levelOrder.indexOf(signal.confidenceLevel);
      return signalIndex >= minIndex;
    });
  }

  /**
   * Filter signals by category
   */
  filterByCategory(
    signals: ProcessedSignal[],
    categories: SignalCategory[]
  ): ProcessedSignal[] {
    return signals.filter(signal => categories.includes(signal.category));
  }

  /**
   * Filter signals by geographic relevance (for local/regional pipelines)
   */
  filterByGeography(
    signals: ProcessedSignal[],
    config: GeographicFilter,
    targetLocation: string
  ): ProcessedSignal[] {
    if (!config.enabled) {
      return signals;
    }

    // For now, implement basic location string matching
    // In production, this would use geocoding APIs
    const targetLower = targetLocation.toLowerCase();

    return signals.filter(signal => {
      if (!signal.location) return true; // Keep signals without location data

      const signalLocation = signal.location.toLowerCase();

      // Check if regions match
      if (config.regions?.some(region =>
        signalLocation.includes(region.toLowerCase())
      )) {
        return true;
      }

      // Check for city/state match
      if (signalLocation.includes(targetLower) ||
          targetLower.includes(signalLocation)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get top signals sorted by composite score
   */
  getTopSignals(
    signals: ProcessedSignal[],
    limit: number = 20
  ): ProcessedSignal[] {
    return [...signals]
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, limit);
  }

  /**
   * Group signals by category
   */
  groupByCategory(
    signals: ProcessedSignal[]
  ): Map<SignalCategory, ProcessedSignal[]> {
    const groups = new Map<SignalCategory, ProcessedSignal[]>();

    for (const signal of signals) {
      const existing = groups.get(signal.category) || [];
      existing.push(signal);
      groups.set(signal.category, existing);
    }

    return groups;
  }

  /**
   * Get router statistics
   */
  getStats(): RouterStats {
    return { ...this.routingStats };
  }

  /**
   * Reset router statistics
   */
  resetStats(): void {
    this.routingStats = {
      signalsProcessed: 0,
      byPipeline: { local: 0, regional: 0, national: 0 },
      byProfile: {} as Record<BusinessProfileType, number>,
      averageConfidence: 0,
      averageRecency: 0
    };
  }

  /**
   * Get all available profile routing configs
   */
  getAllConfigs(): Record<BusinessProfileType, ProfileRoutingConfig> {
    return { ...PROFILE_ROUTING_CONFIGS };
  }

  /**
   * Check if a signal meets the minimum quality bar
   */
  meetsQualityBar(signal: ProcessedSignal): boolean {
    const config = this.getRoutingConfig(signal.profileType);
    return signal.compositeScore >= config.confidenceThreshold;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private detectSignalCategory(content: string): SignalCategory {
    const scores: Partial<Record<SignalCategory, number>> = {};

    for (const [category, patterns] of Object.entries(SIGNAL_CATEGORY_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      if (score > 0) {
        scores[category as SignalCategory] = score;
      }
    }

    // Return highest scoring category, or default
    const entries = Object.entries(scores) as [SignalCategory, number][];
    if (entries.length === 0) {
      return 'recommendation-request'; // Default category
    }

    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  private mapCategoryToEventType(category: SignalCategory): TriggerEventType {
    const categoryToEventMap: Partial<Record<SignalCategory, TriggerEventType>> = {
      'competitor-complaint': 'review',
      'recommendation-request': 'social-mention',
      'feature-comparison': 'product-mention',
      'switching-intent': 'competitor-mention',
      'pain-point-expression': 'social-mention',
      'budget-discussion': 'news-article',
      'growth-signal': 'funding-round',
      'churn-risk': 'competitor-mention',
      'life-event': 'social-mention',
      'seasonal-demand': 'trend-spike',
      'contract-renewal': 'news-article',
      'expansion-signal': 'news-article'
    };

    return categoryToEventMap[category] || 'social-mention';
  }

  private getRecencyWeight(decayRate: 'fast' | 'normal' | 'slow'): number {
    switch (decayRate) {
      case 'fast':
        return 1.5; // Weight recency more heavily
      case 'slow':
        return 0.7; // Weight recency less
      default:
        return 1.0;
    }
  }

  private getSeasonalBoost(
    config: ProfileRoutingConfig,
    category: SignalCategory
  ): number {
    if (!config.seasonalPatterns) return 1.0;

    const currentMonth = new Date().getMonth() + 1; // 1-12

    for (const pattern of config.seasonalPatterns) {
      // Check if we're in the seasonal window
      let inWindow = false;
      if (pattern.startMonth <= pattern.endMonth) {
        inWindow = currentMonth >= pattern.startMonth && currentMonth <= pattern.endMonth;
      } else {
        // Handle year-spanning patterns (e.g., Dec-Feb)
        inWindow = currentMonth >= pattern.startMonth || currentMonth <= pattern.endMonth;
      }

      if (inWindow && pattern.relevantCategories.includes(category)) {
        return pattern.signalBoost;
      }
    }

    return 1.0;
  }

  private determineConfidenceLevel(
    score: number,
    threshold: number
  ): ConfidenceLevel {
    // Adjust thresholds relative to the profile's base threshold
    const highBar = threshold + 0.20;
    const mediumBar = threshold;

    if (score >= highBar) return 'high';
    if (score >= mediumBar) return 'medium';
    return 'low';
  }

  private updateStats(
    profileType: BusinessProfileType,
    pipeline: 'local' | 'regional' | 'national',
    confidence: number,
    recency: number
  ): void {
    this.routingStats.signalsProcessed++;
    this.routingStats.byPipeline[pipeline]++;
    this.routingStats.byProfile[profileType] =
      (this.routingStats.byProfile[profileType] || 0) + 1;

    // Rolling average
    const n = this.routingStats.signalsProcessed;
    this.routingStats.averageConfidence =
      ((this.routingStats.averageConfidence * (n - 1)) + confidence) / n;
    this.routingStats.averageRecency =
      ((this.routingStats.averageRecency * (n - 1)) + recency) / n;
  }
}

// Export singleton
export const profileRouterService = new ProfileRouterService();
export { ProfileRouterService };
