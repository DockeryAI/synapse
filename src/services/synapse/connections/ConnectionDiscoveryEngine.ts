/**
 * Connection Discovery Engine
 *
 * THE BREAKTHROUGH SECRET: Uses OpenAI embeddings to find non-obvious
 * connections between data from different sources that competitors can't replicate.
 *
 * This is the orchestrator that:
 * 1. Extracts all data points from DeepContext
 * 2. Generates embeddings (with aggressive caching)
 * 3. Finds two-way connections
 * 4. Finds three-way "holy shit" connections
 * 5. Scores breakthrough potential
 * 6. Returns top 20 connections
 *
 * Example output:
 * "Reddit users complain about finding roofers after storms" +
 * "emergency roof repair" has low competition +
 * "Severe storms forecast this weekend" =
 * BREAKTHROUGH: "How to jump the roofer waiting list" content NOW
 *
 * Created: 2025-11-10
 */

import {
  DataPoint,
  DataSource,
  DataPointType,
  Connection,
  ConnectionDiscoveryResult,
  ConnectionDiscoveryOptions,
  DEFAULT_DISCOVERY_OPTIONS
} from '../../../types/connections.types';

import { DeepContext } from '../../../types/deepContext.types';
import { NormalizedCulturalData } from '../../../types/culturalIntelligence.types';

import { EmbeddingService } from './EmbeddingService';
import { SimilarityCalculator } from './SimilarityCalculator';
import { TwoWayConnectionFinder } from './TwoWayConnectionFinder';
import { ThreeWayConnectionFinder } from './ThreeWayConnectionFinder';
import { ConnectionScorer } from './ConnectionScorer';

export class ConnectionDiscoveryEngine {
  private embeddingService: EmbeddingService;
  private similarityCalculator: SimilarityCalculator;
  private twoWayFinder: TwoWayConnectionFinder;
  private threeWayFinder: ThreeWayConnectionFinder;
  private scorer: ConnectionScorer;

  constructor(openaiApiKey?: string) {
    this.embeddingService = new EmbeddingService(openaiApiKey);
    this.similarityCalculator = new SimilarityCalculator();
    this.twoWayFinder = new TwoWayConnectionFinder();
    this.threeWayFinder = new ThreeWayConnectionFinder();
    this.scorer = new ConnectionScorer();
  }

