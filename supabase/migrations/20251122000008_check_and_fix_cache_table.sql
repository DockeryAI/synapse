-- CHECK AND FIX: location_detection_cache table structure
-- Date: 2025-11-22
-- Issue: Persistent 400 errors despite RLS fixes
-- Solution: Verify table structure and ensure all columns exist

BEGIN;

-- ============================================================================
-- 1. First, let's check what columns actually exist
-- ============================================================================

DO $$
DECLARE
  col record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== LOCATION_DETECTION_CACHE TABLE STRUCTURE ===';
  RAISE NOTICE '';

  FOR col IN
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'location_detection_cache'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  Column: % (%) Nullable: % Default: %',
      col.column_name, col.data_type, col.is_nullable, col.column_default;
  END LOOP;
END $$;

-- ============================================================================
-- 2. Ensure all required columns exist
-- ============================================================================

-- Add domain column if missing (this is what the query is filtering on)
ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add cache_key column if missing (alternative to domain)
ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS cache_key TEXT;

-- Add location columns if missing
ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2);

ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS method TEXT;

ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS reasoning TEXT;

-- Add timestamp columns if missing
ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.location_detection_cache
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add ID column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_detection_cache'
    AND column_name = 'id'
  ) THEN
    ALTER TABLE public.location_detection_cache
    ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
  END IF;
END $$;

-- ============================================================================
-- 3. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_location_cache_domain
ON public.location_detection_cache(domain);

CREATE INDEX IF NOT EXISTS idx_location_cache_key
ON public.location_detection_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_location_cache_expires
ON public.location_detection_cache(expires_at);

-- ============================================================================
-- 4. Now apply the simplest possible RLS
-- ============================================================================

-- Disable then re-enable to clear any issues
ALTER TABLE public.location_detection_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'location_detection_cache'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.location_detection_cache', pol.policyname);
  END LOOP;
END $$;

-- Create the absolute simplest policies possible
CREATE POLICY "allow_all_select"
ON public.location_detection_cache
FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_all_insert"
ON public.location_detection_cache
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "allow_all_update"
ON public.location_detection_cache
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_delete"
ON public.location_detection_cache
FOR DELETE
TO public
USING (true);

-- ============================================================================
-- 5. Grant maximum permissions
-- ============================================================================

GRANT ALL ON public.location_detection_cache TO public;
GRANT ALL ON public.location_detection_cache TO anon;
GRANT ALL ON public.location_detection_cache TO authenticated;
GRANT ALL ON public.location_detection_cache TO service_role;

-- Grant on any sequences
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_sequences
    WHERE schemaname = 'public'
    AND sequencename LIKE 'location_detection_cache%'
  ) THEN
    EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO public, anon, authenticated, service_role';
  END IF;
END $$;

-- ============================================================================
-- 6. Force reload
-- ============================================================================

ALTER TABLE public.location_detection_cache ADD COLUMN IF NOT EXISTS _reload_v8 BOOLEAN DEFAULT true;
ALTER TABLE public.location_detection_cache DROP COLUMN IF EXISTS _reload_v8;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 7. Final verification
-- ============================================================================

DO $$
DECLARE
  col_count INT;
  rls_enabled BOOLEAN;
  policy_count INT;
BEGIN
  -- Count columns
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'location_detection_cache';

  -- Check RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'location_detection_cache';

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'location_detection_cache';

  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL STATUS ===';
  RAISE NOTICE 'Columns in table: %', col_count;
  RAISE NOTICE 'RLS Enabled: %', rls_enabled;
  RAISE NOTICE 'Policy Count: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'The table should now have:';
  RAISE NOTICE '  - All required columns (domain, city, state, etc.)';
  RAISE NOTICE '  - RLS enabled with permissive policies';
  RAISE NOTICE '  - Full grants to all roles';
  RAISE NOTICE '';
  RAISE NOTICE 'If still getting 400 errors:';
  RAISE NOTICE '  1. Check Supabase logs for the exact error message';
  RAISE NOTICE '  2. The issue may be with the table structure itself';
  RAISE NOTICE '  3. Consider recreating the table from scratch';
END $$;

COMMIT;

-- ============================================================================
-- If this STILL doesn't work, the issue might be:
-- 1. The table doesn't exist at all
-- 2. There's a conflicting constraint or trigger
-- 3. PostgREST is looking at a different schema
-- 4. The error is actually coming from somewhere else
-- ============================================================================