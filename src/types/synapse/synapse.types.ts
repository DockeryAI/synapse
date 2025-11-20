/**
 * Synapse Insight Type Definitions
 *
 * Types for the Multi-Model Orchestra that uses 4 AI models
 * with specialized prompts to discover synapse insights
 *
 * Created: 2025-11-10
 */

import { Connection } from '../connections.types';
import { DeepContext } from './deepContext.types';

// ============================================================================
// THINKING STYLES
// ============================================================================

export type ThinkingStyle = 'lateral' | 'analytical' | 'creative' | 'cultural';

export type InsightType =
  | 'unexpected_connection'
  | 'counter_intuitive'
  | 'predictive_opportunity'
  | 'deep_psychology'
  | 'cultural_moment'
  | 'hidden_pattern'
  | 'strategic_implication'
  | 'behavioral_contradiction'
  | 'audience'
  | 'differentiator'
  | 'problem'
  | 'service';

// ============================================================================
// AI MODEL CONFIGURATION
// ============================================================================

export interface ModelConfig {
  /** Model identifier (e.g., 'claude-opus-4') */
  model: string;

  /** Temperature for generation (0-1) */
  temperature: number;

  /** What this model is optimized for */
  purpose: string;

  /** Thinking style this model uses */
  thinkingStyle: ThinkingStyle;

  /** Max tokens to generate */
  maxTokens?: number;

  /** API endpoint override */
  endpoint?: string;

  /** Provider (anthropic, openai, google, perplexity) */
  provider: 'anthropic' | 'openai' | 'google' | 'perplexity';
}

export const BREAKTHROUGH_MODELS: Record<ThinkingStyle, ModelConfig> = {
  lateral: {
    model: 'claude-opus-4',
    temperature: 0.9,
    purpose: 'Unexpected connections and metaphors',
    thinkingStyle: 'lateral',
    provider: 'anthropic',
    maxTokens: 2000
  },
  analytical: {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    purpose: 'Deep analysis and hidden patterns',
    thinkingStyle: 'analytical',
    provider: 'openai',
    maxTokens: 2000
  },
  creative: {
    model: 'google/gemini-flash-1.5',
    temperature: 0.8,
    purpose: 'Novel approaches and formats',
    thinkingStyle: 'creative',
    provider: 'google',
    maxTokens: 2000
  },
  cultural: {
    model: 'sonar-pro',
    temperature: 0.6,
    purpose: 'Real-time cultural connections',
    thinkingStyle: 'cultural',
    provider: 'perplexity',
    maxTokens: 2000
  }
};

// ============================================================================
// BREAKTHROUGH INSIGHTS
// ============================================================================

export interface SynapseInsight {
  /** Unique ID */
  id: string;

  /** Type of insight */
  type: InsightType;

  /** Thinking style that generated it */
  thinkingStyle: ThinkingStyle;

  /** The core insight */
  insight: string;

  /** Why this is profound/valuable */
  whyProfound: string;

  /** Why this matters now (timeliness) */
  whyNow: string;

  /** Actionable content angle */
  contentAngle: string;

  /** Expected audience reaction */
  expectedReaction: string;

  /** Supporting evidence */
  evidence: string[];

  /** Confidence score (0-1) */
  confidence: number;

  /** Source connection (if from Connection Discovery Engine) */
  sourceConnection?: Connection;

  /** Raw model output */
  rawOutput?: any;

  /** Metadata */
  metadata: {
    generatedAt: Date;
    model: string;
    tokensUsed?: number;
    generationTimeMs?: number;
  };
}

// ============================================================================
// SPECIALIZED INSIGHT TYPES
// ============================================================================

export interface UnexpectedConnection extends SynapseInsight {
  type: 'unexpected_connection';

  /** What unexpected link was found */
  connection: string;

  /** The bridge between disparate concepts */
  bridge: string;

  /** Why no one else sees this */
  whyUnique: string;
}

