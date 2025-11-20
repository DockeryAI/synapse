/**
 * EQ Storage Service
 *
 * Handles database persistence for EQ Calculator v2.0
 * Replaces in-memory storage with Supabase
 *
 * Created: 2025-11-19
 */

import { supabase } from '@/lib/supabase';
import type {
  EQScore,
  EQBreakdown,
  EQCalculationResult,
  PatternSignature,
  SpecialtyEQMapping
} from '@/types/eq-calculator.types';
import type { Database } from '@/types/database.types';

type BrandEQScore = Database['public']['Tables']['brand_eq_scores']['Row'];
type BrandEQScoreInsert = Database['public']['Tables']['brand_eq_scores']['Insert'];
type EQPattern = Database['public']['Tables']['eq_patterns']['Row'];
type EQPatternInsert = Database['public']['Tables']['eq_patterns']['Insert'];
type EQSpecialtyBaseline = Database['public']['Tables']['eq_specialty_baselines']['Row'];
type EQPerformanceMetric = Database['public']['Tables']['eq_performance_metrics']['Insert'];

/**
 * EQ Storage Service
 */
class EQStorageService {
  /**
   * Save EQ calculation result to database
   */
  async saveEQScore(brandId: string, result: EQCalculationResult): Promise<void> {
    try {
      console.log('[EQStorage] Saving EQ score for brand:', brandId);

      const eqScore: BrandEQScoreInsert = {
        brand_id: brandId,
        emotional_quotient: result.eq_score.emotional,
        rational_quotient: result.eq_score.rational,
        overall_eq: result.eq_score.overall,
        confidence_score: result.eq_score.confidence,
        calculation_method: result.eq_score.calculation_method,
        specialty: result.specialty_context?.specialty || null,
        industry: result.specialty_context?.specialty || null,
        is_passion_product: result.specialty_context?.is_passion_product || false,
        specialty_contribution: result.breakdown.layer_contributions.specialty_context as any,
        pattern_contribution: result.breakdown.layer_contributions.pattern_recognition as any,
        content_contribution: result.breakdown.layer_contributions.content_analysis as any,
        detected_signals: result.breakdown.detected_signals as any,
        recommendations: result.recommendations as any,
        calculation_id: result.calculation_id
      };

      // Upsert (update if exists, insert if not)
      const { error } = await supabase
        .from('brand_eq_scores')
        .upsert(eqScore, {
          onConflict: 'brand_id'
        });

      if (error) {
        console.error('[EQStorage] Error saving EQ score:', error);
        throw error;
      }

      // Also update the brands table for quick access
      const { error: brandError } = await supabase
        .from('brands')
        .update({
          emotional_quotient: result.eq_score.overall,
          eq_calculated_at: new Date().toISOString()
        })
        .eq('id', brandId);

      if (brandError) {
        console.error('[EQStorage] Error updating brand EQ:', brandError);
      }

      console.log('[EQStorage] EQ score saved successfully');
    } catch (error) {
      console.error('[EQStorage] Failed to save EQ score:', error);
      throw error;
    }
  }

