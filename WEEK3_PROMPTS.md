# Week 3 Prompts - Parallel Execution

**⚠️ IMPORTANT:** Run prompts in parallel as indicated. Each phase has multiple prompts that can run simultaneously.

---

## 🚀 Phase 1: TypeScript Cleanup (3 PARALLEL PROMPTS - Day 1)

Run these 3 prompts **SIMULTANEOUSLY** in separate Claude Code instances:

---

### Prompt 1A: Content Calendar TypeScript Fixes

**Claude Instance:** #1 (Parallel)
**Estimated Time:** 3-4 hours

```
WEEK 3 - PHASE 1A: CONTENT CALENDAR TYPESCRIPT FIXES

Project: /Users/byronhudson/Projects/Synapse
Task: Fix all TypeScript errors in content calendar components (~30 errors in 6 files)

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/docs/builds/WEEK3_PARALLEL_EXECUTION.md (Track 1A section)

YOUR MISSION:
Fix all TypeScript errors in content calendar components. Update to use correct SynapseContent types, fix ContentTone mismatches, add missing brandId props.

FILES TO FIX (in this order):
1. src/components/content-calendar/ContentCalendarHub.tsx
2. src/components/content-calendar/ContentItem.tsx
3. src/components/content-calendar/SynapseContentDiscovery.tsx
4. src/components/content-calendar/QualityRating.tsx
5. src/components/content-calendar/ContentGenerator.tsx
6. src/components/content-calendar/CompetitiveInsights.tsx

COMMON ISSUES TO FIX:
- SynapseContent type mismatches: Use type from @/types/synapse/synapseContent.types
- ContentTone must be: 'professional' | 'casual' | 'formal' | 'friendly'
- Missing brandId prop: Add to components that need it
- Property access errors: Check which properties actually exist on types

EXECUTION STEPS:

1. READ TYPE DEFINITIONS
   - Read src/types/synapse/synapseContent.types.ts
   - Read src/types/synapseContent.types.ts (old types)
   - Understand the difference between old and new types

2. FIX EACH FILE
   For each file:
   a) Run typecheck to see specific errors
   b) Read the file completely
   c) Identify all type errors
   d) Fix imports to use correct types
   e) Fix property access to match actual types
   f) Fix ContentTone values to match enum
   g) Add missing props where needed
   h) Verify file compiles

3. VERIFY
   npm run typecheck 2>&1 | grep "content-calendar"
   # Should show 0 errors in content-calendar files

4. COMMIT
   git add src/components/content-calendar/
   git commit -m "fix: Resolve TypeScript errors in content calendar components

   - Update to use correct SynapseContent types
   - Fix ContentTone type mismatches
   - Add missing brandId props
   - Fix property access errors

   Week 3 Phase 1A: Content Calendar TypeScript Fixes Complete

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag week3-phase1a-complete
   git push origin main --tags

CRITICAL RULES:
- DO NOT use @ts-ignore (fix types properly)
- DO NOT skip errors (fix all of them)
- Test compilation after each file
- Only commit when all 6 files have 0 errors

SUCCESS CRITERIA:
✅ All 6 content calendar files compile
✅ TypeScript errors in content-calendar: 0
✅ No @ts-ignore comments added
✅ ESLint warnings reduced
✅ Committed with tag week3-phase1a-complete

WHEN COMPLETE:
Report "Phase 1A Complete" and provide summary of fixes made.
```

---

### Prompt 1B: Campaign & UVP TypeScript Fixes

**Claude Instance:** #2 (Parallel)
**Estimated Time:** 3-4 hours

