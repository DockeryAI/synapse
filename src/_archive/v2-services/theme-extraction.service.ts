/**
 * Theme Extraction Service
 *
 * Content-based theme extraction with keyword analysis, semantic clustering,
 * and uniqueness enforcement. Analyzes actual data point content (not just metadata)
 * to discover meaningful themes for content generation.
 */

import { v4 as uuidv4 } from 'uuid';
import { embeddingService } from '../intelligence/embedding.service';
import type { DataPoint } from '@/types/connections.types';
import {
  DEFAULT_THEME_EXTRACTION_CONFIG,
  type Theme,
  type ThemeCluster,
  type ThemeExtractionResult,
  type ThemeExtractionInput,
  type ThemeExtractionConfig,
  type UniquenessScore,
  type ExtractedKeyword,
  type KeywordExtractionResult,
  type ContentAnalysis,
  type ThemeExtractionStats,
} from '@/types/v2/theme.types';

// English stop words for filtering
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
  'where', 'who', 'which', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now', 'also',
  'into', 'could', 'would', 'there', 'their', 'then', 'these', 'your', 'our',
  'out', 'up', 'down', 'about', 'after', 'before', 'between', 'through', 'during',
  'above', 'below', 'under', 'over', 'again', 'further', 'once', 'here', 'why',
  'been', 'being', 'because', 'until', 'while', 'any', 'does', 'doing', 'did',
  'get', 'got', 'getting', 'like', 'make', 'made', 'making', 'know', 'think',
  'come', 'came', 'going', 'want', 'see', 'look', 'use', 'find', 'give', 'tell',
  'may', 'well', 'back', 'much', 'even', 'way', 'new', 'take', 'good', 'first',
  'say', 'said', 'time', 'year', 'one', 'two', 'people', 'thing', 'really',
]);

class ThemeExtractionService {
  private usedThemes: Map<string, Theme> = new Map();
  private usedThemeEmbeddings: Map<string, number[]> = new Map();

  /**
   * Main extraction method - analyzes data points and extracts unique themes
   */
  async extractThemes(input: ThemeExtractionInput): Promise<ThemeExtractionResult> {
    const startTime = Date.now();
    const config: ThemeExtractionConfig = {
      ...DEFAULT_THEME_EXTRACTION_CONFIG,
      ...input.config,
    };

    console.log(`[ThemeExtraction] Starting extraction for ${input.dataPoints.length} data points`);

    // Register previously used themes
    if (input.usedThemes?.length) {
      await this.registerUsedThemes(input.usedThemes);
    }

    // Step 1: Analyze content from all data points
    const contentAnalyses = this.analyzeContent(input.dataPoints);

    // Step 2: Extract keywords with frequency weighting
    const keywordResult = this.extractKeywords(contentAnalyses, config);

    // Step 3: Generate candidate themes from keywords
    const candidateThemes = await this.generateCandidateThemes(
      keywordResult,
      contentAnalyses,
      input.dataPoints,
      config
    );

    // Step 4: Generate embeddings for semantic analysis
    let embeddingsGenerated = 0;
    if (config.useEmbeddings) {
      embeddingsGenerated = await this.generateThemeEmbeddings(candidateThemes);
    }

    // Step 5: Cluster similar themes
    const clusters = this.clusterThemes(candidateThemes, config);

    // Step 6: Enforce uniqueness against used themes
    const { acceptedThemes, rejectedThemes } = await this.enforceUniqueness(
      candidateThemes,
      config
    );

    // Step 7: Limit to max themes
    const finalThemes = acceptedThemes.slice(0, config.maxThemes);

    // Calculate stats
    const stats: ThemeExtractionStats = {
      dataPointsAnalyzed: input.dataPoints.length,
      totalKeywords: keywordResult.keywords.length,
      uniqueKeywords: new Set(keywordResult.keywords.map(k => k.word)).size,
      themesBeforeFiltering: candidateThemes.length,
      finalThemeCount: finalThemes.length,
      clusterCount: clusters.length,
      averageConfidence: this.calculateAverage(finalThemes.map(t => t.confidence)),
      averageUniqueness: this.calculateAverage(
        acceptedThemes.map(t => {
          const score = this.calculateUniquenessScore(t);
          return score.score;
        })
      ),
    };

    const result: ThemeExtractionResult = {
      themes: finalThemes,
      clusters,
      rejectedThemes,
      stats,
      metadata: {
        startedAt: new Date(startTime),
        completedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        embeddingsGenerated,
        estimatedCost: embeddingsGenerated * 0.00002, // Rough estimate
        config,
      },
    };

    // Register accepted themes as used
    for (const theme of finalThemes) {
      this.usedThemes.set(theme.id, theme);
      if (theme.embedding) {
        this.usedThemeEmbeddings.set(theme.id, theme.embedding);
      }
    }

    console.log(`[ThemeExtraction] Extracted ${finalThemes.length} themes, rejected ${rejectedThemes.length} duplicates`);

    return result;
  }

