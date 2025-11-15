# Parallel Claude Instance Prompts - Phase 1A, 1B, 1C

**Last Updated:** 2025-11-15
**Purpose:** Start multiple Claude instances in parallel to build Synapse features simultaneously

---

## Prerequisites

1. ✅ Old worktrees cleaned up (completed)
2. ✅ All atomic worktree task files created (14 files total)
3. ✅ Main branch clean and up to date

---

## PHASE 1A: Core MVP (Weeks 1-3)

### Week 1 - Parallel Group 1 (4 Claude Instances)

#### Claude Instance #1: Foundation
```
I'm working on the Synapse MVP. I need you to build the Foundation feature using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-foundation.md

This includes:
- Universal URL Parser (4 hours)
- Database Schema Setup (6 hours)
- 15+ tables with RLS policies

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #2: Location Detection
```
I'm working on the Synapse MVP. I need you to build the Global Location Detection Engine using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-location-detection.md

This includes:
- Multi-level location detection (IP, Google Places, manual)
- Service area mapping
- Location caching
- Database tables

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #3: Intelligence Gatherer
```
I'm working on the Synapse MVP. I need you to build the Parallel Intelligence Gathering System using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-intelligence-gatherer.md

This includes:
- 8 API integrations (Weather, News, Reddit, SEMrush, OutScraper, Serper, YouTube, Website Analyzer)
- Parallel execution with race conditions
- Error handling and fallbacks
- Database tables

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #4: Industry Profile Generator
```
I'm working on the Synapse MVP. I need you to build the Dynamic Industry Profile Auto-Generation feature using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-industry-autogen.md

This includes:
- Integration with Brandock NAICS data
- Opus-powered profile generation
- Caching strategy (7 days)
- Micro-segmentation

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

---

### Week 2 - Parallel Group 2 (4 Claude Instances)

#### Claude Instance #5: Specialty Detection
```
I'm working on the Synapse MVP. I need you to build the Deep Specialty Detection Engine using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-specialty-detection.md

This includes:
- 3 detection sources (About page, Reviews, Services)
- Pattern matching and entity extraction
- Confidence scoring
- Auto-mapping to NAICS subcategories

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #6: Social Media Intelligence
```
I'm working on the Synapse MVP. I need you to build the Social Media Intelligence & Content Analyzer using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-social-analyzer.md

This includes:
- YouTube content analysis (videos, comments, themes)
- Social media scraping (light, ethical)
- SocialPilot metadata integration
- Learning loop from generated content
- Performance insights

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #7: Product Scanner & UVP Wizard
```
I'm working on the Synapse MVP. I need you to build the Product/Service Scanner AND Intelligence-Driven UVP Wizard 2.0 using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-product-scanner-uvp.md

This includes:
- Product/service extraction from website (8 hours)
- UVP Wizard 2.0 with pre-discovery intelligence (18 hours)
- Pattern recognition across 20+ data sources
- Transformation extraction
- Differentiation analysis
- 4-step validation workflow

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #8: Bannerbear Templates
```
I'm working on the Synapse MVP. I need you to build the Bannerbear Universal Template System using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-bannerbear.md

This includes:
- 7 template types with 8 variables
- Industry-specific adaptations
- Multi-platform sizing
- Auto-population from business data

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

---

### Week 3 - Parallel Group 3 (2 Claude Instances)

#### Claude Instance #9: Business Profile Management
```
I'm working on the Synapse MVP. I need you to build the Business Profile Management feature using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-profile-management.md

This includes:
- Profile CRUD operations
- Product/service management
- Multi-profile support
- Profile switching
- All settings in one place

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #10: AI Campaign Generator (Core)
```
I'm working on the Synapse MVP. I need you to build the AI Campaign Generator (CORE VERSION - 3 campaign types) using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-campaign-generator.md

This includes:
- 3 MVP campaign types (Authority Builder, Social Proof, Local Pulse)
- NOT the 4th type (Competitor Crusher) - that's Phase 1B
- AI suggestion logic
- Template engine
- Post generation
- SocialPilot integration

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

---

## PHASE 1B: Content Marketing (Weeks 4-5)

### Week 4-5 - Parallel Group (4 Claude Instances)

#### Claude Instance #11: Long-Form Content Generator
```
I'm working on Synapse Phase 1B. I need you to build the Long-Form Content Generator (Blog & Newsletter) using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-long-form-content.md

This includes:
- Blog article expander (500-2000 words)
- Newsletter template builder (5 layouts)
- Weekly digest compiler
- Email platform exports
- SEO meta description generator

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #12: Landing Pages & Lead Capture
```
I'm working on Synapse Phase 1B. I need you to build the Landing Page Generator & Lead Capture system using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-landing-pages.md

