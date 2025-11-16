/**
 * CAMPAIGN PREVIEW & APPROVAL TYPES
 *
 * Type definitions for the campaign preview and approval workflow.
 * Supports multi-platform preview, editing, and approval.
 */

import type { CampaignType, PlatformContent } from './campaign-workflow.types';

// ============================================================================
// PLATFORM TYPES
// ============================================================================

export type SupportedPlatform = 'linkedin' | 'facebook' | 'instagram' | 'x' | 'tiktok' | 'youtube';

export interface PlatformConfig {
  platform: SupportedPlatform;
  displayName: string;
  icon: string; // Icon name or path
  characterLimits: {
    headline?: number;
    hook: number;
    body: number;
    cta: number;
    hashtags: number; // Max number of hashtags
  };
  supportsVideo: boolean;
  supportsImages: boolean;
  recommendedAspectRatio?: string;
}

export const PLATFORM_CONFIGS: Record<SupportedPlatform, PlatformConfig> = {
  linkedin: {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    icon: 'linkedin',
    characterLimits: {
      headline: 120,
      hook: 150,
      body: 3000,
      cta: 100,
      hashtags: 5
    },
    supportsVideo: true,
    supportsImages: true,
    recommendedAspectRatio: '1:1'
  },
  facebook: {
    platform: 'facebook',
    displayName: 'Facebook',
    icon: 'facebook',
    characterLimits: {
      hook: 120,
      body: 63206,
      cta: 100,
      hashtags: 30
    },
    supportsVideo: true,
    supportsImages: true,
    recommendedAspectRatio: '1.91:1'
  },
  instagram: {
    platform: 'instagram',
    displayName: 'Instagram',
    icon: 'instagram',
    characterLimits: {
      hook: 125,
      body: 2200,
      cta: 80,
      hashtags: 30
    },
    supportsVideo: true,
    supportsImages: true,
    recommendedAspectRatio: '1:1'
  },
  x: {
    platform: 'x',
    displayName: 'X (Twitter)',
    icon: 'twitter',
    characterLimits: {
      hook: 280,
      body: 280,
      cta: 100,
      hashtags: 2
    },
    supportsVideo: true,
    supportsImages: true,
    recommendedAspectRatio: '16:9'
  },
  tiktok: {
    platform: 'tiktok',
    displayName: 'TikTok',
    icon: 'tiktok',
    characterLimits: {
      hook: 100,
      body: 2200,
      cta: 80,
      hashtags: 5
    },
    supportsVideo: true,
    supportsImages: false,
    recommendedAspectRatio: '9:16'
  },
  youtube: {
    platform: 'youtube',
    displayName: 'YouTube',
    icon: 'youtube',
    characterLimits: {
      headline: 100,
      hook: 100,
      body: 5000,
      cta: 100,
      hashtags: 15
    },
    supportsVideo: true,
    supportsImages: true,
    recommendedAspectRatio: '16:9'
  }
};

// ============================================================================
// CONTENT SECTIONS
// ============================================================================

export type ContentSection = 'headline' | 'hook' | 'body' | 'cta' | 'hashtags';

export interface SectionContent {
  section: ContentSection;
  value: string | string[]; // string for text, array for hashtags
  characterCount: number;
  isOverLimit: boolean;
  limit?: number;
}

// ============================================================================
// PREVIEW MODE
// ============================================================================

export type PreviewMode = 'preview' | 'edit';

export interface PreviewState {
  mode: PreviewMode;
  selectedPlatform: SupportedPlatform;
  editingSection?: ContentSection;
}

// ============================================================================
// CAMPAIGN PREVIEW DATA
// ============================================================================

export interface CampaignPreviewData {
  campaignId: string;
  campaignName: string;
  campaignType: CampaignType;
  platforms: SupportedPlatform[];
  content: Record<SupportedPlatform, PlatformPreviewContent>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformPreviewContent {
  platform: SupportedPlatform;
  sections: {
    headline?: string;
    hook: string;
    body: string;
    cta: string;
    hashtags: string[];
  };
  characterCounts: {
    headline?: number;
    hook: number;
    body: number;
    cta: number;
    total: number;
  };
  warnings: ContentWarning[];
  mediaUrls?: string[];
}

export interface ContentWarning {
  section: ContentSection;
  type: 'over_limit' | 'missing_required' | 'low_quality';
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// EDITING & REGENERATION
// ============================================================================

export interface SectionEditRequest {
  campaignId: string;
  platform: SupportedPlatform;
  section: ContentSection;
  currentValue: string | string[];
  improvementDirection?: string; // Optional guidance for regeneration
}

export interface RegenerationOptions {
  tone?: 'professional' | 'casual' | 'humorous' | 'authoritative';
  length?: 'shorter' | 'longer' | 'same';
  focus?: string; // What to emphasize
  avoid?: string; // What to avoid
}

export interface RegenerationResult {
  section: ContentSection;
  alternatives: Array<{
    value: string | string[];
    characterCount: number;
    reasoning: string; // Why this alternative might work better
  }>;
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface ApprovalDecision {
  status: ApprovalStatus;
  approvedPlatforms?: SupportedPlatform[];
  feedback?: string;
  requestedChanges?: Array<{
    platform: SupportedPlatform;
    section: ContentSection;
    change: string;
  }>;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface CampaignApprovalRecord {
  campaignId: string;
  decision: ApprovalDecision;
  history: Array<{
    timestamp: Date;
    action: 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'regenerated';
    user?: string;
    details?: string;
  }>;
}

// ============================================================================
// PUBLISH INTEGRATION
// ============================================================================

export interface PublishRequest {
  campaignId: string;
  platforms: SupportedPlatform[];
  scheduleType: 'immediate' | 'scheduled';
  scheduledTimes?: Record<SupportedPlatform, Date>;
  publishTo: 'socialpilot' | 'buffer' | 'hootsuite' | 'draft'; // Which publishing tool
}

export interface PublishResult {
  success: boolean;
  publishedPlatforms: SupportedPlatform[];
  failedPlatforms: Array<{
    platform: SupportedPlatform;
    error: string;
  }>;
  publishedAt: Date;
}
