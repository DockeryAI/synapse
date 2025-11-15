# Synapse SMB Platform - Master Roadmap

**Last Updated:** 2025-11-15
**Current Status:** MVP Development Phase

---

## Product Vision

**Synapse SMB Platform** is an AI-powered content intelligence platform that transforms business data into strategic, data-driven content campaigns. It uses 20+ data sources to generate hyper-targeted campaigns in minutes, not hours.

**Dual Business Model:**
1. **Direct-to-SMB:** Sell platform directly to small/medium businesses
2. **Agency Partnerships:** White-label platform for marketing agencies (Phase 2)

---

## Development Phases

### **Phase 0: Authentication** (CURRENT - 1 hour remaining)
**Status:** 80% Complete
**Timeline:** 1 hour to finish
**Blocking:** All other features

**What's Done:**
- ✅ All authentication code written (services, pages, components)
- ✅ Admin dashboard & user session viewer built
- ✅ Database migration file ready

**What Remains:**
- Apply database migration to Supabase
- Create admin user (admin@dockeryai.com / admin123)
- Uncomment auth code in App.tsx
- Test authentication flow

**See:** `.buildrunner/AUTHENTICATION_STATUS.md`

---

### **RESTRUCTURED: Phased Rollout Strategy**

**See `.buildrunner/PHASED_FEATURE_SUMMARY.md` for complete breakdown**

### **Phase 1A: Core MVP** - Weeks 1-3
**Total Effort:** 150 hours (3 weeks with parallel worktrees)
**Status:** Ready to build
**Goal:** Launch intelligent campaign generation

#### Core Features (12 total)

**Foundation:**
- Universal URL Parser
- Database Schema (15+ tables)

**Intelligence Gathering:**
- Global Location Detection
- Parallel Intelligence Gathering (8 APIs)
- Social Media Intelligence (YouTube + scraping)
- Deep Specialty Detection

**UVP & Profiles:**
- Dynamic Industry Profile Generation
- Product/Service Scanner
- **Intelligence-Driven UVP Wizard 2.0** 🆕 (auto-discovers from 20+ sources, pattern recognition)
- Business Profile Management

**Campaign Engine:**
- Bannerbear Template System
- Basic Competitive Intelligence
- AI Campaign Generator (3 campaign types: Authority Builder, Social Proof, Local Pulse)

**API Cost:** $275/month | **Breakeven:** 3 customers @ $99/month

---

### **Phase 1B: Content Marketing** - Weeks 4-5
**Total Effort:** 80 hours (2 weeks with parallel worktrees)
**Goal:** Complete content funnel

#### Features (4 total)

- Blog Article Expander & Newsletter Builder
- Landing Pages & Lead Capture (5 templates)
- **SEO Intelligence & Optimizer** 🆕 (Real-time scoring, local SEO, quick wins)
- **Perplexity Local Intelligence** 🆕 (enhanced local events)

**API Cost:** $365/month | **Breakeven:** 2 customers @ $199/month

---

### **Phase 1C: Video Capabilities** - Weeks 6-7
**Total Effort:** 70 hours (2 weeks with parallel worktrees)
**Goal:** Multi-platform video editing

#### Features (2 total)

- **Multi-Platform Video Editor** 🆕 (TikTok/Instagram capabilities, browser-based)
- **Platform Auto-Formatting** 🆕 (9:16, 16:9, 1:1, 4:5 - 7 platforms)

**API Cost:** $665/month | **Breakeven:** 2 customers @ $399/month

---

#### Campaign Types Across Phases

**Phase 1A (3 types):**
1. **Authority Builder** - Industry expertise (DeepContext + YouTube)
2. **Social Proof** - Build trust (Reviews + Testimonials)
3. **Local Pulse** - Basic local content (Location + Weather)

**Phase 1B (Enhanced):**
4. **Competitor Crusher** 🆕 - Stand out (Competitive Intelligence + SEMrush gaps)

**Phase 2C (LinkedIn):**
5. **LinkedIn Campaigns** - Thought Leader, Client Win, Trend Hijacker, Data Drop

**AI Suggestion Logic:** Automatically recommends best campaign type based on business type, location, and goals.

