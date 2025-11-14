-- API Management and Configuration Tables
-- Stores API credentials, endpoints, and configuration

CREATE TABLE IF NOT EXISTS api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,

  -- API Details
  provider VARCHAR(100) NOT NULL, -- 'openrouter', 'facebook', 'google', etc.
  api_name VARCHAR(100) NOT NULL, -- 'Claude 3.5 Sonnet', 'Facebook Graph API', etc.
  api_key_encrypted TEXT, -- Encrypted API key
  api_secret_encrypted TEXT, -- Encrypted secret if needed

  -- Configuration
  endpoint_url TEXT,
  config JSONB DEFAULT '{}', -- Additional configuration

  -- Limits & Quotas
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  monthly_budget_limit DECIMAL(10, 2),

  -- Cost Information
  cost_per_request DECIMAL(10, 6),
  cost_per_1k_tokens DECIMAL(10, 6),
  cost_calculation_method VARCHAR(50), -- 'per_request', 'per_token', 'tiered', 'custom'

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_test_mode BOOLEAN DEFAULT false,

  -- Metadata
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(brand_id, provider, api_name)
);

-- RLS Policies
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand's API configs"
  ON api_configurations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their brand's API configs"
  ON api_configurations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their brand's API configs"
  ON api_configurations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their brand's API configs"
  ON api_configurations FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_api_configs_brand ON api_configurations(brand_id);
CREATE INDEX idx_api_configs_provider ON api_configurations(provider);
CREATE INDEX idx_api_configs_active ON api_configurations(is_active) WHERE is_active = true;

-- Updated at trigger
CREATE TRIGGER update_api_configurations_updated_at
  BEFORE UPDATE ON api_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
