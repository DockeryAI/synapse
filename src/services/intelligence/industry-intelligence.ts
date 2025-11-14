import { IndustryProfile, CustomerTrigger } from '@/types/intelligence.types'

/**
 * Industry Intelligence Service
 * Provides industry-specific insights, triggers, and benchmarks
 */

export class IndustryIntelligenceService {
  /**
   * Get industry profile by NAICS code or industry name
   */
  static async getIndustryProfile(
    industryIdentifier: string
  ): Promise<IndustryProfile | null> {
    console.error('[IndustryIntelligence] Industry profile database not implemented')
    throw new Error('IndustryIntelligence not implemented yet. Implement industry profile database or API integration.')
  }

  /**
   * Get active triggers for an industry based on current context
   */
  static getActiveTriggers(
    profile: IndustryProfile,
    context: {
      month?: number
      weather?: string
      localEvents?: string[]
    }
  ): CustomerTrigger[] {
    const activeTriggers: CustomerTrigger[] = []

    // Check seasonal triggers
    const currentMonth = context.month || new Date().getMonth()
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]
    const currentMonthName = monthNames[currentMonth]

    if (profile.seasonality.peak_months.includes(currentMonthName)) {
      activeTriggers.push(...profile.customer_triggers.filter(
        (t) => t.category === 'seasonal'
      ))
    }

    // Check weather-based triggers
    if (context.weather) {
      const weatherTriggers = profile.customer_triggers.filter(
        (t) => t.trigger.toLowerCase().includes(context.weather!.toLowerCase())
      )
      activeTriggers.push(...weatherTriggers)
    }

    // Return high-impact triggers first
    return activeTriggers.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 }
      return impactWeight[b.impact_level] - impactWeight[a.impact_level]
    })
  }

  /**
   * Get benchmark comparison for a metric
   */
  static getBenchmarkComparison(
    profile: IndustryProfile,
    metric: string,
    actualValue: number
  ): {
    percentile: number
    status: 'below' | 'average' | 'above'
    recommendation: string
  } {
    const benchmarks = profile.benchmark_metrics

    let min = 0
    let max = 100
    let avg = 50

    // Map metric to benchmark data
    if (metric === 'engagement_rate') {
      min = benchmarks.engagement_rate_range.min
      max = benchmarks.engagement_rate_range.max
      avg = benchmarks.engagement_rate_range.average
    }

    // Calculate percentile
    const range = max - min
    const percentile = Math.min(100, Math.max(0, ((actualValue - min) / range) * 100))

    // Determine status
    let status: 'below' | 'average' | 'above' = 'average'
    if (actualValue < avg * 0.8) status = 'below'
    if (actualValue > avg * 1.2) status = 'above'

    // Generate recommendation
    let recommendation = ''
    if (status === 'below') {
      recommendation = `Your ${metric} is below industry average. Consider increasing engagement tactics.`
    } else if (status === 'above') {
      recommendation = `Great! Your ${metric} is above industry average. Keep up the good work.`
    } else {
      recommendation = `Your ${metric} is within industry norms. Room for optimization.`
    }

    return { percentile, status, recommendation }
  }
}
