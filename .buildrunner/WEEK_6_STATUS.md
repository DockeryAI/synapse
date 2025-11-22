# Week 6 Status Report

**Date:** 2025-11-21
**Status:** Ready to Begin Integration
**Progress:** 0% (Planning Complete)

---

## Current State

✅ **Completed (Week 5):**
- All V2 infrastructure built
- Hooks layer complete (useUVPGeneration, useStreamingText, useInlineEdit, etc.)
- Contexts complete (UVPGenerationContext, PerformanceContext)
- Flow components complete (UVPGenerationFlow, GenerationPhase, ResultsReview)
- Error handling services complete
- Monitoring services complete
- 0 TypeScript errors in V2 code
- Production build succeeds
- CI pipeline ready

⏳ **Week 6 Integration Tasks (Not Started):**
- Wire Flow → Hooks
- Wire Services → Error Handling
- Enable Monitoring
- Manual Testing
- Performance Validation

---

## Architecture Gap Identified

### Issue: URL → ExtractionResults Conversion Missing

**Problem:**
1. `UVPGenerationFlow` starts with a URL input
2. `useUVPGeneration` hook expects `ExtractionResult[]` as input
3. No V2 service exists to convert URL → websiteContent → ExtractionResults

**Current Architecture:**
```
User Input (URL)
    ↓
    ??? (Missing: URL Scraper)
    ↓
websiteContent
    ↓
ExtractionOrchestrator
    ↓
ExtractionResults[]
    ↓
useUVPGeneration hook
    ↓
OrchestratedUVPResult
```

**Solution Options:**

**Option A: Create V2 URL Scraper Service (Recommended)**
```typescript
// src/services/v2/scraping/url-scraper.service.ts
export class URLScraperV2 {
  async scrapeURL(url: string): Promise<{
    websiteContent: string[];
    businessName: string;
    industry: string;
  }> {
    // Use Apify or similar (V2 isolated)
    // OR temporarily use mock data for testing
  }
}
```

**Option B: Use V1 Scraper with Adapter Pattern**
```typescript
// src/services/v2/adapters/v1-scraper-adapter.ts
// Wraps V1 scraper but keeps V2 isolated
export class V1ScraperAdapter {
  async scrape(url: string) {
    // Call V1 service (temporarily breaks isolation)
    // Convert to V2 format
  }
}
```

**Option C: Mock Data for Integration Testing**
```typescript
// src/services/v2/scraping/mock-scraper.service.ts
export class MockScraperV2 {
  async scrapeURL(url: string) {
    return {
      websiteContent: ['Mock content for ' + url],
      businessName: 'Example Business',
      industry: 'Technology',
    };
  }
}
```

---

## Recommended Approach

### Phase 1: Create Mock Scraper (30 min)
Create a simple mock URL scraper service to enable integration testing:

```typescript
// src/services/v2/scraping/url-scraper.service.ts
/**
 * URL Scraper Service (V2)
 *
 * ⚠️ TEMPORARY MOCK IMPLEMENTATION
 * TODO: Replace with real Apify/scraping integration
 *
 * ISOLATION: Zero V1 imports
 */

export interface URLScraperResult {
  websiteContent: string[];
  businessName: string;
  industry: string;
  location?: string;
}

export class URLScraperV2 {
  async scrapeURL(url: string): Promise<URLScraperResult> {
    // Mock implementation for integration testing
    return {
      websiteContent: [
        `Home page content for ${url}`,
        'About us section with company mission',
        'Services and products offered',
      ],
      businessName: this.extractBusinessName(url),
      industry: 'Technology', // Default for now
    };
  }

  private extractBusinessName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown Business';
    }
  }
}
```

### Phase 2: Wire Flow → Extraction → Hook (1 hour)

Update `UVPGenerationFlow.tsx`:

```typescript
import { useUVPGeneration } from '@/hooks/v2';
import { URLScraperV2 } from '@/services/v2/scraping/url-scraper.service';
import { ExtractionOrchestrator } from '@/services/v2/extractors/extraction-orchestrator.service';

export function UVPGenerationFlow(props) {
  // Use the actual hook
  const {
    generateUVP,
    isGenerating,
    progress,
    currentPhase,
    result,
    error,
    retry,
    cancel,
  } = useUVPGeneration({
    enablePersistence: props.enablePersistence,
    qualityThreshold: 70,
  });

  const scraper = useRef(new URLScraperV2());
  const extractionOrch = useRef(new ExtractionOrchestrator());

  const startGeneration = async (url: string) => {
    try {
      // 1. Scrape URL
      const scrapedData = await scraper.current.scrapeURL(url);

      // 2. Run extraction
      const extractionResults = await extractionOrch.current.orchestrate({
        brandId: props.brandId || 'temp-brand',
        websiteUrl: url,
        input: {
          websiteContent: scrapedData.websiteContent,
          businessName: scrapedData.businessName,
          industry: scrapedData.industry,
        },
      });

      // 3. Generate UVP
      await generateUVP(props.brandId || 'temp-brand', extractionResults, {
        websiteUrl: url,
      });
    } catch (error) {
      handleError(error);
    }
  };

  // Connect hook state to component state
  useEffect(() => {
    if (isGenerating) {
      setState({
        phase: 'generating',
        websiteUrl: currentUrl,
        generationPhase: currentPhase,
        progress,
        result: null,
        error: null,
      });
    } else if (result) {
      // Convert OrchestratedUVPResult → UVPResult
      const convertedResult = convertResult(result);
      setState({
        phase: 'results',
        websiteUrl: currentUrl,
        generationPhase: 'complete',
        progress: 100,
        result: convertedResult,
        error: null,
      });
    } else if (error) {
      setState(prev => ({ ...prev, phase: 'error', error }));
    }
  }, [isGenerating, progress, currentPhase, result, error]);

  // ... rest of component
}
```

