import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingSubStep {
  label: string;
  duration: number;
}

interface LoadingStep {
  id: string;
  label: string;
  description: string;
  estimatedDuration: number; // in seconds
  subSteps?: LoadingSubStep[];
}

const LOADING_STEPS: LoadingStep[] = [
  {
    id: 'intelligence',
    label: 'Analyzing Your Business',
    description: 'Scanning your website for key messages and unique value',
    estimatedDuration: 15
  },
  {
    id: 'trends',
    label: 'Finding Trending Topics',
    description: 'Discovering what your audience is talking about right now',
    estimatedDuration: 12
  },
  {
    id: 'competitors',
    label: 'Studying Competitors',
    description: 'Learning from what works in your industry',
    estimatedDuration: 18
  },
  {
    id: 'triggers',
    label: 'Identifying Buying Triggers',
    description: 'Finding moments when customers are ready to act',
    estimatedDuration: 10
  },
  {
    id: 'local',
    label: 'Discovering Local Opportunities',
    description: 'Finding local events and community connections',
    estimatedDuration: 8
  },
  {
    id: 'connections',
    label: 'Making Synaptic Connections',
    description: 'Connecting unique insights to create compelling angles',
    estimatedDuration: 25
  },
  {
    id: 'content',
    label: 'Crafting Your Content',
    description: 'Writing platform-optimized content that resonates',
    estimatedDuration: 120,
    subSteps: [
      { label: 'Writing LinkedIn posts', duration: 20 },
      { label: 'Writing Facebook posts', duration: 20 },
      { label: 'Writing Instagram captions', duration: 20 },
      { label: 'Writing X (Twitter) posts', duration: 15 },
      { label: 'Writing TikTok scripts', duration: 20 },
      { label: 'Writing YouTube descriptions', duration: 20 },
      { label: 'Finalizing content', duration: 5 }
    ]
  }
];

interface SynapseLoadingScreenProps {
  currentStep?: string;
  progress?: number;
  contentCount?: number; // Number of content pieces being generated
  platformCount?: number; // Number of platforms selected
}

export function SynapseLoadingScreen({
  currentStep,
  progress,
  contentCount = 3,
  platformCount = 6
}: SynapseLoadingScreenProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Auto-progress through steps based on elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate dynamic content generation time
  // Each platform per insight takes ~8 seconds with Sonnet 4.5 (was 20s with Opus)
  const contentGenerationTime = contentCount * platformCount * 8;

  // Update the content step duration dynamically
  const adjustedSteps = LOADING_STEPS.map(step => {
    if (step.id === 'content') {
      return {
        ...step,
        estimatedDuration: contentGenerationTime
      };
    }
    return step;
  });

  // Calculate which step we should be on based on elapsed time
  useEffect(() => {
    let cumulativeTime = 0;
    for (let i = 0; i < adjustedSteps.length; i++) {
      cumulativeTime += adjustedSteps[i].estimatedDuration;
      if (elapsedTime < cumulativeTime) {
        setActiveStepIndex(i);
        break;
      }
    }
  }, [elapsedTime, contentCount, platformCount]);

  const totalEstimatedTime = adjustedSteps.reduce((sum, step) => sum + step.estimatedDuration, 0);
  const calculatedProgress = Math.min((elapsedTime / totalEstimatedTime) * 100, 95); // Cap at 95% until actually done
  const displayProgress = progress !== undefined ? progress : calculatedProgress;

  const activeStep = adjustedSteps[activeStepIndex];
  const remainingTime = Math.max(0, totalEstimatedTime - elapsedTime);

  // Calculate current sub-step for content generation
  const getCurrentSubStep = () => {
    if (!activeStep.subSteps || activeStep.id !== 'content') return null;

    // Calculate time elapsed in current step
    let timeBeforeStep = 0;
    for (let i = 0; i < activeStepIndex; i++) {
      timeBeforeStep += LOADING_STEPS[i].estimatedDuration;
    }
    const timeInStep = elapsedTime - timeBeforeStep;

    // Find which sub-step we're in
    let cumulativeSubTime = 0;
    for (let i = 0; i < activeStep.subSteps.length; i++) {
      cumulativeSubTime += activeStep.subSteps[i].duration;
      if (timeInStep < cumulativeSubTime) {
        return activeStep.subSteps[i].label;
      }
    }

    return activeStep.subSteps[activeStep.subSteps.length - 1].label;
  };

  const currentSubStep = getCurrentSubStep();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Creating Your Content Strategy
            </h2>

            <p className="text-gray-600 dark:text-slate-400">
              Estimated time remaining: {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
              <span>{Math.round(displayProgress)}% complete</span>
              <span>Step {activeStepIndex + 1} of {LOADING_STEPS.length}</span>
            </div>
          </div>

          {/* Current Step */}
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {activeStep.label}
                </h3>
                <p className="text-gray-600 dark:text-slate-300">
                  {currentSubStep || activeStep.description}
                </p>
                {currentSubStep && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {activeStep.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Step List */}
          <div className="space-y-2">
            {adjustedSteps.map((step, index) => {
              const isCompleted = index < activeStepIndex;
              const isActive = index === activeStepIndex;
              const isPending = index > activeStepIndex;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                      : isCompleted
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-gray-50 dark:bg-slate-800/50 opacity-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-green-500'
                      : isActive
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-gray-300 dark:bg-slate-700'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    )}
                  </div>

                  <span className={`text-sm font-medium ${
                    isActive
                      ? 'text-blue-900 dark:text-blue-100'
                      : isCompleted
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Fun fact or tip */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Did you know?
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  We're analyzing over 100 different data points to create content that truly connects with your audience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
