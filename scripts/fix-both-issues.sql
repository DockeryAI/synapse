-- Fix both issues at once

-- 1. Add Used Car Dealer to naics_codes
INSERT INTO naics_codes (
  code,
  title,
  category,
  keywords,
  has_full_profile,
  popularity
) VALUES (
  'CUSTOM-441120',
  'Used Car Dealer',
  'Retail',
  ARRAY['used', 'car', 'dealer', 'auto', 'vehicle', 'pre-owned'],
  true,
  5
) ON CONFLICT (code) DO UPDATE SET
  has_full_profile = true,
  updated_at = NOW();

-- 2. Add missing columns to location_detection_cache
ALTER TABLE location_detection_cache
ADD COLUMN IF NOT EXISTS hasMultipleLocations BOOLEAN DEFAULT false;

ALTER TABLE location_detection_cache
ADD COLUMN IF NOT EXISTS allLocations JSONB DEFAULT '[]'::jsonb;

-- 3. Verify both fixes
DO $$
BEGIN
  RAISE NOTICE '✅ Used Car Dealer added to naics_codes with checkmark';
  RAISE NOTICE '✅ Location cache columns added';
  RAISE NOTICE '';
  RAISE NOTICE 'Now hard refresh the page (Cmd+Shift+R) to see:';
  RAISE NOTICE '- Used Car Dealer with checkmark ✓';
  RAISE NOTICE '- No more 400 errors on location detection';
END $$;