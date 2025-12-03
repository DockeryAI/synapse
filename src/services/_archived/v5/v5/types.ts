/**
 * V5 Content Engine Types
 *
 * Psychology-first content generation with template-driven approach.
 * Templates first, AI enhances, psychology gates quality.
 *
 * Created: 2025-12-01
 */

// ============================================================================
// CUSTOMER CATEGORIES - The 6 buyer types from Triggers Build Plan
// ============================================================================

export type CustomerCategory =
  | 'pain-driven'        // Immediate problem needing solution
  | 'aspiration-driven'  // Desire for transformation/status
  | 'trust-seeking'      // Need validation before commitment
  | 'convenience-driven' // Path of least resistance
  | 'value-driven'       // ROI and outcome focus
  | 'community-driven';  // Belonging and shared identity

export interface CustomerCategoryMapping {
  category: CustomerCategory;
  description: string;
  templateFocus: string[];
  psychologyEmphasis: string[];
  scoringWeights: Partial<ScoringWeights>;
}

export const CUSTOMER_CATEGORY_MAPPINGS: Record<CustomerCategory, CustomerCategoryMapping> = {
  'pain-driven': {
    category: 'pain-driven',
    description: 'Immediate problem needing solution',
    templateFocus: ['problem-agitate-solve', 'urgency', 'relief'],
    psychologyEmphasis: ['urgency', 'fear', 'relief'],
    scoringWeights: { urgency: 0.20, emotionalTriggers: 0.30 },
  },
  'aspiration-driven': {
    category: 'aspiration-driven',
    description: 'Desire for transformation/status',
    templateFocus: ['before-after', 'transformation', 'identity'],
    psychologyEmphasis: ['aspiration', 'identity', 'belonging'],
    scoringWeights: { emotionalTriggers: 0.30, powerWords: 0.25 },
  },
  'trust-seeking': {
    category: 'trust-seeking',
    description: 'Need validation before commitment',
    templateFocus: ['authority', 'testimonial', 'faq'],
    psychologyEmphasis: ['credibility', 'proof', 'authority'],
    scoringWeights: { trust: 0.25, readability: 0.20 },
  },
  'convenience-driven': {
    category: 'convenience-driven',
    description: 'Path of least resistance',
    templateFocus: ['list', 'how-to', 'quick-tip'],
    psychologyEmphasis: ['simplicity', 'speed', 'ease'],
    scoringWeights: { readability: 0.25, cta: 0.20 },
  },
  'value-driven': {
    category: 'value-driven',
    description: 'ROI and outcome focus',
    templateFocus: ['offer', 'comparison', 'roi'],
    psychologyEmphasis: ['logic', 'proof', 'value'],
    scoringWeights: { cta: 0.20, trust: 0.15 },
  },
  'community-driven': {
    category: 'community-driven',
    description: 'Belonging and shared identity',
    templateFocus: ['story', 'engagement', 'behind-scenes'],
    psychologyEmphasis: ['belonging', 'connection', 'identity'],
    scoringWeights: { emotionalTriggers: 0.25, readability: 0.20 },
  },
};

// ============================================================================
// PLATFORM TYPES
// ============================================================================

export type Platform = 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok';

export interface PlatformConstraints {
  platform: Platform;
  characterLimit: number;
  hashtagCount: { min: number; max: number };
  ctaStyle: 'professional' | 'conversational' | 'direct' | 'energetic';
  formatNotes: string;
}

export const PLATFORM_CONSTRAINTS: Record<Platform, PlatformConstraints> = {
  linkedin: {
    platform: 'linkedin',
    characterLimit: 3000,
    hashtagCount: { min: 3, max: 5 },
    ctaStyle: 'professional',
    formatNotes: 'Line breaks matter, thought leadership focus',
  },
  facebook: {
    platform: 'facebook',
    characterLimit: 500,
    hashtagCount: { min: 3, max: 5 },
    ctaStyle: 'conversational',
    formatNotes: 'Community-focused, can be longer',
  },
  instagram: {
    platform: 'instagram',
    characterLimit: 2200,
    hashtagCount: { min: 10, max: 15 },
    ctaStyle: 'conversational',
    formatNotes: 'Visual reference, emoji acceptable',
  },
  twitter: {
    platform: 'twitter',
    characterLimit: 280,
    hashtagCount: { min: 2, max: 3 },
    ctaStyle: 'direct',
    formatNotes: 'Punchy, thread support later',
  },
  tiktok: {
    platform: 'tiktok',
    characterLimit: 150,
    hashtagCount: { min: 5, max: 8 },
    ctaStyle: 'energetic',
    formatNotes: 'Hook-first, script format',
  },
};

