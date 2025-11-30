/**
 * useIndustryProfile Hook
 *
 * React hook for loading and using enhanced industry profiles.
 * Automatically matches brand data to the best industry profile
 * and provides access to industry-specific content templates.
 *
 * Created: 2025-11-29
 * Related: enhanced-profile-loader.service.ts
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  EnhancedIndustryProfile,
  EnhancedProfileLoadResult,
  EnhancedContentGoalOption,
  EnhancedAudienceSegmentOption,
  EnhancedPlatformOption,
  CampaignTemplate,
} from '@/types/industry-profile.types';
import {
  enhancedProfileLoaderService,
  findBestMatch,
  loadProfileBySlug,
  getContentGoalOptions,
  getAudienceSegmentOptions,
  getPlatformOptions,
  getRandomHooks,
  getHooksByType,
} from '@/services/intelligence/enhanced-profile-loader.service';

// =============================================================================
// TYPES
// =============================================================================

export interface UseIndustryProfileOptions {
  /** NAICS code from brand data */
  naicsCode?: string;
  /** Industry name from brand data */
  industryName?: string;
  /** Keywords extracted from brand description */
  keywords?: string[];
  /** Industry category */
  category?: string;
  /** Skip automatic loading */
  skipAutoLoad?: boolean;
}

export interface UseIndustryProfileReturn {
  // State
  profile: EnhancedIndustryProfile | null;
  loading: boolean;
  error: string | null;
  matchResult: EnhancedProfileLoadResult | null;

  // Match info
  isMatched: boolean;
  matchConfidence: number;
  matchedBy: EnhancedProfileLoadResult['matchedBy'];

  // Profile data helpers
  getContentGoals: () => EnhancedContentGoalOption[];
  getAudienceSegments: () => EnhancedAudienceSegmentOption[];
  getPlatforms: () => EnhancedPlatformOption[];

  // Hook helpers
  getHooks: (type?: 'number_hooks' | 'question_hooks' | 'story_hooks' | 'fear_hooks' | 'howto_hooks') => string[];
  getRandomHooks: (count?: number) => string[];

  // Template helpers
  getHeadlineTemplates: () => string[];
  getUrgencyDrivers: () => string[];
  getPowerWords: () => string[];
  getAvoidWords: () => string[];

  // Customer psychology
  getCustomerTriggers: () => { trigger: string; urgency: number }[];
  getTransformations: () => { from: string; to: string; emotionalValue: string }[];
  getObjectionHandlers: () => { objection: string; response: string }[];

  // Campaign generation
  generateCampaignTemplate: (type: 'awareness' | 'engagement' | 'conversion') => CampaignTemplate | null;

  // Actions
  loadProfile: (slug: string) => Promise<void>;
  searchProfiles: (query: string) => { slug: string; industry: string; category: string }[];
  refresh: () => void;
}

// =============================================================================
// BUNDLED PROFILES (for immediate access without async load)
// =============================================================================

