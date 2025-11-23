# Week 3 Atomic Task List: Video-First + Immediate Win Tactics

**Focus:** Copy-paste tactics SMBs can use Monday morning
**Duration:** 5 days (Mon-Fri)
**Worktrees:** 4 parallel tracks
**Prerequisites:** Week 2 trees merged (Product Scanner, UVP Integration, Bannerbear)

---

## Worktree 1: Video Content System (Mon-Tue, 16h)
**Branch:** `feature/video-content-system`
**Path:** `../synapse-video-system`

### Atomic Tasks:

1. **Setup & Dependencies (1h)**
   - [ ] Create worktree from main
   - [ ] Install dependencies: `@remotion/cli`, `@remotion/lambda`, `ffmpeg.wasm`
   - [ ] Create directory: `src/services/video/`
   - [ ] Create types: `src/types/video.types.ts`

2. **Video Template Service (4h)**
   - [ ] Create `src/services/video/VideoTemplateService.ts`
   - [ ] Define video template interface (15-60 seconds, vertical 9:16)
   - [ ] Templates: Behind-the-scenes, Product demo, Testimonial, Tutorial, Trending
   - [ ] Each template has: hook (3 seconds), body, CTA
   - [ ] Export template registry
   - [ ] Unit tests for template selection

3. **Stories Ad Templates (3h)**
   - [ ] Create `src/services/video/StoriesAdService.ts`
   - [ ] Vertical full-screen templates (9:16)
   - [ ] Templates: Flash sale, Product launch, Event promotion, Limited offer
   - [ ] Countdown stickers, swipe-up CTA, product tags
   - [ ] Brand overlay (logo, colors)
   - [ ] Export Stories template registry

4. **Auto-Caption Generator (4h)**
   - [ ] Create `src/services/video/AutoCaptionService.ts`
   - [ ] Integrate Whisper API (OpenAI)
   - [ ] Extract audio from video
   - [ ] Generate SRT/VTT captions
   - [ ] Burn captions into video (accessibility + algorithm boost)
   - [ ] Caption styling (font, position, background)
   - [ ] Unit tests for caption generation

5. **Trending Audio Integration (3h)**
   - [ ] Create `src/services/video/TrendingAudioService.ts`
   - [ ] Curated trending audio library (licensed)
   - [ ] Audio by platform: TikTok, Instagram Reels, YouTube Shorts
   - [ ] Audio metadata: trend score, genre, vibe
   - [ ] Audio suggestion based on campaign type
   - [ ] Audio preview player

6. **Testing & Verification (1h)**
   - [ ] Test video generation end-to-end
   - [ ] Verify 9:16 aspect ratio
   - [ ] Test captions accuracy
   - [ ] Verify trending audio integration
   - [ ] Test Stories ad templates
   - [ ] Commit and prepare for review

---

## Worktree 2: Google My Business + Social Commerce (Wed, 12h)
**Branch:** `feature/gmb-social-commerce`
**Path:** `../synapse-gmb-commerce`

### Atomic Tasks:

1. **Setup & Dependencies (1h)**
   - [ ] Create worktree from main
   - [ ] Install: `googleapis` (Google My Business API)
   - [ ] Create directory: `src/services/gmb/`
   - [ ] Create types: `src/types/gmb.types.ts`
   - [ ] Set up Google API credentials

2. **Google My Business API Integration (4h)**
   - [ ] Create `src/services/gmb/GMBService.ts`
   - [ ] Implement OAuth flow for GMB connection
   - [ ] Get business locations API call
   - [ ] Create post API call (updates, offers, events)
   - [ ] Schedule post API call
   - [ ] Post types: Update, Offer, Event, Product
   - [ ] Image upload support
   - [ ] Error handling and retry logic

3. **GMB Post Scheduler (2h)**
   - [ ] Create `src/services/gmb/GMBScheduler.ts`
   - [ ] 2x/week posting schedule
   - [ ] Post type rotation (update → offer → event)
   - [ ] Auto-generate GMB content from campaign
   - [ ] Queue management (upcoming posts)
   - [ ] Integration with campaign calendar

4. **Instagram Shopping Integration (3h)**
   - [ ] Create `src/services/commerce/InstagramShoppingService.ts`
   - [ ] Product catalog sync (from Product Scanner)
   - [ ] Product tagging in posts/Stories
   - [ ] Instagram Shop setup flow
   - [ ] Shoppable post templates
   - [ ] Product tag placement suggestions

