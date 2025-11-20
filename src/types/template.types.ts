/**
 * TEMPLATE TYPES
 *
 * Content template system for generating social media posts.
 * Templates are psychology-optimized structures that work across industries.
 *
 * User sees: "Proven templates"
 * We know: Psychology-optimized structures with trigger placement
 */

import type { SynapseScore } from './synapse/synapse.types';

// ============================================================================
// CORE TEMPLATE TYPES
// ============================================================================

export interface Template {
  id: string;
  name: string; // User-friendly name: "Special Announcement"
  description: string; // What it does: "Share exciting news with your audience"

  // Structure
  structure: TemplateStructure;
  variables: TemplateVariable[]; // What data we need

  // Classification
  contentType: ContentType;
  industryTags: string[]; // Which industries this works best for
  platform: Platform[]; // Which social platforms

  // Psychology (hidden)
  psychologyTags?: {
    primaryTrigger: string; // curiosity, urgency, etc.
    secondaryTriggers: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    conversionPotential: 'low' | 'medium' | 'high';
  };

  // Pre-calculated performance
  averageSynapseScore?: number; // Historical average
  useCount?: number; // How many times used

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export type ContentType =
  | 'promotional'   // Selling something
  | 'educational'   // Teaching something
  | 'community'     // Building relationships
  | 'authority'     // Establishing expertise
  | 'announcement'  // Sharing news
  | 'engagement';   // Getting interaction

export type Platform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok';

// ============================================================================
// TEMPLATE STRUCTURE
// ============================================================================

export type TemplateStructure =
  | 'authority'       // "5 Things Experts Know"
  | 'list'            // "Top 10 Benefits"
  | 'announcement'    // "We're excited to share..."
  | 'offer'           // "[Benefit] - [Offer] - [Urgency]"
  | 'transformation'  // "From Problem to Solution"
  | 'faq'             // "You asked: [Question]..."
  | 'storytelling'    // Narrative format
  | 'testimonial';    // Customer success

// ============================================================================
// TEMPLATE VARIABLES
// ============================================================================

export interface TemplateVariable {
  key: string; // {{business_name}}
  label: string; // "Business Name"
  required: boolean;
  defaultValue?: string;
  fallback?: string; // What to use if missing
  type: VariableType;
}

export type VariableType =
  | 'text'      // Any text
  | 'number'    // Numeric value
  | 'currency'  // Money amount
  | 'percent'   // Percentage
  | 'date'      // Date/time
  | 'list'      // Array of items
  | 'boolean';  // Yes/no

// Common variables used across templates
export const COMMON_VARIABLES = {
  BUSINESS_NAME: '{{business_name}}',
  BUSINESS_TYPE: '{{business_type}}',
  LOCATION: '{{location}}',
  OFFER: '{{offer}}',
  BENEFIT: '{{benefit}}',
  URGENCY: '{{urgency}}',
  CTA: '{{cta}}',
  PROBLEM: '{{problem}}',
  SOLUTION: '{{solution}}',
  NUMBER: '{{number}}',
  TOPIC: '{{topic}}',
  QUESTION: '{{question}}',
  ANSWER: '{{answer}}',
  TESTIMONIAL: '{{testimonial}}',
  CUSTOMER_NAME: '{{customer_name}}',
} as const;

// ============================================================================
// TEMPLATE CONTENT
// ============================================================================

export interface TemplateContent {
  templateId: string;

  // Content parts
  headline?: string;
  body: string;
  cta?: string;
  hashtags?: string[];

  // Populated variables
  variables: Record<string, string>;

  // Metadata
  contentType: ContentType;
  platform: Platform;

  // Quality
  synapseScore?: SynapseScore;
  characterCount: number;
  wordCount: number;
}

// ============================================================================
// TEMPLATE SELECTION
// ============================================================================

export interface TemplateSelectionCriteria {
  industryId?: string;
  contentType?: ContentType | ContentType[];
  platform?: Platform | Platform[];
  minScore?: number; // Minimum Synapse score
  excludeIds?: string[]; // Templates to exclude
  limit?: number; // How many to return

  // Priority
  prioritize?: 'performance' | 'variety' | 'recent';
}

export interface TemplateMatch {
  template: Template;
  score: number; // 0-100 match confidence
  reason: string; // Why this template was selected
}

// ============================================================================
// TEMPLATE POPULATION
// ============================================================================

export interface TemplatePopulationData {
  // Brand basics
  businessName: string;
  businessType: string;
  industry: string;
  location?: string;

  // Value proposition
  uvp?: string;
  benefits?: string[];
  features?: string[];

  // Offers & promotions
  currentOffer?: string;
  ctaText?: string;

  // Content themes (from industry profile)
  contentThemes?: string[];
  powerWords?: string[];

  // Custom data
  customData?: Record<string, any>;
}

export interface PopulatedTemplate {
  template: Template;
  content: TemplateContent;
  populatedText: string;
  missingVariables: string[]; // Variables that couldn't be filled
  synapseScore?: SynapseScore;
}

// ============================================================================
// TEMPLATE GENERATION OPTIONS
// ============================================================================

export interface TemplateGenerationOptions {
  // What to generate
  count: number; // How many posts
  dateRange?: { start: Date; end: Date };

  // How to generate
  distribution?: ContentTypeDistribution;
  variety?: 'high' | 'medium' | 'low'; // Template reuse

  // Quality control
  minSynapseScore?: number;
  maxRetries?: number;

  // AI enhancement
  enhanceWithAI?: boolean;
  aiModel?: 'claude' | 'gpt-4';
}

export interface ContentTypeDistribution {
  promotional: number; // Percentage
  educational: number;
  community: number;
  authority: number;
  announcement: number;
  engagement: number;
}

// Default distribution (balanced approach)
export const DEFAULT_DISTRIBUTION: ContentTypeDistribution = {
  promotional: 30,
  educational: 25,
  community: 20,
  authority: 15,
  announcement: 5,
  engagement: 5,
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export interface TemplateRegistry {
  templates: Template[];

  getById(id: string): Template | undefined;
  getByStructure(structure: TemplateStructure): Template[];
  search(criteria: TemplateSelectionCriteria): TemplateMatch[];

  // Statistics
  getTotalCount(): number;
  getByIndustry(industryId: string): Template[];
  getMostUsed(limit: number): Template[];
}