// ============================================================================
// CONTENT TYPES
// ============================================================================

export type ContentType = 'promotional' | 'educational' | 'community' | 'authority' | 'engagement';

export interface ContentTypeDistribution {
  promotional: number;  // percentage
  educational: number;
  community: number;
}

export const DEFAULT_CONTENT_DISTRIBUTION: ContentTypeDistribution = {
  promotional: 40,
  educational: 35,
  community: 25,
};

// ============================================================================
// PSYCHOLOGY EXTRACTION - What we extract from industry profiles
// ============================================================================

export interface IndustryPsychology {
  industrySlug: string;
  industryName: string;
  naicsCode: string;

  // Core psychology elements
  powerWords: string[];
  avoidWords: string[];
  customerTriggers: CustomerTrigger[];
  urgencyDrivers: string[];
  transformations: Transformation[];

  // Hook library
  hookLibrary: HookLibrary;

  // Templates (extracted from profile)
  contentTemplates: ContentTemplateLibrary;

  // Metadata
  loadedAt: Date;
}

export interface CustomerTrigger {
  trigger: string;
  urgency: number;  // 1-10
  frequency?: string;
}

export interface Transformation {
  from: string;
  to: string;
  emotionalValue: string;
}

export interface HookLibrary {
  numberHooks: string[];
  questionHooks: string[];
  storyHooks: string[];
  fearHooks: string[];
  howtoHooks: string[];
  curiosityHooks?: string[];
  authorityHooks?: string[];
}

export interface ContentTemplateLibrary {
  linkedin?: PlatformTemplates;
  facebook?: PlatformTemplates;
  instagram?: PlatformTemplates;
  twitter?: PlatformTemplates;
  tiktok?: VideoTemplates;
}

export interface PlatformTemplates {
  educational?: ContentTemplate;
  authority?: ContentTemplate;
  promotional?: ContentTemplate;
  engagement?: ContentTemplate;
  caseStudy?: ContentTemplate;
}

export interface ContentTemplate {
  hook: string;
  body?: string;
  cta: string;
  framework?: string;
}

export interface VideoTemplates {
  educational?: VideoTemplate;
  authority?: VideoTemplate;
  promotional?: VideoTemplate;
}

export interface VideoTemplate {
  hook: string;
  script: string;
  cta?: string;
  framework?: string;
}

// ============================================================================
// UVP VARIABLES - Template substitution variables from brand data
// ============================================================================

export interface UVPVariables {
  // Core UVP fields
  businessName: string;
  targetCustomer: string;
  transformation: string;
  uniqueSolution: string;
  keyBenefit: string;
  differentiator: string;

  // Optional enrichment
  industry?: string;
  location?: string;
  offers?: string[];
  brandVoice?: string;

  // Intelligence variables (ONE per source)
  trend?: string;           // From trends API
  competitiveEdge?: string; // From competitor analysis
  proofPoint?: string;      // From testimonials/reviews
}

// ============================================================================
// SCORING TYPES - V1-style 6-dimension psychology scoring
// ============================================================================

export interface ScoringWeights {
  powerWords: number;       // 20% default
  emotionalTriggers: number; // 25% default
  readability: number;      // 20% default
  cta: number;              // 15% default
  urgency: number;          // 10% default
  trust: number;            // 10% default
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  powerWords: 0.20,
  emotionalTriggers: 0.25,
  readability: 0.20,
  cta: 0.15,
  urgency: 0.10,
  trust: 0.10,
};

export interface ScoreBreakdown {
  powerWords: number;       // 0-100
  emotionalTriggers: number; // 0-100
  readability: number;      // 0-100
  cta: number;              // 0-100
  urgency: number;          // 0-100
  trust: number;            // 0-100
}

export type QualityTier = 'excellent' | 'great' | 'good' | 'fair' | 'poor';

