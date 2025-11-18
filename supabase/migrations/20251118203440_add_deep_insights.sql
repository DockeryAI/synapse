-- =====================================================
-- Deep Insights Database Schema
-- =====================================================
-- Adds tables for psychology-driven insights:
-- - Value Propositions (4-layer with EQ scoring)
-- - Psychological Triggers (pain/desire mapping)
-- - JTBD Profiles (jobs-to-be-done framework)
--
-- These tables support advanced marketing psychology
-- and customer understanding beyond surface-level features.
-- =====================================================

-- =====================================================
-- Table: value_propositions
-- Stores 4-layer value propositions with EQ scoring
-- =====================================================

CREATE TABLE IF NOT EXISTS value_propositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- 4-Layer Value Proposition
  surface TEXT NOT NULL,              -- What they sell (features, products)
  functional TEXT NOT NULL,           -- What it does (outcomes, results)
  emotional TEXT NOT NULL,            -- How it feels (emotions, states)
  identity TEXT NOT NULL,             -- Who they become (transformation, belonging)

  -- EQ Score (Emotional Intelligence Scoring)
  eq_score DECIMAL(5,2) NOT NULL CHECK (eq_score >= 0 AND eq_score <= 100),
  eq_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb, -- Detailed EQ score breakdown

  -- Metadata
  target_persona TEXT,                -- Which customer segment
  context TEXT,                       -- Where this VP is used
  evidence JSONB DEFAULT '[]'::jsonb, -- Supporting evidence/proof points

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_eq_breakdown CHECK (
    eq_breakdown ? 'emotional_resonance' AND
    eq_breakdown ? 'urgency' AND
    eq_breakdown ? 'identity_alignment' AND
    eq_breakdown ? 'composite'
  )
);

-- Indexes for value_propositions
CREATE INDEX idx_value_propositions_brand_id ON value_propositions(brand_id);
CREATE INDEX idx_value_propositions_eq_score ON value_propositions(eq_score DESC);
CREATE INDEX idx_value_propositions_context ON value_propositions(context);
CREATE INDEX idx_value_propositions_created_at ON value_propositions(created_at DESC);

-- GIN index for JSONB columns
CREATE INDEX idx_value_propositions_eq_breakdown ON value_propositions USING gin(eq_breakdown);
CREATE INDEX idx_value_propositions_evidence ON value_propositions USING gin(evidence);

-- Comments
COMMENT ON TABLE value_propositions IS 'Psychology-driven value propositions with 4-layer depth and EQ scoring';
COMMENT ON COLUMN value_propositions.surface IS 'Surface layer: What they literally sell (features, products)';
COMMENT ON COLUMN value_propositions.functional IS 'Functional layer: What it actually does (tangible outcomes)';
COMMENT ON COLUMN value_propositions.emotional IS 'Emotional layer: How it makes them feel (emotional states)';
COMMENT ON COLUMN value_propositions.identity IS 'Identity layer: Who they become (transformation, belonging)';
COMMENT ON COLUMN value_propositions.eq_score IS 'Composite Emotional Intelligence score (0-100)';
COMMENT ON COLUMN value_propositions.eq_breakdown IS 'Detailed EQ scores: emotional_resonance, urgency, identity_alignment, composite';

-- =====================================================
-- Table: psychological_triggers
-- Stores customer pain points, desires, and triggers
-- =====================================================

CREATE TABLE IF NOT EXISTS psychological_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  industry TEXT,                      -- Can be industry-wide, not just brand-specific

  -- Core Trigger Data
  trigger TEXT NOT NULL,              -- What prompts them to seek a solution
  pain_point TEXT NOT NULL,           -- What they're trying to escape
  desire TEXT NOT NULL,               -- What they're trying to achieve

  -- Classification
  source TEXT NOT NULL,               -- Where insight came from (reddit, reviews, etc.)
  category TEXT,                      -- Type of trigger (pain_point, aspiration, etc.)
  impact_level TEXT,                  -- critical, high, medium, low
  urgency TEXT,                       -- immediate, soon, eventual, optional
  frequency TEXT,                     -- constant, frequent, occasional, rare

  -- Supporting Data
  evidence TEXT,                      -- Specific quote or proof
  persona TEXT,                       -- Which customer segment
  timing JSONB,                       -- When this trigger occurs

  -- Scoring
  priority_score INTEGER CHECK (priority_score >= 0 AND priority_score <= 100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_source CHECK (source IN (
    'reddit', 'reviews', 'website', 'testimonials', 'social_media',
    'survey', 'interview', 'industry_profile', 'competitor_analysis',
    'support_tickets', 'sales_calls', 'ai_analysis'
  )),
  CONSTRAINT valid_impact_level CHECK (impact_level IN ('critical', 'high', 'medium', 'low')),
  CONSTRAINT valid_urgency CHECK (urgency IN ('immediate', 'soon', 'eventual', 'optional')),
  CONSTRAINT valid_frequency CHECK (frequency IN ('constant', 'frequent', 'occasional', 'rare'))
);

