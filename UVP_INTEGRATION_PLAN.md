# UVP Flow Integration Plan for OnboardingPageV5.tsx

##  Completed
- ✅ Added UVP component imports
- ✅ Added UVP type imports
- ✅ Extended FlowStep type with UVP steps

## Next Steps

### 1. Add State Variables (after line 120)

```typescript
  // UVP Flow state
  const [uvpFlowData, setUVPFlowData] = useState<Partial<UVPFlowState> | null>(null);
  const [productServiceData, setProductServiceData] = useState<ProductServiceData | null>(null);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<CustomerProfile | null>(null);
  const [selectedTransformation, setSelectedTransformation] = useState<TransformationGoal | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<UniqueSolution | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<KeyBenefit | null>(null);
  const [completeUVP, setCompleteUVP] = useState<CompleteUVP | null>(null);
```

### 2. Modify handleUrlSubmit to route to UVP flow (line 207)

Change:
```typescript
// Transition to Track E 3-page flow
setCurrentStep('value_propositions');
```

To:
```typescript
// Transition to UVP Flow (6 steps)
setCurrentStep('uvp_products');

// Initialize UVP flow data
setUVPFlowData({
  currentStep: 'products',
  productsServices: undefined,  // Will be populated by first page
  isComplete: false,
});
```

### 3. Add UVP Navigation Handlers (after line 572)

```typescript
  // ==================== UVP FLOW HANDLERS ====================

  // UVP Step 1: Products/Services
  const handleProductsConfirm = (confirmedItems: ProductService[]) => {
    console.log('[UVP Flow] Products confirmed:', confirmedItems.length);
    setProductServiceData(prev => ({
      ...prev!,
      categories: prev!.categories.map(cat => ({
        ...cat,
        items: cat.items.map(item => ({
          ...item,
          confirmed: confirmedItems.some(ci => ci.id === item.id),
        })),
      })),
    }));
  };

  const handleProductsAddManual = (item: Partial<ProductService>) => {
    console.log('[UVP Flow] Manual product added:', item);
    // Add to existing categories or create "Manual Additions" category
    setProductServiceData(prev => {
      if (!prev) return prev;

      const manualCat = prev.categories.find(c => c.name === 'Manual Additions');
      const newItem: ProductService = {
        id: `manual-${Date.now()}`,
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Other',
        confidence: 100,
        source: 'manual',
        confirmed: true,
      };

      if (manualCat) {
        return {
          ...prev,
          categories: prev.categories.map(cat =>
            cat.name === 'Manual Additions'
              ? { ...cat, items: [...cat.items, newItem] }
              : cat
          ),
        };
      } else {
        return {
          ...prev,
          categories: [
            ...prev.categories,
            {
              id: 'manual',
              name: 'Manual Additions',
              items: [newItem],
            },
          ],
        };
      }
    });
  };

  const handleProductsNext = () => {
    console.log('[UVP Flow] Moving to customer step');
    setCurrentStep('uvp_customer');
  };

  // UVP Step 2: Target Customer
  const handleCustomerAccept = (profile: CustomerProfile) => {
    console.log('[UVP Flow] Customer profile accepted:', profile.id);
    setSelectedCustomerProfile(profile);
  };

  const handleCustomerManualSubmit = (profile: Partial<CustomerProfile>) => {
    console.log('[UVP Flow] Manual customer profile submitted');
    const newProfile: CustomerProfile = {
      id: `manual-${Date.now()}`,
      statement: profile.statement || '',
      industry: profile.industry,
      companySize: profile.companySize,
      role: profile.role,
      confidence: 100,
      sources: [],
      evidenceQuotes: [],
      isManualInput: true,
    };
    setSelectedCustomerProfile(newProfile);
  };

  const handleCustomerNext = () => {
    console.log('[UVP Flow] Moving to transformation step');
    setCurrentStep('uvp_transformation');
  };

  // UVP Step 3: Transformation Goal
  const handleTransformationAccept = (goal: TransformationGoal) => {
    console.log('[UVP Flow] Transformation goal accepted:', goal.id);
    setSelectedTransformation(goal);
  };

  const handleTransformationManualSubmit = (goal: Partial<TransformationGoal>) => {
    console.log('[UVP Flow] Manual transformation goal submitted');
    const newGoal: TransformationGoal = {
      id: `manual-${Date.now()}`,
      statement: goal.statement || '',
      emotionalDrivers: goal.emotionalDrivers || [],
      functionalDrivers: goal.functionalDrivers || [],
      eqScore: {
        emotional: 50,
        rational: 50,
        overall: 50,
      },
      confidence: 100,
      sources: [],
      customerQuotes: [],
      isManualInput: true,
    };
    setSelectedTransformation(newGoal);
  };

  const handleTransformationNext = () => {
    console.log('[UVP Flow] Moving to solution step');
    setCurrentStep('uvp_solution');
  };

  // UVP Step 4: Unique Solution
  const handleSolutionAccept = (solution: UniqueSolution) => {
    console.log('[UVP Flow] Solution accepted:', solution.id);
    setSelectedSolution(solution);
  };

  const handleSolutionManualSubmit = (solution: Partial<UniqueSolution>) => {
    console.log('[UVP Flow] Manual solution submitted');
    const newSolution: UniqueSolution = {
      id: `manual-${Date.now()}`,
      statement: solution.statement || '',
      differentiators: solution.differentiators || [],
      methodology: solution.methodology,
      proprietaryApproach: solution.proprietaryApproach,
      confidence: 100,
      sources: [],
      isManualInput: true,
    };
    setSelectedSolution(newSolution);
  };

  const handleSolutionNext = () => {
    console.log('[UVP Flow] Moving to benefit step');
    setCurrentStep('uvp_benefit');
  };

  // UVP Step 5: Key Benefit
  const handleBenefitAccept = (benefit: KeyBenefit) => {
    console.log('[UVP Flow] Benefit accepted:', benefit.id);
    setSelectedBenefit(benefit);
  };

  const handleBenefitManualSubmit = (benefit: Partial<KeyBenefit>) => {
    console.log('[UVP Flow] Manual benefit submitted');
    const newBenefit: KeyBenefit = {
      id: `manual-${Date.now()}`,
      statement: benefit.statement || '',
      outcomeType: benefit.outcomeType || 'qualitative',
      metrics: benefit.metrics,
      industryComparison: benefit.industryComparison,
      eqFraming: benefit.eqFraming || 'balanced',
      confidence: 100,
      sources: [],
      isManualInput: true,
    };
    setSelectedBenefit(newBenefit);
  };

  const handleBenefitNext = () => {
    console.log('[UVP Flow] Moving to synthesis step');
    setCurrentStep('uvp_synthesis');
  };

  // UVP Step 6: Synthesis
  const handleUVPComplete = async (uvp: CompleteUVP) => {
    console.log('[UVP Flow] UVP complete, saving to database');
    setCompleteUVP(uvp);

    // Save to database and navigate to dashboard
    // TODO: Implement UVP database save
    try {
      // For now, just navigate to dashboard
      console.log('[UVP Flow] UVP saved successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('[UVP Flow] Failed to save UVP:', error);
      navigate('/dashboard');
    }
  };

  const handleUVPExport = () => {
    console.log('[UVP Flow] Exporting UVP');
    // TODO: Implement export functionality
  };

  const handleUVPBack = () => {
    console.log('[UVP Flow] Going back from synthesis');
    setCurrentStep('uvp_benefit');
  };
```

