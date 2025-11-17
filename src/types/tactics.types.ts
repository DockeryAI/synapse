/**
 * Immediate Win Tactics - Type Definitions
 * Copy-paste tactics SMBs can start Monday morning
 */

// ============================================================================
// UGC Contest Types
// ============================================================================

export type UGCContestType = 'photo' | 'video' | 'review' | 'testimonial' | 'story';

export interface UGCContest {
  id: string;
  businessId: string;
  type: UGCContestType;
  title: string;
  description: string;
  rules: string[];
  hashtag: string;
  additionalHashtags: string[];
  prize: Prize;
  startDate: Date;
  endDate: Date;
  platforms: SocialPlatform[];
  templates: ContestTemplates;
  tracking: ContestTracking;
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  createdAt: Date;
}

export interface Prize {
  type: 'discount' | 'product' | 'service' | 'giveaway' | 'gift_card';
  description: string;
  value: number;
  currency: string;
  winnerCount: number;
}

export interface ContestTemplates {
  announcement: string;
  reminder: string;
  winner: string;
  thankYou: string;
}

export interface ContestTracking {
  entries: number;
  uniqueParticipants: number;
  totalEngagement: number;
  reach: number;
  hashtagUses: number;
  lastUpdated: Date;
}

// ============================================================================
// Hashtag Strategy Types
// ============================================================================

export interface HashtagFormula {
  branded: string[];           // 3 branded hashtags
  niche: string[];             // 10 niche hashtags (10K-50K posts)
  trending: string[];          // 5 trending hashtags
  total: number;               // Should be 18
  generatedAt: Date;
  expiresAt: Date;             // Trending hashtags expire after 24h
}

export interface HashtagSet {
  id: string;
  businessId: string;
  industry: string;
  specialty: string;
  location?: string;
  formula: HashtagFormula;
  performance: HashtagPerformance;
  rotationStrategy: RotationStrategy;
  createdAt: Date;
  updatedAt: Date;
}

export interface HashtagPerformance {
  hashtag: string;
  uses: number;
  reach: number;
  engagement: number;
  growthRate: number;
  lastUsed: Date;
}

export interface RotationStrategy {
  keepBranded: boolean;
  rotateNiche: boolean;
  refreshTrending: 'daily' | 'weekly' | 'never';
  lastRotation: Date;
}

export interface HashtagResearch {
  hashtag: string;
  postCount: number;
  difficulty: 'low' | 'medium' | 'high';
  trend: 'rising' | 'stable' | 'declining';
  relevanceScore: number;
}

// ============================================================================
// Email Capture Types
// ============================================================================

export type EmailCaptureTemplate = 'discount' | 'guide' | 'checklist' | 'webinar' | 'consultation';

export interface EmailCapturePage {
  id: string;
  businessId: string;
  template: EmailCaptureTemplate;
  title: string;
  description: string;
  leadMagnet: LeadMagnet;
  form: CaptureForm;
  thankYouPage: ThankYouPage;
  integrations: EmailIntegration[];
  slug: string;
  published: boolean;
  createdAt: Date;
  stats: CaptureStats;
}

export interface LeadMagnet {
  type: 'discount' | 'pdf' | 'checklist' | 'video' | 'template' | 'consultation';
  title: string;
  description: string;
  value: string;           // e.g., "20% off" or "$50 value"
  deliveryMethod: 'email' | 'download' | 'redirect';
  asset?: {
    url: string;
    filename: string;
    filesize: number;
  };
}

export interface CaptureForm {
  fields: FormField[];
  submitButtonText: string;
  consentText: string;
  gdprCompliant: boolean;
}

export interface FormField {
  name: string;
  type: 'email' | 'text' | 'phone' | 'select' | 'checkbox';
  label: string;
  placeholder: string;
  required: boolean;
  validation?: string;
  options?: string[];      // For select fields
}

export interface ThankYouPage {
  title: string;
  message: string;
  redirectUrl?: string;
  redirectDelay?: number;  // seconds
  socialLinks?: SocialLink[];
}

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label: string;
}

export interface EmailIntegration {
  provider: 'mailchimp' | 'convertkit' | 'substack' | 'custom';
  enabled: boolean;
  apiKey?: string;
  listId?: string;
  tags?: string[];
}

export interface CaptureStats {
  views: number;
  submissions: number;
  conversionRate: number;
  lastSubmission?: Date;
}

// ============================================================================
// Seasonal Calendar Types
// ============================================================================

export interface SeasonalCalendar {
  holidays: Holiday[];
  seasons: Season[];
  localEvents: LocalEvent[];
  opportunities: SeasonalOpportunity[];
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  type: 'major' | 'minor' | 'industry_specific' | 'cultural';
  industry?: string;
  promotionStartDate: Date;      // 2-3 weeks before
  campaignSuggestions: string[];
  revenue_impact: 'high' | 'medium' | 'low';
  q4_emphasis: boolean;          // Q4 = 40% of SMB revenue
}

export interface Season {
  name: 'spring' | 'summer' | 'fall' | 'winter';
  startDate: Date;
  endDate: Date;
  themes: string[];
  opportunities: string[];
}

export interface LocalEvent {
  id: string;
  name: string;
  date: Date;
  location: string;
  type: 'festival' | 'community' | 'sports' | 'cultural' | 'charity';
  source: 'perplexity' | 'manual' | 'google';
  relevance: number;
  campaignIdeas: string[];
}

export interface SeasonalOpportunity {
  id: string;
  title: string;
  type: 'holiday' | 'season' | 'local_event';
  date: Date;
  alertDate: Date;               // When to notify user
  suggestedCampaigns: CampaignSuggestion[];
  status: 'upcoming' | 'active' | 'past' | 'dismissed';
}

export interface CampaignSuggestion {
  title: string;
  description: string;
  duration: number;              // days
  postCount: number;
  platforms: SocialPlatform[];
  expectedImpact: string;
}

// ============================================================================
// Tactics Dashboard Types
// ============================================================================

export interface Tactic {
  id: string;
  name: string;
  description: string;
  category: TacticCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: string;       // e.g., "15 minutes"
  cost: number;                  // $0 for free tactics
  expectedResults: ExpectedResults;
  status: 'available' | 'active' | 'completed';
  actionUrl?: string;
  icon: string;
  tags: string[];
}

export type TacticCategory = 'content' | 'engagement' | 'conversion' | 'seo' | 'email' | 'social';

export interface ExpectedResults {
  metric: string;                // e.g., "engagement boost"
  value: string;                 // e.g., "30%"
  timeframe: string;             // e.g., "within 2 weeks"
  confidence: 'low' | 'medium' | 'high';
}

export interface TacticActivation {
  tacticId: string;
  businessId: string;
  activatedAt: Date;
  completedAt?: Date;
  results?: ActualResults;
  notes?: string;
}

export interface ActualResults {
  metric: string;
  before: number;
  after: number;
  improvement: number;
  measuredAt: Date;
}

// ============================================================================
// Common Types
// ============================================================================

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'google_business';

export interface BusinessContext {
  id: string;
  name: string;
  industry: string;
  specialty?: string;
  location?: string;
  targetAudience?: string;
  platforms: SocialPlatform[];
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerationOptions {
  businessContext: BusinessContext;
  customization?: Record<string, unknown>;
  quickStart?: boolean;          // Skip advanced options
}
