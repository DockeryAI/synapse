# SYNAPSE - Product Requirements Document

**Version:** 1.1.0
**Status:** Active Development
**Last Updated:** 2025-12-02
**Document Type:** Industry Best Practices PRD

---

## Executive Summary

Synapse transforms 3-minute onboarding into weeks of psychology-scored, AI-powered content that converts—giving SMBs and agencies enterprise-grade marketing intelligence without the enterprise price tag.

---

## Problem Statement

### Current Pain
SMBs and marketing agencies face an impossible tradeoff:
- **Expensive agencies:** $5,000-$20,000/month retainers for quality content
- **Time-intensive DIY:** 10+ hours/week researching, writing, and optimizing
- **Generic AI tools:** Produce low-converting, psychology-ignorant content

### Why Existing Solutions Fail
| Solution | Problem |
|----------|---------|
| Traditional agencies | Too expensive for SMBs, slow 2-week turnaround |
| Generic AI (ChatGPT, Jasper) | No psychology understanding, no business intelligence |
| DIY approach | Time-consuming, requires marketing expertise most SMBs lack |
| Social scheduling tools | Handle distribution, not creation |

### The Gap Synapse Fills
Enterprise-grade marketing intelligence (20+ data sources) + psychology-first AI content generation (6-dimension scoring) at SMB-accessible pricing. The only platform that understands *why* content converts, not just *what* to post.

---

## Out of Scope (v1.x)

To maintain focus and ship fast, the following are explicitly **NOT** in scope:

| Feature | Reason | Future Release |
|---------|--------|----------------|
| ❌ Mobile app | Desktop-first for content creation | 2.2 |
| ❌ Direct social publishing | Using SocialPilot integration | - |
| ❌ CRM integration | Focus on content, not lead management | 2.0+ |
| ❌ Multi-language support | English-first for quality | 2.1+ |
| ❌ Custom AI model training | Using proven Claude models | 3.0+ |
| ❌ Influencer management | Different product category | Never |
| ❌ Paid ad management | Using Bannerbear for creative only | 2.0+ |

---

## User Stories

### SMB Owner (Primary)
> "When I need consistent social media content but can't afford an agency, I want to generate 4 weeks of psychology-optimized posts in 3 minutes, so I can maintain professional social presence without hiring or spending hours writing."

### Marketing Agency (Primary)
> "When I'm managing 15+ clients with limited staff, I want to white-label AI content generation with my branding, so I can scale output without proportionally scaling headcount."

### Solopreneur (Secondary)
> "When I'm time-constrained running my business solo, I want one-click campaign generation that auto-selects the best insights, so I don't have to manually research and curate content every week."

### Agency Client (End User)
> "When my agency delivers content for approval, I want to see why each post is predicted to perform well, so I understand the strategy and can provide informed feedback."

---

## Product Vision

### Mission
Democratize enterprise-grade marketing intelligence for SMBs and agencies through AI-powered content generation that understands business psychology, not just keywords.

### Target Users
1. **SMB Owners** - Need professional content without hiring agencies
2. **Marketing Agencies** - White-label solution for client content at scale
3. **Solopreneurs** - Time-constrained professionals who need quality output

### Success Metrics
| Metric | Target |
|--------|--------|
| Onboarding completion time | < 5 minutes |
| Content generation time | < 3 seconds |
| Average Synapse Score | ≥ 78/100 |
| Quality gate pass rate | > 80% |
| User retention (30-day) | > 40% |

---

## Architecture Overview

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| AI/LLM | OpenRouter (Claude 3.5 Sonnet/Haiku), Anthropic API |
| Intelligence APIs | Apify, Serper, OutScraper, BuzzSumo, SEC Edgar, Perplexity, SEMrush, YouTube Data API |
| Deployment | Netlify (frontend), Supabase (backend) |
| Integrations | SocialPilot (scheduling), Bannerbear (templates) |

### Core Philosophy
**"Templates first, AI enhances, psychology gates."**

1. Templates are guardrails, not suggestions
2. Intelligence informs selection, not prompt stuffing
3. Quality is gated at 75+, not hoped for
4. Constraints produce creativity (500 tokens, 0.7 temp)
5. One insight per source, never data dumps

---

# MVP (v1.0) - COMPLETE

## What's Built and Working

### 1. V5 Content Generation Engine

**Status:** ✅ COMPLETE (2025-12-01)

The V5 engine is the production content generation system replacing V4.

#### Core Services
| Service | File | Purpose |
|---------|------|---------|
| Industry Profile | `src/services/v5/industry-profile.service.ts` | Loads psychology from 380 NAICS profiles |
| UVP Provider | `src/services/v5/uvp-provider.service.ts` | Extracts template variables from brand data |
| EQ Integration | `src/services/v5/eq-integration.service.ts` | Maps EQ scores to 6 customer categories |
| Template Service | `src/services/v5/template.service.ts` | Selects/populates templates by category + platform |
| AI Enhancer | `src/services/v5/ai-enhancer.service.ts` | Constrained AI enhancement (500 tokens, 0.7 temp) |
| Synapse Scorer | `src/services/v5/synapse-scorer.service.ts` | 6-dimension psychology scoring |
| Intelligence Service | `src/services/v5/intelligence.service.ts` | ONE insight per source extraction |
| Embeddings Service | `src/services/v5/embeddings.service.ts` | Content deduplication via semantic similarity |
| Content Orchestrator | `src/services/v5/content-orchestrator.ts` | Full pipeline orchestration |

#### 6-Dimension Psychology Scoring
| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| Power Words | 20% | Industry-specific compelling language |
| Emotional Triggers | 25% | Customer category alignment |
| Readability | 20% | Flesch-Kincaid comprehension ease |
| Call-to-Action | 15% | CTA presence, clarity, strength |
| Urgency | 10% | Time-sensitive drivers |
| Trust | 10% | Credibility signals |

