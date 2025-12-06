/**
 * Connection Hint Generator
 *
 * V1's secret sauce - finds non-obvious connections between insights.
 * Uses embeddings + cosine similarity + cross-domain unexpectedness.
 */

import { type FilteredInsight } from '../dictionary-filter.service';
import { type ProfileType, calculateUnexpectednessScore, getDomain } from '../domains';

export interface ConnectionHint {
  insight1: FilteredInsight;
  insight2: FilteredInsight;
  similarity: number;           // Cosine similarity (0-1)
  unexpectedness: number;       // 0-100 based on domain difference
  domains: [string | null, string | null];
  score: number;                // Combined score
}

export interface EmbeddingResult {
  id: string;
  embedding: number[];
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Connection Hint Generator Service
 */
export class ConnectionHintGenerator {
  private profile: ProfileType;
  private similarityThreshold: number;

  constructor(profile: ProfileType, similarityThreshold: number = 0.65) {
    this.profile = profile;
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Generate connection hints from insights and their embeddings
   */
  generateHints(
    insights: FilteredInsight[],
    embeddings: Map<string, number[]>
  ): ConnectionHint[] {
    const hints: ConnectionHint[] = [];

    // Compare all pairs
    for (let i = 0; i < insights.length; i++) {
      for (let j = i + 1; j < insights.length; j++) {
        const insight1 = insights[i];
        const insight2 = insights[j];

        const embedding1 = embeddings.get(insight1.id);
        const embedding2 = embeddings.get(insight2.id);

        if (!embedding1 || !embedding2) {
          continue;
        }

        const similarity = cosineSimilarity(embedding1, embedding2);

        // Skip if below threshold
        if (similarity < this.similarityThreshold) {
          continue;
        }

        // Calculate unexpectedness based on domain difference
        const unexpectedness = calculateUnexpectednessScore(
          insight1.source,
          insight2.source,
          this.profile
        );

        // Get domains for reference
        const domain1 = getDomain(insight1.source, this.profile);
        const domain2 = getDomain(insight2.source, this.profile);

        // Combined score: similarity * unexpectedness
        // Higher unexpectedness = more valuable connection
        const score = (similarity * 100) * (unexpectedness / 100);

        hints.push({
          insight1,
          insight2,
          similarity,
          unexpectedness,
          domains: [domain1, domain2],
          score,
        });
      }
    }

    // Sort by score descending
    return hints.sort((a, b) => b.score - a.score);
  }

  /**
   * Get top N connection hints
   */
  getTopHints(
    insights: FilteredInsight[],
    embeddings: Map<string, number[]>,
    limit: number = 20
  ): ConnectionHint[] {
    const allHints = this.generateHints(insights, embeddings);
    return allHints.slice(0, limit);
  }

  /**
   * Get cross-domain hints only (higher value)
   */
  getCrossDomainHints(
    insights: FilteredInsight[],
    embeddings: Map<string, number[]>
  ): ConnectionHint[] {
    const allHints = this.generateHints(insights, embeddings);
    return allHints.filter(hint => hint.unexpectedness >= 70);
  }

  /**
   * Format hint for display
   */
  static formatHint(hint: ConnectionHint): string {
    return [
      `Connection (score: ${hint.score.toFixed(1)}):`,
      `  [${hint.domains[0]}] ${hint.insight1.text.substring(0, 80)}...`,
      `  ↔️`,
      `  [${hint.domains[1]}] ${hint.insight2.text.substring(0, 80)}...`,
      `  Similarity: ${(hint.similarity * 100).toFixed(1)}%, Unexpectedness: ${hint.unexpectedness.toFixed(0)}%`,
    ].join('\n');
  }
}

/**
 * Batch generate embeddings using OpenAI
 * (Placeholder - actual implementation uses EmbeddingService)
 */
export async function generateEmbeddings(
  texts: string[],
  getEmbedding: (text: string) => Promise<number[]>
): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();

  // Process in batches for efficiency
  const batchSize = 20;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(getEmbedding));

    batch.forEach((text, idx) => {
      embeddings.set(text, results[idx]);
    });
  }

  return embeddings;
}
