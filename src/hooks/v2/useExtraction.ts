/**
 * useExtraction Hook
 *
 * Hook for accessing and filtering extraction data (Phase 1-2).
 * Provides convenient accessors for customer profiles, transformations, benefits, etc.
 *
 * ISOLATION: Zero V1 imports - Uses V2 types only
 */

import { useMemo } from 'react';
import type { ExtractionResult } from '@/types/v2/extractor.types';

/**
 * Hook return value
 */
export interface UseExtractionReturn {
  /** All extraction results */
  all: ExtractionResult[];
  /** Customer profile extractions */
  customerProfiles: ExtractionResult[];
  /** Transformation extractions */
  transformations: ExtractionResult[];
  /** Product/service extractions */
  products: ExtractionResult[];
  /** Benefit extractions */
  benefits: ExtractionResult[];
  /** Solution extractions */
  solutions: ExtractionResult[];
  /** Differentiator extractions */
  differentiators: ExtractionResult[];
  /** Get extractions by type */
  getByType: (type: string) => ExtractionResult[];
  /** Get high-confidence extractions (>= threshold) */
  getHighConfidence: (threshold?: number) => ExtractionResult[];
  /** Get low-confidence extractions (< threshold) */
  getLowConfidence: (threshold?: number) => ExtractionResult[];
  /** Average confidence across all extractions */
  averageConfidence: number;
  /** Total number of extractions */
  count: number;
}

/**
 * Default confidence threshold (70%)
 */
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

/**
 * useExtraction Hook
 *
 * Provides convenient access to extraction results with filtering and sorting.
 *
 * @example
 * ```tsx
 * function ExtractionSummary({ extractions }: { extractions: ExtractionResult[] }) {
 *   const {
 *     customerProfiles,
 *     transformations,
 *     averageConfidence,
 *     getHighConfidence
 *   } = useExtraction(extractions);
 *
 *   const highQuality = getHighConfidence(0.8);
 *
 *   return (
 *     <div>
 *       <p>{customerProfiles.length} customer profiles</p>
 *       <p>{transformations.length} transformations</p>
 *       <p>Avg confidence: {(averageConfidence * 100).toFixed(1)}%</p>
 *       <p>{highQuality.length} high-quality extractions</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useExtraction(
  extractionResults: ExtractionResult[] = []
): UseExtractionReturn {
  return useMemo(() => {
    // Filter by type
    const getByType = (type: string) =>
      extractionResults.filter((result) => result.metadata.taskType === type);

    // Get by confidence
    const getHighConfidence = (threshold = DEFAULT_CONFIDENCE_THRESHOLD) =>
      extractionResults.filter(
        (result) => result.confidence.overall >= threshold
      );

    const getLowConfidence = (threshold = DEFAULT_CONFIDENCE_THRESHOLD) =>
      extractionResults.filter(
        (result) => result.confidence.overall < threshold
      );

    // Calculate average confidence
    const averageConfidence =
      extractionResults.length > 0
        ? extractionResults.reduce(
            (sum, result) => sum + result.confidence.overall,
            0
          ) / extractionResults.length
        : 0;

    return {
      all: extractionResults,
      customerProfiles: getByType('customer_profile'),
      transformations: getByType('transformation'),
      products: getByType('product_service'),
      benefits: getByType('benefit'),
      solutions: getByType('solution'),
      differentiators: getByType('differentiator'),
      getByType,
      getHighConfidence,
      getLowConfidence,
      averageConfidence,
      count: extractionResults.length,
    };
  }, [extractionResults]);
}
