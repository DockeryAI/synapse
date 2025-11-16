/**
 * Campaign Visual Types
 *
 * Types specific to visual generation for campaigns
 */

import type { CampaignTypeId } from './campaign.types';

// ============================================================================
// CAMPAIGN TEMPLATE MAPPING
// ============================================================================

/**
 * Template configuration for a specific campaign type
 */
export interface CampaignTemplateConfig {
  /** Campaign type this template is for */
  campaignType: CampaignTypeId;

  /** Bannerbear template ID (will be set after creating in dashboard) */
  templateId: string;

  /** Template name */
  name: string;

  /** Description of the visual style */
  description: string;

  /** Field mappings from campaign content to template variables */
  fieldMappings: {
    headline: string; // Template variable name for headline
    subheadline?: string;
    bodyText?: string;
    stat?: string; // For Authority Builder
    testimonial?: string; // For Social Proof
    customerName?: string; // For Social Proof
    location?: string; // For Local Pulse
    date?: string; // For Local Pulse
    logoUrl?: string;
    brandColor?: string;
  };

  /** Default values for optional fields */
  defaults?: Record<string, string>;

  /** Visual characteristics */
  style: {
    colorScheme: 'professional' | 'vibrant' | 'warm' | 'cool';
    layout: 'centered' | 'split' | 'overlay';
    typography: 'bold' | 'elegant' | 'modern';
  };
}

// ============================================================================
// VISUAL GENERATION
// ============================================================================

/**
 * Request to generate a visual for a campaign
 */
export interface GenerateCampaignVisualRequest {
  /** Campaign type */
  campaignType: CampaignTypeId;

  /** Platform to generate for */
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok';

  /** Format (feed, story, etc.) */
  format?: string;

  /** Campaign content */
  content: {
    headline: string;
    subheadline?: string;
    bodyText?: string;
    stats?: string[];
    testimonial?: string;
    customerName?: string;
    location?: string;
    brandName: string;
  };

  /** Brand customization */
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  /** Optional template override */
  templateId?: string;
}

/**
 * Generated visual result
 */
export interface GeneratedVisual {
  /** Unique ID */
  id: string;

  /** Campaign type */
  campaignType: CampaignTypeId;

  /** Platform */
  platform: string;

  /** Format */
  format: string;

  /** Image URL (PNG) */
  imageUrl: string;

  /** Bannerbear image UID */
  bannerbearUid: string;

  /** Template used */
  templateId: string;

  /** Generation metadata */
  metadata: {
    generatedAt: Date;
    generationTime: number; // ms
    dimensions: { width: number; height: number };
    aspectRatio: string;
  };

  /** Status */
  status: 'pending' | 'completed' | 'failed';

  /** Error if failed */
  error?: string;
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

/**
 * Request to generate visuals for all platforms
 */
export interface GenerateAllPlatformsRequest {
  campaignType: CampaignTypeId;
  content: GenerateCampaignVisualRequest['content'];
  branding?: GenerateCampaignVisualRequest['branding'];
  platforms?: string[]; // Defaults to all
}

/**
 * Batch generation result
 */
export interface BatchVisualResult {
  total: number;
  completed: number;
  failed: number;
  visuals: GeneratedVisual[];
  errors: Array<{ platform: string; error: string }>;
}