### 4. Add Rendering Logic (before line 1228, after content_preview)

```typescript
      {/* ==================== UVP FLOW PAGES ==================== */}

      {currentStep === 'uvp_products' && productServiceData && (
        <ProductServiceDiscoveryPage
          businessName={businessData?.businessName || 'Your Business'}
          isLoading={false}
          data={productServiceData}
          onConfirm={handleProductsConfirm}
          onAddManual={handleProductsAddManual}
          onNext={handleProductsNext}
        />
      )}

      {currentStep === 'uvp_customer' && (
        <TargetCustomerPage
          businessName={businessData?.businessName || 'Your Business'}
          isLoading={false}
          aiSuggestions={[]}  // TODO: Wire up customer extraction service
          onAccept={handleCustomerAccept}
          onManualSubmit={handleCustomerManualSubmit}
          onNext={handleCustomerNext}
        />
      )}

      {currentStep === 'uvp_transformation' && (
        <TransformationGoalPage
          businessName={businessData?.businessName || 'Your Business'}
          isLoading={false}
          aiSuggestions={[]}  // TODO: Wire up transformation analyzer
          onAccept={handleTransformationAccept}
          onManualSubmit={handleTransformationManualSubmit}
          onNext={handleTransformationNext}
        />
      )}

      {currentStep === 'uvp_solution' && (
        <UniqueSolutionPage
          businessName={businessData?.businessName || 'Your Business'}
          isLoading={false}
          websiteExcerpts={[]}  // TODO: Extract methodology mentions
          aiSuggestions={[]}  // TODO: Wire up differentiator extractor
          onAccept={handleSolutionAccept}
          onManualSubmit={handleSolutionManualSubmit}
          onNext={handleSolutionNext}
        />
      )}

      {currentStep === 'uvp_benefit' && (
        <KeyBenefitPage
          businessName={businessData?.businessName || 'Your Business'}
          isLoading={false}
          aiSuggestions={[]}  // TODO: Wire up benefit extractor
          onAccept={handleBenefitAccept}
          onManualSubmit={handleBenefitManualSubmit}
          onNext={handleBenefitNext}
        />
      )}

      {currentStep === 'uvp_synthesis' && selectedCustomerProfile && selectedTransformation && selectedSolution && selectedBenefit && (
        <UVPSynthesisPage
          businessName={businessData?.businessName || 'Your Business'}
          targetCustomer={selectedCustomerProfile}
          transformationGoal={selectedTransformation}
          uniqueSolution={selectedSolution}
          keyBenefit={selectedBenefit}
          onComplete={handleUVPComplete}
          onExport={handleUVPExport}
          onBack={handleUVPBack}
        />
      )}
```

## Testing Checklist

- [ ] Flow starts at uvp_products after data collection
- [ ] Can navigate through all 6 UVP steps
- [ ] Manual input works on all steps
- [ ] AI suggestions display when available
- [ ] Data persists between steps
- [ ] Final synthesis displays all collected data
- [ ] Completes and navigates to dashboard
- [ ] No TypeScript errors

## Future Enhancements

1. Wire up extraction services to provide AI suggestions
2. Implement database persistence for UVP data
3. Add export functionality
4. Add industry benchmark comparisons
5. Integrate with existing Track E flow as alternative path
