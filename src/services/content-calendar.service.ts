/**
 * Content Calendar Service
 * Handles all content calendar operations including CRUD, scheduling, and generation
 */

import { supabase, db, functions } from '@/lib/supabase';
import type {
  ContentItem,
  ContentGenerationParams,
  BulkGenerationParams,
  BulkGenerationResult,
  Platform,
  OptimalTimeRecommendation,
  SchedulingConflict,
  PlatformLimits,
  AutoScheduleStrategy,
} from '@/types/content-calendar.types';

/**
 * Platform-specific limits and settings
 */
const PLATFORM_LIMITS: Record<Platform, PlatformLimits> = {
  instagram: {
    platform: 'instagram',
    max_posts_per_day: 1,
    optimal_times: ['09:00', '12:00', '17:00', '19:00'],
    min_interval_minutes: 60,
  },
  twitter: {
    platform: 'twitter',
    max_posts_per_day: 5,
    max_posts_per_hour: 2,
    optimal_times: ['08:00', '12:00', '15:00', '17:00', '20:00'],
    min_interval_minutes: 30,
  },
  linkedin: {
    platform: 'linkedin',
    max_posts_per_day: 2,
    optimal_times: ['08:00', '12:00', '17:00'],
    min_interval_minutes: 120,
  },
  facebook: {
    platform: 'facebook',
    max_posts_per_day: 3,
    optimal_times: ['09:00', '13:00', '19:00'],
    min_interval_minutes: 60,
  },
  tiktok: {
    platform: 'tiktok',
    max_posts_per_day: 2,
    optimal_times: ['11:00', '16:00', '21:00'],
    min_interval_minutes: 120,
  },
  email: {
    platform: 'email',
    max_posts_per_day: 1,
    optimal_times: ['10:00', '14:00'],
    min_interval_minutes: 240,
  },
  blog: {
    platform: 'blog',
    max_posts_per_day: 1,
    optimal_times: ['09:00', '14:00'],
    min_interval_minutes: 1440,
  },
};

