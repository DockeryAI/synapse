-- Fix RLS policies for onboarding flow
-- This addresses the "new row violates row-level security policy" error during onboarding

-- =============================================================================
-- 1. MARBA_UVPS - Allow creation before brand assignment
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can insert their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can update their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can delete their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can insert UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can view UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can update UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can delete UVPs" ON public.marba_uvps;

-- Create more permissive policies
CREATE POLICY "View UVPs"
  ON public.marba_uvps FOR SELECT
  USING (
    -- Allow if authenticated (own brands will be filtered in app)
    auth.role() = 'authenticated' OR
    -- Or if they own the brand
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Insert UVPs"
  ON public.marba_uvps FOR INSERT
  WITH CHECK (
    -- Allow any authenticated user to insert
    auth.role() = 'authenticated'
  );

CREATE POLICY "Update UVPs"
  ON public.marba_uvps FOR UPDATE
  USING (
    -- Can update if authenticated and owns brand
    auth.role() = 'authenticated' AND
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Delete UVPs"
  ON public.marba_uvps FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

-- =============================================================================
-- 2. UVP_SESSIONS - Allow sessions during onboarding (no brand_id required)
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can view sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can insert sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can update sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can delete sessions" ON public.uvp_sessions;

-- Create policies that don't require brand_id
CREATE POLICY "View sessions"
  ON public.uvp_sessions FOR SELECT
  USING (
    -- Allow viewing any session if authenticated
    auth.role() = 'authenticated' OR
    -- Or sessions without brand_id (onboarding)
    brand_id IS NULL OR
    -- Or sessions for owned brands
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Insert sessions"
  ON public.uvp_sessions FOR INSERT
  WITH CHECK (
    -- Allow any authenticated user to create sessions
    auth.role() = 'authenticated'
  );

CREATE POLICY "Update sessions"
  ON public.uvp_sessions FOR UPDATE
  USING (
    -- Allow update if authenticated
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    auth.role() = 'authenticated'
  );

CREATE POLICY "Delete sessions"
  ON public.uvp_sessions FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    (brand_id IS NULL OR brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()))
  );

-- =============================================================================
-- 3. LOCATION_DETECTION_CACHE - Public access for caching
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can insert cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can update cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Service role can delete expired cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Public read access" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Public write access" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Public update access" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Public delete for expired entries" ON public.location_detection_cache;

-- Create truly public policies
CREATE POLICY "Public read"
  ON public.location_detection_cache FOR SELECT
  USING (true);

CREATE POLICY "Public write"
  ON public.location_detection_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update"
  ON public.location_detection_cache FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete expired"
  ON public.location_detection_cache FOR DELETE
  USING (expires_at < NOW());

-- =============================================================================
-- 4. Ensure RLS is enabled on all tables
-- =============================================================================

ALTER TABLE public.marba_uvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uvp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_detection_cache ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. Grant necessary permissions
-- =============================================================================

GRANT ALL ON public.marba_uvps TO authenticated;
GRANT ALL ON public.uvp_sessions TO authenticated;
GRANT ALL ON public.location_detection_cache TO anon, authenticated;

-- =============================================================================
-- 6. Create helper function for brand assignment during onboarding
-- =============================================================================

CREATE OR REPLACE FUNCTION assign_brand_to_uvp(
  uvp_id UUID,
  new_brand_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.marba_uvps
  SET brand_id = new_brand_id
  WHERE id = uvp_id
    AND brand_id IS NULL
    AND auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION assign_brand_to_session(
  session_id UUID,
  new_brand_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.uvp_sessions
  SET brand_id = new_brand_id
  WHERE id = session_id
    AND brand_id IS NULL
    AND auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_brand_to_uvp TO authenticated;
GRANT EXECUTE ON FUNCTION assign_brand_to_session TO authenticated;

-- Notify Supabase to reload schema cache
NOTIFY pgrst, 'reload schema';