-- Indexes for psychological_triggers
CREATE INDEX idx_psychological_triggers_brand_id ON psychological_triggers(brand_id);
CREATE INDEX idx_psychological_triggers_industry ON psychological_triggers(industry);
CREATE INDEX idx_psychological_triggers_source ON psychological_triggers(source);
CREATE INDEX idx_psychological_triggers_category ON psychological_triggers(category);
CREATE INDEX idx_psychological_triggers_impact_level ON psychological_triggers(impact_level);
CREATE INDEX idx_psychological_triggers_priority_score ON psychological_triggers(priority_score DESC);
CREATE INDEX idx_psychological_triggers_created_at ON psychological_triggers(created_at DESC);

-- GIN index for timing JSONB
CREATE INDEX idx_psychological_triggers_timing ON psychological_triggers USING gin(timing);

-- Full-text search index for trigger content
CREATE INDEX idx_psychological_triggers_trigger_fts ON psychological_triggers USING gin(to_tsvector('english', trigger));
CREATE INDEX idx_psychological_triggers_pain_point_fts ON psychological_triggers USING gin(to_tsvector('english', pain_point));
CREATE INDEX idx_psychological_triggers_desire_fts ON psychological_triggers USING gin(to_tsvector('english', desire));

-- Comments
COMMENT ON TABLE psychological_triggers IS 'Customer psychological triggers mapping pain points to desires';
COMMENT ON COLUMN psychological_triggers.trigger IS 'What prompts customer to seek a solution';
COMMENT ON COLUMN psychological_triggers.pain_point IS 'What they are trying to escape (move away from)';
COMMENT ON COLUMN psychological_triggers.desire IS 'What they are trying to achieve (move toward)';
COMMENT ON COLUMN psychological_triggers.source IS 'Data source: reddit, reviews, testimonials, etc.';
COMMENT ON COLUMN psychological_triggers.priority_score IS 'Calculated priority: impact × urgency × frequency';

-- =====================================================
-- Table: jtbd_profiles
-- Stores Jobs-to-be-Done profiles
-- =====================================================

CREATE TABLE IF NOT EXISTS jtbd_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  product_id UUID,                    -- Optional: specific product

  -- Main Job
  job_statement TEXT NOT NULL,        -- Main job-to-be-done statement

  -- Three Job Dimensions (stored as JSONB for flexibility)
  functional_job JSONB NOT NULL,      -- Practical task to accomplish
  emotional_job JSONB NOT NULL,       -- How they want to feel
  social_job JSONB NOT NULL,          -- How they want to be perceived

  -- Job Context
  context JSONB NOT NULL,             -- Circumstances, triggers, stakeholders

  -- Success Criteria
  success_criteria JSONB DEFAULT '[]'::jsonb,

  -- Current Solutions (competition)
  current_solutions JSONB DEFAULT '[]'::jsonb,

  -- Obstacles
  obstacles JSONB DEFAULT '[]'::jsonb,

  -- Scoring
  importance_score INTEGER CHECK (importance_score >= 0 AND importance_score <= 100),
  satisfaction_score INTEGER CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
  opportunity_score INTEGER,          -- Auto-calculated from importance + (importance - satisfaction)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_functional_job CHECK (
    functional_job ? 'main_task' AND
    functional_job ? 'desired_outcome'
  ),
  CONSTRAINT valid_emotional_job CHECK (
    emotional_job ? 'primary_emotion'
  ),
  CONSTRAINT valid_context CHECK (
    context ? 'trigger_moment'
  )
);

