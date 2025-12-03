/**
 * Trigger Consolidation Service
 *
 * Groups raw conversations/quotes as evidence under synthesized psychological triggers.
 * Deduplicates overlapping data and creates executive summaries.
 *
 * Input: Raw insights from DeepContext (triggers + conversations mixed)
 * Output: Consolidated triggers with nested evidence
 *
 * Created: 2025-11-28
 */

import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import {
  profileDetectionService,
  type BusinessProfileType,
  type ProfileTriggerConfig
} from './_archived/profile-detection.service';
import { triggerRelevanceScorerService } from './trigger-relevance-scorer.service';
import { sourceQualityService } from './_archived/source-quality.service';
import { buyerProductFitService } from './buyer-product-fit.service';
import { jtbdValidatorService } from './jtbd-validator.service';

// ============================================================================
// TYPES
// ============================================================================

export type TriggerCategory =
  | 'fear'
  | 'desire'
  | 'pain-point'
  | 'objection'
  | 'motivation'
  | 'trust'
  | 'urgency';

export interface EvidenceItem {
  id: string;
  source: string;
  platform: string;
  quote: string;
  url?: string;
  author?: string;
  timestamp?: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'complaint' | 'desire' | 'comparison';
  confidence: number;
  /** Competitor name if this evidence is about a specific competitor */
  competitorName?: string;
  /** TRIGGERS 4.0: Reference to SourceRegistry entry for verified source lookup */
  verifiedSourceId?: string;
}

export interface UVPAlignment {
  component: 'target_customer' | 'key_benefit' | 'transformation' | 'unique_solution';
  matchScore: number;
  matchReason: string;
}

/** Buyer journey stage - where the buyer is in their decision process */
export type BuyerJourneyStage = 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';

export interface ConsolidatedTrigger {
  id: string;
  category: TriggerCategory;
  title: string;
  executiveSummary: string;
  confidence: number;
  evidenceCount: number;
  evidence: EvidenceItem[];
  uvpAlignments: UVPAlignment[];
  isTimeSensitive: boolean;
  profileRelevance: number; // 0-1, how relevant to detected business profile
  rawSourceIds: string[]; // IDs of raw insights that were consolidated
  /** Relevance score from UVP/profile matching */
  relevanceScore?: number;
  /** Whether this trigger passed relevance filtering */
  isRelevant?: boolean;
  /** Source quality tier */
  sourceTier?: 'tier1' | 'tier2' | 'tier3';
  /** Flag indicating this trigger was synthesized by LLM (skip regex processing) */
  isLLMSynthesized?: boolean;
  /** Buyer journey stage from buyer-product fit analysis */
  buyerJourneyStage?: BuyerJourneyStage;
  /** Buyer-product fit score (0-1) - how well this trigger matches the target buyer */
  buyerProductFit?: number;
  /** Reasoning for why this trigger matches the target buyer (from fit validation) */
  buyerProductFitReasoning?: string;
  // =========================================================================
  // V5 SIMPLIFIED: DEPRECATED CONFIDENCE THEATER FIELDS
  // These fields are kept for backwards compatibility but are no longer used.
  // V5 displays only "Backed by X sources" - honest metric instead of misleading scores.
  // See: TRIGGERS_V5_SIMPLIFIED_BUILD_PLAN.md Phase 5
  // =========================================================================

  /** @deprecated V5 Simplified: Use evidence.length instead */
  sourceTypeCount?: number;
  /** @deprecated V5 Simplified: Removed - misleading multiplier */
  triangulationMultiplier?: number;
  /** @deprecated V5 Simplified: Removed - misleading alignment score */
  uvpAlignmentScore?: number;
  /** @deprecated V5 Simplified: Removed - use uvpAlignments.length instead */
  uvpAlignmentCount?: number;
  /** @deprecated V5 Simplified: Removed from UI - UVP Match badge deleted */
  isHighUVPAlignment?: boolean;
  /** @deprecated V5 Simplified: Removed - misleading quality multiplier */
  sourceQualityMultiplier?: number;
  /** @deprecated V5 Simplified: Removed - misleading category weighting */
  categoryWeightMultiplier?: number;
  /** @deprecated V5 Simplified: Removed - not displayed in UI */
  isPrimaryCategory?: boolean;
  /** @deprecated V5 Simplified: Removed - not displayed in UI */
  isCategoryFill?: boolean;
}

/** PHASE H: Category gap analysis result */
export interface CategoryGapAnalysis {
  underrepresentedCategories: TriggerCategory[];
  categoryGaps: Record<TriggerCategory, number>;
  totalGap: number;
  needsRebalancing: boolean;
}

/** Summary of data sources that contributed to the triggers */
export interface DataSourceSummary {
  /** Total number of data points collected */
  totalDataPoints: number;
  /** Breakdown by source platform */
  bySource: Record<string, number>;
  /** Human-readable summary string */
  summary: string;
}

export interface TriggerConsolidationResult {
  triggers: ConsolidatedTrigger[];
  profileType: BusinessProfileType;
  profileConfig: ProfileTriggerConfig;
  totalEvidenceItems: number;
  deduplicatedCount: number;
  /** Number of triggers filtered out for irrelevance */
  filteredCount: number;
  /** Average relevance score of remaining triggers */
  avgRelevanceScore: number;
  /** Summary of data sources that drove these insights */
  sourceSummary?: DataSourceSummary;
}

// ============================================================================
// TRIGGER CATEGORY PATTERNS
// ============================================================================

const CATEGORY_PATTERNS: Record<TriggerCategory, RegExp[]> = {
  'fear': [
    /afraid|scared|worried|anxious|nervous/i,
    /fear of|terrified|dread|panic/i,
    /what if|might fail|could go wrong/i,
    /risk|danger|threat|losing/i,
    /nightmare|disaster|catastroph/i
  ],
  'desire': [
    /want|wish|hope|dream|aspire/i,
    /looking for|searching for|need/i,
    /would love|would like|desire/i,
    /goal|ambition|vision/i,
    /finally|achieve|accomplish/i
  ],
  'pain-point': [
    /frustrat|annoy|hate|can't stand/i,
    /problem|issue|challenge|struggle/i,
    /broken|doesn't work|failed/i,
    /waste|inefficient|tedious/i,
    /stuck|trapped|limited/i
  ],
  'objection': [
    /too expensive|cost|price|budget/i,
    /don't have time|too busy|no time/i,
    /not sure|skeptic|doubt/i,
    /tried before|didn't work|failed/i,
    /complicated|difficult|hard to/i
  ],
  'motivation': [
    /excited|eager|ready|motivated/i,
    /opportunity|potential|possible/i,
    /grow|improve|better|upgrade/i,
    /success|win|achieve|accomplish/i,
    /transform|change|evolve/i
  ],
  'trust': [
    /trust|reliable|dependable|credible/i,
    /proven|verified|certified|guaranteed/i,
    /reputation|reviews|testimonial/i,
    /expert|professional|experienced/i,
    /safe|secure|protected/i
  ],
  'urgency': [
    /now|immediately|urgent|asap/i,
    /limited|deadline|expir/i,
    /before|running out|last chance/i,
    /falling behind|competitors|catching up/i,
    /time-sensitive|act fast/i
  ]
};

const CATEGORY_LABELS: Record<TriggerCategory, string> = {
  'fear': 'Fear',
  'desire': 'Desire',
  'pain-point': 'Pain Point',
  'objection': 'Objection',
  'motivation': 'Motivation',
  'trust': 'Trust Signal',
  'urgency': 'Urgency'
};

// ============================================================================
// PHASE H: PROFILE-SPECIFIC CATEGORY WEIGHTS
// ============================================================================

/**
 * PHASE H: Profile-specific category weighting
 * Primary categories get 1.25x boost, secondary get 1.1x, others get 1.0x
 * This ensures triggers in profile-relevant categories surface higher
 */
const PROFILE_CATEGORY_WEIGHTS: Record<BusinessProfileType, {
  primaryCategories: TriggerCategory[];
  secondaryCategories: TriggerCategory[];
  minTriggersPerCategory: number;
}> = {
  'local-service-b2b': {
    primaryCategories: ['fear', 'trust', 'urgency'],
    secondaryCategories: ['pain-point', 'objection'],
    minTriggersPerCategory: 3
  },
  'local-service-b2c': {
    primaryCategories: ['trust', 'fear', 'desire'],
    secondaryCategories: ['pain-point', 'urgency'],
    minTriggersPerCategory: 3
  },
  'regional-b2b-agency': {
    primaryCategories: ['objection', 'trust', 'fear'],
    secondaryCategories: ['motivation', 'desire'],
    minTriggersPerCategory: 4
  },
  'regional-retail-b2c': {
    primaryCategories: ['desire', 'trust', 'urgency'],
    secondaryCategories: ['pain-point', 'objection'],
    minTriggersPerCategory: 3
  },
  'national-saas-b2b': {
    primaryCategories: ['fear', 'objection', 'pain-point'],
    secondaryCategories: ['trust', 'motivation'],
    minTriggersPerCategory: 5
  },
  'national-product-b2c': {
    primaryCategories: ['desire', 'trust', 'objection'],
    secondaryCategories: ['fear', 'motivation'],
    minTriggersPerCategory: 4
  },
  'global-saas-b2b': {
    primaryCategories: ['fear', 'trust', 'objection'],
    secondaryCategories: ['motivation', 'urgency'],
    minTriggersPerCategory: 5
  }
};

// Category weight multipliers
const PRIMARY_CATEGORY_WEIGHT = 1.25;
const SECONDARY_CATEGORY_WEIGHT = 1.1;
const TERTIARY_CATEGORY_WEIGHT = 1.0;

// ============================================================================
// CONSOLIDATION SERVICE
// ============================================================================

// Source names that indicate AI-generated content WITHOUT a real backing URL
// NOTE: 'perplexity' is NOT invalid when we HAVE a URL from its citations!
// We only reject when the SOURCE NAME itself is generic (e.g., "Perplexity AI" as the source)
const INVALID_SOURCE_NAMES = [
  'perplexity ai', 'perplexity', // Only when this IS the source name (not the platform)
  'ai-generated', 'ai-synthesized', 'industry research',
  'multi-source', 'correlated analysis', 'breakthrough analysis',
  'customer psychology', 'analysis', 'intelligence',
  'synthesis', 'research' // Generic source names
];

class TriggerConsolidationService {
  private maxEvidencePerTrigger = 5;
  private maxInputEvidence = 150; // Cap input to prevent 1000+ item processing
  private maxOutputTriggers = 75; // Cap output triggers

  /**
   * Validates that an evidence item has a real, verifiable source URL
   * Returns false for AI-generated content without backing data
   *
   * IMPORTANT: If we have a real URL (e.g., from Perplexity citations), we KEEP the evidence!
   * The platform being "Perplexity Research" is fine as long as the URL is a real source.
   */
  private hasValidSourceUrl(evidence: EvidenceItem): boolean {
    // Must have a URL that starts with http
    if (!evidence.url || !evidence.url.startsWith('http')) {
      return false;
    }

    // Check if the URL itself is from a real domain (not just perplexity.ai)
    const urlLower = evidence.url.toLowerCase();
    if (urlLower.includes('perplexity.ai')) {
      // This is a perplexity URL, not a real source URL
      return false;
    }

    // Check if source name is EXACTLY a generic AI name (not just contains)
    // This allows "Forbes - AI article title" but rejects "Perplexity AI" as source
    const sourceLower = (evidence.source || '').toLowerCase().trim();

    for (const invalid of INVALID_SOURCE_NAMES) {
      // Exact match or source is ONLY this generic name
      if (sourceLower === invalid || sourceLower === invalid + ' ai' || sourceLower === 'ai ' + invalid) {
        return false;
      }
    }

    // If we have a real URL and source isn't purely generic, accept it
    return true;
  }

  /**
   * Trusted scraper sources - these provide verified data and don't need URL validation
   * Data from these platforms comes from Apify scrapers, not AI synthesis
   */
  private readonly TRUSTED_SCRAPER_SOURCES = [
    'twitter', 'x', 'x.com',
    'reddit', 'r/',
    'hackernews', 'hacker news', 'hn', 'ycombinator',
    'g2', 'g2crowd',
    'capterra',
    'trustradius',
    'trustpilot',
    'youtube', 'yt'
  ];

