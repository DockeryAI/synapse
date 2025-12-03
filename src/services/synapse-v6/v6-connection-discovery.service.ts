// PRD Feature: SYNAPSE-V6
/**
 * V6 Connection Discovery Service
 *
 * Wires V6 insights to the V1 Connection Engine.
 * Finds unexpected cross-domain connections between insights.
 *
 * Per Build Plan Phase 11D:
 * - Generate embeddings for insights
 * - Run cosine similarity
 * - Calculate unexpectedness scoring
 * - Apply three-way connection bonus
 */

import { generateConnectionHints, type DataSource, type ConnectionHint, type ConnectionHintResult } from './helpers/ConnectionHintGenerator';
import type { V6Insight, V6SourceTab, V6Connection } from './v6-insight-types';

// Map V6 source tabs to ConnectionHintGenerator data types
const SOURCE_TAB_TO_DATA_TYPE: Record<V6SourceTab, DataSource['type']> = {
  voc: 'review',
  community: 'social',
  competitive: 'news',
  trends: 'trend',
  search: 'keyword',
  local_timing: 'weather',
};

/**
 * Convert V6 insights to data sources for connection analysis
 */
function insightsToDataSources(insights: V6Insight[]): DataSource[] {
  return insights.map(insight => ({
    type: SOURCE_TAB_TO_DATA_TYPE[insight.sourceTab] || 'review',
    text: `${insight.title}. ${insight.text}`,
    metadata: { insightId: insight.id, sourceTab: insight.sourceTab },
  }));
}

/**
 * Map connection hints back to V6 connections
 */
function hintsToV6Connections(
  hints: ConnectionHint[],
  insights: V6Insight[]
): Map<string, V6Connection[]> {
  const connectionMap = new Map<string, V6Connection[]>();

  // Initialize empty arrays for all insights
  insights.forEach(insight => {
    connectionMap.set(insight.id, []);
  });

  // Process each hint
  hints.forEach(hint => {
    const insightIdA = hint.sourceA.metadata?.insightId;
    const insightIdB = hint.sourceB.metadata?.insightId;

    if (!insightIdA || !insightIdB) return;

    // Determine connection type based on source tabs
    const sourceTabA = hint.sourceA.metadata?.sourceTab as V6SourceTab;
    const sourceTabB = hint.sourceB.metadata?.sourceTab as V6SourceTab;
    const connectionType = getConnectionType(sourceTabA, sourceTabB);

    // Calculate breakthrough score (V1 formula)
    const breakthroughScore = calculateBreakthroughScore(
      hint.similarity,
      hint.unexpectedness,
      connectionType
    );

    // Add connection to A
    const connectionsA = connectionMap.get(insightIdA) || [];
    connectionsA.push({
      insightId: insightIdB,
      similarity: hint.similarity,
      unexpectedness: Math.round(hint.unexpectedness * 100),
      breakthroughScore,
      connectionType,
    });
    connectionMap.set(insightIdA, connectionsA);

    // Add connection to B
    const connectionsB = connectionMap.get(insightIdB) || [];
    connectionsB.push({
      insightId: insightIdA,
      similarity: hint.similarity,
      unexpectedness: Math.round(hint.unexpectedness * 100),
      breakthroughScore,
      connectionType,
    });
    connectionMap.set(insightIdB, connectionsB);
  });

  return connectionMap;
}

/**
 * Determine connection type based on source tabs
 */
function getConnectionType(
  tabA: V6SourceTab,
  tabB: V6SourceTab
): 'same-domain' | 'adjacent-domain' | 'cross-domain' {
  if (tabA === tabB) return 'same-domain';

  // Adjacent domains (related categories)
  const adjacentPairs: [V6SourceTab, V6SourceTab][] = [
    ['voc', 'community'],
    ['trends', 'competitive'],
    ['search', 'trends'],
  ];

  for (const [a, b] of adjacentPairs) {
    if ((tabA === a && tabB === b) || (tabA === b && tabB === a)) {
      return 'adjacent-domain';
    }
  }

  return 'cross-domain';
}

/**
 * Calculate breakthrough score (0-100)
 * Per V1 weights:
 * - Semantic Similarity: 30%
 * - Unexpectedness: 25%
 * - Connection type bonus: varies
 */
function calculateBreakthroughScore(
  similarity: number,
  unexpectedness: number,
  connectionType: 'same-domain' | 'adjacent-domain' | 'cross-domain'
): number {
  // Base score from similarity and unexpectedness
  const similarityScore = similarity * 30;
  const unexpectednessScore = unexpectedness * 25;

  // Connection type bonus
  let typeBonus = 0;
  switch (connectionType) {
    case 'cross-domain':
      typeBonus = 30; // Highest value
      break;
    case 'adjacent-domain':
      typeBonus = 15;
      break;
    case 'same-domain':
      typeBonus = 5;
      break;
  }

  // Actionability bonus (cross-domain with high similarity = actionable)
  const actionabilityBonus = connectionType === 'cross-domain' && similarity > 0.7 ? 15 : 0;

  const total = similarityScore + unexpectednessScore + typeBonus + actionabilityBonus;

  return Math.min(100, Math.round(total));
}

