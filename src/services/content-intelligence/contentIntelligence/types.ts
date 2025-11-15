/**
 * Content Intelligence Engine - Type Definitions
 *
 * Complete type system for generating personalized content using:
 * - Industry profile data (140+ profiles)
 * - Competitive intelligence (SEMrush)
 * - Real-time signals (weather, trends, news)
 * - Business performance metrics
 */

// ============================================================================
// TYPE ALIASES & ENUMS
// ============================================================================

/** Supported social and content platforms */
export type Platform =
  | 'facebook'
  | 'instagram'
  | 'google_my_business'
  | 'linkedin'
  | 'youtube'
  | 'twitter';

/**
 * Badge labels for UI display
 * Must use opportunity-focused language (MARBA philosophy)
 */
export type ContentBadge =
  | 'Weather Alert'
  | 'Opportunity to Stand Out' // ✅ Positive, specific (was: Competitor Gap)
  | 'Trending Now'
  | 'Ready to Launch' // ✅ Action-oriented (was: Platform Opportunity)
  | 'Perfect Timing' // ✅ Positive timing (was: Timing Opportunity)
  | 'Reputation Strength'
  | 'Customer Success'
  | 'Milestone'
  | 'Strategic Advantage' // ✅ Professional (was: Competitive Edge)
  | 'Content Opportunity'
  | 'Local News'
  | 'Community Discussion'
  | 'Seasonal'
  | 'Growth Opportunity'; // ✅ Clear purpose (was: Opportunity)

/** All possible opportunity types for content generation */
export type OpportunityType =
  | 'weather_alert'
  | 'competitor_gap'
  | 'trending_search'
  | 'trending'
  | 'platform_gap'
  | 'timing_gap'
  | 'format_gap'
  | 'review_advantage'
  | 'recent_review'
  | 'milestone'
  | 'competitor_weakness'
  | 'content_gap'
  | 'local_news'
  | 'reddit_discussion'
  | 'seasonal'
  | 'evergreen';

/** Content urgency levels */
export type UrgencyLevel = 'immediate' | 'today' | 'this_week' | 'evergreen';

/** MARBA content categories */
export type ContentCategory =
  | 'search_visibility'
  | 'social_presence'
  | 'customer_reviews'
  | 'content_performance';

/** MARBA category type alias (same as ContentCategory) */
export type MARBACategory = ContentCategory;

// ============================================================================
// INDUSTRY PROFILE INTERFACES
// ============================================================================

/**
 * Customer psychology trigger from industry analysis
 * Example: "moving", "school districts", "interest rates"
 */
export interface CustomerTrigger {
  /** The trigger phrase or concept */
  trigger: string;

  /** How urgent this trigger is (1-10 scale) */
  urgencyScore: number;

  /** Historical conversion rate percentage */
  conversionRate: number;

  /** When this trigger works best */
  bestTimeToUse: string;

  /** Underlying emotional driver */
  emotionalDriver: string;
}

/**
 * Emotional transformation messaging framework
 * Maps pain points to desired outcomes with emotional value
 */
export interface Transformation {
  /** Current pain or frustration */
  painPoint: string;

  /** Desired end state */
  desiredOutcome: string;

  /** Emotional benefit achieved */
  emotionalValue: string;

  /** Example messaging */
  messagingExample: string;
}

/**
 * Proven high-impact word from industry analysis
 */
export interface PowerWord {
  /** The power word itself */
  word: string;

  /** Usage context and guidelines */
  context: string;

  /** Impact score (1-10) */
  impactScore: number;

  /** Where to place in content */
  placement: 'headline' | 'CTA' | 'body';

  /** Percentage conversion lift vs baseline */
  conversionLift: number;
}

/**
 * Proven call-to-action with conversion data
 */
export interface ProvenCTA {
  /** The CTA text */
  text: string;

  /** Historical conversion rate percentage */
  conversionRate: number;

