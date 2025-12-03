# V6 Competitive Intelligence & Multi-Tab Enhancement Plan

**Created**: 2025-12-03
**Status**: Planning Phase
**Goal**: Integrate V5 competitive intelligence with V1 connection mechanics and expand SEMrush/BuzzSumo across all tabs

---

## **Phase 1: V5 Competitive Core Port (3-4 days)**

**Goal**: Restore V5's full competitive intelligence to V6

### **Day 1-2: Core Service Migration**
- Port `competitive-intelligence.service.ts` from V5 → V6 with V1 query strategy
- Migrate CompetitorProfile interfaces and scoring logic
- Update V6 API orchestrator to call competitive service properly

### **Day 3: Integration Testing**
- Test Serper competitor discovery pipeline
- Verify SEMrush metrics integration (traffic, keywords, authority)
- Test Apify review scraping for competitor insights

### **Day 4: V6 Tab Integration**
- Connect competitive service to V6 tab data adapter
- Ensure proper insight formatting for V6 UI
- Add caching layer (24hr refresh like V5)

---

## **Phase 2: SEMrush Cross-Tab Integration (2-3 days)**

### **Voice of Customer Tab Enhancement**
- **Search Intent Analysis**: Use SEMrush keyword data to find what customers actually search for
- **Customer Language Mining**: Extract real search queries showing pain points/desires
- **Geographic VoC**: Local search variations revealing regional customer needs

### **Trends Tab Enhancement**
- **Trending Keywords**: SEMrush rising search terms in your industry
- **Seasonal Patterns**: Historical search data showing timing opportunities
- **Competitive Trend Gaps**: What's trending for competitors but not being searched for your brand

### **Search Tab Enhancement**
- **Keyword Opportunity Matrix**: High-volume, low-competition keywords
- **Search Intent Mapping**: Navigate, research, purchase intent classification
- **Related Query Expansion**: "People also search for" intelligence

---

## **Phase 3: BuzzSumo Cross-Tab Integration (2-3 days)**

### **Voice of Customer Tab Enhancement**
- **Social Conversations**: Real customer discussions about problems/solutions
- **Viral Pain Points**: What customer complaints get most social engagement
- **Influencer Customer Insights**: What customer problems influencers discuss most

### **Community Tab Enhancement**
- **Content Engagement Patterns**: What topics drive highest community engagement
- **Viral Community Triggers**: Content formats that break through in communities
- **Trending Community Discussions**: Emerging topics gaining momentum

### **Trends Tab Enhancement**
- **Viral Content Analysis**: What content formats/angles are trending in your space
- **Content Velocity Tracking**: How fast trends spread and peak
- **Influencer Trend Amplification**: Who's driving trending conversations

---

## **Phase 4: V1 Connection Engine (2-3 days)**

**Goal**: Add V1's connection-finding mechanics to competitive data

### **Day 1: Connection Hint Generator**
- Implement OpenAI embeddings for competitor data points
- Add cosine similarity scoring (≥0.65 threshold)
- Cross-domain connection detection (competitor + weather/trends)

### **Day 2: Psychology Engines**
- Port Cost Equivalence Calculator for competitor pricing
- Add Contrarian Angle Detector for positioning opportunities
- Integrate with existing V6 content generation

### **Cross-Domain Connection Detection**
- **SEMrush + Weather**: "Search spike for 'emergency plumbing' during cold snaps"
- **BuzzSumo + Local Events**: "Content about networking trends during conference season"
- **SEMrush + BuzzSumo**: "High search volume topic with low social engagement = content opportunity"

### **Enhanced Insight Types**
- **Search-Social Gap**: High search volume, low social buzz = content opportunity
- **Viral-Search Mismatch**: Trending socially but not searched = awareness gap
- **Geographic-Content Patterns**: Local search needs + viral content formats

---

## **Phase 5: Multi-Tab Testing (1-2 days)**

**Goal**: Ensure V1-quality competitive insights across all business types

### **Tab-Specific Validation**
- **VoC**: Verify search intent + social conversation integration quality
- **Community**: Test content engagement + discussion trend accuracy
- **Trends**: Validate search trending + viral content correlation
- **Competitive**: Ensure enhanced data doesn't break core functionality

### **Cross-Industry Testing**
- Test with B2B SaaS, local service, e-commerce profiles
- Verify connection quality and relevance per industry
- Tune data source priorities by business type

### **Performance & Polish**
- Optimize API call patterns and caching
- Ensure sub-10s competitive insight generation
- Final integration testing with content generation

---

## **Timeline Summary: 10-14 days**

**Critical Path Dependencies:**
- Phase 1 must complete before Phase 4 (need base competitive data)
- Phases 2-3 can run parallel after Phase 1
- Phase 5 requires Phases 1-4 completion

**Multi-Tab Enhancement Breakdown:**
- **SEMrush integration**: VoC (search intent), Trends (keyword patterns), Search (opportunities)
- **BuzzSumo integration**: VoC (social conversations), Community (engagement), Trends (viral content)
- **Cross-tab connections**: Weather + Search spikes, Events + Content trends, Social + Search gaps

**Risk Mitigation:**
- Start with V5 port (proven working code)
- Test each enhancement incrementally
- Maintain V5 fallback during migration

**Success Metrics:**
- Competitive tab matches V5 functionality
- Each tab shows 2+ data sources working together
- Connection Hint Generator finds 3+ cross-domain opportunities per analysis
- Connection Hint Generator finds cross-tab opportunities (Search spike + Social buzz)
- All tabs maintain sub-10s generation with enhanced data
- Sub-10s insight generation maintained

**Key Deliverable**: Every tab leverages both SEMrush AND BuzzSumo data, not just competitive tab.

---

## **V1 Enhancement Layer Details**

### **SEMrush + BuzzSumo Enrichment for V5 Competitive**

#### **SEMrush Adds:**
- **Keyword Gap Analysis**: What competitors rank for that you don't
- **Ad Intelligence**: Competitor PPC campaigns, ad copy, landing pages
- **Backlink Opportunities**: Who links to competitors but not you
- **Traffic Trends**: Competitor growth/decline patterns

#### **BuzzSumo Adds:**
- **Content Performance**: What competitor content gets most shares/engagement
- **Viral Triggers**: Why certain competitor posts break through
- **Influencer Network**: Who amplifies competitor content
- **Content Gap Analysis**: Topics competitors aren't covering

---

## **V6 Vision Alignment Check**

✅ **Focuses on connections** (not emotions like V5)
✅ **Uses V1 mechanics** (embeddings, cost equivalence, contrarian angles)
✅ **Cross-domain signals** (SEMrush + BuzzSumo = search + social intelligence)
✅ **Industry-agnostic** (works for all 6 business categories)
✅ **Reuses working V5 code** (minimal rebuild, maximum leverage)

The approach transforms V5's solid competitive foundation into V1's connection-based intelligence system while expanding SEMrush and BuzzSumo intelligence across all tabs for comprehensive market intelligence.