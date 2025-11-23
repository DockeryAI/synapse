/**
 * Segment Analytics Service
 * Track and analyze segment performance across campaigns
 */

import type {
  SegmentAnalyticsSummary,
  SegmentPerformanceData,
  CustomerPersona,
} from '@/types/v2';
import type { EmotionalTrigger } from '@/types/v2';
import { personaMappingService } from './persona-mapping.service';

export interface PerformanceMetrics {
  personaId: string;
  pieceId: string;
  engagementRate: number;
  conversionRate: number;
  ctr: number;
  trigger: EmotionalTrigger;
  platform: string;
  publishedAt: string;
}

export interface TriggerPerformance {
  trigger: EmotionalTrigger;
  personaId: string;
  avgEngagement: number;
  avgConversion: number;
  usageCount: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface GapAnalysisResult {
  persona: CustomerPersona;
  daysSinceLastContent: number;
  recommendedFrequency: number; // pieces per week
  missingOpportunities: string[];
}

export class SegmentAnalyticsService {
  private performanceData: Map<string, PerformanceMetrics[]> = new Map();
  private timeRanges: Map<string, { start: string; end: string }> = new Map();

  /**
   * Log performance metrics for a piece
   */
  logPerformance(metrics: PerformanceMetrics): void {
    const existing = this.performanceData.get(metrics.personaId) || [];
    existing.push(metrics);
    this.performanceData.set(metrics.personaId, existing);
  }

  /**
   * Get performance data for a persona
   */
  getPerformanceData(
    personaId: string,
    timeRange?: { start: string; end: string }
  ): SegmentPerformanceData | null {
    const persona = personaMappingService.getPersona(personaId);
    if (!persona) {
      return null;
    }

    const metrics = this.performanceData.get(personaId) || [];

    // Filter by time range if provided
    const filtered = timeRange
      ? metrics.filter(m => m.publishedAt >= timeRange.start && m.publishedAt <= timeRange.end)
      : metrics;

    if (filtered.length === 0) {
      return null;
    }

    // Calculate aggregate metrics
    const totalPieces = filtered.length;
    const avgEngagementRate = filtered.reduce((sum, m) => sum + m.engagementRate, 0) / totalPieces;
    const avgConversionRate = filtered.reduce((sum, m) => sum + m.conversionRate, 0) / totalPieces;
    const avgCTR = filtered.reduce((sum, m) => sum + m.ctr, 0) / totalPieces;

    // Find best/worst triggers
    const triggerPerformance = this.calculateTriggerPerformance(filtered);
    const bestPerformingTrigger = triggerPerformance[0]?.trigger || 'trust';
    const worstPerformingTrigger = triggerPerformance[triggerPerformance.length - 1]?.trigger || 'fear';

    // Create trend data
    const trendData = this.createTrendData(filtered);

    // Create platform breakdown
    const platformBreakdown = this.createPlatformBreakdown(filtered);

    return {
      personaId,
      timeRange: timeRange || {
        start: filtered[0].publishedAt,
        end: filtered[filtered.length - 1].publishedAt,
      },
      metrics: {
        totalPieces,
        avgEngagementRate,
        avgConversionRate,
        avgCTR,
        bestPerformingTrigger,
        worstPerformingTrigger,
      },
      trendData,
      platformBreakdown,
    };
  }

