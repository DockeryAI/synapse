/**
 * Retry Progress Component
 *
 * Shows retry attempts and progress when operations fail and are being retried.
 * Displays user-friendly error messages and countdown to next retry.
 *
 * Created: Nov 17, 2025 - Week 2 Workstream C
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Clock } from 'lucide-react';
import type { RetryProgress as RetryProgressType } from '@/services/errors/error-handler.service';

interface RetryProgressProps {
  progress: RetryProgressType;
  operation: string; // e.g., "website extraction", "AI generation"
}

export const RetryProgress: React.FC<RetryProgressProps> = ({ progress, operation }) => {
  const [countdown, setCountdown] = useState<number>(
    progress.nextRetryIn ? Math.ceil(progress.nextRetryIn / 1000) : 0
  );

  // Update countdown every second
  useEffect(() => {
    if (!progress.nextRetryIn) {
      setCountdown(0);
      return;
    }

    setCountdown(Math.ceil(progress.nextRetryIn / 1000));

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.nextRetryIn]);

  const isRetrying = countdown > 0;
  const hasError = Boolean(progress.error);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isRetrying ? (
            <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-spin" />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
            {isRetrying
              ? `Retrying ${operation}...`
              : `Attempting ${operation}`}
          </div>

          {/* Error Message */}
          {hasError && progress.error?.userMessage && (
            <p className="text-sm text-orange-800 dark:text-orange-400 mb-2">
              {progress.error.userMessage}
            </p>
          )}

          {/* Attempt Counter */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-orange-700 dark:text-orange-500">
                Attempt {progress.attempt} of {progress.maxAttempts}
              </span>
            </div>

            {/* Countdown */}
            {isRetrying && countdown > 0 && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full"
              >
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-orange-900 dark:text-orange-300 font-medium tabular-nums">
                  Next attempt in {countdown}s
                </span>
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full h-2 bg-orange-200 dark:bg-orange-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(progress.attempt / progress.maxAttempts) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
            />
          </div>

          {/* Reassurance Message */}
          {progress.attempt === progress.maxAttempts && !isRetrying && (
            <p className="mt-2 text-xs text-orange-700 dark:text-orange-500">
              This is the final attempt. If it fails, we'll use cached data or minimal information.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
