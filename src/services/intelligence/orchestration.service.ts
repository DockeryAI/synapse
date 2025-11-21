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
import { embeddingService } from './embedding.service';
import { clusteringService, type InsightCluster } from './clustering.service';
import { connectionDiscoveryService, type Connection, type BreakthroughAngle } from './connection-discovery.service';
import { naicsDatabase, type IndustryProfile } from './naics-database.service';
import { contentSynthesis } from './content-synthesis.service';

export interface OrchestrationResult {
  // Phase 2 outputs
  embeddedDataPoints: DataPoint[];
  clusters: InsightCluster[];

  // Phase 3 outputs
  connections: {
    twoWay: Connection[];
    threeWay: Connection[];
    fourWay: Connection[];
  };
  breakthroughs: BreakthroughAngle[];

  // Phase 4 outputs
  industryProfile: IndustryProfile;

  // Metadata
  stats: {
    totalDataPoints: number;
    embeddedCount: number;
    clusterCount: number;
    connectionCount: number;
    breakthroughCount: number;
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
    const { twoWay, threeWay, fourWay, breakthroughs } = await connectionDiscoveryService.discoverConnections(
      embeddedDataPoints,
      clusters
    );

    // Phase 4: NAICS Enhancement
    console.log('[Orchestration] Phase 4: Loading industry profile...');
    const industryProfile = await naicsDatabase.matchIndustry(
      deepContext.business.profile.industry
    );

    // Update DeepContext with orchestration results
    this.updateDeepContext(deepContext, {
      clusters,
      connections: { twoWay, threeWay, fourWay },
      breakthroughs,
      industryProfile
    });

    const processingTimeMs = Date.now() - startTime;

    const stats = {
      totalDataPoints: dataPoints.length,
      embeddedCount: embeddedDataPoints.filter(dp => dp.embedding).length,
      clusterCount: clusters.length,
      connectionCount: twoWay.length + threeWay.length + fourWay.length,
      breakthroughCount: breakthroughs.length,
      processingTimeMs
    };

    console.log('[Orchestration] ✅ Pipeline complete');
    console.log(`  - Embeddings: ${stats.embeddedCount}/${stats.totalDataPoints}`);
    console.log(`  - Clusters: ${stats.clusterCount}`);
    console.log(`  - Connections: ${stats.connectionCount} (${threeWay.length} 3-way, ${fourWay.length} 4-way)`);
    console.log(`  - Breakthroughs: ${stats.breakthroughCount}`);
    console.log(`  - Time: ${stats.processingTimeMs}ms`);

    return {
      embeddedDataPoints,
      clusters,
      connections: { twoWay, threeWay, fourWay },
      breakthroughs,
      industryProfile,
      stats
    };
  }

  /**
   * Update DeepContext with orchestration results
   */
  private updateDeepContext(
    deepContext: DeepContext,
    results: {
      clusters: InsightCluster[];
      connections: { twoWay: Connection[]; threeWay: Connection[]; fourWay: Connection[] };
      breakthroughs: BreakthroughAngle[];
      industryProfile: IndustryProfile;
    }
  ): void {
    // Add cluster insights to synthesis
    deepContext.synthesis.hiddenPatterns = [
      ...(deepContext.synthesis.hiddenPatterns || []),
      ...results.clusters.slice(0, 5).map(cluster => ({
        pattern: cluster.theme,
        type: 'behavioral' as const,
        confidence: cluster.coherence,
        examples: cluster.dataPoints.slice(0, 3).map(dp => dp.content),
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
        intensity: 0.8,
        context: 'Industry fear trigger',
        leverage: results.industryProfile.languagePatterns.emotional[0]
      })),
      ...results.industryProfile.triggers.desire.slice(0, 3).map(trigger => ({
        trigger,
        intensity: 0.7,
        context: 'Industry desire trigger',
        leverage: results.industryProfile.languagePatterns.emotional[0]
      }))
    ];

    // Add power words to language
    deepContext.customerPsychology.language = [
      ...(deepContext.customerPsychology.language || []),
      ...results.industryProfile.powerWords.map(word => ({
        phrase: word,
        frequency: 0.8,
        context: 'Industry power word',
        alternates: []
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
    const { twoWay, threeWay, fourWay, breakthroughs } = await connectionDiscoveryService.discoverConnections(
      dataPoints,
      clusters
    );

    const industryProfile = naicsDatabase.matchIndustry(
      deepContext.business.profile.industry
    );

    this.updateDeepContext(deepContext, {
      clusters,
      connections: { twoWay, threeWay, fourWay },
      breakthroughs,
      industryProfile
    });

    const processingTimeMs = Date.now() - startTime;

    return {
      embeddedDataPoints: dataPoints,
      clusters,
      connections: { twoWay, threeWay, fourWay },
      breakthroughs,
      industryProfile,
      stats: {
        totalDataPoints: dataPoints.length,
        embeddedCount: 0,
        clusterCount: clusters.length,
        connectionCount: twoWay.length + threeWay.length + fourWay.length,
        breakthroughCount: breakthroughs.length,
        processingTimeMs
      }
    };
  }
}

export const orchestrationService = new OrchestrationService();
