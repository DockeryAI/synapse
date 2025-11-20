-- Temporarily disable RLS on industry_profiles to allow profile generation
-- Industry profiles are public data anyway (marketing templates for industries)

ALTER TABLE industry_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow reading active industry profiles" ON industry_profiles;
DROP POLICY IF EXISTS "Allow inserting industry profiles" ON industry_profiles;
DROP POLICY IF EXISTS "Allow updating industry profiles" ON industry_profiles;
DROP POLICY IF EXISTS "Industry profiles are viewable by everyone" ON industry_profiles;
DROP POLICY IF EXISTS "Industry profiles can be inserted by authenticated users" ON industry_profiles;
