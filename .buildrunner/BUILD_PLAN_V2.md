# Synapse Build Plan - Phased Rollout Strategy

**Project:** Synapse SMB Platform
**Version:** 2.0.0 (Restructured)
**Build Strategy:** Phased releases with parallel worktrees per phase
**Total Effort:** ~684 hours across 7 phases
**Timeline:** 3 weeks to revenue, 7 months to full platform

---

## Phase Overview

| Phase | Focus | Hours | Timeline | Revenue Impact |
|-------|-------|-------|----------|----------------|
| **Phase 0** | Authentication | 1h | Day 1 | Blocking |
| **Phase 1A** | Core MVP | 150h | Weeks 1-3 | **Launch & Test** |
| **Phase 1B** | Content Marketing | 80h | Weeks 4-5 | **Charge $99-199** |
| **Phase 1C** | Video Capabilities | 70h | Weeks 6-7 | **Premium Tier $399** |
| **Phase 2A** | Admin & Billing | 90h | Month 2 | **Scale Operations** |
| **Phase 2B** | White-Label MVP | 54h | Month 3 | **B2B2B $500-5K** |
| **Phase 2C** | Growth & Automation | 140h | Months 4-5 | **Viral Growth** |
| **Phase 2D** | Full Platform | 99h | Months 6-7 | **Enterprise Ready** |

---

## PHASE 0: Authentication (1 hour)

**Status:** 80% Complete
**Blocking:** All other development

### Tasks
- Apply database migration to Supabase
- Create admin user (admin@dockeryai.com)
- Uncomment auth code in App.tsx
- Test authentication flow

### Value
- User data persistence
- Protected routes
- Admin access

### Ongoing Cost
- $0/month (Supabase free tier)

---

## PHASE 1A: Core MVP (183 hours / 3-4 weeks)

**Goal:** Generate intelligent campaigns better than competitors with user control over content selection

### Features (14 total)

**Foundation (10 hours):**
- Universal URL Parser (4h)
- Database Schema Setup (6h)

**Intelligence Gathering (40 hours):**
- Global Location Detection (8h)
- Parallel Intelligence Gatherer (12h) - 8 APIs
- Social Media Intelligence (14h) - YouTube + scraping
- Deep Specialty Detection (6h)

**UVP & Profiles (58 hours):**
- Dynamic Industry Profile Generator (10h)
- Product/Service Scanner (8h)
- Brand Voice Detection & Matching (8h)
- Intelligence-Driven UVP Wizard 2.0 (18h)
- Business Profile Management (14h)

**Campaign Engine (65 hours):**
- Bannerbear Template System (10h)
- Basic Competitive Intelligence (10h)
- Content Selection Interface (25h)
  - Smart Picks UI (8h) - AI-recommended content with one-click generation
  - Content Mixer (12h) - Three-column interface for custom combinations
  - Insight Pool & Categorization (5h) - Local/Trending/Seasonal/Industry tabs
- AI Campaign Generator - 3 types (20h)

**Core Campaign Types:**
1. **Authority Builder** - Industry expertise
2. **Social Proof** - Reviews + testimonials
3. **Local Pulse** - Basic local content

**Content Selection Modes:**
- **Smart Picks** (Easy Button): AI pre-selects 3-5 best combinations with trust indicators
- **Content Mixer** (Power User): Drag-and-drop interface to combine insights from multiple data sources

### Parallel Worktrees (Week 1-3)

**Week 1 - Group 1 (parallel):**
```bash
git worktree add ../synapse-foundation feature/foundation
git worktree add ../synapse-location feature/location-detection
git worktree add ../synapse-intelligence feature/intelligence-gatherer
git worktree add ../synapse-industry feature/industry-autogen
```

**Week 2 - Group 2 (parallel):**
```bash
git worktree add ../synapse-specialty feature/specialty-detection
git worktree add ../synapse-social feature/social-analyzer
git worktree add ../synapse-product-uvp feature/product-scanner-uvp
git worktree add ../synapse-bannerbear feature/bannerbear
```

