-- NUCLEAR OPTION: Complete teardown and rebuild of cache table permissions
-- This fixes the persistent PostgREST 406 errors

-- Step 1: Diagnostic check BEFORE changes
DO $$
BEGIN
  RAISE NOTICE '=== BEFORE STATE ===';
  RAISE NOTICE 'intelligence_cache RLS: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'intelligence_cache');
  RAISE NOTICE 'intelligence_cache policies: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'intelligence_cache');
  RAISE NOTICE 'location_detection_cache RLS: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'location_detection_cache');
  RAISE NOTICE 'location_detection_cache policies: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'location_detection_cache');
END $$;

-- Step 2: Nuclear option - drop EVERYTHING
DO $$
DECLARE
  pol record;
BEGIN
  -- Drop all policies on intelligence_cache
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'intelligence_cache' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON intelligence_cache', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;

  -- Drop all policies on location_detection_cache
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'location_detection_cache' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON location_detection_cache', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Step 3: Revoke all existing permissions and start fresh
REVOKE ALL ON intelligence_cache FROM anon, authenticated, service_role, public;
REVOKE ALL ON location_detection_cache FROM anon, authenticated, service_role, public;

-- Step 4: Grant table-level permissions explicitly
GRANT ALL ON intelligence_cache TO anon;
GRANT ALL ON intelligence_cache TO authenticated;
GRANT ALL ON intelligence_cache TO service_role;

GRANT ALL ON location_detection_cache TO anon;
GRANT ALL ON location_detection_cache TO authenticated;
GRANT ALL ON location_detection_cache TO service_role;

-- Step 5: Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Step 6: Ensure RLS is enabled
ALTER TABLE intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Step 7: Create simple, explicit policies
-- intelligence_cache policies
CREATE POLICY "cache_select" ON intelligence_cache
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cache_insert" ON intelligence_cache
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "cache_update" ON intelligence_cache
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cache_delete" ON intelligence_cache
  FOR DELETE TO anon, authenticated USING (true);

-- location_detection_cache policies
CREATE POLICY "location_select" ON location_detection_cache
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "location_insert" ON location_detection_cache
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "location_update" ON location_detection_cache
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "location_delete" ON location_detection_cache
  FOR DELETE TO anon, authenticated USING (true);

-- Step 8: Force schema change detection (add/drop column trick)
ALTER TABLE intelligence_cache ADD COLUMN _force_reload_1 BOOLEAN DEFAULT true;
ALTER TABLE intelligence_cache DROP COLUMN _force_reload_1;

ALTER TABLE location_detection_cache ADD COLUMN _force_reload_2 BOOLEAN DEFAULT true;
ALTER TABLE location_detection_cache DROP COLUMN _force_reload_2;

-- Step 9: Clear all stale cache data
DELETE FROM intelligence_cache WHERE cache_key LIKE 'deepcontext:%';
DELETE FROM intelligence_cache WHERE cache_key LIKE 'website_analysis:%';
DELETE FROM intelligence_cache WHERE cache_key LIKE 'serper:places:%';
DELETE FROM location_detection_cache; -- Clear all location cache

-- Step 10: Update table metadata to force PostgREST refresh
DO $$
BEGIN
  EXECUTE format('COMMENT ON TABLE intelligence_cache IS ''Cache table - Updated at %s''', NOW()::TEXT);
  EXECUTE format('COMMENT ON TABLE location_detection_cache IS ''Location cache - Updated at %s''', NOW()::TEXT);
END $$;

-- Step 11: Send multiple reload signals
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 12: Verify final state
DO $$
DECLARE
  pol record;
BEGIN
  RAISE NOTICE '=== AFTER STATE ===';
  RAISE NOTICE '';

  RAISE NOTICE '--- intelligence_cache ---';
  RAISE NOTICE 'RLS Enabled: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'intelligence_cache');
  RAISE NOTICE 'Policies:';
  FOR pol IN
    SELECT policyname, cmd, roles::text
    FROM pg_policies
    WHERE tablename = 'intelligence_cache'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % (%) for %', pol.policyname, pol.cmd, pol.roles;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '--- location_detection_cache ---';
  RAISE NOTICE 'RLS Enabled: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'location_detection_cache');
  RAISE NOTICE 'Policies:';
  FOR pol IN
    SELECT policyname, cmd, roles::text
    FROM pg_policies
    WHERE tablename = 'location_detection_cache'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % (%) for %', pol.policyname, pol.cmd, pol.roles;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== GRANTS CHECK ===';
  RAISE NOTICE 'intelligence_cache grants to anon: %',
    (SELECT COUNT(*) FROM information_schema.table_privileges
     WHERE table_name = 'intelligence_cache' AND grantee = 'anon');
  RAISE NOTICE 'location_detection_cache grants to anon: %',
    (SELECT COUNT(*) FROM information_schema.table_privileges
     WHERE table_name = 'location_detection_cache' AND grantee = 'anon');
END $$;
