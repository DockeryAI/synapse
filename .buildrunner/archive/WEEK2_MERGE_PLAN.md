# Week 2 Trees: Merge Strategy & V2 Integration

**Status:** Week 2 worktrees completed but not merged
**Decision Point:** How to integrate them with new V2 campaign architecture

---

## Week 2 Deliverables (Completed, Unmerged)

### 1. Product/Service Scanner
**Branch:** `feature/product-scanner`
**Worktree:** `../synapse-product-scanner`

**What It Does:**
- Scans customer websites to extract products/services
- Uses Claude AI for intelligent product categorization
- Creates product tiers (basic/premium/enterprise)
- Stores in `business_services` table
- Integrates with onboarding wizard
- UI component for user review/confirmation

**V2 Integration Value:**
- **Product Launch Campaigns**: Generate campaigns for new product releases
- **Seasonal Product Promotions**: Campaigns tied to specific products/seasons
- **Product-Specific Narratives**: Story arcs about transformation through product use
- **Inventory-Driven Content**: Campaigns that highlight undermarketed products

**Recommendation:** **MERGE AS-IS**
- Fully compatible with V2
- Additive feature, doesn't conflict
- Enables richer campaign personalization

---

### 2. UVP Wizard Intelligence Integration
**Branch:** `feature/uvp-integration`
**Worktree:** `../synapse-uvp-integration`

**What It Does:**
- IntelligenceAutoPopulator service maps DeepContext → UVP fields
- Enhanced wizard steps with "AI-detected" badges
- Pre-fills wizard with intelligence from 10+ APIs
- Reduces completion time from 20min → 5min
- Validation mode for user review
- Maintains backward compatibility

**V2 Integration Value:**
- **Faster Onboarding**: More users reach campaign generation
- **Better UVP Data**: Richer data = better campaign suggestions
- **Goal Alignment**: UVP informs which campaign type to suggest
- **Messaging Coherence**: Campaign content aligns with validated UVP

**Recommendation:** **MERGE AS-IS**
- Critical for user acquisition (faster onboarding)
- Doesn't conflict with V2 architecture
- Makes campaign suggestions more accurate

---

### 3. Bannerbear Visual Integration
**Branch:** `feature/bannerbear-integration`
**Worktree:** `../synapse-bannerbear-v2`

**What It Does:**
- Enhanced Bannerbear service with template management
- 3 campaign-specific templates (Authority Builder, Social Proof, Local Pulse)
- VisualPreview component
- Integration with campaign preview workflow
- Database storage for generated visuals
- Platform-specific aspect ratios

**V2 Integration Needs:**
- **Template Updates**: Rename templates to match V2 types
  - Authority Builder → Authority Blitz
  - Social Proof → Trust Accelerator
  - Local Pulse → Local Hero
  - NEW: Market Dominator template
- **Story Arc Visuals**: Different visual styles for different story phases
  - Hook phase: Problem-focused visuals
  - Build phase: Educational/insight visuals
  - Reveal phase: Proof/results visuals
  - Action phase: CTA-focused visuals

**Recommendation:** **MERGE WITH MINOR UPDATES**
- Merge current code
- Update template names to V2 campaign types
- Add story-arc-aware visual generation in Week 3

---

## Merge Order & Testing

### Recommended Sequence:
1. **Product Scanner** (Tuesday)
   - Least complex integration
   - Self-contained feature
   - Test: Product detection, categorization, UI confirmation

2. **UVP Integration** (Wednesday)
   - Depends on Product Scanner for complete data
   - More complex, touches multiple services
   - Test: Wizard pre-population, validation flow, UVP quality

3. **Bannerbear** (Thursday)
   - Depends on campaign workflow being stable
   - Template updates can happen post-merge
   - Test: Visual generation, template selection, platform formats

### Testing Checklist per Feature:
- [ ] No TypeScript errors introduced
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Integrates with existing flow
- [ ] Database migrations run successfully
- [ ] No breaking changes to Week 1 code

---

## V2 Compatibility Analysis

### Product Scanner
**Compatibility:** ✅ 100% Compatible
- V1: Generates posts with product context
- V2: Generates campaign arcs with product-specific narratives
- No changes needed, just use richer product data in V2

### UVP Integration
**Compatibility:** ✅ 100% Compatible
- V1: UVP informs single post generation
- V2: UVP informs campaign strategy selection + narrative structure
- No changes needed, V2 just uses UVP more intelligently

### Bannerbear
**Compatibility:** ⚠️ 95% Compatible
**Minor Updates Needed:**
1. Rename templates to V2 campaign types
2. Add template variants for story arc phases
3. Update visual selection logic to consider narrative position

**Estimated Effort:** 2-4 hours

---

## Merge Strategy

### Option A: Merge All Three Now (Recommended)
**Pros:**
- Week 2 features available immediately
- Foundation ready for V2 build
- Users benefit from product intelligence & faster onboarding
- Bannerbear templates easy to rename