**Week 3 - Group 3 (parallel):**
```bash
git worktree add ../synapse-profile feature/profile-management
git worktree add ../synapse-campaign feature/campaign-generator-core
git worktree add ../synapse-content-selector feature/content-selection-interface
```

### Value to Customer
- Enter URL → Get intelligent campaigns in 10 minutes
- 20+ data sources inform content strategy
- UVP auto-discovered (5 min vs 20+)
- **Brand Voice Matching:** AI learns and matches your existing tone of voice
- **Smart Picks:** AI selects best content combinations (one-click generation)
- **Content Mixer:** Power users can combine local issues + trending topics + seasonal events
- See ALL insights data before generating (not just 3 AI-picked ideas)
- Mix and match data sources for custom content strategies
- Content feels like YOUR team wrote it, not generic AI
- 3 strategic campaign types
- Better than manually creating posts
- Better than Jasper (no intelligence, no customization, generic tone)

### Ongoing API Costs
- OpenRouter (Opus): $100/month (50 users)
- Apify: $75/month
- OutScraper: $30/month
- Serper: $20/month
- YouTube API: Free
- Weather/News: Free
- Bannerbear: $50/month
- **Total: ~$275/month** (breakeven at 3 customers @ $99/mo)

---

## PHASE 1B: Content Marketing (80 hours / 2 weeks)

**Goal:** Complete content funnel (awareness → capture)

### Features (4 total)

**Long-Form Content (20 hours):**
- Blog article expander (500-2000 words)
- Newsletter template builder
- Weekly digest compiler
- Email platform exports

**Landing Pages (25 hours):**
- 5 templates (Service, Product, Event, Webinar, Download)
- Lead capture to database
- Email notifications
- CSV export

**SEO Intelligence (30 hours):**
- Real-time SEO scoring
- Keyword density optimization
- Local SEO dominator
- Quick win finder (page 2→1)

**Enhanced Campaigns (5 hours):**
- Perplexity Local Intelligence (4h)
- Refined Competitive Intelligence (1h)

### Parallel Worktrees (Week 4-5)

```bash
git worktree add ../synapse-long-form feature/long-form-content
git worktree add ../synapse-landing-pages feature/landing-pages
git worktree add ../synapse-seo feature/seo-intelligence
git worktree add ../synapse-perplexity feature/perplexity-local
```

### Value to Customer
- Repurpose campaigns to blog articles
- Capture leads with landing pages
- Auto-optimize everything for SEO
- Local "near me" traffic capture
- Complete marketing funnel
- Replace Mailchimp + Unbounce + Surfer SEO

### Ongoing API Costs (Added)
- SEMrush (enhanced): $75/month
- Perplexity API: $15/month
- **Phase 1B Total: $365/month** (breakeven at 2 customers @ $199/mo)

---

## PHASE 1C: Video Capabilities (70 hours / 2 weeks)

**Goal:** Multi-platform video editing

### Features (2 total)

**Video Editor (40 hours):**
- Browser-based editing (TikTok/Instagram parity)
- Trim, text overlays, music, transitions
- Filters, effects, speed control
- Auto-generated captions (Whisper)

**Platform Auto-Formatting (30 hours):**
- One video → all platforms automatically
- 9:16, 16:9, 1:1, 4:5 aspect ratios
- 7 platform exports (LinkedIn, TikTok, Instagram, etc.)
- Safe zone overlays
- Direct export to SocialPilot

### Parallel Worktrees (Week 6-7)

```bash
git worktree add ../synapse-video-editor feature/video-editor
git worktree add ../synapse-video-formatter feature/video-formatter
```

### Value to Customer
- Create platform-optimized videos in browser
- No CapCut or external tools needed
- Auto-format for all platforms
- Complete marketing stack (text + visual + video)
- Only platform combining intelligence + content + video

### Ongoing API Costs (Added)
- Video infrastructure (GPU server): $200/month
- Video storage: $100/month
- **Phase 1C Total: $665/month** (breakeven at 2 customers @ $399/mo)

---

## PHASE 2A: Admin & Revenue (90 hours / Month 2)

**Goal:** Scale operations and start charging

