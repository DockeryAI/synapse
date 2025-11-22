/**
 * Theme Extraction Types
 *
 * Types for content-based theme extraction with semantic clustering
 * and uniqueness enforcement.
 */

import type { DataPoint } from '../connections.types';

/**
 * Extracted keyword with frequency and relevance scoring
 */
export interface ExtractedKeyword {
  word: string;
  frequency: number;
  tfidf: number; // Term frequency-inverse document frequency
  isStopWord: boolean;
}

/**
 * Theme represents an extracted topic/angle from content analysis
 */
export interface Theme {
  id: string;
  /** Primary topic of the theme */
  primary: string;
  /** Secondary angle or modifier */
  secondary: string | null;
  /** Unique modifier that differentiates this theme */
  uniqueModifier: string | null;
  /** Keywords that define this theme */
  keywords: string[];
  /** Confidence score 0-1 */
  confidence: number;
  /** Source data point IDs that contributed to this theme */
  sourceDataPointIds: string[];
  /** Embedding vector for semantic comparison */
  embedding?: number[];
  /** Timestamp when theme was extracted */
  extractedAt: Date;
}

/**
 * Cluster of semantically similar themes
 */
export interface ThemeCluster {
  id: string;
  /** Centroid theme that represents the cluster */
  centroid: Theme;
  /** All themes in this cluster */
  themes: Theme[];
  /** Average semantic similarity within cluster */
  cohesion: number;
  /** Keywords common across all themes in cluster */
  commonKeywords: string[];
  /** Number of unique data sources represented */
  sourceCount: number;
}

/**
 * Score indicating how unique a theme is compared to existing themes
 */
export interface UniquenessScore {
  /** Overall uniqueness score 0-1 (higher = more unique) */
  score: number;
  /** Most similar existing theme, if any */
  closestMatch: Theme | null;
  /** Similarity to closest match 0-1 */
  closestMatchSimilarity: number;
  /** Whether this theme passes uniqueness threshold */
  isUnique: boolean;
  /** Specific reasons for uniqueness or lack thereof */
  reasons: string[];
}

/**
 * Configuration for theme extraction
 */
export interface ThemeExtractionConfig {
  /** Minimum keyword frequency to include */
  minKeywordFrequency: number;
  /** Maximum keywords per theme */
  maxKeywordsPerTheme: number;
  /** Minimum similarity for clustering (0-1) */
  clusteringSimilarityThreshold: number;
  /** Minimum uniqueness score to accept theme */
  uniquenessThreshold: number;
  /** Whether to use embeddings for semantic analysis */
  useEmbeddings: boolean;
  /** Maximum themes to extract */
  maxThemes: number;
  /** Custom stop words to filter */
  customStopWords?: string[];
}

/**
 * Default configuration for theme extraction
 */
export const DEFAULT_THEME_EXTRACTION_CONFIG: ThemeExtractionConfig = {
  minKeywordFrequency: 2,
  maxKeywordsPerTheme: 10,
  clusteringSimilarityThreshold: 0.7,
  uniquenessThreshold: 0.3, // Below 0.3 similarity = unique enough
  useEmbeddings: true,
  maxThemes: 20,
};

/**
 * Result of theme extraction process
 */
export interface ThemeExtractionResult {
  /** Extracted themes after uniqueness filtering */
  themes: Theme[];
  /** Semantic clusters of related themes */
  clusters: ThemeCluster[];
  /** Themes that were rejected for being too similar */
  rejectedThemes: Array<{
    theme: Theme;
    uniquenessScore: UniquenessScore;
  }>;
  /** Processing statistics */
  stats: ThemeExtractionStats;
  /** Metadata about the extraction process */
  metadata: ThemeExtractionMetadata;
}

/**
 * Statistics from theme extraction
 */
export interface ThemeExtractionStats {
  /** Total data points analyzed */
  dataPointsAnalyzed: number;
  /** Total keywords extracted */
  totalKeywords: number;
  /** Unique keywords after filtering */
  uniqueKeywords: number;
  /** Themes before uniqueness filtering */
  themesBeforeFiltering: number;
  /** Final theme count after filtering */
  finalThemeCount: number;
  /** Number of clusters formed */
  clusterCount: number;
  /** Average theme confidence */
  averageConfidence: number;
  /** Average uniqueness score */
  averageUniqueness: number;
}

/**
 * Metadata about the extraction process
 */
export interface ThemeExtractionMetadata {
  /** When extraction started */
  startedAt: Date;
  /** When extraction completed */
  completedAt: Date;
  /** Total processing time in milliseconds */
  processingTimeMs: number;
  /** Number of embeddings generated */
  embeddingsGenerated: number;
  /** Estimated API cost */
  estimatedCost: number;
  /** Configuration used */
  config: ThemeExtractionConfig;
}

/**
 * Previously used themes for uniqueness tracking
 */
export interface UsedThemeRegistry {
  /** Map of theme ID to theme */
  themes: Map<string, Theme>;
  /** Embeddings for fast similarity lookup */
  embeddings: Map<string, number[]>;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Input for theme extraction
 */
export interface ThemeExtractionInput {
  /** Data points to analyze */
  dataPoints: DataPoint[];
  /** Previously used themes to avoid */
  usedThemes?: Theme[];
  /** Optional configuration overrides */
  config?: Partial<ThemeExtractionConfig>;
  /** Brand ID for context */
  brandId?: string;
}

/**
 * Keyword extraction result before theme formation
 */
export interface KeywordExtractionResult {
  /** All extracted keywords with scores */
  keywords: ExtractedKeyword[];
  /** N-grams (2-3 word phrases) */
  ngrams: Array<{
    phrase: string;
    frequency: number;
    words: string[];
  }>;
  /** Document frequency for TF-IDF calculation */
  documentFrequency: Map<string, number>;
  /** Total documents analyzed */
  totalDocuments: number;
}

/**
 * Content analysis result for a single data point
 */
export interface ContentAnalysis {
  dataPointId: string;
  /** Extracted keywords from content */
  keywords: ExtractedKeyword[];
  /** Detected sentiment */
  sentiment: 'positive' | 'negative' | 'neutral';
  /** Content domain */
  domain: string | null;
  /** Key phrases extracted */
  keyPhrases: string[];
}
