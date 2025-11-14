# Synapse SMB Platform - MVP Scope Document

**Version:** 1.0.0
**Date:** November 14, 2025
**Status:** In Development
**Target Launch:** December 15, 2025 (4 weeks)

---

## 1. EXECUTIVE SUMMARY

### Product Vision
Automated SMB marketing platform that transforms any business URL into 30 days of psychology-optimized, auto-publishing social media content in under 4 minutes.

### MVP Goal
Deliver end-to-end automation from URL input to published content for 5 core industries with 7 social platforms, achieving 3x engagement versus manual posting.

### Success Criteria
- 100 businesses onboarded in first month
- <4 minute onboarding time
- >99% publishing reliability
- 3x engagement vs baseline

---

## 2. PROBLEM STATEMENT

### Customer Problem
**57% of SMBs spend less than 5 hours/week on social media** (Vertical Response), while **43% invest 6+ hours/week (~24 hours/month)** yet still struggle with:
- Lack of marketing expertise
- Generic content that doesn't resonate
- Inconsistent posting schedule
- No understanding of platform optimization

**Key Insight**: 86% would prefer NOT to spend time on marketing (Outbound Engine 2019), yet 79% of those investing 5-10 hours/week report revenue growth - creating a gap Synapse fills.

### Current Solutions Inadequacy
- **Scheduling tools** require content creation
- **AI writers** produce generic content
- **Agencies** are expensive ($2,000+/month)
- **Templates** ignore business uniqueness

### Our Solution
Fully automated system combining business intelligence gathering, specialty detection, psychology optimization, and automated publishing.

---

## 3. TARGET USERS

### Primary Persona: Small Business Owner
- **Demographics:** 35-55 years old, owns 1-3 locations
- **Tech Savvy:** Basic (can use email and web)
- **Pain Points:** No time for marketing, limited budget
- **Goal:** Consistent professional presence without effort

### Secondary Persona: Marketing Manager
- **Demographics:** 25-40 years old, manages 5-10 brands
- **Tech Savvy:** Intermediate
- **Pain Points:** Too many accounts to manage manually
- **Goal:** Scale content creation efficiently

### Industry Coverage (MVP)
**Complete Industry Database:**
- **380 NAICS Codes** - Full North American Industry Classification System
- **147 Full Industry Profiles** - Complete psychology, messaging, and engagement optimization
- **50+ Data Points per Profile** - Power words, emotional triggers, content themes, posting times

**Priority Industries (Pre-Built UX):**
1. **Restaurant** - High social media dependency
2. **CPA/Accountant** - Seasonal content needs
3. **Realtor** - Visual content focus
4. **Dentist** - Trust-building content
5. **Consultant** - Thought leadership

**Full Coverage Includes:** Professional Services, Healthcare, Food Service, Real Estate, Retail, Finance, Hospitality, Construction, Education, Manufacturing, Technology, Legal, Creative Services, Home Services, Automotive, and 40+ more sectors

---

## 4. CORE FEATURES (MVP)

### 4.1 Intelligent Onboarding (3 minutes)
**User Value:** Zero learning curve, instant setup

| Feature | Description | Priority |
|---------|-------------|----------|
| Universal URL Parser | Accept any URL format globally | P0 |
| 17 Parallel Intelligence APIs | Gather comprehensive business data (includes Reddit) | P0 |
| Global Location Detection | Find address in 50+ countries | P0 |
| Specialty Detection | Identify niche (wedding bakery vs bakery) | P0 |
| Evidence-Based UVP | Suggest value props with citations | P1 |

### 4.2 Content Generation (1 minute)
**User Value:** Month of content instantly

| Feature | Description | Priority |
|---------|-------------|----------|
| Dual-Mode Generation | Fast (MARBA) or Enhanced (Synapse) | P0 |
| 30-Day Calendar | Full month pre-populated | P0 |
| Platform Optimization | Tailored for each platform | P0 |
| Psychology Scoring | Power words & emotional triggers | P1 |
| Smart Scheduling | Optimal posting times | P0 |

### 4.3 Publishing Automation
**User Value:** Set and forget

| Feature | Description | Priority |
|---------|-------------|----------|
| SocialPilot OAuth | Connect all social accounts | P0 |
| Auto-Publishing | Posts at scheduled times | P0 |
| Publishing Queue | 7-day preview & control | P1 |
| Error Recovery | Automatic retry on failure | P0 |
| Status Tracking | Real-time publishing status | P1 |

### 4.4 Intelligence Features
**User Value:** Never miss opportunities

| Feature | Description | Priority |
|---------|-------------|----------|
| Opportunity Detection | Weather, trends, events | P1 |
| Competitor Monitoring | Track competitor activity | P2 |
| Content Suggestions | AI-powered ideas | P1 |
| Performance Learning | Improve over time | P2 |

