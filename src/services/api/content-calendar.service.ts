// PRD Feature: GOVERNANCE-COMPLIANCE
/**
 * Content Calendar API Service
 *
 * Frontend service for content calendar operations using edge functions
 * Replaces direct Supabase calls to comply with governance
 */

import { supabase } from '@/lib/supabase';

export interface ContentCalendarItem {
  id: string;
  brand_id: string;
  content: string;
  platform: string;
  scheduled_for: string;
  status: string;
  created_at: string;
  updated_at: string;
}

class ContentCalendarApiService {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  private async callContentCalendarFunction(path: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/content-calendar${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Content Calendar API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Delete all content for a brand
   */
  async clearAllContentForBrand(brandId: string): Promise<{ success: boolean }> {
    return this.callContentCalendarFunction(`/clear/${brandId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get content items for a brand
   */
  async getContentItems(brandId: string): Promise<ContentCalendarItem[]> {
    return this.callContentCalendarFunction(`/brand/${brandId}`);
  }

  /**
   * Create content item
   */
  async createContentItem(item: Omit<ContentCalendarItem, 'id' | 'created_at' | 'updated_at'>): Promise<ContentCalendarItem> {
    return this.callContentCalendarFunction('', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  /**
   * Update content item
   */
  async updateContentItem(id: string, updates: Partial<ContentCalendarItem>): Promise<ContentCalendarItem> {
    return this.callContentCalendarFunction(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete content item
   */
  async deleteContentItem(id: string): Promise<{ success: boolean }> {
    return this.callContentCalendarFunction(`/${id}`, {
      method: 'DELETE',
    });
  }
}

export const contentCalendarApiService = new ContentCalendarApiService();