/**
 * Synapse Content Generation Types
 *
 * Type definitions for transforming synapse insights into
 * multiple content formats with psychological hooks and optimization.
 *
 * Created: 2025-11-10
 */

import type { SynapseInsight } from './synapse.types';
import type { HolyShitScore } from './scoring.types';

/**
 * Content format types
 */
export type ContentFormat =
  // Social Media Formats
  | 'hook-post'         // Curiosity gap opening
  | 'story-post'        // Narrative-driven
  | 'data-post'         // Data/statistics focus
  | 'controversial-post' // Contrarian take
  | 'thread'            // Multi-part thread
  | 'carousel'          // Slide deck format

  // Email Formats
  | 'email-newsletter'  // Regular email content
  | 'email-promo'       // Promotional email
  | 'email-sequence'    // Part of email sequence

  // Blog Formats
  | 'blog-post'         // Standard blog post
  | 'blog-how-to'       // How-to guide
  | 'blog-listicle'     // Numbered list post
  | 'blog-case-study'   // Case study format

  // Landing Page Formats
  | 'landing-page'      // Full landing page
  | 'landing-hero'      // Hero section only
  | 'landing-sales';    // Long-form sales page

/**
 * Platform types
 */
export type Platform =
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube';

/**
 * Edginess level for humor enhancement
 * 0-100 scale: 0 = very professional, 100 = edgy/casual
 */
export type EdginessLevel = number; // 0-100

/**
 * Edginess ranges and their characteristics
 */
export const EDGINESS_RANGES = {
  PROFESSIONAL: { min: 0, max: 25, label: 'Professional', description: 'Subtle, polished, corporate-safe' },
  APPROACHABLE: { min: 26, max: 50, label: 'Approachable', description: 'Warm, relatable, friendly' },
  CASUAL: { min: 51, max: 75, label: 'Casual', description: 'Conversational, witty, personable' },
  EDGY: { min: 76, max: 100, label: 'Edgy', description: 'Bold, playful, attention-grabbing' }
} as const;

/**
 * Result of humor enhancement
 */
export interface HumorEnhancementResult {
  original: {
    headline: string;
    hook: string;
    body: string;
    cta: string;
  };
  enhanced: {
    headline: string;
    hook: string;
    body: string;
    cta: string;
  };
  edginessLevel: EdginessLevel;
  enhancementsApplied: string[]; // List of what was changed
}

/**
 * Content tone
 */
export type ContentTone =
  | 'provocative'
  | 'educational'
  | 'inspirational'
  | 'controversial'
  | 'authoritative'
  | 'casual';

/**
 * Pacing for content delivery
 */
export type ContentPacing = 'fast' | 'medium' | 'slow';

/**
 * Brand impact assessment
 */
export type BrandImpact = 'positive' | 'neutral' | 'risky';

/**
 * Emotional trigger
 */
export interface EmotionalTrigger {
  type: 'curiosity' | 'fear' | 'anger' | 'surprise' | 'aspiration' | 'validation';
  strength: number; // 0-1
  description?: string;
}

/**
 * Content structure
 */
export interface ContentBody {
  headline: string;
  hook: string;
  body: string;
  cta: string;
  hashtags?: string[];

  // Email-specific fields
  subjectLine?: string;
  preheader?: string;
  ps?: string;

  // Blog-specific fields
  metaDescription?: string;
  seoTitle?: string;
  slug?: string;

  // Landing page-specific fields
  subheadline?: string;
  bulletPoints?: string[];
  socialProof?: string[];
}

/**
 * Psychological analysis of content
 */
export interface ContentPsychology {
  principle: PsychologicalPrinciple;
  trigger: EmotionalTrigger;
  persuasionTechnique: PersuasionTechnique;
  expectedReaction: string;
}

/**
 * Psychological principles
 */
export type PsychologicalPrinciple =
  | 'Curiosity Gap'
  | 'Narrative Transportation'
  | 'Social Proof + Authority'
  | 'Cognitive Dissonance'
  | 'Pattern Interrupt'
  | 'Scarcity'
  | 'Reciprocity'
  | 'Commitment & Consistency'
  | 'Loss Aversion';

/**
 * Persuasion techniques
 */
export type PersuasionTechnique =
  | 'Pattern Interrupt'
  | 'Storytelling'
  | 'Data-Driven Authority'
  | 'Contrarian Challenge'
  | 'Question-Based Hook'
  | 'Social Proof'
  | 'Scarcity Frame'
  | 'Transformation Promise';

