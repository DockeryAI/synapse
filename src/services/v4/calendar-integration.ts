/**
 * V4 Calendar Integration Service
 *
 * Bridges V4 Content Engine generated content to the existing content_calendar_items table.
 * Stores V4-specific metadata (scores, psychology, funnel, mix) in the metadata JSONB column.
 *
 * Created: 2025-11-27
 */

import { supabase } from '@/lib/supabase';
import type { GeneratedContent, ContentPillar, CampaignTemplateType, ContentMixRule } from './types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface V4CalendarItem {
  id: string;
  brand_id: string;
  title: string;
  content: string;
  platform: string;
  content_type: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';
  scheduled_for?: string;
  published_at?: string;
  ai_score?: number;
  tags?: string[];
  media_urls?: string[];
  metadata: V4ContentMetadata;
  created_at: string;
  updated_at: string;
}

export interface V4ContentMetadata {
  v4_engine: true;
  version: '4.0';

  // Content structure
  headline: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  content_hash?: string;  // For deduplication across sessions

  // V4 Scoring
  score: {
    total: number;
    prediction: 'meh' | 'good' | 'great' | 'holy shit';
    breakdown: {
      unexpectedness: number;
      truthfulness: number;
      actionability: number;
      uniqueness: number;
      virality: number;
    };
    reasoning: string[];
    strengths: string[];
    weaknesses: string[];
  };

  // Psychology
  psychology: {
    framework: string;
    primaryTrigger: string;
    secondaryTrigger?: string;
    intensity: number;
  };

  // Content Classification
  mixCategory: string;
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
  pillar?: {
    id: string;
    name: string;
    description?: string;
  };

  // Campaign Context
  campaign?: {
    id?: string;
    template: CampaignTemplateType;
    mixRule: ContentMixRule;
    week?: number;
  };

  // Generation Context
  uvp_id?: string;
  generation_mode: 'easy' | 'power' | 'mixer';
  generated_at: string;
}

export interface SaveToCalendarOptions {
  scheduledFor?: string;
  status?: 'draft' | 'scheduled';
}

export interface BulkSaveResult {
  success: boolean;
  savedCount: number;
  failedCount: number;
  items: V4CalendarItem[];
  errors: { content: GeneratedContent; error: string }[];
}

// ============================================================================
// V4 CALENDAR INTEGRATION SERVICE
// ============================================================================

class V4CalendarIntegrationService {
  /**
   * Save a single V4 generated content piece to the content calendar
   */
  async saveToCalendar(
    content: GeneratedContent,
    brandId: string,
    options?: SaveToCalendarOptions
  ): Promise<V4CalendarItem> {
    console.log('[V4CalendarIntegration] Saving content to calendar...');

    const metadata: V4ContentMetadata = this.buildMetadata(content);

    // Combine headline + body for the main content field
    const fullContent = this.formatContentForCalendar(content);

    const calendarItem = {
      brand_id: brandId,
      title: content.headline || content.hook?.substring(0, 100) || 'V4 Generated Content',
      content: fullContent,
      platform: content.metadata.platform,
      content_type: 'social',
      status: options?.status || 'draft',
      scheduled_for: options?.scheduledFor,
      ai_score: content.score.total,
      tags: this.buildTags(content),
      metadata: metadata as unknown as Record<string, unknown>,
    };

    const { data, error } = await supabase
      .from('content_calendar_items')
      .insert(calendarItem)
      .select()
      .single();

    if (error) {
      console.error('[V4CalendarIntegration] Failed to save:', error);
      throw new Error(`Failed to save to calendar: ${error.message}`);
    }

    console.log('[V4CalendarIntegration] Successfully saved:', data.id);
    return this.transformToV4CalendarItem(data);
  }

