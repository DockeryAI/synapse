-- Phase 15: Specialization Detection & API Pre-fetch
-- Adds specialization_data to brand_profiles and creates prefetch_cache table
-- Created: 2025-12-05

-- First, add the 7th profile type if it doesn't exist (global-saas-b2b)
DO $$
BEGIN
  -- Check if global-saas-b2b exists, add it if not
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'global-saas-b2b' AND enumtypid = 'business_profile_type'::regtype) THEN
    ALTER TYPE business_profile_type ADD VALUE IF NOT EXISTS 'global-saas-b2b';
  END IF;
EXCEPTION
  WHEN invalid_parameter_value THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Add specialization columns to brand_profiles
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS specialization_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prefetch_cache_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS detection_confidence INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS detected_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Comments for new columns
COMMENT ON COLUMN brand_profiles.specialization_data IS 'Detected business specialization: service_type, niche, industry_vertical, unique_method, target_outcome, detected_competitors';
COMMENT ON COLUMN brand_profiles.prefetch_cache_id IS 'Reference to cached API results in prefetch_cache table';
COMMENT ON COLUMN brand_profiles.detection_confidence IS 'Confidence score 0-100 of specialization detection';
COMMENT ON COLUMN brand_profiles.detected_at IS 'When specialization was detected';

-- Create prefetch_cache table
CREATE TABLE IF NOT EXISTS prefetch_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Cached tab data (results from all 6 tabs)
  tab_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Query context (what queries were used to get this data)
  query_context JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Specialization data used for this prefetch
  specialization_used JSONB DEFAULT NULL,

  -- Cache metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fetching', 'complete', 'failed', 'expired')),
  error_message TEXT DEFAULT NULL,

  -- Performance tracking
  fetch_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  fetch_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  tabs_completed INTEGER DEFAULT 0
);

-- Indexes for prefetch_cache
CREATE INDEX IF NOT EXISTS idx_prefetch_cache_brand ON prefetch_cache(brand_id);
CREATE INDEX IF NOT EXISTS idx_prefetch_cache_status ON prefetch_cache(status);
CREATE INDEX IF NOT EXISTS idx_prefetch_cache_expires ON prefetch_cache(expires_at) WHERE status = 'complete';
CREATE INDEX IF NOT EXISTS idx_prefetch_cache_brand_latest ON prefetch_cache(brand_id, created_at DESC);

-- FK from brand_profiles to prefetch_cache
ALTER TABLE brand_profiles
  ADD CONSTRAINT fk_brand_profiles_prefetch_cache
  FOREIGN KEY (prefetch_cache_id)
  REFERENCES prefetch_cache(id)
  ON DELETE SET NULL;

-- Updated at trigger for prefetch_cache
CREATE OR REPLACE FUNCTION update_prefetch_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changes to 'complete', set fetch_completed_at
  IF NEW.status = 'complete' AND OLD.status != 'complete' THEN
    NEW.fetch_completed_at = NOW();
  END IF;
  -- If status changes to 'fetching', set fetch_started_at
  IF NEW.status = 'fetching' AND OLD.status != 'fetching' THEN
    NEW.fetch_started_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prefetch_cache_status
  BEFORE UPDATE ON prefetch_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_prefetch_cache_updated_at();

-- RLS for prefetch_cache
ALTER TABLE prefetch_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prefetch cache"
  ON prefetch_cache FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert prefetch cache"
  ON prefetch_cache FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update prefetch cache"
  ON prefetch_cache FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete prefetch cache"
  ON prefetch_cache FOR DELETE
  TO public
  USING (true);

-- Function to clean up expired prefetch cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_prefetch_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM prefetch_cache
    WHERE expires_at < NOW()
    AND status = 'complete'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE prefetch_cache IS 'Cached API results from background pre-fetch during UVP flow';
COMMENT ON COLUMN prefetch_cache.tab_data IS 'JSONB with keys for each tab: voc, community, competitive, trends, search, local_timing';
COMMENT ON COLUMN prefetch_cache.query_context IS 'What specialization-aware queries were used for this prefetch';
COMMENT ON COLUMN prefetch_cache.status IS 'pending=created, fetching=APIs running, complete=ready, failed=error, expired=TTL passed';
