/**
 * V5 Easy Mode Generation Hook
 *
 * Phase 7: One-click campaign generation with V5 content engine.
 * Auto-loads all context (Industry + UVP + EQ + Intelligence) for the brand.
 *
 * Created: 2025-12-01
 */

import { useState, useCallback } from 'react';
import { contentOrchestrator } from '@/services/v5/content-orchestrator';
import { industryProfileService } from '@/services/v5/industry-profile.service';
import { uvpProviderService } from '@/services/v5/uvp-provider.service';
import { eqIntegrationService } from '@/services/v5/eq-integration.service';
import { intelligenceService } from '@/services/v5/intelligence.service';
import type {
  Platform,
  V5GeneratedContent,
  V5GenerationResult,
  CustomerCategory,
  ContentType,
} from '@/services/v5/types';

// ============================================================================
// TYPES
// ============================================================================

export interface EasyModeOptions {
  brandId: string;
  industrySlug?: string;
  eqScore?: number;
  weeks?: number;
  postsPerWeek?: number;
  platforms?: Platform[];
}

export interface QuickPostOptions {
  brandId: string;
  industrySlug?: string;
  eqScore?: number;
  platform: Platform;
}

export interface CampaignPost {
  week: number;
  day: number;
  platform: Platform;
  contentType: ContentType;
  content: V5GeneratedContent;
}

export interface CampaignResult {
  success: boolean;
  posts: CampaignPost[];
  summary: {
    totalPosts: number;
    avgScore: number;
    platformBreakdown: Record<Platform, number>;
    contentTypeBreakdown: Record<ContentType, number>;
  };
  error?: string;
}

export interface QuickPostResult {
  success: boolean;
  content?: V5GeneratedContent;
  error?: string;
}

export interface ContextStatus {
  isLoading: boolean;
  industryLoaded: boolean;
  uvpLoaded: boolean;
  eqLoaded: boolean;
  intelligenceLoaded: boolean;
  completeness: number; // 0-100
}

export interface UseV5EasyModeGenerationReturn {
  // State
  isGenerating: boolean;
  error: string | null;
  contextStatus: ContextStatus;
  campaign: CampaignPost[];
  quickPost: V5GeneratedContent | null;

  // Generation functions
  generateFullCampaign: (options: EasyModeOptions) => Promise<CampaignResult>;
  generateQuickPost: (options: QuickPostOptions) => Promise<QuickPostResult>;
  generateWeeklyPlan: (options: EasyModeOptions & { week: number }) => Promise<CampaignPost[]>;

