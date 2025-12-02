/**
 * V4 vs V5 Comparison Utility
 *
 * Compares content generation between V4 and V5 engines to validate
 * that V5 produces equal or better quality content.
 *
 * Created: 2025-12-01
 */

import { contentOrchestrator } from '../content-orchestrator';
import { synapseScorerService } from '../synapse-scorer.service';
import type { Platform, CustomerCategory, ContentScore, V5GenerationResult } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ComparisonRequest {
  platform: Platform;
  industrySlug?: string;
  brandId?: string;
  sampleCount?: number;  // How many samples to generate
}

export interface ComparisonResult {
  platform: Platform;
  industrySlug?: string;
  v4Sample?: V4ContentSample;
  v5Results: V5SampleResult[];
  comparison: QualityComparison;
  recommendation: 'v5-preferred' | 'v4-preferred' | 'equivalent' | 'needs-review';
}

export interface V4ContentSample {
  content: string;
  score?: number;
  generationTimeMs?: number;
}

export interface V5SampleResult {
  content: string;
  headline: string;
  score: ContentScore;
  generationTimeMs: number;
  templateId: string;
  customerCategory: CustomerCategory;
}

export interface QualityComparison {
  v5AvgScore: number;
  v4Score?: number;
  scoreDelta: number;  // v5 - v4, positive = v5 better
  v5Consistency: number;  // Standard deviation of v5 scores (lower = more consistent)
  avgGenerationTimeMs: number;
  dimensions: {
    powerWords: { v5: number; v4?: number };
    emotionalTriggers: { v5: number; v4?: number };
    readability: { v5: number; v4?: number };
    cta: { v5: number; v4?: number };
    urgency: { v5: number; v4?: number };
    trust: { v5: number; v4?: number };
  };
}

export interface BatchComparisonResult {
  totalTests: number;
  v5Wins: number;
  v4Wins: number;
  ties: number;
  avgScoreDelta: number;
  platformBreakdown: Record<Platform, { v5Avg: number; tests: number }>;
  overallRecommendation: 'v5-ready' | 'needs-more-testing' | 'v5-issues';
}

// ============================================================================
// V4 VS V5 COMPARISON
// ============================================================================

class V4V5Comparison {
  /**
   * Compare a single platform/industry combination
   */
  async compare(request: ComparisonRequest): Promise<ComparisonResult> {
    const sampleCount = request.sampleCount || 3;
    const v5Results: V5SampleResult[] = [];

    // Generate V5 samples
    for (let i = 0; i < sampleCount; i++) {
      const startTime = Date.now();

      const result = await contentOrchestrator.generate({
        platform: request.platform,
        industrySlug: request.industrySlug,
        brandId: request.brandId,
        skipDeduplication: true,  // For testing, allow duplicates
      });

      if (result.success && result.content) {
        v5Results.push({
          content: `${result.content.headline}\n\n${result.content.body}${result.content.cta ? '\n\n' + result.content.cta : ''}`,
          headline: result.content.headline,
          score: result.content.score,
          generationTimeMs: Date.now() - startTime,
          templateId: result.context?.templateUsed || 'unknown',
          customerCategory: result.context?.customerCategory || 'value-driven',
        });
      }
    }

    // Calculate comparison metrics
    const comparison = this.calculateComparison(v5Results);

    // Determine recommendation
    const recommendation = this.determineRecommendation(comparison, v5Results.length);

    return {
      platform: request.platform,
      industrySlug: request.industrySlug,
      v5Results,
      comparison,
      recommendation,
    };
  }

