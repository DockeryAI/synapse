# Synapse MVP - Master Build Plan

**Project:** Synapse SMB Platform
**Version:** 1.0.0
**Build Strategy:** Parallel Development with Git Worktrees
**Total Features:** 28 (3 complete, 1 in-progress, 24 pending - includes auth + 6 new MVP features)
**Estimated Timeline:** 5-6 weeks (parallel) | 7-8 weeks (sequential)
**New in MVP:** Perplexity Local Intelligence + Competitive Intelligence + Multi-Platform Video Editor + Newsletter/Blog + Landing Pages + SEO Intelligence + Intelligence-Driven UVP 2.0
**MVP Total Effort:** ~301 hours (38 days solo, 10-15 days parallel)

**📊 Campaign Intelligence Plan:** See `CAMPAIGN_INTELLIGENCE_PLAN.md` for complete campaign strategy, user experience flows, and future phase roadmap.

---

## Build Status Overview

### ✅ Completed Features (3)
- Enhanced Synapse Content Generation Page (1,956 LOC)
- SocialPilot API Integration (1,840 LOC)
- Synapse-Calendar Integration Layer (800 LOC)

### 🚧 In Progress (1)
- Simplified Buyer Journey Wizard (1,200 LOC) - needs completion

### 🔥 Pending Critical Features (19)
**⚠️ BUILD AUTHENTICATION FIRST (Phase 0) ⚠️**
1. **User Authentication & Admin Access** (Phase 0 - 80% complete)
2. Universal URL Parser
3. Global Location Detection Engine
4. Parallel Intelligence Gathering System
5. Deep Specialty Detection Engine
6. **Intelligence-Driven UVP Wizard 2.0** 🆕 (Auto-discovers from 20+ sources, pattern recognition)
7. Product/Service Intelligence Scanner
8. Social Media Intelligence & Content Analyzer (includes YouTube)
9. **Perplexity Local Intelligence** 🆕 (MVP - Powers Local Pulse Campaign)
10. **Competitive Intelligence Integration** 🆕 (MVP - Powers Competitor Crusher Campaign)
11. **Multi-Platform Video Editor with Auto-Formatting** 🆕 (MVP - TikTok/Instagram capabilities)
12. **Newsletter & Blog Content Generator** 🆕 (MVP - Repurpose campaigns to long-form)
13. **Landing Page Generator & Lead Capture** 🆕 (MVP - Complete the funnel)
14. **SEO Intelligence & Optimizer** 🆕 (MVP - Real-time SEO scoring, local SEO, quick wins)
15. AI Campaign Generation Engine (4 Strategic Campaign Types)
16. Bannerbear Universal Template System
17. Dynamic Industry Profile Auto-Generation
18. Business Profile Management & Product Campaign Selection

### 🎯 MVP Campaign Types (New in This Plan)
See `CAMPAIGN_INTELLIGENCE_PLAN.md` for complete details:
1. **Authority Builder** - Build industry expertise (DeepContext + YouTube)
2. **Local Pulse** - Drive local traffic (Perplexity + Weather + Local news) 🆕
3. **Social Proof** - Build trust (Reviews + Testimonials)
4. **Competitor Crusher** - Stand out (Competitive Intelligence + SEMrush) 🆕

### 📋 Planned Features (3)
- Content Calendar with Auto-Scheduling
- Analytics & Performance Dashboard
- Multi-Location Business Support

---

## Phase-Based Build Plan

### **PHASE 0: Authentication (Week 1, Day 1) - CRITICAL FIRST**
*Build this BEFORE anything else - nothing works without users*

**Status:** 🟡 80% Complete - Code written, needs database setup + enabling

