/**
 * Synapse Score Helpers
 * Utility functions for working with Synapse scores
 */

export interface SynapseQualityIndicator {
  rating: 1 | 2 | 3 | 4 | 5;
  label: 'Poor' | 'Fair' | 'Good' | 'Great' | 'Excellent';
  metrics: {
    engagement: 'low' | 'medium' | 'high';
    clarity: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  };
}

/**
 * Convert Synapse 0-100 score to user-facing quality indicator
 */
export function synapseToUserFacing(score: { overall: number } | number): SynapseQualityIndicator {
  const overallScore = typeof score === 'number' ? score : score.overall;

  if (overallScore >= 90) {
    return {
      rating: 5,
      label: 'Excellent',
      metrics: { engagement: 'high', clarity: 'high', impact: 'high' },
    };
  }
  if (overallScore >= 75) {
    return {
      rating: 4,
      label: 'Great',
      metrics: { engagement: 'high', clarity: 'high', impact: 'medium' },
    };
  }
  if (overallScore >= 60) {
    return {
      rating: 3,
      label: 'Good',
      metrics: { engagement: 'medium', clarity: 'medium', impact: 'medium' },
    };
  }
  if (overallScore >= 40) {
    return {
      rating: 2,
      label: 'Fair',
      metrics: { engagement: 'low', clarity: 'medium', impact: 'low' },
    };
  }
  return {
    rating: 1,
    label: 'Poor',
    metrics: { engagement: 'low', clarity: 'low', impact: 'low' },
  };
}
