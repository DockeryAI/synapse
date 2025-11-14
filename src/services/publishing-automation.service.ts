/**
 * Publishing Automation Service
 * Background service that monitors publishing queue and auto-publishes content
 * Runs every 5 minutes, handles retries, and updates status in real-time
 */

import { supabase } from '@/lib/supabase';
import { createSocialPilotService } from './socialpilot.service';

export interface PublishingJob {
  id: string;
  content_id: string;
  scheduled_time: string;
  account_ids: string[];
  content: string;
  media?: string[];
  hashtags?: string[];
  status: 'pending' | 'publishing' | 'published' | 'failed';
  retry_count: number;
  max_retries: number;
  platform_post_id?: string;
  error_message?: string;
  next_retry?: string;
}

/**
 * Publishing Automation Service
 * Singleton service that runs in the background
 */
export class PublishingAutomationService {
  private intervalId?: ReturnType<typeof setInterval>;
  private isRunning = false;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly RETRY_DELAY = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_RETRIES = 3;

  constructor() {
    console.log('[Publishing] Service initialized');
  }

  /**
   * Start the automation engine
   * Begins checking queue every 5 minutes
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[Publishing] Automation already running');
      return;
    }

    this.isRunning = true;

    // Process immediately on start
    this.processQueue().catch((error) => {
      console.error('[Publishing] Initial processing failed:', error);
    });

    // Then process every 5 minutes
    this.intervalId = setInterval(() => {
      this.processQueue().catch((error) => {
        console.error('[Publishing] Queue processing failed:', error);
      });
    }, this.CHECK_INTERVAL);

    console.log(`[Publishing] Automation started (checking every ${this.CHECK_INTERVAL / 1000}s)`);
  }

  /**
   * Stop the automation engine
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
    console.log('[Publishing] Automation stopped');
  }

  /**
   * Check if automation is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger queue processing (for testing/debugging)
   */
  async triggerProcessing(): Promise<void> {
    console.log('[Publishing] Manual processing triggered');
    await this.processQueue();
  }

  //=============================================================================
  // Queue Processing
  //=============================================================================

