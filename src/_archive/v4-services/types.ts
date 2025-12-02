/**
 * V4 Content Engine Types
 *
 * Simplified types for the V4 content generation engine.
 * Uses UVP-driven content generation with campaign intelligence.
 *
 * Created: 2025-11-26
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// CONTENT SCORING TYPES
// ============================================================================

export type Reaction = 'meh' | 'good' | 'great' | 'holy shit';

export const REACTION_THRESHOLDS: Record<Reaction, number> = {
  'holy shit': 85,
  'great': 70,
  'good': 50,
  'meh': 0
};

export interface ScoringWeights {
  unexpectedness: number;
  truthfulness: number;
  actionability: number;
  uniqueness: number;
  virality: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  unexpectedness: 0.30,
  truthfulness: 0.25,
  actionability: 0.20,
  uniqueness: 0.15,
  virality: 0.10
};

export interface ScoreBreakdown {
  unexpectedness: number;  // 0-30
  truthfulness: number;    // 0-25
  actionability: number;   // 0-20
  uniqueness: number;      // 0-15
  virality: number;        // 0-10
}

export interface EQScoreIntegrated {
  overall: number;           // 0-100 composite
  emotional_resonance: number; // 0-100
  identity_alignment: number;  // 0-100
  urgency_signals: number;     // 0-100
  classification: 'highly-emotional' | 'emotional' | 'balanced' | 'rational' | 'highly-rational';
}

export interface ContentScore {
  total: number;           // 0-100
  breakdown: ScoreBreakdown;
  confidence: number;      // 0-1
  prediction: Reaction;
  reasoning: string[];
  strengths: string[];
  weaknesses: string[];
  eq?: EQScoreIntegrated;  // Optional EQ score integration
}

// ============================================================================
// PSYCHOLOGY FRAMEWORK TYPES
// ============================================================================

export type PsychologyFramework =
  | 'AIDA'      // Attention → Interest → Desire → Action
  | 'PAS'       // Problem → Agitate → Solve
  | 'BAB'       // Before → After → Bridge
  | 'PASTOR'    // Problem → Amplify → Solution → Transformation → Offer → Response
  | 'StoryBrand'// Customer as hero, brand as guide
  | 'CuriosityGap'
  | 'PatternInterrupt'
  | 'SocialProof'
  | 'Scarcity'
  | 'Reciprocity'
  | 'LossAversion'
  | 'Authority' // Expert positioning, thought leadership
  | 'FAB';      // Feature → Advantage → Benefit

export type EmotionalTrigger =
  | 'curiosity'
  | 'fear'
  | 'surprise'
  | 'aspiration'
  | 'validation'
  | 'anger'
  | 'hope'
  | 'urgency';

export interface PsychologyProfile {
  framework: PsychologyFramework;
  primaryTrigger: EmotionalTrigger;
  secondaryTrigger?: EmotionalTrigger;
  intensity: number;  // 0-1
}

// ============================================================================
// CONTENT PILLAR TYPES
// ============================================================================

export type PillarSource =
  | 'target_customer'
  | 'transformation_goal'
  | 'unique_solution'
  | 'key_benefit'
  | 'value_proposition';

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  source: PillarSource;
  contentTypes: string[];
  suggestedFrequency: 'daily' | 'weekly' | 'bi-weekly';
  exampleTopics: string[];
}

// ============================================================================
// CONTENT MIX TYPES
// ============================================================================

export type ContentMixRule = '70-20-10' | '4-1-1' | '5-3-2';

export type ContentMixCategory =
  | 'value'      // Educational, helpful content
  | 'curated'    // Shared from others
  | 'promo'      // Direct promotional
  | 'personal'   // Behind-the-scenes, team
  | 'soft_sell'  // Subtle promotion
  | 'hard_sell'; // Direct CTA

export interface ContentMixConfig {
  rule: ContentMixRule;
  ratios: Record<ContentMixCategory, number>;
}

export const CONTENT_MIX_CONFIGS: Record<ContentMixRule, ContentMixConfig> = {
  '70-20-10': {
    rule: '70-20-10',
    ratios: { value: 70, curated: 20, promo: 10, personal: 0, soft_sell: 0, hard_sell: 0 }
  },
  '4-1-1': {
    rule: '4-1-1',
    ratios: { value: 67, curated: 0, promo: 0, personal: 0, soft_sell: 16, hard_sell: 17 }
  },
  '5-3-2': {
    rule: '5-3-2',
    ratios: { value: 0, curated: 50, promo: 0, personal: 20, soft_sell: 0, hard_sell: 0 }
  }
};

// ============================================================================
// FUNNEL STAGE TYPES
// ============================================================================

export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';

export interface FunnelConfig {
  stage: FunnelStage;
  percentage: number;
  ctaIntensity: 'low' | 'medium' | 'high';
  exampleCTAs: string[];
}

export const FUNNEL_CONFIGS: Record<FunnelStage, FunnelConfig> = {
  TOFU: {
    stage: 'TOFU',
    percentage: 60,
    ctaIntensity: 'low',
    exampleCTAs: ['Learn more', 'Read the guide', 'Follow us']
  },
  MOFU: {
    stage: 'MOFU',
    percentage: 30,
    ctaIntensity: 'medium',
    exampleCTAs: ['Download free guide', 'Join webinar', 'Get template']
  },
  BOFU: {
    stage: 'BOFU',
    percentage: 10,
    ctaIntensity: 'high',
    exampleCTAs: ['Start free trial', 'Book demo', 'Buy now', 'Schedule call']
  }
};

// ============================================================================
// CAMPAIGN TEMPLATE TYPES
// ============================================================================

export type CampaignTemplateType =
  | 'product_launch'
  | 'evergreen'
  | 'awareness_burst'
  | 'authority_builder'
  | 'engagement_drive';

export interface CampaignTemplate {
  type: CampaignTemplateType;
  name: string;
  description: string;
  durationWeeks: number;
  weeklyStructure: CampaignWeek[];
  contentMixRule: ContentMixRule;
  primaryFunnel: FunnelStage;
}

export interface CampaignWeek {
  week: number;
  theme: string;
  funnelStage: FunnelStage;
  contentTypes: string[];
  goals: string[];
}

// ============================================================================
// CONTENT GENERATION TYPES
// ============================================================================

/** Selected insight from the insight cards */
export interface SelectedInsight {
  id: string;
  type: string;
  title: string;
  description?: string;
  category: string;
  confidence: number;
  actionableInsight?: string;
  evidence?: string[];
  sources?: Array<{ source: string; quote: string }>;
}

