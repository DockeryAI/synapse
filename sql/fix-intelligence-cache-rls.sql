-- Fix RLS policies for intelligence_cache table
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE intelligence_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow authenticated insert" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow authenticated update" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow authenticated delete" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anon read" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anon insert" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anon update" ON intelligence_cache;
DROP POLICY IF EXISTS "Allow anon delete" ON intelligence_cache;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow authenticated read" ON intelligence_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON intelligence_cache
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON intelligence_cache
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON intelligence_cache
  FOR DELETE TO authenticated USING (true);

-- Create permissive policies for anonymous users (needed for client-side caching)
CREATE POLICY "Allow anon read" ON intelligence_cache
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert" ON intelligence_cache
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update" ON intelligence_cache
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete" ON intelligence_cache
  FOR DELETE TO anon USING (true);

-- Verify policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'intelligence_cache';