export interface CounterIntuitiveInsight extends SynapseInsight {
  type: 'counter_intuitive';

  /** The counter-intuitive truth */
  counterIntuitiveTruth: string;

  /** What conventional wisdom says */
  conventionalWisdom: string;

  /** Why competitors miss this */
  whyCompetitorsMissThis: string;

  /** Strategic implication */
  strategicImplication: string;

  /** Content hook */
  contentHook: string;
}

export interface PredictiveOpportunity extends SynapseInsight {
  type: 'predictive_opportunity';

  /** What will happen */
  whatWillHappen: string;

  /** Why it's coming */
  whyItsComing: string;

  /** Business impact */
  businessImpact: string;

  /** Preparation strategy */
  preparationStrategy: string;

  /** Timing (when to act) */
  timing: 'now' | '2-weeks' | '1-month' | '3-months';
}

export interface DeepPsychology extends SynapseInsight {
  type: 'deep_psychology';

  /** Hidden want they can't articulate */
  hiddenWant: string;

  /** Why they can't say it */
  whyTheyCantSayIt: string;

  /** Real job they're hiring business for */
  realJob: string;

  /** Content strategy to address this */
  contentStrategy: string;

  /** Permission grant needed */
  permissionGrant: string;
}

export interface CulturalMoment extends SynapseInsight {
  type: 'cultural_moment';

  /** Current cultural moment */
  culturalMoment: string;

  /** Bridge to business */
  bridge: string;

  /** Unique angle */
  uniqueAngle: string;

  /** Content concept */
  contentConcept: string;

  /** Authenticity check result */
  authenticityCheck: boolean;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationCheck {
  /** Name of the check */
  name: string;

  /** Did it pass? */
  passed: boolean;

  /** Score (0-1) */
  score: number;

  /** Reason if failed */
  reason?: string;

  /** Details */
  details?: any;
}

export interface ValidationResult {
  /** Overall valid? */
  valid: boolean;

  /** The insight being validated */
  insight: SynapseInsight;

  /** Individual check results */
  checks: ValidationCheck[];

  /** Overall validation score (0-1) */
  score: number;

  /** Reasons for failure */
  reasons: string[];

  /** Suggestions for improvement */
  suggestions?: string[];
}

// ============================================================================
// ORCHESTRATION
// ============================================================================

export interface OrchestrationOptions {
  /** Which models to use */
  models?: ThinkingStyle[];

  /** Maximum insights to return */
  maxInsights?: number;

  /** Minimum confidence threshold */
  minConfidence?: number;

  /** Enable validation */
  enableValidation?: boolean;

  /** Enable insight merging */
  enableMerging?: boolean;

  /** Focus on specific insight types */
  focusTypes?: InsightType[];

  /** Use connections from Connection Discovery Engine as seeds */
  useConnectionSeeds?: boolean;

  /** Maximum connections to use as seeds */
  maxConnectionSeeds?: number;
}

export const DEFAULT_ORCHESTRATION_OPTIONS: Required<OrchestrationOptions> = {
  models: ['lateral', 'analytical', 'creative', 'cultural'],
  maxInsights: 10,
  minConfidence: 0.6,
  enableValidation: true,
  enableMerging: true,
  focusTypes: [],
  useConnectionSeeds: true,
  maxConnectionSeeds: 5
};

export interface OrchestrationResult {
  /** Top insights */
  insights: SynapseInsight[];

  /** Validation results */
  validationResults?: ValidationResult[];

  /** Statistics */
  stats: {
    totalGenerated: number;
    validated: number;
    merged: number;
    rejected: number;
    averageConfidence: number;
    byThinkingStyle: Record<ThinkingStyle, number>;
    byInsightType: Record<InsightType, number>;
  };

  /** Metadata */
  metadata: {
    orchestratedAt: Date;
    processingTimeMs: number;
    modelsUsed: string[];
    totalTokensUsed?: number;
    estimatedCost?: number;
  };
}

// ============================================================================
// PROMPTS
// ============================================================================

export interface PromptTemplate {
  /** Prompt name */
  name: string;