#### 6 Customer Categories
1. **Pain-Driven** - Immediate problem needing solution
2. **Aspiration-Driven** - Desire for transformation/status
3. **Trust-Seeking** - Need validation before commitment
4. **Convenience-Driven** - Path of least resistance
5. **Value-Driven** - ROI and outcome focus
6. **Community-Driven** - Belonging and shared identity

#### Quality Tiers
| Score | Tier | Action |
|-------|------|--------|
| 85+ | Excellent | Accept immediately |
| 75-84 | Great | Accept |
| 65-74 | Good | Accept with note |
| 50-64 | Fair | Retry with hints |
| <50 | Poor | Retry with different template |

---

### 2. V5 React Hooks

**Status:** ✅ COMPLETE

| Hook | File | Purpose |
|------|------|---------|
| useV5ContentGeneration | `src/hooks/useV5ContentGeneration.ts` | Base generation hook |
| useV5PowerModeGeneration | `src/hooks/useV5PowerModeGeneration.ts` | 7-tab insight mapping |
| useV5EasyModeGeneration | `src/hooks/useV5EasyModeGeneration.ts` | Auto-context one-click generation |
| useV5CampaignGeneration | `src/hooks/useV5CampaignGeneration.ts` | Multi-week campaign generation |
| useV5LivePreview | `src/hooks/useV5LivePreview.ts` | Debounced preview with suggestions |

---

### 3. V5 UI Components

**Status:** ✅ COMPLETE

| Component | File | Purpose |
|-----------|------|---------|
| V5ContentPanel | `src/components/v5/V5ContentPanel.tsx` | Main generation interface |
| ScoreDisplay | `src/components/v5/ScoreDisplay.tsx` | 6-dimension score visualization |
| ScoreDisplayPanel | `src/components/v5/ScoreDisplayPanel.tsx` | Detailed score breakdown |
| QualityBadge | `src/components/v5/QualityBadge.tsx` | Quality tier badges |
| ContentCard | `src/components/v5/ContentCard.tsx` | Content preview cards |
| WhyThisWorksTooltip | `src/components/v5/WhyThisWorksTooltip.tsx` | Generation explanation |
| CustomerCategoryPreview | `src/components/v5/CustomerCategoryPreview.tsx` | Auto-detected category display |
| CampaignPreviewModal | `src/components/v5/CampaignPreviewModal.tsx` | Campaign preview before save |
| FrameworkComparisonPanel | `src/components/v5/FrameworkComparisonPanel.tsx` | A/B framework testing |
| YourMixPreview | `src/components/v5/YourMixPreview.tsx` | Selected insights preview |

---

### 4. Dashboard Integration

**Status:** ✅ COMPLETE (2025-12-01)

#### Power Mode (V4PowerModePanel)
- 7 data tabs: Triggers, Proof, Trends, Competitors, Local, Weather, Conversations
- Full insight selection with compatibility checking
- UVP sidebar with DeepContext integration
- V5 generation wired to all insight selections
- Score display panel after generation
- "Why This Works" tooltip explaining decisions
- Customer category preview
- Framework comparison panel

#### Easy Mode (EasyMode.tsx)
- One-click `generateFullCampaign()` - 4 weeks of content
- `generateQuickPost()` - single post with full context
- Auto-selects insights (AI chooses best)
- Fixed content mix: 40% educational, 35% promotional, 15% community, 5% authority, 5% engagement
- Campaign preview modal before save
- Save to Calendar integration

#### Mode Toggle
- Easy/Power mode toggle in IntelligenceLibraryV2
- localStorage persistence (`intelligence_library_mode` key)
- Shared DeepContext between modes (no re-fetch)

---

### 5. Triggers 3.0 - SMB Signal Intelligence

**Status:** ✅ COMPLETE (2025-12-01)

Enterprise-grade buying signal detection optimized for SMB markets.

#### Foundation Services
| Service | Purpose |
|---------|---------|
| Recency Calculator | Exponential decay weighting (0-14 days = 100%, 60+ = 25%) |
| Confidence Scorer | Signal Quality × Recency × Source Count × Attribution |
| Competitor Attribution | Fuzzy matching for brand name variations |
| Trigger Title Generator | Semantic titles replacing generic "growth opportunity" |

#### SMB Signal Pipeline
| Service | Purpose |
|---------|---------|
| Reddit SMB Analyzer | Community discussion pattern detection |
| Review Aggregator | Multi-platform review sentiment |
| SMB Classifier | Company size estimation (solo/small/growing) |
| Urgency Detector | Buying urgency classification |

#### Profile-Specific Pipelines
| Profile | Primary Signals |
|---------|-----------------|
| Local Service B2B | Google Reviews, LinkedIn jobs, Yelp |
| Local Service B2C | Google Reviews, Nextdoor, life events |
| Regional B2B Agency | Reddit, LinkedIn, G2/Clutch |
| Regional Retail | Franchise communities, multi-location patterns |
| National SaaS B2B | G2, Capterra, churn discussions |
| National Product B2C | Reddit, Amazon sentiment, social mentions |

#### Enterprise ABM Layer
| Service | Purpose |
|---------|---------|
| Signal Stacker | Multi-source correlation engine |
| Surge Detector | Anomaly detection (2+ std dev) |
| Buying Stage Classifier | Research → Evaluation → Decision → Post-purchase |

#### Signal Quality Hierarchy
| Tier | Signal Type | Weight |
|------|-------------|--------|
| Tier 1 | Direct competitor mentions + pain point | 1.0 |
| Tier 2 | Category research + negative sentiment | 0.8 |
| Tier 3 | Feature comparison questions | 0.6 |
| Tier 4 | General category browsing | 0.4 |
| Tier 5 | Noise (filtered out) | 0.0 |

---

### 6. Synapse 2.0 - Multi-Source Intelligence

**Status:** ✅ COMPLETE (2025-12-01)

