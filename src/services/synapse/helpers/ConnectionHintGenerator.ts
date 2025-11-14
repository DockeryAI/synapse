/**
 * Connection Hint Generator
 *
 * Uses embeddings to find non-obvious semantic connections across data sources
 * Returns "hints" for Sonnet to expand on, not complete connections
 */

import { EmbeddingService } from '../connections/EmbeddingService';

export interface DataSource {
  type: 'weather' | 'event' | 'review' | 'trend' | 'keyword' | 'social' | 'news';
  text: string;
  metadata?: any;
}

export interface ConnectionHint {
  similarity: number; // 0-1 cosine similarity
  sourceA: DataSource;
  sourceB: DataSource;
  hint: string; // Brief description for Sonnet
  unexpectedness: number; // 0-1, higher = more unexpected connection
  actionable: boolean;
}

export interface ConnectionHintResult {
  hints: ConnectionHint[];
  totalComparisons: number;
  averageSimilarity: number;
  processingTimeMs: number;
  cost: number;
}

/**
 * Generate connection hints from multiple data sources
 */
export async function generateConnectionHints(
  dataSources: DataSource[],
  options: {
    minSimilarity?: number;
    maxHints?: number;
    prioritizeCrossDomain?: boolean;
  } = {}
): Promise<ConnectionHintResult> {
  const startTime = Date.now();

  const {
    minSimilarity = 0.65, // Only show moderately similar or higher
    maxHints = 5,
    prioritizeCrossDomain = true // Prefer connections across different types
  } = options;

  console.log(`[ConnectionHints] Analyzing ${dataSources.length} data sources...`);

  // Initialize embedding service
  const embeddingService = new EmbeddingService();

  // Extract texts for embedding
  const texts = dataSources.map(ds => ds.text);

  // Generate embeddings
  const embeddingResponse = await embeddingService.createEmbeddings({ texts });
  const embeddings = embeddingResponse.embeddings;

  console.log(`[ConnectionHints] Generated ${embeddings.length} embeddings, cost: $${embeddingResponse.cost.toFixed(4)}`);

  // Find connections via cosine similarity
  const potentialHints: ConnectionHint[] = [];
  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < dataSources.length; i++) {
    for (let j = i + 1; j < dataSources.length; j++) {
      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      comparisons++;
      totalSimilarity += similarity;

      // Only consider above threshold
      if (similarity >= minSimilarity) {
        const sourceA = dataSources[i];
        const sourceB = dataSources[j];

        // Calculate unexpectedness (cross-domain = more unexpected)
        const unexpectedness = sourceA.type !== sourceB.type
          ? 0.8 + (similarity - minSimilarity) * 0.2
          : 0.3 + (similarity - minSimilarity) * 0.2;

        // Generate hint
        const hint = generateHintText(sourceA, sourceB, similarity);

        // Check if actionable (requires temporal or specific elements)
        const actionable = isActionable(sourceA, sourceB);

        potentialHints.push({
          similarity,
          sourceA,
          sourceB,
          hint,
          unexpectedness,
          actionable
        });
      }
    }
  }

  // Sort by relevance
  potentialHints.sort((a, b) => {
    // Prioritize cross-domain connections if requested
    if (prioritizeCrossDomain) {
      const aCrossDomain = a.sourceA.type !== a.sourceB.type;
      const bCrossDomain = b.sourceA.type !== b.sourceB.type;
      if (aCrossDomain !== bCrossDomain) {
        return bCrossDomain ? 1 : -1;
      }
    }

    // Then by unexpectedness
    if (Math.abs(a.unexpectedness - b.unexpectedness) > 0.1) {
      return b.unexpectedness - a.unexpectedness;
    }

    // Then by similarity
    return b.similarity - a.similarity;
  });

  // Take top hints
  const topHints = potentialHints.slice(0, maxHints);

  const processingTimeMs = Date.now() - startTime;
  const averageSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;

  console.log(`[ConnectionHints] Found ${topHints.length} hints in ${processingTimeMs}ms`);
  console.log(`[ConnectionHints] Average similarity: ${averageSimilarity.toFixed(3)}`);

  return {
    hints: topHints,
    totalComparisons: comparisons,
    averageSimilarity,
    processingTimeMs,
    cost: embeddingResponse.cost
  };
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Generate human-readable hint text
 */
