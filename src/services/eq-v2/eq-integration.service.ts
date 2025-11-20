/**
 * EQ Integration Service
 *
 * Facade/coordinator for EQ Calculator v2.0 integration across Synapse
 *
 * This is the SINGLE coordination point for parallel development.
 * Other parts of Synapse should import from THIS file only.
 *
 * Created: 2025-11-19
 */

import { eqCalculatorV2 } from './eq-calculator-v2.service';
import { eqLearningEngine } from './learning-engine.service';
import type {
  EQScore,
  EQCalculationInput,
  EQCalculationResult,
  EQAdjustmentContext,
  Platform,
  SeasonalAdjustment,
  PLATFORM_MODIFIERS
} from '@/types/eq-calculator.types';

import { PLATFORM_MODIFIERS as MODIFIERS } from '@/types/eq-calculator.types';

/**
 * Simple interface for most common use case
 */
export interface SimpleEQRequest {
  businessName: string;
  websiteContent: string[];
  specialty?: string;
  industry?: string;
}

/**
 * Platform-adjusted EQ request
 */
export interface PlatformEQRequest extends SimpleEQRequest {
  platform: Platform;
}

/**
 * EQ Integration Service
 * Main entry point for all EQ-related functionality
 */
class EQIntegrationService {
  /**
   * Calculate EQ for a business (most common use case)
   *
   * Example:
   * ```typescript
   * const result = await eqIntegration.calculateEQ({
   *   businessName: "Phoenix Insurance",
   *   websiteContent: [pageContent1, pageContent2],
   *   specialty: "classic cars"
   * });
   * console.log(result.eq_score.overall); // 75
   * ```
   */
  async calculateEQ(request: SimpleEQRequest): Promise<EQCalculationResult> {
    const input: EQCalculationInput = {
      business_name: request.businessName,
      website_content: request.websiteContent,
      specialty: request.specialty,
      industry: request.industry
    };

    const result = await eqCalculatorV2.calculateEQ(input);

    // Record for learning
    if (request.specialty || request.industry) {
      await eqLearningEngine.recordCalculation(
        request.businessName,
        request.specialty || request.industry,
        'unknown',  // URL not provided in simple request
        result.eq_score,
        result.pattern_matches[0]?.matched_pattern
      );
    }

    return result;
  }

  /**
   * Get EQ score only (lightweight)
   *
   * Returns just the score without full breakdown
   */
  async getEQScore(request: SimpleEQRequest): Promise<EQScore> {
    const result = await this.calculateEQ(request);
    return result.eq_score;
  }

  /**
   * Get platform-adjusted EQ
   *
   * Example:
   * ```typescript
   * const linkedInEQ = await eqIntegration.getPlatformAdjustedEQ({
   *   businessName: "Acme Corp",
   *   websiteContent: [content],
   *   platform: "linkedin"
   * });
   * // Returns base EQ - 20 for professional platform
   * ```
   */
  async getPlatformAdjustedEQ(request: PlatformEQRequest): Promise<EQScore> {
    const baseResult = await this.calculateEQ(request);
    const modifier = MODIFIERS[request.platform];

    const adjustedOverall = Math.max(
      0,
      Math.min(100, baseResult.eq_score.overall + modifier)
    );

    return {
      emotional: adjustedOverall,
      rational: 100 - adjustedOverall,
      overall: adjustedOverall,
      confidence: baseResult.eq_score.confidence,
      calculation_method: baseResult.eq_score.calculation_method
    };
  }

  /**
   * Get seasonal adjustment
   *
   * Example:
   * ```typescript
   * const holidayEQ = await eqIntegration.getSeasonalAdjustedEQ({
   *   businessName: "Shop",
   *   websiteContent: [content],
   *   season: "holiday"
   * });
   * // Returns base EQ + 15 for emotional holiday period
   * ```
   */
  async getSeasonalAdjustedEQ(
    request: SimpleEQRequest & { season: SeasonalAdjustment['season'] }
  ): Promise<EQScore> {
    const baseResult = await this.calculateEQ(request);

    const seasonalModifiers = {
      'holiday': 15,
      'tax-season': -10,
      'back-to-school': 5,
      'q4-planning': -15,
      'summer': 10,
      'custom': 0
    };

    const modifier = seasonalModifiers[request.season];
    const adjustedOverall = Math.max(
      0,
      Math.min(100, baseResult.eq_score.overall + modifier)
    );

    return {
      emotional: adjustedOverall,
      rational: 100 - adjustedOverall,
      overall: adjustedOverall,
      confidence: baseResult.eq_score.confidence,
      calculation_method: baseResult.eq_score.calculation_method
    };
  }