#### New Data Sources Integrated
| Source | Purpose |
|--------|---------|
| SEC Edgar | Mine filings for industry pain points |
| BuzzSumo | Content performance + trending topics |
| VOC Extraction | Customer voice patterns from reviews |
| Semantic Gap Detection | Unnamed pain points discovery |

#### Angle Discovery System (7 Methods)
1. Executive-voice - SEC Edgar insights
2. Performance-pattern - BuzzSumo insights
3. Competitor-gap - Content gaps
4. Customer-voice - VOC extraction
5. Semantic-gap - Unnamed pain points
6. Trend-timing - Lifecycle calculation
7. Social-proof - Review aggregation

#### BuzzSumo Integration
- Replaced Google Trends for velocity data
- Top headline patterns for content generation
- Optimal word count guidance
- Best publish days recommendations
- Performance by format selection

---

### 7. Keywords 2.0 - Intent-Based SEO

**Status:** ✅ COMPLETE (2025-11-30)

#### Keyword Extraction Service
- Meta tags, title, H1s, OG tags, schema data
- Weight by source priority (meta=10, title=9, h1=8)
- 1-hour localStorage cache

#### SEMrush Validation
- Search volume, difficulty, position
- Merges intent keywords with ranking keywords
- Cache-first loading

#### Sidebar Integration
- Search volume badges on keyword chips
- Green highlight for currently ranking keywords
- Summary stats (total monthly searches, ranking count)

---

### 8. 380 Industry Profiles

**Status:** ✅ COMPLETE

NAICS-classified profiles with psychology data:
- Power words (weighted by effectiveness)
- Hooks (numbered questions, stories, curiosity, authority)
- Transformations (before/after narratives)
- Customer triggers (urgency-ranked)
- Content templates (per platform + type)
- Avoid words

---

### 9. 50 Universal Templates

**Status:** ✅ COMPLETE

#### Platform Distribution
| Platform | Count |
|----------|-------|
| LinkedIn | 14 |
| Facebook | 10 |
| Instagram | 9 |
| Twitter | 9 |
| TikTok | 8 |

#### Category Coverage
| Category | Count |
|----------|-------|
| Pain-driven | 16 |
| Aspiration-driven | 13 |
| Trust-seeking | 17 |
| Convenience-driven | 13 |
| Value-driven | 22 |
| Community-driven | 12 |

#### Template Structures
- Authority, list, announcement, offer, transformation, FAQ, storytelling, testimonial

---

### 10. EQ Calculator v2.0

**Status:** ✅ COMPLETE

Emotional intelligence scoring system that maps to customer categories:

| EQ Score | Customer Category |
|----------|-------------------|
| 0-20 (Highly Rational) | Value-driven |
| 20-40 (Rational) | Trust-seeking |
| 40-60 (Balanced) | Pain-driven or Aspiration-driven |
| 60-80 (Emotional) | Aspiration-driven |
| 80-100 (Highly Emotional) | Community-driven |

---

### 11. Content Calendar Integration

**Status:** ✅ COMPLETE

- Schedule content by date/platform
- Campaign-to-calendar flow
- Optimal posting time calculation
- Batch scheduling support

---

### 12. SocialPilot Integration

**Status:** ✅ COMPLETE

- API integration for auto-scheduling
- Platform mapping (LinkedIn, Facebook, Instagram, Twitter)
- Bulk scheduling support

---

### 13. Streaming Architecture

**Status:** ✅ COMPLETE

EventEmitter-based progressive loading system:
- `StreamingApiManager` - Coordinates parallel API calls
- Early trigger loading - Start as soon as brandId available
- Graceful degradation - Missing sources don't crash
- Cache-first approach - Show cached immediately, stream fresh

---

### 14. UVP/MARBA Flow

**Status:** ✅ COMPLETE

6-step discovery wizard:
1. Product/Service Discovery
2. Target Customer Definition
3. Transformation Goal
4. Unique Solution
5. Key Benefit
6. UVP Synthesis

Auto-populated from intelligence gathering, user validates instead of writes.

---

### 15. Database Schema (160+ Tables)

**Status:** ✅ COMPLETE

Key tables:
- `brands` - User-owned business profiles
- `marba_uvps` - UVP data with all components
- `value_statements` - UVP variants by context
- `v4_generated_content` - All generated content
- `synapse_scores` - Psychology scoring (never shown to users)
- `industry_profiles` - 380 NAICS profiles
- `content_templates` - Psychology-optimized templates
- `intelligence_cache` - API response caching

---

# RELEASE 1.1 - Authentication & User Management

**Status:** PLANNED
**Priority:** CRITICAL
**Estimated Duration:** 3-4 weeks

## Features

### 1.1.1 User Authentication
- [ ] Email/password sign up and login
- [ ] Session persistence (7 days)
- [ ] Password reset flow
- [ ] Email verification
- [ ] Protected routes

### 1.1.2 User Profile Management
- [ ] Profile creation on signup
- [ ] Profile persistence per user
- [ ] Multi-device login support
- [ ] User preferences storage

### 1.1.3 Admin Access (Phase 0)
- [ ] Admin login (admin@dockeryai.com)
- [ ] View all user accounts
- [ ] Impersonate user sessions (read-only)
- [ ] Admin access audit logging

### 1.1.4 Row Level Security
- [ ] Enable RLS on all tables
- [ ] User-scoped data access
- [ ] Admin bypass policies

**Dependencies:** Supabase Auth (existing infrastructure)

**Files to Create/Modify:**
- Wire up existing `src/services/auth.service.ts`
- Wire up existing `src/services/admin.service.ts`
- Enable routes in `src/App.tsx` (currently commented)
- Create RLS migration for all tables

---

# RELEASE 1.2 - Admin Panel (4-Tier Hierarchy)

**Status:** PLANNED
**Priority:** CRITICAL
**Estimated Duration:** 15.5-21 weeks (full build) or 6.5 weeks (MVP)

**Full Plan:** `.buildrunner/SYNAPSE_ADMIN_BUILD_PLAN.md`

## Architecture

