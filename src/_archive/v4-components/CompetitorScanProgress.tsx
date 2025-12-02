/**
 * Competitor Scan Progress Component
 *
 * Shows clear visual phases during competitor intelligence gathering:
 * 1. Discovering - Finding competitors
 * 2. Validating - Cross-validating sources
 * 3. Scanning - Fetching competitor data
 * 4. Extracting - Extracting gaps/insights
 * 5. Analyzing - Strategic analysis
 *
 * Created: 2025-11-29
 */

import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Shield,
  Scan,
  Sparkles,
  Brain,
  Loader2,
  AlertCircle,
  Users,
  Target,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import type { ScanPhase, PhaseProgress, CollectorStatus } from '@/types/competitor-intelligence.types';

// ============================================================================
// PHASE CONFIGURATION
// ============================================================================

interface PhaseConfig {
  id: ScanPhase;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const PHASES: PhaseConfig[] = [
  {
    id: 'discovering',
    label: 'Discovering',
    description: 'Finding competitors in your market',
    icon: Search,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  {
    id: 'validating',
    label: 'Validating',
    description: 'Cross-referencing multiple sources',
    icon: Shield,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20'
  },
  {
    id: 'scanning',
    label: 'Scanning',
    description: 'Gathering competitor intelligence',
    icon: Scan,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20'
  },
  {
    id: 'extracting',
    label: 'Extracting',
    description: 'Finding gaps & opportunities',
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20'
  },
  {
    id: 'analyzing',
    label: 'Analyzing',
    description: 'Strategic intelligence synthesis',
    icon: Brain,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20'
  }
];

// ============================================================================
// PHASE STEP COMPONENT
// ============================================================================

interface PhaseStepProps {
  phase: PhaseConfig;
  status: 'pending' | 'active' | 'complete';
  isLast: boolean;
}

const PhaseStep = memo(function PhaseStep({ phase, status, isLast }: PhaseStepProps) {
  const Icon = phase.icon;

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <motion.div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${status === 'complete' ? 'bg-green-500/30' : status === 'active' ? phase.bgColor : 'bg-zinc-700/50'}
            transition-colors duration-300
          `}
          animate={status === 'active' ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: status === 'active' ? Infinity : 0 }}
        >
          {status === 'complete' ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : status === 'active' ? (
            <Loader2 className={`w-5 h-5 ${phase.color} animate-spin`} />
          ) : (
            <Icon className="w-5 h-5 text-zinc-500" />
          )}
        </motion.div>
        <span className={`
          text-xs mt-1 font-medium
          ${status === 'complete' ? 'text-green-400' : status === 'active' ? phase.color : 'text-zinc-500'}
        `}>
          {phase.label}
        </span>
      </div>

      {!isLast && (
        <div className={`
          w-8 h-0.5 mx-1
          ${status === 'complete' ? 'bg-green-500/50' : 'bg-zinc-700'}
        `} />
      )}
    </div>
  );
});

// ============================================================================
// COMPETITOR CHIP (shows discovered competitors)
// ============================================================================

interface CompetitorChipProps {
  name: string;
  status: 'discovering' | 'scanning' | 'complete' | 'error';
  progress?: number;
}

const CompetitorChip = memo(function CompetitorChip({ name, status, progress }: CompetitorChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
        ${status === 'complete' ? 'bg-green-500/20 text-green-300' :
          status === 'scanning' ? 'bg-cyan-500/20 text-cyan-300' :
          status === 'error' ? 'bg-red-500/20 text-red-300' :
          'bg-zinc-700/50 text-zinc-300'}
      `}
    >
      {status === 'scanning' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'complete' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'error' && <AlertCircle className="w-3 h-3" />}
      <span className="max-w-[120px] truncate">{name}</span>
      {status === 'scanning' && progress !== undefined && (
        <span className="text-[10px] opacity-70">{Math.round(progress)}%</span>
      )}
    </motion.div>
  );
});

// ============================================================================
// STATS ROW
// ============================================================================

interface StatsRowProps {
  competitorsFound: number;
  competitorsScanned: number;
  gapsExtracted: number;
  elapsedSeconds: number;
}

