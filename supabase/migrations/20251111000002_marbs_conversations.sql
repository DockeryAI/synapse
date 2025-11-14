-- Marbs AI Assistant conversation history
-- This platform uses a methodology inspired by SOSTAC® (PR Smith). SOSTAC® is a registered trademark of PR Smith.
-- MIRROR Framework phases: Measure, Intend, Reimagine, Reach, Optimize, Reflect
CREATE TABLE IF NOT EXISTS marbs_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  section TEXT, -- Which MIRROR section user was in (measure, intend, reimagine, reach, optimize, reflect)
  subsection TEXT, -- Which subsection

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,

  context JSONB, -- Context at time of message (page data, user intent, etc.)
  actions_taken JSONB, -- Actions executed by Marbs (if any)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_marbs_conversations_brand ON marbs_conversations(brand_id);
CREATE INDEX idx_marbs_conversations_user ON marbs_conversations(user_id);
CREATE INDEX idx_marbs_conversations_created ON marbs_conversations(created_at DESC);
CREATE INDEX idx_marbs_conversations_brand_created ON marbs_conversations(brand_id, created_at DESC);

-- RLS Policies
ALTER TABLE marbs_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON marbs_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversations"
  ON marbs_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());
