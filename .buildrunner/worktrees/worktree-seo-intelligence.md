# Worktree Task: SEO Intelligence & Content Optimizer

**Feature ID:** `seo-intelligence-optimizer`
**Branch:** `feature/seo-intelligence`
**Estimated Time:** 30 hours
**Priority:** HIGH
**Phase:** 1B - Content Marketing
**Dependencies:** Campaign Generator
**Worktree Path:** `../synapse-seo`

---

## Context

Real-time SEO optimization for all content. Auto-optimize keyword density, local SEO, meta tags, and find quick wins (page 2→page 1 keywords). Uses SEMrush API for competitive keyword research.

**3 Core Components:**
1. **SEO Content Optimizer** - Real-time scoring, keyword optimization, meta tags
2. **Local SEO Dominator** - "Near me" optimization, location pages, NAP consistency
3. **Quick Win Finder** - Page 2→1 keywords, featured snippets, People Also Ask

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-seo feature/seo-intelligence
cd ../synapse-seo
npm install

# SEMrush SDK (if available) or direct API calls
npm install axios
```

Add to `.env`:
```
VITE_SEMRUSH_API_KEY=semrush_xxx
```

---

## Task Checklist

### File: `src/services/seo/content-optimizer.service.ts`

- [ ] Create SEOContentOptimizerService class
```typescript
interface SEOAnalysis {
  score: number // 0-100
  issues: SEOIssue[]
  suggestions: SEOSuggestion[]
  keywordMetrics: KeywordMetrics
  readability: ReadabilityScore
}

interface KeywordMetrics {
  primary: KeywordAnalysis
  secondary: KeywordAnalysis[]
  lsi: string[] // Latent Semantic Indexing keywords
  density: {[keyword: string]: number}
  distribution: KeywordDistribution
}

interface SEOIssue {
  severity: 'critical' | 'warning' | 'info'
  type: string
  message: string
  fix: string
}
```

- [ ] Implement `analyzeContent()` method
  - Calculate SEO score (0-100)
  - Analyze keyword density (2-3% optimal)
  - Check keyword placement (title, H1, first 100 words)
  - Verify LSI keyword usage
  - Check content length (>300 words for blog, >1000 for pillar)

- [ ] Implement `optimizeKeywords()` method
  - Suggest primary keyword placement
  - Recommend secondary keywords
  - Generate LSI keywords from SEMrush
  - Calculate optimal density per keyword
  - Suggest header structure (H1, H2, H3)

- [ ] Implement `generateMetaTags()` method
  - Auto-generate meta title (50-60 chars)
  - Auto-generate meta description (150-160 chars)
  - Include primary keyword in both
  - Generate SERP preview

- [ ] Implement `generateSchema()` method
  - Auto-generate JSON-LD schema markup
  - Article schema for blog posts
  - LocalBusiness schema for service pages
  - FAQ schema for Q&A content

- [ ] Implement `analyzeReadability()` method
  - Flesch-Kincaid reading ease score
  - Average sentence length
  - Passive voice detection
  - Transition word usage

### File: `src/services/seo/local-seo.service.ts`

- [ ] Create LocalSEOService class
```typescript
interface LocalSEOOptimization {
  localKeywords: string[]
  napConsistency: NAPAnalysis
  localSchemaMarkup: any
  gmbPosts: GMBPostSuggestion[]
  locationPages: LocationPageTemplate[]
}

interface NAPAnalysis {
  name: string
  address: string
  phone: string
  consistent: boolean
  issues: string[]
}
```

- [ ] Implement `generateLocalKeywords()` method
  - Inject city name: "{service} in {city}"
  - Inject neighborhood: "{service} {neighborhood}"
  - Generate "near me" variants
  - Create location-specific long-tail keywords

- [ ] Implement `checkNAPConsistency()` method
  - Verify Name, Address, Phone match across:
    - Website
    - Google My Business
    - Social profiles
  - Flag inconsistencies

- [ ] Implement `generateLocationPages()` method
  - Create template for each service area
  - Auto-populate with local content
  - Include local landmarks
  - Add driving directions
  - Embed Google Maps

- [ ] Implement `generateGMBPosts()` method
  - Create Google My Business post suggestions
  - Weekly posting schedule
  - Local event tie-ins (from Perplexity)
  - Service highlights
  - Promotional offers

### File: `src/services/seo/quick-win-finder.service.ts`

- [ ] Create QuickWinFinderService class
```typescript
interface QuickWin {
  keyword: string
  currentPosition: number // 11-20
  estimatedTraffic: number
  difficulty: number
  opportunity: 'high' | 'medium' | 'low'
  suggestions: string[]
}

