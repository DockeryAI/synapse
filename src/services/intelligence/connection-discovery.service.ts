/**
 * Connection Discovery Engine
 *
 * Finds two-way, three-way, and four-way connections between data points
 * across different sources to generate breakthrough content angles.
 */

import type { DataPoint } from '@/types/connections.types';
import { embeddingService } from './embedding.service';
import type { InsightCluster } from './clustering.service';

export interface Connection {
  id: string;
  dataPoints: DataPoint[];
  sources: string[];
  connectionType: '2-way' | '3-way' | '4-way';
  breakthroughScore: number; // 0-100
  angle: string;
  reasoning: string;
  themes: string[];
  timingRelevance: number; // 0-1
  emotionalIntensity: number; // 0-1
}

export interface BreakthroughAngle {
  id: string;
  title: string;
  hook: string;
  connections: Connection[];
  score: number;
  provenance: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

class ConnectionDiscoveryService {
  private readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  /**
   * Discover all connections in data points
   */
  async discoverConnections(
    dataPoints: DataPoint[],
    clusters: InsightCluster[]
  ): Promise<{
    twoWay: Connection[];
    threeWay: Connection[];
    fourWay: Connection[];
    breakthroughs: BreakthroughAngle[];
  }> {
    console.log(`[ConnectionDiscovery] Analyzing ${dataPoints.length} data points...`);

    // Find two-way connections
    const twoWay = this.findTwoWayConnections(dataPoints);
    console.log(`[ConnectionDiscovery] Found ${twoWay.length} two-way connections`);

    // Find three-way connections
    const threeWay = this.findThreeWayConnections(dataPoints, twoWay);
    console.log(`[ConnectionDiscovery] Found ${threeWay.length} three-way connections`);

    // Find four-way connections
    const fourWay = this.findFourWayConnections(dataPoints, threeWay);
    console.log(`[ConnectionDiscovery] Found ${fourWay.length} four-way connections`);

    // Generate breakthrough angles from top connections
    const breakthroughs = await this.generateBreakthroughAngles([
      ...fourWay.slice(0, 3),
      ...threeWay.slice(0, 5),
      ...twoWay.slice(0, 10)
    ]);

    console.log(`[ConnectionDiscovery] ✅ Generated ${breakthroughs.length} breakthrough angles`);

    return { twoWay, threeWay, fourWay, breakthroughs };
  }

  /**
   * Find two-way connections between different sources
   */
  private findTwoWayConnections(dataPoints: DataPoint[]): Connection[] {
    const connections: Connection[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < dataPoints.length; i++) {
      for (let j = i + 1; j < dataPoints.length; j++) {
        const dp1 = dataPoints[i];
        const dp2 = dataPoints[j];

        // Skip same source
        if (dp1.source === dp2.source) continue;

        // Calculate similarity
        const similarity = dp1.embedding && dp2.embedding
          ? embeddingService.cosineSimilarity(dp1.embedding, dp2.embedding)
          : this.textSimilarity(dp1.content, dp2.content);

        if (similarity < 0.5) continue;

        const key = [dp1.id, dp2.id].sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);

        const score = this.calculateBreakthroughScore([dp1, dp2], similarity);

        if (score > 50) {
          connections.push({
            id: `conn-2-${connections.length}`,
            dataPoints: [dp1, dp2],
            sources: [dp1.source, dp2.source],
            connectionType: '2-way',
            breakthroughScore: score,
            angle: this.generateAngle([dp1, dp2]),
            reasoning: `${dp1.source} insight connects with ${dp2.source} data`,
            themes: this.extractThemes([dp1, dp2]),
            timingRelevance: this.calculateTimingRelevance([dp1, dp2]),
            emotionalIntensity: this.calculateEmotionalIntensity([dp1, dp2])
          });
        }
      }
    }

    return connections.sort((a, b) => b.breakthroughScore - a.breakthroughScore);
  }

