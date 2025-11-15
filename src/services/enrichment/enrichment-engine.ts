/**
 * Enrichment Engine - Automatically enriches all MIRROR sections with AI insights
 * Phase 15: Background Jobs and Enrichment Engine
 */

import { supabase } from '@/lib/supabase';
import type {
  MIRRORSection,
  EnrichmentResult,
  EnrichmentCache,
  CacheTTL,
  EnrichmentError,
  EnrichmentResponse,
} from '@/types/enrichment.types';

// Cache TTLs for each section (in milliseconds)
const CACHE_TTL: CacheTTL = {
  measure: 24 * 60 * 60 * 1000, // 24 hours
  intend: 7 * 24 * 60 * 60 * 1000, // 7 days
  reimagine: 7 * 24 * 60 * 60 * 1000, // 7 days
  reach: 3 * 24 * 60 * 60 * 1000, // 3 days
  optimize: 24 * 60 * 60 * 1000, // 1 day
  reflect: 6 * 60 * 60 * 1000, // 6 hours
};

export class EnrichmentEngine {
  /**
   * Enrich all MIRROR sections for a brand
   */
  static async enrichAllSections(
    brandId: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<Record<MIRRORSection, EnrichmentResult>> {
    const sections: MIRRORSection[] = [
      'measure',
      'intend',
      'reimagine',
      'reach',
      'optimize',
      'reflect',
    ];

    const results: Partial<Record<MIRRORSection, EnrichmentResult>> = {};
    const errors: EnrichmentError[] = [];

    for (const section of sections) {
      try {
        const result = await this.enrichSection(brandId, section, options);
        results[section] = result;
      } catch (error) {
        errors.push({
          section,
          error: error as Error,
          timestamp: new Date().toISOString(),
          retry_count: 0,
        });
        console.error(`Failed to enrich ${section} for brand ${brandId}:`, error);
      }
    }

    // Log enrichment completion
    await this.logEnrichment(brandId, {
      sections_enriched: Object.keys(results).length,
      errors: errors.length,
      timestamp: new Date().toISOString(),
    });

    return results as Record<MIRRORSection, EnrichmentResult>;
  }

  /**
   * Enrich a specific section
   */
  static async enrichSection(
    brandId: string,
    section: MIRRORSection,
    options: { forceRefresh?: boolean } = {}
  ): Promise<EnrichmentResult> {
    // Check cache first unless force refresh
    if (!options.forceRefresh) {
      const cached = await this.getCachedEnrichment(brandId, section);
      if (cached) {
        return cached.data as EnrichmentResult;
      }
    }

    // Call the appropriate enrichment method
    let result: EnrichmentResult;

    switch (section) {
      case 'measure':
        result = await this.enrichMeasure(brandId);
        break;
      case 'intend':
        result = await this.enrichIntend(brandId);
        break;
      case 'reimagine':
        result = await this.enrichReimagine(brandId);
        break;
      case 'reach':
        result = await this.enrichReach(brandId);
        break;
      case 'optimize':
        result = await this.enrichOptimize(brandId);
        break;
      case 'reflect':
        result = await this.enrichReflect(brandId);
        break;
      default:
        throw new Error(`Unknown section: ${section}`);
    }

    // Cache the result
    await this.setCachedEnrichment(brandId, section, result, CACHE_TTL[section]);

    return result;
  }

  /**
   * Enrich Measure section - Analytics and current state
   */
  static async enrichMeasure(brandId: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-mirror`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            brandId,
            section: 'measure',
            analysisType: 'enrichment',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        section: 'measure',
        insights: data.insights || [],
        recommendations: data.recommendations || [],
        benchmarks: data.benchmarks,
        gaps: data.gaps,
        opportunities: data.opportunities,
        confidence_score: data.confidence_score || 0.7,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error enriching Measure section:', error);
      throw error;
    }
  }

  /**
   * Enrich Intend section - Objectives and goals
   */
  static async enrichIntend(brandId: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-mirror`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            brandId,
            section: 'intend',
            analysisType: 'enrichment',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        section: 'intend',
        insights: data.insights || [],
        recommendations: data.recommendations || [],
        benchmarks: data.benchmarks,
        gaps: data.gaps,
        opportunities: data.opportunities,
        confidence_score: data.confidence_score || 0.8,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error enriching Intend section:', error);
      throw error;
    }
  }

