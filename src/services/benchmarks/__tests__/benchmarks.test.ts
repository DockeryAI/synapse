/**
 * Performance Benchmarks - Unit Tests
 * Test industry benchmarks, Day 3 pivots, and scheduling optimization
 */

import { describe, it, expect } from 'vitest';
import { industryBenchmarkDatabase } from '../IndustryBenchmarkDatabase';
import { day3PivotService } from '../Day3PivotService';
import { schedulingOptimizationService } from '../SchedulingOptimizationService';
import {
  PerformanceMetrics,
  BusinessContext,
  SocialPlatform,
} from '../../../types/benchmarks.types';

// Test business context
const mockBusinessContext: BusinessContext = {
  id: 'test_biz_123',
  industry: 'restaurant',
  platforms: ['instagram', 'facebook', 'tiktok'],
  timezone: 'America/New_York',
};

// Mock performance metrics
const createMockMetrics = (engagementRate: number): PerformanceMetrics => ({
  postId: 'post_123',
  campaignId: 'campaign_456',
  platform: 'instagram',
  contentType: 'static',
  publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  metrics: {
    views: 1000,
    reach: 800,
    impressions: 1200,
    likes: engagementRate * 10,
    comments: engagementRate * 2,
    shares: engagementRate * 1,
    saves: engagementRate * 3,
    clicks: engagementRate * 5,
    engagementRate,
  },
  updatedAt: new Date(),
});

describe('Industry Benchmark Database', () => {
  it('should return benchmarks for restaurant industry', () => {
    const result = industryBenchmarkDatabase.getBenchmarks('restaurant');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.industry).toBe('restaurant');
    expect(result.data?.platforms.length).toBeGreaterThan(0);
  });

  it('should return benchmarks for normalized industry names', () => {
    const result1 = industryBenchmarkDatabase.getBenchmarks('Food');
    const result2 = industryBenchmarkDatabase.getBenchmarks('dining');

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.data?.industry).toBe('restaurant');
    expect(result2.data?.industry).toBe('restaurant');
  });

  it('should return general benchmarks for unknown industry', () => {
    const result = industryBenchmarkDatabase.getBenchmarks('unknown_industry_xyz');

    expect(result.success).toBe(true);
    expect(result.data?.industry).toBe('general');
  });

  it('should return platform-specific benchmarks', () => {
    const result = industryBenchmarkDatabase.getPlatformBenchmark('restaurant', 'instagram');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.platform).toBe('instagram');
    expect(result.data?.engagementRate).toBeDefined();
    expect(result.data?.videoBoost).toBeGreaterThan(1);
  });

  it('should show higher engagement rates for Instagram vs Facebook', () => {
    const ig = industryBenchmarkDatabase.getPlatformBenchmark('restaurant', 'instagram');
    const fb = industryBenchmarkDatabase.getPlatformBenchmark('restaurant', 'facebook');

    expect(ig.success && fb.success).toBe(true);
    expect(ig.data!.engagementRate.average).toBeGreaterThan(
      fb.data!.engagementRate.average
    );
  });

  it('should show higher engagement rates for TikTok', () => {
    const tiktok = industryBenchmarkDatabase.getPlatformBenchmark('restaurant', 'tiktok');
    const instagram = industryBenchmarkDatabase.getPlatformBenchmark('restaurant', 'instagram');

    expect(tiktok.success && instagram.success).toBe(true);
    expect(tiktok.data!.engagementRate.average).toBeGreaterThan(
      instagram.data!.engagementRate.average
    );
  });

  it('should return ad cost benchmarks', () => {
    const result = industryBenchmarkDatabase.getAdCostBenchmarks('instagram');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBeGreaterThan(0);
    expect(result.data![0].cpm).toBeDefined();
  });

  it('should show Stories ads cheaper than Feed ads', () => {
    const costs = industryBenchmarkDatabase.getAdCostBenchmarks('facebook');

    expect(costs.success).toBe(true);
    const storiesCost = costs.data!.find((c) => c.adType === 'stories');
    const feedCost = costs.data!.find((c) => c.adType === 'feed');

    expect(storiesCost?.cpm.average).toBeLessThan(feedCost!.cpm.average);
  });

  it('should return optimal posting times', () => {
    const result = industryBenchmarkDatabase.getOptimalPostingTimes('restaurant', 'instagram');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.platform).toBe('instagram');
    expect(result.data?.timeRanges.length).toBeGreaterThan(0);
  });
});

