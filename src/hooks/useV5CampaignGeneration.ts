/**
 * V5 Campaign Generation Hook
 *
 * Phase 7: Campaign Mode integration with V5 content engine.
 * Supports Awareness, Engagement, and Conversion campaign types.
 *
 * Created: 2025-12-01
 */

import { useState, useCallback } from 'react';
import { contentOrchestrator } from '@/services/v5/content-orchestrator';
import { embeddingsService } from '@/services/v5/embeddings.service';
import type {
  Platform,
  V5GeneratedContent,
  ContentType,
  CustomerCategory,
} from '@/services/v5/types';

// ============================================================================
// TYPES
// ============================================================================

export type CampaignType = 'awareness' | 'engagement' | 'conversion';

export interface CampaignConfig {
  type: CampaignType;
  weeks: number;
  postsPerWeek: number;
  contentMix: {
    educational: number;
    engagement: number;
    promotional: number;
  };
  description: string;
  bestFor: string;
}

export interface WeekTheme {
  week: number;
  theme: string;
  focus: string;
  suggestedContentTypes: ContentType[];
}

export interface CampaignPost {
  id: string;
  week: number;
  dayOfWeek: number;
  platform: Platform;
  contentType: ContentType;
  content: V5GeneratedContent | null;
  isGenerated: boolean;
  weekTheme: string;
}

export interface CampaignGenerationOptions {
  campaignType: CampaignType;
  brandId: string;
  industrySlug?: string;
  eqScore?: number;
  platforms?: Platform[];
  customWeekThemes?: WeekTheme[];
}

export interface CampaignState {
  type: CampaignType;
  posts: CampaignPost[];
  generatedCount: number;
  totalCount: number;
  avgScore: number;
}

export interface UseV5CampaignGenerationReturn {
  // State
  isGenerating: boolean;
  error: string | null;
  campaign: CampaignState | null;
  progress: number;

  // Campaign functions
  initializeCampaign: (options: CampaignGenerationOptions) => Promise<void>;
  generatePost: (postId: string) => Promise<V5GeneratedContent | null>;
  generateAllPosts: () => Promise<void>;
  generateWeek: (week: number) => Promise<void>;
  regeneratePost: (postId: string) => Promise<V5GeneratedContent | null>;

  // Utilities
  getCampaignConfig: (type: CampaignType) => CampaignConfig;
  getWeekThemes: (type: CampaignType, industrySlug?: string) => WeekTheme[];
  clearCampaign: () => void;
  clearError: () => void;
}

// ============================================================================
// CAMPAIGN CONFIGURATIONS
// ============================================================================

const CAMPAIGN_CONFIGS: Record<CampaignType, CampaignConfig> = {
  awareness: {
    type: 'awareness',
    weeks: 4,
    postsPerWeek: 4,
    contentMix: { educational: 60, engagement: 30, promotional: 10 },
    description: 'Build brand awareness and establish authority',
    bestFor: 'New brands, market entry, repositioning',
  },
  engagement: {
    type: 'engagement',
    weeks: 3,
    postsPerWeek: 4,
    contentMix: { educational: 30, engagement: 50, promotional: 20 },
    description: 'Grow community and increase interactions',
    bestFor: 'Growing accounts, community building, brand loyalty',
  },
  conversion: {
    type: 'conversion',
    weeks: 2,
    postsPerWeek: 5,
    contentMix: { educational: 20, engagement: 20, promotional: 60 },
    description: 'Drive sales and generate leads',
    bestFor: 'Product launches, promotions, lead generation',
  },
};

