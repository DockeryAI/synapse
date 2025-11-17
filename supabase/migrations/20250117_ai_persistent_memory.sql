/**
 * AI Persistent Memory Migration
 *
 * Creates tables for:
 * - Business context (profile, voice, preferences)
 * - Tone preferences (presets and custom)
 * - Content patterns (learned from performance)
 * - AI learnings (insights and recommendations)
 */

-- ============================================================================
-- AI Business Context Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_business_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN (
    'local-service',
    'restaurant',
    'ecommerce',
    'professional-services',
    'b2b-saas',
    'retail',
    'other'
  )),
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  target_audience TEXT,
  unique_selling_proposition TEXT,
  brand_personality TEXT,
  brand_voice_samples JSONB DEFAULT '[]'::jsonb,
  campaign_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX idx_ai_business_context_user_id ON ai_business_context(user_id);

-- RLS Policies
ALTER TABLE ai_business_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business context"
  ON ai_business_context FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business context"
  ON ai_business_context FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business context"
  ON ai_business_context FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business context"
  ON ai_business_context FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI Tone Preferences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_tone_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tone_preset TEXT CHECK (tone_preset IN (
    'casual',
    'professional',
    'funny',
    'inspirational',
    'bold',
    'friendly',
    'authoritative',
    'conversational'
  )),
  custom_description TEXT,
  formality_level INTEGER NOT NULL CHECK (formality_level BETWEEN 1 AND 5),
  humor_level INTEGER NOT NULL CHECK (humor_level BETWEEN 0 AND 3),
  enthusiasm_level INTEGER NOT NULL CHECK (enthusiasm_level BETWEEN 1 AND 5),
  examples TEXT[] DEFAULT ARRAY[]::TEXT[],
  apply_to_all_content BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX idx_ai_tone_preferences_user_id ON ai_tone_preferences(user_id);

-- RLS Policies
ALTER TABLE ai_tone_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tone preferences"
  ON ai_tone_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tone preferences"
  ON ai_tone_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tone preferences"
  ON ai_tone_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tone preferences"
  ON ai_tone_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI Content Patterns Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_content_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'topic',
    'format',
    'hook',
    'cta',
    'hashtag',
    'timing',
    'platform',
    'content_type'
  )),
  pattern_value TEXT NOT NULL,
  campaign_type TEXT,
  platform TEXT,
  avg_engagement_rate NUMERIC(5,4) NOT NULL,
  avg_reach INTEGER NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 1,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  examples JSONB DEFAULT '[]'::jsonb,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT unique_pattern_per_user UNIQUE(user_id, pattern_type, pattern_value, campaign_type, platform)
);

-- Indexes for fast queries
CREATE INDEX idx_ai_content_patterns_user_id ON ai_content_patterns(user_id);
CREATE INDEX idx_ai_content_patterns_type ON ai_content_patterns(pattern_type);
CREATE INDEX idx_ai_content_patterns_active ON ai_content_patterns(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ai_content_patterns_confidence ON ai_content_patterns(confidence_score DESC);

-- RLS Policies
ALTER TABLE ai_content_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content patterns"
  ON ai_content_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content patterns"
  ON ai_content_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content patterns"
  ON ai_content_patterns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content patterns"
  ON ai_content_patterns FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI Learnings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_category TEXT NOT NULL CHECK (learning_category IN (
    'content',
    'timing',
    'platform',
    'campaign',
    'audience'
  )),
  insight TEXT NOT NULL,
  data_points INTEGER NOT NULL DEFAULT 1,
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for fast queries
CREATE INDEX idx_ai_learnings_user_id ON ai_learnings(user_id);
CREATE INDEX idx_ai_learnings_category ON ai_learnings(learning_category);
CREATE INDEX idx_ai_learnings_confidence ON ai_learnings(confidence DESC);
CREATE INDEX idx_ai_learnings_not_dismissed ON ai_learnings(is_dismissed) WHERE is_dismissed = FALSE;

-- RLS Policies
ALTER TABLE ai_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learnings"
  ON ai_learnings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learnings"
  ON ai_learnings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learnings"
  ON ai_learnings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learnings"
  ON ai_learnings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions for auto-updating timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ai_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_business_context_updated_at
  BEFORE UPDATE ON ai_business_context
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_context_timestamp();

CREATE TRIGGER ai_tone_preferences_updated_at
  BEFORE UPDATE ON ai_tone_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_context_timestamp();

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Example business context for testing
-- Uncomment to create sample data

/*
INSERT INTO ai_business_context (
  user_id,
  business_name,
  industry,
  business_type,
  location_city,
  location_state,
  location_country,
  target_audience,
  unique_selling_proposition,
  brand_personality,
  brand_voice_samples,
  campaign_preferences
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
  'Acme Plumbing',
  'Home Services',
  'local-service',
  'Austin',
  'TX',
  'USA',
  'Homeowners in Austin metro area',
  '24/7 emergency service with guaranteed 2-hour response time',
  'Friendly, reliable, and professional',
  '[
    {
      "id": "sample-1",
      "text": "Need a plumber ASAP? We''re on it. Call us 24/7 for emergency service.",
      "source": "customer_provided",
      "quality_score": 0.9
    }
  ]'::jsonb,
  '{
    "preferred_campaign_types": ["community-champion", "trust-builder"],
    "preferred_platforms": ["facebook", "google-business"],
    "preferred_content_types": ["video", "image"],
    "preferred_durations": [7, 10]
  }'::jsonb
);

-- Example tone preference
INSERT INTO ai_tone_preferences (
  user_id,
  tone_preset,
  formality_level,
  humor_level,
  enthusiasm_level,
  apply_to_all_content
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
  'friendly',
  2,
  1,
  4,
  TRUE
);

-- Example content pattern
INSERT INTO ai_content_patterns (
  user_id,
  pattern_type,
  pattern_value,
  campaign_type,
  platform,
  avg_engagement_rate,
  avg_reach,
  sample_size,
  confidence_score,
  examples,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
  'topic',
  'behind-the-scenes',
  'community-champion',
  'instagram',
  0.08,
  1500,
  5,
  0.75,
  '[
    {
      "post_id": "post-123",
      "content_preview": "Behind the scenes: How we tackle a tough job...",
      "engagement_rate": 0.09
    }
  ]'::jsonb,
  TRUE
);

-- Example learning
INSERT INTO ai_learnings (
  user_id,
  learning_category,
  insight,
  data_points,
  confidence,
  recommendation
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
  'content',
  'Your audience engages 3x more with behind-the-scenes content showing your team at work',
  5,
  0.85,
  'Include more behind-the-scenes posts in your upcoming campaigns'
);
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE ai_business_context IS 'Stores business profile and brand voice that AI remembers';
COMMENT ON TABLE ai_tone_preferences IS 'Stores tone preferences that persist across all content generation';
COMMENT ON TABLE ai_content_patterns IS 'Learned patterns from high-performing content';
COMMENT ON TABLE ai_learnings IS 'AI-generated insights and recommendations for each business';
