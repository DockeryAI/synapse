# Apify Feature Enhancement Plan
**Version:** 1.0.1 (Post-MVP Release)
**Created:** 2025-11-25
**Status:** Planned for Next Release

---

## Executive Summary

Integrate Apify's social media scraping capabilities to enrich existing platform intelligence with real-time social signals, review data, and competitive insights. This enhancement adds 360° brand intelligence without building new features - only enriching current capabilities.

**Subscription:** Apify Starter Plan ($49/month) - Already Active
**Timeline:** 6 weeks progressive enhancement
**ROI:** 10x richer insights, 50% faster trend detection, 3x engagement improvement

---

## Verified Actor IDs (Confirmed via API)

### Tier 1: Essential Brand Intelligence
| Platform | Actor ID | Status | Notes |
|----------|----------|--------|-------|
| Facebook | `apify/facebook-pages-scraper` | ✅ Verified | Pages, posts, reviews |
| X/Twitter | `web.harvester/twitter-scraper` | ✅ Updated (2025-11-26) | Recommended by Apify |
| Instagram | `apify/instagram-scraper` | ✅ Working | Already in codebase |
| TikTok | `clockworks/tiktok-scraper` | ✅ Verified | Trending content |
| LinkedIn | `curious_coder/linkedin-profile-scraper` | ✅ Verified | B2B intelligence |

### Tier 2: Reputation Management
| Platform | Actor ID | Status | Notes |
|----------|----------|--------|-------|
| YouTube | `bernardo/youtube-scraper` | ✅ Verified | Comments, videos |
| Google Maps | `compass/google-maps-reviews-scraper` | ✅ Working | Already configured |
| Yelp | `cranebear/yelp-scraper` | ✅ Verified | Service reviews |

### Tier 3: Discovery & Analysis
| Platform | Actor ID | Status | Notes |
|----------|----------|--------|-------|
| Social Finder | `social-media-finder/social-media-finder` | ✅ Verified | Cross-platform |
| Reddit | `trudax/reddit-scraper` | ✅ Converting | Existing component migration |
| Web Scraper | `apify/web-scraper` | ✅ Verified | Fallback option |

---

## Feature Enrichment Matrix

### Phase 1: Breakthrough Detection Enhancement
**Week 1-2 | Current vs Enhanced**

| Current | Enhanced With Apify | Business Impact |
|---------|-------------------|-----------------|
| News articles only (24hr lag) | + Twitter mentions + TikTok trends | 6-12 hours earlier detection |
| Keyword frequency | Social velocity metrics (100→1000/hr) | Crisis prevention capability |
| Static thresholds | Dynamic social signals | Adaptive alerting |

**Implementation:**
- Add `xtdata/twitter-x-scraper` to breakthrough monitoring
- Track mention velocity and sentiment shifts
- Correlate with existing news data

### Phase 2: Smart Picks Content Enrichment
**Week 3-4 | Current vs Enhanced**

| Current | Enhanced With Apify | Business Impact |
|---------|-------------------|-----------------|
| Generic AI ideas | Real viral format examples | "This got 50K likes" proof |
| Theoretical campaigns | Competitor campaign analysis | Proven strategies only |
| Basic hashtags | Performance-tested hashtags | 3x engagement rates |

**Implementation:**
- Scrape top performing posts from `apify/instagram-scraper`
- Analyze competitor campaigns via `apify/facebook-pages-scraper`
- Extract winning formats and templates

### Phase 3: Cluster Pattern Augmentation
**Week 5 | Current vs Enhanced**

| Current | Enhanced With Apify | Business Impact |
|---------|-------------------|-----------------|
| Keyword clusters | Actual customer quotes | Voice of customer |
| Topic frequency | Review theme extraction | "857 mentions of [X]" |
| Search data only | Comment sentiment analysis | Hidden pain points |

**Implementation:**
- Mine reviews with `compass/google-maps-reviews-scraper`
- Extract themes from YouTube comments
- Cluster by sentiment and frequency

### Phase 4: Cross-Platform Correlation
**Week 6 | Current vs Enhanced**

| Current | Enhanced With Apify | Business Impact |
|---------|-------------------|-----------------|
| Single-source data | Multi-platform patterns | Hidden correlations |
| Historical analysis | Real-time social cascade | Predictive insights |
| Manual correlation | Automated pattern detection | Scale intelligence |

**Implementation:**
- Build embedding pipeline for all social content
- Store in Supabase pgvector
- Implement similarity search across platforms

---

## Progressive Loading Architecture

### Optimized API Loading Sequence
```
Phase 1 (0-5s): Cached data + Previous insights
Phase 2 (5-15s): Instagram + Google Reviews (free tier friendly)
Phase 3 (15-30s): Facebook + Twitter + TikTok (parallel)
Phase 4 (30-45s): LinkedIn + YouTube (background)
Phase 5 (45-60s): Competitive analysis + Discovery
```

### Smart Caching Strategy
- Social profiles: 7 days
- Reviews: 24 hours
- Viral content: 1 hour
- Brand mentions: Real-time
- Competitor data: 3 days