  /** Thinking style */
  thinkingStyle: ThinkingStyle;

  /** Insight type this generates */
  insightType: InsightType;

  /** Build the prompt from context */
  build: (context: DeepContext, seeds?: Connection[]) => string;

  /** Parse model response */
  parse: (response: string) => SynapseInsight[];

  /** Examples for few-shot learning */
  examples?: string[];
}

// ============================================================================
// MODEL INTERFACE
// ============================================================================

export interface AIModelResponse {
  /** Generated text */
  text: string;

  /** Tokens used */
  tokensUsed?: number;

  /** Model used */
  model: string;

  /** Finish reason */
  finishReason?: string;

  /** Raw response */
  raw?: any;
}

export interface AIModelInterface {
  /** Generate text from prompt */
  generate(prompt: string, config: ModelConfig): Promise<AIModelResponse>;

  /** Check if model is available */
  isAvailable(): Promise<boolean>;

  /** Get model info */
  getInfo(): {
    provider: string;
    models: string[];
    rateLimit?: number;
  };
}

// ============================================================================
// INSIGHT RANKING
// ============================================================================

export interface RankingWeights {
  /** Unexpectedness weight */
  unexpectedness: number;

  /** Actionability weight */
  actionability: number;

  /** Timeliness weight */
  timeliness: number;

  /** Evidence quality weight */
  evidence: number;

  /** Convergence weight (how many models agreed) */
  convergence: number;

  /** Confidence weight */
  confidence: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  unexpectedness: 0.25,
  actionability: 0.20,
  timeliness: 0.15,
  evidence: 0.15,
  convergence: 0.15,
  confidence: 0.10
};

export interface RankedInsight extends SynapseInsight {
  /** Ranking score (0-100) */
  rankingScore: number;

  /** Ranking breakdown */
  ranking: {
    unexpectedness: number;
    actionability: number;
    timeliness: number;
    evidence: number;
    convergence: number;
    confidence: number;
  };

  /** Number of models that agreed on similar insight */
  convergence: number;
}

// ============================================================================
// INSIGHT MERGING
// ============================================================================

export interface InsightCluster {
  /** Representative insight */
  representative: SynapseInsight;

  /** Similar insights */
  similar: SynapseInsight[];

  /** Semantic similarity (0-1) */
  similarity: number;

  /** Combined evidence from all */
  mergedEvidence: string[];

