# UVP Save Issues - Critical Problems Handoff Document

## Current Crisis Status

**CRITICAL**: Onboarding V5 system completely broken - blank white screen, no UVP flow working

### Immediate Issues Found

1. **New TypeError in UVPSynthesisPage.tsx line 825-843**
   - Error: `Cannot read properties of undefined (reading 'overall')`
   - Accessing `completeUVP.targetCustomer.confidence.overall` when confidence is undefined
   - My previous fixes didn't cover confidence object access

2. **Wrong Step State in Session**
   - Session shows step: "uvp_synthesis" but page crashes before rendering
   - Should be on "uvp_customer" step for profile selection

3. **Database State Unchanged**
   - Still only 4 UVP entries, no new saves
   - Still 0 buyer personas generated
   - My fix for 10 profiles was never tested because page doesn't load

4. **V5 vs V6 System Confusion**
   - URL uses "onboarding-v5" route but build plan calls for V6 system
   - Build plan says "Archive V5 Engine" but we're actively using OnboardingPageV5
   - No clear separation between deprecated and active code

## Root Cause Analysis

### Architecture Problem
- **OnboardingPageV5** is current active system
- **Build Plan** calls for Synapse V6 with V1 engine restoration
- **Competing Systems**: Multiple UVP save pathways creating conflicts
- **No Error Boundaries**: React crashes kill entire page instead of graceful degradation

### Data Flow Breakdown
```
OnboardingV5 → UVP Synthesis → Database Save → Persona Generation
     ↓              ↓               ↓              ↓
  Working      CRASHING         BROKEN        BROKEN
```

### Technical Debt
- Null safety issues throughout UVP rendering components
- Session state management conflicts
- Import/export dependency issues between services
- Missing proper error handling and loading states

## Failed Fix Attempts Today

1. **Fixed synthesizeCompleteUVP customer array** - Never tested due to page crash
2. **Added null checks for .length properties** - Missed .confidence.overall access
3. **Import fixes** - Onboarding service issues persist

## Why We're Using V5 Onboarding

**Answer**: Because that's the only UVP flow that exists. Build plan mentions V6 but:
- No V6 onboarding page has been built yet
- V5 is the active working system (when not crashing)
- Route `/onboarding` maps to `OnboardingPageV5` component

## Critical Questions Needing Research

1. **Should we be using V5 or building V6?** Build plan is confusing
2. **What's the correct UVP data structure?** Components expect different schemas
3. **Why do confidence objects not exist?** Expected by UI but not in data
4. **How should error boundaries work?** Currently none exist
5. **What's the proper session flow?** Step management is broken

## Immediate Blockers

- [ ] Page doesn't load (confidence.overall error)
- [ ] Session state confusion (wrong step stored)
- [ ] No error recovery (React error boundaries missing)
- [ ] Build plan vs reality mismatch (V5 vs V6)
- [ ] Schema inconsistencies (confidence object structure)

This system needs comprehensive research and redesign, not patchwork fixes.