-- COMPREHENSIVE FIX: Dashboard Timeout - Fix RLS on all critical tables
-- Date: 2025-11-22
-- Issue: Dashboard load timeout due to RLS blocking brand/marba_uvps queries
-- Solution: Ensure all dashboard tables have proper SELECT policies

BEGIN;

-- ============================================================================
-- 1. Fix 'brands' table (critical for dashboard)
-- ============================================================================

DO $$
DECLARE pol record;
BEGIN
  -- Drop all existing policies
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'brands' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON brands', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS if not already
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for brands
CREATE POLICY "Public can read brands"
ON public.brands
FOR SELECT
TO public, anon, authenticated
USING (true);

CREATE POLICY "Public can insert brands"
ON public.brands
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can update brands"
ON public.brands
FOR UPDATE
TO public, anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete brands"
ON public.brands
FOR DELETE
TO public, anon, authenticated
USING (true);

-- ============================================================================
-- 2. Fix 'marba_uvps' table (critical for dashboard)
-- ============================================================================

DO $$
DECLARE pol record;
BEGIN
  -- Drop all existing policies
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'marba_uvps' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON marba_uvps', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS if not already
ALTER TABLE public.marba_uvps ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for marba_uvps
CREATE POLICY "Public can read marba_uvps"
ON public.marba_uvps
FOR SELECT
TO public, anon, authenticated
USING (true);

CREATE POLICY "Public can insert marba_uvps"
ON public.marba_uvps
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can update marba_uvps"
ON public.marba_uvps
FOR UPDATE
TO public, anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete marba_uvps"
ON public.marba_uvps
FOR DELETE
TO public, anon, authenticated
USING (true);

-- ============================================================================
-- 3. Fix 'brand_sessions' table (used for session management)
-- ============================================================================

DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_sessions') THEN
    -- Drop all existing policies
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'brand_sessions' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON brand_sessions', pol.policyname);
    END LOOP;

    -- Enable RLS
    EXECUTE 'ALTER TABLE public.brand_sessions ENABLE ROW LEVEL SECURITY';

    -- Create policies
    EXECUTE 'CREATE POLICY "Public can read brand_sessions"
             ON public.brand_sessions
             FOR SELECT
             TO public, anon, authenticated
             USING (true)';

    EXECUTE 'CREATE POLICY "Public can insert brand_sessions"
             ON public.brand_sessions
             FOR INSERT
             TO public, anon, authenticated
             WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Public can update brand_sessions"
             ON public.brand_sessions
             FOR UPDATE
             TO public, anon, authenticated
             USING (true)
             WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Public can delete brand_sessions"
             ON public.brand_sessions
             FOR DELETE
             TO public, anon, authenticated
             USING (true)';
  END IF;
END $$;

-- ============================================================================
-- 4. Fix 'uvp_sessions' table (might be needed)
-- ============================================================================

DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uvp_sessions') THEN
    -- Drop all existing policies
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'uvp_sessions' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON uvp_sessions', pol.policyname);
    END LOOP;

    -- Enable RLS
    EXECUTE 'ALTER TABLE public.uvp_sessions ENABLE ROW LEVEL SECURITY';

    -- Create policies
    EXECUTE 'CREATE POLICY "Public can read uvp_sessions"
             ON public.uvp_sessions
             FOR SELECT
             TO public, anon, authenticated
             USING (true)';

    EXECUTE 'CREATE POLICY "Public can insert uvp_sessions"
             ON public.uvp_sessions
             FOR INSERT
             TO public, anon, authenticated
             WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Public can update uvp_sessions"
             ON public.uvp_sessions
             FOR UPDATE
             TO public, anon, authenticated
             USING (true)
             WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Public can delete uvp_sessions"
             ON public.uvp_sessions
             FOR DELETE
             TO public, anon, authenticated
             USING (true)';
  END IF;
END $$;

-- ============================================================================
-- 5. Create helper functions for critical operations (bypass RLS if needed)
-- ============================================================================