  /**
   * Check if evidence comes from a trusted scraper source
   * Scraper data doesn't need URL validation - it's already from real platforms
   */
  private isFromTrustedScraperSource(evidence: EvidenceItem): boolean {
    const sourceLower = (evidence.source || '').toLowerCase();
    const platformLower = (evidence.platform || '').toLowerCase();

    return this.TRUSTED_SCRAPER_SOURCES.some(trusted =>
      sourceLower.includes(trusted) || platformLower.includes(trusted)
    );
  }

  /**
   * Filters evidence to only include valid items
   * PHASE L.3: Different validation for Perplexity vs Scraper data
   *
   * - Perplexity data: MUST have real URLs (that's where garbage comes from)
   * - Scraper data: URL optional, just check quote quality
   */
  private filterValidEvidence(evidence: EvidenceItem[]): EvidenceItem[] {
    const valid: EvidenceItem[] = [];
    let urlFilteredCount = 0;
    let quoteFilteredCount = 0;

    for (const e of evidence) {
      const isScraperData = this.isFromTrustedScraperSource(e);

      // For Perplexity/AI data: require valid URLs
      // For Scraper data: skip URL check (data is already verified)
      if (!isScraperData && !this.hasValidSourceUrl(e)) {
        urlFilteredCount++;
        continue;
      }

      // PHASE L.3: Check quote quality (applies to ALL sources)
      // Must have meaningful content, not "no data" or marketing copy
      if (!e.quote || e.quote.length < 20) {
        quoteFilteredCount++;
        continue;
      }

      if (this.isNoDataResponse(e.quote) || this.isMarketingCopy(e.quote)) {
        quoteFilteredCount++;
        continue;
      }

      valid.push(e);
    }

    const totalFiltered = urlFilteredCount + quoteFilteredCount;
    if (totalFiltered > 0) {
      console.log(`[TriggerConsolidation] PHASE L: Filtered ${totalFiltered} evidence items (URL: ${urlFilteredCount}, Quote: ${quoteFilteredCount})`);
    }
    return valid;
  }

  /**
   * Process pre-formatted LLM triggers (skip extraction/categorization)
   * Only applies: UVP alignment, profile weighting, relevance scoring, sorting
   */
  processLLMTriggers(
    llmTriggers: ConsolidatedTrigger[],
    uvp: CompleteUVP,
    brandData?: any,
    profileOverride?: {
      profileType?: BusinessProfileType;
      geographicScope?: 'local' | 'regional' | 'national' | 'global';
      primaryRegions?: string[];
    }
  ): TriggerConsolidationResult {
    // Detect business profile
    let profileAnalysis = profileDetectionService.detectProfile(uvp, brandData);

    if (profileOverride?.profileType) {
      profileAnalysis = {
        ...profileAnalysis,
        profileType: profileOverride.profileType,
        scope: profileOverride.geographicScope || profileAnalysis.scope,
      };
    }

    const profileConfig = profileDetectionService.getProfileConfig(profileAnalysis.profileType);

    console.log('[TriggerConsolidation] Processing', llmTriggers.length, 'LLM-synthesized triggers');

    // PHASE M: Trust the LLM synthesizer output!
    // The synthesizer already did the hard work of extracting psychological insights from raw data.
    // We should NOT filter evidence after synthesis - the triggers themselves ARE the insights.
    // Only require at least 1 evidence item (can be empty quote for synthesized insights).
    const triggersWithValidEvidence = llmTriggers.filter(trigger => {
      // Keep triggers even with no evidence - the title/summary IS the insight
      // Only reject if literally empty trigger
      if (!trigger.title || trigger.title.length < 10) {
        console.log(`[TriggerConsolidation] Rejecting empty trigger`);
        return false;
      }
      return true;
    });

    console.log(`[TriggerConsolidation] ${triggersWithValidEvidence.length} triggers passed (${llmTriggers.length - triggersWithValidEvidence.length} empty rejected)`);

    // Skip extraction/categorization/grouping - triggers are already formatted
    // Just apply scoring and filtering

    // 0. Apply Buyer-Product Fit and JTBD validation (Phase 8 validators)
    const validatedTriggers = this.applyBuyerProductFitValidation(
      triggersWithValidEvidence,
      uvp,
      profileAnalysis.profileType
    );

    console.log(`[TriggerConsolidation] ${validatedTriggers.length} triggers passed buyer-product fit validation`);

    // 1. Calculate UVP alignments
    const triggersWithAlignment = this.calculateUVPAlignment(validatedTriggers, uvp);

    // 2. Apply profile-based weighting
    const weightedTriggers = this.applyProfileWeighting(triggersWithAlignment, profileConfig);

    // 3. Apply relevance scoring and filter
    const { relevantTriggers, filteredCount } = this.applyRelevanceScoring(
      weightedTriggers,
      uvp,
      profileAnalysis.profileType,
      brandData
    );

    // 4. Apply source quality weighting (profile-aware)
    const qualityWeightedTriggers = this.applySourceQualityWeighting(relevantTriggers, profileAnalysis.profileType);

    // 5. PHASE H: Apply category weighting (profile-aware)
    const categoryWeightedTriggers = this.applyCategoryWeighting(qualityWeightedTriggers, profileAnalysis.profileType);

    // 6. PHASE H: Analyze category distribution and get gap analysis
    const gapAnalysis = this.analyzeCategoryDistribution(categoryWeightedTriggers, profileAnalysis.profileType);

    // 7. PHASE H: Enforce minimum triggers per category (boost underrepresented)
    const balancedTriggers = this.enforceCategoryMinimums(categoryWeightedTriggers, profileAnalysis.profileType, gapAnalysis);

    // 8. Sort by relevance and confidence
    const sortedTriggers = this.sortTriggers(balancedTriggers);

    const avgRelevanceScore = sortedTriggers.length > 0
      ? sortedTriggers.reduce((sum, t) => sum + (t.relevanceScore || 0), 0) / sortedTriggers.length
      : 0;

    console.log(`[TriggerConsolidation] LLM triggers processed: ${sortedTriggers.length} passed, ${filteredCount} filtered`);

    return {
      triggers: sortedTriggers,
      profileType: profileAnalysis.profileType,
      profileConfig,
      totalEvidenceItems: llmTriggers.reduce((sum, t) => sum + t.evidenceCount, 0),
      deduplicatedCount: 0,
      filteredCount,
      avgRelevanceScore
    };
  }

  /**
   * Consolidate raw insights into grouped triggers with evidence
   */
  consolidate(
    deepContext: DeepContext,
    uvp: CompleteUVP,
    brandData?: any,
    profileOverride?: {
      profileType?: BusinessProfileType;
      geographicScope?: 'local' | 'regional' | 'national' | 'global';
      primaryRegions?: string[];
    }
  ): TriggerConsolidationResult {
    // 1. Detect business profile (or use override from BrandProfileContext)
    let profileAnalysis = profileDetectionService.detectProfile(uvp, brandData);

    // Apply profile override if provided (user manually changed their profile)
    if (profileOverride?.profileType) {
      console.log('[TriggerConsolidation] Using profile override:', profileOverride.profileType);
      profileAnalysis = {
        ...profileAnalysis,
        profileType: profileOverride.profileType,
        scope: profileOverride.geographicScope || profileAnalysis.scope,
      };
    }

    const profileConfig = profileDetectionService.getProfileConfig(profileAnalysis.profileType);

    console.log('[TriggerConsolidation] Detected profile:', profileAnalysis.profileType, profileAnalysis.signals);

    // 2. Extract all raw evidence from DeepContext
    const rawEvidence = this.extractRawEvidence(deepContext);

    // 2.5 CRITICAL: Filter to only evidence with valid source URLs
    const validEvidence = this.filterValidEvidence(rawEvidence);
    console.log(`[TriggerConsolidation] ${validEvidence.length} of ${rawEvidence.length} evidence items have valid source URLs`);

    // If no valid evidence, return empty result
    if (validEvidence.length === 0) {
      console.warn('[TriggerConsolidation] No evidence with valid source URLs found - returning empty result');
      return {
        triggers: [],
        profileType: profileAnalysis.profileType,
        profileConfig,
        totalEvidenceItems: 0,
        deduplicatedCount: rawEvidence.length,
        filteredCount: rawEvidence.length,
        avgRelevanceScore: 0
      };
    }

    // 3. Categorize evidence by trigger type
    const categorizedEvidence = this.categorizeEvidence(validEvidence);

    // 4. Group similar evidence into triggers
    const groupedTriggers = this.groupIntoTriggers(categorizedEvidence);

    // 5. Synthesize executive summaries
    const triggersWithSummaries = this.synthesizeSummaries(groupedTriggers, uvp, profileConfig);

    // 6. Calculate UVP alignments
    const triggersWithAlignment = this.calculateUVPAlignment(triggersWithSummaries, uvp);

    // 7. Apply profile-based weighting
    const weightedTriggers = this.applyProfileWeighting(triggersWithAlignment, profileConfig);

    // 8. NEW: Apply relevance scoring and filter irrelevant triggers
    const { relevantTriggers, filteredCount } = this.applyRelevanceScoring(
      weightedTriggers,
      uvp,
      profileAnalysis.profileType,
      brandData
    );

    // 9. Apply source quality weighting (profile-aware)
    const qualityWeightedTriggers = this.applySourceQualityWeighting(relevantTriggers, profileAnalysis.profileType);

    // 10. Sort by relevance and confidence
    const sortedTriggers = this.sortTriggers(qualityWeightedTriggers);

    // 10.5. DEDUPLICATE similar triggers to avoid repetitive content
    const deduplicatedTriggers = this.deduplicateSimilarTriggers(sortedTriggers);
    console.log(`[TriggerConsolidation] Deduplicated: ${sortedTriggers.length} → ${deduplicatedTriggers.length} triggers`);

    // 11. CAP output to maxOutputTriggers
    const cappedTriggers = deduplicatedTriggers.slice(0, this.maxOutputTriggers);

    // Calculate average relevance
    const avgRelevanceScore = cappedTriggers.length > 0
      ? cappedTriggers.reduce((sum, t) => sum + (t.relevanceScore || 0), 0) / cappedTriggers.length
      : 0;

    console.log(`[TriggerConsolidation] ${sortedTriggers.length} triggers created, returning top ${cappedTriggers.length} (capped at ${this.maxOutputTriggers}), ${filteredCount} filtered out`);

    // Calculate source summary from all evidence used in final triggers
    const sourceSummary = this.calculateSourceSummary(cappedTriggers);

    return {
      triggers: cappedTriggers,
      profileType: profileAnalysis.profileType,
      profileConfig,
      totalEvidenceItems: rawEvidence.length,
      deduplicatedCount: rawEvidence.length - sortedTriggers.reduce((sum, t) => sum + t.evidence.length, 0),
      filteredCount,
      avgRelevanceScore,
      sourceSummary
    };
  }

