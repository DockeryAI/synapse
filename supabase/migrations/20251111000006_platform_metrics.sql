-- Platform metrics snapshots (daily rollups)
CREATE TABLE IF NOT EXISTS platform_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  platform TEXT NOT NULL,
  snapshot_date DATE NOT NULL,

  followers INT,
  following INT,
  engagement_rate DECIMAL(5,2),
  impressions INT,
  reach INT,
  profile_views INT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(brand_id, platform, snapshot_date)
);

-- Indexes
CREATE INDEX idx_platform_snapshots_brand ON platform_metrics_snapshots(brand_id);
CREATE INDEX idx_platform_snapshots_date ON platform_metrics_snapshots(snapshot_date DESC);
CREATE INDEX idx_platform_snapshots_brand_date ON platform_metrics_snapshots(brand_id, snapshot_date DESC);
CREATE INDEX idx_platform_snapshots_platform ON platform_metrics_snapshots(platform);

-- RLS Policies
ALTER TABLE platform_metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
  ON platform_metrics_snapshots FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert metrics"
  ON platform_metrics_snapshots FOR INSERT
  WITH CHECK (true);
