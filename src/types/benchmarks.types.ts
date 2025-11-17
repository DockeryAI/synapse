/**
 * Performance Benchmarks - Type Definitions
 * Industry benchmarks, Day 3 pivot logic, and auto-scheduling optimization
 */

// ============================================================================
// Platform Types
// ============================================================================

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'google_business';

export type ContentType = 'static' | 'video' | 'carousel' | 'story' | 'reel' | 'short';

// ============================================================================
// Industry Benchmark Types
// ============================================================================

export interface IndustryBenchmark {
  industry: string;
  platforms: PlatformBenchmark[];
  contentTypes: ContentTypeBenchmark[];
  conversions: ConversionBenchmark[];
  adCosts: AdCostBenchmark[];
  optimalTimes: OptimalPostingTimes[];
}

export interface PlatformBenchmark {
  platform: SocialPlatform;
  engagementRate: BenchmarkRange; // Percentage
  postFrequency: {
    min: number;
    max: number;
    optimal: number;
    unit: 'per_day' | 'per_week';
  };
  reachRate: BenchmarkRange; // Percentage of followers
  videoBoost: number; // Multiplier (e.g., 10 = 10x engagement)
  ugcBoost: number; // Percentage boost (e.g., 30 = 30% increase)
}

export interface ContentTypeBenchmark {
  type: ContentType;
  engagementMultiplier: number; // Relative to static
  platform: SocialPlatform;
  averageViews: BenchmarkRange;
  completionRate?: BenchmarkRange; // For video
}

export interface ConversionBenchmark {
  funnel: string; // e.g., "Social → Email", "Email → Sale"
  rate: BenchmarkRange;
  avgTimeToConvert: number; // Days
  topChannels: SocialPlatform[];
}

export interface AdCostBenchmark {
  platform: SocialPlatform;
  adType: 'stories' | 'feed' | 'reel' | 'video' | 'display';
  cpm: BenchmarkRange; // Cost per 1000 impressions
  cpc: BenchmarkRange; // Cost per click
  ctr: BenchmarkRange; // Click-through rate
  minBudget: number; // Minimum daily budget
}

export interface BenchmarkRange {
  min: number;
  max: number;
  average: number;
  unit?: string;
}

export interface OptimalPostingTimes {
  platform: SocialPlatform;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  timeRanges: TimeRange[];
  timezone: string;
}

