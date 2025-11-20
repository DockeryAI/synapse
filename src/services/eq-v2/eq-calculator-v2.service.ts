/**
 * EQ Calculator v2.0 - Main Service
 *
 * Three-layer emotional intelligence calculation:
 * Layer 1: Specialty Context (50% weight) - Uses existing specialty detector
 * Layer 2: Pattern Recognition (35% weight) - Detects signals
 * Layer 3: Content Analysis (15% weight) - Keyword density
 *
 * Created: 2025-11-19
 */

import type {
  EQScore,
  EQBreakdown,
  EQCalculationInput,
  EQCalculationResult,
  SpecialtyContext,
  LayerContribution,
  EQRecommendation,
  PatternMatch
} from '@/types/eq-calculator.types';

import { EQ_WEIGHTS } from '@/types/eq-calculator.types';
import { patternRecognitionService } from './pattern-recognition.service';

// Read-only import of existing specialty detection (NO MODIFICATIONS)
import type { SpecialtyDetection } from '@/services/specialty-detection.service';

/**
 * Known specialty EQ baselines
 * These are learned from actual businesses - will be moved to database
 */
const KNOWN_SPECIALTY_BASELINES: Record<string, number> = {
  // Passion products (high EQ 70-85)
  'classic cars': 75,
  'vintage cars': 75,
  'exotic cars': 72,
  'luxury cars': 70,
  'vintage motorcycles': 73,
  'classic motorcycles': 75,
  'collectible coins': 78,
  'fine art': 80,
  'antiques': 78,
  'rare books': 77,
  'wine collecting': 76,
  'luxury watches': 72,
  'jewelry': 68,
  'luxury real estate': 70,
  'wedding photography': 75,
  'event planning': 68,
  'interior design': 70,
  'luxury travel': 72,

  // Community-driven (medium-high EQ 55-70)
  'fitness coaching': 65,
  'yoga studio': 68,
  'martial arts': 67,
  'craft brewery': 62,
  'local coffee shop': 60,
  'boutique retail': 63,
  'pet services': 65,

  // Professional services (medium EQ 35-55)
  'marketing agency': 45,
  'consulting': 42,
  'accounting': 35,
  'legal services': 38,
  'financial planning': 40,
  'business coaching': 50,
  'real estate': 45,

  // B2B/Enterprise (low EQ 20-40)
  'enterprise software': 25,
  'saas': 30,
  'b2b software': 28,
  'it services': 32,
  'managed services': 30,
  'data analytics': 28,
  'cloud services': 25,
  'cybersecurity': 27,

  // Commodity/Utility (very low EQ 15-30)
  'hvac repair': 22,
  'plumbing': 20,
  'electrical services': 22,
  'auto repair': 25,
  'tax preparation': 18,
  'bookkeeping': 20
};

/**
 * Industry-level EQ baselines (fallback when specialty unknown)
 */
const INDUSTRY_BASELINES: Record<string, number> = {
  'automotive': 40,
  'retail': 50,
  'professional services': 40,
  'healthcare': 45,
  'technology': 30,
  'finance': 35,
  'real estate': 45,
  'hospitality': 60,
  'education': 55,
  'construction': 35,
  'manufacturing': 30,
  'agriculture': 40,
  'arts': 70,
  'entertainment': 65,
  'food and beverage': 55
};

/**
 * EQ Calculator v2 Service
 */