### 4-Tier Permission Model
| Role | Scope | Can Manage |
|------|-------|------------|
| Global Admin | Platform | Everything |
| Tenant Admin | Agency | Brands, users, billing |
| Brand Admin | Single Brand | Brand users, settings |
| User | Single Brand | Own content |

### Billing Model: Hybrid (Monthly + Per-Token)
```
Monthly Base: $X/month
├── Includes: Y users, Z brands, N content pieces
├── Token Allowance: 500K tokens/month
│
Overages:
├── Additional tokens: $0.002 per 1K tokens
├── Additional content: $0.10 per piece
└── Additional users: $10/user/month
```

## Phases

### Phase 1: Foundation (3-4 weeks)
- [ ] Tenant data model (`tenants` table, `tenant_id` on all tables)
- [ ] 4-tier role system (`user_roles` table)
- [ ] Brand membership (`brand_users` table)
- [ ] RLS policies for tenant + brand isolation
- [ ] Permission helpers (`canManageBrand()`, `canInviteUser()`)
- [ ] Basic admin layout

### Phase 2: Global Admin Core (2-3 weeks)
- [ ] Tenant management (CRUD, status, limits)
- [ ] User management (list, view, actions)
- [ ] Brand overview (all brands, industry distribution)
- [ ] Content moderation (global feed, filters, flag/archive)
- [ ] Admin audit trail
- [ ] Impersonation (view-as-tenant, view-as-brand)

### Phase 3: API Cost Tracking (2-3 weeks)
- [ ] API call logging (instrument all external calls)
- [ ] Token counting (per LLM call)
- [ ] Cost calculation (real-time estimation)
- [ ] Rollup aggregation (hourly/daily/monthly)
- [ ] Provider dashboard (cost by provider, health)
- [ ] Tenant/brand cost views
- [ ] Feature attribution

### Phase 4: Billing System (3-4 weeks)
- [ ] Stripe integration (Products, Prices, Subscriptions)
- [ ] Plan management (CRUD plans, quotas, features)
- [ ] Subscription flow (signup → trial → paid)
- [ ] Usage metering (push to Stripe)
- [ ] Invoice generation
- [ ] Webhook handlers
- [ ] Dunning flow
- [ ] Billing dashboard

### Phase 5: Tenant Admin (2-3 weeks)
- [ ] Tenant settings (name, branding, custom domain)
- [ ] White label branding (logo, colors, CSS)
- [ ] Brand management (CRUD, assign admins)
- [ ] Tenant analytics
- [ ] Tenant billing view
- [ ] Custom domain SSL provisioning

### Phase 5.5: Brand Admin (1.5-2 weeks)
- [ ] Brand admin dashboard
- [ ] Brand user management
- [ ] Brand settings
- [ ] Brand content view
- [ ] Brand usage stats
- [ ] Brand activity log
- [ ] UVP management

### Phase 6: Analytics & Polish (2 weeks)
- [ ] Platform analytics
- [ ] Revenue analytics
- [ ] System health monitoring
- [ ] Alerts system
- [ ] Data export (GDPR)
- [ ] Documentation

---

# RELEASE 1.3 - Agency White-Label Platform

**Status:** PLANNED
**Priority:** HIGH
**Estimated Duration:** 8 weeks

**Full Plan:** `.buildrunner/WHITE_LABEL_BUILD_PLAN.md`

## Features

### Phase 1: Core White-Label (2 weeks)
- [ ] Custom branding (logo, colors, favicon)
- [ ] Custom domain mapping
- [ ] Branded email notifications
- [ ] Remove Synapse branding option

### Phase 2: Agency Management (2 weeks)
- [ ] Client management dashboard
- [ ] Agency/client account hierarchy
- [ ] Role-based access control (4 roles)
- [ ] Proposal generator (intelligence → PDF)

### Phase 3: Scalability (1 week)
- [ ] Bulk operations (campaigns, reports, imports)
- [ ] Team collaboration (notes, mentions, activity feed)
- [ ] Agency API endpoints

### Phase 4: Billing & Packaging (1 week)
- [ ] Usage tracking per client
- [ ] Plan enforcement
- [ ] Stripe billing integration

### Phase 5: Agency Features (1 week)
- [ ] Client portal (separate login)
- [ ] Performance benchmarking
- [ ] Training & onboarding

### Pricing Tiers
| Plan | Clients | Price |
|------|---------|-------|
| Starter | 5 | $297/mo |
| Growth | 15 | $597/mo |
| Scale | Unlimited | $997/mo |

---

# RELEASE 1.4 - Video & Visual Content Engine

**Status:** PLANNED
**Priority:** HIGH
**Estimated Duration:** 100+ hours

**Full Plan:** `.buildrunner/worktrees/worktree-video-editor.md`, `.buildrunner/worktrees/worktree-video-formatter.md`

## Features

### 1.4.1 Video Editor (Browser-Based) - 40 hours
- [ ] FFmpeg.wasm + Remotion integration
- [ ] Zero monthly cost (browser-based processing)
- [ ] Timeline interface with clip trimming
- [ ] Text overlay system with brand fonts
- [ ] 5 video types:
  - Testimonial videos
  - Product demo videos
  - Behind-the-scenes clips
  - How-to tutorials
  - Social media cuts

### 1.4.2 Platform Auto-Formatter - 30 hours
- [ ] One video → 7 platform versions
- [ ] Aspect ratio automation:
  - 16:9 (YouTube, LinkedIn)
  - 9:16 (TikTok, Reels, Stories)
  - 1:1 (Instagram Feed, Facebook)
  - 4:5 (Instagram, Facebook Optimal)
- [ ] Auto-captions with style templates
- [ ] Platform-specific overlays and safe zones
- [ ] Batch processing for campaigns

### 1.4.3 TikTok Script Generator
- [ ] Hook-first script structure
- [ ] Trending audio integration
- [ ] Pattern interrupt templates
- [ ] Viral element checklist

