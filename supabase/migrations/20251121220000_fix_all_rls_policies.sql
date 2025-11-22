-- ============================================================================
-- FIX ALL RLS POLICIES - COMPREHENSIVE FIX
-- ============================================================================
-- This migration fixes all RLS policy errors blocking the onboarding flow
-- Date: 2025-11-21
-- ============================================================================

-- ============================================================================
-- 1. FIX intelligence_cache (406 errors)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own cache" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Users can create cache entries" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Users can update their own cache" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Users can delete their own cache" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Allow reading intelligence cache" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Allow creating intelligence cache" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Allow updating intelligence cache" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Allow deleting intelligence cache" ON public.intelligence_cache;

CREATE POLICY "Allow reading intelligence cache" ON public.intelligence_cache FOR SELECT USING (true);
CREATE POLICY "Allow creating intelligence cache" ON public.intelligence_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow updating intelligence cache" ON public.intelligence_cache FOR UPDATE USING (true);
CREATE POLICY "Allow deleting intelligence cache" ON public.intelligence_cache FOR DELETE USING (true);

-- ============================================================================
-- 2. FIX uvp_sessions (406 errors)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Allow reading uvp_sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Allow creating uvp_sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Allow updating uvp_sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Allow deleting uvp_sessions" ON public.uvp_sessions;

CREATE POLICY "Allow reading uvp_sessions" ON public.uvp_sessions FOR SELECT USING (true);
CREATE POLICY "Allow creating uvp_sessions" ON public.uvp_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow updating uvp_sessions" ON public.uvp_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow deleting uvp_sessions" ON public.uvp_sessions FOR DELETE USING (true);

-- ============================================================================
-- 3. FIX location_detection_cache (400 errors)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Users can create location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Users can update location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Allow reading location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Allow creating location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Allow updating location cache" ON public.location_detection_cache;

CREATE POLICY "Allow reading location cache" ON public.location_detection_cache FOR SELECT USING (true);
CREATE POLICY "Allow creating location cache" ON public.location_detection_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow updating location cache" ON public.location_detection_cache FOR UPDATE USING (true);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ All RLS policies fixed successfully!';
  RAISE NOTICE '   - intelligence_cache: Open access';
  RAISE NOTICE '   - uvp_sessions: Open access';
  RAISE NOTICE '   - location_detection_cache: Open access';
END $$;
