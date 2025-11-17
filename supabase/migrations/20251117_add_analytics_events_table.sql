-- Migration: Add analytics_events table for publishing analytics
-- Created: 2025-11-17
-- Purpose: Track publishing events for success rate analysis and optimization

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type
  ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_brand
  ON analytics_events(brand_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_brand
  ON analytics_events(event_type, brand_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_brand_created
  ON analytics_events(event_type, brand_id, created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their brand's analytics events
CREATE POLICY "Users can view their brand analytics"
  ON analytics_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM brands WHERE id = brand_id
    )
  );

-- Policy: Users can insert analytics events for their brands
CREATE POLICY "Users can insert analytics for their brand"
  ON analytics_events
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM brands WHERE id = brand_id
    )
  );

-- Policy: Admin can view all analytics events
CREATE POLICY "Admins can view all analytics"
  ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_analytics_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_events_updated_at
  BEFORE UPDATE ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_events_updated_at();

-- Add comments for documentation
COMMENT ON TABLE analytics_events IS 'Stores analytics events for tracking publishing performance and other metrics';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event: publishing, engagement, etc.';
COMMENT ON COLUMN analytics_events.event_data IS 'JSONB data containing event-specific details';
COMMENT ON COLUMN analytics_events.brand_id IS 'Reference to the brand this event belongs to';
COMMENT ON COLUMN analytics_events.created_at IS 'Timestamp when the event was created';
COMMENT ON COLUMN analytics_events.updated_at IS 'Timestamp when the event was last updated';

-- Insert initial test event (for development)
-- Uncomment in development environment only
-- INSERT INTO analytics_events (event_type, event_data, brand_id)
-- SELECT
--   'publishing',
--   '{"postId": "test-1", "platform": "linkedin", "status": "published"}'::jsonb,
--   id
-- FROM brands
-- LIMIT 1;
