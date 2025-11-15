-- Fix intelligence_cache table schema
-- Add missing columns and update indexes

-- Add brand_id column (nullable to support existing data)
ALTER TABLE intelligence_cache
ADD COLUMN IF NOT EXISTS brand_id UUID;

-- Add updated_at column
ALTER TABLE intelligence_cache
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add location_detection_cache table if missing
CREATE TABLE IF NOT EXISTS location_detection_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  city TEXT,
  state TEXT,
  confidence DECIMAL(3,2),
  method TEXT,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_location_cache_domain ON location_detection_cache(domain);

-- Update RLS policies (disabled for demo)
ALTER TABLE location_detection_cache DISABLE ROW LEVEL SECURITY;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
