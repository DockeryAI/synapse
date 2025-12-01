/**
 * Trigger Confidence Badge Component
 *
 * Visual confidence indicator for triggers with:
 * - Gradient background based on confidence level
 * - Optional animated ring for high confidence
 * - Size variants (sm, md, lg)
 * - Tooltip with confidence breakdown
 *
 * Created: 2025-12-01
 */

import React, { memo } from 'react';
import type { ConfidenceLevel } from '@/services/triggers/confidence-scorer.service';

// ============================================================================
// TYPES
// ============================================================================

export interface ConfidenceBreakdown {
  signalQuality?: number;
  recencyWeight?: number;
  sourceCount?: number;
  competitorAttribution?: number;
  overallScore: number;
}

export interface TriggerConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  breakdown?: ConfidenceBreakdown;
  className?: string;
}

// ============================================================================
// CONFIDENCE LEVEL CONFIG
// ============================================================================

interface ConfidenceLevelConfig {
  level: ConfidenceLevel;
  label: string;
  gradient: string;
  textColor: string;
  ringColor: string;
  bgColor: string;
}

function getConfidenceConfig(score: number): ConfidenceLevelConfig {
  if (score >= 0.7) {
    return {
      level: 'high',
      label: 'High',
      gradient: 'from-green-500 to-emerald-600',
      textColor: 'text-white',
      ringColor: 'ring-green-400/50',
      bgColor: 'bg-green-500',
    };
  } else if (score >= 0.45) {
    return {
      level: 'medium',
      label: 'Medium',
      gradient: 'from-amber-500 to-yellow-600',
      textColor: 'text-white',
      ringColor: 'ring-amber-400/50',
      bgColor: 'bg-amber-500',
    };
  } else {
    return {
      level: 'low',
      label: 'Low',
      gradient: 'from-orange-500 to-red-600',
      textColor: 'text-white',
      ringColor: 'ring-orange-400/50',
      bgColor: 'bg-orange-500',
    };
  }
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

interface SizeConfig {
  container: string;
  text: string;
  ring: string;
  padding: string;
}

const SIZE_CONFIG: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: {
    container: 'h-5',
    text: 'text-[10px]',
    ring: 'ring-1',
    padding: 'px-1.5 py-0.5',
  },
  md: {
    container: 'h-6',
    text: 'text-xs',
    ring: 'ring-2',
    padding: 'px-2.5 py-1',
  },
  lg: {
    container: 'h-8',
    text: 'text-sm',
    ring: 'ring-2',
    padding: 'px-3 py-1.5',
  },
};

// ============================================================================
// CONFIDENCE BREAKDOWN TOOLTIP
// ============================================================================

interface BreakdownTooltipProps {
  breakdown: ConfidenceBreakdown;
}

const BreakdownTooltip = memo(function BreakdownTooltip({ breakdown }: BreakdownTooltipProps) {
  const formatPercent = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="p-3 space-y-2 min-w-[200px]">
      <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
        Confidence Breakdown
      </div>

      {breakdown.signalQuality !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Signal Quality</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatPercent(breakdown.signalQuality)}
          </span>
        </div>
      )}

      {breakdown.recencyWeight !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Recency Weight</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatPercent(breakdown.recencyWeight)}
          </span>
        </div>
      )}

      {breakdown.sourceCount !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Source Count</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {breakdown.sourceCount} sources
          </span>
        </div>
      )}

      {breakdown.competitorAttribution !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Competitor Attribution</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatPercent(breakdown.competitorAttribution)}
          </span>
        </div>
      )}

      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Overall Score</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {formatPercent(breakdown.overallScore)}
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TriggerConfidenceBadge = memo(function TriggerConfidenceBadge({
  score,
  size = 'md',
  showLabel = false,
  animated = false,
  breakdown,
  className = '',
}: TriggerConfidenceBadgeProps) {
  const confidenceConfig = getConfidenceConfig(score);
  const sizeConfig = SIZE_CONFIG[size];
  const percentScore = Math.round(score * 100);

  const isHighConfidence = score >= 0.7;

  // Build class names
  const containerClasses = [
    'inline-flex items-center justify-center',
    'rounded-full',
    `bg-gradient-to-r ${confidenceConfig.gradient}`,
    sizeConfig.padding,
    sizeConfig.container,
    confidenceConfig.textColor,
    // Animated ring for high confidence
    animated && isHighConfidence && `${sizeConfig.ring} ${confidenceConfig.ringColor} animate-pulse`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <div className={containerClasses}>
      <span className={`font-bold ${sizeConfig.text}`}>
        {percentScore}%
        {showLabel && (
          <span className="ml-1 font-medium opacity-90">{confidenceConfig.label}</span>
        )}
      </span>
    </div>
  );

  // If we have breakdown, wrap in a tooltip-capable container
  if (breakdown) {
    return (
      <div className="relative group">
        {content}
        <div className="absolute z-50 hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
            <BreakdownTooltip breakdown={breakdown} />
          </div>
          {/* Arrow */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1">
            <div className="w-2 h-2 bg-white dark:bg-slate-800 border-t border-l border-gray-200 dark:border-slate-700 transform rotate-45" />
          </div>
        </div>
      </div>
    );
  }

  return content;
});

// ============================================================================
// CONFIDENCE BAR COMPONENT (for detailed views)
// ============================================================================

export interface TriggerConfidenceBarProps {
  score: number;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TriggerConfidenceBar = memo(function TriggerConfidenceBar({
  score,
  showLabel = true,
  height = 'md',
  className = '',
}: TriggerConfidenceBarProps) {
  const confidenceConfig = getConfidenceConfig(score);
  const percentScore = Math.round(score * 100);

  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-400">Confidence</span>
          <span className={`font-medium ${confidenceConfig.bgColor.replace('bg-', 'text-')}`}>
            {percentScore}% {confidenceConfig.label}
          </span>
        </div>
      )}
      <div
        className={`w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden ${heightClasses[height]}`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${confidenceConfig.gradient} transition-all duration-500`}
          style={{ width: `${percentScore}%` }}
        />
      </div>
    </div>
  );
});

// ============================================================================
// CONFIDENCE METER COMPONENT (circular gauge)
// ============================================================================

export interface TriggerConfidenceMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

export const TriggerConfidenceMeter = memo(function TriggerConfidenceMeter({
  score,
  size = 48,
  strokeWidth = 4,
  showPercentage = true,
  className = '',
}: TriggerConfidenceMeterProps) {
  const confidenceConfig = getConfidenceConfig(score);
  const percentScore = Math.round(score * 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score);

  // Get solid color for SVG (gradient not easily supported in SVG stroke)
  const strokeColor = score >= 0.7 ? '#10b981' : score >= 0.45 ? '#f59e0b' : '#f97316';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${confidenceConfig.bgColor.replace('bg-', 'text-')}`}>
            {percentScore}
          </span>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export default TriggerConfidenceBadge;