export interface ContentScore {
  total: number;            // 0-100
  breakdown: ScoreBreakdown;
  tier: QualityTier;
  passed: boolean;          // Score >= 75
  hints: string[];          // Improvement hints if failed
}

export const QUALITY_THRESHOLDS: Record<QualityTier, { min: number; max: number }> = {
  excellent: { min: 85, max: 100 },
  great: { min: 75, max: 84 },
  good: { min: 65, max: 74 },
  fair: { min: 50, max: 64 },
  poor: { min: 0, max: 49 },
};

// ============================================================================
// TEMPLATE TYPES - Universal template structure
// ============================================================================

export type TemplateStructure =
  | 'authority'
  | 'list'
  | 'offer'
  | 'transformation'
  | 'faq'
  | 'storytelling'
  | 'testimonial'
  | 'announcement'
  | 'how-to'
  | 'engagement';

export interface UniversalTemplate {
  id: string;
  structure: TemplateStructure;
  contentType: ContentType;
  platform: Platform;
  template: string;  // Contains {{variable}} placeholders
  psychologyTags: {
    primaryTrigger: string;
    secondaryTriggers: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
  };
  customerCategories: CustomerCategory[];
  averageScore?: number;
}

// ============================================================================
// GENERATION TYPES - Request and response
// ============================================================================

export interface V5GenerationRequest {
  platform: Platform;
  contentType?: ContentType;
  customerCategory?: CustomerCategory;

  // Context
  brandId?: string;
  industrySlug?: string;

  // Pre-loaded data (optional - will be fetched if not provided)
  uvpVariables?: UVPVariables;
  industryPsychology?: IndustryPsychology;
  eqScore?: number;

  // Options
  templateId?: string;      // Force specific template
  maxRetries?: number;      // Default: 2
  skipAI?: boolean;         // Return populated template without AI enhancement
}

export interface V5GeneratedContent {
  id: string;
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];

  // Scoring
  score: ContentScore;

  // Metadata
  metadata: {
    templateId: string;
    templateStructure: TemplateStructure;
    platform: Platform;
    contentType: ContentType;
    customerCategory: CustomerCategory;
    generatedAt: Date;
    attempts: number;
    aiModel?: string;
    characterCount: number;
  };
}

// ============================================================================
// EQ INTEGRATION TYPES
// ============================================================================

export interface EQProfile {
  score: number;            // 0-100
  emotionalResonance: number;
  identityAlignment: number;
  urgencySignals: number;
  classification: 'highly-emotional' | 'emotional' | 'balanced' | 'rational' | 'highly-rational';
  customerCategory: CustomerCategory;  // Mapped from EQ analysis
  emotionalTemperature: 'hot' | 'warm' | 'neutral' | 'cool';
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IIndustryProfileService {
  loadPsychology(industrySlug: string): Promise<IndustryPsychology | null>;
  findBestMatch(options: { naicsCode?: string; industryName?: string; keywords?: string[] }): Promise<string | null>;
  getPowerWords(industrySlug: string): Promise<string[]>;
  getHooks(industrySlug: string, type?: keyof HookLibrary): Promise<string[]>;
}

export interface IUVPProviderService {
  getVariables(brandId: string): Promise<UVPVariables | null>;
  formatForTemplate(uvp: UVPVariables): Record<string, string>;
}

export interface IEQIntegrationService {
  getProfile(eqScore: number, industrySlug?: string): EQProfile;
  mapToCustomerCategory(eqScore: number): CustomerCategory;
  getEmotionalTemperature(eqScore: number): EQProfile['emotionalTemperature'];
}

export interface ITemplateService {
  selectTemplate(options: {
    platform: Platform;
    customerCategory: CustomerCategory;
    contentType?: ContentType;
    industrySlug?: string;
  }): Promise<UniversalTemplate | null>;
  populateTemplate(template: UniversalTemplate, variables: Record<string, string>): string;
  getTemplatesByCategory(category: CustomerCategory): UniversalTemplate[];
}

export interface ISynapseScorerService {
  score(content: string, context: {
    industryPsychology: IndustryPsychology;
    customerCategory: CustomerCategory;
    platform: Platform;
  }): ContentScore;
  generateHints(breakdown: ScoreBreakdown, industryPsychology: IndustryPsychology): string[];
}
