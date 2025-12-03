/**
 * Humor Slider Component
 *
 * Allows users to adjust content humor level from 0 (Serious) to 3 (Very Funny)
 * Persists preference and applies to all generated content.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Smile, Meh, Laugh, PartyPopper } from 'lucide-react';

export interface HumorSliderProps {
  value: number; // 0-3
  onChange: (value: number) => void;
  disabled?: boolean;
}

const HUMOR_LEVELS = [
  {
    level: 0,
    label: 'Serious',
    icon: Meh,
    color: 'bg-slate-500',
    description: 'Professional, no humor',
    example: 'Our solution delivers measurable results.'
  },
  {
    level: 1,
    label: 'Light',
    icon: Smile,
    color: 'bg-blue-500',
    description: 'Subtle wit, approachable',
    example: 'Results you can actually brag about.'
  },
  {
    level: 2,
    label: 'Witty',
    icon: Laugh,
    color: 'bg-purple-500',
    description: 'Clever humor, memorable',
    example: 'Warning: May cause excessive high-fives.'
  },
  {
    level: 3,
    label: 'Very Funny',
    icon: PartyPopper,
    color: 'bg-pink-500',
    description: 'Bold humor, entertaining',
    example: 'Your competitors will need therapy. 😅'
  },
];

export function HumorSlider({ value, onChange, disabled = false }: HumorSliderProps) {
  const currentLevel = HUMOR_LEVELS[value] || HUMOR_LEVELS[0];
  const CurrentIcon = currentLevel.icon;

  return (
    <div className={`${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CurrentIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            Humor Level
          </span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${currentLevel.color}`}>
          {currentLevel.label}
        </span>
      </div>

      {/* Slider Track */}
      <div className="relative h-8 flex items-center">
        {/* Background Track */}
        <div className="absolute inset-x-0 h-2 bg-gray-200 dark:bg-slate-700 rounded-full" />

        {/* Filled Track */}
        <motion.div
          className={`absolute h-2 rounded-full ${currentLevel.color}`}
          initial={false}
          animate={{ width: `${(value / 3) * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        {/* Step Markers */}
        <div className="absolute inset-x-0 flex justify-between px-1">
          {HUMOR_LEVELS.map((level) => {
            const LevelIcon = level.icon;
            const isActive = value >= level.level;
            const isSelected = value === level.level;

            return (
              <button
                key={level.level}
                onClick={() => onChange(level.level)}
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? `${level.color} text-white shadow-lg scale-110`
                    : isActive
                    ? 'bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-gray-300'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-slate-600'
                }`}
                title={level.label}
              >
                <LevelIcon className="w-3 h-3" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {currentLevel.description}
        </p>
        <p className="text-xs italic text-gray-500 dark:text-gray-500 mt-1">
          "{currentLevel.example}"
        </p>
      </div>
    </div>
  );
}
