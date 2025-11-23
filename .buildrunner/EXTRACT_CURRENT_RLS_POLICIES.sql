-- =====================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO BACKUP CURRENT POLICIES
-- =====================================================
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/jpwljchikgmggjidogon/editor
-- 2. Run this query
-- 3. Copy ALL results and save to a file
-- 4. That file becomes your rollback script
-- =====================================================

-- Get all policies for the three tables we're fixing
SELECT
  tablename,
  policyname,
  '-- =============================================' || E'\n' ||
  '-- Table: ' || tablename || E'\n' ||
  '-- Policy: ' || policyname || E'\n' ||
  '-- =============================================' || E'\n' ||
  'CREATE POLICY "' || policyname || '" ON ' || tablename || E'\n' ||
  '  FOR ' || cmd ||
  CASE
    WHEN roles IS NOT NULL THEN E'\n  TO ' || array_to_string(roles, ', ')
    ELSE ''
  END ||
  CASE
    WHEN qual IS NOT NULL THEN E'\n  USING (' || pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) || ')'
    ELSE ''
  END ||
  CASE
    WHEN with_check IS NOT NULL THEN E'\n  WITH CHECK (' || pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass) || ')'
    ELSE ''
  END || ';' || E'\n' AS rollback_script
FROM pg_policies
WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes')
ORDER BY tablename, policyname;

-- Also get RLS status
SELECT E'\n-- Current RLS Status:' || E'\n' ||
  '-- Table: ' || tablename ||
  ' | RLS Enabled: ' || rowsecurity::text || E'\n'
FROM pg_tables
WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes')
ORDER BY tablename;