export interface TimeRange {
  start: string; // HH:MM format (24hr)
  end: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Performance Tracking Types
// ============================================================================

export interface PerformanceMetrics {
  campaignId?: string;
  postId?: string;
  platform: SocialPlatform;
  contentType: ContentType;
  publishedAt: Date;
  metrics: {
    views: number;
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks?: number;
    engagementRate: number; // Calculated
    viralityScore?: number; // Shares / Reach
  };
  costs?: {
    spent: number;
    cpm: number;
    cpc?: number;
  };
  updatedAt: Date;
}

export interface BenchmarkComparison {
  actual: number;
  benchmark: BenchmarkRange;
  percentile: number; // 0-100
  status: 'below' | 'on_track' | 'exceeding';
  gap: number; // Difference from benchmark average
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  overall: {
    engagementRate: BenchmarkComparison;
    reachRate: BenchmarkComparison;
    conversionRate?: BenchmarkComparison;
    costEfficiency?: BenchmarkComparison;
  };
  byPlatform: Record<SocialPlatform, BenchmarkComparison>;
  byContentType: Record<ContentType, BenchmarkComparison>;
  insights: string[];
  recommendations: string[];
}

// ============================================================================
// Day 3 Pivot Logic Types
// ============================================================================

export interface PivotTrigger {
  id: string;
  campaignId: string;
  postId: string;
  triggeredAt: Date;
  reason: PivotReason;
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentMetrics: PerformanceMetrics;
  benchmark: BenchmarkRange;
  gap: number; // How far below benchmark
}

export type PivotReason =
  | 'low_engagement'
  | 'low_reach'
  | 'low_conversion'
  | 'high_cost'
  | 'wrong_timing'
  | 'content_format'
  | 'audience_mismatch';

export interface PivotRecommendation {
  triggerId: string;
  priority: 'immediate' | 'suggested' | 'consider';
  action: PivotAction;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  autoPivotAvailable: boolean;
}

export type PivotAction =
  | 'switch_to_video'
  | 'change_hook'
  | 'adjust_timing'
  | 'add_ugc_contest'
  | 'boost_with_ads'
  | 'change_platform'
  | 'shorten_content'
  | 'add_call_to_action'
  | 'use_trending_audio'
  | 'increase_frequency';

export interface PivotStrategy {
  originalContent: {
    platform: SocialPlatform;
    contentType: ContentType;
    hook: string;
    cta: string;
    postingTime: string;
  };
  pivotedContent: {
    platform?: SocialPlatform; // If platform changed
    contentType: ContentType;
    newHook?: string;
    newCta?: string;
    postingTime?: string;
    additionalElements?: string[]; // e.g., ["trending_audio", "captions"]
  };
  reasoning: string;
  expectedImprovement: number; // Percentage
}

export interface AutoPivotConfig {
  enabled: boolean;
  thresholds: {
    engagementRate: number; // Trigger if below this % (e.g., 2%)
    daysToEvaluate: number; // Check after X days (default: 3)
    minimumImpressions: number; // Don't pivot if sample too small
  };
  allowedActions: PivotAction[];
  autoExecute: boolean; // If true, auto-apply pivots; if false, suggest only
  maxPivotsPerCampaign: number;
}

// ============================================================================
// Scheduling Optimization Types
// ============================================================================

export interface SchedulingRecommendation {
  platform: SocialPlatform;
  optimalSlots: TimeSlot[];
  avoidSlots: TimeSlot[];
  frequency: {
    current: number;
    recommended: number;
    maxDaily: number;
  };
  reasoning: string[];
}

export interface TimeSlot {
  dayOfWeek: number;
  time: string; // HH:MM
  expectedReach: number; // Percentage of audience active
  confidence: 'high' | 'medium' | 'low';
  source: 'benchmark' | 'historical' | 'audience_data';
}

export interface AudienceActivityPattern {
  platform: SocialPlatform;
  hourlyActivity: number[]; // 24 values, 0-23 = hours
  dailyActivity: number[]; // 7 values, 0-6 = days (Sun-Sat)
  peakHours: number[]; // Top 3-5 hours
  peakDays: number[]; // Top 2-3 days
  timezone: string;
}

export interface PostSchedule {
  id: string;
  campaignId?: string;
  platform: SocialPlatform;
  contentType: ContentType;
  scheduledTime: Date;
  optimizationScore: number; // 0-100
  factors: {
    audienceActivity: number; // 0-100
    competitionLevel: number; // 0-100 (lower is better)
    historicalPerformance: number; // 0-100
    benchmarkAlignment: number; // 0-100
  };
  status: 'scheduled' | 'published' | 'cancelled' | 'failed';
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface BenchmarkDashboardData {
  businessId: string;
  industry: string;
  period: {
    start: Date;
    end: Date;
  };
  performance: PerformanceReport;
  benchmarks: IndustryBenchmark;
  activePivots: PivotTrigger[];
  recommendations: PivotRecommendation[];
  schedulingInsights: SchedulingRecommendation[];
}

export interface VisualIndicator {
  label: string;
  value: number;
  benchmark: BenchmarkRange;
  status: 'below' | 'on_track' | 'exceeding';
  change?: number; // Percentage change from last period
  trend?: 'up' | 'down' | 'stable';
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

export interface BusinessContext {
  id: string;
  industry: string;
  platforms: SocialPlatform[];
  timezone?: string;
  targetAudience?: string;
}
