/**
 * INDUSTRY PROFILES REGISTRY
 *
 * Central registry for all industry profiles.
 * Easy access to industry-specific psychology and messaging.
 */

import type { IndustryProfile, IndustryRegistry } from '../../types/industry-profile.types';

import { RestaurantProfile } from './restaurant.profile';
import { CPAProfile } from './cpa.profile';
import { RealtorProfile } from './realtor.profile';
import { DentistProfile } from './dentist.profile';
import { ConsultantProfile } from './consultant.profile';

// ============================================================================
// ALL PROFILES
// ============================================================================

export const ALL_INDUSTRIES: IndustryProfile[] = [
  RestaurantProfile,
  CPAProfile,
  RealtorProfile,
  DentistProfile,
  ConsultantProfile,
];

// ============================================================================
// REGISTRY IMPLEMENTATION
// ============================================================================

class IndustryRegistryImpl implements IndustryRegistry {
  industries = ALL_INDUSTRIES;

  getById(id: string): IndustryProfile | undefined {
    return this.industries.find((industry) => industry.id === id);
  }

  getByNaics(naicsCode: string): IndustryProfile | undefined {
    return this.industries.find((industry) => {
      if (!industry.naicsCode) return false;
      // Match on prefix (e.g., "722" matches "722511")
      return naicsCode.startsWith(industry.naicsCode) || industry.naicsCode.startsWith(naicsCode);
    });
  }

  getAllIds(): string[] {
    return this.industries.map((industry) => industry.id);
  }

  /**
   * Get profile with fallback to generic
   */
  getByIdOrDefault(id: string): IndustryProfile {
    return this.getById(id) || this.getById('consultant')!; // Consultant is most generic
  }

  /**
   * Search profiles by keywords
   */
  search(query: string): IndustryProfile[] {
    const lowerQuery = query.toLowerCase();
    return this.industries.filter(
      (industry) =>
        industry.name.toLowerCase().includes(lowerQuery) ||
        industry.targetAudience.toLowerCase().includes(lowerQuery) ||
        industry.contentThemes.some((theme) => theme.toLowerCase().includes(lowerQuery))
    );
  }
}

export const industryRegistry = new IndustryRegistryImpl();

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { RestaurantProfile } from './restaurant.profile';
export { CPAProfile } from './cpa.profile';
export { RealtorProfile } from './realtor.profile';
export { DentistProfile } from './dentist.profile';
export { ConsultantProfile } from './consultant.profile';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all power words across all industries
 */
export function getAllPowerWords(): string[] {
  const allWords = new Set<string>();
  for (const industry of ALL_INDUSTRIES) {
    industry.powerWords.forEach((word) => allWords.add(word));
  }
  return Array.from(allWords);
}

/**
 * Get all content themes across all industries
 */
export function getAllContentThemes(): string[] {
  const allThemes = new Set<string>();
  for (const industry of ALL_INDUSTRIES) {
    industry.contentThemes.forEach((theme) => allThemes.add(theme));
  }
  return Array.from(allThemes);
}

/**
 * Get industry by NAICS code with confidence scoring
 */
export function matchIndustryByNaics(naicsCode: string): {
  profile: IndustryProfile | undefined;
  confidence: number;
} {
  const profile = industryRegistry.getByNaics(naicsCode);
  if (!profile) {
    return { profile: undefined, confidence: 0 };
  }

  // Calculate confidence based on NAICS match precision
  const matchLength = Math.min(naicsCode.length, profile.naicsCode?.length || 0);
  const confidence = (matchLength / 6) * 100; // NAICS codes are 6 digits

  return { profile, confidence };
}

/**
 * Get recommended posting frequency for industry
 */
export function getRecommendedPostingFrequency(industryId: string): number {
  const profile = industryRegistry.getById(industryId);
  return profile?.postingFrequency.optimal || 3; // Default to 3 posts/week
}

/**
 * Get best posting times for industry
 */
export function getBestPostingTimes(industryId: string): Array<{ day: string; hour: number }> {
  const profile = industryRegistry.getById(industryId);
  if (!profile) return [];

  return profile.bestPostingTimes.map((time) => ({
    day: time.dayOfWeek,
    hour: time.hourOfDay,
  }));
}

/**
 * Get primary emotional triggers for industry
 */
export function getPrimaryTriggers(industryId: string): string[] {
  const profile = industryRegistry.getById(industryId);
  return profile?.psychologyProfile.primaryTriggers || [];
}
