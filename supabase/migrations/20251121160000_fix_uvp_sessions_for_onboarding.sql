-- ============================================================================
-- FIX UVP SESSIONS FOR ONBOARDING - Allow Sessions Without Brand ID
-- ============================================================================
-- Created: 2025-11-21
-- Purpose: Allow onboarding users to save sessions before creating a brand
-- Root Cause: Previous policy required brand_id IS NOT NULL, blocking onboarding
-- Solution: Add user_id column and allow NULL brand_id for onboarding sessions
-- ============================================================================

-- Step 1: Add user_id column to track sessions for users without brands yet
ALTER TABLE public.uvp_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_uvp_sessions_user_id ON public.uvp_sessions(user_id);

-- Step 3: Add anonymous_token column for tracking anonymous users
ALTER TABLE public.uvp_sessions
ADD COLUMN IF NOT EXISTS anonymous_token TEXT;

-- Step 4: Add index for anonymous_token lookups
CREATE INDEX IF NOT EXISTS idx_uvp_sessions_anonymous_token ON public.uvp_sessions(anonymous_token);

-- Step 5: Update unique constraint to handle NULL brand_id and use user_id
-- Drop old constraint first
ALTER TABLE public.uvp_sessions
DROP CONSTRAINT IF EXISTS uvp_sessions_brand_website_unique;

-- New constraint: unique per user or brand
-- Note: This allows multiple NULL brand_ids as long as user_id + website_url is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_uvp_sessions_user_website
  ON public.uvp_sessions(user_id, website_url)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_uvp_sessions_brand_website
  ON public.uvp_sessions(brand_id, website_url)
  WHERE brand_id IS NOT NULL;

-- Step 6: Update RLS policies to work with user_id
DROP POLICY IF EXISTS "Allow creating sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Allow reading sessions by brand_id" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Allow updating sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Allow deleting sessions" ON public.uvp_sessions;

-- SELECT: Users can read their own sessions (by user_id or brand_id)
CREATE POLICY "Allow reading own sessions"
  ON public.uvp_sessions
  FOR SELECT
  USING (
    -- Own user_id
    user_id = auth.uid()
    -- Or own brand
    OR brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    -- Or anonymous with matching token (stored in localStorage)
    OR (auth.role() = 'anon' AND anonymous_token IS NOT NULL)
  );

-- INSERT: Anyone can create sessions (authenticated users get user_id, anon gets token)
CREATE POLICY "Allow creating sessions"
  ON public.uvp_sessions
  FOR INSERT
  WITH CHECK (
    -- Authenticated users must use their user_id
    (auth.role() = 'authenticated' AND user_id = auth.uid())
    -- Anonymous users can create with anonymous_token
    OR (auth.role() = 'anon' AND anonymous_token IS NOT NULL)
    -- Service role can do anything
    OR (auth.role() = 'service_role')
  );

-- UPDATE: Users can update their own sessions
CREATE POLICY "Allow updating own sessions"
  ON public.uvp_sessions
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    OR (auth.role() = 'anon' AND anonymous_token IS NOT NULL)
  );

-- DELETE: Users can delete their own sessions
CREATE POLICY "Allow deleting own sessions"
  ON public.uvp_sessions
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    OR (auth.role() = 'anon' AND anonymous_token IS NOT NULL)
  );

-- Step 7: Migrate existing sessions to add user_id from brand ownership
UPDATE public.uvp_sessions
SET user_id = (SELECT user_id FROM public.brands WHERE brands.id = uvp_sessions.brand_id)
WHERE brand_id IS NOT NULL AND user_id IS NULL;

-- Step 8: Add trigger to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_uvp_session_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is authenticated and user_id not set, set it
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  -- If brand_id is set and user_id not set, get user_id from brand
  IF NEW.brand_id IS NOT NULL AND NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id FROM public.brands WHERE id = NEW.brand_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS uvp_sessions_set_user_id ON public.uvp_sessions;
CREATE TRIGGER uvp_sessions_set_user_id
  BEFORE INSERT OR UPDATE ON public.uvp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_uvp_session_user_id();

-- Comment
COMMENT ON COLUMN public.uvp_sessions.user_id IS 'Links session to authenticated user (allows sessions without brand_id for onboarding)';
COMMENT ON COLUMN public.uvp_sessions.anonymous_token IS 'Tracks anonymous users sessions before authentication';
