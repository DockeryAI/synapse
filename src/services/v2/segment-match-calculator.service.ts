/**
 * Segment Match Calculator Service
 * Calculates how well content matches target segments
 * Integrates with BreakthroughScorer for comprehensive content scoring
 */

import type {
  SegmentMatchScore,
  SegmentMatchInput,
  CustomerPersona,
  SegmentEQMapping,
  PurchaseStage,
} from '@/types/v2';
import { personaMappingService } from './persona-mapping.service';
import { segmentEQOptimizerService } from './segment-eq-optimizer.service';
import { purchaseStageScorerService } from './purchase-stage-scorer.service';

export interface SegmentMatchAnalysis {
  persona: CustomerPersona;
  matchScore: SegmentMatchScore;
  performancePrediction: {
    expectedEngagement: number;
    expectedConversion: number;
    confidence: number;
  };
}

export interface MultiSegmentMatch {
  content: SegmentMatchInput;
  matches: SegmentMatchAnalysis[];
  bestMatch: SegmentMatchAnalysis;
  overallFit: number; // 0-100
}

export interface ImprovementPlan {
  currentScore: number;
  targetScore: number;
  estimatedImpact: number;
  prioritizedActions: {
    action: string;
    category: 'persona' | 'stage' | 'eq' | 'tone' | 'length';
    difficulty: 'easy' | 'medium' | 'hard';
    impact: number;
    timeEstimate: string;
  }[];
}

export class SegmentMatchCalculatorService {
  /**
   * Calculate match score between content and a specific persona
   */
  calculateMatch(content: SegmentMatchInput, personaId: string): SegmentMatchScore | null {
    const persona = personaMappingService.getPersona(personaId);
    if (!persona) {
      return null;
    }

    const eqMapping = segmentEQOptimizerService.getEQMapping(personaId);
    const stageScore = purchaseStageScorerService.scoreContent(content);

    // Calculate individual alignment scores
    const personaAlignment = this.calculatePersonaAlignment(content, persona);
    const stageAlignment = this.calculateStageAlignment(content, stageScore.detectedStage);
    const eqFit = this.calculateEQFit(content, eqMapping);
    const toneMatch = this.calculateToneMatch(content, persona);
    const lengthFit = this.calculateLengthFit(content, persona);

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore({
      personaAlignment,
      stageAlignment,
      eqFit,
      toneMatch,
      lengthFit,
    });

    // Generate improvement suggestions
    const suggestions = this.generateImprovementSuggestions({
      personaAlignment,
      purchaseStageAlignment: stageAlignment,
      eqTriggerFit: eqFit,
      toneMatch,
      messageLengthFit: lengthFit,
    }, persona);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(eqMapping, stageScore.confidence);

    return {
      personaId: persona.id,
      personaName: persona.name,
      overallScore: Math.round(overallScore),
      breakdown: {
        personaAlignment: Math.round(personaAlignment),
        purchaseStageAlignment: Math.round(stageAlignment),
        eqTriggerFit: Math.round(eqFit),
        toneMatch: Math.round(toneMatch),
        messageLengthFit: Math.round(lengthFit),
      },
      improvementSuggestions: suggestions,
      confidence: Math.round(confidence),
    };
  }

  /**
   * Calculate match scores for content against all personas
   */
  calculateMultiSegmentMatch(content: SegmentMatchInput): MultiSegmentMatch {
    const personas = personaMappingService.getAllPersonas();
    const matches: SegmentMatchAnalysis[] = [];

    for (const persona of personas) {
      const matchScore = this.calculateMatch(content, persona.id);
      if (matchScore) {
        matches.push({
          persona,
          matchScore,
          performancePrediction: this.predictPerformance(matchScore),
        });
      }
    }

    // Sort by overall score
    matches.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore);

    const bestMatch = matches[0];
    const overallFit = matches.length > 0
      ? matches.reduce((sum, m) => sum + m.matchScore.overallScore, 0) / matches.length
      : 0;