  /** Average confidence */
  averageConfidence: number;
}

// All types and constants are already exported inline above
// No need for additional export statements

// ============================================================================
// LEGACY TYPES FOR SYNAPSE-CORE.SERVICE.TS (Psychology Analysis)
// ============================================================================

export type PowerWordCategory =
  | 'urgency'
  | 'exclusivity'
  | 'trust'
  | 'emotion'
  | 'action'
  | 'social'
  | 'authority';

export interface PowerWord {
  word: string;
  category: PowerWordCategory;
  intensity: number;
  emotionalImpact: 'positive' | 'negative' | 'neutral';
}

export interface PowerWordAnalysis {
  totalCount: number;
  density: number;
  byCategory: Record<PowerWordCategory, number>;
  detectedWords: PowerWord[];
  score: number;
  isBalanced: boolean;
  warning?: string;
}

export type EmotionalTriggerType =
  | 'curiosity'
  | 'fear'
  | 'desire'
  | 'belonging'
  | 'achievement'
  | 'trust'
  | 'urgency';

export interface EmotionalTrigger {
  type: EmotionalTriggerType;
  text: string;
  intensity: number;
  position: number;
}

export interface EmotionalTriggerAnalysis {
  triggers: EmotionalTrigger[];
  dominantEmotion: EmotionalTriggerType | null;
  emotionalBalance: Record<EmotionalTriggerType, number>;
  score: number;
}

export interface ReadabilityScore {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  averageSentenceLength: number;
  averageWordLength: number;
  complexWordCount: number;
  level: 'very-easy' | 'easy' | 'moderate' | 'difficult' | 'very-difficult';
  score: number;
}

export type CTAType = 'soft' | 'medium' | 'hard' | 'social';

export interface CallToActionAnalysis {
  hasCTA: boolean;
  ctaText?: string;
  ctaType?: CTAType;
  position: 'start' | 'middle' | 'end' | 'none';
  strength: number;
  clarity: number;
  suggestions: string[];
}

export interface SynapseBreakdown {
  powerWordCount: number;
  emotionalTriggerCount: number;
  sentenceComplexity: number;
  wordCount: number;
  averageWordLength: number;
  fleschReadingEase: number;
  hasUrgency: boolean;
  hasSocialProof: boolean;
  hasAuthority: boolean;
  hasScarcity: boolean;
  hasReciprocity: boolean;
}

export interface SynapseScore {
  overall: number;
  powerWords: number;
  emotionalTriggers: number;
  readability: number;
  callToAction: number;
  urgency: number;
  trust: number;
  breakdown: SynapseBreakdown;
  suggestions: string[];
}

export interface ContentOptimizationRequest {
  content: string;
  targetScore: number;
  focusAreas?: Array<'power-words' | 'emotional' | 'readability' | 'cta'>;
}

export interface OptimizationImprovement {
  type: 'power-word' | 'cta' | 'readability' | 'emotional';
  description: string;
  impact: number;
  position: number;
}

export interface ContentOptimizationResult {
  original: string;
  optimized: string;
  improvements: OptimizationImprovement[];
  scoreBefore: SynapseScore;
  scoreAfter: SynapseScore;
  changesMade: number;
  significantChanges: boolean;
}

export interface SynapseConfig {
  weights: {
    powerWords: number;
    emotionalTriggers: number;
    readability: number;
    callToAction: number;
    urgency: number;
    trust: number;
  };
  thresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  powerWordDensity: {
    min: number;
    max: number;
    optimal: number;
  };
}

export interface ContentQualityIndicator {
  rating: 1 | 2 | 3 | 4 | 5;
  label: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  strengths: string[];
  improvements: string[];
  simpleMetrics: {
    readability: 'Easy' | 'Moderate' | 'Complex';
    engagement: 'Low' | 'Medium' | 'High';
    clarity: 'Unclear' | 'Clear' | 'Very Clear';
  };
}

export function synapseToUserFacing(score: SynapseScore): ContentQualityIndicator {
  const overall = score.overall;

  let rating: 1 | 2 | 3 | 4 | 5;
  let label: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';

  if (overall >= 85) {
    rating = 5;
    label = 'Excellent';
  } else if (overall >= 70) {
    rating = 4;
    label = 'Very Good';
  } else if (overall >= 50) {
    rating = 3;
    label = 'Good';
  } else if (overall >= 30) {
    rating = 2;
    label = 'Fair';
  } else {
    rating = 1;
    label = 'Poor';
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (score.powerWords >= 70) strengths.push('Strong word choice');
  else improvements.push('Use more compelling language');

  if (score.emotionalTriggers >= 70) strengths.push('Good emotional appeal');
  else improvements.push('Add more emotional connection');

  if (score.readability >= 70) strengths.push('Easy to read');
  else improvements.push('Simplify language');

  if (score.callToAction >= 70) strengths.push('Clear call-to-action');
  else improvements.push('Strengthen call-to-action');

  return {
    rating,
    label,
    strengths,
    improvements,
    simpleMetrics: {
      readability: score.readability >= 70 ? 'Easy' : score.readability >= 50 ? 'Moderate' : 'Complex',
      engagement: score.emotionalTriggers >= 70 ? 'High' : score.emotionalTriggers >= 50 ? 'Medium' : 'Low',
      clarity: score.callToAction >= 70 ? 'Very Clear' : score.callToAction >= 50 ? 'Clear' : 'Unclear'
    }
  };
}
