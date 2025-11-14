// Type definitions for MIRROR Framework sections and related data structures
// MIRROR: Measure, Intend, Reimagine, Reach, Optimize, Reflect

export type MirrorPhase =
  | 'measure'    // Formerly 'situation'
  | 'intend'     // Formerly 'objectives'
  | 'reimagine'  // Formerly 'strategy'
  | 'reach'      // Formerly 'tactics'
  | 'optimize'   // Formerly 'action'
  | 'reflect';   // Formerly 'control'

export interface MirrorSection {
  id: string;
  brand_id: string;
  section: MirrorPhase;
  data: Record<string, any>;
  last_enriched_at?: string;
  auto_enrich_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Measure Phase Types (formerly Situation)
export interface BrandHealth {
  overall_score: number;
  visibility_score: number;
  engagement_score: number;
  reputation_score: number;
  content_score: number;
  growth_trend: 'up' | 'down' | 'stable';
  last_calculated: string;
}

export interface MarketPosition {
  market_share_estimate?: number;
  competitive_rank?: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  positioning_statement?: string;
}

export interface CompetitorInsight {
  competitor_name: string;
  website?: string;
  strengths: string[];
  content_strategy?: string;
  estimated_budget?: string;
  key_differentiators: string[];
}

export interface CompetitiveLandscape {
  primary_competitors: CompetitorInsight[];
  market_leaders: string[];
  emerging_threats: string[];
  competitive_gaps: string[];
  last_updated: string;
}

export interface CurrentAsset {
  type: 'content' | 'design' | 'data' | 'platform' | 'tool';
  name: string;
  description: string;
  performance_score?: number;
  usage_frequency: 'high' | 'medium' | 'low';
  roi_estimate?: 'positive' | 'neutral' | 'negative';
}

export interface CurrentAssets {
  platforms: CurrentAsset[];
  content_types: CurrentAsset[];
  tools: CurrentAsset[];
  data_sources: CurrentAsset[];
  total_count: number;
}

export interface AudienceInsight {
  segment_name: string;
  size_estimate?: number;
  demographics?: Record<string, any>;
  psychographics?: string[];
  pain_points: string[];
  goals: string[];
  preferred_channels: string[];
  content_preferences: string[];
}

export interface AudienceProfile {
  primary_segments: AudienceInsight[];
  total_addressable_audience?: number;
  engagement_patterns: Record<string, any>;
  content_performance_by_segment: Record<string, any>;
}

// Intend Phase Types (formerly Objectives)
export interface Objective {
  id: string;
  title: string;
  description: string;
  type: 'growth' | 'engagement' | 'conversion' | 'awareness' | 'retention';
  target_metric: string;
  current_value: number;
  target_value: number;
  deadline: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  milestones: ObjectiveMilestone[];
}

export interface ObjectiveMilestone {
  title: string;
  target_date: string;
  completed: boolean;
  completed_at?: string;
}

// Reimagine Phase Types (formerly Strategy)
export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  target_audience_segments: string[];
  topics: string[];
  formats: string[];
  channels: string[];
  tone: string;
  keywords: string[];
  performance_score?: number;
}

export interface ChannelStrategy {
  channel: string;
  priority: 'primary' | 'secondary' | 'experimental';
  posting_frequency: string;
  best_times: string[];
  content_types: string[];
  kpis: string[];
  budget_allocation?: number;
}

export interface BrandStrategy {
  positioning_statement: string;
  value_proposition: string;
  brand_voice: string;
  visual_identity_guidelines?: Record<string, any>;
  messaging_hierarchy: string[];
  differentiation_points: string[];
}

// Reach Phase Types (formerly Tactics)
export interface TacticalCampaign {
  id: string;
  name: string;
  objective_ids: string[];
  pillar_ids: string[];
  channels: string[];
  start_date: string;
  end_date: string;
  budget?: number;
  status: 'planning' | 'active' | 'paused' | 'completed';
  kpis: Record<string, any>;
  content_pieces: string[];
}

// Optimize Phase Types (formerly Action)
export interface ActionTask {
  id: string;
  title: string;
  description: string;
  campaign_id?: string;
  assigned_to?: string;
  due_date: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
  dependencies: string[];
  estimated_hours?: number;
  actual_hours?: number;
}

// Reflect Phase Types (formerly Control)
export interface KPIMetric {
  name: string;
  current_value: number;
  target_value: number;
  previous_value: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
  status: 'exceeding' | 'on_track' | 'below' | 'critical';
  last_updated: string;
}

export interface PerformanceDashboard {
  period: string;
  kpis: KPIMetric[];
  top_performing_content: any[];
  underperforming_areas: string[];
  recommendations: string[];
}

export interface LearningInsight {
  id: string;
  title: string;
  description: string;
  category: 'success' | 'failure' | 'optimization' | 'trend';
  data_points: Record<string, any>;
  action_items: string[];
  confidence_score: number;
  discovered_at: string;
}

// Enrichment Types
export interface EnrichmentSchedule {
  id: string;
  brand_id: string;
  section: MirrorPhase;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  last_run_at?: string;
  next_run_at: string;
  enabled: boolean;
  data_sources: string[];
  created_at: string;
  updated_at: string;
}

// Intelligence Opportunity Types
export interface IntelligenceOpportunity {
  id: string;
  brand_id: string;
  type: 'weather' | 'trend' | 'competitor' | 'keyword' | 'review' | 'seasonal' | 'local_news';
  title: string;
  description: string;
  source_data: Record<string, any>;
  impact_score: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  expires_at?: string;
  status: 'new' | 'reviewed' | 'actioned' | 'dismissed' | 'expired';
  suggested_actions: string[];
  created_at: string;
  actioned_at?: string;
}
