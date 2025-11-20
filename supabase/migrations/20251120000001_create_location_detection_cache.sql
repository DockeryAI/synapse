-- Create location_detection_cache table
-- This table caches location detection results to avoid repeated processing
-- Created: 2025-11-20

CREATE TABLE IF NOT EXISTS location_detection_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  method TEXT, -- 'domain_analysis', 'content_extraction', 'fallback'
  reasoning TEXT, -- Explanation of how location was determined
  raw_data JSONB, -- Store any additional location-related data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_location_detection_cache_domain ON location_detection_cache(domain);
CREATE INDEX idx_location_detection_cache_confidence ON location_detection_cache(confidence);
CREATE INDEX idx_location_detection_cache_created ON location_detection_cache(created_at DESC);

-- Updated at trigger
CREATE TRIGGER update_location_detection_cache_updated_at
  BEFORE UPDATE ON location_detection_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (read-only for authenticated users)
ALTER TABLE location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read (cache is shared)
CREATE POLICY "Authenticated users can view location cache"
  ON location_detection_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update (backend only)
CREATE POLICY "Service role can manage location cache"
  ON location_detection_cache FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE location_detection_cache IS 'Caches location detection results from website analysis to avoid repeated processing and improve performance';