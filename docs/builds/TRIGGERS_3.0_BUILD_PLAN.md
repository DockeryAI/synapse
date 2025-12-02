# Triggers 3.0 Build Plan

## Build Progress

| Phase | Status | Completion Date |
|-------|--------|-----------------|
| Phase 1: Foundation Layer | ✅ COMPLETE | 2025-12-01 |
| Phase 2: SMB Signal Pipeline | ✅ COMPLETE | 2025-12-01 |
| Phase 3: Profile-Specific Pipelines | ✅ COMPLETE | 2025-12-01 |
| Phase 4: Enterprise ABM Layer | ✅ COMPLETE | 2025-12-01 |
| Phase 5: UI & Integration | ✅ COMPLETE | 2025-12-01 |

---

## Overview

A comprehensive rebuild of the Synapse Triggers system, prioritizing SMB market intelligence while adding enterprise ABM capabilities. This plan covers all 6 business profiles with profile-aware signal routing and confidence scoring.

---

## Architecture Summary

### Core Principles
1. **SMB-First Design** - Optimize for 1-2 decision makers, 30-90 day buying cycles
2. **Profile-Aware Routing** - Different profiles get different signal weights and sources
3. **Multi-Signal Stacking** - Require 2+ sources to reduce false positives from ~48% to ~20%
4. **Recency Weighting** - 30-day rule with exponential decay (0-14 days = 100%, 60+ days = 25%)

### Confidence Scoring Formula
```
Score = Signal Quality × Recency × Source Count × Competitor Attribution
```

### Signal Quality Hierarchy
| Tier | Signal Type | Weight |
|------|-------------|--------|
| Tier 1 | Direct competitor mentions + pain point | 1.0 |
| Tier 2 | Category research + negative sentiment | 0.8 |
| Tier 3 | Feature comparison questions | 0.6 |
| Tier 4 | General category browsing | 0.4 |
| Tier 5 | Noise (filtered out) | 0.0 |

---

## The 6 Business Profiles

### 1. Local Service B2B
**Examples**: HVAC contractors, IT MSPs, Commercial cleaning, Office suppliers

**Primary Triggers**:
- Competitor complaint mentions on Google Reviews
- "Looking for new [service]" posts in local business Facebook groups
- Yelp reviews mentioning service failures
- LinkedIn job posts indicating growth (hiring = need more services)

**Signal Sources** (Priority Order):
1. Google Business reviews (competitor monitoring)
2. Local Reddit communities (r/[city]business, r/smallbusiness)
3. LinkedIn job postings in service area
4. Yelp business reviews

**Unique Considerations**:
- Geographic radius filtering (25-50 mile default)
- Seasonal patterns (HVAC: summer/winter spikes)
- Contract renewal cycles (annual service agreements)

---

### 2. Local Service B2C
**Examples**: Dental practices, Hair salons, Restaurants, Fitness studios

**Primary Triggers**:
- "Moved to [city]" posts indicating new residents seeking services
- Negative reviews of competitors on Google/Yelp
- Life event signals (engagement = wedding services, baby = pediatric dentist)
- Seasonal demand spikes

**Signal Sources** (Priority Order):
1. Google Reviews (local competitors)
2. Yelp reviews and "Request a Quote" activity
3. Nextdoor recommendations requests
4. Local Facebook group mentions
5. Reddit r/[city] threads

**Unique Considerations**:
- Review recency is CRITICAL (87% check reviews < 2 weeks old)
- Photo quality in reviews matters for visual services
- Response to negative reviews as differentiator signal

---

### 3. Regional B2B Agency
**Examples**: Marketing agencies, Accounting firms, HR consultants, Legal services

**Primary Triggers**:
- Client churn signals (agency competitors losing accounts)
- RFP announcements and bid requests
- "Agency recommendations" threads on Reddit/LinkedIn
- Compliance deadline awareness (tax season, audit cycles)
- Competitor employee departures (LinkedIn)

**Signal Sources** (Priority Order):
1. Reddit (r/marketing, r/agencies, r/smallbusiness)
2. LinkedIn (job changes, company updates)
3. G2/Clutch reviews for agency competitors
4. Industry forum discussions
5. Perplexity for news/announcements

**Unique Considerations**:
- Retainer model = focus on contract renewal periods
- Project-based = seasonal budget cycles (Q4 planning, Q1 execution)
- Referral networks matter more than cold signals

---

### 4. Regional Retail/Franchise
**Examples**: Multi-location retail, Restaurant franchises, Service franchises

**Primary Triggers**:
- New location announcements (expansion = vendor needs)
- Franchisee complaint patterns (corporate dissatisfaction)
- Seasonal inventory cycles
- POS/technology upgrade discussions
- Labor shortage complaints (need efficiency tools)

