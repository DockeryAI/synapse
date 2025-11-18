/**
 * Product/Service Scanner Service
 *
 * Uses Claude AI to extract products and services from website content
 * Categorizes offerings by type, tier, and priority
 */

import type {
  Product,
  ProductScanResult,
  RawProductExtraction,
  ProductType,
  ProductTier,
  ProductCategory,
  BusinessService
} from '../../types/product.types';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class ProductScannerService {
  private supabase;

  constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  /**
   * Scan website content for products and services
   */
  async scanProducts(
    websiteContent: string,
    businessName: string,
    industry?: string
  ): Promise<ProductScanResult> {
    console.log('[ProductScanner] Starting product scan for:', businessName);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[ProductScanner] No Supabase configuration - returning empty results');
      return {
        products: [],
        primaryOffering: undefined,
        secondaryOfferings: [],
        relatedProducts: new Map(),
        confidence: 0,
        extractedAt: new Date()
      };
    }

    try {
      // Extract products using Claude AI
      const rawExtraction = await this.extractProductsWithAI(
        websiteContent,
        businessName,
        industry
      );

      // Process and categorize products
      const products = this.processRawExtraction(rawExtraction);

      // Identify primary vs secondary offerings
      const { primary, secondary } = this.categorizePrimarySecondary(products);

      // Group related products
      const relatedProducts = this.groupRelatedProducts(products);

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(products);

      console.log('[ProductScanner] Scan complete:');
      console.log('  - Total products:', products.length);
      console.log('  - Primary offering:', primary);
      console.log('  - Secondary offerings:', secondary.length);
      console.log('  - Overall confidence:', (confidence * 100).toFixed(0) + '%');

      return {
        products,
        primaryOffering: primary,
        secondaryOfferings: secondary,
        relatedProducts,
        confidence,
        extractedAt: new Date()
      };
    } catch (error) {
      console.error('[ProductScanner] Scan failed:', error);
      throw new Error(`Product scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract products using Claude AI via OpenRouter
   */
  private async extractProductsWithAI(
    websiteContent: string,
    businessName: string,
    industry?: string
  ): Promise<RawProductExtraction> {
    // Truncate content to avoid token limits
    const truncatedContent = websiteContent.slice(0, 20000);

    const industryContext = industry ? `\nIndustry: ${industry}` : '';

    const prompt = `You are a business analyst extracting the specific products and services a company offers from their website.

Business: ${businessName}${industryContext}
Website Content:
${truncatedContent}

TASK: Extract ALL products, services, and offerings mentioned on this website.

CRITICAL RULES:
1. Extract ONLY what they explicitly mention selling or offering
2. Be SPECIFIC - use their exact product/service names
3. DO NOT invent or assume products/services not mentioned
4. Include pricing if explicitly stated
5. Note if something is a product (physical) vs service (intangible)
6. Identify the PRIMARY/MAIN offering if clear
7. Extract any mentioned features, benefits, or details per product/service

EXAMPLES OF WHAT TO EXTRACT:
- Specific service packages (e.g., "Premium Car Detailing", "Basic Wash Package")
- Physical products (e.g., "Ceramic Coating Treatment", "Wax Products")
- Tiered offerings (e.g., "Starter Plan", "Professional Plan", "Enterprise Plan")
- Duration if mentioned (e.g., "30-minute session", "full-day workshop")
- Pricing if stated (e.g., "$99/month", "$500-$1000", "Starting at $50")

Return ONLY valid JSON (no markdown, no explanations):
{
  "products": [
    {
      "name": "exact product/service name",
      "description": "brief description if available",
      "isProduct": true/false,
      "isService": true/false,
      "pricing": "exact price if mentioned",
      "duration": "time duration if mentioned",
      "features": ["feature 1", "feature 2"],
      "isPrimary": true/false
    }
  ],
  "mainOffering": "primary product/service category if identifiable"
}`;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4096,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ProductScanner] OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const extractionText = data.choices[0].message.content;

    console.log('[ProductScanner] Raw AI response:', extractionText.substring(0, 200) + '...');

    // Parse JSON response
    const extraction: RawProductExtraction = JSON.parse(extractionText);

    console.log('[ProductScanner] Extracted', extraction.products?.length || 0, 'products/services');

    return extraction;
  }

  /**
   * Process raw extraction into structured Product objects
   */
  private processRawExtraction(raw: RawProductExtraction): Product[] {
    if (!raw.products || raw.products.length === 0) {
      return [];
    }

    return raw.products.map((item, index) => {
      // Determine type
      let type: ProductType = 'hybrid';
      if (item.isProduct && !item.isService) type = 'product';
      if (item.isService && !item.isProduct) type = 'service';

      // Determine tier from pricing or name
      const tier = this.detectTier(item.name, item.pricing, item.features);

      // Determine category (primary/secondary/addon)
      const category: ProductCategory = item.isPrimary ? 'primary' :
        (index < 3 ? 'secondary' : 'addon');

      // Parse duration
      const durationMinutes = this.parseDuration(item.duration);

      // Calculate confidence based on data completeness
      const confidence = this.calculateProductConfidence(item);

      return {
        name: item.name,
        description: item.description,
        type,
        tier,
        category,
        priceRange: item.pricing,
        durationMinutes,
        features: item.features || [],
        confidence
      };
    });
  }

  /**
   * Detect product tier from name, pricing, or features
   */
  private detectTier(
    name: string,
    pricing?: string,
    features?: string[]
  ): ProductTier | undefined {
    const lowerName = name.toLowerCase();
    const lowerPricing = pricing?.toLowerCase() || '';
    const featureCount = features?.length || 0;

    // Explicit tier keywords
    if (lowerName.includes('basic') || lowerName.includes('starter')) return 'basic';
    if (lowerName.includes('premium') || lowerName.includes('professional') || lowerName.includes('pro')) return 'premium';
    if (lowerName.includes('enterprise') || lowerName.includes('business') || lowerName.includes('ultimate')) return 'enterprise';
    if (lowerName.includes('custom') || lowerName.includes('bespoke')) return 'custom';

    // Infer from pricing
    if (lowerPricing) {
      const hasLowPrice = lowerPricing.includes('$49') || lowerPricing.includes('$99') || lowerPricing.includes('free');
      const hasHighPrice = lowerPricing.includes('$999') || lowerPricing.includes('$1,') || lowerPricing.includes('$2,');

      if (hasLowPrice) return 'basic';
      if (hasHighPrice) return 'enterprise';
      return 'premium';
    }

    // Infer from feature count
    if (featureCount > 10) return 'enterprise';
    if (featureCount > 5) return 'premium';
    if (featureCount > 0) return 'basic';

    return undefined;
  }

  /**
   * Parse duration string to minutes
   */
  private parseDuration(duration?: string): number | undefined {
    if (!duration) return undefined;

    const lower = duration.toLowerCase();

    // Hours
    const hourMatch = lower.match(/(\d+)\s*(hour|hr)/);
    if (hourMatch) {
      return parseInt(hourMatch[1]) * 60;
    }

    // Minutes
    const minMatch = lower.match(/(\d+)\s*(minute|min)/);
    if (minMatch) {
      return parseInt(minMatch[1]);
    }

    // Days
    const dayMatch = lower.match(/(\d+)\s*(day)/);
    if (dayMatch) {
      return parseInt(dayMatch[1]) * 24 * 60;
    }

    return undefined;
  }

  /**
   * Calculate confidence score for a single product
   */
  private calculateProductConfidence(item: any): number {
    let score = 0.5; // Base score

    // Has clear type
    if (item.isProduct !== undefined || item.isService !== undefined) score += 0.1;

    // Has description
    if (item.description && item.description.length > 10) score += 0.1;

    // Has pricing
    if (item.pricing) score += 0.15;

    // Has features
    if (item.features && item.features.length > 0) score += 0.1;
    if (item.features && item.features.length > 3) score += 0.05;

    // Is marked as primary
    if (item.isPrimary) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate overall scan confidence
   */
  private calculateOverallConfidence(products: Product[]): number {
    if (products.length === 0) return 0;

    const avgConfidence = products.reduce((sum, p) => sum + p.confidence, 0) / products.length;

    // Bonus for having multiple products
    let bonus = 0;
    if (products.length >= 3) bonus = 0.1;
    if (products.length >= 5) bonus = 0.15;

    return Math.min(avgConfidence + bonus, 1.0);
  }

  /**
   * Categorize products into primary and secondary
   */
  private categorizePrimarySecondary(products: Product[]): {
    primary?: string;
    secondary: string[];
  } {
    const primaryProducts = products.filter(p => p.category === 'primary');
    const secondaryProducts = products.filter(p => p.category === 'secondary');

    return {
      primary: primaryProducts[0]?.name,
      secondary: secondaryProducts.map(p => p.name)
    };
  }

  /**
   * Group related products (basic implementation)
   */
  private groupRelatedProducts(products: Product[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    // Group by tier
    const tiers: ProductTier[] = ['basic', 'premium', 'enterprise', 'custom'];
    tiers.forEach(tier => {
      const tierProducts = products.filter(p => p.tier === tier).map(p => p.name);
      if (tierProducts.length > 0) {
        groups.set(tier, tierProducts);
      }
    });

    return groups;
  }

  /**
   * Save products to database (business_services table)
   */
  async saveProducts(
    businessId: string,
    products: Product[]
  ): Promise<void> {
    if (!this.supabase) {
      console.warn('[ProductScanner] No Supabase client - skipping database save');
      return;
    }

    console.log('[ProductScanner] Saving', products.length, 'products for business', businessId);

    try {
      // Convert products to BusinessService records
      const services: Omit<BusinessService, 'id' | 'created_at' | 'updated_at'>[] = products.map(p => ({
        business_id: businessId,
        service_name: p.name,
        service_description: p.description || p.features?.join(', '),
        price_range: p.priceRange,
        duration_minutes: p.durationMinutes,
        is_featured: p.category === 'primary'
      }));

      // Delete existing services for this business
      const { error: deleteError } = await this.supabase
        .from('business_services')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) {
        console.error('[ProductScanner] Failed to delete existing services:', deleteError);
        throw deleteError;
      }

      // Insert new services
      const { error: insertError } = await this.supabase
        .from('business_services')
        .insert(services);

      if (insertError) {
        console.error('[ProductScanner] Failed to insert services:', insertError);
        throw insertError;
      }

      console.log('[ProductScanner] Successfully saved', services.length, 'services');
    } catch (error) {
      console.error('[ProductScanner] Database save failed:', error);
      throw new Error(`Failed to save products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load products from database for a business
   */
  async loadProducts(businessId: string): Promise<Product[]> {
    if (!this.supabase) {
      console.warn('[ProductScanner] No Supabase client - returning empty array');
      return [];
    }

    console.log('[ProductScanner] Loading products for business', businessId);

    try {
      const { data, error } = await this.supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .order('is_featured', { ascending: false });

      if (error) {
        console.error('[ProductScanner] Failed to load services:', error);
        throw error;
      }

      // Convert BusinessService records to Product objects
      const products: Product[] = (data || []).map((service: BusinessService) => ({
        name: service.service_name,
        description: service.service_description,
        type: 'service' as ProductType, // Default to service
        category: service.is_featured ? 'primary' : 'secondary',
        priceRange: service.price_range,
        durationMinutes: service.duration_minutes,
        features: service.service_description?.split(', ') || [],
        confidence: 0.8 // High confidence for saved products
      }));

      console.log('[ProductScanner] Loaded', products.length, 'products');
      return products;
    } catch (error) {
      console.error('[ProductScanner] Database load failed:', error);
      throw new Error(`Failed to load products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const productScannerService = new ProductScannerService();
