-- Make user_id nullable to allow brands without authentication
-- This is temporary until authentication is implemented

ALTER TABLE brands
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow unauthenticated access for demo purposes
DROP POLICY IF EXISTS "Users can insert their own brands" ON brands;
DROP POLICY IF EXISTS "Users can view their own brands" ON brands;
DROP POLICY IF EXISTS "Users can update their own brands" ON brands;
DROP POLICY IF EXISTS "Users can delete their own brands" ON brands;

-- Allow anyone to create/view/update/delete brands (temporary for demo)
CREATE POLICY "Allow all access to brands (temp)"
  ON brands FOR ALL
  USING (true)
  WITH CHECK (true);
