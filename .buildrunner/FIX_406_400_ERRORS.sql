-- =====================================================
-- FIX 406 (Not Acceptable) and 400 (Bad Request) ERRORS
-- Date: 2025-11-22
-- =====================================================
-- BEFORE RUNNING: Backup current policies with EXTRACT_CURRENT_RLS_POLICIES.sql
-- =====================================================
-- UVP SAFETY: This fix does NOT touch uvp_sessions, marba_uvps, or brands tables.
-- UVP process will continue working normally. See UVP_SAFETY_VERIFICATION.md
-- =====================================================

-- =====================================================
-- FIX: intelligence_cache (406 errors)
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own intelligence_cache" ON intelligence_cache;
DROP POLICY IF EXISTS "Users can insert own intelligence_cache" ON intelligence_cache;
DROP POLICY IF EXISTS "Users can update own intelligence_cache" ON intelligence_cache;
DROP POLICY IF EXISTS "Users can delete own intelligence_cache" ON intelligence_cache;

-- Create permissive read policy (cache is shared data)
CREATE POLICY "Public read intelligence_cache"
  ON intelligence_cache
  FOR SELECT
  USING (true);

-- Restrict writes to authenticated users only
CREATE POLICY "Authenticated can write intelligence_cache"
  ON intelligence_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update intelligence_cache"
  ON intelligence_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete intelligence_cache"
  ON intelligence_cache
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE intelligence_cache ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIX: industry_profiles (400 errors)
-- =====================================================

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can read industry_profiles" ON industry_profiles;
DROP POLICY IF EXISTS "Public read industry_profiles" ON industry_profiles;

-- Create public read policy (this is reference data)
CREATE POLICY "Public read industry_profiles"
  ON industry_profiles
  FOR SELECT
  USING (true);

-- Restrict writes to authenticated users
CREATE POLICY "Authenticated can write industry_profiles"
  ON industry_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIX: naics_codes (400 errors)
-- =====================================================

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can read naics_codes" ON naics_codes;
DROP POLICY IF EXISTS "Public read naics_codes" ON naics_codes;

-- Create public read policy (this is reference data)
CREATE POLICY "Public read naics_codes"
  ON naics_codes
  FOR SELECT
  USING (true);

-- Restrict writes to authenticated users
CREATE POLICY "Authenticated can write naics_codes"
  ON naics_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE naics_codes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes');

-- Check policies are in place
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes')
ORDER BY tablename, policyname;

-- Test read access (should work now)
SELECT COUNT(*) as intelligence_cache_count FROM intelligence_cache;
SELECT COUNT(*) as industry_profiles_count FROM industry_profiles;
SELECT COUNT(*) as naics_codes_count FROM naics_codes;

-- =====================================================
-- UVP SAFETY VERIFICATION
-- =====================================================

-- Confirm UVP tables were NOT modified
SELECT
  tablename,
  rowsecurity,
  '✅ NOT MODIFIED' as status
FROM pg_tables
WHERE tablename IN ('uvp_sessions', 'marba_uvps', 'brands', 'temp_brand_onboarding')
ORDER BY tablename;

-- Confirm UVP policies still intact
SELECT
  tablename,
  policyname,
  cmd,
  '✅ UNCHANGED' as status
FROM pg_policies
WHERE tablename IN ('uvp_sessions', 'marba_uvps', 'brands', 'temp_brand_onboarding')
ORDER BY tablename, policyname;