  /**
   * Get analytics summary for all personas
   */
  getAnalyticsSummary(
    brandId: string,
    timeRange: { start: string; end: string }
  ): SegmentAnalyticsSummary {
    const personas = personaMappingService.getAllPersonas();
    const allMetrics: PerformanceMetrics[] = [];

    // Collect all metrics across personas
    personas.forEach(persona => {
      const metrics = this.performanceData.get(persona.id) || [];
      const filtered = metrics.filter(
        m => m.publishedAt >= timeRange.start && m.publishedAt <= timeRange.end
      );
      allMetrics.push(...filtered);
    });

    // Calculate overall performance
    const totalPieces = allMetrics.length;
    const avgEngagementRate = totalPieces > 0
      ? allMetrics.reduce((sum, m) => sum + m.engagementRate, 0) / totalPieces
      : 0;
    const avgConversionRate = totalPieces > 0
      ? allMetrics.reduce((sum, m) => sum + m.conversionRate, 0) / totalPieces
      : 0;

    // Find best/worst performing personas
    const personaPerformance = personas.map(persona => {
      const metrics = this.performanceData.get(persona.id) || [];
      const filtered = metrics.filter(
        m => m.publishedAt >= timeRange.start && m.publishedAt <= timeRange.end
      );
      const avg = filtered.length > 0
        ? filtered.reduce((sum, m) => sum + m.engagementRate, 0) / filtered.length
        : 0;
      return { personaId: persona.id, personaName: persona.name, avgEngagement: avg };
    });

    personaPerformance.sort((a, b) => b.avgEngagement - a.avgEngagement);

    const bestPerformingPersona = personaPerformance[0]?.personaName || 'N/A';
    const worstPerformingPersona = personaPerformance[personaPerformance.length - 1]?.personaName || 'N/A';

    // Create performance heatmap
    const performanceHeatmap = this.createPerformanceHeatmap(personas, timeRange);

    // Perform gap analysis
    const gapAnalysis = this.performGapAnalysis(personas, timeRange);

    // Analyze trigger effectiveness
    const triggerEffectiveness = this.analyzeTriggerEffectiveness(personas, timeRange);

    return {
      brandId,
      timeRange,
      totalPersonas: personas.length,
      totalPieces,
      overallPerformance: {
        avgEngagementRate,
        avgConversionRate,
        bestPerformingPersona,
        worstPerformingPersona,
      },
      performanceHeatmap,
      gapAnalysis,
      triggerEffectiveness,
    };
  }

  /**
   * Get trigger performance for a specific persona
   */
  getTriggerPerformance(personaId: string): TriggerPerformance[] {
    const metrics = this.performanceData.get(personaId) || [];
    return this.calculateTriggerPerformance(metrics).map(tp => ({
      ...tp,
      trend: this.calculateTrend(metrics.filter(m => m.trigger === tp.trigger)),
    }));
  }

  /**
   * Identify under-served personas
   */
  identifyUnderservedPersonas(minPiecesPerWeek: number = 2): GapAnalysisResult[] {
    const personas = personaMappingService.getAllPersonas();
    const gaps: GapAnalysisResult[] = [];

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    personas.forEach(persona => {
      const metrics = this.performanceData.get(persona.id) || [];
      const recentMetrics = metrics.filter(
        m => new Date(m.publishedAt) >= oneWeekAgo
      );

      if (recentMetrics.length < minPiecesPerWeek) {
        const lastMetric = metrics[metrics.length - 1];
        const daysSince = lastMetric
          ? Math.floor((now.getTime() - new Date(lastMetric.publishedAt).getTime()) / (24 * 60 * 60 * 1000))
          : 999;

        gaps.push({
          persona,
          daysSinceLastContent: daysSince,
          recommendedFrequency: minPiecesPerWeek,
          missingOpportunities: this.identifyMissingOpportunities(persona, recentMetrics),
        });
      }
    });

    // Sort by days since last content
    gaps.sort((a, b) => b.daysSinceLastContent - a.daysSinceLastContent);

    return gaps;
  }

  /**
   * Compare performance across platforms
   */
  comparePlatformPerformance(personaId: string): {
    platform: string;
    engagementRate: number;
    conversionRate: number;
    pieceCount: number;
    recommendation: string;
  }[] {
    const metrics = this.performanceData.get(personaId) || [];
    const platformBreakdown = this.createPlatformBreakdown(metrics);

    const avgEngagement = platformBreakdown.reduce((sum, p) => sum + p.engagementRate, 0) / platformBreakdown.length;

    return platformBreakdown.map(platform => ({
      ...platform,
      recommendation: this.getPlatformRecommendation(platform, avgEngagement),
    }));
  }

