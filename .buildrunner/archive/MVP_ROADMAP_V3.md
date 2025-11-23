# MVP Roadmap V3: Video-First Campaign Intelligence

**Updated:** Based on 2025 SMB best practices research
**Focus:** Shorter, video-first, mobile-optimized, social-commerce-ready campaigns

---

## Core Pivot: What Changed

### Research Findings (2025 SMB Social Media):
- ✅ 84% of SMBs use Facebook (not dying - still essential)
- ✅ Video-first content dominates (TikTok, Reels, Shorts) - 10x+ engagement
- ✅ Social commerce now required for retail/e-commerce (Instagram Shopping, Facebook Shop)
- ✅ Mobile-first is non-negotiable
- ✅ User-generated content drives 30% higher engagement at $0 cost
- ✅ Google My Business delivers 5x local visibility boost (free)
- ✅ 2-3 platforms max (resource reality)
- ✅ Quick wins needed for ROI proof within days

### V2 → V3 Changes:
**Duration:**
- 30-day campaigns → 5-14 days
- Added 3-5 day "Flash" campaigns

**Content:**
- Text-first → Video-first (TikTok/Reels/Shorts priority)
- Generic posts → Shoppable posts, Stories ads ($0.50-$2 CPM vs $8-$15 feed)
- 4+ platforms → 2-3 platforms max
- Added: User-generated content, Google My Business posting

**Campaign Types:**
- Removed: Market Dominator (30 days, too complex)
- Added: Revenue Rush (5 days, social commerce)
- Added: Viral Spark (7 days, video-first)
- Shortened: All others (7-14 days max)

---

## Week 2 Trees Integration

### Already Complete (Unmerged):
1. **Product Scanner** → Enables Revenue Rush campaigns (product-specific content)
2. **UVP Integration** → Faster onboarding = more users reaching campaigns
3. **Bannerbear** → Needs pivot to video templates (currently static images)

### What Changes for Week 2 Trees:

**Bannerbear Pivot:**
- Current: 3 static templates (Authority, Social Proof, Local)
- Need: Video thumbnail templates + short video generation
- Action: Merge current Bannerbear, add video templates in Week 3

**Product Scanner:**
- Already perfect for Revenue Rush campaigns
- Merge as-is

**UVP Integration:**
- Already perfect for faster onboarding
- Merge as-is

---

## Revised Campaign Types (Final)

### 1. Authority Builder (7 days)
- Video tutorials + thought leadership
- LinkedIn + Facebook
- 7-10 posts

### 2. Community Champion (14 days)
- Local connection + customer stories
- Facebook + Instagram
- 14-18 posts

### 3. Trust Builder (10 days)
- Video testimonials + social proof
- Facebook + Instagram
- 10-15 posts

### 4. Revenue Rush (5 days) - NEW
- Shoppable posts + limited offers
- Instagram Shop + Facebook Shop
- 8-12 posts
- **Requires:** Product Scanner (Week 2 tree)

### 5. Viral Spark (7 days) - NEW
- TikTok/Reels trending content
- TikTok + Instagram Reels
- 10-14 posts
- **Requires:** Video content capability

---

## New MVP Requirements

### Must Add to V3:

**1. Video Content Generation**
- Short-form video templates (15-60 seconds)
- Auto-caption generation
- Trending audio suggestions
- Mobile preview
- **Priority:** Critical for 2025

**2. Social Commerce Integration**
- Product tagging for posts
- Instagram Shopping setup
- Facebook Shop sync
- Shoppable Story templates
- **Priority:** Required for Revenue Rush

**3. Mobile-First Preview**
- How content looks on phone
- Thumb-stopping scroll test
- Mobile formatting validation
- **Priority:** Essential for all campaigns

**4. AI Automation Layer**
- Auto-respond to comments/DMs
- Optimal posting time calculation
- A/B test content variations
- Real-time performance tracking
- **Priority:** High (competitive necessity)

