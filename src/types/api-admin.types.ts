// Type definitions for API Configuration and Billing Management

export type ApiProvider =
  | 'openrouter'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'google'
  | 'other';

export type CostCalculationMethod =
  | 'per_request'
  | 'per_token'
  | 'tiered'
  | 'custom';

export interface ApiConfig {
  id: string;
  brand_id: string;
  provider: ApiProvider;
  api_name: string;
  api_key: string;
  api_secret?: string;
  endpoint_url?: string;
  rate_limits: {
    per_minute: number;
    per_day: number;
  };
  monthly_budget_limit: number;
  cost_structure: {
    calculation_method: CostCalculationMethod;
    cost_per_request?: number;
    cost_per_1k_tokens?: number;
    tiered_pricing?: Array<{
      min_requests: number;
      max_requests: number;
      cost_per_request: number;
    }>;
  };
  is_active: boolean;
  is_test_mode: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiUsageRecord {
  id: string;
  api_config_id: string;
  brand_id: string;
  feature_name: string;
  feature_category: string;
  request_count: number;
  token_count?: number;
  total_cost: number;
  request_metadata?: Record<string, any>;
  created_at: string;
}

export interface ApiBillingPeriod {
  id: string;
  brand_id: string;
  period_start: string;
  period_end: string;
  total_cost: number;
  total_requests: number;
  total_tokens?: number;
  budget_limit: number;
  is_current: boolean;
  created_at: string;
}

export interface ApiCostByFeature {
  feature_name: string;
  feature_category: string;
  total_uses: number;
  total_cost: number;
  average_cost_per_use: number;
  api_breakdown: Array<{
    api_name: string;
    provider: ApiProvider;
    uses: number;
    cost: number;
  }>;
  percentage_of_total: number;
  trend_percentage?: number;
}

export interface ApiCostByApi {
  api_config_id: string;
  api_name: string;
  provider: ApiProvider;
  total_requests: number;
  total_cost: number;
  total_tokens?: number;
  average_cost_per_request: number;
  percentage_of_total: number;
  trend_percentage?: number;
}

export interface ApiUsageDataPoint {
  date: string;
  cost: number;
  requests: number;
  tokens?: number;
  api_breakdown?: Array<{
    api_name: string;
    cost: number;
    requests: number;
  }>;
}

export interface ApiCostProjection {
  current_month_cost: number;
  days_elapsed: number;
  days_remaining: number;
  daily_average: number;
  projected_end_cost: number;
  budget_limit: number;
  will_exceed_budget: boolean;
  confidence_level: 'high' | 'medium' | 'low';
  recommendations: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ApiBillingStats {
  current_month_cost: number;
  total_requests_this_month: number;
  average_cost_per_day: number;
  projected_month_end_cost: number;
  top_expensive_apis: Array<{
    api_name: string;
    cost: number;
    percentage: number;
  }>;
  top_used_features: Array<{
    feature_name: string;
    uses: number;
    cost: number;
  }>;
  budget_utilization: number;
  cost_trend_percentage: number;
  requests_trend_percentage: number;
}
