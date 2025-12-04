/**
 * AI Commands Type Definitions
 *
 * Types for natural language command parsing, execution, and proactive intelligence.
 * Transforms chat into full command center - AI executes actions.
 */

// ============================================================================
// COMMAND INTENTS & PARSING
// ============================================================================

/**
 * Supported command intent categories
 */
export type CommandIntent =
  | 'campaign_creation'       // "Create a viral campaign for my bakery"
  | 'content_modification'    // "Make this week's posts more casual"
  | 'topic_exploration'       // "Find trending topics about shoes"
  | 'performance_analysis'    // "Why did this post do well?"
  | 'schedule_changes'        // "Post more in the mornings"
  | 'visual_analysis'         // "Analyze this image and suggest content"
  | 'general_question'        // Fallback for non-command queries
  | 'clarification_needed';   // When intent is ambiguous

/**
 * Parsed command with extracted parameters
 */
export interface ParsedCommand {
  /** Original user input */
  input: string;

  /** Detected intent */
  intent: CommandIntent;

  /** Confidence score (0-1) */
  confidence: number;

  /** Extracted parameters based on intent */
  parameters: CommandParameters;

  /** Requires user confirmation before execution */
  requiresConfirmation: boolean;

  /** Questions to ask if clarification needed */
  clarificationQuestions?: string[];

  /** Suggested actions the command will take */
  actions: CommandAction[];
}

/**
 * Parameters extracted from natural language command
 */
export interface CommandParameters {
  // Campaign Creation
  campaignType?: 'authority_builder' | 'social_proof' | 'local_pulse';
  businessContext?: string;
  targetAudience?: string;
  duration?: number; // days
  platforms?: string[];

  // Content Modification
  contentIds?: string[]; // Specific content to modify
  timeframe?: 'today' | 'this_week' | 'this_month' | 'all_future';
  modifications?: {
    tone?: 'casual' | 'professional' | 'funny' | 'serious' | 'inspirational';
    length?: 'shorter' | 'longer';
    style?: string;
    includeHashtags?: boolean;
    includeEmojis?: boolean;
  };

  // Topic Exploration
  topics?: string[];
  industry?: string;
  trendingOnly?: boolean;

  // Performance Analysis
  postId?: string;
  metric?: 'engagement' | 'reach' | 'conversions' | 'overall';
  comparisonPeriod?: 'last_week' | 'last_month' | 'all_time';

  // Schedule Changes
  schedulePattern?: {
    mornings?: boolean;
    afternoons?: boolean;
    evenings?: boolean;
    weekdays?: boolean;
    weekends?: boolean;
    frequency?: 'more' | 'less';
  };

  // Visual Analysis
  imageUrl?: string;
  imageFile?: File;

  // General
  query?: string;
  context?: Record<string, any>;
}

/**
 * Actions that will be executed by the command
 */
export interface CommandAction {
  /** Action type */
  type: 'create_campaign' | 'modify_content' | 'generate_topics' | 'analyze_performance' | 'update_schedule' | 'analyze_image';

  /** Human-readable description */
  description: string;

  /** API endpoint to call */
  endpoint?: string;

  /** Payload for API call */
  payload?: Record<string, any>;

  /** Expected result */
  expectedResult?: string;
}

/**
 * Command execution result
 */
export interface CommandExecutionResult {
  /** Whether command executed successfully */
  success: boolean;

  /** Original command */
  command: ParsedCommand;

  /** Result data */
  data?: any;

  /** User-facing message */
  message: string;

  /** Actions that were executed */
  executedActions: CommandAction[];

  /** Errors if any */
  errors?: string[];

  /** Timestamp */
  executedAt: Date;
}

// ============================================================================
// TOPIC EXPLORATION
// ============================================================================

/**
 * Topic exploration request
 */
export interface TopicExplorationRequest {
  /** Topics to explore */
  topics: string[];

  /** Industry context */
  industry?: string;

  /** Only return trending topics */
  trendingOnly?: boolean;

  /** Number of ideas to generate per topic */
  ideasPerTopic?: number;

  /** Business context for relevance */
  businessContext?: string;
}

/**
 * Single topic with content ideas
 */
export interface TopicResult {
  /** Topic name */
  topic: string;

  /** Why this topic is relevant */
  relevance: string;

  /** Is this currently trending */
  isTrending: boolean;

  /** Trend score (0-100) */
  trendScore: number;

  /** Content ideas for this topic */
  contentIdeas: ContentIdea[];

  /** Trending hashtags */
  hashtags: string[];

  /** Sources */
  sources?: string[];
}

/**
 * Single content idea
 */
export interface ContentIdea {
  /** Idea title */
  title: string;

