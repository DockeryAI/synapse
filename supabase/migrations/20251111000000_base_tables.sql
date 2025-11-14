-- Base tables (brands, users) that other tables depend on
-- This migration assumes auth.users exists (Supabase provides it)

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,

  -- Brand identity (from asset analysis)
  logo_url TEXT, -- NEW: For customer logo integration
  colors JSONB, -- Color palette
  fonts JSONB, -- Typography
  archetype TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  uvp_completed BOOLEAN DEFAULT false, -- Track UVP completion

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brands_user ON brands(user_id);
CREATE INDEX idx_brands_status ON brands(status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brands"
  ON brands FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own brands"
  ON brands FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own brands"
  ON brands FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own brands"
  ON brands FOR DELETE
  USING (user_id = auth.uid());
