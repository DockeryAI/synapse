/**
 * V5 Framework Comparison Panel
 *
 * Phase 7: A/B Framework Toggle
 * - Quick toggle to regenerate with different framework
 * - Tabbed comparison view showing A vs B content
 * - Score comparison between frameworks
 * - "Best for this content" recommendation
 *
 * Created: 2025-12-01
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Beaker,
  ArrowLeftRight,
  Loader2,
  Trophy,
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
  Check,
  X,
  Copy,
  RefreshCw
} from 'lucide-react';
import type {
  V5GeneratedContent,
  TemplateStructure,
  ContentScore
} from '@/services/v5/types';

// ============================================================================
// TYPES
// ============================================================================

export type PsychologyFramework = 'AIDA' | 'PAS' | 'BAB' | 'FAB' | 'QUEST' | 'STAR' | '4Ps' | 'HOOK';

export interface FrameworkConfig {
  id: PsychologyFramework;
  name: string;
  fullName: string;
  description: string;
  bestFor: string[];
  templateStructure: TemplateStructure;
  color: string;
}

export interface ComparisonContent {
  framework: PsychologyFramework;
  content: V5GeneratedContent;
  generatedAt: Date;
}

export interface FrameworkComparisonPanelProps {
  currentContent: V5GeneratedContent | null;
  currentFramework: PsychologyFramework;
  isGenerating: boolean;
  onRegenerateWithFramework: (framework: PsychologyFramework) => Promise<void>;
  className?: string;
}

// ============================================================================
// FRAMEWORK CONFIGURATIONS
// ============================================================================

export const FRAMEWORK_CONFIGS: Record<PsychologyFramework, FrameworkConfig> = {
  AIDA: {
    id: 'AIDA',
    name: 'AIDA',
    fullName: 'Attention, Interest, Desire, Action',
    description: 'Classic marketing funnel - grab attention, build interest, create desire, drive action',
    bestFor: ['Authority content', 'Professional audiences', 'LinkedIn'],
    templateStructure: 'authority',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  },
  PAS: {
    id: 'PAS',
    name: 'PAS',
    fullName: 'Problem, Agitate, Solve',
    description: 'Identify pain, amplify urgency, present solution',
    bestFor: ['Pain-driven customers', 'Promotional offers', 'Urgency campaigns'],
    templateStructure: 'offer',
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  },
  BAB: {
    id: 'BAB',
    name: 'BAB',
    fullName: 'Before, After, Bridge',
    description: 'Show current state, desired outcome, how to get there',
    bestFor: ['Transformation stories', 'Aspiration-driven', 'Visual content'],
    templateStructure: 'transformation',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  },
  FAB: {
    id: 'FAB',
    name: 'FAB',
    fullName: 'Features, Advantages, Benefits',
    description: 'What it is, why it matters, what they gain',
    bestFor: ['Product launches', 'FAQ content', 'Trust-seeking audience'],
    templateStructure: 'faq',
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  },
  QUEST: {
    id: 'QUEST',
    name: 'QUEST',
    fullName: 'Qualify, Understand, Educate, Stimulate, Transition',
    description: 'Educational journey from awareness to conversion',
    bestFor: ['Educational content', 'How-to guides', 'Complex topics'],
    templateStructure: 'how-to',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  },
  STAR: {
    id: 'STAR',
    name: 'STAR',
    fullName: 'Situation, Task, Action, Result',
    description: 'Storytelling with clear structure and outcomes',
    bestFor: ['Case studies', 'Testimonials', 'Story-driven content'],
    templateStructure: 'storytelling',
    color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800'
  },
  '4Ps': {
    id: '4Ps',
    name: '4Ps',
    fullName: 'Promise, Picture, Proof, Push',
    description: 'Make a promise, paint the picture, prove it, push to action',
    bestFor: ['Sales content', 'Value-driven audience', 'Conversion focus'],
    templateStructure: 'testimonial',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
  },
  HOOK: {
    id: 'HOOK',
    name: 'HOOK',
    fullName: 'Hook, Outcome, Obstacle, Key takeaway',
    description: 'Attention grabber with clear value delivery',
    bestFor: ['Engagement posts', 'Short-form content', 'Social media'],
    templateStructure: 'engagement',
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
  }
};

// Quick access to common frameworks for toggle
const QUICK_FRAMEWORKS: PsychologyFramework[] = ['AIDA', 'PAS', 'BAB', 'FAB'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFrameworkFromStructure(structure: TemplateStructure): PsychologyFramework {
  const mapping: Record<TemplateStructure, PsychologyFramework> = {
    authority: 'AIDA',
    list: 'FAB',
    offer: 'PAS',
    transformation: 'BAB',
    faq: 'FAB',
    storytelling: 'STAR',
    testimonial: '4Ps',
    announcement: 'AIDA',
    'how-to': 'QUEST',
    engagement: 'HOOK'
  };
  return mapping[structure] || 'AIDA';
}

function getRecommendedFramework(
  currentScore: number,
  customerCategory?: string
): { framework: PsychologyFramework; reason: string } {
  // Recommend based on customer category if available
  if (customerCategory) {
    switch (customerCategory) {
      case 'pain-driven':
        return { framework: 'PAS', reason: 'PAS amplifies pain points effectively for pain-driven audiences' };
      case 'aspiration-driven':
        return { framework: 'BAB', reason: 'BAB showcases transformation for aspiration-driven audiences' };
      case 'trust-seeking':
        return { framework: '4Ps', reason: '4Ps builds trust through proof and promise' };
      case 'convenience-driven':
        return { framework: 'QUEST', reason: 'QUEST educates clearly for convenience-seekers' };
      case 'value-driven':
        return { framework: 'FAB', reason: 'FAB highlights value and benefits for ROI-focused buyers' };
      case 'community-driven':
        return { framework: 'STAR', reason: 'STAR tells relatable stories for community audiences' };
    }
  }

  // Default recommendation based on score
  if (currentScore < 65) {
    return { framework: 'PAS', reason: 'PAS often scores higher for promotional content' };
  }
  return { framework: 'AIDA', reason: 'AIDA provides balanced structure for most content types' };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const FrameworkButton = memo(function FrameworkButton({
  framework,
  isActive,
  isLoading,
  onClick
}: {
  framework: PsychologyFramework;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  const config = FRAMEWORK_CONFIGS[framework];

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        isActive
          ? `${config.color} border-2`
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {framework}
    </button>
  );
});

const ScoreComparison = memo(function ScoreComparison({
  scoreA,
  scoreB,
  frameworkA,
  frameworkB
}: {
  scoreA: number;
  scoreB: number;
  frameworkA: PsychologyFramework;
  frameworkB: PsychologyFramework;
}) {
  const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'tie';
  const diff = Math.abs(scoreA - scoreB);

  return (
    <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
      <div className={`text-center ${winner === 'A' ? 'scale-110' : ''}`}>
        <div className={`text-2xl font-bold ${winner === 'A' ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
          {scoreA}
        </div>
        <div className="text-xs text-gray-500">{frameworkA}</div>
        {winner === 'A' && <Trophy className="w-4 h-4 text-amber-500 mx-auto mt-1" />}
      </div>

      <div className="flex flex-col items-center">
        <ArrowLeftRight className="w-4 h-4 text-gray-400" />
        {winner !== 'tie' && (
          <span className="text-xs text-gray-500 mt-1">+{diff}</span>
        )}
      </div>

      <div className={`text-center ${winner === 'B' ? 'scale-110' : ''}`}>
        <div className={`text-2xl font-bold ${winner === 'B' ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
          {scoreB}
        </div>
        <div className="text-xs text-gray-500">{frameworkB}</div>
        {winner === 'B' && <Trophy className="w-4 h-4 text-amber-500 mx-auto mt-1" />}
      </div>
    </div>
  );
});

const ContentPreview = memo(function ContentPreview({
  content,
  framework,
  isWinner
}: {
  content: V5GeneratedContent;
  framework: PsychologyFramework;
  isWinner: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = FRAMEWORK_CONFIGS[framework];

  return (
    <div className={`border rounded-lg overflow-hidden ${isWinner ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-slate-700'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 ${config.color}`}>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span className="font-bold text-sm">{framework}</span>
          {isWinner && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-700 dark:text-green-400">
              <Trophy className="w-3 h-3" />
              Best
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">Score: {content.score.total}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-black/10 rounded"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="p-3 bg-white dark:bg-slate-900">
        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
          {content.headline}
        </p>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {content.body}
              </p>
              {content.cta && (
                <div className="mt-2 inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs font-medium text-purple-700 dark:text-purple-300">
                  {content.cta}
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(`${content.headline}\n\n${content.body}\n\n${content.cta}`)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FrameworkComparisonPanel = memo(function FrameworkComparisonPanel({
  currentContent,
  currentFramework,
  isGenerating,
  onRegenerateWithFramework,
  className = ''
}: FrameworkComparisonPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comparisonContent, setComparisonContent] = useState<ComparisonContent | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<PsychologyFramework | null>(null);

  // Get recommendation
  const recommendation = useMemo(() => {
    if (!currentContent) return null;
    return getRecommendedFramework(
      currentContent.score.total,
      currentContent.metadata.customerCategory
    );
  }, [currentContent]);

  // Handle framework selection for comparison
  const handleCompareWithFramework = useCallback(async (framework: PsychologyFramework) => {
    if (framework === currentFramework || isComparing) return;

    setSelectedFramework(framework);
    setIsComparing(true);

    try {
      await onRegenerateWithFramework(framework);
      // Note: The parent component will update currentContent with the new generation
      // We store this as comparison content
      // In a real implementation, we'd need the parent to provide both versions
    } finally {
      setIsComparing(false);
    }
  }, [currentFramework, isComparing, onRegenerateWithFramework]);

  if (!currentContent) {
    return null;
  }

  const currentConfig = FRAMEWORK_CONFIGS[currentFramework];

  // Compact view
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors ${className}`}
      >
        <Beaker className="w-3.5 h-3.5 text-cyan-500" />
        <span className="font-medium text-cyan-700 dark:text-cyan-300">A/B Framework</span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${currentConfig.color}`}>
          {currentFramework}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-md">
            <Beaker className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            A/B Framework Comparison
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-4">
        {/* Current Framework */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Current Framework
            </span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${currentConfig.color}`}>
              {currentFramework} • Score: {currentContent.score.total}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {currentConfig.description}
          </p>
        </div>

        {/* Quick Framework Toggles */}
        <div>
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Try Different Framework
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_FRAMEWORKS.map((framework) => (
              <FrameworkButton
                key={framework}
                framework={framework}
                isActive={framework === currentFramework}
                isLoading={isComparing && selectedFramework === framework}
                onClick={() => handleCompareWithFramework(framework)}
              />
            ))}
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              More...
            </button>
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && recommendation.framework !== currentFramework && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Recommended: {recommendation.framework}
              </span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {recommendation.reason}
            </p>
            <button
              onClick={() => handleCompareWithFramework(recommendation.framework)}
              disabled={isComparing}
              className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Try {recommendation.framework}
                </>
              )}
            </button>
          </div>
        )}

        {/* Framework Details */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {currentConfig.fullName}
          </div>
          <div className="flex flex-wrap gap-1">
            {currentConfig.bestFor.map((use, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400"
              >
                {use}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default FrameworkComparisonPanel;
