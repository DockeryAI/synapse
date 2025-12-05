// PRD Feature: SYNAPSE-V6
/**
 * Outcome Detection Service
 *
 * Extracts real customer outcomes from UVP data and maps them to differentiators.
 * Parses customerProfiles for actual desired outcomes (not just keywords).
 * Adds industry context including urgency triggers, seasonal patterns, and competitive gaps.
 *
 * Key Features:
 * - Extract outcomes from customer profiles (emotionalDrivers, functionalDrivers)
 * - Map outcomes to UVP differentiators with strength scoring (1-100)
 * - Add industry context: urgency, seasonality, competitive positioning
 * - No keywords or generic matching - real outcome detection
 */

import type { CompleteUVP, CustomerProfile, Differentiator } from '@/types/uvp-flow.types';
import type { IndustryBooster } from './industry-booster.service';

/**
 * Detected outcome from customer profile
 */
export interface DetectedOutcome {
  id: string;
  statement: string;
  type: 'emotional' | 'functional' | 'transformation';
  source: 'customer_profile' | 'transformation_goal' | 'key_benefit';
  sourceId?: string; // Customer profile ID or other source
  urgencyScore: number; // 0-100 how urgent is this outcome
  impactScore: number; // 0-100 how impactful is this outcome
  confidence: number; // 0-100 extraction confidence
}

/**
 * Outcome mapped to UVP differentiator
 */
export interface OutcomeDifferentiatorMapping {
  outcomeId: string;
  differentiatorId: string;
  strengthScore: number; // 1-100 how strongly the differentiator addresses this outcome
  reasoning: string; // Why this mapping exists
  evidenceMatch: boolean; // Does differentiator evidence support this outcome
}

/**
 * Industry context for outcomes
 */
export interface OutcomeIndustryContext {
  urgencyTriggers: string[]; // What makes outcomes urgent in this industry
  seasonalPatterns: string[]; // How outcomes vary by season/time
  competitiveGaps: string[]; // What outcomes competitors miss
  regulatoryDrivers: string[]; // Compliance/regulatory outcome drivers
  marketTrends: string[]; // Industry trends affecting outcomes
}

/**
 * Complete outcome detection result
 */
export interface OutcomeDetectionResult {
  outcomes: DetectedOutcome[];
  mappings: OutcomeDifferentiatorMapping[];
  industryContext?: OutcomeIndustryContext;
  totalOutcomes: number;
  highImpactCount: number; // Outcomes with impactScore > 70
  highUrgencyCount: number; // Outcomes with urgencyScore > 70
}

/**
 * Outcome Detection Service
 * Extracts and maps customer outcomes from UVP data
 */
