/**
 * Gap Skeleton Cards
 *
 * Animated placeholder cards shown while gaps are being extracted.
 * Individual skeletons disappear as real gaps stream in.
 *
 * Created: 2025-11-28
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// ============================================================================
// SKELETON CARD COMPONENT
// ============================================================================

interface GapSkeletonCardProps {
  competitorName?: string;
  index?: number;
}

export const GapSkeletonCard: React.FC<GapSkeletonCardProps> = ({
  competitorName,
  index = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 animate-pulse"
    >
      {/* Header with loading indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
          <div className="h-4 bg-zinc-700/50 rounded w-32" />
        </div>
        {competitorName && (
          <span className="text-xs text-zinc-500 bg-zinc-700/30 px-2 py-1 rounded">
            {competitorName}
          </span>
        )}
      </div>

      {/* Title skeleton */}
      <div className="h-5 bg-zinc-700/50 rounded w-3/4 mb-3" />

      {/* Content skeletons */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-700/30 rounded w-full" />
        <div className="h-3 bg-zinc-700/30 rounded w-5/6" />
        <div className="h-3 bg-zinc-700/30 rounded w-4/6" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-700/30">
        <div className="h-3 bg-zinc-700/30 rounded w-20" />
        <div className="h-3 bg-zinc-700/30 rounded w-16" />
      </div>
    </motion.div>
  );
};

// ============================================================================
// SKELETON GRID COMPONENT
// ============================================================================

interface GapSkeletonGridProps {
  count?: number;
  competitorNames?: string[];
  isScanning?: boolean;
  scanProgress?: Map<string, number>;
}

export const GapSkeletonGrid: React.FC<GapSkeletonGridProps> = ({
  count = 5,
  competitorNames = [],
  isScanning = false,
  scanProgress
}) => {
  if (!isScanning) return null;

  return (
    <div className="space-y-3">
      {/* Scanning status header */}
      <div className="flex items-center gap-2 px-1 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        <span>Scanning competitors and extracting gaps...</span>
      </div>

      {/* Scanning progress per competitor */}
      {scanProgress && scanProgress.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from(scanProgress.entries()).map(([competitorId, progress]) => {
            const name = competitorNames.find((_, i) => i.toString() === competitorId) || `Competitor ${competitorId.slice(0, 6)}`;
            const progressPercent = Math.round(progress * 100);
            return (
              <div
                key={competitorId}
                className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full text-xs"
              >
                {progressPercent < 100 ? (
                  <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                )}
                <span className="text-zinc-300">{name}</span>
                <span className="text-zinc-500">{progressPercent}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Skeleton cards grid */}
      <AnimatePresence>
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: count }).map((_, i) => (
            <GapSkeletonCard
              key={`skeleton-${i}`}
              competitorName={competitorNames[i % competitorNames.length]}
              index={i}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// STREAMING GAP INDICATOR
// ============================================================================

interface StreamingGapIndicatorProps {
  gapsFound: number;
  competitorsScanned: number;
  totalCompetitors: number;
  isActive: boolean;
}

export const StreamingGapIndicator: React.FC<StreamingGapIndicatorProps> = ({
  gapsFound,
  competitorsScanned,
  totalCompetitors,
  isActive
}) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/30 rounded-lg p-3 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            <div className="absolute inset-0 h-5 w-5 rounded-full bg-purple-400/20 animate-ping" />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-200">
              Streaming competitor intelligence...
            </div>
            <div className="text-xs text-zinc-400">
              {competitorsScanned}/{totalCompetitors} competitors scanned
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">{gapsFound}</div>
          <div className="text-xs text-zinc-500">gaps found</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          initial={{ width: '0%' }}
          animate={{ width: `${(competitorsScanned / totalCompetitors) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// LOW CONFIDENCE BADGE
// ============================================================================

export const LowConfidenceBadge: React.FC = () => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full">
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      Low confidence
    </span>
  );
};

export default GapSkeletonGrid;
