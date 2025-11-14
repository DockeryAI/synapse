-- Mirror Diagnostics Table
-- Stores comprehensive brand diagnostic data with pre/post UVP analysis

CREATE TABLE IF NOT EXISTS mirror_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,

  -- Overall Health Scores (0-100)
  market_position_score INTEGER CHECK (market_position_score BETWEEN 0 AND 100),
  customer_match_score INTEGER CHECK (customer_match_score BETWEEN 0 AND 100),
  brand_clarity_score INTEGER CHECK (brand_clarity_score BETWEEN 0 AND 100),
  overall_health_score INTEGER CHECK (overall_health_score BETWEEN 0 AND 100),

  -- Market Position Analysis
  market_position_data JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   current_rank: number,
  --   total_competitors: number,
  --   top_competitors: [
  --     { name: string, url: string, positioning: string, strengths: string[] }
  --   ],
  --   keyword_rankings: { keyword: rank },
  --   competitive_gaps: [
  --     { gap: string, impact: string, competitors_doing: string[] }
  --   ],
  --   pricing_position: { tier: string, vs_market: string }
  -- }

  -- Customer Truth Analysis
  customer_truth_data JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   expected_demographic: { age: string, income: string, location: string },
  --   actual_demographic: { age: string, income: string, location: string },
  --   match_percentage: number,
  --   why_they_choose: [
  --     { reason: string, percentage: number, source: string }
  --   ],
  --   common_objections: [ string ],
  --   buyer_journey_gaps: [
  --     { stage: string, gap: string, impact: string }
  --   ],
  --   price_vs_value_perception: string
  -- }

  -- Brand Fit Analysis
  brand_fit_data JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   messaging_consistency: number,
  --   touchpoint_analysis: {
  --     website: { message: string, alignment: number },
  --     google: { message: string, alignment: number },
  --     social: { message: string, alignment: number },
  --     reviews: { perceived_as: string, alignment: number }
  --   },
  --   perceived_positioning: string,
  --   differentiation_score: number,
  --   clarity_issues: [
  --     { issue: string, touchpoint: string, fix: string }
  --   ],
  --   trust_signals: {
  --     reviews_count: number,
  --     average_rating: number,
  --     social_proof: string[]
  --   }
  -- }

  -- Critical Gaps (Top 3 priority issues)
  critical_gaps JSONB DEFAULT '[]'::jsonb,
  -- Structure:
  -- [
  --   {
  --     priority: 1 | 2 | 3,
  --     gap: string,
  --     impact: string,
  --     fix: string,
  --     fix_action_link: string (e.g., "/roadmap#uvp-flow")
  --   }
  -- ]

  -- UVP Enhancement (Post-UVP only, null pre-UVP)
  uvp_delivery_analysis JSONB,
  -- Structure (only populated after UVP completion):
  -- {
  --   uvp_promise: string,
  --   delivery_score: number,
  --   customer_confirmation_percentage: number,
  --   alignment_metrics: {
  --     messaging: number,
  --     reviews: number,
  --     search: number
  --   },
  --   uvp_keyword_rankings: { keyword: rank },
  --   differentiation_proof: [
  --     { claim: string, validated: boolean, evidence: string }
  --   ],
  --   nps_before: number,
  --   nps_after: number,
  --   alignment_gaps: [
  --     { area: string, gap: string, recommendation: string }
  --   ]
  -- }

  -- Metadata
  has_completed_uvp BOOLEAN DEFAULT false,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mirror_diagnostics_brand_id ON mirror_diagnostics(brand_id);
CREATE INDEX idx_mirror_diagnostics_analyzed_at ON mirror_diagnostics(analyzed_at DESC);
CREATE INDEX idx_mirror_diagnostics_uvp_status ON mirror_diagnostics(has_completed_uvp);

-- RLS Policies
ALTER TABLE mirror_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand diagnostics"
  ON mirror_diagnostics
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their brand diagnostics"
  ON mirror_diagnostics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their brand diagnostics"
  ON mirror_diagnostics
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their brand diagnostics"
  ON mirror_diagnostics
  FOR DELETE
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mirror_diagnostics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mirror_diagnostics_updated_at
  BEFORE UPDATE ON mirror_diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION update_mirror_diagnostics_updated_at();

-- Comments for documentation
COMMENT ON TABLE mirror_diagnostics IS 'Stores comprehensive brand diagnostic data with 3 core analyses: Market Position, Customer Truth, and Brand Fit. Includes pre-UVP and post-UVP views.';
COMMENT ON COLUMN mirror_diagnostics.market_position_score IS 'Score 0-100 indicating competitive market position';
COMMENT ON COLUMN mirror_diagnostics.customer_match_score IS 'Score 0-100 indicating alignment between expected and actual customers';
COMMENT ON COLUMN mirror_diagnostics.brand_clarity_score IS 'Score 0-100 indicating messaging clarity and consistency';
COMMENT ON COLUMN mirror_diagnostics.overall_health_score IS 'Weighted average of all three core scores';
COMMENT ON COLUMN mirror_diagnostics.critical_gaps IS 'Top 3 priority issues identified in analysis';
COMMENT ON COLUMN mirror_diagnostics.uvp_delivery_analysis IS 'Post-UVP analysis of promise vs delivery (null before UVP completion)';
