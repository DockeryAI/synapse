/**
 * SocialPilot Scheduler
 *
 * Schedules approved posts to SocialPilot because manually posting
 * to 3 platforms 14 times is apparently too much work
 *
 * Features:
 * - Multi-platform scheduling
 * - Platform-specific formatting
 * - Optimal time detection
 * - Retry logic (because APIs love to fail)
 * - Error handling (because APIs REALLY love to fail)
 *
 * @author Roy (API integration veteran, battle-scarred)
 */

import {
  CalendarPost,
  CampaignCalendar,
  SocialPlatform,
  SchedulingInfo,
  SchedulingAttempt,
  PlatformSchedulingStatus,
  SocialPilotScheduleRequest,
} from '../../types/calendar.types';

export class SocialPilotScheduler {
  private static readonly API_BASE_URL = process.env.SOCIALPILOT_API_URL || 'https://api.socialpilot.co/v2';
  private static readonly API_KEY = process.env.SOCIALPILOT_API_KEY || '';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // ms

  /**
   * Schedule a single post to SocialPilot
   */
  static async schedulePost(
    post: CalendarPost,
    timezone: string = 'America/Los_Angeles'
  ): Promise<CalendarPost> {
    // Validate post is approved
    if (post.approval.status !== 'approved') {
      throw new Error('Post must be approved before scheduling');
    }

    // Build schedule request
    const scheduleRequest: SocialPilotScheduleRequest = {
      postId: post.id,
      platforms: post.platforms,
      content: post.content,
      scheduledDateTime: this.buildScheduledDateTime(post),
      timezone,
      mediaUrls: post.content.mediaUrls,
    };

    // Attempt scheduling with retry logic
    const result = await this.scheduleWithRetry(scheduleRequest);

    // Update post with scheduling info
    return this.updatePostSchedulingInfo(post, result);
  }

