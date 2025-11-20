-- Fix industry_profiles table schema to match application expectations
-- Drop and recreate with correct structure

DROP TABLE IF EXISTS public.industry_profiles CASCADE;

CREATE TABLE public.industry_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  naics_code TEXT,
  category TEXT,
  profile_data JSONB NOT NULL,
  business_count INTEGER DEFAULT 0,
  template_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add all necessary columns that might be queried
ALTER TABLE public.industry_profiles
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) DEFAULT 1.0;

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_industry_profiles_naics_code ON public.industry_profiles(naics_code);
CREATE INDEX IF NOT EXISTS idx_industry_profiles_name ON public.industry_profiles(name);
CREATE INDEX IF NOT EXISTS idx_industry_profiles_active ON public.industry_profiles(is_active);

-- Disable RLS for development
ALTER TABLE public.industry_profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON public.industry_profiles TO postgres, anon, authenticated, service_role;

-- Force schema reload
NOTIFY pgrst, 'reload schema';