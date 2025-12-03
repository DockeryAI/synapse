# Synapse V6 - Voice of Customer Tab Enhancement Plan

**Created**: 2025-12-03
**Status**: Planning Phase
**Goal**: Restore V6 VoC tab to 100% build plan compliance + enhance with SEMrush/BuzzSumo intelligence

---

## **Current VoC Tab Issues**

### **V6 Build Plan Compliance Gaps**
- **Missing UVP Context Injection**: VoC queries not using target customer profiles
- **Missing V1 Connection Engine**: No embeddings or cross-domain connections
- **Missing Customer Profile Integration**: UVP customer data not flowing to VoC queries
- **Limited Data Sources**: Using basic Reddit/G2/Capterra without full V1 intelligence

### **Data Quality Issues**
- Reddit returning empty arrays (actor configuration)
- G2/Capterra empty responses (API integration issues)
- Twitter showing `{noResults: true}` (fixed but needs verification)
- No real customer language mining from search data

---

## **Phase 1: V6 Build Plan Compliance (3-4 days)**

### **Day 1: UVP Context Injection**
**Goal**: Every VoC query includes UVP customer context

**Actions**:
- **Target Customer Integration**: Use UVP customer profiles to customize VoC queries
- **Pain Point Context**: Inject customer pain points from UVP into search terms
- **Industry Context**: Use UVP business model to select relevant VoC sources
- **Geographic Context**: Apply UVP location data to local VoC sources

**Success Criteria**: VoC queries shift from generic ("insurance broker") to specific ("AI platform for insurance brokers helping streamline client onboarding")

### **Day 2: V1 Connection Engine Integration**
**Goal**: Add embeddings and cross-domain connection detection

**Actions**:
- **OpenAI Embeddings**: Generate 1536-dim vectors for all VoC insights
- **Cosine Similarity**: Find connections between VoC insights ≥0.65 threshold
- **Cross-Domain Signals**: Connect VoC data with weather, trends, local events
- **Three-Way Connections**: Bonus scoring for VoC + trends + timing combinations

**Success Criteria**: VoC tab finds unexpected connections like "customer complaints spike during quarterly reporting seasons"

### **Day 3: Customer Profile Flow**
**Goal**: UVP customer profiles directly inform VoC data collection

**Actions**:
- **Customer Persona Mapping**: Map UVP customer types to VoC source priorities
- **Language Adaptation**: Use customer description language in VoC queries
- **Journey Stage Context**: Target VoC sources based on customer decision journey
- **Industry-Specific Sources**: B2B vs B2C customer types get different VoC APIs

**Success Criteria**: VoC insights directly relate to UVP customer profiles and pain points

### **Day 4: Data Source Enhancement**
**Goal**: Fix broken VoC APIs and add missing V1 intelligence

**Actions**:
- **Reddit Actor Fix**: Verify perchance/reddit-scraper input format and test
- **G2/Capterra Debug**: Fix empty response issues and test data extraction
- **Twitter Integration**: Verify noResults filtering works properly
- **Customer Review Mining**: Enhance Apify integrations for review sentiment

**Success Criteria**: All VoC APIs return real data, zero empty responses

---

## **Phase 2: SEMrush VoC Enhancement (2 days)**

### **Day 1: Search Intent Intelligence**
**Goal**: Use SEMrush to find what customers actually search for

**Actions**:
- **Keyword Research Integration**: SEMrush keyword data reveals customer language
- **Search Intent Analysis**: "navigational vs informational vs transactional" customer intent
- **Question Mining**: "People also ask" data shows real customer questions
- **Geographic VoC**: Local search variations by region/city

**VoC Enhancement**:
- **Real Customer Language**: Replace generic queries with actual search terms
- **Intent-Based Segmentation**: Group VoC insights by customer intent stage
- **Pain Point Keywords**: Find search terms revealing customer problems
- **Solution Research Patterns**: How customers search for solutions like yours

### **Day 2: Competitive Customer Intelligence**
**Goal**: Learn from competitor customer research

**Actions**:
- **Competitor Keyword Gaps**: What customers search for competitors but not you
- **Customer Journey Mapping**: Search progression from problem → solution → vendor
- **Seasonal Customer Patterns**: When customers research your solution category
- **Local vs National Customer Needs**: Geographic variations in customer search behavior

**VoC Enhancement**:
- **Competitive VoC**: What customers say about competitors in search
- **Gap Opportunities**: Customer needs competitors aren't addressing
- **Timing Intelligence**: When customers are most actively researching
- **Geographic Insights**: Regional customer language and pain point variations

---

## **Phase 3: BuzzSumo VoC Enhancement (2 days)**

