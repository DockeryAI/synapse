/**
 * V5 Score Display Component
 *
 * Displays 6-dimension psychology score breakdown as bars or radar chart.
 *
 * Created: 2025-12-01
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { ScoreBreakdown, ContentScore } from '@/services/v5/types';

export interface ScoreDisplayProps {
  score: ContentScore;
  variant?: 'bars' | 'compact' | 'detailed';
  showHints?: boolean;
  className?: string;
}

const DIMENSION_CONFIG: Record<keyof ScoreBreakdown, { label: string; weight: string; color: string }> = {
  powerWords: {
    label: 'Power Words',
    weight: '20%',
    color: 'bg-purple-500',
  },
  emotionalTriggers: {
    label: 'Emotional Triggers',
    weight: '25%',
    color: 'bg-pink-500',
  },
  readability: {
    label: 'Readability',
    weight: '20%',
    color: 'bg-blue-500',
  },
  cta: {
    label: 'Call-to-Action',
    weight: '15%',
    color: 'bg-green-500',
  },
  urgency: {
    label: 'Urgency',
    weight: '10%',
    color: 'bg-orange-500',
  },
  trust: {
    label: 'Trust Signals',
    weight: '10%',
    color: 'bg-cyan-500',
  },
};

const DIMENSIONS_ORDER: (keyof ScoreBreakdown)[] = [
  'emotionalTriggers',
  'powerWords',
  'readability',
  'cta',
  'urgency',
  'trust',
];

function ScoreBar({ dimension, value }: { dimension: keyof ScoreBreakdown; value: number }) {
  const config = DIMENSION_CONFIG[dimension];
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{config.label}</span>
        <span className="font-medium">{Math.round(value)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', config.color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CompactScore({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="flex gap-1">
      {DIMENSIONS_ORDER.map((dim) => {
        const config = DIMENSION_CONFIG[dim];
        const value = breakdown[dim];
        const intensity = value >= 80 ? 'opacity-100' : value >= 60 ? 'opacity-70' : 'opacity-40';

        return (
          <div
            key={dim}
            className={cn('w-3 h-3 rounded-sm', config.color, intensity)}
            title={`${config.label}: ${Math.round(value)}`}
          />
        );
      })}
    </div>
  );
}

export function ScoreDisplay({
  score,
  variant = 'bars',
  showHints = false,
  className,
}: ScoreDisplayProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-lg font-bold">{Math.round(score.total)}</span>
        <CompactScore breakdown={score.breakdown} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Total Score */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">Psychology Score</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{Math.round(score.total)}</span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="space-y-3">
        {DIMENSIONS_ORDER.map((dim) => (
          <ScoreBar key={dim} dimension={dim} value={score.breakdown[dim]} />
        ))}
      </div>

      {/* Improvement Hints */}
      {showHints && score.hints.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Improvement Suggestions</h4>
          <ul className="space-y-1">
            {score.hints.map((hint, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const percentage = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 36; // radius of 36
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 85 ? '#10b981' // emerald
    : percentage >= 75 ? '#22c55e' // green
    : percentage >= 65 ? '#eab308' // yellow
    : percentage >= 50 ? '#f97316' // orange
    : '#ef4444'; // red

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={36}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={36}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{Math.round(score)}</span>
      </div>
    </div>
  );
}

export default ScoreDisplay;