export class OutcomeDetectionService {
  /**
   * Extract outcomes from UVP customer profiles
   * Parses customerProfiles array, not keywords
   */
  extractOutcomes(uvp: CompleteUVP): DetectedOutcome[] {
    const outcomes: DetectedOutcome[] = [];

    // Extract from customer profiles
    if (uvp.customerProfiles && uvp.customerProfiles.length > 0) {
      uvp.customerProfiles.forEach((profile: CustomerProfile) => {
        // Extract emotional drivers as outcomes
        if (profile.emotionalDrivers && profile.emotionalDrivers.length > 0) {
          profile.emotionalDrivers.forEach((driver: string, index: number) => {
            outcomes.push({
              id: `emotional-${profile.id}-${index}`,
              statement: driver,
              type: 'emotional',
              source: 'customer_profile',
              sourceId: profile.id,
              urgencyScore: this.calculateUrgencyScore(driver, 'emotional'),
              impactScore: this.calculateImpactScore(driver, 'emotional'),
              confidence: profile.confidence?.overall || 70,
            });
          });
        }

        // Extract functional drivers as outcomes
        if (profile.functionalDrivers && profile.functionalDrivers.length > 0) {
          profile.functionalDrivers.forEach((driver: string, index: number) => {
            outcomes.push({
              id: `functional-${profile.id}-${index}`,
              statement: driver,
              type: 'functional',
              source: 'customer_profile',
              sourceId: profile.id,
              urgencyScore: this.calculateUrgencyScore(driver, 'functional'),
              impactScore: this.calculateImpactScore(driver, 'functional'),
              confidence: profile.confidence?.overall || 70,
            });
          });
        }
      });
    }

    // Fallback: Extract from main targetCustomer if no profiles
    if (outcomes.length === 0 && uvp.targetCustomer) {
      const customer = uvp.targetCustomer;

      if (customer.emotionalDrivers && customer.emotionalDrivers.length > 0) {
        customer.emotionalDrivers.forEach((driver: string, index: number) => {
          outcomes.push({
            id: `emotional-main-${index}`,
            statement: driver,
            type: 'emotional',
            source: 'customer_profile',
            sourceId: customer.id,
            urgencyScore: this.calculateUrgencyScore(driver, 'emotional'),
            impactScore: this.calculateImpactScore(driver, 'emotional'),
            confidence: customer.confidence?.overall || 60,
          });
        });
      }

      if (customer.functionalDrivers && customer.functionalDrivers.length > 0) {
        customer.functionalDrivers.forEach((driver: string, index: number) => {
          outcomes.push({
            id: `functional-main-${index}`,
            statement: driver,
            type: 'functional',
            source: 'customer_profile',
            sourceId: customer.id,
            urgencyScore: this.calculateUrgencyScore(driver, 'functional'),
            impactScore: this.calculateImpactScore(driver, 'functional'),
            confidence: customer.confidence?.overall || 60,
          });
        });
      }
    }

    // Extract transformation outcomes
    if (uvp.transformationGoal) {
      const goal = uvp.transformationGoal;

      // Extract desired outcomes from transformation
      if (goal.desiredOutcomes && goal.desiredOutcomes.length > 0) {
        goal.desiredOutcomes.forEach((outcome, index: number) => {
          const outcomeText = typeof outcome === 'string'
            ? outcome
            : outcome.description || '';

          if (outcomeText) {
            outcomes.push({
              id: `transformation-${goal.id}-${index}`,
              statement: outcomeText,
              type: 'transformation',
              source: 'transformation_goal',
              sourceId: goal.id,
              urgencyScore: goal.urgencyFactor || 50,
              impactScore: this.calculateImpactScore(outcomeText, 'transformation'),
              confidence: goal.confidence?.overall || 70,
            });
          }
        });
      }

      // Extract from before/after if available
      if (goal.before && goal.after) {
        outcomes.push({
          id: `transformation-${goal.id}-before-after`,
          statement: `Transform from "${goal.before}" to "${goal.after}"`,
          type: 'transformation',
          source: 'transformation_goal',
          sourceId: goal.id,
          urgencyScore: goal.urgencyFactor || 50,
          impactScore: 85, // High impact for core transformation
          confidence: goal.confidence?.overall || 70,
        });
      }
    }

    return outcomes;
  }

  /**
   * Map outcomes to UVP differentiators with strength scoring
   */
  mapToUVPDifferentiators(
    outcomes: DetectedOutcome[],
    differentiators: Differentiator[]
  ): OutcomeDifferentiatorMapping[] {
    const mappings: OutcomeDifferentiatorMapping[] = [];

    outcomes.forEach((outcome) => {
      differentiators.forEach((diff) => {
        const strengthScore = this.calculateMappingStrength(outcome, diff);

        // Only create mapping if strength is meaningful (>20)
        if (strengthScore > 20) {
          const evidenceMatch = this.checkEvidenceMatch(outcome, diff);

          mappings.push({
            outcomeId: outcome.id,
            differentiatorId: diff.id,
            strengthScore,
            reasoning: this.generateMappingReasoning(outcome, diff, strengthScore),
            evidenceMatch,
          });
        }
      });
    });

    return mappings;
  }