```
WEEK 3 - PHASE 1B: CAMPAIGN & UVP TYPESCRIPT FIXES

Project: /Users/byronhudson/Projects/Synapse
Task: Fix all TypeScript errors in campaign and UVP wizard components (~25 errors in 8 files)

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/docs/builds/WEEK3_PARALLEL_EXECUTION.md (Track 1B section)

YOUR MISSION:
Fix all TypeScript errors in campaign and UVP components. Handle CampaignTypeId conversions, add missing WizardStepConfig properties, resolve import conflicts.

FILES TO FIX (in this order):
1. src/components/campaign/CampaignTypeSelector.tsx
2. src/pages/CampaignPage.tsx
3. src/components/uvp-wizard/SimpleWizardStepScreen.tsx
4. src/components/uvp-wizard/WizardStepScreen.tsx
5. src/components/uvp-wizard/SmartConfirmation.tsx
6. src/components/uvp-wizard/WizardProgress.tsx
7. src/components/buyer-journey/JourneyStageCard.tsx
8. src/components/buyer-journey/visual/AnimatedJourneyTimeline.tsx

COMMON ISSUES TO FIX:
- CampaignTypeId format: Use CAMPAIGN_ID_TO_TYPE_MAP from @/types/campaign-generation.types
- WizardStepConfig missing properties: Add 'step', 'prompt', 'optional' to type definition
- Import conflicts: Resolve duplicate/conflicting imports
- JourneyStage missing values: Add 'delivery' and 'post-purchase' to type
- CSS properties: Fix ringColor property issue in AnimatedJourneyTimeline

EXECUTION STEPS:

1. READ TYPE DEFINITIONS
   - Read src/types/campaign-generation.types.ts
   - Read src/types/campaign-workflow.types.ts
   - Read src/types/uvp-wizard.types.ts

2. FIX CAMPAIGN TYPE CONVERSIONS
   In CampaignTypeSelector.tsx and CampaignPage.tsx:
   - Import CAMPAIGN_ID_TO_TYPE_MAP
   - Use map for ID → type conversions
   - Fix hardcoded string comparisons

3. FIX WIZARD STEP CONFIG
   Update WizardStepConfig type to include:
   - step: string
   - prompt: string
   - optional?: boolean

4. FIX IMPORT CONFLICTS
   In SmartConfirmation.tsx:
   - Remove conflicting imports
   - Use single source for utility functions

5. FIX JOURNEY STAGES
   Add missing stages to JourneyStage type:
   - delivery
   - post-purchase

6. VERIFY
   npm run typecheck 2>&1 | grep -E "(campaign|uvp-wizard|buyer-journey)"
   # Should show 0 errors

7. COMMIT
   git add src/components/campaign/ src/components/uvp-wizard/ src/components/buyer-journey/ src/pages/CampaignPage.tsx
   git commit -m "fix: Resolve TypeScript errors in campaign and UVP components

   - Fix CampaignTypeId conversions using type map
   - Add missing WizardStepConfig properties
   - Resolve import conflicts in SmartConfirmation
   - Add missing journey stages
   - Fix CSS property issues

   Week 3 Phase 1B: Campaign & UVP TypeScript Fixes Complete

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag week3-phase1b-complete
   git push origin main --tags

CRITICAL RULES:
- Use proper type conversions (not string casting)
- Add missing type properties (don't skip them)
- Test each file after fixing
- Commit only when all 8 files compile

SUCCESS CRITERIA:
✅ All 8 campaign/UVP files compile
✅ TypeScript errors in these files: 0
✅ Type conversions use proper maps
✅ No import conflicts remain
✅ Committed with tag week3-phase1b-complete

WHEN COMPLETE:
Report "Phase 1B Complete" and provide summary of fixes made.
```

---

### Prompt 1C: Synapse Components & Pages TypeScript Fixes

**Claude Instance:** #3 (Parallel)
**Estimated Time:** 4-5 hours

