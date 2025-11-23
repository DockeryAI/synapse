# Week 3: UI/UX Components Build Plan

## Overview
Build React components for progressive display of V2 extraction results. Components must be STANDALONE in `/src/components/v2/` to maintain isolation from V1 UI.

## Parallel Execution Strategy
Run 4 tracks in parallel (H, I, J, K) - 10 hours each, 40 hours total

---

## Track H: Streaming Text Display (10 hours)

### Deliverables:
- `StreamingText.tsx` - Character-by-character or word-by-word reveal
- `StreamingTextController.tsx` - Manages streaming state and speed
- Type definitions and tests

### Tasks:
1. **Setup directory structure** (30 min)
   - Create `/src/components/v2/streaming/`
   - Create `/src/types/v2/streaming-ui.types.ts`
   - Add barrel exports

2. **Define streaming UI types** (1 hour)
   - StreamingTextProps interface
   - StreamingState enum (idle, streaming, paused, complete)
   - StreamingConfig interface (speed, chunkSize)
   - StreamingCallbacks interface (onStart, onChunk, onComplete)

3. **Build StreamingText component** (3 hours)
   - Character-by-character reveal with configurable speed
   - Word-by-word mode for faster display
   - Pause/resume controls
   - Skip-to-end functionality
   - Typing animation with cursor effect
   - Accessibility: respect prefers-reduced-motion

4. **Build StreamingTextController** (2 hours)
   - Centralized streaming state management
   - Multiple concurrent streams support
   - Priority queue for streams
   - Global pause/resume/skip controls

5. **Add animation polish** (2 hours)
   - Smooth fade-in per character/word
   - Optional typewriter sound effects
   - Loading skeleton before streaming starts
   - Highlight new content as it appears

6. **Testing** (1.5 hours)
   - Unit tests for streaming logic
   - Visual regression tests
   - Performance tests (1000+ characters)
   - Accessibility tests

---

## Track I: Progressive Card Reveals (10 hours)

### Deliverables:
- `ProgressiveCards.tsx` - Staggered card reveal animations
- `CardRevealOrchestrator.tsx` - Controls reveal timing and ordering
- Card wrapper components with animation variants

### Tasks:
1. **Setup directory structure** (30 min)
   - Create `/src/components/v2/progressive/`
   - Update `/src/types/v2/progressive-ui.types.ts`

2. **Define progressive UI types** (1 hour)
   - ProgressiveCardProps interface
   - RevealPattern enum (sequential, staggered, cascade)
   - RevealTiming interface
   - CardState enum (hidden, revealing, revealed)

3. **Build ProgressiveCards component** (3 hours)
   - Staggered reveal with configurable delays
   - Multiple reveal patterns (fade, slide, scale, flip)
   - Sequential vs parallel reveal modes
   - Skeleton placeholders before reveal
   - Responsive grid layout

4. **Build CardRevealOrchestrator** (2 hours)
   - Controls reveal timing across multiple cards
   - Dependency-based reveals (Phase 1 → Phase 2)
   - Priority-based ordering
   - Dynamic reordering based on confidence scores

5. **Add interaction states** (2 hours)
   - Hover effects on revealed cards
   - Selected/active states
   - Smooth transitions between states
   - Mobile swipe gestures

6. **Testing** (1.5 hours)
   - Unit tests for reveal logic
   - Visual tests for animations
   - Performance tests (50+ cards)
   - Touch gesture tests

---

## Track J: Real-Time Progress Indicators (10 hours)

### Deliverables:
- `LiveProgress.tsx` - Real-time extraction progress display
- `PhaseIndicator.tsx` - Shows 4-phase pipeline status
- `MetricsDisplay.tsx` - Live cost/timing stats
- WebSocket/SSE integration for real-time updates

### Tasks:
1. **Setup directory structure** (30 min)
   - Create `/src/components/v2/progress/`
   - Update `/src/types/v2/progress-ui.types.ts`

2. **Define progress UI types** (1 hour)
   - ProgressState interface
   - PhaseStatus enum (pending, active, complete, error)
   - ProgressMetrics interface (elapsed, estimated, cost)
   - ProgressUpdate event interface

3. **Build LiveProgress component** (3 hours)
   - Multi-phase progress bar
   - Per-extractor status indicators
   - Estimated time remaining
   - Real-time cost accumulation
   - Error state visualization
   - Cancellation support

4. **Build PhaseIndicator component** (2 hours)
   - Visual pipeline with 4 phases
   - Current phase highlighting
   - Phase transition animations
   - Per-phase timing display
   - Parallel execution visualization (Phase 1 & 2)

