/**
 * Three-Way Connection Finder
 *
 * Finds "holy shit" connections between THREE data points
 * from different sources. This is breakthrough territory.
 *
 * Example:
 * - Reddit: "Why can't I find a good roofer after storms?"
 * - SEMrush: "emergency roof repair" (low competition, high volume)
 * - Weather: "Severe storms forecast this weekend"
 *
 * = BREAKTHROUGH: Write "How to jump the roofer waiting list" content NOW
 *
 * Created: 2025-11-10
 */

import {
  DataPoint,
  Connection,
  ConnectionType,
  ConnectionDiscoveryOptions,
  DEFAULT_DISCOVERY_OPTIONS
} from '../../../types/connections.types';
import { SimilarityCalculator } from './SimilarityCalculator';
import { TwoWayConnectionCandidate } from './TwoWayConnectionFinder';

export interface ThreeWayConnectionCandidate {
  primary: DataPoint;
  secondary: DataPoint;
  tertiary: DataPoint;
  similarities: {
    primaryToSecondary: number;
    primaryToTertiary: number;
    secondaryToTertiary: number;
  };
  averageSimilarity: number;
  unexpectedness: number;
}

export class ThreeWayConnectionFinder {
  private similarityCalculator: SimilarityCalculator;

  constructor() {
    this.similarityCalculator = new SimilarityCalculator();
  }

  /**
   * Find three-way connections
   *
   * Strategy:
   * 1. Start with strong two-way connections
   * 2. For each two-way connection, find a third data point that connects to both
   * 3. Require all three to be from different sources
   * 4. Calculate triangle similarity (all three must be similar to each other)
   */
  findConnections(
    dataPoints: DataPoint[],
    twoWayConnections: TwoWayConnectionCandidate[],
    options: Partial<ConnectionDiscoveryOptions> = {}
  ): ThreeWayConnectionCandidate[] {
    const opts = { ...DEFAULT_DISCOVERY_OPTIONS, ...options };

    if (!opts.enableThreeWay) {
      console.log('[ThreeWayConnectionFinder] Three-way connections disabled');
      return [];
    }

    console.log(
      `[ThreeWayConnectionFinder] Searching for three-way connections from ${twoWayConnections.length} two-way connections...`
    );

    const threeWayConnections: ThreeWayConnectionCandidate[] = [];

    // For each strong two-way connection, try to find a third point
    for (const twoWay of twoWayConnections) {
      // Only consider strong two-way connections as foundation
      if (twoWay.similarity < 0.7) continue;

      const { primary, secondary } = twoWay;

      // Find candidates for the third point
      for (const tertiary of dataPoints) {
        // Must be different from both existing points
        if (tertiary.id === primary.id || tertiary.id === secondary.id) {
          continue;
        }

        // Must be from a third different source
        if (
          tertiary.source === primary.source ||
          tertiary.source === secondary.source
        ) {
          continue;
        }

        // Must have embedding
        if (!tertiary.embedding) {
          continue;
        }

        // Calculate similarities to both existing points
        const primaryToTertiary = this.similarityCalculator.calculateSimilarity(
          primary,
          tertiary
        );

        const secondaryToTertiary = this.similarityCalculator.calculateSimilarity(
          secondary,
          tertiary
        );

        // All three must be reasonably similar (lowered threshold for three-way)
        const minThreeWaySimilarity = 0.6;
        if (
          primaryToTertiary < minThreeWaySimilarity ||
          secondaryToTertiary < minThreeWaySimilarity
        ) {
          continue;
        }

        // Calculate average similarity across the triangle
        const averageSimilarity =
          (twoWay.similarity + primaryToTertiary + secondaryToTertiary) / 3;

        // Calculate unexpectedness
        const unexpectedness = this.calculateUnexpectedness(
          primary,
          secondary,
          tertiary,
          averageSimilarity
        );

        threeWayConnections.push({
          primary,
          secondary,
          tertiary,
          similarities: {
            primaryToSecondary: twoWay.similarity,
            primaryToTertiary,
            secondaryToTertiary
          },
          averageSimilarity,
          unexpectedness
        });
      }
    }

    console.log(
      `[ThreeWayConnectionFinder] Found ${threeWayConnections.length} three-way connections`
    );

    // Sort by breakthrough potential (average similarity * unexpectedness)
    const ranked = threeWayConnections.sort((a, b) => {
      const scoreA = a.averageSimilarity * 0.5 + a.unexpectedness * 0.5;
      const scoreB = b.averageSimilarity * 0.5 + b.unexpectedness * 0.5;
      return scoreB - scoreA;
    });

    // Three-way connections are rare and valuable - return top N
    return ranked.slice(0, 10);
  }