export class ContentCalendarService {
  /**
   * Transform database row to ContentItem
   */
  private static dbToContentItem(row: any): ContentItem {
    return {
      id: row.id,
      brand_id: row.brand_id,
      user_id: row.user_id || '', // DB doesn't have user_id column
      platform: row.platform as Platform,
      content_text: row.content || row.content_text || '',
      content_html: row.content_html,
      scheduled_time: row.scheduled_for,
      published_time: row.published_at,
      status: row.status as ContentStatus,
      pillar_id: row.pillar_id,
      campaign_id: row.campaign_id,
      generation_mode: row.generation_mode as GenerationMode,
      synapse_score: row.synapse_score,
      engagement_metrics: row.engagement_metrics,
      design_data: row.design_data,
      platform_post_id: row.platform_post_id,
      error_message: row.publish_error,
      intelligence_badges: row.intelligence_badges,
      media_urls: row.media_urls,
      image_url: row.image_url,
      hashtags: row.hashtags,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Transform ContentItem to database row
   */
  private static contentItemToDb(item: Partial<ContentItem>): any {
    return {
      brand_id: item.brand_id,
      title: item.content_text?.substring(0, 100) || 'Untitled', // DB requires title
      content: item.content_text,
      content_type: 'social', // DB requires content_type
      platform: item.platform,
      scheduled_for: item.scheduled_time,
      status: item.status || 'draft',
      pillar_id: item.pillar_id,
      generation_mode: item.generation_mode || 'marba',
      synapse_enhanced: (item.synapse_score || 0) > 0,
      image_url: item.image_url,
      design_data: item.design_data,
      published_at: item.published_time,
      platform_post_id: item.platform_post_id,
      publish_error: item.error_message,
    };
  }

  /**
   * Get content items for a date range
   */
  static async getContentItems(
    brandId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ContentItem[]> {
    let query = supabase
      .from('content_calendar_items')
      .select('*')
      .eq('brand_id', brandId)
      .order('scheduled_for', { ascending: true, nullsFirst: false });

    if (startDate) {
      query = query.gte('scheduled_for', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_for', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch content items:', error);
      throw error;
    }

    return (data || []).map((row) => this.dbToContentItem(row));
  }

  /**
   * Get a single content item by ID
   */
  static async getContentItem(id: string): Promise<ContentItem | null> {
    const { data, error } = await supabase
      .from('content_calendar_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to get content item:', error);
      throw error;
    }

    return data ? this.dbToContentItem(data) : null;
  }

  /**
   * Create a new content item
   */
  static async createContentItem(item: Partial<ContentItem>): Promise<ContentItem> {
    console.log('[ContentCalendarService] Creating content item:', {
      brand_id: item.brand_id,
      status: item.status,
      text: item.content_text?.substring(0, 50) + '...'
    });

    const dbRow = this.contentItemToDb(item);
    console.log('[ContentCalendarService] Transformed to DB row:', {
      brand_id: dbRow.brand_id,
      status: dbRow.status,
      title: dbRow.title
    });

    const { data, error } = await supabase
      .from('content_calendar_items')
      .insert({
        ...dbRow,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[ContentCalendarService] Failed to create content item:', error);
      throw error;
    }

    console.log('[ContentCalendarService] Successfully created content item:', { id: data.id });
    return this.dbToContentItem(data);
  }

  /**
   * Update a content item
   */
  static async updateContentItem(
    id: string,
    updates: Partial<ContentItem>
  ): Promise<ContentItem> {
    const dbUpdates = this.contentItemToDb(updates);

    const { data, error } = await supabase
      .from('content_calendar_items')
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update content item:', error);
      throw error;
    }

    return this.dbToContentItem(data);
  }

  /**
   * Delete a content item
   */
  static async deleteContentItem(id: string): Promise<void> {
    return db.delete('content_calendar_items', id);
  }

  /**
   * Duplicate a content item
   */
  static async duplicateContentItem(id: string): Promise<ContentItem> {
    const original = await this.getContentItem(id);
    if (!original) throw new Error('Content item not found');

    const { id: _, created_at, updated_at, published_time, platform_post_id, ...rest } = original;

    return this.createContentItem({
      ...rest,
      status: 'draft',
      scheduled_time: undefined,
    });
  }

  /**
   * Get optimal posting times for a platform on a given date
   */
  static async getOptimalTimes(
    platform: Platform,
    date: string,
    brandId: string,
    existingContent?: ContentItem[]
  ): Promise<OptimalTimeRecommendation[]> {
    const limits = PLATFORM_LIMITS[platform];
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Get industry data (simplified for now)
    const industryData = limits.optimal_times;

    // Get learned data from past performance (TODO: implement learning engine)
    // For now, use industry defaults

    const recommendations: OptimalTimeRecommendation[] = industryData.map((time) => {
      const reasoning = this.buildTimeReasoning(platform, time, dayOfWeek);
      return {
        time: `${date}T${time}:00`,
        score: this.calculateTimeScore(time, dayOfWeek, platform),
        reasoning,
        based_on: ['industry_data', 'platform_defaults'],
      };
    });

    // Filter out times that conflict with existing content
    const filtered = this.filterConflictingTimes(
      recommendations,
      existingContent || [],
      platform
    );

    return filtered.sort((a, b) => b.score - a.score);
  }

  /**
   * Build reasoning text for time recommendation
   */
  private static buildTimeReasoning(
    platform: Platform,
    time: string,
    dayOfWeek: number
  ): string {
    const hour = parseInt(time.split(':')[0]);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      dayOfWeek
    ];

    if (hour >= 6 && hour < 9) {
      return `Early morning on ${dayName}s - catches commuters checking ${platform}`;
    } else if (hour >= 9 && hour < 12) {
      return `Mid-morning - high engagement during work breaks`;
    } else if (hour >= 12 && hour < 14) {
      return `Lunch time - peak browsing period`;
    } else if (hour >= 17 && hour < 20) {
      return `Evening commute - people unwinding after work`;
    } else if (hour >= 20 && hour < 23) {
      return `Evening leisure time - high engagement`;
    }

    return `Optimal time based on ${platform} engagement patterns`;
  }

  /**
   * Calculate time score (0-100)
   */
  private static calculateTimeScore(time: string, dayOfWeek: number, platform: Platform): number {
    const hour = parseInt(time.split(':')[0]);
    let score = 50;

    // Boost score for peak times
    if (hour >= 12 && hour < 14) score += 20; // Lunch
    if (hour >= 17 && hour < 20) score += 25; // Evening commute
    if (hour >= 20 && hour < 22) score += 15; // Evening leisure

    // Boost for weekday vs weekend
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      score += 10; // Weekday boost for most platforms
    }

    // Platform-specific adjustments
    if (platform === 'linkedin' && hour >= 8 && hour <= 10) score += 15;
    if (platform === 'instagram' && hour >= 19 && hour <= 21) score += 15;
    if (platform === 'twitter' && (hour === 12 || hour === 17)) score += 10;

    return Math.min(100, score);
  }

