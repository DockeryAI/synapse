-- PostgREST Diagnostic Query
-- This will help identify why location_detection_cache returns 406

-- Test 1: Check if table exists and is in public schema
DO $$
BEGIN
  RAISE NOTICE '=== TABLE EXISTENCE ===';
  RAISE NOTICE 'location_detection_cache exists: %',
    EXISTS(SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'location_detection_cache');
  RAISE NOTICE 'intelligence_cache exists: %',
    EXISTS(SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'intelligence_cache');
END $$;

-- Test 2: Check table ownership and RLS status
SELECT
  schemaname,
  tablename,
  tableowner,
  CASE
    WHEN rowsecurity THEN 'ENABLED'
    ELSE 'DISABLED'
  END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename IN ('location_detection_cache', 'intelligence_cache')
ORDER BY tablename;

-- Test 3: Check all grants for anon role
SELECT
  table_schema,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE grantee = 'anon'
  AND table_name IN ('location_detection_cache', 'intelligence_cache')
ORDER BY table_name, privilege_type;

-- Test 4: Check all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text as roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('location_detection_cache', 'intelligence_cache')
ORDER BY tablename, policyname;

-- Test 5: Simulate anon role access
DO $$
DECLARE
  test_result TEXT;
BEGIN
  RAISE NOTICE '=== SIMULATING ANON ACCESS ===';

  -- Test intelligence_cache
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM COUNT(*) FROM intelligence_cache;
    RESET ROLE;
    RAISE NOTICE 'intelligence_cache: ✅ ACCESSIBLE';
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    RAISE NOTICE 'intelligence_cache: ❌ ERROR - %', SQLERRM;
  END;

  -- Test location_detection_cache
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM COUNT(*) FROM location_detection_cache;
    RESET ROLE;
    RAISE NOTICE 'location_detection_cache: ✅ ACCESSIBLE';
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    RAISE NOTICE 'location_detection_cache: ❌ ERROR - %', SQLERRM;
  END;
END $$;

-- Test 6: Check if PostgREST API schema includes these tables
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('location_detection_cache', 'intelligence_cache')
ORDER BY table_name;

-- Test 7: Force PostgREST reload (multiple methods)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst;

-- Test 8: Check if there are any restrictive policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== POLICY DETAILS ===';
  FOR policy_record IN
    SELECT
      tablename,
      policyname,
      CASE WHEN permissive = 'PERMISSIVE' THEN '✅ PERMISSIVE' ELSE '⚠️ RESTRICTIVE' END as policy_type,
      roles::text,
      cmd,
      CASE WHEN qual = 'true' THEN '✅ true' ELSE '⚠️ ' || qual END as using_clause,
      CASE WHEN with_check IS NULL THEN 'N/A'
           WHEN with_check = 'true' THEN '✅ true'
           ELSE '⚠️ ' || with_check END as with_check_clause
    FROM pg_policies
    WHERE tablename = 'location_detection_cache'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  Table: %', policy_record.tablename;
    RAISE NOTICE '    Policy: %', policy_record.policyname;
    RAISE NOTICE '    Type: %', policy_record.policy_type;
    RAISE NOTICE '    Roles: %', policy_record.roles;
    RAISE NOTICE '    Command: %', policy_record.cmd;
    RAISE NOTICE '    USING: %', policy_record.using_clause;
    RAISE NOTICE '    WITH CHECK: %', policy_record.with_check_clause;
    RAISE NOTICE '  ---';
  END LOOP;
END $$;
