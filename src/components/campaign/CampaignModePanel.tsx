/**
 * Campaign Mode Panel
 *
 * Main panel for industry-profile-driven campaign generation.
 * Provides three campaign types:
 * - Awareness: Build brand recognition (60% educational)
 * - Engagement: Grow community (50% engagement)
 * - Conversion: Drive sales (60% promotional)
 *
 * Uses enhanced industry profiles to provide industry-specific templates.
 *
 * Created: 2025-11-29
 * Related: useIndustryProfile, industry-profile.types.ts
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Users,
  Target,
  Sparkles,
  Calendar,
  CalendarPlus,
  ChevronRight,
  ArrowRight,
  Zap,
  Check,
  Clock,
  BarChart3,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type {
  CampaignTemplate,
  CampaignType,
  CampaignWeek,
  CampaignPost,
  EnhancedIndustryProfile
} from '@/types/industry-profile.types';
import { CampaignWeekView } from './CampaignWeekView';
import { CampaignPostCard } from './CampaignPostCard';

// =============================================================================
// TYPES
// =============================================================================

interface CampaignModePanelProps {
  profile: EnhancedIndustryProfile | null;
  isLoading?: boolean;
  matchConfidence?: number;
  onGenerateContent?: (post: CampaignPost, weekTheme: string) => Promise<GeneratedCampaignContent | void>;
  onCampaignSelect?: (campaign: CampaignTemplate | null) => void;
  onAddToCalendar?: (posts: GeneratedCampaignContent[], campaign: CampaignTemplate) => Promise<void>;
  className?: string;
}

// Generated content type (matches GeneratedContent from v4 types)
interface GeneratedCampaignContent {
  id: string;
  headline: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

// =============================================================================
// CAMPAIGN TYPE CONFIGURATION
// =============================================================================

interface CampaignTypeConfig {
  type: CampaignType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  contentMix: { educational: number; engagement: number; promotional: number };
  duration: number;
  postsPerWeek: number;
  bestFor: string[];
}

const CAMPAIGN_TYPE_CONFIG: CampaignTypeConfig[] = [
  {
    type: 'awareness',
    name: 'Awareness',
    description: 'Build brand recognition and establish thought leadership',
    icon: Megaphone,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-cyan-500',
    contentMix: { educational: 60, engagement: 30, promotional: 10 },
    duration: 4,
    postsPerWeek: 4,
    bestFor: ['New brands', 'Market entry', 'Repositioning']
  },
  {
    type: 'engagement',
    name: 'Engagement',
    description: 'Grow community and increase audience interaction',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-violet-500',
    contentMix: { educational: 30, engagement: 50, promotional: 20 },
    duration: 3,
    postsPerWeek: 4,
    bestFor: ['Growing accounts', 'Community building', 'Brand loyalty']
  },
  {
    type: 'conversion',
    name: 'Conversion',
    description: 'Drive leads, sales, and measurable actions',
    icon: Target,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-500 to-emerald-500',
    contentMix: { educational: 20, engagement: 20, promotional: 60 },
    duration: 2,
    postsPerWeek: 5,
    bestFor: ['Product launches', 'Promotions', 'Lead generation']
  }
];

// =============================================================================
// CAMPAIGN TYPE SELECTOR CARD
// =============================================================================

interface CampaignTypeSelectorCardProps {
  config: CampaignTypeConfig;
  isSelected: boolean;
  isDisabled?: boolean;
  onSelect: () => void;
}

const CampaignTypeSelectorCard = memo(function CampaignTypeSelectorCard({
  config,
  isSelected,
  isDisabled = false,
  onSelect
}: CampaignTypeSelectorCardProps) {
  const Icon = config.icon;

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`
        relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200
        ${isSelected
          ? `border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500/20`
          : isDisabled
            ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 opacity-60 cursor-not-allowed'
            : `border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md`
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {config.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {config.description}
          </p>
        </div>
      </div>

      {/* Content Mix Bar */}
      <div className="mb-3">
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${config.contentMix.educational}%` }}
            title={`Educational: ${config.contentMix.educational}%`}
          />
          <div
            className="bg-purple-500 transition-all"
            style={{ width: `${config.contentMix.engagement}%` }}
            title={`Engagement: ${config.contentMix.engagement}%`}
          />
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${config.contentMix.promotional}%` }}
            title={`Promotional: ${config.contentMix.promotional}%`}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Edu {config.contentMix.educational}%</span>
          <span>Eng {config.contentMix.engagement}%</span>
          <span>Promo {config.contentMix.promotional}%</span>
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {config.duration} weeks
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />
          {config.postsPerWeek}/week
        </span>
      </div>

      {/* Best For Tags */}
      <div className="flex flex-wrap gap-1 mt-3">
        {config.bestFor.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
});

// =============================================================================
// CAMPAIGN OVERVIEW SECTION
// =============================================================================

