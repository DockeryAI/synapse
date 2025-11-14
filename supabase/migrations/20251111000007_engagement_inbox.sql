-- Engagement inbox (comments, messages, reviews)
CREATE TABLE IF NOT EXISTS engagement_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  platform TEXT NOT NULL,
  platform_id TEXT NOT NULL, -- ID from platform

  type TEXT NOT NULL CHECK (type IN ('comment', 'message', 'review', 'mention')),
  content TEXT NOT NULL,
  author TEXT,
  author_id TEXT,

  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'replied', 'archived', 'spam')),

  reply_text TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  replied_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(platform, platform_id)
);

-- Indexes
CREATE INDEX idx_engagement_inbox_brand ON engagement_inbox(brand_id);
CREATE INDEX idx_engagement_inbox_status ON engagement_inbox(status);
CREATE INDEX idx_engagement_inbox_created ON engagement_inbox(created_at DESC);
CREATE INDEX idx_engagement_inbox_brand_status ON engagement_inbox(brand_id, status);
CREATE INDEX idx_engagement_inbox_priority ON engagement_inbox(priority) WHERE status = 'new';

-- RLS Policies
ALTER TABLE engagement_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own engagement"
  ON engagement_inbox FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own engagement"
  ON engagement_inbox FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert engagement"
  ON engagement_inbox FOR INSERT
  WITH CHECK (true);
