-- Add missing columns to location_detection_cache table
-- These columns are expected by the code but missing from the current table structure

-- Add the missing columns if they don't exist
ALTER TABLE location_detection_cache
ADD COLUMN IF NOT EXISTS hasMultipleLocations BOOLEAN DEFAULT false;

ALTER TABLE location_detection_cache
ADD COLUMN IF NOT EXISTS allLocations JSONB DEFAULT '[]'::jsonb;

-- Verify the columns were added
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'location_detection_cache'
  AND column_name IN ('hasMultipleLocations', 'allLocations');

  IF col_count = 2 THEN
    RAISE NOTICE '✅ Successfully added missing columns!';
    RAISE NOTICE '   - hasMultipleLocations: BOOLEAN';
    RAISE NOTICE '   - allLocations: JSONB';
  ELSE
    RAISE WARNING '⚠️ Could not add all columns. Check table structure.';
  END IF;
END $$;

-- Force PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';

-- Add and drop a dummy column to force cache reload
ALTER TABLE location_detection_cache ADD COLUMN IF NOT EXISTS _temp_reload_v2 BOOLEAN DEFAULT false;
ALTER TABLE location_detection_cache DROP COLUMN IF EXISTS _temp_reload_v2;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'location_detection_cache'
ORDER BY ordinal_position;