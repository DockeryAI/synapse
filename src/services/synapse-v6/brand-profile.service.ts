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
const PROFILE_API_PRIORITIES: Record<BusinessProfileType, TabApiPriorities> = {
  'local-b2c': {
    voc: ['outscraper', 'apify-facebook', 'serper'],
    community: ['apify-facebook', 'reddit', 'apify-nextdoor'],
    competitive: ['semrush', 'meta-ads'],
    trends: ['newsapi-local', 'openweather'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['openweather', 'serper-events', 'google-places'],
  },
  'local-b2b': {
    voc: ['outscraper', 'apify-linkedin', 'serper'],
    community: ['linkedin', 'reddit', 'apify-twitter'],
    competitive: ['semrush', 'meta-ads'],
    trends: ['newsapi', 'perplexity'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['newsapi', 'serper-events'],
  },
  'regional-agency': {
    voc: ['apify-clutch', 'apify-upwork', 'linkedin'],
    community: ['reddit-marketing', 'apify-twitter', 'linkedin'],
    competitive: ['semrush', 'meta-ads'],
    trends: ['newsapi-marketing', 'apify-twitter'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['newsapi-budgets', 'serper'],
  },
  'regional-retail': {
    voc: ['outscraper-multi', 'apify-yelp', 'google-places'],
    community: ['reddit-regional', 'facebook-groups'],
    competitive: ['semrush', 'meta-ads'],
    trends: ['newsapi-regional', 'openweather'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['openweather', 'google-places', 'newsapi'],
  },
  'national-saas': {
    voc: ['apify-g2', 'apify-capterra', 'apify-trustradius'],
    community: ['reddit', 'hackernews', 'apify-twitter'],
    competitive: ['semrush', 'meta-ads'],
    trends: ['newsapi-tech', 'hackernews', 'perplexity'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['newsapi-funding', 'sec-edgar'],
  },
  'national-product': {
    voc: ['apify-amazon', 'reddit', 'apify-tiktok'],
    community: ['reddit', 'apify-tiktok', 'apify-instagram'],
    competitive: ['semrush', 'meta-ads'],
    trends: ['newsapi', 'youtube', 'apify-tiktok'],
    search: ['semrush', 'serper-autocomplete'],
    local_timing: ['newsapi-holidays', 'openweather'],
  },
};

/**
 * Detect profile type from UVP data
 */
export function detectProfileType(uvp: CompleteUVP): BusinessProfileType {
  const { targetCustomer, uniqueSolution } = uvp;

  // Check for SaaS indicators
  const saasKeywords = ['software', 'saas', 'platform', 'app', 'subscription', 'cloud'];
  const isSaas = saasKeywords.some(
    (kw) =>
      uniqueSolution?.headline?.toLowerCase().includes(kw) ||
      targetCustomer?.primaryProfile?.toLowerCase().includes(kw)
  );

  // Check for B2B indicators
  const b2bKeywords = ['business', 'enterprise', 'company', 'organization', 'team'];
  const isB2B = b2bKeywords.some(
    (kw) => targetCustomer?.primaryProfile?.toLowerCase().includes(kw)
  );

  // Check for local indicators
  const localKeywords = ['local', 'nearby', 'neighborhood', 'community'];
  const isLocal =
    localKeywords.some((kw) => targetCustomer?.primaryProfile?.toLowerCase().includes(kw)) ||
    targetCustomer?.geographicFocus?.toLowerCase().includes('local');

  // Check for multi-location
  const isMultiLocation =
    targetCustomer?.geographicFocus?.toLowerCase().includes('regional') ||
    targetCustomer?.geographicFocus?.toLowerCase().includes('multi');

  // Decision tree
  if (isSaas) {
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
    customer: uvp.targetCustomer?.primaryProfile,
    benefit: uvp.keyBenefit?.headline,
    solution: uvp.uniqueSolution?.headline,
    transformation: uvp.transformation?.beforeState,
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
 * Get or create brand profile from UVP
 */
export async function getOrCreateBrandProfile(
  brandId: string,
  uvp: CompleteUVP
): Promise<BrandProfile | null> {
  const profileHash = generateProfileHash(uvp);

  // Check for existing profile with same hash
  const { data: existing, error: fetchError } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('brand_id', brandId)
    .eq('profile_hash', profileHash)
    .maybeSingle();

  if (fetchError) {
    console.error('[BrandProfileService] Error fetching profile:', fetchError);
    return null;
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
    console.error('[BrandProfileService] Error creating profile:', createError);
    return null;
  }

  console.log('[BrandProfileService] Created new profile:', created.profile_type);
  return created as BrandProfile;
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
