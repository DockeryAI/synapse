/**
 * Content Synthesis Orchestrator V3.1
 *
 * SINGLE ENTRY POINT for all content generation in the system.
 * Unifies: EQ Model + Industry Profile + UVP Data + Segment Context + AI Synthesis
 *
 * Every insight displayed in Content Mixer, Campaign Builder, or Export
 * flows through this orchestrator for consistent, high-quality output.
 */

import type { IndustryEQ } from '@/services/uvp-wizard/emotional-quotient';
import type { IndustryProfileFull } from '@/types/industry-profile.types';
import type { CategorizedInsight } from '@/types/content-mixer.types';
import type { SynthesizedInsight } from './ai-insight-synthesizer.service';
import { getIndustryEQ, INDUSTRY_EQ_MAP } from '@/services/uvp-wizard/emotional-quotient';
import { IndustryProfileGenerator } from '@/services/industry/IndustryProfileGenerator.service';
import { ContentFrameworkLibrary, type FrameworkType } from '@/services/synapse/generation/ContentFrameworkLibrary';
import { embeddingService } from './embedding.service';

// ============================================================================
// TYPES
// ============================================================================

export type BusinessSegment = 'smb_local' | 'smb_regional' | 'b2b_national' | 'b2b_global';
export type JourneyStage = 'awareness' | 'consideration' | 'decision' | 'retention';
export type ContentFormat = 'insight' | 'hook' | 'faq' | 'how-to' | 'comparison' | 'case-study' | 'data-point' | 'controversial';

export interface SynthesisContext {
  // Brand Data
  brandName: string;
  industry: string;
  naicsCode?: string;

  // UVP Data
  uvpData: {
    target_customer?: string;
    key_benefit?: string;
    transformation?: string;
    unique_mechanism?: string;
    proof_points?: string[];
  };

  // Segment & Journey
  segment: BusinessSegment;
  journeyStage?: JourneyStage;
  persona?: string;

  // Filters (from Content Mixer)
  selectedFormat?: ContentFormat;
  selectedCategory?: string;
}

export interface EnrichedContext extends SynthesisContext {
  // Loaded from services
  eqProfile: IndustryEQ;
  industryProfile: IndustryProfileFull | null;

  // Calculated weights
  eqWeights: {
    fear: number;
    aspiration: number;
    trust: number;
    urgency: number;
    logic: number;
  };

  // Segment-specific guidelines
  segmentGuidelines: {
    tone: string;
    language: string[];
    focusAreas: string[];
    avoidAreas: string[];
  };
}

export interface OrchestratedInsight extends SynthesizedInsight {
  // Orchestrator additions
  eqAlignment: number; // 0-100 how well this matches brand's EQ profile
  industryRelevance: number; // 0-100 how relevant to industry context
  segmentFit: number; // 0-100 how well it fits the segment
  uvpAlignment: string | null; // Which UVP element this addresses
  recommendedPriority: number; // Final weighted score for display order
}

export interface ReSynthesisRequest {
  insight: CategorizedInsight | SynthesizedInsight;
  targetJourneyStage: JourneyStage;
  targetPersona?: string;
  targetFormat?: ContentFormat;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SEGMENT_GUIDELINES: Record<BusinessSegment, EnrichedContext['segmentGuidelines']> = {
  smb_local: {
    tone: 'friendly, community-focused, personal',
    language: ['your neighbors', 'local community', 'right here in', 'family-owned', 'trusted by locals'],
    focusAreas: ['community trust', 'local reputation', 'personal service', 'accessibility'],
    avoidAreas: ['enterprise', 'global scale', 'corporate', 'mass market']
  },
  smb_regional: {
    tone: 'professional yet approachable, growth-minded',
    language: ['across the region', 'regional leader', 'expanding', 'growing with you'],
    focusAreas: ['regional expertise', 'scalable solutions', 'proven track record'],
    avoidAreas: ['hyper-local', 'global enterprise', 'startup']
  },
  b2b_national: {
    tone: 'professional, authoritative, results-driven',
    language: ['nationwide', 'industry-leading', 'enterprise-grade', 'proven ROI', 'scalable'],
    focusAreas: ['ROI', 'efficiency', 'competitive advantage', 'compliance', 'integration'],
    avoidAreas: ['mom and pop', 'local', 'boutique', 'artisanal']
  },
  b2b_global: {
    tone: 'sophisticated, visionary, enterprise-focused',
    language: ['global presence', 'world-class', 'multinational', 'cross-border', 'at scale'],
    focusAreas: ['global operations', 'localization', 'compliance', 'security', 'innovation'],
    avoidAreas: ['small business', 'local market', 'domestic only']
  }
};

// ============================================================================
// MAIN ORCHESTRATOR CLASS
// ============================================================================

export class ContentSynthesisOrchestrator {
  private frameworkLibrary: ContentFrameworkLibrary;
  private contextCache: Map<string, EnrichedContext> = new Map();
  private reSynthesisCache: Map<string, OrchestratedInsight> = new Map();
  // V3: Cache embeddings for power words and segment terms to avoid repeated API calls
  private powerWordEmbeddings: Map<string, number[]> = new Map();
  private insightEmbeddingCache: Map<string, number[]> = new Map();

  constructor() {
    this.frameworkLibrary = new ContentFrameworkLibrary();
  }

  // ==========================================================================
  // CONTEXT ENRICHMENT
  // ==========================================================================