### **Day 1: Social Conversation Mining**
**Goal**: Find real customer discussions about problems/solutions

**Actions**:
- **Social Listening Setup**: Monitor brand/industry keywords across social platforms
- **Problem Discussion Mining**: Find viral posts about customer pain points
- **Solution Research Conversations**: Track social discussions about solutions
- **Influencer Customer Insights**: What customer problems influencers discuss most

**VoC Enhancement**:
- **Viral Pain Points**: Customer complaints that get high social engagement
- **Social Proof Patterns**: What customer success stories spread virally
- **Community Intelligence**: How customers discuss problems in communities
- **Trending Customer Concerns**: Emerging customer issues gaining momentum

### **Day 2: Content Engagement Analysis**
**Goal**: Understand what customer content resonates most

**Actions**:
- **Customer Content Performance**: What content about customer problems performs best
- **Engagement Pattern Analysis**: When/how customers engage with problem/solution content
- **Share Trigger Analysis**: What makes customers share pain point content
- **Viral Customer Stories**: Customer success/failure stories that break through

**VoC Enhancement**:
- **Content-Driven VoC**: Customer insights from high-performing content
- **Engagement Psychology**: Why certain customer problems resonate virally
- **Timing Optimization**: Best times for customer problem discussions
- **Format Intelligence**: Content formats that drive customer engagement

---

## **Phase 4: V1 Cross-Domain Connections (1-2 days)**

### **Day 1: VoC Connection Discovery**
**Goal**: Find unexpected connections between VoC and other data sources

**Actions**:
- **VoC + Weather Connections**: Customer behavior changes with weather/seasons
- **VoC + Local Events**: How events impact customer needs/timing
- **VoC + Industry Trends**: Customer discussions correlate with industry shifts
- **VoC + Search Trends**: Social customer conversations vs search behavior

**Connection Types**:
- **Seasonal Customer Patterns**: "HVAC complaints spike before cold snaps"
- **Event-Driven Needs**: "Security concerns rise during conference seasons"
- **Trend-Customer Correlation**: "Remote work discussions predict software needs"
- **Cross-Platform Insights**: "Reddit complaints predict search volume spikes"

### **Day 2: Enhanced Insight Generation**
**Goal**: Transform connections into actionable customer intelligence

**Actions**:
- **Psychology Integration**: Apply V1's 9 psychology principles to VoC insights
- **Cost Equivalence**: Frame customer problems in behavioral economics terms
- **Contrarian Angles**: Find customer insights competitors miss
- **Breakthrough Scoring**: Rate VoC insights by connection unexpectedness

**Output Enhancement**:
- **Connected VoC Insights**: "Customer anxiety about X peaks during Y (weather/event)"
- **Psychology-Driven**: VoC insights use curiosity gaps, loss aversion, etc.
- **Behavioral Economics**: Customer problems framed in cost equivalence terms
- **Competitive Advantage**: VoC insights competitors can't find

---

## **Phase 5: Integration Testing (1 day)**

### **VoC Tab Validation**
- **UVP Context**: Verify customer profiles flow into VoC queries
- **SEMrush Integration**: Test search intent and keyword intelligence
- **BuzzSumo Integration**: Verify social conversation mining
- **Connection Engine**: Test cross-domain VoC connections
- **Data Quality**: All APIs return real customer insights

### **Success Metrics**
- ✅ **90%+ VoC relevance** to UVP customer profiles
- ✅ **Zero empty API responses** (Reddit, G2, Capterra working)
- ✅ **5+ cross-domain connections** found per analysis
- ✅ **Real customer language** in insights (not generic terms)
- ✅ **Search + social intelligence** integrated
- ✅ **Sub-10s generation** time maintained

---

## **Timeline: 8-10 days total**

**Critical Path**:
- Phase 1 (V6 compliance) must complete before Phase 4 (connections)
- Phases 2-3 (SEMrush/BuzzSumo) can run parallel after Phase 1 Day 1
- Phase 5 requires all phases complete

**Key Deliverables**:
1. **V6 Build Plan Compliance**: UVP context, customer profiles, V1 connections
2. **Enhanced VoC Intelligence**: SEMrush search data + BuzzSumo social data
3. **Cross-Domain Connections**: VoC insights connected to weather, events, trends
4. **Real Customer Language**: Actual search terms and social conversations
5. **Breakthrough VoC Insights**: Unexpected customer intelligence competitors miss

**Risk Mitigation**:
- Fix broken APIs first (Reddit, G2, Capterra)
- Test each enhancement incrementally
- Maintain existing VoC functionality during upgrades

The enhanced VoC tab will deliver true customer intelligence using V1's connection engine with modern data sources (SEMrush + BuzzSumo) while maintaining full V6 build plan compliance.