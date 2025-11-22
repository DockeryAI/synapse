-- TEMPORARY: Disable ALL authentication requirements for development
-- WARNING: This is NOT production-safe! Remove before going to production!
-- Date: 2025-11-22
-- Purpose: Fix dashboard 401 errors by allowing anonymous access to all tables

BEGIN;

-- ============================================================================
-- Helper function to drop all policies on a table
-- ============================================================================
CREATE OR REPLACE FUNCTION drop_all_policies_on_table(table_name text)
RETURNS void AS $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = table_name
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. Core tables - marba_uvps, brands, uvp_sessions
-- ============================================================================

-- marba_uvps
SELECT drop_all_policies_on_table('marba_uvps');
CREATE POLICY "TEMP_DEV_ONLY_allow_all_access"
ON public.marba_uvps
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- brands
SELECT drop_all_policies_on_table('brands');
CREATE POLICY "TEMP_DEV_ONLY_allow_all_brands"
ON public.brands
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- uvp_sessions
SELECT drop_all_policies_on_table('uvp_sessions');
CREATE POLICY "TEMP_DEV_ONLY_allow_all_sessions"
ON public.uvp_sessions
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. Cache tables
-- ============================================================================

-- location_detection_cache
SELECT drop_all_policies_on_table('location_detection_cache');
CREATE POLICY "TEMP_DEV_ONLY_allow_all_location_cache"
ON public.location_detection_cache
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 3. Intelligence and analysis tables (likely causing dashboard issues)
-- ============================================================================

-- brand_eq_scores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'brand_eq_scores') THEN
        PERFORM drop_all_policies_on_table('brand_eq_scores');
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_eq_scores"
                 ON public.brand_eq_scores
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- intelligence_cache
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'intelligence_cache') THEN
        PERFORM drop_all_policies_on_table('intelligence_cache');
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_intelligence"
                 ON public.intelligence_cache
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- industry_profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'industry_profiles') THEN
        PERFORM drop_all_policies_on_table('industry_profiles');
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_industry"
                 ON public.industry_profiles
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- synapse_generations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'synapse_generations') THEN
        PERFORM drop_all_policies_on_table('synapse_generations');
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_synapse"
                 ON public.synapse_generations
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- content_generations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'content_generations') THEN
        PERFORM drop_all_policies_on_table('content_generations');
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_content"
                 ON public.content_generations
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- campaigns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'campaigns') THEN
        PERFORM drop_all_policies_on_table('campaigns');
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_campaigns"
                 ON public.campaigns
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- campaign_content
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'campaign_content') THEN
        PERFORM drop_all_policies_on_table('campaign_content');
        EXECUTE 'CREATE POLICY "TEMP_DEV_ONLY_allow_all_campaign_content"
                 ON public.campaign_content
                 FOR ALL
                 TO public
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- ============================================================================
-- 4. Grant comprehensive permissions to public/anon roles
-- ============================================================================

-- Core tables
GRANT ALL ON public.marba_uvps TO anon, public;
GRANT ALL ON public.brands TO anon, public;
GRANT ALL ON public.uvp_sessions TO anon, public;
GRANT ALL ON public.location_detection_cache TO anon, public;

-- Optional tables (only grant if they exist)
DO $$
BEGIN
    -- brand_eq_scores
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'brand_eq_scores') THEN
        EXECUTE 'GRANT ALL ON public.brand_eq_scores TO anon, public';
    END IF;

    -- intelligence_cache
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'intelligence_cache') THEN
        EXECUTE 'GRANT ALL ON public.intelligence_cache TO anon, public';
    END IF;

    -- industry_profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'industry_profiles') THEN
        EXECUTE 'GRANT ALL ON public.industry_profiles TO anon, public';
    END IF;

    -- synapse_generations
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'synapse_generations') THEN
        EXECUTE 'GRANT ALL ON public.synapse_generations TO anon, public';
    END IF;

    -- content_generations
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'content_generations') THEN
        EXECUTE 'GRANT ALL ON public.content_generations TO anon, public';
    END IF;

    -- campaigns
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
        EXECUTE 'GRANT ALL ON public.campaigns TO anon, public';
    END IF;

    -- campaign_content
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'campaign_content') THEN
        EXECUTE 'GRANT ALL ON public.campaign_content TO anon, public';
    END IF;
END $$;

-- Grant usage on ALL sequences to anon/public
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, public;

-- Grant execute on ALL functions to anon/public (needed for some dashboard queries)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, public;

-- ============================================================================
-- 5. Clean up helper function
-- ============================================================================
DROP FUNCTION IF EXISTS drop_all_policies_on_table(text);

-- ============================================================================
-- 6. Force PostgREST to reload
-- ============================================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- CRITICAL WARNINGS:
-- ============================================================================
-- This migration creates EXTREMELY INSECURE policies that allow:
-- 1. Anonymous users to read/write/delete ANY data in ANY table
-- 2. No authentication or authorization checks whatsoever
-- 3. Complete bypass of all security measures
--
-- This is ONLY for development when you don't have authentication set up yet.
--
-- Before going to production, you MUST:
-- 1. Delete this migration file
-- 2. Re-run the proper production RLS migrations
-- 3. Implement proper authentication and authorization
-- 4. Test all security policies thoroughly
-- ============================================================================