// In production, these would be bundled or fetched from API
// For now, we provide a subset of key profiles inline
const BUNDLED_PROFILES: Record<string, EnhancedIndustryProfile> = {};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useIndustryProfile(
  options: UseIndustryProfileOptions = {}
): UseIndustryProfileReturn {
  const { naicsCode, industryName, keywords, category, skipAutoLoad = false } = options;

  // State
  const [profile, setProfile] = useState<EnhancedIndustryProfile | null>(null);
  const [loading, setLoading] = useState(!skipAutoLoad);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<EnhancedProfileLoadResult | null>(null);

  // Deduplication guard
  const matchCalledRef = useRef(false);
  const lastOptionsRef = useRef<string>('');

  // Compute options hash to detect changes
  const optionsHash = useMemo(() => {
    return JSON.stringify({ naicsCode, industryName, keywords, category });
  }, [naicsCode, industryName, keywords, category]);

  // =============================================================================
  // AUTO-MATCH ON OPTIONS CHANGE
  // =============================================================================

  useEffect(() => {
    if (skipAutoLoad) return;

    // Skip if options haven't changed
    if (lastOptionsRef.current === optionsHash && matchCalledRef.current) {
      return;
    }

    lastOptionsRef.current = optionsHash;
    matchCalledRef.current = true;

    const performMatch = async () => {
      // Don't match if no options provided
      if (!naicsCode && !industryName && !keywords?.length && !category) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[useIndustryProfile] Finding best match...', {
          naicsCode,
          industryName,
          keywords: keywords?.slice(0, 3),
          category,
        });

        const result = findBestMatch({
          naicsCode,
          industryName,
          keywords,
          category,
        });

        setMatchResult(result);

        if (result.matched && result.slug) {
          console.log(`[useIndustryProfile] Matched to ${result.slug} (${result.matchedBy}, ${Math.round(result.confidence * 100)}% confidence)`);

          // Check bundled profiles first
          if (BUNDLED_PROFILES[result.slug]) {
            setProfile(BUNDLED_PROFILES[result.slug]);
          } else {
            // Try to load from service
            const loadedProfile = await loadProfileBySlug(result.slug);
            if (loadedProfile) {
              setProfile(loadedProfile);
            } else {
              console.warn(`[useIndustryProfile] Profile ${result.slug} matched but not loadable. Using match metadata only.`);
            }
          }
        } else {
          console.log('[useIndustryProfile] No industry match found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to match industry profile';
        setError(errorMessage);
        console.error('[useIndustryProfile] Match failed:', err);
      } finally {
        setLoading(false);
      }
    };

    performMatch();
  }, [optionsHash, skipAutoLoad, naicsCode, industryName, keywords, category]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isMatched = matchResult?.matched ?? false;
  const matchConfidence = matchResult?.confidence ?? 0;
  const matchedBy = matchResult?.matchedBy ?? null;

  // =============================================================================
  // PROFILE DATA HELPERS
  // =============================================================================

  const getContentGoals = useCallback((): EnhancedContentGoalOption[] => {
    if (!profile) {
      // Return default options when no profile loaded
      return [
        { id: 'educate', label: 'Educate', subtext: 'Share knowledge and insights' },
        { id: 'engage', label: 'Engage', subtext: 'Start conversations and build community' },
        { id: 'promote', label: 'Promote', subtext: 'Showcase your solutions' },
        { id: 'trust', label: 'Build Trust', subtext: 'Social proof and credibility' },
        { id: 'action', label: 'Drive Action', subtext: 'Convert interest to action' },
      ];
    }
    return getContentGoalOptions(profile);
  }, [profile]);

  const getAudienceSegments = useCallback((): EnhancedAudienceSegmentOption[] => {
    if (!profile) {
      return [
        { id: 'decision_makers', label: 'Decision Makers', subtext: 'C-suite and executives' },
        { id: 'influencers', label: 'Influencers', subtext: 'Key stakeholders' },
        { id: 'pain_aware', label: 'Pain Aware', subtext: 'Actively seeking solutions' },
        { id: 'solution_ready', label: 'Solution Ready', subtext: 'Ready to buy' },
      ];
    }
    return getAudienceSegmentOptions(profile);
  }, [profile]);

  const getPlatforms = useCallback((): EnhancedPlatformOption[] => {
    if (!profile) {
      return [
        { id: 'linkedin', label: 'LinkedIn', hasTemplates: false, recommended: true },
        { id: 'instagram', label: 'Instagram', hasTemplates: false },
        { id: 'tiktok', label: 'TikTok', hasTemplates: false },
        { id: 'twitter', label: 'Twitter/X', hasTemplates: false },
        { id: 'email', label: 'Email', hasTemplates: false },
      ];
    }
    return getPlatformOptions(profile);
  }, [profile]);

  // =============================================================================
  // HOOK HELPERS
  // =============================================================================

  const getHooksCallback = useCallback((
    type?: 'number_hooks' | 'question_hooks' | 'story_hooks' | 'fear_hooks' | 'howto_hooks'
  ): string[] => {
    if (!profile) return [];
    if (type) {
      return getHooksByType(profile, type);
    }
    // Return all hooks combined
    return [
      ...(profile.hook_library.number_hooks || []),
      ...(profile.hook_library.question_hooks || []),
      ...(profile.hook_library.story_hooks || []),
      ...(profile.hook_library.fear_hooks || []),
      ...(profile.hook_library.howto_hooks || []),
    ];
  }, [profile]);

  const getRandomHooksCallback = useCallback((count = 3): string[] => {
    if (!profile) return [];
    return getRandomHooks(profile, count);
  }, [profile]);

  // =============================================================================
  // TEMPLATE HELPERS
  // =============================================================================

  const getHeadlineTemplates = useCallback((): string[] => {
    if (!profile) return [];
    return profile.headline_templates.map(t => t.template);
  }, [profile]);

  const getUrgencyDrivers = useCallback((): string[] => {
    if (!profile) return [];
    return profile.urgency_drivers;
  }, [profile]);

  const getPowerWords = useCallback((): string[] => {
    if (!profile) return [];
    return profile.power_words;
  }, [profile]);

  const getAvoidWords = useCallback((): string[] => {
    if (!profile) return [];
    return profile.avoid_words;
  }, [profile]);

  // =============================================================================
  // CUSTOMER PSYCHOLOGY
  // =============================================================================

  const getCustomerTriggers = useCallback((): { trigger: string; urgency: number }[] => {
    if (!profile) return [];
    return profile.customer_triggers.map(t => ({
      trigger: t.trigger,
      urgency: t.urgency,
    }));
  }, [profile]);

  const getTransformations = useCallback((): { from: string; to: string; emotionalValue: string }[] => {
    if (!profile) return [];
    return profile.transformations.map(t => ({
      from: t.from,
      to: t.to,
      emotionalValue: t.emotional_value,
    }));
  }, [profile]);

  const getObjectionHandlers = useCallback((): { objection: string; response: string }[] => {
    if (!profile) return [];
    return profile.objection_handlers.map(o => ({
      objection: o.objection,
      response: o.response,
    }));
  }, [profile]);

  // =============================================================================
  // CAMPAIGN GENERATION
  // =============================================================================

  const generateCampaignTemplate = useCallback((
    type: 'awareness' | 'engagement' | 'conversion'
  ): CampaignTemplate | null => {
    if (!profile) return null;

    const contentMix = {
      awareness: { educational: 60, engagement: 30, promotional: 10 },
      engagement: { educational: 30, engagement: 50, promotional: 20 },
      conversion: { educational: 20, engagement: 20, promotional: 60 },
    }[type];

    const template: CampaignTemplate = {
      type,
      name: `${profile.industry_name} ${type.charAt(0).toUpperCase() + type.slice(1)} Campaign`,
      description: `A ${type}-focused campaign for ${profile.industry_name} businesses`,
      duration_weeks: type === 'awareness' ? 4 : type === 'engagement' ? 3 : 2,
      posts_per_week: type === 'conversion' ? 5 : 4,
      content_mix: contentMix,
      weeks: [],
    };

    // Generate week templates based on profile data
    for (let week = 1; week <= template.duration_weeks; week++) {
      const weekPosts = [];
      const triggers = profile.customer_triggers.slice(0, 3);
      const templates = profile.content_templates.linkedin;

      for (let day = 1; day <= template.posts_per_week; day++) {
        const contentTypes = ['educational', 'engagement', 'promotional', 'authority', 'case_study'] as const;
        const contentType = contentTypes[day % contentTypes.length];

        weekPosts.push({
          day,
          content_type: contentType,
          hook: templates?.[contentType]?.hook || profile.headline_templates[day % profile.headline_templates.length]?.template || '',
          body: templates?.[contentType]?.body,
          cta: templates?.[contentType]?.cta,
          platform: 'linkedin',
          generated: false,
        });
      }

      template.weeks.push({
        week_number: week,
        theme: triggers[(week - 1) % triggers.length]?.trigger || `Week ${week}`,
        posts: weekPosts,
      });
    }

    return template;
  }, [profile]);

  // =============================================================================
  // ACTIONS
  // =============================================================================

  const loadProfileAction = useCallback(async (slug: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Check bundled first
      if (BUNDLED_PROFILES[slug]) {
        setProfile(BUNDLED_PROFILES[slug]);
        setMatchResult({
          profile: BUNDLED_PROFILES[slug],
          matched: true,
          matchedBy: 'industry_name',
          confidence: 1.0,
          slug,
        });
        return;
      }

      const loadedProfile = await loadProfileBySlug(slug);
      if (loadedProfile) {
        setProfile(loadedProfile);
        setMatchResult({
          profile: loadedProfile,
          matched: true,
          matchedBy: 'industry_name',
          confidence: 1.0,
          slug,
        });
      } else {
        setError(`Profile ${slug} not found`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProfilesAction = useCallback((
    query: string
  ): { slug: string; industry: string; category: string }[] => {
    const results = enhancedProfileLoaderService.searchProfiles(query, 10);
    return results.map(r => ({
      slug: r.slug,
      industry: r.industry,
      category: r.category,
    }));
  }, []);

  const refresh = useCallback(() => {
    // Reset state and re-trigger match
    matchCalledRef.current = false;
    lastOptionsRef.current = '';
    setProfile(null);
    setMatchResult(null);
    setError(null);
    setLoading(true);
  }, []);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    profile,
    loading,
    error,
    matchResult,

    // Match info
    isMatched,
    matchConfidence,
    matchedBy,

    // Profile data helpers
    getContentGoals,
    getAudienceSegments,
    getPlatforms,

    // Hook helpers
    getHooks: getHooksCallback,
    getRandomHooks: getRandomHooksCallback,

    // Template helpers
    getHeadlineTemplates,
    getUrgencyDrivers,
    getPowerWords,
    getAvoidWords,

    // Customer psychology
    getCustomerTriggers,
    getTransformations,
    getObjectionHandlers,

    // Campaign generation
    generateCampaignTemplate,

    // Actions
    loadProfile: loadProfileAction,
    searchProfiles: searchProfilesAction,
    refresh,
  };
}

export default useIndustryProfile;
