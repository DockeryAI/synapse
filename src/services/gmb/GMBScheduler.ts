/**
 * GMB Post Scheduler
 *
 * Handles 2x/week posting schedule, post type rotation, and campaign integration.
 * Because someone thought "let's automate posting to a deprecated API" was a good idea.
 */

import { supabase } from '../../lib/supabase';
import { getGMBService } from './GMBService';
import type {
  GMBScheduledPost,
  GMBPostingSchedule,
  GMBPostType,
  GMBContentGenerationRequest,
  GMBPost,
} from '../../types/gmb.types';

export class GMBScheduler {
  private readonly DEFAULT_POSTING_DAYS = [2, 5]; // Tuesday and Friday
  private readonly DEFAULT_POSTING_TIME = '10:00'; // 10 AM
  private readonly POST_TYPE_ROTATION: GMBPostType[] = ['UPDATE', 'OFFER', 'EVENT', 'UPDATE'];

  /**
   * Create or update posting schedule for a location
   */
  async createSchedule(
    userId: string,
    locationId: string,
    schedule: Partial<GMBPostingSchedule>
  ): Promise<GMBPostingSchedule> {
    try {
      const fullSchedule: GMBPostingSchedule = {
        location_id: locationId,
        frequency: schedule.frequency || 'twice_weekly',
        days_of_week: schedule.days_of_week || this.DEFAULT_POSTING_DAYS,
        time_of_day: schedule.time_of_day || this.DEFAULT_POSTING_TIME,
        post_type_rotation: schedule.post_type_rotation || this.POST_TYPE_ROTATION,
        enabled: schedule.enabled !== undefined ? schedule.enabled : true,
      };

      const { data, error } = await supabase
        .from('gmb_posting_schedules')
        .upsert({
          user_id: userId,
          ...fullSchedule,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create schedule: ${error.message}`);
      }

      // Generate scheduled posts for next 2 weeks
      await this.generateScheduledPosts(userId, locationId, fullSchedule);

      return data as GMBPostingSchedule;
    } catch (error) {
      console.error('Error creating GMB schedule:', error);
      throw error;
    }
  }

  /**
   * Generate scheduled posts based on posting schedule
   */
  private async generateScheduledPosts(
    userId: string,
    locationId: string,
    schedule: GMBPostingSchedule
  ): Promise<void> {
    if (!schedule.enabled) {
      return;
    }

    const scheduledDates = this.calculatePostingDates(
      schedule.days_of_week!,
      schedule.time_of_day!,
      14 // Next 2 weeks
    );

    // Delete existing pending posts for this location
    await supabase
      .from('gmb_scheduled_posts')
      .delete()
      .eq('location_id', locationId)
      .eq('status', 'pending');

    // Create new scheduled posts
    const posts = scheduledDates.map((date, index) => {
      const postType = schedule.post_type_rotation![index % schedule.post_type_rotation!.length];

      return {
        user_id: userId,
        location_id: locationId,
        post_type: postType,
        scheduled_for: date.toISOString(),
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase.from('gmb_scheduled_posts').insert(posts);

    if (error) {
      console.error('Error generating scheduled posts:', error);
      throw new Error(`Failed to generate scheduled posts: ${error.message}`);
    }
  }

  /**
   * Calculate posting dates based on schedule
   */
  private calculatePostingDates(
    daysOfWeek: number[],
    timeOfDay: string,
    daysAhead: number
  ): Date[] {
    const dates: Date[] = [];
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(hours, minutes, 0, 0);

      if (daysOfWeek.includes(date.getDay()) && date > now) {
        dates.push(date);
      }
    }

    return dates;
  }

  /**
   * Schedule a post from campaign
   */
  async scheduleFromCampaign(
    userId: string,
    locationId: string,
    campaignId: string,
    postContent: Partial<GMBPost>,
    scheduledFor: Date
  ): Promise<GMBScheduledPost> {
    try {
      const { data, error } = await supabase
        .from('gmb_scheduled_posts')
        .insert({
          user_id: userId,
          location_id: locationId,
          campaign_id: campaignId,
          post_type: 'UPDATE', // Default, will be determined by content
          content: postContent,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to schedule post: ${error.message}`);
      }

      return data as GMBScheduledPost;
    } catch (error) {
      console.error('Error scheduling post from campaign:', error);
      throw error;
    }
  }

