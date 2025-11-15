/**
 * Mirror Orchestrator Service
 * Coordinates all Mirror diagnostic services and manages data persistence
 */

import {
  type BrandData,
  type MirrorDiagnostic,
  type CriticalGap,
  calculateOverallHealthScore,
} from '@/types/mirror-diagnostics'
import { MarketPositionService } from './market-position.service'
import { CustomerTruthService } from './customer-truth.service'
import { BrandFitService } from './brand-fit.service'
import { supabase } from '@/lib/supabase'

export class MirrorOrchestratorService {
  /**
   * Run complete Mirror diagnostic for a brand
   */
  static async runFullDiagnostic(
    brandId: string,
    brandData: BrandData
  ): Promise<MirrorDiagnostic> {
    console.log('[MirrorOrchestrator] Starting full diagnostic for:', brandData.name)

    try {
      // Run all three analyses in parallel using Promise.allSettled for maximum resilience
      // This ensures one service failure doesn't crash the entire diagnostic
      console.log('[MirrorOrchestrator] Running parallel analyses...')
      const results = await Promise.allSettled([
        MarketPositionService.analyzeMarketPosition(brandId, brandData),
        CustomerTruthService.analyzeCustomerTruth(brandId, brandData),
        BrandFitService.analyzeBrandFit(brandId, brandData),
      ])

      // Extract results - services have built-in graceful degradation, so this is an extra safety layer
      const marketPositionAnalysis = results[0].status === 'fulfilled'
        ? results[0].value
        : {
            score: 50,
            data: {
              current_rank: 5,
              total_competitors: 10,
              top_competitors: [{
                name: 'Analysis failed',
                positioning: 'Market position analysis encountered an error',
                strengths: ['Unable to complete analysis - please try again'],
              }],
              keyword_rankings: {},
              keyword_rankings_detailed: [],
              competitive_gaps: [],
              pricing_position: { tier: 'mid-market', vs_market: 'Unknown' },
            },
          }

      const customerTruthAnalysis = results[1].status === 'fulfilled'
        ? results[1].value
        : {
            score: 50,
            data: {
              expected_demographic: { age: '35-55', income: '$60k-$100k', location: 'Regional market' },
              actual_demographic: { age: 'Unknown', income: 'Unknown', location: 'Unknown' },
              match_percentage: 50,
              why_they_choose: [{ reason: 'Customer analysis failed', percentage: 100, source: 'error' }],
              common_objections: ['Customer truth analysis encountered an error'],
              buyer_journey_gaps: [],
              price_vs_value_perception: 'Unable to determine',
            },
          }

      const brandFitAnalysis = results[2].status === 'fulfilled'
        ? results[2].value
        : {
            score: 50,
            data: {
              messaging_consistency: 50,
              differentiation_score: 50,
              target_audience_clarity: 50,
              brand_promise_delivery: 50,
              messaging_gaps: ['Brand fit analysis encountered an error'],
              differentiation_opportunities: [],
              positioning_statement: 'Unable to complete analysis',
            },
          }

      // Log any failures for monitoring
      results.forEach((result, index) => {
        const serviceName = ['MarketPosition', 'CustomerTruth', 'BrandFit'][index]
        if (result.status === 'rejected') {
          console.error(`[MirrorOrchestrator] ${serviceName} failed:`, result.reason)
        } else {
          console.log(`[MirrorOrchestrator] ✅ ${serviceName} complete (score: ${result.value.score})`)
        }
      })

      console.log('[MirrorOrchestrator] All analyses complete')

      // Calculate overall health score (weighted average)
      const overallHealthScore = calculateOverallHealthScore(
        marketPositionAnalysis.score,
        customerTruthAnalysis.score,
        brandFitAnalysis.score
      )

      // Check if brand has completed UVP
      const hasCompletedUVP = await this.checkUVPCompletion(brandId)

      // Check if brand has completed Buyer Journey
      const hasBuyerJourney = await CustomerTruthService.hasBuyerJourneyCompleted(brandId)

      // Identify top 3 critical gaps (only after UVP for strategic gaps)
      const criticalGaps = await this.identifyCriticalGaps(
        marketPositionAnalysis.data,
        customerTruthAnalysis.data,
        brandFitAnalysis.data,
        hasCompletedUVP
      )

      // Build complete diagnostic
      const diagnostic: Omit<MirrorDiagnostic, 'id' | 'created_at' | 'updated_at'> & { has_buyer_journey?: boolean } = {
        brand_id: brandId,
        market_position_score: marketPositionAnalysis.score,
        customer_match_score: customerTruthAnalysis.score,
        brand_clarity_score: brandFitAnalysis.score,
        overall_health_score: overallHealthScore,
        market_position_data: marketPositionAnalysis.data,
        customer_truth_data: customerTruthAnalysis.data,
        brand_fit_data: brandFitAnalysis.data,
        critical_gaps: criticalGaps,
        uvp_delivery_analysis: null, // Will be populated post-UVP
        has_completed_uvp: hasCompletedUVP,
        has_buyer_journey: hasBuyerJourney,
        analyzed_at: new Date().toISOString(),
      }

      // Save to database
      console.log('[MirrorOrchestrator] Saving diagnostic to database...')
      const savedDiagnostic = await this.saveDiagnostic(diagnostic)

      console.log('[MirrorOrchestrator] Diagnostic complete. Overall score:', overallHealthScore)

      return savedDiagnostic
    } catch (error) {
      console.error('[MirrorOrchestrator] Diagnostic failed:', error)
      throw new Error(`Failed to run Mirror diagnostic: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Identify top 3 critical gaps from all analyses
   * Pre-UVP: Only show universal issues (market position, messaging)
   * Post-UVP: Show strategic gaps (targeting, positioning vs execution)
   */
  private static async identifyCriticalGaps(
    marketData: any,
    customerData: any,
    brandData: any,
    hasCompletedUVP: boolean
  ): Promise<CriticalGap[]> {
    const gaps: CriticalGap[] = []

    // PRE-UVP GAPS: Universal issues that exist regardless of strategy

    // Gap: Poor market position (always relevant)
    if (marketData.current_rank > 5) {
      gaps.push({
        priority: gaps.length === 0 ? 1 : gaps.length === 1 ? 2 : 3,
        gap: 'Low visibility in market',
        impact: `Ranked #${marketData.current_rank} of ${marketData.total_competitors} - missing potential customers`,
        fix: 'Improve SEO and local search presence',
        fix_action_link: '/broadcast#seo',
      })
    }

