/**
 * Dimension Scorers
 *
 * Specialized scoring logic for each of the 5 dimensions:
 * 1. Unexpectedness (0-30)
 * 2. Truthfulness (0-25)
 * 3. Actionability (0-20)
 * 4. Uniqueness (0-15)
 * 5. Virality (0-10)
 *
 * Created: 2025-11-10
 */

import {
  BreakthroughInsight
} from '../../../types/breakthrough.types';
import { DeepContext } from '../../../types/deepContext.types';
import {
  DimensionScore,
  ScoreContributor
} from '../../../types/scoring.types';

export class DimensionScorers {
  /**
   * DIMENSION 1: UNEXPECTEDNESS (0-30)
   * Measures how surprising the insight is
   */
  async scoreUnexpectedness(
    insight: BreakthroughInsight,
    context: DeepContext
  ): Promise<DimensionScore> {
    const contributors: ScoreContributor[] = [];
    let score = 0;

    // Factor 1: Challenges conventional wisdom (0-10 points)
    if (this.challengesConventionalWisdom(insight, context)) {
      const points = 10;
      score += points;
      contributors.push({
        factor: 'Challenges Conventional Wisdom',
        points,
        reason: 'Directly contradicts what most people in the industry believe',
        impact: 'positive'
      });
    }

    // Factor 2: Connection novelty (0-8 points)
    const novelty = this.assessConnectionNovelty(insight);
    if (novelty > 0) {
      const points = Math.round(novelty * 8);
      score += points;
      contributors.push({
        factor: 'Novel Connection',
        points,
        reason: `Makes unexpected connection between ${novelty > 0.7 ? 'highly' : 'moderately'} disparate concepts`,
        impact: 'positive'
      });
    }

    // Factor 3: Reveals hidden pattern (0-7 points)
    if (this.revealsHiddenPattern(insight)) {
      const points = 7;
      score += points;
      contributors.push({
        factor: 'Hidden Pattern Revealed',
        points,
        reason: 'Exposes a pattern that was always there but invisible to most',
        impact: 'positive'
      });
    }

    // Factor 4: Counter-intuitive (0-5 points)
    if (this.isCounterIntuitive(insight)) {
      const points = 5;
      score += points;
      contributors.push({
        factor: 'Counter-Intuitive',
        points,
        reason: 'Goes against common intuition in a meaningful way',
        impact: 'positive'
      });
    }

    const finalScore = Math.min(score, 30);

    return {
      score: finalScore,
      maxScore: 30,
      normalized: finalScore / 30,
      contributors,
      reasoning: this.generateUnexpectednessReasoning(finalScore, contributors)
    };
  }

  /**
   * DIMENSION 2: TRUTHFULNESS (0-25)
   * Measures how well-supported the insight is
   */
  async scoreTruthfulness(
    insight: BreakthroughInsight,
    context: DeepContext
  ): Promise<DimensionScore> {
    const contributors: ScoreContributor[] = [];
    let score = 0;

    // Factor 1: Evidence quality (0-10 points)
    if (insight.evidence && insight.evidence.length > 0) {
      const evidenceQuality = this.assessEvidenceQuality(insight.evidence);
      const points = Math.round(evidenceQuality * 10);
      score += points;
      contributors.push({
        factor: 'Evidence Quality',
        points,
        reason: `${insight.evidence.length} pieces of ${evidenceQuality > 0.7 ? 'strong' : 'moderate'} evidence provided`,
        impact: 'positive'
      });
    } else {
      contributors.push({
        factor: 'Evidence Quality',
        points: 0,
        reason: 'No evidence provided',
        impact: 'negative'
      });
    }

    // Factor 2: Psychology principle (0-8 points)
    if (this.hasPsychologyPrinciple(insight)) {
      const points = 8;
      score += points;
      contributors.push({
        factor: 'Psychology Grounding',
        points,
        reason: 'Grounded in established psychological principles',
        impact: 'positive'
      });
    }

    // Factor 3: Behavioral support (0-7 points)
    const behaviorSupport = this.checkBehaviorSupport(insight, context);
    if (behaviorSupport > 0) {
      const points = Math.round(behaviorSupport * 7);
      score += points;
      contributors.push({
        factor: 'Behavioral Support',
        points,
        reason: `Supported by ${behaviorSupport > 0.7 ? 'strong' : 'some'} customer behavior data`,
        impact: 'positive'
      });
    }

    const finalScore = Math.min(score, 25);

    return {
      score: finalScore,
      maxScore: 25,
      normalized: finalScore / 25,
      contributors,
      reasoning: this.generateTruthfulnessReasoning(finalScore, contributors)
    };
  }

