/**
 * Variant Performance Service (A/B Testing Framework)
 *
 * Tracks content variant performance and refines EQ scoring based on real results.
 *
 * Created: November 21, 2025
 */

import { supabase } from '@/lib/supabase';

export interface VariantMetrics {
  variantId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  engagementTime: number; // seconds
  shares: number;
  ctr: number; // calculated
  conversionRate: number; // calculated
  engagementScore: number; // calculated
}

export interface VariantPerformanceRecord {
  id: string;
  brandId: string;
  contentId: string;
  variantId: string;
  triggerType: string;
  eqScore: number;
  title: string;
  hook: string;
  metrics: VariantMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceInsight {
  triggerType: string;
  avgCtr: number;
  avgConversion: number;
  avgEngagement: number;
  effectivenessScore: number;
  sampleSize: number;
}

export interface EQCalibrationResult {
  triggerWeightAdjustments: Record<string, number>;
  recommendedPatterns: string[];
  underperformingPatterns: string[];
  confidence: number;
}

class VariantPerformanceService {
  /**
   * Track a variant impression
   */
  async trackImpression(
    brandId: string,
    contentId: string,
    variantId: string
  ): Promise<void> {
    try {
      // Upsert performance record
      const { error } = await supabase.rpc('increment_variant_impressions', {
        p_brand_id: brandId,
        p_content_id: contentId,
        p_variant_id: variantId
      });

      if (error) {
        // Fallback: create/update directly
        await this.upsertMetric(brandId, contentId, variantId, 'impressions', 1);
      }

      console.log(`[VariantPerformance] Tracked impression for ${variantId}`);
    } catch (error) {
      console.warn('[VariantPerformance] Failed to track impression:', error);
    }
  }

  /**
   * Track a variant click
   */
  async trackClick(
    brandId: string,
    contentId: string,
    variantId: string
  ): Promise<void> {
    await this.upsertMetric(brandId, contentId, variantId, 'clicks', 1);
    console.log(`[VariantPerformance] Tracked click for ${variantId}`);
  }

  /**
   * Track a conversion
   */
  async trackConversion(
    brandId: string,
    contentId: string,
    variantId: string
  ): Promise<void> {
    await this.upsertMetric(brandId, contentId, variantId, 'conversions', 1);
    console.log(`[VariantPerformance] Tracked conversion for ${variantId}`);
  }

  /**
   * Track engagement time
   */
  async trackEngagement(
    brandId: string,
    contentId: string,
    variantId: string,
    seconds: number
  ): Promise<void> {
    await this.upsertMetric(brandId, contentId, variantId, 'engagementTime', seconds);
    console.log(`[VariantPerformance] Tracked ${seconds}s engagement for ${variantId}`);
  }

  /**
   * Track a share
   */
  async trackShare(
    brandId: string,
    contentId: string,
    variantId: string
  ): Promise<void> {
    await this.upsertMetric(brandId, contentId, variantId, 'shares', 1);
    console.log(`[VariantPerformance] Tracked share for ${variantId}`);
  }

  /**
   * Get performance metrics for a content piece
   */
  async getContentPerformance(
    brandId: string,
    contentId: string
  ): Promise<VariantMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('variant_performance')
        .select('*')
        .eq('brand_id', brandId)
        .eq('content_id', contentId);

      if (error || !data) {
        return [];
      }

