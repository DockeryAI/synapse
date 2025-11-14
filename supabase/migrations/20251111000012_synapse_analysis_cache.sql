-- Synapse analysis cache (avoid re-analyzing same content)
CREATE TABLE IF NOT EXISTS synapse_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  content_hash TEXT NOT NULL UNIQUE, -- Hash of analyzed content
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('psychology', 'connection', 'power_word', 'full')),

  results JSONB NOT NULL,
  score DECIMAL(3,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_synapse_cache_hash ON synapse_analysis_cache(content_hash);
CREATE INDEX idx_synapse_cache_type ON synapse_analysis_cache(analysis_type);
CREATE INDEX idx_synapse_cache_created ON synapse_analysis_cache(created_at DESC);

-- Auto-cleanup old cache entries (30 days)
CREATE INDEX idx_synapse_cache_cleanup ON synapse_analysis_cache(created_at) WHERE created_at < NOW() - INTERVAL '30 days';

-- RLS Policies (public cache, no user-specific policies needed)
ALTER TABLE synapse_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cache is readable by all authenticated users"
  ON synapse_analysis_cache FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert cache entries"
  ON synapse_analysis_cache FOR INSERT
  WITH CHECK (true);