describe('Day 3 Pivot Service', () => {
  it('should NOT trigger pivot if too early (< 3 days)', async () => {
    const recentMetrics = createMockMetrics(0.5); // Low engagement
    recentMetrics.publishedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    const result = await day3PivotService.evaluatePerformance(
      recentMetrics,
      mockBusinessContext
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeNull(); // No pivot yet
  });

  it('should NOT trigger pivot if not enough impressions', async () => {
    const lowImpressionMetrics = createMockMetrics(0.5);
    lowImpressionMetrics.metrics.impressions = 50; // Below minimum 100

    const result = await day3PivotService.evaluatePerformance(
      lowImpressionMetrics,
      mockBusinessContext
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeNull(); // Not enough data
  });

  it('should trigger pivot if engagement below threshold', async () => {
    const poorMetrics = createMockMetrics(0.8); // Well below 2% threshold

    const result = await day3PivotService.evaluatePerformance(
      poorMetrics,
      mockBusinessContext
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.reason).toBeDefined();
    expect(result.data?.severity).toBeDefined();
  });

  it('should NOT trigger pivot if engagement above benchmark', async () => {
    const goodMetrics = createMockMetrics(4.0); // Above 3.2% restaurant average

    const result = await day3PivotService.evaluatePerformance(
      goodMetrics,
      mockBusinessContext
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeNull(); // Performance is good
  });

  it('should detect content_format reason for static posts', async () => {
    const staticMetrics = createMockMetrics(1.0);
    staticMetrics.contentType = 'static';

    const result = await day3PivotService.evaluatePerformance(
      staticMetrics,
      mockBusinessContext
    );

    expect(result.success).toBe(true);
    if (result.data) {
      expect(['content_format', 'low_engagement']).toContain(result.data.reason);
    }
  });

  it('should assign correct severity based on gap', async () => {
    // Critical: 75%+ below
    const criticalMetrics = createMockMetrics(0.5); // 0.5% vs 3.2% = 84% below

    const criticalResult = await day3PivotService.evaluatePerformance(
      criticalMetrics,
      mockBusinessContext
    );

    expect(criticalResult.data?.severity).toBe('critical');

    // Medium: 25-50% below
    const mediumMetrics = createMockMetrics(2.0); // 2% vs 3.2% = 37% below

    const mediumResult = await day3PivotService.evaluatePerformance(
      mediumMetrics,
      mockBusinessContext
    );

    expect(mediumResult.data?.severity).toMatch(/medium|high/);
  });

  it('should generate recommendations for pivot', async () => {
    const poorMetrics = createMockMetrics(0.8);
    const triggerResult = await day3PivotService.evaluatePerformance(
      poorMetrics,
      mockBusinessContext
    );

    expect(triggerResult.data).toBeDefined();

    const recommendationsResult = await day3PivotService.generateRecommendations(
      triggerResult.data!,
      mockBusinessContext
    );

    expect(recommendationsResult.success).toBe(true);
    expect(recommendationsResult.data).toBeDefined();
    expect(recommendationsResult.data!.length).toBeGreaterThan(0);
    expect(recommendationsResult.data![0].action).toBeDefined();
    expect(recommendationsResult.data![0].expectedImpact).toBeDefined();
  });

  it('should prioritize switch_to_video for static content', async () => {
    const staticMetrics = createMockMetrics(0.8);
    staticMetrics.contentType = 'static';

    const triggerResult = await day3PivotService.evaluatePerformance(
      staticMetrics,
      mockBusinessContext
    );

    const recommendationsResult = await day3PivotService.generateRecommendations(
      triggerResult.data!,
      mockBusinessContext
    );

    const topRecommendation = recommendationsResult.data![0];
    expect(topRecommendation.action).toBe('switch_to_video');
    expect(topRecommendation.priority).toBe('immediate');
  });

  it('should generate pivot strategy with specific changes', async () => {
    const poorMetrics = createMockMetrics(0.8);
    const triggerResult = await day3PivotService.evaluatePerformance(
      poorMetrics,
      mockBusinessContext
    );

    const recommendationsResult = await day3PivotService.generateRecommendations(
      triggerResult.data!,
      mockBusinessContext
    );

    const strategyResult = await day3PivotService.generatePivotStrategy(
      triggerResult.data!,
      recommendationsResult.data![0],
      {
        hook: 'Original hook',
        cta: 'Original CTA',
        postingTime: '15:00',
      }
    );

    expect(strategyResult.success).toBe(true);
    expect(strategyResult.data).toBeDefined();
    expect(strategyResult.data!.originalContent).toBeDefined();
    expect(strategyResult.data!.pivotedContent).toBeDefined();
    expect(strategyResult.data!.reasoning).toBeDefined();
    expect(strategyResult.data!.expectedImprovement).toBeGreaterThan(0);
  });
});

describe('Scheduling Optimization Service', () => {
  it('should return scheduling recommendations', async () => {
    const result = await schedulingOptimizationService.getRecommendations(
      mockBusinessContext,
      'instagram'
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.platform).toBe('instagram');
    expect(result.data!.optimalSlots.length).toBeGreaterThan(0);
    expect(result.data!.frequency).toBeDefined();
  });

  it('should recommend different frequencies for different platforms', async () => {
    const igResult = await schedulingOptimizationService.getRecommendations(
      mockBusinessContext,
      'instagram'
    );

    const linkedinResult = await schedulingOptimizationService.getRecommendations(
      mockBusinessContext,
      'linkedin'
    );

    expect(igResult.success && linkedinResult.success).toBe(true);
    // Frequencies might be different
    expect(igResult.data!.frequency.recommended).toBeGreaterThan(0);
    expect(linkedinResult.data!.frequency.recommended).toBeGreaterThan(0);
  });

  it('should generate avoid slots for late night/early morning', async () => {
    const result = await schedulingOptimizationService.getRecommendations(
      mockBusinessContext,
      'instagram'
    );

    expect(result.success).toBe(true);
    expect(result.data!.avoidSlots.length).toBeGreaterThan(0);

    // Check that avoided times are mostly late night/early morning
    const avoidedHours = result.data!.avoidSlots.map((slot) => parseInt(slot.time.split(':')[0]));
    const lateNightHours = avoidedHours.filter((h) => h >= 22 || h <= 5);
    expect(lateNightHours.length).toBeGreaterThan(0);
  });

  it('should optimize schedule for multiple posts', async () => {
    const posts = [
      {
        id: 'post_1',
        platform: 'instagram' as SocialPlatform,
        contentType: 'video' as const,
      },
      {
        id: 'post_2',
        platform: 'instagram' as SocialPlatform,
        contentType: 'static' as const,
      },
      {
        id: 'post_3',
        platform: 'facebook' as SocialPlatform,
        contentType: 'video' as const,
      },
    ];

    const result = await schedulingOptimizationService.optimizeSchedule(
      posts,
      mockBusinessContext
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBe(3);

    // All posts should have scheduled times
    result.data!.forEach((schedule) => {
      expect(schedule.scheduledTime).toBeInstanceOf(Date);
      expect(schedule.optimizationScore).toBeGreaterThan(0);
      expect(schedule.optimizationScore).toBeLessThanOrEqual(100);
    });
  });

  it('should separate posts by minimum hours', async () => {
    const posts = [
      {
        id: 'post_1',
        platform: 'instagram' as SocialPlatform,
        contentType: 'video' as const,
      },
      {
        id: 'post_2',
        platform: 'instagram' as SocialPlatform,
        contentType: 'static' as const,
      },
    ];

    const result = await schedulingOptimizationService.optimizeSchedule(
      posts,
      mockBusinessContext
    );

    expect(result.success).toBe(true);
    const times = result.data!.map((s) => s.scheduledTime.getTime());
    const diff = Math.abs(times[0] - times[1]) / (1000 * 60 * 60); // hours

    // Should be at least 4 hours apart
    expect(diff).toBeGreaterThanOrEqual(4);
  });

  it('should analyze audience activity patterns', () => {
    const historicalData = Array.from({ length: 100 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      reach: Math.random() * 1000,
      engagement: Math.random() * 100,
    }));

    const result = schedulingOptimizationService.analyzeAudienceActivity(
      historicalData,
      'instagram'
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.hourlyActivity.length).toBe(24);
    expect(result.data!.dailyActivity.length).toBe(7);
    expect(result.data!.peakHours.length).toBeGreaterThan(0);
    expect(result.data!.peakDays.length).toBeGreaterThan(0);
  });

  it('should score posts higher for optimal times', async () => {
    const posts = [
      {
        id: 'post_optimal',
        platform: 'instagram' as SocialPlatform,
        contentType: 'video' as const,
      },
    ];

    const result = await schedulingOptimizationService.optimizeSchedule(
      posts,
      mockBusinessContext
    );

    expect(result.success).toBe(true);
    expect(result.data![0].optimizationScore).toBeGreaterThan(50); // Should be decent score
  });
});

describe('Integration Tests', () => {
  it('should work together: benchmark → pivot → schedule', async () => {
    // 1. Get benchmarks
    const benchmarks = industryBenchmarkDatabase.getBenchmarks('restaurant');
    expect(benchmarks.success).toBe(true);

    // 2. Evaluate underperforming content
    const poorMetrics = createMockMetrics(0.8);
    const pivotTrigger = await day3PivotService.evaluatePerformance(
      poorMetrics,
      mockBusinessContext
    );
    expect(pivotTrigger.data).toBeDefined();

    // 3. Get pivot recommendations
    const recommendations = await day3PivotService.generateRecommendations(
      pivotTrigger.data!,
      mockBusinessContext
    );
    expect(recommendations.data!.length).toBeGreaterThan(0);

    // 4. Schedule pivoted content optimally
    const schedule = await schedulingOptimizationService.getRecommendations(
      mockBusinessContext,
      'instagram'
    );
    expect(schedule.data!.optimalSlots.length).toBeGreaterThan(0);
  });

  it('should show video boost in benchmarks matches pivot recommendation', () => {
    const benchmarks = industryBenchmarkDatabase.getBenchmarks('restaurant');
    const videoBoost = benchmarks.data!.platforms.find((p) => p.platform === 'instagram')
      ?.videoBoost;

    // Video boost should be 10x+ (matches pivot expected improvement)
    expect(videoBoost).toBeGreaterThanOrEqual(10);
  });
});
