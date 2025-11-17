/**
 * Instagram Shopping Service
 *
 * Handles Instagram Shopping features: product catalogs, product tagging, shop setup.
 * Uses Facebook Graph API because Instagram doesn't have its own API for shopping.
 * Because Mark Zuckerberg thought "one API to rule them all" was a good idea.
 *
 * @see https://developers.facebook.com/docs/instagram-api/guides/shopping
 */

import { supabase } from '../../lib/supabase';

export interface InstagramShoppingConfig {
  appId: string;
  appSecret: string;
  accessToken?: string;
}

export interface InstagramShopSetup {
  user_id: string;
  instagram_business_account_id: string;
  catalog_id: string;
  shop_status: 'pending' | 'approved' | 'rejected' | 'disabled';
  review_status?: {
    status: string;
    reasons?: string[];
  };
  connected_at: Date;
  last_synced: Date;
}

export interface ProductCatalog {
  id: string;
  name: string;
  business_id: string;
  vertical: 'commerce' | 'home_listings' | 'media' | 'travel' | 'vehicle';
  product_count: number;
  created_at: Date;
}

export interface CatalogProduct {
  id: string;
  catalog_id: string;
  retailer_id: string; // Your internal product ID
  name: string;
  description: string;
  price: number;
  currency: string;
  url: string;
  image_url: string;
  brand?: string;
  availability: 'in stock' | 'out of stock' | 'preorder';
  condition: 'new' | 'refurbished' | 'used';
  category?: string;
  inventory?: number;
  sale_price?: number;
  sale_price_start_date?: Date;
  sale_price_end_date?: Date;
}

export interface ShoppablePost {
  post_id: string;
  product_tags: Array<{
    product_id: string;
    x: number; // 0-1, position on image
    y: number; // 0-1, position on image
  }>;
}

export class InstagramShoppingService {
  private readonly GRAPH_API_VERSION = 'v18.0';
  private readonly BASE_URL = 'https://graph.facebook.com';
  private config: InstagramShoppingConfig;

  constructor(config?: Partial<InstagramShoppingConfig>) {
    this.config = {
      appId: process.env.VITE_FACEBOOK_APP_ID || '',
      appSecret: process.env.VITE_FACEBOOK_APP_SECRET || '',
      accessToken: config?.accessToken,
    };
  }

