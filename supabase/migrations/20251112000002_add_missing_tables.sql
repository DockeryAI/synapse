-- Add missing tables: tactical_plans, marketing_strategies, mirror_objectives

-- Tactical Plans table (for Reach section)
CREATE TABLE IF NOT EXISTS tactical_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  channels JSONB DEFAULT '[]'::jsonb,
  allocations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id)
);

CREATE INDEX IF NOT EXISTS idx_tactical_plans_brand_id ON tactical_plans(brand_id);

-- Marketing Strategies table (for Reimagine section)
CREATE TABLE IF NOT EXISTS marketing_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  strategy_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id)
);

CREATE INDEX IF NOT EXISTS idx_marketing_strategies_brand_id ON marketing_strategies(brand_id);

-- Mirror Objectives table (for Intend section)
CREATE TABLE IF NOT EXISTS mirror_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress NUMERIC DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mirror_objectives_brand_id ON mirror_objectives(brand_id);
CREATE INDEX IF NOT EXISTS idx_mirror_objectives_status ON mirror_objectives(status);
CREATE INDEX IF NOT EXISTS idx_mirror_objectives_category ON mirror_objectives(category);

-- RLS Policies (enable row level security)
ALTER TABLE tactical_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_objectives ENABLE ROW LEVEL SECURITY;

-- Policies for tactical_plans
CREATE POLICY "Users can view tactical_plans for their brands"
  ON tactical_plans FOR SELECT
  USING (true);

CREATE POLICY "Users can insert tactical_plans for their brands"
  ON tactical_plans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update tactical_plans for their brands"
  ON tactical_plans FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete tactical_plans for their brands"
  ON tactical_plans FOR DELETE
  USING (true);

-- Policies for marketing_strategies
CREATE POLICY "Users can view marketing_strategies for their brands"
  ON marketing_strategies FOR SELECT
  USING (true);

CREATE POLICY "Users can insert marketing_strategies for their brands"
  ON marketing_strategies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update marketing_strategies for their brands"
  ON marketing_strategies FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete marketing_strategies for their brands"
  ON marketing_strategies FOR DELETE
  USING (true);

-- Policies for mirror_objectives
CREATE POLICY "Users can view mirror_objectives for their brands"
  ON mirror_objectives FOR SELECT
  USING (true);

CREATE POLICY "Users can insert mirror_objectives for their brands"
  ON mirror_objectives FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update mirror_objectives for their brands"
  ON mirror_objectives FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete mirror_objectives for their brands"
  ON mirror_objectives FOR DELETE
  USING (true);
