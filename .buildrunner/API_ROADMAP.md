# Synapse API Roadmap

**Created**: 2025-11-30
**Purpose**: Prioritized API integration plan ordered by impact, weighted by integration overhead

---

## Current State: 15 Active APIs

| Tier | API | Status | Monthly Cost |
|------|-----|--------|--------------|
| Voice | OutScraper | ✅ Active | ~$50 |
| Voice | Reddit (Apify) | ✅ Active | ~$30 |
| Voice | Apify Social | ✅ Active | ~$50 |
| Voice | G2/Trustpilot (Apify) | ✅ Active | Included |
| Trends | YouTube | ✅ Active | Free |
| Trends | Google Trends | ✅ Active | Free (via Serper) |
| Trends | News API | ✅ Active | ~$50 |
| Trends | HackerNews | ✅ Active | Free |
| Competitive | Serper | ✅ Active | ~$50 |
| Competitive | SEMrush | ✅ Active | ~$120 |
| Competitive | LinkedIn (Perplexity) | ✅ Active | Included |
| Context | Weather | ✅ Active | Free |
| Context | Perplexity | ✅ Active | ~$20 |
| Context | Whisper | ✅ Active | Pay per use |
| AI | OpenAI (embeddings + generation) | ✅ Active | ~$100 |

**Current Monthly API Spend**: ~$470

---

## Scoring Methodology

Each API is scored on:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Impact** | 40% | How much it improves content quality/uniqueness |
| **Correlation Value** | 30% | How well it validates/enhances other signals |
| **Integration Effort** | 20% | Time to implement (inverse score - easier = higher) |
| **Cost Efficiency** | 10% | Value per dollar |

**Score Formula**: `(Impact × 0.4) + (Correlation × 0.3) + (Ease × 0.2) + (Cost × 0.1)`

---

## Phase 1: Immediate (With Synapse 2.0 Launch)

### BuzzSumo ⭐ PRIORITY
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 9/10 | Proven content performance data — what actually works |
| Correlation | 9/10 | Validates pain points, informs format, provides benchmarks |
| Ease | 7/10 | Clean REST API, straightforward integration |
| Cost | 6/10 | $500/mo — premium but high ROI |
| **TOTAL** | **8.3/10** | |

**Cost**: $500/month
**Integration Time**: 2-3 days
**What It Adds**:
- Top-performing headlines by topic/industry
- Share counts by platform (LinkedIn, Twitter, Facebook)
- Content format analysis (lists vs how-tos vs videos)
- Backlink magnet identification
- Competitor content performance

**Correlation Enhancement**:
```
Pain point (Reddit) + Topic trending (Trends) + Similar content got 5K shares (BuzzSumo)
= High-confidence, performance-validated opportunity
```

**Files to Create**:
- `src/services/intelligence/buzzsumo-api.ts`
- Add normalizer to `api-normalizer.service.ts`

---

## Phase 2: Growth Stage ($5K-10K MRR)

### Exploding Topics
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 8/10 | 2-4 week early trend detection |
| Correlation | 7/10 | Validates Google Trends, provides lead time |
| Ease | 8/10 | Simple API |
| Cost | 7/10 | $250/mo — reasonable |
| **TOTAL** | **7.6/10** | |

**Cost**: $250/month
**Integration Time**: 1-2 days
**What It Adds**:
- Rising topics before they hit mainstream
- Category-specific trend tracking
- Growth velocity metrics

**Use Case**: "This topic is exploding but no one has content yet → First mover advantage"

---

### Clearbit (Enrichment API)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 7/10 | B2B personalization — company size, industry, tech stack |
| Correlation | 6/10 | Enables segment-specific content |
| Ease | 9/10 | Excellent docs, simple integration |
| Cost | 9/10 | Free tier available, paid starts ~$99 |
| **TOTAL** | **7.3/10** | |

**Cost**: Free tier / $99/month
**Integration Time**: 1 day
**What It Adds**:
- Company firmographics (size, revenue, industry)
- Tech stack detection
- Decision-maker identification

