-- Intelligence opportunities (proactive alerts)
CREATE TABLE IF NOT EXISTS intelligence_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('weather', 'trend', 'competitor', 'keyword', 'review', 'seasonal', 'local_news')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  impact_score TEXT CHECK (impact_score IN ('HIGH', 'MEDIUM', 'LOW')),
  urgency_expires_at TIMESTAMP WITH TIME ZONE,

  data JSONB, -- Type-specific data

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'acted_on', 'expired')),
  acted_on_content_id UUID REFERENCES content_calendar_items(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_opportunities_brand ON intelligence_opportunities(brand_id);
CREATE INDEX idx_opportunities_status ON intelligence_opportunities(status);
CREATE INDEX idx_opportunities_brand_status ON intelligence_opportunities(brand_id, status);
CREATE INDEX idx_opportunities_expires ON intelligence_opportunities(urgency_expires_at) WHERE status = 'active';
CREATE INDEX idx_opportunities_created ON intelligence_opportunities(created_at DESC);

-- RLS Policies
ALTER TABLE intelligence_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own opportunities"
  ON intelligence_opportunities FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own opportunities"
  ON intelligence_opportunities FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert opportunities"
  ON intelligence_opportunities FOR INSERT
  WITH CHECK (true);