5. **Facebook Shop Integration (2h)**
   - [ ] Create `src/services/commerce/FacebookShopService.ts`
   - [ ] Sync with Instagram Shopping (unified catalog)
   - [ ] Facebook Shop storefront setup
   - [ ] Product tags in posts
   - [ ] Facebook Marketplace integration
   - [ ] Direct checkout links

6. **Testing & Verification (1h)**
   - [ ] Test GMB OAuth flow
   - [ ] Verify GMB post creation
   - [ ] Test product catalog sync
   - [ ] Verify Instagram/Facebook Shop integration
   - [ ] Test shoppable post templates
   - [ ] Commit and prepare for review

---

## Worktree 3: Immediate Win Tactics (Thu, 12h)
**Branch:** `feature/immediate-win-tactics`
**Path:** `../synapse-immediate-wins`

### Atomic Tasks:

1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/services/tactics/`
   - [ ] Create types: `src/types/tactics.types.ts`
   - [ ] Create components: `src/components/tactics/`

2. **User-Generated Content Contest Templates (3h)**
   - [ ] Create `src/services/tactics/UGCContestService.ts`
   - [ ] Contest types: Photo contest, Video contest, Review contest
   - [ ] Auto-generate contest rules
   - [ ] Hashtag generator for contests
   - [ ] Prize suggestion based on business type
   - [ ] Contest post templates (announcement, reminder, winner)
   - [ ] Tracking: entries, engagement, winner selection
   - [ ] Expected: 30% engagement boost

3. **Strategic Hashtag Formula Builder (3h)**
   - [ ] Create `src/services/tactics/HashtagBuilderService.ts`
   - [ ] Formula: 3 branded + 10 niche + 5 trending
   - [ ] Branded: business name, location, specialty
   - [ ] Niche: industry-specific, 10K-50K post volume
   - [ ] Trending: platform trending page, refresh daily
   - [ ] Competitor hashtag research
   - [ ] Performance tracking per hashtag
   - [ ] Hashtag rotation strategy

4. **Email Capture Landing Pages (3h)**
   - [ ] Create `src/components/tactics/EmailCapturePage.tsx`
   - [ ] Templates: Discount offer, Free guide, Checklist download
   - [ ] Lead magnet suggestions by business type
   - [ ] Form: email + optional name/phone
   - [ ] "Link in bio" integration
   - [ ] Thank you page + email confirmation
   - [ ] Expected: 2-5% conversion rate
   - [ ] Integration with email service (Mailchimp/ConvertKit)

5. **Seasonal Calendar Detector (2h)**
   - [ ] Create `src/services/tactics/SeasonalCalendarService.ts`
   - [ ] Holiday calendar (major + industry-specific)
   - [ ] Q4 emphasis (40% of SMB revenue for retail)
   - [ ] Local events from Perplexity API
   - [ ] Start promoting 2-3 weeks before dates
   - [ ] Campaign suggestions by season/holiday
   - [ ] Alert system for upcoming opportunities

6. **Tactics Dashboard Component (1h)**
   - [ ] Create `src/components/tactics/TacticsDashboard.tsx`
   - [ ] Display all immediate win tactics
   - [ ] One-click activate per tactic
   - [ ] Expected results (engagement boost, conversion rate)
   - [ ] Cost indicator ($0 for free tactics)
   - [ ] "Start Monday" emphasis

7. **Testing & Verification (30min)**
   - [ ] Test UGC contest generation
   - [ ] Verify hashtag formula (3+10+5)
   - [ ] Test email capture page
   - [ ] Verify seasonal calendar detection
   - [ ] Test tactics dashboard UI
   - [ ] Commit and prepare for review

---

## Worktree 4: Mobile Optimization (Fri, 8h)
**Branch:** `feature/mobile-optimization`
**Path:** `../synapse-mobile-opt`

### Atomic Tasks:

1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/components/mobile/`
   - [ ] Create types: `src/types/mobile.types.ts`

2. **Mobile-First Preview Mode (3h)**
   - [ ] Create `src/components/mobile/MobilePreview.tsx`
   - [ ] Phone frame mockup (iPhone/Android)
   - [ ] Platform selection: Instagram, TikTok, Facebook
   - [ ] Real-time content preview in phone frame
   - [ ] Vertical video preview (9:16)
   - [ ] Stories preview (full-screen)
   - [ ] Interactive: swipe between posts

