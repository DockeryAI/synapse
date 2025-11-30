/**
 * Triggers-Trend Matcher Service
 *
 * Phase 6 of Trends 2.0 Build Plan
 * Auto-matches trends with customer triggers for content angle generation.
 *
 * Output: "Trend + Trigger + Suggested Hook" cards with one-click content generation.
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { LifecycleTrend } from './trend-lifecycle-detector.service';
import type { PsychologicalTrigger } from './eq-trend-prioritizer.service';

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerTrigger {
  id: string;
  /** The pain point or desire */
  statement: string;
  /** Trigger type */
  type: 'pain_point' | 'desire' | 'fear' | 'aspiration' | 'frustration';
  /** Source of this trigger */
  source: 'uvp' | 'reviews' | 'reddit' | 'youtube';
  /** Emotional intensity (0-100) */
  intensity: number;
}

export interface TrendTriggerMatch {
  trend: LifecycleTrend;
  trigger: CustomerTrigger;
  /** Match strength (0-100) */
  matchStrength: number;
  /** Keywords that connected the match */
  connectingKeywords: string[];
  /** Generated content hook */
  suggestedHook: string;
  /** Content angles based on match */
  contentAngles: ContentAngle[];
}

export interface ContentAngle {
  /** Angle type */
  type: 'educational' | 'emotional' | 'social_proof' | 'urgency' | 'authority';
  /** The angle headline */
  headline: string;
  /** Brief description */
  description: string;
  /** Recommended platform */
  platforms: ('linkedin' | 'instagram' | 'facebook' | 'twitter' | 'blog')[];
}

export interface TrendWithMatches extends LifecycleTrend {
  /** Matched triggers */
  triggerMatches: TrendTriggerMatch[];
  /** Best match (highest strength) */
  bestMatch: TrendTriggerMatch | null;
  /** Content-ready indicator */
  isContentReady: boolean;
}

// ============================================================================
// TRIGGER EXTRACTION FROM UVP
// ============================================================================

/**
 * Extract customer triggers from UVP data
 */
export function extractTriggersFromUVP(uvp: CompleteUVP): CustomerTrigger[] {
  const triggers: CustomerTrigger[] = [];
  let idCounter = 0;

  // Extract from emotional drivers
  if (uvp.transformationGoal?.emotionalDrivers) {
    uvp.transformationGoal.emotionalDrivers.forEach(driver => {
      triggers.push({
        id: `uvp-emotional-${idCounter++}`,
        statement: driver,
        type: driver.toLowerCase().includes('fear') ? 'fear' : 'desire',
        source: 'uvp',
        intensity: 75
      });
    });
  }

  // Extract from functional drivers
  if (uvp.transformationGoal?.functionalDrivers) {
    uvp.transformationGoal.functionalDrivers.forEach(driver => {
      triggers.push({
        id: `uvp-functional-${idCounter++}`,
        statement: driver,
        type: 'pain_point',
        source: 'uvp',
        intensity: 70
      });
    });
  }

  // Extract from transformation "before" state
  if (uvp.transformationGoal?.before) {
    triggers.push({
      id: `uvp-before-${idCounter++}`,
      statement: uvp.transformationGoal.before,
      type: 'frustration',
      source: 'uvp',
      intensity: 80
    });
  }

  // Extract from transformation "after" state
  if (uvp.transformationGoal?.after) {
    triggers.push({
      id: `uvp-after-${idCounter++}`,
      statement: uvp.transformationGoal.after,
      type: 'aspiration',
      source: 'uvp',
      intensity: 85
    });
  }

  // Extract from customer quotes
  if (uvp.transformationGoal?.customerQuotes) {
    uvp.transformationGoal.customerQuotes.forEach(quote => {
      triggers.push({
        id: `uvp-quote-${idCounter++}`,
        statement: quote.text,
        type: quote.emotionalWeight > 50 ? 'desire' : 'pain_point',
        source: 'uvp',
        intensity: Math.min(100, quote.emotionalWeight + 20)
      });
    });
  }

  // Extract from key benefit
  if (uvp.keyBenefit?.statement) {
    triggers.push({
      id: `uvp-benefit-${idCounter++}`,
      statement: uvp.keyBenefit.statement,
      type: 'aspiration',
      source: 'uvp',
      intensity: 90
    });
  }

  return triggers;
}

// ============================================================================
// TREND-TRIGGER MATCHING
// ============================================================================

/**
 * Tokenize text for matching
 */
function tokenize(text: string): Set<string> {
  if (!text) return new Set();

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'this', 'that', 'these', 'those',
    'i', 'you', 'we', 'they', 'it', 'its', 'your', 'our', 'their', 'my'
  ]);

  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  );
}

/**
 * Calculate match strength between trend and trigger
 */
