-- Fix RLS policies to allow authenticated users to save UVPs and sessions
-- This addresses the "new row violates row-level security policy" error

-- =============================================================================
-- 1. Fix MARBA_UVPS policies - allow creation without strict brand check
-- =============================================================================

-- Drop ALL existing policies (including the new ones we tried to create)
DROP POLICY IF EXISTS "Users can view their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can insert their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can update their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can delete their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can insert UVPs" ON public.marba_uvps;

-- More permissive policies for development/testing
CREATE POLICY "Users can view their own UVPs"
  ON public.marba_uvps FOR SELECT
  USING (
    -- Allow if user owns the brand OR if no auth (for anon users during onboarding)
    auth.uid() IS NULL OR
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert UVPs"
  ON public.marba_uvps FOR INSERT
  WITH CHECK (
    -- Allow authenticated users to insert (they might create brand later)
    -- OR allow if they own the brand
    auth.role() = 'authenticated' OR
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own UVPs"
  ON public.marba_uvps FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  )
  WITH CHECK (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own UVPs"
  ON public.marba_uvps FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

-- =============================================================================
-- 2. Fix UVP_SESSIONS policies - allow session creation during onboarding
-- =============================================================================

-- Drop ALL existing policies (including variants)
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can view sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can insert sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can update sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can delete sessions" ON public.uvp_sessions;

-- Allow session creation even without brand_id (for onboarding flow)
CREATE POLICY "Users can view sessions"
  ON public.uvp_sessions FOR SELECT
  USING (
    -- Allow viewing sessions without brand_id OR sessions for owned brands
    brand_id IS NULL OR
    auth.uid() IS NULL OR
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert sessions"
  ON public.uvp_sessions FOR INSERT
  WITH CHECK (
    -- Allow any authenticated user to create sessions
    -- Sessions can be created before brand assignment
    auth.role() = 'authenticated' OR
    brand_id IS NULL OR
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update sessions"
  ON public.uvp_sessions FOR UPDATE
  USING (
    -- Can update if no brand_id OR if user owns the brand
    brand_id IS NULL OR
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  )
  WITH CHECK (
    brand_id IS NULL OR
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete sessions"
  ON public.uvp_sessions FOR DELETE
  USING (
    brand_id IS NULL OR
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

-- =============================================================================
-- 3. Fix LOCATION_DETECTION_CACHE - fix column structure issue
-- =============================================================================

-- First, check if the domain column exists, if not add it
ALTER TABLE public.location_detection_cache
  ADD COLUMN IF NOT EXISTS domain TEXT;

-- Create index on domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_location_cache_domain
  ON public.location_detection_cache(domain);

-- Update the unique constraint to use domain if needed
ALTER TABLE public.location_detection_cache
  DROP CONSTRAINT IF EXISTS location_detection_cache_cache_key_key;

-- Make cache_key nullable since we might use domain instead
ALTER TABLE public.location_detection_cache
  ALTER COLUMN cache_key DROP NOT NULL;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can view location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can insert cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can update cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Service role can delete expired cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Public read access" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Public write access" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Public update access" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Public delete for expired entries" ON public.location_detection_cache;

CREATE POLICY "Public read access"
  ON public.location_detection_cache FOR SELECT
  USING (true);

CREATE POLICY "Public write access"
  ON public.location_detection_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access"
  ON public.location_detection_cache FOR UPDATE
  USING (true);

CREATE POLICY "Public delete for expired entries"
  ON public.location_detection_cache FOR DELETE
  USING (expires_at < NOW());

-- =============================================================================
-- 4. Ensure brands table has proper permissions
-- =============================================================================

-- Check if RLS is enabled on brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can create brands" ON public.brands;
DROP POLICY IF EXISTS "Users can update own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can delete own brands" ON public.brands;

-- Create policies for brands
CREATE POLICY "Users can view own brands"
  ON public.brands FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create brands"
  ON public.brands FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own brands"
  ON public.brands FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own brands"
  ON public.brands FOR DELETE
  USING (user_id = auth.uid());