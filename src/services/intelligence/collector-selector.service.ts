/**
 * Category-Specific Collector Selection Service
 *
 * Intelligently selects which collectors to run based on:
 * - Business category (SaaS, E-commerce, Service, etc.)
 * - Available API credits/limits
 * - Previous scan results
 * - Data freshness requirements
 *
 * Optimizes for both coverage and efficiency.
 *
 * Created: 2025-11-29
 */

import type { CompetitorProfile } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

type CollectorName =
  | 'reddit'
  | 'semrush'
  | 'youtube'
  | 'serper'
  | 'integrationGap'
  | 'talentSignal';

type BusinessCategory =
  | 'saas'
  | 'ecommerce'
  | 'agency'
  | 'marketplace'
  | 'fintech'
  | 'healthcare'
  | 'media'
  | 'education'
  | 'developer_tools'
  | 'consumer'
  | 'enterprise'
  | 'local_business'
  | 'other';

interface CollectorConfig {
  name: CollectorName;
  priority: number;
  estimated_credits: number;
  data_categories: string[];
  best_for: BusinessCategory[];
  skip_for: BusinessCategory[];
}

interface SelectionResult {
  selected_collectors: CollectorName[];
  skipped_collectors: Array<{
    name: CollectorName;
    reason: string;
  }>;
  estimated_total_credits: number;
  selection_rationale: string[];
}

interface SelectionOptions {
  category?: BusinessCategory;
  max_credits?: number;
  prioritize_speed?: boolean;
  include_experimental?: boolean;
  force_collectors?: CollectorName[];
  skip_collectors?: CollectorName[];
  previous_scan_data?: {
    collector: CollectorName;
    success: boolean;
    data_quality: 'high' | 'medium' | 'low';
    scanned_at: string;
  }[];
}

// ============================================================================
// COLLECTOR CONFIGURATIONS
// ============================================================================

const COLLECTOR_CONFIGS: CollectorConfig[] = [
  {
    name: 'reddit',
    priority: 1,
    estimated_credits: 1,
    data_categories: ['customer_voice', 'sentiment', 'pain_points', 'switching_triggers'],
    best_for: ['saas', 'developer_tools', 'consumer', 'fintech', 'education'],
    skip_for: ['local_business']
  },
  {
    name: 'semrush',
    priority: 2,
    estimated_credits: 2,
    data_categories: ['seo_metrics', 'keyword_gaps', 'traffic', 'backlinks'],
    best_for: ['saas', 'ecommerce', 'agency', 'media', 'education'],
    skip_for: []
  },
  {
    name: 'serper',
    priority: 3,
    estimated_credits: 1,
    data_categories: ['news_mentions', 'serp_features', 'competitor_ads'],
    best_for: ['saas', 'ecommerce', 'fintech', 'enterprise', 'media'],
    skip_for: []
  },
  {
    name: 'youtube',
    priority: 4,
    estimated_credits: 1,
    data_categories: ['content_strategy', 'feature_announcements', 'brand_presence'],
    best_for: ['saas', 'education', 'consumer', 'media', 'developer_tools'],
    skip_for: ['local_business', 'agency']
  },
  {
    name: 'integrationGap',
    priority: 5,
    estimated_credits: 1,
    data_categories: ['integration_issues', 'workflow_friction', 'ecosystem_gaps'],
    best_for: ['saas', 'developer_tools', 'enterprise'],
    skip_for: ['local_business', 'consumer', 'media']
  },
  {
    name: 'talentSignal',
    priority: 6,
    estimated_credits: 1,
    data_categories: ['hiring_trends', 'technology_signals', 'expansion_signals'],
    best_for: ['saas', 'fintech', 'enterprise', 'developer_tools'],
    skip_for: ['local_business', 'consumer']
  }
];

// ============================================================================
// SERVICE
// ============================================================================

class CollectorSelectorService {
  // Default credit budget per scan
  private readonly DEFAULT_MAX_CREDITS = 10;

  // Data freshness threshold (hours)
  private readonly FRESHNESS_THRESHOLD_HOURS = 24;

  /**
   * Select collectors for a competitor scan
   */
  select(options: SelectionOptions = {}): SelectionResult {
    const {
      category = 'other',
      max_credits = this.DEFAULT_MAX_CREDITS,
      prioritize_speed = false,
      include_experimental = false,
      force_collectors = [],
      skip_collectors = [],
      previous_scan_data = []
    } = options;

    const selected: CollectorName[] = [];
    const skipped: SelectionResult['skipped_collectors'] = [];
    const rationale: string[] = [];
    let totalCredits = 0;

    // Get collectors sorted by priority
    const sortedConfigs = [...COLLECTOR_CONFIGS].sort((a, b) => {
      // Prioritize collectors that are best for this category
      const aRelevance = a.best_for.includes(category) ? 0 : 1;
      const bRelevance = b.best_for.includes(category) ? 0 : 1;
      if (aRelevance !== bRelevance) return aRelevance - bRelevance;
      return a.priority - b.priority;
    });

    for (const config of sortedConfigs) {
      // Check if forced
      if (force_collectors.includes(config.name)) {
        selected.push(config.name);
        totalCredits += config.estimated_credits;
        rationale.push(`${config.name}: Forced by request`);
        continue;
      }

      // Check if skipped
      if (skip_collectors.includes(config.name)) {
        skipped.push({ name: config.name, reason: 'Skipped by request' });
        continue;
      }

      // Check category compatibility
      if (config.skip_for.includes(category)) {
        skipped.push({
          name: config.name,
          reason: `Not recommended for ${category} businesses`
        });
        continue;
      }

      // Check credit budget
      if (totalCredits + config.estimated_credits > max_credits) {
        skipped.push({
          name: config.name,
          reason: `Would exceed credit budget (${totalCredits + config.estimated_credits} > ${max_credits})`
        });
        continue;
      }

      // Check data freshness
      const previousScan = previous_scan_data.find(p => p.collector === config.name);
      if (previousScan && this.isDataFresh(previousScan.scanned_at)) {
        if (previousScan.data_quality === 'high') {
          skipped.push({
            name: config.name,
            reason: 'Recent high-quality data exists'
          });
          continue;
        }
      }

      // Check speed priority
      if (prioritize_speed && !config.best_for.includes(category)) {
        skipped.push({
          name: config.name,
          reason: 'Skipped for speed (not optimal for category)'
        });
        continue;
      }

      // Add to selection
      selected.push(config.name);
      totalCredits += config.estimated_credits;

      if (config.best_for.includes(category)) {
        rationale.push(`${config.name}: Recommended for ${category} businesses`);
      } else {
        rationale.push(`${config.name}: General coverage`);
      }
    }

    return {
      selected_collectors: selected,
      skipped_collectors: skipped,
      estimated_total_credits: totalCredits,
      selection_rationale: rationale
    };
  }