function generateHintText(sourceA: DataSource, sourceB: DataSource, similarity: number): string {
  const cleanA = cleanText(sourceA.text);
  const cleanB = cleanText(sourceB.text);

  // Format based on types
  const typeA = formatSourceType(sourceA.type);
  const typeB = formatSourceType(sourceB.type);

  if (sourceA.type === sourceB.type) {
    return `${typeA}: "${cleanA}" + "${cleanB}" (${Math.round(similarity * 100)}% similar)`;
  } else {
    return `${typeA}: "${cleanA}" ↔ ${typeB}: "${cleanB}"`;
  }
}

/**
 * Clean text for display
 */
function cleanText(text: string): string {
  // Truncate long text
  if (text.length > 80) {
    return text.substring(0, 77) + '...';
  }
  return text;
}

/**
 * Format source type for display
 */
function formatSourceType(type: string): string {
  const typeMap: { [key: string]: string } = {
    weather: 'Weather',
    event: 'Local Event',
    review: 'Customer Review',
    trend: 'Trend',
    keyword: 'Search Keyword',
    social: 'Social Media',
    news: 'Industry News'
  };
  return typeMap[type] || type;
}

/**
 * Check if connection is actionable (has timing or specificity)
 */
function isActionable(sourceA: DataSource, sourceB: DataSource): boolean {
  // Temporal connections are actionable
  if (sourceA.type === 'weather' || sourceB.type === 'weather') return true;
  if (sourceA.type === 'event' || sourceB.type === 'event') return true;

  // Trend + Review = actionable
  if (
    (sourceA.type === 'trend' && sourceB.type === 'review') ||
    (sourceA.type === 'review' && sourceB.type === 'trend')
  ) return true;

  return false;
}

/**
 * Format connection hints for Sonnet prompt
 */
export function formatHintsForPrompt(result: ConnectionHintResult): string {
  if (result.hints.length === 0) {
    return '### Connection Hints\n\nNo strong semantic connections detected.\n';
  }

  let output = '### Connection Hints (Semantic Similarities)\n\n';
  output += `Found ${result.hints.length} unexpected connections across data sources:\n\n`;

  for (let i = 0; i < result.hints.length; i++) {
    const hint = result.hints[i];
    const icon = hint.actionable ? '⚡' : '💡';

    output += `${i + 1}. ${icon} ${hint.hint}\n`;
    output += `   *Unexpectedness*: ${Math.round(hint.unexpectedness * 100)}% | *Similarity*: ${Math.round(hint.similarity * 100)}%\n`;

    if (i < result.hints.length - 1) {
      output += '\n';
    }
  }

  output += '\n**Use these hints to create synapse content that competitors would never think of.**\n';

  return output;
}

/**
 * Helper: Create data sources from business intelligence
 */
export function createDataSourcesFromIntelligence(intelligence: any): DataSource[] {
  const sources: DataSource[] = [];

  // Weather signals
  if (intelligence.realTimeSignals?.weather?.triggers) {
    for (const trigger of intelligence.realTimeSignals.weather.triggers) {
      sources.push({
        type: 'weather',
        text: `${trigger.type}: ${trigger.description}`,
        metadata: trigger
      });
    }
  }

  // Local events
  if (intelligence.localIntelligence?.localEvents) {
    for (const event of intelligence.localIntelligence.localEvents) {
      sources.push({
        type: 'event',
        text: `${event.title} - ${event.date}`,
        metadata: event
      });
    }
  }

  // Review pain points
  if (intelligence.reviewData?.painPoints) {
    for (const painPoint of intelligence.reviewData.painPoints.slice(0, 5)) {
      sources.push({
        type: 'review',
        text: painPoint.concern || painPoint,
        metadata: painPoint
      });
    }
  }

  // Trending topics
  if (intelligence.culturalSnapshot?.trendingTopics) {
    for (const topic of intelligence.culturalSnapshot.trendingTopics.slice(0, 5)) {
      sources.push({
        type: 'trend',
        text: topic.term || topic,
        metadata: topic
      });
    }
  }

  // Search keywords
  if (intelligence.searchData?.opportunityKeywords) {
    for (const keyword of intelligence.searchData.opportunityKeywords.slice(0, 5)) {
      sources.push({
        type: 'keyword',
        text: keyword.keyword || keyword,
        metadata: keyword
      });
    }
  }

  // Social insights
  if (intelligence.realTimeSignals?.socialBuzz) {
    for (const buzz of intelligence.realTimeSignals.socialBuzz.slice(0, 3)) {
      sources.push({
        type: 'social',
        text: buzz.topic || buzz,
        metadata: buzz
      });
    }
  }

  console.log(`[ConnectionHints] Created ${sources.length} data sources from intelligence`);

  return sources;
}
