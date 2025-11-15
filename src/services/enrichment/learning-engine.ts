/**
 * Learning Engine Service - Learns from performance data to optimize future content
 * Phase 15: Background Jobs and Enrichment Engine
 */

import { supabase } from '@/lib/supabase';
import type {
  LearningPattern,
  ContentPattern,
  TimingPattern,
  PlatformPattern,
  AudiencePattern,
} from '@/types/enrichment.types';

interface Pattern {
  type: 'content' | 'timing' | 'platform' | 'audience';
  category: string;
  insight: string;
  data_points: number;
  confidence_score: number;
  actionable_recommendation: string;
  metadata: Record<string, any>;
}

export class LearningEngine {
  /**
   * Detect content patterns - what content formats/topics perform best
   */
  static async detectContentPatterns(brandId: string): Promise<ContentPattern[]> {
    const patterns: ContentPattern[] = [];

    try {
      // Get historical content performance data
      const performanceData = await this.getContentPerformanceData(brandId);

      if (performanceData.length === 0) return patterns;

      // Group by content format
      const formatGroups = this.groupByFormat(performanceData);

      for (const [format, items] of Object.entries(formatGroups)) {
        const avgEngagement = this.calculateAverageEngagement(items);
        const topTopics = this.extractTopTopics(items);
        const powerWords = this.extractPowerWords(items);
        const hashtagPerf = this.analyzeHashtagPerformance(items);

        const pattern: ContentPattern = {
          format,
          average_engagement: avgEngagement,
          best_performing_topics: topTopics,
          optimal_length: this.calculateOptimalLength(items),
          power_words: powerWords,
          hashtag_performance: hashtagPerf,
        };

        patterns.push(pattern);

        // Store as learning pattern
        await this.storePattern(brandId, {
          type: 'content',
          category: format,
          insight: `${format} content achieves ${avgEngagement.toFixed(1)}% average engagement`,
          data_points: items.length,
          confidence_score: this.calculateConfidence(items.length),
          actionable_recommendation: `Create more ${format} content about ${topTopics[0]}`,
          metadata: pattern,
        });
      }
    } catch (error) {
      console.error('Error detecting content patterns:', error);
    }

    return patterns;
  }

  /**
   * Detect timing patterns - best times to post on each platform
   */
  static async detectTimingPatterns(brandId: string): Promise<TimingPattern[]> {
    const patterns: TimingPattern[] = [];

    try {
      const performanceData = await this.getContentPerformanceData(brandId);

      if (performanceData.length === 0) return patterns;

      // Group by platform
      const platformGroups = this.groupByPlatform(performanceData);

      for (const [platform, items] of Object.entries(platformGroups)) {
        const timingAnalysis = this.analyzePostingTimes(items);

        const pattern: TimingPattern = {
          platform,
          best_posting_times: timingAnalysis.best_times,
          worst_posting_times: timingAnalysis.worst_times,
          day_of_week_performance: timingAnalysis.day_performance,
          time_zone: 'UTC', // Should be pulled from brand settings
        };

        patterns.push(pattern);

        // Store as learning pattern
        await this.storePattern(brandId, {
          type: 'timing',
          category: platform,
          insight: `Best posting time on ${platform}: ${timingAnalysis.best_times[0]}`,
          data_points: items.length,
          confidence_score: this.calculateConfidence(items.length),
          actionable_recommendation: `Schedule ${platform} posts for ${timingAnalysis.best_times[0]}`,
          metadata: pattern,
        });
      }
    } catch (error) {
      console.error('Error detecting timing patterns:', error);
    }

    return patterns;
  }

  /**
   * Detect platform patterns - which platforms perform best
   */
  static async detectPlatformPatterns(brandId: string): Promise<PlatformPattern[]> {
    const patterns: PlatformPattern[] = [];

    try {
      const performanceData = await this.getContentPerformanceData(brandId);

      if (performanceData.length === 0) return patterns;

      // Group by platform
      const platformGroups = this.groupByPlatform(performanceData);

      for (const [platform, items] of Object.entries(platformGroups)) {
        const engagementRate = this.calculateAverageEngagement(items);
        const bestContentTypes = this.getBestContentTypes(items);
        const audienceDemographics = await this.getAudienceDemographics(
          brandId,
          platform
        );
        const growthRate = this.calculateGrowthRate(items);

        const pattern: PlatformPattern = {
          platform,
          engagement_rate: engagementRate,
          best_content_types: bestContentTypes,
          audience_demographics: audienceDemographics,
          growth_rate: growthRate,
        };

        patterns.push(pattern);

        // Store as learning pattern
        await this.storePattern(brandId, {
          type: 'platform',
          category: platform,
          insight: `${platform} achieves ${engagementRate.toFixed(1)}% engagement with ${growthRate > 0 ? 'growing' : 'declining'} audience`,
          data_points: items.length,
          confidence_score: this.calculateConfidence(items.length),
          actionable_recommendation:
            engagementRate > 5
              ? `Increase content volume on ${platform}`
              : `Optimize content strategy for ${platform}`,
          metadata: pattern,
        });
      }
    } catch (error) {
      console.error('Error detecting platform patterns:', error);
    }

    return patterns;
  }

