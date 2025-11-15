/**
 * API Configuration Manager
 * Handles CRUD operations for API configurations, encryption, and validation
 */

import { supabase, isDemoMode } from '@/lib/supabase';

export interface ApiConfiguration {
  id: string;
  brand_id: string;
  provider: string;
  api_name: string;
  api_key_encrypted?: string;
  api_secret_encrypted?: string;
  endpoint_url?: string;
  config?: Record<string, any>;
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  monthly_budget_limit?: number;
  cost_per_request?: number;
  cost_per_1k_tokens?: number;
  cost_calculation_method?: 'per_request' | 'per_token' | 'tiered' | 'custom';
  is_active: boolean;
  is_test_mode: boolean;
  last_used_at?: string;
  total_requests: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface CreateApiConfigInput {
  brand_id: string;
  provider: string;
  api_name: string;
  api_key?: string; // Plain text - will be encrypted
  api_secret?: string; // Plain text - will be encrypted
  endpoint_url?: string;
  config?: Record<string, any>;
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  monthly_budget_limit?: number;
  cost_per_request?: number;
  cost_per_1k_tokens?: number;
  cost_calculation_method?: 'per_request' | 'per_token' | 'tiered' | 'custom';
  is_active?: boolean;
  is_test_mode?: boolean;
}

export interface UpdateApiConfigInput {
  provider?: string;
  api_name?: string;
  api_key?: string;
  api_secret?: string;
  endpoint_url?: string;
  config?: Record<string, any>;
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  monthly_budget_limit?: number;
  cost_per_request?: number;
  cost_per_1k_tokens?: number;
  cost_calculation_method?: 'per_request' | 'per_token' | 'tiered' | 'custom';
  is_active?: boolean;
  is_test_mode?: boolean;
}

/**
 * Simple encryption helper (for demo purposes - use proper encryption in production)
 * In production, this should use a proper encryption library and key management
 */
function encryptApiKey(key: string): string {
  if (isDemoMode) return `encrypted_${key}`;

  // TODO: Implement proper encryption (e.g., using Web Crypto API or library)
  // For now, using simple base64 encoding as placeholder
  return btoa(key);
}

/**
 * Simple decryption helper (for demo purposes - use proper decryption in production)
 */
function decryptApiKey(encryptedKey: string): string {
  if (isDemoMode) return encryptedKey.replace('encrypted_', '');

  // TODO: Implement proper decryption
  try {
    return atob(encryptedKey);
  } catch {
    return encryptedKey;
  }
}

/**
 * Validate API endpoint URL
 */
function validateEndpoint(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate cost for a given usage
 */
export function calculateCost(
  config: ApiConfiguration,
  usage: { requests?: number; tokens?: number }
): number {
  if (config.cost_calculation_method === 'per_request' && usage.requests) {
    return (config.cost_per_request || 0) * usage.requests;
  }

  if (config.cost_calculation_method === 'per_token' && usage.tokens) {
    return ((config.cost_per_1k_tokens || 0) * usage.tokens) / 1000;
  }

  return 0;
}

/**
 * API Configuration Manager Service
 */
export const ApiConfigManager = {
  /**
   * Get all API configurations for a brand
   */
  async getAllConfigs(brandId: string): Promise<ApiConfiguration[]> {
    if (isDemoMode) {
      // Return mock data in demo mode
      return [
        {
          id: 'demo-1',
          brand_id: brandId,
          provider: 'openrouter',
          api_name: 'Claude 3.5 Sonnet',
          is_active: true,
          is_test_mode: false,
          total_requests: 1250,
          total_cost: 42.50,
          cost_per_1k_tokens: 0.003,
          cost_calculation_method: 'per_token',
          monthly_budget_limit: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          brand_id: brandId,
          provider: 'facebook',
          api_name: 'Facebook Graph API',
          is_active: true,
          is_test_mode: false,
          total_requests: 850,
          total_cost: 0,
          cost_calculation_method: 'per_request',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }

    const { data, error } = await supabase
      .from('api_configurations')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single API configuration by ID
   */
  async getConfigById(id: string): Promise<ApiConfiguration | null> {
    if (isDemoMode) {
      const configs = await this.getAllConfigs('demo-brand');
      return configs.find(c => c.id === id) || null;
    }

    const { data, error } = await supabase
      .from('api_configurations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  },

  /**
   * Get active configurations by provider
   */
  async getConfigsByProvider(
    brandId: string,
    provider: string
  ): Promise<ApiConfiguration[]> {
    if (isDemoMode) {
      const configs = await this.getAllConfigs(brandId);
      return configs.filter(c => c.provider === provider && c.is_active);
    }

    const { data, error } = await supabase
      .from('api_configurations')
      .select('*')
      .eq('brand_id', brandId)
      .eq('provider', provider)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new API configuration
   */
  async createConfig(input: CreateApiConfigInput): Promise<ApiConfiguration> {
    // Validate endpoint if provided
    if (input.endpoint_url && !validateEndpoint(input.endpoint_url)) {
      throw new Error('Invalid endpoint URL');
    }

    if (isDemoMode) {
      return {
        id: `demo-${Date.now()}`,
        brand_id: input.brand_id,
        provider: input.provider,
        api_name: input.api_name,
        endpoint_url: input.endpoint_url,
        config: input.config,
        rate_limit_per_minute: input.rate_limit_per_minute,
        rate_limit_per_day: input.rate_limit_per_day,
        monthly_budget_limit: input.monthly_budget_limit,
        cost_per_request: input.cost_per_request,
        cost_per_1k_tokens: input.cost_per_1k_tokens,
        cost_calculation_method: input.cost_calculation_method || 'per_request',
        is_active: input.is_active ?? true,
        is_test_mode: input.is_test_mode ?? false,
        total_requests: 0,
        total_cost: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Encrypt sensitive data
    const encryptedData: any = {
      brand_id: input.brand_id,
      provider: input.provider,
      api_name: input.api_name,
      endpoint_url: input.endpoint_url,
      config: input.config,
      rate_limit_per_minute: input.rate_limit_per_minute,
      rate_limit_per_day: input.rate_limit_per_day,
      monthly_budget_limit: input.monthly_budget_limit,
      cost_per_request: input.cost_per_request,
      cost_per_1k_tokens: input.cost_per_1k_tokens,
      cost_calculation_method: input.cost_calculation_method || 'per_request',
      is_active: input.is_active ?? true,
      is_test_mode: input.is_test_mode ?? false,
    };

    if (input.api_key) {
      encryptedData.api_key_encrypted = encryptApiKey(input.api_key);
    }

    if (input.api_secret) {
      encryptedData.api_secret_encrypted = encryptApiKey(input.api_secret);
    }

    const { data, error } = await supabase
      .from('api_configurations')
      .insert(encryptedData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an API configuration
   */
  async updateConfig(
    id: string,
    updates: UpdateApiConfigInput
  ): Promise<ApiConfiguration> {
    // Validate endpoint if provided
    if (updates.endpoint_url && !validateEndpoint(updates.endpoint_url)) {
      throw new Error('Invalid endpoint URL');
    }

    if (isDemoMode) {
      const existing = await this.getConfigById(id);
      if (!existing) throw new Error('Configuration not found');

      return {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };
    }

    const updateData: any = { ...updates };

    // Encrypt API keys if provided
    if (updates.api_key) {
      updateData.api_key_encrypted = encryptApiKey(updates.api_key);
      delete updateData.api_key;
    }

    if (updates.api_secret) {
      updateData.api_secret_encrypted = encryptApiKey(updates.api_secret);
      delete updateData.api_secret;
    }

    const { data, error } = await supabase
      .from('api_configurations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete an API configuration
   */
  async deleteConfig(id: string): Promise<void> {
    if (isDemoMode) {
      return;
    }

    const { error } = await supabase
      .from('api_configurations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: string): Promise<ApiConfiguration> {
    const config = await this.getConfigById(id);
    if (!config) throw new Error('Configuration not found');

    return this.updateConfig(id, { is_active: !config.is_active });
  },

  /**
   * Update usage statistics
   */
  async updateUsageStats(
    id: string,
    newRequests: number,
    newCost: number
  ): Promise<void> {
    if (isDemoMode) return;

    const config = await this.getConfigById(id);
    if (!config) throw new Error('Configuration not found');

    await supabase
      .from('api_configurations')
      .update({
        total_requests: (config.total_requests || 0) + newRequests,
        total_cost: (config.total_cost || 0) + newCost,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', id);
  },

  /**
   * Get decrypted API key (use with caution)
   */
  async getDecryptedKey(id: string): Promise<string | null> {
    const config = await this.getConfigById(id);
    if (!config || !config.api_key_encrypted) return null;

    return decryptApiKey(config.api_key_encrypted);
  },

  /**
   * Check if budget limit is exceeded
   */
  async checkBudgetLimit(id: string): Promise<{
    exceeded: boolean;
    used: number;
    limit: number;
    percentage: number;
  }> {
    const config = await this.getConfigById(id);
    if (!config || !config.monthly_budget_limit) {
      return { exceeded: false, used: 0, limit: 0, percentage: 0 };
    }

    const used = config.total_cost || 0;
    const limit = config.monthly_budget_limit;
    const percentage = (used / limit) * 100;

    return {
      exceeded: used >= limit,
      used,
      limit,
      percentage: Math.min(percentage, 100),
    };
  },
};