  /**
   * Build enriched context with EQ, Industry Profile, and Segment guidelines
   * This is the foundation for all synthesis operations
   */
  async buildEnrichedContext(baseContext: SynthesisContext): Promise<EnrichedContext> {
    const cacheKey = `${baseContext.brandName}-${baseContext.naicsCode}-${baseContext.segment}`;

    // Check cache first
    const cached = this.contextCache.get(cacheKey);
    if (cached) {
      console.log('[Orchestrator] Using cached enriched context');
      return { ...cached, ...baseContext }; // Merge in any updated filters
    }

    console.log('[Orchestrator] Building enriched context...');
    const startTime = Date.now();

    // Load EQ Profile
    const eqProfile = await getIndustryEQ(baseContext.industry, baseContext.naicsCode);

    // Load Industry Profile (may be null if not generated yet)
    let industryProfile: IndustryProfileFull | null = null;
    if (baseContext.naicsCode) {
      try {
        industryProfile = await IndustryProfileGenerator.generateProfile(
          baseContext.industry,
          baseContext.naicsCode
        );
      } catch (error) {
        console.warn('[Orchestrator] Industry profile not available:', error);
      }
    }

    // V3 FIX: Fallback to generic profile if industry profile not available
    // This ensures semantic scoring works even without a specific profile
    if (!industryProfile) {
      console.log('[Orchestrator] Using fallback industry profile');
      // Use type assertion with unknown to handle partial profile
      industryProfile = {
        industry: baseContext.industry || 'General Business',
        industry_name: baseContext.industry || 'General Business',
        naics_code: baseContext.naicsCode || '000000',
        category: 'General',
        power_words: ['value', 'quality', 'trust', 'results', 'growth', 'success', 'efficiency', 'reliable', 'proven', 'expert'],
        avoid_words: ['guaranteed', 'best', 'cheapest', 'only'],
        customer_language_dictionary: ['solution', 'service', 'support', 'team', 'partner', 'customer'],
        pain_point_language: ['challenge', 'problem', 'issue', 'concern', 'need', 'struggle'],
        purchase_drivers: ['quality', 'price', 'trust', 'convenience'],
        decision_timeline: 'varies',
        customer_triggers: [],
        customer_journey: 'awareness → consideration → decision',
        transformations: [],
        success_metrics: ['satisfaction', 'efficiency', 'cost savings'],
        urgency_drivers: ['deadline', 'competition', 'opportunity cost']
      } as unknown as IndustryProfileFull;
    }

    // Calculate EQ weights (normalized to sum to 100)
    const totalEQ = Object.values(eqProfile.decision_drivers).reduce((a, b) => a + b, 0);
    const eqWeights = {
      fear: Math.round((eqProfile.decision_drivers.fear / totalEQ) * 100),
      aspiration: Math.round((eqProfile.decision_drivers.aspiration / totalEQ) * 100),
      trust: Math.round((eqProfile.decision_drivers.trust / totalEQ) * 100),
      urgency: Math.round((eqProfile.decision_drivers.urgency / totalEQ) * 100),
      logic: Math.round((eqProfile.decision_drivers.logic / totalEQ) * 100)
    };

    // Get segment guidelines
    const segmentGuidelines = SEGMENT_GUIDELINES[baseContext.segment];

    const enrichedContext: EnrichedContext = {
      ...baseContext,
      eqProfile,
      industryProfile,
      eqWeights,
      segmentGuidelines
    };

    // Cache for 5 minutes
    this.contextCache.set(cacheKey, enrichedContext);
    setTimeout(() => this.contextCache.delete(cacheKey), 5 * 60 * 1000);

    console.log(`[Orchestrator] Context enriched in ${Date.now() - startTime}ms`);
    console.log(`[Orchestrator] EQ Profile: ${eqProfile.emotional_weight}% emotional, JTBD: ${eqProfile.jtbd_focus}`);
    console.log(`[Orchestrator] Segment: ${baseContext.segment}, Guidelines loaded`);

    return enrichedContext;
  }

  // ==========================================================================
  // INSIGHT SCORING & RANKING
  // ==========================================================================

  /**
   * Score insights based on EQ alignment, industry relevance, and segment fit
   * This determines display order in Content Mixer
   * V3: Optimized - pre-generates all embeddings in batches to avoid API overload
   */
  async scoreInsights(
    insights: SynthesizedInsight[],
    context: EnrichedContext
  ): Promise<OrchestratedInsight[]> {
    console.log(`[Orchestrator] Scoring ${insights.length} insights with fast keyword matching...`);
    const startTime = Date.now();

    // V3 FAST: Use simple keyword-based scoring - no API calls, instant
    const scoredInsights = insights.map((insight) => {
      const eqAlignment = this.calculateEQAlignment(insight, context);
      const industryRelevance = this.calculateIndustryRelevanceFast(insight, context);
      const segmentFit = this.calculateSegmentFitFast(insight, context);
      const uvpAlignment = this.matchUVPElementFast(insight, context);

      const emotionalWeight = context.eqProfile.emotional_weight / 100;

      const recommendedPriority = Math.round(
        (eqAlignment * 0.3 * emotionalWeight) +
        (industryRelevance * 0.25) +
        (segmentFit * 0.25) +
        ((insight.scores?.breakthrough || 50) * 0.2) +
        (uvpAlignment ? 10 : 0)
      );

      return {
        ...insight,
        eqAlignment,
        industryRelevance,
        segmentFit,
        uvpAlignment,
        recommendedPriority
      };
    });

    console.log(`[Orchestrator] Scored ${insights.length} insights in ${Date.now() - startTime}ms total`);
    return scoredInsights.sort((a, b) => b.recommendedPriority - a.recommendedPriority);
  }

