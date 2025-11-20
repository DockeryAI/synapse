# EQ Onboarding Integration Guide

**How to integrate EQ Calculator v2.0 into the Onboarding Flow**

Created: 2025-11-19

---

## Overview

The EQ calculator should run during onboarding to:
1. Calculate the brand's EQ from website content
2. Store EQ in the `brands` table for quick access
3. Store detailed calculation in `brand_eq_scores` table
4. Display EQ in dashboard after onboarding completes

---

## Integration Points in OnboardingPageV5.tsx

### Point 1: Calculate EQ After Website Scraping

**Location**: After `extractProductsServices()` completes (~line 293)

**Add**:

```typescript
// After line 300 in handleUrlSubmit()
import { eqIntegration } from '@/services/eq-v2/eq-integration.service';

// Inside handleUrlSubmit(), after product extraction
console.log('[OnboardingPageV5] Product extraction complete:', {
  products: extractedProducts.products.length,
  categories: extractedProducts.categories.length,
  confidence: extractedProducts.confidence,
});

// ✨ NEW: Calculate EQ from website content
console.log('[OnboardingPageV5] Calculating Emotional Quotient...');
addProgressStep('Calculating brand EQ', 'in_progress', 'Analyzing emotional vs rational messaging...');

try {
  // Detect specialty from industry + specialization
  const specialty = collectedOnboardingData.valuePropositions[0]?.specialty ||
    businessData?.specialization ||
    industry.displayName;

  const eqResult = await eqIntegration.calculateEQ({
    businessName,
    websiteContent,
    specialty,
  });

  console.log('[OnboardingPageV5] EQ calculated:', {
    overall: eqResult.eq_score.overall,
    emotional: eqResult.eq_score.emotional,
    rational: eqResult.eq_score.rational,
    confidence: eqResult.eq_score.confidence,
    method: eqResult.eq_score.calculation_method,
  });

  // Store in state for later use
  setCollectedData(prev => ({
    ...prev!,
    eqScore: eqResult.eq_score,
    eqRecommendations: eqResult.recommendations,
  }));

  addProgressStep('Calculating brand EQ', 'complete', `EQ: ${eqResult.eq_score.overall}/100`);
} catch (error) {
  console.error('[OnboardingPageV5] EQ calculation failed:', error);
  addProgressStep('Calculating brand EQ', 'error', 'Using default EQ');
}

// Continue with rest of handleUrlSubmit()...
```

### Point 2: Save EQ to Database

**Location**: After brand is created (~line 816)

**Add**:

```typescript
// After line 816 in handleConfirmComplete()
import { eqStorage } from '@/services/eq-v2/eq-storage.service';

// Inside handleConfirmComplete(), after brand creation
brandId = newBrand.id;
console.log('[OnboardingPageV5] Created new brand:', brandId);

// ✨ NEW: Save EQ score to database
if (collectedData.eqScore && collectedData.eqRecommendations) {
  try {
    console.log('[OnboardingPageV5] Saving EQ score to database...');

    // Build full EQ calculation result
    const eqResult = {
      eq_score: collectedData.eqScore,
      breakdown: {
        score: collectedData.eqScore,
        layer_contributions: {
          specialty_context: { score: collectedData.eqScore.overall, weight: 0.5, contribution: 0, confidence: collectedData.eqScore.confidence },
          pattern_recognition: { score: collectedData.eqScore.overall, weight: 0.35, contribution: 0, confidence: collectedData.eqScore.confidence },
          content_analysis: { score: collectedData.eqScore.overall, weight: 0.15, contribution: 0, confidence: collectedData.eqScore.confidence },
        },
        detected_signals: {} as any,
        calculation_timestamp: new Date().toISOString(),
      },
      specialty_context: undefined,
      pattern_matches: [],
      content_analysis: {} as any,
      recommendations: collectedData.eqRecommendations,
      cached: false,
      calculation_id: `onboarding-${brandId}`,
    };

    await eqStorage.saveEQScore(brandId, eqResult as any);
    console.log('[OnboardingPageV5] EQ score saved successfully');
  } catch (error) {
    console.error('[OnboardingPageV5] Failed to save EQ score:', error);
    // Continue without blocking - EQ can be recalculated later
  }
}

// Continue with saving other data...
```

---

## Type Updates Needed

