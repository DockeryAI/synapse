-- Temporarily disable RLS on UVP tables
-- This allows the app to work without authentication
-- WARNING: Re-enable RLS when auth is implemented!

ALTER TABLE value_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_ab_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_uvps DISABLE ROW LEVEL SECURITY;

-- Also disable on other tables showing 406 errors
ALTER TABLE IF EXISTS mirror_intend_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketing_strategies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tactical_plans DISABLE ROW LEVEL SECURITY;

-- Add a comment to remind us to re-enable RLS
COMMENT ON TABLE value_statements IS 'Stores UVP variants - RLS TEMPORARILY DISABLED, re-enable when auth is implemented';
COMMENT ON TABLE brand_uvps IS 'Stores UVP wizard progress - RLS TEMPORARILY DISABLED, re-enable when auth is implemented';