### Features (6 total)

**Admin Dashboard (46 hours):**
- User management & impersonation (10h)
- Advanced filtering & bulk actions (10h)
- API usage tracking & costs (8h)
- Stripe billing integration (10h)
- System health monitoring (6h)
- Queue management (2h)

**Content & Financial Controls (44 hours):**
- Content moderation queue (8h)
- Usage-based billing (12h)
- Refunds & coupons (4h)
- MRR tracking (6h)
- Platform analytics dashboard (10h)
- Intelligence data management (4h)

### Parallel Worktrees (Month 2)

```bash
git worktree add ../synapse-admin-core feature/admin-dashboard
git worktree add ../synapse-billing feature/stripe-billing
git worktree add ../synapse-moderation feature/content-moderation
git worktree add ../synapse-analytics feature/platform-analytics
```

### Value to Customer
- Reliable billing system
- Professional platform operations
- Content quality control
- Usage transparency
- Trust & credibility

### Ongoing API Costs (Added)
- Stripe: 2.9% + 30¢ per transaction
- Redis (Upstash): $10/month
- APM (DataDog): $15/month
- **Phase 2A Total: $690/month + transaction fees**

---

## PHASE 2B: White-Label MVP (54 hours / Month 3)

**Goal:** Enable B2B2B model (agencies)

### Features (5 total)

**Multi-Tenancy (54 hours):**
- Multi-tenant data model & RLS (16h)
- Agency hierarchy (Platform → Agency → Clients) (12h)
- Basic branding (logo, colors) (10h)
- Subdomain support (agency.synapse.com) (8h)
- Usage limit management (per-agency, per-client) (8h)

### Parallel Worktrees (Month 3)

```bash
git worktree add ../synapse-multitenant feature/multi-tenant
git worktree add ../synapse-agency-hierarchy feature/agency-hierarchy
git worktree add ../synapse-branding feature/basic-branding
git worktree add ../synapse-subdomains feature/subdomain-support
```

### Value to Customer
- Agencies can resell platform
- White-label branding
- Manage multiple clients
- Wholesale pricing (30-50% discount)
- Scalable B2B2B growth

### Ongoing API Costs
- No change: $690/month
- Revenue: 5-10 agencies @ $500-5,000/month = **$2,500-50,000/month**

---

## PHASE 2C: Growth & Automation (140 hours / Months 4-5)

**Goal:** Viral growth + AI automation

### Features (8 total)

**LinkedIn Growth Engine (34 hours):**
- LinkedIn Influence Analyzer (4h) - viral tool
- 4 LinkedIn campaign types (12h)
- LinkedIn optimizer (4h)
- Pod management system (8h)
- Connection automation (6h)

**AI Video Auto-Editor (60 hours):**
- AI highlight detection (20h)
- Scene detection & auto-cutting (15h)
- Audio analysis & optimization (10h)
- Multi-version generation (15h)

**SEO Automation (46 hours):**
- Content refresh engine (15h)
- Backlink opportunity finder (12h)
- Technical SEO monitor (10h)
- Topic cluster generator (9h) - reduced scope

### Parallel Worktrees (Months 4-5)

```bash
# Month 4
git worktree add ../synapse-linkedin feature/linkedin-engine
git worktree add ../synapse-ai-video feature/ai-video-editor
git worktree add ../synapse-seo-automation feature/seo-automation
```

### Value to Customer
- LinkedIn becomes primary growth channel
- Upload raw video → AI creates optimized versions
- Advanced SEO automation
- Reduced manual work
- Higher engagement rates

### Ongoing API Costs (Added)
- SEMrush (backlinks): $50/month
- Clearbit API: $99/month
- GPU server (AI video): Already included
- **Phase 2C Total: $839/month**

---

## PHASE 2D: Full Platform (99 hours / Months 6-7)

**Goal:** Enterprise-ready, full white-label

### Features (7 total)

**Complete White-Label (58 hours):**
- Custom domain mapping (10h)
- Complete UI theming (14h)
- Agency billing & revenue sharing (12h)
- Feature flags & controls (10h)
- Agency analytics dashboard (12h)

