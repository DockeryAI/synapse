/**
 * Profile Configurations
 *
 * Centralized configuration for all 7 business profiles.
 * This file consolidates profile-specific settings used across
 * the Triggers 3.0 pipeline services.
 *
 * Phase 3: Profile-Specific Pipelines - Configuration
 *
 * Profiles:
 * 1. Local Service B2B
 * 2. Local Service B2C
 * 3. Regional B2B Agency
 * 4. Regional Retail B2C
 * 5. National SaaS B2B
 * 6. National Product B2C
 * 7. Global SaaS B2B
 *
 * Created: 2025-12-01
 */

import type { BusinessProfileType } from './_archived/profile-detection.service';
import type { ConfidenceLevel } from './confidence-scorer.service';
import type { UrgencyLevel } from './urgency-detector.service';

// ============================================================================
// TYPES
// ============================================================================

export interface ProfilePipelineConfig {
  // Profile identity
  profileType: BusinessProfileType;
  displayName: string;
  description: string;
  pipeline: 'local' | 'regional' | 'national';

  // Signal processing
  signalSources: SignalSourceConfig;
  confidenceConfig: ConfidenceConfig;
  recencyConfig: RecencyConfig;
  geographicConfig: GeographicConfig;

  // Trigger generation
  triggerConfig: TriggerGenerationConfig;

  // Scoring weights
  scoringWeights: ScoringWeights;

  // Seasonal patterns
  seasonalPatterns?: SeasonalPatternConfig[];

  // Compliance/security (for global profiles)
  complianceRequirements?: string[];
}

export interface SignalSourceConfig {
  tier1: string[];
  tier2: string[];
  tier3: string[];
  priorityOrder: string[];
}

export interface ConfidenceConfig {
  minimumThreshold: number;
  highConfidenceBar: number;
  multiSignalBonus: number;
  sourceCountBonus: number;
}

export interface RecencyConfig {
  decayRate: 'fast' | 'normal' | 'slow';
  maxAgeDays: number;
  premiumWindowDays: number;
  weightMultiplier: number;
}

export interface GeographicConfig {
  enabled: boolean;
  radiusMiles?: number;
  regions?: string[];
  scope: 'local' | 'regional' | 'national' | 'global';
}

export interface TriggerGenerationConfig {
  priorityTriggers: string[];
  uvpEmphasis: string[];
  languageStyle: 'local' | 'professional' | 'technical' | 'consumer';
  maxTriggersPerSession: number;
  includeCompetitorMentions: boolean;
  includeLifeEvents: boolean;
  includeSeasonalContext: boolean;
}

export interface ScoringWeights {
  recency: number;
  sourceQuality: number;
  competitorMention: number;
  urgencyLevel: number;
  decisionMakerSignal: number;
  multiSignalStack: number;
}

export interface SeasonalPatternConfig {
  name: string;
  startMonth: number;
  endMonth: number;
  signalBoost: number;
  relevantCategories: string[];
}

// ============================================================================
// PROFILE CONFIGURATIONS
// ============================================================================

