-- ============================================================================
-- Onboarding V5 Data Tables
-- ============================================================================
--
-- This migration creates tables for the new 3-page onboarding flow:
-- 1. Value Propositions (from ValuePropositionPage)
-- 2. Buyer Personas (from BuyerIntelligencePage)
-- 3. Core Truth Insights (from CoreTruthPage)
--
-- These tables enable progress saving and resume functionality.
--
-- Created: 2025-11-18
-- ============================================================================

-- ============================================================================
-- Table: value_propositions
-- Stores value propositions extracted/created during onboarding
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_propositions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Core proposition content
  statement text NOT NULL,
  category text NOT NULL CHECK (category IN ('core', 'secondary', 'aspirational')),
  market_position text,
  differentiators jsonb DEFAULT '[]'::jsonb,

  -- Scoring and confidence
  confidence jsonb,
  eq_score jsonb,

  -- Source attribution
  sources jsonb DEFAULT '[]'::jsonb,

  -- Validation status
  validated boolean DEFAULT false,
  user_edited boolean DEFAULT false,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for fast business lookups
CREATE INDEX IF NOT EXISTS idx_value_propositions_business_id
  ON value_propositions(business_id);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_value_propositions_category
  ON value_propositions(category);

-- Enable Row Level Security
ALTER TABLE value_propositions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access value propositions for businesses they own
CREATE POLICY value_propositions_user_access ON value_propositions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM businesses WHERE id = value_propositions.business_id
    )
  );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_value_propositions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER value_propositions_updated_at
  BEFORE UPDATE ON value_propositions
  FOR EACH ROW
  EXECUTE FUNCTION update_value_propositions_updated_at();

-- ============================================================================
-- Table: buyer_personas
-- Stores buyer personas extracted/created during onboarding
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyer_personas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Core persona identity
  name text NOT NULL,
  role text,
  company_type text,
  industry text,

  -- Pain points and desires
  pain_points jsonb DEFAULT '[]'::jsonb,
  desired_outcomes jsonb DEFAULT '[]'::jsonb,

  -- Jobs to be done framework
  jobs_to_be_done jsonb,

  -- Urgency and behavior
  urgency_signals jsonb DEFAULT '[]'::jsonb,
  buying_behavior jsonb,

  -- Validation status
  validated boolean DEFAULT false,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for fast business lookups
CREATE INDEX IF NOT EXISTS idx_buyer_personas_business_id
  ON buyer_personas(business_id);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_buyer_personas_role
  ON buyer_personas(role);

-- Enable Row Level Security
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access buyer personas for businesses they own
CREATE POLICY buyer_personas_user_access ON buyer_personas
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM businesses WHERE id = buyer_personas.business_id
    )
  );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_buyer_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buyer_personas_updated_at
  BEFORE UPDATE ON buyer_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_personas_updated_at();

-- ============================================================================
-- Table: core_truth_insights
-- Stores synthesized core truth insights from onboarding
-- ============================================================================

CREATE TABLE IF NOT EXISTS core_truth_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Core truth statement
  core_truth text NOT NULL,

  -- Psychological framework
  psychological_drivers jsonb DEFAULT '[]'::jsonb,
  transformation_promise text,
  emotional_payoff text,

  -- Synthesis metadata
  synthesis_reasoning text,
  composite_eq_score integer,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for fast business lookups
CREATE INDEX IF NOT EXISTS idx_core_truth_insights_business_id
  ON core_truth_insights(business_id);

-- Index for EQ score filtering
CREATE INDEX IF NOT EXISTS idx_core_truth_insights_eq_score
  ON core_truth_insights(composite_eq_score);

-- Enable Row Level Security
ALTER TABLE core_truth_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access core truth insights for businesses they own
CREATE POLICY core_truth_insights_user_access ON core_truth_insights
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM businesses WHERE id = core_truth_insights.business_id
    )
  );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_core_truth_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER core_truth_insights_updated_at
  BEFORE UPDATE ON core_truth_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_core_truth_insights_updated_at();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE value_propositions IS 'Value propositions from onboarding flow - core, secondary, and aspirational';
COMMENT ON TABLE buyer_personas IS 'Buyer personas extracted from website and onboarding inputs';
COMMENT ON TABLE core_truth_insights IS 'Synthesized core truth insights combining value props and personas';

COMMENT ON COLUMN value_propositions.category IS 'Type of value proposition: core (main), secondary (supporting), aspirational (future state)';
COMMENT ON COLUMN value_propositions.eq_score IS 'Emotional quotient scoring for resonance measurement';
COMMENT ON COLUMN buyer_personas.jobs_to_be_done IS 'Jobs-to-be-done framework data for understanding customer motivations';
COMMENT ON COLUMN core_truth_insights.composite_eq_score IS 'Combined EQ score from all value propositions and personas (0-100)';
