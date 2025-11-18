/**
 * Info Tooltip Component
 *
 * Reusable educational tooltip for explaining concepts
 * Uses shadcn/ui Tooltip component with custom styling
 *
 * Created: 2025-11-18
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  title: string;
  content: string;
  icon?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function InfoTooltip({
  title,
  content,
  icon,
  side = 'top',
  className = '',
}: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
            onClick={(e) => e.preventDefault()}
          >
            {icon || <HelpCircle className="w-3 h-3" />}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs bg-slate-900 dark:bg-slate-800 text-white dark:text-gray-100 border-slate-700 dark:border-slate-600"
          sideOffset={5}
        >
          <div className="space-y-1">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-gray-300 dark:text-gray-400 leading-relaxed">
              {content}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline Info Icon - Minimal version
 */
export function InfoIcon({ tooltip }: { tooltip: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center ml-1"
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-slate-900 dark:bg-slate-800 text-white dark:text-gray-100 border-slate-700 dark:border-slate-600"
        >
          <p className="text-xs leading-relaxed">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Badge with Tooltip - Shows a badge with hover explanation
 */
export function BadgeWithTooltip({
  label,
  tooltip,
  variant = 'default',
}: {
  label: string;
  tooltip: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}) {
  const variantStyles = {
    default: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    info: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-help ${variantStyles[variant]}`}
          >
            {label}
            <HelpCircle className="w-3 h-3 opacity-60" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="max-w-xs bg-slate-900 dark:bg-slate-800 text-white dark:text-gray-100 border-slate-700 dark:border-slate-600"
        >
          <p className="text-xs leading-relaxed">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Common educational tooltips for the application
 */
export const commonTooltips = {
  eqScore: {
    title: 'What is EQ Score?',
    content:
      'Emotional Intelligence Score measures how well your messaging connects psychologically. It combines emotional resonance, urgency, and identity alignment to predict customer engagement.',
  },
  jtbd: {
    title: 'What is Jobs-to-be-Done?',
    content:
      'JTBD framework helps understand the "job" customers hire your product to do. Instead of demographics, it focuses on the progress customers want to make in their lives.',
  },
  coreTruth: {
    title: 'What is Core Truth?',
    content:
      'Your Core Truth is the deep, evidence-based insight about your business that drives all marketing. It combines your value proposition with customer psychology and market reality.',
  },
  valueProp: {
    title: '4-Layer Value Proposition',
    content:
      'Surface (what you sell) → Functional (what it does) → Emotional (how it feels) → Identity (who they become). Most businesses only communicate the surface layer.',
  },
  psychologicalTriggers: {
    title: 'Psychological Triggers',
    content:
      'Pain points (what customers want to escape) mapped to desires (what they want to achieve). Understanding both creates compelling messaging.',
  },
  dataQuality: {
    title: 'Data Quality Score',
    content:
      'Measures completeness, accuracy, and freshness of data extracted from your sources. Higher quality data means more confident insights.',
  },
  modelAgreement: {
    title: 'Model Agreement',
    content:
      'How much our AI models agree on the analysis. Higher agreement means more reliable insights.',
  },
};
