-- Quick RLS Fix - Run this in Supabase SQL Editor
-- Fixes the 406 error by correcting table references

-- Fix value_propositions
ALTER TABLE IF EXISTS value_propositions DROP CONSTRAINT IF EXISTS value_propositions_business_id_fkey;
DROP POLICY IF EXISTS value_propositions_user_access ON value_propositions;
ALTER TABLE IF EXISTS value_propositions RENAME COLUMN business_id TO brand_id;
ALTER TABLE IF EXISTS value_propositions ADD CONSTRAINT value_propositions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
CREATE POLICY value_propositions_user_access ON value_propositions FOR ALL USING (auth.uid() IN (SELECT user_id FROM brands WHERE id = value_propositions.brand_id));

-- Fix buyer_personas
ALTER TABLE IF EXISTS buyer_personas DROP CONSTRAINT IF EXISTS buyer_personas_business_id_fkey;
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;
ALTER TABLE IF EXISTS buyer_personas RENAME COLUMN business_id TO brand_id;
ALTER TABLE IF EXISTS buyer_personas ADD CONSTRAINT buyer_personas_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
CREATE POLICY buyer_personas_user_access ON buyer_personas FOR ALL USING (auth.uid() IN (SELECT user_id FROM brands WHERE id = buyer_personas.brand_id));

-- Fix core_truth_insights
ALTER TABLE IF EXISTS core_truth_insights DROP CONSTRAINT IF EXISTS core_truth_insights_business_id_fkey;
DROP POLICY IF EXISTS core_truth_insights_user_access ON core_truth_insights;
ALTER TABLE IF EXISTS core_truth_insights RENAME COLUMN business_id TO brand_id;
ALTER TABLE IF EXISTS core_truth_insights ADD CONSTRAINT core_truth_insights_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
CREATE POLICY core_truth_insights_user_access ON core_truth_insights FOR ALL USING (auth.uid() IN (SELECT user_id FROM brands WHERE id = core_truth_insights.brand_id));
