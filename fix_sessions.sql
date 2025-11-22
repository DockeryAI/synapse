DROP TABLE IF EXISTS brand_sessions CASCADE;

CREATE TABLE brand_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  session_name TEXT NOT NULL,
  url_slug TEXT NOT NULL,
  mirror_state JSONB,
  uvp_state JSONB,
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  completion_percentage INTEGER DEFAULT 0,
  UNIQUE(brand_id, url_slug)
);

ALTER TABLE brand_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_brand_sessions"
  ON brand_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT ALL ON brand_sessions TO anon;
GRANT ALL ON brand_sessions TO authenticated;
GRANT ALL ON brand_sessions TO service_role;

CREATE INDEX idx_brand_sessions_brand_id ON brand_sessions(brand_id);
CREATE INDEX idx_brand_sessions_url_slug ON brand_sessions(url_slug);
CREATE INDEX idx_brand_sessions_last_saved ON brand_sessions(last_saved_at DESC);