  /**
   * DIMENSION 3: ACTIONABILITY (0-20)
   * Measures how immediately actionable the insight is
   */
  async scoreActionability(
    insight: BreakthroughInsight,
    context: DeepContext
  ): Promise<DimensionScore> {
    const contributors: ScoreContributor[] = [];
    let score = 0;

    // Factor 1: Can create today (0-8 points)
    if (insight.contentAngle && this.canCreateToday(insight)) {
      const points = 8;
      score += points;
      contributors.push({
        factor: 'Immediate Creation',
        points,
        reason: 'Content can be created today with existing resources',
        impact: 'positive'
      });
    } else if (insight.contentAngle) {
      contributors.push({
        factor: 'Immediate Creation',
        points: 0,
        reason: 'Content angle exists but requires additional resources',
        impact: 'neutral'
      });
    } else {
      contributors.push({
        factor: 'Immediate Creation',
        points: 0,
        reason: 'No clear content angle provided',
        impact: 'negative'
      });
    }

    // Factor 2: Clear value (0-6 points)
    if (this.hasClearValue(insight, context)) {
      const points = 6;
      score += points;
      contributors.push({
        factor: 'Clear Value Proposition',
        points,
        reason: 'Value to audience is immediately obvious',
        impact: 'positive'
      });
    }

    // Factor 3: Fits brand voice (0-3 points)
    if (this.fitsBrandVoice(insight, context)) {
      const points = 3;
      score += points;
      contributors.push({
        factor: 'Brand Alignment',
        points,
        reason: 'Aligns with brand voice and positioning',
        impact: 'positive'
      });
    }

    // Factor 4: Has required resources (0-3 points)
    if (this.hasRequiredResources(insight, context)) {
      const points = 3;
      score += points;
      contributors.push({
        factor: 'Resource Availability',
        points,
        reason: 'All required resources are available',
        impact: 'positive'
      });
    }

    const finalScore = Math.min(score, 20);

    return {
      score: finalScore,
      maxScore: 20,
      normalized: finalScore / 20,
      contributors,
      reasoning: this.generateActionabilityReasoning(finalScore, contributors)
    };
  }

  /**
   * DIMENSION 4: UNIQUENESS (0-15)
   * Measures how unique this insight is
   */
  async scoreUniqueness(
    insight: BreakthroughInsight,
    context: DeepContext
  ): Promise<DimensionScore> {
    const contributors: ScoreContributor[] = [];
    let score = 0;

    // Factor 1: Competitor coverage (0-7 points)
    const competitorCoverage = await this.checkCompetitorCoverage(insight, context);
    const points1 = Math.round((1 - competitorCoverage) * 7);
    score += points1;
    contributors.push({
      factor: 'Competitor Gap',
      points: points1,
      reason: competitorCoverage < 0.3
        ? 'Competitors rarely or never cover this topic'
        : competitorCoverage < 0.6
        ? 'Some competitor coverage but still unique angle'
        : 'Heavily covered by competitors',
      impact: competitorCoverage < 0.5 ? 'positive' : 'negative'
    });

    // Factor 2: Novel approach (0-5 points)
    if (this.isNovelApproach(insight)) {
      const points = 5;
      score += points;
      contributors.push({
        factor: 'Novel Approach',
        points,
        reason: 'Uses an approach or angle that hasn\'t been done before',
        impact: 'positive'
      });
    }

    // Factor 3: Unexplored angle (0-3 points)
    if (this.isUnexploredAngle(insight, context)) {
      const points = 3;
      score += points;
      contributors.push({
        factor: 'Unexplored Angle',
        points,
        reason: 'Takes an angle that the market hasn\'t explored',
        impact: 'positive'
      });
    }

    const finalScore = Math.min(score, 15);

    return {
      score: finalScore,
      maxScore: 15,
      normalized: finalScore / 15,
      contributors,
      reasoning: this.generateUniquenessReasoning(finalScore, contributors)
    };
  }

