/**
 * AutoScheduler Service
 *
 * Bulk schedules campaigns to social media platforms with intelligent timing.
 *
 * Features:
 * - Respects platform posting limits (Instagram 1/day, Facebook 3/day, etc.)
 * - Optimizes posting times by platform and industry
 * - Handles timezone conversion
 * - Distributes posts evenly over campaign duration
 * - Integrates with SocialPilot API
 */

import { supabase } from '@/lib/supabase';
import { SocialPilotService, Platform, PostSchedule } from '../socialpilot.service';

//=============================================================================
// Types & Interfaces
//=============================================================================

export interface GeneratedPost {
  id?: string;
  content: string;
  platforms?: Platform[];
  media?: string[];
  hashtags?: string[];
  day?: number; // Day number in campaign (1-30)
}

export interface BulkScheduleInput {
  campaignId: string;
  posts: GeneratedPost[];
  platforms: Platform[];
  startDate: Date;
  timezone: string;
  industry?: string;
  userId?: string;
}

export interface ScheduledPost {
  postId: string;
  content: string;
  platforms: Platform[];
  scheduledTime: Date;
  status: 'pending' | 'scheduled' | 'failed';
  error?: string;
  socialPilotId?: string;
}

export interface ScheduleResult {
  campaignId: string;
  scheduled: number;
  failed: number;
  total: number;
  schedule: ScheduledPost[];
  errors: ScheduleError[];
  successRate: number;
}

export interface ScheduleError {
  postId: string;
  platform: Platform;
  error: string;
  retryable: boolean;
}

export interface PlatformLimits {
  postsPerDay: number;
  optimalTimes: string[]; // HH:mm format in local timezone
  minHoursBetweenPosts?: number;
}

export interface OptimalPostingTime {
  platform: Platform;
  times: Date[]; // Actual Date objects with timezone
  reason: string;
}

//=============================================================================
// Platform Configuration
//=============================================================================

const PLATFORM_LIMITS: Record<Platform, PlatformLimits> = {
  instagram: {
    postsPerDay: 1,
    optimalTimes: ['09:00', '17:00', '21:00'],
    minHoursBetweenPosts: 24,
  },
  facebook: {
    postsPerDay: 3,
    optimalTimes: ['09:00', '13:00', '19:00'],
    minHoursBetweenPosts: 4,
  },
  twitter: {
    postsPerDay: 5,
    optimalTimes: ['08:00', '12:00', '17:00', '21:00', '23:00'],
    minHoursBetweenPosts: 3,
  },
  linkedin: {
    postsPerDay: 2,
    optimalTimes: ['08:00', '17:00'],
    minHoursBetweenPosts: 8,
  },
  tiktok: {
    postsPerDay: 2,
    optimalTimes: ['18:00', '21:00'],
    minHoursBetweenPosts: 6,
  },
  pinterest: {
    postsPerDay: 4,
    optimalTimes: ['09:00', '14:00', '18:00', '21:00'],
    minHoursBetweenPosts: 4,
  },
  youtube: {
    postsPerDay: 1,
    optimalTimes: ['14:00', '18:00'],
    minHoursBetweenPosts: 24,
  },
};

// Industry-specific timing adjustments
const INDUSTRY_TIME_ADJUSTMENTS: Record<string, Record<Platform, string[]>> = {
  'professional-services': {
    linkedin: ['07:30', '12:00', '16:30'],
    facebook: ['08:00', '12:00', '18:00'],
    twitter: ['07:00', '12:00', '16:00', '20:00'],
    instagram: ['08:00'],
    tiktok: ['19:00', '22:00'],
    pinterest: ['10:00', '15:00', '19:00', '21:00'],
    youtube: ['15:00', '19:00'],
  },
  'retail': {
    instagram: ['11:00', '19:00', '21:00'],
    facebook: ['10:00', '15:00', '20:00'],
    twitter: ['09:00', '14:00', '19:00', '22:00'],
    linkedin: ['09:00', '17:00'],
    tiktok: ['17:00', '20:00'],
    pinterest: ['11:00', '14:00', '18:00', '20:00'],
    youtube: ['16:00', '20:00'],
  },
  'healthcare': {
    facebook: ['08:00', '12:00', '17:00'],
    linkedin: ['08:00', '16:00'],
    instagram: ['09:00'],
    twitter: ['08:00', '12:00', '17:00', '21:00'],
    tiktok: ['18:00', '21:00'],
    pinterest: ['09:00', '13:00', '17:00', '20:00'],
    youtube: ['14:00', '18:00'],
  },
  'food-beverage': {
    instagram: ['11:00', '18:00', '20:00'],
    facebook: ['10:00', '14:00', '19:00'],
    twitter: ['10:00', '14:00', '18:00', '21:00'],
    tiktok: ['17:00', '20:00'],
    pinterest: ['10:00', '14:00', '18:00', '21:00'],
    linkedin: ['09:00', '17:00'],
    youtube: ['15:00', '19:00'],
  },
};

//=============================================================================
// AutoScheduler Service
//=============================================================================