  /** Which platform performs best */
  bestPlatform: Platform;

  /** How urgent the CTA is */
  urgencyLevel: UrgencyLevel;

  /** When to use this CTA */
  context: string;
}

/**
 * Seasonal pattern with search volume and timing data
 */
export interface SeasonalTrend {
  /** Month name */
  month: string;

  /** Trend name/description */
  trend: string;

  /** Search volume for this month */
  searchVolume: number;

  /** Top keywords for this period */
  keywords: string[];

  /** Recommended campaigns */
  campaigns: string[];

  /** Optimal posting time */
  bestPostingTime: string;

  /** Expected engagement score (relative) */
  expectedEngagement: number;
}

/**
 * Industry profile from database of 140+ analyzed industries
 * Contains proven patterns, triggers, and best practices
 */
export interface IndustryProfile {
  /** Industry name */
  industryName: string;

  /** NAICS classification code */
  naicsCode: string;

  /** Number of businesses analyzed (e.g., 3,247) */
  businessCount: number;

  /** Customer psychology triggers */
  customerTriggers: CustomerTrigger[];

  /** Emotional transformation frameworks */
  transformations: Transformation[];

  /** Proven high-impact words */
  powerWords: PowerWord[];

  /** Proven calls-to-action with conversion rates */
  provenCTAs: ProvenCTA[];

  /** Seasonal patterns and timing */
  seasonalTrends: SeasonalTrend[];

  /** Best performing platforms for this industry */
  bestPlatforms: Platform[];

  /** Top-performing content types */
  contentTypes: string[];

  /** Industry-specific trust signals */
  trustSignals: string[];

  /** Average competitor activity benchmarks */
  averageCompetitorActivity: {
    postsPerWeek: number;
    platforms: Platform[];
    contentTypes: string[];
    responseTime: string;
  };
}

// ============================================================================
// COMPETITIVE INTELLIGENCE INTERFACES
// ============================================================================

/**
 * Competitor business information
 */
export interface Competitor {
  /** Competitor business name */
  name: string;

  /** Competitor domain */
  domain: string;

  /** Number of organic keywords ranked for */
  organicKeywords: number;

  /** Estimated monthly organic traffic */
  organicTraffic: number;

  /** Domain authority score (0-100) */
  authority: number;
}

/**
 * SEO keyword gap opportunity
 * Keywords competitors rank for that you don't
 */
export interface KeywordGap {
  /** The keyword phrase */
  keyword: string;

  /** Monthly search volume */
  searchVolume: number;

  /** Keyword difficulty (0-100) */
  difficulty: number;

  /** Competitor rankings: domain -> position */
  competitorRanking: Record<string, number>;

  /** Your current ranking (null if not ranking) */
  yourRanking: number | null;

  /** Opportunity score (0-100) */
  opportunityScore: number;

  /** Why this is an opportunity */
  reasoning: string;
}

/**
 * Content topic gap opportunity
 * Topics competitors haven't covered
 */
export interface ContentGap {
  /** The topic or content area */
  topic: string;

  /** Monthly search volume */
  searchVolume: number;

  /** How many of top 3 competitors cover this */
  competitorsCover: number;

  /** Why this is an opportunity */
  reasoning: string;
}

/**
 * Search and SEO opportunities from competitive analysis
 */
export interface SearchOpportunities {
  /** Keywords competitors rank for, you don't */
  keywordGaps: KeywordGap[];

  /** Topics competitors haven't covered */
  contentGaps: ContentGap[];
}

/**
 * Social media platform gap
 */
export interface PlatformGap {
  /** Which platform */
  platform: Platform;

  /** What competitors are doing */
  competitorActivity: string;

  /** Your opportunity */
  opportunity: string;
}

/**
 * Timing gap in competitor posting schedule
 */
export interface TimingGap {
  /** Time slot with low competitor activity */
  timeSlot: string;

  /** Current competitor activity */
  competitorActivity: string;

