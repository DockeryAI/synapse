/**
 * Content Queue Service
 * Manages publishing queue operations and status updates
 * Task 3.4 - Publishing Queue Implementation
 */

import type {
  ContentItem,
  Platform,
  PublishingQueueItem,
  QueueStatus,
} from '@/types/content-calendar.types';
import { publishToPlatformMock } from '@/lib/platform-apis';

/**
 * Queue filters
 */
export interface QueueFilters {
  platform?: Platform;
  status?: QueueStatus;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Queue sort options
 */
export type QueueSortBy = 'date' | 'platform' | 'status';
export type QueueSortOrder = 'asc' | 'desc';

/**
 * Publishing result
 */
export interface PublishingResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
  timestamp: string;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  total: number;
  pending: number;
  scheduled: number;
  publishing: number;
  published: number;
  failed: number;
  byPlatform: Record<Platform, number>;
}

/**
 * In-memory queue storage (would be database in production)
 */
class QueueStorage {
  private queue: Map<string, PublishingQueueItem> = new Map();
  private publishHistory: Map<string, PublishingResult[]> = new Map();

  /**
   * Add item to queue
   */
  add(item: PublishingQueueItem): void {
    this.queue.set(item.content.id, item);
  }

  /**
   * Get item from queue
   */
  get(itemId: string): PublishingQueueItem | undefined {
    return this.queue.get(itemId);
  }

  /**
   * Update item in queue
   */
  update(itemId: string, updates: Partial<PublishingQueueItem>): void {
    const item = this.queue.get(itemId);
    if (item) {
      this.queue.set(itemId, { ...item, ...updates });
    }
  }

  /**
   * Remove item from queue
   */
  remove(itemId: string): void {
    this.queue.delete(itemId);
  }

  /**
   * Get all items
   */
  getAll(): PublishingQueueItem[] {
    return Array.from(this.queue.values());
  }

  /**
   * Add to publish history
   */
  addHistory(itemId: string, result: PublishingResult): void {
    const history = this.publishHistory.get(itemId) || [];
    history.push(result);
    this.publishHistory.set(itemId, history);
  }

  /**
   * Get publish history
   */
  getHistory(itemId: string): PublishingResult[] {
    return this.publishHistory.get(itemId) || [];
  }

  /**
   * Clear all (for testing)
   */
  clear(): void {
    this.queue.clear();
    this.publishHistory.clear();
  }
}

const storage = new QueueStorage();

/**
 * Add content item to publishing queue
 */
export function addToQueue(contentItem: ContentItem): PublishingQueueItem {
  const queueItem: PublishingQueueItem = {
    content: contentItem,
    status: 'pending',
    retry_count: 0,
    created_at: new Date().toISOString(),
  };

  storage.add(queueItem);

  return queueItem;
}

/**
 * Update queue item status
 */
export function updateStatus(
  itemId: string,
  status: QueueStatus,
  error?: string
): PublishingQueueItem | null {
  const item = storage.get(itemId);

  if (!item) {
    console.error('Queue item not found:', itemId);
    return null;
  }

  const updates: Partial<PublishingQueueItem> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (error) {
    updates.error = error;
  }

  if (status === 'published') {
    updates.published_at = new Date().toISOString();
  }

  storage.update(itemId, updates);

  return storage.get(itemId) || null;
}

/**
 * Publish content now (triggers mock publish)
 */
export async function publishNow(itemId: string): Promise<PublishingResult> {
  const item = storage.get(itemId);

  if (!item) {
    const result: PublishingResult = {
      success: false,
      error: 'Queue item not found',
      timestamp: new Date().toISOString(),
    };

    storage.addHistory(itemId, result);
    return result;
  }

  // Update status to publishing
  updateStatus(itemId, 'publishing');

  try {
    // Call mock publish function
    const publishResult = await publishToPlatformMock(
      item.content.platform,
      {
        content: item.content.content_text,
        imageUrl: item.content.image_url,
        scheduledTime: item.content.scheduled_time,
      }
    );

    const result: PublishingResult = {
      success: publishResult.success,
      platformPostId: publishResult.platformPostId,
      error: publishResult.error,
      timestamp: new Date().toISOString(),
    };

    // Update status based on result
    if (publishResult.success) {
      updateStatus(itemId, 'published');

      // Update content item with platform post ID
      const updatedContent = {
        ...item.content,
        status: 'published' as const,
        platform_post_id: publishResult.platformPostId,
        published_at: new Date().toISOString(),
      };

      storage.update(itemId, { content: updatedContent });
    } else {
      updateStatus(itemId, 'failed', publishResult.error);
    }

    // Add to history
    storage.addHistory(itemId, result);

    return result;
  } catch (error: any) {
    const result: PublishingResult = {
      success: false,
      error: error.message || 'Unknown error during publishing',
      timestamp: new Date().toISOString(),
    };

    updateStatus(itemId, 'failed', result.error);
    storage.addHistory(itemId, result);

    return result;
  }
}

/**
 * Get queue items with filters
 */
