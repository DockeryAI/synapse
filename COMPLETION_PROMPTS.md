# MVP Completion Prompts - Ready to Execute

**⚠️ IMPORTANT:** Run prompts in parallel as indicated. Each phase has multiple prompts that can run simultaneously.

---

## 🚀 Phase 1: TypeScript Fixes (3 PARALLEL PROMPTS - START HERE)

Run these 3 prompts **SIMULTANEOUSLY** in separate Claude Code instances:

---

### Prompt 1A: CampaignGenerator TypeScript Fixes

**Claude Instance:** #1 (Parallel)
**Estimated Time:** 3 hours

```
MVP COMPLETION - PHASE 1A: CAMPAIGNGENERATOR TYPESCRIPT FIXES

Project: /Users/byronhudson/Projects/Synapse
Task: Fix all 33 TypeScript errors in CampaignGenerator.ts

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/ACTUAL_STATUS_NOV18.md
2. /Users/byronhudson/Projects/Synapse/docs/builds/COMPLETION_PARALLEL_PLAN.md (Track 1A section)

YOUR MISSION:
Fix all TypeScript errors in CampaignGenerator.ts by correcting type mismatches, adding missing properties, and updating property access patterns.

EXECUTION STEPS:

1. READ TYPE DEFINITIONS
   Read these files to understand the correct types:
   - src/types/synapse/synapseContent.types.ts
   - src/types/campaign-generation.types.ts
   - src/types/refined-business-data.types.ts

2. ANALYZE ERRORS
   Run: npm run typecheck 2>&1 | grep "CampaignGenerator.ts"
   Document all 33 errors

3. FIX PROPERTY ACCESS ERRORS
   Common issues:
   - `platformContent` doesn't exist on SynapseContent
     Fix: Use correct property name or add to type

   - `psychologyTriggers` doesn't exist on metadata
     Fix: Add to metadata type or use different approach

   - `tone` doesn't exist on metadata
     Fix: Add to metadata type

   - `insight` vs `insightId` naming
     Fix: Use correct property name from type

   - `primaryCustomer` missing from RefinedBusinessData
     Fix: Add to type or use alternative property

   - `websiteUrl` missing from RefinedBusinessData
     Fix: Add to type or use alternative property

   - `industry` missing from RefinedBusinessData
     Fix: Use `specialization` instead

4. FIX INSIGHT TYPE ERRORS
   Errors like: Type '"audience"' is not assignable to type 'InsightType'

   Fix: Update InsightType enum to include all used values:
   - "audience"
   - "differentiator"
   - "problem"
   - "service"

5. FIX GENERATION OPTIONS
   Error: Property 'platforms' does not exist... Did you mean 'platform'?

   Fix: Update to use singular 'platform' instead of 'platforms' array

6. TEST COMPILATION
   After each fix:
   npm run typecheck 2>&1 | grep "CampaignGenerator.ts"

   Continue until 0 errors

7. VERIFY FUNCTIONALITY
   - Read the file to ensure logic still makes sense
   - No functionality should be broken
   - Only types should change

8. COMMIT
   git add src/services/campaign/CampaignGenerator.ts src/types/
   git commit -m "fix: Resolve all TypeScript errors in CampaignGenerator

   - Fix platformContent property access
   - Add missing properties to metadata type
   - Update InsightType enum with all values
   - Fix RefinedBusinessData property access
   - Change platforms array to platform string

   Phase 1 Track 1A: CampaignGenerator TypeScript Fixes Complete

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag phase1-track1a-complete
   git push origin main --tags

CRITICAL RULES:
- DO NOT change business logic, only fix types
- DO NOT use @ts-ignore (fix properly)
- Test compilation after each fix
- Commit only when ALL errors are fixed

SUCCESS CRITERIA:
✅ CampaignGenerator.ts compiles with 0 errors
✅ No functionality broken
✅ All type issues resolved properly
✅ Committed with tag phase1-track1a-complete

WHEN COMPLETE:
Report "Phase 1A Complete - CampaignGenerator: 0 errors"
```

