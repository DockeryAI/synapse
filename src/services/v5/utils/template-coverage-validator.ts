/**
 * V5 Template Coverage Validator
 *
 * Validates that all customer categories and platforms have adequate template coverage.
 * Used in Phase 6 to ensure template library completeness.
 *
 * Created: 2025-12-01
 */

import { UNIVERSAL_TEMPLATES, TEMPLATE_STATS } from '@/data/v5/universal-templates';
import type { Platform, CustomerCategory, ContentType, UniversalTemplate } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface CoverageReport {
  totalTemplates: number;
  platformCoverage: PlatformCoverage;
  categoryCoverage: CategoryCoverage;
  contentTypeCoverage: ContentTypeCoverage;
  crossCoverage: CrossCoverageMatrix;
  gaps: CoverageGap[];
  score: number; // 0-100
}

export interface PlatformCoverage {
  linkedin: number;
  facebook: number;
  instagram: number;
  twitter: number;
  tiktok: number;
}

export interface CategoryCoverage {
  'pain-driven': number;
  'aspiration-driven': number;
  'trust-seeking': number;
  'convenience-driven': number;
  'value-driven': number;
  'community-driven': number;
}

export interface ContentTypeCoverage {
  promotional: number;
  educational: number;
  community: number;
  authority: number;
  engagement: number;
}

export interface CrossCoverageMatrix {
  // platform -> category -> count
  [platform: string]: { [category: string]: number };
}

export interface CoverageGap {
  type: 'platform' | 'category' | 'cross' | 'content-type';
  platform?: Platform;
  category?: CustomerCategory;
  contentType?: ContentType;
  current: number;
  minimum: number;
  severity: 'critical' | 'warning' | 'info';
  recommendation: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MINIMUM_THRESHOLDS = {
  perPlatform: 8,           // At least 8 templates per platform
  perCategory: 6,           // At least 6 templates per category
  perContentType: 5,        // At least 5 templates per content type
  crossCoverage: 2,         // At least 2 templates per platform/category combo
};

const PLATFORMS: Platform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];
const CATEGORIES: CustomerCategory[] = [
  'pain-driven',
  'aspiration-driven',
  'trust-seeking',
  'convenience-driven',
  'value-driven',
  'community-driven',
];
const CONTENT_TYPES: ContentType[] = ['promotional', 'educational', 'community', 'authority', 'engagement'];

// ============================================================================
// COVERAGE VALIDATOR
// ============================================================================

class TemplateCoverageValidator {
  /**
   * Run full coverage validation
   */
  validate(): CoverageReport {
    const platformCoverage = this.calculatePlatformCoverage();
    const categoryCoverage = this.calculateCategoryCoverage();
    const contentTypeCoverage = this.calculateContentTypeCoverage();
    const crossCoverage = this.calculateCrossCoverage();
    const gaps = this.findGaps(platformCoverage, categoryCoverage, contentTypeCoverage, crossCoverage);
    const score = this.calculateScore(gaps);

    return {
      totalTemplates: UNIVERSAL_TEMPLATES.length,
      platformCoverage,
      categoryCoverage,
      contentTypeCoverage,
      crossCoverage,
      gaps,
      score,
    };
  }

  /**
   * Get quick stats summary
   */
  getStats(): typeof TEMPLATE_STATS {
    return TEMPLATE_STATS;
  }