**5. Platform Intelligence (Simplified)**
- Maximum 2-3 platforms per campaign (prevents burnout)
- Auto-select based on business type:
  - **Local Business** → Facebook + Google My Business
  - **Retail/E-commerce** → Instagram + TikTok (if under-40 audience) + Facebook Shop
  - **B2B/Professional Services** → LinkedIn + Facebook
  - **Service Business** → Facebook + Google My Business
- Skip platforms with low ROI (e.g., LinkedIn for non-B2B, TikTok for service businesses)

---

## Week-by-Week Execution

### **This Week: Week 2 Merge**
**Tuesday-Thursday:**
- Merge Product Scanner (enables Revenue Rush)
- Merge UVP Integration (faster onboarding)
- Merge Bannerbear (static templates for now)

**Friday:**
- Integration testing
- Verify Week 1 + Week 2 compatibility

---

---

### **NEXT TO BUILD: EQ Calculator v2.0 Integration (2 hours)**

**Priority:** CRITICAL - Blocks campaign quality improvement
**Effort:** 2 hours for MVP (18 hours for full feature)
**Value:** 15-30% engagement lift, Phoenix Insurance fix (29→75 EQ)
**Status:** Core complete (60%), ready for integration

**What It Does:**
- Automatically calculates optimal emotional vs rational balance for any brand
- Phoenix Insurance (classic cars) = 75 EQ (not 29 like old calculator)
- Enterprise software = 25 EQ (data-driven)
- Platform adjustments (LinkedIn -20, Instagram +15)
- Auto-learning (no manual config for new specialties)

**MVP Tasks (2 hours):**
1. Apply database migration (5 min)
2. Modify OnboardingPageV5.tsx - Add EQ calculation (30 min)
3. Add EQDashboardWidget to DashboardPage.tsx (15 min)
4. Update type definitions (15 min)
5. Test end-to-end (30 min)
6. Verify Phoenix Insurance = 75 EQ (15 min)

**Files Built (Ready):**
- ✅ Core calculation engine (7 files, 2,800 lines)
- ✅ Database schema (4 tables)
- ✅ Dashboard widget component
- ✅ Integration services
- ✅ Complete documentation (5 guides)

**Deliverable:** EQ calculation during onboarding + display in dashboard

**Documentation:** `.buildrunner/FEATURE_EQ_CALCULATOR_V2.md`

---

### **Week 3: V3 Foundation**
**Monday-Tuesday: Video Content System**
- Video template service (15-60 seconds)
- Short-form video generator (TikTok/Reels/Shorts)
- Stories ads templates (vertical, $0.50-$2 CPM)
- Auto-caption generation (Whisper API)
- Trending audio integration

**Wednesday: Social Commerce & Google My Business**
- Product tagging service
- Instagram Shopping integration
- Facebook Shop sync
- Shoppable Stories templates
- Google My Business API integration (2x/week posting)

**Thursday: Immediate Win Tactics**
- User-generated content contest templates
- Strategic hashtag formula builder (3 branded + 10 niche + 5 trending)
- Email capture landing page templates
- Seasonal calendar detector (Q4 = 40% of SMB revenue)

**Friday: Mobile Preview & Testing**
- Mobile-first preview mode
- Thumb-scroll stopping tests
- Format validation across devices

---

### **Week 4: Campaign Intelligence V3**
**Monday-Tuesday: Revised Campaign Types**
- Build 5 campaign types (7-14 days max)
- Goal-first selection UI (simple, clear outcomes)
- Simplified platform auto-selection (business-type matching)
- Remove live selling complexity (not proven in US/Europe)

**Wednesday-Thursday: AI Automation & Benchmarks**
- Auto-scheduling optimization
- Performance tracking with concrete benchmarks:
  - Engagement rates (FB 1-2%, IG 2-3%, TikTok 5-8%)
  - Ad costs (Stories $0.50-$2, Feed $8-$15)
  - Conversion rates (Social→Email 2-5%)
- Day 3 pivot logic (engagement below 2% = adjust)
- Benchmark dashboard (what "good" looks like)
- **EQ Performance Foundation (4 hours):**
  - Connect campaign performance to EQ scores
  - Track engagement by emotional quotient level
  - Store metrics in eq_performance_metrics table

