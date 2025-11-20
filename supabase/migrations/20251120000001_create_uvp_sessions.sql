-- ============================================================================
-- UVP SESSIONS TABLE - Session Persistence & Auto-Save
-- ============================================================================
-- Created: 2025-11-20
-- Purpose: Store UVP onboarding sessions for resume/restore functionality
-- ============================================================================

-- Create uvp_sessions table
CREATE TABLE IF NOT EXISTS public.uvp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,

  -- Session identification
  session_name TEXT NOT NULL, -- Company name or identifier
  website_url TEXT NOT NULL,
  current_step TEXT NOT NULL CHECK (current_step IN (
    'products',
    'customer',
    'transformation',
    'solution',
    'benefit',
    'synthesis'
  )),

  -- Step data (JSONB for flexibility)
  products_data JSONB,
  customer_data JSONB,
  transformation_data JSONB,
  solution_data JSONB,
  benefit_data JSONB,
  complete_uvp JSONB,

  -- Background data
  scraped_content JSONB, -- Cached website content
  industry_info JSONB, -- Industry and EQ data
  business_info JSONB, -- Business name, location, etc.

  -- Progress tracking
  completed_steps TEXT[] DEFAULT '{}', -- Array of completed step keys
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT uvp_sessions_brand_website_unique UNIQUE (brand_id, website_url)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_uvp_sessions_brand_id ON public.uvp_sessions(brand_id);
CREATE INDEX IF NOT EXISTS idx_uvp_sessions_updated_at ON public.uvp_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_uvp_sessions_last_accessed ON public.uvp_sessions(last_accessed DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_uvp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uvp_sessions_updated_at
  BEFORE UPDATE ON public.uvp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_uvp_sessions_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.uvp_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own brand's sessions
CREATE POLICY "Users can view their own brand sessions"
  ON public.uvp_sessions
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- Users can insert sessions for their own brands
CREATE POLICY "Users can create sessions for their brands"
  ON public.uvp_sessions
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- Users can update their own brand's sessions
CREATE POLICY "Users can update their own brand sessions"
  ON public.uvp_sessions
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own brand's sessions
CREATE POLICY "Users can delete their own brand sessions"
  ON public.uvp_sessions
  FOR DELETE
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.uvp_sessions TO authenticated;
GRANT ALL ON public.uvp_sessions TO service_role;

-- Add comment
COMMENT ON TABLE public.uvp_sessions IS 'Stores UVP onboarding session data for resume/restore functionality';