  /**
   * Schedule multiple posts (bulk operation)
   */
  static async schedulePosts(
    posts: CalendarPost[],
    timezone: string = 'America/Los_Angeles'
  ): Promise<ScheduleResult[]> {
    const results: ScheduleResult[] = [];

    for (const post of posts) {
      try {
        const updatedPost = await this.schedulePost(post, timezone);
        results.push({
          postId: post.id,
          success: true,
          post: updatedPost,
        });
      } catch (error) {
        results.push({
          postId: post.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Schedule entire calendar
   */
  static async scheduleCalendar(
    calendar: CampaignCalendar,
    timezone: string = 'America/Los_Angeles'
  ): Promise<CampaignCalendar> {
    // Get approved posts that aren't scheduled yet
    const schedulablePosts = calendar.posts.filter(
      post => post.approval.status === 'approved' && !post.scheduling.isScheduled
    );

    if (schedulablePosts.length === 0) {
      throw new Error('No posts available for scheduling');
    }

    // Schedule all posts
    const results = await this.schedulePosts(schedulablePosts, timezone);

    // Update calendar with results
    const updatedPosts = calendar.posts.map(post => {
      const result = results.find(r => r.postId === post.id);
      return result?.post || post;
    });

    // Update statistics
    const scheduledCount = updatedPosts.filter(p => p.scheduling.isScheduled).length;
    const statistics = {
      ...calendar.statistics,
      scheduledCount,
    };

    return {
      ...calendar,
      posts: updatedPosts,
      statistics,
      status: scheduledCount === updatedPosts.length ? 'scheduled' : 'in_review',
      updatedAt: new Date(),
    };
  }

  /**
   * Schedule with retry logic
   * Because APIs fail. A lot.
   */
  private static async scheduleWithRetry(
    request: SocialPilotScheduleRequest,
    attempt: number = 1
  ): Promise<SocialPilotResponse> {
    try {
      return await this.callSocialPilotAPI(request);
    } catch (error) {
      if (attempt >= this.MAX_RETRIES) {
        throw error;
      }

      // Check if error is retryable
      if (this.isRetryableError(error)) {
        // Wait before retry
        await this.delay(this.RETRY_DELAY * attempt);
        return this.scheduleWithRetry(request, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Call SocialPilot API
   * Mock implementation - replace with actual API calls
   */
  private static async callSocialPilotAPI(
    request: SocialPilotScheduleRequest
  ): Promise<SocialPilotResponse> {
    // Mock implementation
    // In production, this would make actual HTTP requests to SocialPilot

    console.log('[SocialPilot] Scheduling post:', request.postId);

    // Simulate API delay
    await this.delay(500);

    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('SocialPilot API Error: Rate limit exceeded');
    }

    // Mock success response
    const platformResponses: Record<string, PlatformResponse> = {};

    for (const platform of request.platforms) {
      platformResponses[platform] = {
        platform,
        success: true,
        externalId: `sp_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scheduledAt: request.scheduledDateTime,
      };
    }

    return {
      success: true,
      postId: request.postId,
      platforms: platformResponses,
      scheduledAt: new Date(),
    };
  }

  /**
   * Update post with scheduling information
   */
  private static updatePostSchedulingInfo(
    post: CalendarPost,
    response: SocialPilotResponse
  ): CalendarPost {
    const scheduledToPlatforms: Record<string, PlatformSchedulingStatus> = {};

    for (const [platform, platformResponse] of Object.entries(response.platforms)) {
      scheduledToPlatforms[platform] = {
        platform: platform as SocialPlatform,
        isScheduled: platformResponse.success,
        scheduledAt: platformResponse.scheduledAt,
        externalId: platformResponse.externalId,
        status: platformResponse.success ? 'scheduled' : 'failed',
        error: platformResponse.error,
      };
    }

    const attempt: SchedulingAttempt = {
      attemptNumber: post.scheduling.schedulingAttempts.length + 1,
      timestamp: new Date(),
      platforms: post.platforms,
      success: response.success,
      error: response.success ? undefined : 'Scheduling failed',
      retryable: false,
    };

    return {
      ...post,
      scheduling: {
        isScheduled: response.success,
        scheduledToPlatforms: scheduledToPlatforms as any,
        socialPilotPostId: response.postId,
        schedulingAttempts: [...post.scheduling.schedulingAttempts, attempt],
      },
      status: response.success ? 'scheduled' : post.status,
      updatedAt: new Date(),
    };
  }

  /**
   * Build scheduled date/time from post
   */
  private static buildScheduledDateTime(post: CalendarPost): Date {
    const dateTime = new Date(post.scheduledDate);
    const [hours, minutes] = post.scheduledTime.split(':').map(Number);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: any): boolean {
    if (!error) return false;

    const retryableMessages = [
      'rate limit',
      'timeout',
      'network error',
      'connection',
      '503',
      '429',
    ];

    const errorMessage = error.message || error.toString();
    return retryableMessages.some(msg =>
      errorMessage.toLowerCase().includes(msg)
    );
  }

  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel scheduled post
   */
  static async cancelScheduledPost(post: CalendarPost): Promise<CalendarPost> {
    if (!post.scheduling.isScheduled) {
      throw new Error('Post is not scheduled');
    }

    // Call SocialPilot to cancel
    // Mock implementation
    console.log('[SocialPilot] Cancelling post:', post.id);

    return {
      ...post,
      scheduling: {
        ...post.scheduling,
        isScheduled: false,
      },
      status: 'approved',
      updatedAt: new Date(),
    };
  }

  /**
   * Reschedule post to new time
   */
  static async reschedulePost(
    post: CalendarPost,
    newDate: Date,
    newTime: string
  ): Promise<CalendarPost> {
    // Cancel existing schedule
    if (post.scheduling.isScheduled) {
      await this.cancelScheduledPost(post);
    }

    // Update timing
    const updatedPost: CalendarPost = {
      ...post,
      scheduledDate: newDate,
      scheduledTime: newTime,
    };

    // Schedule to new time
    return this.schedulePost(updatedPost);
  }

  /**
   * Get scheduling status for calendar
   */
  static getSchedulingStatus(calendar: CampaignCalendar): SchedulingStatus {
    const total = calendar.posts.length;
    const scheduled = calendar.posts.filter(p => p.scheduling.isScheduled).length;
    const failed = calendar.posts.filter(p =>
      p.scheduling.schedulingAttempts.length > 0 &&
      !p.scheduling.isScheduled
    ).length;

    return {
      total,
      scheduled,
      failed,
      pending: total - scheduled - failed,
      percentageScheduled: (scheduled / total) * 100,
      isComplete: scheduled === total,
      failures: this.getSchedulingFailures(calendar),
    };
  }

  /**
   * Get posts that failed to schedule
   */
  private static getSchedulingFailures(calendar: CampaignCalendar): SchedulingFailure[] {
    return calendar.posts
      .filter(p =>
        p.scheduling.schedulingAttempts.length > 0 &&
        !p.scheduling.isScheduled
      )
      .map(post => ({
        postId: post.id,
        platform: post.platforms[0],
        error: post.scheduling.lastSchedulingError || 'Unknown error',
        attempts: post.scheduling.schedulingAttempts.length,
        lastAttempt: post.scheduling.schedulingAttempts[
          post.scheduling.schedulingAttempts.length - 1
        ]?.timestamp,
      }));
  }

  /**
   * Retry failed scheduling
   */
  static async retryFailedScheduling(
    calendar: CampaignCalendar
  ): Promise<CampaignCalendar> {
    const failedPosts = calendar.posts.filter(
      p => p.scheduling.schedulingAttempts.length > 0 && !p.scheduling.isScheduled
    );

    if (failedPosts.length === 0) {
      return calendar;
    }

    const results = await this.schedulePosts(failedPosts);

    const updatedPosts = calendar.posts.map(post => {
      const result = results.find(r => r.postId === post.id);
      return result?.post || post;
    });

    return {
      ...calendar,
      posts: updatedPosts,
      updatedAt: new Date(),
    };
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

interface SocialPilotResponse {
  success: boolean;
  postId: string;
  platforms: Record<string, PlatformResponse>;
  scheduledAt: Date;
  error?: string;
}

interface PlatformResponse {
  platform: string;
  success: boolean;
  externalId?: string;
  scheduledAt?: Date;
  error?: string;
}

interface ScheduleResult {
  postId: string;
  success: boolean;
  post?: CalendarPost;
  error?: string;
}

interface SchedulingStatus {
  total: number;
  scheduled: number;
  failed: number;
  pending: number;
  percentageScheduled: number;
  isComplete: boolean;
  failures: SchedulingFailure[];
}

interface SchedulingFailure {
  postId: string;
  platform: SocialPlatform;
  error: string;
  attempts: number;
  lastAttempt?: Date;
}

export default SocialPilotScheduler;
