/**
 * Campaign Post Card Component
 *
 * Displays a single post within a campaign week.
 * Shows content type, hook preview, and generation status.
 *
 * Created: 2025-11-29
 */

import React, { memo } from 'react';
import {
  Sparkles,
  Check,
  BookOpen,
  MessageSquare,
  ShoppingBag,
  Award,
  FileText,
  Loader2,
  Linkedin,
  Instagram,
  Twitter
} from 'lucide-react';
import type { CampaignPost } from '@/types/industry-profile.types';

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

interface CampaignPostCardProps {
  post: CampaignPost;
  weekTheme: string;
  onGenerate: () => void;
  isGenerating?: boolean;
  /** Generated content for this post (if available) */
  generatedContent?: GeneratedCampaignContent;
}

// =============================================================================
// CONTENT TYPE CONFIG
// =============================================================================

interface ContentTypeConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

const CONTENT_TYPE_CONFIG: Record<string, ContentTypeConfig> = {
  'educational': {
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Educational'
  },
  'engagement': {
    icon: MessageSquare,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Engagement'
  },
  'promotional': {
    icon: ShoppingBag,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Promotional'
  },
  'authority': {
    icon: Award,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Authority'
  },
  'case_study': {
    icon: FileText,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    label: 'Case Study'
  }
};

// =============================================================================
// PLATFORM CONFIG
// =============================================================================

interface PlatformConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  'linkedin': {
    icon: Linkedin,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'instagram': {
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  'twitter': {
    icon: Twitter,
    color: 'text-sky-500',
    bgColor: 'bg-sky-100'
  },
  'tiktok': {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
    ),
    color: 'text-black dark:text-white',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  }
};

// =============================================================================
// DAY LABELS
// =============================================================================

const DAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// =============================================================================
// COMPONENT
// =============================================================================

export const CampaignPostCard = memo(function CampaignPostCard({
  post,
  weekTheme,
  onGenerate,
  isGenerating = false,
  generatedContent
}: CampaignPostCardProps) {
  const typeConfig = CONTENT_TYPE_CONFIG[post.content_type] || CONTENT_TYPE_CONFIG['educational'];
  const TypeIcon = typeConfig.icon;
  const hasGenerated = post.generated || !!generatedContent;

  const platformConfig = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG['linkedin'];
  const PlatformIcon = platformConfig.icon;

  const dayLabel = DAY_LABELS[post.day % 7] || `Day ${post.day}`;

  return (
    <div
      className={`
        relative rounded-lg border-2 overflow-hidden transition-all duration-200
        ${hasGenerated
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
          : `${typeConfig.borderColor} bg-white dark:bg-slate-800 hover:shadow-md`
        }
      `}
    >
      {/* Generated Badge */}
      {hasGenerated && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Header */}
      <div className={`px-3 py-2 ${typeConfig.bgColor} border-b ${typeConfig.borderColor} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
          <span className={`text-xs font-medium ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {dayLabel}
          </span>
          <div className={`w-5 h-5 ${platformConfig.bgColor} rounded flex items-center justify-center`}>
            <PlatformIcon className={`w-3 h-3 ${platformConfig.color}`} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Generated Content Display */}
        {generatedContent ? (
          <div className="space-y-2">
            {/* Hook/Headline */}
            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {generatedContent.hook || generatedContent.headline}
            </p>
            {/* Body preview */}
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
              {generatedContent.body.slice(0, 150)}...
            </p>
            {/* CTA */}
            {generatedContent.cta && (
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate">
                ↳ {generatedContent.cta}
              </p>
            )}
            {/* Hashtags */}
            {generatedContent.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {generatedContent.hashtags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
                {generatedContent.hashtags.length > 3 && (
                  <span className="text-xs text-gray-400">+{generatedContent.hashtags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Hook Preview (template) */}
            {post.hook ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                {post.hook}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">
                No hook template available
              </p>
            )}

            {/* CTA Preview if available */}
            {post.cta && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">
                CTA: {post.cta}
              </p>
            )}
          </>
        )}

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || hasGenerated}
          className={`
            w-full py-2 px-3 rounded-lg text-sm font-medium
            flex items-center justify-center gap-2
            transition-colors mt-3
            ${hasGenerated
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
              : isGenerating
                ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-wait'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
            }
          `}
        >
          {hasGenerated ? (
            <>
              <Check className="w-4 h-4" />
              Generated
            </>
          ) : isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  );
});

export default CampaignPostCard;