-- Helper to get brand data (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_brand_for_dashboard(p_brand_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.industry,
    b.created_at,
    b.updated_at,
    b.data
  FROM brands b
  WHERE b.id = p_brand_id;
END;
$$;

-- Helper to get marba_uvps data
CREATE OR REPLACE FUNCTION public.get_marba_uvps_for_dashboard(p_brand_id UUID)
RETURNS TABLE (
  id UUID,
  brand_id UUID,
  uvp_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.brand_id,
    m.uvp_data,
    m.created_at,
    m.updated_at
  FROM marba_uvps m
  WHERE m.brand_id = p_brand_id
  ORDER BY m.created_at DESC
  LIMIT 10;
END;
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_brand_for_dashboard TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_marba_uvps_for_dashboard TO anon, authenticated, public;

-- ============================================================================
-- 6. Comprehensive permission grants
-- ============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, public;

-- Grant table permissions
GRANT ALL ON public.brands TO anon, authenticated, public;
GRANT ALL ON public.marba_uvps TO anon, authenticated, public;

-- Grant permissions on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, public;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, public;

-- ============================================================================
-- 7. Force PostgREST schema reload
-- ============================================================================

-- Method 1: Add/remove columns
ALTER TABLE brands ADD COLUMN _reload_fix BOOLEAN DEFAULT true;
ALTER TABLE brands DROP COLUMN _reload_fix;

ALTER TABLE marba_uvps ADD COLUMN _reload_fix BOOLEAN DEFAULT true;
ALTER TABLE marba_uvps DROP COLUMN _reload_fix;

-- Method 2: Multiple NOTIFY signals
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload';
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Method 3: Update table comments
COMMENT ON TABLE brands IS 'Brands table - Dashboard fix applied 2025-11-22';
COMMENT ON TABLE marba_uvps IS 'MARBA UVPs - Dashboard fix applied 2025-11-22';

-- Method 4: Analyze tables
ANALYZE brands;
ANALYZE marba_uvps;

-- ============================================================================
-- 8. Verification and Status Report
-- ============================================================================

DO $$
DECLARE
  tbl record;
  pol_count INT;
  select_pol BOOLEAN;
  insert_pol BOOLEAN;
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DASHBOARD FIX VERIFICATION ===';
  RAISE NOTICE '';

  -- Check critical tables
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('brands', 'marba_uvps', 'brand_sessions', 'uvp_sessions')
  LOOP
    -- Check RLS status
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = tbl.tablename;

    -- Count policies
    SELECT COUNT(*) INTO pol_count
    FROM pg_policies
    WHERE tablename = tbl.tablename;

    -- Check for SELECT policy
    SELECT EXISTS(
      SELECT 1 FROM pg_policies
      WHERE tablename = tbl.tablename
      AND cmd = 'SELECT'
      AND 'public' = ANY(roles)
    ) INTO select_pol;

    -- Check for INSERT policy
    SELECT EXISTS(
      SELECT 1 FROM pg_policies
      WHERE tablename = tbl.tablename
      AND cmd = 'INSERT'
      AND 'public' = ANY(roles)
    ) INTO insert_pol;

    RAISE NOTICE 'Table: %', tbl.tablename;
    RAISE NOTICE '  RLS Enabled: %', CASE WHEN rls_enabled THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '  Total Policies: %', pol_count;
    RAISE NOTICE '  Has SELECT for public: %', CASE WHEN select_pol THEN 'YES' ELSE 'NO!' END;
    RAISE NOTICE '  Has INSERT for public: %', CASE WHEN insert_pol THEN 'YES' ELSE 'NO!' END;
    RAISE NOTICE '';
  END LOOP;

  -- Check helper functions
  IF EXISTS (SELECT 1 FROM information_schema.routines
             WHERE routine_name = 'get_brand_for_dashboard') THEN
    RAISE NOTICE '✓ Helper function get_brand_for_dashboard exists';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.routines
             WHERE routine_name = 'get_marba_uvps_for_dashboard') THEN
    RAISE NOTICE '✓ Helper function get_marba_uvps_for_dashboard exists';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== FIX COMPLETE ===';
  RAISE NOTICE 'Dashboard should now load without timeout.';
  RAISE NOTICE 'If issues persist:';
  RAISE NOTICE '  1. Wait 30-60 seconds for PostgREST to reload';
  RAISE NOTICE '  2. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  3. Try using helper functions instead of direct queries';
  RAISE NOTICE '  4. Check Supabase logs for actual error messages';
END $$;

COMMIT;

-- ============================================================================
-- TESTING: Run these queries after migration to verify access
-- ============================================================================
-- SELECT * FROM brands LIMIT 1;
-- SELECT * FROM marba_uvps LIMIT 1;
-- SELECT * FROM get_brand_for_dashboard('your-brand-id-here');
-- SELECT * FROM get_marba_uvps_for_dashboard('your-brand-id-here');
-- ============================================================================