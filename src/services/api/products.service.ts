// PRD Feature: GOVERNANCE-COMPLIANCE
/**
 * Products API Service
 *
 * Frontend service for product operations using edge functions
 * Replaces direct Supabase calls to comply with governance
 */

import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  status: string;
  is_featured: boolean;
  is_bestseller: boolean;
  created_at: string;
  updated_at: string;
}

class ProductsApiService {
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

  private async callProductsFunction(path: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/products${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Products API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get active products for a brand
   */
  async getActiveProducts(brandId: string): Promise<Product[]> {
    return this.callProductsFunction(`/brand/${brandId}/active`);
  }

  /**
   * Get all products for a brand
   */
  async getBrandProducts(brandId: string): Promise<Product[]> {
    return this.callProductsFunction(`/brand/${brandId}`);
  }

  /**
   * Create product
   */
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    return this.callProductsFunction('', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  /**
   * Update product
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.callProductsFunction(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.callProductsFunction(`/${id}`, {
      method: 'DELETE',
    });
  }
}

export const productsApiService = new ProductsApiService();