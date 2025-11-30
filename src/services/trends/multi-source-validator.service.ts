/**
 * Multi-Source Validator Service
 *
 * Phase 2 of Trends 2.0 Build Plan
 * Validates trends by requiring they appear in 2+ sources.
 * Implements deduplication, matching, and cross-source validation scoring.
 *
 * Expected noise reduction: ~70%
 *
 * Created: 2025-11-29
 */

// ============================================================================
// TYPES
// ============================================================================

// Phase 10: Added use_case, outcome, persona for diversified query generation
export type QueryIntent = 'product' | 'industry' | 'pain_point' | 'opportunity' | 'trend' | 'local' | 'competitor' | 'use_case' | 'outcome' | 'persona';

export interface RawTrendItem {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  date?: string;
  metadata?: Record<string, any>;
  /** What type of query generated this trend (Phase 7) */
  queryIntent?: QueryIntent;
}

export interface ValidatedTrend {
  id: string;
  title: string;
  description: string;
  /** Sources that mentioned this trend */
  sources: SourceMention[];
  /** Number of unique sources */
  sourceCount: number;
  /** Cross-source validation score (0-100) */
  validationScore: number;
  /** Is this trend validated (appears in 2+ sources)? */
  isValidated: boolean;
  /** Combined metadata from all sources */
  combinedMetadata: Record<string, any>;
  /** Earliest mention date */
  firstSeen?: string;
  /** Most recent mention date */
  lastSeen?: string;
  /** Primary query intent that found this trend (Phase 7) */
  queryIntent: QueryIntent;
}

export interface SourceMention {
  source: string;
  title: string;
  description: string;
  url?: string;
  date?: string;
  matchScore: number; // How well this matched the trend topic
}

