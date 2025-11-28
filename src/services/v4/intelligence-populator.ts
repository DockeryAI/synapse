/**
 * V4 Intelligence Populator Service
 *
 * Populates the intelligence_cache table with data from various sources:
 * - Perplexity API for trends
 * - Reddit/Social listening
 * - Competitor analysis
 * - Website analysis
 *
 * Created: 2025-11-27
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface PopulateOptions {
  brandId: string;
  industry?: string;
  forceRefresh?: boolean;
}

interface PopulateResult {
  success: boolean;
  populated: string[];
  failed: string[];
  errors: { source: string; error: string }[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cache TTLs in hours
const CACHE_TTL = {
  trend_data: 1,           // 1 hour for trends
  competitor_profile: 168, // 7 days for competitor profiles
  social_listening: 24,    // 24 hours for social data
  website_analysis: 168    // 7 days for website analysis
};

// API Configuration
const API_TIMEOUT_MS = 30000;  // 30 second timeout for Perplexity API calls
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;  // 1 second base delay (exponential backoff)

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort (timeout) - that's intentional
      if (lastError.name === 'AbortError') {
        throw new Error(`Request timed out after ${API_TIMEOUT_MS}ms`);
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[V4 IntelligencePopulator] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

// ============================================================================
// INTELLIGENCE POPULATOR SERVICE
// ============================================================================

class IntelligencePopulatorService {
  /**
   * Populate all intelligence sources for a brand
   */
  async populateAll(options: PopulateOptions): Promise<PopulateResult> {
    console.log(`[V4 IntelligencePopulator] Populating intelligence for brand ${options.brandId}...`);

    const populated: string[] = [];
    const failed: string[] = [];
    const errors: { source: string; error: string }[] = [];

    // If no industry provided, fetch from brand table
    let effectiveOptions = { ...options };
    if (!effectiveOptions.industry) {
      try {
        const { data: brand } = await supabase
          .from('brands')
          .select('industry')
          .eq('id', options.brandId)
          .maybeSingle();

        if (brand?.industry) {
          effectiveOptions.industry = brand.industry;
          console.log(`[V4 IntelligencePopulator] Fetched industry from brand: ${brand.industry}`);
        }
      } catch (err) {
        console.warn('[V4 IntelligencePopulator] Could not fetch brand industry:', err);
      }
    }

    // Populate in parallel for speed
    const results = await Promise.allSettled([
      this.populateTrends(effectiveOptions),
      this.populateCompetitors(effectiveOptions),
      this.populateSocialListening(effectiveOptions)
    ]);

    // Process results
    const sources = ['trends', 'competitors', 'social'];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        populated.push(sources[index]);
      } else {
        failed.push(sources[index]);
        if (result.status === 'rejected') {
          errors.push({ source: sources[index], error: result.reason?.message || 'Unknown error' });
        }
      }
    });

    console.log(`[V4 IntelligencePopulator] Complete: ${populated.length} populated, ${failed.length} failed`);

    return {
      success: failed.length === 0,
      populated,
      failed,
      errors
    };
  }

  /**
   * Populate trend data via Perplexity API
   */
  async populateTrends(options: PopulateOptions): Promise<boolean> {
    if (!options.industry) {
      console.warn('[V4 IntelligencePopulator] No industry provided for trends');
      return false;
    }

    const cacheKey = `trends:${options.industry}`;

    // Check if fresh cache exists
    if (!options.forceRefresh) {
      const existing = await this.checkCache(cacheKey, 'trend_data');
      if (existing) {
        console.log('[V4 IntelligencePopulator] Using cached trend data');
        return true;
      }
    }

    try {
      // Call Perplexity via edge function with timeout and retry
      const data = await withRetry(async () => {
        const response = await fetchWithTimeout(
          `${SUPABASE_URL}/functions/v1/perplexity-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              query: `What are the top 5 current trends in the ${options.industry} industry? Include any breaking news, seasonal opportunities, and trending hashtags. Format as JSON with keys: trends (array), news (array), seasonal (array), hashtags (array).`,
              format: 'json'
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Perplexity API failed: ${response.status}`);
        }

        return response.json();
      });

      // Parse and store
      const trendData = this.parseTrendResponse(data);
      await this.saveToCache(cacheKey, 'trend_data', trendData, options.brandId);

      console.log('[V4 IntelligencePopulator] Trend data populated');
      return true;

    } catch (error) {
      console.error('[V4 IntelligencePopulator] Trend population failed after retries:', error);
      return false;
    }
  }

  /**
   * Populate competitor intelligence
   */
  async populateCompetitors(options: PopulateOptions): Promise<boolean> {
    const cacheKey = `competitors:${options.brandId}`;

    // Check if fresh cache exists
    if (!options.forceRefresh) {
      const existing = await this.checkCache(cacheKey, 'competitor_profile');
      if (existing) {
        console.log('[V4 IntelligencePopulator] Using cached competitor data');
        return true;
      }
    }

    try {
      // Get brand info first (use correct column names: website, not website_url)
      const { data: brand } = await supabase
        .from('brands')
        .select('name, industry, website')
        .eq('id', options.brandId)
        .maybeSingle();

      if (!brand) {
        throw new Error('Brand not found');
      }

      // Call Perplexity for competitor analysis with timeout and retry
      const data = await withRetry(async () => {
        const response = await fetchWithTimeout(
          `${SUPABASE_URL}/functions/v1/perplexity-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              query: `Analyze competitors for a ${brand.industry || 'business'} company named "${brand.name}". Identify top 5 competitors, messaging gaps, differentiation angles, and content gaps. Format as JSON with keys: competitors (array), gaps (array), differentiation (array), contentGaps (array).`,
              format: 'json'
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Perplexity API failed: ${response.status}`);
        }

        return response.json();
      });

      // Parse and store
      const competitorData = this.parseCompetitorResponse(data);
      await this.saveToCache(cacheKey, 'competitor_profile', competitorData, options.brandId);

      console.log('[V4 IntelligencePopulator] Competitor data populated');
      return true;

    } catch (error) {
      console.error('[V4 IntelligencePopulator] Competitor population failed after retries:', error);
      return false;
    }
  }

  /**
   * Populate social listening data
   */
  async populateSocialListening(options: PopulateOptions): Promise<boolean> {
    if (!options.industry) {
      console.warn('[V4 IntelligencePopulator] No industry provided for social listening');
      return false;
    }

    const cacheKey = `social:${options.industry}`;

    // Check if fresh cache exists
    if (!options.forceRefresh) {
      const existing = await this.checkCache(cacheKey, 'social_listening');
      if (existing) {
        console.log('[V4 IntelligencePopulator] Using cached social data');
        return true;
      }
    }

    try {
      // Call Perplexity for social listening insights with timeout and retry
      const data = await withRetry(async () => {
        const response = await fetchWithTimeout(
          `${SUPABASE_URL}/functions/v1/perplexity-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              query: `What are people saying about ${options.industry} on Reddit and social media? Identify common customer language, verbatim pain points, trending discussion topics, and sentiment themes. Format as JSON with keys: language (array of phrases), painPoints (array of quotes), topics (array), sentiment (array of themes).`,
              format: 'json'
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Perplexity API failed: ${response.status}`);
        }

        return response.json();
      });

      // Parse and store
      const socialData = this.parseSocialResponse(data);
      await this.saveToCache(cacheKey, 'social_listening', socialData, options.brandId);

      console.log('[V4 IntelligencePopulator] Social data populated');
      return true;

    } catch (error) {
      console.error('[V4 IntelligencePopulator] Social population failed after retries:', error);
      return false;
    }
  }

  /**
   * Check if valid cache exists
   */
  private async checkCache(cacheKey: string, dataType: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('intelligence_cache')
        .select('id')
        .eq('cache_key', cacheKey)
        .eq('data_type', dataType)
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle();  // Use maybeSingle to avoid 406 when no rows

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Save data to intelligence cache
   */
  private async saveToCache(
    cacheKey: string,
    dataType: keyof typeof CACHE_TTL,
    data: any,
    brandId: string
  ): Promise<void> {
    const ttlHours = CACHE_TTL[dataType];
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    // Upsert to handle existing cache
    const { error } = await supabase
      .from('intelligence_cache')
      .upsert({
        cache_key: cacheKey,
        data_type: dataType,
        data,
        brand_id: brandId,
        expires_at: expiresAt,
        source_api: 'perplexity',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'cache_key'
      });

    if (error) {
      console.error('[V4 IntelligencePopulator] Cache save failed:', error);
      throw error;
    }
  }

  /**
   * Parse Perplexity trend response
   */
  private parseTrendResponse(response: any): any {
    try {
      // Handle various response formats
      if (typeof response === 'string') {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      if (response.content?.[0]?.text) {
        const text = response.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      if (response.choices?.[0]?.message?.content) {
        const text = response.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Fallback structure
      return {
        trends: [],
        news: [],
        seasonal: [],
        hashtags: []
      };
    } catch (error) {
      console.warn('[V4 IntelligencePopulator] Failed to parse trend response:', error);
      return { trends: [], news: [], seasonal: [], hashtags: [] };
    }
  }

  /**
   * Parse Perplexity competitor response
   */
  private parseCompetitorResponse(response: any): any {
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      if (response.content?.[0]?.text) {
        const text = response.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      if (response.choices?.[0]?.message?.content) {
        const text = response.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      return {
        competitors: [],
        gaps: [],
        differentiation: [],
        contentGaps: []
      };
    } catch (error) {
      console.warn('[V4 IntelligencePopulator] Failed to parse competitor response:', error);
      return { competitors: [], gaps: [], differentiation: [], contentGaps: [] };
    }
  }

  /**
   * Parse Perplexity social response
   */
  private parseSocialResponse(response: any): any {
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      if (response.content?.[0]?.text) {
        const text = response.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      if (response.choices?.[0]?.message?.content) {
        const text = response.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      return {
        language: [],
        painPoints: [],
        topics: [],
        sentiment: []
      };
    } catch (error) {
      console.warn('[V4 IntelligencePopulator] Failed to parse social response:', error);
      return { language: [], painPoints: [], topics: [], sentiment: [] };
    }
  }

  /**
   * Clear all cache for a brand
   */
  async clearCache(brandId: string): Promise<void> {
    await supabase
      .from('intelligence_cache')
      .delete()
      .eq('brand_id', brandId);

    console.log(`[V4 IntelligencePopulator] Cache cleared for brand ${brandId}`);
  }
}

// Export singleton instance
export const intelligencePopulator = new IntelligencePopulatorService();
export default intelligencePopulator;
