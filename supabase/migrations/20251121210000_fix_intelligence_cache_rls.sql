-- ============================================================================
-- FIX INTELLIGENCE CACHE RLS - Allow Anonymous Access
-- ============================================================================
-- Created: 2025-11-21
-- Purpose: Fix RLS policies to allow anonymous users to cache intelligence data
-- Issue: Previous policies blocked anon users causing 406 errors and forcing rebuilds
-- ============================================================================

-- First, ensure the table exists and RLS is enabled
ALTER TABLE IF EXISTS public.intelligence_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own cache" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Users can create cache entries" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Users can update their own cache" ON public.intelligence_cache;
DROP POLICY IF EXISTS "Users can delete their own cache" ON public.intelligence_cache;

-- Create new permissive policies for anonymous access
-- This is safe for a cache table as it's just temporary data

-- SELECT: Anyone can read cache entries
CREATE POLICY "Allow reading intelligence cache"
  ON public.intelligence_cache
  FOR SELECT
  USING (true);

-- INSERT: Anyone can create cache entries
CREATE POLICY "Allow creating intelligence cache"
  ON public.intelligence_cache
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: Anyone can update cache entries
CREATE POLICY "Allow updating intelligence cache"
  ON public.intelligence_cache
  FOR UPDATE
  USING (true);

-- DELETE: Anyone can delete cache entries
CREATE POLICY "Allow deleting intelligence cache"
  ON public.intelligence_cache
  FOR DELETE
  USING (true);

-- Grant permissions to all roles
GRANT ALL ON public.intelligence_cache TO anon;
GRANT ALL ON public.intelligence_cache TO authenticated;
GRANT ALL ON public.intelligence_cache TO service_role;

-- Ensure sequence permissions if there's an ID column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_cache'
    AND column_name = 'id'
    AND column_default LIKE 'nextval%'
  ) THEN
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';
  END IF;
END $$;

-- Add index for better performance on cache lookups
CREATE INDEX IF NOT EXISTS idx_intelligence_cache_key
  ON public.intelligence_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_intelligence_cache_expires
  ON public.intelligence_cache(expires_at);

-- Add comment explaining the security model
COMMENT ON TABLE public.intelligence_cache IS
  'Temporary cache for intelligence API responses. Permissive RLS allows anonymous access for demo/development.';