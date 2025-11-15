/**
 * Analytics & Reflect Phase Type Definitions
 *
 * Comprehensive types for the Analytics & Reflect phase (Phase 13) of the MIRROR framework.
 * Covers goal tracking, KPIs, content analytics, audience insights, engagement, learning patterns,
 * and competitive monitoring.
 */

// ==================== Goal Progress Types ====================

export type OnTrackStatus = 'ahead' | 'on-track' | 'slightly-behind' | 'behind'

export interface GoalProgress {
  objectiveId: string
  objectiveName: string
  currentValue: number
  targetValue: number
  progressPercentage: number
  onTrackStatus: OnTrackStatus
  timeRemaining: number // days
  projectedCompletionDate: string
  velocity: number // units per day
  industryBenchmark?: number
  startDate: string
  targetDate: string
  lastUpdated: string
}

export interface Projection {
  projectedValue: number
  projectedDate: string
  confidence: number // 0-1
  methodology: string
  assumptions: string[]
}

// ==================== KPI Types ====================

export type ChangeDirection = 'up' | 'down' | 'neutral'

export interface KPIMetric {
  id: string
  name: string
  value: number
  unit: string
  change: number // percentage change
  changeDirection: ChangeDirection
  comparisonPeriod: string
  industryBenchmark?: number
  trend: number[] // sparkline data
  category: 'engagement' | 'reach' | 'conversion' | 'revenue' | 'retention' | 'awareness'
  description?: string
  targetValue?: number
  status?: 'good' | 'warning' | 'critical'
}

export interface Comparison {
  metric: KPIMetric
  industryAverage: number
  percentageDifference: number
  rank?: string // e.g., "Top 10%"
  performanceRating: 'excellent' | 'above-average' | 'average' | 'below-average' | 'poor'
}

// ==================== Content Performance Types ====================

export type Platform = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok' | 'youtube' | 'google-business'

export interface ContentPerformance {
  contentId: string
  platform: Platform
  content: string
  thumbnail?: string
  postedAt: string
  engagementScore: number
  likes: number
  comments: number
  shares: number
  saves?: number
  reach: number
  impressions: number
  clicks?: number
  performanceRank: number
  whyItWorked?: string
  improvements?: string[]
}

export interface ContentItem {
  id: string
  content: string
  platform: Platform
  postedAt: string
  performance: ContentPerformance
}

export interface PlatformPerformance {
  platform: Platform
  averageEngagement: number
  averageReach: number
  postCount: number
  totalFollowers: number
  growthRate: number
  bestPerformingContentType: string
  topPost: ContentPerformance
}

export interface PillarPerformance {
  pillarName: string
  pillarId: string
  averageEngagement: number
  postCount: number
  audienceResonance: number // 0-100
  trend: 'rising' | 'stable' | 'declining'
  topKeywords: string[]
}

export interface OptimalTimes {
  platform: Platform
  bestDayOfWeek: string
  bestHourOfDay: number
  confidence: number // 0-1
  data: Array<{
    day: string
    hour: number
    score: number
  }>
}

// ==================== Audience Types ====================

export interface Demographics {
  ageRanges: Array<{
    range: string
    percentage: number
    count: number
  }>
  genderSplit: Array<{
    gender: string
    percentage: number
    count: number
  }>
  topLocations: Array<{
    location: string
    count: number
    percentage: number
    city?: string
    country: string
  }>
  devices: Array<{
    type: string
    percentage: number
  }>
}

export interface GrowthData {
  timeSeriesData: Array<{
    date: string
    followers: number
    newFollowers: number
    unfollows: number
    netGrowth: number
  }>
  totalGrowth: number
  growthRate: number // percentage
  averageDailyGrowth: number
  projectedGrowth?: number
}

export interface Heatmap {
  data: Array<{
    day: number // 0-6 (Sunday-Saturday)
    hour: number // 0-23
    activity: number // 0-100
  }>
  peakTimes: Array<{
    day: string
    hour: number
    activityLevel: number
  }>
}

export interface SentimentData {
  overall: {
    positive: number
    neutral: number
    negative: number
  }
  trend: Array<{
    date: string
    positive: number
    neutral: number
    negative: number
  }>
  topPositiveKeywords: string[]
  topNegativeKeywords: string[]
  averageSentimentScore: number // -1 to 1
}

// ==================== Engagement Inbox Types ====================

export type EngagementType = 'comment' | 'mention' | 'message' | 'review' | 'share'
export type SentimentType = 'positive' | 'neutral' | 'negative'
export type PriorityLevel = 'high' | 'medium' | 'low'
export type EngagementStatus = 'pending' | 'responded' | 'archived' | 'flagged'

export interface EngagementItem {
  id: string
  platform: Platform
  type: EngagementType
  content: string
  author: string
  authorHandle?: string
  authorAvatar?: string
  authorFollowers?: number
  sentiment: SentimentType
  priority: PriorityLevel
  status: EngagementStatus
  createdAt: string
  contentId?: string
  requiresResponse: boolean
  responseTime?: number // minutes
  tags?: string[]
}

