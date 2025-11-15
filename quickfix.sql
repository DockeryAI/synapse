-- Quick fix: Create minimal tables needed for app to run

-- 1. Create brands table (minimal version)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create intelligence_cache (without brand_id foreign key)
CREATE TABLE IF NOT EXISTS intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  data_type TEXT NOT NULL,
  source_api TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_cache_key ON intelligence_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_intelligence_cache_expires_at ON intelligence_cache(expires_at);

-- 3. Create industry_profiles (minimal)
CREATE TABLE IF NOT EXISTS industry_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naics_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_industry_profiles_naics ON industry_profiles(naics_code);

-- 4. Disable RLS for demo mode
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE industry_profiles DISABLE ROW LEVEL SECURITY;