### 1.4.4 Twitter Thread Composer - 5 hours
- [ ] Multi-tweet thread optimization
- [ ] Engagement hooks between tweets
- [ ] Thread preview with character counts
- [ ] One-click publish to X/Twitter

### 1.4.5 Bannerbear Universal Templates - 10 hours
- [ ] 6 template types:
  - Social posts (all platforms)
  - Stories (Instagram, Facebook)
  - Ads (Facebook, Google, LinkedIn)
  - Thumbnails (YouTube, Blog)
  - Headers (Twitter, LinkedIn, Email)
  - Email banners
- [ ] Brand kit integration (colors, fonts, logos)
- [ ] Dynamic text injection from content
- [ ] Batch generation for campaigns

---

# RELEASE 1.5 - Long-Form Content Expansion

**Status:** PLANNED
**Priority:** HIGH
**Estimated Duration:** 45+ hours

**Full Plan:** `.buildrunner/worktrees/worktree-landing-pages.md`, `.buildrunner/worktrees/worktree-long-form-content.md`

## Features

### 1.5.1 Landing Page Generator - 25 hours
- [ ] 5 template types:
  - Sales landing pages
  - Lead capture pages
  - Webinar registration
  - Product launch pages
  - Coming soon pages
- [ ] Section library:
  - Hero sections (5 variants)
  - Feature highlights
  - Testimonial sections
  - FAQ accordions
  - Pricing tables
  - CTA blocks
- [ ] UVP-driven content population
- [ ] Mobile-responsive output
- [ ] Export to HTML/code

### 1.5.2 Blog Expander - 10 hours
- [ ] Social post → 1500+ word blog transformation
- [ ] SEO-optimized structure:
  - H1/H2/H3 hierarchy
  - Meta descriptions
  - Internal link suggestions
  - Image alt text generation
- [ ] Related topics expansion
- [ ] Readability optimization

### 1.5.3 Newsletter Generator - 10 hours
- [ ] Weekly/monthly newsletter templates
- [ ] Curated content compilation from calendar
- [ ] Multiple section templates:
  - Main story
  - Quick tips
  - Industry news roundup
  - Upcoming events
  - CTA sections
- [ ] Email client compatibility testing
- [ ] Subject line optimization with scoring

---

# RELEASE 1.6 - Intelligence & Data Expansion

**Status:** PLANNED
**Priority:** HIGH
**Estimated Duration:** 80+ hours

**Full Plans:** `.buildrunner/worktrees/worktree-seo-intelligence.md`, `.buildrunner/worktrees/worktree-youtube-analyzer.md`

## Features

### 1.6.1 YouTube Content Analyzer - 8 hours
- [ ] Video transcript extraction
- [ ] Hook pattern analysis (first 5 seconds)
- [ ] Topic detection and clustering
- [ ] Engagement metric correlation
- [ ] Competitor channel analysis
- [ ] Content gap identification

### 1.6.2 Social Media Scraper & Brand Voice Extraction - 8 hours
- [ ] Extract voice from existing social presence
- [ ] Tone analysis (formal/casual/playful)
- [ ] Common phrase detection
- [ ] Emoji usage patterns
- [ ] Posting rhythm analysis
- [ ] Audience engagement patterns

### 1.6.3 Content Learning Loop - 12 hours
- [ ] Track published content performance
- [ ] Correlation analysis (score vs engagement)
- [ ] Feed results back to improve templates
- [ ] A/B test result integration
- [ ] Automatic template scoring updates
- [ ] Industry benchmark comparisons

### 1.6.4 Perplexity Local Intelligence - 8 hours
- [ ] Local news aggregation
- [ ] Community event detection
- [ ] Local business news monitoring
- [ ] Regional trend identification
- [ ] Hyperlocal content opportunities

### 1.6.5 Full SEO Intelligence System - 30 hours
- [ ] Complete SEMrush/Ahrefs integration
- [ ] Keyword gap analysis:
  - Competitor keyword mapping
  - Opportunity scoring
  - Difficulty assessment
- [ ] Content optimization scoring:
  - On-page SEO checklist
  - Keyword density analysis
  - Readability for SEO
- [ ] SERP tracking:
  - Position monitoring
  - SERP feature detection
  - Competitor movement alerts
- [ ] Backlink opportunity detection

### 1.6.6 Enhanced Competitive Intelligence - 15 hours
- [ ] Real-time competitor content monitoring
- [ ] Automated gap analysis
- [ ] Positioning map visualization
- [ ] Win/loss insight extraction
- [ ] Competitive response recommendations

---

# RELEASE 1.7 - UVP & Onboarding Enhancements

**Status:** PLANNED
**Priority:** MEDIUM
**Estimated Duration:** 50+ hours

**Full Plan:** `.buildrunner/worktrees/worktree-uvp-wizard.md`

## Features

### 1.7.1 Product/Service Scanner - 15 hours
- [ ] Auto-extract from website:
  - Products with descriptions
  - Services with details
  - Pricing information
  - Feature lists
- [ ] Build offering database automatically
- [ ] Category classification
- [ ] Competitor offering comparison

### 1.7.2 Enhanced UVP Wizard 2.0 - 15 hours
- [ ] Industry-specific question flows:
  - SaaS flow (metrics, integrations)
  - Local service flow (area, licensing)
  - E-commerce flow (products, shipping)
  - Agency flow (clients, case studies)
- [ ] AI-assisted answer suggestions
- [ ] Progress saving and resumption
- [ ] Multi-brand support in single flow
- [ ] Team collaboration on UVP

### 1.7.3 Brand Voice Detection & Matching - 8 hours
- [ ] Website voice analysis
- [ ] Social presence tone extraction
- [ ] Map to EQ scoring dimensions
- [ ] Voice consistency recommendations
- [ ] Template tone adjustment

### 1.7.4 Industry Profile Auto-Generation - 15 hours
- [ ] Generate profiles for missing industries
- [ ] Learn from user corrections
- [ ] Power word extraction from content
- [ ] Trigger pattern learning
- [ ] Template effectiveness tracking

