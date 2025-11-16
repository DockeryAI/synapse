# Week 2 Claude Instance Prompts - Product Intelligence & Visuals

**Instructions:** Copy each prompt into a separate Claude Code instance
**Working Directory:** `/Users/byronhudson/Projects/Synapse`
**Timeline:** Each track completes in 1-2 days
**Integration:** All 3 merge on Friday

---

## PROMPT 1: Product/Service Scanner

```
You are building the Product/Service Scanner feature for Synapse. Work autonomously end-to-end until complete.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

INSTRUCTIONS:
1. Read .buildrunner/ATOMIC_TASK_LIST.md - find "Worktree 6: Product/Service Scanner"
2. Read .buildrunner/MVP_GAP_ANALYSIS.md for context
3. Read .buildrunner/WEEK_BY_WEEK_PLAN.md for integration strategy
4. Create worktree: ../synapse-product-scanner on branch feature/product-scanner
5. Execute ALL tasks in the atomic list for Worktree 6
6. Test thoroughly
7. Commit with descriptive message
8. Report completion

KEY DELIVERABLES (see atomic task list for details):
- Product type definitions and extraction service
- Claude AI-powered product/service extraction from website content
- Product categorization (basic/premium/enterprise tiers)
- Database integration with business_services table
- ProductReview UI component for user confirmation
- Integration with onboarding wizard

EXPLORATION GUIDANCE:
- Examine existing Website Analyzer service for content extraction patterns
- Review business_services table schema in supabase/migrations
- Check existing onboarding wizard structure in src/components/onboarding-v5/
- Study how Claude AI is used in other services (PremiumContentWriter)

CONTEXT:
- Week 1 completed: Campaign generation workflow is built and merged
- This adds product intelligence to enhance campaign personalization
- Products/services will feed into UVP wizard and campaign generation

AUTONOMY LEVEL: FULL
Install dependencies, create files, test, commit - everything end-to-end without asking.

WORK UNTIL COMPLETE. Report when done.
```

---

## PROMPT 2: UVP Wizard Intelligence Integration

```
You are building the UVP Wizard Intelligence Integration for Synapse. Work autonomously end-to-end until complete.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

INSTRUCTIONS:
1. Read .buildrunner/ATOMIC_TASK_LIST.md - find "Worktree 7: UVP Wizard Intelligence Integration"
2. Read .buildrunner/MVP_GAP_ANALYSIS.md for context
3. Read .buildrunner/WEEK_BY_WEEK_PLAN.md for integration strategy
4. Create worktree: ../synapse-uvp-integration on branch feature/uvp-integration
5. Execute ALL tasks in the atomic list for Worktree 7
6. Test thoroughly
7. Commit with descriptive message
8. Report completion

KEY DELIVERABLES (see atomic task list for details):
- IntelligenceAutoPopulator service to map DeepContext → UVP fields
- Updates to UVPWizardContext for intelligence integration
- Enhanced wizard steps with "AI-detected" badges
- Validation mode for user review of AI suggestions
- Backward compatibility maintained
- 5-minute wizard completion (down from 20 minutes)

EXPLORATION GUIDANCE:
- Examine existing UVPWizardContext in src/contexts/UVPWizardContext.tsx
- Review wizard step components in src/components/onboarding-v5/
- Study DeepContext structure in src/types/synapse/deepContext.types.ts
- Check how intelligence flows through the system

CONTEXT:
- Week 1 completed: Campaign workflow built
- This makes onboarding faster by pre-filling wizard with AI insights
- Intelligence comes from 10 APIs already gathering business data

IMPORTANT:
- Make changes ADDITIVE - enhance, don't replace existing wizard
- Maintain backward compatibility for businesses without intelligence
- Use feature flags if needed
- Show confidence scores so users trust AI suggestions

AUTONOMY LEVEL: FULL
Install dependencies, create files, test, commit - everything end-to-end without asking.

WORK UNTIL COMPLETE. Report when done.
```

---

## PROMPT 3: Bannerbear Visual Integration

```
You are building the Bannerbear Visual Integration for Synapse. Work autonomously end-to-end until complete.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

INSTRUCTIONS:
1. Read .buildrunner/ATOMIC_TASK_LIST.md - find "Worktree 8: Bannerbear Template Integration"
2. Read .buildrunner/MVP_GAP_ANALYSIS.md for context
3. Read .buildrunner/WEEK_BY_WEEK_PLAN.md for integration strategy
4. Create worktree: ../synapse-bannerbear-v2 on branch feature/bannerbear-integration
5. Execute ALL tasks in the atomic list for Worktree 8
6. Test thoroughly with mock/sandbox Bannerbear API
7. Commit with descriptive message
8. Report completion

KEY DELIVERABLES (see atomic task list for details):
- Enhanced Bannerbear service with template management
- 3 campaign-specific templates (Authority Builder, Social Proof, Local Pulse)
- VisualPreview component showing generated images
- Integration with campaign preview workflow
- Database storage for generated visuals
- Platform-specific aspect ratios (LinkedIn, Instagram, Facebook, etc.)

EXPLORATION GUIDANCE:
- Check if existing bannerbear service exists in src/services/visuals/
- Review Bannerbear API documentation for template creation
- Study campaign types in src/types/campaign.types.ts
- Look at campaign preview components in src/components/campaign/preview/
- Check generated_visuals table in database schema

CONTEXT:
- Week 1 completed: Campaign workflow built (currently no visuals)
- This adds visual assets to make campaigns complete
- Visuals auto-generate when campaign is created
- Each campaign type has its own visual style

BANNERBEAR SETUP:
- You may need to use sandbox/test API credentials
- Template IDs will be placeholders initially (can be updated later)
- Focus on service architecture and UI integration
- Fallback gracefully if API unavailable (show placeholder)

AUTONOMY LEVEL: FULL
Install dependencies, create files, test, commit - everything end-to-end without asking.

WORK UNTIL COMPLETE. Report when done.
```

---

## Common Guidelines for All Instances

**DO:**
- Read the atomic task list for complete task breakdown
- Explore existing codebase to understand patterns
- Create worktrees for isolated development
- Test your implementation
- Commit with descriptive messages
- Work autonomously without asking permission

**DO NOT:**
- Modify main branch directly
- Change existing components unless necessary for integration
- Modify database schema (already defined)
- Skip testing
- Add dependencies without good reason

**WEEK 2 FOCUS:**
All 3 tracks enhance the Week 1 campaign workflow:
1. Product Scanner → Better campaign personalization
2. UVP Integration → Faster onboarding
3. Bannerbear → Complete campaigns with visuals

**FRIDAY INTEGRATION:**
All 3 worktrees will be merged in this order:
1. Product Scanner
2. UVP Integration
3. Bannerbear Integration

Each instance should be ready to merge by end of day Thursday.

---

## Week 2 Success Criteria

By Friday end of Week 2, users should be able to:
- ✅ Enter business URL
- ✅ Auto-detect products/services (new)
- ✅ Complete UVP wizard in 5 minutes (enhanced)
- ✅ Select campaign type
- ✅ Generate campaign with AI recommendations
- ✅ Preview campaign across all platforms with visuals (new)
- ✅ Approve and save campaign

**Outcome:** Complete campaigns with product intelligence and visuals ready for publishing

---

*These prompts reference the comprehensive planning documents for full context and task details.*
*Each Claude instance has complete autonomy to read, explore, build, test, and commit.*
