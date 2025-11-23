/**
 * Segment EQ Optimizer Service
 * Optimizes emotional triggers for specific customer segments
 */

import type {
  SegmentEQMapping,
  SegmentEQOptimizationSettings,
  CustomerPersona,
  SegmentPerformanceData,
} from '@/types/v2';
import type { EmotionalTrigger } from '@/types/v2';

export interface EQAdjustmentRecommendation {
  trigger: EmotionalTrigger;
  currentWeight: number;
  recommendedWeight: number;
  reason: string;
  expectedImpact: number; // percentage improvement
  confidence: number;
}

export interface EQTestVariation {
  variationId: string;
  trigger: EmotionalTrigger;
  intensityModifier: number;
  targetPersonaId: string;
  testStatus: 'pending' | 'running' | 'completed';
  results?: {
    engagementRate: number;
    conversionRate: number;
    sampleSize: number;
  };
}

export interface PlatformEQAdjustment {
  platform: string;
  baseModifier: number;
  triggerAdjustments: Partial<Record<EmotionalTrigger, number>>;
  rationale: string;
}

export class SegmentEQOptimizerService {
  private eqMappings: Map<string, SegmentEQMapping> = new Map();
  private settings: Map<string, SegmentEQOptimizationSettings> = new Map();
  private testVariations: Map<string, EQTestVariation[]> = new Map();

  // Default trigger weights by decision-making style
  private readonly defaultWeightsByStyle: Record<
    string,
    Partial<Record<EmotionalTrigger, number>>
  > = {
    analytical: {
      trust: 90,
      authority: 85,
      security: 80,
      efficiency: 75,
      fear: 40,
      urgency: 50,
    },
    spontaneous: {
      urgency: 90,
      opportunity: 85,
      curiosity: 80,
      excitement: 75,
      fear: 70,
      trust: 60,
    },
    collaborative: {
      trust: 90,
      hope: 85,
      belonging: 80,
      authority: 70,
      safety: 75,
      innovation: 65,
    },
    'research-heavy': {
      authority: 95,
      trust: 90,
      innovation: 85,
      clarity: 90,
      efficiency: 75,
      urgency: 40,
    },
  };

  // Platform-specific adjustments
  private readonly platformAdjustments: Record<string, PlatformEQAdjustment> = {
    linkedin: {
      platform: 'linkedin',
      baseModifier: -10, // More professional/rational
      triggerAdjustments: {
        authority: 15,
        trust: 10,
        innovation: 10,
        fear: -20,
        urgency: -15,
      },
      rationale: 'Professional audience prefers authority and innovation',
    },
    instagram: {
      platform: 'instagram',
      baseModifier: 15, // More emotional
      triggerAdjustments: {
        hope: 20,
        inspiration: 25,
        curiosity: 15,
        fear: -10,
        authority: -15,
      },
      rationale: 'Visual platform favors aspirational and inspirational content',
    },
    facebook: {
      platform: 'facebook',
      baseModifier: 5, // Balanced
      triggerAdjustments: {
        trust: 10,
        hope: 10,
        belonging: 15, // Community = belonging
        urgency: 5,
      },
      rationale: 'Community-focused platform favors trust and belonging',
    },
    twitter: {
      platform: 'twitter',
      baseModifier: 10, // More urgent/reactive
      triggerAdjustments: {
        urgency: 20,
        curiosity: 15,
        innovation: 10,
        fear: 10,
        authority: 5,
      },
      rationale: 'Fast-paced platform favors urgency and curiosity',
    },
  };

  /**
   * Create or update EQ mapping for a persona
   */
  createEQMapping(
    personaId: string,
    persona: CustomerPersona,
    performanceData?: SegmentPerformanceData
  ): SegmentEQMapping {
    // Start with default weights based on decision-making style
    const baseWeights = this.getDefaultWeights(persona);

    // Adjust based on historical performance if available
    const performanceAdjusted = performanceData
      ? this.adjustWeightsFromPerformance(baseWeights, performanceData)
      : baseWeights;

    // Create mapping
    const mapping: SegmentEQMapping = {
      personaId,
      triggerWeights: performanceAdjusted,
      intensityModifier: this.calculateIntensityModifier(persona),
      platformAdjustments: this.getPlatformAdjustments(),
      historicalPerformance: performanceData?.metrics.bestPerformingTrigger
        ? [
            {
              trigger: performanceData.metrics.bestPerformingTrigger,
              avgEngagement: performanceData.metrics.avgEngagementRate,
              avgConversion: performanceData.metrics.avgConversionRate,
              sampleSize: performanceData.metrics.totalPieces,
            },
          ]
        : [],
    };

    this.eqMappings.set(personaId, mapping);
    return mapping;
  }