5. **Build MetricsDisplay component** (2 hours)
   - Live token usage counter
   - Cost calculation display
   - Model usage breakdown (Haiku/Sonnet/Opus)
   - Cache hit/miss indicators
   - Performance metrics (p95 latency)

6. **Testing** (1.5 hours)
   - Unit tests for progress calculations
   - Event simulation tests
   - Real-time update performance tests
   - Error state tests

---

## Track K: Inline Editing Components (10 hours)

### Deliverables:
- `QuickEdit.tsx` - Click-to-edit with autosave
- `MultiSelectEditor.tsx` - Bulk selection and editing
- `ConfidenceIndicator.tsx` - Visual confidence scoring
- Edit history and undo/redo support

### Tasks:
1. **Setup directory structure** (30 min)
   - Create `/src/components/v2/inline-edit/`
   - Update `/src/types/v2/inline-edit.types.ts`

2. **Define inline edit types** (1 hour)
   - EditableFieldProps interface
   - EditState enum (viewing, editing, saving, error)
   - EditValidation interface
   - EditHistory interface (undo/redo)

3. **Build QuickEdit component** (3 hours)
   - Click-to-edit for text fields
   - Auto-save on blur or Enter
   - Optimistic UI updates
   - Validation with error states
   - Escape to cancel
   - Loading indicators during save

4. **Build MultiSelectEditor** (2 hours)
   - Checkbox selection for cards
   - Bulk approve/reject/edit actions
   - Select-all / Deselect-all
   - Keyboard shortcuts (Shift+click for range)
   - Mobile-friendly touch selection

5. **Build ConfidenceIndicator** (2 hours)
   - Visual confidence score (0-100%)
   - Color-coded thresholds (red < 70%, yellow 70-85%, green > 85%)
   - Tooltip with confidence breakdown
   - Warning icons for low confidence
   - Suggest regenerate action

6. **Testing** (1.5 hours)
   - Unit tests for edit logic
   - Validation tests
   - Autosave behavior tests
   - Undo/redo tests
   - Accessibility tests (keyboard nav)

---

## Integration Points

### V2 Backend Connection:
- Components consume streaming events from ExtractionOrchestrator
- Subscribe to extraction progress updates
- Display real-time metrics from ExtractionMetrics
- Handle confidence scores from extractors

### V1 UI Isolation:
- All components in `/src/components/v2/`
- NO imports from `/src/components/` (V1)
- Use shared design tokens via `/src/lib/design-tokens.ts` (create if needed)
- Storybook stories for isolated development

### State Management:
- Use Zustand store for V2 UI state (`/src/stores/v2-ui.store.ts`)
- Separate from V1 state management
- Persist user preferences (animation speed, auto-save)

---

## Testing Strategy

### Component Tests:
- Vitest + React Testing Library
- Test each component in isolation
- Mock backend streaming events
- Accessibility compliance (a11y)

### Visual Regression:
- Chromatic or Percy for visual diffs
- Test animation start/end states
- Test responsive breakpoints

### E2E Tests:
- Playwright tests for full extraction flow
- Test progressive reveal UX
- Test inline editing with backend

### Performance:
- Lighthouse scores for rendering performance
- Animation frame rate monitoring
- Bundle size impact analysis

---

## Success Criteria

### Performance:
- First paint < 200ms
- Smooth 60fps animations
- Bundle size < 50KB (gzipped)

### Accessibility:
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Reduced motion support

### User Experience:
- Progressive reveal completes in < 2s
- Inline edits save in < 500ms
- No layout shifts during reveal
- Clear loading states

### Quality:
- 90%+ test coverage
- Zero console errors/warnings
- TypeScript strict mode
- ESLint/Prettier compliance

---

## Risks & Mitigation

### Risk: Animations cause performance issues
**Mitigation:** Use CSS transforms, respect prefers-reduced-motion, lazy load heavy components

### Risk: V1 component conflicts
**Mitigation:** Strict directory isolation, prefixed component names (V2StreamingText)

### Risk: Backend streaming too slow
**Mitigation:** Skeleton states, optimistic updates, cached previous results

### Risk: Mobile animations janky
**Mitigation:** Use will-change CSS, reduce animation complexity on mobile, test on real devices

---

## Timeline Summary

**Week 3 Schedule:**
- Day 1-2: Setup + Types (all tracks)
- Day 3-4: Core component implementation
- Day 5-6: Polish + animations
- Day 7: Testing + integration
- Day 8: Bug fixes + documentation

**Parallel Execution:**
- All 4 tracks run simultaneously
- Daily standup to resolve shared dependencies
- Merge to `feature/uvp-v2-ui` branch
- Code review before Week 4 integration