**See:** `.buildrunner/PHASED_FEATURE_SUMMARY.md` and `.buildrunner/CAMPAIGN_INTELLIGENCE_PLAN.md`

---

### **Phase 2A: Admin & Revenue** - Month 2
**Total Effort:** 90 hours (1 month with parallel development)
**Status:** Planned
**Goal:** Scale operations professionally + Start billing

#### Features (6 total)
- Admin Dashboard (user management, impersonation, filtering)
- API Usage Tracking & Cost Monitoring
- Stripe Billing Integration
- Content Moderation Queue
- Platform Analytics Dashboard
- System Health Monitoring

**API Cost:** $690/month | **Goal:** Scale SMB customer base

---

### **Phase 2B: White-Label MVP** - Month 3
**Total Effort:** 54 hours (1 month with parallel development)
**Status:** Planned
**Goal:** Enable B2B2B model through agency partnerships

#### Features (5 total)
- Multi-Tenant Data Model & RLS
- Agency Hierarchy (Platform → Agency → Clients)
- Basic Branding (logo, colors)
- Subdomain Support (agency.synapse.com)
- Usage Limit Management (cascading)

**API Cost:** $690/month | **Revenue:** 5-10 agencies @ $500-5,000/month

---

### **Phase 2C: Growth & Automation** - Months 4-5
**Total Effort:** 140 hours (2 months with parallel development)
**Status:** Planned
**Goal:** Viral growth + AI automation

#### Features (8 total)
- LinkedIn Influence Analyzer (viral tool)
- 4 LinkedIn Campaign Types
- LinkedIn Optimizer & Pod Management
- AI Video Auto-Editor (highlight detection, scene cutting, multi-version)
- Content Refresh Engine
- Backlink Opportunity Finder
- Technical SEO Monitor

**API Cost:** $839/month | **Revenue:** LinkedIn Premium $299, Studio $499

---

### **Phase 2D: Full Platform** - Months 6-7
**Total Effort:** 99 hours (2 months with parallel development)
**Status:** Planned
**Goal:** Enterprise-ready platform

#### Features (7 total)
- Custom Domain Mapping
- Complete UI Theming
- Agency Billing & Revenue Sharing
- Feature Flags & Controls
- Agency Analytics Dashboard
- AI Newsletter Curator
- Lead Intelligence System

**API Cost:** $839/month | **Revenue:** 10+ agencies @ $500-5,000/month

---

## Original Phase 2 Details (Reference)

**Total Phase 2 Effort:** 383 hours (restructured into 4 phases above)

#### Track A: Admin Foundation (Month 1, 46 hours)
- Comprehensive admin dashboard
- User management & impersonation
- API usage tracking & cost monitoring
- Stripe billing integration
- System health monitoring
- **🔒 Security basics:** Edge Function API proxy, rate limiting, Redis caching, JWT hardening

#### Track B: Advanced Admin (Month 2, 44 hours)
- Content moderation queue
- Financial control center (refunds, coupons, MRR tracking)
- Platform analytics (CAC, LTV, churn analysis)
- Intelligence data management
- Bulk operations
- **🔒 Advanced security:** MFA, session fingerprinting, code obfuscation, API response normalization

#### Track C: White-Label MVP (Month 3, 54 hours)
- Multi-tenant architecture & data isolation
- Agency hierarchy (Platform → Agency → Clients)
- Basic branding (logo, colors)
- Subdomain support (agency.synapse.com)
- Usage limit management
- **🔒 Production hardening:** APM, security audit, load testing, incident response

#### Track D: Full White-Label (Month 4, 58 hours)
- Custom domain mapping (app.agencyname.com)
- Complete UI theming (fonts, layouts, emails)
- Agency billing & revenue sharing
- Feature flags & controls
- Agency analytics dashboard

#### Track G: LinkedIn Growth Engine (Month 4, 34 hours) 🆕
- LinkedIn Influence Analyzer (free viral tool)
- 4 LinkedIn campaign types (Thought Leader, Client Win, Trend Hijacker, Data Drop)
- LinkedIn optimizer (auto-format for algorithm)
- Pod management system (engagement coordination)
- Connection automation (personalized outreach)
- **🎯 Goal:** Turn LinkedIn into primary viral growth channel

