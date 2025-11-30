/**
 * Product/Service Type Definitions
 *
 * Defines types for products and services extracted from business websites
 * Updated: 2025-11-29 - Added BrandProduct for normalized database storage
 */

export type ProductType = 'product' | 'service' | 'hybrid';
export type ProductTier = 'basic' | 'premium' | 'enterprise' | 'custom';
export type ProductCategory = 'primary' | 'secondary' | 'addon';
export type ProductPriority = 'primary' | 'secondary' | 'addon';
export type ProductSource = 'website' | 'manual' | 'rescan' | 'uvp';

/**
 * Extracted Product/Service
 */
export interface Product {
  name: string;
  description?: string;
  type: ProductType;
  tier?: ProductTier;
  category: ProductCategory;
  priceRange?: string;
  durationMinutes?: number;
  features?: string[];
  confidence: number; // 0-1 score
}

/**
 * Product Scanner Result
 */
export interface ProductScanResult {
  products: Product[];
  primaryOffering?: string; // Main product/service identified
  secondaryOfferings: string[];
  relatedProducts: Map<string, string[]>; // Grouped related products
  confidence: number; // Overall confidence score
  extractedAt: Date;
}

/**
 * Raw AI Extraction Result (from Claude)
 */
export interface RawProductExtraction {
  products: Array<{
    name: string;
    description?: string;
    isProduct?: boolean;
    isService?: boolean;
    pricing?: string;
    duration?: string;
    features?: string[];
    isPrimary?: boolean;
  }>;
  mainOffering?: string;
}

/**
 * Database record for business_services table (legacy)
 */
export interface BusinessService {
  id?: string;
  business_id: string;
  service_name: string;
  service_description?: string;
  price_range?: string;
  duration_minutes?: number;
  is_featured: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Brand Product - Normalized database storage
 * Maps to brand_products table
 */
export interface BrandProduct {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  category?: string;
  product_type?: ProductType;
  tier?: ProductTier;
  priority?: ProductPriority;
  price_range?: string;
  duration_minutes?: number;
  features?: string[];
  source: ProductSource;
  source_url?: string;
  source_excerpt?: string;
  confidence: number;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
  last_scanned_at?: string;
}

/**
 * Input for creating/updating a brand product
 */
export interface BrandProductInput {
  name: string;
  description?: string;
  category?: string;
  product_type?: ProductType;
  tier?: ProductTier;
  priority?: ProductPriority;
  price_range?: string;
  duration_minutes?: number;
  features?: string[];
  source?: ProductSource;
  source_url?: string;
  source_excerpt?: string;
  confidence?: number;
  is_confirmed?: boolean;
}
