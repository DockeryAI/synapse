-- Add WWH (Why, What, How) enhancement fields to value_statements table
-- These fields support the enhanced WWH Framework visualization

ALTER TABLE value_statements
ADD COLUMN IF NOT EXISTS purpose_statement TEXT,
ADD COLUMN IF NOT EXISTS unique_approach TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS core_offerings TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN value_statements.purpose_statement IS 'WHY: Brand purpose, core belief, and reason for existing';
COMMENT ON COLUMN value_statements.unique_approach IS 'HOW: Array of unique differentiators and approach methods';
COMMENT ON COLUMN value_statements.core_offerings IS 'WHAT: Array of core products, services, or value propositions';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_value_statements_purpose ON value_statements(purpose_statement);
CREATE INDEX IF NOT EXISTS idx_value_statements_approach ON value_statements USING GIN(unique_approach);
CREATE INDEX IF NOT EXISTS idx_value_statements_offerings ON value_statements USING GIN(core_offerings);