/**
 * Content optimization details
 */
export interface ContentOptimization {
  powerWords: string[];
  framingDevice: string;
  narrativeStructure: string;
  pacing: ContentPacing;
}

/**
 * Content metadata
 */
export interface ContentMeta {
  platform: Platform[];
  bestPostTime?: Date;
  targetAudience: string;
  tone: ContentTone;
}

/**
 * Content performance prediction
 */
export interface ContentPrediction {
  engagementScore: number;   // 0-1
  viralPotential: number;    // 0-1
  leadGeneration: number;    // 0-1
  brandImpact: BrandImpact;
  confidenceLevel: number;   // 0-1
}

/**
 * Raw data point that triggered insight
 */
export interface RawDataSource {
  platform: 'google-reviews' | 'youtube' | 'reddit' | 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'search' | 'weather' | 'local-event' | 'competitor' | 'other';
  type: 'review' | 'comment' | 'post' | 'search-query' | 'event' | 'weather-trigger' | 'pain-point' | 'trending-topic';
  content: string;  // Actual text/data
  author?: string;
  timestamp?: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;  // 0-1
  url?: string;
}

/**
 * Psychology selection process
 */
export interface PsychologySelectionProcess {
  candidatePrinciples: {
    principle: string;
    reasoning: string;
    dataSupport: string[];
    confidenceScore: number;
  }[];
  selectedPrinciple: string;
  selectionReasoning: string;
  dataPointsThatTriggered: RawDataSource[];
}

/**
 * Topic correlation via embeddings
 */
export interface TopicCorrelation {
  primaryTopic: string;
  relatedTopics: {
    topic: string;
    similarityScore: number;  // Embedding cosine similarity
    source: string;
  }[];
  embeddingModel?: string;
  correlationMethod: string;
}

/**
 * Platform breakdown
 */
export interface PlatformBreakdown {
  platform: string;
  dataPoints: number;
  keyInsights: string[];
  contributionToFinalContent: string;
}

/**
 * Content provenance - tracks how content was built
 */
export interface ContentProvenance {
  /** DEEP PROVENANCE: Raw data sources that triggered this insight */
  rawDataSources?: RawDataSource[];

  /** DEEP PROVENANCE: How psychology principle was selected */
  psychologySelection?: PsychologySelectionProcess;

  /** DEEP PROVENANCE: Topic correlation and embedding analysis */
  topicCorrelation?: TopicCorrelation;

  /** DEEP PROVENANCE: Breakdown by platform */
  platformBreakdown?: PlatformBreakdown[];

  /** DEEP PROVENANCE: Complete decision pipeline */
  decisionPipeline?: {
    step: number;
    action: string;
    input: string;
    output: string;
    reasoning: string;
  }[];

  /** DEEP PROVENANCE: Detailed breakdown of every data point by source */
  detailedDataSources?: {
    source: string;  // e.g., "youtube", "serper", "semrush"
    dataPoints: {
      type: string;  // e.g., "trending_topic", "competitive_gap"
      content: string;
      metadata?: any;
      confidence?: number;
      timestamp?: string;
    }[];
  }[];

  /** Data sources used to generate the insight (legacy, kept for compatibility) */
  dataSourcesUsed: string[];

  /** Psychological trigger that initiated this content */
  psychologyTrigger: string;

  /** Trending topic matched (if any) */
  trendingTopicMatched?: string;

  /** Framework stages and what source fields were used */
  frameworkStagesUsed: {
    stage: string;
    sourceField: string; // Which insight field (contentAngle, whyProfound, evidence, etc.)
    content: string;     // Preview of content generated
  }[];

  /** How each content section was assembled */
  contentAssembly: {
    headline: { source: string; field: string; preview: string };
    hook: { source: string; field: string; preview: string };
    body: { source: string; field: string; preview: string };
    cta: { source: string; field: string; preview: string };
  };

  /** Key decisions made during generation */
  decisions?: {
    whyThisFormat?: string;
    whyThisTone?: string;
    whyThisCTA?: string;
  };
}

/**
 * Complete synapse content
 */
export interface SynapseContent {
  id: string;
  insightId: string;
  format: ContentFormat;

  content: ContentBody;
  psychology: ContentPsychology;
  optimization: ContentOptimization;
  meta: ContentMeta;
  prediction: ContentPrediction;

