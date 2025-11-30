/**
 * Trend Lifecycle Detector Service
 *
 * Phase 5 of Trends 2.0 Build Plan
 * Classifies trends by lifecycle stage based on velocity and age.
 *
 * Lifecycle stages:
 * - 🔥 Emerging (< 2 weeks, high growth)
 * - 📈 Peak (sustained high interest)
 * - 📉 Declining (negative growth)
 * - 🔄 Stable (consistent interest)
 *
 * Created: 2025-11-29
 */

import type { EQPrioritizedTrend } from './eq-trend-prioritizer.service';

// ============================================================================
// TYPES
// ============================================================================

export type LifecycleStage =
  | 'emerging'   // 🔥 New and growing fast
  | 'peak'       // 📈 At highest interest
  | 'stable'     // 🔄 Consistent interest
  | 'declining'; // 📉 Interest waning

export interface LifecycleIndicators {
  /** Lifecycle stage */
  stage: LifecycleStage;
  /** Velocity score (-100 to +100, negative = declining) */
  velocity: number;
  /** How old the trend is in days */
  ageInDays: number;
  /** Is this a first-mover opportunity? */
  isFirstMover: boolean;
  /** Urgency level for acting on this trend */
  urgency: 'high' | 'medium' | 'low';
  /** Recommended action */
  action: string;
  /** Stage emoji */
  stageEmoji: string;
  /** Stage label */
  stageLabel: string;
}

export interface LifecycleTrend extends EQPrioritizedTrend {
  lifecycle: LifecycleIndicators;
  /** Final priority score including lifecycle weight */
  finalPriority: number;
}

