/**
 * Progress Indicator Component
 * Accessible progress bars for long-running operations
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'gradient' | 'striped';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  label,
  showPercentage = true,
  variant = 'default',
  size = 'md',
  className,
  ariaLabel,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const barClasses = cn(
    'transition-all duration-300 ease-out shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full',
    {
      'bg-blue-500': variant === 'default',
      'bg-gradient-to-r from-blue-500 to-purple-500': variant === 'gradient',
      'bg-blue-500 bg-stripes': variant === 'striped',
    }
  );

  return (
    <div className={cn('relative', className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clampedProgress} aria-label={ariaLabel || label || 'Progress'}>
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <div className="flex mb-2 items-center justify-between text-sm">
          {label && <span className="text-gray-700 dark:text-gray-300">{label}</span>}
          {showPercentage && (
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className={cn('overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700', sizeClasses[size])}>
        <div
          className={barClasses}
          style={{ width: `${clampedProgress}%` }}
          role="presentation"
        />
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">
        {label || 'Progress'}: {Math.round(clampedProgress)}% complete
      </span>
    </div>
  );
};

/**
 * Step Progress Indicator
 * Shows progress through multiple steps
 */
interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)} role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={currentStep + 1} aria-label={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex justify-between items-start">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div
              key={index}
              className={cn(
                'flex flex-col items-center gap-2 flex-1',
                index !== steps.length - 1 && 'border-r border-gray-200 dark:border-gray-700'
              )}
            >
              {/* Step Number */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                  {
                    'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-110': isActive,
                    'bg-green-500 text-white': isCompleted,
                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400': !isActive && !isCompleted,
                  }
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? '✓' : index + 1}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  'text-xs text-center transition-colors duration-300 px-1',
                  {
                    'text-blue-600 dark:text-blue-400 font-semibold': isActive,
                    'text-green-600 dark:text-green-400': isCompleted,
                    'text-gray-500 dark:text-gray-400': !isActive && !isCompleted,
                  }
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">
        Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
      </span>
    </div>
  );
};

/**
 * Circular Progress Indicator
 */
interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  label,
  className,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedProgress}
      aria-label={label || `${Math.round(clampedProgress)}% complete`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-500 transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center label */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          {Math.round(clampedProgress)}%
        </span>
        {label && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {label}
          </span>
        )}
      </div>

      <span className="sr-only">{Math.round(clampedProgress)}% complete</span>
    </div>
  );
};

/**
 * Indeterminate Progress (Spinner)
 */
interface IndeterminateProgressProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const IndeterminateProgress: React.FC<IndeterminateProgressProps> = ({
  label,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)} role="status" aria-label={label || 'Loading'}>
      <div className={cn('animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-500', sizeClasses[size])} />
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      )}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
};