export interface ResponseSuggestion {
  id: string
  text: string
  tone: 'professional' | 'friendly' | 'empathetic' | 'humorous'
  confidence: number
  reason: string
}

export interface InboxFilters {
  platform?: Platform
  sentiment?: SentimentType
  priority?: PriorityLevel
  status?: EngagementStatus
  type?: EngagementType
  dateFrom?: string
  dateTo?: string
  searchQuery?: string
}

// ==================== Learning Pattern Types ====================

export type PatternType = 'format' | 'timing' | 'content' | 'platform' | 'audience' | 'creative' | 'messaging'

export interface LearningPattern {
  id: string
  type: PatternType
  pattern: string // description
  impact: string // e.g., "2.3x more engagement"
  impactValue: number // numeric value for sorting
  confidence: number // 0-1
  dataPoints: number
  recommendation: string
  detectedAt: string
  lastValidated: string
  examples?: string[]
  relatedMetrics?: string[]
  autoApplied: boolean // whether system is auto-applying this pattern
}

export interface PatternEvidence {
  patternId: string
  evidenceType: 'content' | 'timing' | 'performance'
  data: any
  strength: number // 0-1
}

// ==================== Competitive Monitoring Types ====================

export type CompetitiveActivityType =
  | 'website_change'
  | 'new_content'
  | 'messaging_shift'
  | 'product_launch'
  | 'reputation_change'
  | 'pricing_change'
  | 'promotion'
  | 'partnership'

export type ImpactLevel = 'high' | 'medium' | 'low'

export interface CompetitiveActivity {
  id: string
  competitorId: string
  competitorName: string
  competitorLogo?: string
  activityType: CompetitiveActivityType
  description: string
  impact: ImpactLevel
  suggestedResponse?: string
  detectedAt: string
  sourceUrl?: string
  changeDetails?: {
    before?: string
    after?: string
    field?: string
  }
}

export type GapType = 'platform' | 'content' | 'keyword' | 'feature' | 'audience' | 'technology'

export interface CompetitiveGap {
  id: string
  type: GapType
  description: string
  competitors: Array<{
    id: string
    name: string
    advantage: string
  }>
  opportunity: string
  priority: PriorityLevel
  estimatedEffort: 'low' | 'medium' | 'high'
  estimatedImpact: ImpactLevel
  actionItems?: string[]
}

export interface CompetitorComparison {
  competitorId: string
  competitorName: string
  metrics: {
    followers: number
    postFrequency: number // posts per week
    engagement: number
    reachEstimate: number
  }
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
}

// ==================== Date Range & Filters ====================

export interface DateRange {
  start: string
  end: string
  preset?: '7d' | '30d' | '90d' | '1y' | 'custom'
}

export interface AnalyticsFilters {
  dateRange: DateRange
  platforms?: Platform[]
  contentTypes?: string[]
  pillars?: string[]
}

// ==================== Export Types ====================

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json' | 'xlsx'
  sections?: string[]
  includeCharts?: boolean
  includeRawData?: boolean
}

export interface ExportResult {
  success: boolean
  fileName: string
  fileUrl?: string
  error?: string
}

// ==================== Dashboard Summary Types ====================

export interface AnalyticsSummary {
  period: DateRange
  totalContent: number
  totalEngagement: number
  totalReach: number
  totalConversions: number
  topPerformingPlatform: Platform
  topPerformingPillar: string
  goalsOnTrack: number
  goalsBehind: number
  totalGoals: number
  overallHealthScore: number // 0-100
  keyInsights: string[]
  criticalAlerts: string[]
}

// ==================== Power Word Analytics ====================

export interface PowerWordPerformance {
  word: string
  category: string
  usageCount: number
  averageEngagement: number
  engagementLift: number // percentage improvement vs baseline
  confidence: number
  bestContext: string[]
  examplePosts: string[]
}

// ==================== Posting Schedule Insights ====================

export interface PostingInsight {
  pattern: string
  frequency: string
  consistency: number // 0-1
  recommendation: string
  projectedImprovement: number // percentage
}

// ==================== Content Type Performance ====================

export interface ContentTypePerformance {
  type: string // e.g., "hook", "story", "educational", "promotional"
  count: number
  averageEngagement: number
  averageReach: number
  conversionRate: number
  trend: 'rising' | 'stable' | 'declining'
  bestExamples: ContentPerformance[]
}

// ==================== ROI Tracking ====================

export interface ROIMetrics {
  totalInvestment: number // dollars
  totalRevenue: number // dollars generated
  roi: number // percentage
  costPerAcquisition: number
  customerLifetimeValue: number
  breakdownByChannel: Array<{
    channel: Platform
    investment: number
    revenue: number
    roi: number
  }>
}

// ==================== Conversion Funnel ====================

export interface ConversionFunnel {
  stages: Array<{
    name: string
    count: number
    percentage: number
    dropOff: number
  }>
  overallConversionRate: number
  averageTimeToConvert: number // days
  topConversionSources: Array<{
    source: string
    conversions: number
    rate: number
  }>
}
