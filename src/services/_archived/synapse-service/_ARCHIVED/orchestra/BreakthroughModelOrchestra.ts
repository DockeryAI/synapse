/**
 * Breakthrough Model Orchestra
 *
 * Orchestrates 4 AI models with different thinking styles to discover
 * breakthrough insights through parallel generation, validation, merging,
 * and ranking.
 *
 * THE MULTI-MODEL SECRET SAUCE:
 * - Different models see different patterns
 * - When models converge = high confidence
 * - Diverse perspectives = breakthrough insights
 *
 * Created: 2025-11-10
 */

import {
  BreakthroughInsight,
  RankedInsight,
  OrchestrationOptions,
  OrchestrationResult,
  DEFAULT_ORCHESTRATION_OPTIONS,
  ThinkingStyle,
  BREAKTHROUGH_MODELS
} from '../../../types/breakthrough.types';
import { DeepContext } from '../../../types/deepContext.types';
import { Connection, ConnectionDiscoveryResult } from '../../../types/connections.types';

import { createModelForThinkingStyle } from '../models';
import { BreakthroughPromptLibrary } from './BreakthroughPromptLibrary';
import { BreakthroughValidator } from './BreakthroughValidator';
import { InsightMerger } from './InsightMerger';
import { BreakthroughRanker } from './BreakthroughRanker';

export class BreakthroughModelOrchestra {
  private promptLibrary: BreakthroughPromptLibrary;
  private validator: BreakthroughValidator;
  private merger: InsightMerger;
  private ranker: BreakthroughRanker;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.promptLibrary = new BreakthroughPromptLibrary();
    this.validator = new BreakthroughValidator();
    this.merger = new InsightMerger();
    this.ranker = new BreakthroughRanker();

