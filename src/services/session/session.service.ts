/**
 * Session Management Service
 * Handles auto-save and restore of MARBA dashboard and UVP wizard sessions
 */

import { supabase } from '@/lib/supabase'

export interface BrandSession {
  id: string
  brand_id: string
  session_name: string
  url_slug: string
  mirror_state: any
  uvp_state: any
  last_saved_at: string
  created_at: string
  is_active: boolean
  completion_percentage: number
}

export class SessionService {
  /**
   * Auto-save current session
   * Called after every state change in MARBA dashboard and UVP wizard
   */
  static async saveSession(params: {
    brandId: string
    sessionName: string
    urlSlug: string
    mirrorState?: any
    uvpState?: any
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { brandId, sessionName, urlSlug, mirrorState, uvpState } = params

      // Calculate completion percentage
      const completionPercentage = this.calculateCompletion(mirrorState, uvpState)

      const { error } = await supabase
        .from('brand_sessions')
        .upsert(
          {
            brand_id: brandId,
            session_name: sessionName,
            url_slug: urlSlug,
            mirror_state: mirrorState || null,
            uvp_state: uvpState || null,
            last_saved_at: new Date().toISOString(),
            completion_percentage: completionPercentage,
            is_active: true,
          },
          {
            onConflict: 'brand_id,url_slug',
          }
        )

      if (error) {
        console.error('[SessionService] Failed to save session:', error)
        return { success: false, error: error.message }
      }

      console.log('[SessionService] Session saved:', urlSlug)
      return { success: true }
    } catch (err) {
      console.error('[SessionService] Exception saving session:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  /**
   * Load session by URL slug
   */
  static async loadSession(urlSlug: string): Promise<BrandSession | null> {
    try {
      const { data, error } = await supabase
        .from('brand_sessions')
        .select('*')
        .eq('url_slug', urlSlug)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error('[SessionService] Failed to load session:', error)
        return null
      }

      return data as BrandSession | null
    } catch (err) {
      console.error('[SessionService] Exception loading session:', err)
      return null
    }
  }

  /**
   * Load session by brand ID and URL slug
   */
  static async loadSessionByBrand(
    brandId: string,
    urlSlug: string
  ): Promise<BrandSession | null> {
    try {
      const { data, error } = await supabase
        .from('brand_sessions')
        .select('*')
        .eq('brand_id', brandId)
        .eq('url_slug', urlSlug)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error('[SessionService] Failed to load session by brand:', error)
        return null
      }

      return data as BrandSession | null
    } catch (err) {
      console.error('[SessionService] Exception loading session by brand:', err)
      return null
    }
  }

  /**
   * List all sessions for a brand
   */
  static async listSessions(brandId: string): Promise<BrandSession[]> {
    try {
      const { data, error } = await supabase
        .from('brand_sessions')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .order('last_saved_at', { ascending: false })

      if (error) {
        console.error('[SessionService] Failed to list sessions:', error)
        return []
      }

      return (data as BrandSession[]) || []
    } catch (err) {
      console.error('[SessionService] Exception listing sessions:', err)
      return []
    }
  }

  /**
   * Get recent sessions across all brands
   */
  static async getRecentSessions(limit: number = 5): Promise<BrandSession[]> {
    try {
      const { data, error } = await supabase
        .from('brand_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_saved_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[SessionService] Failed to get recent sessions:', error)
        return []
      }

      return (data as BrandSession[]) || []
    } catch (err) {
      console.error('[SessionService] Exception getting recent sessions:', err)
      return []
    }
  }

  /**
   * Set active session (for resuming work)
   */
  static async setActiveSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update last_accessed_at timestamp
      const { error } = await supabase
        .from('brand_sessions')
        .update({ last_saved_at: new Date().toISOString() })
        .eq('id', sessionId)

      if (error) {
        console.error('[SessionService] Failed to set active session:', error)
        return { success: false, error: error.message }
      }

      console.log('[SessionService] Active session set:', sessionId)
      return { success: true }
    } catch (err) {
      console.error('[SessionService] Exception setting active session:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  /**
   * Delete session (soft delete by marking inactive)
   */
  static async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('brand_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)

      if (error) {
        console.error('[SessionService] Failed to delete session:', error)
        return { success: false, error: error.message }
      }

      console.log('[SessionService] Session deleted:', sessionId)
      return { success: true }
    } catch (err) {
      console.error('[SessionService] Exception deleting session:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  /**
   * Permanently delete session (hard delete)
   */
  static async permanentlyDeleteSession(
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('brand_sessions').delete().eq('id', sessionId)

      if (error) {
        console.error('[SessionService] Failed to permanently delete session:', error)
        return { success: false, error: error.message }
      }

      console.log('[SessionService] Session permanently deleted:', sessionId)
      return { success: true }
    } catch (err) {
      console.error('[SessionService] Exception permanently deleting session:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  /**
   * Calculate completion percentage based on state
   */
  private static calculateCompletion(mirrorState: any, uvpState: any): number {
    let total = 0
    let completed = 0

    // Check MARBA sections (5 sections * 20 points each)
    if (mirrorState) {
      const sections = ['measure', 'intend', 'reimagine', 'reach', 'optimize', 'reflect']
      sections.forEach((section) => {
        total += 20
        if (mirrorState[section] && Object.keys(mirrorState[section]).length > 0) {
          completed += 20
        }
      })
    }

    // Check UVP completion (worth 40 points for primary importance)
    if (uvpState) {
      total += 40
      if (uvpState.is_primary) {
        completed += 40
      } else if (uvpState.current_step && uvpState.current_step > 0) {
        // Partial credit based on wizard progress
        const stepProgress = (uvpState.current_step / 7) * 40
        completed += Math.floor(stepProgress)
      }
    }

    return total > 0 ? Math.floor((completed / total) * 100) : 0
  }

  /**
   * Generate URL slug from session name
   */
  static generateUrlSlug(sessionName: string): string {
    return sessionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