  /**
   * Get content frequency recommendations
   */
  getFrequencyRecommendations(personaId: string): {
    current: number; // pieces per week
    recommended: number;
    reasoning: string;
  } {
    const metrics = this.performanceData.get(personaId) || [];
    const persona = personaMappingService.getPersona(personaId);

    if (!persona || metrics.length === 0) {
      return {
        current: 0,
        recommended: 2,
        reasoning: 'Start with 2 pieces per week to establish baseline performance',
      };
    }

    // Calculate current frequency (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMetrics = metrics.filter(m => new Date(m.publishedAt) >= thirtyDaysAgo);
    const current = (recentMetrics.length / 30) * 7; // pieces per week

    // Calculate engagement trend
    const trend = this.calculateTrend(metrics);

    let recommended = current;
    let reasoning = '';

    if (trend === 'improving' && current < 5) {
      recommended = Math.min(current * 1.5, 5);
      reasoning = 'Performance improving - increase frequency to capitalize on momentum';
    } else if (trend === 'declining') {
      recommended = Math.max(current * 0.7, 1);
      reasoning = 'Performance declining - reduce frequency and focus on quality';
    } else {
      recommended = current;
      reasoning = 'Performance stable - maintain current frequency';
    }

    return {
      current: Math.round(current * 10) / 10,
      recommended: Math.round(recommended * 10) / 10,
      reasoning,
    };
  }

  // Private helper methods

  private calculateTriggerPerformance(metrics: PerformanceMetrics[]): TriggerPerformance[] {
    const triggerMap = new Map<EmotionalTrigger, PerformanceMetrics[]>();

    metrics.forEach(m => {
      const existing = triggerMap.get(m.trigger) || [];
      existing.push(m);
      triggerMap.set(m.trigger, existing);
    });

    const performance: TriggerPerformance[] = [];

    triggerMap.forEach((metrics, trigger) => {
      const avgEngagement = metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length;
      const avgConversion = metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length;

      performance.push({
        trigger,
        personaId: metrics[0].personaId,
        avgEngagement,
        avgConversion,
        usageCount: metrics.length,
        trend: this.calculateTrend(metrics),
      });
    });

    // Sort by average engagement
    performance.sort((a, b) => b.avgEngagement - a.avgEngagement);

    return performance;
  }

  private createTrendData(metrics: PerformanceMetrics[]): SegmentPerformanceData['trendData'] {
    // Group by date
    const dateMap = new Map<string, PerformanceMetrics[]>();

    metrics.forEach(m => {
      const date = m.publishedAt.split('T')[0]; // Get date part only
      const existing = dateMap.get(date) || [];
      existing.push(m);
      dateMap.set(date, existing);
    });

    const trendData: SegmentPerformanceData['trendData'] = [];

    dateMap.forEach((metrics, date) => {
      const avgEngagement = metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length;
      const avgConversion = metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length;
      const trigger = metrics[0].trigger; // Use first trigger for simplicity

      trendData.push({
        date,
        engagementRate: avgEngagement,
        conversionRate: avgConversion,
        triggerUsed: trigger,
      });
    });

    // Sort by date
    trendData.sort((a, b) => a.date.localeCompare(b.date));

    return trendData;
  }

  private createPlatformBreakdown(metrics: PerformanceMetrics[]): SegmentPerformanceData['platformBreakdown'] {
    const platformMap = new Map<string, PerformanceMetrics[]>();

    metrics.forEach(m => {
      const existing = platformMap.get(m.platform) || [];
      existing.push(m);
      platformMap.set(m.platform, existing);
    });

    const breakdown: SegmentPerformanceData['platformBreakdown'] = [];

    platformMap.forEach((metrics, platform) => {
      const avgEngagement = metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length;
      const avgConversion = metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length;

      breakdown.push({
        platform,
        engagementRate: avgEngagement,
        conversionRate: avgConversion,
        pieceCount: metrics.length,
      });
    });

    return breakdown;
  }

  private createPerformanceHeatmap(
    personas: CustomerPersona[],
    timeRange: { start: string; end: string }
  ): SegmentAnalyticsSummary['performanceHeatmap'] {
    const heatmap: SegmentAnalyticsSummary['performanceHeatmap'] = [];

    personas.forEach(persona => {
      const metrics = this.performanceData.get(persona.id) || [];
      const filtered = metrics.filter(
        m => m.publishedAt >= timeRange.start && m.publishedAt <= timeRange.end
      );

      const triggerPerformance = this.calculateTriggerPerformance(filtered);

      triggerPerformance.forEach(tp => {
        heatmap.push({
          personaId: persona.id,
          personaName: persona.name,
          trigger: tp.trigger,
          engagementRate: tp.avgEngagement,
          pieceCount: tp.usageCount,
        });
      });
    });

    return heatmap;
  }

