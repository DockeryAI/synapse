-- Fix RLS policies for intelligence_cache to allow anonymous access
-- Required for Synapse demo page and public intelligence gathering

-- Drop existing policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON intelligence_cache;

-- Create new policies that allow anonymous access for caching
CREATE POLICY "Allow anonymous read access" ON intelligence_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous write access" ON intelligence_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" ON intelligence_cache
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access" ON intelligence_cache
  FOR DELETE
  USING (true);

-- Add comment explaining the permissive policy
COMMENT ON TABLE intelligence_cache IS 'Intelligence API cache with permissive RLS for demo/public use. Data is ephemeral and expires based on TTL.';
