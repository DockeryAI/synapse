/**
 * Facebook Shop Service
 *
 * Handles Facebook Shop features: storefront, product catalog, marketplace integration.
 * Shares product catalog with Instagram Shopping (unified catalog).
 * Because Facebook wants to be everywhere, including your nightmares.
 *
 * @see https://developers.facebook.com/docs/commerce-platform
 */

import { supabase } from '../../lib/supabase';
import type { CatalogProduct, ProductCatalog } from './InstagramShoppingService';

export interface FacebookShopConfig {
  appId: string;
  appSecret: string;
  accessToken?: string;
}

export interface FacebookShopSetup {
  user_id: string;
  facebook_page_id: string;
  catalog_id: string;
  shop_status: 'pending' | 'active' | 'rejected' | 'disabled';
  commerce_account_id?: string;
  storefront_url?: string;
  marketplace_enabled: boolean;
  checkout_enabled: boolean;
  connected_at: Date;
  last_synced: Date;
}

export interface Storefront {
  id: string;
  page_id: string;
  name: string;
  description?: string;
  domain?: string;
  status: 'active' | 'inactive';
  theme?: {
    primary_color?: string;
    button_color?: string;
  };
}

export interface ShopPost {
  page_id: string;
  message: string;
  link?: string;
  product_tags?: string[]; // Product IDs to tag
  call_to_action?: {
    type: 'SHOP_NOW' | 'LEARN_MORE' | 'BOOK_NOW' | 'SIGN_UP';
    value?: {
      link?: string;
    };
  };
}

export class FacebookShopService {
  private readonly GRAPH_API_VERSION = 'v18.0';
  private readonly BASE_URL = 'https://graph.facebook.com';
  private config: FacebookShopConfig;

  constructor(config?: Partial<FacebookShopConfig>) {
    this.config = {
      appId: process.env.VITE_FACEBOOK_APP_ID || '',
      appSecret: process.env.VITE_FACEBOOK_APP_SECRET || '',
      accessToken: config?.accessToken,
    };
  }

