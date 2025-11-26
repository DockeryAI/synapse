/**
 * Framework Selector Service
 *
 * Analyzes data patterns and selects the best content framework from ContentFrameworkLibrary.
 * Ensures all content generation routes through proven frameworks (AIDA, PAS, BAB, etc.)
 *
 * Part of Content Fix Phase 1: Framework Integration Core
 */

import {
  type FrameworkType,
  type ContentFramework,
  type ContentChannel,
  type ContentGoal,
  frameworkLibrary
} from '@/services/synapse/generation/ContentFrameworkLibrary';

import type { DataPoint } from '@/types/connections.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Detected data pattern from analysis
 */
export interface DataPattern {
  type: 'problem' | 'desire' | 'comparison' | 'urgency' | 'transformation';
  confidence: number; // 0-1
  keywords: string[];
  sentimentBias?: 'positive' | 'negative' | 'mixed';
}

/**
 * Framework with compatibility score
 */
export interface FrameworkScore {
  framework: ContentFramework;
  score: number; // 0-100
  reasoning: string;
}

/**
 * Result of framework selection
 */
export interface FrameworkSelectionResult {
  selected: ContentFramework;
  alternatives: ContentFramework[];
  confidence: number; // 0-1
  reasoning: string;
  dataPattern: DataPattern;
}

// ============================================================================
// PATTERN DETECTION KEYWORDS
// ============================================================================

const PATTERN_KEYWORDS = {
  problem: [
    'problem', 'issue', 'struggle', 'pain', 'difficult', 'hard', 'frustrat',
    'complaint', 'fail', 'broken', 'wrong', 'bad', 'terrible', 'awful',
    'disappoint', 'annoying', 'slow', 'expensive', 'overpriced', 'long wait',
    'never', 'always late', 'rude', 'unprofessional', 'dirty', 'crowded',
    'confusion', 'unclear', 'complicated', 'waste', 'missing', 'lack'
  ],
  desire: [
    'want', 'wish', 'hope', 'dream', 'love', 'amazing', 'excellent', 'perfect',
    'great', 'wonderful', 'fantastic', 'best', 'favorite', 'recommend',
    'impressed', 'delight', 'enjoy', 'appreciate', 'satisfied', 'happy',
    'opportunity', 'potential', 'growth', 'success', 'achieve', 'aspire',
    'looking for', 'need', 'seek', 'prefer', 'ideal', 'must have'
  ],
  comparison: [
    'vs', 'versus', 'compared to', 'better than', 'worse than', 'instead of',
    'rather than', 'used to', 'before', 'after', 'now', 'then', 'previous',
    'old way', 'new way', 'transform', 'change', 'switch', 'alternative',
    'different from', 'unlike', 'similar to', 'contrast', 'difference'
  ],
  urgency: [
    'now', 'today', 'tonight', 'this week', 'this weekend', 'soon', 'quickly',
    'fast', 'immediate', 'urgent', 'hurry', 'limited', 'deadline', 'last chance',
    'ending', 'final', 'closing', 'seasonal', 'trending', 'viral', 'hot',
    'breaking', 'new', 'latest', 'just', 'recently', 'current', 'happening'
  ],
  transformation: [
    'transform', 'change', 'improve', 'better', 'upgrade', 'enhance', 'evolve',
    'results', 'outcome', 'achievement', 'success', 'progress', 'growth',
    'before and after', 'went from', 'became', 'turned into', 'developed',
    'increased', 'decreased', 'solved', 'fixed', 'resolved', 'journey'
  ]
};

// ============================================================================
// FRAMEWORK SELECTOR SERVICE
// ============================================================================

