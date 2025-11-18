/**
 * Campaign V3 Types
 *
 * V3 Research-Validated Campaign System
 * - 5 campaign types (7-14 day durations)
 * - Goal-first selection
 * - 2-3 platform maximum enforcement
 * - Simplified, focused approach
 *
 * Because V1 and V2 were too ambitious and nobody needs 47 campaign options.
 */

// ============================================================================
// CAMPAIGN TYPES (The Big 5)
// ============================================================================

export type CampaignTypeV3 =
  | 'authority-builder'      // 7 days - Establish expertise
  | 'community-champion'     // 14 days - Local community leader
  | 'trust-builder'          // 10 days - Build credibility
  | 'revenue-rush'           // 5 days - Drive immediate sales
  | 'viral-spark';           // 7 days - Massive reach

// ============================================================================
// BUSINESS GOALS (What do you want to achieve?)
// ============================================================================

export type BusinessGoal =
  | 'build-authority'        // Become the expert
  | 'increase-local-traffic' // Get local customers
  | 'build-trust'            // Establish credibility
  | 'drive-sales'            // Make money now
  | 'increase-awareness';    // Get discovered

// ============================================================================
// PLATFORMS (2-3 maximum enforcement)
// ============================================================================

export type PlatformV3 =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube-shorts'
  | 'google-business';

export interface PlatformOption {
  id: PlatformV3;
  name: string;
  icon: string;
  description: string;
  bestFor: string[]; // Business types this platform excels for
  requirements?: string[]; // What you need to use this platform
  disabled?: boolean;
  disabledReason?: string;
}

// ============================================================================
// BUSINESS TYPES (For smart recommendations)
// ============================================================================

export type BusinessType =
  | 'local-service'          // Plumber, dentist, salon
  | 'restaurant'             // Food & beverage
  | 'retail'                 // Physical products
  | 'ecommerce'              // Online store
  | 'professional-service'   // Lawyer, accountant, consultant
  | 'b2b'                    // Business to business
  | 'creator'                // Influencer, YouTuber
  | 'other';

// ============================================================================
// CAMPAIGN DURATION (5-14 days only)
// ============================================================================

export type CampaignDuration = 5 | 7 | 10 | 14;

export interface DurationOption {
  days: CampaignDuration;
  label: string;
  description: string;
  postCount: number; // Estimated posts for this duration
  intensity: 'flash' | 'sprint' | 'campaign'; // Visual indicator
}

// ============================================================================
// CAMPAIGN TYPE DEFINITION (The meat and potatoes)
// ============================================================================

export interface CampaignTypeDefinition {
  id: CampaignTypeV3;
  name: string;
  tagline: string; // One-liner for the card
  description: string;
  goal: BusinessGoal;
  duration: CampaignDuration;

  // Story arc (what happens each phase)
  storyArc: {
    phase1: {
      days: string;
      focus: string;
      contentTypes: string[];
    };
    phase2: {
      days: string;
      focus: string;
      contentTypes: string[];
    };
    phase3?: {
      days: string;
      focus: string;
      contentTypes: string[];
    };
  };

  // Smart recommendations
  recommendedFor: BusinessType[];
  recommendedPlatforms: PlatformV3[];

  // Content mix
  contentMix: {
    video: number;      // % of posts that should be video
    image: number;      // % images
    text: number;       // % text-only
    carousel: number;   // % carousels
  };

  // Psychological framework
  psychologicalSequence: string[];

  // Success metrics
  successMetrics: string[];

  // Icon and colors for UI
  icon: string;
  color: string;
  gradient: string;
}

// ============================================================================
// PLATFORM SELECTION (2-3 max enforced)
// ============================================================================

export interface PlatformSelection {
  platforms: PlatformV3[];
  primary: PlatformV3; // Main platform for this campaign
  reasoning?: string; // Why these platforms were recommended
}

export interface PlatformRecommendation {
  businessType: BusinessType;
  campaignType: CampaignTypeV3;
  recommended: PlatformV3[];
  rationale: string;
  maxPlatforms: 2 | 3; // Hard limit
}

// ============================================================================
// CAMPAIGN CONFIGURATION (User's selections)
// ============================================================================

export interface CampaignV3Config {
  id: string;
  userId: string;

  // Core selections
  campaignType: CampaignTypeV3;
  goal: BusinessGoal;
  platforms: PlatformSelection;
  duration: CampaignDuration;

  // Business context
  businessType: BusinessType;
  businessName: string;
  industry: string;
  location?: string;