  /**
   * Get EQ mapping for a persona
   */
  getEQMapping(personaId: string): SegmentEQMapping | null {
    return this.eqMappings.get(personaId) || null;
  }

  /**
   * Update EQ trigger weight for a persona
   */
  updateTriggerWeight(
    personaId: string,
    trigger: EmotionalTrigger,
    weight: number
  ): SegmentEQMapping | null {
    const mapping = this.eqMappings.get(personaId);
    if (!mapping) return null;

    mapping.triggerWeights[trigger] = Math.max(0, Math.min(100, weight));
    this.eqMappings.set(personaId, mapping);

    return mapping;
  }

  /**
   * Update intensity modifier
   */
  updateIntensityModifier(personaId: string, modifier: number): SegmentEQMapping | null {
    const mapping = this.eqMappings.get(personaId);
    if (!mapping) return null;

    mapping.intensityModifier = Math.max(0.5, Math.min(2.0, modifier));
    this.eqMappings.set(personaId, mapping);

    return mapping;
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(
    personaId: string,
    performanceData?: SegmentPerformanceData
  ): EQAdjustmentRecommendation[] {
    const mapping = this.eqMappings.get(personaId);
    if (!mapping || !performanceData) {
      return [];
    }

    const recommendations: EQAdjustmentRecommendation[] = [];

    // Find underperforming triggers
    if (performanceData.metrics.worstPerformingTrigger) {
      const worstTrigger = performanceData.metrics.worstPerformingTrigger;
      const currentWeight = mapping.triggerWeights[worstTrigger] || 50;

      recommendations.push({
        trigger: worstTrigger,
        currentWeight,
        recommendedWeight: Math.max(currentWeight - 15, 20),
        reason: `Underperforming - reduce usage of ${worstTrigger}`,
        expectedImpact: 8,
        confidence: 75,
      });
    }

    // Find high-performing triggers to increase
    if (performanceData.metrics.bestPerformingTrigger) {
      const bestTrigger = performanceData.metrics.bestPerformingTrigger;
      const currentWeight = mapping.triggerWeights[bestTrigger] || 50;

      if (currentWeight < 85) {
        recommendations.push({
          trigger: bestTrigger,
          currentWeight,
          recommendedWeight: Math.min(currentWeight + 15, 95),
          reason: `High performer - increase usage of ${bestTrigger}`,
          expectedImpact: 12,
          confidence: 85,
        });
      }
    }

    // Platform-specific recommendations
    const platformRecs = this.getPlatformRecommendations(mapping, performanceData);
    recommendations.push(...platformRecs);

    return recommendations.sort((a, b) => b.expectedImpact - a.expectedImpact);
  }

  /**
   * Apply recommended adjustments
   */
  applyRecommendations(
    personaId: string,
    recommendations: EQAdjustmentRecommendation[]
  ): SegmentEQMapping | null {
    const mapping = this.eqMappings.get(personaId);
    if (!mapping) return null;

    for (const rec of recommendations) {
      mapping.triggerWeights[rec.trigger] = rec.recommendedWeight;
    }

    this.eqMappings.set(personaId, mapping);
    return mapping;
  }

  /**
   * Create A/B test variations
   */
  createTestVariations(
    personaId: string,
    trigger: EmotionalTrigger,
    variationCount: number = 3
  ): EQTestVariation[] {
    const mapping = this.eqMappings.get(personaId);
    if (!mapping) return [];

    const baseIntensity = mapping.intensityModifier;
    const variations: EQTestVariation[] = [];

    const intensityLevels = [
      baseIntensity * 0.7, // Subtle
      baseIntensity, // Current
      baseIntensity * 1.3, // Strong
    ];

    for (let i = 0; i < Math.min(variationCount, intensityLevels.length); i++) {
      variations.push({
        variationId: `${personaId}-${trigger}-v${i + 1}`,
        trigger,
        intensityModifier: intensityLevels[i],
        targetPersonaId: personaId,
        testStatus: 'pending',
      });
    }

    this.testVariations.set(personaId, variations);
    return variations;
  }

  /**
   * Get test variations for a persona
   */
  getTestVariations(personaId: string): EQTestVariation[] {
    return this.testVariations.get(personaId) || [];
  }

  /**
   * Calculate optimal trigger for specific context
   */
  getOptimalTrigger(
    personaId: string,
    context: {
      platform?: string;
      contentType?: string;
      purchaseStage?: string;
    }
  ): EmotionalTrigger | null {
    const mapping = this.eqMappings.get(personaId);
    if (!mapping) return null;

    let weights = { ...mapping.triggerWeights };

    // Apply platform adjustments
    if (context.platform && mapping.platformAdjustments) {
      const platformAdj = mapping.platformAdjustments[context.platform];
      if (platformAdj) {
        Object.keys(platformAdj).forEach((trigger) => {
          const t = trigger as EmotionalTrigger;
          weights[t] = (weights[t] || 50) + (platformAdj[t] || 0);
        });
      }
    }

    // Find trigger with highest weight
    let maxWeight = 0;
    let optimalTrigger: EmotionalTrigger | null = null;

    for (const [trigger, weight] of Object.entries(weights)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        optimalTrigger = trigger as EmotionalTrigger;
      }
    }

    return optimalTrigger;
  }

