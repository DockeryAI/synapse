# Page Reset Issue - Complete Root Cause Analysis

## Problem Statement
The V4ContentPage (Gap Tab) keeps resetting/reloading every 5-10 seconds during competitor scans, causing:
- Lost scan progress
- Wasted API calls (costing money)
- Frustrated user experience

---

## COMPLETE ROOT CAUSE ANALYSIS

### The Cascade Chain

```
File modification (any file in module graph)
    ↓
Vite file watcher detects change
    ↓
Vite attempts Hot Module Replacement (HMR)
    ↓
Module graph traversal hits BrandContext.tsx
    ↓
BrandContext.tsx exports useBrand hook (NON-COMPONENT EXPORT)
    ↓
React Fast Refresh FAILS: "useBrand export is incompatible"
    ↓
Vite falls back to FULL PAGE RELOAD
    ↓
Page resets, all state lost, scan starts over
```

### Primary Cause: Mixed Exports in Context Files

**The Rule**: Vite's React plugin (Fast Refresh) requires `.tsx` files to export ONLY React components (PascalCase). Exporting anything else (hooks, constants, utilities) breaks Fast Refresh.

**Offending Files:**
| File | Problematic Export | Status |
|------|-------------------|--------|
| `src/contexts/BrandContext.tsx` | `export function useBrand()` | **BREAKS HMR** |
| `src/contexts/BrandProfileContext.tsx` | `export const useBrandProfile` | BREAKS HMR |
| `src/contexts/UVPContext.tsx` | `export const useUVP` | BREAKS HMR |
| `src/contexts/SimplifiedJourneyContext.tsx` | `export const useSimplifiedJourney` | BREAKS HMR |
| `src/contexts/MirrorContext.tsx` | `export const useMirror` | BREAKS HMR |
| `src/contexts/SessionContext.tsx` | `export const useSession` | BREAKS HMR |
| `src/contexts/BuyerJourneyContext.tsx` | `export const useBuyerJourney` | BREAKS HMR |
| `src/contexts/UVPWizardContext.tsx` | `export const useUVPWizard` | BREAKS HMR |
| `src/contexts/v2/ModeContext.tsx` | `export const useMode` | BREAKS HMR |
| `src/hooks/useOptimizedAPIData.tsx` | `export function useOptimizedAPIData` | BREAKS HMR (.tsx hook file) |
| `src/components/content-calendar/GenerationProgress.tsx` | `export function useGenerationProgress` | BREAKS HMR |
| `src/components/common/ErrorBoundary.tsx` | `export const useErrorHandler` | BREAKS HMR |

### Secondary Cause: File Changes During Runtime

Files being written during scan execution:
- `src/services/proof/proof-consolidation.service.ts` (runtime writes)
- `src/data/cache/*` (cache files)

These file changes trigger Vite's watcher → HMR attempt → BrandContext invalidation → full reload.

### Why Previous Fixes Failed

| Attempt | Why It Failed |
|---------|---------------|
| Changed `export const useBrand = () =>` to `export function useBrand()` | **Still exports a hook from .tsx** - the problem is the EXPORT from TSX, not the syntax |
| Added `server.watch.ignored` for service directories | Doesn't prevent HMR invalidation of BrandContext when ANY file changes |
| Added React.Suspense wrapper | Irrelevant - reload happens at module level before React even renders |
| Restarted dev server | Doesn't fix the code issue, just clears cached HMR state |

### Active Module Chain for V4ContentPage

```
App.tsx
  └── BrandProvider (from BrandContext.tsx) ← PROBLEM: also exports useBrand
      └── BrandProfileProvider (from BrandProfileContext.tsx) ← PROBLEM: also exports useBrandProfile
          └── V4ContentPage.tsx
              └── uses useBrand() ← imports from BrandContext.tsx
              └── V4ContentGenerationPanel
                  └── uses useBrand()
                  └── CompetitorIntelligencePanel
                      └── uses useBrand()
```

**ANY change to ANY file in this graph** → Vite walks the graph → hits BrandContext.tsx → fails Fast Refresh → full reload.

---

## THE FIX (Correct Solution)

### Option 1: Split Hooks to Separate `.ts` Files (Recommended)

