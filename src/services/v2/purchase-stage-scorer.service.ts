/**
 * Purchase Stage Scorer Service
 * Detects and scores content fit for buyer journey stages
 */

import type {
  PurchaseStage,
  PurchaseStageScore,
  SegmentMatchInput,
} from '@/types/v2';

export interface StageIndicator {
  stage: PurchaseStage;
  keywords: string[];
  patterns: string[];
  weight: number;
}

export interface StageContentGuidelines {
  stage: PurchaseStage;
  characteristics: string[];
  contentTypes: string[];
  callToActions: string[];
  avoidances: string[];
}

export interface StageTransitionRecommendation {
  from: PurchaseStage;
  to: PurchaseStage;
  reasoning: string;
  requiredChanges: string[];
  confidence: number;
}

export class PurchaseStageScorerService {
  // Stage indicators with keywords and patterns
  private readonly stageIndicators: Record<PurchaseStage, StageIndicator> = {
    awareness: {
      stage: 'awareness',
      keywords: [
        'what is',
        'how to',
        'guide',
        'introduction',
        'basics',
        'explained',
        'understanding',
        'problem',
        'challenge',
        'issue',
        'struggle',
        'difficulty',
        'learn',
        'discover',
        'explore',
      ],
      patterns: [
        /what (?:is|are) .+\?/i,
        /how (?:to|do) .+\?/i,
        /why .+ (?:important|matters?)\?/i,
        /the (?:problem|challenge) with .+/i,
        /understanding .+/i,
      ],
      weight: 1.0,
    },
    consideration: {
      stage: 'consideration',
      keywords: [
        'compare',
        'comparison',
        'vs',
        'versus',
        'options',
        'alternatives',
        'solutions',
        'approaches',
        'strategies',
        'best',
        'top',
        'review',
        'pros and cons',
        'benefits',
        'features',
        'evaluate',
        'choose',
        'select',
      ],
      patterns: [
        /.+ vs .+/i,
        /comparing .+/i,
        /(?:best|top) .+ (?:for|to) .+/i,
        /how to (?:choose|select) .+/i,
        /(?:pros|cons|benefits) of .+/i,
      ],
      weight: 1.0,
    },
    decision: {
      stage: 'decision',
      keywords: [
        'buy',
        'purchase',
        'pricing',
        'cost',
        'price',
        'get started',
        'sign up',
        'demo',
        'trial',
        'consultation',
        'quote',
        'discount',
        'offer',
        'guarantee',
        'testimonial',
        'case study',
        'results',
        'roi',
        'value',
      ],
      patterns: [
        /(?:buy|purchase|get) .+ now/i,
        /(?:limited|special) offer/i,
        /(?:free|get) (?:trial|demo|consultation)/i,
        /pricing (?:plans?|options?)/i,
        /(?:\d+)% off/i,
      ],
      weight: 1.0,
    },
  };

  // Content guidelines for each stage
  private readonly stageGuidelines: Record<PurchaseStage, StageContentGuidelines> = {
    awareness: {
      stage: 'awareness',
      characteristics: [
        'Educational focus',
        'Problem-oriented',
        'No sales pressure',
        'Broad appeal',
        'Value-driven',
      ],
      contentTypes: [
        'Blog posts',
        'How-to guides',
        'Industry insights',
        'Problem explanations',
        'Trend analysis',
      ],
      callToActions: [
        'Learn more',
        'Read the full guide',
        'Subscribe for updates',
        'Download the resource',
        'Join the discussion',
      ],
      avoidances: [
        'Heavy sales language',
        'Pricing details',
        'Product features',
        'Urgency tactics',
        'Direct purchase requests',
      ],
    },
    consideration: {
      stage: 'consideration',
      characteristics: [
        'Solution-focused',
        'Comparative analysis',
        'Balanced perspective',
        'Feature highlights',
        'Benefit-oriented',
      ],
      contentTypes: [
        'Comparison articles',
        'Solution guides',
        'Feature showcases',
        'Use case stories',
        'Expert reviews',
      ],
      callToActions: [
        'See how it works',
        'View demo',
        'Compare options',
        'Request more information',
        'Talk to an expert',
      ],
      avoidances: [
        'Problem focus without solutions',
        'Generic information',
        'Aggressive discounting',
        'Overly technical jargon',
      ],
    },
    decision: {
      stage: 'decision',
      characteristics: [
        'Action-oriented',
        'Clear value proposition',
        'Social proof',
        'Risk reduction',
        'Urgency (appropriate)',
      ],
      contentTypes: [
        'Case studies',
        'Testimonials',
        'ROI calculators',
        'Pricing pages',
        'Product demos',
      ],
      callToActions: [
        'Start free trial',
        'Get a quote',
        'Schedule demo',
        'Buy now',
        'Contact sales',
      ],
      avoidances: [
        'Vague benefits',
        'Missing pricing',
        'Weak CTAs',
        'No social proof',
        'Excessive information',
      ],
    },
  };

