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
   * Generate embeddings for multiple data points in batches
   */
  async embedDataPoints(dataPoints: DataPoint[]): Promise<DataPoint[]> {
    console.log(`[Embedding] Generating embeddings for ${dataPoints.length} data points...`);

    const BATCH_SIZE = 20;
    const embeddedPoints: DataPoint[] = [];

    for (let i = 0; i < dataPoints.length; i += BATCH_SIZE) {
      const batch = dataPoints.slice(i, i + BATCH_SIZE);

      const embeddings = await Promise.all(
        batch.map(async (dp) => {
          try {
            // Create rich text for embedding
            const text = this.createEmbeddingText(dp);
            const embedding = await this.generateEmbedding(text);
            return { ...dp, embedding };
          } catch (error) {
            console.warn(`[Embedding] Failed for ${dp.id}:`, error);
            return dp;
          }
        })
      );

      embeddedPoints.push(...embeddings);
      console.log(`[Embedding] Processed ${Math.min(i + BATCH_SIZE, dataPoints.length)}/${dataPoints.length}`);
    }

    const successCount = embeddedPoints.filter(dp => dp.embedding).length;
    console.log(`[Embedding] ✅ Generated ${successCount} embeddings`);

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
}

export const embeddingService = new EmbeddingService();
