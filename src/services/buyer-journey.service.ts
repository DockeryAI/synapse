/**
 * Buyer Journey Service
 * Handles CRUD operations for buyer journey data in Supabase
 */

import { supabase } from '@/lib/supabase'
import type { BuyerJourneyMap } from '@/types/buyer-journey'

export class BuyerJourneyService {
  /**
   * Load buyer journey for a brand
   */
  static async loadJourney(brandId: string): Promise<BuyerJourneyMap | null> {
    try {
      const { data, error } = await supabase
        .from('buyer_journeys')
        .select('*')
        .eq('brand_id', brandId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No journey found - return null (not an error)
          return null
        }
        throw error
      }

      return data?.journey_map as BuyerJourneyMap || null
    } catch (error) {
      console.error('[BuyerJourneyService] Error loading journey:', error)
      throw error
    }
  }

  /**
   * Save buyer journey for a brand
   */
  static async saveJourney(
    brandId: string,
    journeyMap: Partial<BuyerJourneyMap>,
    completedSteps: string[] = []
  ): Promise<BuyerJourneyMap> {
    try {
      // Check if journey already exists
      const existing = await this.loadJourney(brandId)

      if (existing) {
        // Update existing journey
        const { data, error } = await supabase
          .from('buyer_journeys')
          .update({
            journey_map: journeyMap,
            completed_steps: completedSteps,
            is_complete: journeyMap.is_complete || false,
            updated_at: new Date().toISOString(),
          })
          .eq('brand_id', brandId)
          .select()
          .single()

        if (error) throw error
        return data.journey_map as BuyerJourneyMap
      } else {
        // Insert new journey
        const { data, error } = await supabase
          .from('buyer_journeys')
          .insert({
            brand_id: brandId,
            journey_map: journeyMap,
            completed_steps: completedSteps,
            is_complete: journeyMap.is_complete || false,
          })
          .select()
          .single()

        if (error) throw error
        return data.journey_map as BuyerJourneyMap
      }
    } catch (error) {
      console.error('[BuyerJourneyService] Error saving journey:', error)
      throw error
    }
  }

  /**
   * Check if buyer journey has been completed
   */
  static async checkCompletion(brandId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('buyer_journeys')
        .select('is_complete')
        .eq('brand_id', brandId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No journey found - not complete
          return false
        }
        throw error
      }

      return data?.is_complete || false
    } catch (error) {
      console.error('[BuyerJourneyService] Error checking completion:', error)
      return false
    }
  }

  /**
   * Delete buyer journey for a brand
   */
  static async deleteJourney(brandId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('buyer_journeys')
        .delete()
        .eq('brand_id', brandId)

      if (error) throw error
    } catch (error) {
      console.error('[BuyerJourneyService] Error deleting journey:', error)
      throw error
    }
  }

  /**
   * Get ICP (Ideal Customer Profile) from journey
   */
  static async getICP(brandId: string) {
    try {
      const journey = await this.loadJourney(brandId)
      return journey?.ideal_customer_profile || null
    } catch (error) {
      console.error('[BuyerJourneyService] Error getting ICP:', error)
      return null
    }
  }
}
