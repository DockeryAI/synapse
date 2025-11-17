/**
 * Day 3 Pivot Service
 * Auto-detect underperformance and recommend/execute pivots
 *
 * Logic:
 * - Monitor engagement after 3 days
 * - If engagement < 2% (or below industry benchmark) → trigger pivot
 * - Pivot recommendations: switch to video, change hook/CTA, adjust timing, add UGC, boost with ads
 * - Auto-generate pivot content if enabled
 *
 * Philosophy: "Fail fast, pivot faster"
 */

import {
  PerformanceMetrics,
  PivotTrigger,
  PivotRecommendation,
  PivotStrategy,
  PivotAction,
  PivotReason,
  AutoPivotConfig,
  BenchmarkRange,
  BusinessContext,
  ServiceResponse,
  SocialPlatform,
  ContentType,
} from '../../types/benchmarks.types';
import { industryBenchmarkDatabase } from './IndustryBenchmarkDatabase';

export class Day3PivotService {
  private readonly DEFAULT_ENGAGEMENT_THRESHOLD = 2.0; // 2%
  private readonly DEFAULT_DAYS_TO_EVALUATE = 3;
  private readonly MIN_IMPRESSIONS_FOR_PIVOT = 100;

  /**
   * Evaluate performance and check if pivot is needed
   */
  async evaluatePerformance(
    metrics: PerformanceMetrics,
    businessContext: BusinessContext,
    config?: Partial<AutoPivotConfig>
  ): Promise<ServiceResponse<PivotTrigger | null>> {
    try {
      const finalConfig = this.buildConfig(config);

      // Check if enough time has passed
      const daysSince = this.getDaysSincePublish(metrics.publishedAt);
      if (daysSince < finalConfig.thresholds.daysToEvaluate) {
        return {
          success: true,
          data: null,
          metadata: {
            message: `Too early to evaluate (${daysSince} days, need ${finalConfig.thresholds.daysToEvaluate})`,
          },
        };
      }

      // Check if enough impressions
      if (metrics.metrics.impressions < finalConfig.thresholds.minimumImpressions) {
        return {
          success: true,
          data: null,
          metadata: {
            message: `Not enough impressions (${metrics.metrics.impressions}, need ${finalConfig.thresholds.minimumImpressions})`,
          },
        };
      }

      // Get benchmark
      const benchmarkResult = await industryBenchmarkDatabase.getPlatformBenchmark(
        businessContext.industry,
        metrics.platform
      );

      if (!benchmarkResult.success || !benchmarkResult.data) {
        throw new Error('Failed to load benchmark data');
      }

      const benchmark = benchmarkResult.data.engagementRate;

      // Check if pivot needed
      const pivotTrigger = this.checkPivotTriggers(
        metrics,
        benchmark,
        finalConfig.thresholds.engagementRate
      );

      return {
        success: true,
        data: pivotTrigger,
        metadata: {
          daysSincePublish: daysSince,
          benchmark: benchmark.average,
          actualEngagement: metrics.metrics.engagementRate,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to evaluate performance',
      };
    }
  }

  /**
   * Generate pivot recommendations
   */
  async generateRecommendations(
    trigger: PivotTrigger,
    businessContext: BusinessContext,
    config?: Partial<AutoPivotConfig>
  ): Promise<ServiceResponse<PivotRecommendation[]>> {
    try {
      const finalConfig = this.buildConfig(config);
      const recommendations: PivotRecommendation[] = [];

      // Analyze what's wrong and suggest fixes
      const actions = this.determinePivotActions(
        trigger,
        businessContext,
        finalConfig.allowedActions
      );

      actions.forEach((action, index) => {
        recommendations.push({
          triggerId: trigger.id,
          priority: index === 0 ? 'immediate' : index === 1 ? 'suggested' : 'consider',
          action: action.type,
          expectedImpact: action.impact,
          effort: action.effort,
          autoPivotAvailable: finalConfig.autoExecute && action.canAutomate,
        });
      });

      return {
        success: true,
        data: recommendations,
        metadata: {
          totalRecommendations: recommendations.length,
          autoPivotEnabled: finalConfig.autoExecute,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recommendations',
      };
    }
  }

  /**
   * Generate pivot strategy with new content
   */
  async generatePivotStrategy(
    trigger: PivotTrigger,
    recommendation: PivotRecommendation,
    originalContent: {
      hook: string;
      cta: string;
      postingTime: string;
    }
  ): Promise<ServiceResponse<PivotStrategy>> {
    try {
      const strategy = this.buildPivotStrategy(
        trigger,
        recommendation.action,
        originalContent
      );

      return {
        success: true,
        data: strategy,
        metadata: {
          pivotAction: recommendation.action,
          expectedImprovement: strategy.expectedImprovement,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate pivot strategy',
      };
    }
  }

  // ============================================================================
  // Private Logic
  // ============================================================================

  /**
   * Check if performance triggers a pivot
   */
  private checkPivotTriggers(
    metrics: PerformanceMetrics,
    benchmark: BenchmarkRange,
    thresholdEngagement: number
  ): PivotTrigger | null {
    const { engagementRate } = metrics.metrics;

    // Trigger if below absolute threshold OR significantly below benchmark
    const belowThreshold = engagementRate < thresholdEngagement;
    const belowBenchmark = engagementRate < benchmark.min;

    if (!belowThreshold && !belowBenchmark) {
      return null; // Performance is fine
    }

    // Determine reason and severity
    const gap = benchmark.average - engagementRate;
    const gapPercentage = (gap / benchmark.average) * 100;

    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (gapPercentage > 75) severity = 'critical'; // 75%+ below benchmark
    else if (gapPercentage > 50) severity = 'high';
    else if (gapPercentage > 25) severity = 'medium';
    else severity = 'low';

    let reason: PivotReason = 'low_engagement';

    // Refine reason based on other metrics
    if (metrics.metrics.reach < metrics.metrics.impressions * 0.5) {
      reason = 'low_reach';
    } else if (metrics.contentType === 'static') {
      reason = 'content_format'; // Static posts underperform
    } else if (metrics.costs && metrics.costs.cpm > 20) {
      reason = 'high_cost';
    }

    return {
      id: this.generateTriggerId(),
      campaignId: metrics.campaignId || 'unknown',
      postId: metrics.postId || 'unknown',
      triggeredAt: new Date(),
      reason,
      severity,
      currentMetrics: metrics,
      benchmark,
      gap,
    };
  }

  /**
   * Determine which pivot actions to recommend
   */
  private determinePivotActions(
    trigger: PivotTrigger,
    context: BusinessContext,
    allowedActions: PivotAction[]
  ): Array<{ type: PivotAction; impact: string; effort: 'low' | 'medium' | 'high'; canAutomate: boolean }> {
    const actions: Array<{
      type: PivotAction;
      impact: string;
      effort: 'low' | 'medium' | 'high';
      canAutomate: boolean;
    }> = [];

    const { reason, currentMetrics } = trigger;

    // Priority 1: Switch to video if using static
    if (
      currentMetrics.contentType === 'static' &&
      allowedActions.includes('switch_to_video')
    ) {
      actions.push({
        type: 'switch_to_video',
        impact: '10x+ engagement increase',
        effort: 'medium',
        canAutomate: false, // Need user to provide video
      });
    }

    // Priority 2: Change hook/CTA (always applicable)
    if (reason === 'low_engagement' && allowedActions.includes('change_hook')) {
      actions.push({
        type: 'change_hook',
        impact: '30-50% engagement increase',
        effort: 'low',
        canAutomate: true, // Can auto-generate new hooks
      });
    }

    // Priority 3: Adjust posting time
    if (allowedActions.includes('adjust_timing')) {
      actions.push({
        type: 'adjust_timing',
        impact: '20-40% reach increase',
        effort: 'low',
        canAutomate: true,
      });
    }

    // Priority 4: Add UGC contest
    if (trigger.severity === 'high' || trigger.severity === 'critical') {
      if (allowedActions.includes('add_ugc_contest')) {
        actions.push({
          type: 'add_ugc_contest',
          impact: '30% engagement boost',
          effort: 'medium',
          canAutomate: true, // Can auto-generate contest
        });
      }
    }

    // Priority 5: Boost with ads (if high cost isn't the issue)
    if (reason !== 'high_cost' && allowedActions.includes('boost_with_ads')) {
      actions.push({
        type: 'boost_with_ads',
        impact: '5-10x reach increase',
        effort: 'medium',
        canAutomate: false, // Requires budget approval
      });
    }

    // Priority 6: Use trending audio (for video platforms)
    if (
      (currentMetrics.platform === 'tiktok' || currentMetrics.platform === 'instagram') &&
      (currentMetrics.contentType === 'video' || currentMetrics.contentType === 'reel') &&
      allowedActions.includes('use_trending_audio')
    ) {
      actions.push({
        type: 'use_trending_audio',
        impact: '2-3x viral potential',
        effort: 'low',
        canAutomate: false,
      });
    }

    // Priority 7: Shorten content (if long-form)
    if (allowedActions.includes('shorten_content')) {
      actions.push({
        type: 'shorten_content',
        impact: '15-25% completion rate increase',
        effort: 'low',
        canAutomate: false,
      });
    }

    return actions;
  }

  /**
   * Build pivot strategy with specific changes
   */
  private buildPivotStrategy(
    trigger: PivotTrigger,
    action: PivotAction,
    originalContent: {
      hook: string;
      cta: string;
      postingTime: string;
    }
  ): PivotStrategy {
    const { currentMetrics } = trigger;

    const strategies: Record<PivotAction, Partial<PivotStrategy>> = {
      switch_to_video: {
        pivotedContent: {
          contentType: 'video',
          additionalElements: ['captions', 'trending_audio', 'hook_in_first_3s'],
        },
        reasoning:
          'Static posts have 10x lower engagement than video. Converting to short-form video (15-60s) will dramatically increase reach and engagement.',
        expectedImprovement: 900, // 10x = 900% improvement
      },
      change_hook: {
        pivotedContent: {
          contentType: currentMetrics.contentType,
          newHook: this.generateNewHook(originalContent.hook),
          newCta: this.generateNewCta(originalContent.cta),
        },
        reasoning:
          'Current hook not capturing attention. Testing pattern interrupt or question-based hook to increase stop-scroll rate.',
        expectedImprovement: 40,
      },
      adjust_timing: {
        pivotedContent: {
          contentType: currentMetrics.contentType,
          postingTime: this.getOptimalPostingTime(currentMetrics.platform),
        },
        reasoning:
          'Posting outside peak engagement windows. Shifting to optimal time when audience is most active.',
        expectedImprovement: 30,
      },
      add_ugc_contest: {
        pivotedContent: {
          contentType: currentMetrics.contentType,
          additionalElements: ['ugc_contest', 'hashtag_campaign', 'prize_incentive'],
        },
        reasoning:
          'Low engagement indicates need for community activation. UGC contest will drive participation and social proof.',
        expectedImprovement: 30,
      },
      boost_with_ads: {
        pivotedContent: {
          contentType: currentMetrics.contentType,
          additionalElements: ['paid_boost', 'targeted_audience', 'lookalike_targeting'],
        },
        reasoning:
          'Organic reach insufficient. $5-10/day boost will expose content to larger, targeted audience.',
        expectedImprovement: 600, // 5-10x reach
      },
      change_platform: {
        pivotedContent: {
          platform: this.suggestAlternativePlatform(currentMetrics.platform),
          contentType: currentMetrics.contentType,
        },
        reasoning: 'Current platform not optimal for this content type or audience.',
        expectedImprovement: 50,
      },
      shorten_content: {
        pivotedContent: {
          contentType: currentMetrics.contentType,
          additionalElements: ['trim_to_15s', 'hook_upfront', 'fast_cuts'],
        },
        reasoning: 'Attention spans are short. Trimming to 15-30s will increase completion rate.',
        expectedImprovement: 20,
      },
      add_call_to_action: {
        pivotedContent: {
          contentType: currentMetrics.contentType,
          newCta: this.generateStrongCta(),
        },
        reasoning: 'Missing clear CTA. Adding specific action will increase engagement and conversions.',
        expectedImprovement: 25,
      },
      use_trending_audio: {
        pivotedContent: {
          contentType: currentMetrics.contentType,
          additionalElements: ['trending_audio', 'original_audio_credit'],
        },
        reasoning: 'Trending audio boosts algorithm visibility. Using current trending sound for platform.',
        expectedImprovement: 150, // 2-3x viral potential
      },
      increase_frequency: {
        pivotedContent: {
          contentType: currentMetrics.contentType,
          additionalElements: ['post_2x_daily', 'test_different_times'],
        },
        reasoning: 'Increasing posting frequency to test different audience segments and times.',
        expectedImprovement: 35,
      },
    };

    const baseStrategy = strategies[action];

    return {
      originalContent: {
        platform: currentMetrics.platform,
        contentType: currentMetrics.contentType,
        hook: originalContent.hook,
        cta: originalContent.cta,
        postingTime: originalContent.postingTime,
      },
      pivotedContent: {
        platform: currentMetrics.platform,
        contentType: currentMetrics.contentType,
        ...baseStrategy.pivotedContent,
      },
      reasoning: baseStrategy.reasoning || 'Pivot recommended based on performance data',
      expectedImprovement: baseStrategy.expectedImprovement || 25,
    };
  }

  // ============================================================================
  // Content Generation Helpers
  // ============================================================================

  private generateNewHook(originalHook: string): string {
    // Pattern interrupts and questions work best
    const hooks = [
      'Wait... you need to see this',
      'Nobody talks about this, but...',
      'Here\'s what most people get wrong about',
      'Stop scrolling. This actually works.',
      'Why does everyone do it the hard way?',
      'The secret nobody tells you:',
      'This changed everything for me:',
      'You\'re doing it wrong. Here\'s why:',
    ];

    // Pick one that's different from original
    return hooks.find((h) => !originalHook.includes(h.split(' ')[0])) || hooks[0];
  }

  private generateNewCta(originalCta: string): string {
    const ctas = [
      'Double tap if you agree!',
      'Save this for later - you\'ll need it',
      'Tag someone who needs to see this',
      'Comment "YES" if you want more like this',
      'Follow for daily tips',
      'Try this today and let me know how it goes',
      'Which one are you? Comment below!',
      'Share this with your bestie',
    ];

    return ctas.find((c) => c !== originalCta) || ctas[0];
  }

  private generateStrongCta(): string {
    return 'Try this today and comment your results below! 👇';
  }

  private getOptimalPostingTime(platform: SocialPlatform): string {
    const optimalTimes: Record<SocialPlatform, string> = {
      instagram: '19:00', // 7pm
      facebook: '13:00', // 1pm
      tiktok: '20:00', // 8pm
      linkedin: '08:00', // 8am
      twitter: '12:00', // Noon
      youtube: '14:00', // 2pm
      google_business: '10:00', // 10am
    };

    return optimalTimes[platform] || '12:00';
  }

  private suggestAlternativePlatform(current: SocialPlatform): SocialPlatform {
    const alternatives: Record<SocialPlatform, SocialPlatform> = {
      facebook: 'instagram',
      instagram: 'tiktok',
      tiktok: 'instagram',
      linkedin: 'twitter',
      twitter: 'linkedin',
      youtube: 'tiktok',
      google_business: 'facebook',
    };

    return alternatives[current] || 'instagram';
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private getDaysSincePublish(publishedAt: Date): number {
    const now = new Date();
    const diff = now.getTime() - publishedAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private buildConfig(partial?: Partial<AutoPivotConfig>): AutoPivotConfig {
    return {
      enabled: partial?.enabled ?? true,
      thresholds: {
        engagementRate: partial?.thresholds?.engagementRate ?? this.DEFAULT_ENGAGEMENT_THRESHOLD,
        daysToEvaluate: partial?.thresholds?.daysToEvaluate ?? this.DEFAULT_DAYS_TO_EVALUATE,
        minimumImpressions: partial?.thresholds?.minimumImpressions ?? this.MIN_IMPRESSIONS_FOR_PIVOT,
      },
      allowedActions: partial?.allowedActions ?? [
        'switch_to_video',
        'change_hook',
        'adjust_timing',
        'add_ugc_contest',
        'boost_with_ads',
        'use_trending_audio',
        'shorten_content',
        'add_call_to_action',
      ],
      autoExecute: partial?.autoExecute ?? false, // Default: suggest only, don't auto-apply
      maxPivotsPerCampaign: partial?.maxPivotsPerCampaign ?? 3,
    };
  }

  private generateTriggerId(): string {
    return `pivot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton export
export const day3PivotService = new Day3PivotService();