  /**
   * Auto-generate and schedule GMB content from campaign
   */
  async autoScheduleFromCampaign(
    userId: string,
    locationId: string,
    campaignId: string,
    campaignData: {
      type: string;
      theme: string;
      business_name: string;
      industry: string;
      location: string;
    }
  ): Promise<GMBScheduledPost[]> {
    try {
      // Get posting schedule
      const { data: scheduleData } = await supabase
        .from('gmb_posting_schedules')
        .select('*')
        .eq('location_id', locationId)
        .eq('enabled', true)
        .single();

      if (!scheduleData) {
        throw new Error('No active posting schedule found for this location');
      }

      const schedule = scheduleData as GMBPostingSchedule;

      // Calculate next 4 posting dates (2 weeks)
      const postingDates = this.calculatePostingDates(
        schedule.days_of_week!,
        schedule.time_of_day!,
        14
      ).slice(0, 4);

      // Generate content for each post
      const scheduledPosts: GMBScheduledPost[] = [];

      for (let i = 0; i < postingDates.length; i++) {
        const postType = schedule.post_type_rotation![i % schedule.post_type_rotation!.length];
        const content = await this.generateGMBContent(
          {
            business_name: campaignData.business_name,
            industry: campaignData.industry,
            location: campaignData.location,
            post_type: postType,
            campaign_context: {
              campaign_id: campaignId,
              campaign_type: campaignData.type,
              theme: campaignData.theme,
            },
          }
        );

        const post = await this.scheduleFromCampaign(
          userId,
          locationId,
          campaignId,
          content,
          postingDates[i]
        );

        scheduledPosts.push(post);
      }

      return scheduledPosts;
    } catch (error) {
      console.error('Error auto-scheduling from campaign:', error);
      throw error;
    }
  }

  /**
   * Generate GMB content using AI
   */
  private async generateGMBContent(
    request: GMBContentGenerationRequest
  ): Promise<Partial<GMBPost>> {
    // TODO: Integrate with OpenRouter/Claude for content generation
    // For now, return template-based content

    const templates = this.getContentTemplates();
    const template = templates[request.post_type];

    if (!template) {
      throw new Error(`No template found for post type: ${request.post_type}`);
    }

    // Simple template substitution
    let summary = template
      .replace('{business_name}', request.business_name)
      .replace('{location}', request.location)
      .replace('{industry}', request.industry);

    if (request.campaign_context) {
      summary = `${request.campaign_context.theme}\n\n${summary}`;
    }

    const post: Partial<GMBPost> = {
      languageCode: 'en-US',
      summary: summary.substring(0, 1500), // GMB limit
    };

    // Add call to action based on post type
    if (request.post_type === 'OFFER') {
      post.callToAction = {
        actionType: 'SHOP',
      };
    } else if (request.post_type === 'EVENT') {
      post.callToAction = {
        actionType: 'SIGN_UP',
      };
    } else {
      post.callToAction = {
        actionType: 'LEARN_MORE',
      };
    }

    return post;
  }

  /**
   * Get content templates for each post type
   */
  private getContentTemplates(): Record<GMBPostType, string> {
    return {
      UPDATE: `🎉 Exciting update from {business_name}!\n\nWe're committed to serving {location} with exceptional {industry} services. Stop by and see what's new!\n\n#Local #SmallBusiness #Community`,

      OFFER: `💥 SPECIAL OFFER! 💥\n\n{business_name} is offering an exclusive deal for our {location} customers!\n\nDon't miss out - limited time only!\n\n👉 Visit us today and save!\n\n#LocalDeals #SpecialOffer`,

      EVENT: `📅 Join us for an exciting event!\n\n{business_name} is hosting a special event in {location}. Come celebrate with us and enjoy:\n\n✨ Great atmosphere\n✨ Special surprises\n✨ Community connection\n\nSee you there! 🎉\n\n#LocalEvent #Community`,

      PRODUCT: `🛍️ Featured Product Alert!\n\n{business_name} is proud to offer quality {industry} products and services to {location}.\n\nVisit us today to explore our latest offerings!\n\n#ShopLocal #Quality`,
    };
  }