  /**
   * Calculate a summary of data sources that contributed to the triggers
   */
  private calculateSourceSummary(triggers: ConsolidatedTrigger[]): DataSourceSummary {
    const bySource: Record<string, number> = {};
    let totalDataPoints = 0;

    // Count evidence items by platform
    triggers.forEach(trigger => {
      trigger.evidence.forEach(ev => {
        const platform = ev.platform || ev.source || 'Unknown';
        bySource[platform] = (bySource[platform] || 0) + 1;
        totalDataPoints++;
      });
    });

    // Generate human-readable summary
    const sortedSources = Object.entries(bySource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 sources

    const summaryParts = sortedSources.map(([source, count]) => `${source} (${count})`);
    const summary = `${totalDataPoints} data points from ${Object.keys(bySource).length} sources: ${summaryParts.join(', ')}`;

    console.log(`[TriggerConsolidation] Source summary: ${summary}`);

    return {
      totalDataPoints,
      bySource,
      summary
    };
  }

  // ============================================================================
  // EXTRACTION
  // ============================================================================

  /**
   * Psychological keywords that indicate genuine buyer triggers
   * Content must contain at least one of these to be considered
   * EXPANDED to cover all 6 business profile categories
   */
  private readonly psychologicalKeywords = [
    // Fear/anxiety (emotional core)
    'afraid', 'scared', 'worried', 'anxious', 'fear', 'risk', 'danger', 'threat', 'concern',
    'nervous', 'dread', 'panic', 'terrified', 'nightmare', 'disaster', 'catastroph',

    // Pain/frustration
    'frustrated', 'annoyed', 'struggling', 'difficult', 'problem', 'issue', 'pain', 'challenge',
    'hate', 'terrible', 'awful', 'broken', 'waste', 'inefficient', 'tedious', 'stuck',

    // Desire/aspiration
    'want', 'need', 'wish', 'hope', 'looking for', 'searching', 'dream', 'goal',
    'desire', 'aspire', 'achieve', 'accomplish', 'finally', 'if only', 'why can\'t',

    // Trust/validation
    'trust', 'reliable', 'proven', 'recommended', 'reviews', 'testimonial',
    'credible', 'reputation', 'verified', 'certified', 'guaranteed',

    // Objections/hesitation
    'hesitat', 'skeptic', 'doubt', 'unsure', 'uncertain', 'not sure',
    'too expensive', 'complicated', 'hard to', 'tried before', 'didn\'t work',

    // Urgency
    'urgent', 'deadline', 'asap', 'immediately', 'now', 'quickly',
    'running out', 'last chance', 'falling behind', 'competitors',

    // Business context (B2B)
    'roi', 'cost', 'budget', 'savings', 'efficiency', 'productivity', 'automation',
    'integration', 'scale', 'growth', 'enterprise', 'compliance', 'security',
    'vendor', 'lock-in', 'migration', 'implementation', 'onboarding',

    // Customer experience (B2C & B2B)
    'customer', 'support', 'service', 'response', 'wait', 'abandon',
    'experience', 'journey', 'conversion', 'quality',

    // Industry-specific (Local, Retail, SaaS)
    'booking', 'appointment', 'schedule', 'location', 'delivery', 'shipping',
    'return', 'refund', 'review', 'rating', 'chatbot', 'ai', 'quote'
  ];

  /**
   * Patterns that indicate website marketing copy (NOT discovered insights)
   * These are things the company says about itself, not customer discoveries
   *
   * NOTE: Be careful not to filter customer psychology that uses similar language
   * "Fear of implementation" is valid, "Implement our solution" is not
   */
  private readonly marketingCopyPatterns = [
    // Direct benefit claims from website (specific percentage claims)
    /convert \d+%/i,                    // "Convert 15% more quotes"
    /reduce.*by \d+%/i,                 // "Reduce costs by 60%"
    /save.*\d+%/i,                      // "Save 40% on support"
    /increase.*by \d+%/i,               // "Increase efficiency by 50%"
    /improve.*by \d+%/i,                // "Improve conversion by 30%"
    /cut.*by \d+%/i,                    // "Cut support costs by 60%"
    /boost.*by \d+%/i,                  // "Boost sales by 25%"

    // Website tagline patterns (first-person company voice)
    /the only.*platform/i,              // "The only platform that..."
    /^we (help|enable|empower|deliver)/i, // "We help companies..."
    /^our (solution|platform|product)/i,  // "Our solution provides..."
    /with \w+ you (can|will|get)/i,     // "With OpenDialog you can..."

    // Promotional superlatives
    /award-winning/i,
    /industry-leading/i,
    /best-in-class/i,
    /world-class/i,
    /cutting-edge/i,
    /state-of-the-art/i,
    /revolutionary/i,
    /game-changing/i,

    // Case study headlines (not customer quotes)
    /case study:/i,
    /success story:/i,
    /how \w+ achieved/i,
    /how we helped/i,

    // REMOVED: Action verb patterns that were too aggressive
    // These were filtering valid customer fears like "Fear of implementation disrupting..."
    // Now we only filter when it's clearly a recommendation TO the reader
    /^(you should|you need to|you must|we recommend)/i,
    /^(start|begin|try|use|get) (your|our|the)/i,
  ];

  /**
   * Check if text is marketing copy from the company website
   */
  private isMarketingCopy(text: string): boolean {
    return this.marketingCopyPatterns.some(pattern => pattern.test(text));
  }

  /**
   * PHASE K.2: Detect "no data found" LLM responses
   * These are meta-responses from Perplexity/Claude saying they couldn't find customer quotes
   * They should NEVER be displayed as triggers
   */
  private readonly noDataPatterns: RegExp[] = [
    // "No customer quotes..." patterns
    /^no customer (quotes|voices|experiences|narratives|feedback)/i,
    /^no (first-person|significant|direct|relevant|specific) (quotes|customer|data)/i,
    /no quotes (are )?(available|present|found|describing|expressing)/i,
    /no (problem|surprise)\/?(problem|surprise)? narratives/i,

    // "Not found" patterns
    /narratives were (not )?(found|discovered)/i,
    /were not found in/i,
    /in the provided search results/i,
    /the search (results|did not)/i,

    // Meta-descriptions of quote types (not actual quotes)
    /^direct quotes from customers who/i,
    /^quotes (from|about|describing|expressing)/i,
    /^customer (experience|success)? narratives/i,

    // Generic solution statements (not customer voice)
    /^(robotic process|rpa|automation) (transforms|improves|streamlines)/i,
    /transforms workforce efficiency/i,
    /leverage ai to streamline/i,
    /seek transparent solutions/i,
    /vendor switching reveals/i,
    /reveals critical gaps/i,

    // Data security/generic observations without customer voice
    /^data security concerns prevent/i,
    /^poor user experience drives/i,
    /^customers seek transparent/i,
  ];

  private isNoDataResponse(text: string): boolean {
    return this.noDataPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Check if text contains psychological trigger language
   */
  private hasPsychologicalContent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.psychologicalKeywords.some(keyword => lowerText.includes(keyword));
  }

  private extractRawEvidence(context: DeepContext): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];
    let idCounter = 0;

    // PRIORITY 1: Extract from correlatedInsights (AI-synthesized, highest quality)
    // LIMIT: Take highest confidence items first, cap at maxInputEvidence
    const sortedInsights = [...(context.correlatedInsights || [])]
      .filter((ci: any) => ci.insight && (ci.type === 'validated_pain' || ci.type === 'psychological_breakthrough'))
      .sort((a: any, b: any) => (b.confidence || 0.85) - (a.confidence || 0.85))
      .slice(0, this.maxInputEvidence);

    console.log(`[TriggerConsolidation] Processing ${sortedInsights.length} of ${context.correlatedInsights?.length || 0} correlatedInsights (capped at ${this.maxInputEvidence})`);

    sortedInsights.forEach((ci: any) => {
      // FILTER: Skip marketing copy
      if (this.isMarketingCopy(ci.insight)) {
        console.log(`[TriggerConsolidation] Filtered marketing copy from correlatedInsights: "${ci.insight.substring(0, 50)}..."`);
        return;
      }

      // FILTER: Skip "no data found" LLM responses (PHASE K.2)
      if (this.isNoDataResponse(ci.insight)) {
        console.log(`[TriggerConsolidation] Filtered "no data" response: "${ci.insight.substring(0, 50)}..."`);
        return;
      }
      // Use sourceDetails if available (from Perplexity with real URLs)
      const sourceDetails = ci.sourceDetails || [];
      const sourceUrl = sourceDetails.length > 0 ? sourceDetails[0]?.url : undefined;

      // Extract platform from URL domain (e.g., "forbes.com" → "Forbes")
      let platform = 'Multi-source';
      if (sourceUrl) {
        try {
          const url = new URL(sourceUrl);
          const hostname = url.hostname.replace('www.', '');
          // Capitalize first letter of domain
          platform = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
        } catch {
          platform = 'Web Source';
        }
      }

      // Use source title, or domain-based name, not "Perplexity"
      const sourceName = sourceDetails.length > 0 && sourceDetails[0]?.title
        ? sourceDetails[0].title
        : (ci.sources?.join(', ') || platform);

      evidence.push({
        id: `corr-${ci.id || idCounter++}`,
        source: sourceName,
        platform: platform,
        quote: ci.insight, // PRESERVE FULL QUOTE - no truncation
        url: sourceUrl,
        sentiment: this.detectSentiment(ci.insight),
        confidence: ci.confidence || 0.85
      });
    });

    // PRIORITY 2: Extract from synthesis.breakthroughs (AI-synthesized insights)
    // NOTE: These are often marketing hooks, so apply stricter filtering
    context.synthesis?.breakthroughs?.forEach((bo: any) => {
      const text = bo.hook || bo.title;
      if (text) {
        // FILTER: Skip marketing copy (breakthroughs are often promotional)
        if (this.isMarketingCopy(text)) {
          console.log(`[TriggerConsolidation] Filtered marketing breakthrough: "${text.substring(0, 50)}..."`);
          return;
        }
        evidence.push({
          id: `break-${bo.id || idCounter++}`,
          source: 'Breakthrough Analysis',
          platform: bo.sources?.join(', ') || 'Multi-source',
          quote: text, // PRESERVE FULL QUOTE
          sentiment: 'neutral',
          confidence: (bo.score || 90) / 100
        });
      }
    });

    // PRIORITY 3: Extract from customerPsychology.emotional (pre-analyzed)
    context.customerPsychology?.emotional?.forEach((trigger: any) => {
      const text = typeof trigger === 'string' ? trigger : trigger.trigger || trigger.text;
      if (text) {
        // FILTER: Skip marketing copy
        if (this.isMarketingCopy(text)) {
          console.log(`[TriggerConsolidation] Filtered marketing psychology trigger: "${text.substring(0, 50)}..."`);
          return;
        }
        evidence.push({
          id: `psych-${idCounter++}`,
          source: 'Customer Psychology',
          platform: typeof trigger === 'object' ? (trigger.context || 'Analysis') : 'Analysis',
          quote: text, // PRESERVE FULL QUOTE - no truncation
          sentiment: this.detectSentiment(text),
          confidence: typeof trigger === 'object' ? (trigger.strength || 0.8) : 0.8
        });
      }
    });

    // PRIORITY 4: Extract from rawDataPoints ONLY if they pass quality gate
    // Only use if we have sparse data from higher-priority sources
    const needMoreEvidence = evidence.length < 20;

    if (needMoreEvidence) {
      context.rawDataPoints?.forEach((dp: any) => {
        if (dp.content && (dp.type === 'pain_point' || dp.type === 'customer_trigger' || dp.type === 'community_discussion')) {
          // QUALITY GATE 1: Must contain psychological language
          if (!this.hasPsychologicalContent(dp.content)) {
            console.log(`[TriggerConsolidation] Skipped raw datapoint (no psych keywords): "${dp.content.substring(0, 50)}..."`);
            return;
          }

          // QUALITY GATE 2: Must NOT be marketing copy
          if (this.isMarketingCopy(dp.content)) {
            console.log(`[TriggerConsolidation] Skipped raw datapoint (marketing copy): "${dp.content.substring(0, 50)}..."`);
            return;
          }

          evidence.push({
            id: `raw-${dp.id || idCounter++}`,
            source: dp.source || 'Intelligence',
            platform: this.normalizePlatform(dp.source),
            quote: dp.content, // PRESERVE FULL QUOTE - no truncation
            url: dp.metadata?.url,
            author: dp.metadata?.author,
            timestamp: dp.metadata?.timestamp,
            sentiment: this.detectSentiment(dp.content),
            confidence: dp.metadata?.confidence || 0.75
          });
        }
      });
    }