### 1. OnboardingDataPackage

**File**: `src/services/onboarding-v5/data-collection.service.ts`

```typescript
import type { EQScore, EQRecommendation } from '@/types/eq-calculator.types';

export interface OnboardingDataPackage {
  // ... existing fields

  // ✨ ADD THESE
  eqScore?: EQScore;
  eqRecommendations?: EQRecommendation[];
}
```

---

## Dashboard Integration

After onboarding completes and redirects to `/dashboard`, the EQ Dashboard Widget will automatically load the saved EQ score.

**Add to DashboardPage.tsx**:

```typescript
import { EQDashboardWidget } from '@/components/eq/EQDashboardWidget';

// Inside DashboardPage component
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
  {/* Business Intelligence Summary */}
  <div className="lg:col-span-2">
    {/* Existing dashboard content */}
  </div>

  {/* EQ Widget */}
  <div>
    <EQDashboardWidget
      brandId={brand.id}
      defaultExpanded={true}
      enableRecalculate={true}
      websiteContent={scrapedWebsiteContent}
      businessName={brand.name}
      specialty={insights?.websiteAnalysis?.industry}
    />
  </div>
</div>
```

---

## Progress Steps to Display

During onboarding, show these progress steps:

```typescript
const progressSteps = [
  { step: 'Scanning website content', status: 'complete' },
  { step: 'Scanning website for services and products', status: 'complete' },
  { step: 'Analyzing customer testimonials and case studies', status: 'complete' },
  { step: 'Extracting value propositions', status: 'complete' },
  { step: 'Extracting products and services', status: 'complete' },
  { step: 'Calculating brand EQ', status: 'in_progress' }, // ← NEW STEP
];
```

---

## Complete Integration Code

### Full handleUrlSubmit() modification

```typescript
// Inside OnboardingPageV5.tsx, in handleUrlSubmit() around line 280-320

// Extract products/services from website content
console.log('[OnboardingPageV5] Extracting products/services...');
addProgressStep('Extracting products and services', 'in_progress', 'Analyzing your offerings...');

try {
  // Call product/service extraction service
  const extractedProducts = await extractProductsServices(
    websiteContent,
    websiteUrls,
    businessName
  );

  console.log('[OnboardingPageV5] Product extraction complete:', {
    products: extractedProducts.products.length,
    categories: extractedProducts.categories.length,
    confidence: extractedProducts.confidence,
  });

  // =========================================================================
  // ✨ NEW: CALCULATE EMOTIONAL QUOTIENT (EQ)
  // =========================================================================

  console.log('[OnboardingPageV5] Calculating Emotional Quotient...');
  addProgressStep('Calculating brand EQ', 'in_progress', 'Analyzing emotional vs rational messaging...');

  try {
    // Import EQ integration service
    const { eqIntegration } = await import('@/services/eq-v2/eq-integration.service');

    // Detect specialty from collected data
    const specialty =
      collectedOnboardingData.valuePropositions[0]?.specialty ||
      industry.displayName ||
      businessData?.specialization ||
      undefined;

    // Calculate EQ from website content
    const eqResult = await eqIntegration.calculateEQ({
      businessName,
      websiteContent,
      specialty,
    });

    console.log('[OnboardingPageV5] EQ calculated successfully:', {
      overall: eqResult.eq_score.overall,
      emotional: eqResult.eq_score.emotional,
      rational: eqResult.eq_score.rational,
      confidence: eqResult.eq_score.confidence,
      method: eqResult.eq_score.calculation_method,
      specialty: eqResult.specialty_context?.specialty,
    });

    // Store in collected data for database save
    setCollectedData(prev => ({
      ...prev!,
      eqScore: eqResult.eq_score,
      eqRecommendations: eqResult.recommendations,
      eqFullResult: eqResult, // Store full result for detailed save
    }));

    addProgressStep(
      'Calculating brand EQ',
      'complete',
      `EQ: ${eqResult.eq_score.overall}/100 (${eqResult.eq_score.emotional}% emotional, ${eqResult.eq_score.rational}% rational)`
    );

  } catch (error) {
    console.error('[OnboardingPageV5] EQ calculation failed:', error);
    addProgressStep('Calculating brand EQ', 'error', 'Using default EQ (can recalculate later)');

    // Set default EQ so app continues to function
    setCollectedData(prev => ({
      ...prev!,
      eqScore: {
        emotional: 50,
        rational: 50,
        overall: 50,
        confidence: 50,
        calculation_method: 'content_only' as const,
      },
      eqRecommendations: [],
    }));
  }

  // =========================================================================
  // END EQ CALCULATION
  // =========================================================================

  // Map extraction results to ProductServiceData format
  // ... rest of code continues
}
```