  /**
   * Bulk save multiple V4 content pieces to the calendar
   */
  async bulkSaveToCalendar(
    contents: GeneratedContent[],
    brandId: string,
    options?: SaveToCalendarOptions
  ): Promise<BulkSaveResult> {
    console.log(`[V4CalendarIntegration] Bulk saving ${contents.length} items...`);

    const results: V4CalendarItem[] = [];
    const errors: { content: GeneratedContent; error: string }[] = [];

    for (const content of contents) {
      try {
        const saved = await this.saveToCalendar(content, brandId, options);
        results.push(saved);
      } catch (err) {
        errors.push({
          content,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    console.log(`[V4CalendarIntegration] Bulk save complete: ${results.length} saved, ${errors.length} failed`);

    return {
      success: errors.length === 0,
      savedCount: results.length,
      failedCount: errors.length,
      items: results,
      errors,
    };
  }

  /**
   * Save a full V4 campaign to the calendar with scheduling
   */
  async saveCampaignToCalendar(
    contents: GeneratedContent[],
    brandId: string,
    campaignConfig: {
      template: CampaignTemplateType;
      mixRule: ContentMixRule;
      startDate: string;
      postsPerWeek: number;
    }
  ): Promise<BulkSaveResult> {
    console.log('[V4CalendarIntegration] Saving campaign to calendar...');

    const scheduledContents: { content: GeneratedContent; scheduledFor: string }[] = [];

    // Calculate schedule: distribute posts across weeks
    const startDate = new Date(campaignConfig.startDate);
    const postsPerDay = Math.ceil(campaignConfig.postsPerWeek / 5); // Spread across weekdays

    let currentDate = new Date(startDate);
    let contentIndex = 0;

    while (contentIndex < contents.length) {
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Schedule posts for this day
      for (let i = 0; i < postsPerDay && contentIndex < contents.length; i++) {
        const hour = this.getOptimalHour(contents[contentIndex].metadata.platform, i);
        const scheduledFor = new Date(currentDate);
        scheduledFor.setHours(hour, 0, 0, 0);

        scheduledContents.push({
          content: contents[contentIndex],
          scheduledFor: scheduledFor.toISOString(),
        });
        contentIndex++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Save all with schedules
    const results: V4CalendarItem[] = [];
    const errors: { content: GeneratedContent; error: string }[] = [];

    for (const { content, scheduledFor } of scheduledContents) {
      try {
        // Add campaign metadata to content
        const contentWithCampaign = {
          ...content,
          campaign: {
            template: campaignConfig.template,
            mixRule: campaignConfig.mixRule,
          },
        };

        const saved = await this.saveToCalendar(
          contentWithCampaign as GeneratedContent,
          brandId,
          { scheduledFor, status: 'scheduled' }
        );
        results.push(saved);
      } catch (err) {
        errors.push({
          content,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      savedCount: results.length,
      failedCount: errors.length,
      items: results,
      errors,
    };
  }

  /**
   * Get V4 content from calendar by brand
   */
  async getV4CalendarItems(brandId: string): Promise<V4CalendarItem[]> {
    const { data, error } = await supabase
      .from('content_calendar_items')
      .select('*')
      .eq('brand_id', brandId)
      .not('metadata->v4_engine', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[V4CalendarIntegration] Failed to fetch:', error);
      throw new Error(`Failed to fetch V4 calendar items: ${error.message}`);
    }

    return (data || []).map(this.transformToV4CalendarItem);
  }

  /**
   * Get calendar analytics for V4 content
   */
  async getV4Analytics(brandId: string): Promise<{
    totalPosts: number;
    averageScore: number;
    funnelDistribution: { TOFU: number; MOFU: number; BOFU: number };
    mixDistribution: Record<string, number>;
    frameworkUsage: Record<string, number>;
    topPerformers: V4CalendarItem[];
  }> {
    const items = await this.getV4CalendarItems(brandId);

    if (items.length === 0) {
      return {
        totalPosts: 0,
        averageScore: 0,
        funnelDistribution: { TOFU: 0, MOFU: 0, BOFU: 0 },
        mixDistribution: {},
        frameworkUsage: {},
        topPerformers: [],
      };
    }

    const scores = items.map(i => i.metadata.score.total);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const funnelDistribution = { TOFU: 0, MOFU: 0, BOFU: 0 };
    const mixDistribution: Record<string, number> = {};
    const frameworkUsage: Record<string, number> = {};

    for (const item of items) {
      // Funnel
      const funnel = item.metadata.funnelStage;
      if (funnel in funnelDistribution) {
        funnelDistribution[funnel]++;
      }

      // Mix
      const mix = item.metadata.mixCategory;
      mixDistribution[mix] = (mixDistribution[mix] || 0) + 1;

      // Framework
      const framework = item.metadata.psychology.framework;
      frameworkUsage[framework] = (frameworkUsage[framework] || 0) + 1;
    }

    // Top performers (by score)
    const topPerformers = [...items]
      .sort((a, b) => b.metadata.score.total - a.metadata.score.total)
      .slice(0, 5);

    return {
      totalPosts: items.length,
      averageScore,
      funnelDistribution,
      mixDistribution,
      frameworkUsage,
      topPerformers,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private buildMetadata(content: GeneratedContent): V4ContentMetadata {
    return {
      v4_engine: true,
      version: '4.0',

      headline: content.headline,
      hook: content.hook,
      body: content.body,
      cta: content.cta,
      hashtags: content.hashtags || [],
      content_hash: content.contentHash,

      score: {
        total: content.score.total,
        prediction: content.score.prediction,
        breakdown: content.score.breakdown,
        reasoning: content.score.reasoning || [],
        strengths: content.score.strengths || [],
        weaknesses: content.score.weaknesses || [],
      },

      psychology: {
        framework: content.psychology.framework,
        primaryTrigger: content.psychology.primaryTrigger,
        secondaryTrigger: content.psychology.secondaryTrigger,
        intensity: content.psychology.intensity,
      },

      mixCategory: content.mixCategory,
      funnelStage: content.funnelStage,
      pillar: content.pillarId ? {
        id: content.pillarId,
        name: 'Content Pillar', // pillarName not in GeneratedContent type
      } : undefined,

      generation_mode: 'easy', // Default, can be overridden
      generated_at: new Date().toISOString(),
    };
  }

  private formatContentForCalendar(content: GeneratedContent): string {
    // Format V4 content structure into a single content block
    const parts: string[] = [];

    if (content.hook) {
      parts.push(content.hook);
    }

    if (content.body) {
      parts.push(content.body);
    }

    if (content.cta) {
      parts.push(content.cta);
    }

    if (content.hashtags && content.hashtags.length > 0) {
      parts.push(content.hashtags.join(' '));
    }

    return parts.join('\n\n');
  }

  private buildTags(content: GeneratedContent): string[] {
    const tags: string[] = [
      'v4-engine',
      `score-${content.score.prediction}`,
      `funnel-${content.funnelStage.toLowerCase()}`,
      `mix-${content.mixCategory}`,
      `framework-${content.psychology.framework.toLowerCase()}`,
    ];

    if (content.score.total >= 80) {
      tags.push('high-performer');
    }

    return tags;
  }

  private getOptimalHour(platform: string, postIndex: number): number {
    const optimalHours: Record<string, number[]> = {
      linkedin: [8, 12, 17],
      instagram: [9, 12, 19],
      twitter: [8, 12, 17, 20],
      facebook: [9, 13, 19],
      tiktok: [11, 16, 21],
    };

    const hours = optimalHours[platform] || [9, 12, 17];
    return hours[postIndex % hours.length];
  }

  private transformToV4CalendarItem(row: any): V4CalendarItem {
    return {
      id: row.id,
      brand_id: row.brand_id,
      title: row.title,
      content: row.content,
      platform: row.platform,
      content_type: row.content_type,
      status: row.status,
      scheduled_for: row.scheduled_for,
      published_at: row.published_at,
      ai_score: row.ai_score,
      tags: row.tags,
      media_urls: row.media_urls,
      metadata: row.metadata as V4ContentMetadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// Export singleton instance
export const v4CalendarIntegration = new V4CalendarIntegrationService();
export default v4CalendarIntegration;
