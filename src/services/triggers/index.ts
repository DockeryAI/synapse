// PRD Feature: SYNAPSE-V6
// Trigger services - V6 simplified implementation

export * from './trigger-synthesis.service';
export * from './early-trigger-loader.service';

// Re-export V6 brand profile types (used by profile-scanner)
export type { BusinessProfileType } from '../synapse-v6/brand-profile.service';

// V6 simplified profile analysis interface
export interface BusinessProfileAnalysis {
  profileType: string;
  customerType: 'b2b' | 'b2c' | 'b2b2c';
  signals: string[];
  confidence: number;
}

// API types that can be gated per profile (V5 compatibility)
export type GatedApiType =
  | 'google-reviews'
  | 'yelp'
  | 'nextdoor'
  | 'facebook'
  | 'linkedin'
  | 'clutch'
  | 'g2'
  | 'capterra'
  | 'trustradius'
  | 'gartner'
  | 'forrester'
  | 'reddit'
  | 'hackernews'
  | 'youtube'
  | 'tiktok'
  | 'amazon-reviews'
  | 'instagram'
  | 'twitter'
  | 'trustpilot'
  | 'bbb'
  | 'local-news'
  | 'industry-forum'
  | 'perplexity';

// V6 simplified profile detection stub (for backwards compatibility)
class ProfileDetectionService {
  detectProfile(uvp: any, brandData?: any): BusinessProfileAnalysis {
    // Simplified V6 - always returns national-saas-b2b
    return {
      profileType: 'national-saas-b2b',
      customerType: 'b2b',
      signals: ['V6 simplified detection'],
      confidence: 0.8
    };
  }
}

export const profileDetectionService = new ProfileDetectionService();

// API management functions for streaming-api-manager compatibility
export const shouldRunApi = (profileType: any, apiName: string): boolean => {
  // V6 simplified - always allow
  return true;
};

export const getApiPriorityOrder = (profileType: any): GatedApiType[] => {
  // V6 simplified priority order
  return ['serper', 'perplexity', 'reddit', 'linkedin'] as GatedApiType[];
};

export const getApiWeight = (profileType: any, apiName: string): number => {
  // V6 simplified weights
  const weights: Record<string, number> = {
    serper: 3,
    perplexity: 2,
    reddit: 2,
    linkedin: 2,
    buzzsumo: 1
  };
  return weights[apiName] || 1;
};

export const getEnabledApis = (profileType: any): GatedApiType[] => {
  // V6 simplified - return available APIs
  return ['google-reviews', 'linkedin', 'reddit', 'perplexity'] as GatedApiType[];
};
