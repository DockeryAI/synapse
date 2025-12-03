// PRD Feature: SYNAPSE-V6
/**
 * V6 Connection Discovery Hook
 *
 * React hook for discovering connections between V6 insights.
 * Uses the V1 Connection Engine (embeddings + unexpectedness scoring).
 */

import { useState, useCallback } from 'react';
import { discoverConnections, findThreeWayConnections } from '@/services/synapse-v6/v6-connection-discovery.service';
import type { V6Insight, V6SourceTab } from '@/services/synapse-v6/v6-insight-types';

export interface ConnectionDiscoveryState {
  isAnalyzing: boolean;
  insights: V6Insight[];
  stats: {
    totalConnections: number;
    crossDomainConnections: number;
    averageSimilarity: number;
    processingTimeMs: number;
    embeddingCost: number;
  } | null;
  threeWayConnections: {
    insightIds: [string, string, string];
    sourceTypes: [V6SourceTab, V6SourceTab, V6SourceTab];
    avgSimilarity: number;
    breakthroughScore: number;
  }[];
  error: string | null;
}

export interface UseV6ConnectionDiscoveryReturn extends ConnectionDiscoveryState {
  analyzeConnections: (insights: V6Insight[]) => Promise<void>;
  clearConnections: () => void;
}

export function useV6ConnectionDiscovery(): UseV6ConnectionDiscoveryReturn {
  const [state, setState] = useState<ConnectionDiscoveryState>({
    isAnalyzing: false,
    insights: [],
    stats: null,
    threeWayConnections: [],
    error: null,
  });

  const analyzeConnections = useCallback(async (insights: V6Insight[]) => {
    if (insights.length < 2) {
      setState(prev => ({
        ...prev,
        insights,
        stats: null,
        threeWayConnections: [],
        error: 'Need at least 2 insights to find connections',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
    }));

    try {
      // Discover connections
      const result = await discoverConnections(insights, {
        minSimilarity: 0.65,
        maxConnections: 15,
        prioritizeCrossDomain: true,
      });

      // Find three-way connections (breakthrough moments)
      const threeWays = findThreeWayConnections(result.insights);

      setState({
        isAnalyzing: false,
        insights: result.insights,
        stats: result.stats,
        threeWayConnections: threeWays,
        error: null,
      });

      console.log('[useV6ConnectionDiscovery] Analysis complete:', {
        totalInsights: result.insights.length,
        connections: result.stats.totalConnections,
        crossDomain: result.stats.crossDomainConnections,
        threeWays: threeWays.length,
      });

    } catch (error) {
      console.error('[useV6ConnectionDiscovery] Analysis failed:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Connection analysis failed',
      }));
    }
  }, []);

  const clearConnections = useCallback(() => {
    setState({
      isAnalyzing: false,
      insights: [],
      stats: null,
      threeWayConnections: [],
      error: null,
    });
  }, []);

  return {
    ...state,
    analyzeConnections,
    clearConnections,
  };
}

export default useV6ConnectionDiscovery;
