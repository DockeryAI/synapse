-- Add keywords for the existing School Psychologist profile (621330)
-- This enables fuzzy matching for "school psychologist" searches

INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, level, is_standard)
VALUES (
  '621330',
  'Offices of Mental Health Practitioners (except Physicians)',
  'Health Care',
  ARRAY['school', 'psychologist', 'mental', 'health', 'practitioners', 'therapy', 'counseling', 'psychology', 'educational', 'child', 'assessment', 'testing'],
  true,
  6,
  true
)
ON CONFLICT (code)
DO UPDATE SET
  keywords = ARRAY['school', 'psychologist', 'mental', 'health', 'practitioners', 'therapy', 'counseling', 'psychology', 'educational', 'child', 'assessment', 'testing'],
  has_full_profile = true,
  title = 'Offices of Mental Health Practitioners (except Physicians)',
  category = 'Health Care';

-- Reload PostgREST
NOTIFY pgrst, 'reload schema';

-- Verify
SELECT code, title, keywords
FROM naics_codes
WHERE code = '621330';