  /** Content concept */
  concept: string;

  /** Recommended platform */
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok';

  /** Content format */
  format: 'post' | 'story' | 'reel' | 'video' | 'carousel';

  /** Expected engagement level */
  expectedEngagement: 'low' | 'medium' | 'high' | 'viral';

  /** Why this will work */
  reasoning: string;
}

/**
 * Topic exploration result
 */
export interface TopicExplorationResult {
  /** Request that generated this */
  request: TopicExplorationRequest;

  /** Topic results */
  topics: TopicResult[];

  /** Total ideas generated */
  totalIdeas: number;

  /** Timestamp */
  generatedAt: Date;
}

// ============================================================================
// CAMPAIGN IDEA GENERATION
// ============================================================================

/**
 * Campaign idea generation request
 */
export interface CampaignIdeaRequest {
  /** What the campaign is about */
  context: string;

  /** Business information */
  businessName: string;
  industry: string;

  /** Target audience */
  targetAudience?: string;

  /** Preferred platforms */
  platforms?: string[];

  /** Campaign goal */
  goal?: 'awareness' | 'engagement' | 'conversions' | 'traffic';

  /** Number of ideas to generate */
  count?: number;
}

/**
 * Single campaign idea
 */
export interface CampaignIdea {
  /** Unique ID */
  id: string;

  /** Campaign title */
  title: string;

  /** Campaign concept */
  concept: string;

  /** Campaign type */
  type: 'authority_builder' | 'social_proof' | 'local_pulse';

  /** Primary goal */
  goal: 'awareness' | 'engagement' | 'conversions' | 'traffic';

  /** Recommended duration (days) */
  duration: number;

  /** Target platforms */
  platforms: string[];

  /** Key posts in the campaign */
  keyPosts: CampaignPost[];

  /** Expected outcomes */
  expectedOutcomes: {
    engagementRate?: number;
    reach?: number;
    conversions?: number;
    confidence: number; // 0-1
  };

  /** Why this campaign will work */
  reasoning: string;

  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'complex';

  /** Can be created with one click */
  canCreateNow: boolean;
}

/**
 * Single post in a campaign
 */
export interface CampaignPost {
  /** Week number (1-4 for 4-week campaign) */
  week: number;

  /** Day of campaign (1-indexed) */
  day: number;

  /** Post title */
  title: string;

  /** Post concept */
  concept: string;

  /** Platform */
  platform: string;

  /** Content format */
  format: 'post' | 'story' | 'reel' | 'video' | 'carousel';

  /** Content type (educational, promotional, etc.) */
  contentType: string;

  /** Key message */
  message: string;

  /** CTA */
  callToAction?: string;

  /** Generated content with scoring */
  content?: {
    score?: {
      total: number;
    };
    headline?: string;
    body?: string;
    cta?: string;
  };
}

/**
 * Campaign idea generation result
 */
export interface CampaignIdeaResult {
  /** Request that generated this */
  request: CampaignIdeaRequest;

  /** Generated ideas */
  ideas: CampaignIdea[];

  /** Timestamp */
  generatedAt: Date;
}

// ============================================================================
// PROACTIVE SUGGESTIONS
// ============================================================================

/**
 * Types of proactive suggestions
 */
export type SuggestionTrigger =
  | 'engagement_drop'          // Engagement rate dropped significantly
  | 'competitor_activity'      // Competitor posted something relevant
  | 'local_event'              // Upcoming local event
  | 'seasonal_opportunity'     // Seasonal content opportunity
  | 'content_gap'              // Haven't posted in a while
  | 'platform_opportunity'     // Should try a new platform
  | 'content_type_suggestion'  // Try video instead of images
  | 'timing_optimization'      // Post at different times
  | 'hashtag_recommendation';  // New trending hashtags

/**
 * Proactive suggestion
 */
export interface ProactiveSuggestion {
  /** Unique ID */
  id: string;

  /** What triggered this suggestion */
  trigger: SuggestionTrigger;

  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';

  /** Short title */
  title: string;

  /** Full suggestion text */
  message: string;

  /** Why we're suggesting this */
  reasoning: string;

  /** Data supporting the suggestion */
  supportingData?: {
    metric?: string;
    currentValue?: number;
    previousValue?: number;
    benchmark?: number;
    change?: number; // percentage
  };

  /** Recommended actions */
  actions: SuggestionAction[];

  /** Can be applied with one click */
  canAutoApply: boolean;

  /** Expected impact */
  expectedImpact: {
    metric: string;
    improvement: string; // e.g., "30% increase"
    confidence: number; // 0-1
  };

  /** When suggestion was generated */
  generatedAt: Date;

