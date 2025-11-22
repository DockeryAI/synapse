-- FIX: Dashboard and Cache Table RLS Errors
-- Date: 2025-11-22
-- Issue: 400 errors on cache tables, dashboard timeout
-- Solution: Apply lessons from updated RLS guide

BEGIN;

-- ============================================================================
-- CRITICAL INSIGHT FROM UPDATED GUIDE:
-- INSERT operations that return data need BOTH USING and WITH CHECK
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

-- Create permissive policies with BOTH clauses as per updated guide
CREATE POLICY "Public can read cache"
ON public.location_detection_cache
FOR SELECT
TO public
USING (true);

-- CRITICAL: INSERT needs BOTH clauses when returning data!
CREATE POLICY "Public can insert cache"
ON public.location_detection_cache
FOR INSERT
TO public
WITH CHECK (true)  -- What can be inserted
USING (true);      -- What can be selected after insert (CRITICAL!)

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
USING (expires_at < NOW());

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

    -- Create permissive policy for development
    EXECUTE 'CREATE POLICY "TEMP_DEV_allow_all_eq_scores"
             ON public.brand_eq_scores
             FOR ALL
             TO public
             USING (true)
             WITH CHECK (true)';

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

    -- Create policies with BOTH clauses for INSERT
    EXECUTE 'CREATE POLICY "Public read intelligence"
             ON public.intelligence_cache
             FOR SELECT
             TO public
             USING (true)';

    EXECUTE 'CREATE POLICY "Public write intelligence"
             ON public.intelligence_cache
             FOR INSERT
             TO public
             WITH CHECK (true)
             USING (true)';  -- BOTH clauses!

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
-- 5. Grant comprehensive permissions (per Pitfall 13 in guide)
-- ============================================================================

-- Re-grant all permissions in case Prisma or other tools wiped them
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
COMMENT ON TABLE location_detection_cache IS 'Cache table - RLS fixed at 2025-11-22 per updated guide';

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
  RAISE NOTICE 'Based on Updated RLS Troubleshooting Guide v1.1';
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
  RAISE NOTICE '=== CRITICAL REMINDERS FROM GUIDE ===';
  RAISE NOTICE '1. INSERT operations that return data need BOTH USING and WITH CHECK';
  RAISE NOTICE '2. TO public includes all roles (anon, authenticated, etc.)';
  RAISE NOTICE '3. Always force PostgREST reload after RLS changes';
  RAISE NOTICE '4. This is TEMPORARY for development - implement proper RLS before production';
  RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================================================
-- IMPORTANT: This migration implements lessons from RLS Guide v1.1:
--
-- 1. INSERT policies need BOTH USING and WITH CHECK when returning data
-- 2. All policies MUST have TO clauses to avoid 406 errors
-- 3. Grants can be wiped by Prisma/migrations and need re-applying
-- 4. PostgREST cache must be forced to reload
--
-- This is a DEVELOPMENT solution. Before production:
-- - Implement proper user-based RLS
-- - Remove public write access
-- - Add audit trails
-- ============================================================================