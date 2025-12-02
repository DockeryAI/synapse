/**
 * V5 EQ Integration Service
 *
 * Maps EQ (Emotional Quotient) scores to customer categories.
 * The 6 customer categories drive template selection and scoring weights.
 *
 * Created: 2025-12-01
 */

import type {
  CustomerCategory,
  EQProfile,
  IEQIntegrationService,
  CUSTOMER_CATEGORY_MAPPINGS,
} from './types';

// ============================================================================
// EQ SCORE THRESHOLDS
// ============================================================================

/**
 * EQ score ranges for classification
 * Based on emotional vs rational balance
 */
const EQ_CLASSIFICATIONS = {
  'highly-emotional': { min: 80, max: 100 },
  'emotional': { min: 60, max: 79 },
  'balanced': { min: 40, max: 59 },
  'rational': { min: 20, max: 39 },
  'highly-rational': { min: 0, max: 19 },
} as const;

/**
 * Customer category mapping based on EQ analysis
 *
 * The logic:
 * - High emotional (80-100): Pain-driven or Aspiration-driven
 * - Moderate emotional (60-79): Community-driven or Trust-seeking
 * - Balanced (40-59): Value-driven (logic + emotion)
 * - Rational (0-39): Convenience-driven
 */
const CATEGORY_EQ_MAPPING: Record<string, { min: number; max: number; primary: CustomerCategory; secondary?: CustomerCategory }> = {
  high_pain: { min: 85, max: 100, primary: 'pain-driven' },
  high_aspiration: { min: 75, max: 84, primary: 'aspiration-driven' },
  emotional_community: { min: 65, max: 74, primary: 'community-driven', secondary: 'trust-seeking' },
  emotional_trust: { min: 55, max: 64, primary: 'trust-seeking', secondary: 'community-driven' },
  balanced_value: { min: 40, max: 54, primary: 'value-driven' },
  rational_convenience: { min: 0, max: 39, primary: 'convenience-driven' },
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Get full EQ profile from score
 */
export function getProfile(eqScore: number, _industrySlug?: string): EQProfile {
  // Clamp score to 0-100
  const score = Math.max(0, Math.min(100, eqScore));

  // Calculate emotional vs rational split
  const emotionalResonance = score;
  const identityAlignment = Math.min(100, score * 1.1); // Slightly correlated
  const urgencySignals = score > 70 ? score - 20 : score * 0.8; // High emotional = high urgency

  // Determine classification
  let classification: EQProfile['classification'] = 'balanced';
  for (const [key, range] of Object.entries(EQ_CLASSIFICATIONS)) {
    if (score >= range.min && score <= range.max) {
      classification = key as EQProfile['classification'];
      break;
    }
  }

  // Map to customer category
  const customerCategory = mapToCustomerCategory(score);

  // Determine emotional temperature
  const emotionalTemperature = getEmotionalTemperature(score);

  return {
    score,
    emotionalResonance,
    identityAlignment,
    urgencySignals,
    classification,
    customerCategory,
    emotionalTemperature,
  };
}

/**
 * Map EQ score to one of 6 customer categories
 */
export function mapToCustomerCategory(eqScore: number): CustomerCategory {
  const score = Math.max(0, Math.min(100, eqScore));

  // Find matching range
  for (const [, range] of Object.entries(CATEGORY_EQ_MAPPING)) {
    if (score >= range.min && score <= range.max) {
      return range.primary;
    }
  }

  // Default fallback
  return 'value-driven';
}

/**
 * Get emotional temperature for content tone
 */
export function getEmotionalTemperature(eqScore: number): EQProfile['emotionalTemperature'] {
  const score = Math.max(0, Math.min(100, eqScore));

  if (score >= 75) return 'hot';
  if (score >= 55) return 'warm';
  if (score >= 35) return 'neutral';
  return 'cool';
}

/**
 * Get content type distribution based on customer category
 */
export function getContentDistribution(category: CustomerCategory): { promotional: number; educational: number; community: number } {
  switch (category) {
    case 'pain-driven':
      // More promotional - they want solutions NOW
      return { promotional: 50, educational: 30, community: 20 };

    case 'aspiration-driven':
      // Mix of promotional (transformation stories) and community (belonging)
      return { promotional: 40, educational: 30, community: 30 };

    case 'trust-seeking':
      // Heavy on educational content and community proof
      return { promotional: 25, educational: 45, community: 30 };

    case 'convenience-driven':
      // Educational how-tos, easy promotional CTAs
      return { promotional: 35, educational: 50, community: 15 };

    case 'value-driven':
      // Balanced approach
      return { promotional: 40, educational: 40, community: 20 };

    case 'community-driven':
      // Community-focused with engagement
      return { promotional: 25, educational: 30, community: 45 };

    default:
      return { promotional: 40, educational: 35, community: 25 };
  }
}

/**
 * Get AI temperature setting based on emotional profile
 * Higher emotional = slightly higher AI creativity
 */
export function getAITemperature(eqProfile: EQProfile): number {
  // Base temperature is 0.7 (from V1)
  // Adjust slightly based on emotional temperature
  switch (eqProfile.emotionalTemperature) {
    case 'hot':
      return 0.75; // Slightly more creative for emotional content
    case 'warm':
      return 0.7;  // Standard
    case 'neutral':
      return 0.65; // Slightly more controlled
    case 'cool':
      return 0.6;  // More precise for rational content
    default:
      return 0.7;
  }
}

/**
 * Get urgency level for content based on EQ
 */
export function getUrgencyLevel(eqProfile: EQProfile): 'low' | 'medium' | 'high' {
  if (eqProfile.urgencySignals >= 70) return 'high';
  if (eqProfile.urgencySignals >= 40) return 'medium';
  return 'low';
}

/**
 * Get template psychology tags that should be prioritized
 */
export function getPriorityTriggers(category: CustomerCategory): string[] {
  switch (category) {
    case 'pain-driven':
      return ['urgency', 'fear', 'relief', 'solution'];
    case 'aspiration-driven':
      return ['aspiration', 'identity', 'transformation', 'belonging'];
    case 'trust-seeking':
      return ['credibility', 'proof', 'authority', 'safety'];
    case 'convenience-driven':
      return ['simplicity', 'speed', 'ease', 'actionability'];
    case 'value-driven':
      return ['logic', 'proof', 'value', 'comparison'];
    case 'community-driven':
      return ['belonging', 'connection', 'identity', 'relatability'];
    default:
      return ['value', 'proof', 'trust'];
  }
}

/**
 * Create EQ profile from manual input (for testing)
 */
export function createFromManual(input: {
  emotionalResonance: number;
  identityAlignment: number;
  urgencySignals: number;
}): EQProfile {
  // Calculate overall score as weighted average
  const overall = Math.round(
    (input.emotionalResonance * 0.4) +
    (input.identityAlignment * 0.35) +
    (input.urgencySignals * 0.25)
  );

  return getProfile(overall);
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const eqIntegrationService: IEQIntegrationService = {
  getProfile,
  mapToCustomerCategory,
  getEmotionalTemperature,
};

export default eqIntegrationService;
