-- TEMPORARY: Disable authentication requirement for development
-- WARNING: This is NOT production-safe! Remove before going to production!
-- Date: 2025-11-22
-- Purpose: Allow testing without login functionality

BEGIN;

-- ============================================================================
-- 1. Fix marba_uvps to allow anonymous access temporarily
-- ============================================================================

-- Drop all existing policies on marba_uvps
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'marba_uvps'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON marba_uvps', pol.policyname);
    END LOOP;
END $$;

-- Create temporary permissive policy for development
-- IMPORTANT: This allows ANY user (even anonymous) to manage UVPs
CREATE POLICY "TEMP_DEV_ONLY_allow_all_access"
ON public.marba_uvps
FOR ALL
TO public  -- Allow even anonymous users
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. Fix brand_eq_scores similarly
-- ============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'brand_eq_scores') THEN

        -- Drop existing policies
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'brand_eq_scores'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON brand_eq_scores', pol.policyname);
        END LOOP;

        -- Create permissive policy
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_eq_scores"
                 ON public.brand_eq_scores
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- ============================================================================
-- 3. Fix location_detection_cache
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can insert location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Service role can manage location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "allow_all" ON public.location_detection_cache;

-- Create permissive policy for development
CREATE POLICY "TEMP_DEV_ONLY_allow_all_cache"
ON public.location_detection_cache
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 4. Fix uvp_sessions
-- ============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'uvp_sessions') THEN

        -- Drop existing policies
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'uvp_sessions'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON uvp_sessions', pol.policyname);
        END LOOP;

        -- Create permissive policy
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_sessions"
                 ON public.uvp_sessions
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- ============================================================================
-- 5. Fix brands table to allow anonymous creation
-- ============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop existing policies on brands
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'brands'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON brands', pol.policyname);
    END LOOP;
END $$;

-- Create permissive policy for brands
CREATE POLICY "TEMP_DEV_ONLY_allow_all_brands"
ON public.brands
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 6. Grant necessary permissions to public/anon roles
-- ============================================================================

-- Grant all permissions on critical tables to anon/public
GRANT ALL ON public.marba_uvps TO anon, public;
GRANT ALL ON public.brands TO anon, public;
GRANT ALL ON public.uvp_sessions TO anon, public;
GRANT ALL ON public.location_detection_cache TO anon, public;

-- Grant sequence permissions if they exist
DO $$
BEGIN
    -- Try to grant permissions on sequences
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public') THEN
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, public;
    END IF;
END $$;

-- ============================================================================
-- 7. Add a warning comment to the schema
-- ============================================================================

COMMENT ON POLICY "TEMP_DEV_ONLY_allow_all_access" ON public.marba_uvps IS
'⚠️ DEVELOPMENT ONLY - This policy allows ALL access without authentication. MUST be removed before production!';

COMMENT ON POLICY "TEMP_DEV_ONLY_allow_all_brands" ON public.brands IS
'⚠️ DEVELOPMENT ONLY - This policy allows ALL access without authentication. MUST be removed before production!';

COMMIT;

-- Force PostgREST to reload
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- IMPORTANT REMINDER:
-- ============================================================================
-- This migration creates HIGHLY INSECURE policies that allow:
-- 1. Anonymous users to create and modify ANY data
-- 2. No ownership verification
-- 3. No authentication requirements
--
-- Before going to production, you MUST:
-- 1. Delete this migration
-- 2. Run the proper production RLS migration
-- 3. Implement proper authentication
-- ============================================================================