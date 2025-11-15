/**
 * MIRROR Persistence Service
 * Handles saving and loading MIRROR framework data to/from Supabase
 */

import { supabase } from '@/lib/supabase'
import type { MirrorState } from '@/contexts/MirrorContext'

export interface MirrorSaveResult {
  success: boolean
  savedAt: string
  error?: string
}

export interface MirrorLoadResult {
  data: MirrorState | null
  error?: string
}

class MirrorPersistenceService {
  /**
   * Save MIRROR state to database
   */
  async save(brandId: string, state: MirrorState): Promise<MirrorSaveResult> {
    try {
      const timestamp = new Date().toISOString()

      // Upsert each section separately for better granularity
      const promises = [
        this.saveSection(brandId, 'measure', state.measure),
        this.saveSection(brandId, 'intend', state.intend),
        this.saveSection(brandId, 'reimagine', state.reimagine),
        this.saveSection(brandId, 'reach', state.reach),
        this.saveSection(brandId, 'optimize', state.optimize),
        this.saveSection(brandId, 'reflect', state.reflect)
      ]

      await Promise.all(promises)

      return {
        success: true,
        savedAt: timestamp
      }
    } catch (error) {
      console.error('Error saving MIRROR state:', error)
      return {
        success: false,
        savedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Save a single MIRROR section
   */
  private async saveSection(
    brandId: string,
    section: string,
    data: any
  ): Promise<void> {
    const { error } = await supabase
      .from('mirror_sections')
      .upsert({
        brand_id: brandId,
        section,
        data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'brand_id,section'
      })

    if (error) {
      throw error
    }
  }

  /**
   * Load MIRROR state from database
   */
  async load(brandId: string): Promise<MirrorLoadResult> {
    try {
      const { data, error } = await supabase
        .from('mirror_sections')
        .select('*')
        .eq('brand_id', brandId)

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return {
          data: null,
          error: 'No data found'
        }
      }

      // Reconstruct state from sections
      const state: MirrorState = {
        measure: {},
        intend: {},
        reimagine: {},
        reach: {},
        optimize: {},
        reflect: {},
        isDirty: false
      }

      data.forEach((row: any) => {
        if (row.section in state) {
          ;(state as any)[row.section] = row.data || {}
        }
      })

      // Find most recent update
      const lastSaved = data.reduce((latest, row) => {
        const updated = new Date(row.updated_at)
        return updated > latest ? updated : latest
      }, new Date(0))

      state.lastSaved = lastSaved.toISOString()

      return {
        data: state
      }
    } catch (error) {
      console.error('Error loading MIRROR state:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if MIRROR data exists for a brand
   */
  async exists(brandId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('mirror_sections')
        .select('id')
        .eq('brand_id', brandId)
        .limit(1)

      return !error && data && data.length > 0
    } catch (error) {
      console.error('Error checking MIRROR existence:', error)
      return false
    }
  }

  /**
   * Delete all MIRROR data for a brand
   */
  async delete(brandId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('mirror_sections')
        .delete()
        .eq('brand_id', brandId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting MIRROR state:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get section completion status
   */
  async getSectionStatus(brandId: string): Promise<Record<string, boolean>> {
    try {
      const { data, error } = await supabase
        .from('mirror_sections')
        .select('section, data')
        .eq('brand_id', brandId)

      if (error || !data) {
        return {
          measure: false,
          intend: false,
          reimagine: false,
          reach: false,
          optimize: false,
          reflect: false
        }
      }

      const status: Record<string, boolean> = {
        measure: false,
        intend: false,
        reimagine: false,
        reach: false,
        optimize: false,
        reflect: false
      }

      data.forEach((row: any) => {
        if (row.section in status) {
          status[row.section] = row.data && Object.keys(row.data).length > 0
        }
      })

      return status
    } catch (error) {
      console.error('Error getting section status:', error)
      return {
        measure: false,
        intend: false,
        reimagine: false,
        reach: false,
        optimize: false,
        reflect: false
      }
    }
  }
}

export const mirrorPersistenceService = new MirrorPersistenceService()