class EQCalculatorV2Service {
  /**
   * Calculate EQ score for a business
   * Main entry point
   */
  async calculateEQ(input: EQCalculationInput): Promise<EQCalculationResult> {
    const calculationId = `eq-calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('[EQCalculatorV2] Starting calculation:', {
      businessName: input.business_name,
      contentPieces: input.website_content.length,
      hasSpecialty: !!input.specialty,
      calculationId
    });

    try {
      // LAYER 1: Specialty Context (if available)
      const specialtyContext = await this.getSpecialtyContext(
        input.specialty,
        input.industry
      );

      // LAYER 2: Pattern Recognition
      const detectedSignals = patternRecognitionService.analyzeContent(
        input.website_content,
        input.website_urls
      );
      const patternEQ = patternRecognitionService.calculateEQFromSignals(detectedSignals);

      // LAYER 3: Content Analysis
      const contentAnalysis = patternRecognitionService.performContentAnalysis(
        input.website_content
      );
      const contentEQ = this.calculateContentEQ(contentAnalysis);

      // Combine layers with weights
      const { finalEQ, breakdown } = this.combineLayers(
        specialtyContext,
        patternEQ,
        contentEQ
      );

      // Generate pattern matches (for learning)
      const patternSignature = patternRecognitionService.generatePatternSignature(
        input.website_content,
        detectedSignals,
        finalEQ.overall
      );
      const patternMatches: PatternMatch[] = [{
        matched_pattern: patternSignature,
        similarity_score: 100,  // Self-match
        eq_estimate: finalEQ.overall
      }];

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        finalEQ,
        breakdown,
        specialtyContext
      );

      const result: EQCalculationResult = {
        eq_score: finalEQ,
        breakdown,
        specialty_context: specialtyContext,
        pattern_matches: patternMatches,
        content_analysis: contentAnalysis,
        recommendations,
        cached: false,
        calculation_id: calculationId
      };

      console.log('[EQCalculatorV2] Calculation complete:', {
        overallEQ: finalEQ.overall,
        emotional: finalEQ.emotional,
        rational: finalEQ.rational,
        confidence: finalEQ.confidence,
        method: finalEQ.calculation_method,
        calculationId
      });

      return result;

    } catch (error) {
      console.error('[EQCalculatorV2] Calculation failed:', error);

      // Return fallback result
      return this.createFallbackResult(calculationId, input.industry);
    }
  }

  /**
   * Get specialty context (Layer 1)
   */
  private async getSpecialtyContext(
    specialty?: string,
    industry?: string
  ): Promise<SpecialtyContext | undefined> {
    if (!specialty && !industry) {
      return undefined;
    }

    const searchTerm = specialty || industry || '';
    const lowerTerm = searchTerm.toLowerCase();

    // Check known specialty baselines
    const knownBaseEQ = KNOWN_SPECIALTY_BASELINES[lowerTerm];
    if (knownBaseEQ) {
      return {
        specialty: searchTerm,
        base_eq: knownBaseEQ,
        is_known: true,
        is_passion_product: knownBaseEQ >= 70,
        confidence: 90
      };
    }

    // Check for partial matches (e.g., "luxury" anything)
    const partialMatch = Object.keys(KNOWN_SPECIALTY_BASELINES).find(key =>
      lowerTerm.includes(key) || key.includes(lowerTerm)
    );
    if (partialMatch) {
      return {
        specialty: searchTerm,
        base_eq: KNOWN_SPECIALTY_BASELINES[partialMatch],
        is_known: false,
        is_passion_product: KNOWN_SPECIALTY_BASELINES[partialMatch] >= 70,
        confidence: 70,
        similar_specialties: [partialMatch]
      };
    }

    // Fallback to industry baseline
    const industryBaseEQ = industry ? INDUSTRY_BASELINES[industry.toLowerCase()] : undefined;
    if (industryBaseEQ) {
      return {
        specialty: searchTerm,
        base_eq: industryBaseEQ,
        is_known: false,
        is_passion_product: false,
        confidence: 50
      };
    }

    // Unknown - return undefined (will use pattern-based calculation)
    return undefined;
  }

  /**
   * Calculate EQ from content analysis (Layer 3)
   */
  private calculateContentEQ(analysis: any): number {
    const { emotional_density, rational_density } = analysis;

    // Start at 50
    let eq = 50;

    // Adjust based on density ratio
    const totalDensity = emotional_density + rational_density;
    if (totalDensity > 0) {
      const emotionalRatio = emotional_density / totalDensity;
      eq += (emotionalRatio - 0.5) * 50;  // -25 to +25
    }

    return Math.max(0, Math.min(100, Math.round(eq)));
  }

  /**
   * Combine all three layers with weights
   */
  private combineLayers(
    specialtyContext: SpecialtyContext | undefined,
    patternEQ: number,
    contentEQ: number
  ): { finalEQ: EQScore; breakdown: EQBreakdown } {
    let overall: number;
    let calculation_method: EQScore['calculation_method'];
    let confidence: number;

    const layerContributions = {
      specialty_context: {} as LayerContribution,
      pattern_recognition: {} as LayerContribution,
      content_analysis: {} as LayerContribution
    };

    if (specialtyContext && specialtyContext.is_known) {
      // Known specialty: Use specialty-first approach
      calculation_method = 'specialty_based';

      const specialtyContribution = specialtyContext.base_eq * EQ_WEIGHTS.SPECIALTY_CONTEXT;
      const patternContribution = patternEQ * EQ_WEIGHTS.PATTERN_RECOGNITION;
      const contentContribution = contentEQ * EQ_WEIGHTS.CONTENT_ANALYSIS;

      overall = Math.round(specialtyContribution + patternContribution + contentContribution);
      confidence = specialtyContext.confidence;

      layerContributions.specialty_context = {
        score: specialtyContext.base_eq,
        weight: EQ_WEIGHTS.SPECIALTY_CONTEXT,
        contribution: specialtyContribution,
        confidence: specialtyContext.confidence
      };
      layerContributions.pattern_recognition = {
        score: patternEQ,
        weight: EQ_WEIGHTS.PATTERN_RECOGNITION,
        contribution: patternContribution,
        confidence: 80
      };
      layerContributions.content_analysis = {
        score: contentEQ,
        weight: EQ_WEIGHTS.CONTENT_ANALYSIS,
        contribution: contentContribution,
        confidence: 70
      };

    } else if (specialtyContext && !specialtyContext.is_known) {
      // Unknown specialty but has industry baseline: Use hybrid
      calculation_method = 'hybrid';

      const industryContribution = specialtyContext.base_eq * EQ_WEIGHTS.INDUSTRY_BASE;
      const patternContribution = patternEQ * EQ_WEIGHTS.PATTERN_UNKNOWN;
      const contentContribution = contentEQ * EQ_WEIGHTS.CONTENT_UNKNOWN;

      overall = Math.round(industryContribution + patternContribution + contentContribution);
      confidence = 65;

      layerContributions.specialty_context = {
        score: specialtyContext.base_eq,
        weight: EQ_WEIGHTS.INDUSTRY_BASE,
        contribution: industryContribution,
        confidence: specialtyContext.confidence
      };
      layerContributions.pattern_recognition = {
        score: patternEQ,
        weight: EQ_WEIGHTS.PATTERN_UNKNOWN,
        contribution: patternContribution,
        confidence: 75
      };
      layerContributions.content_analysis = {
        score: contentEQ,
        weight: EQ_WEIGHTS.CONTENT_UNKNOWN,
        contribution: contentContribution,
        confidence: 65
      };

    } else {
      // No specialty context: Pattern-based only
      calculation_method = 'pattern_based';

      const patternContribution = patternEQ * 0.7;
      const contentContribution = contentEQ * 0.3;

      overall = Math.round(patternContribution + contentContribution);
      confidence = 60;

      layerContributions.specialty_context = {
        score: 50,
        weight: 0,
        contribution: 0,
        confidence: 0
      };
      layerContributions.pattern_recognition = {
        score: patternEQ,
        weight: 0.7,
        contribution: patternContribution,
        confidence: 75
      };
      layerContributions.content_analysis = {
        score: contentEQ,
        weight: 0.3,
        contribution: contentContribution,
        confidence: 70
      };
    }

    // Calculate emotional vs rational split
    // Higher EQ = more emotional
    const emotional = overall;
    const rational = 100 - overall;

    const finalEQ: EQScore = {
      emotional,
      rational,
      overall,
      confidence,
      calculation_method
    };

    const breakdown: EQBreakdown = {
      score: finalEQ,
      layer_contributions: layerContributions,
      detected_signals: {} as any,  // Will be filled by caller
      calculation_timestamp: new Date().toISOString()
    };

    return { finalEQ, breakdown };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    eqScore: EQScore,
    breakdown: EQBreakdown,
    specialtyContext?: SpecialtyContext
  ): EQRecommendation[] {
    const recommendations: EQRecommendation[] = [];

    // High EQ recommendations
    if (eqScore.overall >= 70) {
      recommendations.push({
        type: 'tone',
        recommendation: 'Lead with storytelling and emotional transformation',
        reason: `High EQ (${eqScore.overall}) indicates emotionally-driven buyers. Use lifestyle imagery, customer stories, and emotional benefits.`,
        impact: 'high'
      });

      recommendations.push({
        type: 'messaging',
        recommendation: 'Focus on "how they\'ll feel" not "what they\'ll get"',
        reason: 'Emotional buyers care more about transformation than features',
        impact: 'high'
      });

      recommendations.push({
        type: 'platform',
        recommendation: 'Instagram and Facebook will perform best',
        reason: 'Visual, lifestyle-focused platforms align with high EQ',
        impact: 'medium'
      });
    }

    // Medium EQ recommendations
    if (eqScore.overall >= 40 && eqScore.overall < 70) {
      recommendations.push({
        type: 'tone',
        recommendation: 'Use balanced approach: Hook with emotion, close with data',
        reason: `Medium EQ (${eqScore.overall}) means buyers need both emotional connection AND rational justification`,
        impact: 'high'
      });

      recommendations.push({
        type: 'messaging',
        recommendation: 'Lead with transformation, back up with metrics',
        reason: 'Balanced buyers want the best of both worlds',
        impact: 'high'
      });
    }

    // Low EQ recommendations
    if (eqScore.overall < 40) {
      recommendations.push({
        type: 'tone',
        recommendation: 'Lead with ROI, data, and measurable outcomes',
        reason: `Low EQ (${eqScore.overall}) indicates rational, data-driven buyers. Use numbers, comparisons, and efficiency metrics.`,
        impact: 'high'
      });

      recommendations.push({
        type: 'messaging',
        recommendation: 'Focus on "what they\'ll save/gain" not "how they\'ll feel"',
        reason: 'Rational buyers want concrete results, not feelings',
        impact: 'high'
      });

      recommendations.push({
        type: 'platform',
        recommendation: 'LinkedIn will perform best for B2B',
        reason: 'Professional, data-focused platform aligns with low EQ',
        impact: 'medium'
      });
    }

    // Seasonal recommendations
    recommendations.push({
      type: 'seasonal',
      recommendation: 'Boost EQ +15 points during holidays',
      reason: 'Holiday season is emotionally charged - adjust messaging',
      impact: 'medium',
      suggested_eq_adjustment: 15
    });

    // Specialty-specific recommendations
    if (specialtyContext?.is_passion_product) {
      recommendations.push({
        type: 'competitive',
        recommendation: 'Lean into passion and community',
        reason: 'Passion products thrive on emotional connection and belonging',
        impact: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Create fallback result when calculation fails
   */
  private createFallbackResult(
    calculationId: string,
    industry?: string
  ): EQCalculationResult {
    const fallbackEQ = industry ? (INDUSTRY_BASELINES[industry.toLowerCase()] || 50) : 50;

    const eqScore: EQScore = {
      emotional: fallbackEQ,
      rational: 100 - fallbackEQ,
      overall: fallbackEQ,
      confidence: 30,
      calculation_method: 'content_only'
    };

    return {
      eq_score: eqScore,
      breakdown: {
        score: eqScore,
        layer_contributions: {
          specialty_context: { score: 50, weight: 0, contribution: 0, confidence: 0 },
          pattern_recognition: { score: 50, weight: 0, contribution: 0, confidence: 0 },
          content_analysis: { score: fallbackEQ, weight: 1, contribution: fallbackEQ, confidence: 30 }
        },
        detected_signals: {} as any,
        calculation_timestamp: new Date().toISOString()
      },
      pattern_matches: [],
      content_analysis: {} as any,
      recommendations: [{
        type: 'tone',
        recommendation: 'Unable to calculate precise EQ - using industry baseline',
        reason: 'Calculation failed, using fallback',
        impact: 'low'
      }],
      cached: false,
      calculation_id: calculationId
    };
  }
}

// Export singleton instance
export const eqCalculatorV2 = new EQCalculatorV2Service();
export { EQCalculatorV2Service };
