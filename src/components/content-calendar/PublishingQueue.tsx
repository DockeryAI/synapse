/**
 * PublishingQueue Component
 * Display upcoming scheduled posts with status indicators and actions
 * Tasks 349-360
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  Calendar as CalendarIcon,
  AlertCircle,
} from 'lucide-react';
import { ContentCalendarService } from '@/services/content-calendar.service';
import { ContentItem } from './ContentItem';
import type { ContentItem as ContentItemType, PublishingQueueItem } from '@/types/content-calendar.types';

interface PublishingQueueProps {
  brandId: string;
  days?: number;
  enableApprovalWorkflow?: boolean;
  onRefresh?: () => void;
}

export function PublishingQueue({
  brandId,
  days = 7,
  enableApprovalWorkflow = false,
  onRefresh,
}: PublishingQueueProps) {
  const [queueItems, setQueueItems] = useState<PublishingQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<Set<string>>(new Set());

  /**
   * Load publishing queue
   */
  const loadQueue = async () => {
    setLoading(true);
    try {
      console.log('[PublishingQueue] Loading queue for brand:', brandId);
      const items = await ContentCalendarService.getPublishingQueue(brandId, days);
      console.log('[PublishingQueue] Loaded items from database:', items.length);

      // Transform to publishing queue items with status
      const queueItems: PublishingQueueItem[] = items.map((item) => ({
        content: item,
        status: getItemStatus(item),
        retry_count: 0,
      }));

      console.log('[PublishingQueue] Queue items after transform:', {
        total: queueItems.length,
        drafts: queueItems.filter(q => q.content.status === 'draft').length,
        scheduled: queueItems.filter(q => q.content.status === 'scheduled').length
      });

      setQueueItems(queueItems);
    } catch (error) {
      console.error('[PublishingQueue] Failed to load publishing queue:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get item status based on scheduled time
   */
  const getItemStatus = (
    item: ContentItemType
  ): 'pending' | 'publishing' | 'published' | 'failed' => {
    // Use the actual status from the item
    if (item.status === 'published') return 'published';
    if (item.status === 'failed') return 'failed';
    if (item.status === 'draft') return 'pending'; // Drafts are pending

    // Check if it's time to publish for scheduled items
    if (item.scheduled_time) {
      const scheduledTime = new Date(item.scheduled_time);
      const now = new Date();

      if (scheduledTime <= now && scheduledTime > new Date(now.getTime() - 5 * 60 * 1000)) {
        return 'publishing';
      }
    }

    return 'pending';
  };

  /**
   * Load queue on mount and set up refresh interval
   */
  useEffect(() => {
    loadQueue();

    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(loadQueue, 30000);

    return () => clearInterval(interval);
  }, [brandId, days]);

  /**
   * Manually publish content
   */
  const handlePublish = async (item: ContentItemType) => {
    setPublishing((prev) => new Set(prev).add(item.id));

    try {
      await ContentCalendarService.publishContent(item.id);
      await loadQueue();

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to publish content:', error);
      alert('Failed to publish content. Please try again.');
    } finally {
      setPublishing((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  /**
   * Schedule content
   */
  const handleSchedule = async (item: ContentItemType, scheduledTime: string) => {
    try {
      await ContentCalendarService.updateContentItem(item.id, {
        scheduled_time: scheduledTime,
        status: 'scheduled',
      });
      await loadQueue();

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to schedule content:', error);
      alert('Failed to schedule content. Please try again.');
    }
  };

  /**
   * Retry failed publishing
   */
  const handleRetry = async (item: ContentItemType) => {
    await handlePublish(item);
  };

  /**
   * Reschedule content (or schedule drafts)
   */
  const handleReschedule = async (item: ContentItemType) => {
    const isDraft = item.status === 'draft';
    const promptText = isDraft
      ? 'Schedule this post (YYYY-MM-DD HH:MM):'
      : 'Enter new date/time (YYYY-MM-DD HH:MM):';
    const defaultValue = item.scheduled_time || '';

    const newTime = prompt(promptText, defaultValue);
    if (!newTime) return;

    try {
      await ContentCalendarService.scheduleContent(item.id, new Date(newTime).toISOString());
      await loadQueue();

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Failed to schedule:', error);
      alert(`Failed to schedule: ${error.message}`);
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: PublishingQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'publishing':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500" />
        );
      case 'published':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: PublishingQueueItem['status']) => {
    const styles = {
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      publishing: 'bg-orange-100 text-orange-800 border-orange-200',
      published: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <Badge variant="outline" className={styles[status]}>
        {status}
      </Badge>
    );
  };

  /**
   * Format time until publish
   */
  const getTimeUntilPublish = (scheduledTime?: string) => {
    if (!scheduledTime) return 'Not scheduled';

    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMs = scheduled.getTime() - now.getTime();

    if (diffMs < 0) {
      return 'Overdue';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) {
      return `in ${minutes}m`;
    } else if (hours < 24) {
      return `in ${hours}h ${minutes}m`;
    } else {
      const days = Math.floor(hours / 24);
      return `in ${days}d ${hours % 24}h`;
    }
  };

  /**
   * Group items by date
   */
  const groupedItems = queueItems.reduce((acc, item) => {
    const date = item.content.scheduled_time?.split('T')[0] || 'unscheduled';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, PublishingQueueItem[]>);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Content Queue</h2>
          <p className="text-sm text-muted-foreground">
            {queueItems.length} {queueItems.length === 1 ? 'post' : 'posts'} (drafts & scheduled)
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadQueue} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { status: 'pending', label: 'Pending', icon: Clock, color: 'text-blue-500' },
          { status: 'publishing', label: 'Publishing', icon: Send, color: 'text-orange-500' },
          { status: 'published', label: 'Published', icon: CheckCircle, color: 'text-green-500' },
          { status: 'failed', label: 'Failed', icon: XCircle, color: 'text-red-500' },
        ].map(({ status, label, icon: Icon, color }) => {
          const count = queueItems.filter((item) => item.status === status).length;
          return (
            <Card key={status} className="p-4">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Queue Items */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading queue...</p>
        </div>
      ) : queueItems.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No content in queue</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems)
            .sort(([a], [b]) => {
              // Put 'unscheduled' first, then sort dates
              if (a === 'unscheduled') return -1;
              if (b === 'unscheduled') return 1;
              return a.localeCompare(b);
            })
            .map(([date, items]) => (
              <div key={date}>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {date === 'unscheduled'
                    ? 'Drafts (Not Scheduled)'
                    : new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                </h3>

                <div className="space-y-3">
                  {items.map((queueItem) => (
                    <Card key={queueItem.content.id} className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className="mt-1">{getStatusIcon(queueItem.status)}</div>

                        {/* Content Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(queueItem.status)}
                              <span className="text-sm text-muted-foreground">
                                {getTimeUntilPublish(queueItem.content.scheduled_time)}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {queueItem.status === 'pending' && (
                                <>
                                  {/* Show Schedule button for drafts, Publish Now for scheduled */}
                                  {queueItem.content.status === 'draft' ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleReschedule(queueItem.content)}
                                    >
                                      <Clock className="w-4 h-4 mr-1" />
                                      Schedule
                                    </Button>
                                  ) : (
                                    <>
                                      {enableApprovalWorkflow && (
                                        <Button size="sm" variant="outline">
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Approve
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        onClick={() => handlePublish(queueItem.content)}
                                        disabled={publishing.has(queueItem.content.id)}
                                      >
                                        <Send className="w-4 h-4 mr-1" />
                                        Publish Now
                                      </Button>
                                    </>
                                  )}
                                </>
                              )}

                              {queueItem.status === 'failed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRetry(queueItem.content)}
                                  disabled={publishing.has(queueItem.content.id)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-1" />
                                  Retry
                                </Button>
                              )}

                              {queueItem.status !== 'published' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReschedule(queueItem.content)}
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  Reschedule
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Content Preview */}
                          <ContentItem
                            item={queueItem.content}
                            compact
                            onSchedule={handleSchedule}
                          />

                          {/* Error Display */}
                          {queueItem.error && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-red-700">
                                <span className="font-semibold">Publishing Error: </span>
                                {queueItem.error}
                                {queueItem.retry_count && queueItem.retry_count > 0 && (
                                  <span className="block mt-1 text-xs">
                                    Retried {queueItem.retry_count} time(s)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Auto-refreshes every 30 seconds • Real-time status updates
      </div>
    </Card>
  );
}
