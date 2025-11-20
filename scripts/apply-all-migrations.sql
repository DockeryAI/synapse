-- Combined migration: Create tables + Enable RLS
-- Run this manually in Supabase SQL Editor if push doesn't work

-- =============================================================================
-- 1. CREATE TABLES (from 20251120051645_force_create_tables.sql)
-- =============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.marba_uvps CASCADE;
DROP TABLE IF EXISTS public.uvp_sessions CASCADE;
DROP TABLE IF EXISTS public.location_detection_cache CASCADE;

-- Create marba_uvps
CREATE TABLE public.marba_uvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  products_services JSONB,
  target_customer JSONB NOT NULL,
  transformation_goal JSONB NOT NULL,
  unique_solution JSONB NOT NULL,
  key_benefit JSONB NOT NULL,
  value_proposition_statement TEXT NOT NULL,
  why_statement TEXT,
  what_statement TEXT,
  how_statement TEXT,
  overall_confidence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create uvp_sessions
CREATE TABLE public.uvp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID,
  session_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  current_step TEXT NOT NULL,
  products_data JSONB,
  customer_data JSONB,
  transformation_data JSONB,
  solution_data JSONB,
  benefit_data JSONB,
  complete_uvp JSONB,
  scraped_content JSONB,
  industry_info JSONB,
  business_info JSONB,
  completed_steps TEXT[],
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Create location_detection_cache
CREATE TABLE public.location_detection_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  website_url TEXT,
  has_physical_location BOOLEAN NOT NULL,
  confidence_score INTEGER,
  location_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes
CREATE INDEX idx_marba_uvps_brand_id ON public.marba_uvps(brand_id);
CREATE INDEX idx_uvp_sessions_brand_id ON public.uvp_sessions(brand_id);
CREATE INDEX idx_location_cache_key ON public.location_detection_cache(cache_key);

-- Grant all permissions
GRANT ALL ON public.marba_uvps TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.uvp_sessions TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.location_detection_cache TO postgres, anon, authenticated, service_role;

-- =============================================================================
-- 2. FIX INDUSTRY_PROFILES SCHEMA (from 20251120052650)
-- =============================================================================

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

-- Grant permissions
GRANT ALL ON public.industry_profiles TO postgres, anon, authenticated, service_role;

-- =============================================================================
-- 3. ENABLE RLS WITH PROPER SECURITY POLICIES
-- =============================================================================

-- MARBA_UVPS
ALTER TABLE public.marba_uvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can insert their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can update their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can delete their own UVPs" ON public.marba_uvps;

CREATE POLICY "Users can view their own UVPs"
  ON public.marba_uvps FOR SELECT
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own UVPs"
  ON public.marba_uvps FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own UVPs"
  ON public.marba_uvps FOR UPDATE
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own UVPs"
  ON public.marba_uvps FOR DELETE
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- UVP_SESSIONS
ALTER TABLE public.uvp_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.uvp_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.uvp_sessions;

CREATE POLICY "Users can view their own sessions"
  ON public.uvp_sessions FOR SELECT
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own sessions"
  ON public.uvp_sessions FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own sessions"
  ON public.uvp_sessions FOR UPDATE
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own sessions"
  ON public.uvp_sessions FOR DELETE
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- LOCATION_DETECTION_CACHE
ALTER TABLE public.location_detection_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view location cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can insert cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Authenticated users can update cache" ON public.location_detection_cache;
DROP POLICY IF EXISTS "Service role can delete expired cache" ON public.location_detection_cache;

CREATE POLICY "Anyone can view location cache"
  ON public.location_detection_cache FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cache"
  ON public.location_detection_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update cache"
  ON public.location_detection_cache FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role can delete expired cache"
  ON public.location_detection_cache FOR DELETE
  USING (auth.role() = 'service_role' OR expires_at < NOW());

-- INDUSTRY_PROFILES
ALTER TABLE public.industry_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view industry profiles" ON public.industry_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.industry_profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON public.industry_profiles;
DROP POLICY IF EXISTS "Service role can delete profiles" ON public.industry_profiles;

CREATE POLICY "Anyone can view industry profiles"
  ON public.industry_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert profiles"
  ON public.industry_profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update profiles"
  ON public.industry_profiles FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role can delete profiles"
  ON public.industry_profiles FOR DELETE
  USING (auth.role() = 'service_role');
