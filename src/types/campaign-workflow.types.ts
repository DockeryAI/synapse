/**
 * Campaign Workflow Type Definitions
 *
 * Defines the campaign generation workflow state machine and types
 * for the Synapse campaign orchestration system
 */

import type { DeepContext } from './synapse/deepContext.types';
import type { BreakthroughInsight } from './synapse/breakthrough.types';

// ============================================================================
// CAMPAIGN STATES
// ============================================================================

export type CampaignState =
  | 'IDLE'
  | 'TYPE_SELECTED'
  | 'CONTENT_SELECTED'
  | 'GENERATING'
  | 'PREVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ERROR';

export type CampaignType = 'authority-builder' | 'social-proof' | 'local-pulse';

export interface CampaignStateTransition {
  from: CampaignState;
  to: CampaignState;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// CAMPAIGN SESSION
// ============================================================================

export interface CampaignSession {
  id: string;
  businessId: string;
  state: CampaignState;
  progress: number; // 0-100
  context?: DeepContext;
  selectedType?: CampaignType;
  selectedInsights?: BreakthroughInsight[];
  selectedSmartPickId?: string;
  generatedContent?: GeneratedCampaignContent;
  error?: CampaignError;
  history: CampaignStateTransition[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CAMPAIGN CONTENT
// ============================================================================

export interface GeneratedCampaignContent {
  campaignId?: string;
  campaignName?: string;
  campaignType?: CampaignType;
  platforms?: PlatformContent[];
  posts?: Array<{
    id: string;
    platform: string;
    content: {
      headline?: string;
      body: string;
      hashtags?: string[];
      cta?: string;
    };
    visuals?: any;
    scheduledDate?: Date;
    status: string;
  }>;
  metadata: {
    insightsUsed?: string[];
    generatedAt: string | Date;
    totalPosts?: number;
    model?: string;
    confidence?: number;
  };
}

export interface PlatformContent {
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  content: {
    headline?: string;
    hook: string;
    body: string;
    cta: string;
    hashtags?: string[];
  };
  characterCount: number;
  mediaUrls?: string[];
}

// ============================================================================
// CAMPAIGN DATABASE MODELS
// ============================================================================

export interface CampaignRecord {
  id: string;
  business_id: string;
  campaign_name: string;
  campaign_type: string; // 'authority-builder' | 'social-proof' | 'local-pulse'
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  budget_usd?: number;
  goals?: Record<string, any>;
  target_audience?: Record<string, any>;
  content_data?: GeneratedCampaignContent;
  created_at: string;
  updated_at: string;
}

export interface ContentPieceRecord {
  id: string;
  business_id: string;
  campaign_id?: string;
  content_type: string; // 'post' | 'article' | 'video' | 'infographic'
  platform?: string;
  title?: string;
  content_text?: string;
  media_urls?: string[];
  hashtags?: string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduled_for?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WORKFLOW EVENTS
// ============================================================================

export interface CampaignWorkflowEvent {
  type: 'STATE_CHANGED' | 'PROGRESS_UPDATED' | 'ERROR' | 'CONTENT_GENERATED';
  sessionId: string;
  timestamp: Date;
  data: any;
}

export type CampaignEventHandler = (event: CampaignWorkflowEvent) => void;

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface CampaignError {
  code: string;
  message: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount?: number;
  stack?: string;
}

export type CampaignErrorCode =
  | 'INVALID_STATE_TRANSITION'
  | 'CONTENT_GENERATION_FAILED'
  | 'DATABASE_ERROR'
  | 'INSUFFICIENT_DATA'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// ============================================================================
// WORKFLOW CONFIGURATION
// ============================================================================

export interface WorkflowConfig {
  autoSave: boolean;
  autoSaveInterval: number; // milliseconds
  retryAttempts: number;
  timeoutMs: number;
  enableLogging: boolean;
}

// ============================================================================
// SMART PICK (from Smart Picks worktree)
// ============================================================================

export interface SmartPick {
  id: string;
  campaignType: CampaignType;
  title: string;
  headline: string;
  hookPreview: string;
  insightIds: string[];
  confidence: number;
}
