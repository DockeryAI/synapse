-- ============================================================================
-- CONTENT CALENDAR TEMPLATES & SYNAPSE INTEGRATION
-- ============================================================================
-- Migration: 20251113000040
-- Purpose: Add template library and Synapse scoring tables for content generation
-- Philosophy: "Hidden complexity, simple results"

-- ============================================================================
-- CONTENT TEMPLATES TABLE
-- ============================================================================
-- Stores reusable content templates with psychology optimization
-- Users see: "Proven templates for your industry"
-- We track: Performance, usage, and optimization data

CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identity
  template_key TEXT UNIQUE NOT NULL, -- e.g., 'auth-01', 'list-01'
  name TEXT NOT NULL, -- User-friendly: "Expert Insights", "Top Benefits"
  description TEXT, -- What this template does

  -- Structure
  structure TEXT NOT NULL CHECK (structure IN (
    'authority', 'list', 'announcement', 'offer',
    'transformation', 'faq', 'storytelling', 'testimonial'
  )),

  -- Content classification
  content_type TEXT NOT NULL CHECK (content_type IN (
    'promotional', 'educational', 'community',
    'authority', 'announcement', 'engagement'
  )),

  -- Platform optimization
  platforms TEXT[] DEFAULT ARRAY['facebook', 'instagram', 'linkedin'],
  optimal_character_count JSONB, -- Per platform: {"facebook": 250, "instagram": 150}

  -- Industry targeting
  industry_tags TEXT[] DEFAULT ARRAY['all'], -- Which industries this works for

  -- Template data
  variables JSONB, -- Variable definitions with types and defaults
  base_structure TEXT, -- Template structure/pattern
  example_output TEXT, -- Example of good output

  -- Performance tracking
  usage_count INTEGER DEFAULT 0,
  avg_synapse_score NUMERIC(5,2) DEFAULT 0, -- Average performance (0-100)
  avg_engagement_rate NUMERIC(5,4) DEFAULT 0, -- Average engagement

  -- Psychology metadata (hidden from users)
  psychology_tags JSONB, -- Triggers, urgency, conversion potential
  power_words_suggested TEXT[], -- Recommended power words for this template

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for template lookup
CREATE INDEX idx_templates_structure ON content_templates(structure);
CREATE INDEX idx_templates_content_type ON content_templates(content_type);
CREATE INDEX idx_templates_industry ON content_templates USING GIN (industry_tags);
CREATE INDEX idx_templates_platforms ON content_templates USING GIN (platforms);
CREATE INDEX idx_templates_active ON content_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_templates_performance ON content_templates(avg_synapse_score DESC);

-- Full text search on templates
CREATE INDEX idx_templates_search ON content_templates USING GIN (
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- ============================================================================
-- SYNAPSE SCORES TABLE
-- ============================================================================
-- Stores detailed psychology scoring for each content item
-- NEVER exposed directly to users - converted to simple star ratings
-- This is where we track the complex stuff behind the scenes

CREATE TABLE IF NOT EXISTS synapse_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to content
  content_id UUID NOT NULL REFERENCES content_calendar_items(id) ON DELETE CASCADE,

  -- Overall scoring (0-100 scale)
  total_score NUMERIC(5,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),

  -- Component scores (each 0-100)
  power_words_score NUMERIC(5,2) DEFAULT 0,
  emotional_triggers_score NUMERIC(5,2) DEFAULT 0,
  readability_score NUMERIC(5,2) DEFAULT 0,
  call_to_action_score NUMERIC(5,2) DEFAULT 0,
  urgency_score NUMERIC(5,2) DEFAULT 0,
  trust_score NUMERIC(5,2) DEFAULT 0,

  -- Detailed metrics (hidden from users)
  power_word_count INTEGER DEFAULT 0,
  emotional_trigger_count INTEGER DEFAULT 0,
  sentence_complexity NUMERIC(5,2),
  flesch_reading_ease NUMERIC(5,2),

  -- Psychology markers (boolean flags)
  has_urgency BOOLEAN DEFAULT false,
  has_social_proof BOOLEAN DEFAULT false,
  has_authority BOOLEAN DEFAULT false,
  has_scarcity BOOLEAN DEFAULT false,
  has_reciprocity BOOLEAN DEFAULT false,

  -- Detailed breakdown (JSONB for flexibility)
  power_words_detected TEXT[],
  emotional_triggers_detected JSONB, -- Array of {type, text, intensity}
  psychology_breakdown JSONB, -- Full Synapse analysis

  -- Quality assessment (what users see)
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5), -- Star rating
  quality_label TEXT CHECK (quality_label IN ('Poor', 'Fair', 'Good', 'Great', 'Excellent')),
  quality_metrics JSONB, -- {engagement: 'high', clarity: 'high', impact: 'medium'}

  -- Improvement suggestions (simple, no psychology jargon)
  suggestions TEXT[],

  -- Scoring metadata
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scoring_version TEXT DEFAULT '1.0', -- Track scoring algorithm version

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for scoring lookups
CREATE INDEX idx_synapse_content ON synapse_scores(content_id);
CREATE INDEX idx_synapse_total_score ON synapse_scores(total_score DESC);
CREATE INDEX idx_synapse_quality ON synapse_scores(quality_rating DESC);
CREATE INDEX idx_synapse_scored_at ON synapse_scores(scored_at DESC);

-- Ensure one score per content item (latest wins)
CREATE UNIQUE INDEX idx_synapse_content_unique ON synapse_scores(content_id);

