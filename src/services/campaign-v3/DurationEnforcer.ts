/**
 * Duration Enforcer
 *
 * Enforces 5-14 day campaign durations and handles day-by-day scheduling.
 * No more 30-day campaigns that nobody finishes.
 *
 * Because if you can't execute a campaign in 2 weeks, you're doing it wrong.
 */

import type {
  CampaignDuration,
  DurationOption,
  CampaignTypeV3,
  PlatformV3,
  CampaignDay,
  CampaignCalendar,
} from '../../types/campaign-v3.types';

export class DurationEnforcer {
  /**
   * Allowed durations (5, 7, 10, 14 days only)
   */
  static readonly ALLOWED_DURATIONS: CampaignDuration[] = [5, 7, 10, 14];

  /**
   * Minimum and maximum days
   */
  static readonly MIN_DAYS = 5;
  static readonly MAX_DAYS = 14;

  /**
   * Duration options with metadata
   */
  static readonly DURATION_OPTIONS: DurationOption[] = [
    {
      days: 5,
      label: '5 Days - Flash',
      description: 'Fast and intense - perfect for urgent campaigns and sales',
      postCount: 12,
      intensity: 'flash',
    },
    {
      days: 7,
      label: '7 Days - Sprint',
      description: 'One week sprint - balanced intensity and results',
      postCount: 15,
      intensity: 'sprint',
    },
    {
      days: 10,
      label: '10 Days - Campaign',
      description: 'Extended campaign - build momentum and trust',
      postCount: 18,
      intensity: 'campaign',
    },
    {
      days: 14,
      label: '14 Days - Deep Dive',
      description: 'Two weeks - comprehensive community engagement',
      postCount: 22,
      intensity: 'campaign',
    },
  ];

  /**
   * Get all duration options
   */
  static getAllOptions(): DurationOption[] {
    return this.DURATION_OPTIONS;
  }

  /**
   * Get duration option by days
   */
  static getOption(days: CampaignDuration): DurationOption | undefined {
    return this.DURATION_OPTIONS.find(opt => opt.days === days);
  }

  /**
   * Validate duration
   */
  static validateDuration(days: number): {
    valid: boolean;
    error?: string;
    suggestion?: CampaignDuration;
  } {
    // Check if it's an allowed duration
    if (this.ALLOWED_DURATIONS.includes(days as CampaignDuration)) {
      return { valid: true };
    }

    // Too short
    if (days < this.MIN_DAYS) {
      return {
        valid: false,
        error: `Campaigns must be at least ${this.MIN_DAYS} days`,
        suggestion: 5,
      };
    }

    // Too long
    if (days > this.MAX_DAYS) {
      return {
        valid: false,
        error: `Campaigns cannot exceed ${this.MAX_DAYS} days. Break it into multiple campaigns!`,
        suggestion: 14,
      };
    }

    // Not a standard duration
    const closest = this.findClosestDuration(days);
    return {
      valid: false,
      error: `${days} days is not a standard duration. Use ${closest} days instead.`,
      suggestion: closest,
    };
  }

  /**
   * Find closest allowed duration
   */
  static findClosestDuration(days: number): CampaignDuration {
    let closest = this.ALLOWED_DURATIONS[0];
    let minDiff = Math.abs(days - closest);

    this.ALLOWED_DURATIONS.forEach(duration => {
      const diff = Math.abs(days - duration);
      if (diff < minDiff) {
        minDiff = diff;
        closest = duration;
      }
    });

    return closest;
  }

  /**
   * Get duration for campaign type (each type has a default)
   */
  static getDurationForType(campaignType: CampaignTypeV3): CampaignDuration {
    const typeDurations: Record<CampaignTypeV3, CampaignDuration> = {
      'authority-builder': 7,
      'community-champion': 14,
      'trust-builder': 10,
      'revenue-rush': 5,
      'viral-spark': 7,
    };

    return typeDurations[campaignType];
  }

