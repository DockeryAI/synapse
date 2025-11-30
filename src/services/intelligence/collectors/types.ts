/**
 * Collector Types for Enhanced Competitor Intelligence
 *
 * Standardized output types for all data collectors.
 * Each collector returns data in these formats for the strategic analyzer.
 *
 * Created: 2025-11-29
 */

import type { CustomerVoice, SEOMetrics, FeatureVelocity } from '@/types/competitor-intelligence.types';

// Base collector result
export interface CollectorResult {
  success: boolean;
  source: string;
  timestamp: string;
  error?: string;
}

// Reddit collector result
export interface RedditCollectorResult extends CollectorResult {
  source: 'reddit';
  data: {
    customer_voice: CustomerVoice;
    raw_posts: Array<{
      title: string;
      body: string;
      subreddit: string;
      upvotes: number;
      url: string;
      sentiment: 'positive' | 'negative' | 'neutral';
    }>;
    competitor_mentions: Array<{
      competitor_name: string;
      mention_count: number;
      sentiment_avg: number;
      sample_quotes: string[];
    }>;
  };
}

// SEMrush collector result
export interface SEMrushCollectorResult extends CollectorResult {
  source: 'semrush';
  data: {
    seo_metrics: SEOMetrics;
    top_keywords: Array<{
      keyword: string;
      position: number;
      volume: number;
      traffic: number;
    }>;
    keyword_gaps: Array<{
      keyword: string;
      competitor_position: number;
      our_position: number | null;
      opportunity: string;
    }>;
  };
}

// YouTube collector result
export interface YouTubeCollectorResult extends CollectorResult {
  source: 'youtube';
  data: {
    channel_presence: {
      has_channel: boolean;
      subscriber_count?: number;
      video_count?: number;
      total_views?: number;
    };
    recent_videos: Array<{
      title: string;
      views: number;
      likes: number;
      published_at: string;
    }>;
    content_strategy: {
      posting_frequency: string;
      avg_views: number;
      top_topics: string[];
    };
    feature_velocity_signals: Partial<FeatureVelocity>;
  };
}

// Serper collector result
export interface SerperCollectorResult extends CollectorResult {
  source: 'serper';
  data: {
    news_mentions: Array<{
      title: string;
      snippet: string;
      url: string;
      date: string;
      source: string;
    }>;
    serp_features: {
      has_featured_snippet: boolean;
      has_knowledge_panel: boolean;
      has_local_pack: boolean;
      organic_position: number | null;
    };
    related_searches: string[];
    competitor_ads: Array<{
      title: string;
      description: string;
      url: string;
    }>;
  };
}

// Integration Gap collector result
export interface IntegrationGapResult extends CollectorResult {
  source: 'integration-gap';
  data: {
    integration_issues: Array<{
      category: 'api' | 'workflow' | 'compatibility' | 'migration';
      severity: 'high' | 'medium' | 'low';
      description: string;
      source: string;
    }>;
    workflow_frictions: Array<{
      workflow: string;
      friction_point: string;
      user_impact: string;
      frequency: 'common' | 'occasional' | 'rare';
    }>;
    missing_integrations: string[];
    health_score: number;
    ecosystem_gaps: string[];
  };
}

// Talent Signal collector result
export interface TalentSignalResult extends CollectorResult {
  source: 'talent-signal';
  data: {
    job_postings: Array<{
      title: string;
      department: string;
      skills: string[];
      seniority: 'entry' | 'mid' | 'senior' | 'executive';
      signal: string;
    }>;
    hiring_trends: Array<{
      department: string;
      intensity: 'aggressive' | 'moderate' | 'minimal';
      focus_areas: string[];
      strategic_implication: string;
    }>;
    technology_signals: Array<{
      technology: string;
      adoption_stage: 'exploring' | 'adopting' | 'scaling';
      evidence: string;
    }>;
    expansion_signals: string[];
    hiring_velocity: 'aggressive' | 'moderate' | 'minimal' | 'unknown';
    strategic_insights: string[];
  };
}

// Combined result from all collectors
export interface EnhancedCollectorResults {
  reddit?: RedditCollectorResult;
  semrush?: SEMrushCollectorResult;
  youtube?: YouTubeCollectorResult;
  serper?: SerperCollectorResult;
  integrationGap?: IntegrationGapResult;
  talentSignal?: TalentSignalResult;
  collected_at: string;
  duration_ms: number;
}
