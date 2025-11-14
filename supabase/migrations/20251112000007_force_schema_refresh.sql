-- Force schema refresh and ensure proper access
-- This comprehensive fix addresses all potential permission issues

-- 1. Drop and recreate RLS policies (to ensure clean state)
DROP POLICY IF EXISTS "Users can view their own value statements" ON value_statements;
DROP POLICY IF EXISTS "Users can insert their own value statements" ON value_statements;
DROP POLICY IF EXISTS "Users can update their own value statements" ON value_statements;
DROP POLICY IF EXISTS "Users can delete their own value statements" ON value_statements;

DROP POLICY IF EXISTS "Users can view their own uvp components" ON uvp_components;
DROP POLICY IF EXISTS "Users can insert their own uvp components" ON uvp_components;
DROP POLICY IF EXISTS "Users can update their own uvp components" ON uvp_components;
DROP POLICY IF EXISTS "Users can delete their own uvp components" ON uvp_components;

DROP POLICY IF EXISTS "Users can view their own ab tests" ON uvp_ab_tests;
DROP POLICY IF EXISTS "Users can insert their own ab tests" ON uvp_ab_tests;
DROP POLICY IF EXISTS "Users can update their own ab tests" ON uvp_ab_tests;
DROP POLICY IF EXISTS "Users can delete their own ab tests" ON uvp_ab_tests;

DROP POLICY IF EXISTS "Users can view their own uvp" ON brand_uvps;
DROP POLICY IF EXISTS "Users can insert their own uvp" ON brand_uvps;
DROP POLICY IF EXISTS "Users can update their own uvp" ON brand_uvps;
DROP POLICY IF EXISTS "Users can delete their own uvp" ON brand_uvps;

-- 2. Disable RLS completely on all UVP tables
ALTER TABLE value_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_ab_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_uvps DISABLE ROW LEVEL SECURITY;

-- 3. Also disable on other problematic tables
ALTER TABLE IF EXISTS mirror_intend_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketing_strategies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tactical_plans DISABLE ROW LEVEL SECURITY;

-- 4. Grant ALL permissions to anon and authenticated roles
GRANT ALL ON value_statements TO anon, authenticated;
GRANT ALL ON uvp_components TO anon, authenticated;
GRANT ALL ON uvp_ab_tests TO anon, authenticated;
GRANT ALL ON brand_uvps TO anon, authenticated;

GRANT ALL ON mirror_intend_objectives TO anon, authenticated;
GRANT ALL ON marketing_strategies TO anon, authenticated;
GRANT ALL ON tactical_plans TO anon, authenticated;

-- 5. Grant usage on sequences (for inserting records)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- 7. Alternative method to force reload (comment out if it causes error)
SELECT pg_notify('pgrst', 'reload schema');

-- 8. Add comments to track this change
COMMENT ON TABLE value_statements IS 'UVP value statements - RLS DISABLED for development';
COMMENT ON TABLE brand_uvps IS 'Brand UVP wizard data - RLS DISABLED for development';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Schema permissions updated. RLS disabled for development. PostgREST cache reload triggered.';
END $$;