  /**
   * Filter out times that conflict with existing content
   */
  private static filterConflictingTimes(
    recommendations: OptimalTimeRecommendation[],
    existingContent: ContentItem[],
    platform: Platform
  ): OptimalTimeRecommendation[] {
    const limits = PLATFORM_LIMITS[platform];
    const minIntervalMs = (limits.min_interval_minutes || 60) * 60 * 1000;

    return recommendations.filter((rec) => {
      const recTime = new Date(rec.time).getTime();

      // Check if any existing content is too close
      const hasConflict = existingContent.some((content) => {
        if (content.platform !== platform || !content.scheduled_time) return false;

        const contentTime = new Date(content.scheduled_time).getTime();
        const timeDiff = Math.abs(recTime - contentTime);

        return timeDiff < minIntervalMs;
      });

      return !hasConflict;
    });
  }

  /**
   * Detect scheduling conflicts
   */
  static async detectConflicts(
    brandId: string,
    platform: Platform,
    scheduledTime: string
  ): Promise<SchedulingConflict[]> {
    const date = scheduledTime.split('T')[0];
    const existingContent = await this.getContentItems(brandId, date, date);

    const platformContent = existingContent.filter((c) => c.platform === platform);
    const limits = PLATFORM_LIMITS[platform];
    const conflicts: SchedulingConflict[] = [];

    // Check daily limit
    if (platformContent.length >= limits.max_posts_per_day) {
      conflicts.push({
        date,
        platform,
        current_count: platformContent.length,
        max_allowed: limits.max_posts_per_day,
        reason: `Maximum ${limits.max_posts_per_day} posts per day reached for ${platform}`,
      });
    }

    // Check interval conflicts
    const scheduledDate = new Date(scheduledTime);
    const minIntervalMs = (limits.min_interval_minutes || 60) * 60 * 1000;

    platformContent.forEach((content) => {
      if (!content.scheduled_time) return;

      const contentDate = new Date(content.scheduled_time);
      const timeDiff = Math.abs(scheduledDate.getTime() - contentDate.getTime());

      if (timeDiff < minIntervalMs) {
        conflicts.push({
          date,
          platform,
          current_count: platformContent.length,
          max_allowed: limits.max_posts_per_day,
          reason: `Too close to existing post at ${content.scheduled_time}. Minimum ${limits.min_interval_minutes} minutes required.`,
        });
      }
    });

    return conflicts;
  }

  /**
   * Schedule content for a specific time
   */
  static async scheduleContent(itemId: string, scheduledTime: string): Promise<ContentItem> {
    const item = await this.getContentItem(itemId);
    if (!item) throw new Error('Content item not found');

    // Check for conflicts
    const conflicts = await this.detectConflicts(
      item.brand_id,
      item.platform,
      scheduledTime
    );

    if (conflicts.length > 0) {
      throw new Error(`Scheduling conflict: ${conflicts[0].reason}`);
    }

    return this.updateContentItem(itemId, {
      scheduled_time: scheduledTime,
      status: 'scheduled',
    });
  }

  /**
   * Bulk schedule content items
   */
  static async bulkSchedule(
    items: ContentItem[],
    strategy: AutoScheduleStrategy = 'optimal_times'
  ): Promise<ContentItem[]> {
    const scheduled: ContentItem[] = [];

    for (const item of items) {
      try {
        // Get optimal times for this item's platform
        const date = item.scheduled_time?.split('T')[0] || new Date().toISOString().split('T')[0];
        const optimalTimes = await this.getOptimalTimes(
          item.platform,
          date,
          item.brand_id,
          scheduled
        );

        if (optimalTimes.length === 0) {
          console.warn(`No optimal times available for ${item.platform} on ${date}`);
          continue;
        }

        // Select best time based on strategy
        const selectedTime = this.selectTimeByStrategy(optimalTimes, strategy);

        // Schedule the item
        const scheduledItem = await this.scheduleContent(item.id, selectedTime.time);
        scheduled.push(scheduledItem);
      } catch (error) {
        console.error(`Failed to schedule item ${item.id}:`, error);
      }
    }

    return scheduled;
  }

  /**
   * Select time based on auto-schedule strategy
   */
  private static selectTimeByStrategy(
    times: OptimalTimeRecommendation[],
    strategy: AutoScheduleStrategy
  ): OptimalTimeRecommendation {
    switch (strategy) {
      case 'optimal_times':
        return times[0]; // Highest score
      case 'even_distribution':
        // Distribute evenly across available times
        const midIndex = Math.floor(times.length / 2);
        return times[midIndex];
      case 'best_performing':
        // TODO: Use learning engine data
        return times[0];
      default:
        return times[0];
    }
  }

