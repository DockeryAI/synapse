/**
 * Target Audience Detection Utility
 *
 * Properly identifies the target audience for content generation
 * to avoid generic industry-based audience targeting.
 *
 * Created: 2025-11-11
 */

import type { BusinessProfile as SynapseBusinessProfile } from '@/types/synapseContent.types';
import type { BusinessProfile as DeepBusinessProfile } from '@/types/deepContext.types';

/**
 * Detect the actual target audience from business data
 *
 * CRITICAL: This determines WHO the content is speaking TO, not ABOUT.
 * Example: For a wedding coffee service, the audience is "couples planning weddings",
 * NOT "coffee shop owners".
 */
export function detectTargetAudience(
  business: SynapseBusinessProfile | DeepBusinessProfile
): string {
  // Check if using simplified BusinessProfile with targetAudience field
  if ('targetAudience' in business && business.targetAudience) {
    let audience = business.targetAudience;

    // Clean up comma-separated lists or invalid formats
    if (audience.includes(',')) {
      const parts = audience.split(',').map(s => s.trim());

      if (parts.length > 3) {
        // This looks like a comma-separated list of event types/services, not a target audience
        // Force industry inference instead of using this bad data
        console.warn('[audienceDetection] targetAudience contains comma-separated list (>3 parts), forcing industry inference:', audience.substring(0, 100));
        // Don't return - fall through to industry inference
      } else if (parts.length === 2) {
        // Two parts like "Uptown residents,professionals" - combine with "and"
        audience = `${parts[0]} and ${parts[1]}`;
        console.log('[audienceDetection] Cleaned comma-separated audience:', audience);
        return audience;
      } else if (parts.length === 3) {
        // Three parts - combine with commas and "and"
        audience = `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
        console.log('[audienceDetection] Cleaned 3-part audience:', audience);
        return audience;
      } else {
        return audience;
      }
    } else {
      return audience;
    }
  }

  // Fallback: attempt to infer from industry
  // This is a last resort and should be improved with actual audience data
  const industryToAudience: Record<string, string> = {
    'bar': 'locals looking for a great night out',
    'pub': 'friends and groups looking for a relaxed atmosphere',
    'bar/pub': 'people looking for drinks and good times',
    'nightclub': 'party-goers and groups celebrating',
    'brewery': 'craft beer enthusiasts and groups',
    'wine bar': 'wine lovers and date night crowds',
    'mobile coffee': 'event planners and people hosting special occasions',
    'coffee cart': 'event organizers and hosts',
    'wedding': 'couples planning weddings',
    'event': 'event planners and hosts',
    'coffee shop': 'coffee lovers and local community members',
    'cafe': 'people seeking quality coffee and community spaces',
    'restaurant': 'diners and food enthusiasts',
    'bakery': 'people who love fresh baked goods',
    'retail': 'shoppers looking for quality products',
    'saas': 'business professionals seeking software solutions',
    'consulting': 'business leaders seeking expert guidance',
    'marketing': 'business owners looking to grow their brand',
    'real estate': 'home buyers and property investors',
    'fitness': 'people seeking health and wellness improvements',
    'education': 'students and lifelong learners',
    'healthcare': 'patients seeking quality care',
    'legal': 'clients needing legal services',
    'financial services': 'individuals and businesses managing finances',
    'e-commerce': 'online shoppers',
    'hospitality': 'travelers and guests',
    'cleaning': 'business owners seeking professional cleaning services',
    'janitorial': 'facility managers looking for reliable janitorial services',
    'facility services': 'property managers and business owners maintaining professional spaces'
  };

  const industry = business.industry.toLowerCase();

  // Check for exact match
  if (industryToAudience[industry]) {
    return industryToAudience[industry];
  }

  // Check for partial match
  for (const [key, audience] of Object.entries(industryToAudience)) {
    if (industry.includes(key) || key.includes(industry)) {
      return audience;
    }
  }

  // Generic fallback (should rarely hit this)
  return `people interested in ${business.industry}`;
}

/**
 * Validate evidence array to ensure it contains actual proof points,
 * not search keywords or other artifacts
 */
export function validateEvidence(evidence: string[]): string[] {
  return evidence.filter(item => {
    // Filter out items that look like search keywords
    const isSearchKeyword = item.split(' ').length <= 4 &&
                           !item.includes('.') &&
                           !item.includes('%') &&
                           !item.match(/[A-Z][a-z]/); // No proper capitalization

    // Filter out items that are too short to be meaningful
    const isTooShort = item.length < 15;

    // Keep items that look like actual evidence
    return !isSearchKeyword && !isTooShort;
  });
}

/**
 * Get clean evidence for use in content
 * Returns up to maxItems validated evidence points
 */
export function getCleanEvidence(evidence: string[], maxItems: number = 3): string[] {
  const validated = validateEvidence(evidence);
  return validated.slice(0, maxItems);
}
