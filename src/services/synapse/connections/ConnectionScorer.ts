/**
 * Connection Scorer
 *
 * Calculates breakthrough potential scores for connections
 * based on multiple weighted factors:
 *
 * - Semantic similarity (30%)
 * - Unexpectedness (25%)
 * - Psychology involvement (15%)
 * - Competitive advantage (15%)
 * - Timeliness (10%)
 * - Three-way bonus (40% for 3-way connections)
 *
 * Created: 2025-11-10
 */

import {
  Connection,
  BreakthroughPotential,
  ExpectedImpact,
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  DataPoint
} from '../../../types/connections.types';
import { DeepContext } from '../../../types/deepContext.types';

export class ConnectionScorer {
  private weights: ScoringWeights;

  constructor(weights: Partial<ScoringWeights> = {}) {
    this.weights = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
  }

  /**
   * Score a connection and add breakthrough potential
   */
  scoreConnection(
    connection: Omit<Connection, 'breakthroughPotential'>,
    context?: DeepContext
  ): Connection {
    const breakthroughPotential = this.calculateBreakthroughPotential(connection, context);

    return {
      ...connection,
      breakthroughPotential
    };
  }

  /**
   * Calculate breakthrough potential score (0-100)
   */
  private calculateBreakthroughPotential(
    connection: Omit<Connection, 'breakthroughPotential'>,
    context?: DeepContext
  ): BreakthroughPotential {
    let score = 0;
    const reasoning: string[] = [];

    // 1. Semantic Similarity (30 points max)
    const similarityScore = connection.relationship.semanticSimilarity * 30;
    score += similarityScore * this.weights.semanticSimilarity;

    if (connection.relationship.semanticSimilarity >= 0.8) {
      reasoning.push(`Very high semantic similarity (${Math.round(connection.relationship.semanticSimilarity * 100)}%)`);
    } else if (connection.relationship.semanticSimilarity >= 0.7) {
      reasoning.push(`Strong semantic similarity (${Math.round(connection.relationship.semanticSimilarity * 100)}%)`);
    }

    // 2. Unexpectedness (25 points max)
    const unexpectednessScore = connection.relationship.unexpectedness * 25;
    score += unexpectednessScore * this.weights.unexpectedness;

    if (connection.relationship.unexpectedness >= 0.7) {
      reasoning.push('Highly unexpected connection (diverse sources/domains)');
    } else if (connection.relationship.unexpectedness >= 0.5) {
      reasoning.push('Moderately unexpected connection');
    }

    // 3. Psychology Involvement (15 points max)
    const psychologyScore = this.scorePsychology(connection);
    score += psychologyScore * this.weights.psychology;

    if (psychologyScore > 10) {
      reasoning.push('Addresses deep customer psychology or unarticulated needs');
    }

    // 4. Competitive Advantage (15 points max)
    const competitiveScore = this.scoreCompetitive(connection, context);
    score += competitiveScore * this.weights.competitive;

    if (competitiveScore > 10) {
      reasoning.push('Exploits competitor blind spot or weakness');
    }

    // 5. Timeliness (10 points max)
    const timelinessScore = this.scoreTimeliness(connection);
    score += timelinessScore * this.weights.timeliness;

    if (timelinessScore > 7) {
      reasoning.push('Time-sensitive opportunity (immediate action needed)');
    }

    // 6. Three-Way Bonus (40 points max)
    const isThreeWay = !!connection.sources.tertiary;
    if (isThreeWay) {
      const threeWayBonus = 40;
      score += threeWayBonus * this.weights.threeWay;
      reasoning.push('Three-way connection across independent sources (rare and valuable)');
    }

    // Normalize score to 0-100
    score = Math.min(Math.max(score, 0), 100);

    // Determine expected impact
    const expectedImpact = this.determineExpectedImpact(score, isThreeWay, connection);

    // Generate content angle
    const contentAngle = this.generateContentAngle(connection, expectedImpact);

    return {
      score: Math.round(score),
      reasoning,
      contentAngle,
      expectedImpact
    };
  }

  /**
   * Score psychology involvement (0-15)
   */
  private scorePsychology(connection: Omit<Connection, 'breakthroughPotential'>): number {
    let score = 0;

    const dataPoints = [
      connection.sources.primary,
      connection.sources.secondary,
      connection.sources.tertiary
    ].filter(dp => dp !== undefined) as DataPoint[];

    for (const dp of dataPoints) {
      // Pain points and unarticulated needs = high psychology
      if (dp.type === 'pain_point' || dp.type === 'unarticulated_need') {
        score += 5;
      }

      // Psychology domain = high score
      if (dp.metadata.domain === 'psychology') {
        score += 5;
      }

      // Questions often reveal psychology
      if (dp.type === 'question') {
        score += 3;
      }

      // Reddit and review data often contain psychology insights
      if (dp.source === 'reddit' || dp.source === 'outscraper') {
        score += 2;
      }
    }

    return Math.min(score, 15);
  }