  /**
   * Check if duration matches campaign type requirement
   */
  static matchesCampaignType(
    duration: CampaignDuration,
    campaignType: CampaignTypeV3
  ): boolean {
    const requiredDuration = this.getDurationForType(campaignType);
    return duration === requiredDuration;
  }

  /**
   * Calculate posts per day for duration
   */
  static calculatePostsPerDay(
    duration: CampaignDuration,
    totalPosts: number
  ): number {
    return Math.ceil(totalPosts / duration);
  }

  /**
   * Generate day-by-day calendar structure
   */
  static generateCalendarStructure(
    startDate: Date,
    duration: CampaignDuration,
    campaignType: CampaignTypeV3
  ): Omit<CampaignDay, 'posts' | 'postCount'>[] {
    const days: Omit<CampaignDay, 'posts' | 'postCount'>[] = [];

    // Get phase breakdown for campaign type
    const phases = this.getPhaseBreakdown(campaignType, duration);

    for (let i = 0; i < duration; i++) {
      const dayNumber = i + 1;
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Determine which phase this day belongs to
      const phase = this.getPhaseForDay(dayNumber, phases);

      days.push({
        dayNumber,
        date,
        phase: phase.name as 'phase1' | 'phase2' | 'phase3',
        focus: phase.focus,
      });
    }

    return days;
  }

  /**
   * Get phase breakdown for campaign
   */
  private static getPhaseBreakdown(
    campaignType: CampaignTypeV3,
    duration: CampaignDuration
  ): Array<{ name: string; days: number; focus: string }> {
    // Define phase splits for each campaign type
    const phaseSplits: Record<
      CampaignTypeV3,
      { phase1: number; phase2: number; phase3?: number }
    > = {
      'authority-builder': { phase1: 2, phase2: 3, phase3: 2 }, // 7 days
      'community-champion': { phase1: 4, phase2: 6, phase3: 4 }, // 14 days
      'trust-builder': { phase1: 3, phase2: 4, phase3: 3 }, // 10 days
      'revenue-rush': { phase1: 2, phase2: 2, phase3: 1 }, // 5 days
      'viral-spark': { phase1: 2, phase2: 3, phase3: 2 }, // 7 days
    };

    const split = phaseSplits[campaignType];

    // Phase focuses by campaign type
    const focuses: Record<CampaignTypeV3, { p1: string; p2: string; p3: string }> = {
      'authority-builder': {
        p1: 'Problem Awareness',
        p2: 'Education & Solutions',
        p3: 'Proof & CTA',
      },
      'community-champion': {
        p1: 'Local Connection',
        p2: 'Customer Stories',
        p3: 'Local Offer',
      },
      'trust-builder': {
        p1: 'Problem & Empathy',
        p2: 'Transformations',
        p3: 'Social Proof',
      },
      'revenue-rush': {
        p1: 'Problem Agitation',
        p2: 'Product Showcase',
        p3: 'Urgency & Offer',
      },
      'viral-spark': {
        p1: 'Trending Content',
        p2: 'Behind-the-Scenes',
        p3: 'CTA & Engagement',
      },
    };

    const focus = focuses[campaignType];

    return [
      { name: 'phase1', days: split.phase1, focus: focus.p1 },
      { name: 'phase2', days: split.phase2, focus: focus.p2 },
      ...(split.phase3 ? [{ name: 'phase3', days: split.phase3, focus: focus.p3 }] : []),
    ];
  }

  /**
   * Determine phase for a specific day
   */
  private static getPhaseForDay(
    dayNumber: number,
    phases: Array<{ name: string; days: number; focus: string }>
  ): { name: string; focus: string } {
    let cumulativeDays = 0;

    for (const phase of phases) {
      cumulativeDays += phase.days;
      if (dayNumber <= cumulativeDays) {
        return phase;
      }
    }

    // Fallback to last phase
    return phases[phases.length - 1];
  }

