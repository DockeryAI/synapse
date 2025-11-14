/**
 * Character Count Badge
 *
 * Displays character count with validation status for content sections
 *
 * Created: 2025-11-11
 */

import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { CharacterValidation } from '@/types/synapseContent.types';

interface CharacterCountBadgeProps {
  validation: CharacterValidation;
  compact?: boolean;
}

export function CharacterCountBadge({ validation, compact = false }: CharacterCountBadgeProps) {
  const statusColors = {
    valid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
  };

  const StatusIcon = {
    valid: CheckCircle,
    warning: AlertCircle,
    error: XCircle
  }[validation.status];

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
          statusColors[validation.status]
        }`}
        title={validation.message}
      >
        <StatusIcon className="w-3 h-3" />
        {validation.characterCount}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${
        statusColors[validation.status]
      }`}
    >
      <StatusIcon className="w-4 h-4" />
      <div className="flex items-baseline gap-2">
        <span className="font-bold">{validation.characterCount}</span>
        <span className="text-xs opacity-75">/ {validation.optimal}</span>
      </div>
      <span className="text-xs">chars</span>
    </div>
  );
}
