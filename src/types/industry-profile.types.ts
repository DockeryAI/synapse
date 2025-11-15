/**
 * INDUSTRY PROFILE TYPES
 *
 * Industry-specific psychology and messaging patterns.
 * Each industry has unique language, pain points, and trust signals.
 *
 * User-facing: "Templates proven to work in your industry"
 * Internal: Psychological optimization per vertical
 */

import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS FOR 40-FIELD OPUS-GENERATED PROFILES
// ============================================================================

// NAICS Detection & Mapping
export const NAICSCandidateSchema = z.object({
  naics_code: z.string().regex(/^\d{2,6}$/, 'NAICS code must be 2-6 digits'),
  display_name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  keywords: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional()
});

export type NAICSCandidate = z.infer<typeof NAICSCandidateSchema>;

export const NAICSMappingSchema = z.object({
  user_input: z.string().min(1).max(500),
  naics_code: z.string().regex(/^\d{2,6}$/),
  display_name: z.string().min(1).max(200),
  confidence: z.number().min(0).max(1),
  created_at: z.string().datetime().optional(),
  usage_count: z.number().int().min(0).default(1)
});

export type NAICSMapping = z.infer<typeof NAICSMappingSchema>;

// Generation Progress
export const GenerationProgressSchema = z.object({
  stage: z.enum([
    'research',
    'psychology',
    'market',
    'messaging',
    'operational',
    'validation',
    'generating',
    'saving',
    'complete',
    'error'
  ]),
  progress: z.number().min(0).max(100),
  message: z.string().min(1).max(500),
  estimatedTimeRemaining: z.number().min(0), // seconds
  currentField: z.string().optional()
});

export type GenerationProgress = z.infer<typeof GenerationProgressSchema>;
export type ProgressCallback = (progress: GenerationProgress) => void;

// 40-Field Complete Profile Schema
export const IndustryProfileFullSchema = z.object({
  // CORE IDENTIFICATION (5 fields)
  industry: z.string().min(1).max(200),
  industry_name: z.string().min(1).max(200),
  naics_code: z.string().regex(/^\d{2,6}$/),
  category: z.string().min(1).max(100),
  subcategory: z.string().min(1).max(100).optional(),

  // CUSTOMER PSYCHOLOGY & TRIGGERS (8 fields)
  customer_triggers: z.array(z.union([z.string(), z.any()])).min(5), // Flexible for nested objects
  customer_journey: z.string().min(100),
  transformations: z.array(z.union([z.string(), z.any()])).min(5),
  success_metrics: z.array(z.string()).min(5),
  urgency_drivers: z.array(z.string()).min(5),
  objection_handlers: z.array(z.union([z.string(), z.any()])).min(5),
  risk_reversal: z.array(z.string()).min(3),
  customer_language_dictionary: z.array(z.string()).min(20),

  // VALUE PROPOSITION & DIFFERENTIATION (7 fields)
  value_propositions: z.array(z.string()).min(5),
  differentiators: z.array(z.string()).min(5),
  competitive_advantages: z.array(z.string()).min(3),
  pricing_strategies: z.array(z.string()).min(2),
  service_delivery_models: z.array(z.string()).min(2),
  unique_selling_propositions: z.array(z.string()).min(3),
  brand_positioning_templates: z.array(z.string()).min(2),

  // MESSAGING & COMMUNICATION (9 fields)
  power_words: z.array(z.string()).min(20),
  avoid_words: z.array(z.string()).min(10),
  headline_templates: z.array(z.string()).min(10),
  call_to_action_templates: z.array(z.string()).min(8),
  email_subject_line_templates: z.array(z.string()).min(10),
  social_media_hooks: z.array(z.string()).min(15),
  pain_point_language: z.array(z.string()).min(5),
  solution_language: z.array(z.string()).min(5),
  proof_point_frameworks: z.array(z.string()).min(3),

  // MARKET INTELLIGENCE (6 fields)
  seasonal_patterns: z.array(z.union([z.string(), z.any()])).min(3),
  geographic_variations: z.array(z.string()).min(2),
  demographic_insights: z.array(z.union([z.string(), z.any()])).min(3),
  psychographic_profiles: z.array(z.union([z.string(), z.any()])).min(2),
  market_trends: z.array(z.string()).min(3),
  innovation_opportunities: z.array(z.string()).min(2),

  // OPERATIONAL CONTEXT (5 fields)
  typical_business_models: z.array(z.string()).min(2),
  common_challenges: z.array(z.string()).min(3),
  growth_strategies: z.array(z.string()).min(3),
  technology_stack_recommendations: z.array(z.string()).min(3),
  industry_associations_resources: z.array(z.string()).min(2),

  // METADATA
  generated_on_demand: z.boolean().optional().default(true),
  generated_at: z.string().datetime().optional(),
  profile_version: z.string().default('1.0')
});