```
WEEK 3 - PHASE 1C: SYNAPSE COMPONENTS & PAGES TYPESCRIPT FIXES

Project: /Users/byronhudson/Projects/Synapse
Task: Fix all TypeScript errors in Synapse components and pages (~75 errors in 7 files)

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/docs/builds/WEEK3_PARALLEL_EXECUTION.md (Track 1C section)

YOUR MISSION:
Fix all TypeScript errors in Synapse components and SynapsePage. Export missing types, fix property access, add missing config properties. Delete broken files.

FILES TO FIX (in this order):
1. src/components/synapse/ContentEnhancements.tsx
2. src/components/synapse/CharacterCountBadge.tsx
3. src/components/synapse/EdginessSlider.tsx
4. src/components/synapse/ProvenanceViewer.tsx
5. src/pages/SynapsePage.tsx
6. src/components/ai/ChatWidget.tsx
7. src/components/industry/ProfileGenerationProgress.tsx

FILE TO DELETE:
- src/pages/SynapsePage_FULL_BROKEN.tsx (unused, too many errors)

COMMON ISSUES TO FIX:
- Missing exports: Export types from @/types/synapseContent.types
- Property access: Properties like 'format', 'meta', 'prediction', 'psychology', 'optimization', 'provenance' don't exist on current SynapseContent
- AIServiceConfig missing 'model' property
- ProfileGenerationProgress accepts 'error' as status but type doesn't allow it

EXECUTION STEPS:

1. DELETE BROKEN FILE
   git rm src/pages/SynapsePage_FULL_BROKEN.tsx
   # This file is a broken copy, not needed

2. EXPORT MISSING TYPES
   In src/types/synapseContent.types.ts, export:
   - BusinessProfile
   - ContentSection
   - RegenerationResult
   - ABTestGroup
   - CharacterValidation
   - ContentProvenance
   - EdginessLevel
   - HumorEnhancementResult
   - Platform
   - PlatformLimits

3. FIX PROPERTY ACCESS IN SYNAPSEPAGE
   Read SynapsePage.tsx carefully - many properties accessed don't exist:
   - Remove or fix access to: format, meta, prediction, psychology, optimization, provenance, content, insightId
   - Use only properties that exist on SynapseContent type
   - May need to restructure some component logic

4. FIX CONTENTENHANCES.TSX
   - Export missing types from synapseContent.types
   - Fix breakthrough.types import path
   - Fix Platform comparison (use lowercase)

5. FIX CHATWIDGET
   Add 'model' property to AIServiceConfig:
   ```typescript
   {
     apiKey: string;
     model: string; // Add this
   }
   ```

6. FIX PROFILEGENERATIONPROGRESS
   Update status type to include 'error':
   ```typescript
   status: 'research' | 'psychology' | 'market' | 'messaging' | 'generating' | 'saving' | 'validation' | 'operational' | 'error'
   ```

7. VERIFY
   npm run typecheck 2>&1 | grep -E "(synapse|SynapsePage|ChatWidget|ProfileGeneration)"
   # Should show 0 errors

8. COMMIT
   git add src/components/synapse/ src/pages/SynapsePage.tsx src/components/ai/ChatWidget.tsx src/components/industry/ProfileGenerationProgress.tsx src/types/synapseContent.types.ts
   git commit -m "fix: Resolve TypeScript errors in Synapse components and pages

   - Export missing types from synapseContent.types
   - Fix property access on SynapseContent
   - Add missing AIServiceConfig.model property
   - Update ProfileGenerationProgress status type
   - Delete SynapsePage_FULL_BROKEN.tsx (unused)

   Week 3 Phase 1C: Synapse TypeScript Fixes Complete

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag week3-phase1c-complete
   git push origin main --tags

CRITICAL RULES:
- Export ALL missing types (don't skip any)
- Fix property access properly (don't use @ts-ignore)
- Test after each major fix
- Delete unused/broken files
- Commit only when all files compile

SUCCESS CRITERIA:
✅ All 7 Synapse files compile
✅ TypeScript errors: 0
✅ All missing types exported
✅ SynapsePage_FULL_BROKEN.tsx deleted
✅ Committed with tag week3-phase1c-complete

WHEN COMPLETE:
Report "Phase 1C Complete" and provide summary of fixes made.
```

---

## ✅ Phase 1 Complete Verification

**After ALL 3 prompts complete, verify:**

```bash
# Check all tags exist
git tag | grep week3-phase1

# Should show:
# week3-phase1a-complete
# week3-phase1b-complete
# week3-phase1c-complete

# Verify 0 TypeScript errors
npm run typecheck

# Should show: "Found 0 errors"

# Verify build succeeds
npm run build

# Should complete successfully
```

**When all 3 tracks complete:** You're ready for Phase 2! 🎉

---

## 🚀 Phase 2: Performance Optimization (2 PARALLEL PROMPTS - Day 2)

