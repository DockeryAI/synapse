# Brand Profile System Build Plan

**Status**: COMPLETE
**Created**: 2025-11-28
**Completed**: 2025-11-28
**Actual Time**: ~2.5 hours
**Depends On**: Triggers 2.0 Phase 3 complete

---

## Overview

User-facing Brand Profile page where users can view and edit:
- Auto-detected business profile (B2B/B2C, scope, regions)
- UVP summary with edit links
- Market definition overrides
- All changes flow downstream to dashboard + content generators

---

## Phase 1: Geographic Market Detection (1.25 hr) - DONE

### 1.1 Extend UVP Types (15 min) - DONE
**File**: `src/types/uvp-flow.types.ts`

Add to `CustomerProfile`:
```typescript
marketGeography?: {
  scope: 'local' | 'regional' | 'national' | 'global';
  headquarters: string;           // Country/region
  primaryRegions: string[];       // e.g., ['UK', 'EMEA', 'US']
  focusMarkets: string[];         // Specific countries
  detectedFrom: 'domain' | 'content' | 'manual';
}
```

### 1.2 Auto-Detection from Website (30 min) - DONE
**File**: `src/services/intelligence/geo-detection.service.ts`

Parallel detection via streaming architecture:
- Domain TLD detection (.co.uk → UK, .de → Germany)
- Contact page address parsing
- Footer/legal entity extraction
- Currency/language signals

EventEmitter pattern:
```typescript
geoDetector.emit('geo-detected', {
  headquarters: 'UK',
  primaryRegions: ['UK', 'EMEA'],
  confidence: 0.85
});
```

### 1.3 Background Profile Scanner (30 min) - DONE
**File**: `src/services/intelligence/profile-scanner.service.ts`

- Fire as soon as brand URL entered (Layer 1 parallel)
- Extract market geography from website
- Cache results immediately
- Zero blocking of UVP flow

---

## Phase 2: Brand Profile Page UI (1.5 hr) - DONE

### 2.1 Profile Page Component
**File**: `src/pages/BrandProfilePage.tsx`
**Route**: `/settings/brand-profile`

**Sections:**

1. **Brand Identity** (read-only from existing)
   - Name, logo, tagline
   - Website URL
   - Industry (auto-detected)

2. **Market Definition** (editable)
   - Customer Type: B2B / B2C / B2B2C toggle
   - Geographic Scope: Local / Regional / National / Global dropdown
   - Primary Regions: Multi-select chips (UK, US, EMEA, APAC, LATAM)
   - Industry: Auto-detected + editable text field

3. **Profile Type**
   - Auto-detected badge with confidence
   - Manual override dropdown (7 profile types)
   - "Reset to Auto-Detected" button

4. **UVP Summary** (collapsible)
   - Target Customer statement + "Edit" link → UVP flow
   - Key Benefit + metrics
   - Differentiators list
   - Transformation before/after

5. **Detection Signals** (transparency panel)
   - Show what triggered auto-detection
   - List of signals with confidence scores
   - "Why was this detected?" expandable

### 2.2 Profile Form Components - DONE
**Files created**:
- `src/components/settings/CustomerTypeToggle.tsx` ✅
- `src/components/settings/GeographicScopeSelector.tsx` ✅
- `src/components/settings/RegionMultiSelect.tsx` ✅
- `src/components/settings/ProfileTypeOverride.tsx` ✅

---

## Phase 3: Profile Context & Integration (1.25 hr) - DONE

### 3.1 Profile Context Provider (45 min) - DONE
**File**: `src/contexts/BrandProfileContext.tsx`

```typescript
interface BrandProfileContextValue {
  profile: BrandProfile | null;
  isLoading: boolean;
  isAutoDetected: boolean;
  updateProfile: (updates: Partial<BrandProfile>) => Promise<void>;
  resetToAutoDetected: () => Promise<void>;
  refreshDetection: () => Promise<void>;
}
```

- Wraps app at root level
- Persists to Supabase `brand_profiles` table
- Syncs with existing brand context

### 3.2 Database Schema (15 min) - DONE
**File**: `supabase/migrations/20251128000001_create_brand_profiles.sql`

```sql
CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  customer_type TEXT CHECK (customer_type IN ('b2b', 'b2c', 'b2b2c')),
  geographic_scope TEXT CHECK (geographic_scope IN ('local', 'regional', 'national', 'global')),
  headquarters TEXT,
  primary_regions TEXT[],
  focus_markets TEXT[],
  profile_type TEXT,
  is_auto_detected BOOLEAN DEFAULT true,
  detection_signals JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id)
);
```

### 3.3 Downstream Integration (30 min) - DONE
**Files modified**:
- `src/components/v4/TriggersPanelV2.tsx` - Uses BrandProfileContext for user overrides ✅
- `src/services/triggers/trigger-consolidation.service.ts` - Added profileOverride parameter ✅
- `src/App.tsx` - Added BrandProfileProvider wrapper ✅

Integration points:
- Dashboard filters by profile type
- Content generators use profile for tone/style
- Trigger consolidation uses profile for relevance scoring
- API source prioritization based on profile

---

## Phase 4: Testing (30 min)

### Test Cases
- [x] OpenDialog auto-detects as `global-saas-b2b` with UK/EMEA
- [x] Manual override flows to trigger consolidation via profileOverride
- [x] Reset to auto-detected restores original profile
- [x] Profile changes trigger trigger re-consolidation

### UI Testing
- [x] All form controls created and functional
- [x] Save/cancel flows implemented
- [x] Loading states display properly

---

## Files to Create

| File | Description |
|------|-------------|
| `src/pages/BrandProfilePage.tsx` | Main profile page |
| `src/contexts/BrandProfileContext.tsx` | Profile state management |
| `src/services/intelligence/geo-detection.service.ts` | Geographic detection |
| `src/services/intelligence/profile-scanner.service.ts` | Background scanner |
| `src/components/settings/CustomerTypeToggle.tsx` | B2B/B2C toggle |
| `src/components/settings/GeographicScopeSelector.tsx` | Scope dropdown |
| `src/components/settings/RegionMultiSelect.tsx` | Region chips |
| `src/components/settings/ProfileTypeOverride.tsx` | Profile override |

---

## Architecture Alignment

- **Streaming Pattern**: Geo/profile detection fires parallel via EventEmitter
- **No UVP Blocking**: All scans run background, never delay user flow
- **Cache-First**: Profile cached immediately, used on subsequent loads
- **Progressive Enhancement**: Dashboard shows cached profile, updates when scan completes

---

## Route Addition

Add to `src/App.tsx`:
```typescript
<Route path="/settings/brand-profile" element={<BrandProfilePage />} />
```

Add navigation link in settings menu.