  // Content context (from UVP/intelligence)
  uvpData?: any;
  products?: any[];
  targetAudience?: string;

  // Scheduling
  startDate: Date;
  postingSchedule: {
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
    timesOfDay: string[];  // HH:MM format
    postsPerDay: number;
  };

  // Status
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// CAMPAIGN POST (Individual post in the campaign)
// ============================================================================

export interface CampaignPostV3 {
  id: string;
  campaignId: string;

  // Post details
  dayNumber: number; // Day 1, Day 2, etc.
  postNumber: number; // Post number within that day
  platform: PlatformV3;

  // Content
  content: {
    text: string;
    media?: {
      type: 'image' | 'video' | 'carousel';
      urls: string[];
    };
    callToAction?: {
      text: string;
      url?: string;
    };
    hashtags?: string[];
  };

  // Context
  phase: 'phase1' | 'phase2' | 'phase3';
  psychologicalIntent: string; // What this post is trying to achieve
  contentType: string; // Tutorial, testimonial, behind-the-scenes, etc.

  // Scheduling
  scheduledFor: Date;
  publishedAt?: Date;

  // Status
  status: 'draft' | 'scheduled' | 'published' | 'failed';

  // Performance (if published)
  performance?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
}

// ============================================================================
// CAMPAIGN CALENDAR (Day-by-day view)
// ============================================================================

export interface CampaignDay {
  dayNumber: number;
  date: Date;
  phase: 'phase1' | 'phase2' | 'phase3';
  focus: string; // What this day is about
  posts: CampaignPostV3[];
  postCount: number;
}

export interface CampaignCalendar {
  campaignId: string;
  totalDays: number;
  days: CampaignDay[];
  totalPosts: number;
  postsByPlatform: Record<PlatformV3, number>;
}

// ============================================================================
// CAMPAIGN GENERATION REQUEST
// ============================================================================

export interface CampaignGenerationRequest {
  config: CampaignV3Config;
  generateContent: boolean; // Actually generate post content or just structure?
  useAI: boolean; // Use AI for content or templates?
}

export interface CampaignGenerationResult {
  campaign: CampaignV3Config;
  calendar: CampaignCalendar;
  posts: CampaignPostV3[];
  estimatedReach: number;
  estimatedEngagement: number;
}

// ============================================================================
// VALIDATION & ERRORS
// ============================================================================

export interface CampaignValidationError {
  field: string;
  message: string;
  code: 'INVALID_PLATFORM_COUNT' | 'INVALID_DURATION' | 'MISSING_REQUIRED' | 'INVALID_BUSINESS_TYPE';
}

export interface CampaignValidationResult {
  valid: boolean;
  errors: CampaignValidationError[];
  warnings?: string[];
}

// ============================================================================
// UI STATE
// ============================================================================

export interface CampaignBuilderState {
  step: 'goal' | 'type' | 'platforms' | 'duration' | 'schedule' | 'review';

  // Selections
  selectedGoal?: BusinessGoal;
  selectedType?: CampaignTypeV3;
  selectedPlatforms: PlatformV3[];
  selectedDuration?: CampaignDuration;

  // Recommendations
  recommendedTypes: CampaignTypeV3[];
  recommendedPlatforms: PlatformV3[];

  // Validation
  validation: CampaignValidationResult;

  // Loading states
  isGenerating: boolean;
  isLoading: boolean;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface CampaignPerformance {
  campaignId: string;
  campaignType: CampaignTypeV3;

  // Overall metrics
  totalViews: number;
  totalEngagements: number;
  totalClicks: number;
  totalShares: number;

  // Performance by phase
  phasePerformance: {
    phase: 'phase1' | 'phase2' | 'phase3';
    views: number;
    engagements: number;
    conversionRate: number;
  }[];

  // Performance by platform
  platformPerformance: {
    platform: PlatformV3;
    views: number;
    engagements: number;
    bestPost: CampaignPostV3;
  }[];

  // Goal achievement
  goalAchieved: boolean;
  goalProgress: number; // 0-100%

  // Timestamps
  startDate: Date;
  endDate: Date;
  completedAt?: Date;
}

// ============================================================================
// TEMPLATES (For content generation)
// ============================================================================

export interface ContentTemplate {
  id: string;
  campaignType: CampaignTypeV3;
  phase: 'phase1' | 'phase2' | 'phase3';
  contentType: string;
  template: string;
  variables: string[];
  platform: PlatformV3[];
  mediaRequired: boolean;
}

// ============================================================================
// NOTE: All types are already exported above
// No need for duplicate export block
// ============================================================================
