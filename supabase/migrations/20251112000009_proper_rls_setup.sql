-- Proper RLS setup for UVP tables
-- This migration sets up RLS properly with public access for development

-- 1. First, ensure RLS is enabled on all UVP tables
ALTER TABLE value_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_uvps ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow public read access" ON value_statements;
DROP POLICY IF EXISTS "Allow public write access" ON value_statements;
DROP POLICY IF EXISTS "Allow public read access" ON uvp_components;
DROP POLICY IF EXISTS "Allow public write access" ON uvp_components;
DROP POLICY IF EXISTS "Allow public read access" ON uvp_ab_tests;
DROP POLICY IF EXISTS "Allow public write access" ON uvp_ab_tests;
DROP POLICY IF EXISTS "Allow public read access" ON brand_uvps;
DROP POLICY IF EXISTS "Allow public write access" ON brand_uvps;

-- 3. Create simple public access policies (for development only!)
-- These policies allow ALL operations for ALL users (even unauthenticated)

-- Value Statements - Full public access
CREATE POLICY "Allow public read access" ON value_statements
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON value_statements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON value_statements
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON value_statements
  FOR DELETE USING (true);

-- UVP Components - Full public access
CREATE POLICY "Allow public read access" ON uvp_components
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON uvp_components
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON uvp_components
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON uvp_components
  FOR DELETE USING (true);

-- UVP AB Tests - Full public access
CREATE POLICY "Allow public read access" ON uvp_ab_tests
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON uvp_ab_tests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON uvp_ab_tests
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON uvp_ab_tests
  FOR DELETE USING (true);

-- Brand UVPs - Full public access
CREATE POLICY "Allow public read access" ON brand_uvps
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON brand_uvps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON brand_uvps
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON brand_uvps
  FOR DELETE USING (true);

-- 4. Grant necessary permissions to anon role
GRANT ALL ON value_statements TO anon;
GRANT ALL ON uvp_components TO anon;
GRANT ALL ON uvp_ab_tests TO anon;
GRANT ALL ON brand_uvps TO anon;

-- 5. Force schema reload
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RLS enabled with public access policies for development';
END $$;