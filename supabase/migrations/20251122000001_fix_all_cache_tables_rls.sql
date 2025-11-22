-- Migration: Fix RLS for all cache tables
-- Date: 2025-11-22
-- Issue: Cache tables have RLS enabled but no policies, causing 400 errors
-- Solution: Add permissive policies for cache tables that don't contain sensitive data

BEGIN;

-- ============================================================================
-- 1. Fix location_detection_cache table
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations for location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "allow_all" ON public.location_detection_cache;

-- Create permissive policy for location cache (non-sensitive cached data)
CREATE POLICY "Public read access for location cache"
ON public.location_detection_cache
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert location cache"
ON public.location_detection_cache
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Service role can manage location cache"
ON public.location_detection_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. Fix intelligence_cache table if it exists
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'intelligence_cache') THEN

        -- Enable RLS
        EXECUTE 'ALTER TABLE public.intelligence_cache ENABLE ROW LEVEL SECURITY';

        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "allow_all" ON public.intelligence_cache';

        -- Create new policies
        EXECUTE 'CREATE POLICY "Public read access for intelligence cache"
                 ON public.intelligence_cache
                 FOR SELECT
                 TO public
                 USING (true)';

        EXECUTE 'CREATE POLICY "Authenticated users can write intelligence cache"
                 ON public.intelligence_cache
                 FOR INSERT
                 TO authenticated, service_role
                 WITH CHECK (true)';

        EXECUTE 'CREATE POLICY "Service role full access"
                 ON public.intelligence_cache
                 FOR ALL
                 TO service_role
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- ============================================================================
-- 3. Fix industry_profiles table if it exists
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'industry_profiles') THEN

        -- Enable RLS
        EXECUTE 'ALTER TABLE public.industry_profiles ENABLE ROW LEVEL SECURITY';

        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "allow_all" ON public.industry_profiles';

        -- Create new policies - industry profiles are public data
        EXECUTE 'CREATE POLICY "Public read access for industry profiles"
                 ON public.industry_profiles
                 FOR SELECT
                 TO public
                 USING (true)';

        EXECUTE 'CREATE POLICY "Service role can manage industry profiles"
                 ON public.industry_profiles
                 FOR ALL
                 TO service_role
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- ============================================================================
-- 4. Ensure proper grants
-- ============================================================================

GRANT SELECT ON public.location_detection_cache TO anon, authenticated;
GRANT INSERT ON public.location_detection_cache TO authenticated, service_role;
GRANT ALL ON public.location_detection_cache TO service_role;

-- Grant usage on sequences if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'location_detection_cache_id_seq') THEN
        GRANT USAGE ON SEQUENCE public.location_detection_cache_id_seq TO authenticated, service_role;
    END IF;
END $$;

-- ============================================================================
-- 5. Add index for performance on cache lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_location_cache_domain
ON public.location_detection_cache(cache_key, expires_at);

CREATE INDEX IF NOT EXISTS idx_location_cache_expires
ON public.location_detection_cache(expires_at)
WHERE expires_at > NOW();

-- ============================================================================
-- 5.5. Fix brand_eq_scores table
-- ============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'brand_eq_scores') THEN

        -- Enable RLS
        EXECUTE 'ALTER TABLE public.brand_eq_scores ENABLE ROW LEVEL SECURITY';

        -- Drop existing policies
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'brand_eq_scores'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON brand_eq_scores', pol.policyname);
        END LOOP;

        -- Create policy for users to manage their own brand EQ scores
        EXECUTE 'CREATE POLICY "Users manage own brand EQ scores"
                 ON public.brand_eq_scores
                 FOR ALL
                 TO authenticated
                 USING (
                     EXISTS (
                         SELECT 1 FROM brands
                         WHERE brands.id = brand_eq_scores.brand_id
                         AND brands.user_id = auth.uid()
                     )
                 )
                 WITH CHECK (
                     EXISTS (
                         SELECT 1 FROM brands
                         WHERE brands.id = brand_eq_scores.brand_id
                         AND brands.user_id = auth.uid()
                     )
                 )';

        -- Service role full access
        EXECUTE 'CREATE POLICY "Service role full access to EQ scores"
                 ON public.brand_eq_scores
                 FOR ALL
                 TO service_role
                 USING (true)
                 WITH CHECK (true)';
    END IF;
END $$;

-- ============================================================================
-- 6. Optional: Add a function to clean expired cache entries
-- ============================================================================

CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.location_detection_cache
    WHERE expires_at < NOW();

    -- Clean other cache tables if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'intelligence_cache') THEN
        EXECUTE 'DELETE FROM public.intelligence_cache WHERE expires_at < NOW()';
    END IF;
END;
$$;

-- Grant execute permission on the cleanup function
GRANT EXECUTE ON FUNCTION public.clean_expired_cache() TO service_role;

COMMIT;

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';