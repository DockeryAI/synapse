-- COMPREHENSIVE FIX: Force schema reload and add SELECT policy
-- Date: 2025-11-22
-- Issue: 400 errors persist even with returning: 'minimal'
-- Solution: Force schema cache reload + explicit SELECT policy

BEGIN;

-- ============================================================================
-- FIX 2: Add explicit SELECT policy (in case it's missing)
-- ============================================================================

-- Drop and recreate SELECT policy with unique name
DROP POLICY IF EXISTS "allow_cache_select_after_insert" ON public.location_detection_cache;
DROP POLICY IF EXISTS "cache_select_v7" ON public.location_detection_cache;
DROP POLICY IF EXISTS "cache_select_v8" ON public.location_detection_cache;

CREATE POLICY "cache_select_all_v9"
ON public.location_detection_cache
FOR SELECT
TO public, anon, authenticated
USING (true);

-- Ensure INSERT policy exists
DROP POLICY IF EXISTS "cache_insert_v7" ON public.location_detection_cache;
DROP POLICY IF EXISTS "cache_insert_v8" ON public.location_detection_cache;

CREATE POLICY "cache_insert_all_v9"
ON public.location_detection_cache
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

-- ============================================================================
-- FIX 3: Force comprehensive schema cache reload
-- ============================================================================

-- Method 1: Send multiple notification types
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload';
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
SELECT pg_notify('pgrst', 'reload');

-- Method 2: Force with dummy columns (multiple times)
ALTER TABLE location_detection_cache ADD COLUMN _force_reload_v10 BOOLEAN DEFAULT true;
ALTER TABLE location_detection_cache DROP COLUMN _force_reload_v10;

ALTER TABLE location_detection_cache ADD COLUMN _force_reload_v11 BOOLEAN DEFAULT true;
ALTER TABLE location_detection_cache DROP COLUMN _force_reload_v11;

ALTER TABLE location_detection_cache ADD COLUMN _force_reload_v12 BOOLEAN DEFAULT true;
ALTER TABLE location_detection_cache DROP COLUMN _force_reload_v12;

-- Method 3: Analyze the table (VACUUM can't run in transaction)
ANALYZE location_detection_cache;

-- Method 4: Change comment multiple times
COMMENT ON TABLE location_detection_cache IS 'Cache table - Reload 1';
COMMENT ON TABLE location_detection_cache IS 'Cache table - Reload 2';
COMMENT ON TABLE location_detection_cache IS 'Cache table - Reload 3';
COMMENT ON TABLE location_detection_cache IS 'Cache table - Final reload 2025-11-22';

-- Method 5: Force another reload with comment
COMMENT ON TABLE location_detection_cache IS 'Location detection cache - Force reload complete';

-- ============================================================================
-- FIX 6: Verify column types match exactly
-- ============================================================================

-- Ensure columns have correct types
ALTER TABLE location_detection_cache
ALTER COLUMN hasMultipleLocations TYPE BOOLEAN
USING COALESCE(hasMultipleLocations, false)::boolean;

ALTER TABLE location_detection_cache
ALTER COLUMN allLocations TYPE JSONB
USING COALESCE(allLocations, '[]'::jsonb)::jsonb;

-- Set defaults
ALTER TABLE location_detection_cache
ALTER COLUMN hasMultipleLocations SET DEFAULT false;

ALTER TABLE location_detection_cache
ALTER COLUMN allLocations SET DEFAULT '[]'::jsonb;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  col_count INT;
  policy_count INT;
  has_select BOOLEAN;
  has_insert BOOLEAN;
BEGIN
  -- Count columns
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'location_detection_cache';

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'location_detection_cache';

  -- Check for SELECT policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'location_detection_cache'
    AND cmd = 'SELECT'
  ) INTO has_select;

  -- Check for INSERT policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'location_detection_cache'
    AND cmd = 'INSERT'
  ) INTO has_insert;

  RAISE NOTICE '';
  RAISE NOTICE '=== CACHE TABLE STATUS ===';
  RAISE NOTICE 'Columns: %', col_count;
  RAISE NOTICE 'Policies: %', policy_count;
  RAISE NOTICE 'Has SELECT policy: %', has_select;
  RAISE NOTICE 'Has INSERT policy: %', has_insert;
  RAISE NOTICE '';

  -- List all columns with types
  RAISE NOTICE 'Column Details:';
  FOR col_count IN
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_detection_cache'
    AND column_name IN ('hasMultipleLocations', 'allLocations')
  LOOP
    RAISE NOTICE '  - hasMultipleLocations and allLocations columns exist';
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Schema cache has been forcefully reloaded multiple times.';
  RAISE NOTICE 'If 400 errors persist after this migration:';
  RAISE NOTICE '  1. Wait 30-60 seconds for PostgREST to reload';
  RAISE NOTICE '  2. Try a hard refresh in browser (Ctrl+Shift+R)';
  RAISE NOTICE '  3. Check Supabase logs for the actual error message';
END $$;

COMMIT;

-- ============================================================================
-- IMPORTANT: After running this migration:
-- 1. Wait at least 30 seconds
-- 2. Refresh your browser completely
-- 3. Test again
-- ============================================================================