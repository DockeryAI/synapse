/**
 * V4 Intelligence Integration Service
 *
 * Wires existing intelligence services into V4 content generation:
 * - Website Analyzer: Brand voice, messaging from scraped website
 * - Perplexity/Trends: Real-time industry trends and news
 * - Competitor Intelligence: Differentiation insights
 * - Reddit/Social Listening: Customer language patterns
 * - Brand Kit: Voice, style, colors from brand settings
 * - User Preferences: Tone, history, performance data
 *
 * Created: 2025-11-27
 */

import { supabase } from '@/lib/supabase';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface IntelligenceContext {
  // Website Analysis
  websiteData?: {
    brandVoice: string;
    keyMessaging: string[];
    competitivePositioning: string;
    visualIdentityCues: string[];
    extractedProducts: string[];
  };

  // Real-time Trends
  trendData?: {
    currentTrends: string[];
    breakingNews: string[];
    seasonalOpportunities: string[];
    trendingHashtags: string[];
  };

  // Competitor Insights
  competitorData?: {
    topCompetitors: string[];
    messagingGaps: string[];
    differentiationAngles: string[];
    contentGaps: string[];
  };

  // Social Listening
  socialData?: {
    customerLanguage: string[];
    painPointsVerbatim: string[];
    trendingTopics: string[];
    sentimentThemes: string[];
  };

  // Brand Kit
  brandKit?: {
    voiceTone: string;
    styleGuidelines: string[];
    doNotUse: string[];
    preferredPhrases: string[];
  };

  // User Preferences
  userPreferences?: {
    preferredFrameworks: string[];
    avoidTopics: string[];
    tonePreference: string;
    pastTopPerformers: string[];
  };

  // Metadata
  fetchedAt: Date;
  completeness: number; // 0-100 percentage of data available
}

export interface ContentHistoryItem {
  id: string;
  headline: string;
  score: number;
  createdAt: Date;
  contentHash: string;
}

// ============================================================================
// CACHING
// ============================================================================

const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ============================================================================
// INTELLIGENCE INTEGRATION SERVICE
// ============================================================================

class IntelligenceIntegrationService {
  /**
   * Load all available intelligence data for a brand
   */
  async loadIntelligenceContext(
    brandId: string,
    uvp: CompleteUVP
  ): Promise<IntelligenceContext> {
    console.log('[V4 Intelligence] Loading intelligence context...');

    const cacheKey = `intel-${brandId}`;
    const cached = getCached<IntelligenceContext>(cacheKey);
    if (cached) {
      console.log('[V4 Intelligence] Returning cached context');
      return cached;
    }

    // Load all data sources in parallel for speed
    const [
      websiteData,
      trendData,
      competitorData,
      socialData,
      brandKit,
      userPreferences
    ] = await Promise.all([
      this.loadWebsiteData(brandId),
      this.loadTrendData(uvp.targetCustomer?.industry),
      this.loadCompetitorData(brandId),
      this.loadSocialData(uvp.targetCustomer?.industry),
      this.loadBrandKit(brandId),
      this.loadUserPreferences(brandId)
    ]);

    // Calculate completeness
    const sources = [websiteData, trendData, competitorData, socialData, brandKit, userPreferences];
    const availableSources = sources.filter(s => s !== undefined).length;
    const completeness = Math.round((availableSources / sources.length) * 100);

    const context: IntelligenceContext = {
      websiteData,
      trendData,
      competitorData,
      socialData,
      brandKit,
      userPreferences,
      fetchedAt: new Date(),
      completeness
    };

    setCache(cacheKey, context);
    console.log(`[V4 Intelligence] Context loaded (${completeness}% complete)`);

    return context;
  }