  /**
   * Get full adjustment context (platform + seasonal + campaign type)
   *
   * Example for Campaign Generator:
   * ```typescript
   * const context = await eqIntegration.getAdjustmentContext({
   *   businessName: "Acme",
   *   websiteContent: [content],
   *   platform: "instagram",
   *   season: "holiday",
   *   campaignType: "brand-awareness"
   * });
   * // Use context.adjusted_eq for content generation
   * ```
   */
  async getAdjustmentContext(
    request: SimpleEQRequest & {
      platform?: Platform;
      season?: SeasonalAdjustment['season'];
      campaignType?: 'brand-awareness' | 'direct-response' | 'nurture' | 'retention';
    }
  ): Promise<EQAdjustmentContext> {
    const baseResult = await this.calculateEQ(request);
    let adjustedEQ = baseResult.eq_score.overall;
    const adjustmentsApplied: string[] = [];

    // Platform adjustment
    if (request.platform) {
      const platformModifier = MODIFIERS[request.platform];
      adjustedEQ += platformModifier;
      adjustmentsApplied.push(`${request.platform}: ${platformModifier > 0 ? '+' : ''}${platformModifier}`);
    }

    // Seasonal adjustment
    if (request.season) {
      const seasonalModifiers = {
        'holiday': 15,
        'tax-season': -10,
        'back-to-school': 5,
        'q4-planning': -15,
        'summer': 10,
        'custom': 0
      };
      const seasonalModifier = seasonalModifiers[request.season];
      adjustedEQ += seasonalModifier;
      adjustmentsApplied.push(`${request.season}: ${seasonalModifier > 0 ? '+' : ''}${seasonalModifier}`);
    }

    // Campaign type adjustment
    if (request.campaignType) {
      const campaignModifiers = {
        'brand-awareness': 10,
        'direct-response': -10,
        'nurture': 5,
        'retention': 0
      };
      const campaignModifier = campaignModifiers[request.campaignType];
      adjustedEQ += campaignModifier;
      adjustmentsApplied.push(`${request.campaignType}: ${campaignModifier > 0 ? '+' : ''}${campaignModifier}`);
    }

    // Clamp to 0-100
    adjustedEQ = Math.max(0, Math.min(100, Math.round(adjustedEQ)));

    const adjustedScore: EQScore = {
      emotional: adjustedEQ,
      rational: 100 - adjustedEQ,
      overall: adjustedEQ,
      confidence: baseResult.eq_score.confidence,
      calculation_method: baseResult.eq_score.calculation_method
    };

    return {
      base_eq: baseResult.eq_score,
      platform: request.platform,
      seasonal: request.season ? {
        season: request.season,
        eq_modifier: 0,  // Calculated above
        reason: `${request.season} adjustment`
      } : undefined,
      campaign_type: request.campaignType,
      adjusted_eq: adjustedScore,
      adjustments_applied: adjustmentsApplied
    };
  }

  /**
   * Get tone recommendation based on EQ
   *
   * Returns simple guidance for content generation
   */
  getToneGuidance(eqScore: number): {
    primary_tone: string;
    secondary_tone: string;
    messaging_focus: string;
    cta_style: string;
  } {
    if (eqScore >= 70) {
      return {
        primary_tone: 'emotional',
        secondary_tone: 'storytelling',
        messaging_focus: 'transformation and feelings',
        cta_style: 'Begin Your Journey / Join Our Family'
      };
    } else if (eqScore >= 55) {
      return {
        primary_tone: 'balanced',
        secondary_tone: 'benefit-driven',
        messaging_focus: 'outcomes with emotional resonance',
        cta_style: 'Discover How / See Results'
      };
    } else if (eqScore >= 40) {
      return {
        primary_tone: 'professional',
        secondary_tone: 'results-focused',
        messaging_focus: 'measurable benefits',
        cta_style: 'Learn More / Get Started'
      };
    } else {
      return {
        primary_tone: 'rational',
        secondary_tone: 'data-driven',
        messaging_focus: 'ROI and efficiency metrics',
        cta_style: 'Get Quote / Calculate Savings'
      };
    }
  }

  /**
   * Get learning statistics
   */
  async getLearningStats() {
    return await eqLearningEngine.getStatistics();
  }

  /**
   * Get all learned specialty mappings
   */
  async getLearnedSpecialties() {
    return await eqLearningEngine.getAllSpecialtyMappings();
  }
}

// Export singleton instance
export const eqIntegration = new EQIntegrationService();
export { EQIntegrationService };

// Re-export types for convenience
export type { EQScore, EQCalculationResult, Platform };