### Full handleConfirmComplete() modification

```typescript
// Inside OnboardingPageV5.tsx, in handleConfirmComplete() around line 800-820

// Step 1: Create or get brand
let brandId: string;

if (currentBrand?.id) {
  brandId = currentBrand.id;
  console.log('[OnboardingPageV5] Using existing brand:', brandId);
} else {
  const { data: newBrand, error: createError } = await supabase
    .from('brands')
    .insert({
      name: refinedData.businessName,
      industry: businessData.industry,
      website: businessData.url,
      description: businessData.specialization,
      // ✨ NEW: Include EQ in brand creation
      emotional_quotient: collectedData?.eqScore?.overall || null,
      eq_calculated_at: collectedData?.eqScore ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (createError || !newBrand) {
    console.error('[OnboardingPageV5] Error creating brand:', createError);
    throw new Error('Failed to create brand');
  }

  brandId = newBrand.id;
  console.log('[OnboardingPageV5] Created new brand:', brandId);
}

// =========================================================================
// ✨ NEW: SAVE EQ SCORE TO DATABASE
// =========================================================================

if (collectedData?.eqFullResult && brandId) {
  try {
    console.log('[OnboardingPageV5] Saving detailed EQ score to database...');

    // Import storage service
    const { eqStorage } = await import('@/services/eq-v2/eq-storage.service');

    // Save full EQ calculation result
    await eqStorage.saveEQScore(brandId, collectedData.eqFullResult);

    console.log('[OnboardingPageV5] EQ score saved successfully to brand_eq_scores table');
  } catch (error) {
    console.error('[OnboardingPageV5] Failed to save EQ score:', error);
    // Continue without blocking - EQ can be recalculated later from dashboard
  }
}

// =========================================================================
// END EQ SAVE
// =========================================================================

// Step 2: Save validated value propositions
// ... rest of code continues
```

---

## Testing

```typescript
// Test onboarding with EQ calculation

// 1. Go to /onboarding
// 2. Enter URL: phoenixinsurance.com (classic cars - should get ~75 EQ)
// 3. Select industry: Insurance
// 4. Watch progress steps - should see "Calculating brand EQ"
// 5. Complete onboarding
// 6. Check dashboard - EQ widget should show 70-80 EQ with "Highly Emotional" guidance

// 2. Test with rational business
// 1. Go to /onboarding
// 2. Enter URL: stripe.com (B2B SaaS - should get ~25 EQ)
// 3. Select industry: Financial Services
// 4. Complete onboarding
// 5. Check dashboard - EQ widget should show 20-30 EQ with "Highly Rational" guidance
```

---

## Troubleshooting

### EQ Not Calculated

**Symptom**: Progress step shows "Calculating brand EQ" but stays pending

**Fix**:
- Check console for errors
- Verify website content is not empty
- Check if specialty detection is working
- Try with forceRecalculate=true

### EQ Not Showing in Dashboard

**Symptom**: Dashboard loads but no EQ widget appears

**Fix**:
- Check if brand.id exists
- Verify eqStorage.loadEQScore() is returning data
- Check browser console for component errors
- Verify `brands.emotional_quotient` column exists

### EQ Seems Wrong

**Symptom**: Classic cars business gets 30 EQ (too low) or Enterprise SaaS gets 80 EQ (too high)

**Fix**:
- Check if specialty is being detected correctly
- Verify KNOWN_SPECIALTY_BASELINES includes this specialty
- Check pattern recognition signals in breakdown
- Run validation tests: `npm test eq-validation.test.ts`

---

## Success Metrics

After integration, you should see:

✅ EQ calculated for 95%+ of onboarded businesses
✅ Classic cars / passion products: 70-80 EQ
✅ Enterprise software / B2B: 20-30 EQ
✅ Professional services: 40-50 EQ
✅ EQ visible in dashboard widget
✅ Confidence scores > 70% for known specialties
✅ Campaign generation uses EQ context
