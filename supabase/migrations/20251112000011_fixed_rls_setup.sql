-- Fixed RLS setup - proper loop syntax
-- This migration ensures a clean slate for RLS policies

-- 1. Drop ALL existing policies on UVP tables
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies on value_statements
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'value_statements')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON value_statements', r.policyname);
  END LOOP;

  -- Drop all policies on uvp_components
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'uvp_components')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON uvp_components', r.policyname);
  END LOOP;

  -- Drop all policies on uvp_ab_tests
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'uvp_ab_tests')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON uvp_ab_tests', r.policyname);
  END LOOP;

  -- Drop all policies on brand_uvps
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'brand_uvps')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON brand_uvps', r.policyname);
  END LOOP;
END $$;

-- 2. Ensure RLS is enabled on all tables
ALTER TABLE value_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_uvps ENABLE ROW LEVEL SECURITY;

-- 3. Create new public access policies (for development only!)
-- These policies allow ALL operations for ALL users (even unauthenticated)

-- Value Statements - Full public access
CREATE POLICY "public_read" ON value_statements
  FOR SELECT USING (true);

CREATE POLICY "public_insert" ON value_statements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update" ON value_statements
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public_delete" ON value_statements
  FOR DELETE USING (true);

-- UVP Components - Full public access
CREATE POLICY "public_read" ON uvp_components
  FOR SELECT USING (true);

CREATE POLICY "public_insert" ON uvp_components
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update" ON uvp_components
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public_delete" ON uvp_components
  FOR DELETE USING (true);

-- UVP AB Tests - Full public access
CREATE POLICY "public_read" ON uvp_ab_tests
  FOR SELECT USING (true);

CREATE POLICY "public_insert" ON uvp_ab_tests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update" ON uvp_ab_tests
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public_delete" ON uvp_ab_tests
  FOR DELETE USING (true);

-- Brand UVPs - Full public access
CREATE POLICY "public_read" ON brand_uvps
  FOR SELECT USING (true);

CREATE POLICY "public_insert" ON brand_uvps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update" ON brand_uvps
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public_delete" ON brand_uvps
  FOR DELETE USING (true);

-- 4. Grant necessary permissions to anon role
GRANT ALL ON value_statements TO anon;
GRANT ALL ON uvp_components TO anon;
GRANT ALL ON uvp_ab_tests TO anon;
GRANT ALL ON brand_uvps TO anon;

-- 5. Also handle the other tables that were showing errors
ALTER TABLE IF EXISTS mirror_intend_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tactical_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on these tables
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies on mirror_intend_objectives
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'mirror_intend_objectives')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON mirror_intend_objectives', r.policyname);
  END LOOP;

  -- Drop all policies on marketing_strategies
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'marketing_strategies')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON marketing_strategies', r.policyname);
  END LOOP;

  -- Drop all policies on tactical_plans
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tactical_plans')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON tactical_plans', r.policyname);
  END LOOP;
END $$;

-- Create public policies for these tables too
CREATE POLICY "public_all" ON mirror_intend_objectives
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_all" ON marketing_strategies
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_all" ON tactical_plans
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON mirror_intend_objectives TO anon;
GRANT ALL ON marketing_strategies TO anon;
GRANT ALL ON tactical_plans TO anon;

-- 6. Force schema reload
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS setup complete - all policies recreated with public access for development';
END $$;