interface CampaignOverviewProps {
  campaign: CampaignTemplate;
  profile: EnhancedIndustryProfile;
  onStartGeneration: () => void;
  onAddToCalendar?: () => void;
  generatedCount: number;
  totalPosts: number;
  isAddingToCalendar?: boolean;
}

const CampaignOverview = memo(function CampaignOverview({
  campaign,
  profile,
  onStartGeneration,
  onAddToCalendar,
  generatedCount,
  totalPosts,
  isAddingToCalendar = false
}: CampaignOverviewProps) {
  const config = CAMPAIGN_TYPE_CONFIG.find(c => c.type === campaign.type);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`rounded-xl border-2 ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 ${config.bgColor} border-b ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {campaign.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {profile.industry_name} Campaign
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onStartGeneration}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-gradient-to-r ${config.gradient} text-white font-medium
                hover:opacity-90 transition-opacity
              `}
            >
              <Sparkles className="w-4 h-4" />
              Generate All
            </button>
            {generatedCount > 0 && onAddToCalendar && (
              <button
                onClick={onAddToCalendar}
                disabled={isAddingToCalendar}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  border-2 border-green-500 text-green-600 dark:text-green-400 font-medium
                  hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isAddingToCalendar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4" />
                    Add to Calendar ({generatedCount})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-4 gap-4 border-b border-gray-200 dark:border-slate-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.duration_weeks}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Weeks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.posts_per_week}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Posts/Week</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalPosts}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Posts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-violet-500 bg-clip-text text-transparent">
            {campaign.content_mix.promotional}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Promo Mix</div>
        </div>
      </div>

      {/* Industry Insights */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Industry-Optimized for {profile.industry_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Content templates use proven {profile.industry_name} hooks and messaging patterns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// MAIN CAMPAIGN MODE PANEL
// =============================================================================

export const CampaignModePanel = memo(function CampaignModePanel({
  profile,
  isLoading = false,
  matchConfidence = 0,
  onGenerateContent,
  onCampaignSelect,
  onAddToCalendar,
  className = ''
}: CampaignModePanelProps) {
  const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
  const [campaign, setCampaign] = useState<CampaignTemplate | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  // Track generated content per post (key: "week-day")
  const [generatedPosts, setGeneratedPosts] = useState<Map<string, GeneratedCampaignContent>>(new Map());
  // Track which post is currently generating
  const [generatingPostKey, setGeneratingPostKey] = useState<string | null>(null);

  // Generate campaign template when type is selected
  const generateCampaignTemplate = useCallback((type: CampaignType) => {
    if (!profile) return null;

    const config = CAMPAIGN_TYPE_CONFIG.find(c => c.type === type);
    if (!config) return null;

    const template: CampaignTemplate = {
      type,
      name: `${profile.industry_name} ${config.name} Campaign`,
      description: config.description,
      duration_weeks: config.duration,
      posts_per_week: config.postsPerWeek,
      content_mix: config.contentMix,
      weeks: []
    };

    // Generate week templates based on profile data
    const triggers = profile.customer_triggers || [];
    const templates = profile.content_templates?.linkedin || {};

    for (let week = 1; week <= config.duration; week++) {
      const weekPosts: CampaignPost[] = [];
      const contentTypes = ['educational', 'engagement', 'promotional', 'authority', 'case_study'] as const;

      for (let day = 1; day <= config.postsPerWeek; day++) {
        // Distribute content types based on mix
        let contentType: typeof contentTypes[number];
        const rand = Math.random() * 100;
        if (rand < config.contentMix.educational) {
          contentType = 'educational';
        } else if (rand < config.contentMix.educational + config.contentMix.engagement) {
          contentType = 'engagement';
        } else {
          contentType = 'promotional';
        }

        // Get template hook for this content type
        const templateContent = templates[contentType as keyof typeof templates];
        const hook = templateContent?.hook ||
          profile.headline_templates?.[day % (profile.headline_templates?.length || 1)]?.template ||
          '';

        weekPosts.push({
          day,
          content_type: contentType,
          hook,
          body: templateContent?.body,
          cta: templateContent?.cta,
          platform: 'linkedin',
          generated: false
        });
      }

      template.weeks.push({
        week_number: week,
        theme: triggers[(week - 1) % (triggers.length || 1)]?.trigger || `Week ${week}`,
        posts: weekPosts
      });
    }

    return template;
  }, [profile]);

  // Handle campaign type selection
  const handleSelectType = useCallback((type: CampaignType) => {
    setSelectedType(type);
    const newCampaign = generateCampaignTemplate(type);
    setCampaign(newCampaign);
    setExpandedWeek(1);
    onCampaignSelect?.(newCampaign);
  }, [generateCampaignTemplate, onCampaignSelect]);

  // Handle generate all - generates all posts sequentially
  const handleGenerateAll = useCallback(async () => {
    if (!campaign || !onGenerateContent) return;
    setIsGenerating(true);

    try {
      for (const week of campaign.weeks) {
        for (const post of week.posts) {
          // Skip already generated posts
          const postKey = `${week.week_number}-${post.day}`;
          if (generatedPosts.has(postKey) || post.generated) continue;

          setGeneratingPostKey(postKey);

          try {
            const result = await onGenerateContent(post, week.theme);
            if (result) {
              // Store generated content
              setGeneratedPosts(prev => {
                const updated = new Map(prev);
                updated.set(postKey, result);
                return updated;
              });

              // Update campaign state
              setCampaign(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  weeks: prev.weeks.map(w => {
                    if (w.week_number !== week.week_number) return w;
                    return {
                      ...w,
                      posts: w.posts.map(p => {
                        if (p.day !== post.day) return p;
                        return { ...p, generated: true, hook: result.hook, body: result.body, cta: result.cta };
                      })
                    };
                  })
                };
              });
            }
          } catch (err) {
            console.error(`[CampaignModePanel] Failed to generate post ${postKey}:`, err);
          }

          // Small delay between generations to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      setIsGenerating(false);
      setGeneratingPostKey(null);
    }
  }, [campaign, onGenerateContent, generatedPosts]);

  // Handle individual post generation
  const handleGeneratePost = useCallback(async (post: CampaignPost, weekNumber: number, weekTheme: string) => {
    const postKey = `${weekNumber}-${post.day}`;
    setGeneratingPostKey(postKey);

    try {
      const result = await onGenerateContent?.(post, weekTheme);
      if (result) {
        // Store generated content
        setGeneratedPosts(prev => {
          const updated = new Map(prev);
          updated.set(postKey, result);
          return updated;
        });

        // Update campaign state to mark post as generated
        setCampaign(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            weeks: prev.weeks.map(week => {
              if (week.week_number !== weekNumber) return week;
              return {
                ...week,
                posts: week.posts.map(p => {
                  if (p.day !== post.day) return p;
                  return { ...p, generated: true, hook: result.hook, body: result.body, cta: result.cta };
                })
              };
            })
          };
        });
      }
    } catch (err) {
      console.error('[CampaignModePanel] Post generation failed:', err);
    } finally {
      setGeneratingPostKey(null);
    }
  }, [onGenerateContent]);

  // Handle adding all generated posts to calendar
  const handleAddToCalendar = useCallback(async () => {
    if (!campaign || !onAddToCalendar || generatedPosts.size === 0) return;

    setIsAddingToCalendar(true);
    try {
      const posts = Array.from(generatedPosts.values());
      await onAddToCalendar(posts, campaign);
      console.log('[CampaignModePanel] Successfully added to calendar:', posts.length, 'posts');
    } catch (err) {
      console.error('[CampaignModePanel] Failed to add to calendar:', err);
    } finally {
      setIsAddingToCalendar(false);
    }
  }, [campaign, onAddToCalendar, generatedPosts]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading industry profile...
          </p>
        </div>
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className={`rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Industry Profile Required
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Campaign Mode requires an industry profile to provide optimized templates.
              Complete your brand profile to unlock this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Campaign Mode
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Industry-optimized campaign templates for {profile.industry_name}
          </p>
        </div>
        {matchConfidence > 0 && (
          <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
              {Math.round(matchConfidence * 100)}% Profile Match
            </span>
          </div>
        )}
      </div>

      {/* Campaign Type Selector */}
      {!selectedType ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Choose Your Campaign Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CAMPAIGN_TYPE_CONFIG.map((config) => (
              <CampaignTypeSelectorCard
                key={config.type}
                config={config}
                isSelected={selectedType === config.type}
                onSelect={() => handleSelectType(config.type)}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedType(null);
              setCampaign(null);
              onCampaignSelect?.(null);
            }}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Campaign Types
          </button>

          {/* Campaign Overview */}
          {campaign && (
            <CampaignOverview
              campaign={campaign}
              profile={profile}
              onStartGeneration={handleGenerateAll}
              onAddToCalendar={onAddToCalendar ? handleAddToCalendar : undefined}
              generatedCount={generatedPosts.size}
              totalPosts={campaign.weeks.reduce((sum, week) => sum + week.posts.length, 0)}
              isAddingToCalendar={isAddingToCalendar}
            />
          )}

          {/* Week Timeline */}
          {campaign && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Campaign Timeline
              </h3>
              <div className="space-y-3">
                {campaign.weeks.map((week) => (
                  <CampaignWeekView
                    key={week.week_number}
                    week={week}
                    isExpanded={expandedWeek === week.week_number}
                    onToggleExpand={() => setExpandedWeek(
                      expandedWeek === week.week_number ? null : week.week_number
                    )}
                    onGeneratePost={(post) => handleGeneratePost(post, week.week_number, week.theme)}
                    isGenerating={isGenerating}
                    generatingPostKey={generatingPostKey}
                    generatedPosts={generatedPosts}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default CampaignModePanel;