  /**
   * Process the publishing queue
   * Gets items due for publishing and processes each one
   */
  private async processQueue(): Promise<void> {
    const startTime = Date.now();
    console.log('[Publishing] Processing queue...');

    try {
      // Get all items due for publishing
      const dueItems = await this.getDueItems();

      if (dueItems.length === 0) {
        console.log('[Publishing] No items due for publishing');
        return;
      }

      console.log(`[Publishing] Found ${dueItems.length} items to publish`);

      // Process each item
      let successCount = 0;
      let failureCount = 0;

      for (const item of dueItems) {
        try {
          await this.publishItem(item);
          successCount++;
        } catch (error) {
          console.error(`[Publishing] Failed to publish item ${item.content_id}:`, error);
          failureCount++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[Publishing] Queue processed in ${duration}ms - ${successCount} succeeded, ${failureCount} failed`
      );
    } catch (error) {
      console.error('[Publishing] Queue processing error:', error);
      throw error;
    }
  }

  /**
   * Get items due for publishing within next 5 minutes
   */
  private async getDueItems(): Promise<PublishingJob[]> {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + this.CHECK_INTERVAL);

      const { data, error } = await supabase
        .from('publishing_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_time', fiveMinutesFromNow.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('[Publishing] Failed to fetch due items:', error);
        throw error;
      }

      return (data || []) as PublishingJob[];
    } catch (error) {
      console.error('[Publishing] getDueItems error:', error);
      return [];
    }
  }

  //=============================================================================
  // Item Publishing
  //=============================================================================

  /**
   * Publish a single item
   */
  private async publishItem(job: PublishingJob): Promise<void> {
    console.log(`[Publishing] Publishing ${job.content_id}...`);

    try {
      // Update status to 'publishing'
      await this.updateJobStatus(job.id, 'publishing');

      // Publish via SocialPilot
      const service = createSocialPilotService();

      if (!service.isAuthenticated()) {
        throw new Error('Not authenticated with SocialPilot');
      }

      const result = await service.schedulePost({
        accountIds: job.account_ids,
        content: job.content,
        scheduledTime: new Date(job.scheduled_time),
        media: job.media,
        hashtags: job.hashtags,
      });

      // Update status to 'published'
      await this.markAsPublished(job, result.id);

      // Update content calendar item status
      await this.updateContentItemStatus(job.content_id, 'published', result.id);

      console.log(`[Publishing] ✓ Successfully published ${job.content_id}`);
    } catch (error) {
      console.error(`[Publishing] ✗ Failed to publish ${job.content_id}:`, error);

      // Handle retries
      if (job.retry_count < job.max_retries) {
        await this.scheduleRetry(job, error);
      } else {
        await this.markAsFailed(job, error);
      }
    }
  }

  /**
   * Schedule a retry for failed publish
   */
  private async scheduleRetry(job: PublishingJob, error: any): Promise<void> {
    const nextRetryTime = new Date(Date.now() + this.RETRY_DELAY);
    const newRetryCount = job.retry_count + 1;

    console.log(
      `[Publishing] Scheduling retry ${newRetryCount}/${job.max_retries} for ${job.content_id} at ${nextRetryTime.toISOString()}`
    );

    try {
      const { error: updateError } = await supabase
        .from('publishing_queue')
        .update({
          status: 'pending',
          retry_count: newRetryCount,
          next_retry: nextRetryTime.toISOString(),
          error_message: error instanceof Error ? error.message : String(error),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (updateError) {
        console.error('[Publishing] Failed to schedule retry:', updateError);
      }
    } catch (err) {
      console.error('[Publishing] scheduleRetry error:', err);
    }
  }

  /**
   * Mark item as published
   */
  private async markAsPublished(job: PublishingJob, platformPostId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('publishing_queue')
        .update({
          status: 'published',
          platform_post_id: platformPostId,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (error) {
        console.error('[Publishing] Failed to mark as published:', error);
      }
    } catch (err) {
      console.error('[Publishing] markAsPublished error:', err);
    }
  }

  /**
   * Mark item as failed after max retries
   */
  private async markAsFailed(job: PublishingJob, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(
      `[Publishing] Marking ${job.content_id} as failed after ${job.retry_count} retries`
    );

    try {
      // Update publishing queue
      const { error: queueError } = await supabase
        .from('publishing_queue')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (queueError) {
        console.error('[Publishing] Failed to mark queue item as failed:', queueError);
      }

      // Update content calendar item
      await this.updateContentItemStatus(job.content_id, 'failed', undefined, errorMessage);
    } catch (err) {
      console.error('[Publishing] markAsFailed error:', err);
    }
  }

  //=============================================================================
  // Database Updates
  //=============================================================================

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: 'pending' | 'publishing' | 'published' | 'failed'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('publishing_queue')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) {
        console.error('[Publishing] Failed to update job status:', error);
      }
    } catch (err) {
      console.error('[Publishing] updateJobStatus error:', err);
    }
  }

  /**
   * Update content calendar item status
   */
  private async updateContentItemStatus(
    contentId: string,
    status: 'scheduled' | 'published' | 'failed',
    platformPostId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'published' && platformPostId) {
        updates.platform_post_id = platformPostId;
        updates.published_at = new Date().toISOString();
      }

      if (status === 'failed' && errorMessage) {
        updates.publish_error = errorMessage;
      }

      const { error } = await supabase
        .from('content_calendar_items')
        .update(updates)
        .eq('id', contentId);

      if (error) {
        console.error('[Publishing] Failed to update content item status:', error);
      }
    } catch (err) {
      console.error('[Publishing] updateContentItemStatus error:', err);
    }
  }

  //=============================================================================
  // Queue Management
  //=============================================================================

  /**
   * Add item to publishing queue
   */
  async addToQueue(params: {
    contentId: string;
    accountIds: string[];
    content: string;
    scheduledTime: Date;
    media?: string[];
    hashtags?: string[];
  }): Promise<string> {
    console.log(`[Publishing] Adding ${params.contentId} to queue for ${params.scheduledTime}`);

    try {
      const { data, error } = await supabase
        .from('publishing_queue')
        .insert({
          content_id: params.contentId,
          account_ids: params.accountIds,
          content: params.content,
          scheduled_time: params.scheduledTime.toISOString(),
          media: params.media || [],
          hashtags: params.hashtags || [],
          status: 'pending',
          retry_count: 0,
          max_retries: this.MAX_RETRIES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[Publishing] Added to queue: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('[Publishing] Failed to add to queue:', error);
      throw error;
    }
  }

  /**
   * Remove item from queue
   */
  async removeFromQueue(contentId: string): Promise<void> {
    console.log(`[Publishing] Removing ${contentId} from queue`);

    try {
      const { error } = await supabase
        .from('publishing_queue')
        .delete()
        .eq('content_id', contentId);

      if (error) throw error;

      console.log(`[Publishing] Removed from queue: ${contentId}`);
    } catch (error) {
      console.error('[Publishing] Failed to remove from queue:', error);
      throw error;
    }
  }

  /**
   * Get queue status for content item
   */
  async getQueueStatus(contentId: string): Promise<PublishingJob | null> {
    try {
      const { data, error } = await supabase
        .from('publishing_queue')
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      return data as PublishingJob;
    } catch (error) {
      console.error('[Publishing] Failed to get queue status:', error);
      return null;
    }
  }

  /**
   * Get all items in queue
   */
  async getQueueItems(days: number = 7): Promise<PublishingJob[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { data, error } = await supabase
        .from('publishing_queue')
        .select('*')
        .gte('scheduled_time', startDate.toISOString())
        .lte('scheduled_time', endDate.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      return (data || []) as PublishingJob[];
    } catch (error) {
      console.error('[Publishing] Failed to get queue items:', error);
      return [];
    }
  }
}

// Export singleton instance
export const publishingAutomation = new PublishingAutomationService();

// Auto-start automation in browser environment
if (typeof window !== 'undefined') {
  // Start after a short delay to ensure app is initialized
  setTimeout(() => {
    publishingAutomation.start();
    console.log('[Publishing] Automation auto-started');
  }, 2000);
}