      return data.map(record => this.calculateMetrics(record));
    } catch (error) {
      console.error('[VariantPerformance] Error fetching performance:', error);
      return [];
    }
  }

  /**
   * Get insights by trigger type
   */
  async getTriggerInsights(brandId: string): Promise<PerformanceInsight[]> {
    try {
      const { data, error } = await supabase
        .from('variant_performance')
        .select('*')
        .eq('brand_id', brandId);

      if (error || !data || data.length === 0) {
        return this.getDefaultInsights();
      }

      // Group by trigger type
      const byTrigger = new Map<string, any[]>();
      for (const record of data) {
        const trigger = record.trigger_type || 'unknown';
        if (!byTrigger.has(trigger)) {
          byTrigger.set(trigger, []);
        }
        byTrigger.get(trigger)!.push(record);
      }

      // Calculate insights per trigger
      const insights: PerformanceInsight[] = [];
      for (const [triggerType, records] of byTrigger) {
        const metrics = records.map(r => this.calculateMetrics(r));

        const avgCtr = metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length;
        const avgConversion = metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length;
        const avgEngagement = metrics.reduce((sum, m) => sum + m.engagementScore, 0) / metrics.length;

        // Effectiveness = weighted combination
        const effectivenessScore = (avgCtr * 30) + (avgConversion * 50) + (avgEngagement * 20);

        insights.push({
          triggerType,
          avgCtr,
          avgConversion,
          avgEngagement,
          effectivenessScore: Math.round(effectivenessScore),
          sampleSize: records.length
        });
      }

      return insights.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
    } catch (error) {
      console.error('[VariantPerformance] Error getting insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Calibrate EQ scoring based on performance data
   */
  async calibrateEQScoring(brandId: string): Promise<EQCalibrationResult> {
    const insights = await this.getTriggerInsights(brandId);

    if (insights.length === 0) {
      return {
        triggerWeightAdjustments: {},
        recommendedPatterns: [],
        underperformingPatterns: [],
        confidence: 0
      };
    }

    // Calculate average effectiveness
    const avgEffectiveness = insights.reduce((sum, i) => sum + i.effectivenessScore, 0) / insights.length;

    // Calculate adjustments
    const adjustments: Record<string, number> = {};
    const recommended: string[] = [];
    const underperforming: string[] = [];

    for (const insight of insights) {
      const adjustment = (insight.effectivenessScore - avgEffectiveness) / avgEffectiveness;
      adjustments[insight.triggerType] = Math.round(adjustment * 100) / 100;

      if (insight.effectivenessScore > avgEffectiveness * 1.2 && insight.sampleSize >= 3) {
        recommended.push(insight.triggerType);
      } else if (insight.effectivenessScore < avgEffectiveness * 0.8 && insight.sampleSize >= 3) {
        underperforming.push(insight.triggerType);
      }
    }

    // Calculate confidence based on sample size
    const totalSamples = insights.reduce((sum, i) => sum + i.sampleSize, 0);
    const confidence = Math.min(100, totalSamples * 5); // 20 samples = 100% confidence

    return {
      triggerWeightAdjustments: adjustments,
      recommendedPatterns: recommended,
      underperformingPatterns: underperforming,
      confidence
    };
  }

  /**
   * Get the best performing variant for a content piece
   */
  async getBestVariant(
    brandId: string,
    contentId: string
  ): Promise<string | null> {
    const metrics = await this.getContentPerformance(brandId, contentId);

    if (metrics.length === 0) {
      return null;
    }

    // Score each variant
    const scored = metrics.map(m => ({
      variantId: m.variantId,
      score: (m.ctr * 30) + (m.conversionRate * 50) + (m.engagementScore * 20)
    }));

    const best = scored.sort((a, b) => b.score - a.score)[0];
    return best.variantId;
  }

  /**
   * Store initial variant data
   */
  async storeVariant(
    brandId: string,
    contentId: string,
    variantId: string,
    triggerType: string,
    eqScore: number,
    title: string,
    hook: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('variant_performance')
        .upsert({
          brand_id: brandId,
          content_id: contentId,
          variant_id: variantId,
          trigger_type: triggerType,
          eq_score: eqScore,
          title,
          hook,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          engagement_time: 0,
          shares: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'brand_id,content_id,variant_id'
        });

      if (error) {
        console.warn('[VariantPerformance] Failed to store variant:', error);
      }
    } catch (error) {
      console.error('[VariantPerformance] Error storing variant:', error);
    }
  }

  /**
   * Helper: Upsert a metric increment
   */
  private async upsertMetric(
    brandId: string,
    contentId: string,
    variantId: string,
    metric: string,
    increment: number
  ): Promise<void> {
    try {
      // First try to get existing record
      const { data, error: fetchError } = await supabase
        .from('variant_performance')
        .select('*')
        .eq('brand_id', brandId)
        .eq('content_id', contentId)
        .eq('variant_id', variantId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Real error, not just "no rows"
        throw fetchError;
      }

      if (data) {
        // Update existing
        const currentValue = data[metric] || 0;
        const { error: updateError } = await supabase
          .from('variant_performance')
          .update({
            [metric]: currentValue + increment,
            updated_at: new Date().toISOString()
          })
          .eq('brand_id', brandId)
          .eq('content_id', contentId)
          .eq('variant_id', variantId);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('variant_performance')
          .insert({
            brand_id: brandId,
            content_id: contentId,
            variant_id: variantId,
            [metric]: increment,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.warn(`[VariantPerformance] Failed to upsert ${metric}:`, error);
    }
  }

  /**
   * Calculate derived metrics
   */
  private calculateMetrics(record: any): VariantMetrics {
    const impressions = record.impressions || 0;
    const clicks = record.clicks || 0;
    const conversions = record.conversions || 0;
    const engagementTime = record.engagement_time || 0;
    const shares = record.shares || 0;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    // Engagement score: normalize engagement time (30s = 50, 60s = 100)
    const engagementScore = Math.min(100, (engagementTime / 60) * 100);

    return {
      variantId: record.variant_id,
      impressions,
      clicks,
      conversions,
      engagementTime,
      shares,
      ctr: Math.round(ctr * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      engagementScore: Math.round(engagementScore)
    };
  }

  /**
   * Default insights when no data
   */
  private getDefaultInsights(): PerformanceInsight[] {
    return [
      { triggerType: 'curiosity', avgCtr: 3.5, avgConversion: 2.1, avgEngagement: 45, effectivenessScore: 75, sampleSize: 0 },
      { triggerType: 'fear', avgCtr: 4.2, avgConversion: 2.8, avgEngagement: 38, effectivenessScore: 80, sampleSize: 0 },
      { triggerType: 'urgency', avgCtr: 5.1, avgConversion: 3.2, avgEngagement: 32, effectivenessScore: 85, sampleSize: 0 },
      { triggerType: 'trust', avgCtr: 3.0, avgConversion: 3.5, avgEngagement: 52, effectivenessScore: 82, sampleSize: 0 },
      { triggerType: 'achievement', avgCtr: 3.2, avgConversion: 2.5, avgEngagement: 48, effectivenessScore: 72, sampleSize: 0 },
      { triggerType: 'desire', avgCtr: 4.0, avgConversion: 2.3, avgEngagement: 42, effectivenessScore: 74, sampleSize: 0 }
    ];
  }
}

export const variantPerformance = new VariantPerformanceService();
