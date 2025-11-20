/**
 * Campaign Generation Types
 *
 * Type definitions for the campaign generation pipeline that connects
 * onboarding insights to real content creation.
 *
 * Created: Nov 17, 2025 - Week 1 Workstream A
 */

import type { ExtractedUVPData } from './smart-uvp.types';
import type { WebsiteMessagingAnalysis } from '@/services/intelligence/website-analyzer.service';
import type { RefinedBusinessData } from '@/components/onboarding-v5/SmartConfirmation';
import type { BreakthroughInsight } from './breakthrough.types';

// ============================================================================
// CORE TYPES
// ============================================================================

export type CampaignType =
  | 'trust_builder'           // Customer success stories
  | 'authority_builder'       // Educational content
  | 'problem_solver'         // Problem-solution posts
  | 'differentiator'         // Value prop highlights
  | 'engagement_driver';     // Community-focused

export type PostType =
  | 'customer_success'
  | 'service_spotlight'
  | 'problem_solution'
  | 'value_proposition'
  | 'behind_the_scenes'
  | 'community_engagement'
  | 'educational'
  | 'promotional';

export type Platform =
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'google_business'
  | 'tiktok'
  | 'youtube';

export type ContentStatus =
  | 'draft'
  | 'generated'
  | 'scheduled'
  | 'published'
  | 'failed';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CampaignGenerationInput {
  campaignId: string;
  campaignType: CampaignType;
  brandId?: string; // ✨ EQ v2.0: Optional brand ID for EQ enrichment
  businessContext: {
    businessData: RefinedBusinessData;
    uvpData: ExtractedUVPData;
    websiteAnalysis: WebsiteMessagingAnalysis | null;
    specialization?: string;
  };
  options?: {
    postsPerCampaign?: number;
    platforms?: Platform[];
    includeVisuals?: boolean;
    saveToDatabase?: boolean;
  };
}

export interface PostGenerationInput {
  postType: PostType;
  brandId?: string; // ✨ EQ v2.0: Optional brand ID for EQ enrichment
  businessContext: {
    businessData: RefinedBusinessData;
    uvpData: ExtractedUVPData;
    websiteAnalysis: WebsiteMessagingAnalysis | null;
    specialization?: string;
  };
  selectedInsights?: BreakthroughInsight[];
  platforms?: Platform[];
  options?: {
    includeVisuals?: boolean;
    saveToDatabase?: boolean;
  };
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export interface GeneratedCampaign {
  id: string;
  campaignType: CampaignType;
  name: string;
  description: string;
  posts: GeneratedPost[];
  totalPosts: number;
  estimatedDuration: number; // days
  createdAt: Date;
  businessId: string;
  metadata: {
    generatedBy: 'ai' | 'template' | 'hybrid';
    sourceInsights?: string[]; // Insight IDs used
    confidence: number;
  };
}

export interface GeneratedPost {
  id: string;
  type: PostType;
  platform: Platform;
  content: PostContent;
  visuals: PostVisual[];
  scheduledFor?: Date;
  status: ContentStatus;
  sources: ContentSource[];
  metadata: PostMetadata;
}

export interface PostContent {
  headline?: string;
  hook?: string;
  body: string;
  hashtags: string[];
  callToAction?: string;
  emojis?: string[];
}

export interface PostVisual {
  id: string;
  url: string;
  type: 'image' | 'video' | 'carousel';
  bannerbearTemplateId?: string;
  bannerbearImageId?: string;
  altText?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
  };
}

export interface ContentSource {
  type: 'website' | 'uvp' | 'insight' | 'template' | 'user_input';
  url?: string;
  excerpt?: string;
  confidence: number;
  insightId?: string;
}

export interface PostMetadata {
  impactScore?: number;
  psychologyTriggers?: string[];
  targetAudience?: string;
  tone?: string;
  generatedAt: Date;
  model?: string;
  templateUsed?: string;
}

// ============================================================================
// GENERATION PROGRESS
// ============================================================================

export interface GenerationProgress {
  sessionId: string;
  stage: GenerationStage;
  progress: number; // 0-100
  currentPost?: number;
  totalPosts: number;
  estimatedTimeRemaining?: number; // seconds
  errors: GenerationError[];
}

export type GenerationStage =
  | 'initializing'
  | 'analyzing_business'
  | 'selecting_insights'
  | 'generating_content'
  | 'generating_visuals'
  | 'saving_to_database'
  | 'complete'
  | 'failed';

export interface GenerationError {
  stage: GenerationStage;
  message: string;
  timestamp: Date;
  retryable: boolean;
}

// ============================================================================
// CAMPAIGN TEMPLATES
// ============================================================================

export interface CampaignTemplate {
  id: string;
  campaignType: CampaignType;
  name: string;
  description: string;
  postTypes: PostType[];
  recommendedCount: number;
  duration: number; // days
  frequency: 'daily' | 'every-2-days' | 'every-3-days' | 'weekly';
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface ContentCalendarItem {
  id: string;
  brand_id: string;
  campaign_id?: string;
  post_type: PostType;
  platform: Platform;
  content: PostContent;
  visuals: PostVisual[];
  scheduled_for?: string; // ISO date string
  status: ContentStatus;
  sources: ContentSource[];
  metadata: PostMetadata;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  campaign_type: CampaignType;
  name: string;
  description: string;
  total_posts: number;
  posts_generated: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface BusinessContext {
  businessData: RefinedBusinessData;
  uvpData: ExtractedUVPData;
  websiteAnalysis: WebsiteMessagingAnalysis | null;
  specialization?: string;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

export const CAMPAIGN_ID_TO_TYPE_MAP: Record<string, CampaignType> = {
  'success-stories-campaign': 'trust_builder',
  'service-education-campaign': 'authority_builder',
  'problem-solution-campaign': 'problem_solver',
  'value-launch-campaign': 'differentiator',
  'community-campaign': 'engagement_driver',
};

export const POST_ID_TO_TYPE_MAP: Record<string, PostType> = {
  'post-customer-success': 'customer_success',
  'post-service-spotlight': 'service_spotlight',
  'post-problem-solution': 'problem_solution',
  'post-value-prop': 'value_proposition',
  'post-behind-scenes': 'behind_the_scenes',
  'post-community': 'community_engagement',
  'post-educational': 'educational',
  'post-promotional': 'promotional',
};

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function mapCampaignIdToType(campaignId: string): CampaignType {
  return CAMPAIGN_ID_TO_TYPE_MAP[campaignId] || 'authority_builder';
}

export function mapPostIdToType(postId: string): PostType {
  return POST_ID_TO_TYPE_MAP[postId] || 'service_spotlight';
}