  /** Your opportunity */
  opportunity: string;
}

/**
 * Content format gap
 */
export interface FormatGap {
  /** Content format type */
  format: string;

  /** Competitor usage level */
  competitorUsage: string;

  /** Your opportunity */
  opportunity: string;
}

/**
 * Social media opportunities from competitive analysis
 */
export interface SocialOpportunities {
  /** Platforms where you can gain advantage */
  platformGaps: PlatformGap[];

  /** Times when competitors aren't posting */
  timingGaps: TimingGap[];

  /** Content formats competitors underuse */
  formatGaps: FormatGap[];
}

/**
 * Review/reputation advantage you have
 */
export interface ReviewAdvantage {
  /** Metric name (e.g., "Response Rate") */
  metric: string;

  /** Your value */
  yourValue: string | number;

  /** Competitor average */
  competitorAvg: string | number;

  /** Why this is an advantage */
  advantage: string;

  /** The strength/advantage description */
  strength: string;

  /** Number of mentions/occurrences */
  mentionCount: number;
}

/**
 * Competitor weakness to exploit
 */
export interface CompetitorWeakness {
  /** Which competitor */
  competitor: string;

  /** Their weakness */
  weakness: string;

  /** Your corresponding strength */
  yourStrength: string;

  /** Content angle to exploit this */
  contentAngle: string;

  /** Frequency of this weakness */
  frequency: number;
}

/**
 * Review and reputation opportunities
 */
export interface ReviewOpportunities {
  /** Areas where you outperform competitors */
  advantages: ReviewAdvantage[];

  /** Competitor weaknesses to exploit */
  weaknessesToExploit: CompetitorWeakness[];
}

/**
 * Speed/reaction time opportunity
 */
export interface ReactionGap {
  /** Type of event (e.g., "weather alerts") */
  eventType: string;

  /** How fast competitors react */
  competitorSpeed: string;

  /** Your opportunity to be faster */
  yourOpportunity: string;
}

/**
 * Speed and timing opportunities
 */
export interface SpeedOpportunities {
  /** Areas where faster reaction gives advantage */
  reactionGaps: ReactionGap[];
}

/**
 * Complete competitive intelligence from SEMrush analysis
 */
export interface CompetitiveIntelligence {
  /** Top 3 identified competitors */
  competitors: Competitor[];

  /** Search/SEO opportunities */
  searchOpportunities: SearchOpportunities;

  /** Social media opportunities */
  socialOpportunities: SocialOpportunities;

  /** Review/reputation opportunities */
  reviewOpportunities: ReviewOpportunities;

  /** Speed/timing opportunities */
  speedOpportunities: SpeedOpportunities;
}

// ============================================================================
// CURRENT PERFORMANCE INTERFACES
// ============================================================================

/**
 * Single keyword ranking
 */
export interface SearchRanking {
  /** Keyword phrase */
  keyword: string;

  /** Current position (1-100+) */
  position: number;

  /** Monthly search volume */
  searchVolume: number;

  /** Landing page URL */
  url: string;
}

/**
 * Current search/SEO performance data
 */
export interface SearchData {
  /** All current keyword rankings */
  currentRankings: SearchRanking[];

  /** Total number of keywords ranked for */
  totalKeywords: number;

  /** Best performing keyword */
  topKeyword: {
    keyword: string;
    position: number;
  } | null;
}

/**
 * Single customer review
 */
export interface Review {
  /** Review text content */
  text: string;

  /** Star rating (1-5) */
  rating: number;

  /** Date posted (ISO string) */
  date: string;

  /** Reviewer name (optional) */
  author?: string;
}

/**
 * Review and reputation performance data
 */
export interface ReviewData {
  /** Average star rating */
  rating: number;

  /** Total number of reviews */
  reviewCount: number;

  /** Recent reviews (last 10) */
  recentReviews: Review[];

