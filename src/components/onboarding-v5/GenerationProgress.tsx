/**
 * Generation Progress Component
 *
 * Shows real-time progress during campaign/post generation
 * with visual feedback for each stage of the process.
 *
 * Created: Nov 17, 2025 - Week 1 Workstream A
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import type { GenerationProgress, GenerationStage } from '@/types/campaign-generation.types';

interface GenerationProgressProps {
  progress: GenerationProgress;
  onCancel?: () => void;
}

export const GenerationProgressComponent: React.FC<GenerationProgressProps> = ({
  progress,
  onCancel,
}) => {
  const stages: Array<{ stage: GenerationStage; label: string; icon: string }> = [
    { stage: 'initializing', label: 'Initializing', icon: '🚀' },
    { stage: 'analyzing_business', label: 'Analyzing your business', icon: '🔍' },
    { stage: 'selecting_insights', label: 'Selecting key insights', icon: '💡' },
    { stage: 'generating_content', label: 'Generating content', icon: '✨' },
    { stage: 'generating_visuals', label: 'Creating visuals', icon: '🎨' },
    { stage: 'saving_to_database', label: 'Saving your campaign', icon: '💾' },
  ];

  const getStageStatus = (stage: GenerationStage): 'pending' | 'active' | 'complete' | 'error' => {
    const currentIndex = stages.findIndex((s) => s.stage === progress.stage);
    const stageIndex = stages.findIndex((s) => s.stage === stage);

    if (progress.stage === 'failed' && stageIndex === currentIndex) {
      return 'error';
    }

    if (stageIndex < currentIndex) {
      return 'complete';
    }

    if (stageIndex === currentIndex) {
      return 'active';
    }

    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-6"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Creating Your Content
          </h2>

          <p className="text-gray-600 dark:text-gray-400">
            {progress.stage === 'generating_content' && progress.currentPost
              ? `Generating post ${progress.currentPost} of ${progress.totalPosts}`
              : stages.find((s) => s.stage === progress.stage)?.label || 'Processing...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {progress.progress}%
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              />
            </div>
          </div>

          {/* Stage List */}
          <div className="space-y-3 mt-6">
            {stages.map((stageInfo, index) => {
              const status = getStageStatus(stageInfo.stage);

              return (
                <motion.div
                  key={stageInfo.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {status === 'pending' && (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}

                    {status === 'active' && (
                      <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
                    )}

                    {status === 'complete' && (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}

                    {status === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${
                        status === 'active'
                          ? 'text-purple-600 dark:text-purple-400'
                          : status === 'complete'
                          ? 'text-green-600 dark:text-green-400'
                          : status === 'error'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {stageInfo.icon} {stageInfo.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Post Progress (if generating content) */}
          {progress.stage === 'generating_content' && progress.currentPost && (
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                  Posts Generated
                </span>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {progress.currentPost} / {progress.totalPosts}
                </span>
              </div>

              <div className="mt-2 w-full h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{
                    width: `${((progress.currentPost || 0) / progress.totalPosts) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                />
              </div>
            </div>
          )}

          {/* Estimated Time Remaining */}
          {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Estimated time remaining:{' '}
              <span className="font-semibold">{progress.estimatedTimeRemaining}s</span>
            </div>
          )}

          {/* Errors */}
          {progress.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                    Some issues occurred
                  </div>
                  <ul className="text-sm text-red-800 dark:text-red-400 space-y-1">
                    {progress.errors.map((error, index) => (
                      <li key={index}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        {onCancel && progress.stage !== 'complete' && progress.stage !== 'failed' && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
            >
              Cancel Generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
