/**
 * Situation Analyzer Service
 * Analyzes brand health, market position, and current state
 */

export interface BrandHealthScore {
  overall: number
  clarity: number
  consistency: number
  engagement: number
  differentiation: number
}

export interface MarketPosition {
  industry: string
  targetAudience: string
  geographicReach: string
  primaryArchetype: string
  secondaryArchetype?: string
}

export class SituationAnalyzer {
  /**
   * Calculate brand health score
   */
  static calculateBrandHealth(brandData: any): BrandHealthScore {
    // Use REAL brand health data from backend calculation
    if (brandData?.brandHealthDetails) {
      const details = brandData.brandHealthDetails
      return {
        overall: details.overall || 0,
        clarity: details.clarity?.score || 0,
        consistency: details.consistency?.score || 0,
        engagement: details.engagement?.score || 0,
        differentiation: details.differentiation?.score || 0,
      }
    }

    // Fallback to brandHealth if only overall score exists
    if (brandData?.brandHealth !== undefined) {
      // If we only have overall score, calculate proportional breakdowns
      const overall = brandData.brandHealth
      return {
        overall: overall,
        clarity: Math.round(overall * 0.95),
        consistency: Math.round(overall * 1.05),
        engagement: Math.round(overall * 0.85),
        differentiation: Math.round(overall * 0.90),
      }
    }

    // Last resort fallback (should never happen with real data)
    console.warn('[SituationAnalyzer] No brand health data found, using fallback')
    return {
      overall: 50,
      clarity: 50,
      consistency: 50,
      engagement: 50,
      differentiation: 50,
    }
  }

  /**
   * Get hot spots (areas performing well)
   */
  static getHotSpots(health: BrandHealthScore): string[] {
    const hotSpots: string[] = []

    if (health.differentiation >= 70) hotSpots.push('Strong differentiation in market')
    if (health.consistency >= 70) hotSpots.push('Consistent brand messaging')
    if (health.engagement >= 70) hotSpots.push('Good audience engagement')

    return hotSpots
  }

  /**
   * Get attention needed areas
   */
  static getAttentionNeeded(health: BrandHealthScore): string[] {
    const attention: string[] = []

    if (health.clarity < 70) attention.push('Brand clarity needs improvement')
    if (health.consistency < 70) attention.push('Inconsistent messaging across channels')
    if (health.engagement < 60) attention.push('Low engagement rates')
    if (health.differentiation < 60) attention.push('Weak market differentiation')

    return attention
  }

  /**
   * Get market position
   */
  static getMarketPosition(brandData: any): MarketPosition {
    return {
      industry: brandData?.industry || 'Professional Services',
      targetAudience: brandData?.targetAudience || 'Small to medium businesses',
      geographicReach: brandData?.location || 'Local (50-mile radius)',
      primaryArchetype: brandData?.archetype || 'The Sage',
      secondaryArchetype: 'The Hero',
    }
  }
}