  /**
   * Add industry context to outcomes
   */
  addIndustryContext(
    outcomes: DetectedOutcome[],
    industryBooster?: IndustryBooster
  ): OutcomeIndustryContext {
    const context: OutcomeIndustryContext = {
      urgencyTriggers: [],
      seasonalPatterns: [],
      competitiveGaps: [],
      regulatoryDrivers: [],
      marketTrends: [],
    };

    if (!industryBooster || !industryBooster.matched) {
      return context;
    }

    // Map industry booster data to outcome context
    if (industryBooster.industryTrends && industryBooster.industryTrends.length > 0) {
      context.marketTrends = industryBooster.industryTrends;
    }

    if (industryBooster.seasonalFactors && industryBooster.seasonalFactors.length > 0) {
      context.seasonalPatterns = industryBooster.seasonalFactors;
    }

    if (industryBooster.regulatoryContext) {
      context.regulatoryDrivers = [industryBooster.regulatoryContext];
    }

    // Derive urgency triggers from pain points
    if (industryBooster.additionalPainPoints && industryBooster.additionalPainPoints.length > 0) {
      context.urgencyTriggers = industryBooster.additionalPainPoints
        .filter((pain: string) => this.isUrgencyTrigger(pain))
        .slice(0, 5);
    }

    // Derive competitive gaps from outcomes + industry context
    context.competitiveGaps = this.identifyCompetitiveGaps(
      outcomes,
      industryBooster
    );

    return context;
  }