---

# RELEASE 1.8 - Content Selection & Mixing

**Status:** PLANNED
**Priority:** MEDIUM
**Estimated Duration:** 35+ hours

**Full Plan:** `.buildrunner/worktrees/worktree-content-selection.md`

## Features

### 1.8.1 Content Selection Interface - 25 hours
- [ ] Smart Picks (AI recommendations):
  - Best performing templates
  - Trending topic matches
  - Seasonal recommendations
  - Audience-optimized selections
- [ ] Content Mixer:
  - Drag-and-drop insight combinations
  - Mix preview before generation
  - Save favorite mixes
  - Team-shared mix library
- [ ] Recipe system:
  - Pre-built content recipes
  - Custom recipe creation
  - Recipe performance tracking

### 1.8.2 EQ Calculator v3.0 - Performance Tracking - 8 hours
- [ ] Track EQ score vs actual engagement
- [ ] Correlation analysis dashboard
- [ ] Auto-adjust baselines based on performance
- [ ] Platform-specific EQ optimization
- [ ] Industry benchmark comparison
- [ ] Confidence scoring for predictions

---

# RELEASE 1.9 - Campaign Types Expansion

**Status:** PLANNED
**Priority:** MEDIUM
**Estimated Duration:** 70+ hours

**Full Plan:** `.buildrunner/CAMPAIGN_INTELLIGENCE_PLAN.md`

## Campaign Library

### 1.9.1 Authority Builder Campaign - 8 hours
4-week campaign structure:
- Week 1: Foundation (establish expertise)
- Week 2: Framework (share methodology)
- Week 3: Proof (case studies, results)
- Week 4: Platform (thought leadership)
- Templates for each week
- Insight auto-selection

### 1.9.2 Local Pulse Campaign - 10 hours
Community-focused content:
- Local event integration
- Community stories
- Neighborhood-specific messaging
- Local SEO content
- Partnership announcements
- Local awards/recognition

### 1.9.3 Social Proof Campaign - 8 hours
Trust-building sequence:
- Testimonial showcase series
- Case study breakdowns
- User-generated content coordination
- Review highlight posts
- Before/after transformations

### 1.9.4 Competitor Crusher Campaign - 10 hours
Differentiation strategy:
- Gap exploitation content
- Head-to-head comparisons (ethical)
- Unique value emphasis
- Problem-solution framing
- "Why we're different" series

### 1.9.5 Community Champion Campaign - 8 hours
Belonging-focused content:
- Local involvement stories
- Partnership announcements
- Community value content
- Customer spotlight series
- Behind-the-scenes culture

### 1.9.6 Trust Builder Campaign - 8 hours
Credibility sequence:
- Behind-the-scenes transparency
- Expert positioning content
- Process reveal posts
- Team introduction series
- Quality assurance content

### 1.9.7 Revenue Rush Campaign - 10 hours
Urgency-driven content:
- Time-limited offers
- Flash sale sequences
- Scarcity messaging
- Deadline-driven CTAs
- FOMO triggers

### 1.9.8 Viral Spark Campaign - 8 hours
Shareability optimization:
- Trend-jacking content
- Contrarian/controversial posts
- Shareability triggers
- Meme-format content
- Challenge participation

---

# RELEASE 2.0 - Platform Integrations

**Status:** PLANNED
**Priority:** MEDIUM
**Estimated Duration:** 60+ hours

**Full Plan:** `.buildrunner/INTEGRATION_SOCIALPILOT_API.md`

## Features

### 2.0.1 SocialPilot Full Integration - 15 hours
- [ ] Direct publishing (not just scheduling)
- [ ] Bi-directional calendar sync
- [ ] Analytics pull-back to Synapse
- [ ] Bulk operations
- [ ] Team collaboration sync

### 2.0.2 Platform API Integrations - 40 hours

**LinkedIn Analytics API:**
- Company page analytics
- Post-level engagement metrics
- Follower demographics
- Industry benchmarks

**Meta (Facebook/Instagram) API:**
- Cross-platform tracking
- Story vs Feed performance
- Demographic breakdowns
- Comment sentiment analysis

**TikTok for Business API:**
- Video performance analytics
- Trending audio tracking
- Hashtag effectiveness
- Creator marketplace insights

**Twitter/X API:**
- Tweet performance
- Thread analytics
- Audience insights
- Trend participation tracking

**YouTube Analytics API:**
- Video performance
- Audience retention
- Click-through rates
- Subscriber conversion

### 2.0.3 Zapier/Make Integration - 5 hours
- [ ] Webhook triggers for events
- [ ] Action recipes for common workflows
- [ ] Pre-built Zap templates
- [ ] Custom integration builder

---

# RELEASE 2.1 - EQ Calculator Future Phases

**Status:** PLANNED
**Priority:** LOW
**Estimated Duration:** 56+ hours

**Full Plan:** `.buildrunner/FEATURE_EQ_CALCULATOR_V3_FUTURE.md`

## Features

### 2.1.1 EQ Performance Tracking & Analytics - 8 hours
- [ ] Correlation analysis (EQ vs engagement)
- [ ] Platform-specific performance tracking
- [ ] Confidence scoring for predictions
- [ ] Performance decay tracking
- [ ] A/B testing EQ levels

### 2.1.2 EQ Auto-Adjustment Engine - 6 hours
- [ ] Automatic recalibration based on performance
- [ ] Specialty baseline updates
- [ ] Seasonal adjustment learning
- [ ] Industry trend detection
- [ ] Outlier detection

### 2.1.3 GPT-4 Content Analysis Enhancement - 6 hours
- [ ] Deep semantic website analysis
- [ ] Competitor EQ comparison
- [ ] Multi-language EQ calculation
- [ ] Cultural EQ adjustments
- [ ] Industry emotional patterns

