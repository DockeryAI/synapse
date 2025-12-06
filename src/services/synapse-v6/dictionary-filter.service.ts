/**
 * Dictionary Filter Service
 *
 * Filters raw API results through dictionary-based relevance checks.
 * Must match at least ONE of: Industry OR Audience OR Pain
 * Category provides optional boost (1.1-1.3x)
 *
 * This is the FILTER layer before V1's connection engine.
 */

import {
  type IndustryDictionary,
  type AudienceDictionary,
  type CategoryDictionary,
  matchesIndustryDictionary,
  matchesAudienceDictionary,
  matchesPainDictionary,
  getCategoryBoost,
} from './dictionaries';

export interface RawInsight {
  id: string;
  text: string;
  source: string;
  sourceUrl?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface FilterResult {
  passes: boolean;
  matchedFilters: ('industry' | 'audience' | 'pain')[];
  categoryBoost: number;  // 1.0 - 1.3
  insight: RawInsight;
}

export interface FilteredInsight extends RawInsight {
  matchedFilters: ('industry' | 'audience' | 'pain')[];
  categoryBoost: number;
  relevanceScore: number;  // Base score before connection engine
}

export interface BrandDictionaries {
  industry: IndustryDictionary;
  audience: AudienceDictionary;
  category: CategoryDictionary;
}

export interface FilterStats {
  totalInput: number;
  passed: number;
  filtered: number;
  byFilter: {
    industry: number;
    audience: number;
    pain: number;
  };
  averageCategoryBoost: number;
}

/**
 * Filter a single insight through dictionaries
 */
export function filterInsight(
  insight: RawInsight,
  dictionaries: BrandDictionaries
): FilterResult {
  const matchedFilters: ('industry' | 'audience' | 'pain')[] = [];

  // Check industry match
  if (matchesIndustryDictionary(insight.text, dictionaries.industry)) {
    matchedFilters.push('industry');
  }

  // Check audience match
  if (matchesAudienceDictionary(insight.text, dictionaries.audience)) {
    matchedFilters.push('audience');
  }

  // Check pain match (source-specific)
  if (matchesPainDictionary(insight.text, insight.source)) {
    matchedFilters.push('pain');
  }

  // Must match at least one filter to pass
  const passes = matchedFilters.length >= 1;

  // Calculate category boost (optional)
  const categoryBoost = getCategoryBoost(insight.text, dictionaries.category);

  return {
    passes,
    matchedFilters,
    categoryBoost,
    insight,
  };
}

/**
 * Filter multiple insights and return only those that pass
 */
export function filterInsights(
  insights: RawInsight[],
  dictionaries: BrandDictionaries
): FilteredInsight[] {
  const filtered: FilteredInsight[] = [];

  for (const insight of insights) {
    const result = filterInsight(insight, dictionaries);

    if (result.passes) {
      // Calculate base relevance score
      // More filters matched = higher relevance
      const filterScore = result.matchedFilters.length * 25; // 25, 50, or 75
      const relevanceScore = filterScore * result.categoryBoost;

      filtered.push({
        ...insight,
        matchedFilters: result.matchedFilters,
        categoryBoost: result.categoryBoost,
        relevanceScore,
      });
    }
  }

  // Sort by relevance score descending
  return filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Filter insights with detailed stats
 */
export function filterInsightsWithStats(
  insights: RawInsight[],
  dictionaries: BrandDictionaries
): { filtered: FilteredInsight[]; stats: FilterStats } {
  const filtered: FilteredInsight[] = [];
  const stats: FilterStats = {
    totalInput: insights.length,
    passed: 0,
    filtered: 0,
    byFilter: {
      industry: 0,
      audience: 0,
      pain: 0,
    },
    averageCategoryBoost: 0,
  };

  let totalBoost = 0;

  for (const insight of insights) {
    const result = filterInsight(insight, dictionaries);

    if (result.passes) {
      stats.passed++;
      totalBoost += result.categoryBoost;

      // Track which filters matched
      if (result.matchedFilters.includes('industry')) stats.byFilter.industry++;
      if (result.matchedFilters.includes('audience')) stats.byFilter.audience++;
      if (result.matchedFilters.includes('pain')) stats.byFilter.pain++;

      const filterScore = result.matchedFilters.length * 25;
      const relevanceScore = filterScore * result.categoryBoost;

      filtered.push({
        ...insight,
        matchedFilters: result.matchedFilters,
        categoryBoost: result.categoryBoost,
        relevanceScore,
      });
    } else {
      stats.filtered++;
    }
  }

  stats.averageCategoryBoost = stats.passed > 0 ? totalBoost / stats.passed : 1.0;

  // Sort by relevance score descending
  const sortedFiltered = filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return { filtered: sortedFiltered, stats };
}

/**
 * Log filter statistics for debugging
 */
export function logFilterStats(stats: FilterStats, brandName?: string): void {
  const passRate = stats.totalInput > 0
    ? ((stats.passed / stats.totalInput) * 100).toFixed(1)
    : '0';

  console.log(`[DictionaryFilter]${brandName ? ` ${brandName}` : ''} Filter Stats:`);
  console.log(`  Input: ${stats.totalInput} → Passed: ${stats.passed} (${passRate}%)`);
  console.log(`  By Filter: Industry=${stats.byFilter.industry}, Audience=${stats.byFilter.audience}, Pain=${stats.byFilter.pain}`);
  console.log(`  Avg Category Boost: ${stats.averageCategoryBoost.toFixed(2)}x`);
}

/**
 * Service class for dictionary filtering
 */
export class DictionaryFilterService {
  private dictionaries: BrandDictionaries;
  private brandName?: string;

  constructor(dictionaries: BrandDictionaries, brandName?: string) {
    this.dictionaries = dictionaries;
    this.brandName = brandName;
  }

  /**
   * Filter insights and return passing ones
   */
  filter(insights: RawInsight[]): FilteredInsight[] {
    return filterInsights(insights, this.dictionaries);
  }

  /**
   * Filter with detailed statistics
   */
  filterWithStats(insights: RawInsight[]): { filtered: FilteredInsight[]; stats: FilterStats } {
    const result = filterInsightsWithStats(insights, this.dictionaries);

    // Log stats for debugging
    logFilterStats(result.stats, this.brandName);

    return result;
  }

  /**
   * Check if a single insight passes filters
   */
  check(insight: RawInsight): FilterResult {
    return filterInsight(insight, this.dictionaries);
  }

  /**
   * Update dictionaries (e.g., after UVP changes)
   */
  updateDictionaries(dictionaries: BrandDictionaries): void {
    this.dictionaries = dictionaries;
  }
}
