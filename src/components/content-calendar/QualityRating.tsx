/**
 * Quality Rating Component
 * Displays Synapse scores as user-friendly star ratings
 * Philosophy: "Hide complexity, show value"
 */

import React from 'react';
import { Star } from 'lucide-react';

// Helper function to convert Synapse score to user-friendly rating
function synapseToUserFacing(score: number): { rating: number; label: string; color: string } {
  if (score >= 90) return { rating: 5, label: 'Excellent', color: 'text-green-600' };
  if (score >= 75) return { rating: 4, label: 'Great', color: 'text-blue-600' };
  if (score >= 60) return { rating: 3, label: 'Good', color: 'text-yellow-600' };
  if (score >= 40) return { rating: 2, label: 'Fair', color: 'text-orange-600' };
  return { rating: 1, label: 'Poor', color: 'text-red-600' };
}

export interface QualityRatingProps {
  score: number; // 0-100 Synapse score
  showScore?: boolean; // Show numeric score
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function QualityRating({
  score,
  showScore = false,
  size = 'md',
  showLabel = true,
}: QualityRatingProps) {
  // Convert Synapse 0-100 score to user-facing 1-5 stars
  const { rating, label, color } = synapseToUserFacing(score);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const starClass = sizeClasses[size];
  const textClass = textSizeClasses[size];

  // Color mapping
  const colorClasses: Record<string, string> = {
    green: 'text-green-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
  };

  const starColor = colorClasses[color] || 'text-yellow-500';

  return (
    <div className="flex items-center gap-2">
      {/* Star Rating */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starClass} ${star <= rating ? starColor : 'text-gray-300'} ${
              star <= rating ? 'fill-current' : ''
            }`}
          />
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <span className={`${textClass} font-medium`} style={{ color }}>
          {label}
        </span>
      )}

      {/* Numeric Score (optional - hidden by default) */}
      {showScore && (
        <span className={`${textClass} text-muted-foreground`}>({score}/100)</span>
      )}
    </div>
  );
}

/**
 * Quality Badge - Compact version for lists
 */
export function QualityBadge({ score }: { score: number }) {
  const { rating, label, color } = synapseToUserFacing(score);

  const bgColors: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  const badgeColor = bgColors[color] || bgColors.yellow;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}
    >
      <Star className="w-3 h-3 fill-current" />
      <span>{rating}/5</span>
      <span className="hidden sm:inline">· {label}</span>
    </div>
  );
}