---

## Integration Points

### 1. Breakthrough Detection (`BreakthroughCard.tsx`)
```typescript
// Enrich with social velocity
const socialSignals = await ApifyAPI.getTwitterMentions(brand)
const viralIndicator = calculateVelocity(socialSignals)
```

### 2. Smart Picks (`DashboardSmartPicks.tsx`)
```typescript
// Add proven content examples
const topPosts = await ApifyAPI.getTopPerformingContent(industry)
campaigns.forEach(c => c.provenExamples = topPosts)
```

### 3. Cluster Patterns (`ClusterPatternCard.tsx`)
```typescript
// Extract real quotes
const reviews = await ApifyAPI.getReviewThemes(brand)
clusters.forEach(c => c.customerQuotes = reviews[c.topic])
```

### 4. Intelligence Library (`IntelligenceLibraryV3.tsx`)
```typescript
// Add social proof
insights.forEach(i => i.socialProof = aggregatedSocialData[i.topic])
```

---

## Technical Implementation

### Week 1: Foundation (2-3 days)
- [ ] Update actor IDs in `apify-api.ts`
- [ ] Remove timeout mechanism from `optimized-api-loader.service.ts`
- [ ] Fix Perplexity model name ("sonar" not "llama-3.1-sonar")
- [ ] Convert Reddit component from direct API to Apify (easy - embeddings ready)
- [ ] Implement progressive loading without timeouts
- [ ] Test with Apify Starter plan

### Week 2: Breakthrough Enhancement (3-4 days)
- [ ] Add Twitter monitoring to breakthrough detection
- [ ] Implement velocity calculation
- [ ] Create social signal correlation
- [ ] Add Instagram trending analysis

### Week 3: Content Enrichment (3-4 days)
- [ ] Scrape competitor campaigns
- [ ] Extract viral formats
- [ ] Build proven example database
- [ ] Integrate into Smart Picks

### Week 4: Cluster Augmentation (2-3 days)
- [ ] Extract review themes
- [ ] Mine YouTube comments
- [ ] Build quote extraction
- [ ] Enhance cluster visualization

### Week 5: Correlation Engine (3-4 days)
- [ ] Set up pgvector in Supabase
- [ ] Build embedding pipeline
- [ ] Implement cross-platform search
- [ ] Create pattern detection

### Week 6: Polish & Optimization (3-4 days)
- [ ] Optimize caching strategy
- [ ] Fine-tune loading sequence
- [ ] Add error recovery
- [ ] Complete integration testing

---

## Success Metrics

### Performance Targets
- API loading: 100% completion (no more 18/23 stalls)
- Trend detection: 50% faster (6-12 hours vs 24 hours)
- Content relevance: 3x engagement improvement
- Data richness: 10x more insights per query

### Quality Indicators
- Every recommendation backed by real data
- Cross-platform patterns identified daily
- Zero timeout errors in production
- Progressive enhancement working smoothly

---

## Risk Mitigation

### API Reliability
- Primary actor → Secondary actor → Generic scraper fallback
- Cached data for offline capability
- Graceful degradation on failures

### Rate Limiting
- Round-robin actor rotation
- Implement request queuing
- Respect platform limits

### Cost Management
- Monitor API usage dashboard
- Set alerts at 80% quota
- Implement usage caps per customer

---

## Rollout Strategy

### Phase 1: Internal Testing
- Fix current actor IDs
- Test with dev data
- Validate enrichments

### Phase 2: Beta Customers
- Roll out to 5-10 customers
- Monitor performance
- Gather feedback

### Phase 3: Full Launch
- Enable for all users
- Marketing campaign: "10x Smarter Intelligence"
- Pricing tier adjustment if needed

---

## Budget & Resources

### Costs
- Apify Starter: $49/month (active)
- Development: 6 weeks
- Additional APIs: $0 (using existing)

### ROI Calculation
- Current: 3 customers @ $99 = $297
- Enhanced: 10 customers @ $149 = $1,490
- Net gain: $1,193/month

---

## Next Steps

1. **Immediate:** Fix actor IDs in current implementation
2. **Week 1:** Remove timeouts, implement progressive loading
3. **Week 2-6:** Follow enhancement schedule
4. **Post-Launch:** Monitor metrics, iterate based on usage

---

## Appendix: Actor API Patterns

### Standard API Call
```
POST https://api.apify.com/v2/acts/{actor-id}/runs
Authorization: Bearer {APIFY_TOKEN}
Content-Type: application/json

{
  "startUrls": [{"url": "https://example.com"}],
  "maxItems": 100
}
```

### Synchronous Execution (< 5 min)
```
POST https://api.apify.com/v2/acts/{actor-id}/run-sync-get-dataset-items
```

### Check Run Status
```
GET https://api.apify.com/v2/runs/{run-id}
```

---

**Document Version:** 1.0.1
**Last Updated:** 2025-11-25
**Next Review:** Post Week 1 Implementation