/**
 * Content Calendar Type Definitions
 * Complete type system for content creation, scheduling, and management
 */

/**
 * Platform type - supported social media platforms
 */
export type Platform = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok' | 'email' | 'blog';

/**
 * Content status
 */
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed';

/**
 * Generation mode - MARBA (fast) vs Synapse (enhanced)
 */
export type GenerationMode = 'marba' | 'synapse';

/**
 * Opportunity type
 */
export type OpportunityType = 'weather' | 'trending' | 'competitor' | 'seasonal' | 'local_news';

/**
 * Urgency level
 */
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Engagement metrics for published content
 */
export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  reach: number;
  impressions?: number;
  saves?: number;
  engagement_rate?: number;
}

/**
 * Content calendar item - main content entity
 */
export interface ContentItem {
  id: string;
  brand_id: string;
  user_id: string;
  platform: Platform;
  content_text: string;
  content_html?: string;
  scheduled_time?: string;
  published_time?: string;
  status: ContentStatus;
  pillar_id?: string;
  campaign_id?: string;
  generation_mode: GenerationMode;
  synapse_score?: number;
  engagement_metrics?: EngagementMetrics;
  design_data?: any;
  platform_post_id?: string;
  error_message?: string;
  intelligence_badges?: string[];
  media_urls?: string[];
  image_url?: string; // Generated visual from new visual generation service
  hashtags?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Content generation parameters
 */
export interface ContentGenerationParams {
  brandId: string;
  platform: Platform;
  topic: string;
  pillarId?: string;
  mode: GenerationMode;
  context?: any;
  opportunityId?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

/**
 * Content variation - result of generation
 */
export interface ContentVariation {
  id: string;
  text: string;
  synapse_analysis?: SynapseAnalysis;
  psychology_score?: number;
  benchmark_comparison?: BenchmarkComparison;
  why_this_works?: string;
  suggested_hashtags?: string[];
  suggested_media?: string[];
}

/**
 * Synapse analysis results
 */
export interface SynapseAnalysis {
  psychology_score: number;
  power_words: string[];
  emotional_triggers: string[];
  connections_found: string[];
  clarity_score: number;
  engagement_prediction: number;
  improvements?: string[];
}

/**
 * Benchmark comparison
 */
export interface BenchmarkComparison {
  industry_average: number;
  your_score: number;
  percentile: number;
  comparison_text: string;
}

/**
 * Intelligence opportunity
 */
export interface Opportunity {
  id: string;
  brand_id: string;
  type: OpportunityType;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  expires_at: string;
  context: any;
  status: 'active' | 'dismissed' | 'used';
  impact_score?: number;
  suggested_actions?: string[];
  created_at: string;
  actioned_at?: string;
}

/**
 * Bulk content generation parameters
 */
export interface BulkGenerationParams {
  brandId: string;
  dateRange: {
    start: string;
    end: string;
  };
  platforms: Platform[];
  pillarDistribution: {
    pillarId: string;
    percentage: number;
  }[];
  mode: GenerationMode;
  postsPerDay?: number;
}

/**
 * Bulk generation result
 */
export interface BulkGenerationResult {
  items: ContentItem[];
  summary: {
    total_posts: number;
    platforms: Platform[];
    days_covered: number;
    pillar_distribution: Record<string, number>;
  };
}

/**
 * Scheduling conflict
 */
export interface SchedulingConflict {
  date: string;
  platform: Platform;
  current_count: number;
  max_allowed: number;
  reason: string;
}

/**
 * Optimal time recommendation
 */
export interface OptimalTimeRecommendation {
  time: string;
  score: number;
  reasoning: string;
  based_on: string[];
}

/**
 * Publishing queue item
 */
export interface PublishingQueueItem {
  content: ContentItem;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  retry_count?: number;
  next_retry?: string;
  error?: string;
}

/**
 * Platform limits
 */
export interface PlatformLimits {
  platform: Platform;
  max_posts_per_day: number;
  max_posts_per_hour?: number;
  optimal_times: string[];
  min_interval_minutes?: number;
}

/**
 * Calendar filter options
 */
export interface CalendarFilters {
  platforms?: Platform[];
  statuses?: ContentStatus[];
  pillarIds?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Calendar view type
 */
export type CalendarViewType = 'month' | 'week' | 'day' | 'list';

/**
 * Content pillar (message pillar from strategy)
 */
export interface ContentPillar {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  color?: string;
  trigger_data?: any;
  synapse_score?: number;
}

/**
 * Auto-schedule strategy
 */
export type AutoScheduleStrategy = 'optimal_times' | 'even_distribution' | 'best_performing';

/**
 * Content format type
 */
export type ContentFormat = 'post' | 'story' | 'reel' | 'carousel' | 'video' | 'article';

/**
 * Approval workflow status
 */
export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected' | 'needs_revision';
