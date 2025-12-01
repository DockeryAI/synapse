/**
 * Surge Detector Service
 *
 * Detects anomalous spikes in signal activity that indicate
 * heightened buying intent or market events.
 *
 * Phase 4: Enterprise ABM Layer
 *
 * Core Capabilities:
 * 1. Baseline activity calculation - Historical average for comparison
 * 2. Anomaly detection - Identifies 2+ standard deviation spikes
 * 3. Trend vs. spike classification - Sustained growth vs. sudden spike
 * 4. Alert threshold configuration - Customizable sensitivity
 *
 * Use Cases:
 * - Competitor announcement causing churn signals
 * - Industry event driving evaluation activity
 * - Seasonal demand surge detection
 * - Crisis/PR event response
 *
 * Created: 2025-12-01
 */

import type { BusinessProfileType } from './profile-detection.service';
import type { IntentType } from './signal-stacker.service';

// ============================================================================
// TYPES
// ============================================================================

export type SurgeType =
  | 'sudden-spike'      // Sharp increase in short timeframe
  | 'sustained-trend'   // Gradual increase over longer period
  | 'recurring-pattern' // Seasonal/cyclical pattern
  | 'event-driven'      // Correlated with external event
  | 'competitor-related'; // Tied to competitor activity

export type SurgeSeverity = 'minor' | 'moderate' | 'significant' | 'critical';

export type TimeGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface SignalDataPoint {
  timestamp: Date;
  count: number;
  source?: string;
  intent?: IntentType;
  competitor?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  dataPoints: SignalDataPoint[];
  granularity: TimeGranularity;
  startDate: Date;
  endDate: Date;
}

export interface BaselineStats {
  mean: number;
  standardDeviation: number;
  median: number;
  percentile75: number;
  percentile90: number;
  percentile95: number;
  minValue: number;
  maxValue: number;
  dataPointCount: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number; // 0-1
}

export interface SurgeEvent {
  id: string;
  type: SurgeType;
  severity: SurgeSeverity;
  startTime: Date;
  endTime?: Date; // Null if ongoing
  peakTime: Date;
  peakValue: number;
  baselineValue: number;
  percentageIncrease: number;
  standardDeviationsAbove: number;
  affectedSources: string[];
  affectedIntents: IntentType[];
  relatedCompetitors: string[];
  potentialCauses: string[];
  confidence: number; // 0-1
  isOngoing: boolean;
  duration: {
    hours: number;
    days: number;
  };
  recommendation: string;
}

export interface SurgeAnalysisResult {
  surges: SurgeEvent[];
  baseline: BaselineStats;
  currentActivity: {
    level: 'below-baseline' | 'normal' | 'elevated' | 'surging';
    value: number;
    percentileRank: number;
  };
  predictions: SurgePrediction[];
  summary: SurgeSummary;
}

export interface SurgePrediction {
  type: 'upcoming-surge' | 'continuation' | 'decline';
  probability: number;
  expectedTimeframe: string;
  basedOn: string;
  confidence: number;
}

export interface SurgeSummary {
  totalSurgesDetected: number;
  activeSurges: number;
  criticalSurges: number;
  averageSurgeDuration: number; // hours
  mostCommonSurgeType: SurgeType;
  topAffectedIntents: IntentType[];
  topRelatedCompetitors: string[];
}

export interface SurgeDetectorConfig {
  // Sensitivity settings
  minStandardDeviations: number; // Min std devs above baseline (default: 2)
  minPercentageIncrease: number; // Min % increase to flag (default: 50%)
  minDataPointsForBaseline: number; // Min points for valid baseline (default: 14)

  // Detection windows
  surgeWindowHours: number; // Window to detect sudden spikes (default: 24)
  trendWindowDays: number; // Window for trend detection (default: 14)
  baselineWindowDays: number; // Historical window for baseline (default: 30)

  // Alert thresholds
  severityThresholds: {
    minor: number;    // Std devs (default: 2)
    moderate: number; // Std devs (default: 2.5)
    significant: number; // Std devs (default: 3)
    critical: number; // Std devs (default: 4)
  };