  /**
   * V3 FAST: Industry relevance using keyword matching (no API calls)
   */
  private calculateIndustryRelevanceFast(insight: SynthesizedInsight, context: EnrichedContext): number {
    if (!context.industryProfile) return 50;

    const content = `${insight.title || ''} ${insight.hook || ''}`.toLowerCase();
    let score = 50;

    // Check power words
    const powerWords = context.industryProfile.power_words || [];
    const powerMatches = powerWords.filter(w => content.includes(w.toLowerCase())).length;
    score += Math.min(25, powerMatches * 5);

    // Check customer language
    const customerLang = context.industryProfile.customer_language_dictionary || [];
    const langMatches = customerLang.filter(w => content.includes(w.toLowerCase())).length;
    score += Math.min(15, langMatches * 3);

    // Penalize avoid words
    const avoidWords = context.industryProfile.avoid_words || [];
    const avoidMatches = avoidWords.filter(w => content.includes(w.toLowerCase())).length;
    score -= avoidMatches * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * V3 FAST: Segment fit using keyword matching (no API calls)
   */
  private calculateSegmentFitFast(insight: SynthesizedInsight, context: EnrichedContext): number {
    const content = `${insight.title || ''} ${insight.hook || ''}`.toLowerCase();
    const guidelines = context.segmentGuidelines;
    let score = 50;

    // Check positive terms
    const positiveTerms = [...guidelines.language, ...guidelines.focusAreas];
    const positiveMatches = positiveTerms.filter(t => content.includes(t.toLowerCase())).length;
    score += Math.min(30, positiveMatches * 5);

    // Penalize avoid areas
    const avoidMatches = guidelines.avoidAreas.filter(t => content.includes(t.toLowerCase())).length;
    score -= avoidMatches * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * V3 FAST: UVP matching using keyword matching (no API calls)
   */
  private matchUVPElementFast(insight: SynthesizedInsight, context: EnrichedContext): string | null {
    const content = `${insight.title || ''} ${insight.hook || ''}`.toLowerCase();
    const uvp = context.uvpData;

    // Check transformation keywords
    if (uvp.transformation) {
      const transformWords = uvp.transformation.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matches = transformWords.filter(w => content.includes(w)).length;
      if (matches >= 2 || (transformWords.length <= 3 && matches >= 1)) {
        return 'transformation';
      }
    }

    // Check key benefit keywords
    if (uvp.key_benefit) {
      const benefitWords = uvp.key_benefit.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matches = benefitWords.filter(w => content.includes(w)).length;
      if (matches >= 2 || (benefitWords.length <= 3 && matches >= 1)) {
        return 'key_benefit';
      }
    }

    // Check target customer keywords
    if (uvp.target_customer) {
      const customerWords = uvp.target_customer.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matches = customerWords.filter(w => content.includes(w)).length;
      if (matches >= 2 || (customerWords.length <= 3 && matches >= 1)) {
        return 'target_customer';
      }
    }

    return null;
  }

  /**
   * V3 FIX: Pre-generate all term embeddings in batches
   * Called once before scoring to populate cache
   */
  private async preGenerateTermEmbeddings(context: EnrichedContext): Promise<void> {
    const termsToEmbed: Array<{ text: string; category: string }> = [];

    // Collect all unique terms that need embeddings
    if (context.industryProfile) {
      const powerWords = context.industryProfile.power_words || [];
      if (powerWords.length > 0) {
        termsToEmbed.push({ text: powerWords.join(', '), category: 'power' });
      }
      const customerLanguage = context.industryProfile.customer_language_dictionary || [];
      if (customerLanguage.length > 0) {
        termsToEmbed.push({ text: customerLanguage.join(', '), category: 'language' });
      }
      const avoidWords = context.industryProfile.avoid_words || [];
      if (avoidWords.length > 0) {
        termsToEmbed.push({ text: avoidWords.join(', '), category: 'avoid' });
      }
    }

    // Segment terms
    const guidelines = context.segmentGuidelines;
    const positiveTerms = [...guidelines.language, ...guidelines.focusAreas];
    if (positiveTerms.length > 0) {
      termsToEmbed.push({ text: positiveTerms.join(', '), category: `segment-${guidelines.tone}` });
    }
    if (guidelines.avoidAreas.length > 0) {
      termsToEmbed.push({ text: guidelines.avoidAreas.join(', '), category: `segment-avoid-${guidelines.tone}` });
    }

    // UVP terms
    const uvp = context.uvpData;
    if (uvp.transformation) termsToEmbed.push({ text: uvp.transformation, category: 'uvp-transform' });
    if (uvp.key_benefit) termsToEmbed.push({ text: uvp.key_benefit, category: 'uvp-benefit' });
    if (uvp.target_customer) termsToEmbed.push({ text: uvp.target_customer, category: 'uvp-customer' });

    // Filter out already cached terms
    const uncached = termsToEmbed.filter(t => {
      const cacheKey = `${t.category}:${t.text.substring(0, 50)}`;
      return !this.powerWordEmbeddings.has(cacheKey);
    });

    if (uncached.length === 0) {
      console.log(`[Orchestrator] All ${termsToEmbed.length} term embeddings already cached`);
      return;
    }

    // Generate all uncached term embeddings in one batch
    console.log(`[Orchestrator] Generating ${uncached.length} term embeddings in batch...`);
    try {
      const embeddings = await embeddingService.generateBatchEmbeddings(uncached.map(t => t.text));
      uncached.forEach((term, idx) => {
        const cacheKey = `${term.category}:${term.text.substring(0, 50)}`;
        this.powerWordEmbeddings.set(cacheKey, embeddings[idx]);
      });
    } catch (error) {
      console.warn('[Orchestrator] Batch term embedding failed:', error);
    }
  }

  /**
   * V3 FIX: Batch generate insight embeddings
   */
  private async batchGenerateInsightEmbeddings(contents: string[]): Promise<void> {
    // Filter out already cached
    const uncached = contents.filter(c => {
      const cacheKey = c.substring(0, 100);
      return !this.insightEmbeddingCache.has(cacheKey);
    });

    if (uncached.length === 0) {
      console.log(`[Orchestrator] All ${contents.length} insight embeddings already cached`);
      return;
    }

    console.log(`[Orchestrator] Generating ${uncached.length} insight embeddings in batch...`);
    try {
      const embeddings = await embeddingService.generateBatchEmbeddings(uncached);
      uncached.forEach((content, idx) => {
        const cacheKey = content.substring(0, 100);
        this.insightEmbeddingCache.set(cacheKey, embeddings[idx]);
      });
    } catch (error) {
      console.warn('[Orchestrator] Batch insight embedding failed:', error);
    }
  }

  /**
   * V3 SYNC: Industry relevance using pre-cached embeddings
   */
  private calculateIndustryRelevanceSync(insight: SynthesizedInsight, context: EnrichedContext): number {
    if (!context.industryProfile) return 50;

    const content = `${insight.title || ''}. ${insight.hook || ''}`;
    const insightEmbedding = this.insightEmbeddingCache.get(content.substring(0, 100));
    if (!insightEmbedding) return 50;

    let score = 50;

    const powerWords = context.industryProfile.power_words || [];
    if (powerWords.length > 0) {
      const powerEmbedding = this.powerWordEmbeddings.get(`power:${powerWords.join(', ').substring(0, 50)}`);
      if (powerEmbedding) {
        const similarity = embeddingService.cosineSimilarity(insightEmbedding, powerEmbedding);
        score += Math.min(25, Math.max(0, (similarity - 0.3) * 62.5));
      }
    }

    const customerLanguage = context.industryProfile.customer_language_dictionary || [];
    if (customerLanguage.length > 0) {
      const langEmbedding = this.powerWordEmbeddings.get(`language:${customerLanguage.join(', ').substring(0, 50)}`);
      if (langEmbedding) {
        const similarity = embeddingService.cosineSimilarity(insightEmbedding, langEmbedding);
        score += Math.min(15, Math.max(0, (similarity - 0.3) * 37.5));
      }
    }

    const avoidWords = context.industryProfile.avoid_words || [];
    if (avoidWords.length > 0) {
      const avoidEmbedding = this.powerWordEmbeddings.get(`avoid:${avoidWords.join(', ').substring(0, 50)}`);
      if (avoidEmbedding) {
        const similarity = embeddingService.cosineSimilarity(insightEmbedding, avoidEmbedding);
        if (similarity > 0.5) {
          score -= Math.min(30, (similarity - 0.5) * 60);
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * V3 SYNC: Segment fit using pre-cached embeddings
   */
  private calculateSegmentFitSync(insight: SynthesizedInsight, context: EnrichedContext): number {
    const content = `${insight.title || ''}. ${insight.hook || ''}`;
    const insightEmbedding = this.insightEmbeddingCache.get(content.substring(0, 100));
    if (!insightEmbedding) return 50;

    const guidelines = context.segmentGuidelines;
    let score = 50;

    const positiveTerms = [...guidelines.language, ...guidelines.focusAreas];
    if (positiveTerms.length > 0) {
      const positiveEmbedding = this.powerWordEmbeddings.get(`segment-${guidelines.tone}:${positiveTerms.join(', ').substring(0, 50)}`);
      if (positiveEmbedding) {
        const similarity = embeddingService.cosineSimilarity(insightEmbedding, positiveEmbedding);
        score += Math.min(30, Math.max(0, (similarity - 0.3) * 75));
      }
    }

    if (guidelines.avoidAreas.length > 0) {
      const avoidEmbedding = this.powerWordEmbeddings.get(`segment-avoid-${guidelines.tone}:${guidelines.avoidAreas.join(', ').substring(0, 50)}`);
      if (avoidEmbedding) {
        const similarity = embeddingService.cosineSimilarity(insightEmbedding, avoidEmbedding);
        if (similarity > 0.5) {
          score -= Math.min(25, (similarity - 0.5) * 50);
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * V3 SYNC: UVP matching using pre-cached embeddings
   */
  private matchUVPElementSync(insight: SynthesizedInsight, context: EnrichedContext): string | null {
    const content = `${insight.title || ''}. ${insight.hook || ''}`;
    const insightEmbedding = this.insightEmbeddingCache.get(content.substring(0, 100));
    if (!insightEmbedding) return null;

    const uvp = context.uvpData;
    const MATCH_THRESHOLD = 0.6;

    if (uvp.transformation) {
      const transformEmbedding = this.powerWordEmbeddings.get(`uvp-transform:${uvp.transformation.substring(0, 50)}`);
      if (transformEmbedding && embeddingService.cosineSimilarity(insightEmbedding, transformEmbedding) >= MATCH_THRESHOLD) {
        return 'transformation';
      }
    }

    if (uvp.key_benefit) {
      const benefitEmbedding = this.powerWordEmbeddings.get(`uvp-benefit:${uvp.key_benefit.substring(0, 50)}`);
      if (benefitEmbedding && embeddingService.cosineSimilarity(insightEmbedding, benefitEmbedding) >= MATCH_THRESHOLD) {
        return 'key_benefit';
      }
    }

    if (uvp.target_customer) {
      const customerEmbedding = this.powerWordEmbeddings.get(`uvp-customer:${uvp.target_customer.substring(0, 50)}`);
      if (customerEmbedding && embeddingService.cosineSimilarity(insightEmbedding, customerEmbedding) >= MATCH_THRESHOLD) {
        return 'target_customer';
      }
    }

    return null;
  }

  private calculateEQAlignment(insight: SynthesizedInsight, context: EnrichedContext): number {
    const trigger = insight.psychology?.triggerType?.toLowerCase() || '';
    const weights = context.eqWeights;

    // Map insight trigger to EQ driver
    let alignment = 50; // Base score

    if (trigger.includes('fear') || trigger.includes('risk') || trigger.includes('loss')) {
      alignment = weights.fear;
    } else if (trigger.includes('aspiration') || trigger.includes('desire') || trigger.includes('dream')) {
      alignment = weights.aspiration;
    } else if (trigger.includes('trust') || trigger.includes('credibility') || trigger.includes('proof')) {
      alignment = weights.trust;
    } else if (trigger.includes('urgent') || trigger.includes('now') || trigger.includes('immediate')) {
      alignment = weights.urgency;
    } else if (trigger.includes('logic') || trigger.includes('roi') || trigger.includes('data')) {
      alignment = weights.logic;
    } else if (trigger.includes('curiosity')) {
      // Curiosity works across all types, slight bonus
      alignment = 60;
    }

    return Math.min(100, alignment);
  }

  /**
   * V3: Get cached embedding for insight content (for ad-hoc use outside scoring)
   */
  private async getInsightEmbedding(content: string): Promise<number[]> {
    const cacheKey = content.substring(0, 100);
    const cached = this.insightEmbeddingCache.get(cacheKey);
    if (cached) return cached;

    const embedding = await embeddingService.generateEmbedding(content);
    this.insightEmbeddingCache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * V3: Get cached embedding for power words/terms
   */
  private async getTermEmbedding(term: string, category: string): Promise<number[]> {
    const cacheKey = `${category}:${term.substring(0, 50)}`;
    const cached = this.powerWordEmbeddings.get(cacheKey);
    if (cached) return cached;

    const embedding = await embeddingService.generateEmbedding(term);
    this.powerWordEmbeddings.set(cacheKey, embedding);
    return embedding;
  }

  // ==========================================================================
  // DYNAMIC RE-SYNTHESIS
  // ==========================================================================

  /**
   * Re-synthesize an insight for a different journey stage, persona, or format
   * Called when user changes filters in Content Mixer
   */
  async reSynthesizeInsight(
    request: ReSynthesisRequest,
    context: EnrichedContext
  ): Promise<OrchestratedInsight> {
    const cacheKey = `${request.insight.id}-${request.targetJourneyStage}-${request.targetPersona}-${request.targetFormat}`;

    // Check cache
    const cached = this.reSynthesisCache.get(cacheKey);
    if (cached) {
      console.log('[Orchestrator] Using cached re-synthesis');
      return cached;
    }

    console.log(`[Orchestrator] Re-synthesizing insight for ${request.targetJourneyStage} stage...`);

    const prompt = this.buildReSynthesisPrompt(request, context);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.5', // Opus 4.5 for quality (OpenRouter format)
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Re-synthesis failed: ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';

      // Parse JSON
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      }

      const reSynthesized = JSON.parse(content);

      // Build orchestrated insight
      const orchestratedInsight: OrchestratedInsight = {
        ...request.insight as SynthesizedInsight,
        id: `resynth-${Date.now()}`,
        title: reSynthesized.title,
        hook: reSynthesized.hook,
        cta: reSynthesized.cta,
        dimensions: {
          ...(request.insight as any).dimensions,
          journeyStage: request.targetJourneyStage,
          persona: request.targetPersona || (request.insight as any).dimensions?.persona,
          format: request.targetFormat || (request.insight as any).dimensions?.format
        },
        eqAlignment: 0,
        industryRelevance: 0,
        segmentFit: 0,
        uvpAlignment: null,
        recommendedPriority: 0
      };

      // Score the re-synthesized insight
      const [scored] = await this.scoreInsights([orchestratedInsight], context);

      // Cache for 10 minutes
      this.reSynthesisCache.set(cacheKey, scored);
      setTimeout(() => this.reSynthesisCache.delete(cacheKey), 10 * 60 * 1000);

      return scored;

    } catch (error) {
      console.error('[Orchestrator] Re-synthesis error:', error);
      // Return original with updated dimensions
      return {
        ...request.insight as SynthesizedInsight,
        dimensions: {
          ...(request.insight as any).dimensions,
          journeyStage: request.targetJourneyStage
        },
        eqAlignment: 50,
        industryRelevance: 50,
        segmentFit: 50,
        uvpAlignment: null,
        recommendedPriority: 50
      };
    }
  }

  private buildReSynthesisPrompt(request: ReSynthesisRequest, context: EnrichedContext): string {
    const stageGuidance = {
      awareness: {
        focus: 'problem recognition and education',
        tone: 'educational, eye-opening',
        cta: 'Learn more, Discover, See why'
      },
      consideration: {
        focus: 'solution evaluation and comparison',
        tone: 'consultative, helpful',
        cta: 'Compare options, See how, Explore'
      },
      decision: {
        focus: 'purchase confidence and urgency',
        tone: 'persuasive, confident',
        cta: 'Get started, Book now, Claim your'
      },
      retention: {
        focus: 'value reinforcement and expansion',
        tone: 'supportive, appreciative',
        cta: 'Unlock more, Upgrade, Refer a friend'
      }
    };

    const stage = stageGuidance[request.targetJourneyStage];
    const insight = request.insight as any; // Allow flexible property access

    return `Re-write this insight for a ${request.targetJourneyStage.toUpperCase()} stage customer.

ORIGINAL INSIGHT:
Title: ${insight.title || insight.displayTitle || 'Unknown'}
Hook: ${insight.hook || insight.description || ''}

TARGET CUSTOMER: ${context.uvpData.target_customer || 'Business professionals'}
KEY TRANSFORMATION: ${context.uvpData.transformation || 'Improved outcomes'}

JOURNEY STAGE REQUIREMENTS:
- Focus: ${stage.focus}
- Tone: ${stage.tone}
- CTA Style: ${stage.cta}

SEGMENT: ${context.segment}
${context.segmentGuidelines.tone}
Use language like: ${context.segmentGuidelines.language.slice(0, 3).join(', ')}

EQ PROFILE (${context.eqProfile.emotional_weight}% emotional):
- Primary driver: ${Object.entries(context.eqWeights).sort((a, b) => b[1] - a[1])[0][0]}
- Purchase mindset: ${context.eqProfile.purchase_mindset}

${context.industryProfile ? `
INDUSTRY POWER WORDS TO USE: ${context.industryProfile.power_words?.slice(0, 10).join(', ')}
` : ''}

CRITICAL: Customer is the HERO. Write for THEIR goals, not the business.

OUTPUT (JSON only):
{
  "title": "New title adapted for ${request.targetJourneyStage} stage",
  "hook": "New hook with appropriate tone",
  "cta": "Call to action matching stage"
}`;
  }

  // ==========================================================================
  // BATCH RE-SYNTHESIS FOR CONTENT MIXER
  // ==========================================================================

  /**
   * V3: Re-synthesize multiple insights in a SINGLE API call
   * Instead of 100 insights × 1 call = 100 calls, we do 1 call with all insights
   */
  async batchReSynthesize(
    insights: Array<CategorizedInsight | SynthesizedInsight>,
    targetStage: JourneyStage,
    context: EnrichedContext,
    maxConcurrent: number = 3 // Kept for backwards compat but not used
  ): Promise<OrchestratedInsight[]> {
    console.log(`[Orchestrator] V3 Batch re-synthesizing ${insights.length} insights for ${targetStage} in SINGLE call...`);

    // Check cache first - return cached ones, batch the rest
    const cached: OrchestratedInsight[] = [];
    const needsReSynthesis: Array<{ insight: CategorizedInsight | SynthesizedInsight; index: number }> = [];

    insights.forEach((insight, index) => {
      const cacheKey = `${insight.id}-${targetStage}-undefined-undefined`;
      const cachedResult = this.reSynthesisCache.get(cacheKey);
      if (cachedResult) {
        cached.push(cachedResult);
      } else {
        needsReSynthesis.push({ insight, index });
      }
    });

    if (needsReSynthesis.length === 0) {
      console.log('[Orchestrator] All insights found in cache');
      return cached.sort((a, b) => b.recommendedPriority - a.recommendedPriority);
    }

    // Build single prompt for all insights
    const stageGuidance: Record<string, { goal: string; tone: string; focus: string }> = {
      awareness: { goal: 'Introduce problem/opportunity', tone: 'Educational, curiosity-driven', focus: 'Pain points and possibilities' },
      consideration: { goal: 'Compare options', tone: 'Helpful, expert', focus: 'Solutions and differentiators' },
      decision: { goal: 'Drive action', tone: 'Confident, urgent', focus: 'Proof and specific next steps' },
      retention: { goal: 'Deepen relationship', tone: 'Appreciative, insider', focus: 'Advanced value and loyalty' }
    };

    const guidance = stageGuidance[targetStage];
    const insightsSummary = needsReSynthesis.map((item, i) =>
      `[${i + 1}] ID: ${item.insight.id}\nTitle: ${(item.insight as any).title || (item.insight as any).displayTitle}\nHook: ${(item.insight as any).hook || (item.insight as any).description || ''}`
    ).join('\n\n');

    const prompt = `Re-synthesize these ${needsReSynthesis.length} insights for the "${targetStage.toUpperCase()}" journey stage.

STAGE REQUIREMENTS:
- Goal: ${guidance.goal}
- Tone: ${guidance.tone}
- Focus: ${guidance.focus}

BRAND CONTEXT:
- Industry: ${context.industryProfile?.industry_name || 'General'}
- Target: ${context.uvpData?.target_customer || 'Business customers'}
- Key Benefit: ${context.uvpData?.key_benefit || 'Value delivery'}

INSIGHTS TO RE-SYNTHESIZE:
${insightsSummary}

For EACH insight, return a JSON object with the re-synthesized version.
Return a JSON array with ${needsReSynthesis.length} objects in the same order:
[
  { "id": "original-id", "title": "new title for ${targetStage}", "hook": "new hook for ${targetStage}", "cta": "stage-appropriate CTA" },
  ...
]

Keep the core insight but reframe for ${targetStage} stage mindset.`;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.5',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Batch re-synthesis failed: ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';

      // Parse JSON
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      }
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      const reSynthesized = JSON.parse(content);

      // Build orchestrated insights
      const results: OrchestratedInsight[] = [];

      for (let i = 0; i < needsReSynthesis.length; i++) {
        const original = needsReSynthesis[i].insight;
        const resynth = reSynthesized[i] || {};

        const orchestratedInsight: OrchestratedInsight = {
          ...original as SynthesizedInsight,
          id: `resynth-${original.id}-${targetStage}`,
          title: resynth.title || (original as any).title,
          hook: resynth.hook || (original as any).hook,
          cta: resynth.cta || '',
          dimensions: {
            ...(original as any).dimensions,
            journeyStage: targetStage
          },
          eqAlignment: 0,
          industryRelevance: 0,
          segmentFit: 0,
          uvpAlignment: null,
          recommendedPriority: 0
        };

        results.push(orchestratedInsight);

        // Cache each result
        const cacheKey = `${original.id}-${targetStage}-undefined-undefined`;
        this.reSynthesisCache.set(cacheKey, orchestratedInsight);
        setTimeout(() => this.reSynthesisCache.delete(cacheKey), 10 * 60 * 1000);
      }

      // Score all at once
      const scored = await this.scoreInsights(results, context);

      // Update cache with scored versions
      scored.forEach(s => {
        const originalId = s.id.replace(`resynth-`, '').replace(`-${targetStage}`, '');
        const cacheKey = `${originalId}-${targetStage}-undefined-undefined`;
        this.reSynthesisCache.set(cacheKey, s);
      });

      console.log(`[Orchestrator] V3 Batch complete: ${scored.length} insights re-synthesized in 1 API call`);

      return [...cached, ...scored].sort((a, b) => b.recommendedPriority - a.recommendedPriority);

    } catch (error) {
      console.error('[Orchestrator] Batch re-synthesis error:', error);
      // Fallback: return originals with updated stage
      const fallbacks: OrchestratedInsight[] = needsReSynthesis.map(item => ({
        ...item.insight as SynthesizedInsight,
        dimensions: { ...(item.insight as any).dimensions, journeyStage: targetStage },
        eqAlignment: 50,
        industryRelevance: 50,
        segmentFit: 50,
        uvpAlignment: null,
        recommendedPriority: 50
      }));
      return [...cached, ...fallbacks].sort((a, b) => b.recommendedPriority - a.recommendedPriority);
    }
  }

  // ==========================================================================
  // UVP-ALIGNED CTA GENERATION
  // ==========================================================================

  /**
   * Generate a CTA that ties back to the brand's UVP transformation
   */
  generateUVPAlignedCTA(
    insight: SynthesizedInsight,
    context: EnrichedContext
  ): string {
    const stage = insight.dimensions?.journeyStage || 'awareness';
    const uvp = context.uvpData;

    // Base CTAs by stage
    const stageCTAs: Record<string, string[]> = {
      awareness: ['Learn how', 'Discover why', 'See how'],
      consideration: ['Compare your options', 'Get your free assessment', 'See the difference'],
      decision: ['Start your transformation', 'Get started today', 'Claim your spot'],
      retention: ['Unlock more value', 'See what else is possible', 'Refer a colleague']
    };

    const baseCTA = stageCTAs[stage][Math.floor(Math.random() * stageCTAs[stage].length)];

    // Enhance with transformation if available
    if (uvp.transformation && stage === 'decision') {
      const shortTransform = uvp.transformation.split(' ').slice(0, 4).join(' ');
      return `${baseCTA} to ${shortTransform.toLowerCase()}`;
    }

    // Enhance with key benefit
    if (uvp.key_benefit && stage === 'consideration') {
      const shortBenefit = uvp.key_benefit.split(' ').slice(0, 3).join(' ');
      return `${baseCTA} for ${shortBenefit.toLowerCase()}`;
    }

    return baseCTA;
  }

  // ==========================================================================
  // FRAMEWORK APPLICATION
  // ==========================================================================

  /**
   * Get recommended framework based on EQ profile and journey stage
   */
  getRecommendedFramework(context: EnrichedContext, journeyStage: JourneyStage): FrameworkType {
    const emotionalWeight = context.eqProfile.emotional_weight;

    // High emotional industries
    if (emotionalWeight > 70) {
      if (journeyStage === 'awareness') return 'hook-story-offer';
      if (journeyStage === 'consideration') return 'before-after-bridge';
      if (journeyStage === 'decision') return 'problem-agitate-solution';
      return 'hook-story-offer';
    }

    // Balanced industries
    if (emotionalWeight > 40) {
      if (journeyStage === 'awareness') return 'aida';
      if (journeyStage === 'consideration') return 'before-after-bridge';
      if (journeyStage === 'decision') return 'problem-agitate-solution';
      return 'aida';
    }

    // Rational industries
    if (journeyStage === 'awareness') return 'blog-how-to';
    if (journeyStage === 'consideration') return 'blog-comparison';
    if (journeyStage === 'decision') return 'aida';
    return 'blog-how-to';
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  clearContextCache(): void {
    this.contextCache.clear();
    console.log('[Orchestrator] Context cache cleared');
  }

  clearReSynthesisCache(): void {
    this.reSynthesisCache.clear();
    console.log('[Orchestrator] Re-synthesis cache cleared');
  }

  clearAllCaches(): void {
    this.clearContextCache();
    this.clearReSynthesisCache();
    // V3: Also clear embedding caches
    this.powerWordEmbeddings.clear();
    this.insightEmbeddingCache.clear();
    console.log('[Orchestrator] All caches cleared including embedding caches');
  }

  // ==========================================================================
  // V3: DYNAMIC FORMAT GENERATION
  // ==========================================================================

  /**
   * V3: Generate content for a specific platform and intent
   * Instead of static templates, AI adapts the insight for the target platform
   */
  async generateDynamicFormat(
    insight: SynthesizedInsight | OrchestratedInsight,
    platform: 'linkedin' | 'twitter' | 'email' | 'blog' | 'ad' | 'landing-page',
    intent: 'spark-discussion' | 'drive-action' | 'educate' | 'build-trust' | 'create-urgency' | 'challenge-assumptions',
    context: EnrichedContext
  ): Promise<{
    formatted: string;
    headline: string;
    cta: string;
    metadata: { platform: string; intent: string; wordCount: number; tone: string };
  }> {
    console.log(`[Orchestrator] Generating dynamic format for ${platform} with intent: ${intent}`);

    const platformSpecs: Record<string, { maxLength: number; style: string; features: string[] }> = {
      'linkedin': { maxLength: 3000, style: 'professional, thought-leadership', features: ['hashtags', 'question-hook', 'line-breaks'] },
      'twitter': { maxLength: 280, style: 'punchy, conversational', features: ['thread-potential', 'engagement-hook'] },
      'email': { maxLength: 500, style: 'personal, direct', features: ['subject-line', 'preview-text', 'single-cta'] },
      'blog': { maxLength: 2000, style: 'informative, SEO-optimized', features: ['h2-headers', 'bullet-points', 'internal-links'] },
      'ad': { maxLength: 150, style: 'benefit-focused, urgent', features: ['headline', 'description', 'cta-button'] },
      'landing-page': { maxLength: 800, style: 'conversion-focused, scannable', features: ['hero-headline', 'bullets', 'social-proof'] }
    };

    const intentGuidance: Record<string, { approach: string; emotion: string }> = {
      'spark-discussion': { approach: 'Ask provocative questions, share contrarian views', emotion: 'curiosity, mild controversy' },
      'drive-action': { approach: 'Clear next step, urgency, remove friction', emotion: 'motivated, confident' },
      'educate': { approach: 'Explain simply, use examples, build understanding', emotion: 'enlightened, empowered' },
      'build-trust': { approach: 'Show proof, share vulnerabilities, be transparent', emotion: 'reassured, connected' },
      'create-urgency': { approach: 'Time-sensitive framing, scarcity, consequences of inaction', emotion: 'FOMO, decisive' },
      'challenge-assumptions': { approach: 'Flip conventional wisdom, surprise with data', emotion: 'intrigued, reconsidering' }
    };

    const spec = platformSpecs[platform];
    const guidance = intentGuidance[intent];

    const prompt = `Transform this insight for ${platform.toUpperCase()} with the intent to ${intent.replace('-', ' ')}.

INSIGHT:
Title: ${insight.title}
Hook: ${insight.hook || (insight as any).description || ''}
Core Message: ${(insight as any).cta || insight.title}

PLATFORM REQUIREMENTS:
- Max length: ${spec.maxLength} characters
- Style: ${spec.style}
- Features to include: ${spec.features.join(', ')}

INTENT REQUIREMENTS:
- Approach: ${guidance.approach}
- Target emotion: ${guidance.emotion}

BRAND CONTEXT:
- Industry: ${context.industryProfile?.industry_name || 'General'}
- Target: ${context.uvpData?.target_customer || 'Business professionals'}
- Tone: ${context.segmentGuidelines.tone}

Return JSON:
{
  "formatted": "The full ${platform} content ready to post/send",
  "headline": "Attention-grabbing headline or subject line",
  "cta": "Specific call-to-action for this platform",
  "tone": "primary tone used (e.g., 'authoritative', 'conversational', 'urgent')"
}`;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.5',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Dynamic format generation failed: ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';

      // Parse JSON
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      }
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      const result = JSON.parse(content);

      return {
        formatted: result.formatted || '',
        headline: result.headline || insight.title,
        cta: result.cta || '',
        metadata: {
          platform,
          intent,
          wordCount: (result.formatted || '').split(/\s+/).length,
          tone: result.tone || 'professional'
        }
      };

    } catch (error) {
      console.error('[Orchestrator] Dynamic format generation error:', error);
      // Fallback: return basic formatting
      return {
        formatted: `${insight.title}\n\n${insight.hook || (insight as any).description || ''}`,
        headline: insight.title,
        cta: (insight as any).cta || 'Learn more',
        metadata: { platform, intent, wordCount: 0, tone: 'default' }
      };
    }
  }

  /**
   * V3: Batch generate multiple formats for an insight
   */
  async generateMultipleFormats(
    insight: SynthesizedInsight | OrchestratedInsight,
    platforms: Array<'linkedin' | 'twitter' | 'email' | 'blog' | 'ad' | 'landing-page'>,
    intent: 'spark-discussion' | 'drive-action' | 'educate' | 'build-trust' | 'create-urgency' | 'challenge-assumptions',
    context: EnrichedContext
  ): Promise<Map<string, { formatted: string; headline: string; cta: string; metadata: any }>> {
    console.log(`[Orchestrator] Generating ${platforms.length} formats for insight: ${insight.id}`);

    const results = new Map();
    const formatPromises = platforms.map(async (platform) => {
      const format = await this.generateDynamicFormat(insight, platform, intent, context);
      results.set(platform, format);
    });

    await Promise.all(formatPromises);
    return results;
  }

  /**
   * V3: Invalidate all caches for a specific brand
   * Called when UVP is updated to ensure fresh context
   */
  invalidateBrandCaches(brandName: string): void {
    console.log(`[Orchestrator] Invalidating caches for brand: ${brandName}`);
    // Clear context cache entries containing brand name
    for (const key of this.contextCache.keys()) {
      if (key.includes(brandName)) {
        this.contextCache.delete(key);
      }
    }
    // Clear all re-synthesis cache (can't filter by brand easily)
    this.reSynthesisCache.clear();
    // Clear embedding caches (will be regenerated)
    this.powerWordEmbeddings.clear();
    this.insightEmbeddingCache.clear();
    console.log(`[Orchestrator] Brand caches invalidated for: ${brandName}`);
  }
}

// Export singleton instance
export const contentSynthesisOrchestrator = new ContentSynthesisOrchestrator();
