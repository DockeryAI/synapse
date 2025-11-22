-- FIX: Dashboard and Cache Table RLS Errors (CORRECTED SYNTAX)
-- Date: 2025-11-22
-- Issue: 400 errors on cache tables, dashboard timeout
-- Solution: Proper RLS policies with correct PostgreSQL syntax

BEGIN;

-- ============================================================================
-- CORRECTION: INSERT policies only support WITH CHECK, not USING
-- If you need to return data after INSERT, you need a separate SELECT policy
-- ============================================================================

-- ============================================================================
-- 1. Fix location_detection_cache (causing 400 errors)
-- ============================================================================

-- Drop all existing policies
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'location_detection_cache' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON location_detection_cache', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Create separate policies for each operation
CREATE POLICY "Public can read cache"
ON public.location_detection_cache
FOR SELECT
TO public
USING (true);

-- INSERT only has WITH CHECK (no USING clause in PostgreSQL)
CREATE POLICY "Public can insert cache"
ON public.location_detection_cache
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can update cache"
ON public.location_detection_cache
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete old cache"
ON public.location_detection_cache
FOR DELETE
TO public
USING (expires_at < NOW() OR expires_at IS NULL);

-- Grant all necessary permissions
GRANT ALL ON public.location_detection_cache TO anon, authenticated, public;

-- ============================================================================
-- 2. Fix brand_eq_scores (potential dashboard issue)
-- ============================================================================

DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'brand_eq_scores') THEN

    -- Drop existing policies
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'brand_eq_scores' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON brand_eq_scores', pol.policyname);
    END LOOP;

    -- Enable RLS
    EXECUTE 'ALTER TABLE public.brand_eq_scores ENABLE ROW LEVEL SECURITY';

    -- Create permissive policies for development
    EXECUTE 'CREATE POLICY "TEMP_DEV_select_eq_scores"
             ON public.brand_eq_scores
             FOR SELECT
             TO public
             USING (true)';

    EXECUTE 'CREATE POLICY "TEMP_DEV_insert_eq_scores"
             ON public.brand_eq_scores
             FOR INSERT
             TO public
             WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "TEMP_DEV_update_eq_scores"
             ON public.brand_eq_scores
             FOR UPDATE
             TO public
             USING (true)
             WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "TEMP_DEV_delete_eq_scores"
             ON public.brand_eq_scores
             FOR DELETE
             TO public
             USING (true)';

    -- Grant permissions
    EXECUTE 'GRANT ALL ON public.brand_eq_scores TO anon, authenticated, public';
  END IF;
END $$;

-- ============================================================================
-- 3. Fix intelligence_cache (potential dashboard data source)
-- ============================================================================

DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'intelligence_cache') THEN

    -- Drop existing policies
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'intelligence_cache' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON intelligence_cache', pol.policyname);
    END LOOP;

    -- Enable RLS
    EXECUTE 'ALTER TABLE public.intelligence_cache ENABLE ROW LEVEL SECURITY';

    -- Create policies with correct syntax
    EXECUTE 'CREATE POLICY "Public read intelligence"
             ON public.intelligence_cache
             FOR SELECT
             TO public
             USING (true)';

    EXECUTE 'CREATE POLICY "Public write intelligence"
             ON public.intelligence_cache
             FOR INSERT
             TO public
             WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Public update intelligence"
             ON public.intelligence_cache
             FOR UPDATE
             TO public
             USING (true)
             WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Public delete intelligence"
             ON public.intelligence_cache
             FOR DELETE
             TO public
             USING (true)';

    -- Grant permissions
    EXECUTE 'GRANT ALL ON public.intelligence_cache TO anon, authenticated, public';
  END IF;
END $$;

-- ============================================================================
-- 4. Fix any dashboard-specific tables
-- ============================================================================

-- synapse_generations (if exists)
DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'synapse_generations') THEN

    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'synapse_generations' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON synapse_generations', pol.policyname);
    END LOOP;

    EXECUTE 'ALTER TABLE public.synapse_generations ENABLE ROW LEVEL SECURITY';

    -- Use FOR ALL for simplicity in dev
    EXECUTE 'CREATE POLICY "TEMP_DEV_allow_all_synapse"
             ON public.synapse_generations
             FOR ALL
             TO public
             USING (true)
             WITH CHECK (true)';

    EXECUTE 'GRANT ALL ON public.synapse_generations TO anon, authenticated, public';
  END IF;
END $$;

