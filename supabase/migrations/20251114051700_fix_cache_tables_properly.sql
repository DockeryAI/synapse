-- Fix cache tables with proper permissions (production-ready)
-- This migration:
-- 1. Drops all existing policies
-- 2. Disables RLS
-- 3. Grants explicit permissions to all roles
-- 4. Forces PostgREST schema reload

-- Step 1: Drop ALL existing policies on both tables
DROP POLICY IF EXISTS "Allow anonymous delete access" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anonymous read access" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anonymous update access" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anonymous write access" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON intelligence_cache;

-- Step 2: Disable RLS on both tables
ALTER TABLE intelligence_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_detection_cache DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant explicit permissions to all roles
-- These tables are ephemeral caches with TTL, no sensitive data
GRANT ALL ON intelligence_cache TO anon, authenticated, service_role;
GRANT ALL ON location_detection_cache TO anon, authenticated, service_role;

-- Step 4: Ensure sequences are also accessible (for id generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Step 5: Clear any stale cache data with NYC content
DELETE FROM intelligence_cache WHERE cache_key LIKE 'deepcontext:%';
DELETE FROM intelligence_cache WHERE cache_key LIKE 'website_analysis:%';
DELETE FROM intelligence_cache WHERE data::text LIKE '%New York%' AND data::text NOT LIKE '%Dallas%';

-- Step 6: Add a comment to document the security model
COMMENT ON TABLE intelligence_cache IS 'Ephemeral API response cache with TTL. No sensitive data. RLS disabled for performance.';
COMMENT ON TABLE location_detection_cache IS 'Business location detection cache. No sensitive data. RLS disabled for performance.';