  /**
   * DIMENSION 5: VIRAL POTENTIAL (0-10)
   * Measures potential for viral sharing
   */
  async scoreViralPotential(
    insight: BreakthroughInsight,
    context: DeepContext
  ): Promise<DimensionScore> {
    const contributors: ScoreContributor[] = [];
    let score = 0;

    // Factor 1: Controversial but defensible (0-3 points)
    if (this.isControversialButDefensible(insight)) {
      const points = 3;
      score += points;
      contributors.push({
        factor: 'Healthy Controversy',
        points,
        reason: 'Takes a stance that will spark discussion but is well-supported',
        impact: 'positive'
      });
    }

    // Factor 2: Makes sharers look smart (0-3 points)
    if (this.makesSharersLookSmart(insight)) {
      const points = 3;
      score += points;
      contributors.push({
        factor: 'Social Currency',
        points,
        reason: 'Sharing this makes people look knowledgeable and insightful',
        impact: 'positive'
      });
    }

    // Factor 3: Clear narrative (0-2 points)
    if (this.hasClearNarrative(insight)) {
      const points = 2;
      score += points;
      contributors.push({
        factor: 'Narrative Clarity',
        points,
        reason: 'Story is clear and easy to retell',
        impact: 'positive'
      });
    }

    // Factor 4: Emotional resonance (0-2 points)
    const emotionalScore = this.scoreEmotionalResonance(insight, context);
    if (emotionalScore > 0) {
      const points = Math.round(emotionalScore * 2);
      score += points;
      contributors.push({
        factor: 'Emotional Resonance',
        points,
        reason: `Creates ${emotionalScore > 0.7 ? 'strong' : 'moderate'} emotional response`,
        impact: 'positive'
      });
    }

    const finalScore = Math.min(score, 10);

    return {
      score: finalScore,
      maxScore: 10,
      normalized: finalScore / 10,
      contributors,
      reasoning: this.generateViralityReasoning(finalScore, contributors)
    };
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private challengesConventionalWisdom(insight: BreakthroughInsight, context: DeepContext): boolean {
    const insightLower = insight.insight.toLowerCase();
    const challengeWords = ['contrary', 'opposite', 'actually', 'myth', 'wrong', 'not true', 'doesn\'t work'];
    return challengeWords.some(word => insightLower.includes(word));
  }

  private assessConnectionNovelty(insight: BreakthroughInsight): number {
    // Check if connecting disparate domains
    if (insight.sourceConnection) {
      const sources = [
        insight.sourceConnection.sources.primary.source,
        insight.sourceConnection.sources.secondary.source,
        insight.sourceConnection.sources.tertiary?.source
      ].filter(s => s);
      const uniqueSources = new Set(sources).size;
      return uniqueSources >= 3 ? 1.0 : uniqueSources === 2 ? 0.6 : 0.2;
    }
    return 0.3; // Default moderate novelty
  }

  private revealsHiddenPattern(insight: BreakthroughInsight): boolean {
    const patternWords = ['pattern', 'trend', 'always', 'consistently', 'repeatedly', 'correlation'];
    const insightLower = insight.insight.toLowerCase();
    return patternWords.some(word => insightLower.includes(word));
  }

  private isCounterIntuitive(insight: BreakthroughInsight): boolean {
    return insight.type === 'counter_intuitive' ||
      insight.insight.toLowerCase().includes('counter') ||
      insight.insight.toLowerCase().includes('surprising');
  }

  private assessEvidenceQuality(evidence: string[]): number {
    if (evidence.length === 0) return 0;

    // Quality factors
    let qualityScore = 0;

    // Quantity (more evidence = better)
    qualityScore += Math.min(evidence.length / 5, 0.3);

    // Specificity (longer, more detailed evidence = better)
    const avgLength = evidence.reduce((sum, e) => sum + e.length, 0) / evidence.length;
    if (avgLength > 80) qualityScore += 0.4;
    else if (avgLength > 50) qualityScore += 0.25;
    else if (avgLength > 30) qualityScore += 0.15;

    // Contains numbers (quantitative evidence = better)
    const hasNumbers = evidence.some(e => /\d+/.test(e));
    if (hasNumbers) qualityScore += 0.3;

    return Math.min(qualityScore, 1.0);
  }

  private hasPsychologyPrinciple(insight: BreakthroughInsight): boolean {
    const psychWords = ['psychology', 'cognitive', 'behavioral', 'emotion', 'bias', 'heuristic'];
    const text = `${insight.insight} ${insight.whyProfound}`.toLowerCase();
    return psychWords.some(word => text.includes(word));
  }

  private checkBehaviorSupport(insight: BreakthroughInsight, context: DeepContext): number {
    // Check if insight is supported by customer behavior data
    if (!context.customerPsychology) return 0.3; // Default moderate support

    // Check if mentions pain points or behaviors
    const hasPainPointSupport = context.realTimeCultural?.painPoints?.some(p =>
      insight.insight.toLowerCase().includes(p.painPoint.toLowerCase().slice(0, 20))
    );

    if (hasPainPointSupport) return 0.8;
    return 0.4;
  }

  private canCreateToday(insight: BreakthroughInsight): boolean {
    const contentAngle = insight.contentAngle.toLowerCase();
    const requiresResearch = ['study', 'research', 'data collection', 'survey'];
    return !requiresResearch.some(word => contentAngle.includes(word));
  }

  private hasClearValue(insight: BreakthroughInsight, context: DeepContext): boolean {
    return insight.whyProfound.length > 30 && insight.contentAngle.length > 20;
  }

  private fitsBrandVoice(insight: BreakthroughInsight, context: DeepContext): boolean {
    // Always true for now - would need brand voice analysis
    return true;
  }

  private hasRequiredResources(insight: BreakthroughInsight, context: DeepContext): boolean {
    // Check if requires special resources
    const contentAngle = insight.contentAngle.toLowerCase();
    const specialResources = ['video production', 'graphic design', 'animation', 'developer'];
    return !specialResources.some(resource => contentAngle.includes(resource));
  }

  private async checkCompetitorCoverage(insight: BreakthroughInsight, context: DeepContext): Promise<number> {
    // Check if competitors are covering this topic
    if (!context.competitiveIntel?.blindSpots) return 0.5; // Default moderate coverage

    const insightTopics = insight.insight.toLowerCase().split(' ').slice(0, 5);
    const isBlindSpot = context.competitiveIntel.blindSpots.some(bs =>
      insightTopics.some(topic => bs.topic.toLowerCase().includes(topic))
    );

    return isBlindSpot ? 0.2 : 0.6; // If it's a blind spot, low competitor coverage
  }

  private isNovelApproach(insight: BreakthroughInsight): boolean {
    const novelWords = ['new way', 'different approach', 'novel', 'innovative', 'fresh'];
    const text = `${insight.contentAngle}`.toLowerCase();
    return novelWords.some(word => text.includes(word));
  }

  private isUnexploredAngle(insight: BreakthroughInsight, context: DeepContext): boolean {
    // Check if this angle hasn't been explored
    return insight.type === 'unexpected_connection' || insight.type === 'counter_intuitive';
  }

  private isControversialButDefensible(insight: BreakthroughInsight): boolean {
    const hasControversy = insight.insight.toLowerCase().includes('contro') ||
      insight.insight.toLowerCase().includes('debate') ||
      insight.confidence > 0.7; // High confidence despite potential controversy

    return hasControversy && insight.evidence && insight.evidence.length >= 2;
  }

  private makesSharersLookSmart(insight: BreakthroughInsight): boolean {
    // Insights that reveal non-obvious truths make sharers look smart
    return insight.type === 'unexpected_connection' ||
      insight.type === 'counter_intuitive' ||
      insight.type === 'deep_psychology';
  }

  private hasClearNarrative(insight: BreakthroughInsight): boolean {
    return insight.contentAngle.length > 30 &&
      insight.whyProfound.length > 30 &&
      insight.whyNow.length > 20;
  }

  private scoreEmotionalResonance(insight: BreakthroughInsight, context: DeepContext): number {
    const emotionalWords = [
      'surprise', 'shock', 'amaz', 'excit', 'wow', 'realiz', 'discover',
      'fear', 'worry', 'concern', 'hope', 'desire', 'want'
    ];

    const text = `${insight.insight} ${insight.expectedReaction}`.toLowerCase();
    const emotionalMatches = emotionalWords.filter(word => text.includes(word)).length;

    return Math.min(emotionalMatches / 3, 1.0);
  }

  // =========================================================================
  // REASONING GENERATORS
  // =========================================================================

  private generateUnexpectednessReasoning(score: number, contributors: ScoreContributor[]): string {
    if (score >= 25) return 'Highly unexpected - will genuinely surprise the audience';
    if (score >= 18) return 'Moderately unexpected - interesting perspective';
    if (score >= 12) return 'Somewhat unexpected - has some novelty';
    return 'Low unexpectedness - may feel obvious to some';
  }

  private generateTruthfulnessReasoning(score: number, contributors: ScoreContributor[]): string {
    if (score >= 20) return 'Very well-supported - strong credibility';
    if (score >= 15) return 'Well-supported - good evidence base';
    if (score >= 10) return 'Moderately supported - could use more evidence';
    return 'Weakly supported - needs stronger evidence';
  }

  private generateActionabilityReasoning(score: number, contributors: ScoreContributor[]): string {
    if (score >= 17) return 'Highly actionable - ready to execute immediately';
    if (score >= 13) return 'Actionable - can be executed with minor adjustments';
    if (score >= 9) return 'Somewhat actionable - requires some preparation';
    return 'Low actionability - significant work needed';
  }

  private generateUniquenessReasoning(score: number, contributors: ScoreContributor[]): string {
    if (score >= 12) return 'Highly unique - competitors aren\'t doing this';
    if (score >= 9) return 'Unique - fresh perspective in the market';
    if (score >= 6) return 'Somewhat unique - has differentiation';
    return 'Low uniqueness - similar to existing content';
  }

  private generateViralityReasoning(score: number, contributors: ScoreContributor[]): string {
    if (score >= 8) return 'High viral potential - likely to be shared widely';
    if (score >= 6) return 'Good viral potential - should generate sharing';
    if (score >= 4) return 'Moderate viral potential - some sharing expected';
    return 'Low viral potential - unlikely to spread organically';
  }
}