-- ============================================================================
-- INDUSTRY PROFILES TABLE
-- ============================================================================
-- Read-only reference data for industry-specific psychology patterns
-- Synced from code (src/data/industries)

CREATE TABLE IF NOT EXISTS industry_profiles (
  id TEXT PRIMARY KEY, -- 'restaurant', 'cpa', 'realtor', etc.
  name TEXT NOT NULL,
  naics_code TEXT, -- Optional NAICS linkage

  -- Profile data (stored as JSONB for flexibility)
  profile_data JSONB NOT NULL,
  -- Contains: targetAudience, painPoints, trustBuilders, powerWords,
  --           contentThemes, postingFrequency, psychologyProfile, etc.

  -- Usage stats
  business_count INTEGER DEFAULT 0, -- How many businesses use this profile
  template_count INTEGER DEFAULT 0, -- How many templates for this industry

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for industry lookups
CREATE INDEX idx_industry_active ON industry_profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_industry_naics ON industry_profiles(naics_code) WHERE naics_code IS NOT NULL;

-- Full text search on industries
CREATE INDEX idx_industry_search ON industry_profiles USING GIN (
  to_tsvector('english', name)
);

-- ============================================================================
-- TEMPLATE USAGE TRACKING
-- ============================================================================
-- Track which templates are used with which content
-- Helps optimize template selection over time

CREATE TABLE IF NOT EXISTS content_template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  content_id UUID NOT NULL REFERENCES content_calendar_items(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES content_templates(id) ON DELETE SET NULL,

  -- Performance tracking
  synapse_score NUMERIC(5,2), -- Score achieved with this template
  engagement_rate NUMERIC(5,4), -- Actual engagement when published
  conversion_rate NUMERIC(5,4), -- If tracked

  -- Context
  industry TEXT,
  platform TEXT,
  content_type TEXT,

  -- Outcome
  was_published BOOLEAN DEFAULT false,
  was_regenerated BOOLEAN DEFAULT false,
  regeneration_count INTEGER DEFAULT 0,

  -- Audit
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for usage analysis
CREATE INDEX idx_template_usage_template ON content_template_usage(template_id);
CREATE INDEX idx_template_usage_content ON content_template_usage(content_id);
CREATE INDEX idx_template_usage_industry ON content_template_usage(industry);
CREATE INDEX idx_template_usage_performance ON content_template_usage(synapse_score DESC, engagement_rate DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Content Templates: Read-only for all authenticated users
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON content_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only system can insert templates"
  ON content_templates FOR INSERT
  WITH CHECK (false); -- Templates managed via code

-- Synapse Scores: Private to content owners
ALTER TABLE synapse_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores for their content"
  ON synapse_scores FOR SELECT
  USING (
    content_id IN (
      SELECT c.id FROM content_calendar_items c
      JOIN brands b ON c.brand_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert scores"
  ON synapse_scores FOR INSERT
  WITH CHECK (true); -- Scores created by backend

-- Industry Profiles: Read-only for all authenticated users
ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active industries"
  ON industry_profiles FOR SELECT
  USING (is_active = true);

-- Template Usage: Private to content owners
ALTER TABLE content_template_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view usage for their content"
  ON content_template_usage FOR SELECT
  USING (
    content_id IN (
      SELECT c.id FROM content_calendar_items c
      JOIN brands b ON c.brand_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update template performance after content is published
CREATE OR REPLACE FUNCTION update_template_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update template's average score and usage count
  UPDATE content_templates
  SET
    usage_count = usage_count + 1,
    avg_synapse_score = (
      SELECT AVG(tu.synapse_score)
      FROM content_template_usage tu
      WHERE tu.template_id = NEW.template_id
      AND tu.synapse_score IS NOT NULL
    ),
    avg_engagement_rate = (
      SELECT AVG(tu.engagement_rate)
      FROM content_template_usage tu
      WHERE tu.template_id = NEW.template_id
      AND tu.engagement_rate IS NOT NULL
      AND tu.was_published = true
    ),
    updated_at = NOW()
  WHERE id = NEW.template_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update template stats when usage is tracked
CREATE TRIGGER update_template_stats_on_usage
  AFTER INSERT OR UPDATE ON content_template_usage
  FOR EACH ROW
  WHEN (NEW.synapse_score IS NOT NULL)
  EXECUTE FUNCTION update_template_performance();

-- ============================================================================
-- UPDATED AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_content_templates_updated_at
  BEFORE UPDATE ON content_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_profiles_updated_at
  BEFORE UPDATE ON industry_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE content_templates IS 'Reusable content templates with psychology optimization. Users see simple templates, we track complex performance.';
COMMENT ON TABLE synapse_scores IS 'HIDDEN: Detailed psychology scoring for content. Never exposed directly - converted to star ratings for users.';
COMMENT ON TABLE industry_profiles IS 'Industry-specific psychology patterns and content strategies. Synced from code.';
COMMENT ON TABLE content_template_usage IS 'Tracks template usage and performance for continuous optimization.';

COMMENT ON COLUMN synapse_scores.total_score IS 'Overall Synapse score (0-100). Hidden from users - shown as star rating instead.';
COMMENT ON COLUMN synapse_scores.quality_rating IS 'User-facing: 1-5 star rating derived from total_score';
COMMENT ON COLUMN synapse_scores.psychology_breakdown IS 'Full Synapse analysis. NEVER shown to users. For internal optimization only.';
COMMENT ON COLUMN content_templates.psychology_tags IS 'Hidden psychology markers. Users never see this - just see "Proven template".';