export interface ValidationConfig {
  /** Minimum sources required for validation */
  minSources: number;
  /** Minimum similarity score to consider a match (0-1) */
  similarityThreshold: number;
  /** Weight for title similarity */
  titleWeight: number;
  /** Weight for description similarity */
  descriptionWeight: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: ValidationConfig = {
  minSources: 2,
  similarityThreshold: 0.35,
  titleWeight: 0.6,
  descriptionWeight: 0.4
};

// ============================================================================
// TEXT SIMILARITY FUNCTIONS
// ============================================================================

/**
 * Tokenize text into words, removing stop words and normalizing
 */
function tokenize(text: string): string[] {
  if (!text) return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their',
    'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all',
    'your', 'our', 'my', 'more', 'most', 'other', 'some', 'such',
    'no', 'not', 'only', 'so', 'than', 'too', 'very', 'just', 'also',
    'now', 'new', 'one', 'two', 'first', 'last', 'long', 'great', 'little',
    'own', 'same', 'any', 'each', 'every', 'both', 'few', 'many', 'much'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate Jaccard similarity between two token sets
 */
function jaccardSimilarity(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate weighted similarity between two trends
 */
function calculateSimilarity(
  trend1: RawTrendItem,
  trend2: RawTrendItem,
  config: ValidationConfig
): number {
  const title1Tokens = tokenize(trend1.title);
  const title2Tokens = tokenize(trend2.title);
  const desc1Tokens = tokenize(trend1.description);
  const desc2Tokens = tokenize(trend2.description);

  const titleSim = jaccardSimilarity(title1Tokens, title2Tokens);
  const descSim = jaccardSimilarity(desc1Tokens, desc2Tokens);

  // Also check for exact keyword matches (important topics)
  const combined1 = [...title1Tokens, ...desc1Tokens];
  const combined2 = [...title2Tokens, ...desc2Tokens];
  const combinedSim = jaccardSimilarity(combined1, combined2);

  // Weighted score with bonus for combined match
  const weightedScore = (titleSim * config.titleWeight) + (descSim * config.descriptionWeight);
  const bonusScore = combinedSim * 0.2; // 20% bonus for overall match

  return Math.min(1, weightedScore + bonusScore);
}

// ============================================================================
// TREND CLUSTERING / DEDUPLICATION
// ============================================================================

interface TrendCluster {
  canonical: RawTrendItem;
  members: RawTrendItem[];
  sources: Set<string>;
  maxSimilarity: number;
}

/**
 * Cluster similar trends together
 */
function clusterTrends(
  trends: RawTrendItem[],
  config: ValidationConfig
): TrendCluster[] {
  if (trends.length === 0) return [];

  const clusters: TrendCluster[] = [];
  const assigned = new Set<string>();

  // Sort by title length (prefer more descriptive titles as canonical)
  const sortedTrends = [...trends].sort(
    (a, b) => (b.title?.length || 0) - (a.title?.length || 0)
  );

  for (const trend of sortedTrends) {
    if (assigned.has(trend.id)) continue;

    // Find the best matching existing cluster
    let bestCluster: TrendCluster | null = null;
    let bestSimilarity = 0;

    for (const cluster of clusters) {
      const similarity = calculateSimilarity(trend, cluster.canonical, config);
      if (similarity >= config.similarityThreshold && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Add to existing cluster
      bestCluster.members.push(trend);
      bestCluster.sources.add(trend.source);
      bestCluster.maxSimilarity = Math.max(bestCluster.maxSimilarity, bestSimilarity);
      assigned.add(trend.id);
    } else {
      // Create new cluster
      clusters.push({
        canonical: trend,
        members: [trend],
        sources: new Set([trend.source]),
        maxSimilarity: 1
      });
      assigned.add(trend.id);
    }
  }

  return clusters;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate trends by requiring 2+ source mentions
 */
export function validateTrends(
  rawTrends: RawTrendItem[],
  config: Partial<ValidationConfig> = {}
): ValidatedTrend[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  console.log(`[MultiSourceValidator] Validating ${rawTrends.length} trends with ${cfg.minSources}+ source requirement`);

  // Cluster similar trends
  const clusters = clusterTrends(rawTrends, cfg);

  console.log(`[MultiSourceValidator] Created ${clusters.length} clusters`);

  // Convert clusters to validated trends
  const validatedTrends: ValidatedTrend[] = clusters.map(cluster => {
    const sourceCount = cluster.sources.size;
    const isValidated = sourceCount >= cfg.minSources;

    // Build source mentions
    const sources: SourceMention[] = cluster.members.map(member => ({
      source: member.source,
      title: member.title,
      description: member.description,
      url: member.sourceUrl,
      date: member.date,
      matchScore: calculateSimilarity(member, cluster.canonical, cfg) * 100
    }));

    // Calculate validation score (based on source count and similarity)
    const avgMatchScore = sources.reduce((sum, s) => sum + s.matchScore, 0) / sources.length;
    const sourceBonus = Math.min(50, (sourceCount - 1) * 20); // Up to 50 bonus for multiple sources
    const validationScore = Math.min(100, Math.round(avgMatchScore + sourceBonus));

    // Combine metadata from all sources
    const combinedMetadata: Record<string, any> = {};
    cluster.members.forEach(m => {
      if (m.metadata) {
        Object.assign(combinedMetadata, m.metadata);
      }
    });

    // Find date range
    const dates = cluster.members
      .map(m => m.date)
      .filter(Boolean)
      .sort();

    // Determine query intent (Phase 7/10) - prioritize product > use_case > pain_point > industry > trend
    const intentCounts: Record<QueryIntent, number> = {
      product: 0,
      pain_point: 0,
      industry: 0,
      opportunity: 0,
      trend: 0,
      local: 0,
      competitor: 0,
      use_case: 0,
      outcome: 0,
      persona: 0
    };
    cluster.members.forEach(m => {
      if (m.queryIntent) {
        intentCounts[m.queryIntent]++;
      }
    });
    // Priority order: product > use_case > pain_point > outcome > persona > industry > opportunity > trend
    let queryIntent: QueryIntent = 'trend';
    if (intentCounts.product > 0) queryIntent = 'product';
    else if (intentCounts.use_case > 0) queryIntent = 'use_case';
    else if (intentCounts.pain_point > 0) queryIntent = 'pain_point';
    else if (intentCounts.outcome > 0) queryIntent = 'outcome';
    else if (intentCounts.persona > 0) queryIntent = 'persona';
    else if (intentCounts.industry > 0) queryIntent = 'industry';
    else if (intentCounts.opportunity > 0) queryIntent = 'opportunity';
    else if (intentCounts.local > 0) queryIntent = 'local';
    else if (intentCounts.competitor > 0) queryIntent = 'competitor';

    return {
      id: `validated-${cluster.canonical.id}`,
      title: cluster.canonical.title,
      description: cluster.canonical.description,
      sources,
      sourceCount,
      validationScore,
      isValidated,
      combinedMetadata,
      firstSeen: dates[0],
      lastSeen: dates[dates.length - 1],
      queryIntent
    };
  });

  // Sort by validation score (validated trends first)
  validatedTrends.sort((a, b) => {
    // Validated trends first
    if (a.isValidated !== b.isValidated) {
      return a.isValidated ? -1 : 1;
    }
    // Then by validation score
    return b.validationScore - a.validationScore;
  });

  const validatedCount = validatedTrends.filter(t => t.isValidated).length;
  console.log(`[MultiSourceValidator] ${validatedCount}/${validatedTrends.length} trends validated (${Math.round(validatedCount/validatedTrends.length*100)}%)`);

  return validatedTrends;
}

/**
 * Get only validated trends (appear in 2+ sources)
 */
export function getValidatedOnly(trends: ValidatedTrend[]): ValidatedTrend[] {
  return trends.filter(t => t.isValidated);
}

/**
 * Get validation statistics
 */
export function getValidationStats(trends: ValidatedTrend[]): {
  total: number;
  validated: number;
  unvalidated: number;
  validationRate: number;
  avgSourceCount: number;
  avgValidationScore: number;
} {
  const validated = trends.filter(t => t.isValidated);

  return {
    total: trends.length,
    validated: validated.length,
    unvalidated: trends.length - validated.length,
    validationRate: trends.length > 0 ? Math.round((validated.length / trends.length) * 100) : 0,
    avgSourceCount: trends.length > 0
      ? Math.round((trends.reduce((sum, t) => sum + t.sourceCount, 0) / trends.length) * 10) / 10
      : 0,
    avgValidationScore: trends.length > 0
      ? Math.round(trends.reduce((sum, t) => sum + t.validationScore, 0) / trends.length)
      : 0
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const MultiSourceValidator = {
  validate: validateTrends,
  getValidatedOnly,
  getStats: getValidationStats,
  calculateSimilarity,
  DEFAULT_CONFIG
};

export default MultiSourceValidator;
