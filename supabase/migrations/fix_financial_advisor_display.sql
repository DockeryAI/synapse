-- Fix Financial Advisor display name in industry search index
-- Change "Financial Planning" to "Financial Advisor" for NAICS 523930

-- Update the wrong entry (Financial Planning with wrong NAICS 523920)
UPDATE industry_search_index
SET
  naics_code = '523930',
  display_name = 'Financial Advisor',
  category = 'Professional Services',
  keywords = ARRAY['financial advisor', 'financial planner', 'wealth manager', 'investment advisor', 'financial planning', 'wealth management', 'retirement planning'],
  has_full_profile = true,
  popularity = 31
WHERE display_name = 'Financial Planning' AND naics_code = '523920';

-- Update Investment Advisor to Investment Advisory
UPDATE industry_search_index
SET
  display_name = 'Investment Advisory',
  category = 'Professional Services',
  keywords = ARRAY['investment advisory', 'investment', 'advisory', 'investment advice', 'portfolio management'],
  has_full_profile = true,
  popularity = 30
WHERE display_name = 'Investment Advisor' AND naics_code = '523930';

-- Verify the changes
SELECT naics_code, display_name, category, keywords, has_full_profile, popularity
FROM industry_search_index
WHERE naics_code = '523930'
ORDER BY popularity DESC;