const DEFAULT_WEEK_THEMES: Record<CampaignType, WeekTheme[]> = {
  awareness: [
    { week: 1, theme: 'Introduction & Authority', focus: 'Establish expertise', suggestedContentTypes: ['educational', 'authority'] },
    { week: 2, theme: 'Problem Awareness', focus: 'Highlight pain points', suggestedContentTypes: ['educational', 'community'] },
    { week: 3, theme: 'Solution Preview', focus: 'Tease solutions', suggestedContentTypes: ['educational', 'engagement'] },
    { week: 4, theme: 'Social Proof', focus: 'Build trust', suggestedContentTypes: ['authority', 'promotional'] },
  ],
  engagement: [
    { week: 1, theme: 'Community Building', focus: 'Start conversations', suggestedContentTypes: ['community', 'engagement'] },
    { week: 2, theme: 'Value Delivery', focus: 'Provide actionable tips', suggestedContentTypes: ['educational', 'engagement'] },
    { week: 3, theme: 'Relationship Deepening', focus: 'Personal stories', suggestedContentTypes: ['community', 'promotional'] },
  ],
  conversion: [
    { week: 1, theme: 'Problem Agitation', focus: 'Urgency & pain', suggestedContentTypes: ['educational', 'promotional'] },
    { week: 2, theme: 'Solution & CTA', focus: 'Direct offers', suggestedContentTypes: ['promotional', 'promotional'] },
  ],
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useV5CampaignGeneration(): UseV5CampaignGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignState | null>(null);
  const [progress, setProgress] = useState(0);

  // Store options for post generation
  const [currentOptions, setCurrentOptions] = useState<CampaignGenerationOptions | null>(null);

  /**
   * Get campaign configuration
   */
  const getCampaignConfig = useCallback((type: CampaignType): CampaignConfig => {
    return CAMPAIGN_CONFIGS[type];
  }, []);

  /**
   * Get week themes for campaign type
   */
  const getWeekThemes = useCallback((
    type: CampaignType,
    _industrySlug?: string
  ): WeekTheme[] => {
    // Could be extended to load industry-specific themes
    return DEFAULT_WEEK_THEMES[type];
  }, []);

  /**
   * Determine content type based on campaign mix and position
   */
  const getContentTypeForPosition = (
    config: CampaignConfig,
    postIndex: number,
    totalPosts: number,
    weekTheme: WeekTheme
  ): ContentType => {
    // First, try to match week theme's suggested types
    if (weekTheme.suggestedContentTypes.length > 0) {
      return weekTheme.suggestedContentTypes[postIndex % weekTheme.suggestedContentTypes.length];
    }

    // Fall back to campaign mix distribution
    const { educational, engagement, promotional } = config.contentMix;
    const eduCount = Math.round((educational / 100) * totalPosts);
    const engageCount = Math.round((engagement / 100) * totalPosts);

    if (postIndex < eduCount) return 'educational';
    if (postIndex < eduCount + engageCount) return 'engagement';
    return 'promotional';
  };

  /**
   * Initialize campaign structure without generating content
   */
  const initializeCampaign = useCallback(async (
    options: CampaignGenerationOptions
  ): Promise<void> => {
    setCurrentOptions(options);
    const config = CAMPAIGN_CONFIGS[options.campaignType];
    const weekThemes = getWeekThemes(options.campaignType, options.industrySlug);
    const platforms = options.platforms || ['linkedin', 'facebook', 'instagram'];
    const totalPosts = config.weeks * config.postsPerWeek;

    const posts: CampaignPost[] = [];
    let postIndex = 0;

    for (let week = 1; week <= config.weeks; week++) {
      const weekTheme = weekThemes.find(t => t.week === week) || weekThemes[0];

      for (let day = 1; day <= config.postsPerWeek; day++) {
        const platform = platforms[(postIndex) % platforms.length] as Platform;
        const contentType = getContentTypeForPosition(config, postIndex, totalPosts, weekTheme);

        posts.push({
          id: `post-${week}-${day}`,
          week,
          dayOfWeek: day,
          platform,
          contentType,
          content: null,
          isGenerated: false,
          weekTheme: weekTheme.theme,
        });

        postIndex++;
      }
    }

    setCampaign({
      type: options.campaignType,
      posts,
      generatedCount: 0,
      totalCount: posts.length,
      avgScore: 0,
    });
  }, [getWeekThemes]);

  /**
   * Generate a single post
   */
  const generatePost = useCallback(async (postId: string): Promise<V5GeneratedContent | null> => {
    if (!campaign || !currentOptions) return null;

    const post = campaign.posts.find(p => p.id === postId);
    if (!post) return null;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await contentOrchestrator.generate({
        platform: post.platform,
        contentType: post.contentType,
        brandId: currentOptions.brandId,
        industrySlug: currentOptions.industrySlug,
        eqScore: currentOptions.eqScore,
        campaignId: `campaign-${currentOptions.campaignType}-${currentOptions.brandId}`,
      });

      if (result.success && result.content) {
        // Update the post in campaign state
        setCampaign(prev => {
          if (!prev) return prev;

          const updatedPosts = prev.posts.map(p =>
            p.id === postId
              ? { ...p, content: result.content!, isGenerated: true }
              : p
          );

          const generatedPosts = updatedPosts.filter(p => p.isGenerated && p.content);
          const totalScore = generatedPosts.reduce((sum, p) => sum + (p.content?.score.total || 0), 0);
          const avgScore = generatedPosts.length > 0 ? Math.round(totalScore / generatedPosts.length) : 0;

          return {
            ...prev,
            posts: updatedPosts,
            generatedCount: generatedPosts.length,
            avgScore,
          };
        });

        return result.content;
      }

      throw new Error(result.error || 'Post generation failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [campaign, currentOptions]);

  /**
   * Generate all posts in campaign
   */
  const generateAllPosts = useCallback(async (): Promise<void> => {
    if (!campaign) return;

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const ungenerated = campaign.posts.filter(p => !p.isGenerated);
      let completed = 0;

      for (const post of ungenerated) {
        await generatePost(post.id);
        completed++;
        setProgress(Math.round((completed / ungenerated.length) * 100));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Batch generation failed';
      setError(message);
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  }, [campaign, generatePost]);

  /**
   * Generate posts for a specific week
   */
  const generateWeek = useCallback(async (week: number): Promise<void> => {
    if (!campaign) return;

    setIsGenerating(true);
    setError(null);

    try {
      const weekPosts = campaign.posts.filter(p => p.week === week && !p.isGenerated);

      for (const post of weekPosts) {
        await generatePost(post.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Week generation failed';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [campaign, generatePost]);

  /**
   * Regenerate a specific post
   */
  const regeneratePost = useCallback(async (postId: string): Promise<V5GeneratedContent | null> => {
    // Clear the existing content first
    setCampaign(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map(p =>
          p.id === postId ? { ...p, content: null, isGenerated: false } : p
        ),
      };
    });

    // Generate fresh
    return generatePost(postId);
  }, [generatePost]);

  /**
   * Clear campaign
   */
  const clearCampaign = useCallback(() => {
    setCampaign(null);
    setCurrentOptions(null);
    setProgress(0);
    // Clear campaign cache in embeddings service
    embeddingsService.clearCache();
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    campaign,
    progress,
    initializeCampaign,
    generatePost,
    generateAllPosts,
    generateWeek,
    regeneratePost,
    getCampaignConfig,
    getWeekThemes,
    clearCampaign,
    clearError,
  };
}

export default useV5CampaignGeneration;
