# Week 6: Campaign Builder Integration Plan

**Date:** 2025-11-22
**Status:** Ready to Execute
**Goal:** Wire Campaign Builder UI to Campaign Arc Generator service

---

## Current State

✅ **Campaign Builder UI Complete:**
- CampaignBuilder.tsx (main orchestrator)
- PurposeSelector.tsx (15 campaign templates)
- TimelineVisualizer.tsx (drag-drop timeline)
- CampaignPieceCard.tsx (individual pieces)
- CampaignPreview.tsx (final review)
- Dark mode fully fixed

✅ **Campaign Services Complete:**
- campaign-arc-generator.service.ts (generates 15 campaign types)
- industry-customization.service.ts (10+ industries)
- purpose-detection.service.ts (17 purposes)
- narrative-continuity.service.ts (story coherence)

❌ **Missing Integration:**
- Template selection doesn't generate campaign pieces
- Timeline step shows "No pieces generated yet"
- No connection between UI and services

---

## Architecture Gap

**Current Flow (Broken):**
```
User selects template (e.g., "Hero's Journey")
    ↓
handleTemplateSelect(templateId) fires
    ↓
setState({ selectedTemplateId, step: 'timeline' })
    ↓
Timeline step shows "No pieces generated yet"
    ❌ NO CAMPAIGN GENERATION HAPPENS
```

**Target Flow (Working):**
```
User selects template (e.g., "Hero's Journey")
    ↓
handleTemplateSelect(templateId) fires
    ↓
CampaignArcGenerator.generateCampaignArc(brandId, templateId, options)
    ↓
Returns CampaignArc with 5 pieces + emotional progression
    ↓
setState({ selectedTemplateId, step: 'timeline', pieces, campaign })
    ↓
TimelineVisualizer displays 5 pieces with drag-drop
```

---

## Integration Tasks

### Task 1: Wire Campaign Arc Generation (1 hour)

**File:** `src/components/v2/campaign-builder/CampaignBuilder.tsx`

**Changes:**
1. Import campaign-arc-generator service
2. Call generateCampaignArc() when template selected
3. Convert CampaignArc result to component state format
4. Handle loading/error states

**Code:**
```typescript
import { CampaignArcGenerator } from '@/services/v2/campaign-arc-generator.service';

const arcGenerator = CampaignArcGenerator.getInstance();

const handleTemplateSelect = async (templateId: string) => {
  try {
    setState(prev => ({ ...prev, selectedTemplateId: templateId, loading: true }));

    // Generate campaign arc
    const arc = await arcGenerator.generateCampaignArc(brandId, {
      template: templateId as CampaignTemplate,
      targetAudience: state.targetAudience || 'General audience',
      startDate: state.startDate,
      industry: industry || 'general',
      customization: {
        pieceCount: undefined, // Use template default
        intervalDays: 3,
        excludedTriggers: [],
      },
    });

    // Convert arc to component state
    const campaign: Partial<Campaign> = {
      id: arc.campaignId,
      name: arc.title,
      purpose: arc.purpose,
      startDate: arc.timeline.startDate,
      endDate: arc.timeline.endDate,
      status: 'draft',
      brandId,
    };

    setState(prev => ({
      ...prev,
      campaign,
      pieces: arc.pieces,
      step: 'timeline',
      loading: false,
      error: null,
    }));
  } catch (error) {
    setState(prev => ({
      ...prev,
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to generate campaign',
    }));
  }
};
```

**State Updates:**
```typescript
export interface CampaignBuilderState {
  step: CampaignBuilderStep;
  selectedTemplateId: string | null;
  campaign: Partial<Campaign> | null;
  pieces: CampaignPiece[];
  targetAudience: string;
  startDate: Date;
  loading: boolean;  // ← ADD
  error: string | null;  // ← ADD
}
```

---

### Task 2: Add Loading States (30 min)

**File:** `src/components/v2/campaign-builder/CampaignBuilder.tsx`

**Add Loading Indicator:**
```typescript
{state.loading && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
      <p className="text-gray-900 dark:text-white">Generating campaign...</p>
    </div>
  </div>
)}
```

**Add Error Display:**
```typescript
{state.error && (
  <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
    <p className="text-red-800 dark:text-red-200">{state.error}</p>
    <button
      onClick={() => setState(prev => ({ ...prev, error: null, step: 'purpose' }))}
      className="mt-2 px-4 py-2 text-sm bg-red-600 text-white rounded-md"
    >
      Try Again
    </button>
  </div>
)}
```

---

### Task 3: Fix Type Alignments (30 min)

**Issue:** CampaignArc types vs Component types mismatch

**Files to Check:**
- `src/types/v2/campaign.types.ts`
- `src/types/v2/index.ts`
- `src/services/v2/campaign-arc-generator.service.ts`

**Ensure Compatibility:**
```typescript
// CampaignPiece from arc generator should match UI expectations
export interface CampaignPiece {
  id: string;
  campaignId: string;
  pieceOrder: number;
  title: string;
  content: string;
  emotionalTrigger: EmotionalTrigger;
  scheduledDate: string; // ISO string
  status: 'pending' | 'generated' | 'published';
  performancePrediction?: PerformancePrediction;
}

// Campaign from component should match database schema
export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  purpose: CampaignPurpose;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

---

### Task 4: Add Database Save (30 min)

**File:** `src/components/v2/campaign-builder/CampaignBuilder.tsx`

**Save Campaign on Preview:**
```typescript
import { supabase } from '@/lib/supabase';