  /**
   * Create Facebook Shop on a Page
   */
  async createShop(
    pageId: string,
    catalogId: string,
    accessToken: string
  ): Promise<Storefront> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${pageId}/commerce_merchant_settings`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          catalog_id: catalogId,
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to create shop: ${data.error.message}`);
      }

      return {
        id: data.id,
        page_id: pageId,
        name: data.name || 'Shop',
        status: 'active',
      };
    } catch (error) {
      console.error('Error creating Facebook shop:', error);
      throw error;
    }
  }

  /**
   * Get Shop settings for a Page
   */
  async getShopSettings(pageId: string, accessToken: string): Promise<any> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${pageId}/commerce_merchant_settings?fields=id,name,merchant_page,commerce_store,checkout_url_to_use,has_discount_code,has_onsite_intent&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to get shop settings: ${data.error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting shop settings:', error);
      throw error;
    }
  }

  /**
   * Update Shop settings
   */
  async updateShopSettings(
    merchantSettingsId: string,
    settings: {
      name?: string;
      checkout_enabled?: boolean;
    },
    accessToken: string
  ): Promise<void> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${merchantSettingsId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to update shop settings: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error updating shop settings:', error);
      throw error;
    }
  }

  /**
   * Create a shoppable post on Facebook Page
   */
  async createShoppablePost(
    post: ShopPost,
    accessToken: string
  ): Promise<string> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${post.page_id}/feed`;

      const postData: any = {
        message: post.message,
        access_token: accessToken,
      };

      // Add link if provided
      if (post.link) {
        postData.link = post.link;
      }

      // Add call to action
      if (post.call_to_action) {
        postData.call_to_action = JSON.stringify({
          type: post.call_to_action.type,
          value: post.call_to_action.value || {},
        });
      }

      // Add product tags
      if (post.product_tags && post.product_tags.length > 0) {
        postData.attached_media = JSON.stringify(
          post.product_tags.map(productId => ({
            product_id: productId,
          }))
        );
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to create post: ${data.error.message}`);
      }

      return data.id;
    } catch (error) {
      console.error('Error creating shoppable post:', error);
      throw error;
    }
  }

  /**
   * Add product tags to existing post
   */
  async addProductTagsToPost(
    postId: string,
    productIds: string[],
    accessToken: string
  ): Promise<void> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${postId}/product_tags`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_ids: JSON.stringify(productIds),
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to add product tags: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error adding product tags to post:', error);
      throw error;
    }
  }

  /**
   * Enable Facebook Marketplace for shop
   */
  async enableMarketplace(
    commerceMerchantSettingsId: string,
    accessToken: string
  ): Promise<void> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${commerceMerchantSettingsId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketplace_enabled: true,
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to enable marketplace: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error enabling marketplace:', error);
      throw error;
    }
  }

  /**
   * Get storefront URL for shop
   */
  async getStorefrontUrl(pageId: string, accessToken: string): Promise<string | null> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${pageId}?fields=commerce_store_url&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to get storefront URL: ${data.error.message}`);
      }

      return data.commerce_store_url || null;
    } catch (error) {
      console.error('Error getting storefront URL:', error);
      return null;
    }
  }

  /**
   * Create direct checkout link for product
   */
  createCheckoutLink(pageId: string, productId: string): string {
    return `https://www.facebook.com/commerce/products/${productId}/?ref=page_shop_tab&referral_code=${pageId}`;
  }

  /**
   * Generate shop post templates
   */
  generateShopPostTemplates(
    businessName: string,
    products: CatalogProduct[]
  ): ShopPost[] {
    const templates: ShopPost[] = [];

    // Single product showcase
    if (products.length > 0) {
      const product = products[0];
      templates.push({
        page_id: '', // Will be filled in by caller
        message: `🛍️ Check out our ${product.name}!\n\n${product.description}\n\n💰 Only $${product.price}${product.sale_price ? ` (was $${product.sale_price})` : ''}\n\n👉 Shop now and get it delivered to your door!`,
        product_tags: [product.id],
        call_to_action: {
          type: 'SHOP_NOW',
        },
      });
    }

    // Multiple products showcase
    if (products.length >= 3) {
      const productNames = products.slice(0, 3).map(p => `✨ ${p.name}`).join('\n');
      templates.push({
        page_id: '',
        message: `🎉 New arrivals at ${businessName}!\n\n${productNames}\n\nAnd much more! Visit our shop to see the full collection. 🛒`,
        product_tags: products.slice(0, 3).map(p => p.id),
        call_to_action: {
          type: 'SHOP_NOW',
        },
      });
    }

    // Sale announcement
    const saleProducts = products.filter(p => p.sale_price);
    if (saleProducts.length > 0) {
      templates.push({
        page_id: '',
        message: `🔥 SALE ALERT! 🔥\n\nHuge savings on selected items!\n\nDon't miss out - these deals won't last long! 🏃‍♂️💨\n\nShop now and save! 💰`,
        product_tags: saleProducts.slice(0, 5).map(p => p.id),
        call_to_action: {
          type: 'SHOP_NOW',
        },
      });
    }

    return templates;
  }

  /**
   * Save Facebook Shop setup to database
   */
  async saveShopSetup(
    userId: string,
    pageId: string,
    catalogId: string,
    commerceMerchantSettingsId?: string
  ): Promise<FacebookShopSetup> {
    try {
      const storefrontUrl = await this.getStorefrontUrl(
        pageId,
        this.config.accessToken || ''
      );

      const { data, error } = await supabase
        .from('facebook_shop_setup')
        .upsert({
          user_id: userId,
          facebook_page_id: pageId,
          catalog_id: catalogId,
          commerce_account_id: commerceMerchantSettingsId,
          shop_status: 'active',
          storefront_url: storefrontUrl,
          marketplace_enabled: false,
          checkout_enabled: false,
          connected_at: new Date().toISOString(),
          last_synced: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save shop setup: ${error.message}`);
      }

      return data as FacebookShopSetup;
    } catch (error) {
      console.error('Error saving shop setup:', error);
      throw error;
    }
  }

  /**
   * Get Facebook Shop setup for user
   */
  async getShopSetup(userId: string): Promise<FacebookShopSetup | null> {
    try {
      const { data, error } = await supabase
        .from('facebook_shop_setup')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as FacebookShopSetup;
    } catch (error) {
      console.error('Error getting shop setup:', error);
      return null;
    }
  }

  /**
   * Unified catalog sync (shares with Instagram)
   */
  async syncUnifiedCatalog(
    userId: string,
    catalogId: string,
    accessToken: string
  ): Promise<{ instagram: boolean; facebook: boolean }> {
    try {
      // Check if both platforms are connected
      const instagramSetup = await supabase
        .from('instagram_shop_setup')
        .select('*')
        .eq('user_id', userId)
        .single();

      const facebookSetup = await supabase
        .from('facebook_shop_setup')
        .select('*')
        .eq('user_id', userId)
        .single();

      return {
        instagram: !instagramSetup.error && instagramSetup.data?.catalog_id === catalogId,
        facebook: !facebookSetup.error && facebookSetup.data?.catalog_id === catalogId,
      };
    } catch (error) {
      console.error('Error checking unified catalog:', error);
      return { instagram: false, facebook: false };
    }
  }

  /**
   * Get catalog insights (views, clicks, etc.)
   */
  async getCatalogInsights(
    catalogId: string,
    accessToken: string,
    dateRange: { start: Date; end: Date }
  ): Promise<any> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${catalogId}/insights?metric=catalog_segment_impressions,catalog_segment_product_clicks&since=${dateRange.start.toISOString().split('T')[0]}&until=${dateRange.end.toISOString().split('T')[0]}&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Failed to get insights: ${data.error.message}`);
      }

      return data.data || [];
    } catch (error) {
      console.error('Error getting catalog insights:', error);
      throw error;
    }
  }

  /**
   * Get product insights
   */
  async getProductInsights(
    productId: string,
    accessToken: string
  ): Promise<{
    views: number;
    clicks: number;
    purchases: number;
  }> {
    try {
      const url = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${productId}/product_insights?metric=product_views,product_clicks,product_purchases&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Error getting product insights:', data.error);
        return { views: 0, clicks: 0, purchases: 0 };
      }

      const insights = data.data || [];
      return {
        views: insights.find((i: any) => i.name === 'product_views')?.values[0]?.value || 0,
        clicks: insights.find((i: any) => i.name === 'product_clicks')?.values[0]?.value || 0,
        purchases: insights.find((i: any) => i.name === 'product_purchases')?.values[0]?.value || 0,
      };
    } catch (error) {
      console.error('Error getting product insights:', error);
      return { views: 0, clicks: 0, purchases: 0 };
    }
  }

  /**
   * Disable shop
   */
  async disableShop(userId: string): Promise<void> {
    try {
      await supabase
        .from('facebook_shop_setup')
        .update({
          shop_status: 'disabled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error disabling shop:', error);
      throw error;
    }
  }
}

// Singleton
let facebookShopInstance: FacebookShopService | null = null;

export function getFacebookShopService(): FacebookShopService {
  if (!facebookShopInstance) {
    facebookShopInstance = new FacebookShopService();
  }
  return facebookShopInstance;
}

export default FacebookShopService;