-- Indexes for jtbd_profiles
CREATE INDEX idx_jtbd_profiles_brand_id ON jtbd_profiles(brand_id);
CREATE INDEX idx_jtbd_profiles_product_id ON jtbd_profiles(product_id);
CREATE INDEX idx_jtbd_profiles_importance_score ON jtbd_profiles(importance_score DESC);
CREATE INDEX idx_jtbd_profiles_satisfaction_score ON jtbd_profiles(satisfaction_score);
CREATE INDEX idx_jtbd_profiles_opportunity_score ON jtbd_profiles(opportunity_score DESC);
CREATE INDEX idx_jtbd_profiles_created_at ON jtbd_profiles(created_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_jtbd_profiles_functional_job ON jtbd_profiles USING gin(functional_job);
CREATE INDEX idx_jtbd_profiles_emotional_job ON jtbd_profiles USING gin(emotional_job);
CREATE INDEX idx_jtbd_profiles_social_job ON jtbd_profiles USING gin(social_job);
CREATE INDEX idx_jtbd_profiles_context ON jtbd_profiles USING gin(context);
CREATE INDEX idx_jtbd_profiles_success_criteria ON jtbd_profiles USING gin(success_criteria);
CREATE INDEX idx_jtbd_profiles_current_solutions ON jtbd_profiles USING gin(current_solutions);
CREATE INDEX idx_jtbd_profiles_obstacles ON jtbd_profiles USING gin(obstacles);

-- Full-text search on job statement
CREATE INDEX idx_jtbd_profiles_job_statement_fts ON jtbd_profiles USING gin(to_tsvector('english', job_statement));

-- Comments
COMMENT ON TABLE jtbd_profiles IS 'Jobs-to-be-Done customer profiles - what jobs customers hire products to do';
COMMENT ON COLUMN jtbd_profiles.job_statement IS 'Main job-to-be-done statement';
COMMENT ON COLUMN jtbd_profiles.functional_job IS 'Functional dimension: practical task to accomplish';
COMMENT ON COLUMN jtbd_profiles.emotional_job IS 'Emotional dimension: how they want to feel';
COMMENT ON COLUMN jtbd_profiles.social_job IS 'Social dimension: how they want to be perceived';
COMMENT ON COLUMN jtbd_profiles.opportunity_score IS 'Opportunity = importance + (importance - satisfaction)';

-- =====================================================
-- Table: trigger_clusters
-- Groups related psychological triggers
-- =====================================================

CREATE TABLE IF NOT EXISTS trigger_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

  -- Cluster Information
  name TEXT NOT NULL,
  description TEXT,

  -- Triggers in this cluster (array of trigger IDs)
  trigger_ids UUID[] DEFAULT '{}',

  -- Cluster Analysis
  common_pains TEXT[] DEFAULT '{}',
  common_desires TEXT[] DEFAULT '{}',
  messaging_themes TEXT[] DEFAULT '{}',
  affected_personas TEXT[] DEFAULT '{}',

  -- Cluster Metrics
  size INTEGER DEFAULT 0,
  importance_score INTEGER CHECK (importance_score >= 0 AND importance_score <= 100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for trigger_clusters
CREATE INDEX idx_trigger_clusters_brand_id ON trigger_clusters(brand_id);
CREATE INDEX idx_trigger_clusters_importance_score ON trigger_clusters(importance_score DESC);
CREATE INDEX idx_trigger_clusters_size ON trigger_clusters(size DESC);

-- Comments
COMMENT ON TABLE trigger_clusters IS 'Clusters of related psychological triggers for targeted messaging';
COMMENT ON COLUMN trigger_clusters.trigger_ids IS 'Array of psychological_trigger IDs in this cluster';

-- =====================================================
-- Functions & Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update trigger to all tables
CREATE TRIGGER update_value_propositions_updated_at
  BEFORE UPDATE ON value_propositions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psychological_triggers_updated_at
  BEFORE UPDATE ON psychological_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jtbd_profiles_updated_at
  BEFORE UPDATE ON jtbd_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trigger_clusters_updated_at
  BEFORE UPDATE ON trigger_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate opportunity_score for JTBD profiles
CREATE OR REPLACE FUNCTION calculate_jtbd_opportunity_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Opportunity = importance + (importance - satisfaction)
  IF NEW.importance_score IS NOT NULL AND NEW.satisfaction_score IS NOT NULL THEN
    NEW.opportunity_score = NEW.importance_score + GREATEST(0, NEW.importance_score - NEW.satisfaction_score);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_jtbd_opportunity_score_trigger
  BEFORE INSERT OR UPDATE OF importance_score, satisfaction_score ON jtbd_profiles
  FOR EACH ROW EXECUTE FUNCTION calculate_jtbd_opportunity_score();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE value_propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jtbd_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_clusters ENABLE ROW LEVEL SECURITY;

-- Policies for value_propositions
CREATE POLICY "Users can view their own value propositions"
  ON value_propositions FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own value propositions"
  ON value_propositions FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own value propositions"
  ON value_propositions FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own value propositions"
  ON value_propositions FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- Policies for psychological_triggers
CREATE POLICY "Users can view triggers for their brands or industry-wide triggers"
  ON psychological_triggers FOR SELECT
  USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    OR brand_id IS NULL  -- Industry-wide triggers
  );

CREATE POLICY "Users can insert triggers for their own brands"
  ON psychological_triggers FOR INSERT
  WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    OR brand_id IS NULL  -- Allow industry-wide triggers
  );

