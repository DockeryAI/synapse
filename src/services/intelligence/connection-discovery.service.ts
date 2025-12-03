/**
 * Connection Discovery Engine V2
 *
 * Finds two-way, three-way, and four-way connections between data points
 * across different sources to generate breakthrough content angles.
 *
 * V2 ENHANCEMENTS:
 * - 12-dimension variety framework for unique insights
 * - 15 hook formula templates for compelling titles
 * - SMB/B2B segment-aware routing
 * - Variety enforcement to prevent duplicates
 */

import type { DataPoint, DataSource } from '@/types/connections.types';
import type {
  JourneyStage,
  EmotionTrigger,
  ContentFormat,
  TargetPersona,
  ObjectionType,
  ContentAngle,
  CTAType,
  UrgencyLevel,
  SourceConfidence,
  CompetitivePosition,
  ContentLifecycle,
  BusinessSegment,
  HookFormula,
  InsightDimensions,
  ContentPillar
} from '@/types/connections.types';
import { HOOK_TEMPLATES, SEGMENT_DEFAULTS, SOURCE_DIMENSION_DEFAULTS, REQUIRED_DISTRIBUTION } from '@/types/connections.types';
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
  dimensions?: InsightDimensions; // V2: 12-dimension tagging
}

export interface BreakthroughAngle {
  id: string;
  title: string;
  hook: string;
  connections: Connection[];
  score: number;
  provenance: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  dimensions?: InsightDimensions; // V2: 12-dimension tagging
  hookFormula?: HookFormula; // V2: Which formula generated the title
}

class ConnectionDiscoveryService {
  private readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // V3: AI-generated title cache (connection ID -> title)
  private aiTitleCache: Map<string, { title: string; hook: string }> = new Map();

