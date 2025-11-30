/**
 * Multi-Source Discovery Merger Service
 *
 * Combines competitor discovery results from multiple sources:
 * - Perplexity AI (primary discovery)
 * - SEMrush (SEO-based discovery)
 * - Serper (Search-based discovery)
 * - Reddit (Community-mentioned competitors)
 *
 * Deduplicates, normalizes, and scores merged results for confidence.
 *
 * Created: 2025-11-29
 */

import type { CompetitorProfile } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface DiscoverySource {
  name: 'perplexity' | 'semrush' | 'serper' | 'reddit';
  competitors: PartialCompetitor[];
  timestamp: string;
}

interface PartialCompetitor {
  name: string;
  domain?: string;
  description?: string;
  category?: string;
  source_specific_data?: Record<string, unknown>;
}

interface MergedCompetitor {
  name: string;
  normalized_name: string;
  domain?: string;
  description?: string;
  category?: string;
  sources: string[];
  confidence_score: number;
  confidence_factors: ConfidenceFactors;
  merged_data: Record<string, unknown>;
}

interface ConfidenceFactors {
  source_count: number;
  has_domain: boolean;
  has_description: boolean;
  cross_source_agreement: number;
  name_quality: number;
}

interface MergeResult {
  competitors: MergedCompetitor[];
  merge_stats: {
    total_raw_mentions: number;
    unique_competitors: number;
    high_confidence_count: number;
    medium_confidence_count: number;
    low_confidence_count: number;
    sources_used: string[];
  };
  merged_at: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class MultiSourceMergerService {
  // Minimum confidence threshold for inclusion
  private readonly MIN_CONFIDENCE = 0.3;

  // Weights for confidence calculation
  private readonly SOURCE_WEIGHTS: Record<string, number> = {
    perplexity: 1.0,    // Primary source, highest trust
    semrush: 0.9,       // SEO data is reliable
    serper: 0.7,        // Search results can be noisy
    reddit: 0.6         // Community mentions need validation
  };

  /**
   * Merge competitor discoveries from multiple sources
   */
  merge(sources: DiscoverySource[]): MergeResult {
    console.log(`[MultiSourceMerger] Merging from ${sources.length} sources`);

    // Step 1: Normalize all competitor names
    const normalizedCompetitors = this.normalizeAllCompetitors(sources);

    // Step 2: Group by normalized name
    const groupedCompetitors = this.groupByName(normalizedCompetitors);

    // Step 3: Merge each group and calculate confidence
    const mergedCompetitors = this.mergeGroups(groupedCompetitors);

    // Step 4: Filter by confidence and sort
    const filteredCompetitors = mergedCompetitors
      .filter(c => c.confidence_score >= this.MIN_CONFIDENCE)
      .sort((a, b) => b.confidence_score - a.confidence_score);

    // Calculate stats
    const stats = this.calculateStats(sources, filteredCompetitors);

    return {
      competitors: filteredCompetitors,
      merge_stats: stats,
      merged_at: new Date().toISOString()
    };
  }

  /**
   * Normalize competitor names across all sources
   */
  private normalizeAllCompetitors(
    sources: DiscoverySource[]
  ): Array<PartialCompetitor & { source: string; normalized_name: string }> {
    const normalized: Array<PartialCompetitor & { source: string; normalized_name: string }> = [];

    for (const source of sources) {
      for (const competitor of source.competitors) {
        normalized.push({
          ...competitor,
          source: source.name,
          normalized_name: this.normalizeName(competitor.name)
        });
      }
    }

    return normalized;
  }

  /**
   * Normalize a competitor name for matching
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      // Remove common suffixes
      .replace(/\s*(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?)$/i, '')
      // Remove special characters
      .replace(/[^a-z0-9\s]/g, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Group competitors by normalized name
   */
  private groupByName(
    competitors: Array<PartialCompetitor & { source: string; normalized_name: string }>
  ): Map<string, Array<PartialCompetitor & { source: string }>> {
    const groups = new Map<string, Array<PartialCompetitor & { source: string }>>();

    for (const competitor of competitors) {
      const existing = groups.get(competitor.normalized_name) || [];
      existing.push(competitor);
      groups.set(competitor.normalized_name, existing);
    }

    // Also try to match by domain
    this.mergeByDomain(groups);

    return groups;
  }

  /**
   * Merge groups that have matching domains
   */
  private mergeByDomain(
    groups: Map<string, Array<PartialCompetitor & { source: string }>>
  ): void {
    const domainToName = new Map<string, string>();

    // Build domain -> normalized_name map
    for (const [normalizedName, competitors] of groups) {
      for (const c of competitors) {
        if (c.domain) {
          const normalizedDomain = this.normalizeDomain(c.domain);
          const existingName = domainToName.get(normalizedDomain);

          if (existingName && existingName !== normalizedName) {
            // Found a domain match with different name - merge groups
            const existing = groups.get(existingName) || [];
            const current = groups.get(normalizedName) || [];
            groups.set(existingName, [...existing, ...current]);
            groups.delete(normalizedName);
          } else {
            domainToName.set(normalizedDomain, normalizedName);
          }
        }
      }
    }
  }

  /**
   * Normalize a domain for matching
   */
  private normalizeDomain(domain: string): string {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim();
  }

  /**
   * Merge each group into a single competitor with confidence score
   */
  private mergeGroups(
    groups: Map<string, Array<PartialCompetitor & { source: string }>>
  ): MergedCompetitor[] {
    const merged: MergedCompetitor[] = [];

    for (const [normalizedName, competitors] of groups) {
      // Get unique sources
      const sources = [...new Set(competitors.map(c => c.source))];

      // Pick the best name (prefer longer, properly cased)
      const bestName = this.selectBestName(competitors.map(c => c.name));

      // Pick the best domain
      const bestDomain = this.selectBestValue(
        competitors.map(c => c.domain).filter(Boolean) as string[]
      );

      // Merge descriptions
      const bestDescription = this.selectBestValue(
        competitors.map(c => c.description).filter(Boolean) as string[]
      );

      // Merge category
      const bestCategory = this.selectBestValue(
        competitors.map(c => c.category).filter(Boolean) as string[]
      );

      // Merge all source-specific data
      const mergedData: Record<string, unknown> = {};
      for (const c of competitors) {
        if (c.source_specific_data) {
          Object.assign(mergedData, c.source_specific_data);
        }
      }

      // Calculate confidence
      const confidenceFactors = this.calculateConfidenceFactors(
        competitors,
        sources,
        bestDomain,
        bestDescription
      );
      const confidenceScore = this.calculateConfidenceScore(confidenceFactors, sources);

      merged.push({
        name: bestName,
        normalized_name: normalizedName,
        domain: bestDomain,
        description: bestDescription,
        category: bestCategory,
        sources,
        confidence_score: confidenceScore,
        confidence_factors: confidenceFactors,
        merged_data: mergedData
      });
    }

    return merged;
  }

  /**
   * Select the best name from multiple options
   */
  private selectBestName(names: string[]): string {
    // Prefer properly capitalized names over all-lowercase
    // Prefer longer names (more descriptive)
    return names.sort((a, b) => {
      // Check for proper capitalization
      const aProper = a[0] === a[0].toUpperCase();
      const bProper = b[0] === b[0].toUpperCase();
      if (aProper && !bProper) return -1;
      if (!aProper && bProper) return 1;

      // Prefer longer names
      return b.length - a.length;
    })[0] || 'Unknown';
  }

  /**
   * Select the best value from multiple options (longest/most detailed)
   */
  private selectBestValue(values: string[]): string | undefined {
    if (values.length === 0) return undefined;
    return values.sort((a, b) => b.length - a.length)[0];
  }

  /**
   * Calculate confidence factors
   */
  private calculateConfidenceFactors(
    competitors: Array<PartialCompetitor & { source: string }>,
    sources: string[],
    domain?: string,
    description?: string
  ): ConfidenceFactors {
    // Cross-source agreement: how many sources agree on details
    let agreementScore = 0;
    if (sources.length > 1) {
      // Check domain agreement
      const domains = competitors.map(c => c.domain).filter(Boolean);
      const uniqueDomains = new Set(domains.map(d => this.normalizeDomain(d!)));
      if (uniqueDomains.size === 1 && domains.length > 1) {
        agreementScore += 0.5;
      }

      // Check category agreement
      const categories = competitors.map(c => c.category).filter(Boolean);
      const uniqueCategories = new Set(categories);
      if (uniqueCategories.size === 1 && categories.length > 1) {
        agreementScore += 0.5;
      }
    }

    // Name quality: penalize very short or generic names
    const primaryName = competitors[0].name;
    let nameQuality = 1.0;
    if (primaryName.length < 3) nameQuality = 0.3;
    else if (primaryName.length < 5) nameQuality = 0.6;
    else if (primaryName.toLowerCase().includes('competitor')) nameQuality = 0.5;
    else if (primaryName.toLowerCase().includes('alternative')) nameQuality = 0.5;

    return {
      source_count: sources.length,
      has_domain: !!domain,
      has_description: !!description,
      cross_source_agreement: agreementScore,
      name_quality: nameQuality
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidenceScore(
    factors: ConfidenceFactors,
    sources: string[]
  ): number {
    let score = 0;

    // Base score from source count (max 0.4)
    // Weight by source reliability
    let sourceScore = 0;
    for (const source of sources) {
      sourceScore += this.SOURCE_WEIGHTS[source] || 0.5;
    }
    score += Math.min(0.4, sourceScore * 0.15);

    // Domain presence (0.2)
    if (factors.has_domain) score += 0.2;

    // Description presence (0.1)
    if (factors.has_description) score += 0.1;

    // Cross-source agreement (0.15)
    score += factors.cross_source_agreement * 0.15;

    // Name quality (0.15)
    score += factors.name_quality * 0.15;

    return Math.min(1.0, Math.max(0, score));
  }

  /**
   * Calculate merge statistics
   */
  private calculateStats(
    sources: DiscoverySource[],
    mergedCompetitors: MergedCompetitor[]
  ): MergeResult['merge_stats'] {
    const totalRaw = sources.reduce((sum, s) => sum + s.competitors.length, 0);

    const highConfidence = mergedCompetitors.filter(c => c.confidence_score >= 0.7).length;
    const mediumConfidence = mergedCompetitors.filter(
      c => c.confidence_score >= 0.5 && c.confidence_score < 0.7
    ).length;
    const lowConfidence = mergedCompetitors.filter(c => c.confidence_score < 0.5).length;

    return {
      total_raw_mentions: totalRaw,
      unique_competitors: mergedCompetitors.length,
      high_confidence_count: highConfidence,
      medium_confidence_count: mediumConfidence,
      low_confidence_count: lowConfidence,
      sources_used: sources.map(s => s.name)
    };
  }

  /**
   * Convert merged competitors to CompetitorProfile format
   */
  toCompetitorProfiles(
    merged: MergedCompetitor[],
    brandId: string
  ): Partial<CompetitorProfile>[] {
    return merged.map((c, index) => ({
      name: c.name,
      domain: c.domain,
      description: c.description,
      brand_id: brandId,
      status: 'pending_enrichment' as const,
      discovery_source: c.sources.join(', '),
      confidence_score: c.confidence_score,
      last_scanned_at: null,
      created_at: new Date().toISOString(),
      // Store merge data for reference
      positioning: {
        category: c.category,
        merged_sources: c.sources,
        confidence_factors: c.confidence_factors
      } as CompetitorProfile['positioning']
    }));
  }
}

export const multiSourceMerger = new MultiSourceMergerService();
