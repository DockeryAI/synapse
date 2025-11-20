-- Fix industry_profiles RLS properly
-- Industry profiles are public reference data that can be generated on-demand

-- First, ensure RLS is enabled
ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow reading active industry profiles" ON industry_profiles;
DROP POLICY IF EXISTS "Allow inserting industry profiles" ON industry_profiles;
DROP POLICY IF EXISTS "Allow updating industry profiles" ON industry_profiles;
DROP POLICY IF EXISTS "Industry profiles are viewable by everyone" ON industry_profiles;
DROP POLICY IF EXISTS "Industry profiles can be inserted by authenticated users" ON industry_profiles;

-- Allow everyone (including anon) to read active profiles
CREATE POLICY "Public read access to active profiles"
ON industry_profiles
FOR SELECT
TO public
USING (is_active = true);

-- Allow everyone (including anon) to insert profiles
-- Industry profiles are public reference data generated on-demand
CREATE POLICY "Public insert access for profile generation"
ON industry_profiles
FOR INSERT
TO public
WITH CHECK (true);

-- Allow everyone (including anon) to update profiles
CREATE POLICY "Public update access for profile generation"
ON industry_profiles
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
