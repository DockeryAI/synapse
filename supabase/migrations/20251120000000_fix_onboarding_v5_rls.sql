-- ============================================================================
-- Fix Onboarding V5 RLS Policies
-- ============================================================================
--
-- Issue: The onboarding_v5_data.sql migration referenced a non-existent
-- "businesses" table. The correct table is "brands".
--
-- This migration:
-- 1. Drops the incorrect foreign key constraints
-- 2. Renames business_id columns to brand_id
-- 3. Adds correct foreign key constraints to brands table
-- 4. Drops and recreates RLS policies with correct table references
--
-- Created: 2025-11-19
-- ============================================================================

-- ============================================================================
-- Fix value_propositions table
-- ============================================================================

-- Drop incorrect foreign key and RLS policy
ALTER TABLE value_propositions DROP CONSTRAINT IF EXISTS value_propositions_business_id_fkey;
DROP POLICY IF EXISTS value_propositions_user_access ON value_propositions;

-- Rename column
ALTER TABLE value_propositions RENAME COLUMN business_id TO brand_id;

-- Add correct foreign key
ALTER TABLE value_propositions
  ADD CONSTRAINT value_propositions_brand_id_fkey
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- Recreate index with new column name
DROP INDEX IF EXISTS idx_value_propositions_business_id;
CREATE INDEX idx_value_propositions_brand_id ON value_propositions(brand_id);

-- Create correct RLS policy
CREATE POLICY value_propositions_user_access ON value_propositions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM brands WHERE id = value_propositions.brand_id
    )
  );

-- ============================================================================
-- Fix buyer_personas table
-- ============================================================================

-- Drop incorrect foreign key and RLS policy
ALTER TABLE buyer_personas DROP CONSTRAINT IF EXISTS buyer_personas_business_id_fkey;
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;

-- Rename column
ALTER TABLE buyer_personas RENAME COLUMN business_id TO brand_id;

-- Add correct foreign key
ALTER TABLE buyer_personas
  ADD CONSTRAINT buyer_personas_brand_id_fkey
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- Recreate index with new column name
DROP INDEX IF EXISTS idx_buyer_personas_business_id;
CREATE INDEX idx_buyer_personas_brand_id ON buyer_personas(brand_id);

-- Create correct RLS policy
CREATE POLICY buyer_personas_user_access ON buyer_personas
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM brands WHERE id = buyer_personas.brand_id
    )
  );

-- ============================================================================
-- Fix core_truth_insights table
-- ============================================================================

-- Drop incorrect foreign key and RLS policy
ALTER TABLE core_truth_insights DROP CONSTRAINT IF EXISTS core_truth_insights_business_id_fkey;
DROP POLICY IF EXISTS core_truth_insights_user_access ON core_truth_insights;

-- Rename column
ALTER TABLE core_truth_insights RENAME COLUMN business_id TO brand_id;

-- Add correct foreign key
ALTER TABLE core_truth_insights
  ADD CONSTRAINT core_truth_insights_brand_id_fkey
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- Recreate index with new column name
DROP INDEX IF EXISTS idx_core_truth_insights_business_id;
CREATE INDEX idx_core_truth_insights_brand_id ON core_truth_insights(brand_id);

-- Create correct RLS policy
CREATE POLICY core_truth_insights_user_access ON core_truth_insights
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM brands WHERE id = core_truth_insights.brand_id
    )
  );

-- ============================================================================
-- Update comments to reflect column name changes
-- ============================================================================

COMMENT ON COLUMN value_propositions.brand_id IS 'Foreign key to brands table';
COMMENT ON COLUMN buyer_personas.brand_id IS 'Foreign key to brands table';
COMMENT ON COLUMN core_truth_insights.brand_id IS 'Foreign key to brands table';

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT true FROM pg_tables WHERE schemaname = 'public' AND tablename = 'value_propositions' AND rowsecurity = true) THEN
    RAISE EXCEPTION 'RLS not enabled on value_propositions';
  END IF;
  IF NOT (SELECT true FROM pg_tables WHERE schemaname = 'public' AND tablename = 'buyer_personas' AND rowsecurity = true) THEN
    RAISE EXCEPTION 'RLS not enabled on buyer_personas';
  END IF;
  IF NOT (SELECT true FROM pg_tables WHERE schemaname = 'public' AND tablename = 'core_truth_insights' AND rowsecurity = true) THEN
    RAISE EXCEPTION 'RLS not enabled on core_truth_insights';
  END IF;

  RAISE NOTICE 'RLS fix migration completed successfully';
END $$;
