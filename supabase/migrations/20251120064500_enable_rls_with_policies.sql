-- Enable RLS with proper security policies
-- User requirement: "Reenable RLS and fix this properly. we are not relaxing security."
--
-- Security model:
-- - Users can only access data for brands they own (via brands.user_id)
-- - Industry profiles are public reference data
-- - Location cache is public read, authenticated write

-- =============================================================================
-- 1. MARBA_UVPS - User's UVP data
-- =============================================================================

-- Enable RLS
ALTER TABLE public.marba_uvps ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can insert their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can update their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can delete their own UVPs" ON public.marba_uvps;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own UVPs"
  ON public.marba_uvps
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own UVPs"
  ON public.marba_uvps
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own UVPs"
  ON public.marba_uvps
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own UVPs"
  ON public.marba_uvps
  FOR DELETE
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 2. UVP_SESSIONS - User's session data
-- =============================================================================

-- Enable RLS
ALTER TABLE public.uvp_sessions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.uvp_sessions;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own sessions"
  ON public.uvp_sessions
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sessions"
  ON public.uvp_sessions
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sessions"
  ON public.uvp_sessions
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own sessions"
  ON public.uvp_sessions
  FOR DELETE
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. LOCATION_DETECTION_CACHE - Public read, authenticated write
-- =============================================================================

-- Enable RLS
ALTER TABLE public.location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can insert cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can update cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Service role can delete expired cache" ON public.location_detection_cache;

-- Public read access (it's a cache for performance)
CREATE POLICY "Anyone can view location cache"
  ON public.location_detection_cache
  FOR SELECT
  USING (true);

-- Authenticated users can write to cache
CREATE POLICY "Authenticated users can insert cache"
  ON public.location_detection_cache
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update cache"
  ON public.location_detection_cache
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Service role can clean up expired entries
CREATE POLICY "Service role can delete expired cache"
  ON public.location_detection_cache
  FOR DELETE
  USING (auth.role() = 'service_role' OR expires_at < NOW());

-- =============================================================================
-- 4. INDUSTRY_PROFILES - Public read, authenticated users can write (on-demand generation)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.industry_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view industry profiles" ON public.industry_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.industry_profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON public.industry_profiles;
DROP POLICY IF EXISTS "Service role can delete profiles" ON public.industry_profiles;

-- Public read access (reference data)
CREATE POLICY "Anyone can view industry profiles"
  ON public.industry_profiles
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can write (for on-demand profile generation during onboarding)
CREATE POLICY "Authenticated users can insert profiles"
  ON public.industry_profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update profiles"
  ON public.industry_profiles
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Only service role can delete (cleanup)
CREATE POLICY "Service role can delete profiles"
  ON public.industry_profiles
  FOR DELETE
  USING (auth.role() = 'service_role');

-- =============================================================================
-- Force schema cache refresh
-- =============================================================================

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- Verification queries (commented out - for manual testing)
-- =============================================================================

-- Test as authenticated user:
-- SELECT * FROM marba_uvps; -- Should only show user's own UVPs
-- SELECT * FROM uvp_sessions; -- Should only show user's own sessions
-- SELECT * FROM location_detection_cache; -- Should show all cache entries
-- SELECT * FROM industry_profiles WHERE is_active = true; -- Should show all active profiles

-- Test insert as authenticated user:
-- INSERT INTO marba_uvps (brand_id, ...) VALUES ((SELECT id FROM brands WHERE user_id = auth.uid() LIMIT 1), ...);
