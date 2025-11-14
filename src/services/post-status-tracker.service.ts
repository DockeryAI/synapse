/**
 * Post Status Tracker Service
 * Tracks publishing status with real-time updates via Supabase subscriptions
 * Monitors post publishing progress and provides status information
 */

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PostStatus {
  contentId: string;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  scheduledTime: Date;
  publishedTime?: Date;
  accountsPosted: number;
  accountsFailed: number;
  platformPostId?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  nextRetry?: Date;
  lastChecked: Date;
}

export interface QueueSummary {
  total: number;
  pending: number;
  publishing: number;
  published: number;
  failed: number;
  scheduledToday: number;
  scheduledThisWeek: number;
}

/**
 * Post Status Tracker
 * Real-time tracking of post publishing status
 */
export class PostStatusTracker {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  constructor() {
    console.log('[StatusTracker] Service initialized');
  }

  //=============================================================================
  // Status Retrieval
  //=============================================================================

  /**
   * Get status for a specific content item
   */
  async getStatus(contentId: string): Promise<PostStatus | null> {
    console.log(`[StatusTracker] Getting status for ${contentId}`);

    try {
      const { data, error } = await supabase
        .from('publishing_queue')
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          console.log(`[StatusTracker] No queue entry for ${contentId}`);
          return null;
        }
        throw error;
      }

