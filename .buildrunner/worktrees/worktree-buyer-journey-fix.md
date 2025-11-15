# Worktree Task: Fix Buyer Journey Wizard

**Feature ID:** `buyer-journey-simplified`
**Branch:** `feature/buyer-journey-fix`
**Estimated Time:** 6 hours
**Status:** IN PROGRESS (1200 LOC already exists)
**Priority:** HIGH
**Dependencies:** Foundation
**Worktree Path:** `../synapse-buyer-journey`

---

## Context

This feature is "in progress" which means it's probably broken. Your job: fix it, complete it, make it work.

**Existing Files (probably):**
- `src/components/buyer-journey/SimplifiedBuyerJourneyWizard.tsx`
- `src/components/buyer-journey/steps-simplified/CustomerSelectionStep.tsx`
- `src/components/buyer-journey/visual/PersonaGallery.tsx`

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-buyer-journey feature/buyer-journey-fix
cd ../synapse-buyer-journey
npm install
```

---

## Task Checklist

### 1. Audit Existing Code
- [ ] Read all 3 existing component files
- [ ] Find what's broken: TypeScript errors, missing imports, logic bugs
- [ ] Check if it compiles: `npm run build`
- [ ] List all errors in a file: `ISSUES.md`

### 2. Fix TypeScript Errors
- [ ] Resolve all type errors
- [ ] Add missing type definitions
- [ ] Fix import paths
- [ ] Ensure components export correctly

### 3. Complete Missing Functionality

**Requirements from features.json:**
- Streamlined buyer journey mapping
- Persona selection
- Pain point identification
- Content recommendations

**Check if implemented:**
- [ ] Persona gallery with selection UI
- [ ] Pain point identification step
- [ ] Journey stage mapping (awareness → consideration → decision)
- [ ] Content recommendations based on selections
- [ ] Save to `buyer_journeys` and `buyer_personas` tables

### 4. Integration with OpenRouter
- [ ] Journey mapping AI suggestions
- [ ] Persona generation based on business type
- [ ] Content recommendations per journey stage

### 5. Database Integration
```typescript
// Save journey
await supabase.from('buyer_journeys').insert({
  business_profile_id: profileId,
  journey_data: journeyMap,
  created_at: new Date()
})

// Save personas
await supabase.from('buyer_personas').insert(personas)
```

### 6. UI Polish
- [ ] Progress indicator (Step 1 of 3)
- [ ] Back/Next navigation
- [ ] Loading states
- [ ] Error messages
- [ ] Success confirmation

---

## Testing

```typescript
it('completes buyer journey wizard', async () => {
  render(<SimplifiedBuyerJourneyWizard />)

  // Select persona
  fireEvent.click(screen.getByText('Small Business Owner'))

  // Identify pain points
  fireEvent.click(screen.getByText('Limited time'))

  // Complete wizard
  fireEvent.click(screen.getByText('Generate Recommendations'))

  expect(screen.getByText('Journey Complete')).toBeInTheDocument()
})
```

---

## Completion Criteria

- [ ] No TypeScript errors
- [ ] All 3 wizard steps functional
- [ ] Persona selection works
- [ ] Pain points save to database
- [ ] Content recommendations display
- [ ] Integrates with OpenRouter
- [ ] UI is polished and usable

---

## Commit & Merge

```bash
git add .
git commit -m "fix: Complete and fix buyer journey wizard

- Resolved TypeScript errors
- Completed persona selection step
- Added pain point identification
- Integrated OpenRouter for journey mapping
- Database persistence working
- UI polish and navigation

Closes buyer-journey-simplified feature"

git push origin feature/buyer-journey-fix
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/buyer-journey-fix
git worktree remove ../synapse-buyer-journey
```

---

*It's "in progress" which usually means "abandoned and broken." Prove me wrong.*
