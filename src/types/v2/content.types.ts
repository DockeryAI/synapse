/**
 * Content Types for Dashboard V2
 * Data models for single content mode functionality
 */

import type { EmotionalTrigger, PerformancePrediction } from './campaign.types';

export type ContentMode = 'single' | 'batch';

export type ContentPurpose =
  | 'awareness'
  | 'education'
  | 'engagement'
  | 'conversion'
  | 'retention'
  | 'authority';

export type ContentStatus = 'draft' | 'generated' | 'scheduled' | 'published';

export type ContentChannel =
  | 'blog'
  | 'linkedin'
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'email'
  | 'youtube'
  | 'tiktok';

export interface SingleContent {
  id: string;
  brandId: string;
  title: string;
  content: string;
  purpose: ContentPurpose;
  status: ContentStatus;
  channel: ContentChannel;
  templateId: string;
  emotionalTrigger: EmotionalTrigger;
  connectionIds: string[];
  themes: ContentTheme[];
  performancePrediction?: PerformancePrediction;
  scheduledDate?: string;
  publishedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentTheme {
  id: string;
  primary: string;
  secondary?: string;
  modifier?: string;
  keywords: string[];
  uniquenessScore: number;
}

export interface ConnectionMapping {
  id: string;
  connectionType: 'two_way' | 'three_way' | 'multi_way';
  dataPoints: DataPointReference[];
  strength: number;
  suggestedTemplate: string;
  suggestedPurpose: ContentPurpose;
}

export interface DataPointReference {
  id: string;
  type: DataPointType;
  source: string;
  content: string;
  relevanceScore: number;
}

export type DataPointType =
  | 'trend'
  | 'competitor_gap'
  | 'customer_pain'
  | 'success_story'
  | 'industry_insight'
  | 'seasonal_trigger'
  | 'news_event'
  | 'review'
  | 'social_signal';

export interface ContentCreateInput {
  brandId: string;
  title?: string;
  purpose: ContentPurpose;
  channel: ContentChannel;
  templateId: string;
  connectionIds?: string[];
  scheduledDate?: string;
}

export interface ContentUpdateInput {
  title?: string;
  content?: string;
  status?: ContentStatus;
  channel?: ContentChannel;
  scheduledDate?: string;
}

export interface ContentGenerationRequest {
  brandId: string;
  templateId: string;
  connectionMapping: ConnectionMapping;
  themes: ContentTheme[];
  emotionalTrigger: EmotionalTrigger;
  channel: ContentChannel;
  industryCode?: string;
}

export interface ContentGenerationResult {
  content: SingleContent;
  alternativeVersions?: string[];
  performancePrediction: PerformancePrediction;
  usedDataPoints: DataPointReference[];
}