/**
 * Find connections between insights
 * Main entry point for connection discovery
 */
export async function discoverConnections(
  insights: V6Insight[],
  options: {
    minSimilarity?: number;
    maxConnections?: number;
    prioritizeCrossDomain?: boolean;
  } = {}
): Promise<{
  insights: V6Insight[];
  stats: {
    totalConnections: number;
    crossDomainConnections: number;
    averageSimilarity: number;
    processingTimeMs: number;
    embeddingCost: number;
  };
}> {
  const {
    minSimilarity = 0.65,
    maxConnections = 10,
    prioritizeCrossDomain = true,
  } = options;

  console.log(`[V6ConnectionDiscovery] Analyzing ${insights.length} insights...`);

  if (insights.length < 2) {
    console.log('[V6ConnectionDiscovery] Not enough insights for connection analysis');
    return {
      insights,
      stats: {
        totalConnections: 0,
        crossDomainConnections: 0,
        averageSimilarity: 0,
        processingTimeMs: 0,
        embeddingCost: 0,
      },
    };
  }

  // Convert to data sources
  const dataSources = insightsToDataSources(insights);

  // Run connection analysis
  const result = await generateConnectionHints(dataSources, {
    minSimilarity,
    maxHints: maxConnections,
    prioritizeCrossDomain,
  });

  // Map connections back to insights
  const connectionMap = hintsToV6Connections(result.hints, insights);

  // Update insights with connections
  const updatedInsights = insights.map(insight => ({
    ...insight,
    connections: connectionMap.get(insight.id) || [],
  }));

  // Calculate stats
  const crossDomainCount = result.hints.filter(
    h => h.sourceA.type !== h.sourceB.type
  ).length;

  console.log(`[V6ConnectionDiscovery] Found ${result.hints.length} connections (${crossDomainCount} cross-domain)`);

  return {
    insights: updatedInsights,
    stats: {
      totalConnections: result.hints.length,
      crossDomainConnections: crossDomainCount,
      averageSimilarity: result.averageSimilarity,
      processingTimeMs: result.processingTimeMs,
      embeddingCost: result.cost,
    },
  };
}

/**
 * Find three-way connections (bonus points per V1)
 * Three different source types connecting = "holy shit" moment
 */
export function findThreeWayConnections(
  insights: V6Insight[]
): {
  insightIds: [string, string, string];
  sourceTypes: [V6SourceTab, V6SourceTab, V6SourceTab];
  avgSimilarity: number;
  breakthroughScore: number;
}[] {
  const threeWays: ReturnType<typeof findThreeWayConnections> = [];

  // Find insights with connections
  const insightsWithConnections = insights.filter(
    i => i.connections && i.connections.length > 0
  );

  // For each insight with connections
  for (const insightA of insightsWithConnections) {
    if (!insightA.connections) continue;

    // For each connection
    for (const connToB of insightA.connections) {
      const insightB = insights.find(i => i.id === connToB.insightId);
      if (!insightB?.connections) continue;

      // Check if B connects to a third insight that also connects to A
      for (const connToC of insightB.connections) {
        if (connToC.insightId === insightA.id) continue; // Skip back-connection

        const insightC = insights.find(i => i.id === connToC.insightId);
        if (!insightC?.connections) continue;

        // Check if C connects to A
        const cToA = insightC.connections.find(c => c.insightId === insightA.id);
        if (!cToA) continue;

        // Found a three-way! Check if all different source types
        const types = [insightA.sourceTab, insightB.sourceTab, insightC.sourceTab];
        const uniqueTypes = new Set(types);

        if (uniqueTypes.size === 3) {
          // All different types = breakthrough!
          const avgSimilarity = (connToB.similarity + connToC.similarity + cToA.similarity) / 3;

          // +40% bonus for three-way connection per V1
          const baseScore = (connToB.breakthroughScore + connToC.breakthroughScore + cToA.breakthroughScore) / 3;
          const breakthroughScore = Math.min(100, Math.round(baseScore * 1.4));

          // Avoid duplicates (sort IDs)
          const sortedIds = [insightA.id, insightB.id, insightC.id].sort() as [string, string, string];
          const key = sortedIds.join('-');

          if (!threeWays.find(tw => tw.insightIds.join('-') === key)) {
            threeWays.push({
              insightIds: sortedIds,
              sourceTypes: types as [V6SourceTab, V6SourceTab, V6SourceTab],
              avgSimilarity,
              breakthroughScore,
            });
          }
        }
      }
    }
  }

  // Sort by breakthrough score
  threeWays.sort((a, b) => b.breakthroughScore - a.breakthroughScore);

  console.log(`[V6ConnectionDiscovery] Found ${threeWays.length} three-way connections`);

  return threeWays;
}

export const v6ConnectionDiscoveryService = {
  discoverConnections,
  findThreeWayConnections,
};