#### Track H: AI Video Auto-Editor (Month 5, 60 hours) 🆕
- AI highlight detection (find best moments)
- Scene detection & auto-cutting (remove dead space)
- Audio analysis & optimization (beat drops, silence removal)
- Multi-version generation (60s, 30s, 15s from raw footage)
- **🎯 Goal:** Upload raw video → AI creates optimized multi-platform versions

#### Track I: Content Intelligence & Automation (Month 3, 90 hours) 🆕
- AI newsletter curator (auto-select top posts, personalization)
- Blog automation suite (series generator, internal linking, FAQ auto-gen)
- Landing page optimization (dynamic content, exit-intent, multi-step forms, A/B testing)
- Lead intelligence system (scoring, company ID, auto-enrichment, CRM webhooks)
- **🎯 Goal:** Automate full content marketing funnel (create → capture → nurture)

#### Track J: SEO Automation & Advanced Features (Month 4, 50 hours) 🆕
- Content refresh engine (auto-detect outdated content, track ranking changes)
- Backlink opportunity finder (unlinked mentions, broken links, competitor backlinks)
- Technical SEO monitor (site speed, broken links, mobile usability, Core Web Vitals)
- Topic cluster generator (pillar pages + cluster content, internal linking automation)
- **🎯 Goal:** Drive long-term organic growth, reduce reliance on paid ads

**Business Model:**
- Agencies buy wholesale (30-50% discount)
- Agencies resell at their pricing
- You provide platform, they handle sales/support
- Scalable B2B2B growth

**Security & Scalability (Track E - Interwoven):**
- **IP Protection:** Edge Functions hide all third-party APIs, response normalization, code obfuscation
- **Scalability:** Multi-layer caching (CDN → Redis → DB), read replicas, connection pooling, auto-scaling
- **Monitoring:** APM (DataDog), error tracking (Sentry), audit logging, incident response
- **Enterprise Security:** MFA for agencies, session fingerprinting, penetration testing, OWASP compliance

**See:** `.buildrunner/PHASE_2_PLAN.md`

---

### **Future Phases (Post-Phase 2)**

#### Phase 3: Visual & Social Intelligence (Weeks 6-8)
**New Campaign Types:**
- **Viral Visual Campaign** (Instagram Scraper + trending analysis)
- **Video Authority Campaign** (Enhanced YouTube analysis)

**New Data Sources:**
- Apify Instagram Scraper
- Enhanced YouTube comment analysis
- Visual trend detection

#### Phase 4: Hyper-Personalized Campaigns (Months 3-4)
**New Campaign Types:**
- **FAQ Dominator** (Website FAQs + Google Maps Q&A)
- **Seasonal Surge** (Historical data + events + weather)
- **Crisis Response** (News + sentiment + review monitoring)

**New Data Sources:**
- Apify Website Crawler (deep site analysis)
- Apify Google Maps Scraper (Q&A mining)
- Full SEMrush suite integration

#### Phase 5: AI Campaign Strategist (Month 5+)
**Features:**
- Performance-based campaign switching
- Multi-campaign orchestration (run 2-3 types simultaneously)
- Predictive success modeling
- Proactive campaign suggestions
- Automated optimization

**Intelligence Layer:**
- Learn from all user campaigns
- Benchmark performance across industries
- Seasonal pattern detection
- Competitive trend analysis

---

## Technology Stack

### Core Platform
- **Frontend:** React 18.3.1, TypeScript 5.2.2, Vite 5.0.8, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment:** Netlify (frontend), Supabase (backend)
- **Version Control:** Git with worktree strategy for parallel development

### Intelligence APIs (20+ sources)
- **AI:** OpenRouter (Claude Opus 4.1)
- **Search:** Serper, Perplexity 🆕
- **Social:** YouTube Data API, Apify (Instagram, Facebook, Twitter)
- **Business:** OutScraper (reviews), SEMrush (SEO + enhanced), Website Analyzer
- **Data:** Weather API, News API, Reddit API
- **Competitive:** Competitive Intelligence Service (existing)
- **Visual:** Bannerbear (template generation)
- **Video:** FFmpeg, Remotion, Whisper (all free/open-source) 🆕
- **SEO:** SEMrush (Keyword Magic Tool, Keyword Difficulty, Rankings, Topic Research, SEO Content Template, Local Pack Tracker, Backlink Analytics) 🆕
- **Publishing:** SocialPilot (scheduling & metadata)