  /** Common themes in reviews */
  reviewThemes: string[];

  /** Percentage of reviews responded to */
  responseRate: number;

  /** Average response time */
  avgResponseTime: string;
}

/**
 * Social platform data (Facebook, Instagram, etc.)
 */
export interface SocialPlatformData {
  /** Whether account exists */
  exists: boolean;

  /** Profile URL */
  url?: string;

  /** Follower count */
  followers?: number;
}

/**
 * Google My Business data
 */
export interface GMBData {
  /** Number of photos */
  photoCount: number;

  /** Number of posts */
  postCount: number;

  /** Last post date (ISO string) */
  lastPostDate?: string;

  /** Profile views in last 30 days */
  viewsLast30Days?: number;
}

/**
 * Social media performance data
 */
export interface SocialData {
  /** Platform presence and metrics */
  platforms: {
    facebook: SocialPlatformData;
    instagram: SocialPlatformData;
    linkedin: SocialPlatformData;
    youtube: SocialPlatformData;
  };

  /** Google My Business data */
  gmbData: GMBData;
}

// ============================================================================
// REAL-TIME SIGNALS INTERFACES
// ============================================================================

/**
 * Weather signal for timely content
 */
export interface WeatherSignal {
  /** Weather alert if any (e.g., "Freeze warning") */
  alert?: string;

  /** Current temperature */
  temperature?: number;

  /** Current condition (e.g., "sunny", "rainy") */
  condition?: string;

  /** Forecast summary */
  forecast?: string;
}

/**
 * Trending topic signal
 */
export interface TrendingSignal {
  /** Trending topic or keyword */
  topic: string;

  /** Source of trend data */
  source: 'google_trends' | 'reddit';

  /** Relevance to business (1-10) */
  relevance: number;

  /** Search volume if available */
  searchVolume?: number;

  /** When trend peaks */
  peakTime?: string;
}

/**
 * Local news signal
 */
export interface LocalNewsSignal {
  /** News headline */
  headline: string;

  /** Relevance to business (1-10) */
  relevance: number;

  /** How business can tie into this */
  angle: string;
}

/**
 * Reddit discussion signal
 */
export interface RedditDiscussion {
  /** Subreddit name */
  subreddit: string;

  /** Discussion topic */
  topic: string;

  /** Engagement level (upvotes + comments) */
  engagement: number;

  /** Overall sentiment */
  sentiment: 'positive' | 'neutral' | 'negative';

  /** Content angle for business */
  contentAngle: string;
}

/**
 * Real-time signals for timely content generation
 */
export interface RealTimeSignals {
  /** Current weather and alerts */
  weather?: WeatherSignal;

  /** Trending topics */
  trending: TrendingSignal[];

  /** Local news items */
  localNews?: LocalNewsSignal[];

  /** Reddit discussions */
  redditDiscussions?: RedditDiscussion[];
}

// ============================================================================
// MAIN BUSINESS INTELLIGENCE INTERFACE
// ============================================================================

/**
 * Complete business intelligence data structure
 * Contains all information needed to generate personalized content
 */
export interface BusinessIntelligence {
  /** Core business information */
  business: {
    name: string;
    url: string;
    industry: string;
    location: {
      city: string;
      state: string;
      lat?: number;
      lon?: number;
    };
  };

  /** Industry profile from 140+ database with proven patterns */
  industryProfile: IndustryProfile;

  /** AI-extracted business-specific messaging from website content */
  websiteAnalysis?: {
    valuePropositions: string[];
    targetAudience: string[];
    customerProblems: string[];
    solutions: string[];
    proofPoints: string[];
    differentiators: string[];
    confidence: number;
  };

  /** Competitive intelligence from SEMrush analysis */
  competitive: CompetitiveIntelligence;

  /** Current business performance metrics */
  searchData: SearchData;
  reviewData: ReviewData;
  socialData: SocialData;

  /** Real-time signals for timely content */
  realTimeSignals: RealTimeSignals;
}

