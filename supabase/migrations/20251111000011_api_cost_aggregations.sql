-- API Cost Tracking and Aggregations
-- Pre-computed aggregations for faster analytics queries

-- Daily Cost Tracking by API
CREATE TABLE IF NOT EXISTS api_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  provider VARCHAR(100) NOT NULL,
  api_name VARCHAR(100) NOT NULL,

  -- Time Period
  date DATE NOT NULL,
  hour INTEGER, -- NULL for daily aggregation, 0-23 for hourly

  -- Aggregated Metrics
  total_requests INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Cost Breakdown
  cost_by_feature JSONB DEFAULT '{}', -- {feature_name: cost}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(brand_id, provider, api_name, date, hour)
);

-- Usage by Feature (for use case analysis like "Synapse costs")
CREATE TABLE IF NOT EXISTS api_usage_by_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  feature_name VARCHAR(100) NOT NULL, -- 'synapse', 'content_generation', etc.

  -- Time Period
  date DATE NOT NULL,

  -- Aggregated Data
  total_requests INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,

  -- API Breakdown (e.g., Synapse uses Claude + Perplexity + etc.)
  api_breakdown JSONB DEFAULT '{}', -- {api_name: {requests: N, cost: X}}

  -- Top Models Used
  models_used JSONB DEFAULT '[]', -- [{model: name, requests: N, cost: X}]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(brand_id, feature_name, date)
);

-- Monthly Summaries for Budget Tracking
CREATE TABLE IF NOT EXISTS api_monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,

  -- Time Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12

  -- Overall Metrics
  total_requests INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,

  -- Breakdowns
  cost_by_provider JSONB DEFAULT '{}', -- {provider: cost}
  cost_by_feature JSONB DEFAULT '{}', -- {feature: cost}
  cost_by_api JSONB DEFAULT '{}', -- {api_name: cost}

  -- Budget Tracking
  budget_limit DECIMAL(10, 2),
  budget_used_percentage DECIMAL(5, 2),
  projected_month_end_cost DECIMAL(10, 2),

  -- Top Consumers
  top_apis JSONB DEFAULT '[]', -- [{api: name, cost: X, percentage: Y}]
  top_features JSONB DEFAULT '[]', -- [{feature: name, cost: X, percentage: Y}]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(brand_id, year, month)
);

-- RLS Policies
ALTER TABLE api_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_by_feature ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_monthly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand's cost tracking"
  ON api_cost_tracking FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their brand's feature usage"
  ON api_usage_by_feature FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their brand's monthly summaries"
  ON api_monthly_summaries FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_cost_tracking_brand_date ON api_cost_tracking(brand_id, date DESC);
CREATE INDEX idx_feature_usage_brand_date ON api_usage_by_feature(brand_id, date DESC);
CREATE INDEX idx_monthly_summary_brand_period ON api_monthly_summaries(brand_id, year DESC, month DESC);

-- Updated at triggers
CREATE TRIGGER update_api_cost_tracking_updated_at
  BEFORE UPDATE ON api_cost_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_usage_by_feature_updated_at
  BEFORE UPDATE ON api_usage_by_feature
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_monthly_summaries_updated_at
  BEFORE UPDATE ON api_monthly_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Materialized view for real-time cost overview
CREATE MATERIALIZED VIEW api_cost_overview AS
SELECT
  brand_id,
  DATE_TRUNC('day', created_at) as date,
  feature_name,
  provider,
  COUNT(*) as request_count,
  SUM(cost_total) as total_cost,
  SUM(tokens_total) as total_tokens,
  AVG(response_time_ms) as avg_response_time_ms
FROM api_billing_events
WHERE status = 'success'
GROUP BY brand_id, DATE_TRUNC('day', created_at), feature_name, provider;

CREATE UNIQUE INDEX idx_cost_overview_unique ON api_cost_overview(brand_id, date, feature_name, provider);

COMMENT ON MATERIALIZED VIEW api_cost_overview IS 'Real-time aggregated view of API costs for dashboard display. Refresh periodically.';