  // Framework information
  framework?: {
    id: string;
    name: string;
    stages: string[];
    reasoning?: string;
  };

  // Provenance - how this was built
  provenance?: ContentProvenance;

  // Generation metadata
  metadata: {
    generatedAt: Date;
    model: string;
    iterationCount: number;
    impactScore?: number;
  };
}

/**
 * Business profile for content customization
 */
export interface BusinessProfile {
  name: string;
  industry: string;
  targetAudience: string;
  brandVoice: 'professional' | 'casual' | 'authoritative' | 'friendly' | 'edgy';
  contentGoals: ContentGoal[];
  industryProfile?: {
    powerWords?: string[];
    provenCTAs?: string[];
    bestPlatforms?: string[];
  };
}

/**
 * Content goals
 */
export type ContentGoal =
  | 'engagement'
  | 'lead-generation'
  | 'brand-awareness'
  | 'thought-leadership'
  | 'viral-reach';

/**
 * Content generation request
 */
export interface ContentGenerationRequest {
  insight: SynapseInsight;
  score: HolyShitScore;
  business: BusinessProfile;
  formats?: ContentFormat[];
  optimizationLevel?: 'basic' | 'standard' | 'aggressive';
}

/**
 * Content generation result
 */
export interface ContentGenerationResult {
  contents: SynapseContent[];
  topPerformer: SynapseContent;
  stats: {
    totalGenerated: number;
    averageEngagementScore: number;
    averageViralPotential: number;
    formatDistribution: Record<ContentFormat, number>;
  };
  metadata: {
    generationTimeMs: number;
    modelsUsed: string[];
    optimizationApplied: boolean;
  };
}

/**
 * Power word category
 */
export type PowerWordCategory =
  | 'curiosity'
  | 'urgency'
  | 'exclusivity'
  | 'authority'
  | 'transformation'
  | 'emotion'
  | 'specificity';

/**
 * Power word definition
 */
export interface PowerWord {
  word: string;
  category: PowerWordCategory;
  impact: number; // 0-1
  context: string[];
  alternatives?: string[];
}

/**
 * Power word suggestion
 */
export interface PowerWordSuggestion {
  original: string;
  suggestion: string;
  category: PowerWordCategory;
  impact: number;
  reason: string;
}

/**
 * Content optimization opportunity
 */
export interface OptimizationOpportunity {
  location: string;
  phrase: string;
  context: string;
  suggestion: PowerWordSuggestion;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Psychology explanation
 */
export interface PsychologyExplanation {
  principle: PsychologicalPrinciple;
  explanation: string;
  confidenceLevel: number;
  examples: string[];
  expectedOutcome: string;
}

/**
 * Controversy check result
 */
export interface ControversyCheck {
  isControversial: boolean;
  controversyLevel: number; // 0-1
  risky: boolean;
  concerns: string[];
  defensibility: number; // 0-1, how well can this be defended
  suggestions?: string[];
}

/**
 * Format-specific configuration
 */
export interface FormatConfig {
  format: ContentFormat;
  structure: string[];
  minLength: number;
  maxLength: number;
  requiredElements: string[];
  optionalElements: string[];
  toneGuidelines: string[];
}

/**
 * Content draft (before optimization)
 */
export interface ContentDraft {
  format: ContentFormat;
  headline: string;
  hook: string;
  body: string;
  cta: string;
  rawOutput?: string;
}

/**
 * Timing optimization
 */
export interface TimingRecommendation {
  bestPostTime: Date;
  reason: string;
  confidence: number;
  alternativeTimes?: Date[];
}

/**
 * Narrative structure
 */
export type NarrativeStructure =
  | 'Problem → Insight → Solution'
  | 'Setup → Conflict → Resolution'
  | 'Question → Data → Answer'
  | 'Claim → Evidence → Proof'
  | 'Hook → Story → Lesson';

/**
 * Framing device
 */
export type FramingDevice =
  | 'Most believe X, but actually Y'
  | 'Conventional wisdom vs. Reality'
  | 'Before & After transformation'
  | 'Hidden truth revealed'
  | 'Surprising data pattern'
  | 'Personal story with lesson';

/**
 * Content generation options
 */
export interface GenerationOptions {
  /** Maximum number of content pieces to generate */
  maxContent?: number;

  /** Formats to generate */
  formats?: ContentFormat[];

