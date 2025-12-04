/**
 * Two-Way Connection Finder
 *
 * Finds semantic connections between pairs of data points
 * from different sources using embedding similarity
 *
 * Created: 2025-11-10
 */

import {
  DataPoint,
  Connection,
  ConnectionType,
  ConnectionStrength,
  ConnectionDiscoveryOptions,
  DEFAULT_DISCOVERY_OPTIONS
} from '../../../types/connections.types';
import { SimilarityCalculator } from './SimilarityCalculator';

export interface TwoWayConnectionCandidate {
  primary: DataPoint;
  secondary: DataPoint;
  similarity: number;
  unexpectedness: number;
}

export class TwoWayConnectionFinder {
  private similarityCalculator: SimilarityCalculator;

  constructor() {
    this.similarityCalculator = new SimilarityCalculator();
  }

  /**
   * Find all two-way connections between data points
   */
  findConnections(
    dataPoints: DataPoint[],
    options: Partial<ConnectionDiscoveryOptions> = {}
  ): TwoWayConnectionCandidate[] {
    const opts = { ...DEFAULT_DISCOVERY_OPTIONS, ...options };
    const connections: TwoWayConnectionCandidate[] = [];

    console.log(`[TwoWayConnectionFinder] Analyzing ${dataPoints.length} data points...`);

    // Compare all pairs of data points
    for (let i = 0; i < dataPoints.length; i++) {
      for (let j = i + 1; j < dataPoints.length; j++) {
        const primary = dataPoints[i];
        const secondary = dataPoints[j];

        // Skip if same source and we require different sources
        if (opts.requireDifferentSources && primary.source === secondary.source) {
          continue;
        }

        // Check if both have embeddings
        if (!primary.embedding || !secondary.embedding) {
          continue;
        }

        // Calculate similarity
        const similarity = this.similarityCalculator.calculateSimilarity(primary, secondary);

        // Skip if below threshold
        if (similarity < opts.minSimilarity!) {
          continue;
        }

        // Calculate unexpectedness
        const unexpectedness = this.calculateUnexpectedness(primary, secondary, similarity);

        connections.push({
          primary,
          secondary,
          similarity,
          unexpectedness
        });
      }
    }

    console.log(`[TwoWayConnectionFinder] Found ${connections.length} two-way connections`);

    // Sort by similarity * unexpectedness (best = high similarity + high unexpectedness)
    const ranked = connections.sort((a, b) => {
      const scoreA = a.similarity * 0.6 + a.unexpectedness * 0.4;
      const scoreB = b.similarity * 0.6 + b.unexpectedness * 0.4;
      return scoreB - scoreA;
    });

    // Limit per source pair if configured
    if (opts.maxPerPair && opts.maxPerPair > 0) {
      return this.limitPerSourcePair(ranked, opts.maxPerPair);
    }

    return ranked;
  }

  /**
   * Calculate how unexpected this connection is
   *
   * More unexpected = higher score
   * Factors:
   * - Different data sources (Reddit + SEMrush = more unexpected than Reddit + Reddit)
   * - Different domains (psychology + competitive = more unexpected than psychology + psychology)
   * - Different types (pain_point + keyword_gap = more unexpected than pain_point + pain_point)
   */
  private calculateUnexpectedness(
    primary: DataPoint,
    secondary: DataPoint,
    similarity: number
  ): number {
    let unexpectedness = 0;

    // Different sources (30 points)
    if (primary.source !== secondary.source) {
      unexpectedness += 0.30;

      // Extra points for particularly diverse sources
      const diverseSources = [
        ['reddit', 'semrush'],
        ['reddit', 'weather'],
        ['tiktok', 'serper'],
        ['news', 'outscraper']
      ];

      const isDiverse = diverseSources.some(
        pair =>
          (pair.includes(primary.source) && pair.includes(secondary.source))
      );

      if (isDiverse) {
        unexpectedness += 0.10;
      }
    }

    // Different domains (30 points)
    if (primary.metadata.domain && secondary.metadata.domain) {
      if (primary.metadata.domain !== secondary.metadata.domain) {
        unexpectedness += 0.30;

        // Extra points for cross-domain connections
        const crossDomainPairs = [
          ['psychology', 'competitive'],
          ['psychology', 'timing'],
          ['competitive', 'timing']
        ];

        const isCrossDomain = crossDomainPairs.some(
          pair =>
            (pair.includes(primary.metadata.domain!) && pair.includes(secondary.metadata.domain!))
        );

        if (isCrossDomain) {
          unexpectedness += 0.10;
        }
      }
    }

    // Different types (20 points)
    if (primary.type !== secondary.type) {
      unexpectedness += 0.20;
    }

    // High similarity despite differences = very unexpected (10 points)
    // Example: Two completely different sources with 0.9+ similarity = gold
    if (similarity >= 0.85 && primary.source !== secondary.source) {
      unexpectedness += 0.10;
    }

    return Math.min(unexpectedness, 1.0);
  }