**Friday: Calendar & Preview**
- Campaign calendar generator (5-14 days)
- Platform orchestration (2-3 platforms max, enforce limits)
- Edit/approve workflow
- Google My Business post integration
- **EQ Analytics Component (4 hours):**
  - Basic dashboard showing EQ vs engagement
  - Performance recommendations based on EQ

---

### **Week 5: Polish & Testing + AI Chat**
**Monday-Wednesday:**
- End-to-end testing
- Mobile optimization
- Video generation testing
- Social commerce testing
- **AI Chat Widget** (bottom-right corner)
- **Conversation Memory System** (Supabase storage)
- **Voice Input Integration** (react-speech-recognition + Whisper)

**Thursday-Friday:**
- Alpha test with 5 users (including AI assistant)
- Fix critical issues
- Prepare for beta

---

### **Week 6: AI Assistant - Full Implementation** ⭐ NEW
**Monday-Wednesday (Worktree 1):**
- Persistent memory system (tone preferences, business context)
- Content pattern learning (track what works)
- Preference persistence (Supabase tables)
- Context injection (business context in every AI prompt)

**Thursday-Friday (Worktree 2):**
- Natural language commands (campaign creation, content modification)
- Topic explorer ("Find trending topics about X")
- Campaign idea generator ("Give me ideas for Y")
- Proactive suggestions (engagement drops → suggest video)
- Visual understanding (upload image → suggest campaign)
- **EQ Advanced Features:** See `.buildrunner/FEATURE_EQ_CALCULATOR_V3_FUTURE.md` for Phase 5-6 enhancements

**Key Features:**
- Talk to AI like a marketing expert
- "Make it funnier" → applies to ALL content forever
- "Create campaign for X" → complete campaign generated
- AI learns from successful content patterns
- Voice commands work everywhere
- Zero re-configuration needed

---

## Success Metrics V3

### User Metrics:
- Campaign completion rate (target: 70%+)
- Video content usage (target: 60%+ of campaigns use video)
- Social commerce adoption (target: 30% of retail/e-commerce use shoppable posts)
- Mobile creation rate (target: 50%+ create on mobile)
- Google My Business usage (target: 40% of local businesses post 2x/week)

### Performance Benchmarks (Industry Standards):
- **Engagement rates:** FB 1-2%, IG 2-3%, TikTok 5-8%, LinkedIn 2-3%
- **Ad costs:** Stories $0.50-$2 CPM, Feed $8-$15 CPM
- **Conversions:** Social→Email 2-5%, Email→Sale 2-3%
- **Day 3 pivot threshold:** Engagement below 2% = adjust content
- **Platform compliance:** 2-3 platforms (90%+ adherence)
- **Campaign duration:** 5-14 days (85%+ compliance)

### Revenue Metrics:
- Revenue Rush conversion rate (Social→Sale)
- Social commerce sales attributed (Instagram Shopping, Facebook Shop)
- Campaign ROI by type (track per campaign)
- Cost per acquisition (vs industry benchmarks)

---

## Technical Priorities

### Week 3 (Immediate Value Features):
1. Video template system (15-60 seconds)
2. Stories ads templates (vertical, full-screen)
3. Auto-caption service (Whisper API)
4. Google My Business API integration
5. User-generated content templates
6. Seasonal calendar detector
7. Strategic hashtag formula builder
8. Instagram Shopping / Facebook Shop integration

### Week 4 (Intelligence & Benchmarks):
1. Simplified platform selection (business-type matching)
2. Benchmark tracking dashboard (engagement, costs, conversions)
3. Day 3 performance checkpoints (2% engagement threshold)
4. Pivot recommendation engine
5. Remove live selling complexity

### Week 5 (Polish):
1. Mobile UX optimization
2. Social commerce checkout flow
3. Video preview on all devices
4. Google My Business post scheduling
5. End-to-end testing with benchmarks

---

## What Week 1 Becomes

**Current State (Week 1):**
- Campaign type selection
- Smart Picks / Content Mixer
- Single-post or batch generation
- Preview & approve

**V3 Integration:**
- Keep: Campaign type selection (update to 5 types)
- Keep: AI suggestions (simplify to 2-3 options)
- Change: Content Mixer → Video-first templates
- Add: Social commerce options
- Add: Mobile preview
- Add: Day 3 checkpoint

