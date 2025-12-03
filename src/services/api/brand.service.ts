// PRD Feature: GOVERNANCE-COMPLIANCE
/**
 * Brand API Service
 *
 * Frontend service for brand operations using edge functions
 * Replaces direct Supabase calls to comply with governance
 */

import { supabase } from '@/lib/supabase';

export interface Brand {
  id: string;
  user_id: string;
  name: string;
  logo_url?: string | null;
  website_url?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandUpdate {
  name?: string;
  logo_url?: string | null;
  website_url?: string;
  industry?: string;
}

export interface BrandCreate {
  name: string;
  logo_url?: string | null;
  website_url?: string;
  industry?: string;
}

class BrandApiService {
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

  private async callBrandFunction(path: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/brands${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brand API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get all brands for current user
   */
  async getBrands(): Promise<Brand[]> {
    return this.callBrandFunction('');
  }

  /**
   * Get specific brand by ID
   */
  async getBrand(id: string): Promise<Brand> {
    return this.callBrandFunction(`/${id}`);
  }

  /**
   * Update brand
   */
  async updateBrand(id: string, updates: BrandUpdate): Promise<Brand> {
    return this.callBrandFunction(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Create new brand
   */
  async createBrand(brand: BrandCreate): Promise<Brand> {
    return this.callBrandFunction('', {
      method: 'POST',
      body: JSON.stringify(brand),
    });
  }

  /**
   * Delete brand
   */
  async deleteBrand(id: string): Promise<{ success: boolean }> {
    return this.callBrandFunction(`/${id}`, {
      method: 'DELETE',
    });
  }
}

export const brandApiService = new BrandApiService();