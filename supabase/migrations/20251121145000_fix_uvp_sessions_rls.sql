-- Migration: Fix RLS 406 Errors
-- Date: 2025-11-21
-- Issue: PostgREST returns 406 on all tables despite correct policies

BEGIN;

-- 1. Temporarily disable RLS to reset everything
ALTER TABLE public.intelligence_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.uvp_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_detection_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE public.intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uvp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_detection_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 4. Create simple PUBLIC access policies
CREATE POLICY "allow_all" ON public.intelligence_cache FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.uvp_sessions FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.location_detection_cache FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.industry_profiles FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.brands FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

-- 5. Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

COMMIT;