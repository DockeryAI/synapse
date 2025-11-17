-- Week 7: Email Captures Table with Source Tracking
-- Captures email addresses from onboarding flow with source attribution
-- Created: 2025-01-17

-- Create email_captures table
CREATE TABLE IF NOT EXISTS public.email_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Email info
  email TEXT NOT NULL,

  -- Business data
  website_url TEXT NOT NULL,
  business_name TEXT,
  industry TEXT,
  location TEXT,

  -- Detected UVP data (with sources)
  detected_uvp JSONB,
  -- Example structure:
  -- {
  --   "customerTypes": [{"text": "...", "confidence": 0.85, "sourceUrl": "..."}],
  --   "services": [...],
  --   "problemsSolved": [...],
  --   "differentiators": [...]
  -- }

  -- Content preview (campaign or post)
  content_preview JSONB,
  -- Example structure:
  -- {
  --   "type": "campaign" | "single_post",
  --   "content": "...",
  --   "postType": "customer_success" | "service_spotlight" | etc,
  --   "platforms": ["instagram", "facebook"],
  --   "scheduledDate": "2025-01-20"
  -- }

  -- Path chosen
  path_chosen TEXT, -- "campaign" or "single_post"
  post_type TEXT, -- Only set if path_chosen = "single_post"

  -- Source URLs (array of URLs used for content generation)
  source_urls JSONB, -- Array of source URL strings
  -- Example: ["https://example.com/about", "https://example.com/services"]

  -- Verification
  source_verified BOOLEAN DEFAULT false,
  verification_rate DECIMAL(3, 2), -- 0.00 to 1.00 (percentage of data with sources)

  -- Conversion tracking
  converted_to_user BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Analytics
  time_to_complete_seconds INTEGER, -- How long did onboarding take?
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_path CHECK (path_chosen IN ('campaign', 'single_post', NULL)),
  CONSTRAINT valid_verification_rate CHECK (verification_rate >= 0 AND verification_rate <= 1)
);

-- Indexes for performance
CREATE INDEX idx_email_captures_email ON public.email_captures(email);
CREATE INDEX idx_email_captures_created_at ON public.email_captures(created_at DESC);
CREATE INDEX idx_email_captures_website ON public.email_captures(website_url);
CREATE INDEX idx_email_captures_path ON public.email_captures(path_chosen);
CREATE INDEX idx_email_captures_converted ON public.email_captures(converted_to_user);
CREATE INDEX idx_email_captures_source_verified ON public.email_captures(source_verified);

-- Enable RLS
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anonymous users to insert their own email captures
CREATE POLICY "Allow anonymous insert" ON public.email_captures
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read their own captures
CREATE POLICY "Users can read own captures" ON public.email_captures
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow authenticated users to update their own captures
CREATE POLICY "Users can update own captures" ON public.email_captures
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.email_captures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_email_captures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_captures_updated_at_trigger
  BEFORE UPDATE ON public.email_captures
  FOR EACH ROW
  EXECUTE FUNCTION update_email_captures_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.email_captures IS 'Week 7: Email captures from onboarding flow with source verification tracking';
COMMENT ON COLUMN public.email_captures.detected_uvp IS 'Extracted UVP data with source attribution (JSONB)';
COMMENT ON COLUMN public.email_captures.source_urls IS 'Array of source URLs used for content generation';
COMMENT ON COLUMN public.email_captures.verification_rate IS 'Percentage of extracted data that has verified sources (0.00 to 1.00)';
COMMENT ON COLUMN public.email_captures.source_verified IS 'Whether all content has verified sources (authenticity principle)';
COMMENT ON COLUMN public.email_captures.time_to_complete_seconds IS 'Time from URL input to email capture (target: < 45 seconds)';
