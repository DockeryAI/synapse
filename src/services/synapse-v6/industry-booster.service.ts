// PRD Feature: SYNAPSE-V6
/**
 * Industry Booster Service
 *
 * Industry profiles are now OPTIONAL boosters, not required.
 * Brand profiles (from UVP) are the primary driver.
 * Industry profiles add supplementary context when matched.
 *
 * Flow:
 * 1. Brand profile created from UVP (required)
 * 2. Industry match attempted in background (optional)
 * 3. If matched with high confidence, apply as booster
 * 4. Booster adds: pain points, trends, seasonal factors
 */

import { supabase } from '@/lib/supabase';
import type { BrandProfile } from './brand-profile.service';
import { updateIndustryMatch } from './brand-profile.service';

export interface IndustryProfile {
  id: string;
  naics_code: string;
  title: string;
  description?: string;
  level: number;
  has_full_profile: boolean;

  // Full profile data
  industry_overview?: string;
  market_size?: string;
  growth_rate?: string;
  key_trends?: string[];
  customer_segments?: string[];
  pain_points?: string[];
  common_objections?: string[];
  success_metrics?: string[];
  regulatory_considerations?: string[];
  seasonal_factors?: string[];
  competitive_landscape?: string;
}

export interface IndustryBooster {
  matched: boolean;
  confidence: number;
  naicsCode?: string;
  industryTitle?: string;

  // Booster data (only if matched with high confidence)
  additionalPainPoints: string[];
  industryTrends: string[];
  seasonalFactors: string[];
  competitiveLandscape?: string;
  regulatoryContext?: string;
}

// Minimum confidence for applying booster
const BOOSTER_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Attempt to match a brand profile to an industry profile
 */
export async function matchIndustryProfile(
  brandProfile: BrandProfile
): Promise<IndustryBooster> {
  const uvp = brandProfile.uvp_data;

  // Build search terms from UVP
  const searchTerms: string[] = [];

  if (uvp.uniqueSolution?.statement) {
    searchTerms.push(uvp.uniqueSolution.statement);
  }
  if (uvp.targetCustomer?.statement) {
    searchTerms.push(uvp.targetCustomer.statement);
  }
  if (uvp.keyBenefit?.statement) {
    searchTerms.push(uvp.keyBenefit.statement);
  }

  if (searchTerms.length === 0) {
    return createEmptyBooster();
  }

  // Search for matching industry profiles
  const searchQuery = searchTerms.join(' ').toLowerCase();

  const { data: matches, error } = await supabase
    .from('industry_profiles')
    .select('*')
    .eq('has_full_profile', true)
    .limit(10);

  if (error || !matches || matches.length === 0) {
    console.log('[IndustryBooster] No industry matches found');
    return createEmptyBooster();
  }

  // Score matches based on keyword overlap
  const scoredMatches = matches.map((profile: IndustryProfile) => {
    const profileText = [
      profile.title,
      profile.description,
      profile.industry_overview,
      ...(profile.customer_segments || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Calculate word overlap score
    const searchWords = searchQuery.split(/\s+/).filter((w) => w.length > 3);
    const matchedWords = searchWords.filter((word) => profileText.includes(word));
    const score = searchWords.length > 0
      ? matchedWords.length / searchWords.length
      : 0;

    return { profile, score };
  });

  // Sort by score and take best match
  scoredMatches.sort((a, b) => b.score - a.score);
  const bestMatch = scoredMatches[0];

  if (!bestMatch || bestMatch.score < BOOSTER_CONFIDENCE_THRESHOLD) {
    console.log('[IndustryBooster] No high-confidence match found');
    return createEmptyBooster();
  }

  const profile = bestMatch.profile;

  // Update brand profile with industry match
  await updateIndustryMatch(
    brandProfile.id,
    profile.naics_code,
    bestMatch.score
  );

  console.log(
    '[IndustryBooster] Matched industry:',
    profile.title,
    'confidence:',
    bestMatch.score.toFixed(2)
  );

  // Build booster from industry profile
  return {
    matched: true,
    confidence: bestMatch.score,
    naicsCode: profile.naics_code,
    industryTitle: profile.title,
    additionalPainPoints: profile.pain_points || [],
    industryTrends: profile.key_trends || [],
    seasonalFactors: profile.seasonal_factors || [],
    competitiveLandscape: profile.competitive_landscape,
    regulatoryContext: profile.regulatory_considerations?.join('; '),
  };
}

/**
 * Apply booster to UVP context
 */
export function applyBoosterToContext(
  baseContext: string,
  booster: IndustryBooster
): string {
  if (!booster.matched) {
    return baseContext;
  }

  const boosterSections: string[] = [
    baseContext,
    '',
    '## Industry Context (Booster)',
    `Industry: ${booster.industryTitle}`,
  ];

  if (booster.additionalPainPoints.length > 0) {
    boosterSections.push(
      `Industry Pain Points: ${booster.additionalPainPoints.slice(0, 5).join('; ')}`
    );
  }

  if (booster.industryTrends.length > 0) {
    boosterSections.push(
      `Current Trends: ${booster.industryTrends.slice(0, 3).join('; ')}`
    );
  }

  if (booster.seasonalFactors.length > 0) {
    boosterSections.push(
      `Seasonal Factors: ${booster.seasonalFactors.slice(0, 3).join('; ')}`
    );
  }

  if (booster.competitiveLandscape) {
    boosterSections.push(`Competitive Landscape: ${booster.competitiveLandscape}`);
  }

  return boosterSections.join('\n');
}

/**
 * Get industry-specific query modifiers
 */
export function getIndustryQueryModifiers(
  booster: IndustryBooster
): string[] {
  if (!booster.matched) {
    return [];
  }

  const modifiers: string[] = [];

  // Add industry name for more targeted searches
  if (booster.industryTitle) {
    modifiers.push(booster.industryTitle);
  }

  // Add top pain points as search modifiers
  if (booster.additionalPainPoints.length > 0) {
    modifiers.push(...booster.additionalPainPoints.slice(0, 2));
  }

  return modifiers;
}

/**
 * Create empty booster when no match found
 */
function createEmptyBooster(): IndustryBooster {
  return {
    matched: false,
    confidence: 0,
    additionalPainPoints: [],
    industryTrends: [],
    seasonalFactors: [],
  };
}

// Export service
export const industryBooster = {
  matchIndustryProfile,
  applyBoosterToContext,
  getIndustryQueryModifiers,
};
