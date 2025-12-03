/**
 * LLM Trigger Synthesizer Service
 *
 * Synthesizes raw API data into properly formatted psychological triggers
 * using Claude Haiku for fast, structured output.
 *
 * This replaces the regex-based title extraction with LLM understanding,
 * ensuring triggers are:
 * - Properly categorized (fear, desire, pain-point, etc.)
 * - Written in customer voice (not marketing speak)
 * - Formatted consistently ("Fear of X", "Frustrated by Y")
 * - Linked to source evidence
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BusinessProfileType } from './_archived/profile-detection.service';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem, UVPAlignment } from './trigger-consolidation.service';
import { validateLLMOutput, validateTrigger } from './output-validator.service';
import { sourcePreservationService } from './source-preservation.service';
import type { VerifiedSource } from '@/types/verified-source.types';
import type { SpecialtyProfileRow } from '@/types/specialty-profile.types';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface RawDataSample {
  id: string;
  content: string;
  source: string;
  platform: string;
  url?: string;
  author?: string;
  /** Original source title (e.g., article name, forum thread title) */
  sourceTitle?: string;
  /** Competitor name if this sample is about a specific competitor */
  competitorName?: string;
  /** Source type for multi-signal triangulation (2+ types = higher confidence) */
  sourceType?: 'voc' | 'community' | 'event' | 'executive' | 'news';
  /** Timestamp of when this data was collected/published */
  timestamp?: string;
  /** Engagement score (upvotes, likes, shares, etc.) */
  engagement?: number;
}

export type BuyerJourneyStage = 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';

export interface SynthesizedTrigger {
  category: TriggerCategory;
  title: string;
  executiveSummary: string;
  /** Sample indices (1-indexed) that support this trigger - we look up REAL data from these */
  sampleIds: number[];
  /** Legacy evidence array - for backwards compatibility, will be populated from sampleIds */
  evidence?: {
    quote: string;
    source: string;
    platform: string;
    url?: string;
    author?: string;
    sampleIndex?: number;
  }[];
  confidence: number;
  isTimeSensitive: boolean;
  /** Buyer journey stage from LLM validation */
  buyerJourneyStage?: BuyerJourneyStage;
  /** Buyer-product fit score from LLM validation (0-1) */
  buyerProductFit?: number;
  /** Reasoning for why this trigger matches the target buyer and product category */
  buyerProductFitReasoning?: string;
}

export interface TriggerSynthesisInput {
  rawData: RawDataSample[];
  uvp: CompleteUVP;
  profileType: BusinessProfileType;
  brandName?: string;
  industry?: string;
  /** Brand ID for specialty profile lookup */
  brandId?: string;
  /** Optional callback for progressive loading - called as each batch completes */
  onBatchComplete?: (triggers: ConsolidatedTrigger[], batchIndex: number, totalBatches: number) => void;
}

export interface TriggerSynthesisResult {
  triggers: ConsolidatedTrigger[];
  synthesisTime: number;
  model: string;
  rawTriggerCount: number;
}

// ============================================================================
// PHASE D: SOURCE TYPE MAPPING FOR MULTI-SIGNAL TRIANGULATION
// ============================================================================

type SourceType = 'voc' | 'community' | 'event' | 'executive' | 'news';

/**
 * Map platforms to source types for triangulation confidence calculation
 * - voc (Voice of Customer): Direct customer feedback platforms (G2, Capterra, Trustpilot, Yelp, Google Reviews)
 * - community: Discussion/social platforms (Reddit, HackerNews, Twitter, Quora, Facebook)
 * - event: Event/trigger signals (LinkedIn job posts, funding news, compliance deadlines)
 * - executive: Executive/leadership content (LinkedIn posts, press releases, earnings calls)
 * - news: Industry news and media (TechCrunch, industry publications, blogs)
 */
const PLATFORM_TO_SOURCE_TYPE: Record<string, SourceType> = {
  // VOC - Voice of Customer (direct feedback)
  'g2': 'voc',
  'g2crowd': 'voc',
  'capterra': 'voc',
  'trustpilot': 'voc',
  'trustradius': 'voc',
  'yelp': 'voc',
  'google reviews': 'voc',
  'google-reviews': 'voc',
  'amazon reviews': 'voc',
  'amazon-reviews': 'voc',
  'bbb': 'voc',

  // Community - Discussion platforms
  'reddit': 'community',
  'hackernews': 'community',
  'hacker news': 'community',
  'hn': 'community',
  'twitter': 'community',
  'x': 'community',
  'quora': 'community',
  'facebook': 'community',
  'nextdoor': 'community',
  'discord': 'community',
  'slack': 'community',

  // Event - Trigger signals
  'linkedin jobs': 'event',
  'indeed': 'event',
  'crunchbase': 'event',
  'pitchbook': 'event',
  'sec filings': 'event',

  // Executive - Leadership content
  'linkedin': 'executive',
  'press release': 'executive',
  'earnings call': 'executive',

  // News - Industry media
  'techcrunch': 'news',
  'youtube': 'news',
  'tiktok': 'news',
  'instagram': 'news',
  'medium': 'news',
  'blog': 'news',
  'industry forum': 'news',
  'clutch': 'news',
  'gartner': 'news',
  'forrester': 'news',
};

/**
 * Infer source type from platform name
 */
function inferSourceType(platform: string | null | undefined): SourceType {
  if (!platform) return 'community';
  const normalizedPlatform = platform.toLowerCase().trim();

  // Direct lookup
  if (PLATFORM_TO_SOURCE_TYPE[normalizedPlatform]) {
    return PLATFORM_TO_SOURCE_TYPE[normalizedPlatform];
  }

  // Partial match
  for (const [key, sourceType] of Object.entries(PLATFORM_TO_SOURCE_TYPE)) {
    if (normalizedPlatform.includes(key) || key.includes(normalizedPlatform)) {
      return sourceType;
    }
  }

  // Default to community for unknown platforms (most inclusive)
  return 'community';
}

/**
 * PHASE D: Calculate triangulation confidence multiplier
 * - 3+ source types = 1.3x (high triangulation)
 * - 2 source types = 1.15x (moderate triangulation)
 * - 1 source type = 0.9x (single source penalty)
 */
function calculateTriangulationMultiplier(sourceTypes: Set<SourceType>): number {
  const uniqueTypes = sourceTypes.size;

  if (uniqueTypes >= 3) {
    return 1.3; // High confidence - corroborated across multiple signal types
  } else if (uniqueTypes === 2) {
    return 1.15; // Moderate confidence - two independent signal types
  } else {
    return 0.9; // Low confidence - single source type (may be echo chamber)
  }
}

// ============================================================================
// CATEGORY DEFINITIONS FOR PROMPT
// ============================================================================

const CATEGORY_DEFINITIONS = `
## Trigger Categories

1. **fear** - Anxieties, worries, risks the customer fears
   - Format: "Fear of [specific concern]"
   - Examples: "Fear of vendor lock-in", "Fear of implementation failure"

2. **desire** - What customers desperately want but struggle to find
   - Format: "Want [specific outcome]" or "Looking for [specific thing]"
   - Examples: "Want seamless integration", "Looking for transparent pricing"

3. **pain-point** - Current frustrations and problems
   - Format: "Frustrated by [specific issue]" or "[Problem] causing [impact]"
   - Examples: "Frustrated by slow response times", "Manual processes wasting hours"

4. **objection** - Reasons customers hesitate to buy
   - Format: "Concerned about [objection]" or "Hesitant due to [reason]"
   - Examples: "Concerned about total cost of ownership", "Hesitant due to past failures"

5. **motivation** - Positive drivers pushing customers toward solutions
   - Format: "Motivated by [driver]" or "Excited about [opportunity]"
   - Examples: "Motivated by competitive pressure", "Excited about automation potential"

6. **trust** - Credibility factors that build or break trust
   - Format: "Need proof of [trust factor]" or "Trust requires [evidence]"
   - Examples: "Need proof of ROI claims", "Trust requires customer references"

7. **urgency** - Time-sensitive pressures forcing action
   - Format: "Urgent: [time pressure]" or "Deadline: [constraint]"
   - Examples: "Urgent: Q4 budget deadline", "Falling behind competitors"
`;

// ============================================================================
// PHASE E: PROFILE-SPECIFIC LLM CONTEXT FOR BETTER SYNTHESIS
// ============================================================================

/**
 * Profile-specific context for LLM prompts
 * Provides detailed guidance on what triggers matter for each business profile
 */
const PROFILE_CONTEXT: Record<BusinessProfileType, string> = {
  'local-service-b2b': 'Local B2B service provider (HVAC, IT services). Focus on reliability, response time, local reputation.',
  'local-service-b2c': 'Local B2C service (dental, salon, restaurant). Focus on convenience, reviews, personal experience.',
  'regional-b2b-agency': 'Regional B2B agency (marketing, consulting). Focus on ROI, expertise, communication.',
  'regional-retail-b2c': 'Regional retail (multi-location). Focus on availability, returns, price matching.',
  'national-saas-b2b': 'National SaaS B2B. Focus on integration, scalability, support, security.',
  'national-product-b2c': 'National consumer product. Focus on quality, durability, value, reviews.',
  'global-saas-b2b': 'Global enterprise SaaS. Focus on compliance, enterprise features, global support, vendor stability.',
};

/**
 * PHASE E: Profile-specific trigger emphasis
 * Guides the LLM on which psychological categories matter most for each profile
 */
