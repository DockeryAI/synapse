-- Fix RLS policy for v5_insights table to allow inserts
-- This allows triggers to be persisted to database

-- First drop existing policies if any
DROP POLICY IF EXISTS "allow_all_v5_insights" ON v5_insights;
DROP POLICY IF EXISTS "allow_insert_v5_insights" ON v5_insights;
DROP POLICY IF EXISTS "allow_select_v5_insights" ON v5_insights;
DROP POLICY IF EXISTS "allow_update_v5_insights" ON v5_insights;
DROP POLICY IF EXISTS "allow_delete_v5_insights" ON v5_insights;

-- Enable RLS
ALTER TABLE v5_insights ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon and authenticated users
CREATE POLICY "allow_all_v5_insights" ON v5_insights
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
