/**
 * Type definitions for Enrichment Engine and Background Jobs
 * Phase 15: Background Jobs and Enrichment Engine
 */

export type MIRRORSection =
  | 'measure'
  | 'intend'
  | 'reimagine'
  | 'reach'
  | 'optimize'
  | 'reflect';

export interface EnrichmentCache {
  id: string;
  brand_id: string;
  section: MIRRORSection;
  data: Json;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentResult {
  section: MIRRORSection;
  insights: string[];
  recommendations: string[];
  benchmarks?: Record<string, any>;
  gaps?: string[];
  opportunities?: string[];
  confidence_score: number;
  generated_at: string;
}

export interface CacheTTL {
  measure: number; // 24 hours
  intend: number; // 7 days
  reimagine: number; // 7 days
  reach: number; // 3 days
  optimize: number; // 1 day
  reflect: number; // 6 hours
}

// Opportunity Detection Types
export type OpportunityType =
  | 'weather'
  | 'trending'
  | 'competitor'
  | 'seasonal'
  | 'local_news'
  | 'industry_event'
  | 'cultural_moment';

export type OpportunityUrgency = 'critical' | 'high' | 'medium' | 'low';

export interface Opportunity {
  id: string;
  brand_id: string;
  type: OpportunityType;
  title: string;
  description: string;
  urgency: OpportunityUrgency;
  expires_at: string;
  action_items: string[];
  context: Record<string, any>;
  confidence_score: number;
  detected_at: string;
  source: string;
}

export interface WeatherOpportunity {
  location: string;
  condition: string; // rain, snow, heat, cold, storm
  temperature: number;
  forecast: string;
  marketing_angle: string;
  suggested_products?: string[];
}

export interface TrendingOpportunity {
  topic: string;
  platform: string; // google_trends, twitter, tiktok
  search_volume: number;
  velocity: 'rising' | 'stable' | 'declining';
  relevance_score: number;
  suggested_content: string;
}

export interface CompetitorOpportunity {
  competitor_name: string;
  activity_type: string; // launch, campaign, pricing_change, messaging_shift
  detected_change: string;
  differentiation_angle: string;
  recommended_response: string;
}

export interface SeasonalOpportunity {
  event: string; // back_to_school, holidays, etc.
  start_date: string;
  end_date: string;
  preparation_days: number;
  suggested_campaigns: string[];
}

// Competitive Monitoring Types
export interface CompetitiveSnapshot {
  id: string;
  brand_id: string;
  competitor_name: string;
  snapshot_type: 'website' | 'social' | 'messaging' | 'pricing' | 'product';
  data: Record<string, any>;
  changes_detected: string[];
  created_at: string;
}

export interface MessagingShift {
  competitor: string;
  previous_messaging: string;
  new_messaging: string;
  shift_type: 'tone' | 'positioning' | 'focus' | 'target_audience';
  impact_assessment: string;
  recommended_action: string;
}

export interface CompetitiveGap {
  area: string; // features, messaging, channels, audience
  gap_description: string;
  opportunity_size: 'small' | 'medium' | 'large';
  effort_required: 'low' | 'medium' | 'high';
  recommended_action: string;
}

// Learning Engine Types
export interface LearningPattern {
  id: string;
  brand_id: string;
  pattern_type: 'content' | 'timing' | 'platform' | 'audience';
  category: string;
  insight: string;
  data_points: number;
  confidence_score: number;
  actionable_recommendation: string;
  created_at: string;
  updated_at: string;
}

export interface ContentPattern {
  format: string; // video, carousel, single_image, text
  average_engagement: number;
  best_performing_topics: string[];
  optimal_length?: number;
  power_words: string[];
  hashtag_performance: Record<string, number>;
}

export interface TimingPattern {
  platform: string;
  best_posting_times: string[]; // ISO time strings
  worst_posting_times: string[];
  day_of_week_performance: Record<string, number>;
  time_zone: string;
}

export interface PlatformPattern {
  platform: string;
  engagement_rate: number;
  best_content_types: string[];
  audience_demographics: Record<string, any>;
  growth_rate: number;
}

export interface AudiencePattern {
  segment: string;
  interests: string[];
  pain_points: string[];
  preferred_content: string[];
  response_to_cta: Record<string, number>;
}

// Background Job Types
export interface BackgroundJob {
  id: string;
  name: string;
  schedule: string; // cron expression
  status: 'active' | 'paused' | 'failed';
  last_run_at: string | null;
  next_run_at: string | null;
  last_run_status: 'success' | 'failed' | 'running' | null;
  last_run_duration_ms: number | null;
  last_error: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobExecution {
  id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'failed';
  result: Record<string, any> | null;
  error: string | null;
  duration_ms: number | null;
  brands_processed: number;
  items_processed: number;
}

export interface JobLog {
  job_name: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

// Signal Detection Types
export interface Signal {
  id: string;
  brand_id: string;
  signal_type: 'opportunity' | 'threat' | 'trend' | 'anomaly';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  detected_at: string;
  requires_action: boolean;
  suggested_actions: string[];
  metadata: Record<string, any>;
}

// Enrichment Scheduler Types
export interface EnrichmentSchedule {
  id: string;
  brand_id: string;
  section: MIRRORSection;
  schedule_type: 'daily' | 'weekly' | 'on_demand';
  last_enriched_at: string | null;
  next_scheduled_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Analytics Collection Types
export interface AnalyticsCollection {
  brand_id: string;
  date_range: {
    start: string;
    end: string;
  };
  aggregation_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  platforms: string[];
  metrics_collected: Record<string, any>;
}

// Auto Publisher Types
export interface ScheduledPublish {
  id: string;
  content_calendar_item_id: string;
  scheduled_for: string;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  platform: string;
  content: Record<string, any>;
  published_at: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
}

export interface PublishEvent {
  id: string;
  content_calendar_item_id: string;
  event_type: 'scheduled' | 'published' | 'failed' | 'retry';
  status: 'success' | 'failed';
  platform: string;
  error: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Engagement Collection Types
export interface EngagementItem {
  id: string;
  brand_id: string;
  platform: string;
  type: 'comment' | 'mention' | 'message' | 'review';
  author: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  requires_response: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source_url: string | null;
  collected_at: string;
  responded_at: string | null;
  metadata: Record<string, any>;
}

// Error Handling Types
export interface EnrichmentError {
  section: MIRRORSection;
  error: Error;
  timestamp: string;
  retry_count: number;
}

export interface JobError {
  job_name: string;
  error: Error;
  timestamp: string;
  context: Record<string, any>;
}

// API Response Types
export interface EnrichmentResponse {
  success: boolean;
  data?: EnrichmentResult;
  error?: string;
  cached: boolean;
  cache_expires_at?: string;
}

export interface OpportunityDetectionResponse {
  success: boolean;
  opportunities: Opportunity[];
  total_count: number;
  by_urgency: Record<OpportunityUrgency, number>;
}

export interface JobStatusResponse {
  job_name: string;
  status: BackgroundJob['status'];
  last_run: {
    status: string;
    duration_ms: number;
    brands_processed: number;
    timestamp: string;
  } | null;
  next_run: string | null;
  health: 'healthy' | 'degraded' | 'unhealthy';
}

// Helper type for JSON
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
