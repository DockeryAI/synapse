/**
 * Three-Way Connection Detector
 *
 * Finds "holy shit" moments - connections across 3 different domains.
 * V1's breakthrough mechanism with +40% bonus.
 */

import { type FilteredInsight } from '../dictionary-filter.service';
import { type ProfileType, getDomain, getUniqueDomains } from '../domains';
import { cosineSimilarity } from './connection-hint-generator';

export interface ThreeWayConnection {
  insights: [FilteredInsight, FilteredInsight, FilteredInsight];
  domains: [string | null, string | null, string | null];
  pairwiseSimilarities: [number, number, number];  // 1-2, 2-3, 1-3
  averageSimilarity: number;
  bonus: number;  // 0.4 = 40%
  totalScore: number;
}

/**
 * Three-Way Detector Service
 */
export class ThreeWayDetector {
  private profile: ProfileType;
  private similarityThreshold: number;
  private bonus: number;

  constructor(
    profile: ProfileType,
    similarityThreshold: number = 0.55,  // Lower threshold for 3-way
    bonus: number = 0.4
  ) {
    this.profile = profile;
    this.similarityThreshold = similarityThreshold;
    this.bonus = bonus;
  }

  /**
   * Find all three-way connections
   */
  findThreeWayConnections(
    insights: FilteredInsight[],
    embeddings: Map<string, number[]>
  ): ThreeWayConnection[] {
    const connections: ThreeWayConnection[] = [];

    // Need at least 3 insights from 3 different domains
    const uniqueDomains = getUniqueDomains(
      insights.map(i => i.source),
      this.profile
    );

    if (uniqueDomains.length < 3) {
      return [];
    }

    // Group insights by domain
    const byDomain = new Map<string, FilteredInsight[]>();
    for (const insight of insights) {
      const domain = getDomain(insight.source, this.profile);
      if (domain) {
        if (!byDomain.has(domain)) {
          byDomain.set(domain, []);
        }
        byDomain.get(domain)!.push(insight);
      }
    }

    const domainList = Array.from(byDomain.keys());

    // Find all combinations of 3 different domains
    for (let i = 0; i < domainList.length; i++) {
      for (let j = i + 1; j < domainList.length; j++) {
        for (let k = j + 1; k < domainList.length; k++) {
          const domain1 = domainList[i];
          const domain2 = domainList[j];
          const domain3 = domainList[k];

          const insights1 = byDomain.get(domain1)!;
          const insights2 = byDomain.get(domain2)!;
          const insights3 = byDomain.get(domain3)!;

          // Find best triple from these domains
          const triple = this.findBestTriple(
            insights1,
            insights2,
            insights3,
            embeddings
          );

          if (triple) {
            connections.push({
              ...triple,
              domains: [domain1, domain2, domain3],
            });
          }
        }
      }
    }

    // Sort by total score descending
    return connections.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Find best triple from three sets of insights
   */
  private findBestTriple(
    set1: FilteredInsight[],
    set2: FilteredInsight[],
    set3: FilteredInsight[],
    embeddings: Map<string, number[]>
  ): Omit<ThreeWayConnection, 'domains'> | null {
    let bestTriple: Omit<ThreeWayConnection, 'domains'> | null = null;
    let bestScore = 0;

    for (const i1 of set1) {
      for (const i2 of set2) {
        for (const i3 of set3) {
          const e1 = embeddings.get(i1.id);
          const e2 = embeddings.get(i2.id);
          const e3 = embeddings.get(i3.id);

          if (!e1 || !e2 || !e3) continue;

          const sim12 = cosineSimilarity(e1, e2);
          const sim23 = cosineSimilarity(e2, e3);
          const sim13 = cosineSimilarity(e1, e3);

          // All pairs must meet threshold
          if (sim12 < this.similarityThreshold ||
              sim23 < this.similarityThreshold ||
              sim13 < this.similarityThreshold) {
            continue;
          }

          const avgSim = (sim12 + sim23 + sim13) / 3;

          // Calculate total score with bonus
          // Base score is average similarity * 100
          // Bonus is +40%
          const baseScore = avgSim * 100;
          const totalScore = baseScore * (1 + this.bonus);

          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestTriple = {
              insights: [i1, i2, i3],
              pairwiseSimilarities: [sim12, sim23, sim13],
              averageSimilarity: avgSim,
              bonus: this.bonus,
              totalScore,
            };
          }
        }
      }
    }

    return bestTriple;
  }

  /**
   * Get top N three-way connections
   */
  getTopThreeWay(
    insights: FilteredInsight[],
    embeddings: Map<string, number[]>,
    limit: number = 5
  ): ThreeWayConnection[] {
    const all = this.findThreeWayConnections(insights, embeddings);
    return all.slice(0, limit);
  }

  /**
   * Check if insights have three-way potential (quick check before expensive computation)
   */
  hasThreeWayPotential(insights: FilteredInsight[]): boolean {
    const uniqueDomains = getUniqueDomains(
      insights.map(i => i.source),
      this.profile
    );
    return uniqueDomains.length >= 3;
  }

  /**
   * Format three-way connection for display
   */
  static formatConnection(conn: ThreeWayConnection): string {
    return [
      `🔥 THREE-WAY BREAKTHROUGH (score: ${conn.totalScore.toFixed(1)}, +${(conn.bonus * 100).toFixed(0)}% bonus):`,
      `  [${conn.domains[0]}] ${conn.insights[0].text.substring(0, 60)}...`,
      `  [${conn.domains[1]}] ${conn.insights[1].text.substring(0, 60)}...`,
      `  [${conn.domains[2]}] ${conn.insights[2].text.substring(0, 60)}...`,
      `  Avg Similarity: ${(conn.averageSimilarity * 100).toFixed(1)}%`,
    ].join('\n');
  }
}