**Signal Sources** (Priority Order):
1. Franchise-specific Reddit communities
2. Google Reviews across locations (pattern analysis)
3. LinkedIn franchise owner groups
4. Industry trade publications (via Perplexity)
5. Yelp multi-location patterns

**Unique Considerations**:
- Corporate vs. franchisee decision-making split
- Multi-location consistency requirements
- Territory-based analysis needed

---

### 5. National SaaS B2B
**Examples**: Project management tools, CRM platforms, HR software, Analytics tools

**Primary Triggers**:
- Competitor churn signals (cancellation discussions)
- Integration/migration questions ("switching from X to Y")
- Feature comparison threads
- Pricing complaints about competitors
- G2/Capterra negative reviews with specific pain points
- Job postings mentioning competitor tools (switching signal)

**Signal Sources** (Priority Order):
1. G2 reviews (competitor monitoring)
2. Capterra reviews
3. Reddit (r/SaaS, r/startups, industry-specific)
4. Product Hunt discussions
5. LinkedIn technology mentions
6. Hacker News threads

**Unique Considerations**:
- Trial-to-paid conversion signals
- Annual contract renewal timing (Q4 heavy)
- Integration ecosystem as trigger (need X that works with Y)
- Company size indicators (employee count, funding)

---

### 6. National Product B2C/B2B2C
**Examples**: Consumer brands, D2C products, E-commerce, Consumer apps

**Primary Triggers**:
- Competitor product complaints (quality, shipping, support)
- "Alternative to X" search patterns
- Influencer/review site mentions
- Seasonal buying triggers (holidays, back-to-school)
- Price sensitivity signals (budget discussions)
- Unboxing/review disappointment content

**Signal Sources** (Priority Order):
1. Reddit product communities
2. Amazon review sentiment (via Perplexity)
3. YouTube review comments
4. TikTok/Instagram mention patterns
5. Product review site discussions
6. Deal/coupon community activity

**Unique Considerations**:
- Impulse vs. considered purchase distinction
- Social proof weight (influencer mentions)
- Price elasticity signals
- Seasonal/promotional timing

---

## Implementation Phases

### Phase 1: Foundation Layer (3-4 days)

**Day 1-2: Recency Weighting System**
- Implement exponential decay formula
- Add timestamp normalization across sources
- Create recency score calculator utility
- Update trigger card UI to show age indicator

**Day 2-3: Competitor Attribution Engine**
- Build competitor name/alias resolver
- Implement fuzzy matching for brand variations
- Create competitor mention extractor
- Add attribution confidence scoring

**Day 3-4: Semantic Title Fix**
- Replace generic "growth opportunity" titles
- Implement source-aware title generation
- Add trigger type classification
- Create title templates per trigger category

**Day 4: Confidence Scoring System**
- Implement base scoring formula
- Add multi-signal bonus calculation
- Create confidence thresholds (high/medium/low)
- Build score explanation generator

**Deliverables**:
- `recency-calculator.service.ts`
- `competitor-attribution.service.ts`
- `trigger-title-generator.service.ts`
- `confidence-scorer.service.ts`

---

### Phase 2: SMB Signal Pipeline (5-6 days)

**Day 5-6: Enhanced Reddit Integration**
- Expand subreddit coverage for SMB communities
- Add comment thread analysis (not just posts)
- Implement sentiment analysis on discussions
- Build "asking for recommendations" pattern detector

**Day 7-8: Review Platform Pipeline**
- Google Reviews competitor monitoring
- Yelp business review analysis
- G2/Capterra SMB tool reviews
- Cross-platform review aggregation

**Day 9-10: SMB-Specific Classifiers**
- Company size estimator (solo, small team, growing)
- Decision-maker identifier (owner vs. employee)
- Buying urgency classifier (browsing vs. active)
- Budget range estimator

**Deliverables**:
- `reddit-smb-analyzer.service.ts`
- `review-aggregator.service.ts`
- `smb-classifier.service.ts`
- `urgency-detector.service.ts`

---

### Phase 3: Profile-Specific Pipelines (6-8 days)

**Day 11-12: Local Service Profiles (B2B + B2C)**
- Geographic radius filtering
- Local review platform integration
- Seasonal pattern detection
- Life event signal processing

**Day 13-14: Regional Profiles (Agency + Retail)**
- Multi-location analysis
- Contract cycle awareness
- Franchise-specific patterns
- Territory-based routing

**Day 15-18: National Profiles (SaaS + Product)**
- G2/Capterra deep integration
- Churn signal detection
- Integration ecosystem mapping
- Social proof aggregation

**Deliverables**:
- `profile-router.service.ts`
- `local-signals.service.ts`
- `regional-signals.service.ts`
- `national-signals.service.ts`
- Profile-specific configuration files

---

### Phase 4: Enterprise ABM Layer (3-4 days)

