# IMPROVED CONTENT CORRELATION PLAN
## Complete Intelligence Enhancement for All Customer Segments

**Created**: November 26, 2025
**Status**: APPROVED - Ready for Implementation
**Priority**: HIGHEST

---

## CUSTOMER SEGMENTS COVERED

| Segment | Examples | Primary Data Sources |
|---------|----------|---------------------|
| SMB Local | Plumber, Dentist, Restaurant | Google Reviews, Yelp, Weather |
| SMB Regional | Multi-location retail, Regional chain | Reviews + News + Seasonal |
| B2B National | Consulting, SaaS (US-focused) | G2, TrustPilot, LinkedIn, Reddit |
| B2B Global | Enterprise SaaS (OpenDialog) | G2, Quora, Reddit, LinkedIn |

---

## PHASE A: FIX CORE (P0 - CRITICAL)

| # | Task | All Segments |
|---|------|--------------|
| 1 | Fix UVP timing - Load from marba_uvps BEFORE APIs start | ✅ |
| 2 | UVP-filtered validation - Only show >30% relevance | ✅ |
| 3 | Generate UVP seed embeddings - Fix "0 seed centers" | ✅ |
| 4 | Brand ID resolution - Correct ID flows through pipeline | ✅ |

---

## PHASE B: EXPAND DATA SOURCES (P1 - HIGH)

### B1: Social & Review APIs

| # | Task | Local | Regional | B2B Nat | B2B Global |
|---|------|-------|----------|---------|------------|
| 5 | Reddit pain point mining | ✅ | ✅ | ✅ | ✅ |
| 6 | Quora question mining | ⚠️ | ⚠️ | ✅ | ✅ |
| 7 | G2 Reviews | ❌ | ❌ | ✅ | ✅ |
| 8 | TrustPilot Reviews | ✅ | ✅ | ✅ | ✅ |
| 9 | Twitter/X sentiment | ✅ | ✅ | ✅ | ✅ |

### B2: Deep Mining

| # | Task | Segments |
|---|------|----------|
| 10 | YouTube comment extraction (100/video) | ALL |
| 11 | SEMrush topic + PAA expansion | ALL |
| 12 | Google Reviews stratification (1-2/3/4-5 stars) | SMB |
| 13 | Yelp integration | SMB Local |
| 14 | LinkedIn decision-maker mining | B2B |

### B3: Contextual Intelligence

| # | Task | Segments |
|---|------|----------|
| 15 | Weather-to-content hooks | SMB Local |
| 16 | Seasonal pattern engine | SMB |
| 17 | Local event triggers | SMB |
| 18 | Industry news hooks | B2B |
| 19 | Economic indicator triggers | B2B |

### B4: Competitive Intelligence

| # | Task | Segments |
|---|------|----------|
| 20 | Local competitor extraction from reviews | SMB Local |
| 21 | Regional chain comparison | SMB Regional |
| 22 | Software alternative mining (G2/Reddit) | B2B |
| 23 | Enterprise vendor comparison | B2B Global |

---

## PHASE C: CONTENT MULTIPLICATION (P2 - MEDIUM)

| # | Task | Segments |
|---|------|----------|
| 24 | Content atomization (1→6 variations) | ALL |
| 25 | Local keyword templates ("near me") | SMB |
| 26 | Case study framework from reviews | ALL |
| 27 | Review response generator | SMB |
| 28 | Thought leadership angles | B2B |

---

## PHASE D: USER FEATURES (P3 - STANDARD)

| # | Task | Segments |
|---|------|----------|
| 29 | UVP Profile Page (/settings/uvp) | ALL |
| 30 | Content Mixer UVP integration | ALL |
| 31 | AI Picks UVP scoring (<30% filtered) | ALL |
| 32 | Segment-aware dashboard | ALL |
| 33 | Nav item "Brand Profile" | ALL |

---

## SUCCESS CRITERIA

### Universal (All Segments)

| Metric | Current | Target |
|--------|---------|--------|
| Data Points | 106 | 500+ |
| Correlated Insights | 30 | 100+ |
| Breakthroughs | 10 | 30+ |
| Psychological Triggers | ~10 | 50+ |
| UVP Relevance | ~20% | 80%+ |
| Multi-Source Validation | Rare | 60%+ |

### SMB Local Specific

| Metric | Target |
|--------|--------|
| Google Reviews stratified | 3 tiers + aspect sentiment |
| Weather hooks | 3-5 per refresh |
| Seasonal suggestions | 10+ per quarter |
| Local competitor mentions | 5-10 per competitor |
| Local SEO angles | 10+ per refresh |

### B2B Specific

| Metric | Target |
|--------|--------|
| G2/TrustPilot reviews | 100+ analyzed |
| LinkedIn signals | 20+ executive pain points |
| Software comparison angles | "Why switch" content |
| Case study frameworks | 5+ templates |

---

## IMPLEMENTATION TIMELINE

| Priority | Phase | Items | Duration |
|----------|-------|-------|----------|
| P0 | A: Fix Core | #1-4 | 1-2 days |
| P1 | B1-B2: APIs + Mining | #5-14 | 4-5 days |
| P2 | B3-B4: Context + Competitive | #15-23 | 3-4 days |
| P2 | C: Content Multiply | #24-28 | 2-3 days |
| P3 | D: User Features | #29-33 | 3-4 days |

**Total: 14-19 days**

---

## VALIDATION CHECKLIST

### SMB Local Test
```
✅ UVP: "Homeowners frustrated with unreliable plumbers"
✅ Google Reviews: 45 stratified
✅ Weather hook: "Freeze warning → Pipe prevention"
✅ Local SEO: "Best plumber in [city]" angles
✅ Insights: 85+
```

### B2B Global Test (OpenDialog)
```
✅ UVP: "Regulated industries + AI compliance"
✅ G2 Enterprise: 200 reviews mined
✅ Reddit: r/SaaS, r/insurance posts
✅ Compliance angles: HIPAA, GDPR hooks
✅ Insights: 180+
```

---

*Document created: November 26, 2025*
*Status: Ready for phased implementation*