-- content_generations (if exists)
DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'content_generations') THEN

    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'content_generations' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON content_generations', pol.policyname);
    END LOOP;

    EXECUTE 'ALTER TABLE public.content_generations ENABLE ROW LEVEL SECURITY';

    EXECUTE 'CREATE POLICY "TEMP_DEV_allow_all_content"
             ON public.content_generations
             FOR ALL
             TO public
             USING (true)
             WITH CHECK (true)';

    EXECUTE 'GRANT ALL ON public.content_generations TO anon, authenticated, public';
  END IF;
END $$;

-- industry_profiles (if exists)
DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'industry_profiles') THEN

    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'industry_profiles' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON industry_profiles', pol.policyname);
    END LOOP;

    EXECUTE 'ALTER TABLE public.industry_profiles ENABLE ROW LEVEL SECURITY';

    EXECUTE 'CREATE POLICY "TEMP_DEV_allow_all_industry"
             ON public.industry_profiles
             FOR ALL
             TO public
             USING (true)
             WITH CHECK (true)';

    EXECUTE 'GRANT ALL ON public.industry_profiles TO anon, authenticated, public';
  END IF;
END $$;

-- ============================================================================
-- 5. Grant comprehensive permissions
-- ============================================================================

-- Re-grant all permissions in case they were wiped
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, public;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, public;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, public;

-- ============================================================================
-- 6. Force PostgREST reload (multiple methods for reliability)
-- ============================================================================

-- Method 1: Schema change trick
ALTER TABLE location_detection_cache ADD COLUMN _force_reload BOOLEAN DEFAULT true;
ALTER TABLE location_detection_cache DROP COLUMN _force_reload;

-- Method 2: NOTIFY
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Method 3: Update comment with timestamp
COMMENT ON TABLE location_detection_cache IS 'Cache table - RLS fixed at 2025-11-22 with correct syntax';

-- ============================================================================
-- 7. Verification
-- ============================================================================

DO $$
DECLARE
  tbl record;
  pol record;
  missing_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RLS VERIFICATION REPORT ===';
  RAISE NOTICE '';

  -- Check critical tables
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('location_detection_cache', 'brands', 'marba_uvps', 'uvp_sessions')
  LOOP
    RAISE NOTICE 'Table: %', tbl.tablename;

    -- Check if RLS is enabled
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = tbl.tablename AND rowsecurity = true) THEN
      RAISE NOTICE '  ✓ RLS Enabled';
    ELSE
      RAISE NOTICE '  ✗ RLS DISABLED - SECURITY RISK!';
    END IF;

    -- Check policies have TO clauses
    missing_count := 0;
    FOR pol IN
      SELECT policyname, cmd,
             CASE WHEN cardinality(roles) = 0 THEN 'MISSING' ELSE array_to_string(roles, ',') END as role_list
      FROM pg_policies
      WHERE tablename = tbl.tablename
    LOOP
      IF pol.role_list = 'MISSING' THEN
        RAISE NOTICE '  ✗ Policy "%" (%) - MISSING TO CLAUSE!', pol.policyname, pol.cmd;
        missing_count := missing_count + 1;
      ELSE
        RAISE NOTICE '  ✓ Policy "%" (%) - TO %', pol.policyname, pol.cmd, pol.role_list;
      END IF;
    END LOOP;

    IF missing_count > 0 THEN
      RAISE NOTICE '  ⚠️  WARNING: % policies missing TO clauses (causes 406 errors)', missing_count;
    END IF;

    RAISE NOTICE '';
  END LOOP;

  -- Check grants
  RAISE NOTICE 'Permission Grants to anon:';
  IF EXISTS (SELECT 1 FROM information_schema.table_privileges
             WHERE grantee = 'anon' AND table_name = 'location_detection_cache') THEN
    RAISE NOTICE '  ✓ location_detection_cache';
  ELSE
    RAISE NOTICE '  ✗ location_detection_cache - NO PERMISSIONS!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== KEY POINTS ===';
  RAISE NOTICE '1. INSERT policies only have WITH CHECK (no USING in PostgreSQL)';
  RAISE NOTICE '2. For returning data after INSERT, ensure SELECT policy exists';
  RAISE NOTICE '3. All policies MUST have TO clauses to avoid 406 errors';
  RAISE NOTICE '4. This is TEMPORARY for development - implement proper RLS before production';
  RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================================================
-- CORRECTED: PostgreSQL RLS Policy Syntax
--
-- SELECT: USING clause only
-- INSERT: WITH CHECK clause only
-- UPDATE: Both USING and WITH CHECK
-- DELETE: USING clause only
-- ALL: Both USING and WITH CHECK
--
-- The earlier documentation about INSERT needing both clauses was incorrect.
-- If you need to return data after INSERT, you need:
-- 1. INSERT policy with WITH CHECK
-- 2. SELECT policy with USING to read the inserted data
-- ============================================================================