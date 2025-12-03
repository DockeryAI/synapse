-- ============================================================================
-- FIX PROFILE SAVE ERRORS
-- ============================================================================
-- Run this in your Supabase SQL Editor to fix both schema and RLS issues
--
-- Fixes:
-- 1. PGRST204 - Missing columns in schema
-- 2. RLS policies blocking INSERT/UPDATE for anon users
-- ============================================================================

-- Step 1: Add missing columns if they don't exist
-- (These are safe to run multiple times - will skip if column exists)

-- Add avoid_words if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'industry_profiles'
    AND column_name = 'avoid_words'
  ) THEN
    ALTER TABLE industry_profiles ADD COLUMN avoid_words TEXT[];
    RAISE NOTICE 'Added avoid_words column';
  ELSE
    RAISE NOTICE 'avoid_words column already exists';
  END IF;
END $$;

-- Add generated_on_demand if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'industry_profiles'
    AND column_name = 'generated_on_demand'
  ) THEN
    ALTER TABLE industry_profiles ADD COLUMN generated_on_demand BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added generated_on_demand column';
  ELSE
    RAISE NOTICE 'generated_on_demand column already exists';
  END IF;
END $$;

-- Add generated_at if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'industry_profiles'
    AND column_name = 'generated_at'
  ) THEN
    ALTER TABLE industry_profiles ADD COLUMN generated_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added generated_at column';
  ELSE
    RAISE NOTICE 'generated_at column already exists';
  END IF;
END $$;

-- Step 2: Fix RLS policies to allow writes
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view industry profiles" ON industry_profiles;
DROP POLICY IF EXISTS "Service role can manage industry profiles" ON industry_profiles;

-- Disable RLS temporarily (for demo mode - re-enable for production with proper policies)
ALTER TABLE industry_profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated users
GRANT SELECT, INSERT, UPDATE ON industry_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON industry_profiles TO authenticated;

-- Step 3: Also fix cache tables while we're at it
ALTER TABLE IF EXISTS intelligence_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS location_detection_cache DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_cache TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON location_detection_cache TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON location_detection_cache TO authenticated;

-- Step 4: Verify the fix
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'industry_profiles'
  AND column_name IN ('avoid_words', 'generated_on_demand', 'generated_at')
ORDER BY column_name;

-- Show RLS status
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('industry_profiles', 'intelligence_cache', 'location_detection_cache')
ORDER BY tablename;

-- Show permissions
SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('industry_profiles', 'intelligence_cache', 'location_detection_cache')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
