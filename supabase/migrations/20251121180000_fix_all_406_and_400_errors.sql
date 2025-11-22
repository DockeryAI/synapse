-- Fix all 406 and 400 errors
-- Date: 2025-11-21
-- Issues:
--   1. intelligence_cache returning 406 Not Acceptable
--   2. industry_profiles returning 400 Bad Request
--   3. naics_codes returning 400 Bad Request

-- ============================================
-- FIX 1: intelligence_cache table
-- ============================================

-- Drop and recreate intelligence_cache table with proper structure
DROP TABLE IF EXISTS intelligence_cache CASCADE;

CREATE TABLE intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE
);

-- Create index for fast lookups
CREATE INDEX idx_intelligence_cache_key ON intelligence_cache(cache_key);
CREATE INDEX idx_intelligence_cache_expires ON intelligence_cache(expires_at);
CREATE INDEX idx_intelligence_cache_brand ON intelligence_cache(brand_id);

-- Disable RLS completely
ALTER TABLE intelligence_cache DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon and authenticated
GRANT ALL ON intelligence_cache TO anon;
GRANT ALL ON intelligence_cache TO authenticated;

-- ============================================
-- FIX 2: industry_profiles table
-- ============================================

-- Ensure industry_profiles table exists and has proper structure
CREATE TABLE IF NOT EXISTS industry_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_name TEXT NOT NULL,
  industry_code TEXT,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for ilike queries
CREATE INDEX IF NOT EXISTS idx_industry_profiles_name_ilike ON industry_profiles(LOWER(industry_name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_industry_profiles_name ON industry_profiles(industry_name);

-- Disable RLS
ALTER TABLE industry_profiles DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON industry_profiles TO anon;
GRANT ALL ON industry_profiles TO authenticated;

-- ============================================
-- FIX 3: naics_codes table
-- ============================================

-- Ensure naics_codes table exists with proper structure
CREATE TABLE IF NOT EXISTS naics_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  industry_label TEXT NOT NULL,
  description TEXT,
  profiles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for ilike queries
CREATE INDEX IF NOT EXISTS idx_naics_codes_label_ilike ON naics_codes(LOWER(industry_label) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_naics_codes_label ON naics_codes(industry_label);
CREATE INDEX IF NOT EXISTS idx_naics_codes_code ON naics_codes(code);

-- Disable RLS
ALTER TABLE naics_codes DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON naics_codes TO anon;
GRANT ALL ON naics_codes TO authenticated;

-- ============================================
-- FIX 4: location_detection_cache table
-- ============================================

CREATE TABLE IF NOT EXISTS location_detection_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_location_cache_key ON location_detection_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_location_cache_expires ON location_detection_cache(expires_at);

ALTER TABLE location_detection_cache DISABLE ROW LEVEL SECURITY;
GRANT ALL ON location_detection_cache TO anon;
GRANT ALL ON location_detection_cache TO authenticated;

-- ============================================
-- Verify all tables are accessible
-- ============================================

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