  /**
   * Process due posts (run this on a schedule)
   */
  async processDuePosts(): Promise<void> {
    try {
      const now = new Date();

      // Get all pending posts that are due
      const { data: duePosts, error } = await supabase
        .from('gmb_scheduled_posts')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', now.toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch due posts: ${error.message}`);
      }

      if (!duePosts || duePosts.length === 0) {
        return;
      }

      console.log(`Processing ${duePosts.length} due GMB posts`);

      for (const post of duePosts as GMBScheduledPost[]) {
        await this.publishPost(post);
      }
    } catch (error) {
      console.error('Error processing due posts:', error);
      throw error;
    }
  }

  /**
   * Publish a scheduled post
   */
  private async publishPost(post: GMBScheduledPost): Promise<void> {
    try {
      const gmbService = getGMBService();

      // Load user's GMB connection
      const connection = await gmbService.loadConnection(post.user_id);

      if (!connection) {
        throw new Error('GMB connection not found or expired');
      }

      // Get location resource name
      const location = connection.locations.find(
        loc => loc.location_id === post.location_id
      );

      if (!location) {
        throw new Error('Location not found in connection');
      }

      const locationName = `accounts/${connection.account_id}/locations/${post.location_id}`;

      // Publish the post
      // Note: This will fail until we implement the actual posting API
      // since Google deprecated the Posts API
      try {
        const result = await gmbService.createPost(
          locationName,
          post.post_type,
          post.content
        );

        // Update post status
        await supabase
          .from('gmb_scheduled_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            gmb_post_name: result.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        console.log(`✅ Published GMB post ${post.id} to location ${post.location_id}`);
      } catch (postError: any) {
        // Handle posting error
        await this.handlePostError(post, postError);
      }
    } catch (error) {
      console.error(`Error publishing post ${post.id}:`, error);
      await this.handlePostError(post, error);
    }
  }

  /**
   * Handle post publishing error
   */
  private async handlePostError(post: GMBScheduledPost, error: any): Promise<void> {
    const maxRetries = 3;
    const retryCount = post.retry_count + 1;

    if (retryCount < maxRetries) {
      // Retry later
      const retryDelay = Math.pow(2, retryCount) * 60 * 60 * 1000; // Exponential backoff in hours
      const retryAt = new Date(Date.now() + retryDelay);

      await supabase
        .from('gmb_scheduled_posts')
        .update({
          retry_count: retryCount,
          error_message: error.message,
          scheduled_for: retryAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      console.log(`⚠️ Post ${post.id} failed, will retry at ${retryAt.toISOString()}`);
    } else {
      // Max retries exceeded, mark as failed
      await supabase
        .from('gmb_scheduled_posts')
        .update({
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      console.error(`❌ Post ${post.id} failed after ${maxRetries} retries`);
    }
  }

  /**
   * Get scheduled posts for a location
   */
  async getScheduledPosts(
    locationId: string,
    status?: GMBScheduledPost['status']
  ): Promise<GMBScheduledPost[]> {
    try {
      let query = supabase
        .from('gmb_scheduled_posts')
        .select('*')
        .eq('location_id', locationId)
        .order('scheduled_for', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch scheduled posts: ${error.message}`);
      }

      return (data || []) as GMBScheduledPost[];
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled post
   */
  async cancelPost(postId: string): Promise<void> {
    try {
      await supabase
        .from('gmb_scheduled_posts')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('status', 'pending');
    } catch (error) {
      console.error('Error cancelling post:', error);
      throw error;
    }
  }

  /**
   * Get posting statistics for a location
   */
  async getPostingStats(locationId: string): Promise<{
    total: number;
    published: number;
    pending: number;
    failed: number;
    cancelled: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('gmb_scheduled_posts')
        .select('status')
        .eq('location_id', locationId);

      if (error) {
        throw new Error(`Failed to fetch posting stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        published: 0,
        pending: 0,
        failed: 0,
        cancelled: 0,
      };

      data.forEach((post: any) => {
        stats[post.status as keyof typeof stats]++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching posting stats:', error);
      throw error;
    }
  }
}

// Singleton instance
let schedulerInstance: GMBScheduler | null = null;

export function getGMBScheduler(): GMBScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new GMBScheduler();
  }
  return schedulerInstance;
}

export default GMBScheduler;
