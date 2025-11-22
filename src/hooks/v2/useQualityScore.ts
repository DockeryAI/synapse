/**
 * useQualityScore Hook
 *
 * Hook for displaying and reacting to quality score metrics.
 * Provides computed values and thresholds for quality indicators.
 *
 * ISOLATION: Zero V1 imports - Uses V2 types only
 */

import { useMemo } from 'react';
import type { QualityScore } from '@/types/v2/quality.types';
import type { SynthesisQualityScore } from '@/types/v2/synthesis.types';

/**
 * Quality level classification
 */
export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Quality indicator
 */
export interface QualityIndicator {
  level: QualityLevel;
  color: string;
  label: string;
  description: string;
}

/**
 * Hook return value
 */
export interface UseQualityScoreReturn {
  /** Overall quality level */
  level: QualityLevel;
  /** Quality indicator (for display) */
  indicator: QualityIndicator;
  /** Overall score (0-100) */
  overallScore: number;
  /** Individual metric scores */
  metrics: {
    coherence: number;
    completeness: number;
    confidence: number;
    alignment: number;
  };
  /** Is below threshold */
  isBelowThreshold: (threshold: number) => boolean;
  /** Is above threshold */
  isAboveThreshold: (threshold: number) => boolean;
  /** Issues (if any) */
  issues: string[];
  /** Recommendations (if any) */
  recommendations: string[];
}

/**
 * Quality level thresholds
 */
const QUALITY_THRESHOLDS = {
  excellent: 90,
  good: 70,
  fair: 50,
};

/**
 * Quality indicators
 */
const QUALITY_INDICATORS: Record<QualityLevel, QualityIndicator> = {
  excellent: {
    level: 'excellent',
    color: 'green',
    label: 'Excellent',
    description: 'High quality UVP, ready for use',
  },
  good: {
    level: 'good',
    color: 'blue',
    label: 'Good',
    description: 'Good quality UVP, minor refinements may improve',
  },
  fair: {
    level: 'fair',
    color: 'yellow',
    label: 'Fair',
    description: 'Acceptable quality, consider reviewing and editing',
  },
  poor: {
    level: 'poor',
    color: 'red',
    label: 'Needs Work',
    description: 'Quality below standards, review and regeneration recommended',
  },
};

/**
 * Determine quality level from score
 */
function getQualityLevel(score: number): QualityLevel {
  if (score >= QUALITY_THRESHOLDS.excellent) return 'excellent';
  if (score >= QUALITY_THRESHOLDS.good) return 'good';
  if (score >= QUALITY_THRESHOLDS.fair) return 'fair';
  return 'poor';
}

/**
 * useQualityScore Hook
 *
 * Provides quality score metrics and indicators for display.
 *
 * @example
 * ```tsx
 * function QualityBadge({ qualityScore }: { qualityScore: QualityScore }) {
 *   const { indicator, overallScore, metrics } = useQualityScore(qualityScore);
 *
 *   return (
 *     <div className={`badge badge-${indicator.color}`}>
 *       <span>{indicator.label}</span>
 *       <span>{overallScore}/100</span>
 *       <p>{indicator.description}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useQualityScore(
  qualityScore: QualityScore | SynthesisQualityScore | null | undefined
): UseQualityScoreReturn {
  return useMemo(() => {
    if (!qualityScore) {
      return {
        level: 'poor',
        indicator: QUALITY_INDICATORS.poor,
        overallScore: 0,
        metrics: {
          coherence: 0,
          completeness: 0,
          confidence: 0,
          alignment: 0,
        },
        isBelowThreshold: () => true,
        isAboveThreshold: () => false,
        issues: ['No quality score available'],
        recommendations: ['Generate a quality score first'],
      };
    }

    // Normalize scores (handle both 0-1 and 0-100 scales)
    const normalizeScore = (score: number) => {
      return score <= 1 ? score * 100 : score;
    };

    // Extract metrics (handle both QualityScore and SynthesisQualityScore formats)
    const metrics = {
      coherence: normalizeScore(
        'metrics' in qualityScore
          ? qualityScore.metrics.coherence?.score ?? 0
          : qualityScore.coherence ?? 0
      ),
      completeness: normalizeScore(
        'metrics' in qualityScore
          ? qualityScore.metrics.completeness?.score ?? 0
          : qualityScore.completeness ?? 0
      ),
      confidence: normalizeScore(
        'metrics' in qualityScore
          ? qualityScore.metrics.confidence?.score ?? 0
          : qualityScore.confidence ?? 0
      ),
      alignment: normalizeScore(
        'metrics' in qualityScore && 'coherence' in qualityScore.metrics
          ? qualityScore.metrics.coherence?.score ?? qualityScore.overall ?? 0
          : (qualityScore as any).alignment ?? qualityScore.overall ?? 0
      ),
    };

    const overallScore = normalizeScore(qualityScore.overall ?? 0);
    const level = getQualityLevel(overallScore);
    const indicator = QUALITY_INDICATORS[level];

    const issues = (qualityScore as any).issues ?? [];
    const recommendations = (qualityScore as any).recommendations ?? [];

    return {
      level,
      indicator,
      overallScore,
      metrics,
      isBelowThreshold: (threshold: number) => overallScore < threshold,
      isAboveThreshold: (threshold: number) => overallScore >= threshold,
      issues,
      recommendations,
    };
  }, [qualityScore]);
}
