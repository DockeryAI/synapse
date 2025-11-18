/**
 * PROFILE GENERATION PROGRESS COMPONENT
 *
 * Displays real-time progress for industry profile generation
 * Shows 8 phases with animated progress bar and ETA
 */

import React from 'react';
import { type GenerationProgress } from '@/types/industry-profile.types';
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';

interface ProfileGenerationProgressProps {
  progress: GenerationProgress;
  industryName: string;
}

const PHASE_LABELS = {
  research: 'Industry Research',
  psychology: 'Customer Psychology Analysis',
  market: 'Market Intelligence Gathering',
  messaging: 'Messaging Framework Development',
  operational: 'Operational Context Analysis',
  generating: 'AI Profile Generation',
  validation: 'Data Validation',
  saving: 'Saving to Database',
  complete: 'Complete',
  error: 'Error'
} as const;

const PHASE_ICONS = {
  research: '🔍',
  psychology: '🧠',
  market: '📊',
  messaging: '💬',
  operational: '⚙️',
  generating: '🤖',
  validation: '✅',
  saving: '💾',
  complete: '🎉',
  error: '❌'
} as const;

export function ProfileGenerationProgress({
  progress,
  industryName
}: ProfileGenerationProgressProps) {
  const { stage, progress: percentage, message, estimatedTimeRemaining } = progress;

  const isError = stage === 'error';
  const isComplete = stage === 'complete';

  // Determine which phases are complete, current, and pending
  const phases = [
    'research',
    'psychology',
    'market',
    'messaging',
    'operational',
    'generating',
    'validation',
    'saving'
  ] as const;

  const getCurrentPhaseIndex = () => {
    if (isComplete) return phases.length;
    if (isError) return -1; // Error state doesn't have an index
    return phases.indexOf(stage as typeof phases[number]);
  };

  const currentPhaseIndex = getCurrentPhaseIndex();

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Generating Industry Profile
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {industryName}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(percentage)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              isError
                ? 'bg-red-500'
                : isComplete
                ? 'bg-green-500'
                : 'bg-blue-500 animate-pulse'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {!isComplete && !isError && estimatedTimeRemaining > 0 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
            Estimated time remaining: {formatTime(estimatedTimeRemaining)}
          </div>
        )}
      </div>

      {/* Phase List */}
      <div className="space-y-3">
        {phases.map((phase, index) => {
          const isCurrentPhase = index === currentPhaseIndex;
          const isCompletedPhase = index < currentPhaseIndex;
          const isPendingPhase = index > currentPhaseIndex;

          return (
            <div
              key={phase}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isCurrentPhase
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : isCompletedPhase
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : 'bg-gray-50 dark:bg-gray-900/20'
              }`}
            >
              {/* Phase Icon */}
              <div className="flex-shrink-0">
                {isCompletedPhase ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : isCurrentPhase ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Phase Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{PHASE_ICONS[phase]}</span>
                  <span
                    className={`text-sm font-medium ${
                      isCurrentPhase
                        ? 'text-blue-900 dark:text-blue-100'
                        : isCompletedPhase
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {PHASE_LABELS[phase]}
                  </span>
                </div>

                {isCurrentPhase && !isComplete && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {message}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                {isCompletedPhase && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Done
                  </span>
                )}
                {isCurrentPhase && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                Profile Generated Successfully!
              </h4>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Your comprehensive industry profile is ready to use.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {isError && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
                Generation Failed
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fun Fact */}
      {!isComplete && !isError && percentage > 20 && (
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-900/30 rounded border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold">💡 Did you know?</span> We're analyzing over 40 data points including customer triggers, pain points, messaging frameworks, and market trends to create your personalized industry profile.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Format seconds into human-readable time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}
