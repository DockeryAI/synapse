-- Create a comprehensive industry search index table
-- This allows multiple display names and keyword sets for the same NAICS code
-- Essential for search as many businesses use different terms for the same industry

CREATE TABLE IF NOT EXISTS industry_search_index (
  id SERIAL PRIMARY KEY,
  naics_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT,
  keywords TEXT[] DEFAULT '{}',
  has_full_profile BOOLEAN DEFAULT false,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast searching
CREATE INDEX idx_industry_search_naics ON industry_search_index(naics_code);
CREATE INDEX idx_industry_search_keywords ON industry_search_index USING GIN(keywords);
CREATE INDEX idx_industry_search_display_name ON industry_search_index(display_name);
CREATE INDEX idx_industry_search_popularity ON industry_search_index(popularity DESC);

-- Insert comprehensive industry data
-- This includes multiple entries for the same NAICS code with different specializations
INSERT INTO industry_search_index (naics_code, display_name, category, keywords, has_full_profile, popularity) VALUES

-- Legal Services (Multiple Specializations)
('541110', 'General Practice Law', 'Professional Services', ARRAY['general practice law', 'lawyer', 'attorney', 'legal', 'law firm', 'legal services'], true, 29),
('541110', 'Estate Planning', 'Professional Services', ARRAY['estate planning', 'estate', 'lawyer', 'attorney', 'legal', 'wills', 'trusts', 'probate'], true, 28),
('541110', 'Family Law', 'Professional Services', ARRAY['family law', 'divorce', 'custody', 'lawyer', 'attorney', 'legal', 'divorce attorney'], true, 27),
('541110', 'Real Estate Law', 'Professional Services', ARRAY['real estate law', 'property law', 'lawyer', 'attorney', 'legal', 'closing attorney'], true, 24),
('541110', 'Business Law', 'Professional Services', ARRAY['business law', 'corporate law', 'lawyer', 'attorney', 'legal', 'business attorney'], true, 23),
('541110', 'Criminal Defense', 'Professional Services', ARRAY['criminal defense', 'criminal law', 'lawyer', 'attorney', 'legal', 'defense attorney'], true, 22),
('541110', 'Personal Injury', 'Professional Services', ARRAY['personal injury', 'injury lawyer', 'attorney', 'legal', 'accident attorney', 'PI lawyer'], true, 21),
('541110', 'Immigration Law', 'Professional Services', ARRAY['immigration law', 'immigration', 'lawyer', 'attorney', 'legal', 'visa', 'green card'], true, 20),

-- Technology Services
('541519', 'MSP (Managed Service Provider)', 'Technology', ARRAY['msp', 'managed service provider', 'it support', 'managed it', 'it services'], true, 100),
('541512', 'Cybersecurity Services', 'Technology', ARRAY['cybersecurity', 'security', 'cyber security', 'infosec', 'it security'], true, 99),
('541511', 'Web Development', 'Technology', ARRAY['web development', 'web design', 'website', 'web developer', 'wordpress'], true, 55),
('541512', 'IT Consulting', 'Technology', ARRAY['it consulting', 'technology consulting', 'it consultant', 'tech consulting'], true, 50),
('518210', 'SaaS Company', 'Technology', ARRAY['saas', 'software', 'cloud software', 'subscription software'], true, 54),

-- Healthcare Services
('621210', 'General Dentistry', 'Healthcare', ARRAY['dentist', 'dentistry', 'dental', 'dental care', 'general dentistry'], true, 98),
('621210', 'Cosmetic Dentistry', 'Healthcare', ARRAY['cosmetic dentistry', 'veneers', 'teeth whitening', 'dental', 'smile makeover'], true, 97),
('621210', 'Orthodontics', 'Healthcare', ARRAY['orthodontics', 'orthodontist', 'braces', 'invisalign', 'dental'], true, 76),
('621210', 'Pediatric Dentistry', 'Healthcare', ARRAY['pediatric dentistry', 'kids dentist', 'children dentist', 'dental'], true, 75),
('621111', 'Primary Care', 'Healthcare', ARRAY['primary care', 'doctor', 'physician', 'family doctor', 'gp'], true, 60),
('621340', 'Physical Therapy', 'Healthcare', ARRAY['physical therapy', 'pt', 'physiotherapy', 'rehab', 'rehabilitation'], true, 59),
('621399', 'Nutrition Coaching', 'Healthcare', ARRAY['nutrition', 'nutritionist', 'dietitian', 'nutrition coaching', 'diet'], true, 88),
('541940', 'Emergency/Specialty Veterinary', 'Healthcare', ARRAY['vet', 'veterinary', 'veterinarian', 'animal hospital', 'pet care'], true, 16),

-- Personal Services
('812112', 'Hair Salon', 'Personal Services', ARRAY['hair salon', 'hairstylist', 'hair stylist', 'haircut', 'beauty salon'], true, 96),
('812111', 'Barbershop', 'Personal Services', ARRAY['barbershop', 'barber', 'mens haircut', 'haircut', 'barber shop'], true, 95),
('812113', 'Nail Salon', 'Personal Services', ARRAY['nail salon', 'nails', 'manicure', 'pedicure', 'nail technician'], true, 94),
('812199', 'Aesthetics/Skincare', 'Personal Services', ARRAY['aesthetics', 'skincare', 'esthetician', 'facial', 'skin care'], true, 93),
('812199', 'Massage Therapy', 'Personal Services', ARRAY['massage', 'massage therapy', 'massage therapist', 'therapeutic massage'], true, 92),
('812199', 'Tattoo & Piercing', 'Personal Services', ARRAY['tattoo', 'piercing', 'tattoo shop', 'tattoo artist', 'body art'], true, 86),

-- Fitness & Wellness
('713940', 'Yoga Studio', 'Personal Services', ARRAY['yoga', 'yoga studio', 'yoga class', 'yoga instructor'], true, 91),
('713940', 'Pilates Studio', 'Personal Services', ARRAY['pilates', 'pilates studio', 'pilates class', 'pilates instructor'], true, 90),
('713940', 'Personal Training', 'Personal Services', ARRAY['personal training', 'personal trainer', 'fitness trainer', 'pt', 'fitness coach'], true, 89),
('713940', 'CrossFit Gym', 'Personal Services', ARRAY['crossfit', 'crossfit gym', 'box', 'fitness', 'gym'], true, 58),
('713940', 'Gym/Fitness Center', 'Personal Services', ARRAY['gym', 'fitness center', 'health club', 'fitness', 'workout'], true, 51),

-- Home Services
('236118', 'Residential Remodelers', 'Home Services', ARRAY['remodeling', 'renovation', 'contractor', 'home improvement', 'kitchen remodel'], true, 44),
('238220', 'HVAC Contractor', 'Home Services', ARRAY['hvac', 'heating', 'cooling', 'air conditioning', 'ac repair', 'furnace'], true, 46),
('238210', 'Electrician', 'Home Services', ARRAY['electrician', 'electrical', 'electric', 'electrical contractor', 'wiring'], true, 48),
('238220', 'Plumber', 'Home Services', ARRAY['plumber', 'plumbing', 'pipes', 'drain', 'water heater', 'leak repair'], true, 47),
('236115', 'Home Builder', 'Home Services', ARRAY['home builder', 'custom homes', 'new construction', 'builder', 'contractor'], true, 45),
('561730', 'Landscaping', 'Home Services', ARRAY['landscaping', 'lawn care', 'landscape', 'yard work', 'gardening'], true, 61),
('238320', 'Painting Contractor', 'Home Services', ARRAY['painting', 'painter', 'painting contractor', 'house painting', 'paint'], false, 200),
('238350', 'Flooring Contractor', 'Home Services', ARRAY['flooring', 'floor', 'hardwood', 'carpet', 'tile', 'flooring installation'], false, 201),
('238140', 'Roofing Contractor', 'Home Services', ARRAY['roofing', 'roof', 'roofer', 'roof repair', 'shingles', 'roofing contractor'], false, 202),

-- Automotive Services
('811111', 'Auto Repair', 'Personal Services', ARRAY['auto repair', 'mechanic', 'car repair', 'auto mechanic', 'automotive repair'], true, 84),
('811192', 'Auto Detailing', 'Personal Services', ARRAY['auto detailing', 'car detailing', 'detail', 'car wash', 'detailing'], true, 83),
('811191', 'Oil Change Service', 'Personal Services', ARRAY['oil change', 'quick lube', 'oil service', 'lube shop'], true, 82),
('441320', 'Tire Shop', 'Personal Services', ARRAY['tire shop', 'tires', 'tire service', 'tire repair', 'wheel alignment'], true, 81),
('811192', 'Car Wash', 'Personal Services', ARRAY['car wash', 'auto wash', 'vehicle wash', 'wash', 'detailing'], true, 80),
('811111', 'Mobile Mechanic', 'Personal Services', ARRAY['mobile mechanic', 'mobile auto repair', 'mobile service'], true, 79),

-- Education & Childcare
('624410', 'Daycare Center', 'Personal Services', ARRAY['daycare', 'childcare', 'child care', 'day care', 'nursery'], true, 78),
('611110', 'Preschool', 'Personal Services', ARRAY['preschool', 'pre-school', 'early learning', 'pre-k', 'kindergarten prep'], true, 77),
('611691', 'Tutoring Services', 'Personal Services', ARRAY['tutoring', 'tutor', 'academic support', 'homework help', 'test prep'], true, 74),
('611610', 'Music Lessons', 'Personal Services', ARRAY['music lessons', 'piano lessons', 'guitar lessons', 'music teacher', 'music school'], true, 73),
('624410', 'After-School Program', 'Personal Services', ARRAY['after school', 'after-school', 'aftercare', 'kids program'], true, 72),

-- Retail
('448140', 'Boutique Clothing Store', 'Retail', ARRAY['boutique', 'clothing store', 'fashion', 'apparel', 'clothes'], true, 71),
('453998', 'Pet Store', 'Retail', ARRAY['pet store', 'pet shop', 'pet supplies', 'pet food', 'aquarium'], true, 70),
('451211', 'Bookstore', 'Retail', ARRAY['bookstore', 'books', 'book shop', 'book store', 'reading'], true, 69),
('445110', 'Grocery Store', 'Retail', ARRAY['grocery store', 'grocery', 'market', 'food store', 'supermarket'], true, 68),
('445310', 'Liquor Store', 'Retail', ARRAY['liquor store', 'wine shop', 'beer', 'alcohol', 'spirits', 'wine'], true, 67),

-- Food Services
('722513', 'Limited-Service Restaurants', 'Food Service', ARRAY['restaurant', 'fast food', 'quick service', 'takeout', 'fast casual'], true, 40),
('722511', 'Full-Service Restaurant', 'Food Service', ARRAY['restaurant', 'dining', 'full service', 'sit down restaurant', 'fine dining'], true, 63),
('445230', 'Specialty Food Store', 'Food Service', ARRAY['specialty food', 'gourmet', 'artisan food', 'deli', 'cheese shop'], true, 64),
('311811', 'Bakery', 'Food Service', ARRAY['bakery', 'baker', 'bread', 'pastry', 'cakes', 'baked goods'], true, 62),
('722515', 'Coffee Shop', 'Food Service', ARRAY['coffee shop', 'cafe', 'coffee', 'espresso', 'coffeehouse'], true, 56),

-- Business Services
('541211', 'CPA Firm', 'Professional Services', ARRAY['cpa', 'accountant', 'accounting', 'tax', 'bookkeeping'], true, 38),
('541213', 'Tax Preparation', 'Professional Services', ARRAY['tax preparation', 'tax service', 'tax prep', 'taxes', 'tax return'], true, 37),
('541219', 'Bookkeeping Services', 'Professional Services', ARRAY['bookkeeping', 'bookkeeper', 'books', 'accounting', 'quickbooks'], true, 35),
('541611', 'Business Consulting', 'Professional Services', ARRAY['business consulting', 'consultant', 'management consulting', 'strategy'], true, 33),
('541613', 'Marketing Consulting', 'Professional Services', ARRAY['marketing', 'marketing consultant', 'digital marketing', 'advertising'], true, 30),
('541430', 'Graphic Design', 'Professional Services', ARRAY['graphic design', 'graphic designer', 'design', 'logo design', 'branding'], true, 36),

-- Real Estate
('531210', 'Real Estate Agency', 'Real Estate', ARRAY['real estate', 'realtor', 'real estate agent', 'property', 'homes for sale'], true, 52),
('531311', 'Residential Property Management', 'Real Estate', ARRAY['property management', 'rental', 'property manager', 'landlord', 'tenant'], true, 53),
('531312', 'Commercial Property Management', 'Real Estate', ARRAY['commercial property', 'commercial real estate', 'property management', 'office space'], true, 43),

-- Insurance & Financial
('524210', 'Insurance Agency', 'Financial Services', ARRAY['insurance', 'insurance agent', 'insurance broker', 'coverage', 'policy'], true, 41),
('524126', 'Direct Property & Casualty Insurance', 'Financial Services', ARRAY['insurance', 'property insurance', 'casualty', 'home insurance', 'auto insurance'], true, 14),
('523930', 'Investment Advisor', 'Financial Services', ARRAY['investment', 'financial advisor', 'wealth management', 'portfolio', 'investing'], true, 25),
('523920', 'Financial Planning', 'Financial Services', ARRAY['financial planning', 'financial planner', 'retirement planning', 'wealth'], true, 26),

-- Add more entries here...
-- Note: This is a subset. The full migration would include all 384 entries from complete-naics-codes.ts

-- Manufacturing & Wholesale (sample entries)
('339910', 'Jewelry Manufacturing', 'Manufacturing', ARRAY['jewelry', 'jeweler', 'jewelry maker', 'custom jewelry', 'goldsmith'], false, 150),
('424990', 'Wholesale Distributor', 'Wholesale', ARRAY['wholesale', 'distributor', 'distribution', 'b2b', 'bulk'], false, 151),

-- Transportation & Logistics (sample entries)
('484110', 'Trucking Company', 'Transportation', ARRAY['trucking', 'freight', 'transportation', 'logistics', 'hauling'], false, 152),
('492110', 'Courier Service', 'Transportation', ARRAY['courier', 'delivery', 'messenger', 'same day delivery', 'shipping'], false, 153);

-- Add a view that combines this with the main industry_profiles for easy querying
CREATE OR REPLACE VIEW industry_search_view AS
SELECT DISTINCT ON (i.naics_code, i.display_name)
  i.id,
  i.naics_code,
  i.display_name,
  i.category,
  i.keywords,
  i.has_full_profile,
  i.popularity,
  p.title as profile_title,
  p.description as profile_description,
  p.has_full_profile as profile_has_full
FROM industry_search_index i
LEFT JOIN industry_profiles p ON i.naics_code = p.naics_code
ORDER BY i.naics_code, i.display_name, i.popularity DESC;

-- Grant permissions
GRANT SELECT ON industry_search_index TO anon, authenticated;
GRANT SELECT ON industry_search_view TO anon, authenticated;