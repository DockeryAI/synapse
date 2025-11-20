-- Allow inserting industry profiles
-- Industry profiles are generated on-demand and should be accessible to all users

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Industry profiles are viewable by everyone" ON industry_profiles;
DROP POLICY IF EXISTS "Industry profiles can be inserted by authenticated users" ON industry_profiles;

-- Allow anyone to read active industry profiles
CREATE POLICY "Allow reading active industry profiles"
ON industry_profiles
FOR SELECT
USING (is_active = true);

-- Allow anyone (authenticated or not) to insert/upsert industry profiles
-- This is needed for on-demand profile generation during onboarding
CREATE POLICY "Allow inserting industry profiles"
ON industry_profiles
FOR INSERT
WITH CHECK (true);

-- Allow updates to industry profiles
CREATE POLICY "Allow updating industry profiles"
ON industry_profiles
FOR UPDATE
USING (true)
WITH CHECK (true);