### Multi-Tenancy & Infrastructure (Phase 2)
- **Architecture:** Shared database, logical isolation via RLS
- **Domains:** Wildcard subdomains + custom domain mapping
- **SSL:** Automatic Let's Encrypt certificates
- **Billing:** Stripe for subscriptions & usage-based billing
- **Caching:** Redis (Upstash) for sessions & API responses, CDN (CloudFlare) for global distribution
- **Security:** Edge Functions as API proxy, JWT with 15-min expiry, MFA for agencies
- **Monitoring:** APM (DataDog/New Relic), error tracking (Sentry), uptime monitoring
- **Scalability:** Database read replicas, connection pooling (PgBouncer), auto-scaling Edge Functions

---

## Business Metrics & Goals

### MVP Success Metrics
- Time to first campaign: <5 minutes
- Campaign generation success rate: >95%
- User activation (created first campaign): >80%
- Content publishing rate: >60% of generated content
- User retention (30-day): >70%

### Phase 2 Success Metrics
- Agencies onboarded: 5+ in first 3 months
- Average clients per agency: 10+
- Agency revenue as % of total: 30%+
- Agency churn rate: <5% monthly
- Support tickets from agencies: <10% of total

### Financial Targets
**Direct Sales (MVP):**
- $99-199/month per SMB
- Target: 50 customers in Month 1
- MRR Goal: $7,500 by Month 3

**Agency Partnerships (Phase 2):**
- $500-5,000/month per agency (wholesale)
- Agencies resell at 2-3x markup
- Target: 10 agencies by Month 6
- Additional MRR: $15,000+ by Month 6

---

## Implementation Strategy

### Parallel Development with Git Worktrees

**Concept:** Multiple Claude instances work simultaneously on different features in separate worktrees, then merge back to main.

**Week 1 Example:**
```bash
git worktree add ../synapse-location feature/location-detection
git worktree add ../synapse-intelligence feature/intelligence-gatherer
git worktree add ../synapse-industry feature/industry-autogen
git worktree add ../synapse-buyer-journey feature/buyer-journey-fix
```

Each worktree is independent, can be worked on in parallel, and merged when complete.

**Benefits:**
- 4x development speed (4 features built simultaneously)
- No merge conflicts (different files)
- Each feature is atomic and complete
- Easy rollback if needed

**Task Files:** All worktree task files in `.buildrunner/worktrees/` contain complete implementation guides ready for Claude instances.

---

## Key Documentation

### Planning & Architecture
- **BUILD_PLAN.md** - Master build plan with all phases
- **PHASE_2_PLAN.md** - Admin panel & white-label architecture
- **CAMPAIGN_INTELLIGENCE_PLAN.md** - Campaign strategy & user experience
- **AUTHENTICATION_STATUS.md** - Auth implementation status

### Feature Specifications
- **features.json** - Complete feature registry (24 MVP features)
- **STATUS.md** - Auto-generated project status
- **UPDATES_SUMMARY.md** - Recent changes and updates

### Worktree Task Files (16 files)
- `worktree-authentication.md` (80% complete)
- `worktree-foundation.md` (URL parser + database)
- `worktree-location-detection.md`
- `worktree-intelligence-gatherer.md`
- `worktree-specialty-detection.md`
- `worktree-industry-autogen.md`
- `worktree-product-scanner-uvp.md`
- `worktree-social-analyzer.md`
- `worktree-perplexity-local.md` 🆕
- `worktree-competitive-integration.md` 🆕
- `worktree-bannerbear.md`
- `worktree-profile-management.md`
- `worktree-campaign-generator.md`
- `worktree-buyer-journey-fix.md`
- (More as needed)

---

## Competitive Advantages

