/**
 * Synapse Insight Type Definitions
 *
 * Types for the Multi-Model Orchestra that uses 4 AI models
 * with specialized prompts to discover synapse insights
 *
 * Created: 2025-11-10
 */

import { Connection } from './connections.types';
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
  | 'behavioral_contradiction';

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