  /**
   * Analyze content from data points (not just metadata)
   */
  private analyzeContent(dataPoints: DataPoint[]): ContentAnalysis[] {
    return dataPoints.map(dp => {
      const text = dp.content.toLowerCase();

      // Extract keywords from actual content
      const words = this.tokenize(text);
      const wordFreq = new Map<string, number>();

      for (const word of words) {
        if (!STOP_WORDS.has(word) && word.length > 2) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
      }

      const keywords: ExtractedKeyword[] = Array.from(wordFreq.entries())
        .map(([word, freq]) => ({
          word,
          frequency: freq,
          tfidf: 0, // Calculated later across all docs
          isStopWord: STOP_WORDS.has(word),
        }))
        .sort((a, b) => b.frequency - a.frequency);

      // Extract key phrases (2-3 word combinations)
      const keyPhrases = this.extractKeyPhrases(text);

      return {
        dataPointId: dp.id,
        keywords,
        sentiment: dp.metadata?.sentiment || 'neutral',
        domain: dp.metadata?.domain || null,
        keyPhrases,
      };
    });
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Extract key phrases (n-grams) from text
   */
  private extractKeyPhrases(text: string): string[] {
    const words = this.tokenize(text);
    const phrases: string[] = [];

    // Bigrams
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i];
      const w2 = words[i + 1];
      if (!STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
        phrases.push(`${w1} ${w2}`);
      }
    }

    // Trigrams
    for (let i = 0; i < words.length - 2; i++) {
      const w1 = words[i];
      const w2 = words[i + 1];
      const w3 = words[i + 2];
      if (!STOP_WORDS.has(w1) && !STOP_WORDS.has(w3)) {
        phrases.push(`${w1} ${w2} ${w3}`);
      }
    }

