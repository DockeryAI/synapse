// Type definitions for API requests and responses

import type { ContentGenerationMode, ContentPlatform } from './content.types';
import type { MirrorSectionType } from './mirror.types';

// Generic API Response
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: Record<string, any>;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Mirror Analysis API
export interface AnalyzeMirrorRequest {
  brand_id: string;
  section: MirrorSectionType;
  force_refresh?: boolean;
}

export interface AnalyzeMirrorResponse {
  brand_id: string;
  section: MirrorSectionType;
  analysis: Record<string, any>;
  insights: string[];
  recommendations: string[];
  enrichment_sources: string[];
  analyzed_at: string;
}

// Content Generation API
export interface GenerateContentRequest {
  brand_id: string;
  platform: ContentPlatform;
  topic: string;
  pillar_id?: string;
  mode: ContentGenerationMode;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  include_hashtags?: boolean;
  include_cta?: boolean;
  context?: Record<string, any>;
}

export interface GenerateContentResponse {
  content: string;
  variations: string[];
  metadata: {
    mode: ContentGenerationMode;
    model: string;
    enhanced: boolean;
    psychology_score?: number;
    connections_found?: number;
    power_words?: string[];
    generation_time_ms?: number;
  };
  timestamp: string;
}

// Synapse Enrichment API
export interface EnrichWithSynapseRequest {
  content: string;
  enrichment_type?: 'full' | 'quick' | 'power_words_only';
  context?: {
    industry?: string;
    audience?: string[];
    goal?: string;
  };
}

export interface EnrichWithSynapseResponse {
  original: string;
  enrichment_type: string;
  psychology_score: number;
  connections: Array<{
    from: string;
    to: string;
    strength: number;
    type: string;
  }>;
  power_words: string[];
  suggestions: string[];
  enhanced_content: string;
  timestamp: string;
}

// Publishing API
export interface PublishToPlatformRequest {
  content_item_id: string;
  platform: ContentPlatform;
  content: string;
  image_url?: string;
  scheduled_time?: string;
  publish_immediately?: boolean;
}

export interface PublishToPlatformResponse {
  success: boolean;
  platform: ContentPlatform;
  platform_post_id?: string;
  published_at?: string;
  message: string;
  error?: string;
}

// Analytics Collection API
export interface CollectAnalyticsRequest {
  brand_id: string;
  platform: ContentPlatform;
  date_range: {
    start: string;
    end: string;
  };
  metrics?: string[];
}

export interface CollectAnalyticsResponse {
  brand_id: string;
  platform: ContentPlatform;
  date_range: {
    start: string;
    end: string;
  };
  metrics: {
    followers: number;
    engagement_rate: number;
    impressions: number;
    reach: number;
    [key: string]: number;
  };
  events: AnalyticsEvent[];
  collected_at: string;
  status: string;
}

interface AnalyticsEvent {
  type: string;
  data: Record<string, any>;
  timestamp: string;
}

// Marbs Assistant API
export interface MarbsMessageRequest {
  message: string;
  context: {
    current_section?: string;
    current_subsection?: string;
    current_page?: string;
    page_data?: Record<string, any>;
  };
  conversation_id?: string;
  streaming?: boolean;
}

export interface MarbsMessageResponse {
  message: string;
  actions?: Array<{
    type: string;
    description: string;
    data: Record<string, any>;
    timestamp: string;
  }>;
  suggestions?: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
  }>;
  conversation_id: string;
  metadata?: Record<string, any>;
}

// MARBA Scoring API
export interface CalculateMARBAScoreRequest {
  content: string;
  context?: {
    content_type: string;
    platform: string;
    target_audience?: string[];
    industry?: string;
  };
}

export interface CalculateMARBAScoreResponse {
  overall: number;
  breakdown: {
    messaging: number;
    authenticity: number;
    relevance: number;
    brand_alignment: number;
    action: number;
  };
  insights: Array<{
    category: string;
    severity: string;
    title: string;
    description: string;
  }>;
  recommendations: string[];
  calculated_at: string;
}

// OpenRouter API Types
export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// Platform-specific API Types

// Facebook/Instagram Graph API
export interface FacebookGraphAPIRequest {
  access_token: string;
  message?: string;
  url?: string;
  published?: boolean;
  scheduled_publish_time?: number;
}

export interface FacebookGraphAPIResponse {
  id: string;
  post_id?: string;
}

// LinkedIn API
export interface LinkedInShareRequest {
  author: string;
  lifecycleState: 'PUBLISHED' | 'DRAFT';
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: 'NONE' | 'ARTICLE' | 'IMAGE';
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS';
  };
}

export interface LinkedInShareResponse {
  id: string;
  activity: string;
}

// Twitter API
export interface TwitterTweetRequest {
  text: string;
  media?: {
    media_ids: string[];
  };
  poll?: {
    options: string[];
    duration_minutes: number;
  };
}

export interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
    edit_history_tweet_ids: string[];
  };
}

// Google Business Profile API
export interface GoogleBusinessPostRequest {
  languageCode: string;
  summary: string;
  callToAction?: {
    actionType: string;
    url: string;
  };
  media?: Array<{
    mediaFormat: 'PHOTO' | 'VIDEO';
    sourceUrl: string;
  }>;
  topicType: 'STANDARD' | 'EVENT' | 'OFFER';
}

export interface GoogleBusinessPostResponse {
  name: string;
  languageCode: string;
  summary: string;
  state: 'LIVE' | 'REJECTED';
}

// Supabase Edge Function Types
export interface EdgeFunctionRequest<T = any> {
  headers?: Record<string, string>;
  body: T;
}

export interface EdgeFunctionResponse<T = any> {
  status: number;
  body: T;
  headers?: Record<string, string>;
}

// Webhook Types
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  message?: string;
}
