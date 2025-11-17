/**
 * Industry Benchmark Database
 * Real-world performance benchmarks by industry and platform
 *
 * Data sources:
 * - Facebook: 1-2% engagement (organic)
 * - Instagram: 2-3% engagement (organic), 4-5% (Reels)
 * - TikTok: 5-8% engagement
 * - LinkedIn: 2-3% engagement (B2B)
 * - Video: 10x+ engagement vs static
 * - UGC: 30% engagement boost
 * - GMB: 5x local visibility
 *
 * Ad costs (2025):
 * - Stories: $0.50-$2 CPM
 * - Feed: $8-$15 CPM
 * - Conversion rates: Social→Email 2-5%, Email→Sale 2-3%
 */

import {
  IndustryBenchmark,
  PlatformBenchmark,
  ContentTypeBenchmark,
  ConversionBenchmark,
  AdCostBenchmark,
  OptimalPostingTimes,
  BenchmarkRange,
  SocialPlatform,
  ServiceResponse,
} from '../../types/benchmarks.types';

export class IndustryBenchmarkDatabase {
  /**
   * Get benchmarks for a specific industry
   */
  getBenchmarks(industry: string): ServiceResponse<IndustryBenchmark> {
    try {
      const normalizedIndustry = this.normalizeIndustry(industry);
      const benchmarks = this.industryData[normalizedIndustry] || this.industryData.general;

      return {
        success: true,
        data: benchmarks,
        metadata: {
          industry: normalizedIndustry,
          lastUpdated: '2025-01',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get benchmarks',
      };
    }
  }

  /**
   * Get platform-specific benchmarks
   */
  getPlatformBenchmark(
    industry: string,
    platform: SocialPlatform
  ): ServiceResponse<PlatformBenchmark> {
    try {
      const benchmarkResult = this.getBenchmarks(industry);
      if (!benchmarkResult.success || !benchmarkResult.data) {
        throw new Error('Failed to load industry benchmarks');
      }

      const platformBenchmark = benchmarkResult.data.platforms.find(
        (p) => p.platform === platform
      );

      if (!platformBenchmark) {
        throw new Error(`No benchmark data for platform: ${platform}`);
      }

      return {
        success: true,
        data: platformBenchmark,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get platform benchmark',
      };
    }
  }

  /**
   * Get ad cost benchmarks
   */
  getAdCostBenchmarks(platform: SocialPlatform): ServiceResponse<AdCostBenchmark[]> {
    try {
      const costs = this.adCostData[platform];
      if (!costs) {
        throw new Error(`No ad cost data for platform: ${platform}`);
      }

      return {
        success: true,
        data: costs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get ad costs',
      };
    }
  }

  /**
   * Get optimal posting times
   */
  getOptimalPostingTimes(
    industry: string,
    platform: SocialPlatform
  ): ServiceResponse<OptimalPostingTimes> {
    try {
      const benchmarkResult = this.getBenchmarks(industry);
      if (!benchmarkResult.success || !benchmarkResult.data) {
        throw new Error('Failed to load industry benchmarks');
      }

      const optimalTimes = benchmarkResult.data.optimalTimes.find(
        (t) => t.platform === platform
      );

      if (!optimalTimes) {
        // Return general best practices if no industry-specific data
        return {
          success: true,
          data: this.getGeneralOptimalTimes(platform),
        };
      }

      return {
        success: true,
        data: optimalTimes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get optimal times',
      };
    }
  }

  // ============================================================================
  // Private Data - Industry Benchmarks
  // ============================================================================

  private readonly industryData: Record<string, IndustryBenchmark> = {
    restaurant: {
      industry: 'restaurant',
      platforms: [
        {
          platform: 'facebook',
          engagementRate: { min: 1.0, max: 2.5, average: 1.5, unit: '%' },
          postFrequency: { min: 3, max: 7, optimal: 5, unit: 'per_week' },
          reachRate: { min: 5, max: 15, average: 10, unit: '%' },
          videoBoost: 12, // 12x engagement for food videos
          ugcBoost: 35, // Food photos = high UGC value
        },
        {
          platform: 'instagram',
          engagementRate: { min: 2.5, max: 4.5, average: 3.2, unit: '%' },
          postFrequency: { min: 1, max: 2, optimal: 1, unit: 'per_day' },
          reachRate: { min: 8, max: 20, average: 12, unit: '%' },
          videoBoost: 15, // Reels perform extremely well for food
          ugcBoost: 40,
        },
        {
          platform: 'tiktok',
          engagementRate: { min: 5, max: 12, average: 7.5, unit: '%' },
          postFrequency: { min: 1, max: 3, optimal: 2, unit: 'per_day' },
          reachRate: { min: 15, max: 50, average: 25, unit: '%' },
          videoBoost: 1, // Already video-first
          ugcBoost: 30,
        },
        {
          platform: 'google_business',
          engagementRate: { min: 3, max: 8, average: 5, unit: '%' },
          postFrequency: { min: 2, max: 4, optimal: 3, unit: 'per_week' },
          reachRate: { min: 20, max: 60, average: 35, unit: '%' },
          videoBoost: 8,
          ugcBoost: 25,
        },
      ],
      contentTypes: this.getContentTypeBenchmarks('restaurant'),
      conversions: this.getConversionBenchmarks('restaurant'),
      adCosts: [],
      optimalTimes: this.getOptimalTimesForIndustry('restaurant'),
    },

    retail: {
      industry: 'retail',
      platforms: [
        {
          platform: 'facebook',
          engagementRate: { min: 0.8, max: 2.0, average: 1.3, unit: '%' },
          postFrequency: { min: 3, max: 7, optimal: 4, unit: 'per_week' },
          reachRate: { min: 4, max: 12, average: 8, unit: '%' },
          videoBoost: 10,
          ugcBoost: 30,
        },
        {
          platform: 'instagram',
          engagementRate: { min: 2.0, max: 4.0, average: 2.8, unit: '%' },
          postFrequency: { min: 1, max: 2, optimal: 1, unit: 'per_day' },
          reachRate: { min: 6, max: 18, average: 11, unit: '%' },
          videoBoost: 12,
          ugcBoost: 35,
        },
        {
          platform: 'tiktok',
          engagementRate: { min: 4, max: 10, average: 6.5, unit: '%' },
          postFrequency: { min: 1, max: 3, optimal: 2, unit: 'per_day' },
          reachRate: { min: 12, max: 45, average: 22, unit: '%' },
          videoBoost: 1,
          ugcBoost: 28,
        },
      ],
      contentTypes: this.getContentTypeBenchmarks('retail'),
      conversions: this.getConversionBenchmarks('retail'),
      adCosts: [],
      optimalTimes: this.getOptimalTimesForIndustry('retail'),
    },

    'b2b': {
      industry: 'b2b',
      platforms: [
        {
          platform: 'linkedin',
          engagementRate: { min: 2.0, max: 3.5, average: 2.6, unit: '%' },
          postFrequency: { min: 3, max: 5, optimal: 4, unit: 'per_week' },
          reachRate: { min: 8, max: 22, average: 14, unit: '%' },
          videoBoost: 8,
          ugcBoost: 20, // Lower UGC impact in B2B
        },
        {
          platform: 'facebook',
          engagementRate: { min: 0.5, max: 1.5, average: 0.9, unit: '%' },
          postFrequency: { min: 2, max: 5, optimal: 3, unit: 'per_week' },
          reachRate: { min: 3, max: 10, average: 6, unit: '%' },
          videoBoost: 7,
          ugcBoost: 15,
        },
        {
          platform: 'twitter',
          engagementRate: { min: 0.5, max: 2.0, average: 1.1, unit: '%' },
          postFrequency: { min: 3, max: 10, optimal: 5, unit: 'per_week' },
          reachRate: { min: 2, max: 8, average: 4, unit: '%' },
          videoBoost: 6,
          ugcBoost: 10,
        },
      ],
      contentTypes: this.getContentTypeBenchmarks('b2b'),
      conversions: this.getConversionBenchmarks('b2b'),
      adCosts: [],
      optimalTimes: this.getOptimalTimesForIndustry('b2b'),
    },

    fitness: {
      industry: 'fitness',
      platforms: [
        {
          platform: 'instagram',
          engagementRate: { min: 3.0, max: 5.5, average: 4.0, unit: '%' },
          postFrequency: { min: 1, max: 2, optimal: 1, unit: 'per_day' },
          reachRate: { min: 10, max: 25, average: 15, unit: '%' },
          videoBoost: 18, // Transformation videos crush it
          ugcBoost: 45, // Before/after = gold
        },
        {
          platform: 'tiktok',
          engagementRate: { min: 6, max: 15, average: 9, unit: '%' },
          postFrequency: { min: 1, max: 3, optimal: 2, unit: 'per_day' },
          reachRate: { min: 18, max: 60, average: 30, unit: '%' },
          videoBoost: 1,
          ugcBoost: 40,
        },
        {
          platform: 'facebook',
          engagementRate: { min: 1.5, max: 3.0, average: 2.1, unit: '%' },
          postFrequency: { min: 3, max: 7, optimal: 5, unit: 'per_week' },
          reachRate: { min: 6, max: 16, average: 10, unit: '%' },
          videoBoost: 14,
          ugcBoost: 38,
        },
      ],
      contentTypes: this.getContentTypeBenchmarks('fitness'),
      conversions: this.getConversionBenchmarks('fitness'),
      adCosts: [],
      optimalTimes: this.getOptimalTimesForIndustry('fitness'),
    },

    general: {
      industry: 'general',
      platforms: [
        {
          platform: 'facebook',
          engagementRate: { min: 1.0, max: 2.0, average: 1.4, unit: '%' },
          postFrequency: { min: 3, max: 7, optimal: 4, unit: 'per_week' },
          reachRate: { min: 5, max: 12, average: 8, unit: '%' },
          videoBoost: 10,
          ugcBoost: 30,
        },
        {
          platform: 'instagram',
          engagementRate: { min: 2.0, max: 3.0, average: 2.4, unit: '%' },
          postFrequency: { min: 1, max: 2, optimal: 1, unit: 'per_day' },
          reachRate: { min: 7, max: 18, average: 11, unit: '%' },
          videoBoost: 12,
          ugcBoost: 30,
        },
        {
          platform: 'tiktok',
          engagementRate: { min: 5.0, max: 8.0, average: 6.2, unit: '%' },
          postFrequency: { min: 1, max: 3, optimal: 2, unit: 'per_day' },
          reachRate: { min: 15, max: 50, average: 25, unit: '%' },
          videoBoost: 1,
          ugcBoost: 30,
        },
        {
          platform: 'linkedin',
          engagementRate: { min: 1.5, max: 3.0, average: 2.1, unit: '%' },
          postFrequency: { min: 3, max: 5, optimal: 4, unit: 'per_week' },
          reachRate: { min: 6, max: 20, average: 12, unit: '%' },
          videoBoost: 8,
          ugcBoost: 20,
        },
      ],
      contentTypes: this.getContentTypeBenchmarks('general'),
      conversions: this.getConversionBenchmarks('general'),
      adCosts: [],
      optimalTimes: this.getOptimalTimesForIndustry('general'),
    },
  };

  // ============================================================================
  // Ad Cost Data (2025)
  // ============================================================================

  private readonly adCostData: Record<SocialPlatform, AdCostBenchmark[]> = {
    facebook: [
      {
        platform: 'facebook',
        adType: 'feed',
        cpm: { min: 8.0, max: 15.0, average: 11.5, unit: 'USD' },
        cpc: { min: 0.50, max: 2.50, average: 1.20, unit: 'USD' },
        ctr: { min: 0.8, max: 2.0, average: 1.3, unit: '%' },
        minBudget: 5,
      },
      {
        platform: 'facebook',
        adType: 'stories',
        cpm: { min: 0.50, max: 2.00, average: 1.10, unit: 'USD' },
        cpc: { min: 0.25, max: 1.50, average: 0.75, unit: 'USD' },
        ctr: { min: 1.0, max: 3.0, average: 1.8, unit: '%' },
        minBudget: 5,
      },
    ],
    instagram: [
      {
        platform: 'instagram',
        adType: 'feed',
        cpm: { min: 5.0, max: 12.0, average: 8.0, unit: 'USD' },
        cpc: { min: 0.40, max: 2.00, average: 0.90, unit: 'USD' },
        ctr: { min: 0.9, max: 2.5, average: 1.5, unit: '%' },
        minBudget: 5,
      },
      {
        platform: 'instagram',
        adType: 'stories',
        cpm: { min: 0.50, max: 2.00, average: 1.20, unit: 'USD' },
        cpc: { min: 0.30, max: 1.50, average: 0.80, unit: 'USD' },
        ctr: { min: 1.2, max: 3.5, average: 2.0, unit: '%' },
        minBudget: 5,
      },
      {
        platform: 'instagram',
        adType: 'reel',
        cpm: { min: 0.75, max: 3.00, average: 1.60, unit: 'USD' },
        cpc: { min: 0.35, max: 1.80, average: 0.95, unit: 'USD' },
        ctr: { min: 1.5, max: 4.0, average: 2.4, unit: '%' },
        minBudget: 5,
      },
    ],
    tiktok: [
      {
        platform: 'tiktok',
        adType: 'video',
        cpm: { min: 1.00, max: 4.00, average: 2.20, unit: 'USD' },
        cpc: { min: 0.20, max: 1.50, average: 0.60, unit: 'USD' },
        ctr: { min: 2.0, max: 5.0, average: 3.2, unit: '%' },
        minBudget: 20,
      },
    ],
    linkedin: [
      {
        platform: 'linkedin',
        adType: 'feed',
        cpm: { min: 18.0, max: 35.0, average: 25.0, unit: 'USD' },
        cpc: { min: 2.00, max: 8.00, average: 4.50, unit: 'USD' },
        ctr: { min: 0.4, max: 1.2, average: 0.7, unit: '%' },
        minBudget: 10,
      },
    ],
    twitter: [],
    youtube: [],
    google_business: [],
  };

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private normalizeIndustry(industry: string): string {
    const normalized = industry.toLowerCase().trim();
    const mapping: Record<string, string> = {
      'food': 'restaurant',
      'dining': 'restaurant',
      'cafe': 'restaurant',
      'coffee': 'restaurant',
      'shop': 'retail',
      'store': 'retail',
      'boutique': 'retail',
      'ecommerce': 'retail',
      'gym': 'fitness',
      'wellness': 'fitness',
      'health': 'fitness',
      'consulting': 'b2b',
      'saas': 'b2b',
      'software': 'b2b',
      'services': 'b2b',
    };

    return mapping[normalized] || normalized;
  }

  private getContentTypeBenchmarks(industry: string): ContentTypeBenchmark[] {
    // Content type multipliers relative to static posts
    return [
      {
        type: 'static',
        engagementMultiplier: 1.0,
        platform: 'instagram',
        averageViews: { min: 500, max: 2000, average: 1000 },
      },
      {
        type: 'video',
        engagementMultiplier: 10.0, // 10x for video
        platform: 'instagram',
        averageViews: { min: 5000, max: 20000, average: 10000 },
        completionRate: { min: 40, max: 70, average: 55, unit: '%' },
      },
      {
        type: 'reel',
        engagementMultiplier: 12.0,
        platform: 'instagram',
        averageViews: { min: 8000, max: 50000, average: 20000 },
        completionRate: { min: 50, max: 80, average: 65, unit: '%' },
      },
      {
        type: 'carousel',
        engagementMultiplier: 1.5,
        platform: 'instagram',
        averageViews: { min: 750, max: 3000, average: 1500 },
      },
      {
        type: 'story',
        engagementMultiplier: 0.8,
        platform: 'instagram',
        averageViews: { min: 300, max: 1500, average: 700 },
      },
    ];
  }

  private getConversionBenchmarks(industry: string): ConversionBenchmark[] {
    return [
      {
        funnel: 'Social → Email',
        rate: { min: 2.0, max: 5.0, average: 3.2, unit: '%' },
        avgTimeToConvert: 1,
        topChannels: ['instagram', 'facebook'],
      },
      {
        funnel: 'Email → Sale',
        rate: { min: 2.0, max: 3.0, average: 2.4, unit: '%' },
        avgTimeToConvert: 7,
        topChannels: ['instagram', 'facebook'],
      },
      {
        funnel: 'Social → Sale',
        rate: { min: 0.5, max: 1.5, average: 0.8, unit: '%' },
        avgTimeToConvert: 3,
        topChannels: ['instagram', 'facebook', 'tiktok'],
      },
    ];
  }

  private getOptimalTimesForIndustry(industry: string): OptimalPostingTimes[] {
    // General best practices - can be customized per industry
    return [
      {
        platform: 'instagram',
        dayOfWeek: 3, // Wednesday
        timeRanges: [
          { start: '11:00', end: '13:00', priority: 'high' },
          { start: '19:00', end: '21:00', priority: 'high' },
        ],
        timezone: 'America/New_York',
      },
      {
        platform: 'facebook',
        dayOfWeek: 2, // Tuesday
        timeRanges: [
          { start: '13:00', end: '15:00', priority: 'high' },
          { start: '18:00', end: '20:00', priority: 'medium' },
        ],
        timezone: 'America/New_York',
      },
      {
        platform: 'tiktok',
        dayOfWeek: 5, // Friday
        timeRanges: [
          { start: '18:00', end: '22:00', priority: 'high' },
        ],
        timezone: 'America/New_York',
      },
      {
        platform: 'linkedin',
        dayOfWeek: 3, // Wednesday
        timeRanges: [
          { start: '07:00', end: '09:00', priority: 'high' },
          { start: '12:00', end: '13:00', priority: 'medium' },
        ],
        timezone: 'America/New_York',
      },
    ];
  }

  private getGeneralOptimalTimes(platform: SocialPlatform): OptimalPostingTimes {
    const times = this.getOptimalTimesForIndustry('general');
    return times.find((t) => t.platform === platform) || times[0];
  }
}

// Singleton export
export const industryBenchmarkDatabase = new IndustryBenchmarkDatabase();