class FrameworkSelector {
  /**
   * Analyze data points to detect dominant pattern
   */
  analyzeDataPattern(dataPoints: DataPoint[]): DataPattern {
    console.log(`[FrameworkSelector] Analyzing pattern from ${dataPoints.length} data points...`);

    if (dataPoints.length === 0) {
      return {
        type: 'desire',
        confidence: 0.3,
        keywords: [],
        sentimentBias: 'mixed'
      };
    }

    // Combine all content for analysis
    const allContent = dataPoints
      .map(dp => dp.content?.toLowerCase() || '')
      .join(' ');

    // Count keyword matches for each pattern type
    const patternScores: Record<string, { count: number; keywords: string[] }> = {
      problem: { count: 0, keywords: [] },
      desire: { count: 0, keywords: [] },
      comparison: { count: 0, keywords: [] },
      urgency: { count: 0, keywords: [] },
      transformation: { count: 0, keywords: [] }
    };

    // Check each pattern type
    for (const [patternType, keywords] of Object.entries(PATTERN_KEYWORDS)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}`, 'gi');
        const matches = allContent.match(regex);
        if (matches) {
          patternScores[patternType].count += matches.length;
          if (!patternScores[patternType].keywords.includes(keyword)) {
            patternScores[patternType].keywords.push(keyword);
          }
        }
      }
    }

    // Calculate sentiment bias
    const negativeCount = patternScores.problem.count;
    const positiveCount = patternScores.desire.count;
    let sentimentBias: 'positive' | 'negative' | 'mixed' = 'mixed';

    if (negativeCount > positiveCount * 1.5) {
      sentimentBias = 'negative';
    } else if (positiveCount > negativeCount * 1.5) {
      sentimentBias = 'positive';
    }

    // Find dominant pattern
    const sortedPatterns = Object.entries(patternScores)
      .sort((a, b) => b[1].count - a[1].count);

    const dominantPattern = sortedPatterns[0];
    const totalMatches = sortedPatterns.reduce((sum, [_, data]) => sum + data.count, 0);

    // Calculate confidence based on how dominant the pattern is
    const confidence = totalMatches > 0
      ? Math.min(dominantPattern[1].count / totalMatches, 1.0)
      : 0.3;

    const pattern: DataPattern = {
      type: dominantPattern[0] as DataPattern['type'],
      confidence,
      keywords: dominantPattern[1].keywords.slice(0, 5), // Top 5 keywords
      sentimentBias
    };

    console.log(`[FrameworkSelector] Detected pattern:`, {
      type: pattern.type,
      confidence: pattern.confidence.toFixed(2),
      keywords: pattern.keywords.length,
      sentiment: pattern.sentimentBias
    });

    return pattern;
  }

  /**
   * Score how compatible a framework is with the detected pattern
   */
  scoreFrameworkCompatibility(
    pattern: DataPattern,
    framework: ContentFramework
  ): number {
    let score = 0;

    // Base score from framework's focus metrics
    const baseScore = (framework.conversionFocus + framework.engagementFocus) * 50;
    score += baseScore;

    // Pattern-specific bonuses
    switch (pattern.type) {
      case 'problem':
        // PAS (Problem-Agitate-Solution) is perfect for problems
        if (framework.id === 'problem-agitate-solution' || framework.id === 'email-pas') {
          score += 30;
        }
        // PASTOR also good for problems
        if (framework.id === 'landing-pastor') {
          score += 20;
        }
        break;

      case 'desire':
        // AIDA is perfect for building desire
        if (framework.id === 'aida' || framework.id === 'email-aida') {
          score += 30;
        }
        // Hook-Story-Offer also good
        if (framework.id === 'hook-story-offer') {
          score += 20;
        }
        break;

      case 'comparison':
        // Before-After-Bridge is perfect for comparisons
        if (framework.id === 'before-after-bridge') {
          score += 35;
        }
        break;

      case 'urgency':
        // Hook-Story-Offer is great for urgency
        if (framework.id === 'hook-story-offer') {
          score += 30;
        }
        // AIDA also works for urgent calls-to-action
        if (framework.id === 'aida') {
          score += 20;
        }
        break;

      case 'transformation':
        // Before-After-Bridge is perfect for transformations
        if (framework.id === 'before-after-bridge') {
          score += 35;
        }
        // Story-based frameworks also good
        if (framework.id === 'hook-story-offer' || framework.id === 'email-story') {
          score += 20;
        }
        break;
    }

    // Boost for social media frameworks (most relevant for synapses)
    if (framework.channel === 'social') {
      score += 10;
    }

    // Confidence adjustment
    score *= pattern.confidence;

    return Math.min(score, 100);
  }

  /**
   * Select best framework based on data points
   */
  selectBestFramework(
    dataPoints: DataPoint[],
    channel: ContentChannel = 'social',
    goal: ContentGoal = 'engagement'
  ): FrameworkSelectionResult {
    console.log(`[FrameworkSelector] Selecting framework for ${dataPoints.length} data points (channel: ${channel}, goal: ${goal})`);

    // Analyze data pattern
    const dataPattern = this.analyzeDataPattern(dataPoints);

    // Get all frameworks for the channel
    const channelFrameworks = frameworkLibrary.getFrameworksByChannel(channel);

    if (channelFrameworks.length === 0) {
      throw new Error(`No frameworks available for channel: ${channel}`);
    }

    // Score all frameworks
    const scoredFrameworks: FrameworkScore[] = channelFrameworks.map(framework => {
      const score = this.scoreFrameworkCompatibility(dataPattern, framework);

      let reasoning = `Pattern is ${dataPattern.type}-focused`;
      if (dataPattern.sentimentBias) {
        reasoning += ` (${dataPattern.sentimentBias} sentiment)`;
      }
      reasoning += `, framework emphasizes ${framework.description.toLowerCase()}`;

      return {
        framework,
        score,
        reasoning
      };
    });

    // Sort by score descending
    scoredFrameworks.sort((a, b) => b.score - a.score);

    const selected = scoredFrameworks[0].framework;
    const alternatives = scoredFrameworks.slice(1, 3).map(s => s.framework);

    // Build comprehensive reasoning
    let reasoning = `Selected **${selected.name}** because data shows ${dataPattern.type} pattern`;
    if (dataPattern.keywords.length > 0) {
      reasoning += ` (keywords: ${dataPattern.keywords.slice(0, 3).join(', ')})`;
    }
    reasoning += `. This framework is best for: ${selected.bestFor.join(', ')}.`;

    const result: FrameworkSelectionResult = {
      selected,
      alternatives,
      confidence: dataPattern.confidence,
      reasoning,
      dataPattern
    };

    console.log(`[FrameworkSelector] ✓ Selected: ${selected.name} (confidence: ${dataPattern.confidence.toFixed(2)})`);

    return result;
  }

  /**
   * Generate human-readable explanation of framework selection
   */
  explainSelection(result: FrameworkSelectionResult): string {
    const { selected, confidence, dataPattern } = result;

    let explanation = `**Framework Selected: ${selected.name}**\n\n`;
    explanation += `**Confidence**: ${(confidence * 100).toFixed(0)}%\n\n`;
    explanation += `**Pattern Detected**: ${dataPattern.type}\n`;

    if (dataPattern.keywords.length > 0) {
      explanation += `**Key Indicators**: ${dataPattern.keywords.join(', ')}\n`;
    }

    if (dataPattern.sentimentBias) {
      explanation += `**Sentiment**: ${dataPattern.sentimentBias}\n`;
    }

    explanation += `\n**Why This Framework**: ${result.reasoning}\n\n`;

    explanation += `**Framework Stages**:\n`;
    for (const stage of selected.stages) {
      explanation += `- **${stage.name}**: ${stage.purpose}\n`;
    }

    if (result.alternatives.length > 0) {
      explanation += `\n**Alternative Frameworks**: ${result.alternatives.map(f => f.name).join(', ')}`;
    }

    return explanation;
  }
}

// Export singleton instance
export const frameworkSelector = new FrameworkSelector();
