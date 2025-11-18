/**
 * Confidence Meter Component (Enhanced)
 *
 * Displays AI confidence scores with visual indicators
 * Shows data quality metrics and source reliability
 *
 * Enhancements:
 * - Animated number counting
 * - Color-coded tiers with exact colors
 * - Tooltips explaining score components
 * - Hover micro-interactions
 * - Dark mode optimized
 *
 * Created: 2025-11-18
 * Enhanced: 2025-11-18
 */

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { InfoTooltip, commonTooltips } from './InfoTooltip';

export interface ConfidenceScore {
  overall: number; // 0-100
  dataQuality: number; // 0-100
  sourceCount: number; // Number of sources used
  modelAgreement: number; // 0-100 (how much models agree)
  reasoning?: string; // Why this confidence score
}

interface ConfidenceMeterProps {
  score: ConfidenceScore;
  compact?: boolean;
  showBreakdown?: boolean;
  className?: string;
}

/**
 * Animated number counter
 */
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [display]);

  return <span>{displayValue}</span>;
}

export function ConfidenceMeter({
  score,
  compact = false,
  showBreakdown = true,
  className = '',
}: ConfidenceMeterProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getConfidenceLevel = (value: number): {
    label: string;
    color: string;
    icon: React.ReactNode;
    gradient: string;
    bgColor: string;
  } => {
    // Exact color tiers as specified
    if (value >= 90) {
      return {
        label: 'Exceptional',
        color: 'text-green-700 dark:text-green-400',
        icon: <CheckCircle2 className="w-4 h-4" />,
        gradient: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-500',
      };
    } else if (value >= 75) {
      return {
        label: 'Excellent',
        color: 'text-lime-700 dark:text-lime-400',
        icon: <CheckCircle2 className="w-4 h-4" />,
        gradient: 'from-lime-500 to-green-500',
        bgColor: 'bg-lime-500',
      };
    } else if (value >= 60) {
      return {
        label: 'Good',
        color: 'text-yellow-700 dark:text-yellow-400',
        icon: <TrendingUp className="w-4 h-4" />,
        gradient: 'from-yellow-500 to-amber-500',
        bgColor: 'bg-yellow-500',
      };
    } else if (value >= 40) {
      return {
        label: 'Moderate',
        color: 'text-orange-700 dark:text-orange-400',
        icon: <Info className="w-4 h-4" />,
        gradient: 'from-orange-500 to-amber-500',
        bgColor: 'bg-orange-500',
      };
    } else {
      return {
        label: 'Low',
        color: 'text-red-700 dark:text-red-400',
        icon: <AlertTriangle className="w-4 h-4" />,
        gradient: 'from-red-500 to-rose-500',
        bgColor: 'bg-red-500',
      };
    }
  };

  const confidenceLevel = getConfidenceLevel(score.overall);

  if (compact) {
    return (
      <motion.div
        className={`flex items-center gap-2 ${className}`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score.overall}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${confidenceLevel.gradient}`}
          />
        </div>
        <span className={`text-xs font-medium ${confidenceLevel.color}`}>
          <AnimatedNumber value={score.overall} />%
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`space-y-3 ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className={confidenceLevel.color}
            animate={{
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {confidenceLevel.icon}
          </motion.div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {confidenceLevel.label}
          </span>
          <InfoTooltip
            title="Confidence Score"
            content="Overall confidence in the AI analysis based on data quality, source reliability, and model agreement. Higher is better."
          />
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-2xl font-bold ${confidenceLevel.color}`}>
            <AnimatedNumber value={score.overall} />
          </span>
          <span className={`text-sm font-medium ${confidenceLevel.color}`}>%</span>
        </div>
      </div>

      {/* Progress Bar with Animation */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score.overall}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${confidenceLevel.gradient} relative`}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </motion.div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.3 }}
          className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          {/* Data Quality */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 dark:text-gray-400">Data Quality</span>
              <InfoTooltip
                title={commonTooltips.dataQuality.title}
                content={commonTooltips.dataQuality.content}
                side="right"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score.dataQuality}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                <AnimatedNumber value={score.dataQuality} />%
              </span>
            </div>
          </div>

          {/* Model Agreement */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 dark:text-gray-400">Model Agreement</span>
              <InfoTooltip
                title={commonTooltips.modelAgreement.title}
                content={commonTooltips.modelAgreement.content}
                side="right"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score.modelAgreement}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                <AnimatedNumber value={score.modelAgreement} />%
              </span>
            </div>
          </div>

          {/* Source Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Data Sources</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {score.sourceCount} {score.sourceCount === 1 ? 'source' : 'sources'}
            </span>
          </div>

          {/* Reasoning */}
          {score.reasoning && (
            <div className="pt-2 text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
              {score.reasoning}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Inline Confidence Badge - Compact version for inline display
 * Enhanced with hover effects
 */
export function ConfidenceBadge({ score }: { score: number }) {
  const getColor = (value: number) => {
    if (value >= 90) return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
    if (value >= 75) return 'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 border-lime-300 dark:border-lime-700';
    if (value >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
    if (value >= 40) return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700';
    return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
  };

  return (
    <motion.span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getColor(score)}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-current"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
      <AnimatedNumber value={score} />%
    </motion.span>
  );
}