  /**
   * Score competitive advantage (0-15)
   */
  private scoreCompetitive(
    connection: Omit<Connection, 'breakthroughPotential'>,
    context?: DeepContext
  ): number {
    let score = 0;

    const dataPoints = [
      connection.sources.primary,
      connection.sources.secondary,
      connection.sources.tertiary
    ].filter(dp => dp !== undefined) as DataPoint[];

    for (const dp of dataPoints) {
      // Keyword gaps = opportunity
      if (dp.type === 'keyword_gap') {
        score += 5;
      }

      // Competitor weakness
      if (dp.type === 'competitor_weakness') {
        score += 5;
      }

      // Competitive domain
      if (dp.metadata.domain === 'competitive') {
        score += 4;
      }

      // Low competition keywords
      if (dp.metadata.competition === 'low' && dp.metadata.volume && dp.metadata.volume > 100) {
        score += 3;
      }

      // SEMrush and Serper data often reveal competitive gaps
      if (dp.source === 'semrush' || dp.source === 'serper') {
        score += 2;
      }
    }

    // Bonus: If context shows this is a competitor blind spot
    if (context?.competitiveIntel?.blindSpots) {
      const connectionTopics = dataPoints.map(dp => dp.content.toLowerCase());
      const isBlindSpot = context.competitiveIntel.blindSpots.some(bs =>
        connectionTopics.some(topic => topic.includes(bs.topic.toLowerCase()))
      );

      if (isBlindSpot) {
        score += 5;
      }
    }

    return Math.min(score, 15);
  }

  /**
   * Score timeliness (0-10)
   */
  private scoreTimeliness(connection: Omit<Connection, 'breakthroughPotential'>): number {
    let score = 0;

    const dataPoints = [
      connection.sources.primary,
      connection.sources.secondary,
      connection.sources.tertiary
    ].filter(dp => dp !== undefined) as DataPoint[];

    for (const dp of dataPoints) {
      // Weather triggers = immediate timing
      if (dp.type === 'weather_trigger') {
        score += 5;
      }

      // News stories = timely
      if (dp.type === 'news_story' || dp.source === 'news') {
        score += 4;
      }

      // Trending topics
      if (dp.type === 'trending_topic') {
        score += 4;
      }

      // Timing metadata
      if (dp.metadata.timing === 'immediate') {
        score += 3;
      } else if (dp.metadata.timing === 'soon') {
        score += 2;
      }

      // Timing domain
      if (dp.metadata.domain === 'timing') {
        score += 3;
      }

      // TikTok and Google Trends = timely signals
      if (dp.source === 'tiktok' || dp.source === 'google_trends') {
        score += 2;
      }

      // Recent data points = more timely
      const age = Date.now() - dp.createdAt.getTime();
      const hoursOld = age / (1000 * 60 * 60);

      if (hoursOld < 24) {
        score += 2;
      } else if (hoursOld < 72) {
        score += 1;
      }
    }

    return Math.min(score, 10);
  }

  /**
   * Determine expected impact level
   */
  private determineExpectedImpact(
    score: number,
    isThreeWay: boolean,
    connection: Omit<Connection, 'breakthroughPotential'>
  ): ExpectedImpact {
    // Three-way connections with high scores = holy shit territory
    if (isThreeWay && score >= 85) {
      return 'holy shit';
    }

    if (score >= 80) {
      return 'high';
    }

    if (score >= 60) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate content angle based on connection
   */
  private generateContentAngle(
    connection: Omit<Connection, 'breakthroughPotential'>,
    expectedImpact: ExpectedImpact
  ): string {
    const { primary, secondary, tertiary } = connection.sources;

    // Extract key topics from content
    const extractTopic = (content: string): string => {
      // Simple extraction: first 3-5 words or until punctuation
      const words = content.split(/[\s,;.!?]+/).slice(0, 5).join(' ');
      return words.length > 50 ? words.substring(0, 47) + '...' : words;
    };

    const primaryTopic = extractTopic(primary.content);
    const secondaryTopic = extractTopic(secondary.content);

    // Three-way connection angles
    if (tertiary) {
      const tertiaryTopic = extractTopic(tertiary.content);

      // Timing + Psychology + Competitive = "Why X now"
      if (
        [primary, secondary, tertiary].some(dp => dp.metadata.domain === 'timing') &&
        [primary, secondary, tertiary].some(dp => dp.metadata.domain === 'psychology') &&
        [primary, secondary, tertiary].some(dp => dp.metadata.domain === 'competitive')
      ) {
        return `Why ${primaryTopic} matters RIGHT NOW - and what your competitors are missing`;
      }

      // Default three-way
      return `The hidden connection between ${primaryTopic}, ${secondaryTopic}, and ${tertiaryTopic}`;
    }

    // Two-way connection angles

    // Psychology + Competitive
    if (
      primary.metadata.domain === 'psychology' &&
      secondary.metadata.domain === 'competitive'
    ) {
      return `What customers really want from ${primaryTopic} (and why competitors miss it)`;
    }

    // Timing + Anything
    if (primary.metadata.domain === 'timing' || secondary.metadata.domain === 'timing') {
      return `${primaryTopic}: The opportunity window is closing`;
    }

    // Pain Point + Keyword Gap
    if (primary.type === 'pain_point' && secondary.type === 'keyword_gap') {
      return `Solving ${primaryTopic}: The content opportunity no one is talking about`;
    }

    // Default two-way
    return `The surprising connection between ${primaryTopic} and ${secondaryTopic}`;
  }

  /**
   * Batch score multiple connections
   */
  scoreConnections(
    connections: Array<Omit<Connection, 'breakthroughPotential'>>,
    context?: DeepContext
  ): Connection[] {
    return connections.map(connection => this.scoreConnection(connection, context));
  }

  /**
   * Update scoring weights
   */
  updateWeights(weights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Get current weights
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }
}