### 2.1.4 Predictive EQ Modeling - 6 hours
- [ ] ML model for optimal EQ
- [ ] Engagement prediction based on EQ
- [ ] Optimal EQ by campaign goal
- [ ] Seasonal EQ predictions
- [ ] Trend-based recommendations

### 2.1.5 Real-Time EQ Adjustment - 4 hours
- [ ] Live campaign EQ adjustments
- [ ] A/B testing different EQ levels
- [ ] Dynamic content regeneration
- [ ] Platform-specific optimization
- [ ] Time-of-day adjustments

### 2.1.6 Email Campaign EQ - 5 hours
- [ ] Subject line EQ optimization
- [ ] Email body tone adjustment
- [ ] CTA emotional framing
- [ ] Segment-specific EQ targeting
- [ ] Open rate prediction by EQ

### 2.1.7 Landing Page EQ - 5 hours
- [ ] Hero section emotional balance
- [ ] Value prop EQ alignment
- [ ] Testimonial selection by EQ
- [ ] CTA button copy optimization
- [ ] Form field emotional framing

### 2.1.8 Ad Copy EQ - 5 hours
- [ ] Headline EQ optimization
- [ ] Ad description tone matching
- [ ] Visual selection by EQ
- [ ] Audience targeting by EQ preference
- [ ] Budget allocation by EQ performance

### 2.1.9 Sales Enablement EQ - 5 hours
- [ ] Sales script EQ calibration
- [ ] Objection handling by EQ type
- [ ] Follow-up sequence EQ progression
- [ ] Proposal emotional framing
- [ ] Close technique by prospect EQ

### 2.1.10 EQ Marketplace (Future Vision)
- [ ] Buy/sell proven EQ profiles
- [ ] Industry-specific EQ templates
- [ ] Certified EQ consultants
- [ ] EQ performance guarantees

---

# RELEASE 2.2 - Advanced Features

**Status:** PLANNED
**Priority:** LOW
**Estimated Duration:** 150+ hours

## Features

### 2.2.1 Content Calendar Dashboard UI - 10 hours
- [ ] Drag-and-drop calendar interface
- [ ] Bulk scheduling operations
- [ ] Calendar view in main dashboard
- [ ] Export to external calendars
- [ ] Team calendar sharing

### 2.2.2 A/B Testing Framework - 15 hours
- [ ] Variant generation (auto-create alternatives)
- [ ] Performance tracking per variant
- [ ] Statistical significance calculation
- [ ] Winner selection automation
- [ ] Learning integration back to templates

### 2.2.3 Content Approval Workflows - 20 hours
- [ ] Multi-step approval process
- [ ] Comment/feedback system
- [ ] Version history tracking
- [ ] Role-based approval gates
- [ ] Deadline tracking
- [ ] Notification system

### 2.2.4 Analytics Dashboard - 25 hours
- [ ] Content performance metrics
- [ ] Engagement trends over time
- [ ] ROI tracking (if conversion data available)
- [ ] Competitor comparison charts
- [ ] Score vs performance correlation
- [ ] Exportable reports

### 2.2.5 Mobile App (Future) - 80+ hours
- [ ] iOS native app
- [ ] Android native app
- [ ] Push notifications
- [ ] Quick post creation
- [ ] Approval on-the-go
- [ ] Analytics dashboard mobile

---

# RELEASE 2.3 - Proof 2.0 Enhancements

**Status:** ✅ COMPLETE (core), PLANNED (Phase 7 Rich Sources)
**Priority:** LOW for enhancements

**Full Plan:** `docs/builds/PROOF_2_0_BUILD_PLAN.md`

## Completed Features
- ✅ Category-aware proof routing (6 business profiles)
- ✅ Early loading at brand selection
- ✅ Profile-specific proof extraction
- ✅ Quality scoring (Recency × Authority × Specificity × Verification)
- ✅ UVP alignment scoring
- ✅ Content integration with proof injection
- ✅ Expandable proof cards UI

## Phase 7 Enhancements (Rich Proof Sources)
- [x] G2/Capterra/TrustRadius scraping
- [x] Deep website testimonial scraping
- [x] Press & news mentions
- [x] Client logo extraction
- [x] Social proof metrics
- [x] Streaming early load integration

---

# RELEASE 2.4 - Brand Profile System Enhancements

**Status:** ✅ COMPLETE (core)

**Full Plan:** `docs/builds/BRAND_PROFILE_SYSTEM_BUILD_PLAN.md`

## Completed Features
- ✅ Geographic market detection
- ✅ Auto-detection from website (TLD, contact, footer)
- ✅ Background profile scanner
- ✅ Brand profile page UI
- ✅ Profile context provider
- ✅ Downstream integration to triggers

---

# Technical Debt & Maintenance

## Known Issues
1. Auth routes commented out in App.tsx
2. RLS disabled on many tables for demo mode
3. V4 code archived but still referenced in some places
4. Some API integrations need rate limit handling

## Performance Optimizations Needed
1. Template caching at service level
2. Intelligence cache warming
3. Score calculation memoization
4. API call batching improvements

## Testing Gaps
1. Integration tests for V5 pipeline
2. E2E tests for campaign generation
3. Load testing for concurrent users
4. API cost tracking validation

---

# Appendix

