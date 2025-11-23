/**
 * Session Manager Service
 *
 * Handles UVP session persistence, auto-save, and restoration
 *
 * Created: 2025-11-20
 */

import { supabase } from '@/lib/supabase';
import type {
  UVPSession,
  CreateSessionInput,
  UpdateSessionInput,
  SessionListItem,
  UVPStepKey
} from '@/types/session.types';

export class SessionManagerService {
  /**
   * Create a new UVP session
   */
  async createSession(input: CreateSessionInput): Promise<{ success: boolean; session?: UVPSession; error?: string }> {
    try {
      console.log('[SessionManager] Creating new session:', input.session_name);

      const { data, error } = await supabase
        .from('uvp_sessions')
        .insert({
          brand_id: input.brand_id,
          session_name: input.session_name,
          website_url: input.website_url,
          current_step: input.current_step,
          business_info: input.business_info,
          industry_info: input.industry_info,
          completed_steps: [],
          progress_percentage: 0,
        })
        .select()
        .single();

      if (error) {
        console.warn('[SessionManager] ⚠️ Error creating session (non-critical):', error.message);
        return { success: false, error: error.message };
      }

      console.log('[SessionManager] Session created:', data.id);
      return { success: true, session: this.mapToSession(data) };
    } catch (error) {
      console.warn('[SessionManager] ⚠️ Unexpected error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update an existing session
   */
  async updateSession(input: UpdateSessionInput): Promise<{ success: boolean; session?: UVPSession; error?: string }> {
    try {
      console.log('[SessionManager] Updating session:', input.session_id);

      // Build update object
      const updateData: any = {
        last_accessed: new Date().toISOString(),
      };

      if (input.current_step) updateData.current_step = input.current_step;
      if (input.products_data) updateData.products_data = input.products_data;
      if (input.customer_data) updateData.customer_data = input.customer_data;
      if (input.transformation_data) updateData.transformation_data = input.transformation_data;
      if (input.solution_data) updateData.solution_data = input.solution_data;
      if (input.benefit_data) updateData.benefit_data = input.benefit_data;
      if (input.complete_uvp) updateData.complete_uvp = input.complete_uvp;
      if (input.scraped_content) updateData.scraped_content = input.scraped_content;
      if (input.industry_info) updateData.industry_info = input.industry_info;
      if (input.business_info) updateData.business_info = input.business_info;
      if (input.completed_steps) updateData.completed_steps = input.completed_steps;
      if (input.progress_percentage !== undefined) updateData.progress_percentage = input.progress_percentage;

      const { data, error } = await supabase
        .from('uvp_sessions')
        .update(updateData)
        .eq('id', input.session_id)
        .select()
        .single();

      if (error) {
        console.warn('[SessionManager] ⚠️ Error updating session:', error);
        return { success: false, error: error.message };
      }

      console.log('[SessionManager] Session updated successfully');
      return { success: true, session: this.mapToSession(data) };
    } catch (error) {
      console.warn('[SessionManager] ⚠️ Unexpected error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<{ success: boolean; session?: UVPSession; error?: string }> {
    try {
      console.log('[SessionManager] Fetching session:', sessionId);

      // Check if user is authenticated before querying
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[SessionManager] ⚠️ Cannot fetch session - user not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('uvp_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.warn('[SessionManager] ⚠️ Error fetching session:', error);
        return { success: false, error: error.message };
      }

      // Update last accessed
      await supabase
        .from('uvp_sessions')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', sessionId);

      return { success: true, session: this.mapToSession(data) };
    } catch (error) {
      console.warn('[SessionManager] ⚠️ Unexpected error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * List all sessions for a brand
   */
  async listSessions(brandId: string): Promise<{ success: boolean; sessions?: SessionListItem[]; error?: string }> {
    try {
      console.log('[SessionManager] Listing sessions for brand:', brandId);

      // Check if user is authenticated before querying
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[SessionManager] ⚠️ Cannot list sessions - user not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('uvp_sessions')
        .select('id, session_name, website_url, current_step, progress_percentage, last_accessed, created_at')
        .eq('brand_id', brandId)
        .order('last_accessed', { ascending: false });

      if (error) {
        console.warn('[SessionManager] ⚠️ Error listing sessions:', error);
        return { success: false, error: error.message };
      }

      const sessions: SessionListItem[] = data.map(row => ({
        id: row.id,
        session_name: row.session_name,
        website_url: row.website_url,
        current_step: row.current_step as UVPStepKey,
        progress_percentage: row.progress_percentage || 0,
        last_accessed: new Date(row.last_accessed),
        created_at: new Date(row.created_at),
      }));

      console.log('[SessionManager] Found', sessions.length, 'sessions');
      return { success: true, sessions };
    } catch (error) {
      console.warn('[SessionManager] ⚠️ Unexpected error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[SessionManager] Deleting session:', sessionId);

      const { error } = await supabase
        .from('uvp_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.warn('[SessionManager] ⚠️ Error deleting session:', error);
        return { success: false, error: error.message };
      }

      console.log('[SessionManager] Session deleted successfully');
      return { success: true };
    } catch (error) {
      console.warn('[SessionManager] ⚠️ Unexpected error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Find or create session for a website URL
   */
  async findOrCreateSession(
    brandId: string,
    websiteUrl: string,
    businessName: string
  ): Promise<{ success: boolean; session?: UVPSession; isNew?: boolean; error?: string }> {
    try {
      // Check if user is authenticated before querying
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Skip query for unauthenticated users - just create new session
        const createResult = await this.createSession({
          brand_id: brandId,
          session_name: businessName,
          website_url: websiteUrl,
          current_step: 'products',
        });
        return { ...createResult, isNew: true };
      }

      // Try to find existing session
      const { data: existing } = await supabase
        .from('uvp_sessions')
        .select('*')
        .eq('brand_id', brandId)
        .eq('website_url', websiteUrl)
        .single();

      if (existing) {
        console.log('[SessionManager] Found existing session');
        return { success: true, session: this.mapToSession(existing), isNew: false };
      }

      // Create new session
      const createResult = await this.createSession({
        brand_id: brandId,
        session_name: businessName,
        website_url: websiteUrl,
        current_step: 'products',
      });

      if (createResult.success) {
        return { ...createResult, isNew: true };
      }

      return createResult;
    } catch (error) {
      console.warn('[SessionManager] ⚠️ Unexpected error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Calculate progress percentage based on completed steps
   */
  calculateProgress(completedSteps: UVPStepKey[]): number {
    const totalSteps = 6; // products, customer, transformation, solution, benefit, synthesis
    return Math.round((completedSteps.length / totalSteps) * 100);
  }

  /**
   * Map database row to UVPSession type
   */
  private mapToSession(data: any): UVPSession {
    return {
      id: data.id,
      brand_id: data.brand_id,
      session_name: data.session_name,
      website_url: data.website_url,
      current_step: data.current_step,
      products_data: data.products_data,
      customer_data: data.customer_data,
      transformation_data: data.transformation_data,
      solution_data: data.solution_data,
      benefit_data: data.benefit_data,
      complete_uvp: data.complete_uvp,
      scraped_content: data.scraped_content,
      industry_info: data.industry_info,
      business_info: data.business_info,
      completed_steps: data.completed_steps || [],
      progress_percentage: data.progress_percentage || 0,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      last_accessed: new Date(data.last_accessed),
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManagerService();
