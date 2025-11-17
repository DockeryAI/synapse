/**
 * Auto-Scheduling Optimization Service
 * Determine optimal posting times based on audience activity and benchmarks
 *
 * Features:
 * - Optimal posting times by platform
 * - Audience activity pattern analysis
 * - Avoid oversaturation (max 1-2 posts/day)
 * - Schedule around benchmark peak times
 * - Competition level analysis
 *
 * Goal: Post when your audience is active but competition is lower
 */

import {
  SchedulingRecommendation,
  TimeSlot,
  AudienceActivityPattern,
  PostSchedule,
  SocialPlatform,
  ContentType,
  BusinessContext,
  ServiceResponse,
} from '../../types/benchmarks.types';
import { industryBenchmarkDatabase } from './IndustryBenchmarkDatabase';

export class SchedulingOptimizationService {
  private readonly MAX_POSTS_PER_DAY = 2;
  private readonly MIN_HOURS_BETWEEN_POSTS = 4;

  /**
   * Get scheduling recommendations for a platform
   */
  async getRecommendations(
    businessContext: BusinessContext,
    platform: SocialPlatform,
    audienceData?: AudienceActivityPattern
  ): Promise<ServiceResponse<SchedulingRecommendation>> {
    try {
      // Get benchmark optimal times
      const benchmarkResult = await industryBenchmarkDatabase.getOptimalPostingTimes(
        businessContext.industry,
        platform
      );

      if (!benchmarkResult.success || !benchmarkResult.data) {
        throw new Error('Failed to load optimal posting times');
      }

      const benchmarkTimes = benchmarkResult.data;

      // Generate time slots
      const optimalSlots = this.generateOptimalSlots(
        platform,
        benchmarkTimes,
        audienceData
      );

      const avoidSlots = this.generateAvoidSlots(platform);

      // Get frequency recommendations
      const platformBenchmark = await industryBenchmarkDatabase.getPlatformBenchmark(
        businessContext.industry,
        platform
      );

      const frequency = platformBenchmark.success && platformBenchmark.data
        ? {
            current: 0, // Would fetch from historical data
            recommended: platformBenchmark.data.postFrequency.optimal,
            maxDaily: this.getMaxDailyPosts(platform),
          }
        : {
            current: 0,
            recommended: 1,
            maxDaily: this.MAX_POSTS_PER_DAY,
          };

      const recommendation: SchedulingRecommendation = {
        platform,
        optimalSlots,
        avoidSlots,
        frequency,
        reasoning: this.generateReasoning(platform, optimalSlots, frequency),
      };

      return {
        success: true,
        data: recommendation,
        metadata: {
          source: audienceData ? 'custom_audience_data' : 'industry_benchmarks',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get recommendations',
      };
    }
  }

  /**
   * Optimize a post schedule
   */
  async optimizeSchedule(
    posts: Array<{
      id: string;
      campaignId?: string;
      platform: SocialPlatform;
      contentType: ContentType;
      preferredTime?: Date;
    }>,
    businessContext: BusinessContext
  ): Promise<ServiceResponse<PostSchedule[]>> {
    try {
      const optimizedSchedules: PostSchedule[] = [];

      // Group posts by platform
      const byPlatform = this.groupByPlatform(posts);

      for (const [platform, platformPosts] of Object.entries(byPlatform)) {
        const recommendation = await this.getRecommendations(
          businessContext,
          platform as SocialPlatform
        );

        if (!recommendation.success || !recommendation.data) {
          throw new Error(`Failed to get recommendations for ${platform}`);
        }

        const optimalSlots = recommendation.data.optimalSlots;

        // Assign posts to optimal slots
        platformPosts.forEach((post, index) => {
          const slot = optimalSlots[index % optimalSlots.length];
          const scheduledTime = this.calculateScheduledTime(
            slot,
            post.preferredTime,
            optimizedSchedules.map((s) => s.scheduledTime)
          );

          const schedule: PostSchedule = {
            id: post.id,
            campaignId: post.campaignId,
            platform: post.platform,
            contentType: post.contentType,
            scheduledTime,
            optimizationScore: this.calculateOptimizationScore(
              scheduledTime,
              slot,
              post.platform
            ),
            factors: {
              audienceActivity: slot.expectedReach,
              competitionLevel: this.estimateCompetition(scheduledTime, post.platform),
              historicalPerformance: 70, // Would use actual historical data
              benchmarkAlignment: this.calculateBenchmarkAlignment(scheduledTime, slot),
            },
            status: 'scheduled',
          };

          optimizedSchedules.push(schedule);
        });
      }

      return {
        success: true,
        data: optimizedSchedules,
        metadata: {
          totalPosts: posts.length,
          avgOptimizationScore:
            optimizedSchedules.reduce((sum, s) => sum + s.optimizationScore, 0) /
            optimizedSchedules.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to optimize schedule',
      };
    }
  }

  /**
   * Analyze audience activity patterns
   */
  analyzeAudienceActivity(
    historicalData: Array<{
      timestamp: Date;
      reach: number;
      engagement: number;
    }>,
    platform: SocialPlatform
  ): ServiceResponse<AudienceActivityPattern> {
    try {
      // Aggregate hourly activity
      const hourlyActivity = new Array(24).fill(0);
      const dailyActivity = new Array(7).fill(0);

      historicalData.forEach((data) => {
        const hour = data.timestamp.getHours();
        const day = data.timestamp.getDay();
        const weight = (data.reach + data.engagement) / 2;

        hourlyActivity[hour] += weight;
        dailyActivity[day] += weight;
      });

      // Normalize
      const maxHourly = Math.max(...hourlyActivity);
      const maxDaily = Math.max(...dailyActivity);

      const normalizedHourly = hourlyActivity.map((v) => (v / maxHourly) * 100);
      const normalizedDaily = dailyActivity.map((v) => (v / maxDaily) * 100);

      // Find peaks
      const peakHours = this.findTopN(normalizedHourly, 5);
      const peakDays = this.findTopN(normalizedDaily, 3);

      const pattern: AudienceActivityPattern = {
        platform,
        hourlyActivity: normalizedHourly,
        dailyActivity: normalizedDaily,
        peakHours,
        peakDays,
        timezone: 'America/New_York', // Would detect from user data
      };

      return {
        success: true,
        data: pattern,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze activity',
      };
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Generate optimal time slots
   */
  private generateOptimalSlots(
    platform: SocialPlatform,
    benchmarkTimes: any,
    audienceData?: AudienceActivityPattern
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    if (audienceData) {
      // Use actual audience data
      audienceData.peakHours.forEach((hour) => {
        audienceData.peakDays.forEach((day) => {
          slots.push({
            dayOfWeek: day,
            time: `${hour.toString().padStart(2, '0')}:00`,
            expectedReach: audienceData.hourlyActivity[hour],
            confidence: 'high',
            source: 'audience_data',
          });
        });
      });
    } else {
      // Use benchmark data
      benchmarkTimes.timeRanges.forEach((range: any) => {
        const startHour = parseInt(range.start.split(':')[0]);
        slots.push({
          dayOfWeek: benchmarkTimes.dayOfWeek,
          time: range.start,
          expectedReach: range.priority === 'high' ? 80 : 60,
          confidence: 'medium',
          source: 'benchmark',
        });
      });
    }

    // Add general best times if needed
    if (slots.length === 0) {
      slots.push(...this.getDefaultSlots(platform));
    }

    // Sort by expected reach
    slots.sort((a, b) => b.expectedReach - a.expectedReach);

    return slots.slice(0, 10); // Top 10 slots
  }

  /**
   * Generate slots to avoid
   */
  private generateAvoidSlots(platform: SocialPlatform): TimeSlot[] {
    // Times when audience is typically inactive
    const avoidHours: Record<SocialPlatform, number[]> = {
      instagram: [0, 1, 2, 3, 4, 5], // Late night/early morning
      facebook: [0, 1, 2, 3, 4, 5],
      tiktok: [0, 1, 2, 3, 4, 5, 6],
      linkedin: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5], // Outside work hours
      twitter: [0, 1, 2, 3, 4, 5],
      youtube: [0, 1, 2, 3, 4],
      google_business: [22, 23, 0, 1, 2, 3, 4, 5, 6],
    };

    const hours = avoidHours[platform] || [0, 1, 2, 3, 4, 5];

    return hours.map((hour) => ({
      dayOfWeek: 1, // Monday (example)
      time: `${hour.toString().padStart(2, '0')}:00`,
      expectedReach: 10, // Low reach
      confidence: 'high',
      source: 'benchmark',
    }));
  }

  /**
   * Get default time slots for platform
   */
  private getDefaultSlots(platform: SocialPlatform): TimeSlot[] {
    const defaults: Record<SocialPlatform, TimeSlot[]> = {
      instagram: [
        { dayOfWeek: 3, time: '11:00', expectedReach: 75, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 3, time: '19:00', expectedReach: 80, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 5, time: '17:00', expectedReach: 70, confidence: 'medium', source: 'benchmark' },
      ],
      facebook: [
        { dayOfWeek: 2, time: '13:00', expectedReach: 70, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 3, time: '13:00', expectedReach: 75, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 4, time: '13:00', expectedReach: 72, confidence: 'medium', source: 'benchmark' },
      ],
      tiktok: [
        { dayOfWeek: 5, time: '19:00', expectedReach: 85, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 6, time: '20:00', expectedReach: 80, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 2, time: '18:00', expectedReach: 75, confidence: 'medium', source: 'benchmark' },
      ],
      linkedin: [
        { dayOfWeek: 3, time: '08:00', expectedReach: 80, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 4, time: '09:00', expectedReach: 75, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 2, time: '12:00', expectedReach: 70, confidence: 'medium', source: 'benchmark' },
      ],
      twitter: [
        { dayOfWeek: 2, time: '12:00', expectedReach: 70, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 3, time: '12:00', expectedReach: 72, confidence: 'medium', source: 'benchmark' },
      ],
      youtube: [
        { dayOfWeek: 5, time: '14:00', expectedReach: 75, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 6, time: '15:00', expectedReach: 80, confidence: 'medium', source: 'benchmark' },
      ],
      google_business: [
        { dayOfWeek: 1, time: '10:00', expectedReach: 70, confidence: 'medium', source: 'benchmark' },
        { dayOfWeek: 3, time: '10:00', expectedReach: 72, confidence: 'medium', source: 'benchmark' },
      ],
    };

    return defaults[platform] || defaults.instagram;
  }

  /**
   * Calculate scheduled time from slot
   */
  private calculateScheduledTime(
    slot: TimeSlot,
    preferredTime?: Date,
    existingSchedules: Date[] = []
  ): Date {
    const now = new Date();
    const scheduled = new Date(now);

    // Set to next occurrence of day
    const targetDay = slot.dayOfWeek;
    const currentDay = scheduled.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
    scheduled.setDate(scheduled.getDate() + daysUntilTarget);

    // Set time
    const [hours, minutes] = slot.time.split(':').map(Number);
    scheduled.setHours(hours, minutes, 0, 0);

    // Check if conflicts with existing schedules
    const hasConflict = existingSchedules.some((existing) => {
      const diffHours = Math.abs(scheduled.getTime() - existing.getTime()) / (1000 * 60 * 60);
      return diffHours < this.MIN_HOURS_BETWEEN_POSTS;
    });

    if (hasConflict) {
      // Shift by MIN_HOURS_BETWEEN_POSTS
      scheduled.setHours(scheduled.getHours() + this.MIN_HOURS_BETWEEN_POSTS);
    }

    return scheduled;
  }

  /**
   * Calculate optimization score
   */
  private calculateOptimizationScore(
    scheduledTime: Date,
    slot: TimeSlot,
    platform: SocialPlatform
  ): number {
    let score = slot.expectedReach;

    // Bonus for high confidence
    if (slot.confidence === 'high') score += 10;

    // Bonus for audience data vs benchmark
    if (slot.source === 'audience_data') score += 5;

    // Penalty for scheduling far in the future
    const daysOut = Math.floor((scheduledTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysOut > 14) score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Estimate competition level at time
   */
  private estimateCompetition(time: Date, platform: SocialPlatform): number {
    const hour = time.getHours();

    // Peak hours = high competition
    const peakHours: Record<SocialPlatform, number[]> = {
      instagram: [19, 20, 21], // Evening
      facebook: [12, 13, 14], // Lunch
      tiktok: [19, 20, 21, 22],
      linkedin: [8, 9, 12],
      twitter: [12, 13],
      youtube: [14, 15, 16],
      google_business: [10, 11],
    };

    const platformPeaks = peakHours[platform] || [12, 19];
    const isPeak = platformPeaks.includes(hour);

    return isPeak ? 80 : 40; // High or moderate competition
  }

  /**
   * Calculate benchmark alignment
   */
  private calculateBenchmarkAlignment(scheduledTime: Date, slot: TimeSlot): number {
    const hour = scheduledTime.getHours();
    const slotHour = parseInt(slot.time.split(':')[0]);

    const hourDiff = Math.abs(hour - slotHour);

    if (hourDiff === 0) return 100;
    if (hourDiff <= 1) return 90;
    if (hourDiff <= 2) return 75;
    return 50;
  }

  /**
   * Generate reasoning text
   */
  private generateReasoning(
    platform: SocialPlatform,
    slots: TimeSlot[],
    frequency: { recommended: number; maxDaily: number }
  ): string[] {
    const reasons: string[] = [];

    reasons.push(`Post ${frequency.recommended}x per week for optimal engagement without oversaturation`);
    reasons.push(`Maximum ${frequency.maxDaily} posts per day to avoid audience fatigue`);

    if (slots.length > 0) {
      const topSlot = slots[0];
      const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        topSlot.dayOfWeek
      ];
      reasons.push(`Peak engagement on ${day}s at ${topSlot.time} (${topSlot.expectedReach}% reach)`);
    }

    reasons.push(`Minimum ${this.MIN_HOURS_BETWEEN_POSTS} hours between posts on same platform`);

    return reasons;
  }

  /**
   * Get max daily posts for platform
   */
  private getMaxDailyPosts(platform: SocialPlatform): number {
    const limits: Record<SocialPlatform, number> = {
      tiktok: 3, // Higher frequency works on TikTok
      instagram: 2,
      facebook: 2,
      linkedin: 1,
      twitter: 5, // Twitter supports higher frequency
      youtube: 1,
      google_business: 1,
    };

    return limits[platform] || this.MAX_POSTS_PER_DAY;
  }

  /**
   * Group posts by platform
   */
  private groupByPlatform(posts: any[]): Record<string, any[]> {
    return posts.reduce((acc, post) => {
      if (!acc[post.platform]) acc[post.platform] = [];
      acc[post.platform].push(post);
      return acc;
    }, {} as Record<string, any[]>);
  }

  /**
   * Find top N indices in array
   */
  private findTopN(arr: number[], n: number): number[] {
    return arr
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .slice(0, n)
      .map((item) => item.idx);
  }
}

// Singleton export
export const schedulingOptimizationService = new SchedulingOptimizationService();