export type IndustryProfileFull = z.infer<typeof IndustryProfileFullSchema>;

// Validation Helper Functions
export function validateIndustryProfile(data: unknown): IndustryProfileFull {
  try {
    return IndustryProfileFullSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Industry profile validation failed: ${issues}`);
    }
    throw error;
  }
}

export function validateNAICSCandidate(data: unknown): NAICSCandidate {
  try {
    return NAICSCandidateSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`NAICS candidate validation failed: ${issues}`);
    }
    throw error;
  }
}

// ============================================================================
// LEGACY CORE TYPES (Keep for backward compatibility)
// ============================================================================

export interface CustomerSegment {
  name: string;
  description: string;
  demographics: {
    ageRange: string;
    incomeRange: string;
    locationType: string;
    occupation: string;
  };
  painPoints: string[];
  goals: string[];
  buyingTriggers: string[];
}

export interface IndustryProfile {
  id: string;
  name: string;
  naicsCode?: string; // Optional link to NAICS data

  // Audience
  targetAudience: string;
  audienceCharacteristics: string[]; // Demographics, psychographics

  // Customer segments (multiple typical buyer personas for this industry)
  customerSegments?: CustomerSegment[];

  // Pain points (what keeps them up at night)
  commonPainPoints: string[];

  // Buying triggers (what prompts them to take action)
  commonBuyingTriggers: string[];

  // Trust signals (but we call them "what works")
  trustBuilders: string[];

  // Language optimization
  powerWords: string[]; // Industry-specific compelling words
  avoidWords: string[]; // Words that hurt trust/engagement
  toneGuidelines: string;

  // Content strategy
  contentThemes: string[]; // What to post about
  postingFrequency: {
    optimal: number; // Posts per week
    minimum: number;
    maximum: number;
  };

  // Timing (when audience is most active)
  bestPostingTimes: {
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    hourOfDay: number; // 0-23
  }[];

  // Psychology profile (hidden from users)
  psychologyProfile: {
    primaryTriggers: EmotionalTriggerType[]; // Most effective triggers
    secondaryTriggers: EmotionalTriggerType[];
    buyerJourneyStage: 'awareness' | 'consideration' | 'decision'; // Typical stage
    decisionDrivers: string[]; // What makes them choose
    urgencyLevel: 'low' | 'medium' | 'high'; // How much urgency to use
    trustImportance: 'low' | 'medium' | 'high'; // How much trust building needed
  };
}

export type EmotionalTriggerType =
  | 'curiosity'
  | 'fear'
  | 'desire'
  | 'belonging'
  | 'achievement'
  | 'trust'
  | 'urgency';

// ============================================================================
// CONTENT THEMES
// ============================================================================

export interface ContentTheme {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional'; // How often to post
  examples: string[];

  // Psychology (hidden)
  primaryEmotion: EmotionalTriggerType;
  conversionPotential: 'low' | 'medium' | 'high';
}

// ============================================================================
// INDUSTRY REGISTRY
// ============================================================================

export interface IndustryRegistry {
  industries: IndustryProfile[];
  getById(id: string): IndustryProfile | undefined;
  getByNaics(naicsCode: string): IndustryProfile | undefined;
  getAllIds(): string[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Industry-specific template variant
 * Links a universal template to industry-specific language
 */
export interface IndustryTemplateVariant {
  industryId: string;
  templateId: string;
  customizations: {
    headline?: string;
    body?: string;
    cta?: string;
    powerWords?: string[]; // Industry-specific replacements
  };
  synapseScore?: number; // Pre-calculated score for this variant
}

/**
 * Industry match result
 * When we analyze a brand and determine their industry
 */
export interface IndustryMatch {
  industryId: string;
  confidence: number; // 0-100
  reasons: string[];
  suggestedProfile: IndustryProfile;
}