function calculateMatchStrength(
  trend: LifecycleTrend,
  trigger: CustomerTrigger
): { strength: number; keywords: string[] } {
  const trendTokens = tokenize(`${trend.title} ${trend.description}`);
  const triggerTokens = tokenize(trigger.statement);

  // Find overlapping keywords
  const connectingKeywords: string[] = [];
  triggerTokens.forEach(token => {
    if (trendTokens.has(token)) {
      connectingKeywords.push(token);
    }
  });

  // Also check for 2-word phrases
  const trendText = `${trend.title} ${trend.description}`.toLowerCase();
  const triggerWords = Array.from(triggerTokens);
  for (let i = 0; i < triggerWords.length - 1; i++) {
    const phrase = `${triggerWords[i]} ${triggerWords[i + 1]}`;
    if (trendText.includes(phrase)) {
      connectingKeywords.push(phrase);
    }
  }

  if (connectingKeywords.length === 0) {
    return { strength: 0, keywords: [] };
  }

  // Calculate strength based on:
  // 1. Keyword overlap ratio
  const overlapRatio = connectingKeywords.length / triggerTokens.size;

  // 2. Trigger type alignment with trend trigger
  let typeBonus = 0;
  const triggerTypeMap: Record<string, PsychologicalTrigger[]> = {
    pain_point: ['fear', 'practical'],
    desire: ['desire', 'curiosity'],
    fear: ['fear', 'urgency'],
    aspiration: ['desire', 'trust'],
    frustration: ['fear', 'practical', 'urgency']
  };

  if (triggerTypeMap[trigger.type]?.includes(trend.primaryTrigger)) {
    typeBonus = 20;
  }

  // 3. Trigger intensity
  const intensityBonus = (trigger.intensity / 100) * 10;

  // 4. Trend validation bonus
  const validationBonus = trend.isValidated ? 10 : 0;

  const strength = Math.min(100, Math.round(
    overlapRatio * 60 + typeBonus + intensityBonus + validationBonus
  ));

  return {
    strength,
    keywords: [...new Set(connectingKeywords)]
  };
}

/**
 * Generate content hook from trend + trigger
 */
function generateHook(
  trend: LifecycleTrend,
  trigger: CustomerTrigger,
  keywords: string[]
): string {
  const templates: Record<string, string[]> = {
    pain_point: [
      `Struggling with ${keywords[0] || 'this challenge'}? Here's what's changing in ${trend.title}`,
      `If ${trigger.statement.substring(0, 50)}... you need to see this trend`,
      `The ${keywords[0] || 'industry'} pain point that ${trend.title.substring(0, 30)} finally solves`
    ],
    desire: [
      `Want to ${keywords[0] || 'achieve more'}? ${trend.title} shows the way`,
      `How ${trend.title.substring(0, 40)} is helping businesses ${trigger.statement.substring(0, 30)}`,
      `The trend that's making "${trigger.statement.substring(0, 40)}" a reality`
    ],
    fear: [
      `Don't let ${keywords[0] || 'this'} catch you off guard: ${trend.title}`,
      `Warning: ${trend.title.substring(0, 40)} - what you need to know`,
      `The ${keywords[0] || 'trend'} that's keeping industry leaders up at night`
    ],
    aspiration: [
      `Achieve ${keywords[0] || 'success'} with insights from ${trend.title}`,
      `How top performers are using ${trend.title.substring(0, 30)} to ${trigger.statement.substring(0, 30)}`,
      `Your path to ${trigger.statement.substring(0, 40)} just got clearer`
    ],
    frustration: [
      `Tired of ${keywords[0] || 'the same old'}? ${trend.title} changes everything`,
      `Finally: ${trend.title.substring(0, 40)} addresses the frustration of ${keywords[0] || 'many'}`,
      `The breakthrough that ends ${trigger.statement.substring(0, 40)}`
    ]
  };

  const typeTemplates = templates[trigger.type] || templates.pain_point;
  const randomIndex = Math.floor(Math.random() * typeTemplates.length);

  return typeTemplates[randomIndex];
}

/**
 * Generate content angles for a match
 */
function generateContentAngles(
  trend: LifecycleTrend,
  trigger: CustomerTrigger,
  keywords: string[]
): ContentAngle[] {
  const angles: ContentAngle[] = [];
  const topKeyword = keywords[0] || 'topic';

  // Educational angle
  angles.push({
    type: 'educational',
    headline: `What ${trend.title.substring(0, 40)} Means for Your ${topKeyword}`,
    description: `Break down the trend and provide actionable takeaways for your audience`,
    platforms: ['linkedin', 'blog']
  });

  // Emotional angle (based on trigger type)
  if (trigger.type === 'pain_point' || trigger.type === 'frustration') {
    angles.push({
      type: 'emotional',
      headline: `The End of ${topKeyword} Frustration is Here`,
      description: `Connect with the emotional pain and show how this trend offers relief`,
      platforms: ['instagram', 'facebook']
    });
  } else {
    angles.push({
      type: 'emotional',
      headline: `Imagine Finally Achieving ${topKeyword}`,
      description: `Paint the picture of success and connect to aspirations`,
      platforms: ['instagram', 'facebook']
    });
  }

  // Social proof angle
  if (trend.sourceCount >= 2) {
    angles.push({
      type: 'social_proof',
      headline: `Why Everyone's Talking About ${trend.title.substring(0, 30)}`,
      description: `Leverage the validation from multiple sources to show momentum`,
      platforms: ['linkedin', 'twitter']
    });
  }

  // Urgency angle (for emerging/peak trends)
  if (trend.lifecycle.stage === 'emerging' || trend.lifecycle.stage === 'peak') {
    angles.push({
      type: 'urgency',
      headline: `Act Now: ${trend.lifecycle.stageEmoji} ${trend.title.substring(0, 30)} Won't Wait`,
      description: `Create FOMO and encourage immediate action`,
      platforms: ['twitter', 'instagram']
    });
  }

  // Authority angle
  angles.push({
    type: 'authority',
    headline: `Our Take on ${trend.title.substring(0, 35)}`,
    description: `Position yourself as a thought leader with expert analysis`,
    platforms: ['linkedin', 'blog']
  });

  return angles;
}