const StatsRow = memo(function StatsRow({
  competitorsFound,
  competitorsScanned,
  gapsExtracted,
  elapsedSeconds
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-700/50">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-400">{competitorsFound}</div>
        <div className="text-xs text-zinc-500">Found</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-cyan-400">{competitorsScanned}</div>
        <div className="text-xs text-zinc-500">Scanned</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-amber-400">{gapsExtracted}</div>
        <div className="text-xs text-zinc-500">Gaps</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-zinc-400">{elapsedSeconds.toFixed(1)}s</div>
        <div className="text-xs text-zinc-500">Elapsed</div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CompetitorScanProgressProps {
  isActive: boolean;
  phase: ScanPhase;
  phaseLabel?: string;
  competitorsFound: number;
  competitorsScanned: number;
  totalCompetitors: number;
  gapsExtracted: number;
  competitorStatuses?: Map<string, { name: string; status: string; progress: number }>;
  elapsedSeconds?: number;
  error?: string;
}

export const CompetitorScanProgress = memo(function CompetitorScanProgress({
  isActive,
  phase,
  phaseLabel,
  competitorsFound,
  competitorsScanned,
  totalCompetitors,
  gapsExtracted,
  competitorStatuses,
  elapsedSeconds = 0,
  error
}: CompetitorScanProgressProps) {
  if (!isActive && phase === 'idle') return null;

  // Determine which phases are complete/active
  const phaseIndex = PHASES.findIndex(p => p.id === phase);
  const currentPhaseConfig = PHASES.find(p => p.id === phase);

  // Calculate overall progress
  const overallProgress = phase === 'complete' ? 100 :
    phase === 'error' ? 0 :
    Math.min(95, ((phaseIndex + 1) / PHASES.length) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-5 mb-4 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {phase === 'complete' ? (
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
            ) : phase === 'error' ? (
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            ) : (
              <div className={`w-10 h-10 rounded-full ${currentPhaseConfig?.bgColor || 'bg-purple-500/20'} flex items-center justify-center`}>
                <Loader2 className={`w-6 h-6 ${currentPhaseConfig?.color || 'text-purple-400'} animate-spin`} />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-white">
                {phase === 'complete' ? 'Analysis Complete' :
                 phase === 'error' ? 'Analysis Failed' :
                 phaseLabel || currentPhaseConfig?.label || 'Processing...'}
              </h3>
              <p className="text-xs text-zinc-400">
                {phase === 'complete' ? `Found ${gapsExtracted} opportunities across ${competitorsScanned} competitors` :
                 phase === 'error' ? error || 'An error occurred' :
                 currentPhaseConfig?.description || 'Working...'}
              </p>
            </div>
          </div>

          {phase !== 'complete' && phase !== 'error' && (
            <div className="text-right">
              <div className="text-lg font-bold text-purple-400">{Math.round(overallProgress)}%</div>
              <div className="text-xs text-zinc-500">Overall</div>
            </div>
          )}
        </div>

        {/* Phase Steps */}
        <div className="flex items-center justify-center gap-1 mb-4 overflow-x-auto py-2">
          {PHASES.map((p, i) => (
            <PhaseStep
              key={p.id}
              phase={p}
              status={
                phase === 'complete' ? 'complete' :
                phase === 'error' ? (i < phaseIndex ? 'complete' : 'pending') :
                i < phaseIndex ? 'complete' :
                i === phaseIndex ? 'active' :
                'pending'
              }
              isLast={i === PHASES.length - 1}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-zinc-700/50 rounded-full overflow-hidden mb-4">
          <motion.div
            className={`h-full ${phase === 'complete' ? 'bg-green-500' : phase === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'}`}
            initial={{ width: '0%' }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Competitor Chips */}
        {competitorStatuses && competitorStatuses.size > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from(competitorStatuses.entries()).map(([id, data]) => (
              <CompetitorChip
                key={id}
                name={data.name}
                status={data.status as any}
                progress={data.progress}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <StatsRow
          competitorsFound={competitorsFound}
          competitorsScanned={competitorsScanned}
          gapsExtracted={gapsExtracted}
          elapsedSeconds={elapsedSeconds}
        />
      </motion.div>
    </AnimatePresence>
  );
});

export default CompetitorScanProgress;