---

### Prompt 1B: SmartPickGenerator TypeScript Fixes

**Claude Instance:** #2 (Parallel)
**Estimated Time:** 2-3 hours

```
MVP COMPLETION - PHASE 1B: SMARTPICKGENERATOR TYPESCRIPT FIXES

Project: /Users/byronhudson/Projects/Synapse
Task: Fix all 10 TypeScript errors in SmartPickGenerator.ts

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/ACTUAL_STATUS_NOV18.md
2. /Users/byronhudson/Projects/Synapse/docs/builds/COMPLETION_PARALLEL_PLAN.md (Track 1B section)

YOUR MISSION:
Fix all TypeScript errors in SmartPickGenerator.ts using the same type fixes as Track 1A (CampaignGenerator).

EXECUTION STEPS:

1. WAIT FOR TRACK 1A TYPE FIXES (5 min)
   Since Track 1A will fix shared types, wait briefly for those changes to be committed.
   Then: git pull origin main

2. READ TYPE DEFINITIONS
   Read the updated types from Track 1A:
   - src/types/synapse/synapseContent.types.ts
   - src/types/campaign-generation.types.ts
   - src/types/refined-business-data.types.ts

3. ANALYZE ERRORS
   Run: npm run typecheck 2>&1 | grep "SmartPickGenerator.ts"
   Document all errors

4. FIX SIMILAR ISSUES TO TRACK 1A
   Apply same fixes:
   - Property access corrections
   - InsightType enum usage
   - RefinedBusinessData property access
   - Platform vs platforms

5. FIX SMART PICK SPECIFIC ISSUES
   - Recommendation scoring type issues
   - Smart pick metadata structure
   - Campaign type matching

6. TEST COMPILATION
   npm run typecheck 2>&1 | grep "SmartPickGenerator.ts"
   Continue until 0 errors

7. VERIFY FUNCTIONALITY
   - Ensure smart picks logic still works
   - Recommendations should still be accurate

8. COMMIT
   git add src/services/campaign/SmartPickGenerator.ts
   git commit -m "fix: Resolve all TypeScript errors in SmartPickGenerator

   - Apply CampaignGenerator type fixes
   - Fix recommendation scoring types
   - Update smart pick metadata structure

   Phase 1 Track 1B: SmartPickGenerator TypeScript Fixes Complete

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag phase1-track1b-complete
   git push origin main --tags

CRITICAL RULES:
- Pull latest changes from Track 1A first
- Use same type fixes as CampaignGenerator
- DO NOT use @ts-ignore
- Test after each fix

SUCCESS CRITERIA:
✅ SmartPickGenerator.ts compiles with 0 errors
✅ Smart picks functionality intact
✅ Consistent with CampaignGenerator fixes
✅ Committed with tag phase1-track1b-complete

WHEN COMPLETE:
Report "Phase 1B Complete - SmartPickGenerator: 0 errors"
```

---

### Prompt 1C: Campaign Templates Config Fixes

**Claude Instance:** #3 (Parallel)
**Estimated Time:** 2 hours

