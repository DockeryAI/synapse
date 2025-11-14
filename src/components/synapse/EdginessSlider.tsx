/**
 * Edginess Slider Component
 *
 * Slider for controlling humor edginess level (0-100 scale).
 * Shows visual feedback with color coding and descriptive labels.
 *
 * Ranges:
 * - 0-25: Professional (blue)
 * - 26-50: Approachable (green)
 * - 51-75: Casual (yellow)
 * - 76-100: Edgy (red)
 *
 * Created: 2025-11-11
 */

import { useState } from 'react';
import type { EdginessLevel } from '@/types/synapseContent.types';

interface EdginessSliderProps {
  value: EdginessLevel;
  onChange: (value: EdginessLevel) => void;
  className?: string;
}

export function EdginessSlider({ value, onChange, className = '' }: EdginessSliderProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Get current range info
  const getRangeInfo = (level: EdginessLevel) => {
    if (level <= 25) {
      return {
        label: 'Professional',
        description: 'Subtle, polished, corporate-safe',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      };
    } else if (level <= 50) {
      return {
        label: 'Approachable',
        description: 'Warm, relatable, friendly',
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
      };
    } else if (level <= 75) {
      return {
        label: 'Casual',
        description: 'Conversational, witty, personable',
        color: 'from-yellow-500 to-yellow-600',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700'
      };
    } else {
      return {
        label: 'Edgy',
        description: 'Bold, playful, attention-grabbing',
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
      };
    }
  };

  const rangeInfo = getRangeInfo(value);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            Edginess Level
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-400">
            Professional ← → Edgy
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${rangeInfo.bgColor} ${rangeInfo.textColor}`}>
          {value}
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer
                     bg-gradient-to-r from-blue-300 via-green-300 via-yellow-300 to-red-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          style={{
            background: `linear-gradient(to right,
              rgb(147, 197, 253) 0%,
              rgb(134, 239, 172) 25%,
              rgb(253, 224, 71) 50%,
              rgb(252, 165, 165) 75%,
              rgb(248, 113, 113) 100%
            )`
          }}
        />
        {/* Slider thumb styled via CSS */}
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 3px solid ${value <= 25 ? '#3b82f6' : value <= 50 ? '#22c55e' : value <= 75 ? '#eab308' : '#ef4444'};
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: transform 0.1s;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 3px solid ${value <= 25 ? '#3b82f6' : value <= 50 ? '#22c55e' : value <= 75 ? '#eab308' : '#ef4444'};
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `}</style>
      </div>

      {/* Range markers */}
      <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>

      {/* Current Range Info */}
      <div className={`p-3 rounded-lg ${rangeInfo.bgColor} ${rangeInfo.textColor}`}>
        <div className="font-bold text-sm mb-1">{rangeInfo.label}</div>
        <div className="text-xs opacity-80">{rangeInfo.description}</div>
      </div>
    </div>
  );
}