**Cons:**
- Need to update Bannerbear for V2 campaign types
- Slight overhead to ensure compatibility

**Timeline:**
- Tuesday: Merge Product Scanner
- Wednesday: Merge UVP Integration
- Thursday: Merge Bannerbear + rename templates
- Friday: Integration testing, fix any issues

---

### Option B: Hold Week 2, Build V2 First
**Pros:**
- V2 architecture fully defined before Week 2 integration
- Can optimize Week 2 for V2 from the start
- Cleaner integration

**Cons:**
- Delays valuable features (faster onboarding, product intelligence)
- Users miss benefits for 2 more weeks
- Week 2 code sits idle, might need refresh

**Timeline:**
- Week 3: Build V2 campaign architecture
- Week 4: Merge Week 2 trees with V2 optimizations
- Week 5: Integration testing

---

### Option C: Partial Merge (UVP + Product, Hold Bannerbear)
**Pros:**
- Get 80% of value (faster onboarding, product intel)
- Defer Bannerbear until V2 visual strategy clear
- Less testing overhead

**Cons:**
- Campaigns lack visuals for 2 weeks
- Bannerbear code might need refresh later

**Timeline:**
- Tuesday: Merge Product Scanner
- Wednesday: Merge UVP Integration
- Week 3: Build V2, decide Bannerbear integration approach
- Week 4: Merge Bannerbear with V2 optimizations

---

## Recommendation: Option A (Merge All Three)

### Rationale:
1. **User Value First**: Faster onboarding + product intelligence benefits users immediately
2. **Low Risk**: All three features are additive, minimal breaking change risk
3. **V2 Foundation**: Product data + UVP data make V2 suggestions better
4. **Bannerbear Simple**: Renaming templates is trivial work
5. **Momentum**: Keep building forward vs sitting on completed code

### Action Plan:
**Tuesday (Product Scanner):**
- Merge `feature/product-scanner` → `main`
- Run migrations
- Test product detection end-to-end
- Verify onboarding wizard integration

**Wednesday (UVP Integration):**
- Merge `feature/uvp-integration` → `main`
- Test wizard pre-population with Product Scanner data
- Verify UVP quality and validation flow
- Check DeepContext → UVP mapping accuracy

**Thursday (Bannerbear):**
- Merge `feature/bannerbear-integration` → `main`
- Rename templates in Bannerbear service:
  ```typescript
  // Before
  'authority-builder', 'social-proof', 'local-pulse'

  // After
  'authority-blitz', 'trust-accelerator', 'local-hero', 'market-dominator'
  ```
- Test visual generation with renamed templates
- Create placeholder for Market Dominator template

**Friday (Integration Testing):**
- Full end-to-end test: URL input → product scan → UVP wizard → campaign generation → visual preview
- Fix any integration bugs
- Verify Week 1 + Week 2 work seamlessly
- Prepare for Week 3 V2 build

---

## Post-Merge: V2 Enhancements

### Week 3 V2 Build Will:
1. **Leverage Product Scanner**
   - Product launch campaign arcs
   - Seasonal product promotions
   - Product-specific narrative sequencing

2. **Leverage UVP Integration**
   - Better goal → campaign type matching
   - UVP-aligned messaging throughout story arc
   - Personalized narrative based on validated UVP

3. **Enhance Bannerbear**
   - Story-phase-specific visuals
   - Narrative-aligned templates
   - Visual progression through campaign arc

---

## Risk Mitigation

### If Merge Causes Issues:
- **Rollback Plan**: Git revert to pre-merge state
- **Feature Flags**: Add flags to disable Week 2 features if needed
- **Hotfix Branch**: Quick fixes for critical bugs

### Testing Requirements:
- [ ] TypeScript compiles cleanly
- [ ] No runtime errors in dev
- [ ] Product scanner detects products correctly
- [ ] UVP wizard pre-populates from intelligence
- [ ] Bannerbear generates visuals with correct templates
- [ ] Campaign generation still works (Week 1)
- [ ] Dark mode works throughout
- [ ] Mobile responsive

---

## Summary

**Decision:** Merge all three Week 2 trees Tuesday-Thursday

**Why:**
- User value (faster onboarding, product intelligence)
- V2 foundation (richer data for better campaigns)
- Low risk (additive features, well-tested)
- Momentum (keep building forward)

**Timeline:**
- Tuesday: Product Scanner
- Wednesday: UVP Integration
- Thursday: Bannerbear + template renames
- Friday: Integration testing
- Next Week: Begin V2 campaign architecture build

**Expected Outcome:**
By Friday EOD, Synapse will have:
- ✅ Campaign generation (Week 1)
- ✅ Product intelligence (Week 2)
- ✅ Fast UVP onboarding (Week 2)
- ✅ Visual generation (Week 2)
- 🚀 Ready for V2 multi-touch campaign build (Week 3)

---

*Merging Week 2 now gives us the foundation to build V2 on solid ground.*