**⚠️ ONLY START AFTER PHASE 1 COMPLETE**

Run these 2 prompts **SIMULTANEOUSLY** in separate Claude Code instances:

---

### Prompt 2A: Code Splitting & Bundle Optimization

**Claude Instance:** #1 (Parallel)
**Estimated Time:** 4-5 hours

```
WEEK 3 - PHASE 2A: CODE SPLITTING & BUNDLE OPTIMIZATION

Project: /Users/byronhudson/Projects/Synapse
Task: Reduce bundle size from 2 MB to <1.5 MB through code splitting and tree shaking

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/docs/builds/WEEK3_PARALLEL_EXECUTION.md (Track 2A section)

PREREQUISITES:
- Phase 1 must be complete (0 TypeScript errors)
- All 3 Phase 1 tags must exist

YOUR MISSION:
Implement code splitting, lazy loading, and tree shaking to reduce bundle size by 25%.

EXECUTION STEPS:

1. ANALYZE CURRENT BUNDLE
   npm run build -- --profile
   # Note the bundle sizes
   # Main bundle should be ~2 MB currently

2. IMPLEMENT LAZY LOADING
   Update these files to use lazy loading:

   src/App.tsx:
   ```typescript
   import { lazy, Suspense } from 'react';

   const CampaignPage = lazy(() => import('./pages/CampaignPage'));
   const OnboardingPageV5 = lazy(() => import('./pages/OnboardingPageV5'));
   const ContentCalendar = lazy(() => import('./components/content-calendar/ContentCalendarHub'));
   const AnalyticsDashboard = lazy(() => import('./components/analytics/CampaignAnalyticsDashboard'));
   ```

   Wrap routes in Suspense:
   ```typescript
   <Suspense fallback={<LoadingSpinner />}>
     <Routes>
       <Route path="/campaign" element={<CampaignPage />} />
       {/* ... */}
     </Routes>
   </Suspense>
   ```

3. CONFIGURE MANUAL CHUNKS
   Update vite.config.ts:
   ```typescript
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'vendor': [
             'react',
             'react-dom',
             'react-router-dom'
           ],
           'campaign': [
             './src/services/campaign/CampaignGenerator.ts',
             './src/services/campaign/ContentGenerator.ts'
           ],
           'analytics': [
             './src/services/analytics/funnel-tracker.service.ts',
             './src/components/analytics/CampaignAnalyticsDashboard.tsx'
           ],
           'calendar': [
             './src/components/content-calendar/ContentCalendarHub.tsx'
           ]
         }
       }
     }
   }
   ```

4. TREE SHAKING
   - Find and remove unused imports
   - Change `import *` to specific imports
   - Remove dead code

5. VERIFY
   npm run build
   # Check new bundle sizes
   # Main chunk should be <500 KB
   # Total should be <1.5 MB

6. LIGHTHOUSE AUDIT
   npm run preview
   # Run Lighthouse in Chrome DevTools
   # Performance score should be >90

7. COMMIT
   git add vite.config.ts src/App.tsx
   git commit -m "perf: Implement code splitting and bundle optimization

   - Add lazy loading for major routes
   - Configure manual chunks for vendors and features
   - Reduce bundle size from 2 MB to <1.5 MB
   - Improve Lighthouse performance score to >90

   Week 3 Phase 2A: Bundle Optimization Complete

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag week3-phase2a-complete
   git push origin main --tags

SUCCESS CRITERIA:
✅ Bundle size <1.5 MB
✅ Main chunk <500 KB
✅ Lighthouse score >90
✅ All pages still load correctly
✅ Committed with tag week3-phase2a-complete

WHEN COMPLETE:
Report "Phase 2A Complete" with before/after bundle sizes.
```

---

### Prompt 2B: Database & Query Optimization

**Claude Instance:** #2 (Parallel)
**Estimated Time:** 3-4 hours