### 4.5 Reddit Intelligence ✅ COMPLETE (17th Data Source)
**User Value:** Mine authentic psychological triggers from real customer conversations

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Psychological Trigger Mining | Extract 7 types of emotional triggers validated by upvotes | P0 | ✅ Complete |
| Customer Pain Point Detection | Identify "I hate when..." patterns | P0 | ✅ Complete |
| Desire Extraction | Capture "I wish..." customer desires | P0 | ✅ Complete |
| Subreddit Discovery | Auto-find relevant communities by industry | P0 | ✅ Complete |
| Trending Topic Identification | Track hot discussions before competitors | P1 | ✅ Complete |
| Public API Fallback | Works without OAuth (60 req/min) | P0 | ✅ Complete |

**Implementation:** `/src/services/intelligence/reddit-api.ts` (800+ lines, production ready)
**Test Results:** ✅ All tests passing, <2 second response time
**Triggers Detected:** Curiosity, Fear, Desire, Belonging, Achievement, Trust, Urgency

---

## 5. PLATFORM SUPPORT

### Social Platforms (MVP)
| Platform | Posts/Day | Priority | Integration |
|----------|-----------|----------|-------------|
| Instagram | 1 | P0 | SocialPilot API |
| Facebook | 3 | P0 | SocialPilot API |
| Twitter | 5 | P0 | SocialPilot API |
| LinkedIn | 2 | P0 | SocialPilot API |
| TikTok | 2 | P1 | SocialPilot API |
| Email | 1 | P2 | SendGrid API |
| Blog | 1 | P2 | WordPress API |

---

## 6. TECHNICAL REQUIREMENTS

### Database Requirements
**Industry Intelligence Foundation:**
- **380 NAICS Codes table** - Hierarchical industry classification with keywords
- **147 Industry Profiles table** - Complete psychology and engagement patterns
- **Migration Prerequisite:** Must be completed before any backend service development
- **Storage:** ~50MB (NAICS codes + profiles)
- **Indexes:** GIN index on keywords array, B-tree on codes and foreign keys
- **Query Performance:** <10ms for profile lookup by NAICS code
- **Data Source:** Existing MARBA project database

**Additional Tables:**
- Brands with NAICS code linkage
- Content calendar items
- Intelligence cache
- Publishing queue
- Analytics metrics

### Performance Requirements
- **Page Load:** <2 seconds
- **Intelligence Gathering:** <30 seconds (17 APIs in parallel)
- **Content Generation:** <15 seconds
- **Industry Profile Lookup:** <10ms (achieved with GIN indexes)
- **Reddit API:** <2 seconds per query
- **Concurrent Users:** 100
- **Uptime:** 99.9%

### Security Requirements
- TLS 1.3 encryption
- API key rotation (90 days)
- GDPR compliant (industry data is public, no PII)
- SOC 2 Type 1 ready
- PCI DSS compliant (for payments)

### Scalability Requirements
- Handle 10,000 brands
- 1M API calls/month
- 100GB storage expandable
- Multi-region deployment ready
- Industry database read-replicas for global scale

---

## 7. OUT OF SCOPE (v1.0)

### Features NOT in MVP
- Multi-location businesses
- Team collaboration
- White-label option
- A/B testing
- Video content generation
- Custom integrations
- Mobile app
- Advanced analytics
- AI image generation
- Influencer matching

### Platforms NOT in MVP (for Publishing)
- Pinterest
- YouTube
- Snapchat
- Discord

**Note:** Reddit is integrated for intelligence gathering and opportunity discovery in MVP, but automated publishing to Reddit is Phase 2 due to community authenticity requirements.

---

## 8. SUCCESS METRICS

### Business Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Customer Acquisition | 100 in month 1 | Stripe subscriptions |
| Revenue | $5,000 MRR | Stripe dashboard |
| Churn Rate | <5% monthly | Subscription cancellations |
| CAC | <$50 | Ad spend / conversions |
| LTV | >$500 | Revenue per customer |

### Product Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Onboarding Time | <4 minutes | Mixpanel funnel |
| Content Quality | 3x engagement | Platform analytics |
| Publishing Success | >99% | Internal monitoring |
| User Satisfaction | >4.5 stars | In-app surveys |
| Support Tickets | <5% of users | Zendesk |

### Technical Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| API Success Rate | >95% | DataDog monitoring |
| Response Time | <500ms p95 | New Relic APM |
| Error Rate | <1% | Sentry |
| Test Coverage | >80% | Jest reports |
| Deploy Frequency | Daily | GitHub Actions |

---

## 9. DELIVERY TIMELINE

### Day 0: Database Migration ✅ COMPLETE
- ✅ 383 NAICS codes available via shared MARBA Supabase database
- ✅ 147 industry profiles accessible (507,000 words of intelligence)
- ✅ Shared database architecture eliminates migration need
- ✅ All tables, RLS policies, and triggers active
- ✅ 888 active records across 6 core tables
- **Status:** Backend services ready to proceed

