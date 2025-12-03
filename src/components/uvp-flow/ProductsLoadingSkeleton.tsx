/**
 * Products Loading Skeleton
 *
 * Shows skeleton UI while products are loading with:
 * 1. Business info skeleton (fills when detected)
 * 2. Extraction progress animation (5 sections, 8s each = 40s total)
 *
 * Created: 2025-12-02
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Users,
  Zap,
  Lightbulb,
  Award,
  Building2,
  MapPin,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UVPMilestoneProgress } from './UVPMilestoneProgress';

interface ProductsLoadingSkeletonProps {
  businessName?: string;
  location?: string;
  onComplete?: () => void;
}

interface LoadingStep {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  substeps: string[];
}

// 8 seconds per step = 40 seconds total for 5 steps
const STEP_DURATION = 8000;

const STEPS: LoadingStep[] = [
  {
    key: 'products',
    label: 'Products',
    description: 'Scanning products & services',
    icon: Package,
    substeps: [
      'Scanning homepage content...',
      'Analyzing service pages...',
      'Categorizing offerings...',
    ]
  },
  {
    key: 'customer',
    label: 'Customer',
    description: 'Identifying target customers',
    icon: Users,
    substeps: [
      'Analyzing target audience...',
      'Extracting customer segments...',
      'Identifying buyer personas...',
    ]
  },
  {
    key: 'value',
    label: 'Value',
    description: 'Discovering customer value',
    icon: Zap,
    substeps: [
      'Analyzing testimonials...',
      'Extracting transformation stories...',
      'Mapping value propositions...',
    ]
  },
  {
    key: 'solution',
    label: 'Solution',
    description: 'Extracting unique solutions',
    icon: Lightbulb,
    substeps: [
      'Analyzing differentiators...',
      'Identifying unique approaches...',
      'Mapping competitive advantages...',
    ]
  },
  {
    key: 'benefit',
    label: 'Benefit',
    description: 'Analyzing key benefits',
    icon: Award,
    substeps: [
      'Extracting customer outcomes...',
      'Analyzing success metrics...',
      'Quantifying value delivered...',
    ]
  }
];

export function ProductsLoadingSkeleton({
  businessName,
  location,
  onComplete
}: ProductsLoadingSkeletonProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentSubstep, setCurrentSubstep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Cycle through substeps for current step
  useEffect(() => {
    const currentStep = STEPS[currentStepIndex];
    if (!currentStep?.substeps || isComplete) return;

    const substepTimer = setInterval(() => {
      setCurrentSubstep(prev => (prev + 1) % currentStep.substeps.length);
    }, 2000);

    return () => clearInterval(substepTimer);
  }, [currentStepIndex, isComplete]);

  // Progress through steps
  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < STEPS.length - 1) {
          setCompletedSteps(completed => [...completed, STEPS[prev].key]);
          setCurrentSubstep(0);
          return prev + 1;
        } else {
          // Final step complete
          setCompletedSteps(completed => {
            if (!completed.includes(STEPS[prev].key)) {
              return [...completed, STEPS[prev].key];
            }
            return completed;
          });
          setIsComplete(true);
          clearInterval(timer);
          onComplete?.();
          return prev;
        }
      });
    }, STEP_DURATION);

    return () => clearInterval(timer);
  }, [isComplete, onComplete]);

  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Milestone Progress */}
        <UVPMilestoneProgress
          currentStep="products"
          completedSteps={[]}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              UVP Step 1 of 5: Product & Service Discovery
            </span>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Confirm Your Offerings
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We've analyzed {businessName || 'your'} website and found these products and services.
            Please confirm what you offer.
          </p>
        </motion.div>

        {/* Business Info Skeleton/Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Business Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Confirm your business details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name
              </label>
              {businessName ? (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 min-h-[44px]">
                  <span className="text-gray-900 dark:text-white font-medium">{businessName}</span>
                </div>
              ) : (
                <Skeleton className="h-[44px] w-full rounded-lg" />
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              {location ? (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 min-h-[44px]">
                  <span className="text-gray-900 dark:text-white font-medium">{location}</span>
                </div>
              ) : (
                <Skeleton className="h-[44px] w-full rounded-lg" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Extraction Progress Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/95 dark:bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl"
        >
          <div className="space-y-4">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.key);
              const isCurrent = currentStepIndex === index && !isComplete;
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : isCompleted
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-slate-700/30 border border-slate-600/30'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-600 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                    )}
                  </div>

                  {/* Label & Description */}
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      isCompleted
                        ? 'text-green-400'
                        : isCurrent
                          ? 'text-purple-300'
                          : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className={`text-sm ${
                      isCompleted
                        ? 'text-green-500/70'
                        : isCurrent
                          ? 'text-purple-400/70'
                          : 'text-gray-600'
                    }`}>
                      {isCompleted ? 'Complete' : isCurrent ? step.description : 'Pending'}
                    </div>
                    {/* Show substep for current step */}
                    {isCurrent && step.substeps && (
                      <motion.div
                        key={currentSubstep}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-purple-300/60 mt-1 italic"
                      >
                        {step.substeps[currentSubstep]}
                      </motion.div>
                    )}
                  </div>

                  {/* Loading Indicator */}
                  {isCurrent && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-5 h-5 text-purple-400" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Overall Progress</span>
              <span className="text-purple-400 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