  /**
   * Determine connection type based on characteristics
   */
  private determineConnectionType(
    primary: DataPoint,
    secondary: DataPoint
  ): ConnectionType {
    // Cross-domain: Different domains
    if (
      primary.metadata.domain &&
      secondary.metadata.domain &&
      primary.metadata.domain !== secondary.metadata.domain
    ) {
      return 'cross_domain';
    }

    // Temporal: Both have timing metadata
    if (primary.metadata.timing && secondary.metadata.timing) {
      return 'temporal';
    }

    // Causal: Look for cause-effect patterns
    const causalKeywords = [
      'because', 'therefore', 'as a result', 'leads to',
      'causes', 'due to', 'since', 'why'
    ];

    const hasCausalLanguage =
      causalKeywords.some(kw => primary.content.toLowerCase().includes(kw)) ||
      causalKeywords.some(kw => secondary.content.toLowerCase().includes(kw));

    if (hasCausalLanguage) {
      return 'causal';
    }

    // Contradictory: Opposite sentiment or contradicting statements
    if (
      primary.metadata.sentiment &&
      secondary.metadata.sentiment &&
      ((primary.metadata.sentiment === 'positive' && secondary.metadata.sentiment === 'negative') ||
       (primary.metadata.sentiment === 'negative' && secondary.metadata.sentiment === 'positive'))
    ) {
      return 'contradictory';
    }

    // Default to cross-domain if sources are different
    return primary.source !== secondary.source ? 'cross_domain' : 'causal';
  }

  /**
   * Determine connection strength
   */
  private determineStrength(similarity: number, unexpectedness: number): ConnectionStrength {
    const score = similarity * 0.6 + unexpectedness * 0.4;

    if (score >= 0.8) return 'strong';
    if (score >= 0.6) return 'moderate';
    return 'weak';
  }

  /**
   * Generate human-readable explanation
   */
  generateExplanation(primary: DataPoint, secondary: DataPoint, similarity: number): string {
    const sourceName = (source: string) => {
      const names: Record<string, string> = {
        reddit: 'Reddit discussions',
        semrush: 'SEO data',
        youtube: 'YouTube content',
        serper: 'search results',
        news: 'news coverage',
        weather: 'weather data',
        outscraper: 'local business reviews',
        tiktok: 'TikTok trends',
        google_trends: 'Google Trends'
      };
      return names[source] || source;
    };

    const similarityPercent = Math.round(similarity * 100);

    let explanation = `${sourceName(primary.source)} reveals "${this.truncate(primary.content, 60)}" `;
    explanation += `while ${sourceName(secondary.source)} shows "${this.truncate(secondary.content, 60)}" `;
    explanation += `(${similarityPercent}% semantic similarity). `;

    // Add insight based on connection type
    if (primary.metadata.domain && secondary.metadata.domain) {
      if (primary.metadata.domain !== secondary.metadata.domain) {
        explanation += `This cross-domain connection between ${primary.metadata.domain} and ${secondary.metadata.domain} reveals a non-obvious opportunity.`;
      }
    }

    return explanation;
  }

  /**
   * Limit connections per source pair to prevent over-representation
   */
  private limitPerSourcePair(
    connections: TwoWayConnectionCandidate[],
    maxPerPair: number
  ): TwoWayConnectionCandidate[] {
    const pairCounts = new Map<string, number>();
    const limited: TwoWayConnectionCandidate[] = [];

    for (const connection of connections) {
      const pairKey = [connection.primary.source, connection.secondary.source]
        .sort()
        .join('::');

      const count = pairCounts.get(pairKey) || 0;

      if (count < maxPerPair) {
        limited.push(connection);
        pairCounts.set(pairKey, count + 1);
      }
    }

    return limited;
  }

  /**
   * Convert candidate to full Connection object
   */
  toConnection(
    candidate: TwoWayConnectionCandidate,
    connectionId: string
  ): Omit<Connection, 'breakthroughPotential'> {
    return {
      id: connectionId,
      type: this.determineConnectionType(candidate.primary, candidate.secondary),
      sources: {
        primary: candidate.primary,
        secondary: candidate.secondary
      },
      relationship: {
        semanticSimilarity: candidate.similarity,
        unexpectedness: candidate.unexpectedness,
        strength: this.determineStrength(candidate.similarity, candidate.unexpectedness),
        explanation: this.generateExplanation(
          candidate.primary,
          candidate.secondary,
          candidate.similarity
        )
      },
      discoveredAt: new Date(),
      confidence: candidate.similarity * 0.7 + candidate.unexpectedness * 0.3
    };
  }

  /**
   * Truncate text for display
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
