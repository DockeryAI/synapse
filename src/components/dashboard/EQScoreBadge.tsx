/**
 * EQ Score Badge Component
 * Displays emotional intelligence/quality scores with color coding
 */

import React from 'react';
import { Heart, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EQScoreBadgeProps {
  score: number;
  variant?: 'compact' | 'detailed';
  label?: string;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Score tier thresholds and colors
const getScoreStyle = (score: number) => {
  if (score >= 80) {
    return {
      bg: 'bg-green-500',
      text: 'text-white',
      ring: 'ring-green-500',
      label: 'Excellent',
      lightBg: 'bg-green-100 dark:bg-green-900/30',
      lightText: 'text-green-700 dark:text-green-300',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-blue-500',
      text: 'text-white',
      ring: 'ring-blue-500',
      label: 'Good',
      lightBg: 'bg-blue-100 dark:bg-blue-900/30',
      lightText: 'text-blue-700 dark:text-blue-300',
    };
  }
  if (score >= 40) {
    return {
      bg: 'bg-yellow-500',
      text: 'text-white',
      ring: 'ring-yellow-500',
      label: 'Fair',
      lightBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      lightText: 'text-yellow-700 dark:text-yellow-300',
    };
  }
  return {
    bg: 'bg-red-500',
    text: 'text-white',
    ring: 'ring-red-500',
    label: 'Needs Work',
    lightBg: 'bg-red-100 dark:bg-red-900/30',
    lightText: 'text-red-700 dark:text-red-300',
  };
};

const sizeClasses = {
  sm: {
    circle: 'w-6 h-6 text-xs',
    text: 'text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    circle: 'w-8 h-8 text-sm',
    text: 'text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    circle: 'w-12 h-12 text-base',
    text: 'text-base',
    icon: 'w-5 h-5',
  },
};

export function EQScoreBadge({
  score,
  variant = 'compact',
  label,
  showIcon = false,
  className,
  size = 'md',
}: EQScoreBadgeProps) {
  const style = getScoreStyle(score);
  const sizeClass = sizeClasses[size];

  // Compact variant - just a colored circle with score
  if (variant === 'compact') {
    return (
      <div
        className={cn('inline-flex items-center gap-1.5', className)}
        role="status"
        aria-label={`EQ Score: ${score} out of 100 - ${style.label}`}
      >
        {showIcon && <Heart className={cn(sizeClass.icon, 'text-gray-500')} />}
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-offset-1',
            style.bg,
            style.text,
            style.ring,
            sizeClass.circle
          )}
        >
          {score}
        </div>
      </div>
    );
  }

  // Detailed variant - includes label and description
  return (
    <div
      className={cn('inline-flex items-center gap-2 group relative', className)}
      role="status"
      aria-label={`EQ Score: ${score} out of 100 - ${style.label}`}
    >
      {showIcon && <Heart className={cn(sizeClass.icon, style.lightText)} />}

      <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', style.lightBg)}>
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-bold shadow-sm',
            style.bg,
            style.text,
            sizeClass.circle
          )}
        >
          {score}
        </div>
        <div className={cn('flex flex-col', sizeClass.text)}>
          <span className={cn('font-semibold', style.lightText)}>
            {label || style.label}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">EQ Score</span>
        </div>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
        <div className="flex items-center gap-1 mb-1">
          <Info className="w-3 h-3" />
          <span className="font-semibold">Quality Breakdown</span>
        </div>
        <p className="text-gray-300">
          {score >= 80 && 'Outstanding content with high engagement potential'}
          {score >= 60 && score < 80 && 'Quality content ready for publication'}
          {score >= 40 && score < 60 && 'Good foundation, minor improvements needed'}
          {score < 40 && 'Needs significant enhancement before publishing'}
        </p>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}

export default EQScoreBadge;