// ============================================================================
// CONTENT OUTPUT INTERFACES
// ============================================================================

/**
 * Industry profile elements used in content
 */
export interface IndustryContext {
  /** Which customer trigger was addressed */
  trigger?: string;

  /** Which power words were included */
  powerWordsUsed: string[];

  /** Which proven CTA was used */
  ctaUsed?: string;

  /** Matched customer trigger */
  customerTriggerMatch?: string;
}

/**
 * Competitive advantage being exploited
 */
export interface CompetitiveEdge {
  /** Specific gap being exploited */
  gap: string;

  /** Why you win here */
  advantage: string;
}

/**
 * The actual content to post
 */
export interface ContentData {
  /** Target platform */
  platform: Platform | string;

  /** Complete post text (200-500 chars, ready to post) */
  postText: string;

  /** Hashtags for social platforms (3-8 hashtags) */
  hashtags?: string[];

  /** Optimal posting time */
  optimalTime?: string;

  /** What data sources generated this */
  source?: string;

  /** Call-to-action extracted from post */
  cta?: string;
}

/**
 * A single piece of generated content
 * Complete and ready to post
 */
export interface ContentPiece {
  /** Unique identifier */
  id: string;

  /** 5-8 word compelling title */
  title: string;

  /** MARBA category this content belongs to */
  category?: ContentCategory;

  /** One sentence explaining why this works */
  reason?: string;

  /** Category badge for UI display */
  badge?: ContentBadge;

  /** Alternative badge field name */
  opportunityBadge?: ContentBadge;

  /** The actual content to post */
  content: ContentData;

  /** Industry profile elements used */
  industryContext: IndustryContext;

  /** Competitive advantage being exploited */
  competitiveEdge?: CompetitiveEdge;

  /** Alternative competitive advantage field name */
  competitiveAdvantage?: string;

  /** Validation result */
  validation?: {
    score: number;
    passedChecks: string[];
    failedChecks: string[];
  };

  /** When this content was generated */
  generatedAt?: string;
}

/**
 * Complete generated content for all 4 MARBA categories
 * 12 total pieces (3 per category)
 */
export interface GeneratedContent {
  /** 3 SEO/search-focused pieces */
  searchVisibility: ContentPiece[];

  /** 3 social media pieces */
  socialPresence: ContentPiece[];

  /** 3 review/reputation pieces */
  customerReviews: ContentPiece[];

  /** 3 content marketing pieces */
  contentPerformance: ContentPiece[];
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

/**
 * Individual validation checks for content quality
 */
export interface ValidationChecks {
  /** Has specific local references (city, neighborhood) */
  hasLocalReference: boolean;

  /** Includes real data (numbers, dates, facts) */
  hasRealData: boolean;

  /** Has clear call-to-action */
  hasClearCTA: boolean;

  /** No placeholders like [Business Name] */
  noPlaceholders: boolean;

  /** Appropriate length (100-500 chars) */
  rightLength: boolean;

  /** Natural language, not keyword-stuffed */
  natural: boolean;

  /** Uses opportunity-focused language */
  opportunityFocused: boolean;
}

/**
 * Complete validation result for a content piece
 */
export interface ValidationResult {
  /** Whether content passes all checks */
  isValid: boolean;

  /** Quality score (0-1) */
  score: number;

