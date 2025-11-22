/**
 * Intelligence Loading Progress - Shows progress stages while building intelligence
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Brain, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

interface LoadingStage {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // seconds
}

const STAGES: LoadingStage[] = [
  {
    id: 'gathering',
    label: 'Gathering Intelligence',
    description: 'Analyzing your industry from 15+ intelligence sources including market research, competitor data, customer conversations, and industry trends',
    icon: <Sparkles className="w-5 h-5" />,
    duration: 25, // Sources in parallel (~25s actual)
  },
  {
    id: 'analyzing',
    label: 'Analyzing Patterns',
    description: 'Processing 75 high-priority data points with AI to identify customer triggers and emotional patterns',
    icon: <Brain className="w-5 h-5" />,
    duration: 75, // OPTIMIZED: Embeddings (75 points × ~1s = 75s, reduced from 200s)
  },
  {
    id: 'discovering',
    label: 'Discovering Connections',
    description: 'Clustering insights and discovering hidden patterns across market trends and customer psychology',
    icon: <TrendingUp className="w-5 h-5" />,
    duration: 35, // OPTIMIZED: Connection discovery + clustering (~35s, reduced from 80s)
  },
  {
    id: 'synthesizing',
    label: 'Building Your Strategy',
    description: 'Generating breakthrough marketing angles and actionable content recommendations',
    icon: <Users className="w-5 h-5" />,
    duration: 40, // OPTIMIZED: AI synthesis + content generation (~40s, reduced from 85s)
  },
];

interface IntelligenceLoadingProgressProps {
  message?: string;
}

export function IntelligenceLoadingProgress({ message }: IntelligenceLoadingProgressProps = {}) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [completedStages, setCompletedStages] = useState<string[]>([]);

  const currentStage = STAGES[currentStageIndex];
  const overallProgress = ((currentStageIndex + stageProgress / 100) / STAGES.length) * 100;

  useEffect(() => {
    // Simulate stage progression
    const stageDuration = currentStage.duration * 1000; // Convert to ms
    const updateInterval = 50; // Update every 50ms
    const incrementPerUpdate = (100 / stageDuration) * updateInterval;

    const interval = setInterval(() => {
      setStageProgress(prev => {
        const newProgress = prev + incrementPerUpdate;

        // CRITICAL FIX: Never reach 100% on the final stage automatically
        // This prevents the progress bar from showing "complete" while work is still running
        const isLastStage = currentStageIndex === STAGES.length - 1;
        const maxProgress = isLastStage ? 95 : 100; // Cap at 95% for final stage

        if (newProgress >= maxProgress) {
          if (!isLastStage) {
            // Move to next stage
            setCompletedStages(stages => [...stages, currentStage.id]);
            setCurrentStageIndex(currentStageIndex + 1);
            return 0;
          } else {
            // Stay at 95% on final stage, waiting for actual completion
            return maxProgress;
          }
        }

        return newProgress;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [currentStageIndex, currentStage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Main Loading Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-8 h-8 text-purple-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Building Your Intelligence Stack
              </h2>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400">
              {message || 'This takes ~2 minutes • Optimized for your industry'}
            </p>
          </div>

          {/* Progress Section */}
          <div className="p-8 space-y-6">
            {/* Overall Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Progress
                </span>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Stage List */}
            <div className="space-y-3">
              {STAGES.map((stage, index) => {
                const isCompleted = completedStages.includes(stage.id);
                const isCurrent = index === currentStageIndex;
                const isPending = index > currentStageIndex;

                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700'
                        : isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${
                        isCurrent
                          ? 'bg-purple-600 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          {stage.icon}
                        </motion.div>
                      ) : (
                        stage.icon
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-semibold ${
                            isCurrent || isCompleted
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {stage.label}
                        </h3>
                        {isCurrent && (
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {Math.round(stageProgress)}%
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm ${
                          isCurrent || isCompleted
                            ? 'text-gray-600 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {stage.description}
                      </p>

                      {/* Stage Progress Bar (only for current) */}
                      {isCurrent && (
                        <div className="mt-2 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-purple-600 dark:bg-purple-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${stageProgress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer Tips */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  What's happening behind the scenes?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  We're gathering intelligence from 15+ specialized sources tailored to your industry, analyzing competitor strategies, extracting customer psychological triggers, identifying market trends, and discovering hidden opportunities to create your breakthrough marketing strategy.
                </p>
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Industry-optimized • 75 high-priority insights • 70% faster than standard analysis</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {STAGES.map((stage, index) => (
            <div
              key={stage.id}
              className={`h-2 rounded-full transition-all ${
                index < currentStageIndex
                  ? 'w-8 bg-green-500'
                  : index === currentStageIndex
                  ? 'w-12 bg-purple-600'
                  : 'w-8 bg-gray-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
