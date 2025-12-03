-- Fix specialty_profiles RLS to allow full access for development
-- The current policies are blocking inserts/updates from the frontend

-- Drop existing policies
DROP POLICY IF EXISTS "Anon can insert specialty profiles" ON specialty_profiles;
DROP POLICY IF EXISTS "Anon can update pending profiles" ON specialty_profiles;
DROP POLICY IF EXISTS "Anyone can view completed specialty profiles" ON specialty_profiles;
DROP POLICY IF EXISTS "Users can view own profiles" ON specialty_profiles;
DROP POLICY IF EXISTS "Service role full access" ON specialty_profiles;
DROP POLICY IF EXISTS "Allow all operations for dev" ON specialty_profiles;

-- Create simple permissive policy for all operations
CREATE POLICY "Allow all operations"
  ON specialty_profiles FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Grant all privileges to anon role
GRANT ALL ON specialty_profiles TO anon;
GRANT ALL ON specialty_profiles TO authenticated;
GRANT ALL ON specialty_profiles TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
