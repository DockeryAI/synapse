/**
 * Domain Mapper
 *
 * Unified domain mapping for both B2C and B2B profiles.
 * Used by connection engine to calculate cross-domain unexpectedness.
 */

import { getB2CDomain, areB2CSourcesCrossDomain, type B2CDomain } from './b2c-domains';
import { getB2BDomain, areB2BSourcesCrossDomain, type B2BDomain } from './b2b-domains';

export type ProfileType =
  | 'local-service-b2c'
  | 'local-service-b2b'
  | 'regional-b2b-agency'
  | 'regional-retail-b2c'
  | 'national-saas-b2b'
  | 'national-product-b2c'
  | 'global-saas-b2b';

export type Domain = B2CDomain | B2BDomain;

/**
 * Determine if profile is B2B or B2C
 */
export function isB2BProfile(profile: ProfileType): boolean {
  return profile.includes('b2b');
}

/**
 * Get domain for a source based on profile type
 */
export function getDomain(source: string, profile: ProfileType): Domain | null {
  if (isB2BProfile(profile)) {
    return getB2BDomain(source);
  }
  return getB2CDomain(source);
}

/**
 * Check if two sources are from different domains
 */
export function areCrossDomain(source1: string, source2: string, profile: ProfileType): boolean {
  if (isB2BProfile(profile)) {
    return areB2BSourcesCrossDomain(source1, source2);
  }
  return areB2CSourcesCrossDomain(source1, source2);
}

/**
 * Calculate unexpectedness score based on domain relationship
 *
 * Same domain (review ↔ review): 30-50%
 * Cross domain (SEC ↔ job posting): 80-100%
 */
export function calculateUnexpectednessScore(
  source1: string,
  source2: string,
  profile: ProfileType
): number {
  const domain1 = getDomain(source1, profile);
  const domain2 = getDomain(source2, profile);

  // Unknown domains = treat as cross-domain
  if (!domain1 || !domain2) {
    return 85;
  }

  // Same domain = low unexpectedness
  if (domain1 === domain2) {
    return 35 + Math.random() * 15; // 35-50
  }

  // Cross domain = high unexpectedness
  return 80 + Math.random() * 20; // 80-100
}

/**
 * Get all unique domains from a set of sources
 */
export function getUniqueDomains(sources: string[], profile: ProfileType): Domain[] {
  const domains = new Set<Domain>();

  for (const source of sources) {
    const domain = getDomain(source, profile);
    if (domain) {
      domains.add(domain);
    }
  }

  return Array.from(domains);
}

/**
 * Check if sources span at least 3 different domains (for three-way bonus)
 */
export function hasThreeWayPotential(sources: string[], profile: ProfileType): boolean {
  const domains = getUniqueDomains(sources, profile);
  return domains.length >= 3;
}

export { B2CDomain, B2BDomain };
