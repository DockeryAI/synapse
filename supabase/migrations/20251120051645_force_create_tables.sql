-- Force create tables with explicit schema
-- Drop and recreate to ensure clean state

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

-- Disable RLS (enable it later after testing)
ALTER TABLE public.marba_uvps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.uvp_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_detection_cache DISABLE ROW LEVEL SECURITY;

-- Grant full access to all roles
GRANT ALL ON public.marba_uvps TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.uvp_sessions TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.location_detection_cache TO postgres, anon, authenticated, service_role;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