  /**
   * Main method: Find all connections in a DeepContext
   */
  async findConnections(
    context: DeepContext,
    options: Partial<ConnectionDiscoveryOptions> = {}
  ): Promise<ConnectionDiscoveryResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_DISCOVERY_OPTIONS, ...options };

    console.log('[ConnectionDiscoveryEngine] Starting connection discovery...');

    // 1. Extract all data points from context
    const dataPoints = this.extractDataPoints(context);
    console.log(`[ConnectionDiscoveryEngine] Extracted ${dataPoints.length} data points`);

    if (dataPoints.length === 0) {
      return this.emptyResult(startTime);
    }

    // 2. Generate embeddings for all data points
    const embeddingsBefore = this.embeddingService.getCacheStats();
    await this.embeddingService.embedDataPoints(dataPoints);
    const embeddingsAfter = this.embeddingService.getCacheStats();

    const embeddingsGenerated = dataPoints.filter(dp => dp.embedding).length - embeddingsBefore.size;

    console.log(`[ConnectionDiscoveryEngine] Generated ${embeddingsGenerated} embeddings (${embeddingsAfter.size - embeddingsBefore.size} cached)`);

    // 3. Find two-way connections
    const twoWayCandidates = this.twoWayFinder.findConnections(dataPoints, opts);
    console.log(`[ConnectionDiscoveryEngine] Found ${twoWayCandidates.length} two-way candidates`);

    // 4. Find three-way connections (holy shit territory)
    const threeWayCandidates = this.threeWayFinder.findConnections(
      dataPoints,
      twoWayCandidates,
      opts
    );
    console.log(`[ConnectionDiscoveryEngine] Found ${threeWayCandidates.length} three-way candidates`);

    // 5. Convert candidates to connections (without scores yet)
    const twoWayConnections = twoWayCandidates.map((candidate, i) =>
      this.twoWayFinder.toConnection(candidate, `conn-2way-${i}`)
    );

    const threeWayConnections = threeWayCandidates.map((candidate, i) =>
      this.threeWayFinder.toConnection(candidate, `conn-3way-${i}`)
    );

    const allConnections = [...twoWayConnections, ...threeWayConnections];

    console.log(`[ConnectionDiscoveryEngine] Total connections: ${allConnections.length}`);

    // 6. Score all connections
    const scoredConnections = this.scorer.scoreConnections(allConnections, context);

    // 7. Filter by minimum breakthrough score
    const filteredConnections = scoredConnections.filter(
      conn => conn.breakthroughPotential.score >= opts.minBreakthroughScore!
    );

    console.log(
      `[ConnectionDiscoveryEngine] ${filteredConnections.length} connections above breakthrough threshold (${opts.minBreakthroughScore})`
    );

    // 8. Sort by breakthrough score
    const rankedConnections = filteredConnections.sort(
      (a, b) => b.breakthroughPotential.score - a.breakthroughPotential.score
    );

    // 9. Take top N connections
    const topConnections = rankedConnections.slice(0, opts.maxConnections);

    // 10. Identify breakthroughs (score >= 80 or "holy shit" impact)
    const breakthroughs = topConnections.filter(
      conn =>
        conn.breakthroughPotential.score >= 80 ||
        conn.breakthroughPotential.expectedImpact === 'holy shit'
    );

    // 11. Calculate statistics
    const stats = this.calculateStats(
      dataPoints,
      twoWayConnections,
      threeWayConnections,
      topConnections
    );

    // 12. Build metadata
    const processingTimeMs = Date.now() - startTime;
    const estimatedCost = this.embeddingService.getTotalCost();

    const result: ConnectionDiscoveryResult = {
      connections: topConnections,
      breakthroughs,
      stats,
      metadata: {
        discoveredAt: new Date(),
        processingTimeMs,
        embeddingsCached: embeddingsAfter.size - embeddingsGenerated,
        embeddingsGenerated,
        estimatedCost
      }
    };

    console.log(`[ConnectionDiscoveryEngine] Complete. Found ${breakthroughs.length} breakthroughs in ${processingTimeMs}ms`);
    console.log(`[ConnectionDiscoveryEngine] Estimated cost: $${estimatedCost.toFixed(4)}`);

    return result;
  }

  /**
   * Extract all data points from DeepContext
   */
  private extractDataPoints(context: DeepContext): DataPoint[] {
    const dataPoints: DataPoint[] = [];
    let idCounter = 0;

    const generateId = () => `dp-${Date.now()}-${idCounter++}`;

    // Extract from cultural intelligence
    if (context.realTimeCultural) {
      const cultural = context.realTimeCultural;

      // Pain points from cultural data
      if (cultural.painPoints) {
        cultural.painPoints.forEach(pp => {
          dataPoints.push({
            id: generateId(),
            source: this.mapSourceToCultural(pp.sources),
            type: 'pain_point',
            content: pp.painPoint,
            metadata: {
              domain: 'psychology',
              sentiment: pp.severity === 'critical' ? 'negative' : 'neutral',
              volume: pp.frequency,
              relevance: pp.impactScore / 100
            },
            createdAt: new Date()
          });
        });
      }

      // Opportunities from cultural data
      if (cultural.opportunities) {
        cultural.opportunities.forEach(opp => {
          dataPoints.push({
            id: generateId(),
            source: this.mapSourceToCultural(opp.platforms || []),
            type: opp.type === 'trending_topic' ? 'trending_topic' : 'unarticulated_need',
            content: opp.title,
            metadata: {
              domain: opp.type === 'pain_point_gap' ? 'psychology' : 'timing',
              timing: opp.urgency === 'immediate' ? 'immediate' : opp.urgency === 'high' ? 'soon' : 'seasonal',
              relevance: opp.confidence
            },
            createdAt: new Date()
          });
        });
      }

      // Trending topics
      if (cultural.trendingTopics) {
        cultural.trendingTopics.slice(0, 10).forEach(topic => {
          dataPoints.push({
            id: generateId(),
            source: this.mapSourceToCultural(topic.sources),
            type: 'trending_topic',
            content: topic.topic,
            metadata: {
              domain: 'timing',
              volume: topic.volume,
              relevance: topic.relevance,
              timing: topic.velocity === 'explosive' ? 'immediate' : 'soon'
            },
            createdAt: new Date()
          });
        });
      }
    }

    // Extract from competitive intelligence
    if (context.competitiveIntel) {
      const competitive = context.competitiveIntel;

      // Competitor blind spots
      if (competitive.blindSpots) {
        competitive.blindSpots.slice(0, 10).forEach(bs => {
          dataPoints.push({
            id: generateId(),
            source: 'serper',
            type: 'competitor_weakness',
            content: bs.topic,
            metadata: {
              domain: 'competitive',
              relevance: bs.customerInterest,
              volume: bs.frequency
            },
            createdAt: new Date()
          });
        });
      }

      // Content gaps
      if (competitive.contentGaps) {
        competitive.contentGaps.slice(0, 10).forEach(gap => {
          dataPoints.push({
            id: generateId(),
            source: 'semrush',
            type: 'keyword_gap',
            content: gap.topic,
            metadata: {
              domain: 'content_gap',
              competition: gap.competitorCoverage === 'none' ? 'low' : gap.competitorCoverage === 'some' ? 'medium' : 'high',
              volume: gap.searchVolume
            },
            createdAt: new Date()
          });
        });
      }
    }

    // Extract from customer psychology
    if (context.customerPsychology) {
      const psychology = context.customerPsychology;

      // Unarticulated needs
      if (psychology.unarticulated) {
        psychology.unarticulated.slice(0, 10).forEach(need => {
          dataPoints.push({
            id: generateId(),
            source: 'reddit',
            type: 'unarticulated_need',
            content: need.need,
            metadata: {
              domain: 'psychology',
              relevance: need.confidence
            },
            createdAt: new Date()
          });
        });
      }

      // Hidden objections
      if (psychology.hiddenObjections) {
        psychology.hiddenObjections.slice(0, 5).forEach(obj => {
          dataPoints.push({
            id: generateId(),
            source: 'outscraper',
            type: 'pain_point',
            content: obj.objection,
            metadata: {
              domain: 'psychology',
              sentiment: 'negative',
              certainty: obj.confidence
            },
            createdAt: new Date()
          });
        });
      }
    }

    // Extract from business context (search data)
    if (context.business?.searchData) {
      const search = context.business.searchData;

      // People Also Ask questions
      if (search.peopleAlsoAsk) {
        search.peopleAlsoAsk.slice(0, 10).forEach(q => {
          dataPoints.push({
            id: generateId(),
            source: 'serper',
            type: 'people_also_ask',
            content: q.question,
            metadata: {
              domain: 'search_intent'
            },
            createdAt: new Date()
          });
        });
      }
    }

    // Extract from industry context
    if (context.industry?.emergingTrends) {
      context.industry.emergingTrends.slice(0, 5).forEach(trend => {
        dataPoints.push({
          id: generateId(),
          source: 'google_trends',
          type: 'trending_topic',
          content: trend,
          metadata: {
            domain: 'timing',
            timing: 'soon'
          },
          createdAt: new Date()
        });
      });
    }

    return dataPoints;
  }

  /**
   * Map cultural sources to DataSource type
   */
  private mapSourceToCultural(sources: string | string[]): DataSource {
    const sourceArray = Array.isArray(sources) ? sources : [sources];

    // Priority: Reddit > TikTok > News > Trends
    if (sourceArray.includes('reddit')) return 'reddit';
    if (sourceArray.includes('tiktok')) return 'tiktok';
    if (sourceArray.includes('news')) return 'news';
    if (sourceArray.includes('trends') || sourceArray.includes('google_trends')) return 'google_trends';

    return 'reddit'; // Default fallback
  }

  /**
   * Calculate statistics for the result
   */
  private calculateStats(
    dataPoints: DataPoint[],
    twoWayConnections: Array<Omit<Connection, 'breakthroughPotential'>>,
    threeWayConnections: Array<Omit<Connection, 'breakthroughPotential'>>,
    topConnections: Connection[]
  ) {
    const totalSimilarity = topConnections.reduce(
      (sum, conn) => sum + conn.relationship.semanticSimilarity,
      0
    );

    const totalBreakthroughScore = topConnections.reduce(
      (sum, conn) => sum + conn.breakthroughPotential.score,
      0
    );

    const holyShitCount = topConnections.filter(
      conn => conn.breakthroughPotential.expectedImpact === 'holy shit'
    ).length;

    return {
      totalDataPoints: dataPoints.length,
      twoWayConnections: twoWayConnections.length,
      threeWayConnections: threeWayConnections.length,
      averageSimilarity: topConnections.length > 0 ? totalSimilarity / topConnections.length : 0,
      averageBreakthroughScore: topConnections.length > 0 ? totalBreakthroughScore / topConnections.length : 0,
      holyShitCount
    };
  }

  /**
   * Return empty result
   */
  private emptyResult(startTime: number): ConnectionDiscoveryResult {
    return {
      connections: [],
      breakthroughs: [],
      stats: {
        totalDataPoints: 0,
        twoWayConnections: 0,
        threeWayConnections: 0,
        averageSimilarity: 0,
        averageBreakthroughScore: 0,
        holyShitCount: 0
      },
      metadata: {
        discoveredAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        embeddingsCached: 0,
        embeddingsGenerated: 0,
        estimatedCost: 0
      }
    };
  }

  /**
   * Get embedding cache statistics
   */
  getCacheStats() {
    return this.embeddingService.getCacheStats();
  }

  /**
   * Get total cost
   */
  getTotalCost() {
    return this.embeddingService.getTotalCost();
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.embeddingService.clearCache();
  }

  /**
   * Export embedding cache for persistence
   */
  exportCache(): string {
    return this.embeddingService.exportCache();
  }

  /**
   * Import embedding cache
   */
  importCache(json: string) {
    this.embeddingService.importCache(json);
  }
}
