/**
 * Template Types for Dashboard V2
 * Data models for content and campaign templates
 */

import type { EmotionalTrigger, CampaignArc } from './campaign.types';
import type { ContentPurpose, DataPointType } from './content.types';

export type TemplateType = 'content' | 'campaign';

export enum ContentTemplateCategory {
  HOOK_BASED = 'hook_based',
  PROBLEM_SOLUTION = 'problem_solution',
  STORY_BASED = 'story_based',
  EDUCATIONAL = 'educational',
  URGENCY = 'urgency',
  AUTHORITY = 'authority',
  ENGAGEMENT = 'engagement'
}

export enum CampaignTemplateCategory {
  CORE_JOURNEY = 'core_journey',
  LAUNCH = 'launch',
  AUTHORITY = 'authority',
  CONVERSION = 'conversion'
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  source?: DataPointType;
}

export interface TemplatePerformanceMetrics {
  expectedCTRImprovement: number; // percentage, e.g., 27-52
  expectedEngagementMultiplier: number;
  expectedRecallImprovement?: number; // for story templates
  expectedROI?: number; // for campaign templates
  confidenceLevel: 'high' | 'medium' | 'low';
  basedOnSampleSize: number;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'content';
  category: ContentTemplateCategory;
  structure: TemplateStructure;
  variables: TemplateVariable[];
  emotionalTriggers: EmotionalTrigger[];
  bestFor: ContentPurpose[];
  dataPointMatches: DataPointType[];
  performanceMetrics: TemplatePerformanceMetrics;
  example?: string;
  industry?: string; // if industry-specific
}

export interface TemplateStructure {
  sections: TemplateSection[];
  format: string;
  wordCountRange: {
    min: number;
    max: number;
  };
}

export interface TemplateSection {
  id: string;
  name: string;
  order: number;
  required: boolean;
  promptTemplate: string;
  variables: string[];
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  type: 'campaign';
  category: CampaignTemplateCategory;
  arc: CampaignArc;
  pieceCount: number;
  durationDays: number;
  emotionalProgression: EmotionalTrigger[];
  bestFor: ContentPurpose[];
  performanceMetrics: TemplatePerformanceMetrics;
  industry?: string;
}

export interface TemplateMatch {
  templateId: string;
  templateName: string;
  matchScore: number;
  matchReasons: string[];
  performancePrediction: TemplatePerformanceMetrics;
}

export interface TemplateSelectionCriteria {
  connectionType: 'two_way' | 'three_way' | 'multi_way';
  dataPointTypes: DataPointType[];
  breakthroughScore?: number;
  purpose?: ContentPurpose;
  industryCode?: string;
}

export interface TemplateRegistry {
  contentTemplates: Map<string, ContentTemplate>;
  campaignTemplates: Map<string, CampaignTemplate>;
  getTemplate(id: string): ContentTemplate | CampaignTemplate | undefined;
  getTemplatesByCategory(category: ContentTemplateCategory | CampaignTemplateCategory): (ContentTemplate | CampaignTemplate)[];
  findBestMatch(criteria: TemplateSelectionCriteria): TemplateMatch[];
}

// Template IDs for reference
export const CONTENT_TEMPLATE_IDS = {
  // Hook-based
  CURIOSITY_GAP: 'curiosity_gap',
  PATTERN_INTERRUPT: 'pattern_interrupt',
  SPECIFIC_NUMBER: 'specific_number',
  CONTRARIAN: 'contrarian',
  // Problem-Solution
  MISTAKE_EXPOSER: 'mistake_exposer',
  HIDDEN_COST: 'hidden_cost',
  QUICK_WIN: 'quick_win',
  // Story-based
  TRANSFORMATION: 'transformation',
  FAILURE_TO_SUCCESS: 'failure_to_success',
  BEHIND_THE_SCENES: 'behind_the_scenes',
  // Educational
  MYTH_BUSTER: 'myth_buster',
  GUIDE_SNIPPET: 'guide_snippet',
  COMPARISON: 'comparison',
  // Urgency
  TREND_JACKER: 'trend_jacker',
  DEADLINE_DRIVER: 'deadline_driver',
  SEASONAL: 'seasonal',
  // Authority
  DATA_REVELATION: 'data_revelation',
  EXPERT_ROUNDUP: 'expert_roundup',
  CASE_STUDY: 'case_study',
  // Engagement
  CHALLENGE_POST: 'challenge_post'
} as const;

export const CAMPAIGN_TEMPLATE_IDS = {
  // Core Journey
  RACE_JOURNEY: 'race_journey',
  PAS_SERIES: 'pas_series',
  BAB_CAMPAIGN: 'bab_campaign',
  TRUST_LADDER: 'trust_ladder',
  HEROS_JOURNEY: 'heros_journey',
  // Launch
  PRODUCT_LAUNCH: 'product_launch',
  SEASONAL_URGENCY: 'seasonal_urgency',
  // Authority
  AUTHORITY_BUILDER: 'authority_builder',
  COMPARISON_CAMPAIGN: 'comparison_campaign',
  EDUCATION_FIRST: 'education_first',
  // Conversion
  SOCIAL_PROOF: 'social_proof',
  OBJECTION_CRUSHER: 'objection_crusher',
  QUICK_WIN_CAMPAIGN: 'quick_win_campaign',
  SCARCITY_SEQUENCE: 'scarcity_sequence',
  VALUE_STACK: 'value_stack'
} as const;

export type ContentTemplateId = typeof CONTENT_TEMPLATE_IDS[keyof typeof CONTENT_TEMPLATE_IDS];
export type CampaignTemplateId = typeof CAMPAIGN_TEMPLATE_IDS[keyof typeof CAMPAIGN_TEMPLATE_IDS];
