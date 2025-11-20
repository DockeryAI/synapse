# EQ Performance Tracking Guide

**How to track content performance to validate EQ effectiveness**

Created: 2025-11-19

---

## Overview

Performance tracking validates that EQ-matched content performs better than generic content. By tracking engagement metrics across different EQ levels, the system learns which emotional/rational balance works best for each brand.

---

## What Gets Tracked

### Metrics
- **Impressions**: How many people saw the content
- **Engagement Count**: Likes, comments, shares, reactions
- **Engagement Rate**: Engagement / Impressions
- **Click Count**: Link clicks
- **Click Rate**: Clicks / Impressions
- **Conversion Count**: Purchases, signups, form fills
- **Conversion Rate**: Conversions / Clicks

### Context
- **Content EQ**: The EQ level used for this content
- **Target EQ**: The brand's baseline EQ
- **EQ Variance**: Difference from optimal (contentEQ - targetEQ)
- **Platform**: Where it was published (linkedin, instagram, etc.)
- **Platform Adjustment**: How much EQ was adjusted for platform
- **Seasonal Adjustment**: Holiday/seasonal EQ boost
- **Campaign Type Adjustment**: Brand awareness vs lead gen EQ shift

---

## Integration Points

### Point 1: Track When Content is Published

**Location**: Content publishing service or calendar scheduler

```typescript
// When a post is published to a platform
import { eqCampaignIntegration } from '@/services/eq-v2/eq-campaign-integration.service';

async function publishPost(
  brandId: string,
  contentId: string,
  content: GeneratedPost,
  platform: Platform
) {
  try {
    // Publish to platform API (LinkedIn, Facebook, etc.)
    const publishResult = await platformAPI.publish(content);

    // ✨ TRACK: Initialize tracking record
    await eqCampaignIntegration.trackCampaignPerformance(
      brandId,
      contentId,
      {
        platform,
        contentType: content.type,
        publishedAt: new Date().toISOString(),
        // Initial metrics (zeros)
        impressions: 0,
        engagementCount: 0,
        engagementRate: 0,
      }
    );

    console.log('[Publisher] EQ tracking initialized for:', contentId);

    return publishResult;
  } catch (error) {
    console.error('[Publisher] Failed to publish or track:', error);
    throw error;
  }
}
```

### Point 2: Update Metrics Periodically

**Location**: Analytics sync service or cron job

```typescript
// Sync metrics from platform APIs every 6-24 hours
import { eqCampaignIntegration } from '@/services/eq-v2/eq-campaign-integration.service';

async function syncPlatformMetrics(brandId: string) {
  try {
    // Get all published posts for this brand
    const posts = await getPublishedPosts(brandId);

    for (const post of posts) {
      // Fetch latest metrics from platform API
      const metrics = await platformAPI.getPostMetrics(post.platformId);

      // Calculate rates
      const engagementRate = metrics.impressions > 0
        ? (metrics.engagement / metrics.impressions) * 100
        : 0;

      const clickRate = metrics.impressions > 0
        ? (metrics.clicks / metrics.impressions) * 100
        : 0;

      const conversionRate = metrics.clicks > 0
        ? (metrics.conversions / metrics.clicks) * 100
        : 0;

      // ✨ TRACK: Update performance metrics
      await eqCampaignIntegration.trackCampaignPerformance(
        brandId,
        post.id,
        {
          platform: post.platform,
          contentType: post.type,
          impressions: metrics.impressions,
          engagementCount: metrics.engagement,
          engagementRate,
          clickCount: metrics.clicks,
          clickRate,
          conversionCount: metrics.conversions,
          conversionRate,
          publishedAt: post.publishedAt,
        }
      );

      console.log(`[Analytics] Updated metrics for ${post.id}:`, {
        impressions: metrics.impressions,
        engagementRate: engagementRate.toFixed(2) + '%',
      });
    }

    console.log(`[Analytics] Synced metrics for ${posts.length} posts`);
  } catch (error) {
    console.error('[Analytics] Failed to sync metrics:', error);
  }
}

// Run sync every 6 hours
setInterval(() => {
  syncPlatformMetrics(currentBrandId);
}, 6 * 60 * 60 * 1000);
```

### Point 3: Display Performance Insights

**Location**: Analytics dashboard or EQ dashboard widget

