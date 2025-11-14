-- Intelligence Cache Table
-- Caches API responses from intelligence services (Serper, OutScraper, Weather, etc.)
-- Smart TTL based on data type: 7d for profiles, 1h for trends, 30m for weather

CREATE TABLE IF NOT EXISTS intelligence_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  data_type TEXT NOT NULL,
  source_api TEXT,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_intelligence_cache_key ON intelligence_cache(cache_key);
CREATE INDEX idx_intelligence_cache_expires_at ON intelligence_cache(expires_at);
CREATE INDEX idx_intelligence_cache_data_type ON intelligence_cache(data_type);
CREATE INDEX idx_intelligence_cache_source_api ON intelligence_cache(source_api);
CREATE INDEX idx_intelligence_cache_brand_id ON intelligence_cache(brand_id);

-- Composite index for brand-specific lookups
CREATE INDEX idx_intelligence_cache_brand_type ON intelligence_cache(brand_id, data_type);

-- Enable RLS
ALTER TABLE intelligence_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations for authenticated users" ON intelligence_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_intelligence_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM intelligence_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run every hour (if pg_cron is available)
-- This will be handled by a background job in the application
COMMENT ON TABLE intelligence_cache IS 'Caches API responses from intelligence services with smart TTL';
COMMENT ON COLUMN intelligence_cache.data_type IS 'Type of cached data: competitor_profile (7d), trend_data (1h), weather (30m), news (2h), etc.';
COMMENT ON COLUMN intelligence_cache.source_api IS 'Source API: serper, outscraper, weather, youtube, etc.';
