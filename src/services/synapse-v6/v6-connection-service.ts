// PRD Feature: SYNAPSE-V6
/**
 * V6 Connection Service
 *
 * Wraps the V1 Connection Discovery Engine and integrates with V6 tab data.
 * Transforms tab results into DataPoints for embedding-based connection finding.
 *
 * This is the "magic" - finding non-obvious connections between:
 * - VoC insights (customer pain points)
 * - Community discussions (social proof)
 * - Competitive intelligence (gaps and opportunities)
 * - Trends (market signals)
 * - Search intent (what people are looking for)
 * - Local/Timing (contextual triggers)
 *
 * Uses cosine similarity ≥0.65 threshold and rewards cross-domain connections.
 */

import { ConnectionDiscoveryEngine } from './connections/ConnectionDiscoveryEngine';
import type { TabData, ApiResult } from './api-orchestrator.service';
import type { InsightTab, BrandProfile } from './brand-profile.service';
import type { DataPoint, DataSource, DataPointType, Connection, ConnectionDiscoveryResult } from '@/types/connections.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// Tab to DataSource mapping
const TAB_TO_SOURCE: Record<InsightTab, DataSource> = {
  'voc': 'outscraper',
  'community': 'reddit',
  'competitive': 'semrush',
  'trends': 'news',
  'search': 'serper',
  'local_timing': 'weather',
};

// Tab to DataPointType mapping
const TAB_TO_TYPE: Record<InsightTab, DataPointType> = {
  'voc': 'customer_trigger',
  'community': 'community_discussion',
  'competitive': 'competitive_gap',
  'trends': 'trending_topic',
  'search': 'search_intent',
  'local_timing': 'timing',
};

// Tab to domain mapping for cross-domain bonus scoring
const TAB_TO_DOMAIN: Record<InsightTab, 'psychology' | 'timing' | 'competitive' | 'content_gap' | 'search_intent' | 'community'> = {
  'voc': 'psychology',
  'community': 'community',
  'competitive': 'competitive',
  'trends': 'content_gap',
  'search': 'search_intent',
  'local_timing': 'timing',
};

export interface V6ConnectionResult {
  connections: Connection[];
  totalDataPoints: number;
  embeddingsGenerated: number;
  twoWayCount: number;
  threeWayCount: number;
  processingTime: number;
  topBreakthroughs: BreakthroughConnection[];
}

export interface BreakthroughConnection {
  id: string;
  type: 'two-way' | 'three-way';
  score: number;
  unexpectedness: number;
  sources: InsightTab[];
  title: string;
  insight: string;
  contentAngle: string;
  urgency: 'immediate' | 'soon' | 'planned';
}

/**
 * V6 Connection Service Class
 */
export class V6ConnectionService {
  private engine: ConnectionDiscoveryEngine;

  constructor(openaiApiKey?: string) {
    this.engine = new ConnectionDiscoveryEngine(openaiApiKey);
  }

  /**
   * Find connections from V6 tab data
   */
  async findConnectionsFromTabs(
    tabData: Map<InsightTab, TabData>,
    profile: BrandProfile
  ): Promise<V6ConnectionResult> {
    const startTime = Date.now();

    // Convert tab data to DataPoints
    const dataPoints = this.tabDataToDataPoints(tabData);

    console.log(`[V6ConnectionService] Converted ${dataPoints.length} data points from ${tabData.size} tabs`);

    if (dataPoints.length < 2) {
      return this.emptyResult(startTime);
    }

    // Build DeepContext from profile and tab data
    const context = this.buildDeepContext(dataPoints, profile);

    // Run V1 connection discovery
    const result = await this.engine.findConnections(context, {
      minSimilarity: 0.65,  // V1 magic threshold
      maxConnections: 20,   // Top 20 connections
      enableThreeWay: true, // Three-way holy shit connections
    });

    // Transform to V6 result format
    const v6Result = this.transformResult(result, tabData, startTime);

    console.log(`[V6ConnectionService] Found ${v6Result.topBreakthroughs.length} breakthrough connections`);

    return v6Result;
  }

  /**
   * Convert tab data to DataPoints for embedding
   */
  private tabDataToDataPoints(tabData: Map<InsightTab, TabData>): DataPoint[] {
    const dataPoints: DataPoint[] = [];

    for (const [tab, data] of tabData) {
      if (!data.complete || data.results.length === 0) continue;

      for (const result of data.results) {
        if (!result.success || !result.data) continue;

        const points = this.apiResultToDataPoints(result, tab);
        dataPoints.push(...points);
      }
    }

    return dataPoints;
  }