  // Pattern detection
  detectRecurringPatterns: boolean;
  patternWindowWeeks: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: SurgeDetectorConfig = {
  minStandardDeviations: 2,
  minPercentageIncrease: 50,
  minDataPointsForBaseline: 14,
  surgeWindowHours: 24,
  trendWindowDays: 14,
  baselineWindowDays: 30,
  severityThresholds: {
    minor: 2,
    moderate: 2.5,
    significant: 3,
    critical: 4
  },
  detectRecurringPatterns: true,
  patternWindowWeeks: 8
};

// Known external events that could cause surges
const KNOWN_EVENT_PATTERNS = [
  { pattern: /product\s+hunt/i, cause: 'Product Hunt launch' },
  { pattern: /techcrunch|ycombinator|hacker\s*news/i, cause: 'Tech press coverage' },
  { pattern: /funding|series\s+[a-z]|raised/i, cause: 'Funding announcement' },
  { pattern: /acquisition|acquired|merger/i, cause: 'M&A activity' },
  { pattern: /outage|downtime|incident/i, cause: 'Service outage' },
  { pattern: /security|breach|vulnerability/i, cause: 'Security incident' },
  { pattern: /price\s+(?:increase|change|hike)/i, cause: 'Pricing change' },
  { pattern: /layoff|restructur/i, cause: 'Company restructuring' },
  { pattern: /conference|event|summit/i, cause: 'Industry event' },
  { pattern: /regulation|compliance|gdpr|law/i, cause: 'Regulatory change' }
];

// Seasonal pattern definitions
const SEASONAL_PATTERNS: Record<string, number[]> = {
  'q4-budget': [10, 11, 12], // Q4 budget spending
  'q1-planning': [1, 2], // New year planning
  'tax-season': [2, 3, 4], // Tax/accounting season
  'back-to-school': [8, 9], // Educational buying
  'black-friday': [11], // Retail/commerce surge
  'year-end': [12], // Year-end deals
  'summer-slowdown': [7, 8] // Typical B2B slowdown (inverted)
};

// ============================================================================
// SERVICE
// ============================================================================

class SurgeDetectorService {
  private config: SurgeDetectorConfig;

  constructor(config?: Partial<SurgeDetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze time series data for surges
   */
  analyzeSurges(
    data: TimeSeriesData,
    context?: {
      competitors?: string[];
      recentNews?: string[];
      profileType?: BusinessProfileType;
    }
  ): SurgeAnalysisResult {
    // Step 1: Calculate baseline statistics
    const baseline = this.calculateBaseline(data);

    // Step 2: Detect surge events
    const surges = this.detectSurges(data, baseline, context);

    // Step 3: Assess current activity level
    const currentActivity = this.assessCurrentActivity(data, baseline);

    // Step 4: Generate predictions
    const predictions = this.generatePredictions(data, baseline, surges);

    // Step 5: Create summary
    const summary = this.createSummary(surges);

    return {
      surges,
      baseline,
      currentActivity,
      predictions,
      summary
    };
  }

  /**
   * Calculate baseline statistics from historical data
   */
  calculateBaseline(data: TimeSeriesData): BaselineStats {
    const values = data.dataPoints.map(dp => dp.count);

    if (values.length < this.config.minDataPointsForBaseline) {
      // Not enough data - return default baseline
      return {
        mean: 0,
        standardDeviation: 0,
        median: 0,
        percentile75: 0,
        percentile90: 0,
        percentile95: 0,
        minValue: 0,
        maxValue: 0,
        dataPointCount: values.length,
        trendDirection: 'stable',
        trendStrength: 0
      };
    }

    // Calculate mean
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // Calculate standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const standardDeviation = Math.sqrt(
      squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    );

    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b);
    const median = this.percentile(sorted, 50);
    const percentile75 = this.percentile(sorted, 75);
    const percentile90 = this.percentile(sorted, 90);
    const percentile95 = this.percentile(sorted, 95);

    // Calculate trend
    const { direction, strength } = this.calculateTrend(data.dataPoints);

    return {
      mean,
      standardDeviation,
      median,
      percentile75,
      percentile90,
      percentile95,
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      dataPointCount: values.length,
      trendDirection: direction,
      trendStrength: strength
    };
  }

