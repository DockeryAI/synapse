# Track P: React Integration Layer - Detailed Instructions

## Overview
Create custom React hooks and context providers that bridge V2 services with UI components.

## Location
- **Hooks:** `/src/hooks/v2/`
- **Contexts:** `/src/contexts/v2/`

## Critical Rules
1. ZERO V1 imports - only use V2 services from `/src/services/v2/`
2. Follow React Hooks best practices
3. Use TypeScript strict mode
4. Include comprehensive tests

## Files to Create

```
src/
├── hooks/v2/
│   ├── index.ts (barrel export)
│   ├── useUVPGeneration.ts
│   ├── useStreamingText.ts
│   ├── useInlineEdit.ts
│   ├── useQualityScore.ts
│   ├── useExtraction.ts
│   └── __tests__/
│       ├── useUVPGeneration.test.ts
│       ├── useStreamingText.test.ts
│       └── useInlineEdit.test.ts
│
└── contexts/v2/
    ├── index.ts
    ├── UVPGenerationContext.tsx
    ├── PerformanceContext.tsx
    └── __tests__/
        ├── UVPGenerationContext.test.tsx
        └── PerformanceContext.test.tsx
```

## Task 1: useUVPGeneration Hook (2 hours)

**Purpose:** Main orchestration hook for complete UVP generation flow

**API Design:**
```typescript
const {
  generateUVP,      // Start generation
  isGenerating,     // Loading state
  progress,         // 0-100 percentage
  currentPhase,     // 'extraction' | 'synthesis' | etc.
  result,           // Final UVP result
  error,            // Error if failed
  retry,            // Retry after error
  cancel            // Cancel ongoing generation
} = useUVPGeneration();
```

**Implementation Requirements:**
- Import Week4Orchestrator from `/src/services/v2/integration/Week4Orchestrator`
- Use `useReducer` for complex state management
- Wrap callbacks in `useCallback` for stability
- Subscribe to orchestrator events (phase:started, phase:completed, etc.)
- Clean up subscriptions on unmount
- Handle concurrent generation requests gracefully
- Persist state to sessionStorage for navigation resilience

**State Machine:**
```typescript
type State =
  | { status: 'idle' }
  | { status: 'generating', progress: number, phase: Phase }
  | { status: 'complete', result: UVPResult }
  | { status: 'error', error: Error };
```

## Task 2: useStreamingText Hook (1.5 hours)

**Purpose:** Subscribe to and display streaming text updates

**API Design:**
```typescript
const {
  text,           // Accumulated text
  isStreaming,    // Is currently streaming
  progress,       // Estimated progress
  subscribe,      // Subscribe to stream URL
  unsubscribe     // Clean up subscription
} = useStreamingText(streamUrl);
```

**Implementation Requirements:**
- Use StreamingHandler from `/src/services/v2/streaming/`
- Create EventSource connection to stream URL
- Buffer chunks for smooth character-by-character display
- Calculate progress from token count
- Handle reconnection on connection drop
- Clean up EventSource on unmount
- Support multiple concurrent streams with unique IDs

## Task 3: useInlineEdit Hook (1.5 hours)

**Purpose:** Manage inline editing state with auto-save

**API Design:**
```typescript
const {
  value,        // Current value
  isDirty,      // Has unsaved changes
  isEditing,    // In edit mode
  isSaving,     // Save in progress
  edit,         // Enter edit mode
  save,         // Save changes
  cancel,       // Cancel and revert
  reset         // Reset to initial
} = useInlineEdit(initialValue, {
  onSave: async (value) => { /* save logic */ },
  debounceMs: 500,
  autoSave: true
});
```

**Implementation Requirements:**
- Use `useState` for value and flags
- Implement debounce for auto-save
- Track original value for cancel/isDirty
- Handle save errors gracefully
- Support async onSave callbacks
- Prevent race conditions with pending saves

## Task 4: UVPGenerationContext (1.5 hours)

**Purpose:** Global state for UVP generation across components

**API Design:**
```typescript
<UVPGenerationProvider>
  {/* Children can access state */}
</UVPGenerationProvider>

const context = useUVPGenerationContext();
```

**State Structure:**
```typescript
interface UVPGenerationState {
  // Session info
  sessionId: string;
  brandId: string;
  websiteUrl: string;

  // Current phase
  phase: Phase;
  progress: number;

  // Results
  extractionResults: ExtractionResult[];
  synthesis: SynthesisResult | null;
  quality: QualityScore | null;
  enhancements: EnhancementResult[];

  // Status
  status: 'idle' | 'generating' | 'complete' | 'error';
  error: Error | null;

  // Actions
  startGeneration: (url: string) => Promise<void>;
  retryGeneration: () => Promise<void>;
  cancelGeneration: () => void;
  updateBrand: (brandId: string) => void;
}
```

**Implementation Requirements:**
- Use `useReducer` for state management
- Persist to sessionStorage for page refresh
- Emit custom events for analytics
- Integrate with PerformanceContext for metrics
- Handle concurrent requests properly

## Task 5: PerformanceContext (1.5 hours)

**Purpose:** Track performance metrics across all operations

**State Structure:**
```typescript
interface PerformanceState {
  metrics: {
    phase1Duration: number;
    phase2Duration: number;
    phase3Duration: number;
    phase4Duration: number;
    totalDuration: number;
    cacheHitRate: number;
    modelUpgrades: number;
  };
  costs: {
    haikuCalls: number;
    sonnetCalls: number;
    opusCalls: number;
    totalCost: number;
  };
  startTimer: (label: string) => void;
  endTimer: (label: string) => number;
  recordMetric: (name: string, value: number) => void;
}
```

## Task 6: Comprehensive Tests (1.5 hours)

**Requirements:**
- Test all hook APIs
- Test error states
- Test cleanup on unmount
- Test concurrent operations
- Test state persistence
- Use `@testing-library/react-hooks`
- Mock V2 services appropriately

**Testing Framework:**
- Use vitest and @testing-library/react
- Mock Week4Orchestrator and other services
- Test happy paths and error scenarios
- Verify cleanup functions called
- Check re-render counts (should be minimal)
- Test concurrent hook usage

## Import Structure

**✅ ALLOWED:**
```typescript
import { Week4Orchestrator } from '@/services/v2/integration/Week4Orchestrator';
import { StreamingHandler } from '@/services/v2/streaming/streaming-handler.service';
import type { UVPResult } from '@/types/v2/synthesis.types';
```

**❌ FORBIDDEN:**
```typescript
import { anything } from '@/services/uvp-extractors/...';  // V1
import { anything } from '@/services/intelligence/...';    // V1
```

## Deliverables Checklist

- [ ] useUVPGeneration hook with full orchestration
- [ ] useStreamingText hook with buffering
- [ ] useInlineEdit hook with debouncing
- [ ] useQualityScore hook for metrics display
- [ ] useExtraction hook for phase 1-2 data
- [ ] UVPGenerationContext with session persistence
- [ ] PerformanceContext with timing tracking
- [ ] Full test coverage (>80%)
- [ ] TypeScript strict mode passing
- [ ] JSDoc comments for all public APIs

## Completion Validation

```bash
npm run typecheck  # Should pass
npm test -- hooks/v2  # All tests passing
npm run build  # Should succeed
```

## Implementation Order

1. Create directory structure
2. Build useUVPGeneration (most critical)
3. Build useStreamingText
4. Build useInlineEdit
5. Build contexts
6. Write tests
7. Validate