**Content Intelligence (41 hours):**
- AI newsletter curator (10h) - reduced scope
- Blog automation suite (11h) - reduced scope
- Landing page optimization (10h) - reduced scope
- Lead intelligence system (10h) - reduced scope

### Parallel Worktrees (Months 6-7)

```bash
git worktree add ../synapse-custom-domains feature/custom-domains
git worktree add ../synapse-full-theming feature/complete-theming
git worktree add ../synapse-agency-billing feature/agency-billing
git worktree add ../synapse-content-automation feature/content-intelligence
```

### Value to Customer
- True white-label (custom domains)
- Complete branding control
- Revenue sharing built-in
- Advanced automation
- Enterprise-grade platform

### Ongoing API Costs
- No change: $839/month
- Revenue: 10+ agencies @ $500-5,000/month = **$5,000-50,000/month**

---

## Grand Summary

### Total Development Effort
- **Phase 0:** 1 hour
- **Phase 1 (A+B+C):** 333 hours (7-8 weeks)
- **Phase 2 (A+B+C+D):** 383 hours (6-7 months)
- **Total:** 717 hours

### Timeline to Revenue
- **Week 3:** Launch Core MVP, begin testing
- **Week 5:** Launch content features, **start charging $99-199/month**
- **Week 7:** Launch video, **upgrade tier to $399/month**
- **Month 2:** Admin & billing ready, **scale customer base**
- **Month 3:** White-label ready, **onboard agencies at $500-5,000/month**

### Monthly API Costs by Phase
- **Phase 1A:** $275/month (breakeven: 3 customers @ $99)
- **Phase 1B:** $365/month (breakeven: 2 customers @ $199)
- **Phase 1C:** $665/month (breakeven: 2 customers @ $399)
- **Phase 2A:** $690/month
- **Phase 2B:** $690/month (agencies pay wholesale)
- **Phase 2C:** $839/month
- **Phase 2D:** $839/month

### Revenue Projections
- **Month 1:** $0 (building)
- **Month 2:** $1,000-2,000 (10-20 customers @ $99)
- **Month 3:** $3,000-6,000 (20-30 customers @ $99-199)
- **Month 4:** $10,000-15,000 (agencies join)
- **Month 6:** $25,000-75,000 (agencies scale + SMB base)

### Competitive Advantages Per Phase
**Phase 1A:** Intelligence-driven campaigns (no competitor has 20+ sources) + Brand Voice Matching + Smart Picks/Content Mixer (user control over data)
**Phase 1B:** Complete content funnel (awareness → capture)
**Phase 1C:** Only platform with intelligence + content + video
**Phase 2A:** Professional operations (scale confidence)
**Phase 2B:** B2B2B model (agencies resell)
**Phase 2C:** Viral growth engine (LinkedIn) + AI automation
**Phase 2D:** Enterprise-ready (custom domains, full white-label)

### Key Metrics
- **Fastest to revenue:** 5 weeks (vs 6 weeks old plan)
- **Cheapest MVP:** $275/month (vs $915/month old plan)
- **More parallel opportunities:** 4-5 simultaneous worktrees per phase
- **Better risk management:** Test core value before building more
- **Clearer priorities:** Each phase = working product

---

## Worktree Cleanup Required

**Before starting new worktrees, remove old ones:**
```bash
# Check status
git worktree list

# Remove if clean (code already merged)
git worktree remove /Users/byronhudson/Projects/synapse-auth
git worktree remove /Users/byronhudson/Projects/Synapse-backend --force
git worktree remove /Users/byronhudson/Projects/Synapse-calendar
git worktree remove /Users/byronhudson/Projects/Synapse-social
git worktree remove /Users/byronhudson/Projects/Synapse-ui

# Delete merged branches
git branch -d feature/authentication
git branch -d feature/backend-services
git branch -d feature/calendar-integration
git branch -d feature/socialpilot
git branch -d feature/ui-enhancements
```

---

*Last Updated: 2025-11-15*
*This phased approach prioritizes speed to revenue, risk management, and incremental value delivery.*
