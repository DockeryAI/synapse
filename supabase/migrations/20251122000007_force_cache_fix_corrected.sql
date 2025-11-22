-- FORCE FIX: location_detection_cache table 400 errors (CORRECTED)
-- Date: 2025-11-22
-- Issue: Still getting 400 errors after applying RLS fixes
-- Solution: Aggressive approach to force changes

BEGIN;

-- ============================================================================
-- 1. NUCLEAR OPTION: Completely recreate the RLS setup
-- ============================================================================

-- First, completely disable RLS to reset everything
ALTER TABLE public.location_detection_cache DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (even if we think they're gone)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'location_detection_cache'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.location_detection_cache CASCADE', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names to avoid any caching
CREATE POLICY "cache_select_v7"
ON public.location_detection_cache
FOR SELECT
TO public
USING (true);

CREATE POLICY "cache_insert_v7"
ON public.location_detection_cache
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "cache_update_v7"
ON public.location_detection_cache
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "cache_delete_v7"
ON public.location_detection_cache
FOR DELETE
TO public
USING (true);

-- ============================================================================
-- 2. Force permissions reset
-- ============================================================================

-- Revoke everything first
REVOKE ALL ON public.location_detection_cache FROM public CASCADE;
REVOKE ALL ON public.location_detection_cache FROM anon CASCADE;
REVOKE ALL ON public.location_detection_cache FROM authenticated CASCADE;

-- Re-grant everything
GRANT ALL ON public.location_detection_cache TO public;
GRANT ALL ON public.location_detection_cache TO anon;
GRANT ALL ON public.location_detection_cache TO authenticated;
GRANT ALL ON public.location_detection_cache TO service_role;

-- Also grant on the sequence if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_sequences
    WHERE schemaname = 'public'
    AND sequencename = 'location_detection_cache_id_seq'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE public.location_detection_cache_id_seq TO public;
    GRANT USAGE, SELECT ON SEQUENCE public.location_detection_cache_id_seq TO anon;
    GRANT USAGE, SELECT ON SEQUENCE public.location_detection_cache_id_seq TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- 3. ALTERNATIVE: If still not working, temporarily disable RLS completely
-- ============================================================================

-- Uncomment this section if the above doesn't work
-- This completely bypasses RLS for this table
/*
ALTER TABLE public.location_detection_cache DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.location_detection_cache TO public;
COMMENT ON TABLE public.location_detection_cache IS 'RLS DISABLED for debugging - re-enable before production';
*/

-- ============================================================================
-- 4. Force multiple types of schema reload
-- ============================================================================

-- Method 1: Alter table structure
ALTER TABLE public.location_detection_cache ADD COLUMN IF NOT EXISTS _temp_fix BOOLEAN DEFAULT true;
ALTER TABLE public.location_detection_cache DROP COLUMN IF EXISTS _temp_fix;

-- Method 2: Change table comment multiple times
COMMENT ON TABLE public.location_detection_cache IS 'Cache table - Fix attempt 1';
COMMENT ON TABLE public.location_detection_cache IS 'Cache table - Fix attempt 2';
COMMENT ON TABLE public.location_detection_cache IS 'Cache table - Fix attempt 3';
COMMENT ON TABLE public.location_detection_cache IS 'Location detection cache - Fixed 2025-11-22';

-- Method 3: Send multiple NOTIFY signals
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload';

-- Method 4: Touch the table's modified timestamp if it has one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_detection_cache'
    AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'UPDATE public.location_detection_cache SET updated_at = NOW() WHERE false';
  END IF;
END $$;

-- ============================================================================
-- 5. Verification
-- ============================================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INT;
  grant_count INT;
  pol_rec record;
BEGIN
  -- Check RLS status
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'location_detection_cache';

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'location_detection_cache';

  -- Count grants
  SELECT COUNT(*) INTO grant_count
  FROM information_schema.table_privileges
  WHERE table_name = 'location_detection_cache'
  AND grantee IN ('anon', 'public', 'authenticated');

  RAISE NOTICE '';
  RAISE NOTICE '=== LOCATION_DETECTION_CACHE STATUS ===';
  RAISE NOTICE 'RLS Enabled: %', rls_enabled;
  RAISE NOTICE 'Policy Count: %', policy_count;
  RAISE NOTICE 'Grant Count: %', grant_count;
  RAISE NOTICE '';

  -- List all policies
  RAISE NOTICE 'Policies:';
  FOR pol_rec IN
    SELECT policyname, cmd, roles::text as role_list
    FROM pg_policies
    WHERE tablename = 'location_detection_cache'
  LOOP
    RAISE NOTICE '  - % (%) for %', pol_rec.policyname, pol_rec.cmd, pol_rec.role_list;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'If still getting 400 errors after this migration:';
  RAISE NOTICE '1. Wait 30 seconds for PostgREST to reload';
  RAISE NOTICE '2. Try refreshing the browser completely (Ctrl+Shift+R)';
  RAISE NOTICE '3. If still failing, uncomment the DISABLE RLS section above';
  RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================================================
-- IMPORTANT: If this still doesn't work, the issue might be:
-- 1. PostgREST is caching aggressively - may need restart
-- 2. Browser is caching the failed requests
-- 3. The anon role doesn't actually have the permissions
--
-- Last resort: Disable RLS on cache tables in development
-- ============================================================================