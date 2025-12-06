// PRD Feature: SYNAPSE-V6
/**
 * Brand Profile Service
 *
 * Manages brand-specific profiles for intelligent tab routing and API selection.
 * Uses UVP data to determine profile type and configure tab priorities.
 *
 * Profile Types (6):
 * - local-b2c: Local service businesses (plumber, restaurant)
 * - local-b2b: Local B2B services (commercial cleaning)
 * - regional-agency: Regional agencies/consultants
 * - regional-retail: Multi-location retail
 * - national-saas: National SaaS companies
 * - national-product: National product/e-commerce
 */

import { supabase } from '@/lib/supabase';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import crypto from 'crypto';

// Profile type enum matching database
export type BusinessProfileType =
  | 'local-b2c'
  | 'local-b2b'
  | 'regional-agency'
  | 'regional-retail'
  | 'national-saas'
  | 'national-product';

// Tab types
export type InsightTab =
  | 'voc'          // Voice of Customer
  | 'community'    // Community Discussions
  | 'competitive'  // Competitive Intelligence
  | 'trends'       // Industry Trends
  | 'search'       // Search Intent
  | 'local_timing'; // Local/Timing Signals

// API priorities by tab
export interface TabApiPriorities {
  voc: string[];
  community: string[];
  competitive: string[];
  trends: string[];
  search: string[];
  local_timing: string[];
}

// Brand profile interface
export interface BrandProfile {
  id: string;
  brand_id: string;
  profile_hash: string;
  profile_type: BusinessProfileType;
  uvp_data: CompleteUVP;
  industry_match_code?: string;
  industry_match_confidence?: number;
  enabled_tabs: InsightTab[];
  api_priorities: TabApiPriorities;
  created_at: string;
  updated_at: string;
}