**Tasks:**
1. ⏳ User Authentication & Admin Access (~~6 hours~~ → **1 hour remaining**)
   - ✅ Sign up, login, logout flows (COMPLETE - code written)
   - ✅ Protected routes (COMPLETE - code written but commented out)
   - ✅ Admin account setup UI (COMPLETE - code written)
   - ✅ Admin dashboard to view all users (COMPLETE - code written)
   - ✅ Session management (COMPLETE - code written)
   - 🔄 Database migration (PENDING - migration file ready, needs to be applied)
   - 🔄 Enable authentication (PENDING - uncomment code in App.tsx)
   - 🔄 Create admin user in Supabase (PENDING - manual step)

**Estimated:** ~~1 day (6 hours)~~ → **1 hour remaining**
**Dependencies:** None
**Blocking:** Everything else (can't save user data without auth)
**Task File:** `.buildrunner/worktrees/worktree-authentication.md`

**What's Been Done:**
- All TypeScript code written (services, components, pages)
- Database migration file created
- Routes defined (but disabled in App.tsx to allow development)

**What Remains:**
- Apply database migration to Supabase
- Create admin user: admin@dockeryai.com / admin123
- Uncomment auth code in App.tsx
- Test authentication flow

---

### **PHASE 1: Foundation (Week 1, Day 2) - BLOCKING**
*Must complete after auth, before parallel tracks*

**Tasks:**
1. ✅ Update features.json with all MVP features
2. ✅ Generate STATUS.md
3. ⏳ Universal URL Parser (4 hours)
4. ⏳ Database Schema Setup (6 hours)
   - 15+ tables for all features
   - Supabase migrations
   - RLS policies (with user_id foreign keys)
   - Foreign keys and indexes

**Estimated:** 1 day solo | 1 day parallel
**Dependencies:** Authentication (Phase 0)
**Blocking:** All feature development

---

### **PHASE 2: Parallel Build Tracks (Week 1-3)**

#### 🔀 **TRACK A: Intelligence & Detection** (Week 1-2)

| Feature | Time | Worktree | Status | Task File |
|---------|------|----------|--------|-----------|
| Global Location Detection | 8h | `feature/location-detection` | ⏳ Pending | `worktree-location-detection.md` |
| Parallel Intelligence Gatherer | 12h | `feature/intelligence-gatherer` | ⏳ Pending | `worktree-intelligence-gatherer.md` |
| Deep Specialty Detection | 6h | `feature/specialty-detection` | ⏳ Pending | `worktree-specialty-detection.md` |
| Social Media Intelligence (YouTube + Scraping + Learning Loop) | 14h | `feature/social-analyzer` | ⏳ Pending | `worktree-social-analyzer.md` |

**Track A Total:** 40 hours (5 days solo) | 2-3 days (4 parallel worktrees)

---

#### 🔀 **TRACK B: UVP, Products & Profiles** (Week 1-2)

| Feature | Time | Worktree | Status | Dependencies | Task File |
|---------|------|----------|--------|--------------|-----------|
| Dynamic Industry Profile Gen | 10h | `feature/industry-autogen` | ⏳ Pending | Brandock script | `worktree-industry-autogen.md` |
| Product/Service Scanner | 8h | `feature/product-scanner` | ⏳ Pending | URL parser | `worktree-product-scanner.md` |
| Intelligence-Driven UVP Wizard 2.0 | 18h | `feature/uvp-wizard` | ⏳ Pending | Product Scanner, Social Analyzer, Competitive Intelligence | `worktree-uvp-wizard.md` |
| Business Profile Management | 14h | `feature/profile-management` | ⏳ Pending | UVP wizard | `worktree-profile-management.md` |

**UVP Wizard 2.0 Features:**
- Pre-discovery intelligence from 20+ sources (Website, YouTube, Social, Reviews, Competitors)
- Pattern recognition across all data
- Transformation extraction (before/after from reviews/testimonials)
- Differentiation analysis (competitive gaps + unique strengths)
- Automatic proof point gathering
- 4-step validation workflow (80% auto-populated, 20% user input)
- 5-minute completion time vs 20+ minutes traditional

**Build Order:** Industry Gen → Product Scanner → Social Analyzer → UVP Wizard → Profile Management
**Track B Total:** 50 hours (6 days solo) | 3-4 days (staged parallel)

---

#### 🔀 **TRACK C: Campaign System, Video & Content** (Week 2-3)

| Feature | Time | Worktree | Status | Dependencies | Task File |
|---------|------|----------|--------|--------------|-----------|
| Bannerbear Templates | 10h | `feature/bannerbear` | ⏳ Pending | None | `worktree-bannerbear.md` |
| Multi-Platform Video Editor | 40h | `feature/video-editor` | ⏳ Pending | None | `worktree-video-editor.md` |
| Platform Auto-Formatting | 30h | `feature/video-formatter` | ⏳ Pending | Video Editor | `worktree-video-formatter.md` |
| Newsletter & Blog Generator | 20h | `feature/long-form-content` | ⏳ Pending | Campaign Generator | `worktree-long-form-content.md` |
| Landing Pages & Lead Capture | 25h | `feature/landing-pages` | ⏳ Pending | Profile Management | `worktree-landing-pages.md` |
| SEO Intelligence & Optimizer | 30h | `feature/seo-intelligence` | ⏳ Pending | Campaign Generator | `worktree-seo-intelligence.md` |
| Perplexity Local Intelligence | 4h | `feature/perplexity-local` | ⏳ Pending | Location Detection | `worktree-perplexity-local.md` |
| Competitive Intelligence Integration | 6h | `feature/competitive-integration` | ⏳ Pending | None (service exists) | `worktree-competitive-integration.md` |
| AI Campaign Generator (4 MVP Types) | 16h | `feature/campaign-generator` | ⏳ Pending | Profile Mgmt, Social Analyzer, Perplexity, Competitive | `worktree-campaign-generator.md` |

**Video Features in MVP:**
- Basic editor (trim, text overlays, music, transitions, filters, auto-captions)
- Auto-formatting for all platforms (9:16, 16:9, 1:1, 4:5)
- Platform-specific exports (LinkedIn, Instagram, TikTok, YouTube Shorts, Twitter, Facebook)
- Direct export to SocialPilot
- Uses open-source stack (FFmpeg, Remotion, Whisper) - $0/month

**Long-Form Content in MVP:**
- Expand campaign posts to blog articles (500-2000 words)
- Newsletter template builder (3-5 layouts)
- Weekly digest compiler
- Export to Mailchimp, ConvertKit, Substack
- Uses existing OpenRouter - $0/month additional

**Landing Pages in MVP:**
- 5 templates (Service, Product, Event, Webinar, Download)
- Auto-populate from business profile
- Lead capture to database
- Email notifications, CSV export
- Host on Synapse subdomain or export HTML
- Self-hosted - $0/month additional

**SEO Intelligence in MVP:**
- Real-time SEO scoring for all content
- Keyword density optimization (primary, secondary, LSI)
- Local keyword injection (city, neighborhood, "near me")
- Quick win finder (page 2 → page 1 keywords)
- Featured snippet opportunity finder
- Meta tags, schema markup, header optimization
- SEMrush API integration (Keyword Magic Tool, Difficulty, Rankings, Local Pack Tracker)
- Additional cost: $50-100/month SEMrush usage

**Campaign Types in MVP:**
1. **Authority Builder** - DeepContext + YouTube + Industry insights
2. **Local Pulse** - Perplexity events + Weather + Local news
3. **Social Proof** - Reviews + Testimonials + Customer stories
4. **Competitor Crusher** - Competitive Intelligence + SEMrush gaps + Differentiation

**Track C Total:** 181 hours (23 days solo) | 9-11 days (parallel)

---

#### 🔀 **TRACK D: Finish What You Started** (Week 1)

| Feature | Time | Worktree | Status | Task File |
|---------|------|----------|--------|-----------|
| Buyer Journey Wizard | 6h | `feature/buyer-journey-fix` | 🚧 In Progress | `worktree-buyer-journey-fix.md` |

**Track D Total:** 6 hours (1 day)

---

### **PHASE 3: Integration & Wiring (Week 3-4)**

**Tasks:**
1. Wire all services together (12 hours)
   - UVP → Products → Campaigns flow
   - 17 intelligence sources integration
   - Campaign generator with profile management
2. UI Polish & Error Handling (8 hours)
   - Progress bars, loading states
   - Error messages
   - Toast notifications
3. Testing & Bug Fixes (16 hours)
   - API rate limit handling
   - Database constraint validation
   - Edge case testing

**Phase 3 Total:** 36 hours (5 days solo) | 3-4 days (parallel)

---

### **PHASE 2: Admin Panel & White-Label (Post-MVP)**
*Enables B2B2B model with agency partnerships and comprehensive platform management*

**See `.buildrunner/PHASE_2_PLAN.md` for complete architecture and implementation details.**

#### 🔀 **TRACK A: Admin Foundation** (Month 1)

| Feature | Time | Description |
|---------|------|-------------|
| Admin Dashboard Core | 12h | User management, impersonation, system health monitoring |
| User & Account Management | 10h | Advanced filtering, bulk actions, usage analytics, health scoring |
| API Usage Tracking | 8h | Monitor all API calls, costs, limits, efficiency by provider |
| Basic Billing Integration | 10h | Stripe integration, subscription management, invoice generation |
| System Monitoring Tools | 6h | Queue management, error logging, cache inspection |

**Track A Total:** 46 hours (6 days solo) | 3-4 days (parallel)

---

#### 🔀 **TRACK B: Advanced Admin** (Month 2)

| Feature | Time | Description |
|---------|------|-------------|
| Content Moderation Queue | 8h | Review generated content, flag system, approval workflow |
| Financial Control Center | 12h | Usage-based billing, refunds, coupons, MRR tracking, churn analysis |
| Platform Analytics Dashboard | 10h | Business metrics, operational metrics, feature adoption, CAC/LTV |
| Intelligence Management | 8h | Industry profile editor, competitor data, location cache management |
| Bulk Operations | 6h | Import/export users, data operations, global configurations |

**Track B Total:** 44 hours (6 days solo) | 3-4 days (parallel)

---

#### 🔀 **TRACK C: White-Label MVP** (Month 3)

| Feature | Time | Description |
|---------|------|-------------|
| Multi-Tenant Data Model | 16h | Tenant schema, RLS policies, data isolation, migration |
| Agency Hierarchy System | 12h | Tenant → Agency Admin → Clients, permissions, access control |
| Basic Branding System | 10h | Logo upload, color theming, basic UI customization |
| Subdomain Support | 8h | Dynamic subdomain routing, tenant resolution, DNS configuration |
| Usage Limit Management | 8h | Per-agency limits, per-client limits, cascading enforcement |

**Track C Total:** 54 hours (7 days solo) | 4-5 days (parallel)

---

#### 🔀 **TRACK D: Full White-Label** (Month 4)

| Feature | Time | Description |
|---------|------|-------------|
| Custom Domain Mapping | 10h | CNAME support, SSL certificates, domain verification |
| Complete UI Theming | 14h | Fonts, layouts, email templates, report branding, CSS variables |
| Agency Billing System | 12h | Wholesale pricing, revenue sharing, agency invoicing, commission tracking |
| Feature Flags & Control | 10h | Per-agency feature toggles, campaign type restrictions, API limits |
| Agency Analytics | 12h | Client roster performance, revenue per agency, retention metrics |

**Track D Total:** 58 hours (8 days solo) | 5-6 days (parallel)

---

#### 🔀 **TRACK G: LinkedIn Growth Engine** (Month 4)

| Feature | Time | Description |
|---------|------|-------------|
| LinkedIn Influence Analyzer | 4h | Free viral tool - authority score + gap analysis (uses existing APIs) |
| LinkedIn Campaign Types (4) | 12h | Thought Leader, Client Win, Trend Hijacker, Data Drop |
| LinkedIn Optimizer | 4h | Auto-format for LinkedIn algorithm, optimal posting times |
| Pod Management System | 8h | Auto-create engagement pods, coordinate first-hour engagement |
| Connection Automation | 6h | Personalized connection requests, follow-up sequences |

**Track G Total:** 34 hours (5 days solo) | 3-4 days (parallel)

**Purpose:** Turn LinkedIn into primary viral growth channel by targeting influencers and B2B decision makers

---

#### 🔀 **TRACK H: AI Video Auto-Editor** (Month 5)

| Feature | Time | Description |
|---------|------|-------------|
| AI Highlight Detection | 20h | Find best moments, engagement prediction, hook generation |
| Scene Detection & Auto-Cutting | 15h | Remove dead space, detect scene changes, smart transitions |
| Audio Analysis & Optimization | 10h | Beat drops, silence removal, speech enhancement |
| Multi-Version Generation | 15h | Auto-create 60s, 30s, 15s versions from raw footage |

**Track H Total:** 60 hours (8 days solo) | 4-5 days (parallel)

**Tech Stack:** PySceneDetect (free), OpenCV (free), MediaPipe (free), Whisper (free), MoviePy (free)
**Purpose:** Upload raw video → AI creates multiple optimized versions automatically

---

#### 🔀 **TRACK I: Content Intelligence & Automation** (Month 3)

| Feature | Time | Description |
|---------|------|-------------|
| AI Newsletter Curator | 20h | Auto-select top posts, personalization tokens, optimal send time |
| Blog Automation Suite | 20h | Series generator, internal linking, FAQ auto-generation, content refresh alerts |
| Landing Page Optimization | 25h | Dynamic content by source, exit-intent popups, multi-step forms, A/B testing |
| Lead Intelligence System | 25h | Lead scoring, company ID from IP, auto-enrichment, CRM webhooks |

**Track I Total:** 90 hours (11 days solo) | 5-6 days (parallel)

**Tech Stack:** Existing OpenRouter, Clearbit API ($99/mo - lead enrichment), IP geolocation (free)
**Purpose:** Automate content marketing funnel from creation → capture → nurture

---

#### 🔀 **TRACK J: SEO Automation & Advanced Features** (Month 4)

| Feature | Time | Description |
|---------|------|-------------|
| Content Refresh Engine | 15h | Auto-detect outdated content, suggest updates, track ranking changes |
| Backlink Opportunity Finder | 12h | Identify unlinked brand mentions, broken link opportunities, competitor backlinks |
| Technical SEO Monitor | 10h | Site speed tracking, broken link detection, mobile usability, Core Web Vitals |
| Topic Cluster Generator | 13h | Auto-create pillar pages + cluster content, internal linking automation |

**Track J Total:** 50 hours (6 days solo) | 3-4 days (parallel)

**Tech Stack:**
- SEMrush Backlink Analytics API
- Google PageSpeed Insights API (free)
- Google Search Console API (free)
- Existing OpenRouter

**Purpose:** Advanced SEO features that drive long-term organic growth and reduce reliance on paid ads

---

**Phase 2 Grand Total:** 436 hours (~11 weeks solo) | ~8-9 weeks (parallel)

**Key Deliverables:**
- Comprehensive admin panel for platform management
- Full white-label capability for agency partnerships
- Multi-tenant architecture with data isolation
- Revenue sharing and agency billing system
- Complete branding customization
- LinkedIn viral growth engine (influencer marketing + B2B targeting)
- AI video auto-editor (raw footage → optimized multi-platform versions)
- Content marketing automation (newsletters, blogs, landing pages with intelligence)

**Business Impact:**
- Enable B2B2B sales model (agencies resell platform)
- Agencies handle marketing/sales/support for their clients
- Higher LTV from agency contracts
- Scalable growth through partner network
- Lower support burden (agencies support their clients)

---

## Parallel Worktree Strategy

### Week 1 - Parallel Group 1
```bash
git worktree add ../synapse-location feature/location-detection
git worktree add ../synapse-intelligence feature/intelligence-gatherer
git worktree add ../synapse-industry feature/industry-autogen
git worktree add ../synapse-buyer-journey feature/buyer-journey-fix
```
**Why Safe:** All different services, no file overlap

### Week 2 - Parallel Group 2
```bash
git worktree add ../synapse-specialty feature/specialty-detection
git worktree add ../synapse-social feature/social-analyzer
git worktree add ../synapse-product-uvp feature/product-scanner-uvp
git worktree add ../synapse-bannerbear feature/bannerbear
```
**Why Safe:** Different services, minimal type sharing

### Week 3 - Parallel Group 3
```bash
git worktree add ../synapse-profile feature/profile-management
git worktree add ../synapse-campaign feature/campaign-generator
```
**Note:** These share state, coordinate merges carefully

---

## Timeline Estimates

### Solo Build (Sequential)
- Foundation: 2 days
- Track A: 5 days
- Track B: 6 days
- Track C: 4 days
- Track D: 1 day
- Integration: 5 days
- **Total: ~23 days (4.5 weeks)**

### Parallel Build (Git Worktrees)
- Foundation: 1-2 days
- Tracks A+B+D (parallel): 3-4 days
- Track C: 2-3 days
- Integration: 3-4 days
- **Total: ~10-13 days (2-3 weeks)**

### Realistic Estimate
- Optimistic: 2 weeks
- Realistic: 3 weeks
- Pessimistic: 4-5 weeks
- **Most Likely: 3 weeks + 1 week bug fixes**

---

## Cost Estimates

### Development
- OpenRouter (Opus): $20-30
- Apify: $50-100
- OutScraper: $30
- Serper: $20
- Bannerbear: $30
- Video infrastructure: $300 (GPU server + storage)
- SEMrush (enhanced usage): $50-100
- **Dev Total: $500-600**

### Production (First 50 Users/Month)
- Industry profiles (10 new): $40
- Intelligence runs (50): $250
- Content generation (500 posts): $100
- Bannerbear (500 images): $150
- Video processing & storage: $300
- SEMrush API calls (enhanced): $75
- **Monthly: ~$915**

---

## High-Risk Areas

1. **Parallel Intelligence Gatherer** - 8 APIs, race conditions, timeouts
2. **Industry Profile Generator** - Opus hallucinating NAICS codes
3. **Product Scanner** - E-commerce sites blocking Apify
4. **Campaign Generator** - Content quality at scale
5. **Video Processing** - Browser performance with large files, GPU requirements, storage costs
6. **Database migrations** - Foreign key constraints

---

## Worktree Task Files

All atomic task files located in `.buildrunner/worktrees/`:

**Week 1:**
- `worktree-location-detection.md`
- `worktree-intelligence-gatherer.md`
- `worktree-industry-autogen.md`
- `worktree-buyer-journey-fix.md`

**Week 2:**
- `worktree-specialty-detection.md`
- `worktree-social-analyzer.md`
- `worktree-product-scanner-uvp.md`
- `worktree-bannerbear.md`
- `worktree-video-editor.md` 🆕
- `worktree-video-formatter.md` 🆕

**Week 3:**
- `worktree-profile-management.md`
- `worktree-campaign-generator.md`
- `worktree-long-form-content.md` 🆕
- `worktree-landing-pages.md` 🆕
- `worktree-seo-intelligence.md` 🆕

**Foundation:**
- `worktree-foundation.md` (URL parser + database setup)

---

## Merge Strategy

1. **Foundation first** - Must merge before any other work
2. **Week 1 worktrees** - Can merge independently
3. **Week 2 worktrees** - Product-UVP must merge before Profile Management
4. **Week 3 worktrees** - Coordinate merges, potential conflicts

**Merge Command:**
```bash
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/[branch-name]
git worktree remove ../synapse-[name]
```

---

*Last Updated: 2025-11-15*
*Generated by Roy, the burnt-out sysadmin who knows this will break*
