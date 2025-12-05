# Research: Mining Reviews for Competitive Intel in SaaS

> **Last Updated:** 2025-12-04
> **Research Sessions:** 1

## TL;DR

- **88% of B2B buyers rely on reviews** before purchasing - reviews are THE source for customer voice
- Look for **switching signals** ("we moved from", "replaced X with"), **frustration keywords** ("hate", "frustrating", "wish it had"), and **unmet needs** ("lacks", "missing")
- G2/Capterra structure reviews into "What do you like?" / "What do you dislike?" / "What problems are you solving?" - mine ALL three sections
- **Perplexity is best for synthesis**, but direct G2 scraping (via OutScraper or Serper site: searches) gets actual quotes
- The money is in **competitor negative reviews** - these reveal gaps you can fill

---

## Problem Statement

Voice of Customer (VoC) features need actual customer quotes and pain points from reviews, not vendor marketing content. Current implementation returns articles and company descriptions instead of real customer language. This research identifies what signals to look for and how to extract them effectively.

---

## What to Look For: Key Signals

### 1. Switching Signals (Highest Value)
- "We switched from X to Y"
- "Replaced our old solution"
- "After using X for years, we moved to"
- "Before this, we were using"

**Why:** These indicate purchase triggers and competitive dynamics.

### 2. Frustration Keywords (Pain Points)
- "I hate that..."
- "Frustrating when..."
- "Wish it had..."
- "Would be nice if..."
- "Confusing", "complicated", "hard to use"
- "Too slow", "takes forever"
- "Poor support", "no response"

### 3. Unmet Needs (Opportunity Gaps)
- "Lacks", "missing", "doesn't have"
- "We had to work around"
- "Needs improvement in"
- "Not ideal for"
- "Would love to see"

### 4. Positive Differentiators (What Works)
- "Finally a tool that..."
- "Best part is..."
- "Saved us X hours/dollars"
- "Unlike competitors..."

### 5. Role-Specific Pain Points
- **IT Admins:** SSO integration gaps, compliance anxieties, bulk onboarding issues
- **Power Users:** Missing shortcuts, slow dashboards, feature limitations
- **Buyers/Executives:** ROI concerns, pricing frustrations, contract terms
- **Occasional Users:** Navigation confusion, steep learning curve

---

## G2/Capterra Review Structure

Both platforms segment feedback into three categories - mine ALL of them:

| Section | What It Reveals | Content Value |
|---------|-----------------|---------------|
| "What do you like best?" | Valued features, differentiators | Testimonial material |
| "What do you dislike?" | Competitive weaknesses, gaps | Positioning opportunities |
| "What problems are you solving?" | Use cases, desired outcomes | Content topics, messaging |

### G2 Additional Data Points
- Star ratings (1-2 stars = richest pain points)
- Reviewer role/title
- Company size
- Implementation time
- Likelihood to recommend

---

## Pain Point Categories

### 1. Functional Pain Points
- Product doesn't meet core needs
- Missing features competitors have
- Technical limitations
- Integration problems

### 2. Process Pain Points
- Workflow inefficiencies
- Slow response times
- Complex onboarding
- Poor documentation

### 3. Financial Pain Points
- Pricing concerns
- Hidden costs
- Perceived value gaps
- Contract lock-in

### 4. Support Pain Points
- Slow support response
- Unhelpful assistance
- Limited channels
- No self-service options

---

## Extraction Methods

### Method 1: Perplexity with Explicit Instructions

**Prompt Template:**
```
Find and quote 5-8 REAL customer reviews about [SOFTWARE CATEGORY] from G2.com, Capterra, or TrustRadius.

Return:
1. The exact quote (in quotation marks)
2. Source platform and product
3. Reviewer role if available
4. Whether positive or negative

Focus on:
- Complaints and frustrations (most valuable)
- Switching mentions ("we moved from...")
- Unmet needs ("wish it had...")

DO NOT summarize or paraphrase. Return actual customer words.
```

### Method 2: Serper Site: Searches with Review Language

**Query Patterns:**
```
{category} ("pros:" OR "cons:" OR "I love" OR "I hate") site:g2.com/products
{category} ("what I like" OR "what I dislike") site:trustradius.com/products
{category} ("we switched" OR "replaced" OR "moved from") site:capterra.com/reviews
```

### Method 3: Direct API Scraping

**OutScraper G2 Reviews Scraper:**
- Extracts: review title, text, rating, reviewer name, date, sentiment
- Export formats: CSV, Excel, JSON
- Best for bulk extraction

**Apify G2 Scraper:**
- `g2-scraper/g2-users-reviews-products`
- Returns structured review data

### Method 4: Competitor FAQ Pages

Check competitor FAQ sections for:
- Who they're targeting (ideal prospects)
- What "user pain points" they address
- Language they use to describe problems

---

## Search Queries That Work

### For G2
```
"AI sales" ("pros:" OR "cons:") site:g2.com/products
"conversational AI" "I hate" site:g2.com
"sales automation" reviews "switched from" site:g2.com
```

### For Capterra
```
"AI agent" reviews site:capterra.com/reviews
"sales software" "we use" site:capterra.com
```

### For TrustRadius
```
"AI platform" ("what I like" OR "best for") site:trustradius.com/products
```

