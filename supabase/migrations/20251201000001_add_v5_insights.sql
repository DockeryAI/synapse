-- =====================================================
-- V5 Insights Database Schema
-- =====================================================
-- Stores all insight types from V5 Content Engine:
-- - Triggers (psychological)
-- - Proof (social proof, testimonials)
-- - Trends (industry trends)
-- - Competitors (competitive gaps)
-- - Local (local events)
-- - Weather (weather-triggered opportunities)
-- =====================================================

-- =====================================================
-- Table: v5_insights
-- Unified storage for all V5 insight types
-- =====================================================

CREATE TABLE IF NOT EXISTS v5_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Insight Type
  insight_type TEXT NOT NULL,           -- 'trigger', 'proof', 'trend', 'competitor', 'local', 'weather'

  -- Core Data (shared across all types)
  text TEXT NOT NULL,                   -- Main insight text
  source TEXT,                          -- Data source
  category TEXT,                        -- Sub-category for the insight type

  -- Scores (used by different types)
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  urgency INTEGER CHECK (urgency >= 0 AND urgency <= 10),

  -- Extended Data (type-specific, stored as JSONB)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Source Tracking
  api_source TEXT,                      -- Which API provided this data
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_stale BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_insight_type CHECK (insight_type IN (
    'trigger', 'proof', 'trend', 'competitor', 'local', 'weather'
  ))
);

-- Indexes for v5_insights
CREATE INDEX idx_v5_insights_brand_id ON v5_insights(brand_id);
CREATE INDEX idx_v5_insights_type ON v5_insights(insight_type);
CREATE INDEX idx_v5_insights_brand_type ON v5_insights(brand_id, insight_type);
CREATE INDEX idx_v5_insights_fetched_at ON v5_insights(fetched_at DESC);
CREATE INDEX idx_v5_insights_is_stale ON v5_insights(is_stale);

-- GIN index for metadata JSONB
CREATE INDEX idx_v5_insights_metadata ON v5_insights USING gin(metadata);

-- Full-text search on insight text
CREATE INDEX idx_v5_insights_text_fts ON v5_insights USING gin(to_tsvector('english', text));

-- Comments
COMMENT ON TABLE v5_insights IS 'Unified storage for all V5 Content Engine insights';
COMMENT ON COLUMN v5_insights.insight_type IS 'Type: trigger, proof, trend, competitor, local, weather';
COMMENT ON COLUMN v5_insights.metadata IS 'Type-specific extended data in JSONB format';
COMMENT ON COLUMN v5_insights.api_source IS 'Which API provided this insight (for refresh targeting)';

-- =====================================================
-- Table: v5_insight_refresh_log
-- Tracks when insights were last refreshed for each brand/type
-- =====================================================

CREATE TABLE IF NOT EXISTS v5_insight_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- What was refreshed
  insight_type TEXT,                    -- NULL means all types

  -- Refresh tracking
  last_refresh_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refresh_count INTEGER DEFAULT 1,

  -- Status
  status TEXT DEFAULT 'success',        -- 'success', 'partial', 'failed'
  error_message TEXT,

  -- Metadata
  insights_loaded INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one log per brand+type
  UNIQUE(brand_id, insight_type)
);

-- Indexes
CREATE INDEX idx_v5_insight_refresh_log_brand_id ON v5_insight_refresh_log(brand_id);
CREATE INDEX idx_v5_insight_refresh_log_last_refresh ON v5_insight_refresh_log(last_refresh_at DESC);

-- Comments
COMMENT ON TABLE v5_insight_refresh_log IS 'Tracks insight refresh history for each brand';

-- =====================================================
-- Auto-update updated_at timestamp
-- =====================================================

CREATE TRIGGER update_v5_insights_updated_at
  BEFORE UPDATE ON v5_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_v5_insight_refresh_log_updated_at
  BEFORE UPDATE ON v5_insight_refresh_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE v5_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE v5_insight_refresh_log ENABLE ROW LEVEL SECURITY;

-- Policies for v5_insights
CREATE POLICY "Users can view their own insights"
  ON v5_insights FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own insights"
  ON v5_insights FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own insights"
  ON v5_insights FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own insights"
  ON v5_insights FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- Policies for v5_insight_refresh_log
CREATE POLICY "Users can view their own refresh logs"
  ON v5_insight_refresh_log FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own refresh logs"
  ON v5_insight_refresh_log FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own refresh logs"
  ON v5_insight_refresh_log FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own refresh logs"
  ON v5_insight_refresh_log FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT ALL ON v5_insights TO authenticated;
GRANT ALL ON v5_insight_refresh_log TO authenticated;
GRANT SELECT ON v5_insights TO service_role;
GRANT SELECT ON v5_insight_refresh_log TO service_role;

-- =====================================================
-- Helper Views
-- =====================================================

-- View: Latest insights by type for a brand
CREATE OR REPLACE VIEW v5_latest_insights AS
SELECT DISTINCT ON (brand_id, insight_type)
  *
FROM v5_insights
ORDER BY brand_id, insight_type, fetched_at DESC;

COMMENT ON VIEW v5_latest_insights IS 'Most recent insights grouped by brand and type';

-- =====================================================
-- Completion
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ V5 Insights schema created successfully';
  RAISE NOTICE '   - v5_insights table (unified insight storage)';
  RAISE NOTICE '   - v5_insight_refresh_log table (refresh tracking)';
  RAISE NOTICE '   - RLS policies enabled for data security';
  RAISE NOTICE '🚀 Ready for V5 Content Engine insights!';
END $$;
