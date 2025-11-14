/**
 * Similarity Calculator
 *
 * Calculates semantic similarity between embeddings using:
 * - Cosine similarity (primary method)
 * - Dot product
 * - Euclidean distance
 *
 * Created: 2025-11-10
 */

import { DataPoint } from '../../../types/connections.types';

export class SimilarityCalculator {
  /**
   * Calculate cosine similarity between two embeddings
   * Returns value between -1 and 1 (typically 0 to 1 for text embeddings)
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embedding dimensions must match');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Calculate similarity between two data points
   */
  calculateSimilarity(a: DataPoint, b: DataPoint): number {
    if (!a.embedding || !b.embedding) {
      throw new Error('Data points must have embeddings');
    }

    return this.cosineSimilarity(a.embedding, b.embedding);
  }

  /**
   * Find top N most similar data points to a target
   */
  findMostSimilar(
    target: DataPoint,
    candidates: DataPoint[],
    topN: number = 5
  ): Array<{ dataPoint: DataPoint; similarity: number }> {
    const similarities = candidates.map(candidate => ({
      dataPoint: candidate,
      similarity: this.calculateSimilarity(target, candidate)
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);
  }

  /**
   * Calculate dot product (alternative similarity measure)
   */
  dotProduct(a: number[], b: number[]): number {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += a[i] * b[i];
    }
    return result;
  }

  /**
   * Calculate Euclidean distance (lower = more similar)
   */
  euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Batch calculate all pairwise similarities
   * Returns matrix of similarities
   */
  calculatePairwiseSimilarities(dataPoints: DataPoint[]): number[][] {
    const n = dataPoints.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const similarity = this.calculateSimilarity(dataPoints[i], dataPoints[j]);
        matrix[i][j] = similarity;
        matrix[j][i] = similarity; // Symmetric
      }
      matrix[i][i] = 1.0; // Perfect similarity with self
    }

    return matrix;
  }

  /**
   * Find clusters of similar data points
   */
  findClusters(
    dataPoints: DataPoint[],
    similarityThreshold: number = 0.8
  ): DataPoint[][] {
    const clusters: DataPoint[][] = [];
    const used = new Set<string>();

    for (const point of dataPoints) {
      if (used.has(point.id)) continue;

      const cluster: DataPoint[] = [point];
      used.add(point.id);

      // Find similar points
      for (const candidate of dataPoints) {
        if (used.has(candidate.id)) continue;

        const similarity = this.calculateSimilarity(point, candidate);
        if (similarity >= similarityThreshold) {
          cluster.push(candidate);
          used.add(candidate.id);
        }
      }

      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }
}