  /**
   * Compare with actual V4 content sample
   */
  async compareWithV4Sample(
    request: ComparisonRequest,
    v4Content: string
  ): Promise<ComparisonResult> {
    // Score the V4 content using V5 scorer for fair comparison
    const v4Score = synapseScorerService.score(v4Content, {
      platform: request.platform,
    });

    const v4Sample: V4ContentSample = {
      content: v4Content,
      score: v4Score.total,
    };

    // Generate V5 samples
    const baseResult = await this.compare(request);

    // Update comparison with V4 data
    const comparison: QualityComparison = {
      ...baseResult.comparison,
      v4Score: v4Score.total,
      scoreDelta: baseResult.comparison.v5AvgScore - v4Score.total,
      dimensions: {
        powerWords: {
          v5: baseResult.comparison.dimensions.powerWords.v5,
          v4: v4Score.dimensions.powerWords,
        },
        emotionalTriggers: {
          v5: baseResult.comparison.dimensions.emotionalTriggers.v5,
          v4: v4Score.dimensions.emotionalTriggers,
        },
        readability: {
          v5: baseResult.comparison.dimensions.readability.v5,
          v4: v4Score.dimensions.readability,
        },
        cta: {
          v5: baseResult.comparison.dimensions.cta.v5,
          v4: v4Score.dimensions.cta,
        },
        urgency: {
          v5: baseResult.comparison.dimensions.urgency.v5,
          v4: v4Score.dimensions.urgency,
        },
        trust: {
          v5: baseResult.comparison.dimensions.trust.v5,
          v4: v4Score.dimensions.trust,
        },
      },
    };

    const recommendation = this.determineRecommendationWithV4(comparison);

    return {
      ...baseResult,
      v4Sample,
      comparison,
      recommendation,
    };
  }

  /**
   * Run batch comparison across all platforms
   */
  async runBatchComparison(
    industrySlug?: string,
    samplesPerPlatform = 3
  ): Promise<BatchComparisonResult> {
    const platforms: Platform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];
    const results: ComparisonResult[] = [];

    for (const platform of platforms) {
      const result = await this.compare({
        platform,
        industrySlug,
        sampleCount: samplesPerPlatform,
      });
      results.push(result);
    }