**Use Case**: Auto-detect if user is B2B SaaS vs local service → adjust content strategy

---

### Product Hunt API
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 6/10 | Early adopter validation, startup trends |
| Correlation | 7/10 | Cross-reference with HackerNews for tech validation |
| Ease | 9/10 | Free, GraphQL API |
| Cost | 10/10 | Free |
| **TOTAL** | **7.2/10** | |

**Cost**: Free
**Integration Time**: 1 day
**What It Adds**:
- New product launches in categories
- Upvote/comment sentiment
- Maker insights

**Use Case**: "New competitor launched → Content opportunity to address their gaps"

---

## Phase 3: Scale Stage ($15K-30K MRR)

### SparkToro
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 8/10 | Audience intelligence — where they hang out |
| Correlation | 6/10 | Informs distribution, not creation |
| Ease | 7/10 | Good API |
| Cost | 5/10 | $500/mo — premium |
| **TOTAL** | **6.9/10** | |

**Cost**: $500/month
**Integration Time**: 2-3 days
**What It Adds**:
- Audience website affinities
- Podcast/YouTube channels they follow
- Social accounts they engage with
- Hashtags they use

**Use Case**: "Your audience follows X influencers → Reference their ideas in content"

---

### Ahrefs API
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 7/10 | Deep SEO competitive intelligence |
| Correlation | 7/10 | Backlink data validates authority plays |
| Ease | 6/10 | Complex API, rate limits |
| Cost | 5/10 | ~$400/mo |
| **TOTAL** | **6.6/10** | |

**Cost**: ~$400/month
**Integration Time**: 3-4 days
**What It Adds**:
- Backlink profiles
- Content gap analysis (keywords competitors rank for)
- Referring domain authority
- Organic traffic estimates

**Use Case**: "Competitor ranks for X keywords you don't → Content gap opportunities"

---

### Hunter.io
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 5/10 | Decision-maker identification |
| Correlation | 5/10 | Helps with B2B persona targeting |
| Ease | 9/10 | Simple API |
| Cost | 8/10 | Free tier / $49 |
| **TOTAL** | **6.0/10** | |

**Cost**: Free tier / $49/month
**Integration Time**: 0.5 days
**What It Adds**:
- Email patterns for companies
- Decision-maker names/titles
- Company email verification

**Use Case**: Enrich B2B persona data for content targeting

---

## Phase 4: Enterprise Stage ($50K+ MRR)

### SimilarWeb API
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 6/10 | Traffic and referrer intelligence |
| Correlation | 6/10 | Validates competitor strength |
| Ease | 6/10 | Complex API |
| Cost | 4/10 | ~$500/mo |
| **TOTAL** | **5.7/10** | |

**Cost**: ~$500/month
**Integration Time**: 3-4 days
**What It Adds**:
- Competitor traffic estimates
- Traffic sources breakdown
- Top referrers
- Audience overlap

---

### Crunchbase API
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 5/10 | Funding/growth signals |
| Correlation | 5/10 | Timing signals for B2B |
| Ease | 7/10 | Good REST API |
| Cost | 6/10 | ~$300/mo |
| **TOTAL** | **5.4/10** | |

**Cost**: ~$300/month
**Integration Time**: 2 days
**What It Adds**:
- Recent funding rounds
- Company growth signals
- Acquisition news
- Leadership changes

**Use Case**: "Competitor just raised Series B → They'll be aggressive, content opportunity"

---

### BuiltWith API
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 5/10 | Tech stack detection |
| Correlation | 5/10 | SaaS targeting |
| Ease | 8/10 | Simple API |
| Cost | 5/10 | ~$295/mo |
| **TOTAL** | **5.3/10** | |

**Cost**: ~$295/month (has free tier)
**Integration Time**: 1 day
**What It Adds**:
- Technologies used by prospects
- Market share data
- Technology trends

---

## Phase 5: Future Consideration

### Twitter/X API
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 6/10 | Real-time sentiment |
| Correlation | 6/10 | Validates trends |
| Ease | 4/10 | API restrictions, expensive |
| Cost | 3/10 | $100-5000/mo depending on tier |
| **TOTAL** | **5.1/10** | |