### For Reddit (Professional Subreddits)
```
{category} site:reddit.com/r/sales
{category} site:reddit.com/r/SaaS
{category} "anyone using" site:reddit.com
```

---

## Anti-Patterns (What NOT To Do)

1. **Don't use full UVP statements as queries**
   - Wrong: `"purpose-built agent management convert 15%+" site:g2.com`
   - Right: `"AI sales agent" reviews site:g2.com`

2. **Don't just search brand names**
   - This returns company marketing pages, not reviews
   - Search for category + review language patterns

3. **Don't rely on Perplexity alone**
   - It summarizes and paraphrases
   - Use it for synthesis, not quote extraction

4. **Don't ignore negative reviews**
   - 1-2 star reviews have the richest pain point language
   - These are content GOLD

5. **Don't miss the "Cons" section**
   - Many scrapers grab "Pros" but miss "Cons"
   - Both sections are equally valuable

---

## Implementation for Synapse

### Recommended API Priority for VoC (national-saas)

1. **apify-g2** - Serper with review language patterns
2. **apify-capterra** - Same approach
3. **apify-trustradius** - Same approach
4. **perplexity-reviews** - Explicit quote extraction prompt
5. **reddit-professional** - r/sales, r/SaaS, r/startups

### Perplexity Prompt for VoC

```javascript
{
  role: 'system',
  content: `Find and return ONLY direct customer quotes from G2, Capterra, TrustRadius, or Reddit.

Return 5-8 actual quotes with:
- Exact quote in quotation marks
- Source platform
- Reviewer role if available
- Positive/negative indicator

Focus on complaints, frustrations, switching mentions.
DO NOT summarize. Return actual customer words.`
}
```

### Serper Query Transform

```javascript
// For G2
params: {
  q: `${keywords} ("pros:" OR "cons:" OR "I hate" OR "we switched") site:g2.com/products`,
  num: 20
}
```

---

## Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| Reviews with quotes | 60%+ of VoC results | Actual customer voice |
| Pain point coverage | All 4 categories | Comprehensive insights |
| Source diversity | 3+ platforms | Avoid bias |
| Recency | <12 months | Current relevance |

---

## Sources

### [Official] Platform Documentation
- [G2 - How Reviews Work](https://www.g2.com/)
- [Capterra - Review Guidelines](https://www.capterra.com/)
- [TrustRadius - Review Structure](https://www.trustradius.com/)

### [Strategy] B2B SaaS Review Mining
- [How to Leverage SaaS Customer Review Sites](https://www.poweredbysearch.com/blog/how-to-leverage-saas-customer-review-sites/)
- [Capterra vs G2 Comparison 2025](https://www.reviewflowz.com/blog/capterra-vs-g2)
- [SaaS Review Platforms Compared](https://saasreviews.tech/articles/saas-review-platforms-a-comparative-analysis-for-saas-providers)

### [Pain Points] Analysis Frameworks
- [Customer Insights to Surface Pain Points](https://www.productboard.com/blog/how-to-analyze-customer-insights-to-surface-pain-points/)
- [Customer Pain Points Types & Solutions](https://www.altexsoft.com/blog/customer-pain-points/)
- [How to Find Customer Pain Points](https://monkeylearn.com/blog/customer-pain-points/)

### [Extraction] Tools & APIs
- [OutScraper G2 Reviews Scraper](https://outscraper.com/g2-reviews-scraper/)
- [ScrapingBee G2 API](https://www.scrapingbee.com/scrapers/g2-api/)
- [How to Scrape G2 Reviews](https://www.scraperapi.com/blog/how-to-scrape-g2-reviews-using-python/)

### [VoC] Voice of Customer Methodologies
- [VoC Framework for B2B SaaS](https://surveysparrow.com/blog/voice-of-customer-framework/)
- [VoC Best Practices with Segmentation](https://www.specific.app/blog/voice-of-customer-best-practices-for-b2b-saas-voc-how-segmentation-unlocks-actionable-customer-feedback)
- [8 VoC Methodologies for B2B](https://customergauge.com/blog/voice-of-customer-methodologies)

### [Perplexity] AI Research Techniques
- [Perplexity for Customer Research](https://www.jcdigital.co/blog/how-to-use-perplexity-for-customer-research)
- [Perplexity for Business Research](https://thecrunch.io/perplexity-ai/)
- [Perplexity Deep Research](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research)

### [Keywords] SaaS Keyword Research via Reviews
- [SaaS Keyword Research - 11 Methods](https://www.rocktherankings.com/saas-keyword-research/)
- [Review Mining for Keywords](https://www.poweredbysearch.com/blog/saas-keyword-research/)
- [Competitor Analysis Red Flags](https://www.aqute.com/blog/red-flags-to-watch-for-during-saas-competitive-analysis)

---

## Research Log

### Session 1 - 2025-12-04
- **Searched:** G2/Capterra mining techniques, pain point extraction, Perplexity for customer research, review mining keywords
- **Found:** 88% of B2B buyers use reviews; key is searching for review LANGUAGE not brand names; G2/Capterra structure reviews into like/dislike/problems sections
- **Key Insight:** Current implementation fails because it searches with UVP statements instead of category + review language patterns. Fix is simple query restructuring + explicit Perplexity prompts for quote extraction.