  /**
   * Score content across all purchase stages
   */
  scoreContent(content: SegmentMatchInput): PurchaseStageScore {
    const contentText = `${content.title || ''} ${content.content}`.toLowerCase();

    // Calculate scores for each stage
    const stageScores: Record<PurchaseStage, number> = {
      awareness: this.calculateStageScore(contentText, 'awareness'),
      consideration: this.calculateStageScore(contentText, 'consideration'),
      decision: this.calculateStageScore(contentText, 'decision'),
    };

    // Determine primary stage (highest score)
    const detectedStage = this.getPrimaryStage(stageScores);

    // Find matching indicators
    const indicators = this.findMatchingIndicators(contentText);

    // Generate recommendations
    const recommendations = this.generateRecommendations(detectedStage, stageScores, contentText);

    // Calculate confidence
    const confidence = this.calculateConfidence(stageScores, indicators.length);

    return {
      contentId: content.title || 'unknown',
      detectedStage,
      stageScores,
      confidence,
      indicators,
      recommendations,
    };
  }

  /**
   * Get content guidelines for a specific stage
   */
  getGuidelines(stage: PurchaseStage): StageContentGuidelines {
    return this.stageGuidelines[stage];
  }

  /**
   * Get all stage guidelines
   */
  getAllGuidelines(): StageContentGuidelines[] {
    return Object.values(this.stageGuidelines);
  }

  /**
   * Recommend stage transition
   */
  recommendTransition(
    currentStage: PurchaseStage,
    desiredStage: PurchaseStage,
    content: SegmentMatchInput
  ): StageTransitionRecommendation {
    const requiredChanges: string[] = [];
    const fromGuidelines = this.stageGuidelines[currentStage];
    const toGuidelines = this.stageGuidelines[desiredStage];

    // Determine what needs to change
    if (desiredStage === 'consideration' && currentStage === 'awareness') {
      requiredChanges.push('Add solution comparisons and alternatives');
      requiredChanges.push('Highlight specific features and benefits');
      requiredChanges.push('Include use cases or examples');
      requiredChanges.push('Update CTA to "See how it works" or "View demo"');
    }

    if (desiredStage === 'decision' && currentStage === 'consideration') {
      requiredChanges.push('Add pricing information or pricing CTA');
      requiredChanges.push('Include testimonials and case studies');
      requiredChanges.push('Add social proof (reviews, ratings, logos)');
      requiredChanges.push('Create urgency with time-limited offers');
      requiredChanges.push('Update CTA to "Start trial" or "Get quote"');
    }

    if (desiredStage === 'decision' && currentStage === 'awareness') {
      requiredChanges.push('Skip awareness phase - move to solution-focused content');
      requiredChanges.push('Add comprehensive feature showcase');
      requiredChanges.push('Include multiple forms of social proof');
      requiredChanges.push('Present clear pricing and value proposition');
      requiredChanges.push('Use decision-focused CTAs');
    }

    return {
      from: currentStage,
      to: desiredStage,
      reasoning: `Transitioning from ${currentStage} to ${desiredStage} requires shifting focus from ${fromGuidelines.characteristics[0]} to ${toGuidelines.characteristics[0]}`,
      requiredChanges,
      confidence: requiredChanges.length > 0 ? 85 : 50,
    };
  }

  /**
   * Validate content for specific stage
   */
  validateForStage(content: SegmentMatchInput, targetStage: PurchaseStage): {
    isValid: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const score = this.scoreContent(content);
    const stageScore = score.stageScores[targetStage];
    const issues: string[] = [];
    const suggestions: string[] = [];

    const guidelines = this.stageGuidelines[targetStage];

    // Check for common issues
    const contentLower = `${content.title || ''} ${content.content}`.toLowerCase();

    // Check avoidances
    for (const avoidance of guidelines.avoidances) {
      const avoidKeywords = avoidance.toLowerCase().split(' ');
      if (avoidKeywords.some(kw => contentLower.includes(kw))) {
        issues.push(`Contains "${avoidance}" which should be avoided for ${targetStage} stage`);
      }
    }

    // Check for recommended CTAs
    const hasCTA = guidelines.callToActions.some(cta =>
      contentLower.includes(cta.toLowerCase())
    );
    if (!hasCTA) {
      suggestions.push(`Add a ${targetStage}-appropriate CTA like "${guidelines.callToActions[0]}"`);
    }

    return {
      isValid: stageScore >= 60 && issues.length === 0,
      score: stageScore,
      issues,
      suggestions,
    };
  }