export const PROFILE_PIPELINE_CONFIGS: Record<BusinessProfileType, ProfilePipelineConfig> = {
  'local-service-b2b': {
    profileType: 'local-service-b2b',
    displayName: 'Local Service B2B',
    description: 'Commercial HVAC, IT MSPs, cleaning services, office suppliers',
    pipeline: 'local',

    signalSources: {
      tier1: ['google-reviews', 'linkedin-jobs', 'industry-forum', 'government-bids'],
      tier2: ['linkedin', 'yelp', 'reddit', 'bbb'],
      tier3: ['facebook', 'instagram', 'tiktok'],
      priorityOrder: ['google-reviews', 'industry-forum', 'linkedin', 'reddit']
    },

    confidenceConfig: {
      minimumThreshold: 0.55,
      highConfidenceBar: 0.75,
      multiSignalBonus: 0.15,
      sourceCountBonus: 0.05
    },

    recencyConfig: {
      decayRate: 'normal',
      maxAgeDays: 60,
      premiumWindowDays: 14,
      weightMultiplier: 1.0
    },

    geographicConfig: {
      enabled: true,
      radiusMiles: 50,
      scope: 'local'
    },

    triggerConfig: {
      priorityTriggers: ['reliability', 'downtime-fear', 'compliance', 'response-time', 'local-expertise'],
      uvpEmphasis: ['response-time', 'slas', 'local-reputation', 'certifications'],
      languageStyle: 'professional',
      maxTriggersPerSession: 20,
      includeCompetitorMentions: true,
      includeLifeEvents: false,
      includeSeasonalContext: true
    },

    scoringWeights: {
      recency: 0.25,
      sourceQuality: 0.25,
      competitorMention: 0.20,
      urgencyLevel: 0.15,
      decisionMakerSignal: 0.10,
      multiSignalStack: 0.05
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
      },
      {
        name: 'IT Budget Cycle',
        startMonth: 9,
        endMonth: 11,
        signalBoost: 1.3,
        relevantCategories: ['contract-renewal', 'switching-intent', 'growth-signal']
      }
    ]
  },

  'local-service-b2c': {
    profileType: 'local-service-b2c',
    displayName: 'Local Service B2C',
    description: 'Dental practices, salons, restaurants, fitness studios',
    pipeline: 'local',

    signalSources: {
      tier1: ['google-reviews', 'yelp', 'nextdoor', 'facebook-reviews'],
      tier2: ['facebook', 'reddit', 'local-news'],
      tier3: ['linkedin', 'g2', 'capterra'],
      priorityOrder: ['google-reviews', 'yelp', 'facebook', 'nextdoor']
    },

    confidenceConfig: {
      minimumThreshold: 0.45,
      highConfidenceBar: 0.70,
      multiSignalBonus: 0.12,
      sourceCountBonus: 0.04
    },

    recencyConfig: {
      decayRate: 'fast',
      maxAgeDays: 30,
      premiumWindowDays: 7,
      weightMultiplier: 1.5
    },

    geographicConfig: {
      enabled: true,
      radiusMiles: 25,
      scope: 'local'
    },

    triggerConfig: {
      priorityTriggers: ['trust-safety', 'convenience', 'price-anxiety', 'quality-concern', 'availability'],
      uvpEmphasis: ['proximity', 'reviews', 'personal-touch', 'experience'],
      languageStyle: 'local',
      maxTriggersPerSession: 25,
      includeCompetitorMentions: true,
      includeLifeEvents: true,
      includeSeasonalContext: true
    },

    scoringWeights: {
      recency: 0.30,
      sourceQuality: 0.20,
      competitorMention: 0.15,
      urgencyLevel: 0.15,
      decisionMakerSignal: 0.05,
      multiSignalStack: 0.15
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
        name: 'Wedding Season',
        startMonth: 5,
        endMonth: 10,
        signalBoost: 1.4,
        relevantCategories: ['life-event', 'recommendation-request']
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
    displayName: 'Regional B2B Agency',
    description: 'Marketing agencies, accounting firms, HR consultants, legal services',
    pipeline: 'regional',

    signalSources: {
      tier1: ['linkedin', 'clutch', 'g2', 'rfp-platform'],
      tier2: ['reddit', 'industry-blog', 'case-study', 'conference'],
      tier3: ['facebook', 'yelp', 'consumer-review'],
      priorityOrder: ['linkedin', 'clutch', 'g2', 'reddit']
    },

    confidenceConfig: {
      minimumThreshold: 0.60,
      highConfidenceBar: 0.80,
      multiSignalBonus: 0.18,
      sourceCountBonus: 0.06
    },

    recencyConfig: {
      decayRate: 'slow',
      maxAgeDays: 90,
      premiumWindowDays: 21,
      weightMultiplier: 0.8
    },

    geographicConfig: {
      enabled: true,
      radiusMiles: 150,
      scope: 'regional'
    },

    triggerConfig: {
      priorityTriggers: ['roi-skepticism', 'expertise-doubt', 'past-failures', 'accountability', 'results'],
      uvpEmphasis: ['results', 'industry-expertise', 'process', 'track-record'],
      languageStyle: 'professional',
      maxTriggersPerSession: 15,
      includeCompetitorMentions: true,
      includeLifeEvents: false,
      includeSeasonalContext: true
    },

    scoringWeights: {
      recency: 0.20,
      sourceQuality: 0.25,
      competitorMention: 0.20,
      urgencyLevel: 0.15,
      decisionMakerSignal: 0.15,
      multiSignalStack: 0.05
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
    displayName: 'Regional Retail/Franchise',
    description: 'Multi-location retail, restaurant franchises, service franchises',
    pipeline: 'regional',

    signalSources: {
      tier1: ['google-reviews', 'facebook', 'franchise-forum', 'costar'],
      tier2: ['yelp', 'reddit', 'local-news', 'franchise-expo'],
      tier3: ['linkedin', 'g2', 'b2b-platform'],
      priorityOrder: ['google-reviews', 'facebook', 'franchise-forum', 'yelp']
    },

    confidenceConfig: {
      minimumThreshold: 0.50,
      highConfidenceBar: 0.72,
      multiSignalBonus: 0.14,
      sourceCountBonus: 0.05
    },

    recencyConfig: {
      decayRate: 'normal',
      maxAgeDays: 45,
      premiumWindowDays: 14,
      weightMultiplier: 1.0
    },

    geographicConfig: {
      enabled: true,
      radiusMiles: 100,
      scope: 'regional'
    },

    triggerConfig: {
      priorityTriggers: ['availability', 'consistency', 'value', 'brand-trust', 'convenience'],
      uvpEmphasis: ['locations', 'promotions', 'brand-trust', 'selection'],
      languageStyle: 'consumer',
      maxTriggersPerSession: 20,
      includeCompetitorMentions: true,
      includeLifeEvents: false,
      includeSeasonalContext: true
    },

    scoringWeights: {
      recency: 0.25,
      sourceQuality: 0.20,
      competitorMention: 0.20,
      urgencyLevel: 0.15,
      decisionMakerSignal: 0.10,
      multiSignalStack: 0.10
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
      },
      {
        name: 'Franchise Expo Season',
        startMonth: 2,
        endMonth: 4,
        signalBoost: 1.4,
        relevantCategories: ['expansion-signal', 'franchise-expansion']
      }
    ]
  },

  'national-saas-b2b': {
    profileType: 'national-saas-b2b',
    displayName: 'National SaaS B2B',
    description: 'Project management tools, CRM platforms, HR software, analytics tools',
    pipeline: 'national',

    signalSources: {
      tier1: ['g2', 'capterra', 'reddit', 'hackernews', 'trustradius'],
      tier2: ['linkedin', 'youtube', 'industry-blog', 'stackoverflow'],
      tier3: ['facebook', 'instagram', 'tiktok'],
      priorityOrder: ['g2', 'reddit', 'capterra', 'hackernews', 'linkedin']
    },

    confidenceConfig: {
      minimumThreshold: 0.55,
      highConfidenceBar: 0.78,
      multiSignalBonus: 0.16,
      sourceCountBonus: 0.05
    },

    recencyConfig: {
      decayRate: 'normal',
      maxAgeDays: 60,
      premiumWindowDays: 14,
      weightMultiplier: 1.0
    },

    geographicConfig: {
      enabled: false,
      scope: 'national'
    },

    triggerConfig: {
      priorityTriggers: ['integration-fear', 'adoption-risk', 'vendor-lock-in', 'security', 'support'],
      uvpEmphasis: ['security', 'support', 'migration-path', 'integrations', 'uptime'],
      languageStyle: 'technical',
      maxTriggersPerSession: 25,
      includeCompetitorMentions: true,
      includeLifeEvents: false,
      includeSeasonalContext: true
    },

    scoringWeights: {
      recency: 0.20,
      sourceQuality: 0.25,
      competitorMention: 0.25,
      urgencyLevel: 0.15,
      decisionMakerSignal: 0.10,
      multiSignalStack: 0.05
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
    displayName: 'National Product B2C',
    description: 'Consumer brands, D2C products, e-commerce, consumer apps',
    pipeline: 'national',

    signalSources: {
      tier1: ['reddit', 'amazon-reviews', 'youtube', 'tiktok'],
      tier2: ['instagram', 'influencer', 'product-hunt', 'trustpilot'],
      tier3: ['linkedin', 'g2', 'b2b-platform'],
      priorityOrder: ['reddit', 'amazon-reviews', 'youtube', 'tiktok', 'instagram']
    },

    confidenceConfig: {
      minimumThreshold: 0.40,
      highConfidenceBar: 0.65,
      multiSignalBonus: 0.12,
      sourceCountBonus: 0.04
    },

    recencyConfig: {
      decayRate: 'fast',
      maxAgeDays: 21,
      premiumWindowDays: 7,
      weightMultiplier: 1.5
    },

    geographicConfig: {
      enabled: false,
      scope: 'national'
    },

    triggerConfig: {
      priorityTriggers: ['quality-doubt', 'comparison-shopping', 'social-proof', 'returns', 'authenticity'],
      uvpEmphasis: ['differentiation', 'social-proof', 'value', 'quality', 'brand-story'],
      languageStyle: 'consumer',
      maxTriggersPerSession: 30,
      includeCompetitorMentions: true,
      includeLifeEvents: true,
      includeSeasonalContext: true
    },

    scoringWeights: {
      recency: 0.30,
      sourceQuality: 0.15,
      competitorMention: 0.20,
      urgencyLevel: 0.10,
      decisionMakerSignal: 0.05,
      multiSignalStack: 0.20
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
      },
      {
        name: 'Holiday Gift Giving',
        startMonth: 11,
        endMonth: 12,
        signalBoost: 1.6,
        relevantCategories: ['recommendation-request', 'feature-comparison', 'social-proof-request']
      }
    ]
  },

  'global-saas-b2b': {
    profileType: 'global-saas-b2b',
    displayName: 'Global SaaS B2B',
    description: 'International SaaS with EMEA/APAC presence, enterprise platforms',
    pipeline: 'national',

    signalSources: {
      tier1: ['g2', 'gartner', 'forrester', 'linkedin', 'reddit'],
      tier2: ['hackernews', 'industry-analyst', 'conference', 'capterra-eu'],
      tier3: ['facebook', 'instagram', 'local-review'],
      priorityOrder: ['g2', 'gartner', 'linkedin', 'reddit', 'forrester']
    },

    confidenceConfig: {
      minimumThreshold: 0.60,
      highConfidenceBar: 0.82,
      multiSignalBonus: 0.18,
      sourceCountBonus: 0.06
    },

    recencyConfig: {
      decayRate: 'slow',
      maxAgeDays: 90,
      premiumWindowDays: 21,
      weightMultiplier: 0.8
    },

    geographicConfig: {
      enabled: true,
      regions: ['EMEA', 'APAC', 'Americas'],
      scope: 'global'
    },

    triggerConfig: {
      priorityTriggers: ['integration-fear', 'vendor-lock-in', 'compliance', 'data-residency', 'localization'],
      uvpEmphasis: ['gdpr-compliance', 'multi-region', 'enterprise-security', 'localization', 'data-sovereignty'],
      languageStyle: 'technical',
      maxTriggersPerSession: 20,
      includeCompetitorMentions: true,
      includeLifeEvents: false,
      includeSeasonalContext: true
    },

    scoringWeights: {
      recency: 0.15,
      sourceQuality: 0.25,
      competitorMention: 0.20,
      urgencyLevel: 0.15,
      decisionMakerSignal: 0.15,
      multiSignalStack: 0.10
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
      },
      {
        name: 'GDPR Anniversary Review',
        startMonth: 5,
        endMonth: 6,
        signalBoost: 1.3,
        relevantCategories: ['compliance-need', 'switching-intent']
      }
    ],

    complianceRequirements: ['GDPR', 'SOC2', 'ISO27001', 'HIPAA', 'CCPA', 'Data Residency']
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get configuration for a specific profile type
 */
export function getProfileConfig(profileType: BusinessProfileType): ProfilePipelineConfig {
  return PROFILE_PIPELINE_CONFIGS[profileType];
}

/**
 * Get all profiles for a specific pipeline
 */
export function getProfilesByPipeline(pipeline: 'local' | 'regional' | 'national'): BusinessProfileType[] {
  return (Object.entries(PROFILE_PIPELINE_CONFIGS) as [BusinessProfileType, ProfilePipelineConfig][])
    .filter(([, config]) => config.pipeline === pipeline)
    .map(([type]) => type);
}

/**
 * Get profiles with specific compliance requirements
 */
export function getProfilesWithCompliance(requirement: string): BusinessProfileType[] {
  return (Object.entries(PROFILE_PIPELINE_CONFIGS) as [BusinessProfileType, ProfilePipelineConfig][])
    .filter(([, config]) => config.complianceRequirements?.includes(requirement))
    .map(([type]) => type);
}

/**
 * Get tier 1 sources for a profile
 */
export function getTier1Sources(profileType: BusinessProfileType): string[] {
  return PROFILE_PIPELINE_CONFIGS[profileType].signalSources.tier1;
}

/**
 * Get active seasonal patterns for a profile
 */
export function getActiveSeasonalPatterns(profileType: BusinessProfileType): SeasonalPatternConfig[] {
  const config = PROFILE_PIPELINE_CONFIGS[profileType];
  if (!config.seasonalPatterns) return [];

  const currentMonth = new Date().getMonth() + 1;

  return config.seasonalPatterns.filter(pattern => {
    if (pattern.startMonth <= pattern.endMonth) {
      return currentMonth >= pattern.startMonth && currentMonth <= pattern.endMonth;
    } else {
      // Handle year-spanning patterns
      return currentMonth >= pattern.startMonth || currentMonth <= pattern.endMonth;
    }
  });
}

/**
 * Calculate seasonal boost for a profile and category
 */
export function getSeasonalBoost(profileType: BusinessProfileType, category: string): number {
  const activePatterns = getActiveSeasonalPatterns(profileType);

  for (const pattern of activePatterns) {
    if (pattern.relevantCategories.includes(category)) {
      return pattern.signalBoost;
    }
  }

  return 1.0;
}

/**
 * Get confidence threshold for a profile
 */
export function getConfidenceThreshold(
  profileType: BusinessProfileType,
  level: 'minimum' | 'high' = 'minimum'
): number {
  const config = PROFILE_PIPELINE_CONFIGS[profileType].confidenceConfig;
  return level === 'high' ? config.highConfidenceBar : config.minimumThreshold;
}

/**
 * Check if geographic filtering is enabled for a profile
 */
export function isGeographicFilteringEnabled(profileType: BusinessProfileType): boolean {
  return PROFILE_PIPELINE_CONFIGS[profileType].geographicConfig.enabled;
}

/**
 * Get all profile display names
 */
export function getProfileDisplayNames(): Record<BusinessProfileType, string> {
  return (Object.entries(PROFILE_PIPELINE_CONFIGS) as [BusinessProfileType, ProfilePipelineConfig][])
    .reduce((acc, [type, config]) => {
      acc[type] = config.displayName;
      return acc;
    }, {} as Record<BusinessProfileType, string>);
}