  /**
   * Calculate platform coverage
   */
  private calculatePlatformCoverage(): PlatformCoverage {
    return {
      linkedin: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'linkedin').length,
      facebook: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'facebook').length,
      instagram: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'instagram').length,
      twitter: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'twitter').length,
      tiktok: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'tiktok').length,
    };
  }

  /**
   * Calculate category coverage
   */
  private calculateCategoryCoverage(): CategoryCoverage {
    return {
      'pain-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('pain-driven')).length,
      'aspiration-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('aspiration-driven')).length,
      'trust-seeking': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('trust-seeking')).length,
      'convenience-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('convenience-driven')).length,
      'value-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('value-driven')).length,
      'community-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('community-driven')).length,
    };
  }

  /**
   * Calculate content type coverage
   */
  private calculateContentTypeCoverage(): ContentTypeCoverage {
    return {
      promotional: UNIVERSAL_TEMPLATES.filter(t => t.contentType === 'promotional').length,
      educational: UNIVERSAL_TEMPLATES.filter(t => t.contentType === 'educational').length,
      community: UNIVERSAL_TEMPLATES.filter(t => t.contentType === 'community').length,
      authority: UNIVERSAL_TEMPLATES.filter(t => t.contentType === 'authority').length,
      engagement: UNIVERSAL_TEMPLATES.filter(t => t.contentType === 'engagement').length,
    };
  }

  /**
   * Calculate cross-coverage (platform × category matrix)
   */
  private calculateCrossCoverage(): CrossCoverageMatrix {
    const matrix: CrossCoverageMatrix = {};

    for (const platform of PLATFORMS) {
      matrix[platform] = {};
      for (const category of CATEGORIES) {
        matrix[platform][category] = UNIVERSAL_TEMPLATES.filter(
          t => t.platform === platform && t.customerCategories.includes(category)
        ).length;
      }
    }

    return matrix;
  }

  /**
   * Find coverage gaps
   */
  private findGaps(
    platformCoverage: PlatformCoverage,
    categoryCoverage: CategoryCoverage,
    contentTypeCoverage: ContentTypeCoverage,
    crossCoverage: CrossCoverageMatrix
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];

    // Check platform gaps
    for (const platform of PLATFORMS) {
      const count = platformCoverage[platform];
      if (count < MINIMUM_THRESHOLDS.perPlatform) {
        gaps.push({
          type: 'platform',
          platform,
          current: count,
          minimum: MINIMUM_THRESHOLDS.perPlatform,
          severity: count === 0 ? 'critical' : count < 4 ? 'warning' : 'info',
          recommendation: `Add ${MINIMUM_THRESHOLDS.perPlatform - count} more ${platform} templates`,
        });
      }
    }

    // Check category gaps
    for (const category of CATEGORIES) {
      const count = categoryCoverage[category];
      if (count < MINIMUM_THRESHOLDS.perCategory) {
        gaps.push({
          type: 'category',
          category,
          current: count,
          minimum: MINIMUM_THRESHOLDS.perCategory,
          severity: count === 0 ? 'critical' : count < 3 ? 'warning' : 'info',
          recommendation: `Add ${MINIMUM_THRESHOLDS.perCategory - count} more templates for ${category} customers`,
        });
      }
    }

    // Check content type gaps
    for (const contentType of CONTENT_TYPES) {
      const count = contentTypeCoverage[contentType];
      if (count < MINIMUM_THRESHOLDS.perContentType) {
        gaps.push({
          type: 'content-type',
          contentType,
          current: count,
          minimum: MINIMUM_THRESHOLDS.perContentType,
          severity: count === 0 ? 'critical' : count < 2 ? 'warning' : 'info',
          recommendation: `Add ${MINIMUM_THRESHOLDS.perContentType - count} more ${contentType} templates`,
        });
      }
    }

    // Check cross-coverage gaps (most important for quality)
    for (const platform of PLATFORMS) {
      for (const category of CATEGORIES) {
        const count = crossCoverage[platform][category];
        if (count < MINIMUM_THRESHOLDS.crossCoverage) {
          gaps.push({
            type: 'cross',
            platform,
            category,
            current: count,
            minimum: MINIMUM_THRESHOLDS.crossCoverage,
            severity: count === 0 ? 'critical' : 'warning',
            recommendation: `Add ${MINIMUM_THRESHOLDS.crossCoverage - count} ${platform} templates for ${category} customers`,
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Calculate overall coverage score (0-100)
   */
  private calculateScore(gaps: CoverageGap[]): number {
    // Start with 100, deduct for gaps
    let score = 100;

    for (const gap of gaps) {
      switch (gap.severity) {
        case 'critical':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 2;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Print formatted report to console
   */
  printReport(): void {
    const report = this.validate();

    console.log('\n=== V5 Template Coverage Report ===\n');
    console.log(`Total Templates: ${report.totalTemplates}`);
    console.log(`Coverage Score: ${report.score}/100`);

    console.log('\nPlatform Coverage:');
    for (const [platform, count] of Object.entries(report.platformCoverage)) {
      const status = count >= MINIMUM_THRESHOLDS.perPlatform ? '✅' : '⚠️';
      console.log(`  ${status} ${platform}: ${count}/${MINIMUM_THRESHOLDS.perPlatform}`);
    }

    console.log('\nCategory Coverage:');
    for (const [category, count] of Object.entries(report.categoryCoverage)) {
      const status = count >= MINIMUM_THRESHOLDS.perCategory ? '✅' : '⚠️';
      console.log(`  ${status} ${category}: ${count}/${MINIMUM_THRESHOLDS.perCategory}`);
    }

    console.log('\nContent Type Coverage:');
    for (const [type, count] of Object.entries(report.contentTypeCoverage)) {
      const status = count >= MINIMUM_THRESHOLDS.perContentType ? '✅' : '⚠️';
      console.log(`  ${status} ${type}: ${count}/${MINIMUM_THRESHOLDS.perContentType}`);
    }

    if (report.gaps.length > 0) {
      console.log('\nGaps Found:');
      for (const gap of report.gaps.filter(g => g.severity !== 'info')) {
        const icon = gap.severity === 'critical' ? '🔴' : '🟡';
        console.log(`  ${icon} ${gap.recommendation}`);
      }
    } else {
      console.log('\n✅ Full coverage achieved!');
    }

    console.log('\n');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const templateCoverageValidator = new TemplateCoverageValidator();

export { TemplateCoverageValidator };

export default templateCoverageValidator;
