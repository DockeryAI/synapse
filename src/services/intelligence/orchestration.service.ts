/**
 * Intelligence Orchestration Service
 *
 * Coordinates the full intelligence stack:
 * Phase 1: Data Collection (existing APIs)
 * Phase 2: Embedding & Clustering
 * Phase 3: Connection Discovery
 * Phase 4: NAICS Enhancement
 * Phase 5: Content Synthesis
 */

import type { DataPoint } from '@/types/connections.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { InsightCard, InsightType } from '@/components/dashboard/intelligence-v2/types';
import { embeddingService } from './embedding.service';
import { clusteringService, type InsightCluster } from './clustering.service';
import { connectionDiscoveryService, type Connection, type BreakthroughAngle } from './connection-discovery.service';
import { naicsDatabase, type IndustryProfile } from './naics-database.service';
import { contentSynthesis, type SynthesizedContent } from './content-synthesis.service';
import { jtbdTransformer } from './jtbd-transformer.service';
import { smartPicksService, type SmartPick } from './smart-picks.service';
import { breakthroughGenerator, type Breakthrough } from './breakthrough-generator.service';
import { contentMultiplierService } from './content-multiplier.service';

export interface OrchestrationResult {
  // Phase 2 outputs
  embeddedDataPoints: DataPoint[];
  clusters: InsightCluster[];

  // Phase 3 outputs
  connections: {
    twoWay: Connection[];
    threeWay: Connection[];
    fourWay: Connection[];
    fiveWay: Connection[];
  };
  breakthroughs: BreakthroughAngle[];

  // Phase 3b outputs - Real breakthroughs
  realBreakthroughs: Breakthrough[];

  // Phase 4 outputs
  industryProfile: IndustryProfile;

  // Phase 5 outputs
  synthesizedContent: SynthesizedContent[];
  smartPicks: {
    campaigns: SmartPick[];
    content: SmartPick[];
  };

  // Metadata
  stats: {
    totalDataPoints: number;
    embeddedCount: number;
    clusterCount: number;
    connectionCount: number;
    breakthroughCount: number;
    realBreakthroughCount: number;
    synthesizedCount: number;
    processingTimeMs: number;
  };
}

