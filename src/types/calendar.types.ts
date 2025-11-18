/**
 * Campaign Calendar V3 Types
 *
 * Because managing multi-platform social media campaigns across 14 days
 * wasn't complicated enough without TypeScript definitions
 *
 * @author Roy (who's seen enough calendar bugs to last a lifetime)
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type CalendarDuration = 5 | 7 | 10 | 14;

export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'gmb';

export type ContentType = 'video' | 'image' | 'carousel' | 'story' | 'reel' | 'short' | 'text' | 'gmb';

export type PostStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'scheduled' | 'published' | 'failed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

// ============================================================================
// CAMPAIGN CALENDAR
// ============================================================================

export interface CampaignCalendar {
  id: string;
  campaignId: string;
  campaignType: string;
  duration: CalendarDuration;
  startDate: Date;
  endDate: Date;
  platforms: SocialPlatform[];
  posts: CalendarPost[];
  metadata: CalendarMetadata;
  statistics: CalendarStatistics;
  status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarMetadata {
  businessId: string;
  businessName: string;
  industry: string;
  targetAudience?: string[];
  goals?: string[];
  tone?: string[];
  generatedBy: 'smart-pick' | 'content-mixer' | 'manual';
  generationModel: string;
  tokensUsed: number;
}

export interface CalendarStatistics {
  totalPosts: number;
  postsByPlatform: Record<SocialPlatform, number>;
  postsByType: Record<ContentType, number>;
  postsByDay: Record<number, number>; // day index -> post count
  approvalRate: number; // percentage
  scheduledCount: number;
  publishedCount: number;
}

// ============================================================================
// CALENDAR POST
// ============================================================================

export interface CalendarPost {
  id: string;
  calendarId: string;
  dayIndex: number; // 0-based (day 0 = first day)
  scheduledDate: Date;
  scheduledTime: string; // HH:MM format
  platforms: SocialPlatform[];
  contentType: ContentType;
  content: PostContent;
  orchestration: OrchestrationConfig;
  approval: ApprovalInfo;
  scheduling: SchedulingInfo;
  metadata: PostMetadata;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostContent {
  headline?: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  mentions?: string[];
  mediaUrls?: string[];
  linkUrl?: string;
  platformVariants?: Record<SocialPlatform, PlatformContent>;
}

export interface PlatformContent {
  platform: SocialPlatform;
  text: string; // Adapted for platform character limits
  hashtags: string[];
  mediaUrls?: string[];
  additionalFields?: Record<string, any>; // Platform-specific fields
}

// ============================================================================
// PLATFORM ORCHESTRATION
// ============================================================================

export interface OrchestrationConfig {
  isPrimary: boolean; // Is this the lead platform for this post?
  crossPlatformStrategy: 'identical' | 'adapted' | 'unique';
  timingStrategy: 'simultaneous' | 'staggered' | 'sequential';
  staggerDelayMinutes?: number; // If staggered
  sequenceOrder?: number; // If sequential
  contentAdaptations: ContentAdaptation[];
}

export interface ContentAdaptation {
  platform: SocialPlatform;
  adaptationType: 'shorten' | 'expand' | 'reformat' | 'tone_shift' | 'hashtag_adjust';
  changes: string[];
  reasoning: string;
}

export interface PlatformOrchestrationRule {
  platforms: SocialPlatform[];
  maxPostsPerDay: Record<SocialPlatform, number>;
  minGapBetweenPosts: Record<SocialPlatform, number>; // minutes
  optimalTimes: Record<SocialPlatform, string[]>; // HH:MM
  contentTypePreferences: Record<SocialPlatform, ContentType[]>;
  specialRules: PlatformSpecialRule[];
}

export interface PlatformSpecialRule {
  platform: SocialPlatform;
  rule: string;
  enforcement: 'strict' | 'recommended';
  description: string;
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export interface ApprovalInfo {
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  revisionRequested?: string;
  revisionHistory: ApprovalRevision[];
}

export interface ApprovalRevision {
  version: number;
  timestamp: Date;
  changedBy: string;
  changeType: 'content' | 'timing' | 'platform' | 'status';
  changes: string;
  previousValue?: any;
  newValue?: any;
}

export interface BulkApprovalRequest {
  calendarId: string;
  postIds: string[];
  action: 'approve' | 'reject';
  reason?: string;
  approvedBy: string;
}

// ============================================================================
// SCHEDULING
// ============================================================================

export interface SchedulingInfo {
  isScheduled: boolean;
  scheduledToPlatforms: Record<SocialPlatform, PlatformSchedulingStatus>;
  socialPilotPostId?: string;
  schedulingAttempts: SchedulingAttempt[];
  lastSchedulingError?: string;
}

export interface PlatformSchedulingStatus {
  platform: SocialPlatform;
  isScheduled: boolean;
  scheduledAt?: Date;
  externalId?: string; // SocialPilot or platform-specific ID
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  error?: string;
}

export interface SchedulingAttempt {
  attemptNumber: number;
  timestamp: Date;
  platforms: SocialPlatform[];
  success: boolean;
  error?: string;
  retryable: boolean;
}

export interface SocialPilotScheduleRequest {
  postId: string;
  platforms: SocialPlatform[];
  content: PostContent;
  scheduledDateTime: Date;
  timezone: string;
  mediaUrls?: string[];
}

// ============================================================================
// CALENDAR GENERATION
// ============================================================================

export interface CalendarGenerationRequest {
  campaignId: string;
  campaignType: string;
  duration: CalendarDuration;
  platforms: SocialPlatform[];
  startDate: Date;
  businessContext: BusinessContext;
  contentStrategy: ContentStrategy;
  preferences?: CalendarPreferences;
}

export interface BusinessContext {
  businessId: string;
  businessName: string;
  industry: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  isLocal: boolean;
  hasGMB: boolean;
  targetAudience?: string[];
  brandVoice?: string[];
}

export interface ContentStrategy {
  goals: string[];
  contentPillars: string[];
  hookTypes: string[]; // question, shock, curiosity, emotion, value
  contentMix: ContentMixConfig;
  avoidTopics?: string[];
}

export interface ContentMixConfig {
  video: number; // percentage
  image: number;
  carousel: number;
  story: number;
  text: number;
  gmb?: number; // Only for local businesses
}

export interface CalendarPreferences {
  postFrequency?: 'conservative' | 'moderate' | 'aggressive';
  timePreferences?: TimePreference[];
  avoidDays?: number[]; // 0 = Sunday, 6 = Saturday
  priorityPlatforms?: SocialPlatform[];
  hookRotationEnabled?: boolean; // Prevent hook fatigue
  includeWeekends?: boolean;
}

export interface TimePreference {
  platform: SocialPlatform;
  preferredTimes: string[]; // HH:MM
  timezone: string;
}

// ============================================================================
// POST METADATA
// ============================================================================

export interface PostMetadata {
  generatedFrom: 'insight' | 'template' | 'manual';
  insightIds?: string[];
  templateId?: string;
  aiModel: string;
  tokensUsed: number;
  generationTime: number; // milliseconds
  confidence: number; // 0-1
  qualityScore?: number; // 0-100
  engagementPrediction?: EngagementPrediction;
}

export interface EngagementPrediction {
  platform: SocialPlatform;
  predictedLikes: number;
  predictedComments: number;
  predictedShares: number;
  predictedReach: number;
  confidence: number; // 0-1
  factors: string[];
}

// ============================================================================
// CALENDAR VIEW
// ============================================================================

export interface CalendarViewConfig {
  viewType: 'day' | 'week' | 'list';
  startDate: Date;
  endDate: Date;
  filterPlatforms?: SocialPlatform[];
  filterStatus?: PostStatus[];
  filterContentType?: ContentType[];
  sortBy?: 'date' | 'platform' | 'status' | 'approval';
  sortOrder?: 'asc' | 'desc';
}

export interface CalendarDayView {
  date: Date;
  dayIndex: number;
  posts: CalendarPost[];
  postCount: number;
  platformDistribution: Record<SocialPlatform, number>;
  allApproved: boolean;
  hasRejected: boolean;
}

export interface CalendarWeekView {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: CalendarDayView[];
  totalPosts: number;
  approvalProgress: number; // percentage
}

// ============================================================================
// EDIT OPERATIONS
// ============================================================================

export interface PostEditRequest {
  postId: string;
  field: 'content' | 'timing' | 'platforms' | 'contentType';
  newValue: any;
  editedBy: string;
  reason?: string;
}

export interface ContentEditRequest {
  postId: string;
  updates: Partial<PostContent>;
  editedBy: string;
}

export interface TimingEditRequest {
  postId: string;
  newDate: Date;
  newTime: string;
  editedBy: string;
}

export interface PlatformEditRequest {
  postId: string;
  action: 'add' | 'remove';
  platform: SocialPlatform;
  editedBy: string;
}

// ============================================================================
// HOOK ROTATION (Prevent Fatigue)
// ============================================================================

export interface HookRotationConfig {
  enabled: boolean;
  maxConsecutiveSameType: number; // Default: 2
  hookTypes: HookType[];
  rotationStrategy: 'sequential' | 'random' | 'performance_based';
}

export interface HookType {
  type: 'question' | 'shock' | 'curiosity' | 'emotion' | 'value' | 'story' | 'challenge';
  examples: string[];
  effectivenessScore: number; // 0-100, based on past performance
  usageCount: number;
  lastUsedDay: number;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface CalendarValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  postId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  fix?: string;
}

export interface ValidationWarning {
  postId?: string;
  type: 'frequency' | 'timing' | 'content' | 'platform';
  message: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CALENDAR_CONSTANTS = {
  MIN_DURATION: 5,
  MAX_DURATION: 14,
  MIN_POSTS_PER_DAY: 1,
  MAX_POSTS_PER_DAY: 5,
  MIN_GAP_BETWEEN_POSTS: 120, // minutes
  MAX_PLATFORMS_PER_POST: 3,
  MIN_PLATFORMS_PER_CALENDAR: 2,
  MAX_PLATFORMS_PER_CALENDAR: 3,
};

export const PLATFORM_LIMITS: Record<SocialPlatform, PlatformLimits> = {
  facebook: {
    maxPostsPerDay: 5,
    minGapMinutes: 120,
    characterLimit: 63206,
    hashtagLimit: 30,
    optimalTimes: ['09:00', '13:00', '15:00', '19:00'],
  },
  instagram: {
    maxPostsPerDay: 3,
    minGapMinutes: 180,
    characterLimit: 2200,
    hashtagLimit: 30,
    optimalTimes: ['08:00', '12:00', '17:00', '20:00'],
  },
  twitter: {
    maxPostsPerDay: 10,
    minGapMinutes: 60,
    characterLimit: 280,
    hashtagLimit: 2,
    optimalTimes: ['08:00', '12:00', '15:00', '17:00', '21:00'],
  },
  linkedin: {
    maxPostsPerDay: 2,
    minGapMinutes: 240,
    characterLimit: 3000,
    hashtagLimit: 5,
    optimalTimes: ['07:30', '12:00', '17:00'],
  },
  tiktok: {
    maxPostsPerDay: 4,
    minGapMinutes: 180,
    characterLimit: 2200,
    hashtagLimit: 5,
    optimalTimes: ['06:00', '10:00', '15:00', '19:00', '22:00'],
  },
  youtube: {
    maxPostsPerDay: 1,
    minGapMinutes: 1440, // 24 hours
    characterLimit: 5000,
    hashtagLimit: 15,
    optimalTimes: ['14:00', '18:00'],
  },
  gmb: {
    maxPostsPerDay: 2,
    minGapMinutes: 360,
    characterLimit: 1500,
    hashtagLimit: 0, // GMB doesn't use hashtags
    optimalTimes: ['10:00', '18:00'],
  },
};

export interface PlatformLimits {
  maxPostsPerDay: number;
  minGapMinutes: number;
  characterLimit: number;
  hashtagLimit: number;
  optimalTimes: string[];
}

// ============================================================================
// NOTE: All types are already exported with 'export interface' above
// No need for duplicate export type block
// ============================================================================
