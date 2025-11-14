-- Temporarily disable RLS for demo/testing
-- intelligence_cache is ephemeral data with TTL, no sensitive info
ALTER TABLE intelligence_cache DISABLE ROW LEVEL SECURITY;