  /**
   * Calculate optimal posting schedule
   */
  static calculatePostingSchedule(
    duration: CampaignDuration,
    platforms: PlatformV3[],
    campaignType: CampaignTypeV3
  ): {
    postsPerDay: number;
    totalPosts: number;
    postDistribution: number[];
  } {
    // Base posts per day by campaign intensity
    const basePostsPerDay: Record<CampaignTypeV3, number> = {
      'authority-builder': 1.5,
      'community-champion': 1.3,
      'trust-builder': 1.5,
      'revenue-rush': 2.4,
      'viral-spark': 2,
    };

    const basePosts = Math.ceil(duration * basePostsPerDay[campaignType]);

    // Each platform gets content (but we cross-post)
    const platformMultiplier = Math.min(platforms.length, 3);

    const totalPosts = basePosts * platformMultiplier;
    const postsPerDay = Math.ceil(totalPosts / duration);

    // Distribution by day (some days have more posts)
    const distribution = this.distributePosts(duration, totalPosts, campaignType);

    return {
      postsPerDay,
      totalPosts,
      postDistribution: distribution,
    };
  }

  /**
   * Distribute posts across days (some days need more)
   */
  private static distributePosts(
    duration: CampaignDuration,
    totalPosts: number,
    campaignType: CampaignTypeV3
  ): number[] {
    const distribution: number[] = [];
    let remainingPosts = totalPosts;

    // Revenue Rush and Viral Spark ramp up at the end
    const shouldRampUp = ['revenue-rush', 'viral-spark'].includes(campaignType);

    for (let day = 1; day <= duration; day++) {
      let dayPosts: number;

      if (shouldRampUp) {
        // More posts towards the end
        const progress = day / duration;
        const weight = 0.8 + (progress * 0.4); // 0.8x to 1.2x
        dayPosts = Math.ceil((totalPosts / duration) * weight);
      } else {
        // Even distribution with slight emphasis on middle days
        const middleDay = Math.ceil(duration / 2);
        const distanceFromMiddle = Math.abs(day - middleDay);
        const weight = 1 + (1 - distanceFromMiddle / duration) * 0.2;
        dayPosts = Math.ceil((totalPosts / duration) * weight);
      }

      // Ensure we don't exceed remaining posts
      dayPosts = Math.min(dayPosts, remainingPosts);

      distribution.push(dayPosts);
      remainingPosts -= dayPosts;
    }

    // Distribute any remaining posts to middle days
    while (remainingPosts > 0) {
      const middleIndex = Math.floor(duration / 2);
      distribution[middleIndex]++;
      remainingPosts--;
    }

    return distribution;
  }

  /**
   * Get recommended posting times for campaign
   */
  static getRecommendedPostingTimes(
    campaignType: CampaignTypeV3,
    platforms: PlatformV3[]
  ): string[] {
    // Optimal posting times by platform (research-backed)
    const platformTimes: Record<PlatformV3, string[]> = {
      facebook: ['09:00', '13:00', '15:00'],
      instagram: ['11:00', '14:00', '19:00'],
      linkedin: ['08:00', '12:00', '17:00'],
      twitter: ['09:00', '12:00', '17:00'],
      tiktok: ['07:00', '16:00', '21:00'],
      'youtube-shorts': ['14:00', '18:00', '20:00'],
      'google-business': ['10:00', '14:00'],
    };

    // Get times for selected platforms
    const allTimes = new Set<string>();
    platforms.forEach(platform => {
      platformTimes[platform].forEach(time => allTimes.add(time));
    });

    // Sort and return top 3
    return Array.from(allTimes)
      .sort()
      .slice(0, 3);
  }

  /**
   * Calculate end date
   */
  static calculateEndDate(startDate: Date, duration: CampaignDuration): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration - 1); // -1 because start day counts
    return endDate;
  }

  /**
   * Get intensity label
   */
  static getIntensityLabel(duration: CampaignDuration): string {
    const option = this.getOption(duration);
    return option?.intensity || 'campaign';
  }

  /**
   * Format duration for display
   */
  static formatDuration(duration: CampaignDuration): string {
    const option = this.getOption(duration);
    return option?.label || `${duration} Days`;
  }
}

export default DurationEnforcer;