const handleSave = async () => {
  if (!state.campaign || !state.pieces.length) return;

  try {
    setState(prev => ({ ...prev, loading: true }));

    // 1. Save campaign
    const { data: savedCampaign, error: campaignError } = await supabase
      .from('campaigns_v2')
      .insert({
        id: state.campaign.id,
        brand_id: brandId,
        name: state.campaign.name,
        purpose: state.campaign.purpose,
        start_date: state.campaign.startDate,
        end_date: state.campaign.endDate,
        status: 'draft',
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // 2. Save pieces
    const { error: piecesError } = await supabase
      .from('campaign_pieces_v2')
      .insert(
        state.pieces.map(piece => ({
          id: piece.id,
          campaign_id: state.campaign!.id,
          piece_order: piece.pieceOrder,
          title: piece.title,
          content: piece.content,
          emotional_trigger: piece.emotionalTrigger,
          scheduled_date: piece.scheduledDate,
          status: piece.status,
          performance_prediction: piece.performancePrediction,
        }))
      );

    if (piecesError) throw piecesError;

    // 3. Navigate to dashboard
    if (onComplete) {
      onComplete(savedCampaign as Campaign, state.pieces);
    }

    setState(prev => ({ ...prev, loading: false }));
  } catch (error) {
    setState(prev => ({
      ...prev,
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to save campaign',
    }));
  }
};
```

---

### Task 5: Create Database Tables (if needed) (30 min)

**Check if tables exist:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('campaigns_v2', 'campaign_pieces_v2');
```

**If not, create migration:**
```sql
-- campaigns_v2 table
CREATE TABLE IF NOT EXISTS campaigns_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- campaign_pieces_v2 table
CREATE TABLE IF NOT EXISTS campaign_pieces_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns_v2(id) ON DELETE CASCADE,
  piece_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  emotional_trigger TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'generated', 'published')),
  performance_prediction JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE campaigns_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_pieces_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read campaigns_v2" ON campaigns_v2 FOR SELECT USING (true);
CREATE POLICY "Authenticated write campaigns_v2" ON campaigns_v2 FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public read campaign_pieces_v2" ON campaign_pieces_v2 FOR SELECT USING (true);
CREATE POLICY "Authenticated write campaign_pieces_v2" ON campaign_pieces_v2 FOR INSERT TO authenticated WITH CHECK (true);
```

---

## Testing Plan

### Manual Tests

**Test 1: Template Selection → Campaign Generation**
1. Navigate to http://localhost:3001/campaign/new
2. Click "Hero's Journey" template
3. See loading spinner
4. Verify 5 campaign pieces appear in Timeline
5. Check emotional progression bar shows colors
6. Verify dates are spaced correctly (3 days apart)

**Test 2: Timeline Editing**
1. After generation, drag pieces to reorder
2. Verify order updates
3. Click delete on a piece
4. Verify it's removed from timeline
5. Verify piece count updates

**Test 3: Preview & Save**
1. Click "Continue to Preview"
2. See all campaign metadata (name, dates, piece count)
3. Expand a piece to see full content
4. Click "Save Campaign"
5. Verify redirect to dashboard
6. Check database for saved campaign + pieces

**Test 4: Error Handling**
1. Disconnect internet
2. Select template
3. See error message
4. Click "Try Again"
5. Reconnect internet
6. Select template again
7. Verify generation succeeds

---

## Success Criteria

✅ **Functional:**
- [ ] Selecting template generates campaign with 3-5 pieces
- [ ] Timeline displays pieces with drag-drop
- [ ] Emotional progression bar shows
- [ ] Preview shows all campaign details
- [ ] Save persists to database
- [ ] Can navigate back/forward through steps

✅ **Technical:**
- [ ] 0 TypeScript errors
- [ ] Campaign arc generator service properly called
- [ ] Types align between service and UI
- [ ] Loading states display
- [ ] Errors handled gracefully

✅ **Quality:**
- [ ] No console errors
- [ ] Dark mode works throughout
- [ ] Responsive on mobile
- [ ] Smooth transitions between steps

---

## Files Modified

1. `src/components/v2/campaign-builder/CampaignBuilder.tsx` (~50 lines added)
2. `src/types/v2/campaign.types.ts` (type alignment)
3. `supabase/migrations/[timestamp]_create_campaigns_v2_tables.sql` (new)

**Total:** ~100-150 lines of code

---

## Time Estimate

- Task 1 (Arc Generation): 1 hour
- Task 2 (Loading States): 30 min
- Task 3 (Type Alignment): 30 min
- Task 4 (Database Save): 30 min
- Task 5 (DB Tables): 30 min
- Testing: 1 hour

**Total: ~4 hours**

---

## Next Steps After Integration

1. Test UVP flow still works (verify no breaking changes)
2. Update build plan with Week 6 completion
3. Create integration report
4. Begin Week 7 (Performance & Polish)

---

**Status:** Ready to Execute
**Blocker:** None
**Branch:** feature/dashboard-v2-week2 (current)
**Recommendation:** Execute as single task (no parallel tracks needed)