**Principle**: Keep `.tsx` files component-only. Move hooks to `.ts` files.

**File Structure Change:**
```
BEFORE (broken):
src/contexts/
  BrandContext.tsx          ← exports BrandProvider + useBrand

AFTER (fixed):
src/contexts/
  BrandContext.tsx          ← exports ONLY BrandProvider
src/hooks/
  useBrand.ts               ← exports ONLY useBrand hook (note: .ts NOT .tsx)
```

**Why `.ts` instead of `.tsx`?**
- `.tsx` files are processed by React Fast Refresh which requires component-only exports
- `.ts` files don't have this restriction
- Hooks don't need JSX, so `.ts` is correct anyway

### Option 2: Vite Plugin to Suppress HMR (Quick Fix)

Add a custom Vite plugin that prevents HMR invalidation from propagating:

```typescript
// vite.config.ts
{
  name: 'prevent-context-hmr-cascade',
  handleHotUpdate({ file, modules }) {
    // If a context file changes, return empty to prevent HMR cascade
    if (file.includes('/contexts/')) {
      console.log('[HMR] Ignoring context file change:', file)
      return []
    }
    return modules
  }
}
```

**Tradeoff**: This prevents live updates to context files during development but stops the cascade reload problem.

### Option 3: Disable HMR for This Dev Session (Emergency)

```typescript
// vite.config.ts
server: {
  hmr: false  // Disable HMR entirely
}
```

**Tradeoff**: Manual refresh required for all changes, but NO automatic reloads.

---

## FILES REQUIRING UPDATES (for Option 1)

### New Files to Create:
- `src/hooks/useBrand.ts`
- `src/hooks/useBrandProfile.ts`

### Files to Modify:
**Context Files (remove hook exports):**
- `src/contexts/BrandContext.tsx`
- `src/contexts/BrandProfileContext.tsx`

**Import Updates Needed:**
| File | Change |
|------|--------|
| `src/pages/V4ContentPage.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/pages/DashboardPage.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/pages/OnboardingPageV5.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/pages/BrandProfilePage.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/pages/ProofDevPage.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/pages/DashboardPageV2.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/pages/CampaignBuilderPage.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/pages/TriggersDevPage.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/pages/SessionManagerPage.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/contexts/MirrorContext.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/contexts/SessionContext.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/contexts/BrandProfileContext.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/components/v4/TriggersPanelV2.tsx` | `import { useBrand } from '@/hooks/useBrand'` |
| `src/components/common/BrandHeader.tsx` | `import { useBrand } from '@/hooks/useBrand'` |

### Also Needs Fix (lower priority):
- `src/hooks/useOptimizedAPIData.tsx` → rename to `.ts`

---

## RECOMMENDED IMMEDIATE ACTION

**For fastest fix during active scan testing:**
1. Add `hmr: false` to vite.config.ts temporarily
2. Manual refresh when needed
3. Implement proper hook separation later

**For permanent fix:**
1. Create `src/hooks/useBrand.ts` with hook code
2. Update `src/contexts/BrandContext.tsx` to remove hook export
3. Update all 14 import statements
4. Repeat for `useBrandProfile`
5. Rename `useOptimizedAPIData.tsx` to `.ts`

---

## Sources

- [Fixing Vite HMR Issues in React by Splitting Your Auth Context](https://dev.to/ttibbs/fixing-vite-hmr-issues-in-react-by-splitting-your-auth-context-56mo)
- [HMR breaks when modifying React context provider - Issue #3301](https://github.com/vitejs/vite/issues/3301)
- [HMR Invalidate when exporting custom hooks - Issue #243](https://github.com/vitejs/vite-plugin-react/issues/243)
- [Could not Fast Refresh - Issue #411](https://github.com/vitejs/vite-plugin-react/issues/411)
- [vite-plugin-react documentation on exports](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports)
- [Vite HMR API Documentation](https://vite.dev/guide/api-hmr)
- [disable vite HMR on specific files - Discussion #13943](https://github.com/vitejs/vite/discussions/13943)
- [Prevent Vite doing a full reload](https://designdebt.club/prevent-vite-doing-a-full-reload/)
