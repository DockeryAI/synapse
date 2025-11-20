/**
 * Initial Loading Screen - Reimagined 6-Step Animation
 *
 * Shows engaging animation of all 6 UVP steps loading sequentially
 * Times animation to match actual website scraping/extraction (~8-10 seconds)
 * Provides visual feedback while progressive loading happens in background
 *
 * Created: 2025-11-20
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Users,
  Zap,
  Lightbulb,
  Award,
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';

interface InitialLoadingScreenProps {
  websiteUrl: string;
  businessName?: string;
}

const STEPS = [
  {
    key: 'products',
    label: 'Products',
    description: 'Scanning products & services',
    icon: Package,
    duration: 2574
  },
  {
    key: 'customer',
    label: 'Customer',
    description: 'Identifying target customers',
    icon: Users,
    duration: 2574
  },
  {
    key: 'transformation',
    label: 'Transform',
    description: 'Discovering transformations',
    icon: Zap,
    duration: 2574
  },
  {
    key: 'solution',
    label: 'Solution',
    description: 'Extracting unique solutions',
    icon: Lightbulb,
    duration: 2574
  },
  {
    key: 'benefit',
    label: 'Benefit',
    description: 'Analyzing key benefits',
    icon: Award,
    duration: 2574
  },
  {
    key: 'synthesis',
    label: 'Complete',
    description: 'Crafting your value proposition',
    icon: Sparkles,
    duration: 2574
  },
];

export function InitialLoadingScreen({
  websiteUrl,
  businessName
}: InitialLoadingScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    // Animate through each step
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < STEPS.length - 1) {
          // Mark current step as completed
          setCompletedSteps(completed => [...completed, STEPS[prev].key]);
          return prev + 1;
        } else {
          // Mark final step as completed
          if (!completedSteps.includes(STEPS[prev].key)) {
            setCompletedSteps(completed => [...completed, STEPS[prev].key]);
          }
          clearInterval(timer);
          return prev;
        }
      });
    }, 2574); // Each step takes 2.57 seconds (total ~15.4 seconds)

    return () => clearInterval(timer);
  }, []);

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-block"
          >
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white">
            Analyzing {businessName || websiteUrl}
          </h1>

          <p className="text-gray-400 text-lg">
            Building your complete value proposition...
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-2xl">
          <div className="space-y-4">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.key);
              const isCurrent = currentStepIndex === index;
              const isUpcoming = index > currentStepIndex;
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
                        ? 'bg-purple-500 text-white animate-pulse'
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
        </div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-gray-500"
        >
          <p>Using AI to extract insights from your website...</p>
          <p className="mt-1">This usually takes 12-15 seconds</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
