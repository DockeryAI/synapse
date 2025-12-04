/**
 * Breakthrough Validator
 *
 * Validates breakthrough insights using 5 quality checks:
 * 1. Unexpectedness - Is it truly surprising?
 * 2. Truthfulness - Is it backed by evidence?
 * 3. Actionability - Can we create content today?
 * 4. Relevance - Does it matter to the audience?
 * 5. Authenticity - Is the connection genuine?
 *
 * Created: 2025-11-10
 */

import {
  BreakthroughInsight,
  ValidationCheck,
  ValidationResult
} from '../../../types/breakthrough.types';
import { DeepContext } from '../../../types/deepContext.types';

export class BreakthroughValidator {
  /**
   * Validate a single insight
   */
  async validate(
    insight: BreakthroughInsight,
    context?: DeepContext
  ): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];

    // Run all validation checks
    checks.push(await this.checkUnexpectedness(insight, context));
    checks.push(await this.checkTruthfulness(insight, context));
    checks.push(await this.checkActionability(insight));
    checks.push(await this.checkRelevance(insight, context));
    checks.push(await this.checkAuthenticity(insight));

    // Calculate overall score (average of all checks)
    const scores = checks.map(c => c.score);
    const overallScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Collect failures
    const failures = checks.filter(c => !c.passed);
    const reasons = failures.map(f => f.reason || 'Unknown failure');

    // Generate suggestions
    const suggestions = this.generateSuggestions(checks, insight);

    return {
      valid: failures.length === 0 && overallScore >= 0.6,
      insight,
      checks,
      score: overallScore,
      reasons,
      suggestions
    };
  }

  /**
   * Validate multiple insights
   */
  async validateAll(
    insights: BreakthroughInsight[],
    context?: DeepContext
  ): Promise<ValidationResult[]> {
    console.log(`[BreakthroughValidator] Validating ${insights.length} insights...`);

    const results = await Promise.all(
      insights.map(insight => this.validate(insight, context))
    );

    const validCount = results.filter(r => r.valid).length;
    console.log(`[BreakthroughValidator] ${validCount}/${insights.length} insights passed validation`);

    return results;
  }

  /**
   * CHECK 1: Unexpectedness
   * Is this insight truly surprising?
   */
  private async checkUnexpectedness(
    insight: BreakthroughInsight,
    context?: DeepContext
  ): Promise<ValidationCheck> {
    let score = 0.5; // Start neutral

    const insightLower = insight.insight.toLowerCase();
    const contentAngleLower = insight.contentAngle.toLowerCase();

    // Positive signals (increase score)
    const unexpectedWords = [
      'unexpected', 'surprising', 'counter', 'opposite', 'contrary',
      'hidden', 'secret', 'missed', 'overlooked', 'paradox'
    ];

    const hasUnexpectedLanguage = unexpectedWords.some(word =>
      insightLower.includes(word) || contentAngleLower.includes(word)
    );

    if (hasUnexpectedLanguage) score += 0.2;

    // Check if it references multiple disparate domains
    const domains = [
      insight.sourceConnection?.sources.primary.metadata.domain,
      insight.sourceConnection?.sources.secondary.metadata.domain,
      insight.sourceConnection?.sources.tertiary?.metadata.domain
    ].filter(d => d);

    const uniqueDomains = new Set(domains).size;
    if (uniqueDomains >= 2) score += 0.2;
    if (uniqueDomains >= 3) score += 0.1;

    // Negative signals (decrease score)
    const obviousWords = [
      'obviously', 'clearly', 'naturally', 'of course',
      'as expected', 'predictably', 'typical'
    ];

    const hasObviousLanguage = obviousWords.some(word =>
      insightLower.includes(word)
    );

    if (hasObviousLanguage) score -= 0.3;

    // Check for generic insights
    const genericPhrases = [
      'be authentic', 'provide value', 'engage with customers',
      'create quality content', 'build trust', 'be consistent'
    ];

    const isGeneric = genericPhrases.some(phrase =>
      insightLower.includes(phrase)
    );

    if (isGeneric) score -= 0.4;

    score = Math.max(0, Math.min(1, score));

    return {
      name: 'unexpectedness',
      passed: score >= 0.6,
      score,
      reason: score < 0.6 ? 'Insight is not unexpected enough or seems too obvious' : undefined,
      details: {
        hasUnexpectedLanguage,
        uniqueDomains,
        hasObviousLanguage,
        isGeneric
      }
    };
  }

  /**
   * CHECK 2: Truthfulness
   * Is this backed by evidence?
   */
  private async checkTruthfulness(
    insight: BreakthroughInsight,
    context?: DeepContext
  ): Promise<ValidationCheck> {
    let score = 0.0;

    // Check evidence quantity
    const evidenceCount = insight.evidence.length;
    if (evidenceCount >= 3) score += 0.4;
    else if (evidenceCount >= 2) score += 0.25;
    else if (evidenceCount >= 1) score += 0.1;

    // Check evidence quality (length and specificity)
    const avgEvidenceLength = insight.evidence.reduce((sum, e) => sum + e.length, 0) / (evidenceCount || 1);
    if (avgEvidenceLength > 50) score += 0.2; // Specific evidence

    // Check confidence
    if (insight.confidence >= 0.8) score += 0.2;
    else if (insight.confidence >= 0.7) score += 0.1;
    else if (insight.confidence < 0.5) score -= 0.2;

    // Check if connected to discovered data
    if (insight.sourceConnection) {
      score += 0.2; // Grounded in Connection Discovery Engine data
    }

    score = Math.max(0, Math.min(1, score));

    return {
      name: 'truthfulness',
      passed: score >= 0.6,
      score,
      reason: score < 0.6 ? 'Insufficient evidence or low confidence' : undefined,
      details: {
        evidenceCount,
        avgEvidenceLength,
        confidence: insight.confidence,
        hasSourceConnection: !!insight.sourceConnection
      }
    };
  }

  /**
   * CHECK 3: Actionability
   * Can we create content today?
   */
  private async checkActionability(insight: BreakthroughInsight): Promise<ValidationCheck> {
    let score = 0.5; // Start neutral

    const contentAngle = insight.contentAngle.toLowerCase();

    // Check for specific content angle
    if (contentAngle.length > 20) score += 0.2; // Not too vague

    // Check for actionable language
    const actionableWords = [
      'create', 'write', 'post', 'share', 'publish',
      'how to', 'guide', 'template', 'framework'
    ];

    const hasActionableLanguage = actionableWords.some(word =>
      contentAngle.includes(word)
    );

    if (hasActionableLanguage) score += 0.2;

    // Check for vague language
    const vagueWords = [
      'maybe', 'possibly', 'might want to', 'could consider',
      'think about', 'explore'
    ];

    const hasVagueLanguage = vagueWords.some(word =>
      contentAngle.includes(word)
    );

    if (hasVagueLanguage) score -= 0.3;

    // Check whyNow for timeliness
    if (insight.whyNow.toLowerCase().includes('now') ||
        insight.whyNow.toLowerCase().includes('immediate') ||
        insight.whyNow.toLowerCase().includes('today') ||
        insight.whyNow.toLowerCase().includes('this week')) {
      score += 0.1;
    }

    score = Math.max(0, Math.min(1, score));

    return {
      name: 'actionability',
      passed: score >= 0.6,
      score,
      reason: score < 0.6 ? 'Content angle is too vague or not immediately actionable' : undefined,
      details: {
        contentAngleLength: insight.contentAngle.length,
        hasActionableLanguage,
        hasVagueLanguage,
        whyNow: insight.whyNow
      }
    };
  }

  /**
   * CHECK 4: Relevance
   * Does it matter to the audience?
   */
  private async checkRelevance(
    insight: BreakthroughInsight,
    context?: DeepContext
  ): Promise<ValidationCheck> {
    let score = 0.5; // Start neutral

    // Check if insight addresses pain points
    if (context?.realTimeCultural?.painPoints) {
      const painPointTopics = context.realTimeCultural.painPoints.map(p =>
        p.painPoint.toLowerCase()
      );

      const insightLower = insight.insight.toLowerCase();
      const addressesPainPoint = painPointTopics.some(topic =>
        insightLower.includes(topic.split(' ').slice(0, 3).join(' '))
      );

      if (addressesPainPoint) score += 0.3;
    }

    // Check if insight addresses trending topics
    if (context?.realTimeCultural?.trendingTopics) {
      const trendingKeywords = context.realTimeCultural.trendingTopics
        .slice(0, 10)
        .map(t => t.topic.toLowerCase());

      const insightLower = insight.insight.toLowerCase();
      const addressesTrending = trendingKeywords.some(keyword =>
        insightLower.includes(keyword.split(' ')[0])
      );

      if (addressesTrending) score += 0.2;
    }

    // Check expected reaction
    const reactionLower = insight.expectedReaction.toLowerCase();
    const positiveReactions = [
      'interest', 'engage', 'share', 'discuss', 'debate',
      'surprise', 'intrigu', 'curious', 'want to know'
    ];

    const hasPositiveReaction = positiveReactions.some(word =>
      reactionLower.includes(word)
    );

    if (hasPositiveReaction) score += 0.2;

    // Check whyProfound for value proposition
    if (insight.whyProfound.length > 30) {
      score += 0.1; // Has substance
    }

    score = Math.max(0, Math.min(1, score));

    return {
      name: 'relevance',
      passed: score >= 0.6,
      score,
      reason: score < 0.6 ? 'Insight may not be relevant to target audience' : undefined,
      details: {
        hasPositiveReaction,
        whyProfoundLength: insight.whyProfound.length
      }
    };
  }

  /**
   * CHECK 5: Authenticity
   * Is the connection genuine (not forced)?
   */
  private async checkAuthenticity(insight: BreakthroughInsight): Promise<ValidationCheck> {
    let score = 0.5; // Start neutral

    const insightLower = insight.insight.toLowerCase();
    const contentAngleLower = insight.contentAngle.toLowerCase();

    // Check for forced/gimmicky language
    const forcedWords = [
      'leveraging', 'synergy', 'paradigm', 'disrupt',
      'game-changer', 'revolutionary', 'transform'
    ];

    const hasForcedLanguage = forcedWords.some(word =>
      insightLower.includes(word) || contentAngleLower.includes(word)
    );

    if (hasForcedLanguage) score -= 0.3;

    // Check for natural connection language
    const naturalWords = [
      'because', 'similar to', 'like', 'just as',
      'reminds', 'reflects', 'mirrors', 'echoes'
    ];

    const hasNaturalLanguage = naturalWords.some(word =>
      insightLower.includes(word)
    );

    if (hasNaturalLanguage) score += 0.2;

    // Check for specific examples (indicates authenticity)
    const hasSpecificExample = insight.evidence.some(e => e.length > 40);
    if (hasSpecificExample) score += 0.2;

    // Check confidence (authentic insights have high confidence)
    if (insight.confidence >= 0.75) score += 0.1;

    score = Math.max(0, Math.min(1, score));

    return {
      name: 'authenticity',
      passed: score >= 0.6,
      score,
      reason: score < 0.6 ? 'Connection feels forced or inauthentic' : undefined,
      details: {
        hasForcedLanguage,
        hasNaturalLanguage,
        hasSpecificExample,
        confidence: insight.confidence
      }
    };
  }

  /**
   * Generate improvement suggestions based on validation results
   */
  private generateSuggestions(
    checks: ValidationCheck[],
    insight: BreakthroughInsight
  ): string[] {
    const suggestions: string[] = [];

    for (const check of checks) {
      if (!check.passed) {
        switch (check.name) {
          case 'unexpectedness':
            suggestions.push('Make the insight more surprising by highlighting the unexpected connection');
            suggestions.push('Avoid obvious or generic statements');
            break;
          case 'truthfulness':
            suggestions.push('Add more specific evidence to back up the claim');
            suggestions.push('Increase confidence by grounding in data');
            break;
          case 'actionability':
            suggestions.push('Make the content angle more specific and immediate');
            suggestions.push('Remove vague language and add clear next steps');
            break;
          case 'relevance':
            suggestions.push('Connect more directly to customer pain points or trending topics');
            suggestions.push('Clarify why this matters to the target audience');
            break;
          case 'authenticity':
            suggestions.push('Remove forced or gimmicky language');
            suggestions.push('Add specific examples to make the connection feel more natural');
            break;
        }
      }
    }

    return suggestions;
  }

  /**
   * Filter to only valid insights
   */
  filterValid(results: ValidationResult[]): BreakthroughInsight[] {
    return results
      .filter(r => r.valid)
      .map(r => r.insight);
  }
}