**Status**: Wait for API pricing stabilization

---

### TikTok Research API
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 7/10 | Video trend detection |
| Correlation | 6/10 | B2C content validation |
| Ease | 3/10 | Limited access, approval required |
| Cost | 5/10 | Unknown |
| **TOTAL** | **5.4/10** | |

**Status**: Apply for research API access, evaluate when available

---

### Podcast APIs (Listen Notes, etc.)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 5/10 | Audio content trends |
| Correlation | 5/10 | Topic validation |
| Ease | 7/10 | Available |
| Cost | 7/10 | ~$100/mo |
| **TOTAL** | **5.4/10** | |

**Status**: Consider when adding audio content support

---

## Free APIs to Maximize Now

These are free and should be fully utilized in Synapse 2.0:

| API | Current Use | Maximize By |
|-----|-------------|-------------|
| **HackerNews** | Basic trend detection | Mine Ask HN for problems, Show HN for validation, engagement decay tracking |
| **Google Trends** | Via Serper | Direct integration for related queries, geo breakdown, seasonal patterns |
| **Product Hunt** | Not integrated | Add for startup/tech trend detection |
| **Wikipedia** | Not integrated | Entity context, topic authority signals |
| **OpenLibrary** | Not integrated | Book topic trends, thought leadership themes |

---

## Integration Priority Queue

### Immediate (With 2.0 Launch)
1. ✅ **BuzzSumo** — $500/mo — Performance validation

### Quarter 1 Post-Launch
2. **Exploding Topics** — $250/mo — Early trend detection
3. **Clearbit** — Free/$99 — B2B enrichment
4. **Product Hunt** — Free — Startup signals

### Quarter 2
5. **SparkToro** — $500/mo — Audience intelligence
6. **Hunter.io** — Free/$49 — Decision-maker data

### Quarter 3+
7. **Ahrefs** — $400/mo — Deep SEO intelligence
8. **SimilarWeb** — $500/mo — Traffic intelligence
9. **Crunchbase** — $300/mo — Funding signals

---

## Budget Projection

| Stage | APIs Added | Monthly Cost | Cumulative |
|-------|------------|--------------|------------|
| Current | 15 APIs | $470 | $470 |
| Phase 1 | +BuzzSumo | +$500 | $970 |
| Phase 2 | +Exploding, Clearbit, Product Hunt | +$350 | $1,320 |
| Phase 3 | +SparkToro, Ahrefs, Hunter | +$950 | $2,270 |
| Phase 4 | +SimilarWeb, Crunchbase, BuiltWith | +$1,100 | $3,370 |

---

## API Integration Architecture

All new APIs should follow this pattern for easy add/remove:

```typescript
interface ContentAPI {
  id: string;
  name: string;
  tier: 'voice' | 'trends' | 'competitive' | 'context' | 'performance';

  // Execution
  fetch(params: APIParams): Promise<RawSignal[]>;
  normalize(raw: any[]): RawSignal[];

  // Configuration
  priority: number;
  segmentWeights: Record<Segment, number>;
  costTier: 'free' | 'low' | 'medium' | 'high';

  // Correlation
  signalTypes: string[];
  correlatesWith: string[];  // Other API IDs this correlates well with
}
```

**To add a new API**:
1. Create service file implementing `ContentAPI`
2. Register in API Registry
3. Add normalizer function
4. Define correlation weights
5. Done — Intelligence Router picks it up automatically

---

## Success Metrics Per API

| API | Key Metric | Target |
|-----|------------|--------|
| BuzzSumo | % of opportunities with performance validation | >60% |
| Exploding Topics | Early trend detection lead time | 2-4 weeks |
| Clearbit | B2B segment detection accuracy | >90% |
| SparkToro | Distribution recommendations acted on | >30% |
| Ahrefs | Content gap opportunities surfaced | 5+ per industry |

---

*Document Version: 1.0*
*Created: 2025-11-30*
*Status: ACTIVE ROADMAP*