### MVP Differentiators
1. **4 Strategic Campaign Types** - Not just "social media posts", but goal-oriented campaigns
2. **Perplexity Local Intelligence** - Real-time local events (unique in market)
3. **Competitive Intelligence** - Automated gap analysis (no competitor has this)
4. **20+ Data Sources** - Deepest intelligence gathering in the market
5. **AI Campaign Suggestions** - Platform tells you what campaign type to run
6. **YouTube Integration** - Repurpose video content for social (unique)
7. **Multi-Platform Video Editor** 🆕 - TikTok/Instagram capabilities + auto-formatting for all platforms (9:16, 16:9, 1:1, 4:5)
8. **Full Content Funnel** 🆕 - Newsletter/blog generator + landing pages + lead capture (complete marketing stack)
9. **Content Repurposing** 🆕 - One campaign → social posts + blog article + newsletter + landing page
10. **Real-Time SEO Intelligence** 🆕 - Auto-optimize all content for search, local SEO, quick wins (page 2→page 1)
11. **Intelligence-Driven UVP Wizard** 🆕 - Auto-discovers business intelligence from 20+ sources, 5 minutes vs 20+ (validation vs creation)

### LinkedIn Growth Differentiators (Phase 2) 🆕
1. **LinkedIn Intelligence** - No competitor analyzes LinkedIn authority or content gaps
2. **Influencer Army** - Free viral tool turns influencers into unpaid marketing force
3. **B2B Targeting** - Serves exact audience who can afford premium pricing ($299-2,000/mo)
4. **Speed to Post** - Trend → published post in 10 minutes (competitors take hours)
5. **Network Effects** - Pod system makes users market to each other
6. **Zero Additional API Costs** - Built entirely on existing infrastructure

### Phase 2 Differentiators
1. **True White-Label** - Not just logo swapping, complete rebrand
2. **Agency Analytics** - Comprehensive performance tracking per agency
3. **Multi-Tenant Architecture** - Enterprise-grade data isolation
4. **Revenue Sharing Built-In** - Automatic commission tracking
5. **Hierarchical Limits** - Cascade usage limits from platform → agency → client
6. **AI Video Auto-Editor** 🆕 - Upload raw footage → AI creates multiple optimized versions (only platform with this)

---

## Next Steps

### Immediate (This Week)
1. **Finish Phase 0:** Enable authentication (1 hour)
   - Apply database migration
   - Create admin user
   - Uncomment auth in App.tsx
   - Test

2. **Start MVP Builds:** Kick off parallel worktrees
   - Assign 4 Claude instances to Week 1 features
   - Monitor progress
   - Merge completed features

### Month 1
- Complete MVP foundation features
- Begin campaign system features
- First test campaign generation
- User testing with 5-10 early adopters

### Month 2
- Complete MVP
- Launch to first paying customers
- Begin Phase 2 planning refinement
- Start admin foundation work

### Months 3-5
- Build Phase 2 in parallel tracks (Admin + White-Label + Security)
- Onboard first agency partners
- Launch LinkedIn Growth Engine (Month 4)
- Influencer infiltration campaign (50 LinkedIn influencers)
- Authority Challenge (Month 5)
- Scale to 50+ SMB customers + 5+ agencies
- LinkedIn becomes primary viral growth channel

---

## Risk Mitigation

### Technical Risks
- **API Costs:** Monitor spending, implement aggressive caching (7-day industry profiles), rate limit per tier
- **Performance:** Multi-layer caching (CDN → Redis → DB), read replicas, connection pooling (PgBouncer)
- **Security:** Edge Function API proxy (hide APIs), MFA for agencies, penetration testing, OWASP compliance
- **Scalability:** Auto-scaling Edge Functions, graceful degradation, load testing (1000+ concurrent users)
- **IP Protection:** Code obfuscation, response normalization, legal ToS protection, API key revocation

### Business Risks
- **Market Fit:** Early user testing, rapid iteration on campaign types
- **Agency Adoption:** Clear value prop, strong onboarding, success guarantees
- **Support Burden:** Comprehensive docs, self-service tools, agency support tiers
- **Competition:** Move fast, unique data sources (Perplexity), deep intelligence

### Operational Risks
- **Development Speed:** Parallel worktrees, clear task files, multiple Claude instances
- **Quality:** Testing frameworks, user acceptance testing, gradual rollout
- **Data Quality:** Content moderation, AI hallucination detection, manual review workflows
- **Compliance:** GDPR prep, SOC 2 for enterprise agencies, data processing agreements

---

*This roadmap provides a clear path from MVP to scalable B2B2B platform with agency partnerships, enabling both direct sales and white-label reselling for maximum market penetration.*
