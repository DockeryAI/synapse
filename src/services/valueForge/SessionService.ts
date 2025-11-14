/**
 * Session Management Service
 *
 * Handles saving and loading Value Forge sessions to/from Supabase
 * Enables users to pause and resume their UVP building process
 */

import { supabase } from '../../utils/supabase/client';
import type { ValueForgeState } from '@/types/valueForge';

export interface ValueForgeSession {
  id: string;
  business_url: string;
  business_name: string;
  industry_code: string;
  industry_name: string;
  state: ValueForgeState;
  created_at: string;
  updated_at: string;
  completed: boolean;
}

export class SessionService {
  /**
   * Save current session to Supabase
   */
  static async saveSession(
    businessUrl: string,
    businessName: string,
    industryCode: string,
    industryName: string,
    state: ValueForgeState
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('value_forge_sessions')
        .upsert({
          business_url: businessUrl,
          business_name: businessName,
          industry_code: industryCode,
          industry_name: industryName,
          state: state,
          updated_at: new Date().toISOString(),
          completed: state.completionPercentage === 100
        }, {
          onConflict: 'business_url',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('[SessionService] Failed to save session:', error);
        return { success: false, error: error.message };
      }

      console.log(`[SessionService] Session saved successfully for ${businessUrl}`);
      return { success: true, sessionId: data.id };
    } catch (error) {
      console.error('[SessionService] Unexpected error saving session:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Load session by business URL
   */
  static async loadSession(businessUrl: string): Promise<ValueForgeSession | null> {
    try {
      const { data, error } = await supabase
        .from('value_forge_sessions')
        .select('*')
        .eq('business_url', businessUrl)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No session found - not an error, just return null
          return null;
        }
        console.error('[SessionService] Failed to load session:', error);
        return null;
      }

      console.log(`[SessionService] Session loaded for ${businessUrl}`);
      return data as ValueForgeSession;
    } catch (error) {
      console.error('[SessionService] Unexpected error loading session:', error);
      return null;
    }
  }

  /**
   * Get all saved sessions
   */
  static async getAllSessions(): Promise<ValueForgeSession[]> {
    try {
      const { data, error } = await supabase
        .from('value_forge_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[SessionService] Failed to load sessions:', error);
        return [];
      }

      console.log(`[SessionService] Loaded ${data.length} sessions`);
      return data as ValueForgeSession[];
    } catch (error) {
      console.error('[SessionService] Unexpected error loading sessions:', error);
      return [];
    }
  }

  /**
   * Delete a session
   */
  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('value_forge_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('[SessionService] Failed to delete session:', error);
        return false;
      }

      console.log(`[SessionService] Session ${sessionId} deleted`);
      return true;
    } catch (error) {
      console.error('[SessionService] Unexpected error deleting session:', error);
      return false;
    }
  }

  /**
   * Get in-progress sessions (not completed)
   */
  static async getInProgressSessions(): Promise<ValueForgeSession[]> {
    try {
      const { data, error } = await supabase
        .from('value_forge_sessions')
        .select('*')
        .eq('completed', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[SessionService] Failed to load in-progress sessions:', error);
        return [];
      }

      console.log(`[SessionService] Loaded ${data.length} in-progress sessions`);
      return data as ValueForgeSession[];
    } catch (error) {
      console.error('[SessionService] Unexpected error loading in-progress sessions:', error);
      return [];
    }
  }

  /**
   * Get completed sessions
   */
  static async getCompletedSessions(): Promise<ValueForgeSession[]> {
    try {
      const { data, error } = await supabase
        .from('value_forge_sessions')
        .select('*')
        .eq('completed', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[SessionService] Failed to load completed sessions:', error);
        return [];
      }

      console.log(`[SessionService] Loaded ${data.length} completed sessions`);
      return data as ValueForgeSession[];
    } catch (error) {
      console.error('[SessionService] Unexpected error loading completed sessions:', error);
      return [];
    }
  }
}