  /**
   * Find three-way connections
   */
  private findThreeWayConnections(
    dataPoints: DataPoint[],
    twoWay: Connection[]
  ): Connection[] {
    const connections: Connection[] = [];
    const seen = new Set<string>();

    for (const conn of twoWay.slice(0, 50)) {
      for (const dp of dataPoints) {
        // Must be different source
        if (conn.sources.includes(dp.source)) continue;

        // Check similarity with both points
        const sim1 = conn.dataPoints[0].embedding && dp.embedding
          ? embeddingService.cosineSimilarity(conn.dataPoints[0].embedding, dp.embedding)
          : this.textSimilarity(conn.dataPoints[0].content, dp.content);

        const sim2 = conn.dataPoints[1].embedding && dp.embedding
          ? embeddingService.cosineSimilarity(conn.dataPoints[1].embedding, dp.embedding)
          : this.textSimilarity(conn.dataPoints[1].content, dp.content);

        const avgSim = (sim1 + sim2) / 2;
        if (avgSim < 0.45) continue;

        const allPoints = [...conn.dataPoints, dp];
        const key = allPoints.map(p => p.id).sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);

        const score = this.calculateBreakthroughScore(allPoints, avgSim);

        if (score > 65) {
          connections.push({
            id: `conn-3-${connections.length}`,
            dataPoints: allPoints,
            sources: [...conn.sources, dp.source],
            connectionType: '3-way',
            breakthroughScore: score,
            angle: this.generateAngle(allPoints),
            reasoning: `Three-source validation: ${allPoints.map(p => p.source).join(' + ')}`,
            themes: this.extractThemes(allPoints),
            timingRelevance: this.calculateTimingRelevance(allPoints),
            emotionalIntensity: this.calculateEmotionalIntensity(allPoints)
          });
        }
      }
    }

