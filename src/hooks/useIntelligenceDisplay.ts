/**
 * useIntelligenceDisplay Hook
 *
 * Formats raw intelligence results for UI display.
 * Calculates confidence scores, groups by source type, and provides
 * formatted data ready for the IntelligenceDisplay component.
 *
 * @example
 * ```tsx
 * const { formattedData, stats, groupedByPriority } = useIntelligenceDisplay(intelligence);
 *
 * return (
 *   <div>
 *     <h2>Success Rate: {stats.successRate}%</h2>
 *     {formattedData.map(item => (
 *       <IntelligenceCard key={item.source} {...item} />
 *     ))}
 *   </div>
 * );
 * ```
 */

import { useMemo } from 'react';
import type { IntelligenceResult } from '../services/parallel-intelligence.service';

/**
 * Formatted intelligence item for display
 */
export interface FormattedIntelligence {
  /** Data source name */
  source: string;
  /** Whether fetch was successful */
  success: boolean;
  /** Error message if failed */
  errorMessage?: string;
  /** Time taken in milliseconds */
  duration: number;
  /** Priority level */
  priority: 'critical' | 'important' | 'optional';
  /** Confidence score (0-100) based on success and data quality */
  confidence: number;
  /** Status indicator for UI */
  status: 'success' | 'warning' | 'error';
  /** Data summary for display */
  dataSummary: string;
}

/**
 * Intelligence grouped by priority level
 */
export interface GroupedIntelligence {
  /** Critical priority sources */
  critical: FormattedIntelligence[];
  /** Important priority sources */
  important: FormattedIntelligence[];
  /** Optional priority sources */
  optional: FormattedIntelligence[];
}

/**
 * Aggregate statistics about intelligence gathering
 */
export interface IntelligenceStats {
  /** Total number of sources */
  total: number;
  /** Number of successful sources */
  successful: number;
  /** Number of failed sources */
  failed: number;
  /** Success rate as percentage (0-100) */
  successRate: number;
  /** Average response time in milliseconds */
  avgDuration: number;
  /** Overall confidence score (0-100) */
  overallConfidence: number;
  /** Critical sources success rate */
  criticalSuccessRate: number;
  /** Important sources success rate */
  importantSuccessRate: number;
}

/**
 * Return type of useIntelligenceDisplay hook
 */
export interface UseIntelligenceDisplayReturn {
  /** All intelligence formatted for display */
  formattedData: FormattedIntelligence[];
  /** Intelligence grouped by priority */
  groupedByPriority: GroupedIntelligence;
  /** Aggregate statistics */
  stats: IntelligenceStats;
  /** Whether data meets minimum viability threshold */
  isViable: boolean;
}

/**
 * Calculate confidence score for an intelligence result
 */
function calculateConfidence(result: IntelligenceResult): number {
  // Base confidence on success
  if (!result.success) return 0;

  // Start with 100% for successful results
  let confidence = 100;

  // Reduce based on response time (penalize slow responses)
  if (result.duration > 10000) {
    confidence -= 20; // Very slow
  } else if (result.duration > 5000) {
    confidence -= 10; // Slow
  }

  // Check data quality (if data is null/undefined or empty, reduce confidence)
  if (!result.data) {
    confidence -= 30;
  } else if (typeof result.data === 'object' && Object.keys(result.data).length === 0) {
    confidence -= 20;
  }

  // Boost critical sources slightly
  if (result.priority === 'critical') {
    confidence = Math.min(confidence + 5, 100);
  }

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Determine status indicator based on success and priority
 */
function determineStatus(result: IntelligenceResult): 'success' | 'warning' | 'error' {
  if (result.success) return 'success';
  if (result.priority === 'critical') return 'error';
  return 'warning';
}

/**
 * Generate a summary of the data for display
 */
function generateDataSummary(result: IntelligenceResult): string {
  if (!result.success) {
    return `Failed: ${result.error?.message || 'Unknown error'}`;
  }

  if (!result.data) {
    return 'No data returned';
  }

  // Try to summarize based on data type
  if (Array.isArray(result.data)) {
    return `${result.data.length} items`;
  }

  if (typeof result.data === 'object') {
    const keys = Object.keys(result.data);
    if (keys.length === 0) {
      return 'Empty response';
    }
    return `${keys.length} properties`;
  }

  return 'Data available';
}

/**
 * Custom hook for formatting intelligence data for UI display
 *
 * Processes raw intelligence results and provides formatted data,
 * groupings, and statistics for display components.
 *
 * @param intelligence - Raw intelligence results from parallel gathering
 * @returns {UseIntelligenceDisplayReturn} Formatted intelligence data and stats
 */
export function useIntelligenceDisplay(
  intelligence: IntelligenceResult[]
): UseIntelligenceDisplayReturn {
  // Format intelligence data
  const formattedData = useMemo((): FormattedIntelligence[] => {
    return intelligence.map(result => ({
      source: result.source,
      success: result.success,
      errorMessage: result.error?.message,
      duration: result.duration,
      priority: result.priority,
      confidence: calculateConfidence(result),
      status: determineStatus(result),
      dataSummary: generateDataSummary(result)
    }));
  }, [intelligence]);

  // Group by priority
  const groupedByPriority = useMemo((): GroupedIntelligence => {
    const grouped: GroupedIntelligence = {
      critical: [],
      important: [],
      optional: []
    };

    formattedData.forEach(item => {
      grouped[item.priority].push(item);
    });

    return grouped;
  }, [formattedData]);

  // Calculate aggregate statistics
  const stats = useMemo((): IntelligenceStats => {
    const total = intelligence.length;
    const successful = intelligence.filter(r => r.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    // Calculate average duration
    const totalDuration = intelligence.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

    // Calculate overall confidence (average of all confidence scores)
    const totalConfidence = formattedData.reduce((sum, item) => sum + item.confidence, 0);
    const overallConfidence = formattedData.length > 0
      ? Math.round(totalConfidence / formattedData.length)
      : 0;

    // Calculate success rates by priority
    const criticalResults = intelligence.filter(r => r.priority === 'critical');
    const criticalSuccessful = criticalResults.filter(r => r.success).length;
    const criticalSuccessRate = criticalResults.length > 0
      ? Math.round((criticalSuccessful / criticalResults.length) * 100)
      : 0;

    const importantResults = intelligence.filter(r => r.priority === 'important');
    const importantSuccessful = importantResults.filter(r => r.success).length;
    const importantSuccessRate = importantResults.length > 0
      ? Math.round((importantSuccessful / importantResults.length) * 100)
      : 0;

    return {
      total,
      successful,
      failed,
      successRate,
      avgDuration,
      overallConfidence,
      criticalSuccessRate,
      importantSuccessRate
    };
  }, [intelligence, formattedData]);

  // Determine viability (minimum 8 successful sources)
  const isViable = useMemo(() => {
    return stats.successful >= 8;
  }, [stats.successful]);

  return {
    formattedData,
    groupedByPriority,
    stats,
    isViable
  };
}

/**
 * Helper function to get priority badge color
 */
export function getPriorityColor(priority: 'critical' | 'important' | 'optional'): string {
  switch (priority) {
    case 'critical':
      return 'red';
    case 'important':
      return 'orange';
    case 'optional':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Helper function to get status badge color
 */
export function getStatusColor(status: 'success' | 'warning' | 'error'): string {
  switch (status) {
    case 'success':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Helper function to format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
