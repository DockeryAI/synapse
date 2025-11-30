/**
 * Ad Library Service
 *
 * Fetches competitor ads from Meta Ad Library and LinkedIn Ad Library.
 * Part of Gap Tab 2.0 - Phase 2 (Reviews & Ads)
 *
 * Sources:
 * - Meta Ad Library API (Facebook/Instagram ads)
 * - LinkedIn Ad Library (via web scraping/Perplexity)
 *
 * Created: 2025-11-28 (Day 2)
 */

import type {
  CompetitorProfile,
  CompetitorAd,
  AdPlatform,
  CreativeType,
  BusinessType
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

export interface AdFetchResult {
  platform: AdPlatform;
  competitor_id: string;
  competitor_name: string;
  ads: FetchedAd[];
  analysis: AdAnalysis;
  error?: string;
  fetch_time_ms: number;
}

export interface FetchedAd {
  id: string;
  platform: AdPlatform;
  headline: string | null;
  body_text: string | null;
  cta_text: string | null;
  creative_type: CreativeType | null;
  creative_url: string | null;
  landing_page_url: string | null;
  first_seen: string | null;
  last_seen: string | null;
  is_active: boolean;
  spend_estimate?: string;
  impressions_estimate?: string;
  target_demographics?: string[];
  raw_data?: unknown;
}

export interface AdAnalysis {
  total_ads: number;
  active_ads: number;
  messaging_themes: string[];
  emotional_appeals: string[];
  cta_patterns: string[];
  target_audience_signals: string[];
  creative_formats: Record<CreativeType, number>;
  activity_trend: 'increasing' | 'stable' | 'decreasing' | 'unknown';
  top_performing_hooks: string[];
}

export interface AdLibraryConfig {
  max_ads_per_platform: number;
  lookback_days: number;
  analyze_creatives: boolean;
  include_inactive: boolean;
}

// ============================================================================
// AD ANALYSIS PROMPTS
// ============================================================================

const AD_ANALYSIS_PROMPT = `Analyze these competitor ads and extract key intelligence:

Competitor: {competitor_name}
Ads Data:
{ads_data}

Provide a structured analysis:

1. **Messaging Themes**: What key messages/themes appear across their ads?
2. **Emotional Appeals**: What emotions are they targeting? (fear, aspiration, urgency, etc.)
3. **CTA Patterns**: What calls-to-action do they use?
4. **Target Audience Signals**: Who are they targeting? (job titles, interests, demographics)
5. **Top Performing Hooks**: What opening lines/headlines seem designed to grab attention?
6. **Positioning**: How are they positioning themselves?
7. **Weaknesses**: What gaps or weaknesses can you infer from their ad strategy?

Return as JSON:
{
  "messaging_themes": ["theme1", "theme2"],
  "emotional_appeals": ["emotion1", "emotion2"],
  "cta_patterns": ["cta1", "cta2"],
  "target_audience_signals": ["signal1", "signal2"],
  "top_performing_hooks": ["hook1", "hook2"],
  "positioning_summary": "Their overall positioning...",
  "identified_weaknesses": ["weakness1", "weakness2"]
}`;

const META_AD_DISCOVERY_PROMPT = `Search for Meta (Facebook/Instagram) ads from "{competitor_name}".

Use the Meta Ad Library (https://www.facebook.com/ads/library/) to find their active and recent ads.

For each ad found, extract:
1. The ad headline or primary text
2. The body copy/description
3. The call-to-action button text
4. The landing page URL
5. When the ad was first seen
6. Whether it's currently active
7. The creative format (image, video, carousel)

Return as JSON array:
[
  {
    "headline": "headline text",
    "body_text": "body copy",
    "cta_text": "Learn More",
    "landing_page_url": "https://...",
    "first_seen": "2025-01-01",
    "is_active": true,
    "creative_type": "image"
  }
]

Maximum 10 ads. Focus on the most recent and active ads.`;

const LINKEDIN_AD_DISCOVERY_PROMPT = `Search for LinkedIn ads from "{competitor_name}".

Look for their sponsored content, sponsored InMail campaigns, and display ads.

For each ad found, extract:
1. The ad headline
2. The body text
3. The call-to-action
4. The target audience signals (if visible)
5. The creative format
6. When it was seen

Return as JSON array:
[
  {
    "headline": "headline text",
    "body_text": "body copy",
    "cta_text": "Learn More",
    "target_signals": ["Marketing Managers", "SaaS"],
    "creative_type": "sponsored_content",
    "seen_date": "2025-01"
  }
]

Maximum 10 ads.`;

// ============================================================================
// AD LIBRARY SERVICE
// ============================================================================

class AdLibraryService {
  private config: AdLibraryConfig = {
    max_ads_per_platform: 20,
    lookback_days: 30,
    analyze_creatives: true,
    include_inactive: true
  };

  /**
   * Configure the service
   */
  configure(config: Partial<AdLibraryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get appropriate ad platforms for a business type
   */
  getPlatformsForBusinessType(businessType: BusinessType): AdPlatform[] {
    switch (businessType) {
      case 'b2b':
        return ['linkedin', 'meta']; // LinkedIn primary
      case 'dtc':
        return ['meta', 'google', 'tiktok']; // Meta primary
      case 'b2c':
        return ['meta', 'google']; // Meta primary
      default:
        return ['meta', 'linkedin']; // Both
    }
  }

  /**
   * Fetch ads from all appropriate platforms for a competitor
   */
  async fetchAds(competitor: CompetitorProfile): Promise<AdFetchResult[]> {
    const platforms = this.getPlatformsForBusinessType(
      competitor.business_type || 'mixed'
    );
    const results: AdFetchResult[] = [];

    console.log(`[AdLibrary] Fetching ads for ${competitor.name} from ${platforms.join(', ')}`);

    // Fetch from each platform in parallel
    const fetchPromises = platforms.map(platform =>
      this.fetchFromPlatform(competitor, platform)
    );

    const fetchResults = await Promise.allSettled(fetchPromises);

    for (const result of fetchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }

    return results;
  }

  /**
   * Fetch ads from a specific platform
   */
  private async fetchFromPlatform(
    competitor: CompetitorProfile,
    platform: AdPlatform
  ): Promise<AdFetchResult | null> {
    const startTime = Date.now();

    try {
      let ads: FetchedAd[] = [];

      switch (platform) {
        case 'meta':
          ads = await this.fetchMetaAds(competitor);
          break;

        case 'linkedin':
          ads = await this.fetchLinkedInAds(competitor);
          break;

        case 'google':
          ads = await this.fetchGoogleAds(competitor);
          break;

        case 'tiktok':
          ads = await this.fetchTikTokAds(competitor);
          break;

        default:
          console.warn(`[AdLibrary] Unknown platform: ${platform}`);
          return null;
      }

      // Analyze ads if we have enough data
      let analysis: AdAnalysis = this.emptyAnalysis();
      if (ads.length > 0 && this.config.analyze_creatives) {
        analysis = await this.analyzeAds(competitor.name, ads);
      }

      return {
        platform,
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        ads,
        analysis,
        fetch_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error(`[AdLibrary] Error fetching from ${platform}:`, error);
      return {
        platform,
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        ads: [],
        analysis: this.emptyAnalysis(),
        error: error instanceof Error ? error.message : 'Fetch failed',
        fetch_time_ms: Date.now() - startTime
      };
    }
  }

  // ==========================================================================
  // PLATFORM-SPECIFIC FETCHERS
  // ==========================================================================

  /**
   * Fetch Meta (Facebook/Instagram) ads via Perplexity
   * Note: Meta Ad Library API requires business verification.
   * We use Perplexity to search the public Ad Library.
   */
  private async fetchMetaAds(competitor: CompetitorProfile): Promise<FetchedAd[]> {
    const prompt = META_AD_DISCOVERY_PROMPT.replace('{competitor_name}', competitor.name);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are an ad intelligence analyst. Search the Meta Ad Library and extract competitor ad data. Return valid JSON only.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 2500
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      let ads: any[] = [];
      try {
        ads = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ads = JSON.parse(jsonMatch[0]);
        }
      }

      return ads.map((ad, index) => ({
        id: `meta-${competitor.id}-${index}`,
        platform: 'meta' as AdPlatform,
        headline: ad.headline || null,
        body_text: ad.body_text || ad.body || null,
        cta_text: ad.cta_text || ad.cta || null,
        creative_type: this.normalizeCreativeType(ad.creative_type),
        creative_url: ad.creative_url || null,
        landing_page_url: ad.landing_page_url || ad.landing_url || null,
        first_seen: ad.first_seen || null,
        last_seen: ad.last_seen || null,
        is_active: ad.is_active ?? true,
        target_demographics: ad.target_demographics || [],
        raw_data: ad
      }));

    } catch (error) {
      console.error('[AdLibrary] Meta fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch LinkedIn ads via Perplexity
   */
  private async fetchLinkedInAds(competitor: CompetitorProfile): Promise<FetchedAd[]> {
    const prompt = LINKEDIN_AD_DISCOVERY_PROMPT.replace('{competitor_name}', competitor.name);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are an ad intelligence analyst. Search for LinkedIn ads and sponsored content. Return valid JSON only.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 2500
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      let ads: any[] = [];
      try {
        ads = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ads = JSON.parse(jsonMatch[0]);
        }
      }

      return ads.map((ad, index) => ({
        id: `linkedin-${competitor.id}-${index}`,
        platform: 'linkedin' as AdPlatform,
        headline: ad.headline || null,
        body_text: ad.body_text || ad.body || null,
        cta_text: ad.cta_text || ad.cta || null,
        creative_type: this.normalizeCreativeType(ad.creative_type),
        creative_url: null,
        landing_page_url: ad.landing_page_url || null,
        first_seen: ad.seen_date || ad.first_seen || null,
        last_seen: null,
        is_active: true,
        target_demographics: ad.target_signals || ad.target_demographics || [],
        raw_data: ad
      }));

    } catch (error) {
      console.error('[AdLibrary] LinkedIn fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch Google Ads via Perplexity (Google Ads Transparency Center)
   */
  private async fetchGoogleAds(competitor: CompetitorProfile): Promise<FetchedAd[]> {
    const prompt = `Search the Google Ads Transparency Center for ads from "${competitor.name}".

For each ad found, extract:
1. Headline
2. Description text
3. Call-to-action
4. Ad format (search, display, video)
5. When it was seen

Return as JSON array with maximum 10 ads.`;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are an ad intelligence analyst. Return valid JSON only.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      let ads: any[] = [];
      try {
        ads = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ads = JSON.parse(jsonMatch[0]);
        }
      }

      return ads.map((ad, index) => ({
        id: `google-${competitor.id}-${index}`,
        platform: 'google' as AdPlatform,
        headline: ad.headline || null,
        body_text: ad.description || ad.body_text || null,
        cta_text: ad.cta || null,
        creative_type: this.normalizeCreativeType(ad.format || ad.creative_type),
        creative_url: null,
        landing_page_url: ad.landing_url || null,
        first_seen: ad.seen_date || null,
        last_seen: null,
        is_active: true,
        raw_data: ad
      }));

    } catch (error) {
      console.error('[AdLibrary] Google fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch TikTok ads via Perplexity (TikTok Creative Center)
   */
  private async fetchTikTokAds(competitor: CompetitorProfile): Promise<FetchedAd[]> {
    const prompt = `Search for TikTok ads and sponsored content from "${competitor.name}".

Look at the TikTok Creative Center and search for their ad campaigns.

For each ad found, extract:
1. The hook/opening text
2. The main message
3. Call-to-action
4. Video duration if applicable
5. When it was seen

Return as JSON array with maximum 10 ads.`;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are an ad intelligence analyst. Return valid JSON only.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      let ads: any[] = [];
      try {
        ads = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ads = JSON.parse(jsonMatch[0]);
        }
      }

      return ads.map((ad, index) => ({
        id: `tiktok-${competitor.id}-${index}`,
        platform: 'tiktok' as AdPlatform,
        headline: ad.hook || ad.headline || null,
        body_text: ad.message || ad.body_text || null,
        cta_text: ad.cta || null,
        creative_type: 'video' as CreativeType,
        creative_url: null,
        landing_page_url: null,
        first_seen: ad.seen_date || null,
        last_seen: null,
        is_active: true,
        raw_data: ad
      }));

    } catch (error) {
      console.error('[AdLibrary] TikTok fetch error:', error);
      return [];
    }
  }

  // ==========================================================================
  // AD ANALYSIS
  // ==========================================================================

  /**
   * Analyze competitor ads using Opus 4.5
   */
  async analyzeAds(competitorName: string, ads: FetchedAd[]): Promise<AdAnalysis> {
    if (ads.length === 0) {
      return this.emptyAnalysis();
    }

    // Prepare ads data for analysis
    const adsData = ads.map(ad => ({
      headline: ad.headline,
      body: ad.body_text,
      cta: ad.cta_text,
      format: ad.creative_type,
      landing_page: ad.landing_page_url
    }));

    const prompt = AD_ANALYSIS_PROMPT
      .replace('{competitor_name}', competitorName)
      .replace('{ads_data}', JSON.stringify(adsData, null, 2));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-opus-4',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive ad intelligence analyst. Analyze competitor advertising strategy and extract actionable insights. Return valid JSON only.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        console.error('[AdLibrary] Analysis API error:', response.status);
        return this.basicAnalysis(ads);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';

      let analysis: any = {};
      try {
        analysis = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      }

      // Build creative format counts
      const creativeFormats: Record<CreativeType, number> = {
        image: 0,
        video: 0,
        carousel: 0,
        text: 0
      };
      for (const ad of ads) {
        if (ad.creative_type) {
          creativeFormats[ad.creative_type]++;
        }
      }

      return {
        total_ads: ads.length,
        active_ads: ads.filter(a => a.is_active).length,
        messaging_themes: analysis.messaging_themes || [],
        emotional_appeals: analysis.emotional_appeals || [],
        cta_patterns: analysis.cta_patterns || [],
        target_audience_signals: analysis.target_audience_signals || [],
        creative_formats: creativeFormats,
        activity_trend: this.detectActivityTrend(ads),
        top_performing_hooks: analysis.top_performing_hooks || []
      };

    } catch (error) {
      console.error('[AdLibrary] Analysis error:', error);
      return this.basicAnalysis(ads);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Normalize creative type from various input formats
   */
  private normalizeCreativeType(type: string | null | undefined): CreativeType | null {
    if (!type) return null;

    const typeLower = type.toLowerCase();

    if (typeLower.includes('video')) return 'video';
    if (typeLower.includes('carousel')) return 'carousel';
    if (typeLower.includes('image') || typeLower.includes('photo')) return 'image';
    if (typeLower.includes('text') || typeLower.includes('search')) return 'text';

    return 'image'; // Default to image
  }

  /**
   * Detect activity trend from ad dates
   */
  private detectActivityTrend(ads: FetchedAd[]): 'increasing' | 'stable' | 'decreasing' | 'unknown' {
    const adsWithDates = ads.filter(a => a.first_seen);
    if (adsWithDates.length < 3) return 'unknown';

    // Sort by date
    const sorted = adsWithDates.sort((a, b) => {
      const dateA = new Date(a.first_seen!).getTime();
      const dateB = new Date(b.first_seen!).getTime();
      return dateB - dateA;
    });

    // Count recent vs older ads
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const recentCount = sorted.filter(a =>
      new Date(a.first_seen!).getTime() > thirtyDaysAgo
    ).length;

    const olderCount = sorted.filter(a => {
      const time = new Date(a.first_seen!).getTime();
      return time > sixtyDaysAgo && time <= thirtyDaysAgo;
    }).length;

    if (recentCount > olderCount * 1.5) return 'increasing';
    if (olderCount > recentCount * 1.5) return 'decreasing';
    return 'stable';
  }

  /**
   * Basic analysis without AI
   */
  private basicAnalysis(ads: FetchedAd[]): AdAnalysis {
    const creativeFormats: Record<CreativeType, number> = {
      image: 0,
      video: 0,
      carousel: 0,
      text: 0
    };

    for (const ad of ads) {
      if (ad.creative_type) {
        creativeFormats[ad.creative_type]++;
      }
    }

    // Extract CTAs
    const ctaPatterns = ads
      .filter(a => a.cta_text)
      .map(a => a.cta_text!)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    return {
      total_ads: ads.length,
      active_ads: ads.filter(a => a.is_active).length,
      messaging_themes: [],
      emotional_appeals: [],
      cta_patterns: ctaPatterns,
      target_audience_signals: [],
      creative_formats: creativeFormats,
      activity_trend: this.detectActivityTrend(ads),
      top_performing_hooks: []
    };
  }

  /**
   * Empty analysis helper
   */
  private emptyAnalysis(): AdAnalysis {
    return {
      total_ads: 0,
      active_ads: 0,
      messaging_themes: [],
      emotional_appeals: [],
      cta_patterns: [],
      target_audience_signals: [],
      creative_formats: { image: 0, video: 0, carousel: 0, text: 0 },
      activity_trend: 'unknown',
      top_performing_hooks: []
    };
  }

  // ==========================================================================
  // DATABASE OPERATIONS
  // ==========================================================================

  /**
   * Save fetched ads to database
   */
  async saveAds(
    brand_id: string,
    competitor_id: string,
    ads: FetchedAd[]
  ): Promise<CompetitorAd[]> {
    const { supabase } = await import('@/utils/supabase/client');
    const savedAds: CompetitorAd[] = [];

    for (const ad of ads) {
      const { data, error } = await supabase
        .from('competitor_ads')
        .upsert({
          competitor_id,
          brand_id,
          platform: ad.platform,
          ad_id: ad.id,
          headline: ad.headline,
          body_text: ad.body_text,
          cta_text: ad.cta_text,
          creative_type: ad.creative_type,
          creative_url: ad.creative_url,
          landing_page_url: ad.landing_page_url,
          messaging_themes: [],
          target_audience_signals: {},
          emotional_appeals: [],
          first_seen_at: ad.first_seen,
          last_seen_at: ad.last_seen,
          is_active: ad.is_active,
          raw_data: ad.raw_data || {}
        }, {
          onConflict: 'competitor_id,platform,ad_id'
        })
        .select()
        .single();

      if (data && !error) {
        savedAds.push(data as unknown as CompetitorAd);
      }
    }

    return savedAds;
  }

  /**
   * Get ads for a competitor from database
   */
  async getAds(competitor_id: string, platform?: AdPlatform): Promise<CompetitorAd[]> {
    const { supabase } = await import('@/utils/supabase/client');

    let query = supabase
      .from('competitor_ads')
      .select('*')
      .eq('competitor_id', competitor_id);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('first_seen_at', { ascending: false });

    if (error) {
      console.error('[AdLibrary] Failed to get ads:', error);
      return [];
    }

    return (data || []) as unknown as CompetitorAd[];
  }
}

// Export singleton
export const adLibrary = new AdLibraryService();
export default adLibrary;
