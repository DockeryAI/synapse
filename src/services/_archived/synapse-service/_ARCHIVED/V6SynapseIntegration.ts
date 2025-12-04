/**
 * V6 Breakthrough Integration Service
 *
 * Orchestrates the complete breakthrough content discovery pipeline:
 *
 * Layer 1: Connection Discovery Engine (Embeddings)
 *   └─> Finds semantic connections across data sources
 *
 * Layer 2: Multi-Model Orchestra (4 AI Models)
 *   └─> Generates breakthrough insights using connections as seeds
 *
 * Layer 3: Holy Shit Scoring (5-Dimensional Algorithm)
 *   └─> Scores and filters for breakthrough-level insights
 *
 * This is the integration layer that the V6 Mirror Dashboard calls.
 *
 * Created: 2025-11-10
 */

import { ConnectionDiscoveryEngine } from './connections/ConnectionDiscoveryEngine';
import { BreakthroughModelOrchestra } from './orchestra/BreakthroughModelOrchestra';
import { HolyShitScorer } from './scoring/HolyShitScorer';
import type { BusinessIntelligence } from '@/types/contentIntelligence';
import type { DeepContext } from '@/types/synapse.types';
import type { HolyShitScore } from '@/types/scoring.types';
import type { SynapseInsight } from '@/types/synapse.types';
import type { ConnectionDiscoveryResult } from '@/types/connections.types';

/**
 * Scored breakthrough insight ready for display
 */
export interface ScoredSynapseInsight {
  insight: SynapseInsight;
  score: HolyShitScore;
  rank: number;
}

/**
 * Complete V6 breakthrough discovery result
 */
export interface V6SynapseResult {
  // Top insights that scored "holy shit" or "great"
  topInsights: ScoredSynapseInsight[];

  // All insights (for transparency)
  allInsights: ScoredSynapseInsight[];

  // Discovery metadata
  metadata: {
    connectionsFound: number;
    insightsGenerated: number;
    holyShitCount: number;
    greatCount: number;
    averageScore: number;
    processingTimeMs: number;
    modelsUsed: string[];
  };

  // Raw results for debugging
  rawConnections?: ConnectionDiscoveryResult;
}

/**
 * V6 Breakthrough Integration Service
 *
 * Main entry point for breakthrough content discovery in V6
 */
export class V6SynapseIntegration {
  private connectionEngine: ConnectionDiscoveryEngine;
  private orchestra: BreakthroughModelOrchestra;
  private scorer: HolyShitScorer;

  constructor() {
    this.connectionEngine = new ConnectionDiscoveryEngine();
    this.orchestra = new BreakthroughModelOrchestra();
    this.scorer = new HolyShitScorer();
  }