    if (!this.apiKey) {
      console.warn('[BreakthroughModelOrchestra] No API key provided');
    }
  }

  /**
   * Main orchestration method
   * Runs 4 models in parallel, validates, merges, and ranks insights
   */
  async orchestrateBreakthroughDiscovery(
    context: DeepContext,
    connections?: ConnectionDiscoveryResult,
    options?: Partial<OrchestrationOptions>
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_ORCHESTRATION_OPTIONS, ...options };

    console.log('🎭 [Orchestra] Starting multi-model breakthrough discovery...');
    console.log(`🎭 [Orchestra] Using ${opts.models?.length || 4} thinking styles`);

    // Extract connection seeds if available
    const seeds = this.extractConnectionSeeds(connections, opts);

    // Run all models in parallel
    const discoveries = await Promise.allSettled([
      opts.models?.includes('lateral') ? this.lateralThinking(context, seeds) : Promise.resolve([]),
      opts.models?.includes('analytical') ? this.deepAnalysis(context, seeds) : Promise.resolve([]),
      opts.models?.includes('creative') ? this.creativeApproach(context, seeds) : Promise.resolve([]),
      opts.models?.includes('cultural') ? this.culturalConnection(context, seeds) : Promise.resolve([])
    ]);

    // Extract successful results
    const allBreakthroughs = discoveries
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<BreakthroughInsight[]>).value);

    console.log(`🎭 [Orchestra] Generated ${allBreakthroughs.length} initial insights`);

    // Validate if enabled
    let validated: BreakthroughInsight[] = allBreakthroughs;
    let validationResults = undefined;

    if (opts.enableValidation) {
      console.log('🎭 [Orchestra] Validating insights...');
      validationResults = await this.validator.validateAll(allBreakthroughs, context);
      validated = this.validator.filterValid(validationResults);
      console.log(`🎭 [Orchestra] ${validated.length} insights passed validation`);
    }

    // Merge if enabled
    let merged: BreakthroughInsight[] = validated;
    if (opts.enableMerging) {
      console.log('🎭 [Orchestra] Merging similar insights...');
      merged = this.merger.mergeSimilarInsights(validated);
      console.log(`🎭 [Orchestra] Merged into ${merged.length} unique insights`);
    }

    // Filter by confidence
    const filtered = merged.filter(i => i.confidence >= opts.minConfidence!);
    console.log(`🎭 [Orchestra] ${filtered.length} insights above confidence threshold`);

    // Rank by breakthrough potential
    console.log('🎭 [Orchestra] Ranking insights...');
    const ranked = this.ranker.rankByBreakthroughPotential(filtered, context);

    // Take top N
    const topInsights = ranked.slice(0, opts.maxInsights);

    // Calculate statistics
    const stats = this.calculateStats(allBreakthroughs, validated, merged, ranked);

    // Build metadata
    const processingTimeMs = Date.now() - startTime;
    const metadata = {
      orchestratedAt: new Date(),
      processingTimeMs,
      modelsUsed: opts.models || [],
      totalTokensUsed: undefined,
      estimatedCost: undefined
    };

    console.log(`🎭 [Orchestra] Complete! ${topInsights.length} breakthrough insights discovered in ${processingTimeMs}ms`);

    return {
      insights: topInsights,
      validationResults,
      stats,
      metadata
    };
  }

  /**
   * LATERAL THINKING: Unexpected connections
   */
  private async lateralThinking(
    context: DeepContext,
    seeds?: Connection[]
  ): Promise<BreakthroughInsight[]> {
    console.log('💡 [Lateral] Generating unexpected connections...');

    try {
      const model = createModelForThinkingStyle('lateral', this.apiKey);
      const config = BREAKTHROUGH_MODELS.lateral;

      const prompt = this.promptLibrary.getLateralThinkingPrompt(context, seeds);
      const response = await model.generate(prompt, config);

      const insights = this.promptLibrary.parseInsights(
        response.text,
        'lateral',
        'unexpected_connection',
        config.model
      );

      console.log(`💡 [Lateral] Generated ${insights.length} insights`);
      return insights;
    } catch (error) {
      console.error('💡 [Lateral] Failed:', error);
      return [];
    }
  }

  /**
   * ANALYTICAL THINKING: Counter-intuitive insights
   */
  private async deepAnalysis(
    context: DeepContext,
    seeds?: Connection[]
  ): Promise<BreakthroughInsight[]> {
    console.log('📊 [Analytical] Finding counter-intuitive patterns...');

    try {
      const model = createModelForThinkingStyle('analytical', this.apiKey);
      const config = BREAKTHROUGH_MODELS.analytical;

      const prompt = this.promptLibrary.getCounterIntuitivePrompt(context, seeds);
      const response = await model.generate(prompt, config);

      const insights = this.promptLibrary.parseInsights(
        response.text,
        'analytical',
        'counter_intuitive',
        config.model
      );

      console.log(`📊 [Analytical] Generated ${insights.length} insights`);
      return insights;
    } catch (error) {
      console.error('📊 [Analytical] Failed:', error);
      return [];
    }
  }

  /**
   * CREATIVE THINKING: Predictive opportunities
   */
  private async creativeApproach(
    context: DeepContext,
    seeds?: Connection[]
  ): Promise<BreakthroughInsight[]> {
    console.log('🎨 [Creative] Predicting emerging opportunities...');

    try {
      const model = createModelForThinkingStyle('creative', this.apiKey);
      const config = BREAKTHROUGH_MODELS.creative;

      const prompt = this.promptLibrary.getPredictivePrompt(context, seeds);
      const response = await model.generate(prompt, config);

      const insights = this.promptLibrary.parseInsights(
        response.text,
        'creative',
        'predictive_opportunity',
        config.model
      );

      console.log(`🎨 [Creative] Generated ${insights.length} insights`);
      return insights;
    } catch (error) {
      console.error('🎨 [Creative] Failed:', error);
      return [];
    }
  }

  /**
   * CULTURAL THINKING: Cultural moment connections
   */
  private async culturalConnection(
    context: DeepContext,
    seeds?: Connection[]
  ): Promise<BreakthroughInsight[]> {
    console.log('🌍 [Cultural] Finding cultural connections...');

    try {
      const model = createModelForThinkingStyle('cultural', this.apiKey);
      const config = BREAKTHROUGH_MODELS.cultural;

      const prompt = this.promptLibrary.getCulturalMomentPrompt(context, seeds);
      const response = await model.generate(prompt, config);

      const insights = this.promptLibrary.parseInsights(
        response.text,
        'cultural',
        'cultural_moment',
        config.model
      );

      console.log(`🌍 [Cultural] Generated ${insights.length} insights`);
      return insights;
    } catch (error) {
      console.error('🌍 [Cultural] Failed:', error);
      return [];
    }
  }

  /**
   * Extract connection seeds from Connection Discovery Engine results
   */
  private extractConnectionSeeds(
    connections?: ConnectionDiscoveryResult,
    opts?: Partial<OrchestrationOptions>
  ): Connection[] | undefined {
    if (!opts?.useConnectionSeeds || !connections) {
      return undefined;
    }

    // Use top breakthroughs as seeds
    const seeds = connections.breakthroughs.slice(0, opts.maxConnectionSeeds || 5);

    console.log(`🎭 [Orchestra] Using ${seeds.length} connection seeds`);

    return seeds;
  }

  /**
   * Calculate statistics
   */
  private calculateStats(
    allBreakthroughs: BreakthroughInsight[],
    validated: BreakthroughInsight[],
    merged: BreakthroughInsight[],
    ranked: RankedInsight[]
  ) {
    // By thinking style
    const byThinkingStyle: Record<ThinkingStyle, number> = {
      lateral: 0,
      analytical: 0,
      creative: 0,
      cultural: 0
    };

    for (const insight of ranked) {
      byThinkingStyle[insight.thinkingStyle]++;
    }

    // By insight type
    const byInsightType: Record<string, number> = {};
    for (const insight of ranked) {
      byInsightType[insight.type] = (byInsightType[insight.type] || 0) + 1;
    }

    // Average confidence
    const totalConfidence = ranked.reduce((sum, i) => sum + i.confidence, 0);
    const averageConfidence = ranked.length > 0 ? totalConfidence / ranked.length : 0;

    return {
      totalGenerated: allBreakthroughs.length,
      validated: validated.length,
      merged: merged.length,
      rejected: allBreakthroughs.length - validated.length,
      averageConfidence,
      byThinkingStyle,
      byInsightType: byInsightType as any
    };
  }

  /**
   * Get validator for direct access
   */
  getValidator(): BreakthroughValidator {
    return this.validator;
  }

  /**
   * Get ranker for direct access
   */
  getRanker(): BreakthroughRanker {
    return this.ranker;
  }

  /**
   * Get merger for direct access
   */
  getMerger(): InsightMerger {
    return this.merger;
  }
}
