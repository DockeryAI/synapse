/**
 * UVP Milestone Progress - 6-Step Visual Progress Bar
 *
 * Shows all 6 UVP steps with one-word names as milestones
 * - Visual indication of current step
 * - Clickable completed steps for navigation
 * - Disabled future steps
 *
 * Created: 2025-11-20
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UVPStep =
  | 'products'
  | 'customer'
  | 'solution'
  | 'benefit'
  | 'synthesis';

// Legacy type for backward compatibility (transformation merged into customer)
export type UVPStepLegacy = UVPStep | 'transformation';

interface UVPMilestoneProgressProps {
  currentStep: UVPStep | UVPStepLegacy;
  completedSteps: (UVPStep | UVPStepLegacy)[];
  onStepClick?: (step: UVPStep) => void;
  className?: string;
}

// 5 steps now - transformation removed (merged into customer step)
const STEPS: { key: UVPStep; label: string; shortLabel: string }[] = [
  { key: 'products', label: 'Products & Services', shortLabel: 'Products' },
  { key: 'customer', label: 'Target Customer', shortLabel: 'Customer' },
  { key: 'solution', label: 'Unique Solution', shortLabel: 'Solution' },
  { key: 'benefit', label: 'Key Benefit', shortLabel: 'Benefit' },
  { key: 'synthesis', label: 'Complete Story', shortLabel: 'Complete' },
];

export function UVPMilestoneProgress({
  currentStep,
  completedSteps,
  onStepClick,
  className = ''
}: UVPMilestoneProgressProps) {
  // Filter out legacy 'transformation' step from completedSteps for display
  const activeCompletedSteps = completedSteps.filter(s => s !== 'transformation') as UVPStep[];
  // Map legacy 'transformation' currentStep to 'solution' (next step after customer)
  const activeCurrentStep = currentStep === 'transformation' ? 'solution' : currentStep;

  const getStepStatus = (stepKey: UVPStep): 'completed' | 'current' | 'upcoming' => {
    if (activeCompletedSteps.includes(stepKey)) return 'completed';
    if (stepKey === activeCurrentStep) return 'current';
    return 'upcoming';
  };

  const isClickable = (stepKey: UVPStep): boolean => {
    return activeCompletedSteps.includes(stepKey) && onStepClick !== undefined;
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto px-4 py-6", className)}>
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.key);
          const clickable = isClickable(step.key);

          return (
            <React.Fragment key={step.key}>
              {/* Step Milestone */}
              <motion.button
                onClick={() => clickable && onStepClick?.(step.key)}
                disabled={!clickable && status !== 'current'}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all",
                  clickable && "cursor-pointer hover:scale-105",
                  !clickable && status === 'upcoming' && "opacity-50 cursor-not-allowed"
                )}
                whileHover={clickable ? { scale: 1.05 } : {}}
                whileTap={clickable ? { scale: 0.95 } : {}}
              >
                {/* Circle Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                  status === 'completed' && "bg-green-500 border-green-500 text-white",
                  status === 'current' && "bg-purple-600 border-purple-600 text-white animate-pulse",
                  status === 'upcoming' && "bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500"
                )}>
                  {status === 'completed' && <Check className="w-6 h-6" />}
                  {status === 'current' && <Circle className="w-6 h-6 fill-current" />}
                  {status === 'upcoming' && <Lock className="w-5 h-5" />}
                </div>

                {/* Step Label */}
                <div className="text-center">
                  <div className={cn(
                    "text-sm font-semibold transition-colors",
                    status === 'completed' && "text-green-600 dark:text-green-400",
                    status === 'current' && "text-purple-600 dark:text-purple-400",
                    status === 'upcoming' && "text-gray-400 dark:text-gray-500"
                  )}>
                    {step.shortLabel}
                  </div>
                </div>
              </motion.button>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2">
                  <div className={cn(
                    "h-full transition-all",
                    completedSteps.includes(step.key)
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-slate-600"
                  )} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