```
MVP COMPLETION - PHASE 1C: CAMPAIGN TEMPLATES CONFIG FIXES

Project: /Users/byronhudson/Projects/Synapse
Task: Fix all 7 TypeScript errors in campaign-templates.config.ts

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/ACTUAL_STATUS_NOV18.md
2. /Users/byronhudson/Projects/Synapse/docs/builds/COMPLETION_PARALLEL_PLAN.md (Track 1C section)

YOUR MISSION:
Fix TypeScript errors in campaign template configuration by removing invalid properties and fixing enum values.

EXECUTION STEPS:

1. READ TYPE DEFINITION
   Read: src/types/campaign-templates.types.ts
   Understand valid properties and enum values

2. ANALYZE ERRORS
   Run: npm run typecheck 2>&1 | grep "campaign-templates.config.ts"

   Expected errors:
   - Unknown property 'price'
   - Unknown property 'trendingText'
   - Invalid ColorPalette value 'bold'
   - Invalid ColorPalette value 'dynamic'
   - Invalid Layout value 'product-focused'
   - Invalid Layout value 'vertical-video'
   - Invalid Typography value 'impactful'

3. FIX UNKNOWN PROPERTIES
   Remove properties that don't exist in CampaignTemplate type:
   - Remove 'price' property
   - Remove 'trendingText' property

   Or if these should exist, add to type definition

4. FIX ENUM VALUES
   Update to valid enum values:

   ColorPalette: 'professional' | 'vibrant' | 'warm' | 'cool'
   - Change 'bold' to one of above
   - Change 'dynamic' to one of above

   Layout: 'split' | 'overlay' | 'centered'
   - Change 'product-focused' to one of above
   - Change 'vertical-video' to one of above

   Typography: 'bold' | 'elegant' | 'modern'
   - Change 'impactful' to one of above

5. MAINTAIN TEMPLATE QUALITY
   - Choose enum values that best match the original intent
   - Don't break existing template configurations
   - Ensure templates remain functional

6. TEST COMPILATION
   npm run typecheck 2>&1 | grep "campaign-templates.config.ts"
   Should show 0 errors

7. COMMIT
   git add src/config/campaign-templates.config.ts
   git commit -m "fix: Resolve TypeScript errors in campaign templates config

   - Remove invalid properties (price, trendingText)
   - Fix ColorPalette enum values
   - Fix Layout enum values
   - Fix Typography enum values

   Phase 1 Track 1C: Campaign Templates Config Fixes Complete

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag phase1-track1c-complete
   git push origin main --tags

CRITICAL RULES:
- Only use valid enum values from types
- Remove or add properties as needed
- Maintain template quality and intent
- Test compilation

SUCCESS CRITERIA:
✅ campaign-templates.config.ts compiles with 0 errors
✅ All enum values are valid
✅ No unknown properties
✅ Templates remain functional
✅ Committed with tag phase1-track1c-complete

WHEN COMPLETE:
Report "Phase 1C Complete - Campaign Templates: 0 errors"
```

---

## ✅ Phase 1 Complete Verification

**After ALL 3 prompts complete, verify:**

```bash
# Check all tags exist
git tag | grep phase1

# Should show:
# phase1-track1a-complete
# phase1-track1b-complete
# phase1-track1c-complete

# Verify 0 errors in these files
npm run typecheck 2>&1 | grep -E "(CampaignGenerator|SmartPickGenerator|campaign-templates)"

# Should show no errors

# Verify build succeeds
npm run build

# Should complete successfully
```

**When all 3 tracks complete:** Report "Phase 1 Complete - Ready for Phase 2 Integration"

---

## 📋 Next Phases (Will provide prompts after Phase 1)

### Phase 2: Service Integration (sequential)
- Integration prompts provided after Phase 1 complete

### Phase 3: Optimization (2 parallel prompts)
- Bundle & database optimization prompts

### Phase 4: Testing (sequential)
- E2E and manual testing prompts

### Phase 5: Documentation (2 parallel prompts)
- User & developer documentation prompts

---

## 🎯 Your Next Action

**RIGHT NOW:**

1. **Open 3 Claude Code instances**
2. **Copy Prompt 1A** into instance #1
3. **Copy Prompt 1B** into instance #2
4. **Copy Prompt 1C** into instance #3
5. **Press Enter on all 3**
6. **Wait for all to complete** (2-3 hours)
7. **Verify Phase 1 complete** (commands above)
8. **Then request Phase 2 prompts**

**Phase 1 should take 3-4 hours in parallel (vs 7-8 hours sequential)**

---

**Ready to fix all critical TypeScript errors? Let's go! 🚀**