    return phrases;
  }

  /**
   * Extract keywords with TF-IDF weighting across all content
   */
  private extractKeywords(
    analyses: ContentAnalysis[],
    config: ThemeExtractionConfig
  ): KeywordExtractionResult {
    const globalWordFreq = new Map<string, number>();
    const documentFrequency = new Map<string, number>();
    const totalDocs = analyses.length;

    // Count global frequency and document frequency
    for (const analysis of analyses) {
      const seenInDoc = new Set<string>();

      for (const kw of analysis.keywords) {
        globalWordFreq.set(kw.word, (globalWordFreq.get(kw.word) || 0) + kw.frequency);

        if (!seenInDoc.has(kw.word)) {
          documentFrequency.set(kw.word, (documentFrequency.get(kw.word) || 0) + 1);
          seenInDoc.add(kw.word);
        }
      }
    }

    // Calculate TF-IDF for each keyword
    const keywords: ExtractedKeyword[] = Array.from(globalWordFreq.entries())
      .map(([word, freq]) => {
        const df = documentFrequency.get(word) || 1;
        const idf = Math.log(totalDocs / df);
        const tfidf = freq * idf;

        return {
          word,
          frequency: freq,
          tfidf,
          isStopWord: STOP_WORDS.has(word),
        };
      })
      .filter(kw => kw.frequency >= config.minKeywordFrequency)
      .sort((a, b) => b.tfidf - a.tfidf);

    // Extract n-grams
    const ngramFreq = new Map<string, number>();
    for (const analysis of analyses) {
      for (const phrase of analysis.keyPhrases) {
        ngramFreq.set(phrase, (ngramFreq.get(phrase) || 0) + 1);
      }
    }

    const ngrams = Array.from(ngramFreq.entries())
      .filter(([, freq]) => freq >= config.minKeywordFrequency)
      .map(([phrase, frequency]) => ({
        phrase,
        frequency,
        words: phrase.split(' '),
      }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      keywords,
      ngrams,
      documentFrequency,
      totalDocuments: totalDocs,
    };
  }

  /**
   * Generate candidate themes from extracted keywords
   */
  private async generateCandidateThemes(
    keywordResult: KeywordExtractionResult,
    analyses: ContentAnalysis[],
    dataPoints: DataPoint[],
    config: ThemeExtractionConfig
  ): Promise<Theme[]> {
    const themes: Theme[] = [];
    const topKeywords = keywordResult.keywords.slice(0, 50);
    const topNgrams = keywordResult.ngrams.slice(0, 30);

    // Generate themes from top keywords
    for (let i = 0; i < Math.min(topKeywords.length, config.maxThemes * 2); i++) {
      const primary = topKeywords[i];

      // Find related keywords for secondary and modifier
      const relatedKeywords = this.findRelatedKeywords(primary.word, topKeywords, analyses);
      const secondary = relatedKeywords[0]?.word || null;
      const uniqueModifier = relatedKeywords[1]?.word || null;

      // Find source data points
      const sourceIds = this.findSourceDataPoints(primary.word, analyses, dataPoints);

      const theme: Theme = {
        id: uuidv4(),
        primary: this.capitalizeWords(primary.word),
        secondary: secondary ? this.capitalizeWords(secondary) : null,
        uniqueModifier: uniqueModifier ? this.capitalizeWords(uniqueModifier) : null,
        keywords: [primary.word, ...relatedKeywords.map(k => k.word)].slice(0, config.maxKeywordsPerTheme),
        confidence: this.calculateConfidence(primary, relatedKeywords, sourceIds.length),
        sourceDataPointIds: sourceIds,
        extractedAt: new Date(),
      };

      themes.push(theme);
    }

    // Generate themes from n-grams (higher quality themes)
    for (const ngram of topNgrams.slice(0, config.maxThemes)) {
      const sourceIds = this.findSourceDataPointsForPhrase(ngram.phrase, analyses, dataPoints);

      const theme: Theme = {
        id: uuidv4(),
        primary: this.capitalizeWords(ngram.phrase),
        secondary: null,
        uniqueModifier: null,
        keywords: ngram.words,
        confidence: Math.min(0.9, ngram.frequency / 10),
        sourceDataPointIds: sourceIds,
        extractedAt: new Date(),
      };

      themes.push(theme);
    }

    return themes;
  }

  /**
   * Find keywords that co-occur with a given word
   */
  private findRelatedKeywords(
    word: string,
    allKeywords: ExtractedKeyword[],
    analyses: ContentAnalysis[]
  ): ExtractedKeyword[] {
    const cooccurrence = new Map<string, number>();

    for (const analysis of analyses) {
      const hasWord = analysis.keywords.some(k => k.word === word);
      if (hasWord) {
        for (const kw of analysis.keywords) {
          if (kw.word !== word && !STOP_WORDS.has(kw.word)) {
            cooccurrence.set(kw.word, (cooccurrence.get(kw.word) || 0) + 1);
          }
        }
      }
    }

    return allKeywords
      .filter(kw => cooccurrence.has(kw.word))
      .sort((a, b) => (cooccurrence.get(b.word) || 0) - (cooccurrence.get(a.word) || 0))
      .slice(0, 5);
  }

  /**
   * Find data points that contain a keyword
   */
  private findSourceDataPoints(
    keyword: string,
    analyses: ContentAnalysis[],
    dataPoints: DataPoint[]
  ): string[] {
    const ids: string[] = [];

    for (const analysis of analyses) {
      if (analysis.keywords.some(k => k.word === keyword)) {
        ids.push(analysis.dataPointId);
      }
    }

    return ids;
  }

  /**
   * Find data points that contain a phrase
   */
  private findSourceDataPointsForPhrase(
    phrase: string,
    analyses: ContentAnalysis[],
    dataPoints: DataPoint[]
  ): string[] {
    const ids: string[] = [];
    const phraseLower = phrase.toLowerCase();

    for (let i = 0; i < dataPoints.length; i++) {
      if (dataPoints[i].content.toLowerCase().includes(phraseLower)) {
        ids.push(dataPoints[i].id);
      }
    }

    return ids;
  }

  /**
   * Calculate theme confidence based on keyword strength and source count
   */
  private calculateConfidence(
    primary: ExtractedKeyword,
    related: ExtractedKeyword[],
    sourceCount: number
  ): number {
    const freqScore = Math.min(1, primary.frequency / 20);
    const tfidfScore = Math.min(1, primary.tfidf / 10);
    const relatedScore = Math.min(1, related.length / 5);
    const sourceScore = Math.min(1, sourceCount / 5);

    return (freqScore * 0.3 + tfidfScore * 0.3 + relatedScore * 0.2 + sourceScore * 0.2);
  }

  /**
   * Generate embeddings for themes
   */
  private async generateThemeEmbeddings(themes: Theme[]): Promise<number> {
    let generated = 0;

    for (const theme of themes) {
      try {
        const text = [
          theme.primary,
          theme.secondary,
          theme.uniqueModifier,
          ...theme.keywords
        ].filter(Boolean).join(' ');

        const embedding = await embeddingService.generateEmbedding(text);
        theme.embedding = embedding;
        generated++;
      } catch (error) {
        console.warn(`[ThemeExtraction] Failed to generate embedding for theme ${theme.id}:`, error);
      }
    }

    return generated;
  }

  /**
   * Cluster similar themes using semantic similarity
   */
  private clusterThemes(themes: Theme[], config: ThemeExtractionConfig): ThemeCluster[] {
    const clusters: ThemeCluster[] = [];
    const assigned = new Set<string>();

    for (const theme of themes) {
      if (assigned.has(theme.id)) continue;

      // Find all themes similar to this one
      const clusterThemes: Theme[] = [theme];
      assigned.add(theme.id);

      for (const other of themes) {
        if (assigned.has(other.id)) continue;

        const similarity = this.calculateThemeSimilarity(theme, other);
        if (similarity >= config.clusteringSimilarityThreshold) {
          clusterThemes.push(other);
          assigned.add(other.id);
        }
      }

      // Only create cluster if there's more than one theme
      if (clusterThemes.length > 1) {
        const cluster = this.createCluster(clusterThemes);
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Calculate similarity between two themes
   */
  private calculateThemeSimilarity(a: Theme, b: Theme): number {
    // Use embedding similarity if available
    if (a.embedding && b.embedding) {
      return embeddingService.cosineSimilarity(a.embedding, b.embedding);
    }

    // Fallback to keyword overlap
    const aKeywords = new Set(a.keywords.map(k => k.toLowerCase()));
    const bKeywords = new Set(b.keywords.map(k => k.toLowerCase()));

    const intersection = new Set([...aKeywords].filter(x => bKeywords.has(x)));
    const union = new Set([...aKeywords, ...bKeywords]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Create a cluster from a group of themes
   */
  private createCluster(themes: Theme[]): ThemeCluster {
    // Find centroid (highest confidence theme)
    const centroid = themes.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    // Calculate cohesion (average pairwise similarity)
    let totalSimilarity = 0;
    let pairs = 0;
    for (let i = 0; i < themes.length; i++) {
      for (let j = i + 1; j < themes.length; j++) {
        totalSimilarity += this.calculateThemeSimilarity(themes[i], themes[j]);
        pairs++;
      }
    }
    const cohesion = pairs > 0 ? totalSimilarity / pairs : 1;

    // Find common keywords
    const keywordCounts = new Map<string, number>();
    for (const theme of themes) {
      for (const kw of theme.keywords) {
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
      }
    }
    const commonKeywords = Array.from(keywordCounts.entries())
      .filter(([, count]) => count >= themes.length * 0.5)
      .map(([kw]) => kw);

    // Count unique sources
    const allSources = new Set(themes.flatMap(t => t.sourceDataPointIds));

    return {
      id: uuidv4(),
      centroid,
      themes,
      cohesion,
      commonKeywords,
      sourceCount: allSources.size,
    };
  }

  /**
   * Enforce uniqueness against previously used themes
   */
  private async enforceUniqueness(
    themes: Theme[],
    config: ThemeExtractionConfig
  ): Promise<{
    acceptedThemes: Theme[];
    rejectedThemes: Array<{ theme: Theme; uniquenessScore: UniquenessScore }>;
  }> {
    const acceptedThemes: Theme[] = [];
    const rejectedThemes: Array<{ theme: Theme; uniquenessScore: UniquenessScore }> = [];

    for (const theme of themes) {
      const uniquenessScore = this.calculateUniquenessScore(theme);

      if (uniquenessScore.isUnique) {
        acceptedThemes.push(theme);
      } else {
        rejectedThemes.push({ theme, uniquenessScore });
      }
    }

    // Sort accepted by confidence
    acceptedThemes.sort((a, b) => b.confidence - a.confidence);

    return { acceptedThemes, rejectedThemes };
  }

  /**
   * Calculate how unique a theme is compared to used themes
   */
  calculateUniquenessScore(theme: Theme): UniquenessScore {
    if (this.usedThemes.size === 0) {
      return {
        score: 1,
        closestMatch: null,
        closestMatchSimilarity: 0,
        isUnique: true,
        reasons: ['No previous themes to compare against'],
      };
    }

    let closestMatch: Theme | null = null;
    let highestSimilarity = 0;

    for (const [, usedTheme] of this.usedThemes) {
      const similarity = this.calculateThemeSimilarity(theme, usedTheme);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        closestMatch = usedTheme;
      }
    }

    const score = 1 - highestSimilarity;
    const isUnique = highestSimilarity < 0.7; // Threshold for uniqueness

    const reasons: string[] = [];
    if (isUnique) {
      reasons.push(`Sufficiently different from existing themes (similarity: ${(highestSimilarity * 100).toFixed(1)}%)`);
    } else {
      reasons.push(`Too similar to existing theme "${closestMatch?.primary}" (similarity: ${(highestSimilarity * 100).toFixed(1)}%)`);
    }

    return {
      score,
      closestMatch,
      closestMatchSimilarity: highestSimilarity,
      isUnique,
      reasons,
    };
  }

  /**
   * Register themes as used for future uniqueness checks
   */
  async registerUsedThemes(themes: Theme[]): Promise<void> {
    for (const theme of themes) {
      this.usedThemes.set(theme.id, theme);

      if (theme.embedding) {
        this.usedThemeEmbeddings.set(theme.id, theme.embedding);
      } else {
        // Generate embedding if not present
        try {
          const text = [theme.primary, theme.secondary, theme.uniqueModifier]
            .filter(Boolean)
            .join(' ');
          const embedding = await embeddingService.generateEmbedding(text);
          theme.embedding = embedding;
          this.usedThemeEmbeddings.set(theme.id, embedding);
        } catch (error) {
          console.warn(`[ThemeExtraction] Failed to generate embedding for used theme ${theme.id}`);
        }
      }
    }

    console.log(`[ThemeExtraction] Registered ${themes.length} used themes`);
  }

  /**
   * Clear used theme registry
   */
  clearUsedThemes(): void {
    this.usedThemes.clear();
    this.usedThemeEmbeddings.clear();
    console.log('[ThemeExtraction] Cleared used theme registry');
  }

  /**
   * Get currently used themes
   */
  getUsedThemes(): Theme[] {
    return Array.from(this.usedThemes.values());
  }

  /**
   * Capitalize first letter of each word
   */
  private capitalizeWords(str: string): string {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Calculate average of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}

export const themeExtractionService = new ThemeExtractionService();