  /**
   * Calculate unexpectedness for three-way connections
   *
   * Three-way connections are inherently more unexpected because:
   * - Three different sources
   * - Three different domains (potentially)
   * - High average similarity despite diversity = GOLD
   */
  private calculateUnexpectedness(
    primary: DataPoint,
    secondary: DataPoint,
    tertiary: DataPoint,
    averageSimilarity: number
  ): number {
    let unexpectedness = 0.0;

    // Three different sources = 40 points (this is rare and valuable)
    const sources = [primary.source, secondary.source, tertiary.source];
    const uniqueSources = new Set(sources).size;
    if (uniqueSources === 3) {
      unexpectedness += 0.40;
    }

    // Three different domains = 30 points
    const domains = [
      primary.metadata.domain,
      secondary.metadata.domain,
      tertiary.metadata.domain
    ].filter(d => d !== undefined);

    if (domains.length === 3) {
      const uniqueDomains = new Set(domains).size;
      if (uniqueDomains === 3) {
        unexpectedness += 0.30;
      } else if (uniqueDomains === 2) {
        unexpectedness += 0.15;
      }
    }

    // High similarity despite diversity = 20 points
    // This is the "holy shit" signal - three diverse sources that are highly similar
    if (averageSimilarity >= 0.75 && uniqueSources === 3) {
      unexpectedness += 0.20;
    } else if (averageSimilarity >= 0.65 && uniqueSources === 3) {
      unexpectedness += 0.10;
    }

    // Timing + Psychology + Competitive = 10 points extra (holy grail combo)
    const hasTimingPsychologyCompetitive =
      domains.includes('timing') &&
      domains.includes('psychology') &&
      domains.includes('competitive');

    if (hasTimingPsychologyCompetitive) {
      unexpectedness += 0.10;
    }

    return Math.min(unexpectedness, 1.0);
  }

  /**
   * Generate explanation for three-way connection
   */
  generateExplanation(
    primary: DataPoint,
    secondary: DataPoint,
    tertiary: DataPoint,
    averageSimilarity: number
  ): string {
    const sourceName = (source: string) => {
      const names: Record<string, string> = {
        reddit: 'Reddit',
        semrush: 'SEO data',
        youtube: 'YouTube',
        serper: 'Search',
        news: 'News',
        weather: 'Weather',
        outscraper: 'Reviews',
        tiktok: 'TikTok',
        google_trends: 'Trends'
      };
      return names[source] || source;
    };

    const similarityPercent = Math.round(averageSimilarity * 100);

    let explanation = `Three-way breakthrough: `;
    explanation += `${sourceName(primary.source)} shows "${this.truncate(primary.content, 40)}", `;
    explanation += `${sourceName(secondary.source)} reveals "${this.truncate(secondary.content, 40)}", `;
    explanation += `and ${sourceName(tertiary.source)} indicates "${this.truncate(tertiary.content, 40)}". `;
    explanation += `These three independent sources converge (${similarityPercent}% similarity), `;
    explanation += `revealing a non-obvious opportunity that competitors will miss.`;

    return explanation;
  }

  /**
   * Generate content angle for three-way connection
   */
  generateContentAngle(
    primary: DataPoint,
    secondary: DataPoint,
    tertiary: DataPoint
  ): string {
    // Try to identify the pattern
    const sources = [primary.source, secondary.source, tertiary.source];
    const types = [primary.type, secondary.type, tertiary.type];

    // Pattern: Psychology + Competitive + Timing = "Why X now" angle
    if (
      types.includes('pain_point') &&
      types.includes('keyword_gap') &&
      (types.includes('weather_trigger') || types.includes('trending_topic'))
    ) {
      return this.generateTimingAngle(primary, secondary, tertiary);
    }

    // Pattern: Question + Competitor Weakness + Trend = "The truth about X" angle
    if (
      types.includes('question') &&
      types.includes('competitor_weakness') &&
      types.includes('trending_topic')
    ) {
      return this.generateTruthAngle(primary, secondary, tertiary);
    }

    // Pattern: Unarticulated Need + Search Intent + Cultural Moment = "The hidden X" angle
    if (
      types.includes('unarticulated_need') &&
      types.includes('search_intent') &&
      types.includes('news_story')
    ) {
      return this.generateHiddenAngle(primary, secondary, tertiary);
    }

    // Default: Combine all three insights
    return this.generateDefaultAngle(primary, secondary, tertiary);
  }

  /**
   * Generate "why X now" angle (timing-based)
   */
  private generateTimingAngle(p: DataPoint, s: DataPoint, t: DataPoint): string {
    return `Why [topic] matters right now - and what to do about it (timely breakthrough)`;
  }

  /**
   * Generate "truth about X" angle (myth-busting)
   */
  private generateTruthAngle(p: DataPoint, s: DataPoint, t: DataPoint): string {
    return `The truth about [topic] that competitors won't tell you (competitive advantage)`;
  }

  /**
   * Generate "hidden X" angle (revealing insight)
   */
  private generateHiddenAngle(p: DataPoint, s: DataPoint, t: DataPoint): string {
    return `The hidden [insight] behind [topic] (unarticulated need addressed)`;
  }

  /**
   * Generate default angle
   */
  private generateDefaultAngle(p: DataPoint, s: DataPoint, t: DataPoint): string {
    return `[topic] - Three signals converge to reveal breakthrough opportunity`;
  }

  /**
   * Convert candidate to full Connection object
   */
  toConnection(
    candidate: ThreeWayConnectionCandidate,
    connectionId: string
  ): Omit<Connection, 'breakthroughPotential'> {
    return {
      id: connectionId,
      type: 'cross_domain', // Three-way are always cross-domain
      sources: {
        primary: candidate.primary,
        secondary: candidate.secondary,
        tertiary: candidate.tertiary
      },
      relationship: {
        semanticSimilarity: candidate.averageSimilarity,
        unexpectedness: candidate.unexpectedness,
        strength: candidate.averageSimilarity >= 0.7 ? 'strong' : 'moderate',
        explanation: this.generateExplanation(
          candidate.primary,
          candidate.secondary,
          candidate.tertiary,
          candidate.averageSimilarity
        )
      },
      discoveredAt: new Date(),
      confidence: candidate.averageSimilarity * 0.6 + candidate.unexpectedness * 0.4
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