  /**
   * Convert a single API result to DataPoints
   */
  private apiResultToDataPoints(result: ApiResult, tab: InsightTab): DataPoint[] {
    const points: DataPoint[] = [];
    const data = result.data;

    if (!data || typeof data !== 'object') return points;

    const items = Array.isArray(data) ? data : (data as Record<string, unknown>).items || [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const record = item as Record<string, unknown>;
      const content = String(
        record.content || record.text || record.title || record.headline || ''
      );

      if (!content || content.length < 20) continue;

      points.push({
        id: `${tab}-${result.apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: TAB_TO_SOURCE[tab],
        type: TAB_TO_TYPE[tab],
        content,
        metadata: {
          domain: TAB_TO_DOMAIN[tab],
          sentiment: this.extractSentiment(record),
          volume: Number(record.volume || record.views || record.engagement || 0),
          relevance: Number(record.relevance || record.score || 1),
          timing: this.extractTiming(record),
          competition: this.extractCompetition(record),
          tab,
          apiName: result.apiName,
          originalData: record,
        },
        createdAt: new Date(),
      });
    }

    return points;
  }

  /**
   * Build DeepContext from data points and profile
   */
  private buildDeepContext(dataPoints: DataPoint[], profile: BrandProfile): DeepContext {
    const uvp = profile.uvp_data;

    // Group data points by domain
    const byDomain: Record<string, DataPoint[]> = {};
    for (const dp of dataPoints) {
      const domain = dp.metadata.domain || 'other';
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(dp);
    }

    // Build context structure
    const context: DeepContext = {
      business: {
        id: profile.brand_id,
        name: uvp.targetCustomer?.primaryProfile || 'Business',
        industry: profile.profile_type,
        website: '',
        location: {
          city: uvp.targetCustomer?.geographicFocus || '',
          state: '',
          country: 'US',
        },
        keywords: [],
      },
      uvp: {
        targetCustomer: uvp.targetCustomer?.primaryProfile || '',
        customerProblem: uvp.transformation?.beforeState || '',
        desiredOutcome: uvp.transformation?.afterState || '',
        uniqueSolution: uvp.uniqueSolution?.headline || '',
        keyBenefit: uvp.keyBenefit?.headline || '',
      },
      // Add data points as raw intelligence
      rawDataPoints: dataPoints,
      metadata: {
        profileType: profile.profile_type,
        enabledTabs: profile.enabled_tabs,
        dataPointCount: dataPoints.length,
        domainBreakdown: Object.fromEntries(
          Object.entries(byDomain).map(([k, v]) => [k, v.length])
        ),
      },
    };

    return context;
  }

  /**
   * Transform V1 result to V6 format
   */
  private transformResult(
    result: ConnectionDiscoveryResult,
    tabData: Map<InsightTab, TabData>,
    startTime: number
  ): V6ConnectionResult {
    const topBreakthroughs: BreakthroughConnection[] = [];

    for (const conn of result.connections.slice(0, 10)) {
      const sources = conn.points.map((p) => p.metadata.tab as InsightTab);
      const uniqueSources = [...new Set(sources)];

      topBreakthroughs.push({
        id: conn.id,
        type: conn.points.length === 3 ? 'three-way' : 'two-way',
        score: conn.score,
        unexpectedness: conn.unexpectedness || 0,
        sources: uniqueSources,
        title: this.generateConnectionTitle(conn),
        insight: conn.description || '',
        contentAngle: this.generateContentAngle(conn),
        urgency: this.determineUrgency(conn),
      });
    }

    return {
      connections: result.connections,
      totalDataPoints: result.dataPointCount,
      embeddingsGenerated: result.embeddingsGenerated,
      twoWayCount: result.twoWayCount,
      threeWayCount: result.threeWayCount,
      processingTime: Date.now() - startTime,
      topBreakthroughs,
    };
  }

  /**
   * Generate a human-readable title for a connection
   */
  private generateConnectionTitle(conn: Connection): string {
    const sources = conn.points.map((p) => p.source).join(' + ');
    return `${sources}: ${conn.points[0]?.content?.substring(0, 50)}...`;
  }

  /**
   * Generate a content angle from a connection
   */
  private generateContentAngle(conn: Connection): string {
    if (conn.points.length === 3) {
      return `Triple insight: ${conn.points.map((p) => p.type).join(' → ')}`;
    }
    return `Connection: ${conn.points.map((p) => p.type).join(' ↔ ')}`;
  }

  /**
   * Determine urgency based on timing metadata
   */
  private determineUrgency(conn: Connection): 'immediate' | 'soon' | 'planned' {
    const timings = conn.points
      .map((p) => p.metadata.timing)
      .filter(Boolean);

    if (timings.includes('immediate')) return 'immediate';
    if (timings.includes('soon')) return 'soon';
    return 'planned';
  }

  /**
   * Extract sentiment from record
   */
  private extractSentiment(record: Record<string, unknown>): 'positive' | 'negative' | 'neutral' {
    const sentiment = String(record.sentiment || '').toLowerCase();
    if (sentiment.includes('positive') || sentiment.includes('good')) return 'positive';
    if (sentiment.includes('negative') || sentiment.includes('bad')) return 'negative';
    return 'neutral';
  }

  /**
   * Extract timing from record
   */
  private extractTiming(record: Record<string, unknown>): 'immediate' | 'soon' | 'seasonal' {
    const timing = String(record.timing || record.urgency || '').toLowerCase();
    if (timing.includes('immediate') || timing.includes('now')) return 'immediate';
    if (timing.includes('soon') || timing.includes('week')) return 'soon';
    return 'seasonal';
  }

  /**
   * Extract competition level from record
   */
  private extractCompetition(record: Record<string, unknown>): 'low' | 'medium' | 'high' {
    const competition = String(record.competition || record.difficulty || '').toLowerCase();
    if (competition.includes('low') || competition.includes('easy')) return 'low';
    if (competition.includes('high') || competition.includes('hard')) return 'high';
    return 'medium';
  }

  /**
   * Return empty result
   */
  private emptyResult(startTime: number): V6ConnectionResult {
    return {
      connections: [],
      totalDataPoints: 0,
      embeddingsGenerated: 0,
      twoWayCount: 0,
      threeWayCount: 0,
      processingTime: Date.now() - startTime,
      topBreakthroughs: [],
    };
  }
}

// Export singleton
export const v6ConnectionService = new V6ConnectionService();
