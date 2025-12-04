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
// V5 FIX: Updated to use working API configs
const PROFILE_API_PRIORITIES: Record<BusinessProfileType, TabApiPriorities> = {
  'local-b2c': {
    // V5 FIX: Added google-maps for local reviews, use apify-yelp
    voc: ['google-maps', 'outscraper', 'apify-yelp', 'serper'],
    community: ['apify-facebook', 'reddit', 'serper'],
    competitive: ['semrush', 'serper'],
    trends: ['newsapi', 'openweather'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['openweather', 'serper-events'],
  },
  'local-b2b': {
    // V5 FIX: Added google-maps for local reviews
    voc: ['google-maps', 'outscraper', 'apify-linkedin', 'serper'],
    community: ['apify-linkedin', 'reddit', 'apify-twitter'],
    competitive: ['semrush', 'serper'],
    trends: ['newsapi', 'perplexity'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['newsapi', 'serper-events'],
  },
  'regional-agency': {
    // V5 FIX: Use apify-g2 for Clutch (Serper site: search)
    voc: ['apify-g2', 'apify-linkedin', 'serper'],
    community: ['reddit', 'apify-twitter', 'apify-linkedin'],
    competitive: ['semrush', 'serper'],
    trends: ['newsapi', 'apify-twitter'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['newsapi', 'serper'],
  },
  'regional-retail': {
    // V5 FIX: Use google-maps and apify-yelp
    voc: ['google-maps', 'apify-yelp', 'outscraper', 'serper'],
    community: ['reddit', 'apify-facebook'],
    competitive: ['semrush', 'serper'],
    trends: ['newsapi', 'openweather'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['openweather', 'newsapi'],
  },
  'national-saas': {
    // V5 FIX: Use apify-g2, apify-capterra (now Serper site: searches)
    voc: ['apify-g2', 'apify-capterra', 'reddit', 'hackernews'],
    community: ['reddit', 'hackernews', 'apify-twitter'],
    competitive: ['semrush', 'serper'],
    trends: ['buzzsumo', 'newsapi', 'hackernews', 'perplexity'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['newsapi', 'sec-edgar'],
  },
  'national-product': {
    // V5 FIX: Use apify-amazon (now Serper site: search)
    voc: ['apify-amazon', 'apify-trustpilot', 'reddit', 'apify-tiktok'],
    community: ['reddit', 'apify-tiktok', 'apify-instagram'],
    competitive: ['semrush', 'buzzsumo'],
    trends: ['buzzsumo', 'newsapi', 'youtube', 'apify-tiktok'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['newsapi', 'openweather'],
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

    // Handle missing table gracefully
    if (fetchError) {
      if (fetchError.code === '42P01' || fetchError.code === 'PGRST205' ||
          fetchError.message?.includes('relation') || fetchError.message?.includes('brand_profiles')) {
        console.log('[BrandProfileService] brand_profiles table not found - using in-memory profile');
        return createInMemoryProfile(brandId, uvp);
      }
      console.error('[BrandProfileService] Error fetching profile:', fetchError);
      return createInMemoryProfile(brandId, uvp);
    }

    if (existing) {
      console.log('[BrandProfileService] Found existing profile:', existing.profile_type);
      return existing as BrandProfile;
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
