-- PERMANENT FIX: Add unique constraint on brand website to prevent duplicates
-- This ensures only ONE brand can exist per website URL

-- First, clean up any existing duplicates (keep oldest)
DELETE FROM brands a
USING brands b
WHERE a.website = b.website
  AND a.created_at > b.created_at;

-- Now add unique constraint
ALTER TABLE brands
ADD CONSTRAINT brands_website_unique UNIQUE (website);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT brands_website_unique ON brands IS 
'Ensures only one brand can exist per website URL. Prevents the duplicate brand issue that caused sessions to be orphaned.';