const PROFILE_TRIGGER_EMPHASIS: Record<BusinessProfileType, {
  primaryCategories: TriggerCategory[];
  secondaryCategories: TriggerCategory[];
  typicalFears: string[];
  typicalDesires: string[];
  typicalPainPoints: string[];
  buyerTerms: string[];
}> = {
  'local-service-b2b': {
    primaryCategories: ['fear', 'trust', 'urgency'],
    secondaryCategories: ['pain-point', 'objection'],
    typicalFears: ['equipment downtime', 'unreliable vendors', 'compliance violations', 'emergency response delays'],
    typicalDesires: ['fast response time', 'reliable vendor', 'local accountability', 'predictable costs'],
    typicalPainPoints: ['current vendor unresponsive', 'poor service quality', 'hidden fees', 'lack of transparency'],
    buyerTerms: ['business owner', 'facilities manager', 'operations director', 'office manager']
  },
  'local-service-b2c': {
    primaryCategories: ['trust', 'fear', 'desire'],
    secondaryCategories: ['pain-point', 'urgency'],
    typicalFears: ['bad experience', 'wasted money', 'poor results', 'safety concerns'],
    typicalDesires: ['convenient scheduling', 'friendly staff', 'quality results', 'fair prices'],
    typicalPainPoints: ['long wait times', 'rude staff', 'inconsistent quality', 'hard to book'],
    buyerTerms: ['customer', 'patient', 'client', 'member', 'guest']
  },
  'regional-b2b-agency': {
    primaryCategories: ['objection', 'trust', 'fear'],
    secondaryCategories: ['motivation', 'desire'],
    typicalFears: ['wasted budget', 'no ROI', 'agency doesnt understand our industry', 'locked into bad contract'],
    typicalDesires: ['measurable results', 'industry expertise', 'strategic partnership', 'clear communication'],
    typicalPainPoints: ['previous agency failed', 'no transparency on results', 'generic work', 'missed deadlines'],
    buyerTerms: ['CMO', 'marketing director', 'CEO', 'founder', 'VP Marketing']
  },
  'regional-retail-b2c': {
    primaryCategories: ['desire', 'trust', 'urgency'],
    secondaryCategories: ['pain-point', 'objection'],
    typicalFears: ['out of stock', 'poor quality', 'bad return policy', 'inconvenient locations'],
    typicalDesires: ['good deals', 'product availability', 'easy returns', 'consistent experience'],
    typicalPainPoints: ['items always out of stock', 'staff not helpful', 'long checkout lines', 'hard to find products'],
    buyerTerms: ['shopper', 'customer', 'buyer', 'local customer']
  },
  'national-saas-b2b': {
    primaryCategories: ['fear', 'objection', 'pain-point'],
    secondaryCategories: ['trust', 'motivation'],
    typicalFears: ['vendor lock-in', 'integration nightmares', 'data security breach', 'implementation failure'],
    typicalDesires: ['easy integration', 'fast implementation', 'reliable uptime', 'responsive support'],
    typicalPainPoints: ['current tool too complex', 'poor API documentation', 'slow support response', 'expensive upgrades'],
    buyerTerms: ['CTO', 'VP Engineering', 'IT Director', 'DevOps lead', 'enterprise buyer']
  },
  'national-product-b2c': {
    primaryCategories: ['desire', 'trust', 'objection'],
    secondaryCategories: ['fear', 'motivation'],
    typicalFears: ['product wont work as advertised', 'quality issues', 'hard to return', 'better alternatives exist'],
    typicalDesires: ['high quality', 'good value', 'positive reviews', 'durable product'],
    typicalPainPoints: ['last product broke quickly', 'hard to compare options', 'misleading marketing', 'poor customer service'],
    buyerTerms: ['consumer', 'customer', 'buyer', 'shopper']
  },
  'global-saas-b2b': {
    primaryCategories: ['fear', 'trust', 'objection'],
    secondaryCategories: ['motivation', 'urgency'],
    typicalFears: ['compliance violations', 'data residency issues', 'vendor instability', 'global rollout failure'],
    typicalDesires: ['enterprise-grade security', 'global support coverage', 'compliance certifications', 'stable vendor'],
    typicalPainPoints: ['current vendor lacks compliance', 'support timezone gaps', 'inconsistent global experience', 'complex procurement'],
    buyerTerms: ['enterprise buyer', 'CISO', 'CTO', 'procurement', 'global IT director']
  }
};

/**
 * PHASE E: Semantic inversion patterns
 * Complaints should NOT be synthesized as desires, and vice versa
 * This mapping helps the LLM correctly categorize inverted sentiment
 */
const SEMANTIC_INVERSION_RULES = {
  // Complaint patterns that should be categorized as pain-point, NOT desire
  complaintToDesireInversion: [
    { pattern: /hate|cant stand|sick of|tired of/i, correctCategory: 'pain-point' as TriggerCategory },
    { pattern: /broken|doesnt work|keeps failing/i, correctCategory: 'pain-point' as TriggerCategory },
    { pattern: /terrible|awful|worst/i, correctCategory: 'pain-point' as TriggerCategory },
    { pattern: /frustrat|annoy|infuriat/i, correctCategory: 'pain-point' as TriggerCategory },
  ],
  // Desire patterns that should NOT be categorized as pain-point
  desireToComplaintInversion: [
    { pattern: /wish|hope|would love|dream of/i, correctCategory: 'desire' as TriggerCategory },
    { pattern: /looking for|searching for|trying to find/i, correctCategory: 'desire' as TriggerCategory },
    { pattern: /want|need|require/i, correctCategory: 'desire' as TriggerCategory },
  ],
  // Fear patterns
  fearPatterns: [
    { pattern: /afraid|scared|terrified|worried about/i, correctCategory: 'fear' as TriggerCategory },
    { pattern: /what if.*fail|risk of|danger of/i, correctCategory: 'fear' as TriggerCategory },
    { pattern: /nervous about|anxious about|concerned about/i, correctCategory: 'fear' as TriggerCategory },
  ]
};

// ============================================================================
// BANNED GENERIC TERMS - These should NEVER appear in trigger output
// These are NAICS-style generic terms that don't help customers identify
// with the content. Use specific product/service categories instead.
// ============================================================================
const BANNED_GENERIC_TERMS = [
  // NAICS-style generic terms (never use these)
  'software publishers',
  'software publishing',
  'data processing',
  'information services',
  'computer systems design',
  'custom programming',
  'professional services',
  'business services',
  'management consulting',
  'technical services',
  'administrative services',

  // Replace with specific product categories:
  // "software publishers" → "conversational AI platforms", "chatbot solutions", etc.
  // "professional services" → "marketing agencies", "consulting firms", etc.
  // "data processing" → "analytics platforms", "data warehouses", etc.
];