**Day 19-20: Multi-Signal Stacking**
- Cross-source correlation engine
- Signal clustering algorithm
- False positive reduction logic
- Composite score calculator

**Day 21: Surge Detection**
- Baseline activity calculation
- Anomaly detection (2+ std dev)
- Trend vs. spike classification
- Alert threshold configuration

**Day 22: Buying Stage Classification**
- Research phase indicators
- Evaluation phase signals
- Decision phase triggers
- Post-purchase intent (upsell/churn)

**Deliverables**:
- `signal-stacker.service.ts`
- `surge-detector.service.ts`
- `buying-stage-classifier.service.ts`

---

### Phase 5: UI & Integration (2-3 days)

**Day 23: Trigger Card Redesign**
- Confidence score display
- Source attribution badges
- Recency indicators
- Competitor mention highlighting

**Day 24: Filtering & Sorting**
- Filter by confidence level
- Filter by trigger type
- Filter by source
- Sort by recency/confidence/relevance

**Day 25: Caching & Performance**
- Implement intelligent cache invalidation
- Add background refresh for stale data
- Optimize API call batching
- Add loading states and skeletons

**Deliverables**:
- Updated `TriggerCard.tsx`
- `TriggerFilters.tsx`
- `trigger-cache.service.ts`
- Performance optimizations

---

## Time Estimates Summary

| Phase | Description | Days |
|-------|-------------|------|
| Phase 1 | Foundation Layer | 3-4 |
| Phase 2 | SMB Signal Pipeline | 5-6 |
| Phase 3 | Profile-Specific Pipelines | 6-8 |
| Phase 4 | Enterprise ABM Layer | 3-4 |
| Phase 5 | UI & Integration | 2-3 |
| **Total** | | **19-25 days** |

**Estimated Timeline**: ~4 weeks with buffer for testing and iteration

---

## API Stack (Current)

| API | Use Case | Rate Limits |
|-----|----------|-------------|
| Perplexity | News, trends, general research | 50 req/min |
| Apify | Reddit scraping, G2 reviews | Per-actor limits |
| YouTube Data API | Video/comment analysis | 10,000 units/day |
| Website Analyzer | Company website parsing | Custom |

**No New APIs Required** - All enhancements use existing stack more intelligently.

---

## Success Metrics

### Quality Metrics
- **False Positive Rate**: Target < 25% (from ~48%)
- **Signal Recency**: 80% of triggers < 30 days old
- **Competitor Attribution**: 90% accuracy on brand mentions
- **Confidence Distribution**: 60% high, 30% medium, 10% low

### Volume Metrics
- **Triggers per Profile**: 15-30 high-quality triggers
- **Source Diversity**: Average 2.3 sources per trigger
- **Refresh Rate**: Daily for active profiles

### User Metrics
- **Actionability Score**: User rates trigger usefulness
- **Click-through Rate**: Triggers that lead to action
- **Time to First Trigger**: < 30 seconds on page load

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API rate limits | Implement intelligent caching, background refresh |
| Low signal volume for niche profiles | Expand source coverage, lower confidence thresholds |
| False positives | Multi-signal validation, user feedback loop |
| Stale data | Aggressive recency weighting, cache invalidation |

---

## Dependencies

- Existing DeepContext system (for profile data)
- Current Apify integration
- Perplexity API access
- YouTube Data API quota

---

## Files to Create/Modify

### New Services
- `src/services/triggers/recency-calculator.service.ts`
- `src/services/triggers/competitor-attribution.service.ts`
- `src/services/triggers/trigger-title-generator.service.ts`
- `src/services/triggers/confidence-scorer.service.ts`
- `src/services/triggers/reddit-smb-analyzer.service.ts`
- `src/services/triggers/review-aggregator.service.ts`
- `src/services/triggers/smb-classifier.service.ts`
- `src/services/triggers/urgency-detector.service.ts`
- `src/services/triggers/profile-router.service.ts`
- `src/services/triggers/signal-stacker.service.ts`
- `src/services/triggers/surge-detector.service.ts`
- `src/services/triggers/buying-stage-classifier.service.ts`

### New Components
- `src/components/v4/TriggerCardV2.tsx`
- `src/components/v4/TriggerFilters.tsx`
- `src/components/v4/TriggerConfidenceBadge.tsx`

### Modified Files
- `src/components/v4/TriggersPanel.tsx`
- `src/hooks/useStreamingTriggers.ts`
- `src/services/intelligence/streaming-api-manager.ts`

---

## Reference Documentation

See `/docs/TRIGGER_RESEARCH.md` for complete research including:
- Part 4.6: Enterprise ABM Buying Trigger Methodologies
- Part 10: SMB Buying Trigger Intelligence
- Parts 1-9: Profile specifications and existing research
