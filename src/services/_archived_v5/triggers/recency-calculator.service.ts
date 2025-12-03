/**
 * Recency Calculator Service
 *
 * Implements exponential decay weighting for trigger recency scoring.
 * Based on Triggers 3.0 Build Plan:
 * - 30-day rule with exponential decay
 * - 0-14 days = 100%
 * - 60+ days = 25%
 *
 * The recency of a signal is critical - a 6-month-old funding round is NOT a valid trigger.
 *
 * Created: 2025-12-01
 * Phase: Triggers 3.0 - Phase 1 (Foundation Layer)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RecencyConfig {
  /** Days at which signal is still at 100% value */
  peakWindowDays: number;
  /** Days at which signal starts significant decay */
  decayStartDays: number;
  /** Days at which signal reaches minimum value */
  staleThresholdDays: number;
  /** Minimum multiplier for stale signals (never goes below this) */
  minimumMultiplier: number;
  /** Decay rate constant (higher = faster decay) */
  decayRate: number;
}

export interface RecencyResult {
  /** The recency multiplier (0.25-1.0) */
  multiplier: number;
  /** Human-readable age description */
  ageLabel: string;
  /** Days since the signal was created */
  daysOld: number;
  /** Whether this signal is considered stale */
  isStale: boolean;
  /** Whether this signal is in the peak window */
  isPeak: boolean;
  /** Reasoning for the score */
  reasoning: string;
}

export type TriggerEventType =
  | 'funding-round'
  | 'leadership-change'
  | 'hiring-surge'
  | 'contract-expiration'
  | 'tech-stack-change'
  | 'competitive-loss'
  | 'review'
  | 'social-discussion'
  | 'news-mention'
  | 'default';

// ============================================================================
// CONFIGURATIONS
// ============================================================================

/**
 * Default recency configuration
 * Based on Triggers 3.0 Build Plan:
 * - 0-14 days = 100%
 * - 15-30 days = gradual decay
 * - 31-60 days = significant decay
 * - 60+ days = 25% minimum
 */
const DEFAULT_RECENCY_CONFIG: RecencyConfig = {
  peakWindowDays: 14,
  decayStartDays: 15,
  staleThresholdDays: 60,
  minimumMultiplier: 0.25,
  decayRate: 0.05, // ~5% decay per day after peak
};

/**
 * Trigger event-specific recency windows
 * From TRIGGER_RESEARCH.md Part 3.5:
 * Different trigger types have different decay curves
 */
const EVENT_SPECIFIC_CONFIGS: Record<TriggerEventType, RecencyConfig> = {
  'funding-round': {
    peakWindowDays: 30,
    decayStartDays: 31,
    staleThresholdDays: 90,
    minimumMultiplier: 0.15,
    decayRate: 0.03,
  },
  'leadership-change': {
    peakWindowDays: 60,
    decayStartDays: 61,
    staleThresholdDays: 120,
    minimumMultiplier: 0.20,
    decayRate: 0.02,
  },
  'hiring-surge': {
    peakWindowDays: 45,
    decayStartDays: 46,
    staleThresholdDays: 90,
    minimumMultiplier: 0.20,
    decayRate: 0.03,
  },
  'contract-expiration': {
    // Special: window is BEFORE the event
    peakWindowDays: 90, // 90 days before = peak
    decayStartDays: 30, // 30 days before = still relevant
    staleThresholdDays: 0, // After renewal = stale
    minimumMultiplier: 0.10,
    decayRate: 0.05,
  },
  'tech-stack-change': {
    peakWindowDays: 30,
    decayStartDays: 31,
    staleThresholdDays: 60,
    minimumMultiplier: 0.25,
    decayRate: 0.04,
  },
  'competitive-loss': {
    peakWindowDays: 14,
    decayStartDays: 15,
    staleThresholdDays: 45,
    minimumMultiplier: 0.15,
    decayRate: 0.06,
  },
  'review': {
    // Reviews: 73% trust reviews < 30 days old
    peakWindowDays: 14,
    decayStartDays: 15,
    staleThresholdDays: 90,
    minimumMultiplier: 0.30,
    decayRate: 0.02,
  },
  'social-discussion': {
    peakWindowDays: 7,
    decayStartDays: 8,
    staleThresholdDays: 30,
    minimumMultiplier: 0.20,
    decayRate: 0.08,
  },
  'news-mention': {
    peakWindowDays: 7,
    decayStartDays: 8,
    staleThresholdDays: 30,
    minimumMultiplier: 0.15,
    decayRate: 0.10,
  },
  'default': DEFAULT_RECENCY_CONFIG,
};