    // POST-UVP GAPS: Strategic alignment issues (only after they define strategy)

    if (hasCompletedUVP) {
      // Gap: Price-based competition (only matters after they define value prop)
      if (customerData.price_vs_value_perception.includes('cheapest')) {
        gaps.push({
          priority: gaps.length === 0 ? 1 : 2,
          gap: "You're competing on price, not value",
          impact:
            'Losing margin and attracting price-sensitive customers who switch to cheaper alternatives',
          fix: 'Strengthen value communication in customer touchpoints',
          fix_action_link: '/roadmap#messaging',
        })
      }

      // Gap: Demographic mismatch (only relevant after they define target)
      if (customerData.match_percentage < 50) {
        gaps.push({
          priority: gaps.length === 0 ? 1 : 2,
          gap: 'Target audience misalignment',
          impact: `Only ${customerData.match_percentage}% match between your defined target and actual customers`,
          fix: 'Either adjust messaging to reach target audience or update target definition',
          fix_action_link: '/align#target-audience',
        })
      }

      // Gap: Messaging inconsistency (matters more post-UVP when they have clear message)
      if (brandData.messaging_consistency < 60) {
        gaps.push({
          priority: gaps.length === 0 ? 1 : gaps.length === 1 ? 2 : 3,
          gap: 'Inconsistent messaging across touchpoints',
          impact: `${brandData.messaging_consistency}% consistency score - your UVP isn't landing everywhere`,
          fix: 'Align all touchpoints with your defined value proposition',
          fix_action_link: '/align#messaging',
        })
      }

      // Gap: Weak differentiation (post-UVP issue)
      if (brandData.differentiation_score < 50) {
        gaps.push({
          priority: gaps.length === 0 ? 1 : gaps.length === 1 ? 2 : 3,
          gap: 'Weak differentiation from competitors',
          impact: `${brandData.differentiation_score}% differentiation - not standing out in market`,
          fix: 'Refine positioning to own unique market position',
          fix_action_link: '/align#positioning',
        })
      }
    }