### Week 1-2: Backend Development
- ✅ Universal URL Parser (implemented)
- ✅ 17 API Integration (Reddit added as 17th source)
- 🚧 Specialty Detection (uses industry database) - In Progress
- 🚧 Calendar Population (uses industry profiles) - In Progress

### Week 2-3: Frontend & Integration
- Enhanced UI ✓
- Calendar Integration ✓
- SocialPilot OAuth ✓
- Publishing Engine ✓

### Week 4: Testing & Launch
- End-to-end testing
- Performance optimization
- Security audit
- Production deployment

---

## 10. RISKS & MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| API Rate Limits | High | High | Implement caching, fallbacks |
| SocialPilot OAuth Fails | Medium | Critical | API key backup, manual setup |
| Poor Content Quality | Low | High | Human review queue, quality scores |
| Scale Issues | Medium | Medium | Load testing, auto-scaling |
| Security Breach | Low | Critical | Pen testing, SOC 2 audit |

---

## 11. DEPENDENCIES

### Data Dependencies ✅ COMPLETE
- **Industry Database:** ✅ 383 NAICS codes + 147 industry profiles
  - **Architecture:** Shared Supabase database with MARBA
  - **Status:** Fully accessible, no migration required
  - **Performance:** <10ms query time with GIN indexes
  - **Unblocks:** Specialty Detection, Content Generation, Smart Scheduling

### External Dependencies
- **Critical:** SocialPilot API, OpenRouter (Claude), Supabase, ✅ Reddit API (OAuth configured)
- **Important:** Apify, OutScraper, Serper
- **Nice-to-have:** SEMrush, YouTube API, Weather API
- **All API Keys:** ✅ Configured in .env

### Internal Dependencies
- 4 parallel development teams
- Git worktree infrastructure
- BuildRunner tracking system
- Daily standups
- Industry database available in Supabase

---

## 12. PRICING MODEL

### Pricing Tiers (MVP)
| Plan | Price | Limits | Target |
|------|-------|--------|--------|
| Starter | $49/mo | 30 posts, 3 platforms | Solopreneurs |
| Professional | $149/mo | Unlimited posts, all platforms | Growing SMBs |
| Agency | $499/mo | 5 brands, white label | Agencies |

### Revenue Projections
- Month 1: 100 customers × $49 = $4,900
- Month 3: 300 customers × $75 avg = $22,500
- Month 6: 1000 customers × $85 avg = $85,000

---

## 13. POST-MVP ROADMAP

### Phase 2 (Month 2-3)
- Reddit Publishing (thoughtful engagement in niche communities)
- Multi-location support
- Team collaboration
- Advanced analytics
- A/B testing
- Pinterest integration

### Phase 3 (Month 4-6)
- Reddit Community Building (mini-AMAs, subreddit relationships)
- White-label platform
- AI image generation
- Video content
- Mobile app
- Enterprise features

### Phase 4 (Month 7-12)
- International expansion
- Industry-specific features
- API marketplace
- Partner integrations
- IPO preparation 😉

---

## 14. ACCEPTANCE CRITERIA

### Definition of Done (MVP)
- [ ] All P0 features implemented
- [ ] 80% test coverage achieved
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] 10 beta users tested successfully
- [ ] SocialPilot integration verified
- [ ] Production deployment stable

### Go/No-Go Criteria
**GO if:**
- End-to-end flow works for 5 industries
- <4 minute onboarding achieved
- Publishing reliability >99%
- No critical security issues

**NO-GO if:**
- SocialPilot integration unstable
- Onboarding >10 minutes
- Critical bugs in core flow
- Security vulnerabilities found

---

## 15. TEAM & RESOURCES

### Development Team
- **Backend Developer** - API integrations, services
- **Frontend Developer** - UI/UX, calendar system
- **Integration Developer** - SocialPilot, publishing
- **Full-Stack Developer** - End-to-end features

### Required Resources
- $500/month API costs
- $25/month Supabase
- $20/month monitoring tools
- 4 weeks development time

---

## APPROVAL

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Design Lead | | | |
| Business Owner | | | |

---

**Document Version:** 1.1.0
**Last Updated:** November 14, 2025
**Next Review:** November 21, 2025
**Status:** In Active Development

---

## CHANGELOG

### v1.1.0 - November 14, 2025
- ✅ Updated intelligence APIs from 16 to 17 (Reddit integration complete)
- ✅ Corrected SMB time investment claim with sourced data (Vertical Response, Outbound Engine 2019)
- ✅ Marked Day 0 database migration as COMPLETE
- ✅ Updated Reddit Intelligence feature with actual implementation details
- ✅ Reflected shared Supabase architecture with MARBA
- ✅ Added performance metrics for Reddit API and database queries
- ✅ Marked API key configuration as complete
- 🔄 Updated delivery timeline to reflect current progress