This includes:
- 5 landing page templates (Service, Product, Event, Webinar, Download)
- Auto-population from business profile
- Drag-and-drop form builder
- Lead capture to database
- Email notifications
- CSV export
- UTM tracking

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #13: SEO Intelligence & Optimizer
```
I'm working on Synapse Phase 1B. I need you to build the SEO Intelligence & Content Optimizer using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-seo-intelligence.md

This includes:
- Real-time SEO scoring (0-100)
- Keyword density optimization
- Local SEO dominator ("near me" traffic)
- Quick win finder (page 2→1 keywords)
- SEMrush API integration (6 endpoints)
- Meta tag generator
- Schema markup generator

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #14: Perplexity Local Intelligence
```
I'm working on Synapse Phase 1B. I need you to build the Perplexity Local Intelligence feature using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-perplexity-local.md

This includes:
- Real-time local event discovery
- Community news monitoring
- Festival/celebration detection
- Seasonal trend tracking
- Integration with Local Pulse campaign type

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

---

## PHASE 1C: Video Capabilities (Weeks 6-7)

### Week 6-7 - Parallel Group (2 Claude Instances)

#### Claude Instance #15: Multi-Platform Video Editor
```
I'm working on Synapse Phase 1C. I need you to build the Multi-Platform Video Editor using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-video-editor.md

This includes:
- Browser-based video editing (FFmpeg.wasm, Remotion)
- Trim, cut, text overlays, music, transitions
- Filters and effects (10+ presets)
- Auto-generated captions (Whisper API)
- Speed control
- Timeline editor
- Export functionality

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

#### Claude Instance #16: Platform Auto-Formatting
```
I'm working on Synapse Phase 1C. I need you to build the Platform Auto-Formatting for Video using the worktree strategy.

Please follow the instructions in this file exactly:
/Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-video-formatter.md

This includes:
- Auto-format one video for 7 platforms (LinkedIn, Instagram, TikTok, etc.)
- Aspect ratio conversion (9:16, 16:9, 1:1, 4:5)
- Smart crop or letterbox
- Platform-specific safe zones
- Duration trimming to platform limits
- Batch export
- Direct export to SocialPilot

Create the worktree, build the feature, test it, and when complete, let me know it's ready for merge.

Do NOT merge back to main - I will handle that. Just build and test in the worktree.
```

---

## How to Use These Prompts

### Option 1: Manual (Open 4 Claude Windows)
1. Open 4 separate Claude Code windows/terminals
2. Copy/paste the corresponding prompt to each
3. Monitor progress across all 4
4. Merge completed worktrees in order

### Option 2: Automated (If using Claude API)
```bash
# Example automation script structure (not provided, just concept)
for prompt in week1_prompts:
    spawn_claude_instance(prompt)

wait_for_completion()
merge_worktrees_in_order()
```

### Merge Order (Important!)

**Week 1:**
1. Foundation FIRST (creates database schema)
2. Then any order: Location, Intelligence, Industry

**Week 2:**
1. Social Analyzer FIRST (needed by UVP Wizard)
2. Then any order: Specialty, Product/UVP, Bannerbear

**Week 3:**
1. Profile Management FIRST
2. Then Campaign Generator

**Week 4-5:**
- Any order, all independent

**Week 6-7:**
1. Video Editor FIRST
2. Then Video Formatter

---

## Verification Checklist

Before starting parallel builds:
- [ ] All 16 worktree task files exist
- [ ] Old worktrees cleaned up
- [ ] Main branch is clean
- [ ] .env file has all required API keys
- [ ] Supabase project is set up

During parallel builds:
- [ ] Monitor each Claude instance's progress
- [ ] Check for errors in real-time
- [ ] Ensure no file conflicts (each worktree should touch different files)

After completion:
- [ ] Test each feature in its worktree before merging
- [ ] Merge in correct order
- [ ] Test integrated features after merge
- [ ] Run full test suite
- [ ] Verify no regressions

---

## Estimated Timeline with Parallel Builds

**Week 1 (4 parallel):** 40h → 10h (4x speedup)
**Week 2 (4 parallel):** 46h → 12h (4x speedup)
**Week 3 (2 parallel):** 34h → 17h (2x speedup)
**Week 4-5 (4 parallel):** 80h → 20h (4x speedup)
**Week 6-7 (2 parallel):** 70h → 35h (2x speedup)

**Total Phase 1:** 300h → ~94h (3.2x speedup)

**With aggressive 5-6 parallel:** Could achieve ~60-70h total (4-5x speedup)

---

## Troubleshooting

**If merge conflicts occur:**
- Should be rare (different files per worktree)
- Resolve in favor of latest feature
- Coordinate with other Claude instances

**If a worktree build fails:**
- Isolate the issue in that worktree
- Fix without affecting others
- Other worktrees continue unaffected

**If dependencies missing:**
- Foundation must complete before Week 2 starts
- Social Analyzer must complete before UVP Wizard
- Video Editor must complete before Video Formatter

---

*These prompts enable 4-6x faster development through parallel Claude instances working on isolated features simultaneously.*
