-- Force PostgREST schema reload for location_detection_cache
-- This migration uses multiple techniques to force PostgREST to recognize the policies

-- Step 1: Verify current state
DO $$
BEGIN
  RAISE NOTICE '=== Current State Check ===';
  RAISE NOTICE 'RLS Status: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'location_detection_cache');
  RAISE NOTICE 'Policy Count: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'location_detection_cache');
END $$;

-- Step 2: Drop and recreate policies with explicit role grants
DROP POLICY IF EXISTS "Enable read for anon and authenticated" ON location_detection_cache;
DROP POLICY IF EXISTS "Enable insert for anon and authenticated" ON location_detection_cache;
DROP POLICY IF EXISTS "Enable update for anon and authenticated" ON location_detection_cache;
DROP POLICY IF EXISTS "Enable delete for anon and authenticated" ON location_detection_cache;

-- Step 3: Grant table-level permissions FIRST (before policies)
GRANT ALL ON location_detection_cache TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Step 4: Create policies with explicit role targeting
CREATE POLICY "anon_read_location_cache"
  ON location_detection_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_insert_location_cache"
  ON location_detection_cache
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anon_update_location_cache"
  ON location_detection_cache
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_location_cache"
  ON location_detection_cache
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Step 5: Add a dummy column to force schema change detection
ALTER TABLE location_detection_cache ADD COLUMN IF NOT EXISTS force_reload_trigger BOOLEAN DEFAULT TRUE;

-- Step 6: Remove the dummy column
ALTER TABLE location_detection_cache DROP COLUMN IF EXISTS force_reload_trigger;

-- Step 7: Clear ALL stale cache data
DELETE FROM intelligence_cache WHERE cache_key LIKE 'deepcontext:%';
DELETE FROM intelligence_cache WHERE cache_key LIKE 'website_analysis:%';
DELETE FROM intelligence_cache WHERE data::text LIKE '%New York%';
DELETE FROM location_detection_cache; -- Clear all cached locations to force fresh detection

-- Step 8: Send PostgREST reload signal
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 9: Verify final state
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== Final State ===';
  RAISE NOTICE 'Table: location_detection_cache';
  RAISE NOTICE 'RLS Enabled: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'location_detection_cache');

  FOR policy_record IN
    SELECT policyname, roles, cmd
    FROM pg_policies
    WHERE tablename = 'location_detection_cache'
  LOOP
    RAISE NOTICE 'Policy: % | Roles: % | Command: %',
      policy_record.policyname,
      policy_record.roles,
      policy_record.cmd;
  END LOOP;
END $$;

-- Step 10: Test anon role access
DO $$
BEGIN
  -- Test if anon can theoretically access
  RAISE NOTICE 'Testing anon role access...';
  RAISE NOTICE 'Anon has permissions: %',
    (SELECT COUNT(*) > 0
     FROM information_schema.role_table_grants
     WHERE table_name = 'location_detection_cache'
     AND grantee = 'anon');
END $$;
