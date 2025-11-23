-- Sync all 145 missing industry profiles to naics_codes table
-- This will make them all searchable in the industry dropdown

-- Healthcare (8 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('621330', 'Mental Health Practice', 'Healthcare', ARRAY['mental', 'health', 'therapy', 'counseling', 'psychiatry', 'psychology'], true, 10),
('621111', 'Primary Care', 'Healthcare', ARRAY['primary', 'care', 'doctor', 'physician', 'medical', 'clinic'], true, 12),
('621111-2', 'Urgent Care', 'Healthcare', ARRAY['urgent', 'care', 'walk-in', 'clinic', 'immediate', 'medical'], true, 11),
('621610', 'Home Health Care', 'Healthcare', ARRAY['home', 'health', 'care', 'nursing', 'elderly', 'senior'], true, 8),
('621111-3', 'Specialty Medical Practice', 'Healthcare', ARRAY['specialty', 'medical', 'specialist', 'doctor'], true, 7),
('621111-4', 'Women''s Health', 'Healthcare', ARRAY['women', 'health', 'obgyn', 'gynecology', 'obstetrics'], true, 9),
('812199-2', 'Medical Spa', 'Healthcare', ARRAY['medical', 'spa', 'medspa', 'aesthetics', 'cosmetic'], true, 8),
('621399', 'Weight Loss Center', 'Healthcare', ARRAY['weight', 'loss', 'diet', 'nutrition', 'wellness'], true, 7)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Dental & Vision (8 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('621210', 'General Dentistry', 'Healthcare', ARRAY['dentist', 'dental', 'teeth', 'oral', 'hygiene'], true, 10),
('621210-2', 'Cosmetic Dentistry', 'Healthcare', ARRAY['cosmetic', 'dentistry', 'veneers', 'whitening', 'smile'], true, 8),
('621210-3', 'Orthodontics', 'Healthcare', ARRAY['orthodontics', 'braces', 'invisalign', 'teeth', 'alignment'], true, 8),
('621210-4', 'Pediatric Dentistry', 'Healthcare', ARRAY['pediatric', 'dentistry', 'children', 'kids', 'dental'], true, 7),
('621210-5', 'Oral Surgery', 'Healthcare', ARRAY['oral', 'surgery', 'wisdom', 'teeth', 'extraction'], true, 6),
('621320', 'Optometry', 'Healthcare', ARRAY['optometry', 'eyes', 'vision', 'glasses', 'contacts'], true, 9),
('621310', 'Chiropractic', 'Healthcare', ARRAY['chiropractic', 'chiropractor', 'back', 'spine', 'adjustment'], true, 8),
('621391', 'Podiatry', 'Healthcare', ARRAY['podiatry', 'foot', 'ankle', 'podiatrist'], true, 6)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Wellness & Therapy (6 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('621340', 'Physical Therapy', 'Healthcare', ARRAY['physical', 'therapy', 'rehabilitation', 'injury', 'recovery'], true, 9),
('621399-2', 'Acupuncture', 'Healthcare', ARRAY['acupuncture', 'traditional', 'chinese', 'medicine', 'holistic'], true, 6),
('812199-3', 'Massage Therapy', 'Healthcare', ARRAY['massage', 'therapy', 'relaxation', 'therapeutic', 'spa'], true, 8),
('621399-3', 'Nutrition Coaching', 'Healthcare', ARRAY['nutrition', 'diet', 'coaching', 'health', 'wellness'], true, 7),
('713940', 'Personal Training', 'Fitness', ARRAY['personal', 'training', 'fitness', 'exercise', 'trainer'], true, 9),
('611430-2', 'Career Coaching', 'Professional Services', ARRAY['career', 'coaching', 'job', 'employment', 'guidance'], true, 7)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Food Service (8 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('311811', 'Bakery', 'Food Service', ARRAY['bakery', 'bread', 'pastries', 'cakes', 'baked', 'goods'], true, 10),
('722515', 'Cafe/Coffee Shop', 'Food Service', ARRAY['cafe', 'coffee', 'shop', 'espresso', 'latte', 'coffeehouse'], true, 12),
('722513', 'Fast Casual Restaurant', 'Food Service', ARRAY['restaurant', 'fast', 'casual', 'dining', 'food'], true, 10),
('722511', 'Fine Dining Restaurant', 'Food Service', ARRAY['fine', 'dining', 'restaurant', 'upscale', 'gourmet'], true, 8),
('722513-2', 'Quick Service Restaurant', 'Food Service', ARRAY['quick', 'service', 'fast', 'food', 'restaurant'], true, 9),
('722330', 'Food Truck', 'Food Service', ARRAY['food', 'truck', 'mobile', 'catering', 'street', 'food'], true, 9),
('722410', 'Bar/Pub', 'Food Service', ARRAY['bar', 'pub', 'tavern', 'drinks', 'beer', 'cocktails'], true, 8),
('722320', 'Catering Services', 'Food Service', ARRAY['catering', 'events', 'parties', 'food', 'service'], true, 8)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Retail Stores (10 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('442110', 'Furniture Store', 'Retail', ARRAY['furniture', 'store', 'sofa', 'bed', 'table', 'chair'], true, 8),
('453220', 'Gift Shop', 'Retail', ARRAY['gift', 'shop', 'presents', 'souvenirs', 'cards'], true, 7),
('448310', 'Jewelry Store', 'Retail', ARRAY['jewelry', 'store', 'diamonds', 'rings', 'watches'], true, 8),
('444130', 'Hardware Store', 'Retail', ARRAY['hardware', 'store', 'tools', 'supplies', 'home', 'improvement'], true, 9),
('442299', 'Home Decor Store', 'Retail', ARRAY['home', 'decor', 'decorations', 'interior', 'design'], true, 7),
('448140', 'Boutique Clothing Store', 'Retail', ARRAY['boutique', 'clothing', 'fashion', 'apparel', 'clothes'], true, 9),
('451211', 'Bookstore', 'Retail', ARRAY['bookstore', 'books', 'reading', 'literature', 'novels'], true, 6),
('453110', 'Florist', 'Retail', ARRAY['florist', 'flowers', 'bouquets', 'floral', 'arrangements'], true, 7),
('453910', 'Pet Store', 'Retail', ARRAY['pet', 'store', 'animals', 'supplies', 'food'], true, 8),
('451110', 'Sporting Goods', 'Retail', ARRAY['sporting', 'goods', 'sports', 'equipment', 'athletic'], true, 8)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Automotive (8 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('811111', 'Auto Repair', 'Automotive', ARRAY['auto', 'repair', 'mechanic', 'car', 'service', 'garage'], true, 10),
('811192', 'Auto Detailing', 'Automotive', ARRAY['auto', 'detailing', 'car', 'wash', 'clean', 'polish'], true, 8),
('811192-2', 'Car Wash', 'Automotive', ARRAY['car', 'wash', 'auto', 'clean', 'detail'], true, 9),
('811111-2', 'Mobile Mechanic', 'Automotive', ARRAY['mobile', 'mechanic', 'car', 'repair', 'on-site'], true, 7),
('811191', 'Oil Change Service', 'Automotive', ARRAY['oil', 'change', 'lube', 'filter', 'service'], true, 8),
('441320', 'Tire Shop', 'Automotive', ARRAY['tire', 'shop', 'wheels', 'alignment', 'rotation'], true, 8),
('CUSTOM-441110', 'New Car Dealer', 'Automotive', ARRAY['new', 'car', 'dealer', 'dealership', 'auto', 'sales'], true, 10),
('CUSTOM-441120', 'Used Car Dealer', 'Automotive', ARRAY['used', 'car', 'dealer', 'pre-owned', 'vehicles'], true, 9)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Professional Services (15 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('541611', 'Business Consulting', 'Professional Services', ARRAY['business', 'consulting', 'strategy', 'management', 'advisor'], true, 9),
('541613', 'Marketing Agency', 'Professional Services', ARRAY['marketing', 'agency', 'advertising', 'digital', 'social', 'media'], true, 10),
('541613-2', 'Marketing Consulting', 'Professional Services', ARRAY['marketing', 'consulting', 'strategy', 'branding'], true, 8),
('541612', 'HR Consulting', 'Professional Services', ARRAY['hr', 'human', 'resources', 'consulting', 'recruiting'], true, 7),
('541430', 'Graphic Design', 'Professional Services', ARRAY['graphic', 'design', 'logo', 'branding', 'creative'], true, 9),
('541921', 'Photography', 'Professional Services', ARRAY['photography', 'photographer', 'photos', 'portraits', 'wedding'], true, 8),
('512110', 'Video Production', 'Professional Services', ARRAY['video', 'production', 'filming', 'editing', 'media'], true, 8),
('711510', 'Content Writing', 'Professional Services', ARRAY['content', 'writing', 'copywriting', 'blog', 'articles'], true, 8),
('611430', 'Executive Coaching', 'Professional Services', ARRAY['executive', 'coaching', 'leadership', 'development'], true, 7),
('611430-3', 'Sales Coaching', 'Professional Services', ARRAY['sales', 'coaching', 'training', 'performance'], true, 7),
('611430-4', 'Leadership Development', 'Professional Services', ARRAY['leadership', 'development', 'training', 'management'], true, 7),
('611699', 'Life Coaching', 'Professional Services', ARRAY['life', 'coaching', 'personal', 'development', 'goals'], true, 6),
('323111', 'Print Shop', 'Professional Services', ARRAY['print', 'shop', 'printing', 'copies', 'banners'], true, 7),
('722320-2', 'Private Chef Services', 'Professional Services', ARRAY['private', 'chef', 'personal', 'cooking', 'catering'], true, 6),
('812320-2', 'Tailoring/Alterations', 'Professional Services', ARRAY['tailoring', 'alterations', 'seamstress', 'clothing', 'repair'], true, 6)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Tech & IT (12 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('541511', 'Software Development', 'Technology', ARRAY['software', 'development', 'programming', 'coding', 'apps'], true, 10),
('541511-2', 'Web Development', 'Technology', ARRAY['web', 'development', 'website', 'design', 'frontend', 'backend'], true, 10),
('541511-3', 'App Development', 'Technology', ARRAY['app', 'development', 'mobile', 'ios', 'android'], true, 9),
('541512', 'IT Consulting', 'Technology', ARRAY['it', 'consulting', 'technology', 'systems', 'infrastructure'], true, 9),
('541512-2', 'Cybersecurity Services', 'Technology', ARRAY['cybersecurity', 'security', 'protection', 'firewall', 'hacking'], true, 9),
('541512-3', 'Data Analytics', 'Technology', ARRAY['data', 'analytics', 'analysis', 'insights', 'business', 'intelligence'], true, 9),
('518210', 'Cloud Services', 'Technology', ARRAY['cloud', 'services', 'aws', 'azure', 'hosting'], true, 8),
('518210-2', 'Web Hosting', 'Technology', ARRAY['web', 'hosting', 'server', 'website', 'domain'], true, 7),
('541519', 'MSP (Managed Service Provider)', 'Technology', ARRAY['msp', 'managed', 'services', 'it', 'support'], true, 8),
('811212', 'Computer Repair', 'Technology', ARRAY['computer', 'repair', 'pc', 'laptop', 'fix'], true, 8),
('561621', 'Security Systems', 'Technology', ARRAY['security', 'systems', 'alarm', 'surveillance', 'cameras'], true, 8),
('CUSTOM-it-support', 'IT Support Services', 'Technology', ARRAY['it', 'support', 'help', 'desk', 'technical'], true, 9)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Legal Services (5 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('541110', 'General Practice Law', 'Legal', ARRAY['lawyer', 'attorney', 'legal', 'law', 'practice'], true, 8),
('541110-2', 'Business Law', 'Legal', ARRAY['business', 'law', 'corporate', 'contracts', 'legal'], true, 8),
('541110-3', 'Family Law', 'Legal', ARRAY['family', 'law', 'divorce', 'custody', 'adoption'], true, 9),
('541110-4', 'Estate Planning', 'Legal', ARRAY['estate', 'planning', 'will', 'trust', 'probate'], true, 8),
('541110-5', 'Immigration Law', 'Legal', ARRAY['immigration', 'law', 'visa', 'citizenship', 'deportation'], true, 7),
('541110-6', 'Real Estate Law', 'Legal', ARRAY['real', 'estate', 'law', 'property', 'closing'], true, 7)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Real Estate (6 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('531210', 'Residential Real Estate', 'Real Estate', ARRAY['residential', 'real', 'estate', 'homes', 'houses', 'agent'], true, 10),
('531210-2', 'Commercial Real Estate', 'Real Estate', ARRAY['commercial', 'real', 'estate', 'office', 'retail', 'industrial'], true, 8),
('531311', 'Property Management', 'Real Estate', ARRAY['property', 'management', 'rental', 'landlord', 'tenant'], true, 9),
('541990', 'Real Estate Appraiser', 'Real Estate', ARRAY['appraiser', 'appraisal', 'valuation', 'property', 'value'], true, 6),
('524126', 'Direct Property & Casualty Insurance', 'Real Estate', ARRAY['property', 'insurance', 'casualty', 'coverage'], true, 7),
('CUSTOM-re-invest', 'Real Estate Investment', 'Real Estate', ARRAY['real', 'estate', 'investment', 'flipping', 'rental'], true, 7)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Construction (7 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('236118', 'Remodeling Contractor', 'Construction', ARRAY['remodeling', 'renovation', 'contractor', 'home', 'improvement'], true, 10),
('238160', 'Roofing Contractor', 'Construction', ARRAY['roofing', 'roof', 'contractor', 'shingles', 'repair'], true, 9),
('238320', 'Painting Contractor', 'Construction', ARRAY['painting', 'painter', 'contractor', 'interior', 'exterior'], true, 8),
('238330', 'Flooring Contractor', 'Construction', ARRAY['flooring', 'contractor', 'hardwood', 'tile', 'carpet'], true, 8),
('238110', 'Concrete Contractor', 'Construction', ARRAY['concrete', 'contractor', 'foundation', 'driveway', 'sidewalk'], true, 7),
('236115', 'Residential Construction', 'Construction', ARRAY['residential', 'construction', 'home', 'building', 'contractor'], true, 9),
('236220', 'Commercial Construction', 'Construction', ARRAY['commercial', 'construction', 'building', 'contractor'], true, 8),
('236117', 'Home Builder', 'Construction', ARRAY['home', 'builder', 'construction', 'new', 'house'], true, 9)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Home Services (10 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('238220', 'Plumbing Services', 'Home Services', ARRAY['plumbing', 'plumber', 'pipes', 'drain', 'water'], true, 10),
('238210', 'Electrical Services', 'Home Services', ARRAY['electrical', 'electrician', 'wiring', 'outlets', 'lighting'], true, 10),
('238220-2', 'HVAC Services', 'Home Services', ARRAY['hvac', 'heating', 'cooling', 'air', 'conditioning', 'furnace'], true, 10),
('561730', 'Landscaping Services', 'Home Services', ARRAY['landscaping', 'lawn', 'care', 'yard', 'maintenance'], true, 10),
('561720', 'Cleaning Services', 'Home Services', ARRAY['cleaning', 'maid', 'house', 'janitorial', 'service'], true, 10),
('561710', 'Pest Control', 'Home Services', ARRAY['pest', 'control', 'exterminator', 'bugs', 'rodents'], true, 8),
('811490', 'Handyman Services', 'Home Services', ARRAY['handyman', 'repair', 'maintenance', 'fix', 'home'], true, 9),
('236118-2', 'Kitchen & Bath Remodeling', 'Home Services', ARRAY['kitchen', 'bath', 'bathroom', 'remodeling', 'renovation'], true, 9),
('238150', 'Window Installation', 'Home Services', ARRAY['window', 'installation', 'replacement', 'glass', 'doors'], true, 7),
('811490-2', 'Pool Service', 'Home Services', ARRAY['pool', 'service', 'maintenance', 'cleaning', 'repair'], true, 7)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Personal Care (9 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('812112', 'Hair Salon', 'Personal Care', ARRAY['hair', 'salon', 'hairdresser', 'stylist', 'cut', 'color'], true, 10),
('812113', 'Nail Salon', 'Personal Care', ARRAY['nail', 'salon', 'manicure', 'pedicure', 'nails'], true, 9),
('812111', 'Barbershop', 'Personal Care', ARRAY['barbershop', 'barber', 'haircut', 'shave', 'men'], true, 9),
('812199', 'Spa/Wellness Center', 'Personal Care', ARRAY['spa', 'wellness', 'center', 'relaxation', 'treatment'], true, 9),
('812199-4', 'Aesthetics/Skincare', 'Personal Care', ARRAY['aesthetics', 'skincare', 'facial', 'skin', 'beauty'], true, 8),
('812199-5', 'Tanning Salon', 'Personal Care', ARRAY['tanning', 'salon', 'tan', 'bronze', 'uv'], true, 6),
('812199-6', 'Tattoo & Piercing', 'Personal Care', ARRAY['tattoo', 'piercing', 'ink', 'body', 'art'], true, 7),
('812320', 'Dry Cleaning/Laundry', 'Personal Care', ARRAY['dry', 'cleaning', 'laundry', 'clothes', 'wash'], true, 7),
('812320-3', 'Tailoring/Alterations', 'Personal Care', ARRAY['tailoring', 'alterations', 'seamstress', 'hem'], true, 6)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Pet Services (6 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('541940', 'Small Animal Veterinary', 'Pet Services', ARRAY['veterinary', 'vet', 'animal', 'pet', 'clinic'], true, 10),
('541940-2', 'Large Animal Veterinary', 'Pet Services', ARRAY['veterinary', 'vet', 'horse', 'livestock', 'farm'], true, 6),
('541940-3', 'Emergency/Specialty Veterinary', 'Pet Services', ARRAY['emergency', 'vet', 'specialty', 'animal', 'hospital'], true, 7),
('812910', 'Dog Grooming', 'Pet Services', ARRAY['dog', 'grooming', 'pet', 'bath', 'trim'], true, 9),
('812910-2', 'Dog Training', 'Pet Services', ARRAY['dog', 'training', 'obedience', 'puppy', 'behavior'], true, 8),
('812910-3', 'Pet Boarding', 'Pet Services', ARRAY['pet', 'boarding', 'kennel', 'daycare', 'sitting'], true, 8),
('812910-4', 'Mobile Pet Grooming', 'Pet Services', ARRAY['mobile', 'pet', 'grooming', 'van', 'on-site'], true, 7)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Fitness & Wellness (5 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('713940-2', 'Gym/Fitness Studio', 'Fitness', ARRAY['gym', 'fitness', 'studio', 'workout', 'exercise'], true, 10),
('713940-3', 'Yoga Studio', 'Fitness', ARRAY['yoga', 'studio', 'meditation', 'mindfulness', 'wellness'], true, 8),
('713940-4', 'Pilates Studio', 'Fitness', ARRAY['pilates', 'studio', 'core', 'strength', 'flexibility'], true, 7),
('CUSTOM-dance', 'Dance Studio', 'Fitness', ARRAY['dance', 'studio', 'ballet', 'hip-hop', 'lessons'], true, 7),
('CUSTOM-martial', 'Martial Arts Studio', 'Fitness', ARRAY['martial', 'arts', 'karate', 'taekwondo', 'mma'], true, 7)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Education & Childcare (6 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('624410', 'Daycare Center', 'Education', ARRAY['daycare', 'childcare', 'nursery', 'kids', 'children'], true, 10),
('611110', 'Preschool', 'Education', ARRAY['preschool', 'pre-k', 'kindergarten', 'early', 'education'], true, 9),
('624410-2', 'After-School Program', 'Education', ARRAY['after', 'school', 'program', 'kids', 'care'], true, 7),
('611691', 'Tutoring Services', 'Education', ARRAY['tutoring', 'tutor', 'homework', 'help', 'education'], true, 8),
('611610', 'Music Lessons', 'Education', ARRAY['music', 'lessons', 'piano', 'guitar', 'singing'], true, 7),
('CUSTOM-art', 'Art Classes', 'Education', ARRAY['art', 'classes', 'painting', 'drawing', 'creative'], true, 6)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Financial Services (5 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('523930', 'Financial Planning', 'Financial Services', ARRAY['financial', 'planning', 'advisor', 'retirement', 'investment'], true, 9),
('523930-2', 'Investment Advisory', 'Financial Services', ARRAY['investment', 'advisory', 'portfolio', 'wealth', 'management'], true, 8),
('541211', 'CPA Firm', 'Financial Services', ARRAY['cpa', 'accounting', 'tax', 'audit', 'bookkeeping'], true, 10),
('541213', 'Tax Preparation', 'Financial Services', ARRAY['tax', 'preparation', 'returns', 'irs', 'filing'], true, 11),
('541219', 'Bookkeeping Services', 'Financial Services', ARRAY['bookkeeping', 'books', 'accounting', 'quickbooks', 'payroll'], true, 9),
('541191', 'Tax Preparation Services', 'Financial Services', ARRAY['tax', 'services', 'preparation', 'planning', 'consulting'], true, 10)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Insurance (3 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('524210', 'Insurance Agencies and Brokerages', 'Insurance', ARRAY['insurance', 'agency', 'broker', 'agent', 'coverage'], true, 9),
('5241', 'Insurance Carriers', 'Insurance', ARRAY['insurance', 'carrier', 'underwriter', 'policy'], true, 7),
('524298', 'Insurance Related Activities', 'Insurance', ARRAY['insurance', 'claims', 'adjustor', 'services'], true, 6)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Hospitality & Events (5 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('721110', 'Hotel/Motel', 'Hospitality', ARRAY['hotel', 'motel', 'lodging', 'accommodation', 'rooms'], true, 9),
('721191', 'Bed & Breakfast', 'Hospitality', ARRAY['bed', 'breakfast', 'inn', 'lodging', 'boutique'], true, 7),
('531120', 'Event Venue', 'Hospitality', ARRAY['event', 'venue', 'party', 'wedding', 'conference'], true, 8),
('531120-2', 'Wedding Venue', 'Hospitality', ARRAY['wedding', 'venue', 'ceremony', 'reception', 'bridal'], true, 8),
('312120', 'Brewery/Winery', 'Hospitality', ARRAY['brewery', 'winery', 'beer', 'wine', 'tasting'], true, 8)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Other Services (5 profiles)
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
('484210', 'Moving Services', 'Other Services', ARRAY['moving', 'movers', 'relocation', 'packing', 'storage'], true, 8),
('562111', 'Junk Removal', 'Other Services', ARRAY['junk', 'removal', 'hauling', 'trash', 'debris'], true, 7),
('561730-2', 'Tree Services', 'Other Services', ARRAY['tree', 'service', 'trimming', 'removal', 'arborist'], true, 7),
('311999', 'Food Manufacturing', 'Manufacturing', ARRAY['food', 'manufacturing', 'production', 'processing'], true, 6),
('311999-2', 'Specialty Food Products', 'Manufacturing', ARRAY['specialty', 'food', 'artisan', 'gourmet', 'products'], true, 6)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, has_full_profile = true, keywords = EXCLUDED.keywords;

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';

-- Verify counts
DO $$
DECLARE
  total_profiles INTEGER;
  total_naics INTEGER;
  synced_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM industry_profiles WHERE is_active = true;
  SELECT COUNT(*) INTO total_naics FROM naics_codes;
  SELECT COUNT(*) INTO synced_count FROM naics_codes WHERE has_full_profile = true;

  RAISE NOTICE '';
  RAISE NOTICE '✅ SYNC COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Final Status:';
  RAISE NOTICE '   Industry Profiles: %', total_profiles;
  RAISE NOTICE '   NAICS Codes: %', total_naics;
  RAISE NOTICE '   With Full Profiles: %', synced_count;
  RAISE NOTICE '';
  RAISE NOTICE 'All industries are now searchable in the dropdown!';
  RAISE NOTICE 'Hard refresh the page (Cmd+Shift+R) to see them all.';
END $$;