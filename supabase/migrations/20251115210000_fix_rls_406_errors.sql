-- Fix 406 errors by disabling RLS on cache tables for demo
-- These tables store non-sensitive ephemeral data with TTL

-- Disable RLS on intelligence_cache (already should be disabled, but re-apply)
ALTER TABLE IF EXISTS intelligence_cache DISABLE ROW LEVEL SECURITY;

-- Disable RLS on location_detection_cache
ALTER TABLE IF EXISTS location_detection_cache DISABLE ROW LEVEL SECURITY;

-- Disable RLS on industry_profiles for demo (read-only reference data)
ALTER TABLE IF EXISTS industry_profiles DISABLE ROW LEVEL SECURITY;

-- Grant anon access to these tables
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_cache TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON location_detection_cache TO anon;
GRANT SELECT ON industry_profiles TO anon;
GRANT INSERT ON industry_profiles TO anon;  -- Allow on-demand generation

-- Also grant to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON location_detection_cache TO authenticated;
GRANT SELECT ON industry_profiles TO authenticated;
GRANT INSERT ON industry_profiles TO authenticated;
