/**
 * PathSelector Component
 *
 * Presents two clear path options: Full Campaign vs Single Post
 * Clean, mobile-friendly selection interface with benefits display
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Zap, CheckCircle2, Clock, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ContentPath = 'campaign' | 'single_post';

interface PathSelectorProps {
  onSelectPath: (path: ContentPath) => void;
}

interface PathOption {
  id: ContentPath;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  benefits: string[];
  recommended?: boolean;
}

const PATH_OPTIONS: PathOption[] = [
  {
    id: 'campaign',
    title: 'Generate Full Campaign',
    subtitle: 'Multi-post calendar with scheduling',
    icon: <Calendar className="w-8 h-8" />,
    benefits: [
      '7-14 days of content',
      'Auto-scheduled posts',
      'Platform-optimized',
      'Consistent brand voice',
      'Higher engagement',
    ],
    recommended: true,
  },
  {
    id: 'single_post',
    title: 'Create Single Post',
    subtitle: 'Quick single piece of content',
    icon: <Zap className="w-8 h-8" />,
    benefits: [
      'Ready in 30 seconds',
      'Perfect for quick needs',
      'Test new ideas',
      'Fill content gaps',
      'Flexible timing',
    ],
  },
];

export const PathSelector: React.FC<PathSelectorProps> = ({ onSelectPath }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl"
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Step 2 of 3
            </span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Choose Your Path
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select how you want to create content today
          </p>
        </div>

        {/* Path Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {PATH_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Recommended Badge */}
              {option.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-full shadow-lg">
                    ⭐ Recommended
                  </div>
                </div>
              )}

              {/* Card */}
              <button
                onClick={() => onSelectPath(option.id)}
                className={`
                  w-full text-left p-6 sm:p-8 rounded-2xl border-2 transition-all duration-200
                  bg-white dark:bg-slate-800
                  hover:border-purple-500 hover:shadow-xl hover:scale-[1.02]
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                  min-h-[56px]
                  ${option.recommended
                    ? 'border-purple-300 dark:border-purple-700 shadow-lg'
                    : 'border-gray-200 dark:border-slate-700'
                  }
                `}
              >
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className={`
                    flex-shrink-0 p-3 rounded-xl
                    ${option.recommended
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                    }
                  `}
                  >
                    {option.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      {option.subtitle}
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  {option.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2
                        className={`
                        w-5 h-5 flex-shrink-0
                        ${option.recommended
                          ? 'text-purple-500'
                          : 'text-gray-400 dark:text-gray-500'
                        }
                      `}
                      />
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{option.id === 'campaign' ? '2-3 min' : '30 sec'}</span>
                    </div>
                    <div
                      className={`
                      font-medium
                      ${option.recommended
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-900 dark:text-white'
                      }
                    `}
                    >
                      Select →
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Both paths use 100% source-verified content
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
