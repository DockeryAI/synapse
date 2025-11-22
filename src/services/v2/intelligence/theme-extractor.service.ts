/**
 * Theme Extractor Service
 *
 * Extracts messaging themes from competitor content,
 * clusters similar themes, and identifies unique vs common patterns.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  CompetitorContent,
  ExtractedTheme,
  ThemeCluster,
  ThemeExtractionInput,
  ThemeExtractionResult,
} from '@/types/v2/competitive.types';

// Stop words for filtering
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
  'where', 'who', 'which', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now', 'also',
  'your', 'our', 'we', 'you', 'their', 'them', 'us', 'me', 'my', 'i',
]);

// Theme category patterns
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  'value-prop': [
    /value|benefit|advantage|save|gain|improve|enhance|better|best/i,
  ],
  'feature': [
    /feature|function|capability|option|tool|include|support|offer/i,
  ],
  'benefit': [
    /result|outcome|achieve|success|grow|increase|boost|maximize/i,
  ],
  'pain-point': [
    /problem|issue|challenge|struggle|difficult|pain|frustrat|worry/i,
  ],
  'differentiator': [
    /unique|only|exclusive|first|innovate|different|unlike|special/i,
  ],
  'social-proof': [
    /customer|client|testimonial|review|case|study|trust|proven/i,
  ],
};

class ThemeExtractorService {
  /**
   * Extract themes from competitor content
   */
  extractThemes(input: ThemeExtractionInput): ThemeExtractionResult {
    const startTime = Date.now();
    const { content, minFrequency = 2, maxThemes = 50 } = input;

    console.log(`[ThemeExtractor] Extracting themes from ${content.length} content items`);

    // Extract all themes from content
    const themeMap = new Map<string, {
      frequency: number;
      competitorIds: Set<string>;
      keywords: string[];
      contexts: string[];
    }>();

    for (const item of content) {
      const extractedPhrases = this.extractPhrases(item.content);

      for (const phrase of extractedPhrases) {
        const normalized = phrase.toLowerCase();

        if (!themeMap.has(normalized)) {
          themeMap.set(normalized, {
            frequency: 0,
            competitorIds: new Set(),
            keywords: this.extractKeywords(phrase),
            contexts: [],
          });
        }

        const data = themeMap.get(normalized)!;
        data.frequency++;
        data.competitorIds.add(item.competitorId);
        if (data.contexts.length < 3) {
          data.contexts.push(this.extractContext(item.content, phrase));
        }
      }
    }

    // Convert to ExtractedTheme array
    const themes: ExtractedTheme[] = [];
    for (const [theme, data] of themeMap) {
      if (data.frequency >= minFrequency) {
        themes.push({
          id: uuidv4(),
          theme: this.capitalizePhrase(theme),
          frequency: data.frequency,
          competitorIds: Array.from(data.competitorIds),
          confidence: this.calculateConfidence(data.frequency, content.length),
          keywords: data.keywords,
          sentiment: this.detectSentiment(data.contexts),
          category: this.detectCategory(theme),
        });
      }
    }

    // Sort by frequency and limit
    themes.sort((a, b) => b.frequency - a.frequency);
    const topThemes = themes.slice(0, maxThemes);

    // Cluster similar themes
    const clusters = this.clusterThemes(topThemes);

    console.log(`[ThemeExtractor] Extracted ${topThemes.length} themes in ${clusters.length} clusters`);

    return {
      themes: topThemes,
      clusters,
      totalContent: content.length,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Extract meaningful phrases from content
   */
  private extractPhrases(content: string): string[] {
    const phrases: string[] = [];

    // Clean content
    const cleaned = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract n-grams (2-4 words)
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);

    // Bigrams
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i].toLowerCase().replace(/[^a-z]/g, '');
      const w2 = words[i + 1].toLowerCase().replace(/[^a-z]/g, '');

      if (w1.length > 2 && w2.length > 2 && !STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
        phrases.push(`${w1} ${w2}`);
      }
    }

    // Trigrams
    for (let i = 0; i < words.length - 2; i++) {
      const w1 = words[i].toLowerCase().replace(/[^a-z]/g, '');
      const w2 = words[i + 1].toLowerCase().replace(/[^a-z]/g, '');
      const w3 = words[i + 2].toLowerCase().replace(/[^a-z]/g, '');

      if (w1.length > 2 && w3.length > 2 && !STOP_WORDS.has(w1) && !STOP_WORDS.has(w3)) {
        phrases.push(`${w1} ${w2} ${w3}`);
      }
    }

    return phrases;
  }

  /**
   * Extract keywords from a phrase
   */
  private extractKeywords(phrase: string): string[] {
    return phrase
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  }

  /**
   * Extract context around a phrase
   */
  private extractContext(content: string, phrase: string): string {
    const index = content.toLowerCase().indexOf(phrase.toLowerCase());
    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + phrase.length + 50);

    return content.substring(start, end).trim();
  }

  /**
   * Calculate confidence score based on frequency
   */
  private calculateConfidence(frequency: number, totalContent: number): number {
    if (totalContent === 0) return 0;
    const ratio = frequency / totalContent;
    return Math.min(1, ratio * 2); // Cap at 1
  }

  /**
   * Detect sentiment from context
   */
  private detectSentiment(contexts: string[]): 'positive' | 'negative' | 'neutral' {
    const text = contexts.join(' ').toLowerCase();

    const positiveWords = ['great', 'best', 'excellent', 'amazing', 'love', 'perfect', 'success', 'easy', 'fast', 'powerful'];
    const negativeWords = ['problem', 'issue', 'difficult', 'hard', 'struggle', 'pain', 'fail', 'bad', 'slow', 'expensive'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount + 1) return 'positive';
    if (negativeCount > positiveCount + 1) return 'negative';
    return 'neutral';
  }

  /**
   * Detect theme category
   */
  private detectCategory(theme: string): ExtractedTheme['category'] | undefined {
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(theme)) {
          return category as ExtractedTheme['category'];
        }
      }
    }
    return undefined;
  }

  /**
   * Cluster similar themes together
   */
  clusterThemes(themes: ExtractedTheme[]): ThemeCluster[] {
    const clusters: ThemeCluster[] = [];
    const assigned = new Set<string>();

    for (const theme of themes) {
      if (assigned.has(theme.id)) continue;

      // Find similar themes
      const clusterThemes: ExtractedTheme[] = [theme];
      assigned.add(theme.id);

      for (const other of themes) {
        if (assigned.has(other.id)) continue;

        const similarity = this.calculateThemeSimilarity(theme, other);
        if (similarity >= 0.5) {
          clusterThemes.push(other);
          assigned.add(other.id);
        }
      }

      // Create cluster if multiple themes
      if (clusterThemes.length > 0) {
        const totalFrequency = clusterThemes.reduce((sum, t) => sum + t.frequency, 0);
        const allCompetitors = new Set(clusterThemes.flatMap(t => t.competitorIds));

        clusters.push({
          id: uuidv4(),
          name: this.generateClusterName(clusterThemes),
          themes: clusterThemes,
          totalFrequency,
          competitorCoverage: 0, // Will be calculated by analyzer
        });
      }
    }

    // Sort by total frequency
    clusters.sort((a, b) => b.totalFrequency - a.totalFrequency);

    return clusters;
  }

  /**
   * Calculate similarity between two themes
   */
  private calculateThemeSimilarity(a: ExtractedTheme, b: ExtractedTheme): number {
    // Keyword overlap
    const aKeywords = new Set(a.keywords);
    const bKeywords = new Set(b.keywords);

    const intersection = new Set([...aKeywords].filter(x => bKeywords.has(x)));
    const union = new Set([...aKeywords, ...bKeywords]);

    if (union.size === 0) return 0;

    const jaccardSimilarity = intersection.size / union.size;

    // Category match bonus
    const categoryBonus = a.category && a.category === b.category ? 0.2 : 0;

    return Math.min(1, jaccardSimilarity + categoryBonus);
  }

  /**
   * Generate a name for a cluster based on its themes
   */
  private generateClusterName(themes: ExtractedTheme[]): string {
    // Use the most frequent theme as the name
    const sorted = [...themes].sort((a, b) => b.frequency - a.frequency);
    return sorted[0].theme;
  }

  /**
   * Capitalize first letter of each word
   */
  private capitalizePhrase(phrase: string): string {
    return phrase
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Find themes unique to a specific set of content
   */
  findUniqueThemes(
    targetThemes: ExtractedTheme[],
    comparisonThemes: ExtractedTheme[]
  ): ExtractedTheme[] {
    const comparisonSet = new Set(
      comparisonThemes.map(t => t.theme.toLowerCase())
    );

    return targetThemes.filter(t =>
      !comparisonSet.has(t.theme.toLowerCase())
    );
  }

  /**
   * Find themes common between two sets
   */
  findCommonThemes(
    themesA: ExtractedTheme[],
    themesB: ExtractedTheme[]
  ): ExtractedTheme[] {
    const setB = new Set(themesB.map(t => t.theme.toLowerCase()));

    return themesA.filter(t => setB.has(t.theme.toLowerCase()));
  }
}

export const themeExtractorService = new ThemeExtractorService();
