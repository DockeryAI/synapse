/**
 * GapContentActions Component
 *
 * Phase 4 - Gap Tab 2.0
 * Quick content generation buttons for competitive gaps.
 * Provides "Write Attack Ad", "Write Comparison", "Write Guide" buttons.
 *
 * Created: 2025-11-28
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Columns,
  ArrowRightCircle,
  Loader2,
  Copy,
  Check,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import type { GapContentType, GapContentResult } from '@/services/intelligence/gap-content-generator.service';

// ============================================================================
// TYPES
// ============================================================================

interface GapContentActionsProps {
  gapId: string;
  onGenerate: (contentType: GapContentType) => Promise<GapContentResult>;
  isGenerating: boolean;
  currentGeneratingType: GapContentType | null;
  generatedContent: GapContentResult[];
  className?: string;
}

// ============================================================================
// CONTENT TYPE CONFIG
// ============================================================================

const CONTENT_TYPES: {
  type: GapContentType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}[] = [
  {
    type: 'attack-ad',
    label: 'Write Attack Ad',
    shortLabel: 'Attack Ad',
    icon: <Target className="w-3.5 h-3.5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50'
  },
  {
    type: 'comparison-post',
    label: 'Write Comparison',
    shortLabel: 'Comparison',
    icon: <Columns className="w-3.5 h-3.5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
  },
  {
    type: 'switching-guide',
    label: 'Write Guide',
    shortLabel: 'Guide',
    icon: <ArrowRightCircle className="w-3.5 h-3.5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
  }
];

// ============================================================================
// CONTENT PREVIEW COMPONENT
// ============================================================================

interface ContentPreviewProps {
  content: GapContentResult;
  onClose: () => void;
}

const ContentPreview = memo(function ContentPreview({ content, onClose }: ContentPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullText = `${content.headline}\n\n${content.body}\n\n${content.callToAction}${
      content.hashtags?.length ? '\n\n' + content.hashtags.map(h => `#${h}`).join(' ') : ''
    }`;

    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeConfig = CONTENT_TYPES.find(t => t.type === content.contentType);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className={typeConfig?.color}>{typeConfig?.icon}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {typeConfig?.shortLabel}
          </span>
          <span className="text-xs text-gray-500">
            {content.wordCount} words
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-slate-900 space-y-3">
        {/* Headline */}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Headline</span>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {content.headline}
          </p>
        </div>

        {/* Body */}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Body</span>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
            {content.body}
          </p>
        </div>

        {/* CTA */}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Call to Action</span>
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">
            {content.callToAction}
          </p>
        </div>

        {/* Hashtags */}
        {content.hashtags && content.hashtags.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Hashtags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {content.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Image Prompt */}
        {content.imagePrompt && (
          <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Image Suggestion</span>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
              {content.imagePrompt}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GapContentActions = memo(function GapContentActions({
  gapId,
  onGenerate,
  isGenerating,
  currentGeneratingType,
  generatedContent,
  className = ''
}: GapContentActionsProps) {
  const [expandedType, setExpandedType] = useState<GapContentType | null>(null);

  const handleGenerate = async (type: GapContentType) => {
    try {
      await onGenerate(type);
      setExpandedType(type);
    } catch {
      // Error handled by parent
    }
  };

  const getContentForType = (type: GapContentType) => {
    return generatedContent.find(c => c.contentType === type);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Quick Generate Label */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-purple-500" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Quick Content
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map(({ type, label, shortLabel, icon, color, bgColor }) => {
          const isThisGenerating = isGenerating && currentGeneratingType === type;
          const hasContent = !!getContentForType(type);

          return (
            <button
              key={type}
              onClick={() => hasContent ? setExpandedType(expandedType === type ? null : type) : handleGenerate(type)}
              disabled={isGenerating}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200
                ${bgColor} ${color}
                ${isGenerating && !isThisGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                ${hasContent ? 'ring-2 ring-offset-1 ring-green-500' : ''}
              `}
            >
              {isThisGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                icon
              )}
              <span>{hasContent ? shortLabel : label}</span>
              {hasContent && (
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedType === type ? 'rotate-180' : ''}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Previews */}
      <AnimatePresence>
        {expandedType && getContentForType(expandedType) && (
          <ContentPreview
            content={getContentForType(expandedType)!}
            onClose={() => setExpandedType(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default GapContentActions;