  /**
   * Detect individual surge events
   */
  detectSurges(
    data: TimeSeriesData,
    baseline: BaselineStats,
    context?: {
      competitors?: string[];
      recentNews?: string[];
      profileType?: BusinessProfileType;
    }
  ): SurgeEvent[] {
    const surges: SurgeEvent[] = [];
    const { mean, standardDeviation } = baseline;

    if (standardDeviation === 0) return surges;

    let currentSurge: Partial<SurgeEvent> | null = null;

    for (let i = 0; i < data.dataPoints.length; i++) {
      const point = data.dataPoints[i];
      const stdDevsAbove = (point.count - mean) / standardDeviation;
      const percentIncrease = ((point.count - mean) / Math.max(mean, 1)) * 100;

      const isSurge = stdDevsAbove >= this.config.minStandardDeviations &&
                      percentIncrease >= this.config.minPercentageIncrease;

      if (isSurge) {
        if (!currentSurge) {
          // Start new surge
          currentSurge = {
            id: `surge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            startTime: point.timestamp,
            peakTime: point.timestamp,
            peakValue: point.count,
            baselineValue: mean,
            percentageIncrease: percentIncrease,
            standardDeviationsAbove: stdDevsAbove,
            affectedSources: point.source ? [point.source] : [],
            affectedIntents: point.intent ? [point.intent] : [],
            relatedCompetitors: point.competitor ? [point.competitor] : [],
            isOngoing: true
          };
        } else {
          // Update ongoing surge
          if (point.count > (currentSurge.peakValue || 0)) {
            currentSurge.peakTime = point.timestamp;
            currentSurge.peakValue = point.count;
            currentSurge.percentageIncrease = percentIncrease;
            currentSurge.standardDeviationsAbove = stdDevsAbove;
          }
          if (point.source && !currentSurge.affectedSources?.includes(point.source)) {
            currentSurge.affectedSources?.push(point.source);
          }
          if (point.intent && !currentSurge.affectedIntents?.includes(point.intent)) {
            currentSurge.affectedIntents?.push(point.intent);
          }
          if (point.competitor && !currentSurge.relatedCompetitors?.includes(point.competitor)) {
            currentSurge.relatedCompetitors?.push(point.competitor);
          }
        }
      } else if (currentSurge) {
        // End current surge
        currentSurge.endTime = data.dataPoints[i - 1]?.timestamp || point.timestamp;
        currentSurge.isOngoing = false;

        const completedSurge = this.finalizeSurge(
          currentSurge as SurgeEvent,
          baseline,
          context
        );
        surges.push(completedSurge);
        currentSurge = null;
      }
    }

    // Handle ongoing surge at end of data
    if (currentSurge) {
      currentSurge.isOngoing = true;
      const completedSurge = this.finalizeSurge(
        currentSurge as SurgeEvent,
        baseline,
        context
      );
      surges.push(completedSurge);
    }

    return surges.sort((a, b) => b.standardDeviationsAbove - a.standardDeviationsAbove);
  }

  /**
   * Check if current activity is in surge state
   */
  isCurrentlySurging(
    currentValue: number,
    baseline: BaselineStats
  ): { surging: boolean; severity: SurgeSeverity | null; stdDevs: number } {
    if (baseline.standardDeviation === 0) {
      return { surging: false, severity: null, stdDevs: 0 };
    }

    const stdDevs = (currentValue - baseline.mean) / baseline.standardDeviation;

    if (stdDevs >= this.config.severityThresholds.critical) {
      return { surging: true, severity: 'critical', stdDevs };
    }
    if (stdDevs >= this.config.severityThresholds.significant) {
      return { surging: true, severity: 'significant', stdDevs };
    }
    if (stdDevs >= this.config.severityThresholds.moderate) {
      return { surging: true, severity: 'moderate', stdDevs };
    }
    if (stdDevs >= this.config.severityThresholds.minor) {
      return { surging: true, severity: 'minor', stdDevs };
    }

    return { surging: false, severity: null, stdDevs };
  }

  /**
   * Detect recurring seasonal patterns
   */
  detectSeasonalPatterns(
    data: TimeSeriesData
  ): Array<{ pattern: string; confidence: number; nextOccurrence: Date }> {
    if (!this.config.detectRecurringPatterns) return [];

    const patterns: Array<{ pattern: string; confidence: number; nextOccurrence: Date }> = [];
    const currentMonth = new Date().getMonth() + 1;

    // Check each known seasonal pattern
    for (const [patternName, months] of Object.entries(SEASONAL_PATTERNS)) {
      // Calculate average activity in pattern months vs other months
      const patternPoints = data.dataPoints.filter(dp => {
        const month = dp.timestamp.getMonth() + 1;
        return months.includes(month);
      });

      const otherPoints = data.dataPoints.filter(dp => {
        const month = dp.timestamp.getMonth() + 1;
        return !months.includes(month);
      });

      if (patternPoints.length < 3 || otherPoints.length < 3) continue;

      const patternAvg = patternPoints.reduce((s, p) => s + p.count, 0) / patternPoints.length;
      const otherAvg = otherPoints.reduce((s, p) => s + p.count, 0) / otherPoints.length;

      // Pattern detected if avg during pattern months is significantly higher
      const ratio = patternAvg / Math.max(otherAvg, 1);
      if (ratio >= 1.3) {
        // Find next occurrence
        const nextMonth = months.find(m => m > currentMonth) || months[0];
        const nextYear = nextMonth <= currentMonth ? new Date().getFullYear() + 1 : new Date().getFullYear();
        const nextOccurrence = new Date(nextYear, nextMonth - 1, 1);

        patterns.push({
          pattern: patternName,
          confidence: Math.min(1, (ratio - 1) / 2),
          nextOccurrence
        });
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get configuration
   */
  getConfig(): SurgeDetectorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SurgeDetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = (p / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sortedArray[lower];
    return sortedArray[lower] + (sortedArray[upper] - sortedArray[lower]) * (index - lower);
  }

  private calculateTrend(
    dataPoints: SignalDataPoint[]
  ): { direction: 'increasing' | 'decreasing' | 'stable'; strength: number } {
    if (dataPoints.length < 4) {
      return { direction: 'stable', strength: 0 };
    }

    // Simple linear regression
    const n = dataPoints.length;
    const xValues = dataPoints.map((_, i) => i);
    const yValues = dataPoints.map(dp => dp.count);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;

    // Normalize slope to strength (0-1)
    const normalizedSlope = Math.abs(slope) / Math.max(avgY, 1);
    const strength = Math.min(1, normalizedSlope * 10);

    if (slope > 0.01 * avgY) {
      return { direction: 'increasing', strength };
    } else if (slope < -0.01 * avgY) {
      return { direction: 'decreasing', strength };
    }
    return { direction: 'stable', strength: 0 };
  }

  private finalizeSurge(
    surge: SurgeEvent,
    baseline: BaselineStats,
    context?: {
      competitors?: string[];
      recentNews?: string[];
      profileType?: BusinessProfileType;
    }
  ): SurgeEvent {
    // Calculate duration
    const startTime = surge.startTime.getTime();
    const endTime = (surge.endTime || new Date()).getTime();
    const durationMs = endTime - startTime;
    const hours = durationMs / (1000 * 60 * 60);
    const days = hours / 24;

    surge.duration = { hours, days };

    // Determine surge type
    surge.type = this.determineSurgeType(surge, baseline);

    // Determine severity
    surge.severity = this.determineSeverity(surge.standardDeviationsAbove);

    // Identify potential causes
    surge.potentialCauses = this.identifyPotentialCauses(surge, context);

    // Calculate confidence
    surge.confidence = this.calculateConfidence(surge, baseline);

    // Generate recommendation
    surge.recommendation = this.generateRecommendation(surge);

    return surge;
  }

  private determineSurgeType(surge: SurgeEvent, baseline: BaselineStats): SurgeType {
    // Check for competitor-related
    if (surge.relatedCompetitors.length > 0) {
      return 'competitor-related';
    }

    // Check for event-driven based on potential causes
    if (surge.potentialCauses && surge.potentialCauses.length > 0) {
      return 'event-driven';
    }

    // Check duration to distinguish spike vs trend
    if (surge.duration.days <= 3) {
      return 'sudden-spike';
    } else if (surge.duration.days >= 7) {
      // Check if it matches seasonal pattern
      const month = surge.startTime.getMonth() + 1;
      for (const months of Object.values(SEASONAL_PATTERNS)) {
        if (months.includes(month)) {
          return 'recurring-pattern';
        }
      }
      return 'sustained-trend';
    }

    return 'sudden-spike';
  }

  private determineSeverity(stdDevs: number): SurgeSeverity {
    const thresholds = this.config.severityThresholds;
    if (stdDevs >= thresholds.critical) return 'critical';
    if (stdDevs >= thresholds.significant) return 'significant';
    if (stdDevs >= thresholds.moderate) return 'moderate';
    return 'minor';
  }

  private identifyPotentialCauses(
    surge: SurgeEvent,
    context?: {
      competitors?: string[];
      recentNews?: string[];
      profileType?: BusinessProfileType;
    }
  ): string[] {
    const causes: string[] = [];

    // Check recent news against known event patterns
    if (context?.recentNews) {
      for (const news of context.recentNews) {
        for (const eventPattern of KNOWN_EVENT_PATTERNS) {
          if (eventPattern.pattern.test(news)) {
            causes.push(eventPattern.cause);
            break;
          }
        }
      }
    }

    // Check competitor-related
    if (surge.relatedCompetitors.length > 0) {
      causes.push(`Competitor activity: ${surge.relatedCompetitors.join(', ')}`);
    }

    // Check seasonal
    const month = surge.startTime.getMonth() + 1;
    for (const [pattern, months] of Object.entries(SEASONAL_PATTERNS)) {
      if (months.includes(month)) {
        causes.push(`Seasonal pattern: ${pattern}`);
      }
    }

    // Check intent-based causes
    if (surge.affectedIntents.includes('churn-from-competitor')) {
      causes.push('Competitor churn activity');
    }
    if (surge.affectedIntents.includes('compliance-need')) {
      causes.push('Compliance/regulatory deadline');
    }

    return [...new Set(causes)];
  }

  private calculateConfidence(surge: SurgeEvent, baseline: BaselineStats): number {
    let confidence = 0.5; // Base confidence

    // Higher std devs = higher confidence
    if (surge.standardDeviationsAbove >= 4) confidence += 0.25;
    else if (surge.standardDeviationsAbove >= 3) confidence += 0.15;
    else if (surge.standardDeviationsAbove >= 2.5) confidence += 0.1;

    // Multiple sources = higher confidence
    if (surge.affectedSources.length >= 3) confidence += 0.15;
    else if (surge.affectedSources.length >= 2) confidence += 0.1;

    // Known cause = higher confidence
    if (surge.potentialCauses.length > 0) confidence += 0.1;

    // Longer duration = higher confidence (not just noise)
    if (surge.duration.days >= 3) confidence += 0.1;

    // Good baseline data = higher confidence
    if (baseline.dataPointCount >= 30) confidence += 0.1;
    else if (baseline.dataPointCount >= 14) confidence += 0.05;

    return Math.min(1, confidence);
  }

  private generateRecommendation(surge: SurgeEvent): string {
    const { severity, type, isOngoing, affectedIntents, relatedCompetitors } = surge;

    // Critical surges
    if (severity === 'critical') {
      if (type === 'competitor-related') {
        return `CRITICAL: Major competitor event (${relatedCompetitors[0]}). Immediate competitive response required. Mobilize sales and marketing for displacement campaign.`;
      }
      if (affectedIntents.includes('churn-from-competitor')) {
        return 'CRITICAL: Mass churn signal detected. Activate rapid response team. Prioritize outreach to high-value accounts.';
      }
      return 'CRITICAL: Unprecedented activity spike. Investigate immediately and prepare response plan.';
    }

    // Significant surges
    if (severity === 'significant') {
      if (isOngoing) {
        return 'SIGNIFICANT: Active surge in progress. Monitor closely and prepare escalation plan. Brief sales team on opportunity.';
      }
      return 'SIGNIFICANT: Notable activity spike detected. Analyze root cause and adjust campaigns accordingly.';
    }

    // Moderate surges
    if (severity === 'moderate') {
      if (type === 'sustained-trend') {
        return 'MODERATE: Sustained activity increase. Consider scaling content and outreach programs. This may indicate market shift.';
      }
      if (type === 'recurring-pattern') {
        return 'MODERATE: Seasonal pattern detected. Optimize campaigns for expected increase. Pre-position resources.';
      }
      return 'MODERATE: Above-normal activity. Continue monitoring and optimize high-performing channels.';
    }

    // Minor surges
    return 'MINOR: Slight activity increase detected. Continue normal operations with enhanced monitoring.';
  }

  private assessCurrentActivity(
    data: TimeSeriesData,
    baseline: BaselineStats
  ): SurgeAnalysisResult['currentActivity'] {
    // Get most recent data points
    const sortedPoints = [...data.dataPoints].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    if (sortedPoints.length === 0) {
      return {
        level: 'normal',
        value: 0,
        percentileRank: 50
      };
    }

    const currentValue = sortedPoints[0].count;

    // Calculate percentile rank
    const allValues = data.dataPoints.map(dp => dp.count).sort((a, b) => a - b);
    const belowCount = allValues.filter(v => v < currentValue).length;
    const percentileRank = (belowCount / allValues.length) * 100;

    // Determine level
    let level: SurgeAnalysisResult['currentActivity']['level'];
    if (baseline.standardDeviation === 0) {
      level = 'normal';
    } else {
      const stdDevs = (currentValue - baseline.mean) / baseline.standardDeviation;
      if (stdDevs >= this.config.minStandardDeviations) {
        level = 'surging';
      } else if (stdDevs >= 1) {
        level = 'elevated';
      } else if (stdDevs <= -1) {
        level = 'below-baseline';
      } else {
        level = 'normal';
      }
    }

    return {
      level,
      value: currentValue,
      percentileRank
    };
  }

  private generatePredictions(
    data: TimeSeriesData,
    baseline: BaselineStats,
    surges: SurgeEvent[]
  ): SurgePrediction[] {
    const predictions: SurgePrediction[] = [];

    // Check for ongoing surge continuation
    const ongoingSurges = surges.filter(s => s.isOngoing);
    if (ongoingSurges.length > 0) {
      const ongoing = ongoingSurges[0];
      predictions.push({
        type: 'continuation',
        probability: 0.7,
        expectedTimeframe: '24-72 hours',
        basedOn: `Active ${ongoing.severity} surge in progress`,
        confidence: 0.6
      });
    }

    // Check for trend-based prediction
    if (baseline.trendDirection === 'increasing' && baseline.trendStrength > 0.5) {
      predictions.push({
        type: 'upcoming-surge',
        probability: 0.5,
        expectedTimeframe: '1-2 weeks',
        basedOn: 'Strong upward trend detected',
        confidence: baseline.trendStrength
      });
    } else if (baseline.trendDirection === 'decreasing' && baseline.trendStrength > 0.5) {
      predictions.push({
        type: 'decline',
        probability: 0.5,
        expectedTimeframe: '1-2 weeks',
        basedOn: 'Downward trend detected',
        confidence: baseline.trendStrength
      });
    }

    // Check for seasonal prediction
    const seasonalPatterns = this.detectSeasonalPatterns(data);
    for (const pattern of seasonalPatterns.slice(0, 2)) {
      const daysUntil = Math.ceil(
        (pattern.nextOccurrence.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil > 0 && daysUntil <= 60) {
        predictions.push({
          type: 'upcoming-surge',
          probability: pattern.confidence,
          expectedTimeframe: `${daysUntil} days (${pattern.pattern})`,
          basedOn: `Historical seasonal pattern: ${pattern.pattern}`,
          confidence: pattern.confidence
        });
      }
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  private createSummary(surges: SurgeEvent[]): SurgeSummary {
    if (surges.length === 0) {
      return {
        totalSurgesDetected: 0,
        activeSurges: 0,
        criticalSurges: 0,
        averageSurgeDuration: 0,
        mostCommonSurgeType: 'sudden-spike',
        topAffectedIntents: [],
        topRelatedCompetitors: []
      };
    }

    const activeSurges = surges.filter(s => s.isOngoing).length;
    const criticalSurges = surges.filter(s => s.severity === 'critical').length;

    const totalDuration = surges.reduce((sum, s) => sum + s.duration.hours, 0);
    const averageSurgeDuration = totalDuration / surges.length;

    // Most common type
    const typeCounts = new Map<SurgeType, number>();
    surges.forEach(s => typeCounts.set(s.type, (typeCounts.get(s.type) || 0) + 1));
    const mostCommonSurgeType = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'sudden-spike';

    // Top intents
    const intentCounts = new Map<IntentType, number>();
    surges.forEach(s => {
      s.affectedIntents.forEach(i => intentCounts.set(i, (intentCounts.get(i) || 0) + 1));
    });
    const topAffectedIntents = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent]) => intent);

    // Top competitors
    const competitorCounts = new Map<string, number>();
    surges.forEach(s => {
      s.relatedCompetitors.forEach(c => competitorCounts.set(c, (competitorCounts.get(c) || 0) + 1));
    });
    const topRelatedCompetitors = Array.from(competitorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([comp]) => comp);

    return {
      totalSurgesDetected: surges.length,
      activeSurges,
      criticalSurges,
      averageSurgeDuration,
      mostCommonSurgeType,
      topAffectedIntents,
      topRelatedCompetitors
    };
  }
}

// Export singleton
export const surgeDetectorService = new SurgeDetectorService();
export { SurgeDetectorService };