interface FeaturedSnippetOpportunity {
  keyword: string
  currentSnippet: string
  snippetType: 'paragraph' | 'list' | 'table'
  contentSuggestion: string
}
```

- [ ] Implement `findPage2Keywords()` method
  - Use SEMrush Position Tracking API
  - Filter keywords ranking 11-20
  - Calculate traffic opportunity
  - Sort by potential impact

- [ ] Implement `analyzeFeaturedSnippets()` method
  - Find keywords with featured snippets
  - Identify snippet type
  - Generate optimized content format
  - Suggest implementation

- [ ] Implement `analyzePeopleAlsoAsk()` method
  - Extract PAA questions for target keywords
  - Generate FAQ content
  - Format for rich snippet eligibility

- [ ] Implement `findLowCompetitionKeywords()` method
  - Use SEMrush Keyword Difficulty API
  - Filter difficulty <30
  - High volume (>100 searches/month)
  - Related to business

### File: `src/services/semrush-api.service.ts`

- [ ] Create SEMrushAPIService class
```typescript
interface SEMrushKeywordData {
  keyword: string
  volume: number
  difficulty: number
  cpc: number
  competitionLevel: string
  trends: number[]
}
```

- [ ] Implement SEMrush API integrations
  - Keyword Magic Tool API (find variations)
  - Keyword Difficulty API (assess competitiveness)
  - Rankings API (track positions)
  - Topic Research API (find trending topics)
  - SEO Content Template API (get optimization guidelines)
  - Local Pack Tracker (track local rankings)

- [ ] Implement error handling and rate limiting
- [ ] Implement caching (7 days for industry keywords)

### File: `src/components/seo/SEOScoreWidget.tsx`

- [ ] Create SEOScoreWidget component
```typescript
interface SEOScoreWidgetProps {
  content: string
  targetKeyword: string
  onOptimize: (optimized: string) => void
}
```

- [ ] UI Elements:
  - Circular SEO score gauge (0-100)
  - Color-coded (red <50, yellow 50-80, green >80)
  - Issue list (critical, warnings, info)
  - Quick fix buttons
  - Keyword density visualization
  - Meta tag preview (SERP preview)

### File: `src/components/seo/KeywordOptimizer.tsx`

- [ ] Create KeywordOptimizer component
- [ ] Primary keyword input
- [ ] Secondary keyword suggestions (from SEMrush)
- [ ] LSI keyword generator
- [ ] Keyword placement heatmap
- [ ] Density calculator with recommendations

### File: `src/components/seo/LocalSEOPanel.tsx`

- [ ] Create LocalSEOPanel component
- [ ] Local keyword generator
- [ ] NAP consistency checker
- [ ] Location page builder
- [ ] GMB post scheduler
- [ ] Local schema markup generator

### File: `src/components/seo/QuickWinFinder.tsx`

- [ ] Create QuickWinFinder component
- [ ] Page 2 keyword list (sortable by opportunity)
- [ ] Featured snippet opportunities
- [ ] People Also Ask questions
- [ ] Low competition keyword suggestions
- [ ] One-click content optimization

### Database: Add tables

```sql
-- SEO keywords
CREATE TABLE seo_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  business_profile_id UUID REFERENCES business_profiles(id),
  keyword TEXT NOT NULL,
  type TEXT NOT NULL, -- primary, secondary, lsi, local
  volume INTEGER,
  difficulty INTEGER,
  current_position INTEGER,
  target_position INTEGER DEFAULT 1,
  tracked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword rankings
CREATE TABLE keyword_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID REFERENCES seo_keywords(id),
  position INTEGER NOT NULL,
  url TEXT,
  tracked_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO optimizations
CREATE TABLE seo_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  content_type TEXT NOT NULL, -- post, blog, landing_page
  content_id UUID,
  seo_score INTEGER,
  primary_keyword TEXT,
  meta_title TEXT,
  meta_description TEXT,
  schema_markup JSONB,
  optimized_at TIMESTAMPTZ DEFAULT NOW()
);

-- Local SEO pages
CREATE TABLE local_seo_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  business_profile_id UUID REFERENCES business_profiles(id),
  location TEXT NOT NULL, -- city or neighborhood
  slug TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  schema_markup JSONB,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- RLS policies
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own SEO keywords" ON seo_keywords
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own rankings" ON keyword_rankings
  FOR SELECT USING (
    keyword_id IN (SELECT id FROM seo_keywords WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own optimizations" ON seo_optimizations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own local pages" ON local_seo_pages
  FOR ALL USING (auth.uid() = user_id);
```

---

## Testing Checklist

- [ ] Analyze blog post content (SEO score 0-100)
- [ ] Optimize keyword density (test 2-3% optimal)
- [ ] Generate meta title and description
- [ ] Create JSON-LD schema markup
- [ ] Test readability scoring
- [ ] Generate local keywords (city + neighborhood)
- [ ] Check NAP consistency across sources
- [ ] Create location-specific page
- [ ] Generate GMB post suggestions
- [ ] Find page 2 keywords (positions 11-20)
- [ ] Identify featured snippet opportunities
- [ ] Extract People Also Ask questions
- [ ] Test SEMrush API integrations (all 6 endpoints)
- [ ] Verify SERP preview accuracy

---

## Integration Points

1. **Campaign Generator** - Auto-optimize all posts
2. **Blog Expander** - SEO optimize articles
3. **Landing Pages** - Auto-generate SEO metadata
4. **SEMrush API** - Keyword research and tracking
5. **OpenRouter** - Content optimization suggestions
6. **Perplexity** - Local event keywords

---

## Success Criteria

- ✅ Real-time SEO scoring (0-100) working
- ✅ Keyword density optimization functional
- ✅ Meta tags auto-generated
- ✅ Schema markup created correctly
- ✅ Local keywords generated (city, neighborhood, "near me")
- ✅ NAP consistency checker working
- ✅ Page 2 keywords identified
- ✅ Featured snippet opportunities found
- ✅ SEMrush API integration complete (6 endpoints)
- ✅ All content types optimized (posts, blogs, landing pages)

---

**Estimated Completion:** 30 hours (4-5 days)
