/**
 * V5 Quality Badge Component
 *
 * Displays quality tier as a color-coded badge with score.
 *
 * Created: 2025-12-01
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { QualityTier } from '@/services/v5/types';

export interface QualityBadgeProps {
  score: number;
  tier: QualityTier;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIER_CONFIG: Record<QualityTier, { label: string; color: string; bgColor: string }> = {
  excellent: {
    label: 'Excellent',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100 border-emerald-300',
  },
  great: {
    label: 'Great',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-300',
  },
  good: {
    label: 'Good',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-300',
  },
  fair: {
    label: 'Fair',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-300',
  },
  poor: {
    label: 'Poor',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-300',
  },
};

const SIZE_CONFIG = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function QualityBadge({
  score,
  tier,
  showScore = true,
  size = 'md',
  className,
}: QualityBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeClass = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bgColor,
        config.color,
        sizeClass,
        className
      )}
    >
      {showScore && (
        <span className="font-bold">{Math.round(score)}</span>
      )}
      <span>{config.label}</span>
    </span>
  );
}

export function QualityStars({ score, tier }: { score: number; tier: QualityTier }) {
  const stars = tier === 'excellent' ? 5
    : tier === 'great' ? 4
    : tier === 'good' ? 3
    : tier === 'fair' ? 2
    : 1;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={cn(
            'w-4 h-4',
            i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  );
}

export default QualityBadge;
