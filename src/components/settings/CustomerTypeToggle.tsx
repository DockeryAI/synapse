/**
 * CustomerTypeToggle Component
 *
 * Toggle between B2B, B2C, and B2B2C customer types.
 *
 * Created: 2025-11-28
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type CustomerType = 'b2b' | 'b2c' | 'b2b2c';

interface CustomerTypeToggleProps {
  value: CustomerType;
  onChange: (value: CustomerType) => void;
  disabled?: boolean;
  className?: string;
}

const OPTIONS: { value: CustomerType; label: string; description: string }[] = [
  { value: 'b2b', label: 'B2B', description: 'Business to Business' },
  { value: 'b2c', label: 'B2C', description: 'Business to Consumer' },
  { value: 'b2b2c', label: 'B2B2C', description: 'Both B2B and B2C' },
];

export function CustomerTypeToggle({
  value,
  onChange,
  disabled = false,
  className,
}: CustomerTypeToggleProps) {
  return (
    <div className={cn('flex rounded-lg bg-gray-100 dark:bg-slate-800 p-1', className)}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1',
            value === option.value
              ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={option.description}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default CustomerTypeToggle;