  /**
   * Run complete breakthrough discovery pipeline
   *
   * @param businessIntel - Business intelligence from V6 data collection
   * @returns Scored breakthrough insights ready for display
   */
  async discoverBreakthroughs(
    businessIntel: BusinessIntelligence
  ): Promise<V6SynapseResult> {
    const startTime = Date.now();

    console.log('🚀 [V6 Breakthrough] Starting complete discovery pipeline...');

    try {
      // Build DeepContext from BusinessIntelligence
      const deepContext = this.buildDeepContext(businessIntel);

      // ═══════════════════════════════════════════════════════
      // LAYER 1: CONNECTION DISCOVERY ENGINE
      // ═══════════════════════════════════════════════════════
      console.log('🔍 [V6 Breakthrough] Layer 1: Finding semantic connections...');

      const connections = await this.connectionEngine.findConnections(deepContext);

      console.log(`   ✓ Found ${connections.connections.length} connections`);
      console.log(`   ✓ Two-way: ${connections.stats.twoWayConnections}`);
      console.log(`   ✓ Three-way: ${connections.stats.threeWayConnections}`);

      // ═══════════════════════════════════════════════════════
      // LAYER 2: MULTI-MODEL ORCHESTRA
      // ═══════════════════════════════════════════════════════
      console.log('🎭 [V6 Breakthrough] Layer 2: Running Multi-Model Orchestra...');

      const orchestraResult = await this.orchestra.orchestrateBreakthroughDiscovery(
        deepContext,
        connections,
        {
          maxInsights: 20, // Generate up to 20 insights
          timeout: 60000,  // 60 second timeout
          enableLearning: true
        }
      );

      console.log(`   ✓ Generated ${orchestraResult.insights.length} insights`);
      console.log(`   ✓ Models used: ${orchestraResult.stats.modelsUsed?.join(', ') || 'none'}`);
      console.log(`   ✓ Convergence detected: ${orchestraResult.stats.convergenceCount || 0} times`);

      // ═══════════════════════════════════════════════════════
      // LAYER 3: HOLY SHIT SCORING
      // ═══════════════════════════════════════════════════════
      console.log('⭐ [V6 Breakthrough] Layer 3: Scoring breakthrough potential...');

      const scoredInsights = await Promise.all(
        orchestraResult.insights.map(async (insight) => ({
          insight,
          score: await this.scorer.scoreBreakthrough(insight, deepContext),
          rank: 0 // Will be set after sorting
        }))
      );

      // Sort by score (highest first) and assign ranks
      scoredInsights.sort((a, b) => b.score.total - a.score.total);
      scoredInsights.forEach((scored, index) => {
        scored.rank = index + 1;
      });

      // Filter for top insights ("holy shit" or "great")
      const topInsights = scoredInsights.filter(
        s => s.score.prediction === 'holy shit' || s.score.prediction === 'great'
      );

      // Calculate statistics
      const holyShitCount = scoredInsights.filter(s => s.score.prediction === 'holy shit').length;
      const greatCount = scoredInsights.filter(s => s.score.prediction === 'great').length;
      const averageScore = scoredInsights.reduce((sum, s) => sum + s.score.total, 0) / scoredInsights.length;

      console.log(`   ✓ Scored ${scoredInsights.length} insights`);
      console.log(`   ✓ "Holy Shit": ${holyShitCount}`);
      console.log(`   ✓ "Great": ${greatCount}`);
      console.log(`   ✓ Average score: ${averageScore.toFixed(1)}/100`);

      const processingTimeMs = Date.now() - startTime;
      console.log(`🎉 [V6 Breakthrough] Pipeline complete in ${processingTimeMs}ms`);

      return {
        topInsights,
        allInsights: scoredInsights,
        metadata: {
          connectionsFound: connections.connections.length,
          insightsGenerated: orchestraResult.insights.length,
          holyShitCount,
          greatCount,
          averageScore,
          processingTimeMs,
          modelsUsed: orchestraResult.stats.modelsUsed
        },
        rawConnections: connections
      };

    } catch (error) {
      console.error('❌ [V6 Breakthrough] Pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Build DeepContext from BusinessIntelligence
   */
  private buildDeepContext(businessIntel: BusinessIntelligence): DeepContext {
    // Extract real-time signals
    const realTimeSignals: DeepContext['realTimeSignals'] = [];

    if (businessIntel.realTimeSignals && Array.isArray(businessIntel.realTimeSignals)) {
      businessIntel.realTimeSignals.forEach(signal => {
        realTimeSignals.push({
          type: signal.type as any,
          title: signal.title,
          description: signal.description,
          source: signal.source || 'unknown',
          urgency: signal.urgency as any,
          actionable: signal.actionable || false,
          timestamp: new Date(signal.detectedAt),
          metadata: {
            category: signal.category,
            impact: signal.impact
          }
        });
      });
    }

    // Extract customer pain points from industry profile
    const painPoints: string[] = [];

    if (businessIntel.industryProfile?.customerTriggers) {
      businessIntel.industryProfile.customerTriggers.forEach(trigger => {
        if (trigger.trigger) {
          painPoints.push(trigger.trigger);
        }
      });
    }

    // Extract trending topics from search data and real-time signals
    const trendingTopics: Array<{ topic: string; volume: number; trend: 'rising' | 'stable' | 'falling' }> = [];

    if (businessIntel.searchData?.rankings) {
      businessIntel.searchData.rankings.forEach(ranking => {
        trendingTopics.push({
          topic: ranking.keyword,
          volume: ranking.searchVolume,
          trend: 'stable' // Could be enhanced with trend detection
        });
      });
    }

    // Extract competitor insights
    const competitorInsights: DeepContext['competitorInsights'] = [];

    if (businessIntel.competitive?.searchOpportunities?.keywordGaps) {
      businessIntel.competitive.searchOpportunities.keywordGaps.forEach(gap => {
        competitorInsights.push({
          competitor: gap.competitor || 'Competitor',
          insight: `Ranks for "${gap.keyword}" at position ${gap.currentPosition}`,
          dataPoint: {
            metric: 'keyword_ranking',
            value: gap.searchVolume,
            context: `Position ${gap.currentPosition}`
          }
        });
      });
    }

    // Build DeepContext
    const deepContext: DeepContext = {
      business: {
        name: businessIntel.business.name,
        industry: businessIntel.business.industry,
        location: businessIntel.business.location,
        description: businessIntel.business.description,
        website: businessIntel.business.website,
        targetAudience: businessIntel.business.targetAudience || []
      },
      dataPoints: {
        searchData: businessIntel.searchData ? {
          organicKeywords: businessIntel.searchData.organicKeywords,
          organicTraffic: businessIntel.searchData.organicTraffic,
          rankings: businessIntel.searchData.rankings?.map(r => ({
            keyword: r.keyword,
            position: r.position,
            searchVolume: r.searchVolume,
            url: r.url
          })) || [],
          localPack: businessIntel.searchData.localPack || false
        } : null,
        reviewData: businessIntel.reviewData ? {
          rating: businessIntel.reviewData.rating,
          reviewCount: businessIntel.reviewData.reviewCount,
          recentReviews: businessIntel.reviewData.recentReviews?.map(r => ({
            rating: r.rating,
            text: r.text,
            author: r.author,
            date: r.date,
            response: r.response
          })) || []
        } : null,
        socialData: businessIntel.socialData ? {
          platforms: businessIntel.socialData.platforms || [],
          totalFollowers: businessIntel.socialData.totalFollowers || 0,
          facebook: businessIntel.socialData.facebook,
          instagram: businessIntel.socialData.instagram,
          linkedin: businessIntel.socialData.linkedin,
          twitter: businessIntel.socialData.twitter
        } : null,
        competitive: businessIntel.competitive
      },
      industryContext: {
        naicsCode: businessIntel.industryProfile?.naicsCode || '',
        businessCount: businessIntel.industryProfile?.businessCount || 0,
        marketSize: businessIntel.industryProfile?.marketSize,
        growthRate: businessIntel.industryProfile?.growthRate,
        seasonalTrends: businessIntel.industryProfile?.seasonalTrends || [],
        customerTriggers: businessIntel.industryProfile?.customerTriggers || [],
        bestPlatforms: businessIntel.industryProfile?.bestPlatforms || [],
        contentTypes: businessIntel.industryProfile?.contentTypes || [],
        averageCompetitorActivity: businessIntel.industryProfile?.averageCompetitorActivity
      },
      realTimeSignals,
      customerPainPoints: painPoints,
      trendingTopics,
      competitorInsights
    };

    return deepContext;
  }

  /**
   * Get top N breakthrough insights
   */
  async getTopBreakthroughs(
    businessIntel: BusinessIntelligence,
    limit: number = 5
  ): Promise<ScoredSynapseInsight[]> {
    const result = await this.discoverBreakthroughs(businessIntel);
    return result.topInsights.slice(0, limit);
  }

  /**
   * Filter insights by minimum score
   */
  async getInsightsByMinScore(
    businessIntel: BusinessIntelligence,
    minScore: number = 70
  ): Promise<ScoredSynapseInsight[]> {
    const result = await this.discoverBreakthroughs(businessIntel);
    return result.allInsights.filter(s => s.score.total >= minScore);
  }
}
