-- Learning patterns (AI-discovered insights)
CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('format', 'timing', 'power_word', 'platform', 'topic')),
  pattern_name TEXT NOT NULL,

  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1), -- 0.00 to 1.00
  sample_size INT,

  impact_data JSONB NOT NULL, -- Performance data supporting this pattern

  learned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_validated TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_learning_patterns_brand ON learning_patterns(brand_id);
CREATE INDEX idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX idx_learning_patterns_confidence ON learning_patterns(confidence DESC);
CREATE INDEX idx_learning_patterns_brand_type ON learning_patterns(brand_id, pattern_type);

-- RLS Policies
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns"
  ON learning_patterns FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert patterns"
  ON learning_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update patterns"
  ON learning_patterns FOR UPDATE
  USING (true);