  // Private helper methods

  private getDefaultWeights(persona: CustomerPersona): Record<EmotionalTrigger, number> {
    const style = persona.behavioralTraits.decisionMakingStyle;
    const baseWeights = this.defaultWeightsByStyle[style] || {};

    // Fill in missing triggers with default value
    const allTriggers: EmotionalTrigger[] = [
      'fear',
      'trust',
      'security',
      'efficiency',
      'growth',
      'innovation',
      'safety',
      'hope',
      'opportunity',
      'urgency',
      'curiosity',
      'authority',
    ];

    const weights: Record<string, number> = {};
    for (const trigger of allTriggers) {
      weights[trigger] = baseWeights[trigger] || 50;
    }

    return weights as Record<EmotionalTrigger, number>;
  }

  private adjustWeightsFromPerformance(
    baseWeights: Record<EmotionalTrigger, number>,
    performanceData: SegmentPerformanceData
  ): Record<EmotionalTrigger, number> {
    const adjusted = { ...baseWeights };

    // Increase weight for best performing trigger
    if (performanceData.metrics.bestPerformingTrigger) {
      const trigger = performanceData.metrics.bestPerformingTrigger;
      adjusted[trigger] = Math.min((adjusted[trigger] || 50) + 20, 95);
    }

    // Decrease weight for worst performing trigger
    if (performanceData.metrics.worstPerformingTrigger) {
      const trigger = performanceData.metrics.worstPerformingTrigger;
      adjusted[trigger] = Math.max((adjusted[trigger] || 50) - 15, 20);
    }

    return adjusted;
  }

  private calculateIntensityModifier(persona: CustomerPersona): number {
    // Base modifier on decision-making style
    const styleModifiers: Record<string, number> = {
      analytical: 0.8, // More subtle
      spontaneous: 1.3, // More intense
      collaborative: 1.0, // Balanced
      'research-heavy': 0.7, // Very subtle
    };

    return styleModifiers[persona.behavioralTraits.decisionMakingStyle] || 1.0;
  }

  private getPlatformAdjustments(): SegmentEQMapping['platformAdjustments'] {
    return {
      linkedin: this.platformAdjustments.linkedin.triggerAdjustments,
      instagram: this.platformAdjustments.instagram.triggerAdjustments,
      facebook: this.platformAdjustments.facebook.triggerAdjustments,
      twitter: this.platformAdjustments.twitter.triggerAdjustments,
    };
  }

  private getPlatformRecommendations(
    mapping: SegmentEQMapping,
    performanceData: SegmentPerformanceData
  ): EQAdjustmentRecommendation[] {
    const recommendations: EQAdjustmentRecommendation[] = [];

    // Analyze platform-specific performance
    if (performanceData.platformBreakdown) {
      const platforms = performanceData.platformBreakdown;
      const avgEngagement =
        platforms.reduce((sum, p) => sum + p.engagementRate, 0) / platforms.length;

      for (const platform of platforms) {
        if (platform.engagementRate < avgEngagement * 0.8) {
          // Platform underperforming - recommend platform-specific adjustments
          const adjustment = this.platformAdjustments[platform.platform.toLowerCase()];
          if (adjustment) {
            // Find trigger to adjust for this platform
            const topAdjustment = Object.entries(adjustment.triggerAdjustments).sort(
              ([, a], [, b]) => Math.abs(b) - Math.abs(a)
            )[0];

            if (topAdjustment) {
              const [trigger, adj] = topAdjustment;
              const currentWeight = mapping.triggerWeights[trigger as EmotionalTrigger] || 50;

              recommendations.push({
                trigger: trigger as EmotionalTrigger,
                currentWeight,
                recommendedWeight: Math.max(20, Math.min(95, currentWeight + adj)),
                reason: `Optimize for ${platform.platform}: ${adjustment.rationale}`,
                expectedImpact: 10,
                confidence: 70,
              });
            }
          }
        }
      }
    }

    return recommendations;
  }
}

// Singleton instance
export const segmentEQOptimizerService = new SegmentEQOptimizerService();