**Migration:**
Week 1 code stays functional, gets enhanced with:
- Video generation layer
- Social commerce layer
- Mobile optimization layer
- Shortened campaign logic

---

## Dependencies & Risks

### Week 2 Trees:
✅ **Product Scanner** - Ready for Revenue Rush
✅ **UVP Integration** - Ready for faster onboarding
⚠️ **Bannerbear** - Needs video template addition (Week 3)

### New Risks:
- **Video generation** - Technical complexity (FFmpeg, processing)
- **Social commerce** - Platform API limitations (Instagram/Facebook)
- **Mobile optimization** - Testing across devices
- **Trending audio** - Licensing/copyright concerns

### Mitigation:
- Use existing video tools (Remotion, FFmpeg.wasm)
- Start with Instagram Shopping (most mature API)
- Mobile-first development from start
- Curated trending audio library with proper licenses

---

## The Bottom Line

**V3 Changes (Research-Validated):**
- 5-14 day campaigns (not 30) - SMBs abandon after 2 weeks
- Video-first content (10x+ engagement vs static)
- Stories ads templates ($0.50-$2 CPM vs $8-$15 feed)
- 2-3 platforms max (prevents burnout)
- Google My Business integration (5x local visibility, free)
- User-generated content tools (30% higher engagement, $0 cost)
- Social commerce for retail/e-commerce only (Instagram Shopping, Facebook Shop)
- Removed live selling (not proven in US/Europe)
- Concrete benchmarks built-in (engagement, costs, conversions)
- Mobile-optimized throughout
- AI automation with Day 3 pivots

**Immediate Win Tactics Built-In:**
- Google My Business 2x/week posting
- User-generated content contest templates
- Strategic hashtag formula (3 branded + 10 niche + 5 trending)
- Seasonal calendar planning (Q4 = 40% of SMB revenue)
- Email capture landing pages

**Week 2 Impact:**
- Merge all three trees this week
- Product Scanner enables Revenue Rush
- UVP speeds onboarding
- Bannerbear gets video + Stories templates in Week 3

**Timeline:**
- Week 2 merge: This week (Tue-Thu)
- Week 3: Video + Stories ads + Google My Business + immediate wins
- Week 4: Campaign intelligence + benchmarks
- Week 5: Testing + beta

**Outcome:**
SMBs get copy-paste tactics they can start Monday morning, with concrete benchmarks showing what "good" looks like. No fluff, no complexity - just proven strategies that drive revenue.

---

## Alignment with Best Practices Document

**100% Implementation of Research Findings:**

✅ **Video-first (10x+ engagement)** → Week 3: Video templates, Stories ads, auto-captions
✅ **84% use Facebook** → Platform selection includes Facebook for all non-B2B
✅ **Social commerce for retail** → Week 3: Instagram Shopping, Facebook Shop
✅ **User-generated content (30% boost)** → Week 3: Contest templates
✅ **Google My Business (5x visibility)** → Week 3: API integration, 2x/week posting
✅ **2-3 platforms max** → Enforced in platform selection logic
✅ **Stories ads ($0.50-$2 CPM)** → Week 3: Stories ad templates
✅ **Strategic hashtags** → Week 3: Formula builder (3+10+5)
✅ **Email capture (2-5%)** → Week 3: Landing page templates
✅ **Seasonal planning (Q4 = 40%)** → Week 3: Calendar detector
✅ **Concrete benchmarks** → Week 4: Dashboard with engagement/cost/conversion rates
✅ **Day 3 pivots (2% threshold)** → Week 4: Performance checkpoints
✅ **Mobile-first** → Week 3: Mobile preview, thumb-scroll tests

**Removed Fluff:**
❌ Live selling (not proven) - removed from roadmap
❌ Complex 30-day campaigns - all campaigns 5-14 days
❌ 4+ platforms - enforced 2-3 max
❌ Generic advice - replaced with specific tactics

**Last Updated:** November 17, 2024
**Next Review:** After Week 2 merge completion
