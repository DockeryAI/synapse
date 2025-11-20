-- Create marba_uvps table
-- Simplified version to ensure creation succeeds

CREATE TABLE IF NOT EXISTS public.marba_uvps (
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
  overall_confidence INTEGER CHECK (overall_confidence >= 0 AND overall_confidence <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create uvp_sessions table
CREATE TABLE IF NOT EXISTS public.uvp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID,
  session_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  current_step TEXT NOT NULL CHECK (current_step IN (
    'products', 'customer', 'transformation', 'solution', 'benefit', 'synthesis'
  )),
  products_data JSONB,
  customer_data JSONB,
  transformation_data JSONB,
  solution_data JSONB,
  benefit_data JSONB,
  complete_uvp JSONB,
  scraped_content JSONB,
  industry_info JSONB,
  business_info JSONB,
  completed_steps TEXT[] DEFAULT '{}',
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Create location_detection_cache table
CREATE TABLE IF NOT EXISTS public.location_detection_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  website_url TEXT,
  has_physical_location BOOLEAN NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  location_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_marba_uvps_brand_id ON public.marba_uvps(brand_id);
CREATE INDEX IF NOT EXISTS idx_uvp_sessions_brand_id ON public.uvp_sessions(brand_id);
CREATE INDEX IF NOT EXISTS idx_location_cache_key ON public.location_detection_cache(cache_key);

-- Disable RLS temporarily to get tables working
ALTER TABLE public.marba_uvps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.uvp_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_detection_cache DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON public.marba_uvps TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.uvp_sessions TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.location_detection_cache TO postgres, anon, authenticated, service_role;
