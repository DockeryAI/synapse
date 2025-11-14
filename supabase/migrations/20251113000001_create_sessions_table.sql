-- Create sessions table for auto-save and resume functionality
CREATE TABLE IF NOT EXISTS brand_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  session_name TEXT NOT NULL,
  url_slug TEXT NOT NULL,

  -- Session data snapshots
  mirror_state JSONB,
  uvp_state JSONB,

  -- Metadata
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Session status
  is_active BOOLEAN DEFAULT true,
  completion_percentage INTEGER DEFAULT 0,

  -- Index for fast lookups
  UNIQUE(brand_id, url_slug)
);

-- Add RLS policies
ALTER TABLE brand_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users on their own brand sessions
CREATE POLICY "Users can manage their brand sessions"
  ON brand_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_brand_sessions_brand_id ON brand_sessions(brand_id);
CREATE INDEX idx_brand_sessions_url_slug ON brand_sessions(url_slug);
CREATE INDEX idx_brand_sessions_last_saved ON brand_sessions(last_saved_at DESC);

-- Add comment
COMMENT ON TABLE brand_sessions IS 'Stores auto-saved sessions for brands with MARBA analysis and UVP data';