  // Private helper methods

  private calculateStageScore(contentText: string, stage: PurchaseStage): number {
    const indicator = this.stageIndicators[stage];
    let score = 0;
    let matchCount = 0;

    // Check keywords
    for (const keyword of indicator.keywords) {
      if (contentText.includes(keyword.toLowerCase())) {
        score += 5;
        matchCount++;
      }
    }

    // Check patterns
    for (const pattern of indicator.patterns) {
      if (pattern.test(contentText)) {
        score += 10;
        matchCount++;
      }
    }

    // Normalize to 0-100
    const maxScore = indicator.keywords.length * 5 + indicator.patterns.length * 10;
    const normalizedScore = (score / maxScore) * 100;

    // Boost if multiple matches
    const matchBonus = Math.min(matchCount * 2, 20);

    return Math.min(normalizedScore + matchBonus, 100);
  }

  private getPrimaryStage(stageScores: Record<PurchaseStage, number>): PurchaseStage {
    let maxScore = 0;
    let primaryStage: PurchaseStage = 'awareness';

    for (const [stage, score] of Object.entries(stageScores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryStage = stage as PurchaseStage;
      }
    }

    return primaryStage;
  }

  private findMatchingIndicators(contentText: string): {
    stage: PurchaseStage;
    indicator: string;
    weight: number;
  }[] {
    const matches: { stage: PurchaseStage; indicator: string; weight: number }[] = [];

    for (const [stage, indicator] of Object.entries(this.stageIndicators)) {
      // Check keywords
      for (const keyword of indicator.keywords) {
        if (contentText.includes(keyword.toLowerCase())) {
          matches.push({
            stage: stage as PurchaseStage,
            indicator: keyword,
            weight: 5,
          });
        }
      }

      // Check patterns
      for (const pattern of indicator.patterns) {
        const match = contentText.match(pattern);
        if (match) {
          matches.push({
            stage: stage as PurchaseStage,
            indicator: match[0],
            weight: 10,
          });
        }
      }
    }

    return matches;
  }

  private generateRecommendations(
    detectedStage: PurchaseStage,
    stageScores: Record<PurchaseStage, number>,
    contentText: string
  ): PurchaseStageScore['recommendations'] {
    const recommendations: PurchaseStageScore['recommendations'] = [];
    const guidelines = this.stageGuidelines[detectedStage];

    // Base recommendation for current stage
    recommendations.push({
      currentStage: detectedStage,
      suggestion: `Content is ${detectedStage}-stage focused. ${guidelines.characteristics[0]}.`,
      examples: guidelines.callToActions.slice(0, 3),
    });

    // If score is not strong for detected stage, suggest improvements
    if (stageScores[detectedStage] < 70) {
      recommendations.push({
        currentStage: detectedStage,
        suggestion: `Strengthen ${detectedStage}-stage signals by emphasizing ${guidelines.characteristics[1]}`,
        examples: guidelines.contentTypes.slice(0, 2),
      });
    }

    // Suggest next stage if appropriate
    const stageProgression: Record<PurchaseStage, PurchaseStage | null> = {
      awareness: 'consideration',
      consideration: 'decision',
      decision: null,
    };

    const nextStage = stageProgression[detectedStage];
    if (nextStage) {
      const nextGuidelines = this.stageGuidelines[nextStage];
      recommendations.push({
        currentStage: nextStage,
        suggestion: `To move prospects to ${nextStage} stage, add ${nextGuidelines.characteristics[0]}`,
        examples: nextGuidelines.contentTypes.slice(0, 2),
      });
    }

    return recommendations;
  }

  private calculateConfidence(
    stageScores: Record<PurchaseStage, number>,
    indicatorCount: number
  ): number {
    const scores = Object.values(stageScores);
    const maxScore = Math.max(...scores);
    const secondMaxScore = scores.sort((a, b) => b - a)[1] || 0;

    // High confidence if one stage clearly dominates
    const scoreSeparation = maxScore - secondMaxScore;

    // Base confidence on score separation and indicator count
    let confidence = 50;

    if (scoreSeparation > 30) confidence += 30;
    else if (scoreSeparation > 20) confidence += 20;
    else if (scoreSeparation > 10) confidence += 10;

    if (indicatorCount > 5) confidence += 20;
    else if (indicatorCount > 3) confidence += 10;

    return Math.min(confidence, 100);
  }
}

// Singleton instance
export const purchaseStageScorerService = new PurchaseStageScorerService();
