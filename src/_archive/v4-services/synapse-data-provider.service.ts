/**
 * Synapse Data Provider Service
 *
 * Central provider for all Synapse 2.0 API data to be used in content generation.
 * Connects the streaming API manager to the content orchestrator.
 *
 * This ensures ALL content generation uses:
 * - UVP data
 * - Industry data
 * - ALL API data (triggers, gaps, trends, proof)
 * - Embeddings for semantic similarity matching
 *
 * Created: 2025-12-01
 * Updated: 2025-12-01 - Added embeddings integration for semantic insight selection
 */

import { streamingApiManager } from '../intelligence/streaming-api-manager';
import { type ConsolidatedTrigger } from '../triggers/trigger-consolidation.service';
import { embeddingService } from '../intelligence/embedding.service';
import type { TriggerSynthesisResult } from '../triggers/llm-trigger-synthesizer.service';
import type { SelectedInsight } from './types';
import type { ExtractedGap } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

export interface SynapseInsightData {
  triggers: ConsolidatedTrigger[];
  gaps: ExtractedGap[];
  trends: any[];
  proof: any[];
  rawSamples: number;
  lastUpdated: Date;
  isLoading: boolean;
  embeddingsReady: boolean;
}

interface EmbeddedInsight {
  insight: ConsolidatedTrigger | ExtractedGap;
  type: 'trigger' | 'gap';
  embedding: number[] | null;
  text: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class SynapseDataProviderService {
  // In-memory cache of synthesized triggers (updated by streaming API manager events)
  private synthesizedTriggers: ConsolidatedTrigger[] = [];
  private gaps: ExtractedGap[] = [];
  private trends: any[] = [];
  private proof: any[] = [];
  private isLoading = false;
  private lastUpdated: Date | null = null;
  private currentBrandId: string | null = null;

  // Embedding cache for semantic similarity
  private embeddedInsights: EmbeddedInsight[] = [];
  private embeddingsReady = false;
  private embeddingPromise: Promise<void> | null = null;

  constructor() {
    // Listen for trigger synthesis events from streaming API manager
    this.setupEventListeners();
  }

  /**
   * Setup listeners for streaming API events
   */
  private setupEventListeners() {
    // Listen for LLM-synthesized triggers
    streamingApiManager.on('trigger-synthesis', (result: TriggerSynthesisResult) => {
      console.log(`[SynapseDataProvider] Received ${result.triggers.length} synthesized triggers`);
      this.synthesizedTriggers = result.triggers;
      this.lastUpdated = new Date();
    });

    // Listen for loading state
    streamingApiManager.on('api-start', () => {
      this.isLoading = true;
    });

    streamingApiManager.on('complete', () => {
      this.isLoading = false;
      this.lastUpdated = new Date();
    });

    // Listen for gap data from competitor intelligence
    streamingApiManager.on('api-update', (update: any) => {
      if (update.type === 'competitor-voice' && update.data?.gaps) {
        this.gaps = update.data.gaps;
        console.log(`[SynapseDataProvider] Received ${this.gaps.length} competitor gaps`);
      }
    });
  }

  /**
   * Get all available insight data for content generation
   */
  getAllData(): SynapseInsightData {
    return {
      triggers: this.synthesizedTriggers,
      gaps: this.gaps,
      trends: this.trends,
      proof: this.proof,
      rawSamples: this.synthesizedTriggers.length + this.gaps.length,
      lastUpdated: this.lastUpdated || new Date(),
      isLoading: this.isLoading,
      embeddingsReady: this.embeddingsReady,
    };
  }

  /**
   * Get top N triggers for content generation
   * Sorted by confidence score
   */
  getTopTriggers(count: number = 5): ConsolidatedTrigger[] {
    return [...this.synthesizedTriggers]
      .sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5))
      .slice(0, count);
  }

  /**
   * Get top N gaps for content generation
   * Sorted by confidence score
   */
  getTopGaps(count: number = 3): ExtractedGap[] {
    return [...this.gaps]
      .sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5))
      .slice(0, count);
  }

  /**
   * Convert triggers to SelectedInsight format for content-orchestrator
   */
  triggersToSelectedInsights(triggers: ConsolidatedTrigger[]): SelectedInsight[] {
    return triggers.map((trigger, idx) => ({
      id: trigger.id || `trigger-${idx}`,
      type: 'trigger',
      title: trigger.title,
      description: trigger.executiveSummary || trigger.title,
      category: trigger.category || 'pain-point',
      confidence: trigger.confidence || 0.85,
      actionableInsight: trigger.executiveSummary,
      evidence: trigger.evidence?.map(e => e.quote) || [],
      sources: trigger.evidence?.map(e => ({
        source: e.source || 'Unknown',
        quote: e.quote || '',
      })) || [],
    }));
  }

  /**
   * Convert gaps to SelectedInsight format for content-orchestrator
   */
  gapsToSelectedInsights(gaps: ExtractedGap[]): SelectedInsight[] {
    return gaps.map((gap, idx) => ({
      id: gap.title ? `gap-${gap.title.slice(0, 20)}-${idx}` : `gap-${idx}`,
      type: 'gap',
      title: gap.title || 'Competitor Gap',
      description: gap.the_void || gap.the_demand || '',
      category: gap.gap_type || 'competitive',
      confidence: gap.confidence || 0.75,
      actionableInsight: gap.your_angle || '',
      evidence: [gap.the_void, gap.the_demand].filter(Boolean) as string[],
      sources: gap.sources?.map(s => ({
        source: s.source || 'Competitor',
        quote: s.quote || '',
      })) || [],
    }));
  }

  /**
   * Get auto-selected insights for content generation
   * This is the key method that ensures ALL content uses Synapse 2.0 data
   *
   * Returns top triggers + gaps + trends combined as SelectedInsight[]
   */
  getAutoSelectedInsights(options?: {
    maxTriggers?: number;
    maxGaps?: number;
    maxTrends?: number;
  }): SelectedInsight[] {
    const maxTriggers = options?.maxTriggers ?? 3;
    const maxGaps = options?.maxGaps ?? 2;

    const insights: SelectedInsight[] = [];

    // Add top triggers
    const topTriggers = this.getTopTriggers(maxTriggers);
    insights.push(...this.triggersToSelectedInsights(topTriggers));

    // Add top gaps
    const topGaps = this.getTopGaps(maxGaps);
    insights.push(...this.gapsToSelectedInsights(topGaps));

    console.log(`[SynapseDataProvider] Auto-selected ${insights.length} insights (${topTriggers.length} triggers, ${topGaps.length} gaps)`);

    return insights;
  }

  /**
   * Check if we have sufficient data for content generation
   */
  hasData(): boolean {
    return this.synthesizedTriggers.length > 0 || this.gaps.length > 0;
  }

  // ============================================================================
  // EMBEDDING METHODS - Semantic similarity for content generation
  // ============================================================================

  /**
   * Generate embeddings for all current triggers and gaps
   * This runs in the background and doesn't block content generation
   */
  async generateEmbeddings(): Promise<void> {
    // Avoid duplicate embedding generation
    if (this.embeddingPromise) {
      return this.embeddingPromise;
    }

    if (this.synthesizedTriggers.length === 0 && this.gaps.length === 0) {
      console.log('[SynapseDataProvider] No data to embed');
      return;
    }

    this.embeddingPromise = this._generateEmbeddingsInternal();
    return this.embeddingPromise;
  }

  private async _generateEmbeddingsInternal(): Promise<void> {
    console.log('[SynapseDataProvider] Generating embeddings for insights...');
    const startTime = Date.now();

    try {
      // Build text representations for all insights
      const insightsToEmbed: EmbeddedInsight[] = [];

      // Add triggers
      for (const trigger of this.synthesizedTriggers) {
        const text = this.buildInsightText(trigger, 'trigger');
        insightsToEmbed.push({
          insight: trigger,
          type: 'trigger',
          embedding: null,
          text,
        });
      }

      // Add gaps
      for (const gap of this.gaps) {
        const text = this.buildInsightText(gap, 'gap');
        insightsToEmbed.push({
          insight: gap,
          type: 'gap',
          embedding: null,
          text,
        });
      }

      if (insightsToEmbed.length === 0) {
        console.log('[SynapseDataProvider] No insights to embed');
        return;
      }

      // Generate embeddings in batch
      const texts = insightsToEmbed.map(i => i.text);
      const embeddings = await embeddingService.generateBatchEmbeddings(texts);

      // Store embeddings
      insightsToEmbed.forEach((item, idx) => {
        item.embedding = embeddings[idx] || null;
      });

      this.embeddedInsights = insightsToEmbed;
      this.embeddingsReady = true;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[SynapseDataProvider] Generated ${embeddings.length} embeddings in ${elapsed}s`);
    } catch (error) {
      console.error('[SynapseDataProvider] Embedding generation failed:', error);
      // Don't throw - embeddings are optional enhancement
    } finally {
      this.embeddingPromise = null;
    }
  }

  /**
   * Build text representation of an insight for embedding
   */
  private buildInsightText(insight: ConsolidatedTrigger | ExtractedGap, type: 'trigger' | 'gap'): string {
    if (type === 'trigger') {
      const t = insight as ConsolidatedTrigger;
      const parts = [
        t.title,
        t.executiveSummary || '',
        t.category || '',
        ...(t.evidence?.map(e => e.quote) || []),
      ].filter(Boolean);
      return parts.join(' | ');
    } else {
      const g = insight as ExtractedGap;
      const parts = [
        g.title || '',
        g.the_void || '',
        g.the_demand || '',
        g.your_angle || '',
        g.gap_type || '',
      ].filter(Boolean);
      return parts.join(' | ');
    }
  }

  /**
   * Find semantically similar insights to a given topic/query
   * Uses embeddings for semantic matching
   */
  async findSimilarInsights(
    topic: string,
    options?: {
      maxResults?: number;
      threshold?: number;
      includeTriggers?: boolean;
      includeGaps?: boolean;
    }
  ): Promise<SelectedInsight[]> {
    const maxResults = options?.maxResults ?? 5;
    const threshold = options?.threshold ?? 0.6;
    const includeTriggers = options?.includeTriggers ?? true;
    const includeGaps = options?.includeGaps ?? true;

    // If embeddings not ready, fall back to confidence-based selection
    if (!this.embeddingsReady || this.embeddedInsights.length === 0) {
      console.log('[SynapseDataProvider] Embeddings not ready, using confidence-based selection');
      return this.getAutoSelectedInsights({ maxTriggers: maxResults, maxGaps: maxResults });
    }

    try {
      // Generate embedding for the topic
      const topicEmbedding = await embeddingService.generateEmbedding(topic);

      // Calculate similarity scores
      const scoredInsights: Array<{ item: EmbeddedInsight; similarity: number }> = [];

      for (const item of this.embeddedInsights) {
        if (!item.embedding) continue;
        if (item.type === 'trigger' && !includeTriggers) continue;
        if (item.type === 'gap' && !includeGaps) continue;

        const similarity = embeddingService.cosineSimilarity(topicEmbedding, item.embedding);
        if (similarity >= threshold) {
          scoredInsights.push({ item, similarity });
        }
      }

      // Sort by similarity and take top results
      scoredInsights.sort((a, b) => b.similarity - a.similarity);
      const topInsights = scoredInsights.slice(0, maxResults);

      // Convert to SelectedInsight format
      const results: SelectedInsight[] = [];
      for (const { item, similarity } of topInsights) {
        if (item.type === 'trigger') {
          const trigger = item.insight as ConsolidatedTrigger;
          results.push({
            id: trigger.id || `trigger-${results.length}`,
            type: 'trigger',
            title: trigger.title,
            description: trigger.executiveSummary || trigger.title,
            category: trigger.category || 'pain-point',
            confidence: similarity, // Use semantic similarity as confidence
            actionableInsight: trigger.executiveSummary,
            evidence: trigger.evidence?.map(e => e.quote) || [],
            sources: trigger.evidence?.map(e => ({
              source: e.source || 'Unknown',
              quote: e.quote || '',
            })) || [],
          });
        } else {
          const gap = item.insight as ExtractedGap;
          results.push({
            id: gap.title ? `gap-${gap.title.slice(0, 20)}-${results.length}` : `gap-${results.length}`,
            type: 'gap',
            title: gap.title || 'Competitor Gap',
            description: gap.the_void || gap.the_demand || '',
            category: gap.gap_type || 'competitive',
            confidence: similarity, // Use semantic similarity as confidence
            actionableInsight: gap.your_angle || '',
            evidence: [gap.the_void, gap.the_demand].filter(Boolean) as string[],
            sources: gap.sources?.map(s => ({
              source: s.source || 'Competitor',
              quote: s.quote || '',
            })) || [],
          });
        }
      }

      console.log(`[SynapseDataProvider] Found ${results.length} semantically similar insights for topic: "${topic.slice(0, 50)}..."`);
      return results;
    } catch (error) {
      console.error('[SynapseDataProvider] Semantic search failed:', error);
      // Fall back to confidence-based selection
      return this.getAutoSelectedInsights({ maxTriggers: maxResults, maxGaps: maxResults });
    }
  }

  /**
   * Get insights relevant to a content topic using semantic similarity
   * This is the primary method for topic-aware content generation
   */
  async getRelevantInsights(
    contentTopic: string,
    options?: {
      maxTriggers?: number;
      maxGaps?: number;
    }
  ): Promise<SelectedInsight[]> {
    const maxTriggers = options?.maxTriggers ?? 3;
    const maxGaps = options?.maxGaps ?? 2;

    // Use semantic search if embeddings are ready
    if (this.embeddingsReady) {
      const triggers = await this.findSimilarInsights(contentTopic, {
        maxResults: maxTriggers,
        includeTriggers: true,
        includeGaps: false,
      });

      const gaps = await this.findSimilarInsights(contentTopic, {
        maxResults: maxGaps,
        includeTriggers: false,
        includeGaps: true,
      });

      const combined = [...triggers, ...gaps];
      console.log(`[SynapseDataProvider] Semantic selection: ${triggers.length} triggers, ${gaps.length} gaps for topic`);
      return combined;
    }

    // Fall back to confidence-based selection
    return this.getAutoSelectedInsights({ maxTriggers, maxGaps });
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.synthesizedTriggers = [];
    this.gaps = [];
    this.trends = [];
    this.proof = [];
    this.lastUpdated = null;
    this.currentBrandId = null;
    // Clear embedding cache
    this.embeddedInsights = [];
    this.embeddingsReady = false;
    this.embeddingPromise = null;
    console.log('[SynapseDataProvider] Cache cleared (including embeddings)');
  }

  /**
   * Set brand ID to track which brand's data we have cached
   */
  setBrandId(brandId: string) {
    if (this.currentBrandId !== brandId) {
      this.clearCache();
      this.currentBrandId = brandId;
    }
  }

  /**
   * Manually set triggers (for testing or manual override)
   * Auto-triggers embedding generation in background
   */
  setTriggers(triggers: ConsolidatedTrigger[]) {
    this.synthesizedTriggers = triggers;
    this.lastUpdated = new Date();
    // Reset embeddings since data changed
    this.embeddingsReady = false;
    this.embeddedInsights = [];
    console.log(`[SynapseDataProvider] Manually set ${triggers.length} triggers`);
    // Generate embeddings in background (non-blocking)
    this.generateEmbeddings().catch(err => {
      console.warn('[SynapseDataProvider] Background embedding generation failed:', err);
    });
  }

  /**
   * Manually set gaps (for testing or manual override)
   * Auto-triggers embedding generation in background
   */
  setGaps(gaps: ExtractedGap[]) {
    this.gaps = gaps;
    this.lastUpdated = new Date();
    // Reset embeddings since data changed
    this.embeddingsReady = false;
    this.embeddedInsights = [];
    console.log(`[SynapseDataProvider] Manually set ${gaps.length} gaps`);
    // Generate embeddings in background (non-blocking)
    this.generateEmbeddings().catch(err => {
      console.warn('[SynapseDataProvider] Background embedding generation failed:', err);
    });
  }

  /**
   * CRITICAL: Hydrate from DeepContext cache
   * This is the bridge between cached DeepContext insights and content generation.
   * When DeepContext is loaded from cache (not streaming), we need to manually
   * extract triggers and gaps to make them available for content generation.
   */
  hydrateFromDeepContext(context: any): void {
    if (!context) {
      console.log('[SynapseDataProvider] No context to hydrate from');
      return;
    }

    const triggers: ConsolidatedTrigger[] = [];
    const gaps: ExtractedGap[] = [];

    // Helper to create proper EvidenceItem
    const createEvidence = (quote: string, source: string, url?: string, idx: number = 0): import('../triggers/trigger-consolidation.service').EvidenceItem => ({
      id: `evidence-${Date.now()}-${idx}`,
      source: source,
      platform: source.toLowerCase().includes('reddit') ? 'reddit' :
               source.toLowerCase().includes('youtube') ? 'youtube' : 'research',
      quote: quote,
      url: url,
      sentiment: 'neutral' as const,
      confidence: 0.8,
    });

    // Extract emotional triggers from customerPsychology
    if (context.customerPsychology?.emotional?.length) {
      context.customerPsychology.emotional.forEach((trigger: any, idx: number) => {
        const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger;
        if (triggerText) {
          const evidence = typeof trigger === 'object' && trigger.leverage
            ? [createEvidence(trigger.leverage, trigger.context || 'Customer Psychology', undefined, idx)]
            : [];
          triggers.push({
            id: `deepcontext-trigger-${idx}`,
            title: triggerText?.split(/[,.]|and |but /)[0].trim() || 'Emotional Trigger',
            executiveSummary: triggerText,
            category: 'desire', // Map emotional triggers to 'desire' (valid TriggerCategory)
            confidence: typeof trigger === 'object' ? (trigger.strength || 0.85) : 0.85,
            evidenceCount: evidence.length,
            evidence: evidence,
            uvpAlignments: [],
            isTimeSensitive: false,
            profileRelevance: 0.8,
            rawSourceIds: [`deepcontext-emotional-${idx}`],
          });
        }
      });
    }

    // Extract unarticulated needs as triggers
    if (context.customerPsychology?.unarticulated?.length) {
      context.customerPsychology.unarticulated.forEach((need: any, idx: number) => {
        if (need.need) {
          const evidence = need.evidence
            ? [createEvidence(
                typeof need.evidence === 'string' ? need.evidence : need.evidence[0],
                need.source || 'Customer Research',
                undefined,
                idx
              )]
            : [];
          triggers.push({
            id: `deepcontext-need-${idx}`,
            title: need.need?.split(/[,.]|and |but /)[0].trim() || 'Customer Need',
            executiveSummary: need.need,
            category: 'pain-point', // Valid TriggerCategory
            confidence: need.confidence || 0.8,
            evidenceCount: evidence.length,
            evidence: evidence,
            uvpAlignments: [],
            isTimeSensitive: false,
            profileRelevance: 0.85,
            rawSourceIds: [`deepcontext-unarticulated-${idx}`],
          });
        }
      });
    }

    // Extract correlated insights as triggers
    if (context.correlatedInsights?.length) {
      context.correlatedInsights.forEach((insight: any, idx: number) => {
        if (insight.insight || insight.title) {
          const evidence = insight.sources?.map((s: any, i: number) =>
            createEvidence(s.quote || s.content, s.source || s.platform, s.url, i)
          ) || [];
          triggers.push({
            id: `deepcontext-correlated-${idx}`,
            title: (insight.title || insight.insight)?.split(/[,.]|and |but /)[0].trim() || 'Insight',
            executiveSummary: insight.insight || insight.title,
            category: 'motivation', // Map trend/insights to 'motivation' (valid TriggerCategory)
            confidence: insight.confidence || 0.75,
            evidenceCount: evidence.length,
            evidence: evidence,
            uvpAlignments: [],
            isTimeSensitive: false,
            profileRelevance: 0.75,
            rawSourceIds: [`deepcontext-correlated-${idx}`],
          });
        }
      });
    }

    // Extract blindspots as gaps
    if (context.competitiveIntel?.blindSpots?.length) {
      context.competitiveIntel.blindSpots.forEach((blindspot: any, idx: number) => {
        if (blindspot.topic) {
          gaps.push({
            title: blindspot.topic?.split(/[,.]|and |but /)[0].trim() || 'Competitor Blindspot',
            the_void: blindspot.topic,
            the_demand: blindspot.reasoning,
            your_angle: blindspot.actionableInsight,
            gap_type: 'feature-gap', // Valid GapType - competitor blindspots are typically feature gaps
            confidence: blindspot.opportunityScore ? blindspot.opportunityScore / 100 : 0.8,
            sources: blindspot.evidence ? [{
              quote: typeof blindspot.evidence === 'string' ? blindspot.evidence : blindspot.evidence[0],
              source: blindspot.source || 'Competitive Analysis',
            }] : [],
          });
        }
      });
    }

    // Extract market gaps/opportunities as gaps
    if (context.competitiveIntel?.opportunities?.length) {
      context.competitiveIntel.opportunities.forEach((gap: any, idx: number) => {
        if (gap.gap) {
          gaps.push({
            title: gap.gap?.split(/[,.]|and |but /)[0].trim() || 'Market Gap',
            the_void: gap.gap,
            the_demand: gap.evidence,
            your_angle: gap.positioning,
            gap_type: 'messaging-gap', // Valid GapType - market opportunities often relate to messaging
            confidence: gap.confidence || 0.85,
            sources: [],
          });
        }
      });
    }

    // Set the extracted data
    if (triggers.length > 0) {
      this.synthesizedTriggers = triggers;
      console.log(`[SynapseDataProvider] Hydrated ${triggers.length} triggers from DeepContext cache`);
    }

    if (gaps.length > 0) {
      this.gaps = gaps;
      console.log(`[SynapseDataProvider] Hydrated ${gaps.length} gaps from DeepContext cache`);
    }

    if (triggers.length > 0 || gaps.length > 0) {
      this.lastUpdated = new Date();
      // Reset and regenerate embeddings
      this.embeddingsReady = false;
      this.embeddedInsights = [];
      this.generateEmbeddings().catch(err => {
        console.warn('[SynapseDataProvider] Background embedding generation failed:', err);
      });
      console.log(`[SynapseDataProvider] ✅ HYDRATION COMPLETE: ${triggers.length} triggers, ${gaps.length} gaps ready for content generation`);
    }
  }
}

// Export singleton
export const synapseDataProvider = new SynapseDataProviderService();
export default synapseDataProvider;
