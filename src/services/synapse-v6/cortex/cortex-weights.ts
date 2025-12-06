/**
 * Cortex Weights by Profile Type
 *
 * Different profile types emphasize different psychology principles.
 * B2C profiles: High scarcity, curiosity gap
 * B2B profiles: High career safety, consensus enabling
 */

import { type ProfileType } from '../domains';

export interface CortexWeights {
  // Original 9 (B2C-optimized)
  curiosityGap: number;
  narrativeTransportation: number;
  socialProof: number;
  authority: number;
  cognitiveDissonance: number;
  patternInterrupt: number;
  scarcity: number;
  reciprocity: number;
  lossAversion: number;

  // B2B additions
  careerSafety: number;
  consensusEnabling: number;
  statusQuoRisk: number;
  personalValue: number;
  riskMitigation: number;
}

/**
 * Default weights per profile type (0-100)
 */
export const CORTEX_WEIGHTS: Record<ProfileType, CortexWeights> = {
  'local-service-b2c': {
    curiosityGap: 90,
    narrativeTransportation: 70,
    socialProof: 80,
    authority: 50,
    cognitiveDissonance: 60,
    patternInterrupt: 85,
    scarcity: 90,
    reciprocity: 70,
    lossAversion: 85,
    // B2B principles low for B2C
    careerSafety: 10,
    consensusEnabling: 5,
    statusQuoRisk: 30,
    personalValue: 40,
    riskMitigation: 30,
  },
  'local-service-b2b': {
    curiosityGap: 70,
    narrativeTransportation: 60,
    socialProof: 85,
    authority: 70,
    cognitiveDissonance: 50,
    patternInterrupt: 50,
    scarcity: 60,
    reciprocity: 75,
    lossAversion: 80,
    // B2B principles moderate
    careerSafety: 60,
    consensusEnabling: 50,
    statusQuoRisk: 65,
    personalValue: 60,
    riskMitigation: 65,
  },
  'regional-b2b-agency': {
    curiosityGap: 60,
    narrativeTransportation: 65,
    socialProof: 85,
    authority: 80,
    cognitiveDissonance: 45,
    patternInterrupt: 40,
    scarcity: 40,
    reciprocity: 80,
    lossAversion: 85,
    // B2B principles higher
    careerSafety: 75,
    consensusEnabling: 70,
    statusQuoRisk: 75,
    personalValue: 70,
    riskMitigation: 75,
  },
  'regional-retail-b2c': {
    curiosityGap: 85,
    narrativeTransportation: 70,
    socialProof: 80,
    authority: 55,
    cognitiveDissonance: 55,
    patternInterrupt: 80,
    scarcity: 85,
    reciprocity: 70,
    lossAversion: 85,
    // B2B principles low
    careerSafety: 15,
    consensusEnabling: 10,
    statusQuoRisk: 40,
    personalValue: 50,
    riskMitigation: 35,
  },
  'national-saas-b2b': {
    curiosityGap: 50,
    narrativeTransportation: 70,
    socialProof: 95,
    authority: 90,
    cognitiveDissonance: 40,
    patternInterrupt: 30,
    scarcity: 20,
    reciprocity: 85,
    lossAversion: 90,
    // B2B principles high
    careerSafety: 95,
    consensusEnabling: 90,
    statusQuoRisk: 90,
    personalValue: 85,
    riskMitigation: 90,
  },
  'national-product-b2c': {
    curiosityGap: 85,
    narrativeTransportation: 80,
    socialProof: 85,
    authority: 65,
    cognitiveDissonance: 60,
    patternInterrupt: 75,
    scarcity: 80,
    reciprocity: 75,
    lossAversion: 85,
    // B2B principles low
    careerSafety: 10,
    consensusEnabling: 5,
    statusQuoRisk: 35,
    personalValue: 45,
    riskMitigation: 30,
  },
  'global-saas-b2b': {
    curiosityGap: 40,
    narrativeTransportation: 65,
    socialProof: 95,
    authority: 95,
    cognitiveDissonance: 35,
    patternInterrupt: 20,
    scarcity: 10,
    reciprocity: 85,
    lossAversion: 90,
    // B2B principles highest
    careerSafety: 98,
    consensusEnabling: 95,
    statusQuoRisk: 85,
    personalValue: 80,
    riskMitigation: 95,
  },
};

/**
 * Get weights for a profile type
 */
export function getCortexWeights(profile: ProfileType): CortexWeights {
  return CORTEX_WEIGHTS[profile];
}

/**
 * Get top N principles for a profile
 */
export function getTopPrinciples(
  profile: ProfileType,
  limit: number = 5
): Array<{ principle: string; weight: number }> {
  const weights = CORTEX_WEIGHTS[profile];
  const entries = Object.entries(weights) as [keyof CortexWeights, number][];

  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([principle, weight]) => ({ principle, weight }));
}

/**
 * Get B2B principle scores for a profile
 */
export function getB2BPrincipleScores(profile: ProfileType): {
  careerSafety: number;
  consensusEnabling: number;
  statusQuoRisk: number;
  personalValue: number;
  riskMitigation: number;
} {
  const weights = CORTEX_WEIGHTS[profile];
  return {
    careerSafety: weights.careerSafety,
    consensusEnabling: weights.consensusEnabling,
    statusQuoRisk: weights.statusQuoRisk,
    personalValue: weights.personalValue,
    riskMitigation: weights.riskMitigation,
  };
}

/**
 * Calculate average B2B score (to determine B2B-ness of profile)
 */
export function getB2BIntensity(profile: ProfileType): number {
  const scores = getB2BPrincipleScores(profile);
  const values = Object.values(scores);
  return values.reduce((a, b) => a + b, 0) / values.length;
}
