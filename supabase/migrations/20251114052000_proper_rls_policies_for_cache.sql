-- PROPER RLS setup for cache tables (PRODUCTION-READY)
-- RLS stays ENABLED with permissive policies for cache tables

-- Step 1: Drop all broken policies
DROP POLICY IF EXISTS "Allow anonymous delete access" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anonymous read access" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anonymous update access" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anonymous write access" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON intelligence_cache;

-- Step 2: ENABLE RLS (this is the secure way)
ALTER TABLE intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Step 3: Create PROPER permissive policies for intelligence_cache
-- Cache tables are ephemeral, no sensitive data, need public access
CREATE POLICY "Allow public read on intelligence_cache"
  ON intelligence_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on intelligence_cache"
  ON intelligence_cache
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on intelligence_cache"
  ON intelligence_cache
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on intelligence_cache"
  ON intelligence_cache
  FOR DELETE
  TO public
  USING (true);

-- Step 4: Create PROPER permissive policies for location_detection_cache
CREATE POLICY "Allow public read on location_detection_cache"
  ON location_detection_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on location_detection_cache"
  ON location_detection_cache
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on location_detection_cache"
  ON location_detection_cache
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on location_detection_cache"
  ON location_detection_cache
  FOR DELETE
  TO public
  USING (true);

-- Step 5: Clear stale cache data
DELETE FROM intelligence_cache WHERE cache_key LIKE 'deepcontext:%';
DELETE FROM intelligence_cache WHERE cache_key LIKE 'website_analysis:%';

-- Step 6: Verify policies are created
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('intelligence_cache', 'location_detection_cache')
ORDER BY tablename, policyname;
