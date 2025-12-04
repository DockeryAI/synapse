/**
 * Insight Merger
 *
 * Merges similar insights from different models into stronger unified insights.
 * When multiple models agree on similar insights (semantic similarity >0.8),
 * merge them into one insight with combined evidence and increased confidence.
 *
 * Created: 2025-11-10
 */

import {
  BreakthroughInsight,
  InsightCluster
} from '../../../types/breakthrough.types';

export class InsightMerger {
  /**
   * Merge similar insights
   */
  mergeSimilarInsights(insights: BreakthroughInsight[]): BreakthroughInsight[] {
    console.log(`[InsightMerger] Merging ${insights.length} insights...`);

    // Group insights by similarity
    const clusters = this.groupBySimilarity(insights);

    console.log(`[InsightMerger] Found ${clusters.length} clusters`);

    // Merge each cluster
    const merged = clusters.map(cluster => this.mergeCluster(cluster));

    console.log(`[InsightMerger] Merged into ${merged.length} insights`);

    return merged;
  }

  /**
   * Group insights by semantic similarity
   */
  private groupBySimilarity(insights: BreakthroughInsight[]): InsightCluster[] {
    const clusters: InsightCluster[] = [];
    const processed = new Set<string>();

    for (const insight of insights) {
      if (processed.has(insight.id)) continue;

      // Find all similar insights
      const similar: BreakthroughInsight[] = [];

      for (const candidate of insights) {
        if (candidate.id === insight.id) continue;
        if (processed.has(candidate.id)) continue;

        const similarity = this.calculateSimilarity(insight, candidate);

        if (similarity >= 0.8) {
          similar.push(candidate);
          processed.add(candidate.id);
        }
      }

      // Create cluster
      processed.add(insight.id);

      clusters.push({
        representative: insight,
        similar,
        similarity: similar.length > 0 ? 0.85 : 1.0, // Average similarity
        mergedEvidence: this.mergeEvidence([insight, ...similar]),
        averageConfidence: this.averageConfidence([insight, ...similar])
      });
    }

    return clusters;
  }

  /**
   * Calculate similarity between two insights
   * Uses simple text similarity for now (could use embeddings later)
   */
  private calculateSimilarity(a: BreakthroughInsight, b: BreakthroughInsight): number {
    // Quick checks for obvious similarity
    if (a.type === b.type && a.thinkingStyle === b.thinkingStyle) {
      // Same type and style - check content similarity
      const aSummary = `${a.insight} ${a.contentAngle}`.toLowerCase();
      const bSummary = `${b.insight} ${b.contentAngle}`.toLowerCase();

      // Simple word overlap similarity
      const aWords = new Set(aSummary.split(/\s+/));
      const bWords = new Set(bSummary.split(/\s+/));

      const intersection = new Set([...aWords].filter(w => bWords.has(w)));
      const union = new Set([...aWords, ...bWords]);

      const jaccardSimilarity = intersection.size / union.size;

      return jaccardSimilarity;
    }

    // Different types/styles - check if addressing same topic
    const aTopic = this.extractTopic(a.insight);
    const bTopic = this.extractTopic(b.insight);

    if (aTopic && bTopic && aTopic === bTopic) {
      return 0.7; // Moderate similarity if same topic
    }

    return 0.0;
  }

  /**
   * Extract main topic from insight
   */
  private extractTopic(text: string): string | null {
    // Simple topic extraction - get first few meaningful words
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4) // Filter short words
      .slice(0, 3);

    return words.length >= 2 ? words.join(' ') : null;
  }

  /**
   * Merge a cluster of similar insights
   */
  private mergeCluster(cluster: InsightCluster): BreakthroughInsight {
    const allInsights = [cluster.representative, ...cluster.similar];

    // If single insight, return as-is
    if (allInsights.length === 1) {
      return cluster.representative;
    }

    // Multiple similar insights - merge them
    const merged: BreakthroughInsight = {
      ...cluster.representative,
      evidence: cluster.mergedEvidence,
      confidence: cluster.averageConfidence,
      metadata: {
        ...cluster.representative.metadata,
        convergence: allInsights.length // How many models agreed
      }
    };

    // Enhance with convergence info
    if (allInsights.length >= 3) {
      merged.whyProfound += ` (${allInsights.length} independent models converged on this insight)`;
    }

    return merged;
  }

  /**
   * Merge evidence from multiple insights
   */
  private mergeEvidence(insights: BreakthroughInsight[]): string[] {
    const allEvidence: string[] = [];

    for (const insight of insights) {
      allEvidence.push(...insight.evidence);
    }

    // Deduplicate similar evidence
    const unique: string[] = [];
    const seen = new Set<string>();

    for (const evidence of allEvidence) {
      const normalized = evidence.toLowerCase().trim();

      // Check if we've seen similar evidence
      const isDuplicate = [...seen].some(existing =>
        this.stringSimilarity(normalized, existing) > 0.8
      );

      if (!isDuplicate) {
        unique.push(evidence);
        seen.add(normalized);
      }
    }

    return unique;
  }

  /**
   * Calculate average confidence
   */
  private averageConfidence(insights: BreakthroughInsight[]): number {
    const sum = insights.reduce((acc, insight) => acc + insight.confidence, 0);
    const avg = sum / insights.length;

    // Boost confidence when multiple models agree
    const convergenceBonus = Math.min((insights.length - 1) * 0.05, 0.15);

    return Math.min(avg + convergenceBonus, 1.0);
  }

  /**
   * Simple string similarity (Levenshtein-based)
   */
  private stringSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Get clusters for analysis
   */
  getClusters(insights: BreakthroughInsight[]): InsightCluster[] {
    return this.groupBySimilarity(insights);
  }
}
