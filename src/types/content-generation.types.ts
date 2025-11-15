/**
 * CONTENT GENERATION TYPES
 *
 * Types for the main content generation service that orchestrates:
 * - Brand data loading
 * - Template selection
 * - AI generation
 * - Synapse scoring
 * - Quality control
 */

import type { Template, Platform, ContentType } from './template.types';
import type { SynapseScore } from './synapse.types';

// ============================================================================
// GENERATION REQUESTS
// ============================================================================

export interface GenerationParams {
  brandId: string;
  month: string; // "2025-12" format
  industry: string;
  platformMix?: Platform[]; // Which platforms to generate for
  count?: number; // How many posts (default 30)
  distribution?: ContentTypeDistribution; // How to distribute types
}

export interface SingleGenerationParams {
  brandId: string;
  templateId?: string; // Optional specific template
  contentType?: ContentType;
  platform: Platform;
  customContext?: Record<string, any>;
}

export interface RegenerationParams {
  contentId: string;
  feedback: string; // What to improve
  preserveStructure?: boolean;
}

// ============================================================================
// CONTENT ITEM (Output)
// ============================================================================

export interface ContentItem {
  id: string;
  brandId: string;

  // Content
  text: string;
  headline?: string;
  body: string;
  cta?: string;
  hashtags?: string[];

  // Visual
  imageUrl?: string; // Generated visual from Bannerbear
  visualTemplateId?: string; // Which visual template was used

  // Metadata
  templateId: string;
  contentType: ContentType;
  platform: Platform;
  scheduledDate?: Date;

  // Quality scores (internal)
  synapseScore: SynapseScore;
  overallScore: number; // Simplified 0-100 for users

  // User-facing quality indicator
  qualityRating: 1 | 2 | 3 | 4 | 5; // Star rating
  qualityLabel: 'Poor' | 'Fair' | 'Good' | 'Great' | 'Excellent';

  // Generation metadata
  generatedAt: Date;
  generatedBy: 'ai' | 'template' | 'manual';
  aiModel?: string;

  // Status
  status: 'draft' | 'ready' | 'scheduled' | 'published';

  // Analytics (populated later)
  performance?: ContentPerformance;
}

export interface ContentPerformance {
  impressions: number;
  engagements: number;
  clicks: number;
  conversions: number;
  engagementRate: number;
  ctr: number;
}

// ============================================================================
// CONTENT TYPE DISTRIBUTION
// ============================================================================

export interface ContentTypeDistribution {
  promotional: number; // Percentage
  educational: number;
  community: number;
  authority: number;
  announcement: number;
  engagement: number;
}

// Default balanced distribution
export const DEFAULT_DISTRIBUTION: ContentTypeDistribution = {
  promotional: 30,
  educational: 25,
  community: 20,
  authority: 15,
  announcement: 5,
  engagement: 5,
};

// Industry-specific distributions
export const INDUSTRY_DISTRIBUTIONS: Record<string, ContentTypeDistribution> = {
  restaurant: {
    promotional: 35, // More promos (daily specials)
    educational: 15,
    community: 25, // High community engagement
    authority: 10,
    announcement: 10,
    engagement: 5,
  },
  cpa: {
    promotional: 20, // Less pushy
    educational: 40, // High education focus
    community: 10,
    authority: 20, // Build authority
    announcement: 5,
    engagement: 5,
  },
  realtor: {
    promotional: 40, // Listings
    educational: 20,
    community: 15,
    authority: 15,
    announcement: 5,
    engagement: 5,
  },
  dentist: {
    promotional: 25,
    educational: 35, // Oral health tips
    community: 15,
    authority: 15,
    announcement: 5,
    engagement: 5,
  },
  consultant: {
    promotional: 20,
    educational: 30,
    community: 10,
    authority: 30, // Very high authority focus
    announcement: 5,
    engagement: 5,
  },
};

// ============================================================================
// BRAND DATA (From MARBA)
// ============================================================================

export interface BrandData {
  id: string;
  name: string;
  industry: string;

  // Basic info
  businessType: string;
  location?: string;
  website?: string;

  // Value proposition
  uvp?: string;
  benefits?: string[];
  features?: string[];

  // UVP Wizard Data (enhanced)
  uvpDetails?: {
    target_customer?: string;
    customer_problem?: string;
    unique_solution?: string;
    key_benefit?: string;
    differentiation?: string;
  };

  // Buyer Journey Data (enhanced)
  buyerJourney?: {
    ideal_customer_profile?: {
      segment_name?: string;
      demographics?: {
        age_range?: string;
        income_range?: string;
        location_type?: string;
        occupation?: string;
      };
      psychographics?: {
        values?: string[];
        personality_traits?: string[];
        lifestyle?: string[];
      };
      pain_points?: string[];
      goals?: string[];
      buying_triggers?: string[];
    };
    journey_stage?: 'awareness' | 'consideration' | 'decision' | 'purchase' | 'advocacy';
  };

  // Audience
  targetAudience?: string;
  audienceCharacteristics?: string[];

  // Content context
  brandVoice?: string;
  contentThemes?: string[];
  powerWords?: string[];

  // Current promotions
  currentOffers?: string[];
  upcomingEvents?: string[];

  // Custom data
  customData?: Record<string, any>;
}

// ============================================================================
// GENERATION RESULT
// ============================================================================

export interface GenerationResult {
  success: boolean;
  content: ContentItem[];
  errors?: GenerationError[];

  // Stats
  totalGenerated: number;
  avgScore: number;
  timeElapsed: number; // ms

  // Quality breakdown
  qualityBreakdown: {
    excellent: number; // 85+
    great: number; // 70-84
    good: number; // 50-69
    poor: number; // <50
  };
}

export interface GenerationError {
  templateId?: string;
  step: string;
  error: string;
  retryable: boolean;
}

// ============================================================================
// AI GENERATION OPTIONS
// ============================================================================

export interface AIGenerationOptions {
  model: 'claude-3.5-sonnet' | 'gpt-4' | 'claude-3-haiku';
  temperature: number; // 0-1
  maxTokens: number;
  minScore: number; // Minimum Synapse score to accept
  maxRetries: number; // How many times to retry if score is too low
  enhanceWithAI: boolean; // Use AI to enhance template output
}

// Defaults
export const DEFAULT_AI_OPTIONS: AIGenerationOptions = {
  model: 'claude-3.5-sonnet',
  temperature: 0.7,
  maxTokens: 500,
  minScore: 75, // Accept scores 75+
  maxRetries: 2,
  enhanceWithAI: true,
};

// ============================================================================
// GENERATION PROGRESS (For UI)
// ============================================================================

export interface GenerationProgress {
  stage: GenerationStage;
  current: number;
  total: number;
  message: string;
  percentage: number;
}

export type GenerationStage =
  | 'loading_brand_data'
  | 'selecting_templates'
  | 'generating_content'
  | 'scoring_content'
  | 'optimizing_content'
  | 'finalizing'
  | 'complete';

// ============================================================================
// CALENDAR GENERATION (Monthly)
// ============================================================================

export interface CalendarGenerationOptions {
  startDate: Date;
  endDate: Date;
  postsPerWeek: number;
  preferredDays?: string[]; // ['monday', 'wednesday', 'friday']
  preferredTimes?: number[]; // [9, 12, 17] (hours)
  avoidWeekends?: boolean;
  distributeEvenly?: boolean;
}