  /** List of failed checks */
  failures: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Base urgency scores for different signal types (1-10 scale) */
export const URGENCY_SCORES: Record<OpportunityType, number> = {
  weather_alert: 10,
  competitor_gap: 6,
  trending_search: 8,
  trending: 8,
  platform_gap: 7,
  timing_gap: 6,
  format_gap: 6,
  review_advantage: 7,
  recent_review: 8,
  milestone: 6,
  competitor_weakness: 7,
  content_gap: 7,
  local_news: 9,
  reddit_discussion: 7,
  seasonal: 5,
  evergreen: 3,
};

/**
 * Mapping from opportunity types to UI badge labels
 * All badges use opportunity-focused language (MARBA philosophy)
 */
export const OPPORTUNITY_TO_BADGE: Record<OpportunityType, ContentBadge> = {
  weather_alert: 'Weather Alert',
  competitor_gap: 'Opportunity to Stand Out', // ✅ Changed from 'Competitor Gap'
  trending_search: 'Trending Now',
  trending: 'Trending Now',
  platform_gap: 'Ready to Launch', // ✅ Changed from 'Platform Opportunity'
  timing_gap: 'Perfect Timing', // ✅ Changed from 'Timing Opportunity'
  format_gap: 'Ready to Launch', // ✅ Changed from 'Platform Opportunity'
  review_advantage: 'Reputation Strength',
  recent_review: 'Customer Success',
  milestone: 'Milestone',
  competitor_weakness: 'Strategic Advantage', // ✅ Changed from 'Competitive Edge'
  content_gap: 'Content Opportunity',
  local_news: 'Local News',
  reddit_discussion: 'Community Discussion',
  seasonal: 'Seasonal',
  evergreen: 'Growth Opportunity', // ✅ Changed from 'Opportunity'
};

/**
 * Forbidden words for opportunity-focused tone
 * NEVER allow content containing these words (MARBA's brand voice)
 *
 * Categorized for clarity:
 * - Deficit language: implies business is lacking/failing
 * - Pressure language: forces action through guilt
 * - Negative competitive: says competitors are "beating" them
 * - Problem-focused: frames situations as problems not opportunities
 */
export const FORBIDDEN_WORDS = [
  // Deficit language
  'missing',
  'lacking',
  'behind',
  'below average',
  'failed',
  'failing',
  'weak',
  'poor',
  'deficit',

  // Pressure language
  'must',
  'need to',
  'have to',
  'required',
  'should',

  // Negative competitive language
  'losing',
  'beaten',
  'crushing you',
  'beating you',
  'competitors are ahead',
  'falling behind',

  // Problem-focused language
  'problem',
  'issue',
  'shortfall',
];

/**
 * Opportunity-focused words to use instead
 * Creates positive, growth-oriented messaging (MARBA's brand voice)
 */
export const OPPORTUNITY_WORDS = [
  'opportunity',
  'growth',
  'discover',
  'explore',
  'achieve',
  'unlock',
  'expand',
  'enhance',
  'available',
  'ready',
  'positioned',
  'exciting',
  'valuable',
  'potential',
  'activate',
  'amplify',
  'capture',
  'primed',
  'powerful',
  'impactful',
];

/**
 * Positive framing for each opportunity type
 * Use these in reasoning strings instead of deficit language
 *
 * Examples:
 * ✅ "Opportunity to differentiate" (NOT "competitors ahead")
 * ✅ "Channel ready to activate" (NOT "you're not active here")
 * ✅ "Perfect timing opportunity" (NOT "competitors posting, you're not")
 */
export const POSITIVE_FRAMING: Record<OpportunityType, string> = {
  weather_alert: 'Creates urgency and relevance',
  trending: 'High interest right now',
  trending_search: 'High search interest',
  local_news: 'Timely local connection',
  reddit_discussion: 'Active community discussion',
  competitor_gap: 'Opportunity to differentiate', // NOT "competitors ahead"
  content_gap: 'Valuable topic available',
  platform_gap: 'Channel ready to activate', // NOT "you're not active"
  timing_gap: 'Perfect timing opportunity', // NOT "competitors posting, you're not"
  format_gap: 'Format advantage available',
  review_advantage: 'Highlight your strength',
  recent_review: 'Fresh customer success',
  competitor_weakness: 'Strategic positioning ready',
  seasonal: 'Seasonal alignment',
  evergreen: 'Proven industry trigger',
  milestone: 'Achievement to celebrate',
};
