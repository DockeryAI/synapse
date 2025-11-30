/**
 * Campaign Week View Component
 *
 * Displays a single week in a campaign with expandable post list.
 * Shows week theme, post count, and content type distribution.
 *
 * Created: 2025-11-29
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Calendar,
  Target,
  BookOpen,
  MessageSquare,
  ShoppingBag,
  Award,
  FileText
} from 'lucide-react';
import type { CampaignWeek, CampaignPost } from '@/types/industry-profile.types';
import { CampaignPostCard } from './CampaignPostCard';

// =============================================================================
// TYPES
// =============================================================================

// Generated content type (matches GeneratedContent from v4 types)
interface GeneratedCampaignContent {
  id: string;
  headline: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

interface CampaignWeekViewProps {
  week: CampaignWeek;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onGeneratePost: (post: CampaignPost) => void;
  isGenerating?: boolean;
  /** Key of the post currently being generated (format: "weekNumber-day") */
  generatingPostKey?: string | null;
  /** Map of generated posts by key */
  generatedPosts?: Map<string, GeneratedCampaignContent>;
}

// =============================================================================
// CONTENT TYPE CONFIG
// =============================================================================

interface ContentTypeConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}

const CONTENT_TYPE_CONFIG: Record<string, ContentTypeConfig> = {
  'educational': {
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Educational'
  },
  'engagement': {
    icon: MessageSquare,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Engagement'
  },
  'promotional': {
    icon: ShoppingBag,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Promotional'
  },
  'authority': {
    icon: Award,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Authority'
  },
  'case_study': {
    icon: FileText,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    label: 'Case Study'
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

export const CampaignWeekView = memo(function CampaignWeekView({
  week,
  isExpanded,
  onToggleExpand,
  onGeneratePost,
  isGenerating = false,
  generatingPostKey = null,
  generatedPosts
}: CampaignWeekViewProps) {
  // Count posts by type
  const postTypeCounts = week.posts.reduce((acc, post) => {
    acc[post.content_type] = (acc[post.content_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count generated posts
  const generatedCount = week.posts.filter(p => p.generated).length;
  const progress = week.posts.length > 0 ? (generatedCount / week.posts.length) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Week Header - Clickable */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        {/* Week Number Badge */}
        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {week.week_number}
          </span>
        </div>

        {/* Week Info */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Week {week.week_number}
            </h4>
            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-full">
              {week.posts.length} posts
            </span>
            {generatedCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                {generatedCount} ready
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate max-w-md">
            Theme: {week.theme}
          </p>
        </div>

        {/* Content Type Icons */}
        <div className="flex items-center gap-1">
          {Object.entries(postTypeCounts).map(([type, count]) => {
            const config = CONTENT_TYPE_CONFIG[type] || CONTENT_TYPE_CONFIG['educational'];
            const Icon = config.icon;
            return (
              <div
                key={type}
                className={`w-7 h-7 ${config.bgColor} rounded-md flex items-center justify-center`}
                title={`${config.label}: ${count}`}
              >
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-20 flex-shrink-0">
          <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 text-right">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Expand Icon */}
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Week Theme Banner */}
            <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Week Theme:
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {week.theme}
                </span>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {week.posts.map((post, idx) => {
                const postKey = `${week.week_number}-${post.day}`;
                const isThisPostGenerating = generatingPostKey === postKey;
                const generatedContent = generatedPosts?.get(postKey);
                return (
                  <CampaignPostCard
                    key={`${week.week_number}-${post.day}-${idx}`}
                    post={post}
                    weekTheme={week.theme}
                    onGenerate={() => onGeneratePost(post)}
                    isGenerating={isThisPostGenerating}
                    generatedContent={generatedContent}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CampaignWeekView;