  /**
   * Step 1: Get Instagram Business Account (requires Facebook Page connection)
   */
  async getInstagramBusinessAccount(
    facebookPageId: string,
    accessToken: string
  ): Promise<string | null> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${facebookPageId}?fields=instagram_business_account&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Error fetching IG business account:', data.error);
        return null;
      }

      return data.instagram_business_account?.id || null;
    } catch (error) {
      console.error('Error getting Instagram business account:', error);
      return null;
    }
  }

  /**
   * Step 2: Create or get product catalog
   */
  async createProductCatalog(
    businessId: string,
    catalogName: string,
    accessToken: string
  ): Promise<ProductCatalog> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${businessId}/owned_product_catalogs`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: catalogName,
          vertical: 'commerce',
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to create catalog: ${data.error.message}`);
      }

      return {
        id: data.id,
        name: catalogName,
        business_id: businessId,
        vertical: 'commerce',
        product_count: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error('Error creating product catalog:', error);
      throw error;
    }
  }

  /**
   * Get existing product catalogs
   */
  async getProductCatalogs(
    businessId: string,
    accessToken: string
  ): Promise<ProductCatalog[]> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${businessId}/owned_product_catalogs?fields=id,name,vertical,product_count&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to fetch catalogs: ${data.error.message}`);
      }

      return (data.data || []).map((catalog: any) => ({
        id: catalog.id,
        name: catalog.name,
        business_id: businessId,
        vertical: catalog.vertical,
        product_count: catalog.product_count || 0,
        created_at: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching product catalogs:', error);
      throw error;
    }
  }

  /**
   * Step 3: Add product to catalog
   */
  async addProductToCatalog(
    catalogId: string,
    product: CatalogProduct,
    accessToken: string
  ): Promise<string> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${catalogId}/products`;

      const productData = {
        retailer_id: product.retailer_id,
        name: product.name,
        description: product.description,
        price: Math.round(product.price * 100), // Convert to cents
        currency: product.currency,
        url: product.url,
        image_url: product.image_url,
        brand: product.brand,
        availability: product.availability,
        condition: product.condition,
        category: product.category,
        inventory: product.inventory,
        access_token: accessToken,
      };

      // Add sale price if available
      if (product.sale_price) {
        (productData as any).sale_price = Math.round(product.sale_price * 100);
        if (product.sale_price_start_date) {
          (productData as any).sale_price_effective_date = `${product.sale_price_start_date.toISOString().split('T')[0]}/${product.sale_price_end_date?.toISOString().split('T')[0]}`;
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to add product: ${data.error.message}`);
      }

      return data.id;
    } catch (error) {
      console.error('Error adding product to catalog:', error);
      throw error;
    }
  }

  /**
   * Batch add products to catalog (more efficient)
   */
  async batchAddProducts(
    catalogId: string,
    products: CatalogProduct[],
    accessToken: string
  ): Promise<{ success: number; failed: number }> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${catalogId}/batch`;

      const requests = products.map((product, index) => ({
        method: 'CREATE',
        retailer_id: product.retailer_id,
        data: {
          name: product.name,
          description: product.description,
          price: Math.round(product.price * 100),
          currency: product.currency,
          url: product.url,
          image_url: product.image_url,
          brand: product.brand,
          availability: product.availability,
          condition: product.condition,
          category: product.category,
          inventory: product.inventory,
        },
      }));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          requests: JSON.stringify(requests),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Batch add failed: ${data.error.message}`);
      }

      // Parse results
      const handles = data.handles || [];
      const success = handles.filter((h: any) => !h.error).length;
      const failed = handles.filter((h: any) => h.error).length;

      return { success, failed };
    } catch (error) {
      console.error('Error batch adding products:', error);
      throw error;
    }
  }

  /**
   * Update product in catalog
   */
  async updateProduct(
    catalogId: string,
    productId: string,
    updates: Partial<CatalogProduct>,
    accessToken: string
  ): Promise<void> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${catalogId}/products`;

      const updateData: any = {
        retailer_id: updates.retailer_id,
        access_token: accessToken,
      };

      // Only include fields that are being updated
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.price) updateData.price = Math.round(updates.price * 100);
      if (updates.availability) updateData.availability = updates.availability;
      if (updates.inventory !== undefined) updateData.inventory = updates.inventory;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to update product: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete product from catalog
   */
  async deleteProduct(
    catalogId: string,
    retailerId: string,
    accessToken: string
  ): Promise<void> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${catalogId}/products`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          retailer_id: retailerId,
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to delete product: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Step 4: Enable shopping on Instagram account
   */
  async enableInstagramShopping(
    instagramBusinessAccountId: string,
    catalogId: string,
    accessToken: string
  ): Promise<void> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${instagramBusinessAccountId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopping_product_tag_eligibility: true,
          catalog_id: catalogId,
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to enable shopping: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error enabling Instagram shopping:', error);
      throw error;
    }
  }

  /**
   * Check Instagram Shopping eligibility
   */
  async checkShoppingEligibility(
    instagramBusinessAccountId: string,
    accessToken: string
  ): Promise<{
    eligible: boolean;
    review_status?: string;
    reasons?: string[];
  }> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${instagramBusinessAccountId}?fields=shopping_review_status&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to check eligibility: ${data.error.message}`);
      }

      const reviewStatus = data.shopping_review_status || {};

      return {
        eligible: reviewStatus.status === 'approved',
        review_status: reviewStatus.status,
        reasons: reviewStatus.reasons || [],
      };
    } catch (error) {
      console.error('Error checking shopping eligibility:', error);
      throw error;
    }
  }

  /**
   * Tag products in Instagram post (AFTER post is created)
   */
  async tagProductsInPost(
    mediaId: string,
    productTags: ShoppablePost['product_tags'],
    accessToken: string
  ): Promise<void> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${mediaId}/product_tags`;

      const tags = productTags.map(tag => ({
        product_id: tag.product_id,
        x: tag.x,
        y: tag.y,
      }));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updated_tags: JSON.stringify(tags),
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to tag products: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error tagging products in post:', error);
      throw error;
    }
  }

  /**
   * Get product tags from a post
   */
  async getProductTags(mediaId: string, accessToken: string): Promise<ShoppablePost['product_tags']> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${mediaId}/product_tags?access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to get product tags: ${data.error.message}`);
      }

      return (data.data || []).map((tag: any) => ({
        product_id: tag.product_id,
        x: tag.x,
        y: tag.y,
      }));
    } catch (error) {
      console.error('Error getting product tags:', error);
      throw error;
    }
  }

  /**
   * Sync products from internal database to Instagram catalog
   */
  async syncProductsFromDatabase(
    userId: string,
    catalogId: string,
    accessToken: string
  ): Promise<{ synced: number; failed: number }> {
    try {
      // Get products from database
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      if (!products || products.length === 0) {
        return { synced: 0, failed: 0 };
      }

      // Convert to catalog products
      const catalogProducts: CatalogProduct[] = products.map((product: any) => ({
        id: product.id,
        catalog_id: catalogId,
        retailer_id: product.id, // Use our internal ID
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price) || 0,
        currency: 'USD', // TODO: Get from user settings
        url: product.url || '',
        image_url: product.image_url || '',
        brand: product.brand,
        availability: product.inventory > 0 ? 'in stock' : 'out of stock',
        condition: 'new',
        category: product.category,
        inventory: product.inventory,
        sale_price: product.sale_price ? parseFloat(product.sale_price) : undefined,
      }));

      // Batch add to catalog
      const result = await this.batchAddProducts(catalogId, catalogProducts, accessToken);

      // Update sync status in database
      await supabase
        .from('instagram_shop_setup')
        .update({
          last_synced: new Date().toISOString(),
          product_count: result.success,
        })
        .eq('user_id', userId);

      return result;
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  }

  /**
   * Save Instagram Shop setup to database
   */
  async saveShopSetup(
    userId: string,
    instagramBusinessAccountId: string,
    catalogId: string,
    accessToken: string
  ): Promise<InstagramShopSetup> {
    try {
      // Check eligibility
      const eligibility = await this.checkShoppingEligibility(
        instagramBusinessAccountId,
        accessToken
      );

      const { data, error } = await supabase
        .from('instagram_shop_setup')
        .upsert({
          user_id: userId,
          instagram_business_account_id: instagramBusinessAccountId,
          catalog_id: catalogId,
          shop_status: eligibility.eligible ? 'approved' : 'pending',
          review_status: eligibility,
          connected_at: new Date().toISOString(),
          last_synced: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save shop setup: ${error.message}`);
      }

      return data as InstagramShopSetup;
    } catch (error) {
      console.error('Error saving shop setup:', error);
      throw error;
    }
  }

  /**
   * Get shop setup for user
   */
  async getShopSetup(userId: string): Promise<InstagramShopSetup | null> {
    try {
      const { data, error } = await supabase
        .from('instagram_shop_setup')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as InstagramShopSetup;
    } catch (error) {
      console.error('Error getting shop setup:', error);
      return null;
    }
  }
}

// Singleton
let instagramShoppingInstance: InstagramShoppingService | null = null;

export function getInstagramShoppingService(): InstagramShoppingService {
  if (!instagramShoppingInstance) {
    instagramShoppingInstance = new InstagramShoppingService();
  }
  return instagramShoppingInstance;
}

export default InstagramShoppingService;
