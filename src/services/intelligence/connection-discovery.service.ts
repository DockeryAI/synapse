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
  connectionType: '2-way' | '3-way' | '4-way' | '5-way';
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
    fiveWay: Connection[];
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

    // Find five-way connections (ultimate breakthrough)
    const fiveWay = this.findFiveWayConnections(dataPoints, fourWay);
    console.log(`[ConnectionDiscovery] Found ${fiveWay.length} five-way connections`);

    // Generate breakthrough angles from top connections (prioritize higher-order connections)
    const breakthroughs = await this.generateBreakthroughAngles([
      ...fiveWay.slice(0, 2),
      ...fourWay.slice(0, 3),
      ...threeWay.slice(0, 5),
      ...twoWay.slice(0, 10)
    ]);

    console.log(`[ConnectionDiscovery] ✅ Generated ${breakthroughs.length} breakthrough angles`);

    return { twoWay, threeWay, fourWay, fiveWay, breakthroughs };
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
   * Find five-way connections (ultimate breakthroughs)
   */
  private findFiveWayConnections(
    dataPoints: DataPoint[],
    fourWay: Connection[]
  ): Connection[] {
    const connections: Connection[] = [];
    const seen = new Set<string>();

    // Only process top 10 four-way connections for efficiency
    for (const conn of fourWay.slice(0, 10)) {
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
        if (avgSim < 0.35) continue; // Lower threshold for 5-way

        const allPoints = [...conn.dataPoints, dp];
        const key = allPoints.map(p => p.id).sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);

        const score = this.calculateBreakthroughScore(allPoints, avgSim);

        // Only keep very high scoring 5-way connections
        if (score > 80) {
          connections.push({
            id: `conn-5-${connections.length}`,
            dataPoints: allPoints,
            sources: [...conn.sources, dp.source],
            connectionType: '5-way',
            breakthroughScore: score,
            angle: this.generateAngle(allPoints),
            reasoning: `Five-source ultimate breakthrough: ${allPoints.map(p => p.source).join(' + ')}`,
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
   * Calculate breakthrough score with enhanced weighting
   */
  private calculateBreakthroughScore(dataPoints: DataPoint[], similarity: number): number {
    let score = similarity * 30; // Base from similarity (reduced to make room for other factors)

    // Source diversity bonus (more unique sources = higher score)
    const uniqueSources = new Set(dataPoints.map(dp => dp.source)).size;
    score += uniqueSources * 12;

    // Domain diversity bonus (psychological + competitive + timing = holy shit)
    const domains = new Set(dataPoints.map(dp => dp.metadata?.domain).filter(Boolean));
    if (domains.size >= 3) score += 15;
    else if (domains.size >= 2) score += 8;

    // Timing relevance bonus (multiple time-sensitive sources = critical)
    const timeSensitiveSources = ['weather', 'news', 'serper'];
    const timeSensitiveTypes = ['local_event', 'trending_topic', 'weather_trigger'];
    const timeSensitiveCount = dataPoints.filter(dp =>
      timeSensitiveSources.includes(dp.source) ||
      timeSensitiveTypes.includes(dp.type)
    ).length;
    if (timeSensitiveCount >= 2) score += 15;
    else if (timeSensitiveCount === 1) score += 8;

    // Emotional intensity bonus (customer pain points + desires)
    const emotionalTypes = ['customer_trigger', 'pain_point', 'unarticulated_need'];
    const emotionalCount = dataPoints.filter(dp =>
      emotionalTypes.includes(dp.type) ||
      dp.metadata?.sentiment === 'negative' ||
      dp.metadata?.domain === 'psychology'
    ).length;
    if (emotionalCount >= 2) score += 12;
    else if (emotionalCount === 1) score += 6;

    // Competitive moat bonus (gaps + weaknesses = opportunity)
    const competitiveTypes = ['competitive_gap', 'competitor_weakness', 'keyword_gap'];
    const competitiveCount = dataPoints.filter(dp =>
      competitiveTypes.includes(dp.type) ||
      dp.source === 'semrush'
    ).length;
    if (competitiveCount >= 2) score += 10;
    else if (competitiveCount === 1) score += 5;

    // Triple validation bonus (same theme from 3+ sources)
    if (dataPoints.length >= 3) {
      const contentWords = dataPoints.flatMap(dp =>
        dp.content.toLowerCase().split(/\s+/).filter(w => w.length > 5)
      );
      const wordCounts = new Map<string, number>();
      for (const word of contentWords) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
      const hasTripleValidation = Array.from(wordCounts.values()).some(count => count >= 3);
      if (hasTripleValidation) score += 8;
    }

    // High confidence bonus (all sources have high confidence)
    const avgConfidence = dataPoints.reduce((sum, dp) =>
      sum + (dp.metadata?.confidence || dp.metadata?.relevance || 0.7), 0
    ) / dataPoints.length;
    if (avgConfidence >= 0.85) score += 5;

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

  /**
   * Generate AI-enhanced compelling titles and hooks
   * Creates curiosity-driven, specific content angles
   */
  async generateAIEnhancedAngles(connections: Connection[]): Promise<BreakthroughAngle[]> {
    if (connections.length === 0) return [];

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return this.generateBreakthroughAngles(connections);
    }

    const breakthroughs: BreakthroughAngle[] = [];

    // Process top connections with AI
    for (const conn of connections.slice(0, 5)) {
      try {
        const contentSummary = conn.dataPoints
          .map(dp => `${dp.source}: ${dp.content.substring(0, 100)}`)
          .join('\n');

        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-3-haiku',
            messages: [
              {
                role: 'system',
                content: 'Generate compelling content titles and hooks. Be specific, create curiosity, and avoid generic phrases. Output JSON only.'
              },
              {
                role: 'user',
                content: `Create a breakthrough content angle from this ${conn.connectionType} connection:

${contentSummary}

Sources: ${conn.sources.join(', ')}
Breakthrough Score: ${conn.breakthroughScore}/100

Return JSON: {"title": "specific curiosity-driven title", "hook": "emotional opening that references actual data"}`
              }
            ],
            temperature: 0.7,
            max_tokens: 200
          })
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.choices?.[0]?.message?.content || '';

          // Clean and parse JSON
          if (content.includes('```')) {
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          }

          const parsed = JSON.parse(content);
          const provenance = conn.dataPoints.map(dp => `${dp.source}: "${dp.content.substring(0, 50)}..."`);

          const urgency = conn.timingRelevance > 0.5
            ? conn.emotionalIntensity > 0.5 ? 'critical' : 'high'
            : conn.emotionalIntensity > 0.5 ? 'medium' : 'low';

          breakthroughs.push({
            id: `ai-breakthrough-${breakthroughs.length}`,
            title: parsed.title || this.generateTitle(conn),
            hook: parsed.hook || this.generateHook(conn),
            connections: [conn],
            score: conn.breakthroughScore,
            provenance,
            urgency
          });
        }
      } catch (error) {
        console.warn('[ConnectionDiscovery] AI angle generation failed for connection:', error);
        // Fallback to basic generation
        const provenance = conn.dataPoints.map(dp => `${dp.source}: "${dp.content.substring(0, 50)}..."`);
        const urgency = conn.timingRelevance > 0.5 ? 'high' : 'medium';

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
    }

    // Add remaining connections with basic generation
    for (const conn of connections.slice(5, 10)) {
      const provenance = conn.dataPoints.map(dp => `${dp.source}: "${dp.content.substring(0, 50)}..."`);
      const urgency = conn.timingRelevance > 0.5 ? 'high' : 'medium';

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

    console.log(`[ConnectionDiscovery] Generated ${breakthroughs.length} AI-enhanced breakthrough angles`);
    return breakthroughs.sort((a, b) => b.score - a.score);
  }
}

export const connectionDiscoveryService = new ConnectionDiscoveryService();