    // Return top 3 by priority
    return gaps.slice(0, 3)
  }

  /**
   * Check if brand has completed UVP flow
   */
  private static async checkUVPCompletion(brandId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('brand_uvps')
        .select('id, is_complete')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !data) return false

      return data.is_complete === true
    } catch (error) {
      console.error('[MirrorOrchestrator] UVP check failed:', error)
      return false
    }
  }

  /**
   * Save diagnostic to database
   */
  private static async saveDiagnostic(
    diagnostic: Omit<MirrorDiagnostic, 'id' | 'created_at' | 'updated_at'> & { has_buyer_journey?: boolean }
  ): Promise<MirrorDiagnostic> {
    try {
      // Check if diagnostic already exists for this brand
      const { data: existing } = await supabase
        .from('mirror_diagnostics')
        .select('id')
        .eq('brand_id', diagnostic.brand_id)
        .single()

      // Build update/insert object conditionally including has_buyer_journey if present
      const dataToSave: any = {
        market_position_score: diagnostic.market_position_score,
        customer_match_score: diagnostic.customer_match_score,
        brand_clarity_score: diagnostic.brand_clarity_score,
        overall_health_score: diagnostic.overall_health_score,
        market_position_data: diagnostic.market_position_data,
        customer_truth_data: diagnostic.customer_truth_data,
        brand_fit_data: diagnostic.brand_fit_data,
        critical_gaps: diagnostic.critical_gaps,
        uvp_delivery_analysis: diagnostic.uvp_delivery_analysis,
        has_completed_uvp: diagnostic.has_completed_uvp,
        analyzed_at: diagnostic.analyzed_at,
      }

      // Only include has_buyer_journey if it's present (after migration is run)
      if ('has_buyer_journey' in diagnostic) {
        dataToSave.has_buyer_journey = diagnostic.has_buyer_journey
      }

      if (existing) {
        // Update existing diagnostic
        const { data, error } = await supabase
          .from('mirror_diagnostics')
          .update(dataToSave)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Insert new diagnostic
        const insertData = { ...dataToSave, brand_id: diagnostic.brand_id }
        const { data, error } = await supabase
          .from('mirror_diagnostics')
          .insert([insertData])
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('[MirrorOrchestrator] Save failed:', error)
      throw new Error('Failed to save diagnostic')
    }
  }

  /**
   * Load latest diagnostic for a brand
   */
  static async loadLatestDiagnostic(brandId: string): Promise<MirrorDiagnostic | null> {
    try {
      const { data, error } = await supabase
        .from('mirror_diagnostics')
        .select('*')
        .eq('brand_id', brandId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        console.log('[MirrorOrchestrator] No diagnostic found for brand:', brandId)
        return null
      }

      return data
    } catch (error) {
      console.error('[MirrorOrchestrator] Load failed:', error)
      return null
    }
  }

  /**
   * Enhance diagnostic with UVP delivery analysis (Post-UVP only)
   */
  static async enhanceWithUVP(brandId: string): Promise<MirrorDiagnostic | null> {
    try {
      // Load current diagnostic
      const diagnostic = await this.loadLatestDiagnostic(brandId)
      if (!diagnostic) return null

      // Check if UVP is completed
      const hasCompletedUVP = await this.checkUVPCompletion(brandId)
      if (!hasCompletedUVP) {
        console.log('[MirrorOrchestrator] UVP not completed yet')
        return diagnostic
      }

      // Get UVP data
      const { data: uvp } = await supabase
        .from('brand_uvps')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_complete', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!uvp) return diagnostic

      // TODO: Implement UVP delivery analysis
      // This would analyze:
      // - How well messaging aligns with UVP
      // - Customer confirmation of UVP promise
      // - UVP keyword rankings
      // - NPS before/after trends
      // - Differentiation proof

      const uvpDeliveryAnalysis = {
        uvp_promise: uvp.value_proposition || 'Unknown',
        delivery_score: 0,
        customer_confirmation_percentage: 0,
        alignment_metrics: {
          messaging: 0,
          reviews: 0,
          search: 0,
        },
        uvp_keyword_rankings: {},
        differentiation_proof: [],
        nps_before: null,
        nps_after: null,
        alignment_gaps: [],
      }

      // Update diagnostic with UVP analysis
      const { data: updated, error } = await supabase
        .from('mirror_diagnostics')
        .update({
          uvp_delivery_analysis: uvpDeliveryAnalysis,
          has_completed_uvp: true,
        })
        .eq('id', diagnostic.id)
        .select()
        .single()

      if (error) throw error

      return updated
    } catch (error) {
      console.error('[MirrorOrchestrator] UVP enhancement failed:', error)
      return null
    }
  }

  /**
   * Refresh diagnostic (re-run analysis)
   */
  static async refreshDiagnostic(
    brandId: string,
    brandData: BrandData
  ): Promise<MirrorDiagnostic> {
    console.log('[MirrorOrchestrator] Refreshing diagnostic for:', brandData.name)
    return this.runFullDiagnostic(brandId, brandData)
  }
}
