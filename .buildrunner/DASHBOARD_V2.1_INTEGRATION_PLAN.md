# Dashboard V2.1 Integration Plan
**Unifying V2 Components + Content Quality System**

## Executive Summary
Transform the current fragmented dashboard into a unified intelligence command center where every insight is framework-aligned, quality-scored, and actionable through proven psychological templates.

**Total Duration:** 5-6 days
**Components to Integrate:** 45+ existing V2 components + 7 content quality services
**End Result:** Single dashboard with Opportunity Radar, Framework-driven clusters, and Campaign Builder integration

---

## PHASE 1: Display Components (Day 1) ✅ COMPLETE
### Morning: Create Missing UI Components ✅ COMPLETE
- ✅ **ClusterPatternCard.tsx** - Display framework, coherence, sources, sentiment
- ✅ **BreakthroughCard.tsx** - Insight card with Synapse button and score badge
- ✅ **CelebrationAnimation.tsx** - Framer Motion celebration for 80+ scores
- ✅ **EQScoreBadge.tsx** - Visual badge showing emotional intelligence score
- ✅ **CampaignTimeline.tsx** - Dashboard-embedded timeline view

**Additional:** Updated InsightCluster interface to include frameworkUsed field in clustering.service.ts

### Afternoon: Wire into PowerMode ✅ COMPLETE
- ✅ Replaced generic "Hidden Pattern" cards with ClusterPatternCard
- ✅ Added framework data visualization to cluster display
- ✅ Integrated Synapse button for breakthrough generation
- ✅ Connected celebration triggers to high-scoring content (85+)
- ✅ Added "Top Breakthroughs" section with BreakthroughCard display
- ✅ Added quality score badges to all insight cards
- ✅ Implemented quality filtering and sorting (High Quality 80+ filter)
- ✅ Added quality stats to header (high-quality count, average score)
- ✅ Created component export index (src/components/dashboard/index.ts)
- ✅ Created TypeScript types file (src/types/dashboard.types.ts)

**Deliverable:** All clusters show framework used + quality scores + breakthrough insights with CelebrationAnimation

---

## PHASE 2: Intelligence Enhancement (Day 2)
### Morning: Quality Pipeline Integration
- Wire FrameworkSelector into clustering.service output
- Connect CustomerTitleGenerator to all title generation
- Add TitleQualityValidator as final check before display
- Integrate ContentQualityScorer into insight cards

### Afternoon: Data Enhancement
- Connect SmartQueryBuilder to deepContextBuilder
- Enhance cluster generation with richer data
- Add quality scoring metadata to DeepContext
- Update PowerMode to display quality indicators

**Deliverable:** Every insight has framework alignment + quality score

---

## PHASE 3: Dashboard Restructure (Day 3)
### Morning: Layout Transformation
- Move OpportunityRadar from v2/intelligence to dashboard center
- Create three-column layout (AI Picks | Command Center | Opportunity Feed)
- Integrate BreakthroughScoreCard into AiPicksPanel
- Add mode selector for Easy/Power/Campaign views

### Afternoon: Component Integration
- Wire OpportunityRadar to live intelligence data
- Connect CompetitiveInsights to dashboard context
- Add quick action buttons to opportunity cards
- Implement celebration animation triggers

**Deliverable:** New three-column dashboard with Opportunity Radar as entry point

---

## PHASE 4: Flow Unification (Day 4)
### Morning: Navigation & Actions
- Add "Build Campaign" button to every insight card
- Create seamless navigation from insight → campaign builder
- Wire cluster selection to campaign template pre-selection
- Add "Synapse Generate" action to all breakthrough cards

### Afternoon: State Management
- Unify selection state across all components
- Connect framework selection to campaign generation
- Persist quality scores in local storage
- Add opportunity dismissal/snooze functionality

**Deliverable:** Seamless flow from opportunity → insight → campaign

---

## PHASE 5: Polish & Optimization (Day 5)
### Morning: Performance & UX
- Implement lazy loading for heavy components
- Add loading skeletons for all async operations
- Optimize cluster rendering for 100+ items
- Add keyboard shortcuts for power users

### Afternoon: Final Integration
- Ensure all 35 templates accessible from insights
- Verify framework consistency across generation
- Add analytics tracking for quality scores
- Implement error boundaries for stability

**Deliverable:** Production-ready unified dashboard

---

## PHASE 6: Testing & Documentation (Day 6)
### Morning: Testing
- Test all user flows from opportunity to campaign
- Verify quality scoring on 50+ generations
- Ensure framework selection accuracy
- Test celebration animations and triggers

### Afternoon: Documentation
- Update user guide with new dashboard flow
- Document framework selection logic
- Create quality score interpretation guide
- Add troubleshooting section

**Deliverable:** Fully tested, documented V2.1 dashboard

---

## Success Metrics
- **Integration Coverage:** 100% of V2 components active in dashboard
- **Quality Scoring:** Every piece of content scored before display
- **Framework Alignment:** 100% of insights use appropriate framework
- **User Flow:** < 3 clicks from opportunity to campaign creation
- **Performance:** < 2s load time for full dashboard

---

## Risk Mitigation
- **Component Conflicts:** Use namespace prefixing for V2 components
- **State Management:** Implement Redux slice for unified state
- **Performance:** Use React.memo and virtualization for large lists
- **Breaking Changes:** Feature flag for gradual rollout

---

## Post-Launch (Week 2)
- Monitor quality score accuracy
- Gather user feedback on framework selections
- Fine-tune celebration triggers
- Add advanced filtering to Opportunity Radar