3. **Thumb-Scroll Stopping Test (2h)**
   - [ ] Create `src/services/mobile/ThumbScrollTest.ts`
   - [ ] Auto-scroll simulation (user scrolling feed)
   - [ ] "Stop score" based on: hook strength, visual appeal, first 3 seconds
   - [ ] Visual heatmap: what catches attention
   - [ ] Recommendations if stop score < 70%
   - [ ] A/B test different hooks

4. **Format Validation Service (2h)**
   - [ ] Create `src/services/mobile/FormatValidator.ts`
   - [ ] Check video aspect ratio (9:16 vertical)
   - [ ] Verify text readability on mobile (min font size)
   - [ ] Image resolution checks (min 1080x1920)
   - [ ] Caption length validation per platform
   - [ ] Loading speed test (under 3 seconds)
   - [ ] Fix suggestions if validation fails

5. **Responsive Component Audit (1h)**
   - [ ] Audit all campaign components for mobile
   - [ ] Fix any layout issues on small screens
   - [ ] Touch-friendly buttons (min 44px)
   - [ ] Swipe gestures where appropriate
   - [ ] Mobile navigation improvements

6. **Testing & Verification (30min)**
   - [ ] Test on iPhone (Safari)
   - [ ] Test on Android (Chrome)
   - [ ] Verify thumb-scroll test accuracy
   - [ ] Test format validator
   - [ ] Verify all components responsive
   - [ ] Commit and prepare for review

---

## Integration & Testing (Fri afternoon, 4h)

**All Worktrees Merged:**

1. **Cross-Feature Integration (2h)**
   - [ ] Merge Worktree 1 (Video System)
   - [ ] Merge Worktree 2 (GMB + Social Commerce)
   - [ ] Merge Worktree 3 (Immediate Win Tactics)
   - [ ] Merge Worktree 4 (Mobile Optimization)
   - [ ] Resolve any merge conflicts
   - [ ] Verify no breaking changes

2. **End-to-End Testing (2h)**
   - [ ] Test: Video generation → Stories ads → Mobile preview
   - [ ] Test: GMB post creation → scheduling
   - [ ] Test: Instagram Shopping → product tagging
   - [ ] Test: UGC contest → hashtag formula → email capture
   - [ ] Test: Seasonal calendar → campaign suggestions
   - [ ] Test: Mobile preview on real devices
   - [ ] Verify all immediate win tactics work

3. **Documentation & Review (30min)**
   - [ ] Update README with new features
   - [ ] Document API integrations (GMB, Instagram, Facebook)
   - [ ] Create user guide for immediate win tactics
   - [ ] Prepare demo for user testing

---

## Success Criteria

**Video System:**
- ✅ Generate 15-60 second vertical videos (9:16)
- ✅ Stories ads templates with CTA/countdown
- ✅ Auto-captions burned into video
- ✅ Trending audio suggestions by platform

**GMB + Social Commerce:**
- ✅ GMB OAuth flow working
- ✅ 2x/week GMB post scheduling
- ✅ Instagram Shopping + Facebook Shop integration
- ✅ Product tagging in posts/Stories

**Immediate Win Tactics:**
- ✅ UGC contest templates (30% engagement boost)
- ✅ Hashtag formula builder (3+10+5)
- ✅ Email capture pages (2-5% conversion)
- ✅ Seasonal calendar with Q4 emphasis

**Mobile Optimization:**
- ✅ Mobile-first preview mode
- ✅ Thumb-scroll stopping test (70%+ stop score)
- ✅ Format validation (9:16, text size, speed)
- ✅ All components responsive

---

## Week 3 Deliverables

**SMBs can now:**
1. Generate vertical videos with auto-captions (10x+ engagement)
2. Create Stories ads ($0.50-$2 CPM vs $8-$15 feed)
3. Post to Google My Business 2x/week (5x local visibility)
4. Tag products in Instagram/Facebook posts
5. Run UGC contests (30% engagement boost, $0 cost)
6. Use proven hashtag formula (3+10+5)
7. Capture emails from social (2-5% conversion)
8. Plan seasonal campaigns (Q4 = 40% revenue)
9. Preview everything on mobile before posting
10. Test if content stops thumb-scrolling

**Ready for Week 4:** Campaign intelligence + benchmarks
