/**
 * Clustering Service
 *
 * Implements semantic clustering using K-means and DBSCAN algorithms
 * to discover patterns across data points.
 */

import type { DataPoint } from '@/types/connections.types';
import { embeddingService } from './embedding.service';

export interface InsightCluster {
  id: string;
  theme: string;
  dataPoints: DataPoint[];
  centroid: number[];
  coherence: number; // How tightly clustered (0-1)
  sources: string[]; // Unique sources in cluster
  dominantSentiment: string;
  size: number;
}

class ClusteringService {
  /**
   * K-means clustering algorithm
   */
  kMeansClustering(
    dataPoints: DataPoint[],
    k: number = 5,
    maxIterations: number = 100
  ): InsightCluster[] {
    const pointsWithEmbeddings = dataPoints.filter(dp => dp.embedding);

    if (pointsWithEmbeddings.length < k) {
      console.warn(`[Clustering] Not enough points (${pointsWithEmbeddings.length}) for ${k} clusters`);
      k = Math.max(1, pointsWithEmbeddings.length);
    }

    if (pointsWithEmbeddings.length === 0) {
      return [];
    }

    // Initialize centroids randomly
    const shuffled = [...pointsWithEmbeddings].sort(() => Math.random() - 0.5);
    let centroids = shuffled.slice(0, k).map(dp => [...dp.embedding!]);

    let assignments: number[] = [];

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      const newAssignments = pointsWithEmbeddings.map(dp =>
        this.findNearestCentroid(dp.embedding!, centroids)
      );

      // Check for convergence
      if (this.arraysEqual(assignments, newAssignments)) {
        break;
      }
      assignments = newAssignments;

      // Update centroids
      centroids = this.updateCentroids(pointsWithEmbeddings, assignments, k);
    }

    // Build clusters
    const clusters: InsightCluster[] = [];

    for (let i = 0; i < k; i++) {
      const clusterPoints = pointsWithEmbeddings.filter((_, idx) => assignments[idx] === i);

      if (clusterPoints.length === 0) continue;

      const sources = [...new Set(clusterPoints.map(dp => dp.source))];
      const sentiments = clusterPoints
        .map(dp => dp.metadata?.sentiment)
        .filter(Boolean);

      const sentimentCounts = sentiments.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantSentiment = Object.entries(sentimentCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

      // Calculate coherence (average similarity to centroid)
      const coherence = this.calculateCoherence(clusterPoints, centroids[i]);

      // Generate theme from cluster content
      const theme = this.generateTheme(clusterPoints);

      clusters.push({
        id: `cluster-${i}`,
        theme,
        dataPoints: clusterPoints,
        centroid: centroids[i],
        coherence,
        sources,
        dominantSentiment,
        size: clusterPoints.length
      });
    }

    // Sort by size descending
    clusters.sort((a, b) => b.size - a.size);

    console.log(`[Clustering] Created ${clusters.length} clusters from ${pointsWithEmbeddings.length} points`);

    return clusters;
  }

  /**
   * DBSCAN clustering for density-based discovery
   */
  dbscanClustering(
    dataPoints: DataPoint[],
    epsilon: number = 0.3, // Distance threshold
    minPoints: number = 3
  ): InsightCluster[] {
    const pointsWithEmbeddings = dataPoints.filter(dp => dp.embedding);

    if (pointsWithEmbeddings.length === 0) return [];

    const visited = new Set<string>();
    const clustered = new Set<string>();
    const clusters: DataPoint[][] = [];

    for (const point of pointsWithEmbeddings) {
      if (visited.has(point.id)) continue;
      visited.add(point.id);

      const neighbors = this.getNeighbors(point, pointsWithEmbeddings, epsilon);

      if (neighbors.length < minPoints) {
        continue; // Noise point
      }

      // Start new cluster
      const cluster: DataPoint[] = [point];
      clustered.add(point.id);

      // Expand cluster
      const queue = [...neighbors];

      while (queue.length > 0) {
        const neighbor = queue.shift()!;

        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          const neighborNeighbors = this.getNeighbors(neighbor, pointsWithEmbeddings, epsilon);

          if (neighborNeighbors.length >= minPoints) {
            queue.push(...neighborNeighbors);
          }
        }

        if (!clustered.has(neighbor.id)) {
          cluster.push(neighbor);
          clustered.add(neighbor.id);
        }
      }

      clusters.push(cluster);
    }