      return this.formatStatus(data);
    } catch (error) {
      console.error('[StatusTracker] Failed to get status:', error);
      return null;
    }
  }

  /**
   * Get status for multiple content items
   */
  async getMultipleStatuses(contentIds: string[]): Promise<Map<string, PostStatus>> {
    console.log(`[StatusTracker] Getting status for ${contentIds.length} items`);

    try {
      const { data, error } = await supabase
        .from('publishing_queue')
        .select('*')
        .in('content_id', contentIds);

      if (error) throw error;

      const statusMap = new Map<string, PostStatus>();

      (data || []).forEach((item) => {
        const status = this.formatStatus(item);
        statusMap.set(status.contentId, status);
      });

      return statusMap;
    } catch (error) {
      console.error('[StatusTracker] Failed to get multiple statuses:', error);
      return new Map();
    }
  }

  /**
   * Get queue status for upcoming posts
   */
  async getQueueStatus(days: number = 7): Promise<PostStatus[]> {
    console.log(`[StatusTracker] Getting queue status for next ${days} days`);

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

      return (data || []).map((item) => this.formatStatus(item));
    } catch (error) {
      console.error('[StatusTracker] Failed to get queue status:', error);
      return [];
    }
  }

  /**
   * Get queue summary statistics
   */
  async getQueueSummary(days: number = 30): Promise<QueueSummary> {
    console.log(`[StatusTracker] Getting queue summary for next ${days} days`);

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { data, error } = await supabase
        .from('publishing_queue')
        .select('*')
        .gte('scheduled_time', startDate.toISOString())
        .lte('scheduled_time', endDate.toISOString());

      if (error) throw error;

      const items = data || [];

      // Calculate summary
      const now = new Date();
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);

      const summary: QueueSummary = {
        total: items.length,
        pending: items.filter((i) => i.status === 'pending').length,
        publishing: items.filter((i) => i.status === 'publishing').length,
        published: items.filter((i) => i.status === 'published').length,
        failed: items.filter((i) => i.status === 'failed').length,
        scheduledToday: items.filter(
          (i) =>
            new Date(i.scheduled_time) >= now && new Date(i.scheduled_time) <= todayEnd
        ).length,
        scheduledThisWeek: items.filter(
          (i) => new Date(i.scheduled_time) >= now && new Date(i.scheduled_time) <= weekEnd
        ).length,
      };

      return summary;
    } catch (error) {
      console.error('[StatusTracker] Failed to get queue summary:', error);
      return {
        total: 0,
        pending: 0,
        publishing: 0,
        published: 0,
        failed: 0,
        scheduledToday: 0,
        scheduledThisWeek: 0,
      };
    }
  }

  //=============================================================================
  // Real-time Subscriptions
  //=============================================================================

  /**
   * Subscribe to status updates for a specific content item
   * Returns unsubscribe function
   */
  async subscribeToUpdates(
    contentId: string,
    callback: (status: PostStatus | null) => void
  ): Promise<() => void> {
    console.log(`[StatusTracker] Subscribing to updates for ${contentId}`);

    // Check if already subscribed
    if (this.subscriptions.has(contentId)) {
      console.warn(`[StatusTracker] Already subscribed to ${contentId}`);
      return () => this.unsubscribe(contentId);
    }

    try {
      const channel = supabase
        .channel(`post-status-${contentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'publishing_queue',
            filter: `content_id=eq.${contentId}`,
          },
          (payload) => {
            console.log(`[StatusTracker] Update received for ${contentId}:`, payload);

            if (payload.eventType === 'DELETE') {
              callback(null);
            } else {
              const status = this.formatStatus(payload.new);
              callback(status);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[StatusTracker] Subscribed to ${contentId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[StatusTracker] Subscription error for ${contentId}`);
          }
        });

      this.subscriptions.set(contentId, channel);

      // Return unsubscribe function
      return () => this.unsubscribe(contentId);
    } catch (error) {
      console.error('[StatusTracker] Failed to subscribe:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to all queue updates
   */
  async subscribeToQueue(callback: (status: PostStatus) => void): Promise<() => void> {
    console.log('[StatusTracker] Subscribing to queue updates');

    const channelName = 'queue-updates';

    // Check if already subscribed
    if (this.subscriptions.has(channelName)) {
      console.warn('[StatusTracker] Already subscribed to queue');
      return () => this.unsubscribe(channelName);
    }

    try {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'publishing_queue',
          },
          (payload) => {
            console.log('[StatusTracker] Queue update received:', payload);

            if (payload.eventType !== 'DELETE') {
              const status = this.formatStatus(payload.new);
              callback(status);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[StatusTracker] Subscribed to queue');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[StatusTracker] Queue subscription error');
          }
        });

      this.subscriptions.set(channelName, channel);

      return () => this.unsubscribe(channelName);
    } catch (error) {
      console.error('[StatusTracker] Failed to subscribe to queue:', error);
      return () => {};
    }
  }

  /**
   * Unsubscribe from updates
   */
  private async unsubscribe(key: string): Promise<void> {
    console.log(`[StatusTracker] Unsubscribing from ${key}`);

    const channel = this.subscriptions.get(key);

    if (channel) {
      await supabase.removeChannel(channel);
      this.subscriptions.delete(key);
      console.log(`[StatusTracker] Unsubscribed from ${key}`);
    }
  }

  /**
   * Unsubscribe from all updates
   */
  async unsubscribeAll(): Promise<void> {
    console.log('[StatusTracker] Unsubscribing from all channels');

    const keys = Array.from(this.subscriptions.keys());

    for (const key of keys) {
      await this.unsubscribe(key);
    }
  }

  //=============================================================================
  // Helper Methods
  //=============================================================================

  /**
   * Format database record to PostStatus
   */
  private formatStatus(data: any): PostStatus {
    return {
      contentId: data.content_id,
      status: data.status,
      scheduledTime: new Date(data.scheduled_time),
      publishedTime: data.published_at ? new Date(data.published_at) : undefined,
      accountsPosted: data.accounts_posted || 0,
      accountsFailed: data.accounts_failed || 0,
      platformPostId: data.platform_post_id,
      error: data.error_message,
      retryCount: data.retry_count || 0,
      maxRetries: data.max_retries || 3,
      nextRetry: data.next_retry ? new Date(data.next_retry) : undefined,
      lastChecked: new Date(),
    };
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage(status: PostStatus): string {
    switch (status.status) {
      case 'pending':
        if (status.retryCount > 0) {
          return `Scheduled for retry ${status.retryCount}/${status.maxRetries}`;
        }
        return 'Scheduled for publishing';

      case 'publishing':
        return 'Publishing now...';

      case 'published':
        return 'Successfully published';

      case 'failed':
        return `Failed after ${status.retryCount} attempts`;

      default:
        return 'Unknown status';
    }
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: PostStatus['status']): string {
    const colors = {
      pending: 'text-orange-600 bg-orange-50',
      publishing: 'text-blue-600 bg-blue-50',
      published: 'text-green-600 bg-green-50',
      failed: 'text-red-600 bg-red-50',
    };

    return colors[status] || 'text-gray-600 bg-gray-50';
  }

  /**
   * Calculate time until scheduled
   */
  getTimeUntilScheduled(scheduledTime: Date): string {
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();

    if (diff < 0) {
      return 'Overdue';
    }

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'in less than a minute';
    }
  }
}

// Export singleton instance
export const postStatusTracker = new PostStatusTracker();