  /**
   * Generate content
   */
  static async generateContent(params: ContentGenerationParams): Promise<any> {
    return functions.generateContent(
      params.brandId,
      params.platform,
      params.topic,
      params.mode,
      {
        pillarId: params.pillarId,
        context: params.context,
        opportunityId: params.opportunityId,
        tone: params.tone,
        length: params.length,
      }
    );
  }

  /**
   * Generate bulk content
   */
  static async generateBulkContent(
    params: BulkGenerationParams
  ): Promise<BulkGenerationResult> {
    // Calculate number of days
    const start = new Date(params.dateRange.start);
    const end = new Date(params.dateRange.end);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const items: ContentItem[] = [];
    const postsPerDay = params.postsPerDay || 1;

    // Generate content for each day
    for (let day = 0; day < days; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Generate posts for each platform
      for (const platform of params.platforms) {
        for (let i = 0; i < postsPerDay; i++) {
          // Select pillar based on distribution
          const pillar = this.selectPillarByDistribution(params.pillarDistribution);

          // Generate content
          const generationResult = await this.generateContent({
            brandId: params.brandId,
            platform,
            topic: `Generated content for ${platform}`,
            pillarId: pillar.pillarId,
            mode: params.mode,
          });

          // Create content item (use first variation)
          if (generationResult.variations && generationResult.variations.length > 0) {
            const variation = generationResult.variations[0];
            const item = await this.createContentItem({
              brand_id: params.brandId,
              user_id: generationResult.user_id || '',
              platform,
              content_text: variation.text,
              pillar_id: pillar.pillarId,
              generation_mode: params.mode,
              synapse_score: variation.psychology_score,
              intelligence_badges: this.generateIntelligenceBadges(variation, params.mode),
              status: 'draft',
            });

            items.push(item);
          }
        }
      }
    }

    // Calculate summary
    const pillarCounts: Record<string, number> = {};
    items.forEach((item) => {
      if (item.pillar_id) {
        pillarCounts[item.pillar_id] = (pillarCounts[item.pillar_id] || 0) + 1;
      }
    });

    return {
      items,
      summary: {
        total_posts: items.length,
        platforms: params.platforms,
        days_covered: days,
        pillar_distribution: pillarCounts,
      },
    };
  }

  /**
   * Select pillar based on distribution percentages
   */
  private static selectPillarByDistribution(
    distribution: { pillarId: string; percentage: number }[]
  ): { pillarId: string; percentage: number } {
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const pillar of distribution) {
      cumulative += pillar.percentage;
      if (rand <= cumulative) {
        return pillar;
      }
    }

    return distribution[0];
  }

  /**
   * Generate intelligence badges based on content analysis
   */
  private static generateIntelligenceBadges(variation: any, mode: string): string[] {
    const badges: string[] = [];

    if (mode === 'synapse') {
      badges.push('Synapse Enhanced');
    }

    if (variation.psychology_score && variation.psychology_score > 80) {
      badges.push('High-performing');
    }

    if (variation.synapse_analysis?.power_words?.length > 3) {
      badges.push('Data-driven');
    }

    return badges;
  }

  /**
   * Publish content
   */
  static async publishContent(itemId: string): Promise<ContentItem> {
    const item = await this.getContentItem(itemId);
    if (!item) throw new Error('Content item not found');

    try {
      // Call publishing edge function
      const result = await functions.publishToPlatform(
        itemId,
        item.platform,
        item.content_text,
        item.media_urls?.[0]
      );

      // Update item with published status
      return this.updateContentItem(itemId, {
        status: 'published',
        published_time: new Date().toISOString(),
        platform_post_id: result.platform_post_id,
      });
    } catch (error: any) {
      // Mark as failed with error
      return this.updateContentItem(itemId, {
        status: 'failed',
        error_message: error.message,
      });
    }
  }

  /**
   * Get publishing queue (upcoming scheduled posts)
   */
  static async getPublishingQueue(brandId: string, days: number = 7): Promise<ContentItem[]> {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from('content_calendar_items')
      .select('*')
      .eq('brand_id', brandId)
      .in('status', ['draft', 'scheduled'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform from database format to TypeScript format
    const items = ((data || []) as any[]).map(this.dbToContentItem);

    return items;
  }

  /**
   * Get platform limits for a platform
   */
  static getPlatformLimits(platform: Platform): PlatformLimits {
    return PLATFORM_LIMITS[platform];
  }
}
