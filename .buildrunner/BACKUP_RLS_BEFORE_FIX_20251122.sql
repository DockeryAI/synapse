-- =====================================================
-- RLS POLICY BACKUP - BEFORE FIXING 406/400 ERRORS
-- Date: 2025-11-22
-- Purpose: Backup current RLS policies so we can restore if fixes break anything
--
-- TO RESTORE: Run this file against your database
-- =====================================================

-- First, get current RLS status
-- Run this to verify current state:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes');

-- =====================================================
-- BACKUP: intelligence_cache policies
-- =====================================================

-- Drop existing policies (will be recreated with backed-up versions)
-- DROP POLICY IF EXISTS "Users can read own intelligence_cache" ON intelligence_cache;
-- DROP POLICY IF EXISTS "Users can insert own intelligence_cache" ON intelligence_cache;
-- DROP POLICY IF EXISTS "Users can update own intelligence_cache" ON intelligence_cache;

-- Current policies for intelligence_cache:
-- (These will be generated from the database)

-- =====================================================
-- BACKUP: industry_profiles policies
-- =====================================================

-- Drop existing policies (will be recreated with backed-up versions)
-- DROP POLICY IF EXISTS "Public read for industry_profiles" ON industry_profiles;
-- DROP POLICY IF EXISTS "Users can read industry_profiles" ON industry_profiles;

-- Current policies for industry_profiles:
-- (These will be generated from the database)

-- =====================================================
-- BACKUP: naics_codes policies
-- =====================================================

-- Drop existing policies (will be recreated with backed-up versions)
-- DROP POLICY IF EXISTS "Public read for naics_codes" ON naics_codes;
-- DROP POLICY IF EXISTS "Users can read naics_codes" ON naics_codes;

-- Current policies for naics_codes:
-- (These will be generated from the database)

-- =====================================================
-- QUERY TO EXTRACT CURRENT POLICIES
-- Run this in Supabase SQL Editor to get actual policy definitions:
-- =====================================================

SELECT
  'CREATE POLICY "' || policyname || '" ON ' || tablename ||
  ' FOR ' || cmd ||
  CASE
    WHEN roles IS NOT NULL THEN ' TO ' || array_to_string(roles, ', ')
    ELSE ''
  END ||
  CASE
    WHEN qual IS NOT NULL THEN ' USING (' || pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) || ')'
    ELSE ''
  END ||
  CASE
    WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass) || ')'
    ELSE ''
  END || ';' AS policy_definition
FROM pg_policies
WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes')
ORDER BY tablename, policyname;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================

-- If the fixes break something:
-- 1. Copy the policy definitions from the query above
-- 2. Replace the commented sections above with actual CREATE POLICY statements
-- 3. Run this file against your database
-- 4. Verify with: SELECT * FROM pg_policies WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes');

-- =====================================================
-- RLS STATUS CHECK
-- =====================================================

-- After restore, verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes');