### Phase 3: Wire GenerationPhase → useStreamingText (30 min)

Update `GenerationPhase.tsx`:

```typescript
import { useStreamingText } from '@/hooks/v2';

export function GenerationPhase(props) {
  const { text, isStreaming, status, subscribe, unsubscribe } = useStreamingText({
    endpoint: `/api/v2/stream/${props.sessionId}`,
    reconnect: true,
    maxRetries: 3,
  });

  useEffect(() => {
    if (props.phase === 'synthesis' && props.sessionId) {
      // Subscribe to streaming synthesis results
      subscribe(`/api/v2/stream/${props.sessionId}`);
    }

    return () => unsubscribe();
  }, [props.phase, props.sessionId]);

  // Display streaming text
  return (
    <div>
      {/* ... progress bar ... */}
      {isStreaming && (
        <div className="streaming-preview">
          {text}
        </div>
      )}
    </div>
  );
}
```

### Phase 4: Wire ResultsReview → useInlineEdit (30 min)

Update `ResultsReview.tsx`:

```typescript
import { useInlineEdit, useQualityScore } from '@/hooks/v2';

export function ResultsReview({ result, onApprove }) {
  // Each field gets its own inline editor
  const primaryUVP = useInlineEdit(result.uvp.primary, {
    onSave: async (value) => {
      await updateUVP({ primary: value });
    },
    debounceMs: 1000,
  });

  const secondaryUVP = useInlineEdit(result.uvp.secondary, {
    onSave: async (value) => {
      await updateUVP({ secondary: value });
    },
    debounceMs: 1000,
  });

  // Quality score display
  const quality = useQualityScore(result.quality);

  return (
    <div>
      {/* Quality indicator */}
      <div className={`quality-badge ${quality.level}`}>
        {quality.indicator} {quality.overallScore}%
      </div>

      {/* Inline editable primary UVP */}
      <div
        contentEditable={primaryUVP.isEditing}
        onFocus={() => primaryUVP.edit()}
        onBlur={() => primaryUVP.save()}
        onChange={(e) => primaryUVP.setValue(e.target.textContent)}
      >
        {primaryUVP.value}
      </div>

      {primaryUVP.isSaving && <span>Saving...</span>}
      {primaryUVP.isDirty && <span>Unsaved changes</span>}

      {/* Secondary UVPs */}
      {/* ... similar pattern ... */}

      <button onClick={() => onApprove(result)} disabled={primaryUVP.isDirty}>
        Approve UVP
      </button>
    </div>
  );
}
```

---

## Integration Checklist

### Phase 1: Mock Scraper
- [ ] Create `src/services/v2/scraping/` directory
- [ ] Create `url-scraper.service.ts` with mock implementation
- [ ] Add to V2 exports in `src/services/v2/index.ts`
- [ ] Write basic test

### Phase 2: Wire Flow → Hook
- [ ] Import `useUVPGeneration` in `UVPGenerationFlow.tsx`
- [ ] Replace placeholder state with hook state
- [ ] Connect scraper → extraction → generation pipeline
- [ ] Convert `OrchestratedUVPResult` → `UVPResult` format
- [ ] Test end-to-end flow

### Phase 3: Wire Streaming
- [ ] Import `useStreamingText` in `GenerationPhase.tsx`
- [ ] Subscribe to stream during synthesis phase
- [ ] Display streaming text in UI
- [ ] Handle connection errors

### Phase 4: Wire Inline Editing
- [ ] Import `useInlineEdit` in `ResultsReview.tsx`
- [ ] Apply to each editable field
- [ ] Connect save handlers
- [ ] Show dirty/saving states

### Phase 5: Add Contexts
- [ ] Wrap Flow with `UVPGenerationProvider`
- [ ] Wrap Flow with `PerformanceProvider`
- [ ] Test context state propagation

### Phase 6: Manual Testing
- [ ] Test full URL → Generation → Approval flow
- [ ] Test error recovery
- [ ] Test session persistence
- [ ] Test quality indicators
- [ ] Test inline editing

---

## Time Estimate

- Phase 1 (Mock Scraper): 30 min
- Phase 2 (Flow → Hook): 1 hour
- Phase 3 (Streaming): 30 min
- Phase 4 (Inline Edit): 30 min
- Phase 5 (Contexts): 15 min
- Phase 6 (Testing): 1 hour

**Total: ~3.5 hours**

---

## Success Criteria

✅ **Functional:**
- [ ] Can enter URL and generate UVP
- [ ] See real-time progress during generation
- [ ] Streaming text displays during synthesis
- [ ] Quality scores show correctly
- [ ] Can edit UVP inline
- [ ] Auto-save works
- [ ] Can approve final UVP

✅ **Technical:**
- [ ] 0 V2 TypeScript errors
- [ ] No V1 imports in V2 code
- [ ] All hooks properly connected
- [ ] Contexts wrapping components
- [ ] State persists across refreshes

✅ **Quality:**
- [ ] No console errors
- [ ] Proper loading states
- [ ] Error messages displayed
- [ ] Smooth user experience

---

## Next Steps

1. **Create Mock Scraper** - Quick win to unblock integration
2. **Wire one component at a time** - Incremental progress
3. **Test after each phase** - Catch issues early
4. **Replace mock scraper later** - Can add real Apify integration in Week 7+

---

**Status:** Ready to begin Phase 1
**Blocker:** None (mock scraper resolves architecture gap)
**Recommendation:** Start with mock scraper, get integration working, replace with real scraper later

---

**Report Created:** 2025-11-21
**Next Action:** Create mock URL scraper service