    return {
      content,
      matches,
      bestMatch,
      overallFit: Math.round(overallFit),
    };
  }

  /**
   * Create improvement plan to boost segment match
   */
  createImprovementPlan(
    content: SegmentMatchInput,
    targetPersonaId: string,
    targetScore: number = 85
  ): ImprovementPlan | null {
    const matchScore = this.calculateMatch(content, targetPersonaId);
    if (!matchScore) {
      return null;
    }

    const currentScore = matchScore.overallScore;
    const estimatedImpact = targetScore - currentScore;

    // Convert suggestions to prioritized actions
    const prioritizedActions = matchScore.improvementSuggestions.map(suggestion => ({
      action: suggestion.suggestion,
      category: this.categorizeSuggestion(suggestion.area),
      difficulty: this.assessDifficulty(suggestion.potentialImpact),
      impact: suggestion.potentialImpact,
      timeEstimate: this.estimateTime(suggestion.potentialImpact),
    }));

    // Sort by impact (high to low)
    prioritizedActions.sort((a, b) => b.impact - a.impact);

    return {
      currentScore,
      targetScore,
      estimatedImpact,
      prioritizedActions,
    };
  }

  /**
   * Validate content meets minimum segment match threshold
   */
  validateSegmentMatch(
    content: SegmentMatchInput,
    personaId: string,
    minScore: number = 70
  ): {
    isValid: boolean;
    score: number;
    gaps: string[];
    quickFixes: string[];
  } {
    const matchScore = this.calculateMatch(content, personaId);
    if (!matchScore) {
      return {
        isValid: false,
        score: 0,
        gaps: ['Persona not found'],
        quickFixes: [],
      };
    }

    const gaps: string[] = [];
    const quickFixes: string[] = [];

    // Find areas below threshold
    Object.entries(matchScore.breakdown).forEach(([area, score]) => {
      if (score < minScore) {
        gaps.push(`${area}: ${score}% (below ${minScore}%)`);

        // Find quick fixes for this area
        const relevantSuggestions = matchScore.improvementSuggestions.filter(
          s => s.area.toLowerCase().includes(area.toLowerCase())
        );
        relevantSuggestions.forEach(s => quickFixes.push(s.suggestion));
      }
    });

    return {
      isValid: matchScore.overallScore >= minScore,
      score: matchScore.overallScore,
      gaps,
      quickFixes,
    };
  }

  /**
   * Get optimal persona for given content
   */
  getOptimalPersona(content: SegmentMatchInput): {
    personaId: string;
    personaName: string;
    matchScore: number;
    reasons: string[];
  } | null {
    const multiMatch = this.calculateMultiSegmentMatch(content);
    if (multiMatch.matches.length === 0) {
      return null;
    }

    const best = multiMatch.bestMatch;
    const reasons = best.matchScore.improvementSuggestions
      .filter(s => s.potentialImpact >= 10)
      .map(s => s.suggestion)
      .slice(0, 3);

    return {
      personaId: best.persona.id,
      personaName: best.persona.name,
      matchScore: best.matchScore.overallScore,
      reasons,
    };
  }

  // Private helper methods

  private calculatePersonaAlignment(content: SegmentMatchInput, persona: CustomerPersona): number {
    const contentLower = `${content.title || ''} ${content.content}`.toLowerCase();
    let score = 50; // baseline

    // Check pain point alignment
    for (const painPoint of persona.psychographics.painPoints) {
      if (contentLower.includes(painPoint.toLowerCase())) {
        score += 10;
      }
    }

    // Check goal alignment
    for (const goal of persona.psychographics.goals) {
      if (contentLower.includes(goal.toLowerCase())) {
        score += 10;
      }
    }

    // Check value alignment
    for (const value of persona.psychographics.values) {
      if (contentLower.includes(value.toLowerCase())) {
        score += 5;
      }
    }

    return Math.min(score, 100);
  }

  private calculateStageAlignment(content: SegmentMatchInput, detectedStage: PurchaseStage): number {
    // If content has explicit stage, compare with detected
    if (content.purchaseStage) {
      return content.purchaseStage === detectedStage ? 100 : 50;
    }

    // Otherwise, use stage score confidence
    const stageScore = purchaseStageScorerService.scoreContent(content);
    return stageScore.stageScores[detectedStage];
  }

  private calculateEQFit(content: SegmentMatchInput, eqMapping: SegmentEQMapping | null): number {
    if (!eqMapping || !content.emotionalTrigger) {
      return 70; // neutral score if no data
    }

    // Check if content trigger matches persona's preferred triggers
    const triggerWeight = eqMapping.triggerWeights[content.emotionalTrigger] || 50;
    return triggerWeight;
  }

  private calculateToneMatch(content: SegmentMatchInput, persona: CustomerPersona): number {
    // Simplified tone analysis
    const contentLower = `${content.title || ''} ${content.content}`.toLowerCase();

    const toneIndicators = {
      professional: ['professional', 'expertise', 'industry', 'proven', 'certified'],
      casual: ['hey', 'awesome', 'cool', 'fun', 'easy'],
      technical: ['technical', 'system', 'architecture', 'implementation', 'algorithm'],
      friendly: ['help', 'support', 'together', 'community', 'welcome'],
    };

    // For now, return baseline - would implement NLP analysis in production
    return 75;
  }

  private calculateLengthFit(content: SegmentMatchInput, persona: CustomerPersona): number {
    const wordCount = content.content.split(/\s+/).length;

    // Determine ideal length based on content preferences
    const idealRanges: Record<string, { min: number; max: number }> = {
      short: { min: 50, max: 150 },
      medium: { min: 150, max: 400 },
      long: { min: 400, max: 1000 },
    };

    // For now, assume medium is ideal - would use persona preferences
    const ideal = idealRanges.medium;

    if (wordCount >= ideal.min && wordCount <= ideal.max) {
      return 100;
    } else if (wordCount < ideal.min) {
      return Math.max(50, 100 - ((ideal.min - wordCount) / ideal.min) * 50);
    } else {
      return Math.max(50, 100 - ((wordCount - ideal.max) / ideal.max) * 50);
    }
  }

  private calculateOverallScore(breakdown: SegmentMatchScore['breakdown']): number {
    // Weighted average
    const weights = {
      personaAlignment: 0.3,
      purchaseStageAlignment: 0.25,
      eqTriggerFit: 0.25,
      toneMatch: 0.1,
      messageLengthFit: 0.1,
    };

    return (
      breakdown.personaAlignment * weights.personaAlignment +
      breakdown.purchaseStageAlignment * weights.purchaseStageAlignment +
      breakdown.eqTriggerFit * weights.eqTriggerFit +
      breakdown.toneMatch * weights.toneMatch +
      breakdown.messageLengthFit * weights.messageLengthFit
    );
  }

  private generateImprovementSuggestions(
    breakdown: SegmentMatchScore['breakdown'],
    persona: CustomerPersona
  ): SegmentMatchScore['improvementSuggestions'] {
    const suggestions: SegmentMatchScore['improvementSuggestions'] = [];

    // Find lowest scoring areas
    const sorted = Object.entries(breakdown).sort(([, a], [, b]) => a - b);

    for (const [area, score] of sorted) {
      if (score < 70) {
        const potential = 85 - score; // potential improvement to 85%

        let suggestion = '';
        if (area === 'personaAlignment') {
          suggestion = `Address more pain points: ${persona.psychographics.painPoints.slice(0, 2).join(', ')}`;
        } else if (area === 'purchaseStageAlignment') {
          suggestion = 'Align content with detected purchase stage indicators';
        } else if (area === 'eqTriggerFit') {
          suggestion = 'Use emotional triggers that resonate better with this persona';
        } else if (area === 'toneMatch') {
          suggestion = `Adjust tone to match persona's ${persona.behavioralTraits.decisionMakingStyle} style`;
        } else if (area === 'messageLengthFit') {
          suggestion = 'Optimize content length for this persona';
        }

        suggestions.push({
          area,
          currentScore: score,
          suggestion,
          potentialImpact: Math.round(potential),
        });
      }
    }

    return suggestions;
  }

  private predictPerformance(matchScore: SegmentMatchScore): {
    expectedEngagement: number;
    expectedConversion: number;
    confidence: number;
  } {
    // Simple performance prediction based on match score
    const baseEngagement = 0.03; // 3% baseline
    const baseConversion = 0.01; // 1% baseline

    const multiplier = matchScore.overallScore / 100;

    return {
      expectedEngagement: baseEngagement * multiplier * 2,
      expectedConversion: baseConversion * multiplier * 2,
      confidence: matchScore.confidence,
    };
  }

  private calculateConfidence(eqMapping: SegmentEQMapping | null, stageConfidence: number): number {
    let confidence = stageConfidence;

    // Boost if we have EQ mapping data
    if (eqMapping && eqMapping.historicalPerformance.length > 0) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  private categorizeSuggestion(area: string): 'persona' | 'stage' | 'eq' | 'tone' | 'length' {
    if (area.includes('persona')) return 'persona';
    if (area.includes('stage')) return 'stage';
    if (area.includes('eq') || area.includes('trigger')) return 'eq';
    if (area.includes('tone')) return 'tone';
    return 'length';
  }

  private assessDifficulty(impact: number): 'easy' | 'medium' | 'hard' {
    if (impact >= 20) return 'hard';
    if (impact >= 10) return 'medium';
    return 'easy';
  }

  private estimateTime(impact: number): string {
    if (impact >= 20) return '30-45 min';
    if (impact >= 10) return '15-30 min';
    return '5-15 min';
  }
}

// Singleton instance
export const segmentMatchCalculatorService = new SegmentMatchCalculatorService();