    console.log(`[TriggerConsolidation] Extracted ${evidence.length} evidence items (correlatedInsights prioritized)`);
    return evidence;
  }

  // ============================================================================
  // CATEGORIZATION
  // ============================================================================

  private categorizeEvidence(evidence: EvidenceItem[]): Map<TriggerCategory, EvidenceItem[]> {
    const categorized = new Map<TriggerCategory, EvidenceItem[]>();

    // Initialize all categories
    Object.keys(CATEGORY_PATTERNS).forEach(cat => {
      categorized.set(cat as TriggerCategory, []);
    });

    evidence.forEach(item => {
      const category = this.detectCategory(item.quote);
      const categoryList = categorized.get(category) || [];
      categoryList.push(item);
      categorized.set(category, categoryList);
    });

    return categorized;
  }

  private detectCategory(text: string): TriggerCategory {
    let bestMatch: TriggerCategory = 'pain-point'; // default
    let bestScore = 0;

    Object.entries(CATEGORY_PATTERNS).forEach(([category, patterns]) => {
      let score = 0;
      patterns.forEach(pattern => {
        if (pattern.test(text)) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = category as TriggerCategory;
      }
    });

    return bestMatch;
  }

  // ============================================================================
  // GROUPING
  // ============================================================================

  private groupIntoTriggers(
    categorizedEvidence: Map<TriggerCategory, EvidenceItem[]>
  ): ConsolidatedTrigger[] {
    const triggers: ConsolidatedTrigger[] = [];
    let triggerId = 0;

    categorizedEvidence.forEach((evidence, category) => {
      if (evidence.length === 0) return;

      // Group similar evidence using simple text similarity
      const groups = this.groupSimilarEvidence(evidence);

      groups.forEach(group => {
        if (group.length === 0) return;

        // Use the highest confidence item as the title source
        const primaryEvidence = group.sort((a, b) => b.confidence - a.confidence)[0];
        const title = this.extractTitle(primaryEvidence.quote, category);

        console.log(`[TriggerConsolidation] Creating trigger from quote: "${primaryEvidence.quote.substring(0, 80)}..." → title: "${title}"`);

        // VALIDATION GATE: Reject titles that don't look like psychological triggers
        if (!this.isValidTriggerTitle(title)) {
          console.log(`[TriggerConsolidation] Rejected invalid trigger title: "${title}"`);
          return;
        }

        triggers.push({
          id: `trigger-${triggerId++}`,
          category,
          title,
          executiveSummary: '', // Will be filled in synthesis step
          confidence: this.calculateGroupConfidence(group),
          evidenceCount: group.length,
          evidence: group.slice(0, this.maxEvidencePerTrigger),
          uvpAlignments: [],
          isTimeSensitive: category === 'urgency',
          profileRelevance: 1.0, // Will be adjusted in weighting step
          rawSourceIds: group.map(e => e.id)
        });
      });
    });

    return triggers;
  }

  /**
   * Validate that a trigger title looks like a genuine psychological trigger
   * Rejects random post titles, product names, marketing copy, and non-insight content
   *
   * LOOSENED FILTERS V2: Allow more triggers through, especially real social posts
   * The LLM title rewriter will clean up the titles afterward
   */
  private isValidTriggerTitle(title: string): boolean {
    const lowerTitle = title.toLowerCase();

    // Reject if too short (likely incomplete)
    if (title.length < 10) return false;

    // Reject if too long (allow up to 150 chars for VoC quotes - rewriter will shorten)
    if (title.length > 150) return false;

    // Reject if starts with quote character (raw quote text)
    if (/^["'"'`]/.test(title)) return false;

    // Reject marketing copy (most important filter)
    if (this.isMarketingCopy(title)) {
      return false;
    }

    // ALLOW social media posts that contain @ mentions - these are real insights
    if (/@\w+/.test(title)) {
      // Only reject if it's JUST a @ mention with no context
      if (title.replace(/@\w+/g, '').trim().length < 20) return false;
      // Otherwise, allow it through - the LLM rewriter will clean it up
      return true;
    }

    // ALLOW posts that start with action verbs - these show intent/pain
    const actionStarters = /^(i'm|i've|we're|we've|our team|my team|been trying|tried|struggling|can't|won't|doesn't)/i;
    if (actionStarters.test(title)) {
      return true; // These are high-intent signals
    }

    // Reject obvious non-trigger patterns (REDUCED list - only reject obvious noise)
    const rejectPatterns = [
      /^\d+\s+(ways|tips|tricks|things|reasons)/i,  // "16 ways to..."
      /^(check out|look at|see|watch)/i,            // "Check out this..."
      /\b(lol|lmao|rofl|omg|wtf)\b/i,               // Internet slang
      /^[A-Z]{2,}\s/,                                // Stock tickers "INTR an undervalued..."
      /kill|vampire|mcdonald/i,                      // Obvious noise
      /pet's|pets|dog|cat|animal/i,                  // Pet-related (irrelevant)
      /help[.!]?\s*$/i,                              // Just "Help" or "Help!"
      // PERPLEXITY META-RESPONSES: These are NOT customer insights - they're Perplexity saying it couldn't find data
      /^to obtain the/i,                             // "To obtain the specific customer quotes..."
      /^to provide the/i,                            // "To provide the 20 specific..."
      /^to gather the/i,                             // "To gather the 20 specific..."
      /^you would need/i,                            // "You would need search results..."
      /^i appreciate your/i,                         // "I appreciate your detailed request, but..."
      /^i cannot provide/i,                          // "I cannot provide the requested..."
      /^i don't have access/i,                       // "I don't have access to..."
      /^i've reviewed the/i,                         // "I've reviewed the search results..."
      /^the search results/i,                        // "The search results do not contain..."
      /^the current search/i,                        // "The current search results..."
      /^search directly on/i,                        // "Search directly on G2..."
      /^look for case studies/i,                     // "Look for case studies..."
      /in json format/i,                             // "...insights you need in JSON format"
      /search results (do not|don't|provided)/i,    // "search results do not contain..."

      // META-DESCRIPTIONS about data sources (NOT actual insights)
      /^reddit discussions/i,                        // "Reddit discussions from r/SaaS..."
      /^linkedin posts/i,                            // "LinkedIn posts about..."
      /^discussion threads/i,                        // "Discussion threads from..."
      /^real customer quotes/i,                      // "Real customer quotes discussing..."
      /^customer satisfaction scores/i,              // "Customer satisfaction scores for..."
      /^comparative pricing/i,                       // "Comparative pricing across..."
      /capterra shines/i,                            // "Capterra shines in product content..."
      /^g2 reviews/i,                                // "G2 reviews about..."
      /^trustpilot reviews/i,                        // "Trustpilot reviews mentioning..."
      /mentioning the product$/i,                    // "...mentioning the product"
      /about these tools$/i,                         // "...about these tools"
      /about this ai$/i,                             // "...about this AI"
      /provides detailed information/i,              // "...provides detailed information..."
      /^youtube videos/i,                            // "YouTube videos discussing..."
      /^quora questions/i,                           // "Quora questions about..."
      /^forum posts/i,                               // "Forum posts from..."
      /startup founders explore/i,                   // Generic startup exploration
      /reveals competitive advantages/i,             // Meta-analysis language
      /innovative software solutions/i,              // Marketing fluff
      /for operational challenges$/i,                // Generic endings

      // GENERIC OBSERVATION patterns - describe behavior without emotional insight
      /professionals seek/i,
      /founders (constantly )?(compare|evaluate|explore)/i,
      /companies seek/i,
      /teams (need|want|require|look for) (comprehensive|better|modern)/i,
      /users (often|frequently|typically|commonly)/i,
      /organizations (seek|need|want)/i,
      /businesses (explore|evaluate|compare)/i,
      /buyers (research|compare|evaluate)/i,
      /provide(s)? (deeper|better|comprehensive|detailed) insights/i,
      /offer(s)? (comprehensive|innovative|robust)/i,
      /deliver(s)? (value|results|insights)/i,
      /across (startup|saas|software|tech) communities/i,
      /competing solutions/i,
      /software solutions for/i,
      /to make strategic decisions/i,
      /to enhance operational/i,
      /industry (trends|insights|analysis)/i,
      /market (analysis|comparison|research)/i,
      /platform comparisons/i,
    ];

    for (const pattern of rejectPatterns) {
      if (pattern.test(title)) return false;
    }

    // PHASE K: HIGH-INTENT patterns - these are GOLD (switching signals, active evaluation)
    // From research doc: "Has anyone switched from X?" is higher intent than "I hate X"
    const hasHighIntent = [
      /we're (evaluating|looking at|moving from|switching)/i,
      /has anyone (migrated|switched|moved) from/i,
      /what's the best alternative to/i,
      /we've decided to (move|switch|leave)/i,
      /our contract is up/i,
      /we're (comparing|considering|evaluating)/i,
      /anyone (recommend|suggest) an alternative/i,
      /we left .+ because/i,
      /we switched from .+ to/i,
      /after .+ (months|years) with/i,
    ].some(pattern => pattern.test(title));

    // High-intent triggers are always valid - they're the best leads
    if (hasHighIntent) {
      return true;
    }

    // Check for emotional/psychological language - but don't strictly REQUIRE it
    // Many valid triggers imply pain without explicit emotional words
    const hasEmotionalContent = [
      /fear(s|ed|ful)?|afraid|worried|anxious|nervous|scared|concern(ed)?/i,
      /frustrat(ed|ing|ion)|annoyed|irritat(ed|ing)|hate(s)?|sick of|tired of/i,
      /struggle(s|d)?|difficult(y)?|challeng(e|ing)|pain(ful)?|problem(s)?|issue(s)?/i,
      /urgent|deadline|pressure|forced to|have to|must/i,
      /fail(s|ed|ure)?|lose|lost|miss(ed)?|cost(s|ly)?|waste(d)?|broke(n)?/i,
      /trust|doubt(s)?|skeptic(al)?|suspicious|uncertain|risky/i,
      /hesitat|anxiet|stress|overwhelm/i,
    ].some(pattern => pattern.test(title));

    if (!hasEmotionalContent) {
      // Check for implied pain (specific problems/issues without explicit emotion)
      const hasImpliedPain = [
        // Strong action verbs
        /desperately|urgently|critically|immediately/i,
        /can't|cannot|won't|unable to/i,
        /keep(s)? failing|keeps? breaking/i,
        /always|never|every time/i,
        // Implementation/operational problems
        /exceed|delay|slow|manual|hours|days|months/i,
        /complex|hard to|impossible/i,
        /block|prevent|stop|limit|restrict/i,
        /break|crash|error|bug/i,
        /expensive|costly|budget|price/i,
        // Business impact
        /customer (satisfaction|churn|loss)/i,
        /revenue|profit|loss|cost/i,
        /compliance|regulation|audit/i,
        /security|breach|risk/i,
        // Comparison/switching signals
        /switch|migrate|replace|alternative/i,
        /legacy|outdated|old|current/i,
      ].some(pattern => pattern.test(title));

      if (!hasImpliedPain) {
        return false; // Reject generic observations without emotion or implied pain
      }
    }

    // EXPANDED: Accept triggers with ANY of these psychological/business keywords
    // This list covers all 6 business profile categories
    const validKeywords = [
      // Emotional triggers (all categories)
      'fear', 'afraid', 'worried', 'anxious', 'concern', 'nervous', 'dread', 'panic',
      'frustrated', 'annoyed', 'hate', 'struggling', 'difficult', 'problem', 'issue', 'pain', 'challenge',
      'want', 'need', 'wish', 'hope', 'looking', 'searching', 'desire', 'aspire',
      'trust', 'reliable', 'proven', 'credible', 'reputation',
      'hesitat', 'skeptic', 'doubt', 'unsure', 'uncertain',

      // Failure/risk language (IMPORTANT - these are valid fear triggers!)
      'fail', 'error', 'mistake', 'wrong', 'broken', 'crash', 'bug',
      'risk', 'danger', 'threat', 'vulnerability', 'breach', 'leak',
      'blame', 'accountab', 'liable', 'fault', 'responsib',
      'transparency', 'hidden', 'unclear', 'confusing', 'opaque',
      'overpromise', 'underdeliver', 'mislead', 'disappoint',

      // Business context (B2B)
      'cost', 'budget', 'price', 'expensive', 'savings', 'roi', 'invest',
      'efficiency', 'productivity', 'automat', 'workflow', 'process',
      'integration', 'api', 'connect', 'system', 'platform',
      'scale', 'growth', 'enterprise', 'startup', 'smb',
      'compliance', 'regulation', 'security', 'audit', 'gdpr', 'hipaa',
      'vendor', 'lock-in', 'proprietary', 'migration',
      'implement', 'deploy', 'onboard', 'setup', // Allow when part of fears/concerns
      'transform', 'moderniz', 'digital', 'legacy', 'initiative',

      // Customer experience (B2C & B2B)
      'customer', 'client', 'user', 'buyer',
      'support', 'service', 'response', 'wait',
      'experience', 'journey', 'conversion', 'abandon',
      'quality', 'reliable', 'accurate', 'correct',

      // Industry-specific (SaaS, Local, Retail)
      'ai', 'chatbot', 'conversation', 'bot',
      'quote', 'booking', 'appointment', 'schedule',
      'local', 'nearby', 'location', 'store',
      'shipping', 'delivery', 'return', 'refund',
      'review', 'rating', 'feedback', 'testimonial',
      'fraud', 'accuracy', 'detect', 'catch', 'miss',

      // Decision factors
      'compare', 'alternative', 'competitor', 'switch', 'change',
      'time', 'deadline', 'urgent', 'asap', 'quickly',
      'learn', 'understand', 'confus', 'complex', 'simple',

      // VoC-specific patterns (common in review quotes)
      'moved', 'migrat', 'evaluat', 'replacing', 'considering',
      'better', 'worse', 'easier', 'harder', 'faster', 'slower',
      'love', 'like', 'dislike', 'prefer', 'recommend',
      'finally', 'best', 'only', 'actual', 'real',
      'too', 'very', 'really', 'so', 'much', 'many',
      'never', 'always', 'used to', 'before', 'after',
      'contract', 'pricing', 'renewal', 'option', 'feature',
      'team', 'company', 'organization', 'department',
    ];

    const hasValidKeyword = validKeywords.some(kw => lowerTitle.includes(kw));

    // FALLBACK: If no keyword match, check for emotional sentence structures
    if (!hasValidKeyword) {
      const emotionalPatterns = [
        /^(fear of|afraid of|worried about|anxious about|concern about)/i,
        /^(frustrated with|annoyed by|hate when|can't stand)/i,
        /^(want|need|wish|looking for|searching for)/i,
        /^(hesitat|skeptic|doubt|unsure|uncertain)/i,
        /(keeps? me up|up at night|nightmare|disaster)/i,
        /(waste of|loss of|risk of|threat of)/i,
        // VoC quote patterns
        /^(buyers|customers|users|teams|companies)\s+(are|want|need|seeking|frustrated)/i,
        /evaluating alternatives/i,
        /\bvs\b|\bversus\b/i,  // Comparison triggers
        /switched (from|to)/i,
        /migrating (from|to)/i,
      ];
      return emotionalPatterns.some(p => p.test(title));
    }

    return hasValidKeyword;
  }

  private groupSimilarEvidence(evidence: EvidenceItem[]): EvidenceItem[][] {
    // FIXED: Use topic-based grouping, not loose keyword matching
    // Each piece of evidence becomes its own trigger to preserve distinct insights
    // Only group if they are SEMANTICALLY about the same specific topic

    const groups: EvidenceItem[][] = [];
    const assigned = new Set<string>();

    // Define topic clusters - evidence must match the SAME specific topic to be grouped
    const topicPatterns: Array<{ topic: string; patterns: RegExp[] }> = [
      { topic: 'compliance', patterns: [/compliance|gdpr|regulation|audit|legal/i] },
      { topic: 'integration', patterns: [/integrat|connect|api|crm|system/i] },
      { topic: 'vendor-lockin', patterns: [/vendor.?lock|proprietary|open.?source|exit/i] },
      { topic: 'automation-rate', patterns: [/automat.*rate|escalat|human.?agent|handoff/i] },
      { topic: 'implementation', patterns: [/implement|deploy|onboard|setup|install/i] },
      { topic: 'cost', patterns: [/cost|price|budget|roi|savings|expensive/i] },
      { topic: 'accuracy', patterns: [/incorrect|wrong|mistake|error|accurate|hallucin/i] },
      { topic: 'quote-journey', patterns: [/quote|abandon|conversion|drop.?off|journey/i] },
      { topic: 'claims', patterns: [/claim|sensitive|human.?touch|empathy/i] },
      { topic: 'multi-product', patterns: [/bundle|cross.?sell|upsell|multi.?product/i] },
    ];

    const getTopics = (text: string): string[] => {
      const topics: string[] = [];
      topicPatterns.forEach(({ topic, patterns }) => {
        if (patterns.some(p => p.test(text))) {
          topics.push(topic);
        }
      });
      return topics;
    };

    evidence.forEach(item => {
      if (assigned.has(item.id)) return;

      const itemTopics = getTopics(item.quote);
      const group: EvidenceItem[] = [item];
      assigned.add(item.id);

      // Only group if BOTH items share the SAME primary topic
      if (itemTopics.length > 0) {
        evidence.forEach(other => {
          if (assigned.has(other.id)) return;

          const otherTopics = getTopics(other.quote);
          // Must share at least one topic AND have high text similarity
          const sharedTopics = itemTopics.filter(t => otherTopics.includes(t));
          const similarity = this.calculateTextSimilarity(item.quote, other.quote);

          // Stricter grouping: must share topic AND be very similar (>0.5)
          if (sharedTopics.length > 0 && similarity > 0.5) {
            group.push(other);
            assigned.add(other.id);
          }
        });
      }

      groups.push(group);
    });

    return groups;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who', 'whom']);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.extractKeywords(text1));
    const words2 = new Set(this.extractKeywords(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union;
  }

  // ============================================================================
  // SYNTHESIS
  // ============================================================================

  private synthesizeSummaries(
    triggers: ConsolidatedTrigger[],
    uvp: CompleteUVP,
    profileConfig: ProfileTriggerConfig
  ): ConsolidatedTrigger[] {
    return triggers.map(trigger => {
      const summary = this.generateExecutiveSummary(trigger, uvp, profileConfig);
      return { ...trigger, executiveSummary: summary };
    });
  }

  private generateExecutiveSummary(
    trigger: ConsolidatedTrigger,
    uvp: CompleteUVP,
    profileConfig: ProfileTriggerConfig
  ): string {
    // Get the primary evidence quote - this is the actual insight
    const primaryQuote = trigger.evidence[0]?.quote || '';
    const cleanedQuote = primaryQuote
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const platforms = [...new Set(trigger.evidence.map(e => e.platform))];
    const sourceAttribution = platforms[0] || 'industry research';

    // Category-specific marketing angles
    // Part 1: Restate what the trigger IS (from the evidence)
    // Part 2: Tell them the marketing angle - what to DO about it
    const angles: Record<TriggerCategory, { action: string; tactic: string }> = {
      'fear': {
        action: 'Address this fear head-on in your messaging',
        tactic: 'Show proof that you prevent this scenario. Use case studies and guarantees.'
      },
      'desire': {
        action: 'Lead with this outcome in your hero messaging',
        tactic: 'Make this the headline promise. Show testimonials of customers who achieved it.'
      },
      'pain-point': {
        action: 'Show the before/after transformation',
        tactic: 'Use testimonials that speak to this exact frustration. Demo how you solve it.'
      },
      'objection': {
        action: 'Proactively address this in your FAQ and sales deck',
        tactic: 'Add social proof and guarantees that counter this specific concern.'
      },
      'motivation': {
        action: 'Amplify this motivation in your CTAs',
        tactic: 'Connect your product to this goal in headlines and email subject lines.'
      },
      'trust': {
        action: 'Build credibility around this with proof points',
        tactic: 'Feature logos, metrics, and third-party validation that address this need.'
      },
      'urgency': {
        action: 'Emphasize speed-to-value in your positioning',
        tactic: 'Use deadline-driven campaigns and show quick wins they can achieve.'
      }
    };

    const angle = angles[trigger.category] || angles['pain-point'];

    // Build summary: What the trigger is + What to do about it
    return `${cleanedQuote}. ${angle.action}. ${angle.tactic} Source: ${sourceAttribution}.`;
  }

  /**
   * Shorten differentiator to reasonable length for executive summary
   * Finds a natural break point rather than truncating mid-word
   */
  private truncateDifferentiator(diff: string): string {
    if (diff.length <= 60) return diff;

    // Find natural break points
    const words = diff.split(/\s+/);
    let result = '';
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from'];

    for (let i = 0; i < words.length; i++) {
      const nextResult = result ? `${result} ${words[i]}` : words[i];
      if (nextResult.length > 55) {
        // Don't end on stop words
        while (result.split(/\s+/).length > 2 && stopWords.includes(result.split(/\s+/).pop()?.toLowerCase() || '')) {
          result = result.split(/\s+/).slice(0, -1).join(' ');
        }
        break;
      }
      result = nextResult;
    }

    return result || diff.substring(0, 55);
  }

  /**
   * Find a matching differentiator from UVP that addresses this trigger
   */
  private findMatchingDifferentiator(coreInsight: string, uvp: CompleteUVP): string | null {
    if (!uvp.uniqueSolution?.differentiators) return null;

    const insightLower = coreInsight.toLowerCase();

    // Keywords mapping to differentiator themes
    const themeMatchers: Array<{ keywords: RegExp; themes: string[] }> = [
      { keywords: /control|lock.?in|vendor|proprietary|exit/i, themes: ['governance', 'control', 'open'] },
      { keywords: /complex|easy|simple|code|technical/i, themes: ['no-code', 'simple', 'easy'] },
      { keywords: /price|cost|fee|hidden|transparent/i, themes: ['pricing', 'transparent', 'cost'] },
      { keywords: /integrat|connect|channel|deploy/i, themes: ['multi-channel', 'integration', 'deploy'] },
      { keywords: /compliance|gdpr|audit|security|governance/i, themes: ['governance', 'audit', 'compliance'] },
      { keywords: /implement|setup|onboard|time/i, themes: ['fast', 'quick', 'week'] },
    ];

    for (const matcher of themeMatchers) {
      if (matcher.keywords.test(insightLower)) {
        // Find differentiator that matches this theme
        for (const diff of uvp.uniqueSolution.differentiators) {
          const diffLower = diff.statement.toLowerCase();
          if (matcher.themes.some(theme => diffLower.includes(theme))) {
            return diff.statement;
          }
        }
      }
    }

    return null;
  }

  /**
   * DEDUPLICATE triggers with similar topics to prevent repetitive output
   * Uses keyword overlap detection to identify near-duplicates
   * Keeps the highest-confidence version of each topic
   */
  private deduplicateSimilarTriggers(triggers: ConsolidatedTrigger[]): ConsolidatedTrigger[] {
    if (triggers.length === 0) return [];

    const result: ConsolidatedTrigger[] = [];
    const seenTopics = new Map<string, ConsolidatedTrigger>();

    // Key topics that identify duplicates - triggers about the same thing
    const topicPatterns = [
      { pattern: /vendor.?lock|lock.?in|proprietary/i, topic: 'vendor-lock-in' },
      { pattern: /30.?day|implementation.?timeline|fast.?implement/i, topic: 'implementation-timeline' },
      { pattern: /conversion.?improve|conversion.?metric|proven.?conversion/i, topic: 'conversion-metrics' },
      { pattern: /roi|return.?on|instant.?roi|rapid.?roi/i, topic: 'roi-concerns' },
      { pattern: /compliance|regulatory|regulator/i, topic: 'compliance-concerns' },
      { pattern: /data.?security|data.?privacy|security.?breach/i, topic: 'data-security' },
      { pattern: /support|customer.?service|vendor.?response/i, topic: 'support-quality' },
      { pattern: /integration|connect|api/i, topic: 'integration-concerns' },
      { pattern: /price|cost|expensive|budget|hidden.?cost/i, topic: 'pricing-concerns' },
      { pattern: /skill.?gap|expertise|train/i, topic: 'skill-gaps' },
      { pattern: /ai.?bias|algorithm.?bias|unfair/i, topic: 'ai-bias' },
      { pattern: /explainab|transparen|black.?box/i, topic: 'explainability' },
      { pattern: /upsell|cross.?sell|automatic.?sell/i, topic: 'upselling-concerns' },
      { pattern: /hallucin|wrong.?answer|incorrect/i, topic: 'ai-accuracy' },
      { pattern: /scale|growth|enterprise/i, topic: 'scalability' },
    ];

    for (const trigger of triggers) {
      const titleLower = trigger.title.toLowerCase();

      // Check if this trigger matches any known topic
      let matchedTopic: string | null = null;
      for (const { pattern, topic } of topicPatterns) {
        if (pattern.test(titleLower)) {
          matchedTopic = topic;
          break;
        }
      }

      if (matchedTopic) {
        // Check if we've seen this topic before
        const existingTrigger = seenTopics.get(matchedTopic);
        if (existingTrigger) {
          // Keep the one with higher confidence, merge evidence counts
          if (trigger.confidence > existingTrigger.confidence) {
            existingTrigger.confidence = trigger.confidence;
            existingTrigger.evidenceCount += trigger.evidenceCount;
          } else {
            existingTrigger.evidenceCount += trigger.evidenceCount;
          }
          // Skip adding this duplicate
          continue;
        }
        seenTopics.set(matchedTopic, trigger);
      }

      result.push(trigger);
    }

    return result;
  }

  /**
   * Extract the core insight from evidence quotes
   * Finds the most representative/common theme
   */
  private extractCoreInsight(quotes: string[]): string {
    if (quotes.length === 0) return 'unspecified concerns';
    if (quotes.length === 1) {
      // Single quote - extract key phrase
      return this.extractKeyPhrase(quotes[0]);
    }

    // Multiple quotes - find common theme
    // Take the most specific/longest meaningful phrase from the highest-confidence quote
    const longestQuote = quotes.reduce((a, b) => a.length > b.length ? a : b);
    return this.extractKeyPhrase(longestQuote);
  }

  /**
   * Extract a key phrase from a quote (not the whole quote)
   * Returns a COMPLETE, grammatically correct phrase - never truncated fragments
   */
  private extractKeyPhrase(quote: string): string {
    // Remove leading/trailing quotes and clean whitespace
    let cleaned = quote.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();

    // Check if the text appears truncated
    const isTruncated = this.detectTruncation(cleaned);

    // If truncated, synthesize a complete phrase
    if (isTruncated) {
      return this.synthesizeKeyPhrase(cleaned);
    }

    // If it's already short and complete, use it
    if (cleaned.length < 60) return cleaned.toLowerCase();

    // Try to extract the first complete sentence
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences[0] && sentences[0].trim().length >= 15 && sentences[0].trim().length < 80) {
      const sentence = sentences[0].trim();
      // Verify this sentence is complete
      if (!this.detectTruncation(sentence)) {
        return sentence.toLowerCase();
      }
    }

    // If we can't get a clean sentence, synthesize one
    return this.synthesizeKeyPhrase(cleaned);
  }

  /**
   * Synthesize a complete key phrase from potentially truncated text
   */
  private synthesizeKeyPhrase(text: string): string {
    // Extract the core topic/subject
    const topicPatterns = [
      // AI/tech topics
      /(?:implementing|deploying|using|adopting)\s+(.+?)(?:\s+(?:that|which|will|would|can|could)|$)/i,
      /(?:multiple|various|different)\s+(.+?)(?:\s+(?:that|which|will|would)|$)/i,
      /(.+?)\s+(?:implementation|integration|adoption|deployment)/i,
      // Problem patterns
      /(?:problems?|issues?|challenges?)\s+(?:with|from|in)\s+(.+)/i,
      /(?:difficulty|trouble|struggle)\s+(?:with|in)\s+(.+)/i,
      // General extraction - get noun phrases
      /^(.{15,50}?)(?:\s+(?:that|which|who|will|would|could|can)\s+|$)/i,
    ];

    for (const pattern of topicPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let phrase = match[1].trim();
        // Clean up trailing incomplete parts
        phrase = phrase.replace(/\s+(?:with|that|which|who|and|or|but)\s*$/i, '');
        // Remove trailing quotes
        phrase = phrase.replace(/['"]$/, '');

        if (phrase.length >= 10 && phrase.length <= 60) {
          return phrase.toLowerCase();
        }
      }
    }

    // Last resort: take first meaningful words up to a noun
    const words = text.split(/\s+/);
    let phrase = '';
    for (let i = 0; i < Math.min(words.length, 8); i++) {
      phrase = phrase ? `${phrase} ${words[i]}` : words[i];
      // Stop at common break points
      if (/^(that|which|who|will|would|could|can)$/i.test(words[i + 1] || '')) {
        break;
      }
    }

    // Clean up and ensure completeness
    phrase = phrase.replace(/\s+(?:with|that|which|who|and|or|but)\s*$/i, '');
    phrase = phrase.replace(/['"]$/, '');

    return (phrase || 'this concern').toLowerCase();
  }

  /**
   * Extract buyer description from UVP target customer
   */
  private extractBuyerDescription(uvp: CompleteUVP): string {
    if (!uvp.targetCustomer?.statement) return 'Your target buyers';

    const statement = uvp.targetCustomer.statement;

    // Extract the buyer type from the statement
    // e.g., "Enterprise companies with 500+ employees" -> "Enterprise buyers"
    const patterns = [
      /^(enterprise|small business|mid-market|startup|saas|b2b|b2c)/i,
      /(cto|cfo|marketing|sales|operations|it) (leaders?|teams?|professionals?)/i,
      /(companies?|businesses?|organizations?)/i
    ];

    for (const pattern of patterns) {
      const match = statement.match(pattern);
      if (match) {
        return match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase() + ' buyers';
      }
    }

    return 'Your target buyers';
  }

  /**
   * Detect the actual sentiment of text to avoid semantic inversion.
   * A complaint about "complexity" should NOT become "Buyers want complexity"
   */
  private detectSentiment(text: string): 'complaint' | 'desire' | 'comparison' | 'neutral' {
    const lowerText = text.toLowerCase();

    // High-intent comparison patterns (switching intent) - HIGHEST PRIORITY
    if (/evaluating|comparing|vs\s|versus|alternative|migrating from|switching from/i.test(lowerText)) return 'comparison';
    if (/contract is up|looking at other|considering other/i.test(lowerText)) return 'comparison';

    // Complaint patterns (negative sentiment about current state)
    // These indicate frustration, NOT desire
    if (/frustrated|annoyed|hate|struggling|difficult|problem|issue|broken/i.test(lowerText)) return 'complaint';
    if (/doesn't work|failed|waste|inefficient|tedious|stuck|limited/i.test(lowerText)) return 'complaint';
    if (/too complex|too expensive|too slow|takes too long|not working/i.test(lowerText)) return 'complaint';
    if (/can't|won't|doesn't|isn't|aren't|wasn't|weren't/i.test(lowerText)) return 'complaint';
    if (/lack of|missing|poor|bad|terrible|awful|horrible/i.test(lowerText)) return 'complaint';
    if (/overpriced|underwhelming|disappointing|unreliable/i.test(lowerText)) return 'complaint';

    // Desire patterns (positive seeking)
    if (/want|wish|hope|looking for|searching for|need|would love/i.test(lowerText)) return 'desire';
    if (/excited about|interested in|motivated by/i.test(lowerText)) return 'desire';

    return 'neutral';
  }

  /**
   * Detect if text appears truncated (incomplete sentence fragments)
   */
  private detectTruncation(text: string): boolean {
    // Check for common truncation indicators
    const truncationIndicators = [
      /\.{3,}$/, // Ends with ellipsis
      /\s+that$/i, // Ends with "that"
      /\s+which$/i, // Ends with "which"
      /\s+where$/i, // Ends with "where"
      /\s+when$/i, // Ends with "when"
      /\s+who$/i, // Ends with "who"
      /\s+to$/i, // Ends with "to"
      /\s+and$/i, // Ends with "and"
      /\s+or$/i, // Ends with "or"
      /\s+the$/i, // Ends with "the"
      /\s+a$/i, // Ends with "a"
      /\s+an$/i, // Ends with "an"
      /\s+with$/i, // Ends with "with"
      /\s+for$/i, // Ends with "for"
      /[,;:]$/, // Ends with comma, semicolon, or colon
    ];

    for (const pattern of truncationIndicators) {
      if (pattern.test(text.trim())) return true;
    }

    // Check if it starts mid-sentence (lowercase first word)
    const firstWord = text.trim().split(/\s+/)[0];
    if (firstWord && /^[a-z]/.test(firstWord) && !['i', 'i\'m', 'i\'ve', 'i\'d', 'i\'ll'].includes(firstWord.toLowerCase())) {
      return true;
    }

    return false;
  }

  private extractTitle(text: string, category: TriggerCategory, competitorName?: string): string {
    // SIMPLIFIED: Clean the text and use directly. LLM rewriter will polish later.

    let cleaned = text
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\[Competitor\]\s*/gi, '') // Remove [Competitor] placeholder
      .replace(/\[Company\]\s*/gi, '') // Remove [Company] placeholder
      .replace(/^\[[^\]]+\]\s*/i, '') // Remove any [Tag] prefix
      // Remove source prefixes
      .replace(/^(reddit\s+)?r\/\w+:\s*/gi, '')
      .replace(/^g2(\s+reviews)?:\s*/gi, '')
      .replace(/^capterra:\s*/gi, '')
      .replace(/^trustpilot:\s*/gi, '')
      .replace(/^forum(\s+discussion)?:\s*/gi, '')
      // Remove sentiment prefixes - let the text speak for itself
      .replace(/^(fear of|afraid of|worried about|anxious about|concerned about)\s*/gi, '')
      .replace(/^(frustrated (that|by|with|about)|frustration with)\s*/gi, '')
      .replace(/^buyers\s+(evaluating alternatives to|concerned about|considering|weighing|frustrated by|worried about)\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If it's a complete sentence under 100 chars, use it
    if (cleaned.length <= 100) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Take first sentence if present and reasonable length
    const firstSentence = cleaned.match(/^[^.!?]+[.!?]/);
    if (firstSentence && firstSentence[0].length >= 20 && firstSentence[0].length <= 100) {
      const sentence = firstSentence[0].trim();
      return sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }

    // Shorten to ~90 chars at word boundary - let LLM rewriter polish later
    const words = cleaned.split(/\s+/);
    let shortened = '';
    for (const word of words) {
      if ((shortened + ' ' + word).length > 90) break;
      shortened = shortened ? shortened + ' ' + word : word;
    }

    return shortened.charAt(0).toUpperCase() + shortened.slice(1);
  }

  // ============================================================================
  // UVP ALIGNMENT
  // ============================================================================

  private calculateUVPAlignment(
    triggers: ConsolidatedTrigger[],
    uvp: CompleteUVP
  ): ConsolidatedTrigger[] {
    // Very low threshold to ensure matches are found - Jaccard similarity is strict
    const MATCH_THRESHOLD = 0.08;

    // Debug: Log UVP structure to understand what data is available
    console.log('[UVPAlignment] UVP data available:', {
      hasProductsServices: !!uvp.productsServices?.categories?.length,
      productsCount: uvp.productsServices?.categories?.reduce((sum, cat) => sum + (cat.items?.length || 0), 0) || 0,
      hasTargetCustomer: !!uvp.targetCustomer?.statement,
      hasKeyBenefit: !!uvp.keyBenefit?.statement,
      hasTransformation: !!uvp.transformationGoal?.before,
      hasDifferentiators: (uvp.uniqueSolution?.differentiators?.length || 0) > 0
    });

    // Build keyword-to-UVP-component mapping for semantic alignment
    // This ensures triggers find alignments even with sparse UVP data
    const keywordAlignments: Array<{
      keywords: RegExp;
      component: UVPAlignment['component'];
      reason: string;
    }> = [
      // Integration/API related - matches unique_solution
      { keywords: /integrat|api|connect|legacy|system|modern|plug.?and.?play|pre.?built/i, component: 'unique_solution', reason: 'Relates to integration capabilities' },
      // Customer service/support - matches key_benefit
      { keywords: /support|service|response|wait|abandon|customer.?experience|satisfaction/i, component: 'key_benefit', reason: 'Addresses customer experience benefits' },
      // Conversion/quotes - matches transformation
      { keywords: /convert|quote|abandon|drop.?off|close.?rate|win.?rate|policy/i, component: 'transformation', reason: 'Relates to conversion transformation' },
      // Cost/efficiency - matches key_benefit
      { keywords: /cost|expensive|savings|roi|budget|efficient|automat/i, component: 'key_benefit', reason: 'Addresses cost/efficiency benefits' },
      // AI/chatbot - matches unique_solution
      { keywords: /ai|chatbot|conversation|agent|automat|self.?service/i, component: 'unique_solution', reason: 'Relates to AI/automation capabilities' },
      // Insurance specific - matches target_customer
      { keywords: /insurance|insurer|policy|claim|underwriting|broker|agent/i, component: 'target_customer', reason: 'Matches target customer industry' },
      // Operations/scale - matches transformation
      { keywords: /scale|growth|operations|workflow|process|handl|volume/i, component: 'transformation', reason: 'Relates to operational transformation' },
    ];

    return triggers.map(trigger => {
      const alignments: UVPAlignment[] = [];
      const triggerText = `${trigger.title} ${trigger.executiveSummary}`.toLowerCase();

      // 1. Check PRODUCTS/SERVICES alignment (NEW - user requested this)
      if (uvp.productsServices?.categories) {
        const allProducts: string[] = [];
        uvp.productsServices.categories.forEach(cat => {
          cat.items?.forEach(item => {
            if (item.name) allProducts.push(item.name);
            if (item.description) allProducts.push(item.description);
          });
        });
        if (allProducts.length > 0) {
          const productMatch = this.findBestMatch(triggerText, allProducts);
          if (productMatch.score > MATCH_THRESHOLD) {
            alignments.push({
              component: 'unique_solution', // Map to existing component type
              matchScore: productMatch.score,
              matchReason: `Relevant to product: "${this.truncate(productMatch.match, 60)}"`
            });
          }
        }
      }

      // 2. Check TARGET CUSTOMER alignment - statement + pain points
      const targetTexts: string[] = [];
      if (uvp.targetCustomer?.statement) targetTexts.push(uvp.targetCustomer.statement);
      if (uvp.targetCustomer?.evidenceQuotes) targetTexts.push(...uvp.targetCustomer.evidenceQuotes);
      if (uvp.targetCustomer?.emotionalDrivers) targetTexts.push(...uvp.targetCustomer.emotionalDrivers);

      if (targetTexts.length > 0) {
        const customerMatch = this.findBestMatch(triggerText, targetTexts);
        if (customerMatch.score > MATCH_THRESHOLD) {
          alignments.push({
            component: 'target_customer',
            matchScore: customerMatch.score,
            matchReason: `Matches customer profile: "${this.truncate(customerMatch.match, 60)}"`
          });
        }
      }

      // 3. Check KEY BENEFIT alignment - statement + metrics
      const benefitTexts: string[] = [];
      if (uvp.keyBenefit?.statement) benefitTexts.push(uvp.keyBenefit.statement);
      if (uvp.keyBenefit?.metrics) {
        benefitTexts.push(...uvp.keyBenefit.metrics.map(m => `${m.metric}: ${m.value}`));
      }

      if (benefitTexts.length > 0) {
        const benefitMatch = this.findBestMatch(triggerText, benefitTexts);
        if (benefitMatch.score > MATCH_THRESHOLD) {
          alignments.push({
            component: 'key_benefit',
            matchScore: benefitMatch.score,
            matchReason: `Addresses benefit: "${this.truncate(benefitMatch.match, 60)}"`
          });
        }
      }

      // 4. Check TRANSFORMATION alignment - before/after states
      const transformTexts: string[] = [];
      if (uvp.transformationGoal?.before) transformTexts.push(uvp.transformationGoal.before);
      if (uvp.transformationGoal?.after) transformTexts.push(uvp.transformationGoal.after);

      if (transformTexts.length > 0) {
        const transformMatch = this.findBestMatch(triggerText, transformTexts);
        if (transformMatch.score > MATCH_THRESHOLD) {
          alignments.push({
            component: 'transformation',
            matchScore: transformMatch.score,
            matchReason: `Relates to transformation: "${this.truncate(transformMatch.match, 60)}"`
          });
        }
      }

      // 5. Check DIFFERENTIATORS alignment
      if (uvp.uniqueSolution?.differentiators && uvp.uniqueSolution.differentiators.length > 0) {
        const diffStrings = uvp.uniqueSolution.differentiators.map(d => d.statement);
        const diffMatch = this.findBestMatch(triggerText, diffStrings);
        if (diffMatch.score > MATCH_THRESHOLD) {
          alignments.push({
            component: 'unique_solution',
            matchScore: diffMatch.score,
            matchReason: `Connects to differentiator: "${this.truncate(diffMatch.match, 60)}"`
          });
        }
      }

      // 6. FALLBACK: Keyword-based semantic alignment
      // If we haven't found any alignments yet, use keyword patterns
      // This ensures triggers are connected to UVP even with sparse UVP data
      if (alignments.length === 0) {
        const foundComponents = new Set<string>();
        for (const mapping of keywordAlignments) {
          if (mapping.keywords.test(triggerText) && !foundComponents.has(mapping.component)) {
            alignments.push({
              component: mapping.component,
              matchScore: 0.65, // Good confidence for keyword match
              matchReason: mapping.reason
            });
            foundComponents.add(mapping.component);
            // Limit to 2 keyword-based alignments
            if (foundComponents.size >= 2) break;
          }
        }
      }

      // PHASE F: Calculate aggregate UVP alignment score
      const uvpAlignmentScore = alignments.length > 0
        ? alignments.reduce((sum, a) => sum + a.matchScore, 0) / alignments.length
        : 0;
      const uvpAlignmentCount = alignments.length;
      const isHighUVPAlignment = uvpAlignmentScore >= 0.5 && uvpAlignmentCount >= 2;

      // Log first few triggers' alignment status for debugging
      if (triggers.indexOf(trigger) < 3) {
        console.log('[UVPAlignment] Trigger:', trigger.title.substring(0, 40), '- Alignments found:', alignments.length, alignments.map(a => a.component), '- Score:', uvpAlignmentScore.toFixed(2), '- High:', isHighUVPAlignment);
      }

      return {
        ...trigger,
        uvpAlignments: alignments,
        uvpAlignmentScore,
        uvpAlignmentCount,
        isHighUVPAlignment
      };
    });
  }

  private truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + '...';
  }

  private findBestMatch(text: string, candidates: string[]): { match: string; score: number } {
    let bestMatch = '';
    let bestScore = 0;

    candidates.forEach(candidate => {
      // Use both Jaccard similarity AND direct keyword containment
      const jaccardScore = this.calculateTextSimilarity(text, candidate);

      // Also check for direct keyword overlap (more forgiving)
      const candidateWords = this.extractKeywords(candidate.toLowerCase());
      const textLower = text.toLowerCase();
      const containsScore = candidateWords.filter(w => textLower.includes(w)).length / Math.max(candidateWords.length, 1);

      // Use the better of the two scores
      const score = Math.max(jaccardScore, containsScore * 0.8);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    });

    return { match: bestMatch, score: bestScore };
  }

  // ============================================================================
  // PROFILE WEIGHTING
  // ============================================================================

  private applyProfileWeighting(
    triggers: ConsolidatedTrigger[],
    profileConfig: ProfileTriggerConfig
  ): ConsolidatedTrigger[] {
    return triggers.map(trigger => {
      let relevance = 0.5; // Base relevance

      // Check if trigger category matches profile priorities
      const categoryKey = trigger.category.replace('-', '');
      if (profileConfig.priorityTriggers.some(pt => pt.includes(categoryKey))) {
        relevance += 0.3;
      }

      // Check if evidence sources match profile priorities
      const sourceMatches = trigger.evidence.filter(e =>
        profileConfig.prioritySources.some(ps =>
          e.platform.toLowerCase().includes(ps.replace('-', ' '))
        )
      ).length;
      relevance += Math.min(0.2, sourceMatches * 0.05);

      return { ...trigger, profileRelevance: Math.min(1.0, relevance) };
    });
  }

  // ============================================================================
  // RELEVANCE SCORING
  // ============================================================================

  private applyRelevanceScoring(
    triggers: ConsolidatedTrigger[],
    uvp: CompleteUVP,
    profileType: BusinessProfileType,
    brandData?: any
  ): { relevantTriggers: ConsolidatedTrigger[]; filteredCount: number } {
    const relevantTriggers: ConsolidatedTrigger[] = [];
    let filteredCount = 0;

    const scoringContext = {
      uvp,
      profileType: profileType as BusinessProfileType | 'global-saas-b2b',
      brandData,
      threshold: 0.35 // Minimum score to pass
    };

    for (const trigger of triggers) {
      // Combine title and all evidence for scoring
      const triggerContent = [
        trigger.title,
        trigger.executiveSummary,
        ...trigger.evidence.map(e => e.quote)
      ].join(' ');

      const score = triggerRelevanceScorerService.scoreTrigger(
        {
          id: trigger.id,
          title: trigger.title,
          content: triggerContent,
          source: trigger.evidence[0]?.source,
          platform: trigger.evidence[0]?.platform
        },
        scoringContext
      );

      if (score.isRelevant) {
        relevantTriggers.push({
          ...trigger,
          relevanceScore: score.finalScore,
          isRelevant: true,
          // Adjust confidence based on relevance
          confidence: Math.min(0.99, trigger.confidence * (0.7 + score.finalScore * 0.3))
        });
      } else {
        filteredCount++;
        console.log(`[TriggerConsolidation] Filtered: "${trigger.title.substring(0, 50)}..." - ${score.reasoning}`);
      }
    }

    return { relevantTriggers, filteredCount };
  }

  /**
   * Apply PROFILE-AWARE source quality weighting
   * Uses the profile-specific source tier assignments from source-quality.service.ts
   * e.g., G2 is tier1 for SaaS B2B but tier3 for local B2C
   */
  private applySourceQualityWeighting(
    triggers: ConsolidatedTrigger[],
    profileType?: BusinessProfileType
  ): ConsolidatedTrigger[] {
    const profile = profileType || 'national-saas-b2b';

    // PHASE G: Enhanced source quality weighting across ALL evidence
    return triggers.map(trigger => {
      if (trigger.evidence.length === 0) return trigger;

      // Calculate weighted average multiplier across ALL evidence items
      let totalMultiplier = 0;
      let tier1Count = 0;
      let tier2Count = 0;
      let tier3Count = 0;

      for (const evidence of trigger.evidence) {
        const quality = sourceQualityService.getProfileAwareQualityAdjustment(
          evidence.platform,
          profile,
          evidence.url,
          evidence.quote
        );
        totalMultiplier += quality.multiplier;

        // Track tier distribution
        if (quality.tier === 'tier1') tier1Count++;
        else if (quality.tier === 'tier2') tier2Count++;
        else tier3Count++;
      }

      // Calculate average multiplier
      const avgMultiplier = totalMultiplier / trigger.evidence.length;

      // Determine dominant tier based on count
      let dominantTier: 'tier1' | 'tier2' | 'tier3' = 'tier2';
      if (tier1Count >= tier2Count && tier1Count >= tier3Count) {
        dominantTier = 'tier1';
      } else if (tier3Count > tier1Count && tier3Count > tier2Count) {
        dominantTier = 'tier3';
      }

      // Adjust relevance score based on average profile-specific source quality
      const adjustedRelevance = Math.min(1, (trigger.relevanceScore || 0.5) * avgMultiplier);

      // Log first few triggers for debugging
      if (triggers.indexOf(trigger) < 3) {
        console.log('[SourceQuality] Trigger:', trigger.title.substring(0, 40),
          '- Evidence:', trigger.evidence.length,
          '- AvgMultiplier:', avgMultiplier.toFixed(2),
          '- Tier1:', tier1Count, 'Tier2:', tier2Count, 'Tier3:', tier3Count,
          '- Dominant:', dominantTier);
      }

      return {
        ...trigger,
        relevanceScore: adjustedRelevance,
        sourceTier: dominantTier,
        sourceQualityMultiplier: avgMultiplier
      };
    });
  }

  // ============================================================================
  // PHASE H: CATEGORY BALANCING
  // ============================================================================

  /**
   * PHASE H: Apply profile-specific category weighting
   * Primary categories get 1.25x boost, secondary get 1.1x, tertiary get 1.0x
   * This ensures triggers in profile-relevant categories surface higher
   */
  private applyCategoryWeighting(
    triggers: ConsolidatedTrigger[],
    profileType: BusinessProfileType
  ): ConsolidatedTrigger[] {
    const categoryConfig = PROFILE_CATEGORY_WEIGHTS[profileType] || PROFILE_CATEGORY_WEIGHTS['national-saas-b2b'];

    return triggers.map(trigger => {
      // Determine category weight
      let weightMultiplier: number;
      let isPrimary = false;

      if (categoryConfig.primaryCategories.includes(trigger.category)) {
        weightMultiplier = PRIMARY_CATEGORY_WEIGHT;
        isPrimary = true;
      } else if (categoryConfig.secondaryCategories.includes(trigger.category)) {
        weightMultiplier = SECONDARY_CATEGORY_WEIGHT;
      } else {
        weightMultiplier = TERTIARY_CATEGORY_WEIGHT;
      }

      // Apply weight to relevance score
      const adjustedRelevance = Math.min(1, (trigger.relevanceScore || 0.5) * weightMultiplier);

      return {
        ...trigger,
        relevanceScore: adjustedRelevance,
        categoryWeightMultiplier: weightMultiplier,
        isPrimaryCategory: isPrimary
      };
    });
  }

  /**
   * PHASE H: Analyze category distribution and return gap analysis
   * Tracks how triggers are distributed across all 7 categories
   */
  private analyzeCategoryDistribution(
    triggers: ConsolidatedTrigger[],
    profileType: BusinessProfileType
  ): CategoryGapAnalysis {
    const categoryConfig = PROFILE_CATEGORY_WEIGHTS[profileType] || PROFILE_CATEGORY_WEIGHTS['national-saas-b2b'];
    const allCategories: TriggerCategory[] = ['fear', 'desire', 'pain-point', 'objection', 'motivation', 'trust', 'urgency'];

    // Count triggers per category
    const counts: Record<TriggerCategory, number> = {} as Record<TriggerCategory, number>;
    for (const cat of allCategories) {
      counts[cat] = 0;
    }
    for (const trigger of triggers) {
      counts[trigger.category] = (counts[trigger.category] || 0) + 1;
    }

    // Build log message
    const primary = categoryConfig.primaryCategories.map(c => `${c}:${counts[c]}`).join(', ');
    const secondary = categoryConfig.secondaryCategories.map(c => `${c}:${counts[c]}`).join(', ');
    const tertiary = allCategories
      .filter(c => !categoryConfig.primaryCategories.includes(c) && !categoryConfig.secondaryCategories.includes(c))
      .map(c => `${c}:${counts[c]}`)
      .join(', ');

    console.log(`[CategoryBalance] Profile: ${profileType} | Total: ${triggers.length}`);
    console.log(`[CategoryBalance] Primary (1.25x): ${primary}`);
    console.log(`[CategoryBalance] Secondary (1.1x): ${secondary}`);
    console.log(`[CategoryBalance] Tertiary (1.0x): ${tertiary}`);

    // Calculate gaps for each category
    const categoryGaps: Record<TriggerCategory, number> = {} as Record<TriggerCategory, number>;
    let totalGap = 0;
    const underrepresentedCategories: TriggerCategory[] = [];

    for (const cat of allCategories) {
      const gap = Math.max(0, categoryConfig.minTriggersPerCategory - counts[cat]);
      categoryGaps[cat] = gap;
      totalGap += gap;
      if (gap > 0) {
        underrepresentedCategories.push(cat);
      }
    }

    if (underrepresentedCategories.length > 0) {
      console.log(`[CategoryBalance] Warning: Underrepresented categories (< ${categoryConfig.minTriggersPerCategory}): ${underrepresentedCategories.join(', ')}`);
      console.log(`[CategoryBalance] Gaps: ${underrepresentedCategories.map(c => `${c}:${categoryGaps[c]}`).join(', ')}`);
    }

    return {
      underrepresentedCategories,
      categoryGaps,
      totalGap,
      needsRebalancing: totalGap > 0
    };
  }

  /**
   * PHASE H: Enforce minimum triggers per category
   * Promotes triggers from underrepresented categories by boosting their relevance scores
   * and ensures minimum representation across all 7 psychological categories
   */
  private enforceCategoryMinimums(
    triggers: ConsolidatedTrigger[],
    profileType: BusinessProfileType,
    gapAnalysis: CategoryGapAnalysis
  ): ConsolidatedTrigger[] {
    if (!gapAnalysis.needsRebalancing) {
      console.log(`[CategoryBalance] No rebalancing needed - all categories meet minimum`);
      return triggers;
    }

    const categoryConfig = PROFILE_CATEGORY_WEIGHTS[profileType] || PROFILE_CATEGORY_WEIGHTS['national-saas-b2b'];
    const result = [...triggers];

    // Group triggers by category
    const byCategory: Record<TriggerCategory, ConsolidatedTrigger[]> = {
      'fear': [], 'desire': [], 'pain-point': [], 'objection': [],
      'motivation': [], 'trust': [], 'urgency': []
    };
    for (const t of result) {
      byCategory[t.category].push(t);
    }

    // Find overrepresented categories (have more than minTriggersPerCategory)
    const overrepresented = Object.entries(byCategory)
      .filter(([cat, arr]) => arr.length > categoryConfig.minTriggersPerCategory)
      .map(([cat]) => cat as TriggerCategory);

    // For each underrepresented category, boost any existing triggers
    let boostCount = 0;
    for (const underCat of gapAnalysis.underrepresentedCategories) {
      const existingTriggers = byCategory[underCat];

      // Boost relevance of existing triggers in underrepresented categories
      for (const trigger of existingTriggers) {
        const idx = result.findIndex(t => t.id === trigger.id);
        if (idx !== -1) {
          // Apply a 1.5x boost to help these surface higher
          result[idx] = {
            ...result[idx],
            relevanceScore: Math.min(1, (result[idx].relevanceScore || 0.5) * 1.5),
            isCategoryFill: true
          };
          boostCount++;
        }
      }
    }

    console.log(`[CategoryBalance] Boosted ${boostCount} triggers from underrepresented categories`);
    console.log(`[CategoryBalance] Underrepresented: ${gapAnalysis.underrepresentedCategories.join(', ')} | Overrepresented: ${overrepresented.join(', ')}`);

    return result;
  }

  /**
   * PHASE H: Legacy wrapper - Log category distribution for debugging
   * @deprecated Use analyzeCategoryDistribution instead
   */
  private logCategoryDistribution(
    triggers: ConsolidatedTrigger[],
    profileType: BusinessProfileType
  ): void {
    this.analyzeCategoryDistribution(triggers, profileType);
  }

  // ============================================================================
  // BUYER-PRODUCT FIT VALIDATION (Phase 8)
  // ============================================================================

  /**
   * Apply Buyer-Product Fit and JTBD validation to triggers
   * This ensures triggers lead to THIS product category, not just any product
   */
  private applyBuyerProductFitValidation(
    triggers: ConsolidatedTrigger[],
    uvp: CompleteUVP,
    profileType: BusinessProfileType
  ): ConsolidatedTrigger[] {
    const validatedTriggers: ConsolidatedTrigger[] = [];

    for (const trigger of triggers) {
      // Skip if LLM already provided fit validation with high score
      if (trigger.buyerProductFit && trigger.buyerProductFit >= 0.7 && trigger.buyerProductFitReasoning) {
        // LLM already validated this trigger with high confidence
        validatedTriggers.push(trigger);
        continue;
      }

      // Run Buyer-Product Fit validation
      const fitResult = buyerProductFitService.validateFit({
        triggerTitle: trigger.title,
        triggerSummary: trigger.executiveSummary,
        evidence: trigger.evidence.map(e => e.quote),
        uvp,
        profileType
      });

      // Run JTBD validation
      const jtbdResult = jtbdValidatorService.validate(
        trigger.title,
        trigger.executiveSummary,
        profileType,
        uvp
      );

      // Combined validation: either must pass, or both must have decent scores
      const combinedScore = (fitResult.fitScore * 0.6) + (jtbdResult.matchScore * 0.4);
      const passesValidation = fitResult.isValid || jtbdResult.isValid || combinedScore >= 0.35;

      if (passesValidation) {
        // Build reasoning from validation results
        const reasoning = trigger.buyerProductFitReasoning ||
          this.buildValidationReasoning(fitResult, jtbdResult);

        validatedTriggers.push({
          ...trigger,
          buyerJourneyStage: trigger.buyerJourneyStage || fitResult.buyerJourneyStage,
          buyerProductFit: trigger.buyerProductFit || fitResult.fitScore,
          buyerProductFitReasoning: reasoning
        });
      } else {
        console.log(`[TriggerConsolidation] Buyer-fit rejected: "${trigger.title.substring(0, 50)}..." - ${fitResult.rejectionReason || jtbdResult.reasoning}`);
      }
    }

    return validatedTriggers;
  }

  /**
   * Build reasoning string from fit and JTBD validation results
   */
  private buildValidationReasoning(
    fitResult: ReturnType<typeof buyerProductFitService.validateFit>,
    jtbdResult: ReturnType<typeof jtbdValidatorService.validate>
  ): string {
    const parts: string[] = [];

    if (fitResult.isValid) {
      parts.push(fitResult.reasoning);
    }

    if (jtbdResult.isValid && jtbdResult.matchedJTBD) {
      parts.push(`Aligns with JTBD: "${jtbdResult.matchedJTBD.situation}"`);
    }

    return parts.length > 0
      ? parts.join('. ')
      : `Fit score: ${(fitResult.fitScore * 100).toFixed(0)}%, Journey: ${fitResult.buyerJourneyStage}`;
  }

  // ============================================================================
  // SORTING
  // ============================================================================

  private sortTriggers(triggers: ConsolidatedTrigger[]): ConsolidatedTrigger[] {
    return triggers.sort((a, b) => {
      // PHASE F: Primary boost for high UVP alignment triggers (surface them first)
      if (a.isHighUVPAlignment && !b.isHighUVPAlignment) return -1;
      if (!a.isHighUVPAlignment && b.isHighUVPAlignment) return 1;

      // PHASE H: Secondary boost for primary category triggers
      if (a.isPrimaryCategory && !b.isPrimaryCategory) return -1;
      if (!a.isPrimaryCategory && b.isPrimaryCategory) return 1;

      // Tertiary: Sort by combined relevance score including UVP alignment (higher first)
      // UVP alignment contributes 20% weight to the overall score
      // Category weight is already factored into relevanceScore from applyCategoryWeighting()
      const uvpBoostA = (a.uvpAlignmentScore || 0) * 0.2;
      const uvpBoostB = (b.uvpAlignmentScore || 0) * 0.2;
      const scoreA = ((a.relevanceScore || 0.5) * a.confidence * a.profileRelevance) + uvpBoostA;
      const scoreB = ((b.relevanceScore || 0.5) * b.confidence * b.profileRelevance) + uvpBoostB;
      if (Math.abs(scoreB - scoreA) > 0.1) {
        return scoreB - scoreA;
      }
      // Quaternary: Group by category
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      // Final: By confidence
      return b.confidence - a.confidence;
    });
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private normalizePlatform(source: string): string {
    const platformMap: Record<string, string> = {
      'apify-reddit': 'Reddit',
      'reddit': 'Reddit',
      'google-reviews': 'Google Reviews',
      'outscraper': 'Google Reviews',
      'g2': 'G2',
      'perplexity': 'Web Research',
      'linkedin': 'LinkedIn',
      'youtube': 'YouTube',
      'yelp': 'Yelp'
    };

    const lower = source.toLowerCase();
    return platformMap[lower] || source;
  }

  private calculateGroupConfidence(evidence: EvidenceItem[]): number {
    if (evidence.length === 0) return 0;

    // Average confidence boosted by evidence count
    const avgConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;
    const countBoost = Math.min(0.15, evidence.length * 0.03);

    return Math.min(0.99, avgConfidence + countBoost);
  }
}

// Export singleton
export const triggerConsolidationService = new TriggerConsolidationService();