  private performGapAnalysis(
    personas: CustomerPersona[],
    timeRange: { start: string; end: string }
  ): SegmentAnalyticsSummary['gapAnalysis'] {
    const gaps: SegmentAnalyticsSummary['gapAnalysis'] = [];

    personas.forEach(persona => {
      const metrics = this.performanceData.get(persona.id) || [];
      const filtered = metrics.filter(
        m => m.publishedAt >= timeRange.start && m.publishedAt <= timeRange.end
      );

      const lastContentDate = filtered.length > 0
        ? filtered[filtered.length - 1].publishedAt
        : null;

      const daysSince = lastContentDate
        ? Math.floor((new Date().getTime() - new Date(lastContentDate).getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      let recommendation = '';
      if (daysSince > 14) {
        recommendation = 'Critical: Create content immediately to re-engage this segment';
      } else if (daysSince > 7) {
        recommendation = 'Warning: Schedule content within next 3 days';
      } else if (filtered.length < 2) {
        recommendation = 'Increase frequency to at least 2 pieces per week';
      } else {
        recommendation = 'On track: Continue current cadence';
      }

      gaps.push({
        personaId: persona.id,
        personaName: persona.name,
        lastContentDate,
        daysSinceLastContent: daysSince,
        recommendedAction: recommendation,
      });
    });

    return gaps.sort((a, b) => b.daysSinceLastContent - a.daysSinceLastContent);
  }

  private analyzeTriggerEffectiveness(
    personas: CustomerPersona[],
    timeRange: { start: string; end: string }
  ): SegmentAnalyticsSummary['triggerEffectiveness'] {
    const effectiveness: SegmentAnalyticsSummary['triggerEffectiveness'] = [];

    personas.forEach(persona => {
      const metrics = this.performanceData.get(persona.id) || [];
      const filtered = metrics.filter(
        m => m.publishedAt >= timeRange.start && m.publishedAt <= timeRange.end
      );

      const triggerPerformance = this.calculateTriggerPerformance(filtered);

      triggerPerformance.forEach(tp => {
        let recommendation: 'increase' | 'decrease' | 'maintain' = 'maintain';

        if (tp.avgEngagement > 0.05) {
          recommendation = 'increase';
        } else if (tp.avgEngagement < 0.02) {
          recommendation = 'decrease';
        }

        effectiveness.push({
          trigger: tp.trigger,
          personaId: persona.id,
          avgEngagement: tp.avgEngagement,
          avgConversion: tp.avgConversion,
          usageCount: tp.usageCount,
          recommendation,
        });
      });
    });

    return effectiveness;
  }

  private calculateTrend(metrics: PerformanceMetrics[]): 'improving' | 'declining' | 'stable' {
    if (metrics.length < 2) {
      return 'stable';
    }

    // Compare first half to second half
    const mid = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, mid);
    const secondHalf = metrics.slice(mid);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.engagementRate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.engagementRate, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  private identifyMissingOpportunities(persona: CustomerPersona, recentMetrics: PerformanceMetrics[]): string[] {
    const opportunities: string[] = [];
    const usedTriggers = new Set(recentMetrics.map(m => m.trigger));

    // Check for unused high-value triggers
    const highValueTriggers: EmotionalTrigger[] = ['trust', 'authority', 'hope', 'opportunity'];

    highValueTriggers.forEach(trigger => {
      if (!usedTriggers.has(trigger)) {
        opportunities.push(`Create ${trigger}-focused content`);
      }
    });

    // Check for under-represented platforms
    const usedPlatforms = new Set(recentMetrics.map(m => m.platform));
    const platforms = ['linkedin', 'instagram', 'facebook'];

    platforms.forEach(platform => {
      if (!usedPlatforms.has(platform)) {
        opportunities.push(`Expand to ${platform}`);
      }
    });

    return opportunities.slice(0, 3);
  }

  private getPlatformRecommendation(
    platform: { platform: string; engagementRate: number },
    avgEngagement: number
  ): string {
    const diff = platform.engagementRate - avgEngagement;

    if (diff > 0.02) {
      return `Excellent performance - increase ${platform.platform} content frequency`;
    } else if (diff < -0.02) {
      return `Below average - review ${platform.platform} strategy or reduce frequency`;
    }
    return `On par with average - maintain current ${platform.platform} approach`;
  }
}

// Singleton instance
export const segmentAnalyticsService = new SegmentAnalyticsService();
