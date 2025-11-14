// Type definitions for Content Calendar, Generation, and Design

export type ContentGenerationMode = 'marba' | 'synapse';

export type ContentStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'archived';

export type ContentPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'google_business'
  | 'blog'
  | 'email';

export type ContentFormat =
  | 'text'
  | 'image'
  | 'video'
  | 'carousel'
  | 'story'
  | 'reel'
  | 'blog_post'
  | 'email'
  | 'landing_page';

export interface ContentCalendarItem {
  id: string;
  brand_id: string;
  user_id: string;
  pillar_id?: string;
  campaign_id?: string;
  platform: ContentPlatform;
  format: ContentFormat;
  status: ContentStatus;
  generation_mode?: ContentGenerationMode;
  title: string;
  body: string;
  media_urls: string[];
  hashtags: string[];
  scheduled_for?: string;
  published_at?: string;
  platform_post_id?: string;
  engagement_metrics?: EngagementMetrics;
  design_data?: DesignData;
  variations?: ContentVariation[];
  created_at: string;
  updated_at: string;
}

export interface ContentVariation {
  id: string;
  title: string;
  body: string;
  hashtags?: string[];
  generation_mode: ContentGenerationMode;
  psychology_score?: number;
  created_at: string;
}

export interface EngagementMetrics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagement_rate: number;
  last_updated: string;
}

// Design Studio Types
export interface DesignData {
  canvas_size: { width: number; height: number };
  objects: DesignObject[];
  background?: DesignBackground;
  version: number;
  thumbnail_url?: string;
}

export interface DesignObject {
  type: 'text' | 'image' | 'shape' | 'icon' | 'logo';
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  opacity?: number;
  z_index: number;
  data: TextData | ImageData | ShapeData;
}

export interface TextData {
  content: string;
  font_family: string;
  font_size: number;
  font_weight: string;
  color: string;
  align: 'left' | 'center' | 'right';
  line_height?: number;
}

export interface ImageData {
  url: string;
  filters?: Record<string, any>;
  crop?: { x: number; y: number; width: number; height: number };
}

export interface ShapeData {
  shape_type: 'rectangle' | 'circle' | 'triangle' | 'line';
  fill_color?: string;
  stroke_color?: string;
  stroke_width?: number;
}

export interface DesignBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: { start: string; end: string; angle: number };
  image_url?: string;
}

export interface DesignTemplate {
  id: string;
  brand_id?: string;
  name: string;
  description?: string;
  category: string;
  platform: ContentPlatform;
  design_data: DesignData;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Content Generation Types
export interface ContentGenerationRequest {
  brand_id: string;
  platform: ContentPlatform;
  topic: string;
  pillar_id?: string;
  mode: ContentGenerationMode;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  include_hashtags?: boolean;
  include_cta?: boolean;
}

export interface ContentGenerationResponse {
  content: string;
  variations: string[];
  metadata: ContentGenerationMetadata;
  timestamp: string;
}

export interface ContentGenerationMetadata {
  mode: ContentGenerationMode;
  model: string;
  enhanced: boolean;
  psychology_score?: number;
  connections_found?: number;
  power_words?: string[];
  generation_time_ms?: number;
}

// Synapse Enhancement Types
export interface SynapseEnrichment {
  original: string;
  enrichment_type: 'full' | 'quick' | 'power_words_only';
  psychology_score: number;
  connections: SynapseConnection[];
  power_words: string[];
  suggestions: string[];
  enhanced_content: string;
  timestamp: string;
}

export interface SynapseConnection {
  from: string;
  to: string;
  strength: number;
  type: 'logical' | 'emotional' | 'metaphorical' | 'sequential';
  explanation?: string;
}

// Publishing Types
export interface PublishRequest {
  content_item_id: string;
  platform: ContentPlatform;
  content: string;
  image_url?: string;
  scheduled_time?: string;
}

export interface PublishResponse {
  success: boolean;
  platform: ContentPlatform;
  platform_post_id?: string;
  published_at?: string;
  message: string;
  error?: string;
}

// Content Performance Types
export interface ContentPerformance {
  content_item_id: string;
  platform: ContentPlatform;
  metrics: EngagementMetrics;
  performance_score: number;
  benchmark_comparison: BenchmarkComparison;
  top_performing_elements: string[];
  optimization_suggestions: string[];
}

export interface BenchmarkComparison {
  vs_account_average: number;
  vs_industry_average: number;
  vs_similar_content: number;
  percentile_rank: number;
}

// Content Calendar View Types
export interface CalendarView {
  mode: 'day' | 'week' | 'month' | 'agenda';
  start_date: string;
  end_date: string;
  filters: CalendarFilters;
}

export interface CalendarFilters {
  platforms?: ContentPlatform[];
  statuses?: ContentStatus[];
  pillars?: string[];
  campaigns?: string[];
  generation_modes?: ContentGenerationMode[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  content_item: ContentCalendarItem;
  color?: string;
}
