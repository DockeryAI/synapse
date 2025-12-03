/**
 * Clustering Service
 *
 * Implements semantic clustering using K-means and DBSCAN algorithms
 * to discover patterns across data points.
 */

import type { DataPoint } from '@/types/connections.types';
import { embeddingService } from './embedding.service';
import { supabase } from '@/lib/supabase';

export interface InsightCluster {
  id: string;
  theme: string;
  dataPoints: DataPoint[];
  centroid: number[];
  coherence: number; // How tightly clustered (0-1)
  sources: string[]; // Unique sources in cluster
  dominantSentiment: string;
  size: number;
  // Semantic gap detection
  isSemanticGap?: boolean; // True if cluster has no dominant keyword
  gapScore?: number; // 0-1, higher = more undefined/unnamed pain point
  suggestedAngles?: string[]; // AI-suggested angles for this gap
}

/**
 * Semantic Gap - An unnamed pattern that represents an opportunity
 * These are clusters where:
 * - No single keyword dominates (word frequency spread)
 * - High coherence (semantically similar content)
 * - Multiple sources (cross-platform validation)
 */
export interface SemanticGap {
  clusterId: string;
  gapScore: number;
  coherence: number;
  sourceCount: number;
  sampleContent: string[];
  suggestedName?: string;
  contentOpportunity: string;
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
    // CRITICAL FIX: Ensure points is a valid array before iterating
    if (!points || !Array.isArray(points) || points.length === 0) {
      return 'General Insights';
    }

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
   * Generate AI-powered semantic theme for a cluster
   * Creates psychologically meaningful themes like "Coverage anxiety" or "Trust deficit"
   */
  async generateAITheme(points: DataPoint[]): Promise<string> {
    try {
      // CRITICAL FIX: Ensure points is a valid array before processing
      if (!points || !Array.isArray(points) || points.length === 0) {
        return 'General Insights';
      }

      // Get sample content for AI analysis
      const sampleContent = points
        .slice(0, 5)
        .filter(p => p && p.content) // Filter out null/undefined points
        .map(p => (p.content || '').substring(0, 200))
        .join('\n\n');

      const sources = [...new Set(points.map(p => p.source))].join(', ');

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.5',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at identifying psychological patterns in customer feedback. Generate a short, evocative theme name (2-4 words) that captures the emotional or behavioral pattern in the content. Examples: "Coverage anxiety", "Trust deficit", "Price sensitivity", "Quality expectations", "Service frustration", "Value seeking".'
            },
            {
              role: 'user',
              content: `Analyze these ${points.length} data points from ${sources} and generate a concise psychological theme name:\n\n${sampleContent}\n\nTheme name (2-4 words only):`
            }
          ],
          temperature: 0.3,
          max_tokens: 20
        }
      });

      if (error) throw error;

      const theme = data?.choices?.[0]?.message?.content?.trim() || this.generateTheme(points);
      return theme.replace(/["']/g, '');
    } catch (error) {
      console.warn('[Clustering] AI theme generation failed, using fallback:', error);
      return this.generateTheme(points);
    }
  }

  /**
   * Enhance all cluster themes with AI
   * Call this after clustering to get better theme names
   */
  async enhanceClusterThemes(clusters: InsightCluster[]): Promise<InsightCluster[]> {
    console.log(`[Clustering] Enhancing ${clusters.length} cluster themes with AI...`);

    const enhanced = await Promise.all(
      clusters.map(async (cluster) => {
        const aiTheme = await this.generateAITheme(cluster.dataPoints);
        return {
          ...cluster,
          theme: aiTheme
        };
      })
    );

    console.log(`[Clustering] ✅ Enhanced ${enhanced.length} cluster themes`);
    return enhanced;
  }

  // ============================================================================
  // Semantic Gap Detection
  // ============================================================================

  /**
   * Detect semantic gaps in clusters
   * A semantic gap is a cluster with high coherence but no dominant keyword
   * These represent UNNAMED pain points - goldmine for unique content
   */
  detectSemanticGaps(clusters: InsightCluster[]): InsightCluster[] {
    console.log(`[Clustering] Detecting semantic gaps in ${clusters.length} clusters...`);

    const enhancedClusters = clusters.map(cluster => {
      const gapAnalysis = this.analyzeClusterForGap(cluster);

      return {
        ...cluster,
        isSemanticGap: gapAnalysis.isGap,
        gapScore: gapAnalysis.gapScore,
      };
    });

    const gapCount = enhancedClusters.filter(c => c.isSemanticGap).length;
    console.log(`[Clustering] ✅ Found ${gapCount} semantic gaps (unnamed pain points)`);

    return enhancedClusters;
  }

  /**
   * Analyze a single cluster to determine if it's a semantic gap
   */
  private analyzeClusterForGap(cluster: InsightCluster): { isGap: boolean; gapScore: number } {
    if (!cluster.dataPoints || cluster.dataPoints.length < 3) {
      return { isGap: false, gapScore: 0 };
    }

    // 1. Calculate word frequency distribution
    const wordCounts = this.getWordFrequency(cluster.dataPoints);
    const wordEntries = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);

    if (wordEntries.length === 0) {
      return { isGap: false, gapScore: 0 };
    }

    // 2. Calculate concentration ratio (how dominant is top word vs others)
    const totalWords = wordEntries.reduce((sum, [, count]) => sum + count, 0);
    const topWordRatio = wordEntries[0][1] / totalWords;

    // If top word is < 15% of total, it's not dominant = potential gap
    const hasNoDominantKeyword = topWordRatio < 0.15;

    // 3. Check word distribution spread (entropy-like measure)
    const top5Ratio = wordEntries.slice(0, 5).reduce((sum, [, count]) => sum + count, 0) / totalWords;
    const isDistributed = top5Ratio < 0.5; // Top 5 words are less than 50%

    // 4. High coherence means semantically similar despite no keyword
    const hasHighCoherence = cluster.coherence > 0.6;

    // 5. Multiple sources indicates cross-platform validation
    const hasMultipleSources = cluster.sources.length >= 2;

    // Calculate gap score
    let gapScore = 0;

    if (hasNoDominantKeyword) gapScore += 0.35;
    if (isDistributed) gapScore += 0.25;
    if (hasHighCoherence) gapScore += 0.25;
    if (hasMultipleSources) gapScore += 0.15;

    // A semantic gap requires: no dominant keyword + high coherence
    const isGap = hasNoDominantKeyword && hasHighCoherence && gapScore >= 0.6;

    return { isGap, gapScore };
  }

  /**
   * Get word frequency for a set of data points
   */
  private getWordFrequency(points: DataPoint[]): Record<string, number> {
    const words: Record<string, number> = {};
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'just', 'and', 'but', 'or', 'if', 'because', 'while', 'although',
      'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you',
      'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them',
      'their', 'what', 'which', 'who', 'whom', 'can', 'get', 'like', 'know',
      'think', 'want', 'need', 'going', 'really', 'also', 'even', 'still',
    ]);

    for (const point of points) {
      if (!point.content) continue;

      const contentWords = point.content
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      for (const word of contentWords) {
        words[word] = (words[word] || 0) + 1;
      }
    }

    return words;
  }

  /**
   * Extract semantic gaps as actionable opportunities
   */
  extractSemanticGapOpportunities(clusters: InsightCluster[]): SemanticGap[] {
    const gaps = clusters.filter(c => c.isSemanticGap && c.gapScore && c.gapScore > 0.5);

    return gaps.map(cluster => ({
      clusterId: cluster.id,
      gapScore: cluster.gapScore || 0,
      coherence: cluster.coherence,
      sourceCount: cluster.sources.length,
      sampleContent: cluster.dataPoints.slice(0, 3).map(dp => dp.content.substring(0, 150)),
      suggestedName: cluster.theme,
      contentOpportunity: this.generateContentOpportunity(cluster),
    }));
  }

  /**
   * Generate content opportunity description for a semantic gap
   */
  private generateContentOpportunity(cluster: InsightCluster): string {
    const sourceList = cluster.sources.join(', ');
    const sentiment = cluster.dominantSentiment;

    if (sentiment === 'negative') {
      return `Unnamed frustration pattern across ${sourceList}. ${cluster.size} people discussing similar pain without a clear label. First to name this wins the narrative.`;
    } else if (sentiment === 'positive') {
      return `Emerging trend without category name across ${sourceList}. ${cluster.size} people excited about something they can't easily describe. Define the category.`;
    }

    return `Cross-platform pattern (${sourceList}) with ${cluster.size} data points. High semantic coherence suggests a real but unnamed phenomenon. Content opportunity: be first to give it a name.`;
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
