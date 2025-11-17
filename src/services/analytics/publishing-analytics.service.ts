/**
 * Publishing Analytics Service
 *
 * Tracks publishing success/failure rates and provides metrics dashboard.
 *
 * Features:
 * - Track publishing events (scheduled, published, failed)
 * - Calculate success rates by platform, campaign type, time of day
 * - Store in analytics_events table
 * - Generate insights for optimization
 */

import { supabase } from '@/lib/supabase';
import type { Platform } from '../socialpilot.service';

//=============================================================================
// Types & Interfaces
//=============================================================================

export interface PublishingEvent {
  id?: string;
  postId: string;
  campaignId?: string;
  platform: Platform;
  status: 'scheduled' | 'published' | 'failed';
  scheduledFor: Date;
  publishedAt?: Date;
  error?: string;
  brandId: string;
  metadata?: Record<string, any>;
}

export interface PublishingMetrics {
  brandId: string;
  timeframe: '7d' | '30d' | '90d';

  // Overall metrics
  totalScheduled: number;
  totalPublished: number;
  totalFailed: number;
  successRate: number;

  // By platform
  byPlatform: Record<Platform, PlatformMetrics>;

  // By time of day
  byTimeOfDay: Record<string, TimeMetrics>;

  // By campaign type
  byCampaignType: Record<string, CampaignTypeMetrics>;

  // Trends
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
}

export interface PlatformMetrics {
  platform: Platform;
  scheduled: number;
  published: number;
  failed: number;
  successRate: number;
  avgPublishDelay: number; // minutes
  topErrors: Array<{ error: string; count: number }>;
}

export interface TimeMetrics {
  timeSlot: string; // e.g., "09:00-12:00"
  scheduled: number;
  published: number;
  successRate: number;
}

export interface CampaignTypeMetrics {
  campaignType: string;
  scheduled: number;
  published: number;
  successRate: number;
}

export interface AnalyticsInsight {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
}

//=============================================================================
// Publishing Analytics Service
//=============================================================================

export class PublishingAnalytics {
  /**
   * Track a publishing event
   */
  async trackPublishEvent(event: PublishingEvent): Promise<void> {
    console.log(`[PublishingAnalytics] Tracking ${event.status} event for post ${event.postId}`);

    try {
      // Store in analytics_events table
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'publishing',
          event_data: {
            postId: event.postId,
            campaignId: event.campaignId,
            platform: event.platform,
            status: event.status,
            scheduledFor: event.scheduledFor.toISOString(),
            publishedAt: event.publishedAt?.toISOString(),
            error: event.error,
            metadata: event.metadata,
          },
          brand_id: event.brandId,
        });

      if (error) {
        console.error('[PublishingAnalytics] Failed to track event:', error);
        throw error;
      }