  /**
   * Get recommended collectors for a specific category
   */
  getRecommendedForCategory(category: BusinessCategory): CollectorName[] {
    return COLLECTOR_CONFIGS
      .filter(c => c.best_for.includes(category))
      .sort((a, b) => a.priority - b.priority)
      .map(c => c.name);
  }

  /**
   * Get minimum viable collector set (fastest scan)
   */
  getMinimumViableSet(category: BusinessCategory): CollectorName[] {
    // Always include the top 2 collectors for the category
    const recommended = this.getRecommendedForCategory(category);
    if (recommended.length >= 2) {
      return recommended.slice(0, 2);
    }

    // Fallback to serper + one category-specific
    return ['serper', recommended[0] || 'reddit'];
  }

  /**
   * Get full coverage collector set
   */
  getFullCoverageSet(): CollectorName[] {
    return COLLECTOR_CONFIGS.map(c => c.name);
  }

  /**
   * Detect business category from competitor profile
   */
  detectCategory(competitor: Partial<CompetitorProfile>): BusinessCategory {
    const text = [
      competitor.name,
      competitor.description,
      competitor.domain,
      competitor.positioning?.value_proposition
    ].filter(Boolean).join(' ').toLowerCase();

    // Category detection rules
    const categoryPatterns: Array<{ category: BusinessCategory; patterns: string[] }> = [
      {
        category: 'saas',
        patterns: ['saas', 'software', 'platform', 'cloud', 'subscription', 'app']
      },
      {
        category: 'ecommerce',
        patterns: ['shop', 'store', 'buy', 'commerce', 'retail', 'product']
      },
      {
        category: 'agency',
        patterns: ['agency', 'consulting', 'services', 'marketing agency', 'creative']
      },
      {
        category: 'marketplace',
        patterns: ['marketplace', 'connect', 'matching', 'hire', 'find']
      },
      {
        category: 'fintech',
        patterns: ['payment', 'banking', 'finance', 'invest', 'money', 'crypto']
      },
      {
        category: 'healthcare',
        patterns: ['health', 'medical', 'patient', 'doctor', 'clinic', 'care']
      },
      {
        category: 'media',
        patterns: ['media', 'news', 'content', 'publish', 'video', 'streaming']
      },
      {
        category: 'education',
        patterns: ['education', 'learning', 'course', 'training', 'school', 'university']
      },
      {
        category: 'developer_tools',
        patterns: ['developer', 'api', 'code', 'devops', 'git', 'sdk', 'engineering']
      },
      {
        category: 'consumer',
        patterns: ['consumer', 'personal', 'individual', 'free', 'mobile app']
      },
      {
        category: 'enterprise',
        patterns: ['enterprise', 'business', 'corporate', 'team', 'organization']
      },
      {
        category: 'local_business',
        patterns: ['local', 'restaurant', 'salon', 'gym', 'dental', 'repair']
      }
    ];

    // Score each category
    const scores = categoryPatterns.map(({ category, patterns }) => ({
      category,
      score: patterns.filter(p => text.includes(p)).length
    }));

    // Return highest scoring category
    const best = scores.sort((a, b) => b.score - a.score)[0];
    return best && best.score > 0 ? best.category : 'other';
  }

  /**
   * Get data categories covered by selected collectors
   */
  getDataCoverage(collectors: CollectorName[]): string[] {
    const categories = new Set<string>();

    for (const collectorName of collectors) {
      const config = COLLECTOR_CONFIGS.find(c => c.name === collectorName);
      if (config) {
        for (const cat of config.data_categories) {
          categories.add(cat);
        }
      }
    }

    return Array.from(categories);
  }

  /**
   * Check if previous scan data is fresh enough to skip
   */
  private isDataFresh(scannedAt: string): boolean {
    const scanDate = new Date(scannedAt);
    const now = new Date();
    const hoursSinceScan = (now.getTime() - scanDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceScan < this.FRESHNESS_THRESHOLD_HOURS;
  }

  /**
   * Get collector configuration
   */
  getCollectorConfig(name: CollectorName): CollectorConfig | undefined {
    return COLLECTOR_CONFIGS.find(c => c.name === name);
  }
}

export const collectorSelector = new CollectorSelectorService();
