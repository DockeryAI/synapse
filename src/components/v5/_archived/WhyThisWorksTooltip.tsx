/**
 * V5 "Why This Works" Tooltip
 *
 * Phase 4: Explains content generation decisions
 * - Which insights influenced the output
 * - Detected customer category
 * - Psychology framework applied
 * - Template used from industry profile
 *
 * Created: 2025-12-01
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  Lightbulb,
  Target,
  Brain,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  MessageSquare,
  Shield,
  MapPin,
  Cloud,
  Users,
  X
} from 'lucide-react';
import type {
  V5GeneratedContent,
  CustomerCategory,
  TemplateStructure,
  ContentType
} from '@/services/v5/types';
import type { SelectedInsight } from '@/hooks/useV5PowerModeGeneration';

// ============================================================================
// TYPES
// ============================================================================

export interface WhyThisWorksTooltipProps {
  content: V5GeneratedContent | null;
  selectedInsights?: SelectedInsight[];
  industryName?: string;
  className?: string;
}

// ============================================================================
// INSIGHT TYPE CONFIG
// ============================================================================

interface InsightTypeConfig {
  icon: React.ElementType;
  color: string;
  label: string;
}

const INSIGHT_TYPE_CONFIG: Record<SelectedInsight['type'], InsightTypeConfig> = {
  trigger: { icon: Zap, color: 'text-orange-500', label: 'Trigger' },
  proof: { icon: Shield, color: 'text-emerald-500', label: 'Proof' },
  trend: { icon: TrendingUp, color: 'text-blue-500', label: 'Trend' },
  conversation: { icon: MessageSquare, color: 'text-purple-500', label: 'Conversation' },
  competitor: { icon: Users, color: 'text-red-500', label: 'Competitor' },
  local: { icon: MapPin, color: 'text-green-500', label: 'Local' },
  weather: { icon: Cloud, color: 'text-cyan-500', label: 'Weather' }
};

// ============================================================================
// CUSTOMER CATEGORY CONFIG
// ============================================================================

interface CategoryConfig {
  label: string;
  description: string;
  color: string;
}

const CATEGORY_CONFIG: Record<CustomerCategory, CategoryConfig> = {
  'pain-driven': {
    label: 'Pain-Driven',
    description: 'Targeting immediate problems needing solutions',
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20'
  },
  'aspiration-driven': {
    label: 'Aspiration-Driven',
    description: 'Targeting desire for transformation/status',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
  },
  'trust-seeking': {
    label: 'Trust-Seeking',
    description: 'Targeting need for validation before commitment',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
  },
  'convenience-driven': {
    label: 'Convenience-Driven',
    description: 'Targeting path of least resistance',
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20'
  },
  'value-driven': {
    label: 'Value-Driven',
    description: 'Targeting ROI and outcome focus',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
  },
  'community-driven': {
    label: 'Community-Driven',
    description: 'Targeting belonging and shared identity',
    color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20'
  }
};

// ============================================================================
// TEMPLATE STRUCTURE CONFIG
// ============================================================================

interface TemplateConfig {
  label: string;
  framework: string;
}

const TEMPLATE_CONFIG: Record<TemplateStructure, TemplateConfig> = {
  authority: { label: 'Authority Builder', framework: 'AIDA' },
  list: { label: 'Listicle', framework: 'VALUE' },
  offer: { label: 'Promotional Offer', framework: 'PAS' },
  transformation: { label: 'Transformation Story', framework: 'BAB' },
  faq: { label: 'FAQ/Objection Handler', framework: 'FAB' },
  storytelling: { label: 'Story-Driven', framework: 'STAR' },
  testimonial: { label: 'Social Proof', framework: 'PROOF' },
  announcement: { label: 'News/Announcement', framework: 'NEWS' },
  'how-to': { label: 'How-To Guide', framework: 'STEPS' },
  engagement: { label: 'Engagement Hook', framework: 'HOOK' }
};

// ============================================================================
// CONTENT TYPE CONFIG
// ============================================================================

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  promotional: 'Promotional',
  educational: 'Educational',
  community: 'Community',
  authority: 'Authority',
  engagement: 'Engagement'
};

// ============================================================================
// COMPONENTS
// ============================================================================

const InsightBadge = memo(function InsightBadge({ insight }: { insight: SelectedInsight }) {
  const config = INSIGHT_TYPE_CONFIG[insight.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-md text-xs">
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className="font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
      <span className="text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
        {insight.title}
      </span>
    </div>
  );
});

const SectionHeader = memo(function SectionHeader({
  icon: Icon,
  title,
  color
}: {
  icon: React.ElementType;
  title: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {title}
      </span>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WhyThisWorksTooltip = memo(function WhyThisWorksTooltip({
  content,
  selectedInsights = [],
  industryName,
  className = ''
}: WhyThisWorksTooltipProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) {
    return null;
  }

  const { metadata } = content;
  const categoryConfig = CATEGORY_CONFIG[metadata.customerCategory];
  const templateConfig = TEMPLATE_CONFIG[metadata.templateStructure];

  // Compact badge view
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors ${className}`}
      >
        <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
        <span className="font-medium text-indigo-700 dark:text-indigo-300">Why This Works</span>
        <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
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
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
            <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            Why This Works
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
        {/* Insights Used */}
        {selectedInsights.length > 0 && (
          <div>
            <SectionHeader icon={Info} title="Insights Applied" color="text-blue-500" />
            <div className="flex flex-wrap gap-2">
              {selectedInsights.map((insight) => (
                <InsightBadge key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Customer Category */}
        <div>
          <SectionHeader icon={Target} title="Targeting" color="text-red-500" />
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${categoryConfig.color}`}>
            <span className="text-sm font-bold">{categoryConfig.label}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {categoryConfig.description}
          </p>
        </div>

        {/* Psychology Framework */}
        <div>
          <SectionHeader icon={Brain} title="Psychology Framework" color="text-purple-500" />
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md">
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {templateConfig.framework}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {templateConfig.label} structure
            </span>
          </div>
        </div>

        {/* Template & Industry */}
        <div>
          <SectionHeader icon={FileText} title="Template Details" color="text-green-500" />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-gray-500 dark:text-gray-400">Type: </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {CONTENT_TYPE_LABELS[metadata.contentType]}
              </span>
            </div>
            <div className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-gray-500 dark:text-gray-400">Platform: </span>
              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                {metadata.platform}
              </span>
            </div>
            {industryName && (
              <div className="col-span-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-gray-500 dark:text-gray-400">Industry: </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {industryName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Generation Stats */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Template: {metadata.templateId}</span>
            <span>{metadata.attempts} attempt{metadata.attempts !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default WhyThisWorksTooltip;