  /**
   * Load EQ score for a brand
   */
  async loadEQScore(brandId: string): Promise<EQCalculationResult | null> {
    try {
      const { data, error } = await supabase
        .from('brand_eq_scores')
        .select('*')
        .eq('brand_id', brandId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      if (!data) return null;

      // Convert database row to EQCalculationResult
      const result: EQCalculationResult = {
        eq_score: {
          emotional: data.emotional_quotient,
          rational: data.rational_quotient,
          overall: data.overall_eq,
          confidence: data.confidence_score,
          calculation_method: data.calculation_method as any
        },
        breakdown: {
          score: {
            emotional: data.emotional_quotient,
            rational: data.rational_quotient,
            overall: data.overall_eq,
            confidence: data.confidence_score,
            calculation_method: data.calculation_method as any
          },
          layer_contributions: {
            specialty_context: data.specialty_contribution as any,
            pattern_recognition: data.pattern_contribution as any,
            content_analysis: data.content_contribution as any
          },
          detected_signals: data.detected_signals as any,
          calculation_timestamp: data.calculated_at
        },
        specialty_context: data.specialty ? {
          specialty: data.specialty,
          base_eq: data.overall_eq,
          is_known: true,
          is_passion_product: data.is_passion_product,
          confidence: data.confidence_score
        } : undefined,
        pattern_matches: [],
        content_analysis: {} as any,
        recommendations: (data.recommendations as any) || [],
        cached: true,
        calculation_id: data.calculation_id
      };

      return result;
    } catch (error) {
      console.error('[EQStorage] Error loading EQ score:', error);
      return null;
    }
  }

  /**
   * Save pattern signature for learning
   */
  async savePattern(
    signature: PatternSignature,
    businessName: string,
    specialty?: string
  ): Promise<void> {
    try {
      const pattern: EQPatternInsert = {
        pattern_id: signature.id,
        pattern_type: signature.pattern_type,
        detected_keywords: signature.detected_keywords,
        keyword_density: signature.keyword_density as any,
        has_testimonials: signature.structural_signals.has_testimonials,
        has_forums: signature.structural_signals.has_forums,
        has_pricing_tables: signature.structural_signals.has_pricing_tables,
        has_comparison_charts: signature.structural_signals.has_comparison_charts,
        has_contact_only_pricing: signature.structural_signals.has_contact_only_pricing,
        calculated_eq: signature.calculated_eq,
        confidence_score: signature.confidence,
        business_name: businessName,
        specialty: specialty || null
      };

      const { error } = await supabase
        .from('eq_patterns')
        .insert(pattern);

      if (error && error.code !== '23505') {  // Ignore duplicate key errors
        console.error('[EQStorage] Error saving pattern:', error);
      }
    } catch (error) {
      console.error('[EQStorage] Failed to save pattern:', error);
    }
  }

  /**
   * Get specialty baseline from database
   */
  async getSpecialtyBaseline(specialty: string): Promise<number | undefined> {
    try {
      const { data, error } = await supabase
        .from('eq_specialty_baselines')
        .select('base_eq')
        .eq('specialty', specialty.toLowerCase())
        .single();

      if (error || !data) return undefined;

      return data.base_eq;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Save or update specialty baseline
   */
  async saveSpecialtyBaseline(mapping: SpecialtyEQMapping): Promise<void> {
    try {
      const baseline = {
        specialty: mapping.specialty.toLowerCase(),
        base_eq: mapping.base_eq,
        is_passion_product: mapping.is_passion_product,
        sample_size: mapping.sample_size,
        confidence_score: 85,  // Default confidence
        example_businesses: mapping.examples,
        last_updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('eq_specialty_baselines')
        .upsert(baseline, {
          onConflict: 'specialty'
        });

      if (error) {
        console.error('[EQStorage] Error saving specialty baseline:', error);
      }
    } catch (error) {
      console.error('[EQStorage] Failed to save specialty baseline:', error);
    }
  }

  /**
   * Get all specialty baselines
   */
  async getAllSpecialtyBaselines(): Promise<SpecialtyEQMapping[]> {
    try {
      const { data, error } = await supabase
        .from('eq_specialty_baselines')
        .select('*')
        .order('sample_size', { ascending: false });

      if (error || !data) return [];

      return data.map(row => ({
        specialty: row.specialty,
        base_eq: row.base_eq,
        is_passion_product: row.is_passion_product,
        sample_size: row.sample_size,
        last_updated_at: row.last_updated_at,
        examples: row.example_businesses
      }));
    } catch (error) {
      console.error('[EQStorage] Error loading specialty baselines:', error);
      return [];
    }
  }

  /**
   * Track content performance for EQ validation
   */
  async trackPerformance(metric: {
    brandId: string;
    contentId?: string;
    contentType: string;
    platform: string;
    contentEQ: number;
    targetEQ?: number;
    platformAdjustment?: number;
    seasonalAdjustment?: number;
    campaignTypeAdjustment?: number;
    impressions?: number;
    engagementCount?: number;
    engagementRate?: number;
    clickCount?: number;
    clickRate?: number;
    conversionCount?: number;
    conversionRate?: number;
    publishedAt?: string;
  }): Promise<void> {
    try {
      const perfMetric: EQPerformanceMetric = {
        brand_id: metric.brandId,
        content_id: metric.contentId || null,
        content_type: metric.contentType,
        platform: metric.platform,
        content_eq: metric.contentEQ,
        target_eq: metric.targetEQ || null,
        eq_variance: metric.targetEQ ? metric.contentEQ - metric.targetEQ : null,
        platform_adjustment: metric.platformAdjustment || 0,
        seasonal_adjustment: metric.seasonalAdjustment || 0,
        campaign_type_adjustment: metric.campaignTypeAdjustment || 0,
        impressions: metric.impressions || 0,
        engagement_count: metric.engagementCount || 0,
        engagement_rate: metric.engagementRate || null,
        click_count: metric.clickCount || 0,
        click_rate: metric.clickRate || null,
        conversion_count: metric.conversionCount || 0,
        conversion_rate: metric.conversionRate || null,
        published_at: metric.publishedAt || null
      };

      const { error } = await supabase
        .from('eq_performance_metrics')
        .insert(perfMetric);

      if (error) {
        console.error('[EQStorage] Error tracking performance:', error);
      }
    } catch (error) {
      console.error('[EQStorage] Failed to track performance:', error);
    }
  }

  /**
   * Get performance insights by EQ cohort
   */
  async getPerformanceInsights(brandId: string): Promise<{
    avgEngagementByEQ: { eq_range: string; avg_engagement: number }[];
    bestPerformingEQ: number;
    platformPerformance: { platform: string; avg_eq: number; avg_engagement: number }[];
  }> {
    try {
      // Get all performance metrics for this brand
      const { data, error } = await supabase
        .from('eq_performance_metrics')
        .select('*')
        .eq('brand_id', brandId)
        .not('engagement_rate', 'is', null)
        .order('measured_at', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        return {
          avgEngagementByEQ: [],
          bestPerformingEQ: 50,
          platformPerformance: []
        };
      }

      // Group by EQ ranges (0-30, 30-50, 50-70, 70-100)
      const eqRanges = [
        { range: '0-30', min: 0, max: 30 },
        { range: '30-50', min: 30, max: 50 },
        { range: '50-70', min: 50, max: 70 },
        { range: '70-100', min: 70, max: 100 }
      ];

      const avgEngagementByEQ = eqRanges.map(({ range, min, max }) => {
        const filtered = data.filter(d => d.content_eq >= min && d.content_eq < max);
        const avg = filtered.length > 0
          ? filtered.reduce((sum, d) => sum + (d.engagement_rate || 0), 0) / filtered.length
          : 0;
        return { eq_range: range, avg_engagement: avg };
      });

      // Find best performing EQ
      const bestPerformingEQ = avgEngagementByEQ.reduce((best, curr) =>
        curr.avg_engagement > best.avg_engagement ? curr : best
      , avgEngagementByEQ[0]).eq_range;

      // Calculate average EQ by platform
      const platformMap = new Map<string, { total_eq: number; total_engagement: number; count: number }>();
      data.forEach(metric => {
        if (!platformMap.has(metric.platform)) {
          platformMap.set(metric.platform, { total_eq: 0, total_engagement: 0, count: 0 });
        }
        const entry = platformMap.get(metric.platform)!;
        entry.total_eq += metric.content_eq;
        entry.total_engagement += metric.engagement_rate || 0;
        entry.count++;
      });

      const platformPerformance = Array.from(platformMap.entries()).map(([platform, stats]) => ({
        platform,
        avg_eq: stats.total_eq / stats.count,
        avg_engagement: stats.total_engagement / stats.count
      }));

      return {
        avgEngagementByEQ,
        bestPerformingEQ: parseInt(bestPerformingEQ.split('-')[0]) + 15,  // Middle of range
        platformPerformance
      };
    } catch (error) {
      console.error('[EQStorage] Error getting performance insights:', error);
      return {
        avgEngagementByEQ: [],
        bestPerformingEQ: 50,
        platformPerformance: []
      };
    }
  }
}

// Export singleton instance
export const eqStorage = new EQStorageService();
export { EQStorageService };
