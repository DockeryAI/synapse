-- ============================================================================
-- CLEAN UP OVERLY PERMISSIVE POLICIES
-- ============================================================================
-- Remove the wide-open public policies that bypass our anon restrictions
-- ============================================================================

-- Drop the overly permissive public policies
DROP POLICY IF EXISTS "industry_profiles_insert" ON industry_profiles;
DROP POLICY IF EXISTS "industry_profiles_update" ON industry_profiles;
DROP POLICY IF EXISTS "industry_profiles_delete" ON industry_profiles;
DROP POLICY IF EXISTS "industry_profiles_select" ON industry_profiles;

-- Reload PostgREST
NOTIFY pgrst, 'reload schema';

-- Verify - should only see our 5 named policies now
SELECT
  policyname,
  roles,
  cmd as operation,
  CASE
    WHEN with_check = 'true' THEN '⚠️  NO RESTRICTIONS'
    WHEN with_check IS NULL THEN 'N/A (SELECT)'
    ELSE '✅ ' || substring(with_check, 1, 50)
  END as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'industry_profiles'
ORDER BY policyname;