  /**
   * Detect audience patterns - what resonates with different segments
   */
  static async detectAudiencePatterns(brandId: string): Promise<AudiencePattern[]> {
    const patterns: AudiencePattern[] = [];

    try {
      // Get audience segments
      const segments = await this.getAudienceSegments(brandId);

      for (const segment of segments) {
        const segmentData = await this.getSegmentPerformance(brandId, segment);

        const pattern: AudiencePattern = {
          segment: segment.name,
          interests: segment.interests,
          pain_points: segment.pain_points,
          preferred_content: this.getPreferredContent(segmentData),
          response_to_cta: this.analyzeCTAResponse(segmentData),
        };

        patterns.push(pattern);

        // Store as learning pattern
        await this.storePattern(brandId, {
          type: 'audience',
          category: segment.name,
          insight: `${segment.name} segment prefers ${pattern.preferred_content[0]} content`,
          data_points: segmentData.length,
          confidence_score: this.calculateConfidence(segmentData.length),
          actionable_recommendation: `Create ${pattern.preferred_content[0]} content for ${segment.name}`,
          metadata: pattern,
        });
      }
    } catch (error) {
      console.error('Error detecting audience patterns:', error);
    }

    return patterns;
  }

  /**
   * Calculate confidence score based on data points
   */
  static calculateConfidence(dataPoints: number): number {
    // More data points = higher confidence
    // 0-10 points: 0.3 confidence
    // 10-30 points: 0.5 confidence
    // 30-100 points: 0.7 confidence
    // 100+ points: 0.9 confidence

    if (dataPoints >= 100) return 0.9;
    if (dataPoints >= 30) return 0.7;
    if (dataPoints >= 10) return 0.5;
    return 0.3;
  }

  /**
   * Generate actionable recommendations based on patterns
   */
  static async generateRecommendations(
    brandId: string
  ): Promise<Array<{ type: string; recommendation: string; confidence: number }>> {
    const recommendations: Array<{
      type: string;
      recommendation: string;
      confidence: number;
    }> = [];

    try {
      // Get all learning patterns
      const { data: patterns } = await supabase
        .from('learning_patterns')
        .select('*')
        .eq('brand_id', brandId)
        .gte('confidence_score', 0.5) // Only high-confidence patterns
        .order('confidence_score', { ascending: false });

      if (!patterns) return recommendations;

      // Generate recommendations from patterns
      for (const pattern of patterns) {
        recommendations.push({
          type: pattern.pattern_type,
          recommendation: pattern.actionable_recommendation,
          confidence: pattern.confidence_score,
        });
      }

      // Limit to top 10 most confident recommendations
      return recommendations.slice(0, 10);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return recommendations;
    }
  }

  /**
   * Store a learning pattern
   */
  static async storePattern(brandId: string, pattern: Pattern): Promise<void> {
    try {
      await supabase.from('learning_patterns').upsert(
        {
          brand_id: brandId,
          pattern_type: pattern.type,
          category: pattern.category,
          insight: pattern.insight,
          data_points: pattern.data_points,
          confidence_score: pattern.confidence_score,
          actionable_recommendation: pattern.actionable_recommendation,
          metadata: pattern.metadata,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'brand_id,pattern_type,category',
        }
      );
    } catch (error) {
      console.error('Error storing pattern:', error);
      throw error;
    }
  }

  // Helper methods

  private static async getContentPerformanceData(
    brandId: string
  ): Promise<any[]> {
    // Get content calendar items with analytics
    const { data } = await supabase
      .from('content_calendar_items')
      .select('*, analytics_events(*)')
      .eq('brand_id', brandId)
      .eq('status', 'published')
      .gte(
        'published_at',
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      ); // Last 90 days

    return data || [];
  }

  private static groupByFormat(items: any[]): Record<string, any[]> {
    return items.reduce((acc, item) => {
      const format = item.content_format || 'text';
      if (!acc[format]) acc[format] = [];
      acc[format].push(item);
      return acc;
    }, {});
  }

  private static groupByPlatform(items: any[]): Record<string, any[]> {
    return items.reduce((acc, item) => {
      const platform = item.platform || 'unknown';
      if (!acc[platform]) acc[platform] = [];
      acc[platform].push(item);
      return acc;
    }, {});
  }

  private static calculateAverageEngagement(items: any[]): number {
    if (items.length === 0) return 0;

    const totalEngagement = items.reduce((sum, item) => {
      const likes = item.analytics_events?.[0]?.likes || 0;
      const comments = item.analytics_events?.[0]?.comments || 0;
      const shares = item.analytics_events?.[0]?.shares || 0;
      const impressions = item.analytics_events?.[0]?.impressions || 1;

      return sum + ((likes + comments + shares) / impressions) * 100;
    }, 0);

    return totalEngagement / items.length;
  }

