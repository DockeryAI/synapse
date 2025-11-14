-- Competitive intelligence snapshots
CREATE TABLE IF NOT EXISTS competitive_intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,

  posting_frequency INT, -- Posts per week
  platforms_active TEXT[], -- Array of platforms
  topics TEXT[], -- Main topics covered
  sentiment_score DECIMAL(3,2),

  gaps_identified JSONB, -- Platform gaps, content gaps, keyword gaps
  opportunities JSONB, -- Actionable opportunities

  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(brand_id, competitor_domain, snapshot_date)
);

-- Indexes
CREATE INDEX idx_competitive_snapshots_brand ON competitive_intelligence_snapshots(brand_id);
CREATE INDEX idx_competitive_snapshots_date ON competitive_intelligence_snapshots(snapshot_date DESC);
CREATE INDEX idx_competitive_snapshots_brand_date ON competitive_intelligence_snapshots(brand_id, snapshot_date DESC);

-- RLS Policies
ALTER TABLE competitive_intelligence_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own competitive intelligence"
  ON competitive_intelligence_snapshots FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert competitive intelligence"
  ON competitive_intelligence_snapshots FOR INSERT
  WITH CHECK (true);
