-- Analytics events tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES content_calendar_items(id) ON DELETE SET NULL,

  platform TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'engagement', 'share', 'conversion')),

  event_data JSONB, -- Event-specific data
  user_data JSONB, -- User demographics, location

  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_brand ON analytics_events(brand_id);
CREATE INDEX idx_analytics_events_content ON analytics_events(content_item_id);
CREATE INDEX idx_analytics_events_occurred ON analytics_events(occurred_at DESC);
CREATE INDEX idx_analytics_events_brand_occurred ON analytics_events(brand_id, occurred_at DESC);
CREATE INDEX idx_analytics_events_platform ON analytics_events(platform);

-- Partitioning by month (optional, for scale)
-- Could add later: PARTITION BY RANGE (occurred_at)

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
  ON analytics_events FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true); -- Analytics collection service needs write access