// Default API priorities by profile type
// V6 FIX: Replaced newsapi with serper-news (newsapi key not configured)
const PROFILE_API_PRIORITIES: Record<BusinessProfileType, TabApiPriorities> = {
  'local-b2c': {
    voc: ['google-maps', 'outscraper', 'apify-yelp', 'youtube-comments', 'serper'],
    community: ['apify-facebook', 'reddit', 'serper'],
    competitive: ['semrush', 'serper'],
    trends: ['serper-news', 'openweather'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['openweather', 'serper-events'],
  },
  'local-b2b': {
    voc: ['google-maps', 'outscraper', 'apify-linkedin', 'linkedin-serper', 'twitter-api', 'serper'],
    community: ['apify-linkedin', 'reddit', 'twitter-api'],
    competitive: ['companies-house', 'semrush', 'serper'], // V6 Phase 18: UK company filings
    trends: ['serper-news', 'perplexity'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['serper-news', 'serper-events'],
  },
  'regional-agency': {
    voc: ['apify-g2', 'apify-linkedin', 'linkedin-serper', 'twitter-api', 'serper'],
    community: ['reddit', 'twitter-api', 'apify-linkedin'],
    competitive: ['companies-house', 'semrush', 'serper'], // V6 Phase 18: UK company filings
    trends: ['serper-news', 'twitter-api'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['serper-news', 'serper'],
  },
  'regional-retail': {
    voc: ['google-maps', 'apify-yelp', 'outscraper', 'serper'],
    community: ['reddit', 'apify-facebook'],
    competitive: ['semrush', 'serper'],
    trends: ['serper-news', 'openweather'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['openweather', 'serper-news'],
  },
  'national-saas': {
    // V6 VOC FIX: 10x Quote Volume - Expanded sources for real customer quotes
    // PHASE 20E: REMOVED perplexity-reviews - generates hallucinated quotes with fake sources
    // PHASE 20L: RE-ADDED companies-house-voc - chairman's statement = buyer intelligence
    voc: [
      'apify-g2', 'apify-capterra', 'apify-trustradius',  // Review platforms
      'hackernews-comments', 'producthunt', 'indiehackers',  // Tech community
      'reddit-professional', 'linkedin-serper', 'twitter-api', 'youtube-comments',  // Social
      'sec-api-io',  // V6 Phase 17: Executive strategy quotes from SEC filings (US)
      'companies-house-voc',  // PHASE 20L: UK buyer company intelligence (chairman's statement)
    ],
    community: ['reddit-professional', 'apify-linkedin', 'twitter-api', 'hackernews'],
    competitive: ['companies-house', 'sec-api-io', 'semrush', 'serper'], // UK/US company intel
    trends: ['perplexity', 'hackernews', 'serper-news'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['serper-news', 'perplexity'],
  },
  'national-product': {
    voc: ['apify-amazon', 'apify-trustpilot', 'reddit', 'apify-tiktok'],
    community: ['reddit', 'apify-tiktok', 'apify-instagram'],
    competitive: ['semrush', 'buzzsumo'],
    trends: ['buzzsumo', 'serper-news', 'youtube', 'apify-tiktok'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['serper-news', 'openweather'],
  },
};

/**
 * Detect profile type from UVP data
 */
export function detectProfileType(uvp: CompleteUVP): BusinessProfileType {
  const { targetCustomer, uniqueSolution } = uvp;

  console.log('[BrandProfileService] Detecting profile for:', {
    targetCustomer: targetCustomer?.statement,
    uniqueSolution: uniqueSolution?.statement
  });

  // Check for SaaS indicators
  const saasKeywords = ['software', 'saas', 'platform', 'app', 'subscription', 'cloud'];
  const isSaas = saasKeywords.some(
    (kw) =>
      uniqueSolution?.statement?.toLowerCase().includes(kw) ||
      targetCustomer?.statement?.toLowerCase().includes(kw)
  );

  // Check for B2B indicators
  const b2bKeywords = ['business', 'enterprise', 'company', 'organization', 'team', 'broker', 'agency', 'owner', 'professional'];
  const isB2B = b2bKeywords.some(
    (kw) => targetCustomer?.statement?.toLowerCase().includes(kw)
  );

  // Check for local indicators
  const localKeywords = ['local', 'nearby', 'neighborhood', 'community'];
  const geographicScope = targetCustomer?.marketGeography?.scope || '';
  const isLocal =
    localKeywords.some((kw) => targetCustomer?.statement?.toLowerCase().includes(kw)) ||
    geographicScope === 'local';

  // Check for multi-location
  const isMultiLocation =
    geographicScope === 'regional' ||
    (targetCustomer?.marketGeography?.primaryRegions?.length || 0) > 1;

  console.log('[BrandProfileService] Detection flags:', {
    isSaas, isB2B, isLocal, isMultiLocation
  });

  // Decision tree
  if (isSaas) {
    console.log('[BrandProfileService] Detected: national-saas (SaaS indicators found)');
    return 'national-saas';
  }

  if (isB2B) {
    if (isLocal) return 'local-b2b';
    if (isMultiLocation) return 'regional-agency';
    return 'national-saas'; // Default B2B to SaaS
  }

  if (isLocal) {
    return 'local-b2c';
  }

  if (isMultiLocation) {
    return 'regional-retail';
  }

  // Default based on business model signals
  return 'local-b2c';
}

/**
 * Generate profile hash for deduplication
 */
function generateProfileHash(uvp: CompleteUVP): string {
  const hashInput = JSON.stringify({
    customer: uvp.targetCustomer?.statement,
    benefit: uvp.keyBenefit?.statement,
    solution: uvp.uniqueSolution?.statement,
    transformation: uvp.transformationGoal?.before,
  });

  // Use simple hash since crypto might not be available in browser
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Create in-memory profile (fallback when DB unavailable)
 */
function createInMemoryProfile(brandId: string, uvp: CompleteUVP): BrandProfile {
  const profileHash = generateProfileHash(uvp);
  const profileType = detectProfileType(uvp);
  const apiPriorities = PROFILE_API_PRIORITIES[profileType];

  // All tabs enabled by default
  const enabledTabs: InsightTab[] = [
    'voc',
    'community',
    'competitive',
    'trends',
    'search',
    'local_timing',
  ];

  return {
    id: `local-${brandId}-${profileHash}`,
    brand_id: brandId,
    profile_hash: profileHash,
    profile_type: profileType,
    uvp_data: uvp,
    enabled_tabs: enabledTabs,
    api_priorities: apiPriorities,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get or create brand profile from UVP
 */
export async function getOrCreateBrandProfile(
  brandId: string,
  uvp: CompleteUVP
): Promise<BrandProfile> {
  const profileHash = generateProfileHash(uvp);

  try {
    // Check for existing profile with same hash
    const { data: existing, error: fetchError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('brand_id', brandId)
      .eq('profile_hash', profileHash)
      .maybeSingle();

    // Handle missing table or column gracefully
    if (fetchError) {
      if (fetchError.code === '42P01' || fetchError.code === 'PGRST205' || fetchError.code === '42703' ||
          fetchError.message?.includes('relation') || fetchError.message?.includes('brand_profiles') ||
          fetchError.message?.includes('profile_hash') || fetchError.message?.includes('column') ||
          fetchError.message?.includes('does not exist')) {
        console.log('[BrandProfileService] brand_profiles table not found - using in-memory profile');
        return createInMemoryProfile(brandId, uvp);
      }
      console.error('[BrandProfileService] Error fetching profile:', fetchError);
      return createInMemoryProfile(brandId, uvp);
    }

    if (existing) {
      console.log('[BrandProfileService] Found existing profile:', existing.profile_type);
      // V6 FIX: Always use latest api_priorities from code (not stale DB values)
      // This ensures new APIs added to PROFILE_API_PRIORITIES are immediately available
      const latestApiPriorities = PROFILE_API_PRIORITIES[existing.profile_type as BusinessProfileType];
      return {
        ...existing,
        api_priorities: latestApiPriorities,
      } as BrandProfile;
    }

    // Detect profile type
    const profileType = detectProfileType(uvp);
    const apiPriorities = PROFILE_API_PRIORITIES[profileType];

    // All tabs enabled by default
    const enabledTabs: InsightTab[] = [
      'voc',
      'community',
      'competitive',
      'trends',
      'search',
      'local_timing',
    ];

    // Create new profile
    const newProfile = {
      brand_id: brandId,
      profile_hash: profileHash,
      profile_type: profileType,
      uvp_data: uvp,
      enabled_tabs: enabledTabs,
      api_priorities: apiPriorities,
    };

    const { data: created, error: createError } = await supabase
      .from('brand_profiles')
      .insert(newProfile)
      .select()
      .single();

    if (createError) {
      console.error('[BrandProfileService] Error creating profile (using in-memory):', createError);
      return createInMemoryProfile(brandId, uvp);
    }

    console.log('[BrandProfileService] Created new profile:', created.profile_type);
    return created as BrandProfile;
  } catch (err) {
    console.error('[BrandProfileService] Unexpected error (using in-memory):', err);
    return createInMemoryProfile(brandId, uvp);
  }
}

/**
 * Update industry match for a brand profile
 */
export async function updateIndustryMatch(
  profileId: string,
  industryCode: string,
  confidence: number
): Promise<boolean> {
  const { error } = await supabase
    .from('brand_profiles')
    .update({
      industry_match_code: industryCode,
      industry_match_confidence: confidence,
    })
    .eq('id', profileId);

  if (error) {
    console.error('[BrandProfileService] Error updating industry match:', error);
    return false;
  }

  return true;
}

/**
 * Get API priorities for a specific tab
 */
export function getTabApis(
  profile: BrandProfile,
  tab: InsightTab
): string[] {
  return profile.api_priorities[tab] || [];
}

// Export singleton functions
export const brandProfileService = {
  detectProfileType,
  getOrCreateBrandProfile,
  updateIndustryMatch,
  getTabApis,
};
