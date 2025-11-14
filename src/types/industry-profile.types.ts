/**
 * INDUSTRY PROFILE TYPES
 *
 * Industry-specific psychology and messaging patterns.
 * Each industry has unique language, pain points, and trust signals.
 *
 * User-facing: "Templates proven to work in your industry"
 * Internal: Psychological optimization per vertical
 */

// ============================================================================
// CORE TYPES
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