export function getQueueItems(filters?: QueueFilters): PublishingQueueItem[] {
  let items = storage.getAll();

  if (!filters) {
    return items;
  }

  // Filter by platform
  if (filters.platform) {
    items = items.filter(item => item.content.platform === filters.platform);
  }

  // Filter by status
  if (filters.status) {
    items = items.filter(item => item.status === filters.status);
  }

  // Filter by date range
  if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);

    items = items.filter(item => {
      if (!item.content.scheduled_time) return false;

      const itemDate = new Date(item.content.scheduled_time);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  return items;
}

/**
 * Sort queue items
 */
export function sortQueueItems(
  items: PublishingQueueItem[],
  sortBy: QueueSortBy,
  sortOrder: QueueSortOrder = 'asc'
): PublishingQueueItem[] {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        const dateA = a.content.scheduled_time
          ? new Date(a.content.scheduled_time).getTime()
          : 0;
        const dateB = b.content.scheduled_time
          ? new Date(b.content.scheduled_time).getTime()
          : 0;
        comparison = dateA - dateB;
        break;

      case 'platform':
        comparison = a.content.platform.localeCompare(b.content.platform);
        break;

      case 'status':
        const statusOrder = ['pending', 'scheduled', 'publishing', 'published', 'failed'];
        const statusA = statusOrder.indexOf(a.status);
        const statusB = statusOrder.indexOf(b.status);
        comparison = statusA - statusB;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Retry failed publish
 */
export async function retryFailed(itemId: string): Promise<PublishingResult> {
  const item = storage.get(itemId);

  if (!item) {
    return {
      success: false,
      error: 'Queue item not found',
      timestamp: new Date().toISOString(),
    };
  }

  if (item.status !== 'failed') {
    return {
      success: false,
      error: 'Can only retry failed items',
      timestamp: new Date().toISOString(),
    };
  }

  // Increment retry count
  const retryCount = (item.retry_count || 0) + 1;
  storage.update(itemId, { retry_count: retryCount });

  // Attempt to publish again
  return await publishNow(itemId);
}

/**
 * Get queue statistics
 */
export function getQueueStats(items?: PublishingQueueItem[]): QueueStats {
  const queueItems = items || storage.getAll();

  const stats: QueueStats = {
    total: queueItems.length,
    pending: 0,
    scheduled: 0,
    publishing: 0,
    published: 0,
    failed: 0,
    byPlatform: {
      instagram: 0,
      twitter: 0,
      linkedin: 0,
      facebook: 0,
      tiktok: 0,
      email: 0,
      blog: 0,
    },
  };

  queueItems.forEach(item => {
    // Count by status
    stats[item.status]++;

    // Count by platform
    if (item.content.platform in stats.byPlatform) {
      stats.byPlatform[item.content.platform]++;
    }
  });

  return stats;
}

/**
 * Bulk actions: publish multiple items
 */
export async function bulkPublish(itemIds: string[]): Promise<PublishingResult[]> {
  const results: PublishingResult[] = [];

  for (const itemId of itemIds) {
    const result = await publishNow(itemId);
    results.push(result);

    // Add small delay between publishes to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Bulk actions: reschedule multiple items
 */
export function bulkReschedule(
  itemIds: string[],
  newTimes: Record<string, string>
): PublishingQueueItem[] {
  const updated: PublishingQueueItem[] = [];

  itemIds.forEach(itemId => {
    const item = storage.get(itemId);
    const newTime = newTimes[itemId];

    if (item && newTime) {
      const updatedContent = {
        ...item.content,
        scheduled_time: newTime,
      };

      storage.update(itemId, {
        content: updatedContent,
        updated_at: new Date().toISOString(),
      });

      const updatedItem = storage.get(itemId);
      if (updatedItem) {
        updated.push(updatedItem);
      }
    }
  });

  return updated;
}

/**
 * Bulk actions: cancel multiple items
 */
export function bulkCancel(itemIds: string[]): void {
  itemIds.forEach(itemId => {
    const item = storage.get(itemId);

    if (item && item.status !== 'published') {
      updateStatus(itemId, 'failed', 'Cancelled by user');
    }
  });
}

/**
 * Get publish history for an item
 */
export function getPublishHistory(itemId: string): PublishingResult[] {
  return storage.getHistory(itemId);
}

/**
 * Process scheduled items (would be called by cron job)
 */
export async function processScheduledItems(): Promise<void> {
  const now = new Date();
  const items = storage.getAll();

  // Find items that should be published now
  const itemsToPublish = items.filter(item => {
    if (item.status !== 'pending' && item.status !== 'scheduled') {
      return false;
    }

    if (!item.content.scheduled_time) {
      return false;
    }

    const scheduledTime = new Date(item.content.scheduled_time);
    return scheduledTime <= now;
  });

  // Publish each item
  for (const item of itemsToPublish) {
    console.log(`Auto-publishing item ${item.content.id} at ${now.toISOString()}`);
    await publishNow(item.content.id);

    // Add delay between publishes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Clear storage (for testing)
 */
export function clearQueue(): void {
  storage.clear();
}

export default {
  addToQueue,
  updateStatus,
  publishNow,
  getQueueItems,
  sortQueueItems,
  retryFailed,
  getQueueStats,
  bulkPublish,
  bulkReschedule,
  bulkCancel,
  getPublishHistory,
  processScheduledItems,
  clearQueue,
};