CREATE POLICY "Users can update their own triggers"
  ON psychological_triggers FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own triggers"
  ON psychological_triggers FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- Policies for jtbd_profiles
CREATE POLICY "Users can view their own JTBD profiles"
  ON jtbd_profiles FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own JTBD profiles"
  ON jtbd_profiles FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own JTBD profiles"
  ON jtbd_profiles FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own JTBD profiles"
  ON jtbd_profiles FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- Policies for trigger_clusters
CREATE POLICY "Users can view their own trigger clusters"
  ON trigger_clusters FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own trigger clusters"
  ON trigger_clusters FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own trigger clusters"
  ON trigger_clusters FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own trigger clusters"
  ON trigger_clusters FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant access to authenticated users
GRANT ALL ON value_propositions TO authenticated;
GRANT ALL ON psychological_triggers TO authenticated;
GRANT ALL ON jtbd_profiles TO authenticated;
GRANT ALL ON trigger_clusters TO authenticated;

-- Grant read access to service role (for background jobs)
GRANT SELECT ON value_propositions TO service_role;
GRANT SELECT ON psychological_triggers TO service_role;
GRANT SELECT ON jtbd_profiles TO service_role;
GRANT SELECT ON trigger_clusters TO service_role;

-- =====================================================
-- Sample Data / Helper Views
-- =====================================================

-- View: Top opportunities (JTBD profiles with high opportunity scores)
CREATE OR REPLACE VIEW jtbd_opportunities AS
SELECT
  j.*,
  b.business_name,
  b.industry
FROM jtbd_profiles j
JOIN brands b ON j.brand_id = b.id
WHERE j.opportunity_score >= 100  -- Opportunity threshold
ORDER BY j.opportunity_score DESC;

COMMENT ON VIEW jtbd_opportunities IS 'JTBD profiles with high opportunity scores (>=100)';

-- View: High-priority triggers
CREATE OR REPLACE VIEW high_priority_triggers AS
SELECT
  t.*,
  b.business_name,
  b.industry as brand_industry
FROM psychological_triggers t
LEFT JOIN brands b ON t.brand_id = b.id
WHERE
  t.priority_score >= 65  -- High priority threshold
  OR t.impact_level IN ('critical', 'high')
ORDER BY t.priority_score DESC NULLS LAST;

COMMENT ON VIEW high_priority_triggers IS 'Psychological triggers with high priority scores or critical/high impact';

-- View: Top-performing value propositions
CREATE OR REPLACE VIEW top_value_propositions AS
SELECT
  v.*,
  b.business_name,
  b.industry
FROM value_propositions v
JOIN brands b ON v.brand_id = b.id
WHERE v.eq_score >= 80  -- Excellent tier
ORDER BY v.eq_score DESC;

COMMENT ON VIEW top_value_propositions IS 'Value propositions with excellent EQ scores (>=80)';

-- =====================================================
-- Completion Message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Deep Insights schema created successfully';
  RAISE NOTICE '   - value_propositions table (4-layer VP with EQ scoring)';
  RAISE NOTICE '   - psychological_triggers table (pain/desire mapping)';
  RAISE NOTICE '   - jtbd_profiles table (jobs-to-be-done framework)';
  RAISE NOTICE '   - trigger_clusters table (trigger grouping)';
  RAISE NOTICE '   - Helper views and auto-calculated fields configured';
  RAISE NOTICE '   - RLS policies enabled for data security';
  RAISE NOTICE '🚀 Ready for psychology-driven marketing insights!';
END $$;