export interface ContentRequest {
  uvp: CompleteUVP;
  pillar?: ContentPillar;
  framework?: PsychologyFramework;
  platform: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
  contentMixCategory?: ContentMixCategory;
  funnelStage?: FunnelStage;
  tone?: 'professional' | 'casual' | 'authoritative' | 'friendly';
  /** Selected insights from the insight cards to incorporate into content */
  selectedInsights?: SelectedInsight[];
  /** Content topic for semantic insight matching via embeddings */
  contentTopic?: string;
  /** Industry Profile 2.0 - Enhanced industry data with hooks, templates, psychology */
  enhancedIndustryProfile?: {
    industry_name: string;
    hook_library: {
      number_hooks?: string[];
      question_hooks?: string[];
      story_hooks?: string[];
      fear_hooks?: string[];
      howto_hooks?: string[];
    };
    power_words: string[];
    avoid_words: string[];
    headline_templates: { template: string; context: string }[];
    customer_triggers: { trigger: string; urgency: number }[];
    transformations: { from: string; to: string; emotional_value: string }[];
    content_templates?: {
      linkedin?: {
        educational?: { hook: string; body: string; cta: string };
        authority?: { hook: string; body: string; cta: string };
        case_study?: { hook: string; body: string; cta: string };
      };
    };
  };
}

export interface GeneratedContent {
  id: string;
  headline: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  score: ContentScore;
  psychology: PsychologyProfile;
  mixCategory: ContentMixCategory;
  funnelStage: FunnelStage;
  pillarId?: string;
  contentHash?: string;  // For deduplication across sessions
  metadata: {
    generatedAt: Date;
    model: string;
    platform: string;
    characterCount: number;
  };
}

// ============================================================================
// PROMPT TYPES
// ============================================================================

export type PromptCategory =
  | 'lateral_thinking'
  | 'counter_intuitive'
  | 'predictive'
  | 'deep_psychology'
  | 'cultural_moment'
  | 'pattern_recognition';

export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  framework: PsychologyFramework;
  template: string;
  variables: string[];
  outputFormat: string;
}

// ============================================================================
// POWER WORD TYPES
// ============================================================================

export type PowerWordCategory =
  | 'curiosity'
  | 'urgency'
  | 'transformation'
  | 'authority'
  | 'emotion'
  | 'exclusivity';

export interface PowerWord {
  word: string;
  category: PowerWordCategory;
  impact: number;  // 0-1
  context: string[];
  alternatives: string[];
}

// ============================================================================
// MODE TYPES
// ============================================================================

export interface EasyModeConfig {
  autoSelectPillars: boolean;
  autoSelectFramework: boolean;
  autoApplyMixRules: boolean;
  defaultCampaignTemplate: CampaignTemplateType;
}

export interface PowerModeConfig {
  selectedPillars: string[];
  selectedFramework: PsychologyFramework;
  selectedMixRule: ContentMixRule;
  selectedFunnelStages: FunnelStage[];
  customTone: string;
}
