# Week 6: Campaign Builder Integration - Atomic Prompt

**Task:** Wire Campaign Builder UI to Campaign Arc Generator service

**Time Estimate:** 4 hours

**Branch:** feature/dashboard-v2-week2 (continue on current branch)

---

## Concise Prompt for Execution

```
You are continuing Dashboard V2 Week 6 integration on the feature/dashboard-v2-week2 branch.

CONTEXT:
- Campaign Builder UI is complete (CampaignBuilder.tsx, PurposeSelector.tsx, TimelineVisualizer.tsx, etc.)
- Campaign services exist (campaign-arc-generator.service.ts, industry-customization.service.ts)
- Dark mode is fully fixed
- But UI and services are NOT wired together - selecting a template does nothing

GOAL:
Wire the Campaign Builder so when a user selects a template, it generates campaign pieces using the campaign-arc-generator service.

TASKS:
1. In src/components/v2/campaign-builder/CampaignBuilder.tsx:
   - Import CampaignArcGenerator service
   - Call generateCampaignArc() in handleTemplateSelect()
   - Add loading/error state handling
   - Convert CampaignArc result to component state format (campaign + pieces)

2. Add loading spinner during generation

3. Add error handling with retry button

4. Verify type compatibility between CampaignArc types and component types

5. Add database save functionality to handleSave():
   - Save to campaigns_v2 table
   - Save pieces to campaign_pieces_v2 table
   - Check if tables exist, create migration if needed

6. Manual test:
   - Select "Hero's Journey" template
   - Verify 5 pieces generate and display in Timeline
   - Verify drag-drop works
   - Verify Preview shows all data
   - Verify Save works

CRITICAL RULES:
- NO changes to UVP onboarding code
- Stay on feature/dashboard-v2-week2 branch
- NO V1 imports in V2 code
- Maintain strict V2 isolation
- Test that UVP flow still works after changes

SUCCESS CRITERIA:
- Selecting template generates 3-5 campaign pieces
- Timeline displays pieces with emotional progression
- Preview shows campaign details
- Save persists to database
- 0 TypeScript errors
- UVP flow untouched

REFERENCE DOCS:
- /Users/byronhudson/Projects/Synapse/.buildrunner/WEEK_6_CAMPAIGN_BUILDER_INTEGRATION.md (detailed implementation plan)
- /Users/byronhudson/Projects/Synapse/.buildrunner/WEEK_2_COMPLETE.md (services documentation)

After completion:
1. Test UVP onboarding at http://localhost:3001/onboarding (must still work)
2. Update .buildrunner/DashboardV2BuildPlan.md to mark Week 6 complete
3. Create completion report in .buildrunner/WEEK_6_COMPLETE.md
```

---

## Quick Reference

**Files to Modify:**
1. `src/components/v2/campaign-builder/CampaignBuilder.tsx` (main changes)
2. `src/types/v2/campaign.types.ts` (if type alignment needed)
3. `supabase/migrations/[timestamp]_create_campaigns_v2_tables.sql` (if tables don't exist)

**Services to Use:**
- `CampaignArcGenerator.getInstance()` from `@/services/v2/campaign-arc-generator.service`

**Test URL:**
- http://localhost:3001/campaign/new (Campaign Builder)
- http://localhost:3001/onboarding (UVP - must still work)

**Key Method:**
```typescript
const arc = await arcGenerator.generateCampaignArc(brandId, {
  template: templateId as CampaignTemplate,
  targetAudience: state.targetAudience || 'General audience',
  startDate: state.startDate,
  industry: industry || 'general',
});
```

---

## Verification Checklist

After implementation:
- [ ] Template selection triggers loading spinner
- [ ] Campaign pieces generate (3-5 pieces)
- [ ] Timeline displays pieces with drag-drop
- [ ] Emotional progression bar shows colors
- [ ] Preview displays campaign metadata
- [ ] Save button writes to database
- [ ] UVP onboarding still works
- [ ] 0 TypeScript errors
- [ ] No console errors

---

**Created:** 2025-11-22
**Status:** Ready to execute
**Estimated Time:** 4 hours
**Complexity:** Medium (straightforward service integration)
