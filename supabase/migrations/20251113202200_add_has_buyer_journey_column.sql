-- Add has_buyer_journey column to mirror_diagnostics table
ALTER TABLE mirror_diagnostics
ADD COLUMN IF NOT EXISTS has_buyer_journey BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN mirror_diagnostics.has_buyer_journey IS 'Indicates whether the brand has completed the buyer journey analysis';