// Buyer-Product Fit validation criteria per profile
const PROFILE_VALIDATION_CRITERIA: Record<BusinessProfileType, {
  validTriggerTypes: string[];
  invalidTriggerTypes: string[];
  validBuyerTerms: string[];
  requiredContext: string[];
}> = {
  'local-service-b2b': {
    validTriggerTypes: ['equipment failure', 'emergency repair', 'vendor reliability', 'compliance', 'contract timing'],
    invalidTriggerTypes: ['consumer', 'personal', 'saas', 'software subscription', 'retail shopping'],
    validBuyerTerms: ['business owner', 'facilities manager', 'operations', 'commercial'],
    requiredContext: ['local', 'service', 'contractor', 'vendor', 'repair', 'maintenance']
  },
  'local-service-b2c': {
    validTriggerTypes: ['appointment', 'wait time', 'service quality', 'reviews', 'convenience', 'life event'],
    invalidTriggerTypes: ['enterprise', 'b2b', 'vendor contract', 'procurement', 'integration'],
    validBuyerTerms: ['patient', 'customer', 'client', 'member', 'consumer'],
    requiredContext: ['appointment', 'booking', 'visit', 'experience', 'service']
  },
  'regional-b2b-agency': {
    validTriggerTypes: ['roi concerns', 'agency evaluation', 'leadership change', 'rfp', 'expertise'],
    invalidTriggerTypes: ['consumer', 'personal', 'retail', 'local service'],
    validBuyerTerms: ['cmo', 'marketing director', 'ceo', 'founder', 'executive'],
    requiredContext: ['agency', 'firm', 'consulting', 'partnership', 'results']
  },
  'regional-retail-b2c': {
    validTriggerTypes: ['expansion', 'location', 'inventory', 'seasonal', 'competition'],
    invalidTriggerTypes: ['saas', 'software', 'enterprise platform', 'b2b service'],
    validBuyerTerms: ['shopper', 'customer', 'consumer', 'buyer'],
    requiredContext: ['store', 'location', 'retail', 'franchise', 'shopping']
  },
  'national-saas-b2b': {
    validTriggerTypes: ['integration', 'implementation', 'vendor lock-in', 'scalability', 'security', 'funding', 'tech stack'],
    invalidTriggerTypes: ['consumer', 'personal', 'local service', 'retail store'],
    validBuyerTerms: ['enterprise', 'company', 'organization', 'team', 'it', 'cto', 'vp'],
    requiredContext: ['software', 'platform', 'tool', 'integration', 'automation']
  },
  'national-product-b2c': {
    validTriggerTypes: ['quality', 'price', 'durability', 'reviews', 'distribution', 'retail partnership'],
    invalidTriggerTypes: ['saas', 'software', 'b2b service', 'enterprise'],
    validBuyerTerms: ['consumer', 'customer', 'buyer', 'shopper'],
    requiredContext: ['product', 'brand', 'purchase', 'quality', 'retail']
  },
  'global-saas-b2b': {
    validTriggerTypes: ['compliance', 'gdpr', 'data residency', 'enterprise governance', 'multi-region', 'vendor stability'],
    invalidTriggerTypes: ['consumer', 'personal', 'local service', 'small business only'],
    validBuyerTerms: ['enterprise', 'global', 'multinational', 'cto', 'security', 'compliance'],
    requiredContext: ['enterprise', 'global', 'compliance', 'security', 'governance']
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class LLMTriggerSynthesizerService {
  private endpoint: string;
  private apiKey: string;
  /** Store last samples for URL lookup after LLM response */
  private lastSamples: RawDataSample[] = [];
  /** TRIGGERS 4.0: Store verified sources from SourceRegistry for immutable source tracking */
  private lastVerifiedSources: VerifiedSource[] = [];

  constructor() {
    this.endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  // ============================================================================
  // PHASE 5: SPECIALTY PROFILE INTEGRATION
  // ============================================================================

  /**
   * Look up specialty profile by brand_id from Supabase
   * Returns null if no specialty profile exists for this brand
   */
  private async lookupSpecialtyProfile(brandId: string): Promise<SpecialtyProfileRow | null> {
    try {
      console.log(`[LLMTriggerSynthesizer] Looking up specialty profile for brand: ${brandId}`);

      const { data, error } = await supabase
        .from('specialty_profiles')
        .select('*')
        .eq('brand_id', brandId)
        .eq('generation_status', 'complete')
        .maybeSingle();

      if (error) {
        console.error('[LLMTriggerSynthesizer] DB error:', error.message);
        return null;
      }

      if (!data) {
        console.log('[LLMTriggerSynthesizer] No specialty profile found for brand');
        return null;
      }

      console.log(`[LLMTriggerSynthesizer] ✅ Found specialty profile: ${data.specialty_name}`);
      return data as SpecialtyProfileRow;
    } catch (err) {
      console.error('[LLMTriggerSynthesizer] Failed to lookup specialty profile:', err);
      return null;
    }
  }

  /**
   * Convert specialty profile triggers to ConsolidatedTrigger format
   * This creates V1-quality triggers from the multipass-generated profile
   *
   * PHASE 21: Now uses full_uvp data for proper UVP alignment
   */
  private convertSpecialtyProfileToTriggers(profile: SpecialtyProfileRow): ConsolidatedTrigger[] {
    const triggers: ConsolidatedTrigger[] = [];
    const now = new Date().toISOString();

    // Extract full UVP data from profile_data
    const profileData = profile.profile_data as unknown as Record<string, unknown> | null;
    const fullUVP = profileData?.full_uvp as {
      target_customer_statement?: string;
      products_services?: string[];
      differentiators?: string[];
      key_benefit_statement?: string;
      value_proposition_statement?: string;
      transformation_before?: string;
      transformation_after?: string;
      emotional_drivers?: string[];
      functional_drivers?: string[];
      benefit_metrics?: Array<{ metric: string; value: string; timeframe?: string }>;
    } | null;

    // Helper: Split semicolon-delimited strings into clean individual items
    const splitDelimited = (text: string | null | undefined): string[] => {
      if (!text) return [];
      return text
        .split(/[;|•\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 200); // Filter out too short or too long
    };

    console.log('[LLMTriggerSynthesizer] Converting specialty profile to triggers');
    console.log(`  - customer_triggers: ${profile.customer_triggers?.length || 0}`);
    console.log(`  - common_pain_points: ${profile.common_pain_points?.length || 0}`);
    console.log(`  - common_buying_triggers: ${profile.common_buying_triggers?.length || 0}`);
    console.log(`  - urgency_drivers: ${profile.urgency_drivers?.length || 0}`);
    console.log(`  - has full_uvp: ${!!fullUVP}`);
    console.log(`  - full_uvp.products: ${fullUVP?.products_services?.length || 0}`);
    console.log(`  - full_uvp.differentiators: ${fullUVP?.differentiators?.length || 0}`);

    // Build UVP alignments from full_uvp data
    const uvpAlignmentSources: string[] = [];
    if (fullUVP?.differentiators?.length) {
      uvpAlignmentSources.push(...fullUVP.differentiators.slice(0, 3));
    }
    if (fullUVP?.key_benefit_statement) {
      uvpAlignmentSources.push(fullUVP.key_benefit_statement);
    }
    if (fullUVP?.value_proposition_statement) {
      uvpAlignmentSources.push(fullUVP.value_proposition_statement);
    }

    // Helper to find matching UVP alignments for a trigger
    // Returns proper UVPAlignment objects
    const findUVPAlignments = (triggerText: string | null | undefined): UVPAlignment[] => {
      if (!triggerText || !uvpAlignmentSources.length) return [];
      const triggerLower = triggerText.toLowerCase();
      const matchingAlignments: UVPAlignment[] = [];

      // Check differentiators for keyword overlap
      if (fullUVP?.differentiators) {
        for (const diff of fullUVP.differentiators) {
          if (!diff) continue;
          const diffLower = diff.toLowerCase();
          const keywords = triggerLower.split(/\s+/).filter(w => w.length >= 3);
          const hasOverlap = keywords.some(kw => diffLower.includes(kw));
          if (hasOverlap && matchingAlignments.length < 3) {
            matchingAlignments.push({
              component: 'unique_solution',
              matchScore: 0.85,
              matchReason: diff.substring(0, 80)
            });
          }
        }
      }

      // Check key benefit for overlap
      if (fullUVP?.key_benefit_statement) {
        const benefitLower = fullUVP.key_benefit_statement.toLowerCase();
        const keywords = triggerLower.split(/\s+/).filter(w => w.length >= 3);
        const hasOverlap = keywords.some(kw => benefitLower.includes(kw));
        if (hasOverlap && matchingAlignments.length < 3) {
          matchingAlignments.push({
            component: 'key_benefit',
            matchScore: 0.9,
            matchReason: fullUVP.key_benefit_statement.substring(0, 80)
          });
        }
      }

      // Check transformation for overlap
      if (fullUVP?.transformation_after) {
        const transformLower = fullUVP.transformation_after.toLowerCase();
        const keywords = triggerLower.split(/\s+/).filter(w => w.length >= 3);
        const hasOverlap = keywords.some(kw => transformLower.includes(kw));
        if (hasOverlap && matchingAlignments.length < 3) {
          matchingAlignments.push({
            component: 'transformation',
            matchScore: 0.88,
            matchReason: fullUVP.transformation_after.substring(0, 80)
          });
        }
      }

      // If no matches, include first differentiator as default alignment
      if (matchingAlignments.length === 0 && fullUVP?.differentiators?.[0]) {
        matchingAlignments.push({
          component: 'unique_solution',
          matchScore: 0.7,
          matchReason: fullUVP.differentiators[0].substring(0, 80)
        });
      }

      return matchingAlignments;
    };

    // Target customer context for better summaries
    const targetCustomer = fullUVP?.target_customer_statement || profile.specialty_name;

    // Convert customer_triggers (primary source)
    // Note: customer_triggers may contain semicolon-delimited lists that need splitting
    if (profile.customer_triggers && Array.isArray(profile.customer_triggers)) {
      let triggerIndex = 0;
      profile.customer_triggers.forEach((ct) => {
        // Check if this trigger is a semicolon-delimited list
        const triggerTexts = ct.trigger?.includes(';') ? splitDelimited(ct.trigger) : [ct.trigger];

        triggerTexts.forEach((triggerText) => {
          if (!triggerText) return;
          const confidence = Math.min(0.95, 0.7 + (ct.urgency || 5) * 0.03);
          const alignments = findUVPAlignments(triggerText);
          triggers.push({
            id: `specialty-trigger-${profile.id}-${triggerIndex++}`,
            category: this.inferCategoryFromTrigger(triggerText),
            title: triggerText,
            executiveSummary: `High-urgency trigger for ${targetCustomer}. ${alignments.length ? `Aligns with: ${alignments[0].matchReason.substring(0, 60)}...` : ''}`,
            confidence,
            evidenceCount: 1,
            evidence: [{
              id: `specialty-evidence-${profile.id}-${triggerIndex}`,
              quote: triggerText,
              source: 'UVP Analysis',
              platform: 'uvp-analysis',
              timestamp: now,
              sentiment: 'neutral' as const,
              confidence,
            }],
            uvpAlignments: alignments,
            isTimeSensitive: (ct.urgency || 5) >= 7,
            profileRelevance: 0.95,
            rawSourceIds: [`specialty-profile-${profile.id}`],
            isLLMSynthesized: true,
            buyerJourneyStage: 'problem-aware' as BuyerJourneyStage,
            buyerProductFit: 0.9,
            buyerProductFitReasoning: `Generated from UVP for ${targetCustomer}`
          });
        });
      });
    }

    // Convert common_pain_points to pain-point triggers
    if (profile.common_pain_points && Array.isArray(profile.common_pain_points)) {
      profile.common_pain_points.forEach((painPoint, idx) => {
        const alignments = findUVPAlignments(painPoint);
        triggers.push({
          id: `specialty-pain-${profile.id}-${idx}`,
          category: 'pain-point' as TriggerCategory,
          title: painPoint, // Don't prefix with "Frustrated by" - use pain point directly
          executiveSummary: `Pain point for ${targetCustomer}. ${alignments.length ? `Your solution addresses: ${alignments[0].matchReason.substring(0, 50)}...` : ''}`,
          confidence: 0.85,
          evidenceCount: 1,
          evidence: [{
            id: `specialty-pain-evidence-${profile.id}-${idx}`,
            quote: painPoint,
            source: 'UVP Analysis',
            platform: 'uvp-analysis',
            timestamp: now,
            sentiment: 'negative' as const,
            confidence: 0.85,
          }],
          uvpAlignments: alignments,
          isTimeSensitive: false,
          profileRelevance: 0.9,
          rawSourceIds: [`specialty-profile-${profile.id}`],
          isLLMSynthesized: true,
          buyerJourneyStage: 'problem-aware' as BuyerJourneyStage,
          buyerProductFit: 0.85,
          buyerProductFitReasoning: `Pain point addressed by your UVP`
        });
      });
    }

    // Convert common_buying_triggers to desire triggers
    if (profile.common_buying_triggers && Array.isArray(profile.common_buying_triggers)) {
      profile.common_buying_triggers.forEach((buyingTrigger, idx) => {
        const alignments = findUVPAlignments(buyingTrigger);
        triggers.push({
          id: `specialty-buying-${profile.id}-${idx}`,
          category: 'desire' as TriggerCategory,
          title: buyingTrigger, // Don't prefix with "Want" - use trigger directly
          executiveSummary: `Buying motivation for ${targetCustomer}. ${alignments.length ? `You deliver: ${alignments[0].matchReason.substring(0, 50)}...` : ''}`,
          confidence: 0.88,
          evidenceCount: 1,
          evidence: [{
            id: `specialty-buying-evidence-${profile.id}-${idx}`,
            quote: buyingTrigger,
            source: 'UVP Analysis',
            platform: 'uvp-analysis',
            timestamp: now,
            sentiment: 'positive' as const,
            confidence: 0.88,
          }],
          uvpAlignments: alignments,
          isTimeSensitive: false,
          profileRelevance: 0.9,
          rawSourceIds: [`specialty-profile-${profile.id}`],
          isLLMSynthesized: true,
          buyerJourneyStage: 'solution-aware' as BuyerJourneyStage,
          buyerProductFit: 0.88,
          buyerProductFitReasoning: `Buying trigger aligned with your UVP`
        });
      });
    }

    // Convert urgency_drivers to fear triggers
    if (profile.urgency_drivers && Array.isArray(profile.urgency_drivers)) {
      profile.urgency_drivers.forEach((urgencyDriver, idx) => {
        const alignments = findUVPAlignments(urgencyDriver);
        triggers.push({
          id: `specialty-urgency-${profile.id}-${idx}`,
          category: 'fear' as TriggerCategory,
          title: urgencyDriver, // Don't prefix with "Fear of" - use driver directly
          executiveSummary: `Urgency driver for ${targetCustomer}. ${alignments.length ? `Counter with: ${alignments[0].matchReason.substring(0, 50)}...` : ''}`,
          confidence: 0.9,
          evidenceCount: 1,
          evidence: [{
            id: `specialty-urgency-evidence-${profile.id}-${idx}`,
            quote: urgencyDriver,
            source: 'UVP Analysis',
            platform: 'uvp-analysis',
            timestamp: now,
            sentiment: 'negative' as const,
            confidence: 0.9,
          }],
          uvpAlignments: alignments,
          isTimeSensitive: true,
          profileRelevance: 0.95,
          rawSourceIds: [`specialty-profile-${profile.id}`],
          isLLMSynthesized: true,
          buyerJourneyStage: 'problem-aware' as BuyerJourneyStage,
          buyerProductFit: 0.9,
          buyerProductFitReasoning: `Urgency driver that your solution resolves`
        });
      });
    }

    // PHASE 21: Generate additional triggers from transformation data
    if (fullUVP?.transformation_before && fullUVP?.transformation_after) {
      triggers.push({
        id: `specialty-transform-${profile.id}-before`,
        category: 'pain-point' as TriggerCategory,
        title: fullUVP.transformation_before,
        executiveSummary: `Current state your customers want to escape. Transform to: ${fullUVP.transformation_after.substring(0, 60)}...`,
        confidence: 0.92,
        evidenceCount: 1,
        evidence: [{
          id: `specialty-transform-evidence-${profile.id}-before`,
          quote: `From "${fullUVP.transformation_before}" to "${fullUVP.transformation_after}"`,
          source: 'UVP Analysis',
          platform: 'uvp-analysis',
          timestamp: now,
          sentiment: 'negative' as const,
          confidence: 0.92,
        }],
        uvpAlignments: fullUVP.value_proposition_statement ? [{
          component: 'transformation' as const,
          matchScore: 0.92,
          matchReason: fullUVP.value_proposition_statement.substring(0, 80)
        }] : [],
        isTimeSensitive: false,
        profileRelevance: 0.95,
        rawSourceIds: [`specialty-profile-${profile.id}`],
        isLLMSynthesized: true,
        buyerJourneyStage: 'problem-aware' as BuyerJourneyStage,
        buyerProductFit: 0.92,
        buyerProductFitReasoning: `Core transformation your UVP delivers`
      });

      triggers.push({
        id: `specialty-transform-${profile.id}-after`,
        category: 'desire' as TriggerCategory,
        title: fullUVP.transformation_after,
        executiveSummary: `Desired outcome your customers seek. Escaping: ${fullUVP.transformation_before.substring(0, 60)}...`,
        confidence: 0.92,
        evidenceCount: 1,
        evidence: [{
          id: `specialty-transform-evidence-${profile.id}-after`,
          quote: `Achieve "${fullUVP.transformation_after}" instead of "${fullUVP.transformation_before}"`,
          source: 'UVP Analysis',
          platform: 'uvp-analysis',
          timestamp: now,
          sentiment: 'positive' as const,
          confidence: 0.92,
        }],
        uvpAlignments: fullUVP.key_benefit_statement ? [{
          component: 'key_benefit' as const,
          matchScore: 0.92,
          matchReason: fullUVP.key_benefit_statement.substring(0, 80)
        }] : [],
        isTimeSensitive: false,
        profileRelevance: 0.95,
        rawSourceIds: [`specialty-profile-${profile.id}`],
        isLLMSynthesized: true,
        buyerJourneyStage: 'solution-aware' as BuyerJourneyStage,
        buyerProductFit: 0.92,
        buyerProductFitReasoning: `Transformation outcome from your UVP`
      });
    }

    // =========================================================================
    // FALLBACK: Generate triggers from full_uvp when main arrays are empty
    // This ensures we always have quality triggers from UVP data
    // =========================================================================
    const hasMainArrayTriggers =
      (profile.common_pain_points?.length || 0) > 0 ||
      (profile.common_buying_triggers?.length || 0) > 0 ||
      (profile.urgency_drivers?.length || 0) > 0;

    if (!hasMainArrayTriggers && fullUVP) {
      console.log('[LLMTriggerSynthesizer] Main arrays empty - generating from full_uvp fallback');

      // Generate from emotional drivers (pain-point triggers)
      if (fullUVP.emotional_drivers?.length) {
        fullUVP.emotional_drivers.forEach((driver, idx) => {
          if (!driver || driver.length < 10) return;
          const alignments = findUVPAlignments(driver);
          triggers.push({
            id: `uvp-emotional-${profile.id}-${idx}`,
            category: 'pain-point' as TriggerCategory,
            title: driver,
            executiveSummary: `Emotional pain point for ${targetCustomer}. ${alignments.length ? `Your solution addresses: ${alignments[0].matchReason.substring(0, 50)}...` : ''}`,
            confidence: 0.85,
            evidenceCount: 1,
            evidence: [{
              id: `uvp-emotional-evidence-${profile.id}-${idx}`,
              quote: driver,
              source: 'UVP Analysis',
              platform: 'uvp-analysis',
              timestamp: now,
              sentiment: 'negative' as const,
              confidence: 0.85,
            }],
            uvpAlignments: alignments,
            isTimeSensitive: false,
            profileRelevance: 0.9,
            rawSourceIds: [`specialty-profile-${profile.id}`],
            isLLMSynthesized: true,
            buyerJourneyStage: 'problem-aware' as BuyerJourneyStage,
            buyerProductFit: 0.85,
            buyerProductFitReasoning: `Emotional driver from UVP`
          });
        });
      }

      // Generate from functional drivers (desire triggers)
      if (fullUVP.functional_drivers?.length) {
        fullUVP.functional_drivers.forEach((driver, idx) => {
          if (!driver || driver.length < 10) return;
          const alignments = findUVPAlignments(driver);
          triggers.push({
            id: `uvp-functional-${profile.id}-${idx}`,
            category: 'desire' as TriggerCategory,
            title: driver,
            executiveSummary: `Functional need for ${targetCustomer}. ${alignments.length ? `You deliver: ${alignments[0].matchReason.substring(0, 50)}...` : ''}`,
            confidence: 0.85,
            evidenceCount: 1,
            evidence: [{
              id: `uvp-functional-evidence-${profile.id}-${idx}`,
              quote: driver,
              source: 'UVP Analysis',
              platform: 'uvp-analysis',
              timestamp: now,
              sentiment: 'positive' as const,
              confidence: 0.85,
            }],
            uvpAlignments: alignments,
            isTimeSensitive: false,
            profileRelevance: 0.9,
            rawSourceIds: [`specialty-profile-${profile.id}`],
            isLLMSynthesized: true,
            buyerJourneyStage: 'solution-aware' as BuyerJourneyStage,
            buyerProductFit: 0.85,
            buyerProductFitReasoning: `Functional need from UVP`
          });
        });
      }

      // Generate from key benefit (desire trigger)
      if (fullUVP.key_benefit_statement) {
        // Split semicolon-delimited benefits
        const benefits = splitDelimited(fullUVP.key_benefit_statement);
        benefits.forEach((benefit, idx) => {
          triggers.push({
            id: `uvp-benefit-${profile.id}-${idx}`,
            category: 'desire' as TriggerCategory,
            title: benefit,
            executiveSummary: `Key outcome ${targetCustomer} seeks.`,
            confidence: 0.9,
            evidenceCount: 1,
            evidence: [{
              id: `uvp-benefit-evidence-${profile.id}-${idx}`,
              quote: benefit,
              source: 'UVP Analysis',
              platform: 'uvp-analysis',
              timestamp: now,
              sentiment: 'positive' as const,
              confidence: 0.9,
            }],
            uvpAlignments: fullUVP.value_proposition_statement ? [{
              component: 'key_benefit' as const,
              matchScore: 0.9,
              matchReason: fullUVP.value_proposition_statement.substring(0, 80)
            }] : [],
            isTimeSensitive: false,
            profileRelevance: 0.95,
            rawSourceIds: [`specialty-profile-${profile.id}`],
            isLLMSynthesized: true,
            buyerJourneyStage: 'solution-aware' as BuyerJourneyStage,
            buyerProductFit: 0.9,
            buyerProductFitReasoning: `Key benefit from UVP`
          });
        });
      }

      // Generate from differentiators (motivation triggers)
      if (fullUVP.differentiators?.length) {
        fullUVP.differentiators.forEach((diff, idx) => {
          if (!diff || diff.length < 10) return;
          triggers.push({
            id: `uvp-diff-${profile.id}-${idx}`,
            category: 'motivation' as TriggerCategory,
            title: diff,
            executiveSummary: `Unique value you deliver to ${targetCustomer}.`,
            confidence: 0.88,
            evidenceCount: 1,
            evidence: [{
              id: `uvp-diff-evidence-${profile.id}-${idx}`,
              quote: diff,
              source: 'UVP Analysis',
              platform: 'uvp-analysis',
              timestamp: now,
              sentiment: 'positive' as const,
              confidence: 0.88,
            }],
            uvpAlignments: [{
              component: 'unique_solution' as const,
              matchScore: 0.88,
              matchReason: diff.substring(0, 80)
            }],
            isTimeSensitive: false,
            profileRelevance: 0.92,
            rawSourceIds: [`specialty-profile-${profile.id}`],
            isLLMSynthesized: true,
            buyerJourneyStage: 'product-aware' as BuyerJourneyStage,
            buyerProductFit: 0.88,
            buyerProductFitReasoning: `Differentiator from UVP`
          });
        });
      }

      console.log(`[LLMTriggerSynthesizer] Generated ${triggers.length} triggers from full_uvp fallback`);
    }

    console.log(`[LLMTriggerSynthesizer] ✅ Converted ${triggers.length} triggers from specialty profile (with UVP alignments)`);
    return triggers;
  }

  /**
   * Infer trigger category from trigger text
   * Valid categories: fear, desire, pain-point, objection, motivation
   */
  private inferCategoryFromTrigger(triggerText: string | null | undefined): TriggerCategory {
    if (!triggerText) return 'pain-point';
    const text = triggerText.toLowerCase();

    if (text.includes('fear') || text.includes('risk') || text.includes('lose') || text.includes('miss') || text.includes('worry')) {
      return 'fear';
    }
    if (text.includes('want') || text.includes('need') || text.includes('looking') || text.includes('desire') || text.includes('wish')) {
      return 'desire';
    }
    if (text.includes('frustrated') || text.includes('pain') || text.includes('struggle') || text.includes('problem') || text.includes('issue')) {
      return 'pain-point';
    }
    if (text.includes('object') || text.includes('concern') || text.includes('hesitat') || text.includes('doubt') || text.includes('but')) {
      return 'objection';
    }
    if (text.includes('opportunit') || text.includes('growth') || text.includes('expand') || text.includes('goal') || text.includes('achieve')) {
      return 'motivation';
    }

    // Default to pain-point as it's most common
    return 'pain-point';
  }

  // ============================================================================
  // END PHASE 5: SPECIALTY PROFILE INTEGRATION
  // ============================================================================

  /**
   * Synthesize raw data into formatted psychological triggers
   * PARALLEL BATCHING: Splits samples into 4 batches for parallel processing via ai-proxy
   *
   * PHASE 5: Now checks for specialty profile FIRST before LLM synthesis
   */
  async synthesize(input: TriggerSynthesisInput): Promise<TriggerSynthesisResult> {
    const startTime = performance.now();

    console.log('[LLMTriggerSynthesizer] Starting PARALLEL synthesis with', input.rawData.length, 'data points');

    // =========================================================================
    // PHASE 5: CHECK SPECIALTY PROFILE FIRST
    // If a specialty profile exists for this brand, use its triggers instead
    // of synthesizing from raw API data. This ensures V1-quality triggers.
    // =========================================================================
    if (input.brandId) {
      const specialtyProfile = await this.lookupSpecialtyProfile(input.brandId);

      if (specialtyProfile) {
        console.log('[LLMTriggerSynthesizer] 🎯 SPECIALTY PROFILE FOUND - using V1-quality triggers');

        const triggers = this.convertSpecialtyProfileToTriggers(specialtyProfile);
        const synthesisTime = performance.now() - startTime;

        // Emit all triggers immediately via callback
        if (input.onBatchComplete && triggers.length > 0) {
          console.log(`[LLMTriggerSynthesizer] 🔄 Emitting ${triggers.length} specialty triggers`);
          input.onBatchComplete(triggers, 0, 1);
        }

        console.log(`[LLMTriggerSynthesizer] ✅ Returned ${triggers.length} specialty profile triggers in ${synthesisTime.toFixed(0)}ms`);

        return {
          triggers,
          synthesisTime,
          model: 'specialty-profile-v1',
          rawTriggerCount: triggers.length,
        };
      }

      console.log('[LLMTriggerSynthesizer] No specialty profile found, falling back to LLM synthesis');
    } else {
      console.log('[LLMTriggerSynthesizer] No brandId provided, skipping specialty profile lookup');
    }
    // =========================================================================
    // END PHASE 5: Proceed with LLM synthesis if no specialty profile
    // =========================================================================

    // PHASE 10: Source diversity gate - validate we have diverse sources
    const sourceDiversity = this.checkSourceDiversity(input.rawData);
    console.log(`[LLMTriggerSynthesizer] Source diversity: ${sourceDiversity.uniquePlatforms} platforms | ${sourceDiversity.distribution}`);

    if (sourceDiversity.uniquePlatforms < 2) {
      console.warn('[LLMTriggerSynthesizer] ⚠️ LOW SOURCE DIVERSITY - only', sourceDiversity.uniquePlatforms, 'platform(s). Results may be less accurate.');
    }

    // PARALLEL BATCHING: Select 200 samples (50 per batch × 4 batches)
    const allSamples = this.selectBestSamples(input.rawData, 200);
    console.log(`[LLMTriggerSynthesizer] Selected ${allSamples.length} samples for parallel processing`);

    // Store all samples for URL lookup
    this.lastSamples = allSamples;

    // TRIGGERS 4.0: Register all samples with SourceRegistry for immutable source tracking
    // This ensures source data can ONLY come from registry, not from LLM output
    sourcePreservationService.reset(); // Clear previous session
    this.lastVerifiedSources = sourcePreservationService.convertBatch(allSamples);
    console.log(`[LLMTriggerSynthesizer] TRIGGERS 4.0: Registered ${this.lastVerifiedSources.length} sources in SourceRegistry`);
    console.log(`[LLMTriggerSynthesizer] Registry stats:`, sourcePreservationService.getStats());

    // Split into 4 batches for parallel processing
    const batchSize = Math.ceil(allSamples.length / 4);
    const batches: RawDataSample[][] = [];
    for (let i = 0; i < 4; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, allSamples.length);
      if (start < allSamples.length) {
        batches.push(allSamples.slice(start, end));
      }
    }

    console.log(`[LLMTriggerSynthesizer] Split into ${batches.length} batches: ${batches.map(b => b.length).join(', ')} samples each`);

    try {
      // PROGRESSIVE LOADING: Process each batch and emit results as they complete
      // Using individual promises with .then() to emit progressively instead of waiting for all
      let allTriggers: SynthesizedTrigger[] = [];
      const totalBatches = batches.length;
      let completedBatches = 0;

      // Create promises that emit results progressively
      const batchPromises = batches.map((batch, idx) =>
        this.synthesizeBatch(batch, input.uvp, input.profileType, input.industry, idx)
          .then((triggers) => {
            completedBatches++;
            console.log(`[LLMTriggerSynthesizer] Batch ${idx + 1}: ${triggers.length} triggers (${completedBatches}/${totalBatches} complete)`);

            // PROGRESSIVE: Emit batch results immediately via callback
            if (input.onBatchComplete && triggers.length > 0) {
              // Convert to ConsolidatedTrigger format for progressive emission
              const consolidatedTriggers = this.convertToConsolidatedTriggers(triggers);
              console.log(`[LLMTriggerSynthesizer] 🔄 Emitting ${consolidatedTriggers.length} triggers from batch ${idx + 1} (progressive)`);
              input.onBatchComplete(consolidatedTriggers, idx, totalBatches);
            }

            return { triggers, idx };
          })
          .catch((error) => {
            completedBatches++;
            console.error(`[LLMTriggerSynthesizer] Batch ${idx + 1} FAILED:`, error);
            return { triggers: [] as SynthesizedTrigger[], idx };
          })
      );

      // Wait for all to complete (for final deduplication)
      const batchResults = await Promise.all(batchPromises);

      // Collect all triggers from all batches
      batchResults.forEach(({ triggers, idx }) => {
        if (triggers.length > 0) {
          allTriggers = allTriggers.concat(triggers);
        }
      });

      console.log(`[LLMTriggerSynthesizer] Total before dedupe: ${allTriggers.length} triggers`);

      // Deduplicate by title similarity
      const dedupedTriggers = this.deduplicateTriggers(allTriggers);
      console.log(`[LLMTriggerSynthesizer] After dedupe: ${dedupedTriggers.length} unique triggers`);

      // Convert to ConsolidatedTrigger format
      const triggers = this.convertToConsolidatedTriggers(dedupedTriggers);

      const synthesisTime = performance.now() - startTime;

      console.log(`[LLMTriggerSynthesizer] ✅ Synthesized ${triggers.length} triggers in ${synthesisTime.toFixed(0)}ms (PARALLEL)`);

      return {
        triggers,
        synthesisTime,
        model: 'claude-sonnet-4-parallel',
        rawTriggerCount: allTriggers.length,
      };
    } catch (error) {
      console.error('[LLMTriggerSynthesizer] Parallel synthesis failed:', error);

      // Return empty result - let fallback to regex consolidation
      return {
        triggers: [],
        synthesisTime: performance.now() - startTime,
        model: 'failed',
        rawTriggerCount: 0,
      };
    }
  }

  /**
   * Synthesize a single batch of samples via ai-proxy Edge Function
   */
  private async synthesizeBatch(
    samples: RawDataSample[],
    uvp: CompleteUVP,
    profileType: BusinessProfileType,
    industry: string | undefined,
    batchIndex: number
  ): Promise<SynthesizedTrigger[]> {
    console.log(`[LLMTriggerSynthesizer] Batch ${batchIndex + 1}: Processing ${samples.length} samples via ai-proxy`);

    // Build prompt for this batch
    const prompt = this.buildPrompt(samples, uvp, profileType, industry);

    // Call LLM via ai-proxy Edge Function
    const response = await this.callLLMViaProxy(prompt, batchIndex);

    // Parse response
    return this.parseResponse(response);
  }

  /**
   * Deduplicate triggers by title similarity (fuzzy match ~80%)
   */
  private deduplicateTriggers(triggers: SynthesizedTrigger[]): SynthesizedTrigger[] {
    const seen = new Map<string, SynthesizedTrigger>();

    for (const trigger of triggers) {
      // Normalize title for comparison
      if (!trigger.title) continue;
      const normalizedTitle = trigger.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const words = normalizedTitle.split(/\s+/);

      // Check if we've seen a similar title
      let isDuplicate = false;
      for (const [existingNorm, existingTrigger] of seen.entries()) {
        const existingWords = existingNorm.split(/\s+/);

        // Count common words
        const commonWords = words.filter(w => existingWords.includes(w)).length;
        const similarity = commonWords / Math.max(words.length, existingWords.length);

        if (similarity > 0.7) {
          // Keep the one with higher confidence
          if (trigger.confidence > existingTrigger.confidence) {
            seen.delete(existingNorm);
            seen.set(normalizedTitle, trigger);
          }
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.set(normalizedTitle, trigger);
      }
    }

    // Sort by confidence descending, return top 50
    return Array.from(seen.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 50);
  }

  /**
   * Select the most relevant data samples for synthesis
   * IMPORTANT: Ensures all samples have unique IDs for source tracking
   */
  private selectBestSamples(data: RawDataSample[], limit: number): RawDataSample[] {
    // Prioritize samples with psychological language
    const psychKeywords = [
      'afraid', 'worried', 'frustrated', 'want', 'need', 'hate',
      'love', 'struggle', 'difficult', 'expensive', 'slow', 'broken',
      'wish', 'hope', 'fear', 'concern', 'problem', 'issue'
    ];

    const scored = data.map((sample, idx) => {
      const lowerContent = (sample.content || '').toLowerCase();
      const score = psychKeywords.filter(kw => lowerContent.includes(kw)).length;
      // Ensure sample has an ID for source tracking
      const sampleWithId = sample.id ? sample : { ...sample, id: `sample-${idx}-${Date.now()}` };
      return { sample: sampleWithId, score };
    });

    // Sort by score descending, take top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.sample);
  }

  /**
   * PHASE 10: Check source diversity in raw data
   * Validates we have diverse trusted sources before synthesis
   */
  private checkSourceDiversity(data: RawDataSample[]): {
    uniquePlatforms: number;
    platformCounts: Map<string, number>;
    distribution: string;
    hasMinimumDiversity: boolean;
  } {
    const platformCounts = new Map<string, number>();

    data.forEach(sample => {
      const platform = (sample.platform || 'unknown').toLowerCase();
      platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
    });

    const uniquePlatforms = platformCounts.size;

    // Build distribution string for logging
    const distribution = Array.from(platformCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => `${platform}: ${count}`)
      .join(', ');

    // Minimum diversity: at least 2 different platforms
    const hasMinimumDiversity = uniquePlatforms >= 2;

    return {
      uniquePlatforms,
      platformCounts,
      distribution,
      hasMinimumDiversity
    };
  }

  /**
   * Build the extraction prompt
   *
   * TRIGGERS 4.0: This prompt EXTRACTS verbatim quotes from real data.
   * It does NOT synthesize or paraphrase. The title IS the customer's exact words.
   */
  private buildPrompt(
    samples: RawDataSample[],
    uvp: CompleteUVP,
    profileType: BusinessProfileType,
    industry?: string
  ): string {
    const targetCustomer = uvp.targetCustomer?.statement || 'business decision makers';
    const profileContext = PROFILE_CONTEXT[profileType] || PROFILE_CONTEXT['national-saas-b2b'];

    // Extract PRODUCT CATEGORY from UVP
    const productCategory = this.extractProductCategory(uvp);

    // Format samples for the prompt - include URLs for source tracking
    // IMPORTANT: Use global indices from lastSamples, not local batch indices
    const sampleText = samples
      .map((s) => {
        // Find the global index in lastSamples
        const globalIndex = this.lastSamples.findIndex(ls => ls.id === s.id);
        const displayIndex = globalIndex >= 0 ? globalIndex + 1 : this.lastSamples.indexOf(s) + 1;
        const urlPart = s.url ? ` | URL: ${s.url}` : '';
        const authorPart = s.author ? ` | Author: ${s.author}` : '';
        return `[${displayIndex}] (${s.platform}${authorPart}${urlPart})\n"${s.content.substring(0, 400)}"`;
      })
      .join('\n\n');

    // Get profile-specific validation criteria
    const validationCriteria = PROFILE_VALIDATION_CRITERIA[profileType] || PROFILE_VALIDATION_CRITERIA['national-saas-b2b'];

    // PHASE E: Get profile-specific trigger emphasis
    const triggerEmphasis = PROFILE_TRIGGER_EMPHASIS[profileType] || PROFILE_TRIGGER_EMPHASIS['national-saas-b2b'];

    return `You are a customer voice extractor. Your job is to find and EXTRACT verbatim quotes from real customer posts that reveal buying triggers.

## CRITICAL RULE: NO SYNTHESIS, NO PARAPHRASING

The title field MUST be an EXACT QUOTE (or close excerpt) from the sample data.
DO NOT write your own words. DO NOT paraphrase. DO NOT summarize.

WRONG (synthesized): "Buyers fear getting locked into inflexible vendor contracts"
RIGHT (extracted): "I'm terrified of getting stuck with this vendor for 3 years"

WRONG (paraphrased): "Teams struggle with complex integrations"
RIGHT (extracted): "We've been fighting with their API for 6 months now"

WRONG (marketing speak): "Customers want simpler pricing"
RIGHT (extracted): "Why is it so hard to figure out what this actually costs?"

## Context

**Target Customer**: ${targetCustomer}
**Product Category**: ${productCategory || industry || 'this solution'}
**Business Profile**: ${profileContext}
**Typical Buyer Terms**: ${triggerEmphasis.buyerTerms.join(', ')}

## PHASE E: Profile-Specific Trigger Emphasis

For this ${profileType} business profile, prioritize these psychological categories:
- **PRIMARY** (extract 3-5 each): ${triggerEmphasis.primaryCategories.join(', ')}
- **SECONDARY** (extract 2-3 each): ${triggerEmphasis.secondaryCategories.join(', ')}

**Typical Fears for this profile**: ${triggerEmphasis.typicalFears.join(', ')}
**Typical Desires for this profile**: ${triggerEmphasis.typicalDesires.join(', ')}
**Typical Pain Points for this profile**: ${triggerEmphasis.typicalPainPoints.join(', ')}

## PHASE E: Semantic Inversion Rules (CRITICAL)

DO NOT confuse complaints with desires. Categorize correctly:
- "I hate when X happens" → **pain-point** (NOT desire)
- "I wish X would work" → **desire** (NOT pain-point)
- "I'm scared of X" → **fear** (NOT pain-point)
- "This is terrible because X" → **pain-point** (NOT fear)
- "What if X fails?" → **fear** (NOT objection)
- "I'm not sure about the price" → **objection** (NOT fear)

## Buyer-Product Fit Validation

Only extract quotes that would lead someone to search for ${productCategory || 'this type of product'}.

**Valid types for ${profileType}**: ${validationCriteria.validTriggerTypes.join(', ')}
**REJECT quotes about**: ${validationCriteria.invalidTriggerTypes.join(', ')}

## PHASE E: Competitor Name Inclusion

If a quote mentions a specific competitor by name, INCLUDE the competitor name in the title.
Example: "We switched from [Competitor] because their API was impossible to use"
This helps connect triggers to competitive intelligence.

## Raw Data Samples

${sampleText}

## Instructions

1. Read each sample looking for quotes that express pain, frustration, fear, desire, or urgency
2. EXTRACT the most powerful phrase VERBATIM (8-20 words)
3. The title MUST be words that actually appear in the sample (minor edits for clarity OK)
4. Categorize each quote by psychological type using the semantic inversion rules above
5. Reference the sample index where you found the quote
6. ENSURE all 7 categories are represented (see category quotas below)

## ALL 7 Category Types (MUST include quotes from each)

1. **fear** - Anxiety, worry, risk aversion ("I'm worried...", "What if...", "scared of...")
2. **pain-point** - Frustration, struggle, current problems ("This is so frustrating...", "We've been dealing with...")
3. **desire** - Wants, needs, wishes, aspirations ("I just want...", "We need...", "Looking for...")
4. **objection** - Hesitation, concerns, doubts ("I'm not sure about...", "The problem is...", "Too expensive...")
5. **motivation** - Positive drivers, reasons to act ("We need to grow...", "Excited about...", "Ready to...")
6. **trust** - Credibility concerns, proof needed ("How do I know...", "Can they actually...", "I need proof...")
7. **urgency** - Time pressure, deadlines ("We need this by...", "Running out of time...", "Before competitors...")

## Output Format

Return a JSON array:
\`\`\`json
[
  {
    "category": "pain-point",
    "title": "We've been fighting with their API for 6 months and it still doesn't work",
    "executiveSummary": "Developer frustration with integration complexity. User describes ongoing API struggles - maps to easy integration differentiator.",
    "sampleIds": [3],
    "confidence": 0.9,
    "isTimeSensitive": false,
    "buyerJourneyStage": "problem-aware",
    "buyerProductFit": 0.85,
    "buyerProductFitReasoning": "Developer experiencing integration pain would search for simpler integration tools."
  }
]
\`\`\`

## Executive Summary Format
1. Brief category label (2-3 words)
2. What the user is experiencing (1 sentence, NO "From sample [N]" - just describe the issue)
3. How this maps to the product (1 sentence)

## VALIDATION CHECKLIST (reject if any fail)
- [ ] Title is a REAL QUOTE from the samples (not your words)
- [ ] Quote expresses genuine emotion (fear, frustration, desire, etc.)
- [ ] Person with this pain would search for ${productCategory || 'this product type'}
- [ ] Quote is 8-20 words (not too short, not too long)

## PHASE E: Category Quotas (MUST meet minimums)
Ensure your output includes quotes from ALL 7 categories:
- fear: 2-4 quotes minimum
- pain-point: 3-5 quotes minimum
- desire: 2-4 quotes minimum
- objection: 2-4 quotes minimum
- motivation: 1-3 quotes minimum
- trust: 1-3 quotes minimum
- urgency: 1-3 quotes minimum

Total: 20-30 extracted quotes across all categories. ONLY output the JSON array, no other text.`;
  }

  /**
   * Call the LLM via ai-proxy (fallback method)
   */
  private async callLLM(prompt: string): Promise<string> {
    console.log('[LLMTriggerSynthesizer] Calling Sonnet 4 via ai-proxy...');

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM call failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('[LLMTriggerSynthesizer] Sonnet 4 response received');
    return data.choices[0].message.content;
  }

  /**
   * Call LLM via ai-proxy Edge Function for parallel batch processing
   * Routes through Supabase Edge Function to securely handle API keys
   *
   * PARALLEL PROCESSING: Uses keyIndex to select different OpenRouter keys
   * for each batch, enabling true 4x parallel throughput
   */
  private async callLLMViaProxy(prompt: string, batchIndex: number): Promise<string> {
    console.log(`[LLMTriggerSynthesizer] Batch ${batchIndex + 1}: Calling ai-proxy with keyIndex=${batchIndex} for parallel processing...`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 6000, // Smaller per batch since we're splitting
        keyIndex: batchIndex, // Use different OpenRouter key for each batch (0-3)
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ai-proxy call failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log(`[LLMTriggerSynthesizer] Batch ${batchIndex + 1}: ai-proxy response received (key ${batchIndex + 1})`);
    return data.choices[0].message.content;
  }

  /**
   * Patterns that indicate garbage/meta-commentary in trigger titles
   * These should NEVER appear in valid trigger titles
   */
  private readonly INVALID_TITLE_PATTERNS = [
    /^\*\*note:?\*\*/i,           // **Note:**
    /^\*\*important:?\*\*/i,       // **Important:**
    /^note:/i,                     // Note:
    /^important:/i,                // Important:
    /^warning:/i,                  // Warning:
    /^the search results/i,        // The search results...
    /^based on the/i,              // Based on the...
    /^after analyzing/i,           // After analyzing...
    /^i found/i,                   // I found...
    /^here are/i,                  // Here are...
    /^unfortunately/i,             // Unfortunately...
    /^however/i,                   // However...
    /^this (data|analysis)/i,      // This data/analysis...
    /^the raw data/i,              // The raw data...
    /software publishers/i,        // Random garbage
    /altkomsoftware/i,             // Specific garbage source
    /focus on business benefits/i, // Meta-commentary
    /\[competitor\]/i,             // Unprocessed [competitor] placeholder
    /\[company\]/i,                // Unprocessed [company] placeholder
    /that doesn't align with$/i,   // Cut-off mid-sentence
    /and pricing that$/i,          // Cut-off mid-sentence
    /doesn't align$/i,             // Cut-off incomplete

    // PROMPT LEAKAGE: "From sample [N]:" format leaking into titles
    /from sample \[\d+\]/i,        // "From sample [3]: ..." leaking from executiveSummary format
    /user (expressing|describes|describing)/i, // "user expressing direct frustration..."

    // META-DESCRIPTIONS about data sources (NOT actual insights)
    /^reddit discussions/i,        // "Reddit discussions from r/SaaS..."
    /^linkedin posts/i,            // "LinkedIn posts about..."
    /^discussion threads/i,        // "Discussion threads from..."
    /^real customer quotes/i,      // "Real customer quotes discussing..."
    /^customer satisfaction scores/i, // "Customer satisfaction scores for..."
    /^comparative pricing/i,       // "Comparative pricing across..."
    /capterra shines/i,            // "Capterra shines in product content..."
    /^g2 reviews/i,                // "G2 reviews about..."
    /^trustpilot reviews/i,        // "Trustpilot reviews mentioning..."
    /mentioning the product$/i,    // "...mentioning the product"
    /about these tools$/i,         // "...about these tools"
    /about this ai$/i,             // "...about this AI"
    /provides detailed information/i, // "...provides detailed information..."
    /^youtube videos/i,            // "YouTube videos discussing..."
    /^quora questions/i,           // "Quora questions about..."
    /^forum posts/i,               // "Forum posts from..."
    /startup founders explore/i,   // Generic startup exploration
    /reveals competitive advantages/i, // Meta-analysis language
    /innovative software solutions/i, // Marketing fluff
    /for operational challenges$/i, // Generic endings

    // PHASE K.2: "NO DATA FOUND" responses being displayed as triggers
    /^no (first-person|significant|direct|relevant|specific)/i, // "No first-person quotes...", "No significant narratives..."
    /^no customer (quotes|voices|experiences|narratives)/i, // "No customer quotes found..."
    /^no problem\/surprise narratives/i, // "**No problem/surprise narratives**"
    /narratives were discovered$/i, // "...narratives were discovered"
    /were not found$/i,            // "...were not found"
    /were found in the/i,          // "...were found in the provided search results"
    /^direct quotes from customers who/i, // Meta-description of quote type, not actual quote
    /^quotes? (from|about|describing|expressing)/i, // Description of quotes, not quotes themselves
    /^customer (experience|success)? narratives/i, // Meta-description
    /in the provided search results/i, // Meta-commentary about search
    /the search did not/i,         // Meta-commentary
    /no quotes describing/i,       // "No quotes describing..."
    /concerns about vendor/i,      // Too generic without context

    // PHASE K.2: Generic capability statements (not triggers)
    /^(robotic process|rpa|automation) (transforms|improves|streamlines)/i, // Solution statements, not customer voice
    /transforms workforce efficiency/i, // Marketing speak
    /leverage ai to streamline/i,  // Marketing speak
    /seek transparent solutions/i, // Generic observation
    /addressing their core operational/i, // Generic
    /vendor switching reveals/i,   // Meta-observation
    /reveals critical gaps/i,      // Meta-analysis
  ];

  /**
   * Generic observation patterns that describe behavior without emotional insight
   * These look like triggers but don't reveal actual pain/fear/desire
   */
  private readonly GENERIC_OBSERVATION_PATTERNS = [
    // Behavior observations (not triggers)
    /professionals seek/i,
    /founders (constantly )?(compare|evaluate|explore)/i,
    /companies seek/i,
    /teams (need|want|require|look for)/i,
    /users (often|frequently|typically|commonly)/i,
    /organizations (seek|need|want)/i,
    /businesses (explore|evaluate|compare)/i,
    /buyers (research|compare|evaluate)/i,

    // Generic quality/capability statements
    /provide(s)? (deeper|better|comprehensive|detailed)/i,
    /reveal(s)? competitive advantages/i,
    /offer(s)? (comprehensive|innovative|robust)/i,
    /deliver(s)? (value|results|insights)/i,

    // Meta-commentary about tools/solutions
    /across (startup|saas|software|tech) communities/i,
    /competing solutions/i,
    /software solutions for/i,
    /to make strategic decisions/i,
    /to enhance operational/i,
    /for operational challenges/i,

    // Industry/market observations
    /industry (trends|insights|analysis)/i,
    /market (analysis|comparison|research)/i,
    /platform comparisons/i,
  ];

  /**
   * TRIGGERS 4.0: Valid QUOTE patterns
   * Real quotes contain first-person language, questions, colloquial expressions
   * NOT marketing speak or synthesized summaries
   */
  private readonly VALID_QUOTE_INDICATORS = [
    // First-person language (real quotes)
    /\b(I|I'm|I've|we|we're|we've|my|our|me|us)\b/i,

    // Questions (real customer voice)
    /\?|why (is|are|do|does|can't|won't)|how (do|can|come)|what (is|are|if)/i,

    // Colloquial/emotional language (real speech)
    /honestly|literally|actually|seriously|basically|just|really|so (much|many|hard|frustrated)/i,

    // Frustration expressions
    /frustrat|annoy|hate|sick of|tired of|fed up|can't stand|drives me crazy/i,

    // Fear/worry expressions
    /worried|afraid|scared|terrified|nervous|concerned|anxious/i,

    // Desire expressions
    /wish|hope|want|need|looking for|trying to find|searching for/i,

    // Problem statements
    /problem|issue|struggle|difficult|hard to|can't|won't|doesn't work|broken/i,

    // Time/urgency
    /deadline|running out|urgent|asap|immediately|right now|by (monday|friday|end of)/i,

    // Money concerns
    /expensive|cost|price|budget|afford|pay|money|waste/i,

    // Technical frustration
    /bug|error|crash|slow|broken|down|not working|keeps failing/i,
  ];

  /**
   * TRIGGERS 4.0: Check if title looks like a REAL QUOTE (not synthesized)
   *
   * Real quotes contain first-person language, questions, colloquial speech.
   * Synthesized titles are generic statements without personality.
   */
  private isValidTitle(title: string): boolean {
    if (!title || title.length < 8 || title.length > 150) return false;

    // Check against invalid patterns (meta-commentary, garbage)
    for (const pattern of this.INVALID_TITLE_PATTERNS) {
      if (pattern.test(title)) {
        console.log(`[LLMTriggerSynthesizer] Rejected garbage title: "${title.substring(0, 60)}..."`);
        return false;
      }
    }

    // Check for generic observations (not real quotes)
    for (const pattern of this.GENERIC_OBSERVATION_PATTERNS) {
      if (pattern.test(title)) {
        console.log(`[LLMTriggerSynthesizer] Rejected generic observation: "${title.substring(0, 60)}..."`);
        return false;
      }
    }

    // TRIGGERS 4.0: Require quote-like language (first-person, questions, etc.)
    const looksLikeQuote = this.VALID_QUOTE_INDICATORS.some(pattern => pattern.test(title));
    if (!looksLikeQuote) {
      console.log(`[LLMTriggerSynthesizer] Rejected synthesized title (not a quote): "${title.substring(0, 60)}..."`);
      return false;
    }

    return true;
  }

  /**
   * Recover complete JSON objects from a truncated JSON array
   * When max_tokens is hit, the response may be cut mid-object
   * This extracts all complete objects that were successfully output
   */
  private recoverTruncatedJsonArray(jsonStr: string): any[] {
    const results: any[] = [];

    // Remove leading [ if present
    let str = jsonStr.trim();
    if (str.startsWith('[')) {
      str = str.substring(1);
    }

    // Find complete objects by matching balanced braces
    let depth = 0;
    let objectStart = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        if (depth === 0) {
          objectStart = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objectStart !== -1) {
          // Found a complete object
          const objStr = str.substring(objectStart, i + 1);
          try {
            const obj = JSON.parse(objStr);
            results.push(obj);
          } catch {
            // Invalid object, skip
          }
          objectStart = -1;
        }
      }
    }

    return results;
  }

  /**
   * Parse the LLM response into SynthesizedTrigger[]
   * TRIGGERS 4.0: Now validates output for hallucination indicators before processing
   */
  private parseResponse(response: string): SynthesizedTrigger[] {
    try {
      // TRIGGERS 4.0: Validate raw output for hallucination indicators
      const validationResult = validateLLMOutput(response);
      if (!validationResult.isValid) {
        console.error('[LLMTriggerSynthesizer] Output validation FAILED - hallucination indicators detected:');
        validationResult.errors.forEach(e => {
          console.error(`  - ${e.type}: "${e.pattern.substring(0, 50)}..." (${e.severity})`);
        });
        // Continue processing but log warning - some triggers may still be valid
        console.warn('[LLMTriggerSynthesizer] Continuing with caution...');
      }

      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response;

      // ROBUST FIX: Handle multiple markdown fence formats
      // 1. ```json\n...\n``` (standard)
      // 2. ```\n...\n``` (no language specifier)
      // 3. Leading/trailing text outside fences
      // 4. Multiple possible code blocks (take first one)

      // First try: Look for ```json or ``` code block
      const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim();
      } else {
        // Second try: Strip leading/trailing non-JSON content
        // Find the first [ or { and last ] or }
        const firstBracket = response.search(/[\[{]/);
        const lastBracket = Math.max(response.lastIndexOf(']'), response.lastIndexOf('}'));

        if (firstBracket !== -1 && lastBracket > firstBracket) {
          jsonStr = response.substring(firstBracket, lastBracket + 1);
        }
      }

      // Final cleanup: remove any stray backticks that might have slipped through
      jsonStr = jsonStr.replace(/^`+|`+$/g, '').trim();

      let parsed: any[];
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        // Try to recover from truncated JSON array
        // Find all complete JSON objects in the array
        console.log('[LLMTriggerSynthesizer] JSON parse failed, attempting truncation recovery...');
        const recovered = this.recoverTruncatedJsonArray(jsonStr);
        if (recovered.length > 0) {
          console.log(`[LLMTriggerSynthesizer] Recovered ${recovered.length} complete triggers from truncated response`);
          parsed = recovered;
        } else {
          throw parseError; // Re-throw if recovery failed
        }
      }

      if (!Array.isArray(parsed)) {
        console.warn('[LLMTriggerSynthesizer] Response is not an array');
        return [];
      }

      // Validate each trigger AND filter out garbage titles
      // TRIGGERS 4.0: Only accept sampleIds - evidence format is REMOVED to prevent hallucinations
      const valid = parsed.filter(t => {
        // STRICT validation - sampleIds REQUIRED, evidence format REJECTED
        const hasSampleIds = Array.isArray(t.sampleIds) && t.sampleIds.length > 0;

        if (!t.category || !t.title || !t.executiveSummary || !hasSampleIds) {
          // Log rejection for monitoring
          if (Array.isArray(t.evidence) && t.evidence.length > 0) {
            console.warn(`[LLMTriggerSynthesizer] REJECTED trigger "${t.title}" - uses legacy evidence format (hallucination risk)`);
          }
          return false;
        }

        // Filter out garbage/meta-commentary titles
        if (!this.isValidTitle(t.title)) {
          return false;
        }

        // Filter out executive summaries that contain meta-commentary, placeholders, or prompt leakage
        const summaryGarbagePatterns = [
          /^\*\*note/i,
          /the search results/i,
          /altkomsoftware/i,
          /\[competitor\]/i,
          /\[company\]/i,
          // PHASE K.2: Prompt leakage patterns
          /show the before\/after transformation/i,  // Prompt instruction leaking
          /use testimonials that speak/i,            // Prompt instruction leaking
          /demo how you solve/i,                     // Prompt instruction leaking
          /address this fear head-on/i,              // Prompt instruction leaking
          /use case studies and guarantees/i,        // Prompt instruction leaking
          /there are no quotes/i,                    // "No data" response
          /no quotes describing/i,                   // "No data" response
          /no first-person/i,                        // "No data" response
          /were not found/i,                         // "No data" response
          /in the provided search/i,                 // Meta-commentary
          /Source: (Roots|Saifr|Convin)\./i,         // Raw source names being exposed
        ];

        if (summaryGarbagePatterns.some(p => p.test(t.executiveSummary))) {
          console.log(`[LLMTriggerSynthesizer] Rejected garbage summary for: "${t.title}"`);
          return false;
        }

        // TRIGGERS 4.0: Validate trigger object for hallucination indicators
        const triggerValidation = validateTrigger(t, this.lastSamples.length);
        if (!triggerValidation.isValid) {
          console.warn(`[LLMTriggerSynthesizer] REJECTED trigger "${t.title}" - hallucination validation failed:`);
          triggerValidation.errors.forEach(e => console.warn(`  - ${e.type}: ${e.pattern}`));
          return false;
        }

        // Filter out triggers containing BANNED GENERIC TERMS (NAICS-style)
        const combinedText = `${t.title || ''} ${t.executiveSummary || ''}`.toLowerCase();
        for (const bannedTerm of BANNED_GENERIC_TERMS) {
          if (combinedText.includes((bannedTerm || '').toLowerCase())) {
            console.log(`[LLMTriggerSynthesizer] Rejected trigger with banned term "${bannedTerm}": "${t.title}"`);
            return false;
          }
        }

        return true;
      });

      console.log(`[LLMTriggerSynthesizer] Parsed ${valid.length} valid triggers (rejected ${parsed.length - valid.length} garbage)`);

      // PHASE E: Apply semantic inversion correction
      const corrected = this.correctSemanticInversions(valid);

      // POST-PROCESSING: Clean prompt leakage from titles and summaries
      const cleaned = this.cleanPromptLeakage(corrected);

      return cleaned;
    } catch (error) {
      console.error('[LLMTriggerSynthesizer] Failed to parse response:', error);
      console.log('[LLMTriggerSynthesizer] Raw response:', response.substring(0, 500));
      return [];
    }
  }

  /**
   * PHASE E: Correct semantic inversions in trigger categories
   * Detects when the LLM miscategorized a trigger (e.g., complaint as desire)
   * and corrects the category based on the title text
   */
  private correctSemanticInversions(triggers: SynthesizedTrigger[]): SynthesizedTrigger[] {
    let correctionCount = 0;

    const corrected = triggers.map(trigger => {
      if (!trigger.title) return trigger;
      const title = trigger.title.toLowerCase();
      let newCategory = trigger.category;

      // Check complaint patterns that should be pain-point
      for (const rule of SEMANTIC_INVERSION_RULES.complaintToDesireInversion) {
        if (rule.pattern.test(title) && trigger.category === 'desire') {
          console.log(`[LLMTriggerSynthesizer] PHASE E: Corrected "${trigger.title}" from desire → pain-point`);
          newCategory = rule.correctCategory;
          correctionCount++;
          break;
        }
      }

      // Check desire patterns that should not be pain-point
      for (const rule of SEMANTIC_INVERSION_RULES.desireToComplaintInversion) {
        if (rule.pattern.test(title) && trigger.category === 'pain-point') {
          console.log(`[LLMTriggerSynthesizer] PHASE E: Corrected "${trigger.title}" from pain-point → desire`);
          newCategory = rule.correctCategory;
          correctionCount++;
          break;
        }
      }

      // Check fear patterns
      for (const rule of SEMANTIC_INVERSION_RULES.fearPatterns) {
        if (rule.pattern.test(title) && trigger.category !== 'fear') {
          console.log(`[LLMTriggerSynthesizer] PHASE E: Corrected "${trigger.title}" from ${trigger.category} → fear`);
          newCategory = rule.correctCategory;
          correctionCount++;
          break;
        }
      }

      if (newCategory !== trigger.category) {
        return { ...trigger, category: newCategory };
      }
      return trigger;
    });

    if (correctionCount > 0) {
      console.log(`[LLMTriggerSynthesizer] PHASE E: Applied ${correctionCount} semantic inversion corrections`);
    }

    return corrected;
  }

  /**
   * POST-PROCESSING: Clean prompt leakage from titles and executive summaries
   * Removes patterns like "From sample [N]:", "user expressing...", etc.
   */
  private cleanPromptLeakage(triggers: SynthesizedTrigger[]): SynthesizedTrigger[] {
    const promptLeakagePatterns = [
      // "From sample [N]:" pattern and variations
      /\bfrom sample \[\d+\]:?\s*/gi,
      /\bsample \[\d+\]:?\s*/gi,
      // "user expressing/describes/describing" meta-language
      /\buser (expressing|describes|describing|mentions|says|states)\b[^.]*?\.\s*/gi,
      // "this maps to" meta-commentary
      /\bthis maps to\b[^.]*?\.\s*/gi,
      // Generic leading labels that aren't the actual insight
      /^(user experience frustration|developer frustration|customer complaint)\.\s*/gi,
    ];

    let cleanCount = 0;

    const cleaned = triggers.map(trigger => {
      let title = trigger.title;
      let summary = trigger.executiveSummary;

      // Clean title
      for (const pattern of promptLeakagePatterns) {
        const newTitle = title.replace(pattern, '');
        if (newTitle !== title) {
          title = newTitle.trim();
          cleanCount++;
        }
      }

      // Clean summary
      for (const pattern of promptLeakagePatterns) {
        const newSummary = summary.replace(pattern, '');
        if (newSummary !== summary) {
          summary = newSummary.trim();
        }
      }

      // Capitalize first letter if needed
      if (title && title.length > 0 && title[0] === title[0].toLowerCase()) {
        title = title[0].toUpperCase() + title.slice(1);
      }
      if (summary && summary.length > 0 && summary[0] === summary[0].toLowerCase()) {
        summary = summary[0].toUpperCase() + summary.slice(1);
      }

      return {
        ...trigger,
        title,
        executiveSummary: summary,
      };
    });

    if (cleanCount > 0) {
      console.log(`[LLMTriggerSynthesizer] POST-PROCESSING: Cleaned prompt leakage from ${cleanCount} triggers`);
    }

    return cleaned;
  }

  /**
   * Normalize text for fuzzy matching - removes punctuation, extra spaces, lowercases
   */
  private normalizeForMatching(text: string | null | undefined): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()
      .substring(0, 200);       // Compare first 200 chars for efficiency
  }

  /**
   * Calculate similarity between two strings (0-1)
   * Uses character overlap for speed
   */
  private calculateSimilarity(a: string, b: string): number {
    const normA = this.normalizeForMatching(a);
    const normB = this.normalizeForMatching(b);

    if (!normA || !normB) return 0;
    if (normA === normB) return 1;

    // Check if one contains the other
    if (normA.includes(normB) || normB.includes(normA)) return 0.9;

    // Word overlap calculation
    const wordsA = new Set(normA.split(' ').filter(w => w.length > 3));
    const wordsB = new Set(normB.split(' ').filter(w => w.length > 3));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let overlap = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) overlap++;
    }

    return overlap / Math.max(wordsA.size, wordsB.size);
  }

  /**
   * Find the best matching sample for a quote using fuzzy matching
   * Returns the sample and a confidence score
   */
  private findMatchingSample(quote: string, hintIndex?: number): { sample: RawDataSample | null; confidence: number } {
    if (!quote || this.lastSamples.length === 0) {
      return { sample: null, confidence: 0 };
    }

    // First, check the hinted index if provided
    // TRUST THE SAMPLEINDEX: The LLM provides correct sample references but often
    // paraphrases instead of quoting verbatim. Lower threshold to 0.15 to allow
    // verification when there's minimal word overlap. The sampleIndex is reliable
    // because the LLM is correctly identifying which source it's referencing.
    if (hintIndex && hintIndex > 0 && hintIndex <= this.lastSamples.length) {
      const hintedSample = this.lastSamples[hintIndex - 1];
      const hintSimilarity = this.calculateSimilarity(quote, hintedSample.content);

      // Accept the hinted sample with very low threshold (0.15) since the LLM
      // often paraphrases. The sampleIndex itself is trustworthy.
      if (hintSimilarity > 0.15) {
        return { sample: hintedSample, confidence: Math.max(hintSimilarity, 0.6) };
      }
    }

    // Otherwise, search all samples for the best match
    let bestMatch: RawDataSample | null = null;
    let bestScore = 0;

    for (const sample of this.lastSamples) {
      const similarity = this.calculateSimilarity(quote, sample.content);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = sample;
      }
    }

    // Only return if we have a reasonable match (>0.2)
    // Lowered from 0.3 to account for LLM paraphrasing
    if (bestScore > 0.2 && bestMatch) {
      return { sample: bestMatch, confidence: bestScore };
    }

    return { sample: null, confidence: 0 };
  }

  /**
   * Convert SynthesizedTrigger[] to ConsolidatedTrigger[]
   *
   * TRIGGERS 4.0: Uses sampleIds to look up REAL source data from SourceRegistry.
   * The LLM only provides indices - we look up actual URLs, quotes, and authors
   * from the preserved VerifiedSource objects. This eliminates hallucinated sources.
   */
  private convertToConsolidatedTriggers(synthesized: SynthesizedTrigger[]): ConsolidatedTrigger[] {
    let verifiedCount = 0;
    let unverifiedCount = 0;
    let triangulationStats = { high: 0, moderate: 0, low: 0 };

    const result = synthesized.map((st, idx) => {
      // TRIGGERS 4.0: Build evidence from sampleIds using SourceRegistry
      const evidence: EvidenceItem[] = [];

      // PHASE D: Track source types for triangulation
      const sourceTypes = new Set<SourceType>();

      // Use sampleIds to look up REAL source data from VerifiedSources
      if (st.sampleIds && st.sampleIds.length > 0) {
        for (let i = 0; i < st.sampleIds.length; i++) {
          const sampleIndex = st.sampleIds[i];

          // sampleIds are 1-indexed (as shown in prompt), convert to 0-indexed
          // Look up from lastVerifiedSources (populated from SourceRegistry)
          const verifiedSource = this.lastVerifiedSources[sampleIndex - 1];

          if (verifiedSource) {
            // PHASE D: Track source type for triangulation
            const sourceType = inferSourceType(verifiedSource.platform);
            sourceTypes.add(sourceType);

            // VERIFIED: This is REAL data from SourceRegistry - immutable source of truth
            evidence.push({
              id: verifiedSource.id, // Use SourceRegistry ID for traceability
              source: verifiedSource.communityName || verifiedSource.threadTitle || 'Community discussion',
              platform: verifiedSource.platform,
              quote: verifiedSource.originalContent.substring(0, 500), // Use REAL content from registry
              url: verifiedSource.originalUrl, // REAL URL from SourceRegistry
              author: verifiedSource.originalAuthor, // REAL author from SourceRegistry
              sentiment: this.detectSentiment(verifiedSource.originalContent),
              confidence: st.confidence,
              competitorName: verifiedSource.competitorName,
              // TRIGGERS 4.0: Include registry reference for display layer
              verifiedSourceId: verifiedSource.id,
            });
            verifiedCount++;
          } else {
            // Invalid sample index - log but don't create fake evidence
            console.warn(`[LLMTriggerSynthesizer] Invalid sampleId ${sampleIndex} for trigger "${st.title}"`);
            unverifiedCount++;
          }
        }
      } else if (st.evidence && st.evidence.length > 0) {
        // TRIGGERS 4.0: Legacy evidence format REMOVED - this was the hallucination backdoor
        // LLM output with evidence array should have been rejected in parseResponse validation
        console.warn(`[LLMTriggerSynthesizer] BLOCKED: Trigger "${st.title}" uses legacy evidence format - potential hallucination`);
        unverifiedCount += st.evidence.length;
      }

      // Only create trigger if we have at least one verified evidence
      if (evidence.length === 0) {
        console.warn(`[LLMTriggerSynthesizer] Skipping trigger "${st.title}" - no verified sources`);
      }

      // PHASE D: Apply triangulation confidence multiplier
      const triangulationMultiplier = calculateTriangulationMultiplier(sourceTypes);
      const adjustedConfidence = Math.min(0.99, st.confidence * triangulationMultiplier);

      // Track triangulation stats
      if (sourceTypes.size >= 3) triangulationStats.high++;
      else if (sourceTypes.size === 2) triangulationStats.moderate++;
      else triangulationStats.low++;

      return {
        id: `llm-trigger-${idx}`,
        category: st.category,
        title: st.title,
        executiveSummary: st.executiveSummary,
        confidence: adjustedConfidence, // PHASE D: Use triangulation-adjusted confidence
        evidenceCount: evidence.length,
        evidence,
        uvpAlignments: [], // Will be filled by consolidation service
        isTimeSensitive: st.isTimeSensitive,
        profileRelevance: 1.0, // Will be adjusted by consolidation service
        rawSourceIds: evidence.map(e => e.id),
        isLLMSynthesized: true, // Flag to skip regex processing
        buyerJourneyStage: st.buyerJourneyStage || 'problem-aware',
        buyerProductFit: st.buyerProductFit || adjustedConfidence,
        buyerProductFitReasoning: st.buyerProductFitReasoning,
        // PHASE D: Add triangulation metadata
        sourceTypeCount: sourceTypes.size,
        triangulationMultiplier,
      } as ConsolidatedTrigger & {
        isLLMSynthesized: boolean;
        buyerJourneyStage: BuyerJourneyStage;
        buyerProductFit: number;
        buyerProductFitReasoning?: string;
        sourceTypeCount: number;
        triangulationMultiplier: number;
      };
    });

    // Filter out triggers with no verified evidence
    const validTriggers = result.filter(t => t.evidenceCount > 0);

    // Log verification stats
    console.log(`[LLMTriggerSynthesizer] TRIGGERS 4.0 Source Verification:`);
    console.log(`  - Verified sources: ${verifiedCount}`);
    console.log(`  - Unverified/invalid: ${unverifiedCount}`);
    console.log(`  - Triggers with verified sources: ${validTriggers.length}/${result.length}`);

    // PHASE D: Log triangulation stats
    console.log(`[LLMTriggerSynthesizer] PHASE D Triangulation Stats:`);
    console.log(`  - High confidence (3+ source types): ${triangulationStats.high}`);
    console.log(`  - Moderate confidence (2 source types): ${triangulationStats.moderate}`);
    console.log(`  - Low confidence (1 source type): ${triangulationStats.low}`);

    return validTriggers;
  }

  /**
   * Simple sentiment detection
   */
  private detectSentiment(text: string | null | undefined): 'positive' | 'negative' | 'neutral' {
    if (!text) return 'neutral';
    const lower = text.toLowerCase();
    const negativeWords = ['hate', 'frustrated', 'angry', 'terrible', 'awful', 'worst', 'fail', 'broken'];
    const positiveWords = ['love', 'great', 'amazing', 'excellent', 'best', 'wonderful', 'perfect'];

    const negScore = negativeWords.filter(w => lower.includes(w)).length;
    const posScore = positiveWords.filter(w => lower.includes(w)).length;

    if (negScore > posScore) return 'negative';
    if (posScore > negScore) return 'positive';
    return 'neutral';
  }

  /**
   * Extract product category from UVP
   * This is CRITICAL for buyer-product fit validation
   *
   * Works across all 6 profile types by using actual UVP text, not hardcoded keywords
   */
  private extractProductCategory(uvp: CompleteUVP): string {
    // Priority order: Unique Solution > Key Benefit > Transformation
    // These fields describe WHAT the product/service actually is

    const uniqueSolution = uvp.uniqueSolution?.statement?.trim() || '';
    const keyBenefit = uvp.keyBenefit?.statement?.trim() || '';
    const transformation = uvp.transformationGoal?.statement?.trim() || uvp.transformationGoal?.after?.trim() || '';

    // Use Unique Solution if available (most specific description of product)
    if (uniqueSolution && uniqueSolution.length > 10) {
      // Extract a concise version (first sentence or first 100 chars)
      const firstSentence = uniqueSolution.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 150) {
        return firstSentence.trim();
      }
      // Fallback to truncated version
      return uniqueSolution.substring(0, 100).trim();
    }

    // Use Key Benefit if no unique solution
    if (keyBenefit && keyBenefit.length > 10) {
      const firstSentence = keyBenefit.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 150) {
        return firstSentence.trim();
      }
      return keyBenefit.substring(0, 100).trim();
    }

    // Use Transformation goal
    if (transformation && transformation.length > 10) {
      return transformation.substring(0, 100).trim();
    }

    // Last resort fallback
    return 'this product/service';
  }
}

// Export singleton
export const llmTriggerSynthesizer = new LLMTriggerSynthesizerService();