  private static extractTopTopics(items: any[]): string[] {
    // Extract topics from content and rank by engagement
    const topicScores: Record<string, number> = {};

    for (const item of items) {
      const topics = item.topics || [];
      const engagement = this.calculateAverageEngagement([item]);

      for (const topic of topics) {
        topicScores[topic] = (topicScores[topic] || 0) + engagement;
      }
    }

    return Object.entries(topicScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private static extractPowerWords(items: any[]): string[] {
    // Extract words that correlate with high engagement
    // Simplified - real implementation would use NLP
    return ['exclusive', 'new', 'proven', 'guaranteed', 'free'];
  }

  private static analyzeHashtagPerformance(items: any[]): Record<string, number> {
    const hashtagScores: Record<string, number> = {};

    for (const item of items) {
      const hashtags = item.hashtags || [];
      const engagement = this.calculateAverageEngagement([item]);

      for (const hashtag of hashtags) {
        if (!hashtagScores[hashtag]) {
          hashtagScores[hashtag] = engagement;
        } else {
          hashtagScores[hashtag] = (hashtagScores[hashtag] + engagement) / 2;
        }
      }
    }

    return hashtagScores;
  }

  private static calculateOptimalLength(items: any[]): number {
    // Calculate optimal content length based on engagement
    const lengthEngagement = items.map((item) => ({
      length: item.content?.length || 0,
      engagement: this.calculateAverageEngagement([item]),
    }));

    // Find length with highest engagement
    const sorted = lengthEngagement.sort((a, b) => b.engagement - a.engagement);
    return sorted[0]?.length || 280;
  }

  private static analyzePostingTimes(items: any[]): {
    best_times: string[];
    worst_times: string[];
    day_performance: Record<string, number>;
  } {
    const timePerformance: Record<string, number[]> = {};
    const dayPerformance: Record<string, number[]> = {};

    for (const item of items) {
      const publishedAt = new Date(item.published_at);
      const hour = publishedAt.getUTCHours();
      const day = publishedAt.toLocaleDateString('en-US', { weekday: 'long' });
      const engagement = this.calculateAverageEngagement([item]);

      // Track by hour
      const hourKey = `${hour}:00`;
      if (!timePerformance[hourKey]) timePerformance[hourKey] = [];
      timePerformance[hourKey].push(engagement);

      // Track by day
      if (!dayPerformance[day]) dayPerformance[day] = [];
      dayPerformance[day].push(engagement);
    }

    // Calculate averages
    const avgByTime = Object.entries(timePerformance).map(([time, engs]) => ({
      time,
      avg: engs.reduce((a, b) => a + b, 0) / engs.length,
    }));

    const avgByDay = Object.entries(dayPerformance).reduce(
      (acc, [day, engs]) => {
        acc[day] = engs.reduce((a, b) => a + b, 0) / engs.length;
        return acc;
      },
      {} as Record<string, number>
    );

    const sorted = avgByTime.sort((a, b) => b.avg - a.avg);

    return {
      best_times: sorted.slice(0, 3).map((t) => t.time),
      worst_times: sorted.slice(-3).map((t) => t.time),
      day_performance: avgByDay,
    };
  }

  private static getBestContentTypes(items: any[]): string[] {
    const typeScores: Record<string, number> = {};

    for (const item of items) {
      const type = item.content_type || 'text';
      const engagement = this.calculateAverageEngagement([item]);
      typeScores[type] = (typeScores[type] || 0) + engagement;
    }

    return Object.entries(typeScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private static async getAudienceDemographics(
    brandId: string,
    platform: string
  ): Promise<Record<string, any>> {
    // Simplified - real implementation would pull from platform APIs
    return {
      age_range: '25-34',
      gender: { male: 45, female: 55 },
      locations: ['US', 'UK', 'CA'],
    };
  }

  private static calculateGrowthRate(items: any[]): number {
    // Calculate follower/audience growth rate
    // Simplified - real implementation would track historical metrics
    return 5.2; // 5.2% growth
  }

  private static async getAudienceSegments(brandId: string): Promise<any[]> {
    // Get defined audience segments
    const { data } = await supabase
      .from('audience_segments')
      .select('*')
      .eq('brand_id', brandId);

    return data || [];
  }

  private static async getSegmentPerformance(
    brandId: string,
    segment: any
  ): Promise<any[]> {
    // Get performance data for specific segment
    // Simplified - real implementation would filter by segment
    return [];
  }

  private static getPreferredContent(items: any[]): string[] {
    return ['educational', 'entertaining', 'inspirational'];
  }

  private static analyzeCTAResponse(items: any[]): Record<string, number> {
    return {
      'Learn More': 0.12,
      'Shop Now': 0.08,
      'Sign Up': 0.15,
    };
  }
}