    // Convert to InsightCluster format
    return clusters.map((clusterPoints, i) => {
      const centroid = this.calculateCentroid(clusterPoints);
      const sources = [...new Set(clusterPoints.map(dp => dp.source))];
      const coherence = this.calculateCoherence(clusterPoints, centroid);
      const theme = this.generateTheme(clusterPoints);

      return {
        id: `dbscan-${i}`,
        theme,
        dataPoints: clusterPoints,
        centroid,
        coherence,
        sources,
        dominantSentiment: 'mixed',
        size: clusterPoints.length
      };
    }).sort((a, b) => b.size - a.size);
  }

  /**
   * Find nearest centroid index
   */
  private findNearestCentroid(embedding: number[], centroids: number[][]): number {
    let minDist = Infinity;
    let nearest = 0;

    for (let i = 0; i < centroids.length; i++) {
      const dist = this.euclideanDistance(embedding, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }

    return nearest;
  }

  /**
   * Update centroids based on assignments
   */
  private updateCentroids(
    points: DataPoint[],
    assignments: number[],
    k: number
  ): number[][] {
    const dim = points[0].embedding!.length;
    const centroids: number[][] = [];

    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === i);

      if (clusterPoints.length === 0) {
        // Keep old centroid or random
        centroids.push(new Array(dim).fill(0));
        continue;
      }

      centroids.push(this.calculateCentroid(clusterPoints));
    }

    return centroids;
  }

  /**
   * Calculate centroid of points
   */
  private calculateCentroid(points: DataPoint[]): number[] {
    if (points.length === 0) return [];

    const dim = points[0].embedding!.length;
    const centroid = new Array(dim).fill(0);

    for (const point of points) {
      for (let i = 0; i < dim; i++) {
        centroid[i] += point.embedding![i];
      }
    }

    for (let i = 0; i < dim; i++) {
      centroid[i] /= points.length;
    }

    return centroid;
  }

  /**
   * Calculate cluster coherence
   */
  private calculateCoherence(points: DataPoint[], centroid: number[]): number {
    if (points.length === 0) return 0;

    const similarities = points.map(dp =>
      embeddingService.cosineSimilarity(dp.embedding!, centroid)
    );

    return similarities.reduce((a, b) => a + b, 0) / similarities.length;
  }

  /**
   * Get neighbors within epsilon distance
   */
  private getNeighbors(
    point: DataPoint,
    allPoints: DataPoint[],
    epsilon: number
  ): DataPoint[] {
    return allPoints.filter(other => {
      if (other.id === point.id) return false;
      const similarity = embeddingService.cosineSimilarity(
        point.embedding!,
        other.embedding!
      );
      return similarity >= (1 - epsilon); // Convert epsilon to similarity threshold
    });
  }

  /**
   * Generate theme from cluster content
   */
  private generateTheme(points: DataPoint[]): string {
    // Extract common words from content
    const words: Record<string, number> = {};
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'or', 'if', 'because', 'while', 'although', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom']);

    for (const point of points) {
      const contentWords = point.content
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      for (const word of contentWords) {
        words[word] = (words[word] || 0) + 1;
      }
    }

    // Get top words
    const topWords = Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    if (topWords.length === 0) {
      return 'General Insights';
    }

    // Capitalize and join
    return topWords
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' & ');
  }

  /**
   * Euclidean distance
   */
  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }

  /**
   * Check array equality
   */
  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

export const clusteringService = new ClusteringService();