    return this.aggregateBatchResults(results);
  }

  /**
   * Generate comparison report
   */
  generateReport(results: ComparisonResult[]): string {
    let report = '# V4 vs V5 Content Comparison Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const result of results) {
      report += `## ${result.platform.toUpperCase()}`;
      if (result.industrySlug) report += ` (${result.industrySlug})`;
      report += '\n\n';

      report += `**Recommendation:** ${result.recommendation}\n\n`;
      report += `**V5 Average Score:** ${result.comparison.v5AvgScore.toFixed(1)}\n`;

      if (result.v4Sample) {
        report += `**V4 Score:** ${result.comparison.v4Score?.toFixed(1)}\n`;
        report += `**Score Delta:** ${result.comparison.scoreDelta > 0 ? '+' : ''}${result.comparison.scoreDelta.toFixed(1)}\n`;
      }

      report += `**V5 Consistency:** ${result.comparison.v5Consistency.toFixed(2)} (lower = more consistent)\n`;
      report += `**Avg Generation Time:** ${result.comparison.avgGenerationTimeMs}ms\n\n`;

      report += '### Dimension Breakdown\n\n';
      report += '| Dimension | V5 | V4 | Delta |\n';
      report += '|-----------|----|----|-------|\n';

      for (const [dim, scores] of Object.entries(result.comparison.dimensions)) {
        const delta = scores.v4 !== undefined ? scores.v5 - scores.v4 : 0;
        report += `| ${dim} | ${scores.v5.toFixed(1)} | ${scores.v4?.toFixed(1) ?? 'N/A'} | ${delta > 0 ? '+' : ''}${delta.toFixed(1)} |\n`;
      }

      report += '\n### Sample V5 Outputs\n\n';
      for (let i = 0; i < result.v5Results.length; i++) {
        const sample = result.v5Results[i];
        report += `**Sample ${i + 1}** (Score: ${sample.score.total}, Category: ${sample.customerCategory})\n`;
        report += '```\n' + sample.content.substring(0, 300) + '...\n```\n\n';
      }

      report += '---\n\n';
    }

    return report;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Calculate comparison metrics
   */
  private calculateComparison(v5Results: V5SampleResult[]): QualityComparison {
    if (v5Results.length === 0) {
      return this.getEmptyComparison();
    }

    const scores = v5Results.map(r => r.score.total);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate standard deviation for consistency
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const avgTime = v5Results.reduce((sum, r) => sum + r.generationTimeMs, 0) / v5Results.length;

    // Average dimension scores
    const dimensions = {
      powerWords: { v5: this.avgDimension(v5Results, 'powerWords') },
      emotionalTriggers: { v5: this.avgDimension(v5Results, 'emotionalTriggers') },
      readability: { v5: this.avgDimension(v5Results, 'readability') },
      cta: { v5: this.avgDimension(v5Results, 'cta') },
      urgency: { v5: this.avgDimension(v5Results, 'urgency') },
      trust: { v5: this.avgDimension(v5Results, 'trust') },
    };

    return {
      v5AvgScore: avgScore,
      scoreDelta: 0,  // No V4 comparison
      v5Consistency: stdDev,
      avgGenerationTimeMs: Math.round(avgTime),
      dimensions,
    };
  }

  /**
   * Average a dimension across results
   */
  private avgDimension(
    results: V5SampleResult[],
    dimension: keyof ContentScore['dimensions']
  ): number {
    const values = results.map(r => r.score.dimensions[dimension]);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get empty comparison structure
   */
  private getEmptyComparison(): QualityComparison {
    return {
      v5AvgScore: 0,
      scoreDelta: 0,
      v5Consistency: 0,
      avgGenerationTimeMs: 0,
      dimensions: {
        powerWords: { v5: 0 },
        emotionalTriggers: { v5: 0 },
        readability: { v5: 0 },
        cta: { v5: 0 },
        urgency: { v5: 0 },
        trust: { v5: 0 },
      },
    };
  }

  /**
   * Determine recommendation without V4 comparison
   */
  private determineRecommendation(
    comparison: QualityComparison,
    sampleCount: number
  ): ComparisonResult['recommendation'] {
    if (sampleCount === 0) return 'needs-review';

    // High average score with good consistency
    if (comparison.v5AvgScore >= 75 && comparison.v5Consistency <= 10) {
      return 'v5-preferred';
    }

    // Decent score but inconsistent
    if (comparison.v5AvgScore >= 70 && comparison.v5Consistency > 10) {
      return 'needs-review';
    }

    // Low scores
    if (comparison.v5AvgScore < 70) {
      return 'needs-review';
    }

    return 'equivalent';
  }

  /**
   * Determine recommendation with V4 comparison
   */
  private determineRecommendationWithV4(
    comparison: QualityComparison
  ): ComparisonResult['recommendation'] {
    const delta = comparison.scoreDelta;

    // V5 clearly better
    if (delta >= 5 && comparison.v5AvgScore >= 75) {
      return 'v5-preferred';
    }

    // V4 clearly better
    if (delta <= -5) {
      return 'v4-preferred';
    }

    // Close scores
    if (Math.abs(delta) < 5) {
      return 'equivalent';
    }

    return 'needs-review';
  }

  /**
   * Aggregate batch results
   */
  private aggregateBatchResults(results: ComparisonResult[]): BatchComparisonResult {
    let v5Wins = 0;
    let v4Wins = 0;
    let ties = 0;
    let totalDelta = 0;

    const platformBreakdown: Record<Platform, { v5Avg: number; tests: number }> = {
      linkedin: { v5Avg: 0, tests: 0 },
      facebook: { v5Avg: 0, tests: 0 },
      instagram: { v5Avg: 0, tests: 0 },
      twitter: { v5Avg: 0, tests: 0 },
      tiktok: { v5Avg: 0, tests: 0 },
    };

    for (const result of results) {
      if (result.recommendation === 'v5-preferred') v5Wins++;
      else if (result.recommendation === 'v4-preferred') v4Wins++;
      else ties++;

      totalDelta += result.comparison.scoreDelta;

      platformBreakdown[result.platform].v5Avg = result.comparison.v5AvgScore;
      platformBreakdown[result.platform].tests = result.v5Results.length;
    }

    const avgScoreDelta = totalDelta / results.length;

    let overallRecommendation: BatchComparisonResult['overallRecommendation'];
    if (v5Wins >= results.length * 0.7 && avgScoreDelta >= 0) {
      overallRecommendation = 'v5-ready';
    } else if (v4Wins > v5Wins) {
      overallRecommendation = 'v5-issues';
    } else {
      overallRecommendation = 'needs-more-testing';
    }

    return {
      totalTests: results.length,
      v5Wins,
      v4Wins,
      ties,
      avgScoreDelta,
      platformBreakdown,
      overallRecommendation,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const v4V5Comparison = new V4V5Comparison();

export { V4V5Comparison };

export default v4V5Comparison;