  /**
   * Enrich Reimagine section - Strategy and positioning
   */
  static async enrichReimagine(brandId: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-mirror`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            brandId,
            section: 'reimagine',
            analysisType: 'enrichment',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        section: 'reimagine',
        insights: data.insights || [],
        recommendations: data.recommendations || [],
        benchmarks: data.benchmarks,
        gaps: data.gaps,
        opportunities: data.opportunities,
        confidence_score: data.confidence_score || 0.75,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error enriching Reimagine section:', error);
      throw error;
    }
  }

  /**
   * Enrich Reach section - Channels and tactics
   */
  static async enrichReach(brandId: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-mirror`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            brandId,
            section: 'reach',
            analysisType: 'enrichment',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        section: 'reach',
        insights: data.insights || [],
        recommendations: data.recommendations || [],
        benchmarks: data.benchmarks,
        gaps: data.gaps,
        opportunities: data.opportunities,
        confidence_score: data.confidence_score || 0.8,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error enriching Reach section:', error);
      throw error;
    }
  }

  /**
   * Enrich Optimize section - Performance and improvements
   */
  static async enrichOptimize(brandId: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-mirror`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            brandId,
            section: 'optimize',
            analysisType: 'enrichment',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        section: 'optimize',
        insights: data.insights || [],
        recommendations: data.recommendations || [],
        benchmarks: data.benchmarks,
        gaps: data.gaps,
        opportunities: data.opportunities,
        confidence_score: data.confidence_score || 0.85,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error enriching Optimize section:', error);
      throw error;
    }
  }

  /**
   * Enrich Reflect section - Analytics and insights
   */
  static async enrichReflect(brandId: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-mirror`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            brandId,
            section: 'reflect',
            analysisType: 'enrichment',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        section: 'reflect',
        insights: data.insights || [],
        recommendations: data.recommendations || [],
        benchmarks: data.benchmarks,
        gaps: data.gaps,
        opportunities: data.opportunities,
        confidence_score: data.confidence_score || 0.9,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error enriching Reflect section:', error);
      throw error;
    }
  }

  /**
   * Get cached enrichment data
   */
  static async getCachedEnrichment(
    brandId: string,
    section: MIRRORSection
  ): Promise<EnrichmentCache | null> {
    try {
      const { data, error } = await supabase
        .from('enrichment_cache')
        .select('*')
        .eq('brand_id', brandId)
        .eq('section', section)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return data as EnrichmentCache;
    } catch (error) {
      console.error('Error getting cached enrichment:', error);
      return null;
    }
  }

  /**
   * Set cached enrichment data
   */
  static async setCachedEnrichment(
    brandId: string,
    section: MIRRORSection,
    data: EnrichmentResult,
    ttl: number
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl).toISOString();

      await supabase.from('enrichment_cache').upsert(
        {
          brand_id: brandId,
          section,
          data: data as any,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'brand_id,section',
        }
      );
    } catch (error) {
      console.error('Error setting cached enrichment:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a section
   */
  static async invalidateCache(
    brandId: string,
    section?: MIRRORSection
  ): Promise<void> {
    try {
      let query = supabase
        .from('enrichment_cache')
        .delete()
        .eq('brand_id', brandId);

      if (section) {
        query = query.eq('section', section);
      }

      await query;
    } catch (error) {
      console.error('Error invalidating cache:', error);
      throw error;
    }
  }

  /**
   * Log enrichment activity
   */
  private static async logEnrichment(
    brandId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('enrichment_logs').insert({
        brand_id: brandId,
        event_type: 'enrichment_completed',
        metadata,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging enrichment:', error);
      // Don't throw - logging failures shouldn't break enrichment
    }
  }

  /**
   * Get enrichment status for a brand
   */
  static async getEnrichmentStatus(brandId: string): Promise<{
    sections: Record<
      MIRRORSection,
      {
        cached: boolean;
        expires_at: string | null;
        last_enriched: string | null;
      }
    >;
  }> {
    const sections: MIRRORSection[] = [
      'measure',
      'intend',
      'reimagine',
      'reach',
      'optimize',
      'reflect',
    ];

    const status: Record<
      MIRRORSection,
      {
        cached: boolean;
        expires_at: string | null;
        last_enriched: string | null;
      }
    > = {} as any;

    for (const section of sections) {
      const cached = await this.getCachedEnrichment(brandId, section);
      status[section] = {
        cached: !!cached,
        expires_at: cached?.expires_at || null,
        last_enriched: cached?.updated_at || null,
      };
    }

    return { sections: status };
  }

  /**
   * Schedule background enrichment
   */
  static async scheduleEnrichment(
    brandId: string,
    section: MIRRORSection,
    scheduleType: 'daily' | 'weekly' | 'on_demand' = 'daily'
  ): Promise<void> {
    try {
      await supabase.from('enrichment_schedule').upsert(
        {
          brand_id: brandId,
          section,
          schedule_type: scheduleType,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'brand_id,section',
        }
      );
    } catch (error) {
      console.error('Error scheduling enrichment:', error);
      throw error;
    }
  }
}
