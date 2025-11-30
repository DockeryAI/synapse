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
} from './profile-detection.service';
import { triggerRelevanceScorerService } from './trigger-relevance-scorer.service';
import { sourceQualityService } from './source-quality.service';
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
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
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
  private maxInputEvidence = 100; // Cap input to prevent 1000+ item processing
  private maxOutputTriggers = 50; // Cap output triggers

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
   * Filters evidence to only include items with valid source URLs
   */
  private filterValidEvidence(evidence: EvidenceItem[]): EvidenceItem[] {
    const valid = evidence.filter(e => this.hasValidSourceUrl(e));
    const filtered = evidence.length - valid.length;
    if (filtered > 0) {
      console.log(`[TriggerConsolidation] Filtered ${filtered} evidence items without valid source URLs`);
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

    // CRITICAL: Filter evidence to only items with valid source URLs
    // Reject AI-generated content without real backing
    const triggersWithValidEvidence = llmTriggers.map(trigger => {
      const validEvidence = this.filterValidEvidence(trigger.evidence);
      return {
        ...trigger,
        evidence: validEvidence,
        evidenceCount: validEvidence.length
      };
    }).filter(trigger => {
      // REQUIRE at least 1 valid evidence item - reject triggers with no real sources
      if (trigger.evidence.length === 0) {
        console.log(`[TriggerConsolidation] Rejecting trigger (no valid evidence): "${trigger.title.substring(0, 50)}..."`);
        return false;
      }
      return true;
    });

    console.log(`[TriggerConsolidation] ${triggersWithValidEvidence.length} triggers have valid evidence (${llmTriggers.length - triggersWithValidEvidence.length} rejected)`);

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

    // 4. Apply source quality weighting
    const qualityWeightedTriggers = this.applySourceQualityWeighting(relevantTriggers);

    // 5. Sort by relevance and confidence
    const sortedTriggers = this.sortTriggers(qualityWeightedTriggers);

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

    // 9. Apply source quality weighting
    const qualityWeightedTriggers = this.applySourceQualityWeighting(relevantTriggers);

    // 10. Sort by relevance and confidence
    const sortedTriggers = this.sortTriggers(qualityWeightedTriggers);

    // 11. CAP output to maxOutputTriggers
    const cappedTriggers = sortedTriggers.slice(0, this.maxOutputTriggers);

    // Calculate average relevance
    const avgRelevanceScore = cappedTriggers.length > 0
      ? cappedTriggers.reduce((sum, t) => sum + (t.relevanceScore || 0), 0) / cappedTriggers.length
      : 0;

    console.log(`[TriggerConsolidation] ${sortedTriggers.length} triggers created, returning top ${cappedTriggers.length} (capped at ${this.maxOutputTriggers}), ${filteredCount} filtered out`);

    return {
      triggers: cappedTriggers,
      profileType: profileAnalysis.profileType,
      profileConfig,
      totalEvidenceItems: rawEvidence.length,
      deduplicatedCount: rawEvidence.length - sortedTriggers.reduce((sum, t) => sum + t.evidence.length, 0),
      filteredCount,
      avgRelevanceScore
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
   * LOOSENED FILTERS: Allow more triggers through, especially customer psychology
   */
  private isValidTriggerTitle(title: string): boolean {
    const lowerTitle = title.toLowerCase();

    // Reject if too short (likely incomplete)
    if (title.length < 10) return false;

    // Reject if too long (should be 3-8 words, ~60 chars max)
    if (title.length > 80) return false;

    // Reject if starts with quote character (raw quote text)
    if (/^["'"'`]/.test(title)) return false;

    // Reject marketing copy (most important filter)
    if (this.isMarketingCopy(title)) {
      return false;
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
    ];

    for (const pattern of rejectPatterns) {
      if (pattern.test(title)) return false;
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
      'learn', 'understand', 'confus', 'complex', 'simple'
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
    // More detailed summary with actionable messaging recommendation
    const evidenceQuotes = trigger.evidence.map(e => e.quote);
    const platforms = [...new Set(trigger.evidence.map(e => e.platform))];

    // Extract the core insight from evidence - preserve more detail
    const coreInsight = this.extractCoreInsight(evidenceQuotes);

    // Find which differentiator addresses this trigger
    const matchingDifferentiator = this.findMatchingDifferentiator(coreInsight, uvp);

    // Get target customer description for personalization
    const targetCustomer = this.extractBuyerDescription(uvp);

    // Build source attribution string
    const sourceAttribution = platforms.length > 1
      ? `Validated across ${platforms.join(', ')}`
      : `Source: ${platforms[0] || 'industry research'}`;

    // Category-specific summaries with ACTIONABLE messaging recommendations
    switch (trigger.category) {
      case 'fear':
        return matchingDifferentiator
          ? `${targetCustomer} express anxiety about ${coreInsight}. Your "${this.truncateDifferentiator(matchingDifferentiator)}" directly addresses this concern. Lead with risk-mitigation messaging: "Eliminate the fear of..." ${sourceAttribution}.`
          : `${targetCustomer} consistently worry about ${coreInsight}. Address this in sales materials with specific proof points showing how you prevent this scenario. ${sourceAttribution}.`;

      case 'desire':
        return matchingDifferentiator
          ? `${targetCustomer} actively search for ${coreInsight}. Your "${this.truncateDifferentiator(matchingDifferentiator)}" delivers exactly this. Use outcome-focused CTAs highlighting this specific benefit. ${sourceAttribution}.`
          : `${targetCustomer} want ${coreInsight} but struggle to find it. Position this as a key differentiator in your hero messaging. ${sourceAttribution}.`;

      case 'pain-point':
        return matchingDifferentiator
          ? `${targetCustomer} are frustrated by ${coreInsight}. Your "${this.truncateDifferentiator(matchingDifferentiator)}" eliminates this friction. Use "before/after" messaging to show the transformation. ${sourceAttribution}.`
          : `${targetCustomer} struggle with ${coreInsight}. Demonstrate how your solution removes this obstacle entirely. Consider testimonials addressing this specific pain. ${sourceAttribution}.`;

      case 'objection':
        return matchingDifferentiator
          ? `${targetCustomer} hesitate because of concerns about ${coreInsight}. Counter proactively with "${this.truncateDifferentiator(matchingDifferentiator)}" in your FAQ and sales deck. ${sourceAttribution}.`
          : `${targetCustomer} need reassurance about ${coreInsight}. Add social proof or guarantees that directly address this objection. ${sourceAttribution}.`;

      case 'motivation':
        return matchingDifferentiator
          ? `${targetCustomer} are energized by ${coreInsight}. Connect "${this.truncateDifferentiator(matchingDifferentiator)}" to this motivation in your calls-to-action and urgency messaging. ${sourceAttribution}.`
          : `${targetCustomer} are driven by ${coreInsight}. Amplify this motivation in your landing page headlines and email subject lines. ${sourceAttribution}.`;

      case 'trust':
        return matchingDifferentiator
          ? `Building trust around ${coreInsight} is critical for ${targetCustomer}. Feature "${this.truncateDifferentiator(matchingDifferentiator)}" with concrete proof points (numbers, logos, testimonials). ${sourceAttribution}.`
          : `${targetCustomer} need to trust you on ${coreInsight}. Add third-party validation, specific metrics, and named customer references. ${sourceAttribution}.`;

      case 'urgency':
        return matchingDifferentiator
          ? `${targetCustomer} feel time pressure around ${coreInsight}. "${this.truncateDifferentiator(matchingDifferentiator)}" enables rapid response. Use deadline-driven campaigns and "start today" messaging. ${sourceAttribution}.`
          : `${targetCustomer} face urgency around ${coreInsight}. Emphasize speed-to-value and quick wins in your positioning. ${sourceAttribution}.`;

      default:
        return `${targetCustomer} indicate ${coreInsight} is a key decision factor. ${sourceAttribution}.`;
    }
  }

  /**
   * Truncate differentiator to reasonable length for executive summary
   */
  private truncateDifferentiator(diff: string): string {
    if (diff.length <= 60) return diff;
    return diff.substring(0, 57) + '...';
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
   */
  private extractKeyPhrase(quote: string): string {
    // Remove leading/trailing quotes
    let cleaned = quote.replace(/^["']|["']$/g, '').trim();

    // If it's already short, use it
    if (cleaned.length < 60) return cleaned.toLowerCase();

    // Extract first meaningful clause (before first comma, dash, or semicolon)
    const firstClause = cleaned.split(/[,;–—]/)[0].trim();
    if (firstClause.length > 20 && firstClause.length < 80) {
      return firstClause.toLowerCase();
    }

    // Fallback: first 60 chars with ellipsis
    return cleaned.substring(0, 60).trim().toLowerCase() + '...';
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

  private extractTitle(text: string, category: TriggerCategory): string {
    // Extract a CONCISE, readable title from the evidence text
    // Titles should be 3-8 words, capturing the core psychological trigger
    const cleaned = text
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\s+/g, ' ')
      .trim();

    // Try to extract core trigger phrase (first meaningful clause)
    // Split on common clause boundaries
    const clauses = cleaned.split(/[-–—,;:]/);
    let title = clauses[0].trim();

    // If first clause is still too long, truncate to ~8 words
    const words = title.split(/\s+/);
    if (words.length > 8) {
      title = words.slice(0, 8).join(' ');
    }

    // Clean up: remove trailing conjunctions/articles
    title = title.replace(/\s+(and|or|but|the|a|an|that|which|who|when|where|with|from|to|for|of|in|on|at|by)$/i, '');

    // Ensure minimum length
    if (title.length < 10) {
      title = cleaned.split(/[.!?]/)[0].trim();
      if (title.length > 60) {
        title = title.substring(0, 60).trim();
      }
    }

    // Add category prefix if title doesn't start with emotion word
    const emotionStarters = /^(fear|afraid|worried|anxious|frustrated|annoyed|hate|want|wish|need|looking|hoping|concerned|hesitant|uncertain)/i;
    if (!emotionStarters.test(title)) {
      // Only prefix if it makes sense and isn't too long
      if (title.length < 40) {
        if (category === 'fear') title = `Fear of ${title.toLowerCase()}`;
        else if (category === 'desire') title = `Want ${title.toLowerCase()}`;
        else if (category === 'pain-point') title = `Frustrated by ${title.toLowerCase()}`;
      }
    }

    return title || `${CATEGORY_LABELS[category]} Signal`;
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

      // Log first few triggers' alignment status for debugging
      if (triggers.indexOf(trigger) < 3) {
        console.log('[UVPAlignment] Trigger:', trigger.title.substring(0, 40), '- Alignments found:', alignments.length, alignments.map(a => a.component));
      }

      return { ...trigger, uvpAlignments: alignments };
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

  private applySourceQualityWeighting(triggers: ConsolidatedTrigger[]): ConsolidatedTrigger[] {
    return triggers.map(trigger => {
      // Get the primary evidence source
      const primarySource = trigger.evidence[0];
      if (!primarySource) return trigger;

      const quality = sourceQualityService.getQualityAdjustment(
        primarySource.platform,
        primarySource.url,
        primarySource.quote
      );

      // Adjust relevance score based on source quality
      const adjustedRelevance = Math.min(1, (trigger.relevanceScore || 0.5) * quality.multiplier);

      return {
        ...trigger,
        relevanceScore: adjustedRelevance,
        sourceTier: quality.tier
      };
    });
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
      // Primary: Sort by combined relevance score (higher first)
      const scoreA = (a.relevanceScore || 0.5) * a.confidence * a.profileRelevance;
      const scoreB = (b.relevanceScore || 0.5) * b.confidence * b.profileRelevance;
      if (Math.abs(scoreB - scoreA) > 0.1) {
        return scoreB - scoreA;
      }
      // Secondary: Group by category
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      // Tertiary: By confidence
      return b.confidence - a.confidence;
    });
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positive = /love|great|excellent|amazing|perfect|happy|satisfied|recommend/i;
    const negative = /hate|terrible|awful|worst|frustrated|angry|disappointed|problem/i;

    if (positive.test(text)) return 'positive';
    if (negative.test(text)) return 'negative';
    return 'neutral';
  }

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