  // Utilities
  clearCampaign: () => void;
  clearQuickPost: () => void;
  clearError: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PLATFORMS: Platform[] = ['linkedin', 'facebook', 'instagram'];
const CONTENT_MIX: Record<ContentType, number> = {
  educational: 40,
  promotional: 35,
  community: 15,
  authority: 5,
  engagement: 5,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useV5EasyModeGeneration(): UseV5EasyModeGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignPost[]>([]);
  const [quickPost, setQuickPost] = useState<V5GeneratedContent | null>(null);
  const [contextStatus, setContextStatus] = useState<ContextStatus>({
    isLoading: false,
    industryLoaded: false,
    uvpLoaded: false,
    eqLoaded: false,
    intelligenceLoaded: false,
    completeness: 0,
  });

  /**
   * Load all context for a brand
   */
  const loadContext = useCallback(async (
    brandId: string,
    industrySlug?: string,
    eqScore?: number
  ) => {
    setContextStatus(prev => ({ ...prev, isLoading: true }));
    let completeness = 0;

    // Load industry profile
    try {
      if (industrySlug) {
        await industryProfileService.loadProfile(industrySlug);
      }
      setContextStatus(prev => ({ ...prev, industryLoaded: true }));
      completeness += 25;
    } catch {
      // Use default
    }

    // Load UVP
    try {
      await uvpProviderService.loadFromBrand(brandId);
      setContextStatus(prev => ({ ...prev, uvpLoaded: true }));
      completeness += 25;
    } catch {
      // Use default
    }

    // Load EQ
    try {
      if (eqScore !== undefined) {
        eqIntegrationService.getProfileFromScore(eqScore);
      }
      setContextStatus(prev => ({ ...prev, eqLoaded: true }));
      completeness += 25;
    } catch {
      // Use default
    }

    // Load Intelligence
    try {
      await intelligenceService.loadFullContext(brandId, industrySlug);
      setContextStatus(prev => ({ ...prev, intelligenceLoaded: true }));
      completeness += 25;
    } catch {
      // Continue without intelligence
    }

    setContextStatus(prev => ({ ...prev, isLoading: false, completeness }));
    return completeness;
  }, []);

  /**
   * Determine content type based on mix percentages
   */
  const getContentTypeForPost = (postIndex: number, totalPosts: number): ContentType => {
    const types: ContentType[] = [];

    // Build weighted array
    for (const [type, weight] of Object.entries(CONTENT_MIX)) {
      const count = Math.max(1, Math.round((weight / 100) * totalPosts));
      for (let i = 0; i < count; i++) {
        types.push(type as ContentType);
      }
    }

    // Use modulo to cycle through types
    return types[postIndex % types.length];
  };

  /**
   * Generate full campaign (Easy Mode main function)
   */
  const generateFullCampaign = useCallback(async (
    options: EasyModeOptions
  ): Promise<CampaignResult> => {
    setIsGenerating(true);
    setError(null);
    setCampaign([]);

    try {
      // Load context
      await loadContext(options.brandId, options.industrySlug, options.eqScore);

      const weeks = options.weeks || 4;
      const postsPerWeek = options.postsPerWeek || 4;
      const platforms = options.platforms || DEFAULT_PLATFORMS;
      const totalPosts = weeks * postsPerWeek;

      const posts: CampaignPost[] = [];
      const platformBreakdown: Record<Platform, number> = {
        linkedin: 0, facebook: 0, instagram: 0, twitter: 0, tiktok: 0,
      };
      const contentTypeBreakdown: Record<ContentType, number> = {
        promotional: 0, educational: 0, community: 0, authority: 0, engagement: 0,
      };

      let totalScore = 0;

      // Generate posts week by week
      for (let week = 1; week <= weeks; week++) {
        for (let day = 1; day <= postsPerWeek; day++) {
          const postIndex = (week - 1) * postsPerWeek + (day - 1);
          const platform = platforms[postIndex % platforms.length];
          const contentType = getContentTypeForPost(postIndex, totalPosts);

          const result = await contentOrchestrator.generate({
            platform,
            contentType,
            brandId: options.brandId,
            industrySlug: options.industrySlug,
            eqScore: options.eqScore,
            campaignId: `campaign-${options.brandId}-${Date.now()}`,
          });

          if (result.success && result.content) {
            const post: CampaignPost = {
              week,
              day,
              platform,
              contentType,
              content: result.content,
            };

            posts.push(post);
            platformBreakdown[platform]++;
            contentTypeBreakdown[contentType]++;
            totalScore += result.content.score.total;

            // Update state progressively
            setCampaign(prev => [...prev, post]);
          }
        }
      }

      const avgScore = posts.length > 0 ? Math.round(totalScore / posts.length) : 0;

      return {
        success: true,
        posts,
        summary: {
          totalPosts: posts.length,
          avgScore,
          platformBreakdown,
          contentTypeBreakdown,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Campaign generation failed';
      setError(message);
      return { success: false, posts: [], summary: { totalPosts: 0, avgScore: 0, platformBreakdown: { linkedin: 0, facebook: 0, instagram: 0, twitter: 0, tiktok: 0 }, contentTypeBreakdown: { promotional: 0, educational: 0, community: 0, authority: 0, engagement: 0 } }, error: message };
    } finally {
      setIsGenerating(false);
    }
  }, [loadContext]);

  /**
   * Generate single quick post
   */
  const generateQuickPost = useCallback(async (
    options: QuickPostOptions
  ): Promise<QuickPostResult> => {
    setIsGenerating(true);
    setError(null);
    setQuickPost(null);

    try {
      // Load context (fast, may be cached)
      await loadContext(options.brandId, options.industrySlug, options.eqScore);

      // Generate single post
      const result = await contentOrchestrator.generate({
        platform: options.platform,
        brandId: options.brandId,
        industrySlug: options.industrySlug,
        eqScore: options.eqScore,
      });

      if (result.success && result.content) {
        setQuickPost(result.content);
        return { success: true, content: result.content };
      }

      throw new Error(result.error || 'Quick post generation failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Quick post failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsGenerating(false);
    }
  }, [loadContext]);

  /**
   * Generate posts for a single week
   */
  const generateWeeklyPlan = useCallback(async (
    options: EasyModeOptions & { week: number }
  ): Promise<CampaignPost[]> => {
    setIsGenerating(true);
    setError(null);

    try {
      await loadContext(options.brandId, options.industrySlug, options.eqScore);

      const postsPerWeek = options.postsPerWeek || 4;
      const platforms = options.platforms || DEFAULT_PLATFORMS;
      const posts: CampaignPost[] = [];

      for (let day = 1; day <= postsPerWeek; day++) {
        const postIndex = day - 1;
        const platform = platforms[postIndex % platforms.length];
        const contentType = getContentTypeForPost(postIndex, postsPerWeek);

        const result = await contentOrchestrator.generate({
          platform,
          contentType,
          brandId: options.brandId,
          industrySlug: options.industrySlug,
          eqScore: options.eqScore,
        });

        if (result.success && result.content) {
          posts.push({
            week: options.week,
            day,
            platform,
            contentType,
            content: result.content,
          });
        }
      }

      return posts;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Weekly plan failed';
      setError(message);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, [loadContext]);

  /**
   * Clear campaign
   */
  const clearCampaign = useCallback(() => {
    setCampaign([]);
  }, []);

  /**
   * Clear quick post
   */
  const clearQuickPost = useCallback(() => {
    setQuickPost(null);
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
    contextStatus,
    campaign,
    quickPost,
    generateFullCampaign,
    generateQuickPost,
    generateWeeklyPlan,
    clearCampaign,
    clearQuickPost,
    clearError,
  };
}

export default useV5EasyModeGeneration;