```typescript
// Show which EQ levels perform best
import { eqCampaignIntegration } from '@/services/eq-v2/eq-campaign-integration.service';

async function loadEQPerformanceInsights(brandId: string) {
  const insights = await eqCampaignIntegration.getPerformanceInsights(brandId);

  return {
    // Best performing EQ level
    bestEQ: insights.bestPerformingEQ,

    // Engagement by EQ range
    eqRanges: insights.avgEngagementByEQ,
    // Example: [
    //   { eq_range: '0-30', avg_engagement: 2.1 },
    //   { eq_range: '30-50', avg_engagement: 3.5 },
    //   { eq_range: '50-70', avg_engagement: 4.8 },
    //   { eq_range: '70-100', avg_engagement: 6.2 },
    // ]

    // Performance by platform
    platformPerformance: insights.platformPerformance,
    // Example: [
    //   { platform: 'linkedin', avg_eq: 45, avg_engagement: 3.2 },
    //   { platform: 'instagram', avg_eq: 65, avg_engagement: 5.1 },
    // ]
  };
}

// Display in UI
function EQPerformanceChart({ brandId }: { brandId: string }) {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    loadEQPerformanceInsights(brandId).then(setInsights);
  }, [brandId]);

  if (!insights) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Best Performing EQ */}
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          Your best performing content has an EQ of {insights.bestEQ}/100.
          Content with this emotional/rational balance gets the highest engagement.
        </AlertDescription>
      </Alert>

      {/* Engagement by EQ Range */}
      <div>
        <h3 className="font-semibold mb-3">Engagement by EQ Level</h3>
        {insights.eqRanges.map((range) => (
          <div key={range.eq_range} className="flex items-center gap-4 mb-2">
            <span className="w-20 text-sm">{range.eq_range}</span>
            <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                style={{ width: `${range.avg_engagement * 10}%` }}
              />
            </div>
            <span className="w-16 text-sm font-semibold">
              {range.avg_engagement.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Platform Performance */}
      <div>
        <h3 className="font-semibold mb-3">Platform Performance</h3>
        {insights.platformPerformance.map((p) => (
          <div key={p.platform} className="p-3 bg-gray-50 rounded-lg mb-2">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{p.platform}</span>
              <span className="text-sm text-muted-foreground">
                Avg EQ: {Math.round(p.avg_eq)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {p.avg_engagement.toFixed(1)}% engagement rate
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Complete Integration Example

### Content Calendar Integration

```typescript
/**
 * Content Calendar Service
 * Tracks performance for scheduled/published posts
 */

import { eqCampaignIntegration } from '@/services/eq-v2/eq-campaign-integration.service';
import type { Platform } from '@/types/campaign-generation.types';

interface CalendarPost {
  id: string;
  brandId: string;
  content: string;
  platform: Platform;
  type: string;
  status: 'scheduled' | 'published' | 'failed';
  scheduledFor: string;
  publishedAt?: string;
  platformPostId?: string;
}

class ContentCalendarService {
  /**
   * Publish a scheduled post
   */
  async publishScheduledPost(post: CalendarPost) {
    try {
      console.log('[ContentCalendar] Publishing post:', post.id);

      // Step 1: Publish to platform
      const result = await this.publishToPlatform(post);

      // Step 2: Update post status
      await this.updatePostStatus(post.id, {
        status: 'published',
        publishedAt: new Date().toISOString(),
        platformPostId: result.postId,
      });

      // Step 3: Initialize EQ tracking
      await eqCampaignIntegration.trackCampaignPerformance(
        post.brandId,
        post.id,
        {
          platform: post.platform,
          contentType: post.type,
          publishedAt: new Date().toISOString(),
          // Initial metrics
          impressions: 0,
          engagementCount: 0,
          engagementRate: 0,
        }
      );

      console.log('[ContentCalendar] Post published and tracking initialized');

      return result;
    } catch (error) {
      console.error('[ContentCalendar] Failed to publish post:', error);
      await this.updatePostStatus(post.id, { status: 'failed' });
      throw error;
    }
  }