  /**
   * Load website analysis data from onboarding
   */
  private async loadWebsiteData(brandId: string): Promise<IntelligenceContext['websiteData'] | undefined> {
    try {
      // Check for website analysis in brand data
      const { data: brand } = await supabase
        .from('brands')
        .select('website_url, metadata')
        .eq('id', brandId)
        .maybeSingle();

      if (!brand?.metadata?.websiteAnalysis) {
        // Try to load from intelligence_cache
        const { data: cached } = await supabase
          .from('intelligence_cache')
          .select('data')
          .eq('brand_id', brandId)
          .eq('type', 'website_analysis')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cached?.data) {
          return {
            brandVoice: cached.data.tone || 'professional',
            keyMessaging: cached.data.keyMessages || [],
            competitivePositioning: cached.data.positioning || '',
            visualIdentityCues: cached.data.visualCues || [],
            extractedProducts: cached.data.products || []
          };
        }

        return undefined;
      }

      const analysis = brand.metadata.websiteAnalysis;
      return {
        brandVoice: analysis.tone || 'professional',
        keyMessaging: analysis.keyMessages || [],
        competitivePositioning: analysis.positioning || '',
        visualIdentityCues: analysis.visualCues || [],
        extractedProducts: analysis.products || []
      };
    } catch (error) {
      console.warn('[V4 Intelligence] Website data load failed:', error);
      return undefined;
    }
  }

  /**
   * Load real-time trend data via Perplexity
   */
  private async loadTrendData(industry?: string): Promise<IntelligenceContext['trendData'] | undefined> {
    if (!industry) return undefined;

    try {
      // Check for recent trend cache using correct schema
      const { data: cached } = await supabase
        .from('intelligence_cache')
        .select('data')
        .eq('data_type', 'trend_data')
        .ilike('cache_key', `%${industry}%`)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached?.data) {
        return {
          currentTrends: cached.data.trends || [],
          breakingNews: cached.data.news || [],
          seasonalOpportunities: cached.data.seasonal || [],
          trendingHashtags: cached.data.hashtags || []
        };
      }

      // If no cached data, return basic seasonal triggers
      const month = new Date().getMonth();
      const seasonalOpportunities = this.getSeasonalOpportunities(month, industry);

      return {
        currentTrends: [],
        breakingNews: [],
        seasonalOpportunities,
        trendingHashtags: []
      };
    } catch (error) {
      console.warn('[V4 Intelligence] Trend data load failed:', error);
      // Return seasonal data even on error
      const month = new Date().getMonth();
      return {
        currentTrends: [],
        breakingNews: [],
        seasonalOpportunities: this.getSeasonalOpportunities(month, industry),
        trendingHashtags: []
      };
    }
  }

  /**
   * Load competitor intelligence
   */
  private async loadCompetitorData(brandId: string): Promise<IntelligenceContext['competitorData'] | undefined> {
    try {
      const { data: cached } = await supabase
        .from('intelligence_cache')
        .select('data')
        .eq('brand_id', brandId)
        .eq('data_type', 'competitor_profile')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached?.data) {
        return {
          topCompetitors: cached.data.competitors || [],
          messagingGaps: cached.data.gaps || [],
          differentiationAngles: cached.data.differentiation || [],
          contentGaps: cached.data.contentGaps || []
        };
      }

      return undefined;
    } catch (error) {
      console.warn('[V4 Intelligence] Competitor data load failed:', error);
      return undefined;
    }
  }

  /**
   * Load social listening data (Reddit, etc.)
   */
  private async loadSocialData(industry?: string): Promise<IntelligenceContext['socialData'] | undefined> {
    if (!industry) return undefined;

    try {
      const { data: cached } = await supabase
        .from('intelligence_cache')
        .select('data')
        .eq('data_type', 'social_listening')
        .ilike('cache_key', `%${industry}%`)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached?.data) {
        return {
          customerLanguage: cached.data.language || [],
          painPointsVerbatim: cached.data.painPoints || [],
          trendingTopics: cached.data.topics || [],
          sentimentThemes: cached.data.sentiment || []
        };
      }

      return undefined;
    } catch (error) {
      console.warn('[V4 Intelligence] Social data load failed:', error);
      return undefined;
    }
  }

  /**
   * Load brand kit settings
   */
  private async loadBrandKit(brandId: string): Promise<IntelligenceContext['brandKit'] | undefined> {
    try {
      // Load from brand_kits table (correct table name with 's')
      const { data: kit } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('brand_id', brandId)
        .maybeSingle();

      if (kit) {
        return {
          voiceTone: kit.tone || kit.style || 'professional',
          styleGuidelines: [kit.style, kit.font_family].filter(Boolean),
          doNotUse: [],
          preferredPhrases: []
        };
      }

      // Fallback: check brands table for brand_voice
      const { data: brand } = await supabase
        .from('brands')
        .select('name, industry')
        .eq('id', brandId)
        .maybeSingle();

      if (brand) {
        return {
          voiceTone: 'professional',
          styleGuidelines: [],
          doNotUse: [],
          preferredPhrases: []
        };
      }

      return undefined;
    } catch (error) {
      console.warn('[V4 Intelligence] Brand kit load failed:', error);
      return undefined;
    }
  }

  /**
   * Load user preferences and history
   */
  private async loadUserPreferences(brandId: string): Promise<IntelligenceContext['userPreferences'] | undefined> {
    try {
      // Load content history to find top performers
      const { data: history } = await supabase
        .from('content_calendar_items')
        .select('title, ai_score, metadata')
        .eq('brand_id', brandId)
        .not('ai_score', 'is', null)
        .order('ai_score', { ascending: false })
        .limit(10);

      const topPerformers = history?.map(h => h.title).filter(Boolean) || [];

      // Load framework usage history from V4 content
      const { data: v4Content } = await supabase
        .from('v4_generated_content')
        .select('psychology_framework')
        .eq('brand_id', brandId)
        .order('score_total', { ascending: false })
        .limit(20);

      const frameworkCounts: Record<string, number> = {};
      v4Content?.forEach(c => {
        if (c.psychology_framework) {
          frameworkCounts[c.psychology_framework] = (frameworkCounts[c.psychology_framework] || 0) + 1;
        }
      });

      const preferredFrameworks = Object.entries(frameworkCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([framework]) => framework);

      return {
        preferredFrameworks,
        avoidTopics: [], // Could be loaded from user settings
        tonePreference: 'professional', // Could be loaded from user settings
        pastTopPerformers: topPerformers
      };
    } catch (error) {
      console.warn('[V4 Intelligence] User preferences load failed:', error);
      return undefined;
    }
  }

  /**
   * Build prompt enhancement from intelligence context
   */
  buildPromptEnhancement(context: IntelligenceContext): string {
    const sections: string[] = [];

    // Website/Brand Voice
    if (context.websiteData) {
      sections.push(`
BRAND VOICE & MESSAGING:
- Brand Voice: ${context.websiteData.brandVoice}
- Key Messages: ${context.websiteData.keyMessaging.slice(0, 3).join('; ')}
- Positioning: ${context.websiteData.competitivePositioning || 'Not specified'}`);
    }

    // Brand Kit
    if (context.brandKit) {
      sections.push(`
BRAND GUIDELINES:
- Tone: ${context.brandKit.voiceTone}
- Style: ${context.brandKit.styleGuidelines.slice(0, 3).join(', ')}
- AVOID using: ${context.brandKit.doNotUse.slice(0, 5).join(', ') || 'None specified'}`);
    }

    // Trends
    if (context.trendData && context.trendData.currentTrends.length > 0) {
      sections.push(`
CURRENT TRENDS (use if relevant):
- ${context.trendData.currentTrends.slice(0, 3).join('\n- ')}
- Seasonal opportunities: ${context.trendData.seasonalOpportunities.slice(0, 2).join(', ')}`);
    }

    // Competitor Differentiation
    if (context.competitorData) {
      sections.push(`
DIFFERENTIATION (stand out by):
- ${context.competitorData.differentiationAngles.slice(0, 3).join('\n- ') || 'Focus on unique value proposition'}`);
    }

    // Customer Language
    if (context.socialData && context.socialData.customerLanguage.length > 0) {
      sections.push(`
CUSTOMER LANGUAGE (use their words):
- Pain points: "${context.socialData.painPointsVerbatim.slice(0, 2).join('", "')}"
- Topics they discuss: ${context.socialData.trendingTopics.slice(0, 3).join(', ')}`);
    }

    // User Preferences
    if (context.userPreferences) {
      if (context.userPreferences.preferredFrameworks.length > 0) {
        sections.push(`
PREFERENCES:
- Top performing frameworks: ${context.userPreferences.preferredFrameworks.join(', ')}`);
      }
    }

    if (sections.length === 0) {
      return '';
    }

    return '\n\n=== INTELLIGENCE CONTEXT ===' + sections.join('\n');
  }

  /**
   * Check for duplicate content
   */
  async checkDuplication(
    brandId: string,
    content: { headline: string; hook: string; body: string }
  ): Promise<{ isDuplicate: boolean; similarContent?: ContentHistoryItem }> {
    const contentHash = this.hashContent(content);

    try {
      // Check for exact hash match
      const { data: exact } = await supabase
        .from('v4_generated_content')
        .select('id, headline, score_total, created_at')
        .eq('brand_id', brandId)
        .eq('content_hash', contentHash)
        .limit(1)
        .maybeSingle();

      if (exact) {
        return {
          isDuplicate: true,
          similarContent: {
            id: exact.id,
            headline: exact.headline,
            score: exact.score_total,
            createdAt: new Date(exact.created_at),
            contentHash
          }
        };
      }

      // Check for similar headlines (fuzzy match)
      const { data: similar } = await supabase
        .from('v4_generated_content')
        .select('id, headline, score_total, created_at')
        .eq('brand_id', brandId)
        .ilike('headline', `%${content.headline.substring(0, 30)}%`)
        .limit(1);

      if (similar && similar.length > 0) {
        return {
          isDuplicate: true,
          similarContent: {
            id: similar[0].id,
            headline: similar[0].headline,
            score: similar[0].score_total,
            createdAt: new Date(similar[0].created_at),
            contentHash: ''
          }
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.warn('[V4 Intelligence] Deduplication check failed:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Hash content for deduplication
   */
  private hashContent(content: { headline: string; hook: string; body: string }): string {
    const combined = `${content.headline}|${content.hook}|${content.body}`.toLowerCase();
    // Simple hash for deduplication
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Get seasonal opportunities based on month and industry
   */
  private getSeasonalOpportunities(month: number, industry: string): string[] {
    const generalSeasons: Record<number, string[]> = {
      0: ['New Year goals', 'Fresh start', 'Planning season'],
      1: ['Valentine\'s Day', 'Love/relationships themes'],
      2: ['Spring renewal', 'Tax season', 'March Madness'],
      3: ['Spring cleaning', 'Easter', 'New beginnings'],
      4: ['Mother\'s Day', 'Memorial Day', 'Summer prep'],
      5: ['Father\'s Day', 'Summer kickoff', 'Graduation'],
      6: ['Summer peak', 'Independence Day', 'Vacation mode'],
      7: ['Back to school prep', 'Late summer'],
      8: ['Back to school', 'Labor Day', 'Fall planning'],
      9: ['Halloween', 'Q4 planning', 'Fall themes'],
      10: ['Thanksgiving', 'Black Friday', 'Gratitude themes'],
      11: ['Holiday season', 'Year-end', 'Gift guides']
    };

    return generalSeasons[month] || [];
  }

  /**
   * Clear cache for a brand
   */
  clearCache(brandId: string): void {
    cache.delete(`intel-${brandId}`);
    console.log(`[V4 Intelligence] Cache cleared for brand ${brandId}`);
  }
}

// Export singleton instance
export const intelligenceIntegration = new IntelligenceIntegrationService();
export default intelligenceIntegration;