  /**
   * V3: Batch generate AI titles for connections
   * Pre-populates the cache so generateTitleWithHook can return AI titles synchronously
   */
  async batchGenerateAITitles(connections: Connection[], brandContext?: { name?: string; uvp?: string; industry?: string }): Promise<void> {
    if (connections.length === 0) return;

    const BATCH_SIZE = 10; // Process 10 connections per AI call for efficiency
    const batches = [];

    for (let i = 0; i < connections.length; i += BATCH_SIZE) {
      batches.push(connections.slice(i, i + BATCH_SIZE));
    }

    console.log(`[V3-AI] Batch generating titles for ${connections.length} connections in ${batches.length} batches (PARALLEL)...`);

    const brandName = brandContext?.name || 'the business';
    const brandUVP = brandContext?.uvp || '';
    const industry = brandContext?.industry || 'their industry';

    // V3 FIX: Run ALL batches in parallel with 30s timeout per batch
    const batchPromises = batches.map(async (batch, batchIndex) => {
      try {
        const connectionSummaries = batch.map((conn, idx) => {
          const sources = conn.sources.join(', ');
          const content = conn.dataPoints
            .map(dp => `[${dp.source}]: ${dp.content.substring(0, 150)}`)
            .join('\n');
          return `CONNECTION ${idx + 1} (id: ${conn.id}):\nSources: ${sources}\nData:\n${content}`;
        }).join('\n\n---\n\n');

        const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ai-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-opus-4.5',
            messages: [
              {
                role: 'system',
                content: `You are a content strategist creating unique, compelling content titles.

CRITICAL RULES:
- Write for ${brandName}'s CUSTOMERS to read (customer is hero, business is guide)
- Focus on what CUSTOMERS want to achieve, fear, or need
- NEVER write "Company X increased Y by Z%" style titles
- Each title must be unique - no repetition
- Create curiosity and emotional engagement
- Reference specific data/insights from the sources

Brand context: ${brandUVP}
Industry: ${industry}

Return a JSON array with one object per connection:
[{"id": "connection-id", "title": "unique specific title", "hook": "emotional opening sentence"}]`
              },
              {
                role: 'user',
                content: `Generate unique titles and hooks for each connection below. Each must be different and specific to the data.

${connectionSummaries}

Return JSON array with ${batch.length} objects, one per connection.`
              }
            ],
            temperature: 0.8,
            max_tokens: 2000
          })
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.choices?.[0]?.message?.content || '';

          // Clean JSON from markdown
          if (content.includes('```')) {
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          }

          // Try to extract JSON array from response (AI sometimes returns prose around JSON)
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            content = jsonMatch[0];
          }

          try {
            const titles = JSON.parse(content);
            if (Array.isArray(titles)) {
              titles.forEach((item: any, idx: number) => {
                const conn = batch[idx];
                if (conn && item.title) {
                  this.aiTitleCache.set(conn.id, {
                    title: item.title,
                    hook: item.hook || ''
                  });
                }
              });
              console.log(`[V3-AI] Cached ${titles.length} AI-generated titles`);
            }
          } catch (parseError) {
            console.warn('[V3-AI] Failed to parse batch response:', parseError);
            // Non-critical - will use fallback titles
          }
        }
      } catch (error) {
        console.warn(`[V3-AI] Batch ${batchIndex + 1} title generation failed:`, error);
      }
    });

    // Wait for ALL batches to complete - no timeouts, true parallel execution
    await Promise.allSettled(batchPromises);

    console.log(`[V3-AI] ✅ All ${batches.length} batches complete. Total cached titles: ${this.aiTitleCache.size}`);
  }

  /**
   * V3: Get AI-generated title from cache, or return empty string for fallback
   */
  getAITitle(connId: string): { title: string; hook: string } | null {
    return this.aiTitleCache.get(connId) || null;
  }

  /**
   * V3: Clear the AI title cache
   */
  clearAITitleCache(): void {
    this.aiTitleCache.clear();
  }

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

    // PERFORMANCE FIX: Limit input to prevent O(n²) freeze
    // Take top 300 two-way connections (already sorted by breakthroughScore)
    const twoWayLimited = twoWay.slice(0, 300);
    console.log(`[ConnectionDiscovery] Using top ${twoWayLimited.length} two-way for three-way search`);

    // Find three-way connections (limited input)
    const threeWay = this.findThreeWayConnections(dataPoints, twoWayLimited);
    console.log(`[ConnectionDiscovery] Found ${threeWay.length} three-way connections`);

    // PERFORMANCE FIX: Limit three-way input to prevent O(n²) freeze on four-way
    const threeWayLimited = threeWay.slice(0, 200);
    console.log(`[ConnectionDiscovery] Using top ${threeWayLimited.length} three-way for four-way search`);

    // Find four-way connections (limited input)
    const fourWay = this.findFourWayConnections(dataPoints, threeWayLimited);
    console.log(`[ConnectionDiscovery] Found ${fourWay.length} four-way connections`);

    // PERFORMANCE FIX: Limit four-way input
    const fourWayLimited = fourWay.slice(0, 100);

    // Find five-way connections (ultimate breakthrough)
    const fiveWay = this.findFiveWayConnections(dataPoints, fourWayLimited);
    console.log(`[ConnectionDiscovery] Found ${fiveWay.length} five-way connections`);

    // PERFORMANCE FIX: Limit total connections passed to generateBreakthroughAngles
    // Previously passed ALL which could be 18K+ items causing freeze
    const MAX_TOTAL_FOR_BREAKTHROUGHS = 500;
    const allConnections = [
      ...fiveWay,    // Highest value first
      ...fourWay,
      ...threeWay,
      ...twoWay
    ].slice(0, MAX_TOTAL_FOR_BREAKTHROUGHS);
    console.log(`[ConnectionDiscovery] PERFORMANCE: Using ${allConnections.length} connections for breakthrough generation`);

    const breakthroughs = await this.generateBreakthroughAngles(allConnections);

    console.log(`[ConnectionDiscovery] ✅ Generated ${breakthroughs.length} breakthrough angles`);

    // V3: Comprehensive output logging for visibility
    const totalConnections = twoWay.length + threeWay.length + fourWay.length + fiveWay.length;
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║         CONNECTION DISCOVERY OUTPUT SUMMARY                  ║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  Input:  ${dataPoints.length.toString().padStart(5)} data points                                   ║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  2-way connections:  ${twoWay.length.toString().padStart(5)}                                      ║`);
    console.log(`║  3-way connections:  ${threeWay.length.toString().padStart(5)}                                      ║`);
    console.log(`║  4-way connections:  ${fourWay.length.toString().padStart(5)}                                      ║`);
    console.log(`║  5-way connections:  ${fiveWay.length.toString().padStart(5)}                                      ║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  TOTAL CONNECTIONS:  ${totalConnections.toString().padStart(5)}                                      ║`);
    console.log(`║  BREAKTHROUGHS:      ${breakthroughs.length.toString().padStart(5)}                                      ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

    return { twoWay, threeWay, fourWay, fiveWay, breakthroughs };
  }

  /**
   * Find two-way connections between different sources
   */
  private findTwoWayConnections(dataPoints: DataPoint[]): Connection[] {
    const connections: Connection[] = [];
    const seen = new Set<string>();

    // PERFORMANCE FIX: Hard limit on output to prevent downstream freeze
    const MAX_TWO_WAY = 300;

    for (let i = 0; i < dataPoints.length; i++) {
      // PERFORMANCE: Early exit when we have enough connections
      if (connections.length >= MAX_TWO_WAY) break;

      for (let j = i + 1; j < dataPoints.length; j++) {
        // PERFORMANCE: Check inside inner loop too
        if (connections.length >= MAX_TWO_WAY) break;

        const dp1 = dataPoints[i];
        const dp2 = dataPoints[j];

        // Skip same source
        if (dp1.source === dp2.source) continue;

        // Calculate similarity
        const similarity = dp1.embedding && dp2.embedding
          ? embeddingService.cosineSimilarity(dp1.embedding, dp2.embedding)
          : this.textSimilarity(dp1.content, dp2.content);

        // V3: Lowered threshold from 0.5 → 0.4 to find more connections
        if (similarity < 0.4) continue;

        const key = [dp1.id, dp2.id].sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);

        const score = this.calculateBreakthroughScore([dp1, dp2], similarity);

        // V3: LOWERED threshold from 40 to 30 to find more connections
        if (score > 30) {
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

    // PERFORMANCE FIX: Hard limits to prevent O(n×m) freeze
    const MAX_THREE_WAY = 500;
    const MAX_TWO_WAY_INPUT = 150; // Limit input to prevent 300×100 = 30,000 iterations
    const limitedTwoWay = twoWay.slice(0, MAX_TWO_WAY_INPUT);

    for (const conn of limitedTwoWay) {
      // PERFORMANCE: Early exit
      if (connections.length >= MAX_THREE_WAY) break;

      for (const dp of dataPoints) {
        // PERFORMANCE: Check inside inner loop
        if (connections.length >= MAX_THREE_WAY) break;
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

        // LOWERED threshold from 65 to 55 to find more three-way connections
        if (score > 55) {
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

    // PERFORMANCE FIX: Hard limits to prevent O(n×m) freeze
    const MAX_FOUR_WAY = 200;
    const MAX_THREE_WAY_INPUT = 100;
    const limitedThreeWay = threeWay.slice(0, MAX_THREE_WAY_INPUT);

    for (const conn of limitedThreeWay) {
      // PERFORMANCE: Early exit
      if (connections.length >= MAX_FOUR_WAY) break;

      for (const dp of dataPoints) {
        // PERFORMANCE: Check inside inner loop
        if (connections.length >= MAX_FOUR_WAY) break;

        // Must be different source
        if (conn.sources.includes(dp.source)) continue;

        // Check similarity with all points
        const similarities = conn.dataPoints.map(p =>
          p.embedding && dp.embedding
            ? embeddingService.cosineSimilarity(p.embedding, dp.embedding)
            : this.textSimilarity(p.content, dp.content)
        );

        const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        if (avgSim < 0.35) continue; // LOWERED from 0.4 to find more connections

        const allPoints = [...conn.dataPoints, dp];
        const key = allPoints.map(p => p.id).sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);

        const score = this.calculateBreakthroughScore(allPoints, avgSim);

        // LOWERED threshold from 75 to 60 to find more four-way connections
        if (score > 60) {
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

    // PERFORMANCE FIX: Hard limits to prevent O(n×m) freeze
    const MAX_FIVE_WAY = 100;
    const MAX_FOUR_WAY_INPUT = 50;
    const limitedFourWay = fourWay.slice(0, MAX_FOUR_WAY_INPUT);

    for (const conn of limitedFourWay) {
      // PERFORMANCE: Early exit
      if (connections.length >= MAX_FIVE_WAY) break;

      for (const dp of dataPoints) {
        // PERFORMANCE: Check inside inner loop
        if (connections.length >= MAX_FIVE_WAY) break;

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

        // LOWERED threshold from 80 to 65 to find more five-way connections
        if (score > 65) {
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

    // Factor 9: Segment match (customer-focused data points)
    const customerFocusedTypes = ['customer_trigger', 'pain_point', 'unarticulated_need', 'question', 'people_also_ask'];
    const customerFocusCount = dataPoints.filter(dp =>
      customerFocusedTypes.includes(dp.type) ||
      dp.source === 'outscraper' ||
      dp.source === 'youtube'
    ).length;
    if (customerFocusCount >= 3) score += 15;
    else if (customerFocusCount >= 2) score += 10;
    else if (customerFocusCount >= 1) score += 5;

    // Factor 10: Implementability (actionable vs abstract)
    const implementabilityIndicators = dataPoints.filter(dp => {
      const content = dp.content.toLowerCase();
      return (
        /\d+/.test(content) ||
        /\$\d+/.test(content) ||
        /%/.test(content) ||
        /today|this week|this month|season|deadline/.test(content) ||
        dp.metadata?.location ||
        dp.type === 'weather_trigger' ||
        dp.type === 'local_event'
      );
    }).length;
    if (implementabilityIndicators >= 3) score += 10;
    else if (implementabilityIndicators >= 2) score += 6;
    else if (implementabilityIndicators >= 1) score += 3;

    // Factor 11: Novelty detection (unexpected source combinations)
    const novelCombinations = [
      ['weather', 'youtube'],
      ['semrush', 'outscraper'],
      ['perplexity', 'weather'],
      ['news', 'youtube'],
      ['linkedin', 'outscraper']
    ];
    const sources = dataPoints.map(dp => dp.source);
    let noveltyBonus = 0;
    for (const combo of novelCombinations) {
      if (combo.every(src => sources.includes(src as any))) {
        noveltyBonus += 5;
      }
    }
    score += Math.min(10, noveltyBonus);

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
   * Extract themes from data points - use ACTUAL CONTENT not type names
   */
  private extractThemes(dataPoints: DataPoint[]): string[] {
    const themes: string[] = [];

    for (const dp of dataPoints) {
      // Extract meaningful phrase from content (first 6-8 words)
      const content = dp.content || '';
      const words = content.split(/\s+/).filter(w => w.length > 2);
      if (words.length >= 3) {
        // Get key phrase from content
        const phrase = words.slice(0, 6).join(' ');
        if (phrase.length > 10 && phrase.length < 80) {
          themes.push(phrase);
        }
      }
    }

    // Return unique themes
    return [...new Set(themes)].slice(0, 3);
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
   * Generate breakthrough angles with RELAXED deduplication
   * V3 FIX: Previous dedup was too aggressive (400→34). Now targets 150+ breakthroughs.
   */
  private async generateBreakthroughAngles(connections: Connection[]): Promise<BreakthroughAngle[]> {
    if (connections.length === 0) return [];

    const breakthroughs: BreakthroughAngle[] = [];

    // PERFORMANCE FIX: Limit input to prevent freeze (connections already sorted by score)
    const MAX_BREAKTHROUGHS = 300;
    const limitedConnections = connections.slice(0, MAX_BREAKTHROUGHS);
    console.log(`[ConnectionDiscovery] PERFORMANCE: Processing ${limitedConnections.length} of ${connections.length} connections for breakthroughs`);

    for (const conn of limitedConnections) {
      const title = this.generateTitle(conn);

      const provenance = conn.dataPoints.map(dp => `${dp.source}: "${dp.content.substring(0, 50)}..."`);

      const urgency = conn.timingRelevance > 0.5
        ? conn.emotionalIntensity > 0.5 ? 'critical' : 'high'
        : conn.emotionalIntensity > 0.5 ? 'medium' : 'low';

      breakthroughs.push({
        id: `breakthrough-${breakthroughs.length}`,
        title,
        hook: this.generateHook(conn),
        connections: [conn],
        score: conn.breakthroughScore,
        provenance,
        urgency
      });
    }

    console.log(`[ConnectionDiscovery] Generated ${breakthroughs.length} breakthroughs from ${connections.length} connections (no dedup)`);
    return breakthroughs.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate compelling title from actual data point content
   */
  private generateTitle(conn: Connection): string {
    // Get the most meaningful content from data points
    const contents = conn.dataPoints
      .map(dp => dp.content)
      .filter(c => c && c.length > 20)
      .sort((a, b) => b.length - a.length);

    if (contents.length === 0) {
      return `${conn.connectionType} Insight from ${conn.sources.join(' + ')}`;
    }

    // Extract a compelling phrase from the best content
    const bestContent = contents[0];
    const words = bestContent.split(/\s+/);

    // Try to find an action phrase or key insight
    const actionWords = ['how', 'why', 'what', 'improve', 'reduce', 'increase', 'solve', 'fix', 'boost', 'grow'];
    let startIdx = words.findIndex(w => actionWords.includes(w.toLowerCase()));
    if (startIdx === -1) startIdx = 0;

    const phrase = words.slice(startIdx, startIdx + 8).join(' ');

    if (conn.timingRelevance > 0.5) {
      return `Time-Sensitive: ${phrase}`;
    }

    if (conn.emotionalIntensity > 0.5) {
      return `Pain Point: ${phrase}`;
    }

    if (conn.connectionType === '5-way') {
      return `🔥 Multi-Source Validated: ${phrase}`;
    }

    if (conn.connectionType === '4-way') {
      return `Cross-Platform Insight: ${phrase}`;
    }

    // Capitalize first letter
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
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
            model: 'anthropic/claude-opus-4.5',
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

  // ============================================
  // V2: DIMENSION TAGGING ENGINE
  // ============================================

  /**
   * Tag a connection with all 13 insight dimensions (12 + pillar)
   * Uses source-based defaults as starting point, then content analysis
   */
  tagDimensions(conn: Connection, segment: BusinessSegment = 'SMB_LOCAL'): InsightDimensions {
    const defaults = SEGMENT_DEFAULTS[segment];

    // Get source-based defaults from primary source
    const primarySource = conn.sources[0] as DataSource;
    const sourceDefaults = SOURCE_DIMENSION_DEFAULTS[primarySource] || {};

    return {
      journeyStage: this.detectJourneyStage(conn) || sourceDefaults.journeyStage || defaults.journeyStage || 'CONSIDERATION',
      emotion: this.detectEmotion(conn) || sourceDefaults.emotion || defaults.emotion || 'TRUST',
      format: this.detectFormat(conn) || sourceDefaults.format || defaults.format || 'HOWTO',
      persona: this.detectPersona(conn) || sourceDefaults.persona || defaults.persona || 'USER',
      objection: this.detectObjection(conn),
      angle: this.detectContentAngle(conn) || sourceDefaults.angle || 'DATA_DRIVEN',
      cta: this.detectCTA(conn, segment) || sourceDefaults.cta || defaults.cta || 'CTA_CALL',
      urgency: this.detectUrgency(conn) || sourceDefaults.urgency || defaults.urgency || 'URGENT_MEDIUM',
      confidence: this.detectConfidence(conn),
      position: this.detectPosition(conn),
      lifecycle: this.detectLifecycle(conn) || sourceDefaults.lifecycle || defaults.lifecycle || 'LIFE_EVERGREEN',
      segment,
      hookFormula: this.selectHookFormula(conn),
      pillar: this.detectPillar(conn) || sourceDefaults.pillar || 'PILLAR_EXPERTISE'
    };
  }

  /**
   * Detect content pillar from data point content and sources
   */
  private detectPillar(conn: Connection): ContentPillar {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');
    const sources = conn.sources;
    const types = conn.dataPoints.map(dp => dp.type);

    // PILLAR_TRUST: Reviews, testimonials, credentials
    if (sources.includes('outscraper') || sources.includes('trustpilot') || sources.includes('yelp') || sources.includes('g2') ||
        /review|testimonial|rating|stars|recommend|trusted|certified|licensed|bonded|insured/.test(content)) {
      return 'PILLAR_TRUST';
    }

    // PILLAR_VALUE: Pricing, ROI, cost
    if (/price|cost|roi|save|afford|budget|value|worth|investment|payback/.test(content) ||
        types.includes('competitive_gap') || types.includes('keyword_gap')) {
      return 'PILLAR_VALUE';
    }

    // PILLAR_DIFFERENTIATION: Competitors, comparison
    if (sources.includes('semrush') ||
        /vs\b|versus|compare|competitor|alternative|better\s+than|different|unique|only\s+we/.test(content) ||
        types.includes('competitor_weakness') || types.includes('competitor_mention')) {
      return 'PILLAR_DIFFERENTIATION';
    }

    // PILLAR_TRENDS: News, trending, market changes
    if (sources.includes('news') || sources.includes('twitter') || sources.includes('google_trends') ||
        /trend|news|update|change|new\s+regulation|industry|market|forecast|predict/.test(content) ||
        types.includes('trending_topic') || types.includes('news_story')) {
      return 'PILLAR_TRENDS';
    }

    // PILLAR_COMMUNITY: Local, events, partnerships
    if (sources.includes('weather') ||
        /local|community|event|sponsor|partner|neighborhood|city|area|region/.test(content) ||
        types.includes('local_event') || types.includes('weather_trigger')) {
      return 'PILLAR_COMMUNITY';
    }

    // PILLAR_EXPERTISE: How-to, technical, educational (default)
    return 'PILLAR_EXPERTISE';
  }

  /**
   * Detect buyer journey stage from content signals
   */
  private detectJourneyStage(conn: Connection): JourneyStage {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');
    const types = conn.dataPoints.map(dp => dp.type);

    // AWARENESS: Questions, what is, learn about
    if (/what is|how does|learn|understand|guide to|beginner|introduction/.test(content) ||
        types.includes('question') || types.includes('people_also_ask')) {
      return 'AWARENESS';
    }

    // DECISION: Buy, pricing, compare, best, vs
    if (/buy|price|cost|best|compare|vs\b|versus|deal|discount|offer/.test(content) ||
        types.includes('competitive_gap') || types.includes('competitor_weakness')) {
      return 'DECISION';
    }

    // RETENTION: Maintain, support, help, issue
    if (/maintain|support|help with|issue|problem with|fix|troubleshoot/.test(content)) {
      return 'RETENTION';
    }

    // ADVOCACY: Review, recommend, share, love
    if (/review|recommend|share|love|amazing|great experience/.test(content)) {
      return 'ADVOCACY';
    }

    // Default: CONSIDERATION
    return 'CONSIDERATION';
  }

  /**
   * Detect primary emotion trigger from content
   */
  private detectEmotion(conn: Connection): EmotionTrigger {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');
    const sentiment = conn.dataPoints.find(dp => dp.metadata?.sentiment)?.metadata?.sentiment;

    // FEAR: Worry, risk, danger, avoid, problem
    if (/worry|risk|danger|avoid|problem|issue|mistake|fail|lose|threat/.test(content) ||
        sentiment === 'negative') {
      return 'FEAR';
    }

    // ANGER: Frustrated, hate, terrible, worst, annoyed
    if (/frustrated|hate|terrible|worst|annoyed|angry|furious|unacceptable/.test(content)) {
      return 'ANGER';
    }

    // JOY: Happy, love, amazing, great, excellent
    if (/happy|love|amazing|great|excellent|wonderful|fantastic|perfect/.test(content) ||
        sentiment === 'positive') {
      return 'JOY';
    }

    // CURIOSITY: How, why, what if, discover, secret
    if (/how\s+to|why\s+do|what\s+if|discover|secret|hidden|unknown|surprising/.test(content)) {
      return 'CURIOSITY';
    }

    // ANTICIPATION: Trend, upcoming, future, soon, new
    if (/trend|upcoming|future|soon|new|launching|coming|expect/.test(content) ||
        conn.dataPoints.some(dp => dp.type === 'trending_topic')) {
      return 'ANTICIPATION';
    }

    // LOSS_AVERSION: Miss out, limited, only, deadline
    if (/miss\s+out|limited|only\s+\d|deadline|last\s+chance|expires|ending/.test(content)) {
      return 'LOSS_AVERSION';
    }

    // TRUST: Reliable, proven, expert, certified
    if (/reliable|proven|expert|certified|trusted|years\s+of|guarantee/.test(content)) {
      return 'TRUST';
    }

    // BELONGING: Community, together, join, member
    if (/community|together|join|member|family|team|part\s+of/.test(content)) {
      return 'BELONGING';
    }

    // ACHIEVEMENT: Success, accomplish, goal, win
    if (/success|accomplish|goal|win|achieve|improve|grow|boost/.test(content)) {
      return 'ACHIEVEMENT';
    }

    // SURPRISE: Unexpected, shocking, incredible
    if (/unexpected|shocking|incredible|unbelievable|never\s+thought/.test(content)) {
      return 'SURPRISE';
    }

    // Default based on timing relevance
    return conn.timingRelevance > 0.5 ? 'ANTICIPATION' : 'TRUST';
  }

  /**
   * Detect optimal content format
   */
  private detectFormat(conn: Connection): ContentFormat {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');
    const types = conn.dataPoints.map(dp => dp.type);
    const sources = conn.sources;

    // COMPARISON: vs, compare, better, alternative
    if (/vs\b|compare|better|alternative|which\s+is|difference/.test(content) ||
        types.includes('competitor_weakness') || types.includes('competitive_gap')) {
      return 'COMPARISON';
    }

    // HOWTO: How to, steps, guide, tutorial
    if (/how\s+to|step\s+by|guide|tutorial|instruction|process/.test(content)) {
      return 'HOWTO';
    }

    // FAQ: Question patterns
    if (types.includes('question') || types.includes('people_also_ask') ||
        /\?|what\s+is|can\s+i|should\s+i|when\s+to/.test(content)) {
      return 'FAQ';
    }

    // DATA: Numbers, statistics, percentage
    if (/\d+%|\d+\s+percent|statistics|data|research|study|survey/.test(content) ||
        sources.includes('semrush')) {
      return 'DATA';
    }

    // CASE_STUDY: Results, achieved, success story
    if (/results|achieved|success\s+story|case\s+study|client|customer\s+saved/.test(content)) {
      return 'CASE_STUDY';
    }

    // CHECKLIST: List patterns
    if (/checklist|must\s+have|\d+\s+things|\d+\s+ways|top\s+\d+/.test(content)) {
      return 'CHECKLIST';
    }

    // TESTIMONIAL: Review sentiment
    if (sources.includes('outscraper') || sources.includes('g2') || sources.includes('trustpilot')) {
      return 'TESTIMONIAL';
    }

    // STORY: Narrative patterns
    if (/story|journey|experience|happened|when\s+we|we\s+discovered/.test(content)) {
      return 'STORY';
    }

    // CONTROVERSY: Debate, myth, wrong
    if (/debate|myth|wrong|actually|truth|misconception|controversy/.test(content)) {
      return 'CONTROVERSY';
    }

    // TOOL: Calculator, template, tool
    if (/calculator|template|tool|resource|free\s+download/.test(content)) {
      return 'TOOL';
    }

    // Default
    return 'HOWTO';
  }

  /**
   * Detect target persona
   */
  private detectPersona(conn: Connection): TargetPersona {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');

    // DECISION_MAKER: Owner, CEO, decision, budget
    if (/owner|ceo|manager|director|decision|budget|approve|invest/.test(content)) {
      return 'DECISION_MAKER';
    }

    // INFLUENCER: Recommend, suggest, research, evaluate
    if (/recommend|suggest|research|evaluate|review|consider/.test(content)) {
      return 'INFLUENCER';
    }

    // BLOCKER: Concern, risk, issue, problem
    if (/concern|risk|issue|problem|compliance|legal|security/.test(content)) {
      return 'BLOCKER';
    }

    // CHAMPION: Advocate, love, promote, share
    if (/advocate|love|promote|share|tell\s+everyone/.test(content)) {
      return 'CHAMPION';
    }

    // Default: USER
    return 'USER';
  }

  /**
   * Detect objection type if present
   */
  private detectObjection(conn: Connection): ObjectionType | undefined {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');

    if (/expensive|cost|price|afford|budget|cheap/.test(content)) {
      return 'OBJ_PRICE';
    }
    if (/not\s+now|later|timing|wait|busy|next\s+year/.test(content)) {
      return 'OBJ_TIMING';
    }
    if (/need\s+approval|boss|manager|committee|team\s+decision/.test(content)) {
      return 'OBJ_AUTHORITY';
    }
    if (/don't\s+need|already\s+have|not\s+necessary|fine\s+without/.test(content)) {
      return 'OBJ_NEED';
    }
    if (/not\s+sure|trust|reliable|proven|guarantee|scam/.test(content)) {
      return 'OBJ_TRUST';
    }
    if (/competitor|alternative|other\s+option|already\s+use/.test(content)) {
      return 'OBJ_COMPETITOR';
    }

    return undefined;
  }

  /**
   * Detect content angle
   */
  private detectContentAngle(conn: Connection): ContentAngle {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');

    if (/contrary|actually|myth|wrong|misunderstand/.test(content)) {
      return 'CONTRARIAN';
    }
    if (/\d+%|statistics|data|research|study|survey/.test(content)) {
      return 'DATA_DRIVEN';
    }
    if (/story|journey|experience|happened/.test(content)) {
      return 'STORY_DRIVEN';
    }
    if (/expert|years|professional|certified|specialist/.test(content)) {
      return 'EXPERT';
    }
    if (/trend|viral|popular|everyone|now/.test(content) ||
        conn.dataPoints.some(dp => dp.type === 'trending_topic')) {
      return 'TRENDING';
    }
    if (/vs|compare|better|alternative/.test(content)) {
      return 'COMPARISON';
    }
    if (/behind|inside|secret|how\s+we|our\s+process/.test(content)) {
      return 'BEHIND_SCENES';
    }
    if (/predict|future|will|upcoming|expect|forecast/.test(content)) {
      return 'PREDICTION';
    }

    return 'DATA_DRIVEN';
  }

  /**
   * Detect appropriate CTA based on segment and content
   */
  private detectCTA(conn: Connection, segment: BusinessSegment): CTAType {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');
    const defaults = SEGMENT_DEFAULTS[segment];

    // SMB Local: Prefer calls, visits, bookings
    if (segment === 'SMB_LOCAL') {
      if (/appointment|schedule|book|reserve/.test(content)) return 'CTA_BOOK';
      if (/visit|come|stop\s+by|location/.test(content)) return 'CTA_VISIT';
      if (/call|phone|contact|speak/.test(content)) return 'CTA_CALL';
      return defaults.cta || 'CTA_CALL';
    }

    // B2B: Prefer demos, consultations, trials
    if (segment === 'B2B_NATIONAL' || segment === 'B2B_GLOBAL') {
      if (/demo|demonstration|see\s+it/.test(content)) return 'CTA_DEMO';
      if (/trial|try|free|test/.test(content)) return 'CTA_TRIAL';
      if (/consult|discuss|meeting|strategy/.test(content)) return 'CTA_CONSULT';
      if (/webinar|event|register/.test(content)) return 'CTA_WEBINAR';
      return defaults.cta || 'CTA_DEMO';
    }

    // SMB Regional
    if (/download|guide|ebook|resource/.test(content)) return 'CTA_DOWNLOAD';
    if (/price|cost|quote|estimate/.test(content)) return 'CTA_PRICING';
    if (/assess|audit|evaluate|analysis/.test(content)) return 'CTA_ASSESS';

    return defaults.cta || 'CTA_CALL';
  }

  /**
   * Detect urgency level
   */
  private detectUrgency(conn: Connection): UrgencyLevel {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');

    // CRITICAL: Immediate action needed
    if (/urgent|immediately|emergency|critical|asap|today\s+only/.test(content) ||
        conn.timingRelevance > 0.8) {
      return 'URGENT_CRITICAL';
    }

    // HIGH: Time-sensitive
    if (/limited|deadline|expires|ending\s+soon|this\s+week/.test(content) ||
        conn.timingRelevance > 0.5) {
      return 'URGENT_HIGH';
    }

    // MEDIUM: Moderate urgency
    if (/soon|this\s+month|don't\s+wait|before/.test(content) ||
        conn.timingRelevance > 0.3) {
      return 'URGENT_MEDIUM';
    }

    // LOW: Evergreen
    return 'URGENT_LOW';
  }

  /**
   * Detect confidence level based on source count
   */
  private detectConfidence(conn: Connection): SourceConfidence {
    const sourceCount = conn.sources.length;

    if (sourceCount >= 5) return 'CONF_5WAY';
    if (sourceCount >= 4) return 'CONF_4WAY';
    if (sourceCount >= 3) return 'CONF_3WAY';
    if (sourceCount >= 2) return 'CONF_2WAY';
    return 'CONF_SINGLE';
  }

  /**
   * Detect competitive position
   */
  private detectPosition(conn: Connection): CompetitivePosition | undefined {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');

    if (/leader|best|#1|top\s+rated|award/.test(content)) {
      return 'POS_LEADER';
    }
    if (/challenger|disrupt|alternative|better\s+than/.test(content)) {
      return 'POS_CHALLENGER';
    }
    if (/specialist|niche|specific|focus|expert\s+in/.test(content)) {
      return 'POS_NICHE';
    }
    if (/new|innovative|first|unique|revolutionary/.test(content)) {
      return 'POS_INNOVATOR';
    }
    if (/affordable|value|budget|save|cheap/.test(content)) {
      return 'POS_VALUE';
    }

    return undefined;
  }

  /**
   * Detect content lifecycle
   */
  private detectLifecycle(conn: Connection): ContentLifecycle {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');
    const types = conn.dataPoints.map(dp => dp.type);

    // TRENDING: Viral, news, current events
    if (types.includes('trending_topic') || types.includes('news_story') ||
        /viral|trending|breaking|just\s+announced/.test(content)) {
      return 'LIFE_TRENDING';
    }

    // REACTIVE: News response, competitor move
    if (/response|react|competitor|announcement|update/.test(content)) {
      return 'LIFE_REACTIVE';
    }

    // SEASONAL: Holiday, season, weather
    if (types.includes('weather_trigger') ||
        /season|holiday|spring|summer|fall|winter|christmas|thanksgiving/.test(content)) {
      return 'LIFE_SEASONAL';
    }

    // EVERGREEN: Timeless content
    return 'LIFE_EVERGREEN';
  }

  // ============================================
  // V2: HOOK FORMULA ENGINE
  // ============================================

  /**
   * Select the best hook formula based on content signals
   */
  selectHookFormula(conn: Connection): HookFormula {
    const content = conn.dataPoints.map(dp => dp.content.toLowerCase()).join(' ');
    const types = conn.dataPoints.map(dp => dp.type);

    // NUMBER: Lists, counts, statistics
    if (/\d+\s+ways|\d+\s+things|top\s+\d+|\d+\s+tips/.test(content)) {
      return 'NUMBER';
    }

    // QUESTION: Question patterns
    if (types.includes('question') || types.includes('people_also_ask') ||
        /are\s+you|do\s+you|have\s+you|should\s+you/.test(content)) {
      return 'QUESTION';
    }

    // CONTRARIAN: Myth-busting
    if (/myth|wrong|actually|contrary|not\s+what/.test(content)) {
      return 'CONTRARIAN';
    }

    // STORY: Case studies, journeys
    if (/story|how\s+\w+\s+achieved|journey|experience|case\s+study/.test(content)) {
      return 'STORY';
    }

    // DATA: Statistics, research
    if (/\d+%|percent|statistics|research|study|survey|data/.test(content)) {
      return 'DATA';
    }

    // URGENCY: Time-sensitive
    if (/deadline|expires|limited|ending|urgent|today/.test(content) ||
        conn.timingRelevance > 0.5) {
      return 'URGENCY';
    }

    // CURIOSITY: Secrets, hidden
    if (/secret|hidden|unknown|surprising|reveal|discover/.test(content)) {
      return 'CURIOSITY';
    }

    // FEAR: Risks, dangers
    if (/risk|danger|avoid|mistake|fail|problem|threat/.test(content)) {
      return 'FEAR';
    }

    // DESIRE: Benefits, outcomes
    if (/imagine|dream|achieve|success|without\s+the/.test(content)) {
      return 'DESIRE';
    }

    // SOCIAL_PROOF: Reviews, testimonials
    if (/review|\d+\s+customers|\d+\s+people|trust|recommend/.test(content)) {
      return 'SOCIAL_PROOF';
    }

    // HOWTO: Instructions
    if (/how\s+to|step\s+by\s+step|guide|tutorial/.test(content)) {
      return 'HOWTO';
    }

    // COMPARISON: vs patterns
    if (/vs\b|versus|compare|better\s+than|alternative/.test(content)) {
      return 'COMPARISON';
    }

    // MISTAKE: Error patterns
    if (/mistake|error|wrong|avoid|don't\s+do/.test(content)) {
      return 'MISTAKE';
    }

    // SECRET: Hidden knowledge
    if (/secret|insider|don't\s+share|they\s+don't/.test(content)) {
      return 'SECRET';
    }

    // PREDICTION: Future trends
    if (/predict|future|will|2024|2025|trend|forecast/.test(content) ||
        types.includes('trending_topic')) {
      return 'PREDICTION';
    }

    // Default based on emotional intensity
    return conn.emotionalIntensity > 0.5 ? 'FEAR' : 'HOWTO';
  }

  /**
   * Generate title using AI (V3) with template fallback
   * V3: Prioritizes AI-generated titles from cache, falls back to template only if AI unavailable
   */
  generateTitleWithHook(conn: Connection, formula: HookFormula): string {
    // V3: Check AI cache first
    const aiTitle = this.getAITitle(conn.id);
    if (aiTitle && aiTitle.title && aiTitle.title.length > 10) {
      return aiTitle.title;
    }

    // V3: If no AI title, generate a data-driven title from actual content
    // This is a MUCH better fallback than the old template system
    const bestDataPoint = conn.dataPoints
      .filter(dp => dp.content && dp.content.length > 30)
      .sort((a, b) => b.content.length - a.content.length)[0];

    if (bestDataPoint) {
      const content = bestDataPoint.content;
      // Extract the first meaningful sentence or phrase
      const sentences = content.split(/[.!?]/);
      const firstSentence = sentences[0]?.trim();

      if (firstSentence && firstSentence.length > 20 && firstSentence.length < 100) {
        // Clean and format as title
        let title = firstSentence
          .replace(/^(how|why|what|when|the)\s+/i, (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase())
          .replace(/\s+/g, ' ')
          .trim();

        // Ensure it starts with capital
        title = title.charAt(0).toUpperCase() + title.slice(1);

        // Add source indicator for cross-platform insights
        if (conn.sources.length >= 3) {
          return `Cross-Platform Insight: ${title}`;
        }
        return title;
      }
    }

    // Last resort: Generate from themes
    const themes = conn.themes || [];
    if (themes.length > 0) {
      const themeTitle = themes.slice(0, 2).map(t =>
        t.charAt(0).toUpperCase() + t.slice(1)
      ).join(' & ');
      return `${conn.connectionType} Discovery: ${themeTitle}`;
    }

    // Absolute fallback - still better than template garbage
    return `${conn.connectionType} Insight from ${conn.sources.join(' + ')}`;
  }

  // Helper extractors for hook formula engine
  private extractTopic(conn: Connection): string {
    const content = conn.dataPoints[0]?.content || '';
    const allContent = conn.dataPoints.map(dp => dp.content).join(' ').toLowerCase();

    // B2B/Insurance specific topics
    if (/quote.*abandon|abandon.*quote/.test(allContent)) return 'Quote Abandonment';
    if (/compliance|regulatory|audit/.test(allContent)) return 'Compliance';
    if (/digital\s*transform/.test(allContent)) return 'Digital Transformation';
    if (/customer\s*experience|cx\b/.test(allContent)) return 'Customer Experience';
    if (/ai\s*agent|chatbot|conversational/.test(allContent)) return 'AI Agents';
    if (/insurance|policy|underwriting/.test(allContent)) return 'Insurance Digital Journey';
    if (/conversion|convert/.test(allContent)) return 'Conversion Optimization';
    if (/saas|software/.test(allContent)) return 'SaaS Strategy';

    // Extract noun phrase after common patterns
    const match = content.match(/(?:about|with|for|in|on)\s+(\w+(?:\s+\w+){0,2})/i);
    if (match && match[1].length > 3) return match[1];

    // Try to find key business terms
    const keyTerms = content.match(/(?:sales|marketing|operations|customer|revenue|cost|efficiency|growth|automation)/gi);
    if (keyTerms && keyTerms.length > 0) {
      return keyTerms[0].charAt(0).toUpperCase() + keyTerms[0].slice(1);
    }

    // Fallback: first significant noun phrase
    const words = content.split(/\s+/).filter(w => w.length > 4 && !/^(this|that|with|from|your|their)$/i.test(w));
    return words.slice(0, 2).join(' ') || 'This Strategy';
  }

  private extractOutcome(conn: Connection): string {
    const content = conn.dataPoints.map(dp => dp.content).join(' ').toLowerCase();

    // B2B/Insurance specific outcomes
    if (/quote.*conversion|convert.*quote/.test(content)) return 'Convert More Quotes';
    if (/compliance|audit|regulatory/.test(content)) return 'Ensure Compliance';
    if (/abandon/.test(content)) return 'Recover Abandoned Prospects';
    if (/digital\s*journey|customer\s*experience/.test(content)) return 'Improve Customer Experience';
    if (/automat|ai\s*agent|chatbot/.test(content)) return 'Scale with AI';
    if (/revenue|sales|conversion/.test(content)) return 'Increase Revenue';
    if (/cost|savings|efficient/.test(content)) return 'Reduce Costs';
    if (/satisfaction|nps|csat/.test(content)) return 'Boost Customer Satisfaction';

    // Generic fallbacks
    if (/save|cost|cheap|afford/.test(content)) return 'Save Money';
    if (/time|fast|quick|efficient/.test(content)) return 'Save Time';
    if (/sale|revenue|profit/.test(content)) return 'Increase Sales';
    if (/customer|client|lead/.test(content)) return 'Get More Customers';
    if (/grow|boost|improve/.test(content)) return 'Grow Your Business';

    return 'Achieve Better Results';
  }

  private extractCount(content: string): string {
    const match = content.match(/(\d+)/);
    return match ? match[1] : '7';
  }

  private extractCompany(content: string): string {
    const match = content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    return match ? match[1] : 'One Company';
  }

  private extractPercentage(content: string): string {
    const match = content.match(/(\d+%)/);
    return match ? match[1] : '73%';
  }

  private extractTimeframe(content: string): string {
    if (/day|today/.test(content)) return '30 Days';
    if (/week/.test(content)) return '2 Weeks';
    if (/month/.test(content)) return '3 Months';
    if (/year/.test(content)) return '1 Year';
    return '90 Days';
  }

  private extractAudience(conn: Connection): string {
    const content = conn.dataPoints.map(dp => dp.content).join(' ').toLowerCase();

    if (/homeowner|home\s+owner/.test(content)) return 'Homeowners';
    if (/business|company|owner/.test(content)) return 'Business Owners';
    if (/customer|buyer|shopper/.test(content)) return 'Customers';
    if (/professional|expert/.test(content)) return 'Professionals';

    return 'People';
  }

  private extractProblem(conn: Connection): string {
    const content = conn.dataPoints.map(dp => dp.content).join(' ').toLowerCase();

    // B2B/Insurance specific problems
    if (/quote.*abandon|abandon.*quote/.test(content)) return 'Quote Abandonment';
    if (/compliance|audit|regulatory/.test(content)) return 'Compliance Risk';
    if (/manual|paperwork|inefficient/.test(content)) return 'Manual Processes';
    if (/slow|wait|delay/.test(content)) return 'Slow Response Times';
    if (/competitor|losing|market\s*share/.test(content)) return 'Competitive Pressure';
    if (/scale|capacity|volume/.test(content)) return 'Scaling Challenges';
    if (/cost|expensive|budget/.test(content)) return 'High Operational Costs';
    if (/integrat|connect|silo/.test(content)) return 'Integration Gaps';
    if (/ai|automation/.test(content)) return 'AI Implementation';

    // Generic fallbacks
    if (/trust|scam|reliable/.test(content)) return 'Trust Issues';
    if (/quality|poor|bad/.test(content)) return 'Poor Quality';
    if (/time|slow|delay/.test(content)) return 'Wasted Time';

    return 'Industry Challenges';
  }

  private extractEvent(conn: Connection): string {
    const content = conn.dataPoints.map(dp => dp.content).join(' ').toLowerCase();

    if (/season|spring|summer|fall|winter/.test(content)) return 'The Season Change';
    if (/holiday|christmas|thanksgiving/.test(content)) return 'The Holiday Season';
    if (/deadline|tax|filing/.test(content)) return 'The Deadline';
    if (/storm|rain|snow|weather/.test(content)) return 'Severe Weather';

    return 'This Industry Shift';
  }

  private extractIndustry(conn: Connection): string {
    const content = conn.dataPoints.map(dp => dp.content).join(' ').toLowerCase();

    // B2B specific industries
    if (/insurance|policy|underwriting|claim/.test(content)) return 'Insurance';
    if (/fintech|financial|banking/.test(content)) return 'Financial Services';
    if (/saas|software|platform/.test(content)) return 'SaaS';
    if (/healthcare|medical|patient/.test(content)) return 'Healthcare';
    if (/legal|law\s*firm|attorney/.test(content)) return 'Legal Services';

    // SMB industries
    if (/hvac|heating|cooling|air/.test(content)) return 'HVAC';
    if (/plumb|pipe|water/.test(content)) return 'Plumbing';
    if (/roof|shingle/.test(content)) return 'Roofing';
    if (/electric|wiring/.test(content)) return 'Electrical';
    if (/market|seo|digital/.test(content)) return 'Marketing';

    return 'Your Industry';
  }

  private extractProductA(conn: Connection): string {
    const sources = conn.sources;
    if (sources.includes('semrush')) return 'Your Solution';
    return 'Option A';
  }

  private extractProductB(conn: Connection): string {
    const types = conn.dataPoints.map(dp => dp.type);
    if (types.includes('competitor_weakness')) return 'Competitors';
    return 'Option B';
  }

  private extractCompetitors(conn: Connection): string {
    return 'Big Competitors';
  }

  // ============================================
  // V2: VARIETY ENFORCEMENT (Enhanced with minimums)
  // ============================================

  // Track last N hook formulas for rotation
  private lastHookFormulas: HookFormula[] = [];
  private readonly HOOK_ROTATION_WINDOW = 3;

  /**
   * Get next hook formula with rotation (no consecutive repeats)
   */
  getRotatedHookFormula(conn: Connection): HookFormula {
    const preferredFormula = this.selectHookFormula(conn);

    // If this formula was used in last N, try to find alternative
    if (this.lastHookFormulas.slice(-this.HOOK_ROTATION_WINDOW).includes(preferredFormula)) {
      const allFormulas: HookFormula[] = [
        'NUMBER', 'QUESTION', 'CONTRARIAN', 'STORY', 'DATA',
        'URGENCY', 'CURIOSITY', 'FEAR', 'DESIRE', 'SOCIAL_PROOF',
        'HOWTO', 'COMPARISON', 'MISTAKE', 'SECRET', 'PREDICTION'
      ];
      // Find formula not recently used
      const available = allFormulas.filter(f => !this.lastHookFormulas.slice(-this.HOOK_ROTATION_WINDOW).includes(f));
      if (available.length > 0) {
        const rotated = available[Math.floor(Math.random() * available.length)];
        this.lastHookFormulas.push(rotated);
        return rotated;
      }
    }

    this.lastHookFormulas.push(preferredFormula);
    return preferredFormula;
  }

  /**
   * Create combined hash of content + dimensions for smart deduplication
   */
  createCombinedHash(conn: Connection, dimensions: InsightDimensions): string {
    const contentHash = conn.dataPoints
      .map(dp => dp.content.substring(0, 30).toLowerCase().replace(/\s+/g, ''))
      .sort()
      .join('|');

    const dimensionHash = `${dimensions.journeyStage}-${dimensions.emotion}-${dimensions.format}-${dimensions.pillar}`;

    return `${contentHash}::${dimensionHash}`;
  }

  // REMOVED: enforceVariety() - V3 Atomizer handles all variety enforcement
  // This legacy function was causing bottlenecks by capping insights at targetCount
  // and enforcing dimension caps that the Atomizer now handles better

  /**
   * Generate breakthrough angles with V2 dimension tagging
   * V3 FIX: NO DEDUP HERE - Atomizer handles ALL deduplication
   */
  async generateBreakthroughAnglesV2(
    connections: Connection[],
    segment: BusinessSegment = 'SMB_LOCAL'
  ): Promise<BreakthroughAngle[]> {
    if (connections.length === 0) return [];

    // Reset hook rotation for new batch
    this.lastHookFormulas = [];

    const breakthroughs: BreakthroughAngle[] = [];

    // V3 FIX: Process ALL connections - no slice, no dedup, no caps
    // Atomizer will handle deduplication with format:stage:title combo
    for (const conn of connections) {
      // Tag dimensions for metadata enrichment only
      const dimensions = this.tagDimensions(conn, segment);
      conn.dimensions = dimensions;

      // Get rotated hook formula (for variety, not dedup)
      const hookFormula = this.getRotatedHookFormula(conn);
      dimensions.hookFormula = hookFormula;

      // Generate title using rotated hook formula
      const title = this.generateTitleWithHook(conn, hookFormula);

      const provenance = conn.dataPoints.map(dp => `${dp.source}: "${dp.content.substring(0, 50)}..."`);

      breakthroughs.push({
        id: `breakthrough-v2-${breakthroughs.length}`,
        title,
        hook: this.generateHook(conn),
        connections: [conn],
        score: conn.breakthroughScore,
        provenance,
        urgency: dimensions.urgency === 'URGENT_CRITICAL' ? 'critical' :
                 dimensions.urgency === 'URGENT_HIGH' ? 'high' :
                 dimensions.urgency === 'URGENT_MEDIUM' ? 'medium' : 'low',
        dimensions,
        hookFormula
      });
    }

    // V3 FIX: NO enforceVariety - Atomizer handles variety via dimension caps
    console.log(`[ConnectionDiscovery] V2: Generated ${breakthroughs.length} breakthroughs from ${connections.length} connections (no dedup)`);
    return breakthroughs.sort((a, b) => b.score - a.score);
  }

  // REMOVED: extractPrimaryTopic() - Was only used by topic frequency capping in generateBreakthroughAnglesV2
  // V3 Atomizer handles variety via format×stage combinations, so topic capping is no longer needed
}

export const connectionDiscoveryService = new ConnectionDiscoveryService();
