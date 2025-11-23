-- Fix naics_codes table RLS policies to allow inserts
-- The import was failing due to missing INSERT policy

-- First ensure the table has RLS enabled
ALTER TABLE naics_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public read naics codes" ON naics_codes;
DROP POLICY IF EXISTS "Service manage naics codes" ON naics_codes;

-- Create comprehensive policies
-- Allow everyone to read
CREATE POLICY "Public read naics codes"
  ON naics_codes
  FOR SELECT
  TO public
  USING (true);

-- Allow inserts from anon and authenticated (for imports and on-demand generation)
CREATE POLICY "Public insert naics codes"
  ON naics_codes
  FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);

-- Allow updates from anon and authenticated
CREATE POLICY "Public update naics codes"
  ON naics_codes
  FOR UPDATE
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service manage naics codes"
  ON naics_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure permissions are granted
GRANT ALL ON naics_codes TO anon;
GRANT ALL ON naics_codes TO authenticated;
GRANT ALL ON naics_codes TO service_role;
GRANT ALL ON naics_codes TO public;

-- Force schema reload
NOTIFY pgrst, 'reload schema';