class OrchestrationService {
  /**
   * Run full orchestration pipeline
   */
  async orchestrate(
    dataPoints: DataPoint[],
    deepContext: DeepContext
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    console.log(`[Orchestration] Starting full intelligence pipeline with ${dataPoints.length} data points`);

    // Phase 2: Embedding & Clustering
    console.log('[Orchestration] Phase 2: Generating embeddings...');
    const embeddedDataPoints = await embeddingService.embedDataPoints(dataPoints);

    console.log('[Orchestration] Phase 2: Running clustering...');
    let clusters = clusteringService.kMeansClustering(
      embeddedDataPoints,
      Math.min(8, Math.max(3, Math.floor(dataPoints.length / 10)))
    );

    // Enhance cluster themes with AI
    console.log('[Orchestration] Phase 2b: Enhancing cluster themes with AI...');
    clusters = await clusteringService.enhanceClusterThemes(clusters);

    // Phase 3: Connection Discovery
    console.log('[Orchestration] Phase 3: Discovering connections...');
    const { twoWay, threeWay, fourWay, fiveWay, breakthroughs } = await connectionDiscoveryService.discoverConnections(
      embeddedDataPoints,
      clusters
    );

    // Phase 3b: Generate Real Breakthroughs
    console.log('[Orchestration] Phase 3b: Generating breakthroughs from clusters and connections...');
    const allConnections = [...twoWay, ...threeWay, ...fourWay, ...fiveWay];
    const realBreakthroughs = breakthroughGenerator.generateBreakthroughs(clusters, allConnections);
    console.log(`[Orchestration] Phase 3b: ✅ Generated ${realBreakthroughs.length} real breakthroughs`);

    // Phase 3c: Multiply top breakthroughs into content angles and platform variants
    console.log('[Orchestration] Phase 3c: Multiplying top breakthroughs into content ecosystem...');
    const topBreakthroughsForMultiplication = realBreakthroughs.slice(0, 7); // Top 7 for weekly calendar
    const multipliedContent = contentMultiplierService.multiplyBreakthroughs(
      topBreakthroughsForMultiplication,
      deepContext
    );
    console.log(`[Orchestration] Phase 3c: ✅ Generated ${multipliedContent.length} multiplied content packages`);
    const totalContentPieces = multipliedContent.reduce((sum, mc) =>
      sum + Object.keys(mc.platformVariants).length * 5, 0
    );
    console.log(`[Orchestration] Phase 3c: ✅ Total content pieces: ${totalContentPieces}`);

    // Add to deep context
    deepContext.multipliedContent = multipliedContent;

    // Phase 4: NAICS Enhancement
    console.log('[Orchestration] Phase 4: Loading industry profile...');
    const industryProfile = await naicsDatabase.matchIndustry(
      deepContext.business.profile.industry
    );

    // Phase 5: Content Synthesis
    console.log('[Orchestration] Phase 5: Synthesizing breakthrough content...');
    const synthesizedContent: SynthesizedContent[] = [];

    // Convert top breakthroughs to synthesized content
    const topBreakthroughs = breakthroughs.slice(0, 10);

    for (const breakthrough of topBreakthroughs) {
      try {
        // Convert breakthrough to insight cards
        const insightCards = this.breakthroughToInsightCards(breakthrough, clusters);

        // Synthesize content from insight cards
        const content = await contentSynthesis.synthesizeContent(insightCards, deepContext);

        // Apply JTBD transformation to make title outcome-focused
        if (content.title) {
          const jtbdResult = await jtbdTransformer.transformValuePropositions(
            [content.title],
            {
              businessName: deepContext.business.profile.name,
              industry: deepContext.business.profile.industry,
              targetAudience: ['business owners']
            }
          );

          if (jtbdResult.primary && jtbdResult.primary.outcomeStatement) {
            content.title = jtbdResult.primary.outcomeStatement;
          }
        }

        synthesizedContent.push(content);
      } catch (error) {
        console.warn(`[Orchestration] Failed to synthesize content for breakthrough: ${breakthrough.title}`, error);
      }
    }

    console.log(`[Orchestration] Phase 5: ✅ Synthesized ${synthesizedContent.length} content pieces`);

    // Phase 6: Generate Smart Picks from Real Breakthroughs
    console.log('[Orchestration] Phase 6: Generating smart picks from real breakthroughs...');
    const smartPicks = realBreakthroughs.length > 0
      ? smartPicksService.generateSmartPicksFromBreakthroughs(realBreakthroughs, industryProfile)
      : smartPicksService.generateSmartPicks(breakthroughs, clusters, industryProfile); // Fallback
    console.log(`[Orchestration] Phase 6: ✅ Generated ${smartPicks.campaigns.length} campaign picks, ${smartPicks.content.length} content picks`);

    // Update DeepContext with orchestration results
    this.updateDeepContext(deepContext, {
      clusters,
      connections: { twoWay, threeWay, fourWay, fiveWay },
      breakthroughs,
      industryProfile
    });

    const processingTimeMs = Date.now() - startTime;

    const stats = {
      totalDataPoints: dataPoints.length,
      embeddedCount: embeddedDataPoints.filter(dp => dp.embedding).length,
      clusterCount: clusters.length,
      connectionCount: twoWay.length + threeWay.length + fourWay.length + fiveWay.length,
      breakthroughCount: breakthroughs.length,
      realBreakthroughCount: realBreakthroughs.length,
      synthesizedCount: synthesizedContent.length,
      processingTimeMs
    };

    console.log('[Orchestration] ✅ Pipeline complete');
    console.log(`  - Embeddings: ${stats.embeddedCount}/${stats.totalDataPoints}`);
    console.log(`  - Clusters: ${stats.clusterCount}`);
    console.log(`  - Connections: ${stats.connectionCount} (${threeWay.length} 3-way, ${fourWay.length} 4-way)`);
    console.log(`  - Breakthroughs: ${stats.breakthroughCount}`);
    console.log(`  - Real Breakthroughs: ${stats.realBreakthroughCount}`);
    console.log(`  - Synthesized: ${stats.synthesizedCount}`);
    console.log(`  - Smart Picks: ${smartPicks.campaigns.length} campaigns, ${smartPicks.content.length} content`);
    console.log(`  - Time: ${stats.processingTimeMs}ms`);

    return {
      embeddedDataPoints,
      clusters,
      connections: { twoWay, threeWay, fourWay, fiveWay },
      breakthroughs,
      realBreakthroughs,
      industryProfile,
      synthesizedContent,
      smartPicks,
      stats
    };
  }

  /**
   * Convert BreakthroughAngle to InsightCard[] for content synthesis
   */
  private breakthroughToInsightCards(
    breakthrough: BreakthroughAngle,
    clusters: InsightCluster[]
  ): InsightCard[] {
    // Determine insight type based on data point sources
    const getInsightType = (source: string): InsightType => {
      const sourceMap: Record<string, InsightType> = {
        'youtube': 'customer',
        'outscraper': 'customer',
        'serper': 'opportunity',
        'weather': 'local',
        'news': 'local',
        'perplexity': 'opportunity',
        'semrush': 'competition',
        'reddit': 'customer',
        'linkedin': 'competition'
      };
      return sourceMap[source.toLowerCase()] || 'opportunity';
    };

    // Get all data points from breakthrough connections
    const allDataPoints: DataPoint[] = [];
    for (const connection of breakthrough.connections) {
      allDataPoints.push(...connection.dataPoints);
    }

    // Create insight cards from breakthrough data points
    const insightCards: InsightCard[] = allDataPoints.map((dp, idx) => ({
      id: `breakthrough-${breakthrough.score}-${idx}`,
      type: getInsightType(dp.source),
      title: breakthrough.title,
      category: dp.source,
      confidence: breakthrough.score / 100,
      isTimeSensitive: dp.type === 'timing' || dp.type === 'local_event',
      description: dp.content,
      evidence: [dp.content],
      actionableInsight: breakthrough.hook,
      sources: [{
        source: dp.source,
        quote: dp.content.substring(0, 150),
        confidence: dp.metadata?.confidence || 0.8
      }]
    }));

    return insightCards;
  }