export interface LifecycleConfig {
  /** Days to consider "emerging" */
  emergingDaysThreshold: number;
  /** Velocity threshold for "peak" */
  peakVelocityThreshold: number;
  /** Velocity threshold for "declining" */
  decliningVelocityThreshold: number;
  /** Weight for lifecycle in final score */
  lifecycleWeight: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: LifecycleConfig = {
  emergingDaysThreshold: 14,
  peakVelocityThreshold: 50,
  decliningVelocityThreshold: -20,
  lifecycleWeight: 0.15
};

// ============================================================================
// LIFECYCLE STAGE METADATA
// ============================================================================

const STAGE_META: Record<LifecycleStage, { emoji: string; label: string; urgencyBonus: number }> = {
  emerging: { emoji: '🔥', label: 'Emerging', urgencyBonus: 30 },
  peak: { emoji: '📈', label: 'Peak', urgencyBonus: 20 },
  stable: { emoji: '🔄', label: 'Stable', urgencyBonus: 0 },
  declining: { emoji: '📉', label: 'Declining', urgencyBonus: -10 }
};

// ============================================================================
// LIFECYCLE DETECTION
// ============================================================================

/**
 * Calculate age of trend in days from first seen date
 */
function calculateAge(firstSeen?: string): number {
  if (!firstSeen) return 30; // Default to 30 days if unknown

  const firstDate = new Date(firstSeen);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - firstDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Estimate velocity based on source mentions and recency
 *
 * Since we don't have historical data, we estimate velocity from:
 * - Number of sources mentioning the trend (more sources = higher velocity)
 * - Recency of mentions (recent = higher velocity)
 * - Presence of urgency keywords
 */
function estimateVelocity(
  trend: EQPrioritizedTrend,
  ageInDays: number
): number {
  let velocity = 0;

  // Base velocity from source count (2+ sources = growing interest)
  if (trend.sourceCount >= 3) {
    velocity += 40;
  } else if (trend.sourceCount >= 2) {
    velocity += 20;
  }

  // Recency bonus (newer = likely growing)
  if (ageInDays <= 7) {
    velocity += 30;
  } else if (ageInDays <= 14) {
    velocity += 15;
  } else if (ageInDays <= 30) {
    velocity += 5;
  } else {
    velocity -= 10; // Older trends may be declining
  }

  // Check for velocity keywords in content
  const text = `${trend.title} ${trend.description}`.toLowerCase();

  const growthKeywords = [
    'new', 'emerging', 'rising', 'growing', 'surge', 'boom', 'skyrocket',
    'breakthrough', 'revolutionary', 'first', 'launching', 'announced'
  ];

  const declineKeywords = [
    'decline', 'falling', 'dropping', 'decrease', 'slowing', 'end of',
    'dying', 'outdated', 'replaced', 'obsolete', 'legacy'
  ];

  const growthMatches = growthKeywords.filter(kw => text.includes(kw)).length;
  const declineMatches = declineKeywords.filter(kw => text.includes(kw)).length;

  velocity += growthMatches * 10;
  velocity -= declineMatches * 15;

  // Check urgency trigger for velocity signal
  if (trend.primaryTrigger === 'urgency') {
    velocity += 15;
  }

  // Clamp to -100 to +100
  return Math.max(-100, Math.min(100, velocity));
}

/**
 * Determine lifecycle stage from velocity and age
 */
function determineStage(
  velocity: number,
  ageInDays: number,
  config: LifecycleConfig
): LifecycleStage {
  // Emerging: new and growing
  if (ageInDays <= config.emergingDaysThreshold && velocity > 0) {
    return 'emerging';
  }

  // Peak: high velocity regardless of age
  if (velocity >= config.peakVelocityThreshold) {
    return 'peak';
  }

  // Declining: negative velocity
  if (velocity <= config.decliningVelocityThreshold) {
    return 'declining';
  }

  // Default: stable
  return 'stable';
}

/**
 * Determine urgency level
 */
function determineUrgency(
  stage: LifecycleStage,
  velocity: number,
  isFirstMover: boolean
): 'high' | 'medium' | 'low' {
  if (stage === 'emerging' && isFirstMover) {
    return 'high';
  }

  if (stage === 'peak' || (stage === 'emerging' && velocity > 30)) {
    return 'high';
  }

  if (stage === 'stable' || (stage === 'emerging' && velocity <= 30)) {
    return 'medium';
  }

  return 'low';
}

/**
 * Generate recommended action based on lifecycle
 */
function generateAction(
  stage: LifecycleStage,
  urgency: 'high' | 'medium' | 'low',
  isFirstMover: boolean
): string {
  const actions: Record<LifecycleStage, Record<string, string>> = {
    emerging: {
      high: isFirstMover
        ? '🚀 First-mover opportunity! Create content NOW to establish authority'
        : '⚡ Act fast - this trend is heating up',
      medium: '📝 Start developing content to ride the wave',
      low: '👀 Monitor this emerging trend'
    },
    peak: {
      high: '🎯 Join the conversation now - maximum visibility',
      medium: '📊 Create authoritative content on this hot topic',
      low: '✍️ Add your perspective to this active discussion'
    },
    stable: {
      high: '📚 Create evergreen content for this consistent topic',
      medium: '🔄 Regular content keeps you relevant',
      low: '📌 Consider for content calendar rotation'
    },
    declining: {
      high: '⚠️ Pivot angle - find fresh take or move on',
      medium: '🔍 Evaluate if worth continued investment',
      low: '⏭️ Consider deprioritizing in favor of emerging trends'
    }
  };

  return actions[stage][urgency] || 'Evaluate and decide';
}

// ============================================================================
// MAIN LIFECYCLE DETECTION FUNCTION
// ============================================================================

/**
 * Detect lifecycle stage for all trends
 */
export function detectLifecycle(
  trends: EQPrioritizedTrend[],
  config: Partial<LifecycleConfig> = {}
): LifecycleTrend[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  console.log(`[TrendLifecycleDetector] Analyzing lifecycle for ${trends.length} trends`);

  // Track seen topics for first-mover detection
  const seenTopics = new Set<string>();

  const lifecycleTrends: LifecycleTrend[] = trends.map(trend => {
    // Calculate age
    const ageInDays = calculateAge(trend.firstSeen);

    // Estimate velocity
    const velocity = estimateVelocity(trend, ageInDays);

    // Determine stage
    const stage = determineStage(velocity, ageInDays, cfg);

    // Check if first-mover (first trend with similar topic)
    const topicKey = trend.title.toLowerCase().split(' ').slice(0, 3).join('_');
    const isFirstMover = !seenTopics.has(topicKey);
    seenTopics.add(topicKey);

    // Determine urgency
    const urgency = determineUrgency(stage, velocity, isFirstMover);

    // Generate action
    const action = generateAction(stage, urgency, isFirstMover);

    // Get stage metadata
    const stageMeta = STAGE_META[stage];

    // Calculate final priority with lifecycle weight
    const lifecycleBonus = stageMeta.urgencyBonus;
    const finalPriority = Math.min(100, Math.round(
      trend.eqPriority * (1 - cfg.lifecycleWeight) +
      (50 + lifecycleBonus) * cfg.lifecycleWeight +
      (isFirstMover ? 5 : 0)
    ));

    const lifecycle: LifecycleIndicators = {
      stage,
      velocity,
      ageInDays,
      isFirstMover,
      urgency,
      action,
      stageEmoji: stageMeta.emoji,
      stageLabel: stageMeta.label
    };

    return {
      ...trend,
      lifecycle,
      finalPriority
    };
  });

  // Sort by final priority
  lifecycleTrends.sort((a, b) => b.finalPriority - a.finalPriority);

  // Log lifecycle distribution
  const stageCounts = {
    emerging: lifecycleTrends.filter(t => t.lifecycle.stage === 'emerging').length,
    peak: lifecycleTrends.filter(t => t.lifecycle.stage === 'peak').length,
    stable: lifecycleTrends.filter(t => t.lifecycle.stage === 'stable').length,
    declining: lifecycleTrends.filter(t => t.lifecycle.stage === 'declining').length
  };
  console.log(`[TrendLifecycleDetector] Lifecycle distribution:`, stageCounts);

  return lifecycleTrends;
}

/**
 * Get trends by lifecycle stage
 */
export function getTrendsByStage(
  trends: LifecycleTrend[],
  stage: LifecycleStage
): LifecycleTrend[] {
  return trends.filter(t => t.lifecycle.stage === stage);
}

/**
 * Get first-mover opportunities only
 */
export function getFirstMoverOpportunities(trends: LifecycleTrend[]): LifecycleTrend[] {
  return trends.filter(t => t.lifecycle.isFirstMover && t.lifecycle.stage === 'emerging');
}

/**
 * Get high-urgency trends
 */
export function getHighUrgencyTrends(trends: LifecycleTrend[]): LifecycleTrend[] {
  return trends.filter(t => t.lifecycle.urgency === 'high');
}

/**
 * Get lifecycle statistics
 */
export function getLifecycleStats(trends: LifecycleTrend[]): {
  byStage: Record<LifecycleStage, number>;
  byUrgency: Record<string, number>;
  firstMoverCount: number;
  avgVelocity: number;
} {
  return {
    byStage: {
      emerging: trends.filter(t => t.lifecycle.stage === 'emerging').length,
      peak: trends.filter(t => t.lifecycle.stage === 'peak').length,
      stable: trends.filter(t => t.lifecycle.stage === 'stable').length,
      declining: trends.filter(t => t.lifecycle.stage === 'declining').length
    },
    byUrgency: {
      high: trends.filter(t => t.lifecycle.urgency === 'high').length,
      medium: trends.filter(t => t.lifecycle.urgency === 'medium').length,
      low: trends.filter(t => t.lifecycle.urgency === 'low').length
    },
    firstMoverCount: trends.filter(t => t.lifecycle.isFirstMover).length,
    avgVelocity: trends.length > 0
      ? Math.round(trends.reduce((sum, t) => sum + t.lifecycle.velocity, 0) / trends.length)
      : 0
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TrendLifecycleDetector = {
  detect: detectLifecycle,
  getByStage: getTrendsByStage,
  getFirstMover: getFirstMoverOpportunities,
  getHighUrgency: getHighUrgencyTrends,
  getStats: getLifecycleStats,
  DEFAULT_CONFIG,
  STAGE_META
};

export default TrendLifecycleDetector;
