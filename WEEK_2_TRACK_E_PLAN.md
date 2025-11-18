# Track E: 3-Page Flow Integration - Implementation Plan

## Overview
Integrate the new 3-page MARBA flow into OnboardingPageV5, replacing the old smart confirmation with deep AI intelligence gathering.

## New Flow Structure

```
URL Input
    ↓
[DATA COLLECTION] ← Uses dataCollectionService (Track D)
    ↓
[PAGE 1: Value Propositions] ← Validate/edit discovered value props
    ↓
[PAGE 2: Buyer Intelligence] ← Review personas, triggers, transformations
    ↓
[PAGE 3: Core Truth] ← Synthesized brand narrative
    ↓
Save to Database → Navigate to Dashboard
```

## Changes Required

### 1. Update FlowStep Type
Add new steps:
- `data_collection` (replaces `uvp_extraction`)
- `value_propositions`
- `buyer_intelligence`
- `core_truth`

### 2. Add New Imports
```typescript
import { ValuePropositionPage } from '@/components/onboarding-v5/ValuePropositionPage';
import { BuyerIntelligencePage } from '@/components/onboarding-v5/BuyerIntelligencePage';
import { CoreTruthPage } from '@/components/onboarding-v5/CoreTruthPage';
import { dataCollectionService } from '@/services/onboarding-v5/data-collection.service';
import { onboardingV5DataService } from '@/services/supabase/onboarding-v5-data.service';
```

### 3. Add State Management
```typescript
const [collectedData, setCollectedData] = useState<OnboardingDataPackage | null>(null);
const [validatedValueProps, setValidatedValueProps] = useState<Set<string>>(new Set());
const [validatedTriggers, setValidatedTriggers] = useState<Set<string>>(new Set());
const [validatedPersonas, setValidatedPersonas] = useState<Set<string>>(new Set());
```

### 4. Replace handleUrlSubmit
Current flow:
- Scrapes website
- Runs UVP extraction
- Goes to smart_confirmation

New flow:
- Scrapes website
- Runs dataCollectionService.collectOnboardingData()
- Goes to value_propositions page

### 5. Add Page Handlers
- `handleValidateValueProp(id)` - Mark value prop as validated
- `handleRejectValueProp(id)` - Remove value prop
- `handleEditValueProp(id, text)` - Edit value prop text
- `handleValuePropsNext()` - Navigate to buyer intelligence
- `handleBuyerIntelNext()` - Navigate to core truth
- `handleCoreTruthComplete()` - Save to DB and navigate to dashboard

### 6. Database Persistence
After Page 3 (Core Truth), save everything:
```typescript
await onboardingV5DataService.saveValuePropositions(brandId, valueProps);
await onboardingV5DataService.saveBuyerPersonas(brandId, personas);
await onboardingV5DataService.saveCor eTruthInsights(brandId, coreTruth);
```

### 7. Render New Pages
```tsx
{currentStep === 'value_propositions' && collectedData && (
  <ValuePropositionPage
    businessName={businessData.businessName}
    industry={businessData.industry}
    propositions={collectedData.valuePropositions}
    onValidate={handleValidateValueProp}
    onReject={handleRejectValueProp}
    onEdit={handleEditValueProp}
    onNext={handleValuePropsNext}
  />
)}
```

## Backward Compatibility

Keep test mode working:
- Detect `example.com` / `test.com` URLs
- Generate mock OnboardingDataPackage
- Skip real AI service calls
- Navigate through pages quickly

## Testing Strategy

1. Test with real website (non-test URL)
2. Verify AI services are called
3. Verify data transformations work
4. Verify page navigation
5. Verify database persistence
6. Test with test.com URL (mock mode)

## Success Criteria

✅ User can input URL
✅ Data collection runs with progress updates
✅ Page 1 displays value propositions
✅ Page 2 displays buyer intelligence
✅ Page 3 displays core truth
✅ Data persists to database
✅ User navigates to dashboard after completion
✅ Test mode still works for E2E tests