/**
 * Age labels based on days old
 */
const AGE_LABELS: Array<{ maxDays: number; label: string }> = [
  { maxDays: 1, label: 'Today' },
  { maxDays: 2, label: 'Yesterday' },
  { maxDays: 7, label: 'This week' },
  { maxDays: 14, label: 'Last 2 weeks' },
  { maxDays: 30, label: 'This month' },
  { maxDays: 60, label: '1-2 months ago' },
  { maxDays: 90, label: '2-3 months ago' },
  { maxDays: 180, label: '3-6 months ago' },
  { maxDays: 365, label: '6-12 months ago' },
  { maxDays: Infinity, label: 'Over a year ago' },
];

// ============================================================================
// SERVICE
// ============================================================================

class RecencyCalculatorService {
  /**
   * Calculate recency score for a trigger timestamp
   *
   * @param timestamp - ISO date string or Date object
   * @param eventType - Type of trigger event (affects decay curve)
   * @returns RecencyResult with multiplier and metadata
   */
  calculateRecency(
    timestamp: string | Date | undefined,
    eventType: TriggerEventType = 'default'
  ): RecencyResult {
    // Handle missing timestamp - assume moderately recent
    if (!timestamp) {
      return {
        multiplier: 0.6,
        ageLabel: 'Unknown date',
        daysOld: -1,
        isStale: false,
        isPeak: false,
        reasoning: 'No timestamp available; using moderate recency score',
      };
    }

    const signalDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const daysOld = Math.floor((now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24));

    // Handle future dates (likely data error)
    if (daysOld < 0) {
      return {
        multiplier: 1.0,
        ageLabel: 'Future date (data error)',
        daysOld: 0,
        isStale: false,
        isPeak: true,
        reasoning: 'Timestamp is in the future; treating as current',
      };
    }

    const config = EVENT_SPECIFIC_CONFIGS[eventType] || DEFAULT_RECENCY_CONFIG;
    const multiplier = this.calculateDecayMultiplier(daysOld, config);
    const ageLabel = this.getAgeLabel(daysOld);
    const isStale = daysOld >= config.staleThresholdDays;
    const isPeak = daysOld <= config.peakWindowDays;

    return {
      multiplier,
      ageLabel,
      daysOld,
      isStale,
      isPeak,
      reasoning: this.generateReasoning(daysOld, multiplier, config, eventType),
    };
  }

  /**
   * Calculate decay multiplier using exponential decay formula
   *
   * Formula: multiplier = max(minimum, e^(-decayRate * (daysOld - peakWindow)))
   */
  private calculateDecayMultiplier(daysOld: number, config: RecencyConfig): number {
    // Peak window: 100%
    if (daysOld <= config.peakWindowDays) {
      return 1.0;
    }

    // Past stale threshold: minimum
    if (daysOld >= config.staleThresholdDays) {
      return config.minimumMultiplier;
    }

    // Exponential decay between peak and stale
    const daysIntoDecay = daysOld - config.peakWindowDays;
    const decayMultiplier = Math.exp(-config.decayRate * daysIntoDecay);

    // Ensure we don't go below minimum
    return Math.max(config.minimumMultiplier, decayMultiplier);
  }

  /**
   * Get human-readable age label
   */
  private getAgeLabel(daysOld: number): string {
    for (const { maxDays, label } of AGE_LABELS) {
      if (daysOld <= maxDays) {
        return label;
      }
    }
    return 'Very old';
  }

  /**
   * Generate reasoning string for the recency score
   */
  private generateReasoning(
    daysOld: number,
    multiplier: number,
    config: RecencyConfig,
    eventType: TriggerEventType
  ): string {
    const percentScore = Math.round(multiplier * 100);

    if (daysOld <= config.peakWindowDays) {
      return `Fresh signal (${daysOld} days old) - full ${percentScore}% weight`;
    }

    if (daysOld >= config.staleThresholdDays) {
      return `Stale signal (${daysOld} days old) - minimum ${percentScore}% weight`;
    }

    const decayPhrase = eventType !== 'default'
      ? `${eventType} signals decay after ${config.peakWindowDays} days`
      : `Standard decay after ${config.peakWindowDays} days`;

    return `${decayPhrase}; ${daysOld} days old = ${percentScore}% weight`;
  }

