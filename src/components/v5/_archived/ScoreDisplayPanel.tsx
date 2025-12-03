/**
 * V5 Score Display Panel
 *
 * Phase 3: Shows V5 scoring breakdown after generation
 * - 6-dimension breakdown (power words, emotional triggers, readability, CTA, urgency, trust)
 * - Overall score with visual meter/bar
 * - Quality tier badge: excellent (85+) / great (75+) / good (65+) / fair (50+) / needs work (<50)
 * - Expandable detail view for each dimension
 *
 * Created: 2025-12-01
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  BookOpen,
  MousePointer,
  Clock,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Star,
  Award
} from 'lucide-react';
import type { ContentScore, ScoreBreakdown, QualityTier } from '@/services/v5/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ScoreDisplayPanelProps {
  score: ContentScore | null;
  isCompact?: boolean;
  showHints?: boolean;
  className?: string;
}

// ============================================================================
// DIMENSION CONFIG
// ============================================================================

interface DimensionConfig {
  key: keyof ScoreBreakdown;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const DIMENSION_CONFIG: DimensionConfig[] = [
  {
    key: 'powerWords',
    label: 'Power Words',
    icon: Sparkles,
    color: 'purple',
    description: 'Action-driving language that creates emotional impact'
  },
  {
    key: 'emotionalTriggers',
    label: 'Emotional Triggers',
    icon: Zap,
    color: 'orange',
    description: 'Psychology triggers that connect with customer motivations'
  },
  {
    key: 'readability',
    label: 'Readability',
    icon: BookOpen,
    color: 'blue',
    description: 'How easy the content is to scan and understand'
  },
  {
    key: 'cta',
    label: 'Call to Action',
    icon: MousePointer,
    color: 'green',
    description: 'Strength and clarity of the action prompt'
  },
  {
    key: 'urgency',
    label: 'Urgency',
    icon: Clock,
    color: 'red',
    description: 'Time-sensitive language that drives immediate action'
  },
  {
    key: 'trust',
    label: 'Trust Signals',
    icon: Shield,
    color: 'emerald',
    description: 'Credibility markers and proof elements'
  }
];

// ============================================================================
// TIER CONFIG
// ============================================================================

interface TierConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

const TIER_CONFIG: Record<QualityTier, TierConfig> = {
  excellent: {
    label: 'Excellent',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: Award
  },
  great: {
    label: 'Great',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: Star
  },
  good: {
    label: 'Good',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: CheckCircle2
  },
  fair: {
    label: 'Fair',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: TrendingUp
  },
  poor: {
    label: 'Needs Work',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertCircle
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 75) return 'bg-green-500';
  if (score >= 65) return 'bg-blue-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getDimensionColor(color: string): { bar: string; text: string; bg: string } {
  const colors: Record<string, { bar: string; text: string; bg: string }> = {
    purple: { bar: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    orange: { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    blue: { bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    green: { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    red: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
  };
  return colors[color] || colors.blue;
}

// ============================================================================
// COMPONENTS
// ============================================================================

const ScoreMeter = memo(function ScoreMeter({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-sm',
    md: 'w-20 h-20 text-lg',
    lg: 'w-24 h-24 text-xl'
  };

  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const radius = size === 'lg' ? 40 : size === 'md' ? 34 : 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={getScoreColor(score).replace('bg-', 'text-')}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold">{Math.round(score)}</span>
      </div>
    </div>
  );
});

const DimensionBar = memo(function DimensionBar({
  config,
  value,
  isExpanded,
  onToggle
}: {
  config: DimensionConfig;
  value: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = config.icon;
  const colors = getDimensionColor(config.color);

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-1 py-0.5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${colors.bg}`}>
            <Icon className={`w-3 h-3 ${colors.text}`} />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${colors.text}`}>
            {Math.round(value)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colors.bar} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Expanded description */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-7 pt-1">
              {config.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const TierBadge = memo(function TierBadge({ tier, passed }: { tier: QualityTier; passed: boolean }) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor}`}>
      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      <span className={`text-xs font-bold ${config.color}`}>
        {config.label}
      </span>
      {passed && (
        <CheckCircle2 className="w-3 h-3 text-green-500 ml-0.5" />
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ScoreDisplayPanel = memo(function ScoreDisplayPanel({
  score,
  isCompact = false,
  showHints = true,
  className = ''
}: ScoreDisplayPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!isCompact);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  if (!score) {
    return null;
  }

  const toggleDimension = (key: string) => {
    setExpandedDimension(prev => prev === key ? null : key);
  };

  // Compact view - just the score badge
  if (isCompact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors ${className}`}
      >
        <div className={`w-2 h-2 rounded-full ${getScoreColor(score.total)}`} />
        <span className="text-sm font-bold">{Math.round(score.total)}/100</span>
        <TierBadge tier={score.tier} passed={score.passed} />
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  return (
    <motion.div
      initial={isCompact ? { opacity: 0, y: -10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScoreMeter score={score.total} size="sm" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Content Score
                </span>
                <TierBadge tier={score.tier} passed={score.passed} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                6-dimension psychology scoring
              </p>
            </div>
          </div>
          {isCompact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Dimension breakdown */}
      <div className="p-3 space-y-3">
        {DIMENSION_CONFIG.map((config) => (
          <DimensionBar
            key={config.key}
            config={config}
            value={score.breakdown[config.key]}
            isExpanded={expandedDimension === config.key}
            onToggle={() => toggleDimension(config.key)}
          />
        ))}
      </div>

      {/* Hints section */}
      {showHints && score.hints && score.hints.length > 0 && (
        <div className="px-3 pb-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Improvement Hints
              </span>
            </div>
            <ul className="space-y-1">
              {score.hints.map((hint, idx) => (
                <li key={idx} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {hint}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Quality gate indicator */}
      {!score.passed && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span>Score below 75 - consider regenerating</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default ScoreDisplayPanel;