  /**
   * Sync metrics for all published posts
   */
  async syncAllMetrics(brandId: string) {
    try {
      console.log('[ContentCalendar] Syncing metrics for brand:', brandId);

      // Get all published posts
      const posts = await this.getPublishedPosts(brandId);

      let synced = 0;
      let failed = 0;

      for (const post of posts) {
        try {
          // Fetch latest metrics from platform
          const metrics = await this.fetchPlatformMetrics(post);

          if (!metrics) {
            console.warn('[ContentCalendar] No metrics available for:', post.id);
            continue;
          }

          // Calculate rates
          const engagementRate = metrics.impressions > 0
            ? (metrics.engagement / metrics.impressions) * 100
            : 0;

          const clickRate = metrics.impressions > 0 && metrics.clicks
            ? (metrics.clicks / metrics.impressions) * 100
            : 0;

          const conversionRate = metrics.clicks > 0 && metrics.conversions
            ? (metrics.conversions / metrics.clicks) * 100
            : 0;

          // Update EQ tracking
          await eqCampaignIntegration.trackCampaignPerformance(
            post.brandId,
            post.id,
            {
              platform: post.platform,
              contentType: post.type,
              impressions: metrics.impressions,
              engagementCount: metrics.engagement,
              engagementRate,
              clickCount: metrics.clicks,
              clickRate,
              conversionCount: metrics.conversions,
              conversionRate,
              publishedAt: post.publishedAt,
            }
          );

          synced++;
        } catch (error) {
          console.error(`[ContentCalendar] Failed to sync metrics for ${post.id}:`, error);
          failed++;
        }
      }

      console.log(`[ContentCalendar] Metrics sync complete:`, {
        total: posts.length,
        synced,
        failed,
      });

      return { synced, failed };
    } catch (error) {
      console.error('[ContentCalendar] Failed to sync metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance insights for a brand
   */
  async getPerformanceInsights(brandId: string) {
    return await eqCampaignIntegration.getPerformanceInsights(brandId);
  }

  // Helper methods
  private async publishToPlatform(post: CalendarPost) {
    // Platform-specific publishing logic
    throw new Error('Not implemented');
  }

  private async fetchPlatformMetrics(post: CalendarPost) {
    // Platform-specific metrics fetching
    throw new Error('Not implemented');
  }

  private async updatePostStatus(postId: string, updates: Partial<CalendarPost>) {
    // Database update logic
    throw new Error('Not implemented');
  }

  private async getPublishedPosts(brandId: string): Promise<CalendarPost[]> {
    // Fetch published posts from database
    throw new Error('Not implemented');
  }
}

export const contentCalendarService = new ContentCalendarService();
```

---

## Analytics Dashboard Component

```typescript
/**
 * EQ Performance Analytics Component
 * Shows which EQ levels perform best
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { eqCampaignIntegration } from '@/services/eq-v2/eq-campaign-integration.service';

export interface EQPerformanceAnalyticsProps {
  brandId: string;
}

export function EQPerformanceAnalytics({ brandId }: EQPerformanceAnalyticsProps) {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        setIsLoading(true);
        const data = await eqCampaignIntegration.getPerformanceInsights(brandId);
        setInsights(data);
      } catch (error) {
        console.error('[EQPerformanceAnalytics] Failed to load insights:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInsights();
  }, [brandId]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!insights || insights.avgEngagementByEQ.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Not enough data yet. Publish more content to see performance insights.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">EQ Performance Analytics</h3>
          <p className="text-sm text-muted-foreground">
            How different emotional tones perform for your brand
          </p>
        </div>
      </div>

      {/* Best Performing EQ */}
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          Your best performing content has an EQ of <strong>{insights.bestPerformingEQ}/100</strong>.
          Content with this emotional/rational balance gets the highest engagement.
        </AlertDescription>
      </Alert>

      {/* Engagement by EQ Range */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Engagement by EQ Level</h4>
        <div className="space-y-2">
          {insights.avgEngagementByEQ.map((range: any) => (
            <div key={range.eq_range} className="flex items-center gap-4">
              <span className="w-20 text-sm font-medium">{range.eq_range}</span>
              <div className="flex-1 h-8 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(range.avg_engagement * 10, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                />
              </div>
              <span className="w-16 text-sm font-semibold">
                {range.avg_engagement.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Performance */}
      {insights.platformPerformance.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Platform Performance</h4>
          <div className="space-y-2">
            {insights.platformPerformance.map((p: any) => (
              <div
                key={p.platform}
                className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize">{p.platform}</span>
                  <span className="text-sm text-muted-foreground">
                    Avg EQ: {Math.round(p.avg_eq)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.avg_engagement.toFixed(1)}% engagement rate
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Recommendation:</strong> Create more content at the {insights.bestPerformingEQ} EQ level
          to maximize engagement. Use the Campaign Generator with platform-specific adjustments for best results.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
```

---

## Testing

```bash
# 1. Publish test content with different EQ levels
- Publish 5 posts at EQ 75 (emotional)
- Publish 5 posts at EQ 50 (balanced)
- Publish 5 posts at EQ 25 (rational)

# 2. Wait 24-48 hours for metrics to accumulate

# 3. Sync metrics
await contentCalendarService.syncAllMetrics(brandId);

# 4. Check insights
const insights = await eqCampaignIntegration.getPerformanceInsights(brandId);
console.log('Best EQ:', insights.bestPerformingEQ);
console.log('Engagement by range:', insights.avgEngagementByEQ);
```

---

## Expected Results

After tracking 50+ posts, you should see patterns like:

### Passion Products (Classic Cars, Luxury Watches)
- **70-100 EQ**: 5-8% engagement
- **50-70 EQ**: 3-5% engagement
- **30-50 EQ**: 2-3% engagement
- **0-30 EQ**: 1-2% engagement

### Rational Products (Enterprise SaaS, Tax Prep)
- **0-30 EQ**: 4-6% engagement
- **30-50 EQ**: 3-4% engagement
- **50-70 EQ**: 2-3% engagement
- **70-100 EQ**: 1-2% engagement

### Balanced (Professional Services)
- **30-50 EQ**: 4-5% engagement
- **50-70 EQ**: 4-5% engagement (similar)
- **0-30 EQ**: 2-3% engagement
- **70-100 EQ**: 2-3% engagement

---

## Database Schema

Performance metrics are stored in `eq_performance_metrics` table:

```sql
SELECT
  platform,
  content_eq,
  AVG(engagement_rate) as avg_engagement,
  COUNT(*) as post_count
FROM eq_performance_metrics
WHERE brand_id = 'brand-123'
GROUP BY platform, content_eq
ORDER BY avg_engagement DESC;
```

---

## Next Steps

1. **Integrate with content calendar** - Track all published posts
2. **Sync platform APIs** - Pull metrics from LinkedIn, Facebook, Instagram
3. **Display in analytics dashboard** - Show EQ performance charts
4. **Use for optimization** - Generate more content at best-performing EQ levels
5. **A/B testing** - Test EQ variants to find optimal emotional balance