export class AutoScheduler {
  private socialPilotService: SocialPilotService;

  constructor(socialPilotService?: SocialPilotService) {
    // Allow injection for testing, otherwise create default
    this.socialPilotService = socialPilotService || new SocialPilotService({
      clientId: import.meta.env.VITE_SOCIALPILOT_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_SOCIALPILOT_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_SOCIALPILOT_REDIRECT_URI || '',
    });
  }

  /**
   * Bulk schedule all posts from a campaign
   * Main entry point for scheduling automation
   */
  async bulkSchedule(input: BulkScheduleInput): Promise<ScheduleResult> {
    console.log(`[AutoScheduler] Starting bulk schedule for campaign ${input.campaignId}`);
    console.log(`[AutoScheduler] ${input.posts.length} posts, ${input.platforms.length} platforms`);

    const result: ScheduleResult = {
      campaignId: input.campaignId,
      scheduled: 0,
      failed: 0,
      total: input.posts.length * input.platforms.length,
      schedule: [],
      errors: [],
      successRate: 0,
    };

    try {
      // Step 1: Generate optimal schedule
      const scheduledPosts = await this.distributePosts(
        input.posts,
        input.platforms,
        input.startDate,
        input.timezone,
        input.industry
      );

      console.log(`[AutoScheduler] Generated schedule with ${scheduledPosts.length} posts`);

      // Step 2: Schedule each post via SocialPilot
      for (const post of scheduledPosts) {
        try {
          await this.schedulePost(post, input.campaignId, input.userId);
          post.status = 'scheduled';
          result.scheduled++;
          console.log(`[AutoScheduler] ✓ Scheduled post ${post.postId} for ${post.scheduledTime}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          post.status = 'failed';
          post.error = errorMessage;
          result.failed++;
          result.errors.push({
            postId: post.postId,
            platform: post.platforms[0],
            error: errorMessage,
            retryable: !errorMessage.includes('authentication'),
          });
          console.error(`[AutoScheduler] ✗ Failed to schedule ${post.postId}:`, errorMessage);
        }

        result.schedule.push(post);
      }

      // Calculate success rate
      result.successRate = result.total > 0 ? (result.scheduled / result.total) * 100 : 0;

      console.log(`[AutoScheduler] Complete: ${result.scheduled}/${result.total} scheduled (${result.successRate.toFixed(1)}%)`);

      return result;
    } catch (error) {
      console.error('[AutoScheduler] Bulk schedule failed:', error);
      throw new Error(`Bulk scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Distribute posts across campaign duration with optimal timing
   */
  async distributePosts(
    posts: GeneratedPost[],
    platforms: Platform[],
    startDate: Date,
    timezone: string,
    industry?: string
  ): Promise<ScheduledPost[]> {
    console.log(`[AutoScheduler] Distributing ${posts.length} posts across ${platforms.length} platforms`);

    const scheduledPosts: ScheduledPost[] = [];

    // For each platform, distribute its posts
    for (const platform of platforms) {
      const platformLimits = PLATFORM_LIMITS[platform];
      const optimalTimes = this.getOptimalTimes(platform, industry);

      let currentDate = new Date(startDate);
      let timeSlotIndex = 0;

      // Schedule each post for this platform
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];

        // Check if post has platform-specific content or use general content
        const postPlatforms = post.platforms || platforms;
        if (!postPlatforms.includes(platform)) {
          continue; // Skip if post not meant for this platform
        }

        // Get next optimal posting time
        const scheduledTime = new Date(currentDate);
        const [hours, minutes] = optimalTimes[timeSlotIndex % optimalTimes.length].split(':');
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Create scheduled post
        scheduledPosts.push({
          postId: post.id || `post-${i}-${platform}`,
          content: post.content,
          platforms: [platform],
          scheduledTime,
          status: 'pending',
        });

        // Move to next time slot
        timeSlotIndex++;

        // If we've used all time slots for today, move to next day
        if (timeSlotIndex % platformLimits.postsPerDay === 0) {
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
          timeSlotIndex = 0;
        }
      }
    }

    // Sort by scheduled time
    scheduledPosts.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    return scheduledPosts;
  }

  /**
   * Get optimal posting times for a platform and industry
   */
  getOptimalTimes(platform: Platform, industry?: string): string[] {
    // Try industry-specific times first
    if (industry && INDUSTRY_TIME_ADJUSTMENTS[industry]?.[platform]) {
      return INDUSTRY_TIME_ADJUSTMENTS[industry][platform];
    }

    // Fall back to platform defaults
    return PLATFORM_LIMITS[platform].optimalTimes;
  }

  /**
   * Schedule a single post via SocialPilot and save to database
   */
  private async schedulePost(
    post: ScheduledPost,
    campaignId: string,
    userId?: string
  ): Promise<void> {
    try {
      // Get connected account IDs for the platforms
      const accountIds = await this.getAccountIds(post.platforms, userId);

      if (accountIds.length === 0) {
        throw new Error(`No connected accounts found for platforms: ${post.platforms.join(', ')}`);
      }

      // Schedule via SocialPilot API
      const postSchedule: PostSchedule = {
        accountIds,
        content: post.content,
        scheduledTime: post.scheduledTime,
        media: [],
        hashtags: [],
      };

      const response = await this.socialPilotService.schedulePost(postSchedule);

      if (response.status === 'failed') {
        throw new Error(response.error || 'SocialPilot scheduling failed');
      }

      post.socialPilotId = response.id;

      // Save to database
      await this.saveToDatabase(post, campaignId, userId);

    } catch (error) {
      console.error('[AutoScheduler] Schedule post error:', error);
      throw error;
    }
  }

  /**
   * Get connected account IDs for given platforms
   */
  private async getAccountIds(platforms: Platform[], userId?: string): Promise<string[]> {
    try {
      let query = supabase
        .from('socialpilot_accounts')
        .select('id, platform')
        .eq('connected', true)
        .in('platform', platforms);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AutoScheduler] Failed to fetch accounts:', error);
        return [];
      }

      return data?.map(account => account.id) || [];
    } catch (error) {
      console.error('[AutoScheduler] Get account IDs error:', error);
      return [];
    }
  }

  /**
   * Save scheduled post to database
   */
  private async saveToDatabase(
    post: ScheduledPost,
    campaignId: string,
    userId?: string
  ): Promise<void> {
    try {
      // Save to content_calendar_items
      const { error: calendarError } = await supabase
        .from('content_calendar_items')
        .insert({
          campaign_id: campaignId,
          content: post.content,
          scheduled_time: post.scheduledTime.toISOString(),
          platforms: post.platforms,
          status: 'scheduled',
          socialpilot_post_id: post.socialPilotId,
          user_id: userId,
        });

      if (calendarError) {
        console.error('[AutoScheduler] Failed to save to calendar:', calendarError);
      }

      // Save to publishing_queue
      const { error: queueError } = await supabase
        .from('publishing_queue')
        .insert({
          content_id: post.postId,
          scheduled_time: post.scheduledTime.toISOString(),
          account_ids: [], // Will be populated later
          content: post.content,
          status: 'pending',
          retry_count: 0,
          max_retries: 3,
        });

      if (queueError) {
        console.error('[AutoScheduler] Failed to save to queue:', queueError);
      }

    } catch (error) {
      console.error('[AutoScheduler] Save to database error:', error);
      throw error;
    }
  }

  /**
   * Get campaign duration in days based on post count and platform limits
   */
  calculateCampaignDuration(postCount: number, platforms: Platform[]): number {
    // Find the most restrictive platform (lowest posts per day)
    const minPostsPerDay = Math.min(
      ...platforms.map(p => PLATFORM_LIMITS[p].postsPerDay)
    );

    // Calculate days needed
    const daysNeeded = Math.ceil(postCount / minPostsPerDay);

    return daysNeeded;
  }

  /**
   * Validate bulk schedule input
   */
  validateInput(input: BulkScheduleInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.campaignId) {
      errors.push('Campaign ID is required');
    }

    if (!input.posts || input.posts.length === 0) {
      errors.push('At least one post is required');
    }

    if (!input.platforms || input.platforms.length === 0) {
      errors.push('At least one platform is required');
    }

    if (!input.startDate) {
      errors.push('Start date is required');
    } else if (input.startDate < new Date()) {
      errors.push('Start date cannot be in the past');
    }

    if (!input.timezone) {
      errors.push('Timezone is required');
    }

    // Validate each post has content
    input.posts?.forEach((post, index) => {
      if (!post.content || post.content.trim().length === 0) {
        errors.push(`Post ${index + 1} is missing content`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

//=============================================================================
// Utility Functions
//=============================================================================

/**
 * Convert time string to Date in specified timezone
 */
export function parseTimeInTimezone(timeStr: string, date: Date, timezone: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Get next available posting slot for a platform
 */
export function getNextAvailableSlot(
  platform: Platform,
  lastPostTime: Date,
  optimalTimes: string[]
): Date {
  const limits = PLATFORM_LIMITS[platform];
  const minHours = limits.minHoursBetweenPosts || 24;

  // Start from last post time + minimum hours
  const nextAvailable = new Date(lastPostTime);
  nextAvailable.setHours(nextAvailable.getHours() + minHours);

  // Find next optimal time after nextAvailable
  for (const timeStr of optimalTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotTime = new Date(nextAvailable);
    slotTime.setHours(hours, minutes, 0, 0);

    if (slotTime >= nextAvailable) {
      return slotTime;
    }
  }

  // If no slot found today, use first slot tomorrow
  const tomorrow = new Date(nextAvailable);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [hours, minutes] = optimalTimes[0].split(':').map(Number);
  tomorrow.setHours(hours, minutes, 0, 0);

  return tomorrow;
}

/**
 * Create singleton instance
 */
let autoSchedulerInstance: AutoScheduler | null = null;

export function createAutoScheduler(socialPilotService?: SocialPilotService): AutoScheduler {
  if (!autoSchedulerInstance) {
    autoSchedulerInstance = new AutoScheduler(socialPilotService);
  }
  return autoSchedulerInstance;
}
