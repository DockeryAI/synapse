# Track Q: End-to-End Flow - Detailed Instructions

## Overview
Build the complete user journey from entering a website URL to approving the final UVP.

## Location
- **Flow Components:** `/src/components/v2/flows/`

## Critical Rules
1. All code goes in `/src/components/v2/flows/`
2. Use hooks from Track P (useUVPGeneration, etc.)
3. Integrate Week 3 UI components (StreamingText, ProgressiveCards, etc.)
4. Follow accessibility guidelines (WCAG 2.1 AA)
5. Mobile-first responsive design

## Dependencies
- **Track P hooks** - Can mock if not ready yet

## Files to Create

```
src/components/v2/flows/
├── index.ts
├── UVPGenerationFlow.tsx (main orchestrator)
├── OnboardingWizard.tsx (URL input + validation)
├── GenerationPhase.tsx (in-progress display)
├── ResultsReview.tsx (approval interface)
├── ApprovalInterface.tsx (multi-select + editing)
└── __tests__/
    ├── UVPGenerationFlow.test.tsx
    ├── OnboardingWizard.test.tsx
    └── ResultsReview.test.tsx
```

## Task 1: UVPGenerationFlow Component (2.5 hours)

**Purpose:** Main orchestration component that manages the entire flow

**Component Structure:**
```typescript
export function UVPGenerationFlow({
  websiteUrl?: string,
  brandId?: string,
  onComplete?: (result: UVPResult) => void,
  onError?: (error: Error) => void,
  onCancel?: () => void
}: Props) {
  const {
    generateUVP,
    isGenerating,
    progress,
    currentPhase,
    result,
    error
  } = useUVPGeneration();

  // Phase-based rendering
  if (!websiteUrl) return <OnboardingWizard onSubmit={startGeneration} />;
  if (isGenerating) return <GenerationPhase phase={currentPhase} progress={progress} />;
  if (error) return <ErrorRecovery error={error} onRetry={generateUVP} />;
  if (result) return <ResultsReview result={result} onApprove={onComplete} />;

  return null;
}
```

**Implementation Requirements:**
- Manage phase transitions smoothly
- Show appropriate loading states
- Handle errors with recovery options
- Support cancellation mid-generation
- Persist state across page refreshes
- Track analytics events (generation_started, etc.)

## Task 2: OnboardingWizard Component (2 hours)

**Purpose:** URL input, validation, and business preview

**Steps:**

1. **URL Input**
   - Text input with validation
   - "Paste website URL" placeholder
   - Auto-detect https://
   - Show loading indicator on submit

2. **Business Preview** (if extractable)
   - Show extracted business name
   - Show detected industry
   - Show preview screenshot
   - "Looks good" / "Edit details" buttons

3. **Confirmation**
   - Review details
   - "Start generating" CTA button

**Validation Rules:**
- Must be valid URL format
- Must be publicly accessible
- Must not be localhost/IP (in production)
- Check against blocked domains

## Task 3: GenerationPhase Component (1.5 hours)

**Purpose:** Display progress during generation

**Visual Elements:**
- Large progress bar (0-100%)
- Current phase indicator
- Estimated time remaining
- Preview of extracted data as it arrives
- Cancel button (with confirmation)

**Phase-Specific Messaging:**
```typescript
const phaseMessages = {
  extraction: "Analyzing your website...",
  analysis: "Understanding your customers...",
  synthesis: "Crafting your unique message...",
  enhancement: "Polishing the details..."
};
```

**Progressive Reveal:**
- Show business name when extracted
- Show products as they're found
- Stream UVP text word-by-word
- Animate cards sliding in

## Task 4: ResultsReview Component (2 hours)

**Purpose:** Display generated UVP with approval interface

**Sections:**

a) **UVP Display**
   - Primary statement (large, bold)
   - Secondary statements (bullets)
   - Quality score badge
   - "Edit" button for inline editing

b) **Customer Profiles**
   - Card grid (3 columns desktop, 1 mobile)
   - Each card shows: segment name, description, pain points
   - Multi-select checkboxes
   - Pre-select highest confidence

c) **Transformations**
   - Swipeable cards on mobile
   - Show before → after arrows
   - Confidence indicators
   - Drag to reorder

d) **Benefits**
   - Editable list
   - Inline editing per benefit
   - Add/remove buttons
   - Category tags

e) **Action Buttons**
   - "Approve & Continue" (primary)
   - "Regenerate" (secondary)
   - "Edit More" (tertiary)
   - "Save Draft"

## Task 5: ApprovalInterface Component (1.5 hours)

**Purpose:** Multi-select and bulk actions for approving components

**Features:**
- Select/deselect any customer profile
- Edit transformations inline
- Reorder benefits via drag-drop
- "Approve Selected" button
- "Approve All" quick action
- "None of these" for custom input

**State Management:**
```typescript
const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
const [editedTransformations, setEditedTransformations] = useState<Map<string, string>>();
const [benefitOrder, setBenefitOrder] = useState<string[]>([]);
```

## Task 6: Integration Tests (1.5 hours)

**Test Scenarios:**
- Complete happy path from URL to approval
- Cancel mid-generation
- Error recovery at each phase
- Edit and regenerate
- Mobile responsive behavior
- Keyboard navigation
- Screen reader compatibility

## Accessibility Requirements

- All interactive elements keyboard accessible
- ARIA labels on all buttons/inputs
- Focus management between steps
- Screen reader announcements for phase changes
- Error messages associated with inputs
- Sufficient color contrast (4.5:1)

## Responsive Design

- **Mobile:** Single column, stacked cards
- **Tablet:** 2 columns where appropriate
- **Desktop:** 3 columns for cards
- **Touch targets:** Minimum 44x44px
- **Swipe gestures:** On mobile

## Integration Points

- Uses `useUVPGeneration` from Track P
- Displays `StreamingText` from Week 3
- Shows `ProgressiveCards` from Week 3
- Displays `QualityIndicatorBadge` from Week 4
- Uses `MultiSelectEditor` from Week 3

## Deliverables Checklist

- [ ] UVPGenerationFlow main orchestrator
- [ ] OnboardingWizard with URL validation
- [ ] GenerationPhase with progress display
- [ ] ResultsReview with all sections
- [ ] ApprovalInterface with multi-select
- [ ] End-to-end integration tests
- [ ] Mobile responsive (test on real device)
- [ ] Accessibility audit passing
- [ ] Storybook stories for all components
- [ ] Error states handled gracefully

## Completion Validation

```bash
npm run typecheck  # Pass
npm test -- flows  # All tests pass
npm run storybook  # Can view all stories
npm run build  # Success
```

## Mock Hooks (If Track P Not Ready)

```typescript
// Temporary mock for useUVPGeneration
const mockUseUVPGeneration = () => ({
  generateUVP: vi.fn(),
  isGenerating: false,
  progress: 0,
  currentPhase: 'idle',
  result: null,
  error: null,
  retry: vi.fn(),
  cancel: vi.fn()
});
```

## Implementation Order

1. UVPGenerationFlow (main orchestrator)
2. OnboardingWizard
3. GenerationPhase
4. ResultsReview
5. ApprovalInterface
6. Integration tests
7. Accessibility & responsive testing
