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
SMBs spend 20+ hours/month on social media marketing with poor results due to:
- Lack of marketing expertise
- Generic content that doesn't resonate
- Inconsistent posting schedule
- No understanding of platform optimization

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
| 16 Parallel Intelligence APIs | Gather comprehensive business data | P0 |
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
- **Intelligence Gathering:** <30 seconds (16 APIs in parallel)
- **Content Generation:** <15 seconds
- **Industry Profile Lookup:** <10ms
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

### Platforms NOT in MVP
- Pinterest
- YouTube
- Snapchat
- Reddit
- Discord

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

### Day 0: Database Migration (CRITICAL - BEFORE ALL ELSE)
- Export 380 NAICS codes from MARBA ✓
- Export 147 industry profiles from MARBA ✓
- Create Supabase tables ✓
- Import all data to Supabase ✓
- Verify data integrity (527 total records) ✓
- **Blocker:** All backend services depend on this

### Week 1-2: Backend Development
- Universal URL Parser ✓
- 16 API Integration ✓
- Specialty Detection (uses industry database) ✓
- Calendar Population (uses industry profiles) ✓

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

### Data Dependencies (CRITICAL - Must Complete First)
- **Industry Database Migration:** 380 NAICS codes + 147 industry profiles
  - **Source:** MARBA project `/Users/byronhudson/Projects/MARBA`
  - **Destination:** Synapse Supabase project
  - **Estimated Time:** 2 hours
  - **Blocks:** Specialty Detection, Content Generation, Smart Scheduling

### External Dependencies
- **Critical:** SocialPilot API, OpenRouter (Claude), Supabase
- **Important:** Apify, OutScraper, Serper
- **Nice-to-have:** SEMrush, YouTube API, Weather API

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
- Multi-location support
- Team collaboration
- Advanced analytics
- A/B testing
- Pinterest integration

### Phase 3 (Month 4-6)
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

**Document Version:** 1.0.0
**Last Updated:** November 14, 2025
**Next Review:** November 21, 2025
**Status:** Ready for Development