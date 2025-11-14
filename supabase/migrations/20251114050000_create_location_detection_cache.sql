-- Create location_detection_cache table
-- Stores detected business locations to avoid repeated AI calls
CREATE TABLE IF NOT EXISTS location_detection_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  method TEXT NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on domain for fast lookups
CREATE INDEX IF NOT EXISTS idx_location_detection_cache_domain ON location_detection_cache(domain);

-- Disable RLS for demo (ephemeral cache data, no sensitive info)
ALTER TABLE location_detection_cache DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE location_detection_cache IS 'Caches detected business locations to avoid repeated AI inference calls. Used by location-detection.service.ts';