```
WEEK 3 - PHASE 2B: DATABASE & QUERY OPTIMIZATION

Project: /Users/byronhudson/Projects/Synapse
Task: Optimize database queries and add proper indexes for faster performance

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/docs/builds/WEEK3_PARALLEL_EXECUTION.md (Track 2B section)

PREREQUISITES:
- Phase 1 must be complete
- Supabase CLI installed

YOUR MISSION:
Add database indexes, optimize queries, and improve connection handling.

EXECUTION STEPS:

1. CREATE MIGRATION FILE
   Create supabase/migrations/20251120_performance_indexes.sql:
   ```sql
   -- Analytics Events Indexes
   CREATE INDEX IF NOT EXISTS idx_analytics_events_type
     ON analytics_events(event_type);

   CREATE INDEX IF NOT EXISTS idx_analytics_events_brand
     ON analytics_events(brand_id);

   CREATE INDEX IF NOT EXISTS idx_analytics_events_created
     ON analytics_events(created_at DESC);

   CREATE INDEX IF NOT EXISTS idx_analytics_events_type_brand
     ON analytics_events(event_type, brand_id);

   -- Campaign Content Indexes
   CREATE INDEX IF NOT EXISTS idx_campaign_content_status
     ON campaign_content(status);

   CREATE INDEX IF NOT EXISTS idx_campaign_content_platform
     ON campaign_content(platform);

   CREATE INDEX IF NOT EXISTS idx_campaign_content_brand_status
     ON campaign_content(brand_id, status);

   -- Add any other frequently queried tables
   ```

2. APPLY MIGRATION
   supabase db push

3. OPTIMIZE QUERIES
   Review and optimize these files:

   src/services/analytics/funnel-tracker.service.ts:
   - Add specific column selects (not SELECT *)
   - Add proper ordering
   - Add pagination with limit/offset
   - Cache frequent queries

   src/services/campaign/CampaignDB.ts:
   - Add indexes to WHERE clauses
   - Use specific selects
   - Add error handling for connection issues

4. TEST QUERY PERFORMANCE
   In Supabase dashboard:
   - Check query execution times
   - Verify indexes are being used
   - Look for slow queries

5. DOCUMENT INDEXES
   Create docs/development/DATABASE.md:
   - List all indexes
   - Explain query optimization strategy
   - Document connection pooling config

6. COMMIT
   git add supabase/migrations/ src/services/analytics/ src/services/campaign/CampaignDB.ts docs/development/DATABASE.md
   git commit -m "perf: Optimize database queries and add indexes

   - Add indexes for analytics_events table
   - Add indexes for campaign_content table
   - Optimize query selects and ordering
   - Add connection error handling
   - Document database optimization strategy

   Week 3 Phase 2B: Database Optimization Complete

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag week3-phase2b-complete
   git push origin main --tags

SUCCESS CRITERIA:
✅ All indexes created
✅ Migration applied successfully
✅ Queries optimized
✅ Query time <500ms for most queries
✅ Committed with tag week3-phase2b-complete

WHEN COMPLETE:
Report "Phase 2B Complete" with query performance improvements.
```

---

## 📋 Next Phases (Will provide prompts when Phase 1 & 2 complete)

### Phase 3: UI/UX Polish (2 parallel prompts)
- Track 3A: Dark Mode & Responsive
- Track 3B: Accessibility & Animations

### Phase 4: Documentation (2 parallel prompts)
- Track 4A: User Documentation
- Track 4B: Developer Documentation

### Phase 5: Final Testing (sequential)
- E2E test additions
- Manual testing
- Load testing

### Phase 6: Launch (sequential)
- Production setup
- Deployment
- Go live!

---

## 🎯 Your Next Action

**RIGHT NOW:**

1. **Open 3 Claude Code instances**
2. **Copy Prompt 1A** into instance #1
3. **Copy Prompt 1B** into instance #2
4. **Copy Prompt 1C** into instance #3
5. **Press Enter on all 3**
6. **Wait for all to complete** (3-5 hours)
7. **Verify Phase 1 complete** (npm run typecheck should show 0 errors)
8. **Then run Phase 2** prompts (2 parallel instances)

**Phase 1 should take 3-5 hours in parallel (vs 10-13 hours sequential)**

---

**Ready to fix all TypeScript errors? Let's go! 🚀**