## File Structure (V5)
```
src/
├── components/v5/
│   ├── V5ContentPanel.tsx
│   ├── ScoreDisplay.tsx
│   ├── ScoreDisplayPanel.tsx
│   ├── QualityBadge.tsx
│   ├── ContentCard.tsx
│   ├── WhyThisWorksTooltip.tsx
│   ├── CustomerCategoryPreview.tsx
│   ├── CampaignPreviewModal.tsx
│   ├── FrameworkComparisonPanel.tsx
│   ├── YourMixPreview.tsx
│   └── ...
├── services/v5/
│   ├── types.ts
│   ├── industry-profile.service.ts
│   ├── uvp-provider.service.ts
│   ├── eq-integration.service.ts
│   ├── template.service.ts
│   ├── ai-enhancer.service.ts
│   ├── synapse-scorer.service.ts
│   ├── intelligence.service.ts
│   ├── embeddings.service.ts
│   ├── content-orchestrator.ts
│   └── utils/
├── hooks/
│   ├── useV5ContentGeneration.ts
│   ├── useV5PowerModeGeneration.ts
│   ├── useV5EasyModeGeneration.ts
│   ├── useV5CampaignGeneration.ts
│   └── useV5LivePreview.ts
├── services/triggers/
│   ├── recency-calculator.service.ts
│   ├── confidence-scorer.service.ts
│   ├── competitor-attribution.service.ts
│   ├── signal-stacker.service.ts
│   ├── surge-detector.service.ts
│   ├── buying-stage-classifier.service.ts
│   └── ... (30+ services)
└── data/v5/
    └── universal-templates.ts
```

## API Cost Reference
| Provider | Cost Model | Estimated Per-Call |
|----------|------------|-------------------|
| OpenRouter (Claude Sonnet) | Per-token | ~$0.003/1K tokens |
| OpenRouter (Claude Haiku) | Per-token | ~$0.00025/1K tokens |
| Apify | Per-actor run | $0.01-0.05 |
| Serper | Per-search | $0.001 |
| OutScraper | Per-result | $0.002 |
| Perplexity | Per-query | $0.005 |
| SEMrush | Per-request | $0.01 |

## Related Documents

### Core Build Plans
- `.buildrunner/V5_CONTENT_ENGINE_BUILD_PLAN.md` - V5 engine specification
- `.buildrunner/V5_SYNAPSE_COMPLETE_BUILD_PLAN.md` - Complete V5 build history
- `.buildrunner/SYNAPSE_ADMIN_BUILD_PLAN.md` - Admin panel architecture
- `.buildrunner/WHITE_LABEL_BUILD_PLAN.md` - Agency platform plan
- `.buildrunner/CAMPAIGN_INTELLIGENCE_PLAN.md` - Campaign types and intelligence
- `.buildrunner/SMB_CAMPAIGN_BEST_PRACTICES_2025.md` - Research-validated best practices
- `.buildrunner/FEATURE_EQ_CALCULATOR_V3_FUTURE.md` - EQ future phases

### Integration Build Plans
- `docs/builds/TRIGGERS_3.0_BUILD_PLAN.md` - Signal intelligence system
- `docs/builds/SYNAPSE_V5_DASHBOARD_INTEGRATION_PLAN.md` - Dashboard wiring
- `docs/builds/PROOF_2_0_BUILD_PLAN.md` - Proof system architecture
- `docs/builds/BRAND_PROFILE_SYSTEM_BUILD_PLAN.md` - Brand profile system
- `.buildrunner/INTEGRATION_SOCIALPILOT_API.md` - SocialPilot integration

### Worktree Specifications
- `.buildrunner/worktrees/worktree-video-editor.md` - Video editor specs
- `.buildrunner/worktrees/worktree-video-formatter.md` - Platform auto-formatter
- `.buildrunner/worktrees/worktree-landing-pages.md` - Landing page generator
- `.buildrunner/worktrees/worktree-long-form-content.md` - Blog/newsletter generator
- `.buildrunner/worktrees/worktree-bannerbear.md` - Visual templates
- `.buildrunner/worktrees/worktree-seo-intelligence.md` - SEO system
- `.buildrunner/worktrees/worktree-content-selection.md` - Smart Picks + Mixer
- `.buildrunner/worktrees/worktree-eq-calculator-integration.md` - EQ integration
- `.buildrunner/worktrees/worktree-uvp-wizard.md` - UVP enhancements
- `.buildrunner/worktrees/worktree-youtube-analyzer.md` - YouTube intelligence

---

# Summary: Total Feature Roadmap

## By Release

| Release | Focus | Est. Hours | Priority |
|---------|-------|------------|----------|
| **MVP (v1.0)** | V5 Engine, Triggers 3.0, Synapse 2.0, Keywords 2.0 | ✅ COMPLETE | - |
| **1.1** | Authentication & User Management | 3-4 weeks | CRITICAL |
| **1.2** | Admin Panel (4-Tier Hierarchy) | 15-21 weeks | CRITICAL |
| **1.3** | Agency White-Label Platform | 8 weeks | HIGH |
| **1.4** | Video & Visual Content | 100+ hours | HIGH |
| **1.5** | Long-Form Content | 45+ hours | HIGH |
| **1.6** | Intelligence & Data Expansion | 80+ hours | HIGH |
| **1.7** | UVP & Onboarding Enhancements | 50+ hours | MEDIUM |
| **1.8** | Content Selection & Mixing | 35+ hours | MEDIUM |
| **1.9** | Campaign Types Expansion | 70+ hours | MEDIUM |
| **2.0** | Platform Integrations | 60+ hours | MEDIUM |
| **2.1** | EQ Calculator Future Phases | 56+ hours | LOW |
| **2.2** | Advanced Features | 150+ hours | LOW |
| **2.3** | Proof 2.0 Enhancements | ✅ COMPLETE | - |
| **2.4** | Brand Profile Enhancements | ✅ COMPLETE | - |

## Total Planned Development

| Category | Features | Hours |
|----------|----------|-------|
| Video & Visual | 5 | ~100 |
| Long-Form Content | 3 | ~45 |
| Intelligence | 6 | ~80 |
| UVP Enhancements | 4 | ~50 |
| Content Selection | 2 | ~35 |
| Campaign Types | 8 | ~70 |
| Platform Integrations | 3 | ~60 |
| Admin/White-Label | 7 | ~320 |
| Future EQ Phases | 10 | ~56 |
| Advanced Features | 5 | ~150 |
| **TOTAL PLANNED** | **53+ features** | **~966+ hours** |

---

*Document Generated: 2025-12-01*
*Last Updated: 2025-12-01*
*Next Review: 2025-12-15*