  /**
   * Update DeepContext with orchestration results
   */
  private updateDeepContext(
    deepContext: DeepContext,
    results: {
      clusters: InsightCluster[];
      connections: { twoWay: Connection[]; threeWay: Connection[]; fourWay: Connection[]; fiveWay: Connection[] };
      breakthroughs: BreakthroughAngle[];
      industryProfile: IndustryProfile;
    }
  ): void {
    // Add cluster insights to synthesis
    deepContext.synthesis.hiddenPatterns = [
      ...(deepContext.synthesis.hiddenPatterns || []),
      ...results.clusters.slice(0, 5).map(cluster => ({
        pattern: cluster.theme,
        type: 'correlation' as const,
        significance: cluster.coherence,
        confidence: cluster.coherence,
        evidence: cluster.dataPoints.slice(0, 3).map(dp => dp.content),
        implication: `${cluster.size} data points from ${cluster.sources.join(', ')} validate this pattern`
      }))
    ];

    // Add breakthrough angles to synthesis
    deepContext.synthesis.keyInsights = [
      ...(deepContext.synthesis.keyInsights || []),
      ...results.breakthroughs.slice(0, 5).map(b =>
        `[Score: ${b.score}] ${b.title}: ${b.hook}`
      )
    ];

    // Update opportunity score based on breakthroughs
    const avgBreakthroughScore = results.breakthroughs.length > 0
      ? results.breakthroughs.reduce((sum, b) => sum + b.score, 0) / results.breakthroughs.length
      : 0;

    deepContext.synthesis.opportunityScore = Math.round(
      (deepContext.synthesis.opportunityScore || 0) * 0.5 +
      avgBreakthroughScore * 0.5
    );

    // Add competitive blind spots from 4-way connections
    const newBlindSpots = results.connections.fourWay
      .filter(conn => conn.breakthroughScore > 80)
      .map(conn => ({
        topic: conn.angle,
        reasoning: conn.reasoning,
        evidence: conn.dataPoints.map(dp => dp.content),
        actionableInsight: `${conn.connectionType} connection across ${conn.sources.join(', ')}`,
        opportunityScore: conn.breakthroughScore
      }));

    deepContext.competitiveIntel.blindSpots = [
      ...(deepContext.competitiveIntel.blindSpots || []),
      ...newBlindSpots
    ];

    // Add industry triggers to customer psychology
    deepContext.customerPsychology.emotional = [
      ...(deepContext.customerPsychology.emotional || []),
      ...results.industryProfile.triggers.fear.slice(0, 3).map(trigger => ({
        trigger,
        strength: 0.8,
        context: 'Industry fear trigger',
        leverage: results.industryProfile.languagePatterns.emotional[0]
      })),
      ...results.industryProfile.triggers.desire.slice(0, 3).map(trigger => ({
        trigger,
        strength: 0.7,
        context: 'Industry desire trigger',
        leverage: results.industryProfile.languagePatterns.emotional[0]
      }))
    ];

    // Add power words to behavioral patterns
    deepContext.customerPsychology.behavioral = [
      ...(deepContext.customerPsychology.behavioral || []),
      ...results.industryProfile.powerWords.map(word => ({
        behavior: `Responds to "${word}"`,
        frequency: 'common' as const,
        insight: 'Industry power word that resonates with customers',
        contentAlignment: `Use "${word}" in marketing content`
      }))
    ];

    console.log('[Orchestration] DeepContext updated with orchestration results');
  }

  /**
   * Quick orchestration without embeddings (faster, less accurate)
   */
  async quickOrchestrate(
    dataPoints: DataPoint[],
    deepContext: DeepContext
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    console.log(`[Orchestration] Quick mode with ${dataPoints.length} data points`);

    // Skip embedding, use text similarity
    const clusters = clusteringService.dbscanClustering(dataPoints, 0.4, 2);

    // Simple connection discovery without embeddings
    const { twoWay, threeWay, fourWay, fiveWay, breakthroughs } = await connectionDiscoveryService.discoverConnections(
      dataPoints,
      clusters
    );

    const industryProfile = await naicsDatabase.matchIndustry(
      deepContext.business.profile.industry
    );

    this.updateDeepContext(deepContext, {
      clusters,
      connections: { twoWay, threeWay, fourWay, fiveWay },
      breakthroughs,
      industryProfile
    });

    const processingTimeMs = Date.now() - startTime;

    return {
      embeddedDataPoints: dataPoints,
      clusters,
      connections: { twoWay, threeWay, fourWay, fiveWay },
      breakthroughs,
      industryProfile,
      synthesizedContent: [], // Quick mode skips synthesis
      stats: {
        totalDataPoints: dataPoints.length,
        embeddedCount: 0,
        clusterCount: clusters.length,
        connectionCount: twoWay.length + threeWay.length + fourWay.length + fiveWay.length,
        breakthroughCount: breakthroughs.length,
        synthesizedCount: 0,
        processingTimeMs
      }
    };
  }
}

export const orchestrationService = new OrchestrationService();