// ============================================================================
// MAIN MATCHING FUNCTION
// ============================================================================

/**
 * Match all trends with customer triggers
 */
export function matchTrendsWithTriggers(
  trends: LifecycleTrend[],
  uvp: CompleteUVP,
  additionalTriggers: CustomerTrigger[] = []
): TrendWithMatches[] {
  // Extract triggers from UVP
  const uvpTriggers = extractTriggersFromUVP(uvp);
  const allTriggers = [...uvpTriggers, ...additionalTriggers];

  console.log(`[TriggersTrendMatcher] Matching ${trends.length} trends with ${allTriggers.length} triggers`);

  const trendsWithMatches: TrendWithMatches[] = trends.map(trend => {
    const triggerMatches: TrendTriggerMatch[] = [];

    allTriggers.forEach(trigger => {
      const { strength, keywords } = calculateMatchStrength(trend, trigger);

      // Only include matches above threshold
      if (strength >= 30) {
        const hook = generateHook(trend, trigger, keywords);
        const contentAngles = generateContentAngles(trend, trigger, keywords);

        triggerMatches.push({
          trend,
          trigger,
          matchStrength: strength,
          connectingKeywords: keywords,
          suggestedHook: hook,
          contentAngles
        });
      }
    });

    // Sort matches by strength
    triggerMatches.sort((a, b) => b.matchStrength - a.matchStrength);

    const bestMatch = triggerMatches.length > 0 ? triggerMatches[0] : null;
    const isContentReady = !!bestMatch && bestMatch.matchStrength >= 50;

    return {
      ...trend,
      triggerMatches,
      bestMatch,
      isContentReady
    };
  });

  // Sort by content-readiness and final priority
  trendsWithMatches.sort((a, b) => {
    // Content-ready trends first
    if (a.isContentReady !== b.isContentReady) {
      return a.isContentReady ? -1 : 1;
    }
    // Then by best match strength
    const aStrength = a.bestMatch?.matchStrength || 0;
    const bStrength = b.bestMatch?.matchStrength || 0;
    if (aStrength !== bStrength) {
      return bStrength - aStrength;
    }
    // Then by final priority
    return b.finalPriority - a.finalPriority;
  });

  const contentReadyCount = trendsWithMatches.filter(t => t.isContentReady).length;
  console.log(`[TriggersTrendMatcher] ${contentReadyCount}/${trends.length} trends are content-ready`);

  return trendsWithMatches;
}

/**
 * Get content-ready trends only
 */
export function getContentReadyTrends(trends: TrendWithMatches[]): TrendWithMatches[] {
  return trends.filter(t => t.isContentReady);
}

/**
 * Get trends by trigger type
 */
export function getTrendsByTriggerType(
  trends: TrendWithMatches[],
  triggerType: CustomerTrigger['type']
): TrendWithMatches[] {
  return trends.filter(t =>
    t.triggerMatches.some(m => m.trigger.type === triggerType)
  );
}

/**
 * Get matching statistics
 */
export function getMatchingStats(trends: TrendWithMatches[]): {
  totalTrends: number;
  contentReady: number;
  avgMatchStrength: number;
  triggerTypeDistribution: Record<string, number>;
  topContentAngles: Record<string, number>;
} {
  const contentReady = trends.filter(t => t.isContentReady);

  const triggerTypes: Record<string, number> = {};
  const angleTypes: Record<string, number> = {};

  trends.forEach(t => {
    t.triggerMatches.forEach(m => {
      triggerTypes[m.trigger.type] = (triggerTypes[m.trigger.type] || 0) + 1;
      m.contentAngles.forEach(a => {
        angleTypes[a.type] = (angleTypes[a.type] || 0) + 1;
      });
    });
  });

  return {
    totalTrends: trends.length,
    contentReady: contentReady.length,
    avgMatchStrength: contentReady.length > 0
      ? Math.round(contentReady.reduce((sum, t) => sum + (t.bestMatch?.matchStrength || 0), 0) / contentReady.length)
      : 0,
    triggerTypeDistribution: triggerTypes,
    topContentAngles: angleTypes
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TriggersTrendMatcher = {
  match: matchTrendsWithTriggers,
  extractTriggers: extractTriggersFromUVP,
  getContentReady: getContentReadyTrends,
  getByTriggerType: getTrendsByTriggerType,
  getStats: getMatchingStats
};

export default TriggersTrendMatcher;