  /** When suggestion expires */
  expiresAt?: Date;

  /** Has user seen this */
  seen: boolean;

  /** User response */
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
}

/**
 * Action within a suggestion
 */
export interface SuggestionAction {
  /** Action type */
  type: 'create_content' | 'modify_schedule' | 'change_strategy' | 'try_platform' | 'use_format';

  /** Action description */
  description: string;

  /** API call to execute action */
  apiCall?: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: Record<string, any>;
  };
}

/**
 * Proactive suggestions configuration
 */
export interface ProactiveSuggestionsConfig {
  /** Monitor campaigns every X minutes */
  monitoringInterval: number;

  /** Minimum engagement drop to trigger suggestion (%) */
  engagementDropThreshold: number;

  /** Days of no posting to trigger content gap */
  contentGapDays: number;

  /** Enable competitor monitoring */
  monitorCompetitors: boolean;

  /** Enable local event monitoring */
  monitorLocalEvents: boolean;

  /** Enable seasonal suggestions */
  enableSeasonalSuggestions: boolean;

  /** User preferences */
  userPreferences?: {
    /** Never suggest these platforms */
    excludedPlatforms?: string[];

    /** Never suggest these content types */
    excludedContentTypes?: string[];

    /** Minimum priority to show */
    minPriority?: 'low' | 'medium' | 'high' | 'urgent';
  };
}

// ============================================================================
// VISUAL UNDERSTANDING
// ============================================================================

/**
 * Visual analysis request
 */
export interface VisualAnalysisRequest {
  /** Image URL */
  imageUrl?: string;

  /** Image file (for upload) */
  imageFile?: File;

  /** Base64 encoded image */
  imageBase64?: string;

  /** Business context */
  businessContext?: string;

  /** What to analyze for */
  analysisGoal?: 'caption' | 'campaign_type' | 'brand_colors' | 'product_suggestion' | 'all';
}

/**
 * Visual analysis result
 */
export interface VisualAnalysisResult {
  /** Request that generated this */
  request: VisualAnalysisRequest;

  /** Image description */
  description: string;

  /** Detected objects/subjects */
  detectedElements: string[];

  /** Suggested captions */
  suggestedCaptions: {
    casual: string;
    professional: string;
    creative: string;
  };

  /** Recommended campaign type */
  recommendedCampaignType?: {
    type: 'authority_builder' | 'social_proof' | 'local_pulse';
    reasoning: string;
    confidence: number;
  };

  /** Extracted brand colors */
  brandColors?: {
    primary: string;   // hex code
    secondary: string; // hex code
    accent: string;    // hex code
  };

  /** Product suggestions */
  productSuggestions?: string[];

  /** Recommended platforms */
  recommendedPlatforms: string[];

  /** Recommended hashtags */
  recommendedHashtags: string[];

  /** Overall quality score */
  qualityScore: number; // 0-100

  /** Suggestions for improvement */
  improvements?: string[];

  /** Timestamp */
  analyzedAt: Date;
}

// ============================================================================
// SERVICE RESPONSES
// ============================================================================

/**
 * Generic service response
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: Date;
    duration?: number; // ms
    cost?: number;     // API cost in USD
  };
}

/**
 * Command parser service interface
 */
export interface ICommandParser {
  parse(input: string, context?: Record<string, any>): Promise<ServiceResponse<ParsedCommand>>;
  execute(command: ParsedCommand): Promise<ServiceResponse<CommandExecutionResult>>;
}

/**
 * Topic explorer service interface
 */
export interface ITopicExplorer {
  explore(request: TopicExplorationRequest): Promise<ServiceResponse<TopicExplorationResult>>;
  getTrendingTopics(industry: string, count?: number): Promise<ServiceResponse<TopicResult[]>>;
}

/**
 * Campaign idea service interface
 */
export interface ICampaignIdeaService {
  generate(request: CampaignIdeaRequest): Promise<ServiceResponse<CampaignIdeaResult>>;
  createFromIdea(ideaId: string): Promise<ServiceResponse<any>>;
}

/**
 * Proactive suggestions service interface
 */
export interface IProactiveSuggestions {
  monitor(): Promise<ServiceResponse<ProactiveSuggestion[]>>;
  getSuggestions(userId: string): Promise<ServiceResponse<ProactiveSuggestion[]>>;
  applySuggestion(suggestionId: string): Promise<ServiceResponse<any>>;
  dismissSuggestion(suggestionId: string): Promise<ServiceResponse<void>>;
}

/**
 * Visual understanding service interface
 */
export interface IVisualUnderstanding {
  analyze(request: VisualAnalysisRequest): Promise<ServiceResponse<VisualAnalysisResult>>;
}
