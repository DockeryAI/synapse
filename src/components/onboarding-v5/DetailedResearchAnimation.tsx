/**
 * DETAILED RESEARCH ANIMATION
 *
 * Shows phase-by-phase progress during on-demand profile generation
 * Keeps user informed with detailed status and estimated times
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  MessageSquare,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export interface ResearchPhase {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number; // 0-100
  estimatedSeconds: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface DetailedResearchAnimationProps {
  industryName: string;
  naicsCode: string;
  currentProgress: number; // Overall progress 0-100
  estimatedTimeRemaining: number; // seconds
}

export const DetailedResearchAnimation: React.FC<DetailedResearchAnimationProps> = ({
  industryName,
  naicsCode,
  currentProgress,
  estimatedTimeRemaining,
}) => {
  const [phases, setPhases] = useState<ResearchPhase[]>([
    {
      id: 'psychology',
      name: 'Customer Psychology Analysis',
      description: 'Analyzing customer triggers, pain points, and decision drivers',
      icon: <Brain className="h-5 w-5" />,
      progress: 0,
      estimatedSeconds: 90,
      status: 'pending',
    },
    {
      id: 'messaging',
      name: 'Messaging Framework Development',
      description: 'Crafting power words, headlines, and CTAs',
      icon: <MessageSquare className="h-5 w-5" />,
      progress: 0,
      estimatedSeconds: 60,
      status: 'pending',
    },
    {
      id: 'market',
      name: 'Market Intelligence Gathering',
      description: 'Researching trends, demographics, and competitive landscape',
      icon: <TrendingUp className="h-5 w-5" />,
      progress: 0,
      estimatedSeconds: 90,
      status: 'pending',
    },
    {
      id: 'seasonal',
      name: 'Seasonal Patterns Analysis',
      description: 'Identifying peak seasons and marketing calendar opportunities',
      icon: <Calendar className="h-5 w-5" />,
      progress: 0,
      estimatedSeconds: 45,
      status: 'pending',
    },
    {
      id: 'validation',
      name: 'Validation & Storage',
      description: 'Saving your industry profile for instant future access',
      icon: <CheckCircle2 className="h-5 w-5" />,
      progress: 0,
      estimatedSeconds: 15,
      status: 'pending',
    },
  ]);

  // Update phases based on overall progress
  useEffect(() => {
    setPhases((prevPhases) => {
      const newPhases = [...prevPhases];

      // Map progress to phases (each phase is ~20% of total)
      if (currentProgress >= 0 && currentProgress < 25) {
        newPhases[0].status = 'in_progress';
        newPhases[0].progress = (currentProgress / 25) * 100;
      } else if (currentProgress >= 25 && currentProgress < 50) {
        newPhases[0].status = 'completed';
        newPhases[0].progress = 100;
        newPhases[1].status = 'in_progress';
        newPhases[1].progress = ((currentProgress - 25) / 25) * 100;
      } else if (currentProgress >= 50 && currentProgress < 75) {
        newPhases[0].status = 'completed';
        newPhases[0].progress = 100;
        newPhases[1].status = 'completed';
        newPhases[1].progress = 100;
        newPhases[2].status = 'in_progress';
        newPhases[2].progress = ((currentProgress - 50) / 25) * 100;
      } else if (currentProgress >= 75 && currentProgress < 90) {
        newPhases[0].status = 'completed';
        newPhases[0].progress = 100;
        newPhases[1].status = 'completed';
        newPhases[1].progress = 100;
        newPhases[2].status = 'completed';
        newPhases[2].progress = 100;
        newPhases[3].status = 'in_progress';
        newPhases[3].progress = ((currentProgress - 75) / 15) * 100;
      } else if (currentProgress >= 90) {
        newPhases[0].status = 'completed';
        newPhases[0].progress = 100;
        newPhases[1].status = 'completed';
        newPhases[1].progress = 100;
        newPhases[2].status = 'completed';
        newPhases[2].progress = 100;
        newPhases[3].status = 'completed';
        newPhases[3].progress = 100;
        newPhases[4].status = 'in_progress';
        newPhases[4].progress = ((currentProgress - 90) / 10) * 100;
      }

      return newPhases;
    });
  }, [currentProgress]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const currentPhase = phases.find((p) => p.status === 'in_progress');
  const completedPhases = phases.filter((p) => p.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              Building Your Industry Profile
            </span>
          </motion.div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            {industryName}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            NAICS {naicsCode} • Deep Research In Progress
          </p>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {Math.round(currentProgress)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-center mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            ⏱️ About {formatTime(estimatedTimeRemaining)} remaining
          </div>
        </div>

        {/* Current Phase */}
        {currentPhase && (
          <motion.div
            className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="flex items-start gap-5 mb-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                {currentPhase.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                    {currentPhase.name}
                  </h3>
                  <motion.div
                    className="w-2 h-2 rounded-full bg-purple-600"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentPhase.description}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  Phase Progress
                </span>
                <span className="font-bold text-purple-900 dark:text-purple-100">
                  {Math.round(currentPhase.progress)}%
                </span>
              </div>
              <div className="w-full bg-white dark:bg-slate-800 rounded-full h-2.5 shadow-inner">
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full shadow-md"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentPhase.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase List */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 shadow-md">
          <h3 className="font-semibold text-sm mb-4 text-slate-700 dark:text-slate-300">
            Research Phases
          </h3>
          <div className="space-y-3">
            {phases.map((phase, index) => (
              <motion.div
                key={phase.id}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    phase.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                      : phase.status === 'in_progress'
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {phase.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : phase.status === 'in_progress' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium ${
                      phase.status === 'completed'
                        ? 'text-green-700 dark:text-green-400'
                        : phase.status === 'in_progress'
                        ? 'text-purple-700 dark:text-purple-400'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}
                  >
                    {phase.name}
                  </div>
                </div>
                {phase.status === 'completed' && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Done
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Completed Count */}
        <motion.div
          className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Completed {completedPhases.length} of {phases.length} phases
        </motion.div>
      </motion.div>
    </div>
  );
};
