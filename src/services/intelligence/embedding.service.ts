/**
 * Embedding Service
 *
 * Generates OpenAI embeddings for data points to enable semantic clustering
 * and connection discovery across multiple data sources.
 */

import type { DataPoint } from '@/types/connections.types';

interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

class EmbeddingService {
  private readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly EMBEDDING_DIMENSIONS = 1536;

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        provider: 'openai',
        endpoint: 'embeddings',
        model: this.EMBEDDING_MODEL,
        input: text.substring(0, 8000) // Token limit safety
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embedding error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts in a SINGLE API call
   * OpenAI supports batch embedding - send array of texts, get array of embeddings
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        provider: 'openai',
        endpoint: 'embeddings',
        model: this.EMBEDDING_MODEL,
        input: texts.map(t => t.substring(0, 8000)) // OpenAI accepts array of strings
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch embedding error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    // OpenAI returns embeddings in same order as input
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  }

  /**
   * Generate embeddings for multiple data points in batches
   * OPTIMIZED: Uses batch API (100 texts per call instead of 1)
   */
  async embedDataPoints(dataPoints: DataPoint[]): Promise<DataPoint[]> {
    console.log(`[Embedding] Generating embeddings for ${dataPoints.length} data points...`);
    const startTime = Date.now();

    // INCREASED batch size from 20 to 100 - OpenAI handles this easily
    const BATCH_SIZE = 100;
    const embeddedPoints: DataPoint[] = [];

    for (let i = 0; i < dataPoints.length; i += BATCH_SIZE) {
      const batch = dataPoints.slice(i, i + BATCH_SIZE);

      try {
        // Create text for each data point
        const texts = batch.map(dp => this.createEmbeddingText(dp));

        // SINGLE API call for entire batch instead of 100 separate calls!
        const embeddings = await this.generateBatchEmbeddings(texts);

        // Merge embeddings back into data points
        batch.forEach((dp, idx) => {
          embeddedPoints.push({
            ...dp,
            embedding: embeddings[idx]
          });
        });

        console.log(`[Embedding] Batch ${Math.ceil((i + BATCH_SIZE) / BATCH_SIZE)}/${Math.ceil(dataPoints.length / BATCH_SIZE)} complete`);
      } catch (error) {
        console.warn(`[Embedding] Batch failed, falling back to individual:`, error);
        // Fallback to individual if batch fails
        for (const dp of batch) {
          try {
            const text = this.createEmbeddingText(dp);
            const embedding = await this.generateEmbedding(text);
            embeddedPoints.push({ ...dp, embedding });
          } catch (e) {
            embeddedPoints.push(dp);
          }
        }
      }
    }

    const successCount = embeddedPoints.filter(dp => dp.embedding).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Embedding] ✅ Generated ${successCount} embeddings in ${elapsed}s`);

    return embeddedPoints;
  }

  /**
   * Create rich text representation for embedding
   */
  private createEmbeddingText(dp: DataPoint): string {
    const parts = [dp.content];

    if (dp.metadata?.sentiment) {
      parts.push(`Sentiment: ${dp.metadata.sentiment}`);
    }
    if (dp.metadata?.domain) {
      parts.push(`Domain: ${dp.metadata.domain}`);
    }
    if (dp.source) {
      parts.push(`Source: ${dp.source}`);
    }
    if (dp.type) {
      parts.push(`Type: ${dp.type}`);
    }

    return parts.join(' | ');
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find similar data points based on embedding similarity
   */
  findSimilar(
    target: DataPoint,
    candidates: DataPoint[],
    threshold: number = 0.7,
    maxResults: number = 10
  ): Array<{ dataPoint: DataPoint; similarity: number }> {
    if (!target.embedding) return [];

    const similarities = candidates
      .filter(dp => dp.embedding && dp.id !== target.id)
      .map(dp => ({
        dataPoint: dp,
        similarity: this.cosineSimilarity(target.embedding!, dp.embedding!)
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);

    return similarities;
  }

  /**
   * Cluster data points by semantic similarity using greedy clustering
   * Groups signals with similarity > threshold into clusters
   * Each cluster with 2+ different sources = correlated insight
   */
  clusterBySemanticSimilarity(
    dataPoints: DataPoint[],
    threshold: number = 0.75
  ): SignalCluster[] {
    console.log(`[Embedding] Clustering ${dataPoints.length} data points with threshold ${threshold}...`);
    const startTime = Date.now();

    // Filter to only points with embeddings
    const embeddedPoints = dataPoints.filter(dp => dp.embedding && dp.embedding.length > 0);
    if (embeddedPoints.length < 2) {
      console.log(`[Embedding] Not enough embedded points to cluster`);
      return [];
    }

    const clusters: SignalCluster[] = [];
    const assigned = new Set<string>();

    // Greedy clustering: for each unassigned point, find all similar points
    for (const point of embeddedPoints) {
      if (assigned.has(point.id)) continue;

      // Find all similar points above threshold
      const similar = embeddedPoints
        .filter(other => !assigned.has(other.id) && other.id !== point.id)
        .map(other => ({
          point: other,
          similarity: this.cosineSimilarity(point.embedding!, other.embedding!)
        }))
        .filter(s => s.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity);

      if (similar.length > 0) {
        // Create cluster with seed point + similar points
        const clusterPoints = [point, ...similar.map(s => s.point)];
        const sources = [...new Set(clusterPoints.map(p => p.source))];
        const avgSimilarity = similar.reduce((sum, s) => sum + s.similarity, 0) / similar.length;

        // Only keep clusters with 2+ different sources (cross-source validation)
        if (sources.length >= 2) {
          const clusterId = `cluster_${clusters.length + 1}`;
          clusters.push({
            id: clusterId,
            signals: clusterPoints,
            sources,
            avgSimilarity,
            signalCount: clusterPoints.length,
            representativeContent: this.extractRepresentativeContent(clusterPoints),
          });

          // Mark all points as assigned
          clusterPoints.forEach(p => assigned.add(p.id));
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Embedding] ✅ Found ${clusters.length} clusters in ${elapsed}s`);
    console.log(`[Embedding] Clusters by source diversity: ${clusters.map(c => `${c.sources.length} sources`).join(', ')}`);

    return clusters.sort((a, b) => b.signalCount - a.signalCount);
  }

  /**
   * Extract representative content from cluster for display
   */
  private extractRepresentativeContent(points: DataPoint[]): string {
    // Use the point with highest relevance/certainty as representative
    const sorted = [...points].sort((a, b) => {
      const aScore = (a.metadata?.relevance || 0) + (a.metadata?.certainty || 0);
      const bScore = (b.metadata?.relevance || 0) + (b.metadata?.certainty || 0);
      return bScore - aScore;
    });
    return sorted[0]?.content || '';
  }
}

// Signal Cluster type for clustering output
export interface SignalCluster {
  id: string;
  signals: DataPoint[];
  sources: string[];
  avgSimilarity: number;
  signalCount: number;
  representativeContent: string;
}

export const embeddingService = new EmbeddingService();