  /** Generate multiple formats per insight */
  multiFormat?: boolean;

  /** Minimum impact score threshold */
  minImpactScore?: number;

  /** Content channel (social, email, blog, landing-page) */
  channel?: 'social' | 'email' | 'blog' | 'landing-page' | 'all';

  /** Primary content goal */
  goal?: 'engagement' | 'conversion' | 'awareness' | 'education' | 'trust-building' | 'lead-generation';

  /** Target platform (for social) */
  platform?: 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'generic';

  /** Use explicit conversion frameworks */
  useFrameworks?: boolean;
}

/**
 * Content generation result
 */
export interface GenerationResult {
  /** Generated content pieces */
  content: SynapseContent[];

  /** Generation statistics */
  stats: {
    totalGenerated: number;
    byFormat: Record<ContentFormat, number>;
    averageScores: {
      engagement: number;
      viral: number;
      leadGen: number;
      brand: number;
    };
    topFormats: ContentFormat[];
  };

  /** Generation metadata */
  metadata: {
    generatedAt: Date;
    processingTimeMs: number;
    insightsProcessed: number;
    contentGenerated: number;
    errors?: string[];
  };
}

/**
 * A/B VARIANT TYPES
 */

/**
 * Variant strategy for A/B testing
 */
export type VariantStrategy =
  | 'scarcity'      // Emphasize limited availability
  | 'fomo'          // Fear of missing out
  | 'exclusivity'   // VIP/exclusive positioning
  | 'urgency'       // Time-sensitive pressure
  | 'social-proof'; // Bandwagon effect

/**
 * Content variant for A/B testing
 */
export interface ContentVariant {
  id: string;
  variantLetter: 'A' | 'B' | 'C';
  strategy: VariantStrategy;
  content: SynapseContent;
  differenceFromOriginal: string[];
}

/**
 * A/B test group
 */
export interface ABTestGroup {
  testId: string;
  originalInsightId: string;
  variants: ContentVariant[];
  recommendedTest: string; // Which variant to test first
}

/**
 * CHARACTER VALIDATION TYPES
 */

/**
 * Platform character limits
 */
export interface PlatformLimits {
  platform: Platform;
  headline: { min: number; max: number; optimal: number };
  body: { min: number; max: number; optimal: number };
  total: { min: number; max: number; optimal: number };
}

/**
 * Character count validation result
 */
export interface CharacterValidation {
  platform: Platform;
  section: 'headline' | 'hook' | 'body' | 'cta' | 'total';
  characterCount: number;
  limit: number;
  optimal: number;
  status: 'valid' | 'warning' | 'error';
  message: string;
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  contentId: string;
  validations: CharacterValidation[];
  overallStatus: 'valid' | 'warning' | 'error';
  recommendations: string[];
}

/**
 * COMPETITOR CONTRARIAN ANGLE TYPES
 */

/**
 * Competitor claim
 */
export interface CompetitorClaim {
  claim: string;
  competitor: string;
  frequency: number; // How often this claim appears
  confidence: number; // 0-1
}

/**
 * Contrarian angle
 */
export interface ContrarianAngle {
  id: string;
  competitorClaim: string;
  contrarianAngle: string;
  reasoning: string;
  evidenceSupport: string[];
  riskLevel: 'low' | 'medium' | 'high';
  differentiationScore: number; // 0-1
}

/**
 * Contrarian detection result
 */
export interface ContrarianDetectionResult {
  insightId: string;
  contrarianAngles: ContrarianAngle[];
  topAngle: ContrarianAngle;
}

/**
 * SECTION REGENERATION TYPES
 */

/**
 * Content section type
 */
export type ContentSection = 'headline' | 'hook' | 'body' | 'cta';

/**
 * Regeneration request
 */
export interface RegenerationRequest {
  contentId: string;
  section: ContentSection;
  currentContent: string;
  improvementDirection?: string; // Optional guidance (e.g., "make it shorter", "add more urgency")
}

/**
 * Regeneration result
 */
export interface RegenerationResult {
  section: ContentSection;
  original: string;
  regenerated: string[];
  selectedIndex?: number;
  reasoning: string;
}

/**
 * Regeneration history
 */
export interface RegenerationHistory {
  contentId: string;
  section: ContentSection;
  history: {
    timestamp: Date;
    original: string;
    regenerated: string;
    reason: string;
  }[];
}