      console.log(`[PublishingAnalytics] ✓ Event tracked successfully`);
    } catch (error) {
      console.error('[PublishingAnalytics] Track event error:', error);
      throw error;
    }
  }

  /**
   * Get success rate for a brand over a timeframe
   */
  async getSuccessRate(brandId: string, timeframe: '7d' | '30d' | '90d' = '7d'): Promise<number> {
    try {
      const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('brand_id', brandId)
        .eq('event_type', 'publishing')
        .gte('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('[PublishingAnalytics] Failed to fetch success rate:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      const publishedCount = data.filter(
        (event) => event.event_data?.status === 'published'
      ).length;

      const totalCount = data.length;

      return totalCount > 0 ? (publishedCount / totalCount) * 100 : 0;
    } catch (error) {
      console.error('[PublishingAnalytics] Get success rate error:', error);
      return 0;
    }
  }

  /**
   * Get failure counts by platform
   */
  async getFailuresByPlatform(brandId: string): Promise<Record<Platform, number>> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('brand_id', brandId)
        .eq('event_type', 'publishing');

      if (error) {
        console.error('[PublishingAnalytics] Failed to fetch failures:', error);
        return {} as Record<Platform, number>;
      }

      const failures: Record<Platform, number> = {
        facebook: 0,
        twitter: 0,
        linkedin: 0,
        instagram: 0,
        tiktok: 0,
        pinterest: 0,
        youtube: 0,
      };

      data?.forEach((event) => {
        const eventData = event.event_data;
        if (eventData?.status === 'failed' && eventData?.platform) {
          failures[eventData.platform as Platform]++;
        }
      });

      return failures;
    } catch (error) {
      console.error('[PublishingAnalytics] Get failures by platform error:', error);
      return {} as Record<Platform, number>;
    }
  }

  /**
   * Get comprehensive publishing metrics
   */
  async getPublishingMetrics(
    brandId: string,
    timeframe: '7d' | '30d' | '90d' = '7d'
  ): Promise<PublishingMetrics> {
    console.log(`[PublishingAnalytics] Fetching metrics for brand ${brandId}, timeframe ${timeframe}`);

    try {
      const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      // Fetch all events for timeframe
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('event_data, created_at')
        .eq('brand_id', brandId)
        .eq('event_type', 'publishing')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PublishingAnalytics] Failed to fetch metrics:', error);
        throw error;
      }

      // Initialize metrics
      const metrics: PublishingMetrics = {
        brandId,
        timeframe,
        totalScheduled: 0,
        totalPublished: 0,
        totalFailed: 0,
        successRate: 0,
        byPlatform: this.initializePlatformMetrics(),
        byTimeOfDay: {},
        byCampaignType: {},
        trend: 'stable',
        trendPercentage: 0,
      };

      // Process events
      events?.forEach((event) => {
        const eventData = event.event_data;
        const status = eventData?.status;

        if (status === 'scheduled') metrics.totalScheduled++;
        if (status === 'published') metrics.totalPublished++;
        if (status === 'failed') metrics.totalFailed++;

        // By platform
        const platform = eventData?.platform as Platform;
        if (platform && metrics.byPlatform[platform]) {
          if (status === 'scheduled') metrics.byPlatform[platform].scheduled++;
          if (status === 'published') metrics.byPlatform[platform].published++;
          if (status === 'failed') {
            metrics.byPlatform[platform].failed++;
            // Track error
            const error = eventData?.error || 'Unknown error';
            const existingError = metrics.byPlatform[platform].topErrors.find(
              (e) => e.error === error
            );
            if (existingError) {
              existingError.count++;
            } else {
              metrics.byPlatform[platform].topErrors.push({ error, count: 1 });
            }
          }
        }

        // By time of day
        if (eventData?.scheduledFor) {
          const hour = new Date(eventData.scheduledFor).getHours();
          const timeSlot = this.getTimeSlot(hour);
          if (!metrics.byTimeOfDay[timeSlot]) {
            metrics.byTimeOfDay[timeSlot] = {
              timeSlot,
              scheduled: 0,
              published: 0,
              successRate: 0,
            };
          }
          if (status === 'scheduled') metrics.byTimeOfDay[timeSlot].scheduled++;
          if (status === 'published') metrics.byTimeOfDay[timeSlot].published++;
        }

        // By campaign type (if available)
        const campaignType = eventData?.metadata?.campaignType || 'unknown';
        if (!metrics.byCampaignType[campaignType]) {
          metrics.byCampaignType[campaignType] = {
            campaignType,
            scheduled: 0,
            published: 0,
            successRate: 0,
          };
        }
        if (status === 'scheduled') metrics.byCampaignType[campaignType].scheduled++;
        if (status === 'published') metrics.byCampaignType[campaignType].published++;
      });

      // Calculate success rates
      metrics.successRate =
        metrics.totalScheduled > 0
          ? (metrics.totalPublished / metrics.totalScheduled) * 100
          : 0;

      // Platform success rates
      Object.keys(metrics.byPlatform).forEach((platform) => {
        const platformMetrics = metrics.byPlatform[platform as Platform];
        platformMetrics.successRate =
          platformMetrics.scheduled > 0
            ? (platformMetrics.published / platformMetrics.scheduled) * 100
            : 0;

        // Sort top errors by count
        platformMetrics.topErrors.sort((a, b) => b.count - a.count);
        platformMetrics.topErrors = platformMetrics.topErrors.slice(0, 5);
      });

      // Time of day success rates
      Object.keys(metrics.byTimeOfDay).forEach((timeSlot) => {
        const timeMetrics = metrics.byTimeOfDay[timeSlot];
        timeMetrics.successRate =
          timeMetrics.scheduled > 0
            ? (timeMetrics.published / timeMetrics.scheduled) * 100
            : 0;
      });

      // Campaign type success rates
      Object.keys(metrics.byCampaignType).forEach((campaignType) => {
        const campaignMetrics = metrics.byCampaignType[campaignType];
        campaignMetrics.successRate =
          campaignMetrics.scheduled > 0
            ? (campaignMetrics.published / campaignMetrics.scheduled) * 100
            : 0;
      });

      // Calculate trend
      metrics.trend = await this.calculateTrend(brandId, timeframe);

      console.log(`[PublishingAnalytics] ✓ Metrics calculated: ${metrics.successRate.toFixed(1)}% success rate`);

      return metrics;
    } catch (error) {
      console.error('[PublishingAnalytics] Get publishing metrics error:', error);
      throw error;
    }
  }

  /**
   * Generate actionable insights from metrics
   */
  async generateInsights(metrics: PublishingMetrics): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    // Check overall success rate
    if (metrics.successRate < 90) {
      insights.push({
        type: 'warning',
        title: 'Low Success Rate',
        description: `Your publishing success rate is ${metrics.successRate.toFixed(1)}%. This is below the recommended 95%+.`,
        recommendation: 'Check your SocialPilot connection and review failed posts for common errors.',
        priority: 'high',
      });
    } else if (metrics.successRate >= 98) {
      insights.push({
        type: 'success',
        title: 'Excellent Success Rate',
        description: `Your publishing success rate is ${metrics.successRate.toFixed(1)}%! Keep up the great work.`,
        priority: 'low',
      });
    }

    // Check platform-specific issues
    Object.entries(metrics.byPlatform).forEach(([platform, platformMetrics]) => {
      if (platformMetrics.failed > 5 && platformMetrics.successRate < 85) {
        insights.push({
          type: 'error',
          title: `${platform} Publishing Issues`,
          description: `${platform} has ${platformMetrics.failed} failed posts (${platformMetrics.successRate.toFixed(1)}% success rate).`,
          recommendation: `Top error: ${platformMetrics.topErrors[0]?.error || 'Unknown'}. Reconnect your ${platform} account.`,
          priority: 'high',
        });
      }
    });

    // Check best performing time slots
    const bestTimeSlot = Object.entries(metrics.byTimeOfDay)
      .sort((a, b) => b[1].successRate - a[1].successRate)[0];

    if (bestTimeSlot && bestTimeSlot[1].successRate > 95) {
      insights.push({
        type: 'info',
        title: 'Optimal Posting Time',
        description: `Posts scheduled for ${bestTimeSlot[0]} have a ${bestTimeSlot[1].successRate.toFixed(1)}% success rate.`,
        recommendation: 'Consider scheduling more posts during this time window.',
        priority: 'medium',
      });
    }

    // Check trend
    if (metrics.trend === 'declining') {
      insights.push({
        type: 'warning',
        title: 'Declining Performance',
        description: 'Your publishing performance has declined recently.',
        recommendation: 'Review recent changes and check for API issues or account limitations.',
        priority: 'high',
      });
    } else if (metrics.trend === 'improving') {
      insights.push({
        type: 'success',
        title: 'Performance Improving',
        description: 'Your publishing performance is on an upward trend!',
        priority: 'low',
      });
    }

    return insights;
  }

  /**
   * Helper: Initialize platform metrics structure
   */
  private initializePlatformMetrics(): Record<Platform, PlatformMetrics> {
    const platforms: Platform[] = [
      'facebook',
      'twitter',
      'linkedin',
      'instagram',
      'tiktok',
      'pinterest',
      'youtube',
    ];

    const metrics: Record<Platform, PlatformMetrics> = {} as Record<Platform, PlatformMetrics>;

    platforms.forEach((platform) => {
      metrics[platform] = {
        platform,
        scheduled: 0,
        published: 0,
        failed: 0,
        successRate: 0,
        avgPublishDelay: 0,
        topErrors: [],
      };
    });

    return metrics;
  }

  /**
   * Helper: Get time slot for an hour (0-23)
   */
  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 9) return '06:00-09:00';
    if (hour >= 9 && hour < 12) return '09:00-12:00';
    if (hour >= 12 && hour < 15) return '12:00-15:00';
    if (hour >= 15 && hour < 18) return '15:00-18:00';
    if (hour >= 18 && hour < 21) return '18:00-21:00';
    if (hour >= 21 || hour < 6) return '21:00-06:00';
    return 'unknown';
  }

  /**
   * Helper: Calculate trend (improving, declining, stable)
   */
  private async calculateTrend(
    brandId: string,
    timeframe: '7d' | '30d' | '90d'
  ): Promise<'improving' | 'declining' | 'stable'> {
    try {
      // Get current period success rate
      const currentRate = await this.getSuccessRate(brandId, timeframe);

      // Get previous period success rate
      const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const previousCutoff = new Date();
      previousCutoff.setDate(previousCutoff.getDate() - daysAgo * 2);
      const currentCutoff = new Date();
      currentCutoff.setDate(currentCutoff.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('brand_id', brandId)
        .eq('event_type', 'publishing')
        .gte('created_at', previousCutoff.toISOString())
        .lt('created_at', currentCutoff.toISOString());

      if (error || !data || data.length === 0) {
        return 'stable';
      }

      const previousPublished = data.filter(
        (event) => event.event_data?.status === 'published'
      ).length;
      const previousTotal = data.length;
      const previousRate = previousTotal > 0 ? (previousPublished / previousTotal) * 100 : 0;

      // Compare rates
      const diff = currentRate - previousRate;

      if (diff > 5) return 'improving';
      if (diff < -5) return 'declining';
      return 'stable';
    } catch (error) {
      console.error('[PublishingAnalytics] Calculate trend error:', error);
      return 'stable';
    }
  }
}

//=============================================================================
// Utility Functions
//=============================================================================

/**
 * Create singleton instance
 */
let publishingAnalyticsInstance: PublishingAnalytics | null = null;

export function createPublishingAnalytics(): PublishingAnalytics {
  if (!publishingAnalyticsInstance) {
    publishingAnalyticsInstance = new PublishingAnalytics();
  }
  return publishingAnalyticsInstance;
}
