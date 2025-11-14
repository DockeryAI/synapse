import { IndustryIntelligenceService } from './industry-intelligence'

/**
 * Benchmarking Service
 * Compares brand metrics against industry benchmarks
 */

export interface BenchmarkResult {
  metric: string
  actualValue: number
  industryAverage: number
  industryMin: number
  industryMax: number
  percentile: number
  status: 'below' | 'average' | 'above'
  recommendation: string
}

export class BenchmarkingService {
  /**
   * Get benchmarks for multiple metrics
   */
  static async getBenchmarks(
    industry: string,
    metrics: Record<string, number>
  ): Promise<BenchmarkResult[]> {
    const profile = await IndustryIntelligenceService.getIndustryProfile(industry)
    if (!profile) return []

    const results: BenchmarkResult[] = []

    for (const [metric, value] of Object.entries(metrics)) {
      const comparison = IndustryIntelligenceService.getBenchmarkComparison(
        profile,
        metric,
        value
      )

      results.push({
        metric,
        actualValue: value,
        industryAverage: profile.benchmark_metrics.engagement_rate_range.average,
        industryMin: profile.benchmark_metrics.engagement_rate_range.min,
        industryMax: profile.benchmark_metrics.engagement_rate_range.max,
        ...comparison,
      })
    }

    return results
  }

  /**
   * Calculate overall brand performance score
   */
  static calculateOverallScore(benchmarks: BenchmarkResult[]): number {
    if (benchmarks.length === 0) return 0

    const totalPercentile = benchmarks.reduce((sum, b) => sum + b.percentile, 0)
    return Math.round(totalPercentile / benchmarks.length)
  }
}
