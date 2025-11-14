-- API Billing Events Table
-- Tracks every API call with detailed cost information

CREATE TABLE IF NOT EXISTS api_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  api_config_id UUID REFERENCES api_configurations(id) ON DELETE SET NULL,

  -- Event Details
  provider VARCHAR(100) NOT NULL,
  api_name VARCHAR(100) NOT NULL,
  feature_name VARCHAR(100) NOT NULL, -- 'synapse', 'content_generation', 'marbs_assistant', etc.
  use_case VARCHAR(200), -- More specific use case description

  -- Request Details
  request_type VARCHAR(50), -- 'completion', 'embedding', 'image_generation', 'api_call', etc.
  model_used VARCHAR(100), -- 'claude-3.5-sonnet', 'gpt-4', etc.

  -- Usage Metrics
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_total INTEGER,
  request_count INTEGER DEFAULT 1,

  -- Cost Breakdown
  cost_input DECIMAL(10, 6),
  cost_output DECIMAL(10, 6),
  cost_fixed DECIMAL(10, 6),
  cost_total DECIMAL(10, 6) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Context
  user_id UUID,
  session_id VARCHAR(100),
  request_metadata JSONB DEFAULT '{}',

  -- Performance
  response_time_ms INTEGER,
  status VARCHAR(50), -- 'success', 'error', 'timeout', 'rate_limited'
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE api_billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand's billing events"
  ON api_billing_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert billing events"
  ON api_billing_events FOR INSERT
  WITH CHECK (true); -- Service role will insert these

-- Indexes for performance
CREATE INDEX idx_billing_events_brand ON api_billing_events(brand_id);
CREATE INDEX idx_billing_events_created ON api_billing_events(created_at DESC);
CREATE INDEX idx_billing_events_feature ON api_billing_events(feature_name);
CREATE INDEX idx_billing_events_provider ON api_billing_events(provider);
CREATE INDEX idx_billing_events_api_config ON api_billing_events(api_config_id);
CREATE INDEX idx_billing_events_brand_created ON api_billing_events(brand_id, created_at DESC);
CREATE INDEX idx_billing_events_brand_feature ON api_billing_events(brand_id, feature_name);

-- Composite index for common queries
CREATE INDEX idx_billing_events_analytics ON api_billing_events(
  brand_id,
  feature_name,
  created_at DESC
);

COMMENT ON TABLE api_billing_events IS 'Tracks every API call with detailed cost information for billing and analytics';