    return connections.sort((a, b) => b.breakthroughScore - a.breakthroughScore);
  }

  /**
   * Find four-way connections
   */
  private findFourWayConnections(
    dataPoints: DataPoint[],
    threeWay: Connection[]
  ): Connection[] {
    const connections: Connection[] = [];
    const seen = new Set<string>();

    for (const conn of threeWay.slice(0, 20)) {
      for (const dp of dataPoints) {
        // Must be different source
        if (conn.sources.includes(dp.source)) continue;

        // Check similarity with all points
        const similarities = conn.dataPoints.map(p =>
          p.embedding && dp.embedding
            ? embeddingService.cosineSimilarity(p.embedding, dp.embedding)
            : this.textSimilarity(p.content, dp.content)
        );

        const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        if (avgSim < 0.4) continue;

        const allPoints = [...conn.dataPoints, dp];
        const key = allPoints.map(p => p.id).sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);

        const score = this.calculateBreakthroughScore(allPoints, avgSim);

        if (score > 75) {
          connections.push({
            id: `conn-4-${connections.length}`,
            dataPoints: allPoints,
            sources: [...conn.sources, dp.source],
            connectionType: '4-way',
            breakthroughScore: score,
            angle: this.generateAngle(allPoints),
            reasoning: `Four-source breakthrough: ${allPoints.map(p => p.source).join(' + ')}`,
            themes: this.extractThemes(allPoints),
            timingRelevance: this.calculateTimingRelevance(allPoints),
            emotionalIntensity: this.calculateEmotionalIntensity(allPoints)
          });
        }
      }
    }

    return connections.sort((a, b) => b.breakthroughScore - a.breakthroughScore);
  }

  /**
   * Calculate breakthrough score
   */
  private calculateBreakthroughScore(dataPoints: DataPoint[], similarity: number): number {
    let score = similarity * 40; // Base from similarity

    // Source diversity bonus (more unique sources = higher score)
    const uniqueSources = new Set(dataPoints.map(dp => dp.source)).size;
    score += uniqueSources * 15;

    // Timing relevance bonus
    const hasTimeSensitive = dataPoints.some(dp =>
      dp.type === 'local_event' ||
      dp.source === 'weather' ||
      dp.source === 'news'
    );
    if (hasTimeSensitive) score += 10;

    // Emotional intensity bonus
    const hasEmotional = dataPoints.some(dp =>
      dp.metadata?.sentiment === 'negative' ||
      dp.type === 'customer_trigger'
    );
    if (hasEmotional) score += 10;

    // Competitive advantage bonus
    const hasCompetitive = dataPoints.some(dp =>
      dp.type === 'competitive_gap' ||
      dp.source === 'semrush'
    );
    if (hasCompetitive) score += 5;

    return Math.min(100, Math.round(score));
  }

  /**
   * Generate angle from connected data points
   */
  private generateAngle(dataPoints: DataPoint[]): string {
    // Extract key phrases
    const phrases = dataPoints.map(dp => {
      const words = dp.content.split(/\s+/).slice(0, 5).join(' ');
      return words;
    });

    // Combine into angle
    if (dataPoints.length === 2) {
      return `${phrases[0]} meets ${phrases[1]}`;
    } else if (dataPoints.length === 3) {
      return `${phrases[0]} + ${phrases[1]} = ${phrases[2]}`;
    } else {
      return phrases.join(' → ');
    }
  }

  /**
   * Extract themes from data points
   */
  private extractThemes(dataPoints: DataPoint[]): string[] {
    const themes = new Set<string>();

    for (const dp of dataPoints) {
      if (dp.metadata?.domain) themes.add(dp.metadata.domain);
      if (dp.type) themes.add(dp.type.replace(/_/g, ' '));
    }

    return Array.from(themes);
  }

  /**
   * Calculate timing relevance
   */
  private calculateTimingRelevance(dataPoints: DataPoint[]): number {
    const timeSensitiveSources = ['weather', 'news', 'serper'];
    const timeSensitiveTypes = ['local_event', 'trending_topic'];

    const timeSensitiveCount = dataPoints.filter(dp =>
      timeSensitiveSources.includes(dp.source) ||
      timeSensitiveTypes.includes(dp.type)
    ).length;

    return timeSensitiveCount / dataPoints.length;
  }

  /**
   * Calculate emotional intensity
   */
  private calculateEmotionalIntensity(dataPoints: DataPoint[]): number {
    const emotionalTypes = ['customer_trigger', 'emotional_trigger'];
    const emotionalSentiments = ['negative', 'positive'];

    const emotionalCount = dataPoints.filter(dp =>
      emotionalTypes.includes(dp.type) ||
      emotionalSentiments.includes(dp.metadata?.sentiment || '')
    ).length;

    return emotionalCount / dataPoints.length;
  }

  /**
   * Text similarity fallback
   */
  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Generate breakthrough angles using AI
   */
  private async generateBreakthroughAngles(connections: Connection[]): Promise<BreakthroughAngle[]> {
    if (connections.length === 0) return [];

    const breakthroughs: BreakthroughAngle[] = [];

    // Generate titles for top connections
    for (const conn of connections.slice(0, 10)) {
      const provenance = conn.dataPoints.map(dp => `${dp.source}: "${dp.content.substring(0, 50)}..."`);

      const urgency = conn.timingRelevance > 0.5
        ? conn.emotionalIntensity > 0.5 ? 'critical' : 'high'
        : conn.emotionalIntensity > 0.5 ? 'medium' : 'low';

      breakthroughs.push({
        id: `breakthrough-${breakthroughs.length}`,
        title: this.generateTitle(conn),
        hook: this.generateHook(conn),
        connections: [conn],
        score: conn.breakthroughScore,
        provenance,
        urgency
      });
    }

    return breakthroughs.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate compelling title
   */
  private generateTitle(conn: Connection): string {
    const themes = conn.themes.slice(0, 2);

    if (conn.timingRelevance > 0.5) {
      return `Why Now: ${themes.join(' & ')} Convergence`;
    }

    if (conn.emotionalIntensity > 0.5) {
      return `The ${themes[0] || 'Hidden'} Problem No One's Addressing`;
    }

    if (conn.connectionType === '4-way') {
      return `The ${conn.sources.length}-Source Insight: ${themes.join(' Meets ')}`;
    }

    return `${themes.join(' + ')}: A New Angle`;
  }

  /**
   * Generate emotional hook
   */
  private generateHook(conn: Connection): string {
    // Find most emotional content
    const emotional = conn.dataPoints.find(dp =>
      dp.metadata?.sentiment === 'negative' ||
      dp.type === 'customer_trigger'
    );

    if (emotional) {
      return `"${emotional.content.substring(0, 100)}..."`;
    }

    return `Data from ${conn.sources.join(', ')} reveals a pattern competitors miss.`;
  }
}

export const connectionDiscoveryService = new ConnectionDiscoveryService();