  /**
   * Apply recency weighting to a base score
   *
   * @param baseScore - The original score (0-1)
   * @param timestamp - Signal timestamp
   * @param eventType - Type of trigger event
   * @returns Adjusted score with recency applied
   */
  applyRecencyWeighting(
    baseScore: number,
    timestamp: string | Date | undefined,
    eventType: TriggerEventType = 'default'
  ): { adjustedScore: number; recency: RecencyResult } {
    const recency = this.calculateRecency(timestamp, eventType);
    return {
      adjustedScore: baseScore * recency.multiplier,
      recency,
    };
  }

  /**
   * Batch calculate recency for multiple triggers
   */
  batchCalculateRecency(
    triggers: Array<{ timestamp?: string; eventType?: TriggerEventType }>
  ): RecencyResult[] {
    return triggers.map((t) =>
      this.calculateRecency(t.timestamp, t.eventType || 'default')
    );
  }

  /**
   * Get the recency configuration for an event type
   */
  getConfig(eventType: TriggerEventType = 'default'): RecencyConfig {
    return EVENT_SPECIFIC_CONFIGS[eventType] || DEFAULT_RECENCY_CONFIG;
  }

  /**
   * Check if a signal is too stale to be useful
   * Based on success metric: 80% of triggers should be < 30 days old
   */
  isTooStale(timestamp: string | Date | undefined, strictMode: boolean = false): boolean {
    const recency = this.calculateRecency(timestamp);

    if (strictMode) {
      // Strict mode: must be < 30 days
      return recency.daysOld > 30 || recency.daysOld === -1;
    }

    // Normal mode: use event-specific stale threshold
    return recency.isStale;
  }

  /**
   * Sort triggers by recency (most recent first)
   */
  sortByRecency<T extends { timestamp?: string }>(triggers: T[]): T[] {
    return [...triggers].sort((a, b) => {
      const recencyA = this.calculateRecency(a.timestamp);
      const recencyB = this.calculateRecency(b.timestamp);

      // Unknown dates go to the end
      if (recencyA.daysOld === -1) return 1;
      if (recencyB.daysOld === -1) return -1;

      return recencyA.daysOld - recencyB.daysOld;
    });
  }

  /**
   * Filter out stale triggers
   */
  filterStale<T extends { timestamp?: string }>(
    triggers: T[],
    eventType: TriggerEventType = 'default'
  ): T[] {
    return triggers.filter((t) => !this.calculateRecency(t.timestamp, eventType).isStale);
  }

  /**
   * Get recency distribution stats for a set of triggers
   * Useful for monitoring success metric (80% < 30 days)
   */
  getRecencyDistribution(timestamps: Array<string | undefined>): {
    under7Days: number;
    under14Days: number;
    under30Days: number;
    under60Days: number;
    over60Days: number;
    unknown: number;
    percentUnder30Days: number;
  } {
    let under7Days = 0;
    let under14Days = 0;
    let under30Days = 0;
    let under60Days = 0;
    let over60Days = 0;
    let unknown = 0;

    for (const ts of timestamps) {
      const recency = this.calculateRecency(ts);

      if (recency.daysOld === -1) {
        unknown++;
      } else if (recency.daysOld <= 7) {
        under7Days++;
      } else if (recency.daysOld <= 14) {
        under14Days++;
      } else if (recency.daysOld <= 30) {
        under30Days++;
      } else if (recency.daysOld <= 60) {
        under60Days++;
      } else {
        over60Days++;
      }
    }

    const totalKnown = timestamps.length - unknown;
    const totalUnder30 = under7Days + under14Days + under30Days;
    const percentUnder30Days = totalKnown > 0 ? Math.round((totalUnder30 / totalKnown) * 100) : 0;

    return {
      under7Days,
      under14Days,
      under30Days,
      under60Days,
      over60Days,
      unknown,
      percentUnder30Days,
    };
  }

  /**
   * Normalize a timestamp to ISO string format
   */
  normalizeTimestamp(timestamp: string | Date | number | undefined): string | undefined {
    if (!timestamp) return undefined;

    try {
      if (typeof timestamp === 'number') {
        // Unix timestamp
        return new Date(timestamp * 1000).toISOString();
      }
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }
      // String - attempt to parse
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return undefined;
      }
      return date.toISOString();
    } catch {
      return undefined;
    }
  }
}

// Export singleton
export const recencyCalculatorService = new RecencyCalculatorService();

// Export class for testing
export { RecencyCalculatorService };