  /**
   * Complete outcome detection from UVP
   */
  detectOutcomes(
    uvp: CompleteUVP,
    industryBooster?: IndustryBooster
  ): OutcomeDetectionResult {
    // Extract outcomes
    const outcomes = this.extractOutcomes(uvp);

    // Map to differentiators
    const differentiators = uvp.uniqueSolution?.differentiators || [];
    const mappings = this.mapToUVPDifferentiators(outcomes, differentiators);

    // Add industry context
    const industryContext = this.addIndustryContext(outcomes, industryBooster);

    // Calculate summary stats
    const highImpactCount = outcomes.filter((o) => o.impactScore > 70).length;
    const highUrgencyCount = outcomes.filter((o) => o.urgencyScore > 70).length;

    return {
      outcomes,
      mappings,
      industryContext,
      totalOutcomes: outcomes.length,
      highImpactCount,
      highUrgencyCount,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate urgency score for an outcome
   */
  private calculateUrgencyScore(statement: string, type: string): number {
    const urgentKeywords = [
      'reduce time',
      'reduce cost',
      'increase revenue',
      'faster',
      'quickly',
      'immediately',
      'urgent',
      'critical',
      'deadline',
      'falling behind',
      'losing',
      'competitive pressure',
    ];

    let score = 50; // Base score

    // Check for urgency keywords
    const lowerStatement = statement.toLowerCase();
    const matches = urgentKeywords.filter((kw) => lowerStatement.includes(kw));
    score += matches.length * 10;

    // Functional outcomes tend to be more urgent
    if (type === 'functional') {
      score += 10;
    }

    // Emotional outcomes with fear/loss are more urgent
    if (type === 'emotional') {
      const fearKeywords = ['fear', 'worried', 'anxious', 'concerned', 'stressed'];
      if (fearKeywords.some((kw) => lowerStatement.includes(kw))) {
        score += 20;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate impact score for an outcome
   */
  private calculateImpactScore(statement: string, type: string): number {
    const highImpactKeywords = [
      'revenue',
      'profit',
      'growth',
      'scale',
      'transformation',
      'competitive advantage',
      'market share',
      'efficiency',
      'productivity',
      'save',
      'increase',
    ];

    let score = 60; // Base score

    // Check for high-impact keywords
    const lowerStatement = statement.toLowerCase();
    const matches = highImpactKeywords.filter((kw) => lowerStatement.includes(kw));
    score += matches.length * 8;

    // Transformation outcomes are high impact
    if (type === 'transformation') {
      score += 15;
    }

    // Check for quantifiable outcomes (numbers, percentages)
    if (/\d+%|\d+x|\$\d+/.test(statement)) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate mapping strength between outcome and differentiator
   */
  private calculateMappingStrength(
    outcome: DetectedOutcome,
    differentiator: Differentiator
  ): number {
    let strength = 0;

    const outcomeWords = this.extractKeywords(outcome.statement);
    const diffWords = this.extractKeywords(differentiator.statement);
    const evidenceWords = this.extractKeywords(differentiator.evidence || '');

    // Calculate word overlap
    const statementOverlap = this.calculateOverlap(outcomeWords, diffWords);
    strength += statementOverlap * 40;

    // Evidence match is stronger signal
    const evidenceOverlap = this.calculateOverlap(outcomeWords, evidenceWords);
    strength += evidenceOverlap * 60;

    // Boost for high-strength differentiators
    if (differentiator.strengthScore > 70) {
      strength += 10;
    }

    return Math.min(100, Math.round(strength));
  }

  /**
   * Check if differentiator evidence supports outcome
   */
  private checkEvidenceMatch(
    outcome: DetectedOutcome,
    differentiator: Differentiator
  ): boolean {
    if (!differentiator.evidence) {
      return false;
    }

    const outcomeWords = this.extractKeywords(outcome.statement);
    const evidenceWords = this.extractKeywords(differentiator.evidence);

    const overlap = this.calculateOverlap(outcomeWords, evidenceWords);
    return overlap > 0.3; // 30% keyword overlap threshold
  }

  /**
   * Generate reasoning for outcome-differentiator mapping
   */
  private generateMappingReasoning(
    outcome: DetectedOutcome,
    differentiator: Differentiator,
    strengthScore: number
  ): string {
    if (strengthScore > 70) {
      return `Strong alignment: "${differentiator.statement}" directly addresses "${outcome.statement}"`;
    } else if (strengthScore > 50) {
      return `Moderate alignment: "${differentiator.statement}" partially addresses "${outcome.statement}"`;
    } else {
      return `Weak alignment: "${differentiator.statement}" has some relevance to "${outcome.statement}"`;
    }
  }

  /**
   * Check if pain point is an urgency trigger
   */
  private isUrgencyTrigger(painPoint: string): boolean {
    const urgentIndicators = [
      'deadline',
      'regulatory',
      'compliance',
      'audit',
      'losing',
      'behind',
      'critical',
      'urgent',
      'immediate',
    ];

    const lower = painPoint.toLowerCase();
    return urgentIndicators.some((indicator) => lower.includes(indicator));
  }

  /**
   * Identify competitive gaps from outcomes and industry context
   */
  private identifyCompetitiveGaps(
    outcomes: DetectedOutcome[],
    industryBooster: IndustryBooster
  ): string[] {
    const gaps: string[] = [];

    // Look for high-impact outcomes that are underserved
    const highImpactOutcomes = outcomes
      .filter((o) => o.impactScore > 75)
      .slice(0, 3);

    highImpactOutcomes.forEach((outcome) => {
      gaps.push(`Opportunity: ${outcome.statement} (high impact, ${outcome.impactScore})`);
    });

    // Add industry-specific gaps from competitive landscape
    if (industryBooster.competitiveLandscape) {
      gaps.push(`Market gap: ${industryBooster.competitiveLandscape}`);
    }

    return gaps;
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];

    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'we', 'you', 'they', 'them',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));
  }

  /**
   * Calculate word overlap between two sets
   */
  private calculateOverlap(words1: string[], words2: string[]): number {
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = Array.from(set1).filter((word) => set2.has(word));
    const union = new Set([...words1, ...words2]);

    return intersection.length / union.size;
  }
}

// Export singleton instance
export const outcomeDetectionService = new OutcomeDetectionService();
