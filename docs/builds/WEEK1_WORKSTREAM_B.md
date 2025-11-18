# Week 1 Workstream B: Publishing Integration
**Estimated Time:** 14 hours
**Priority:** P0 - BLOCKING
**Worktree:** `publishing-integration`
**Branch:** `feature/publishing-integration`
**Can Run in Parallel:** Yes (with Workstream A)

---

## OBJECTIVE
Auto-schedule generated campaigns to SocialPilot and track publishing success.

---

## SETUP INSTRUCTIONS

```bash
# 1. Create worktree
cd /Users/byronhudson/Projects/Synapse
git worktree add worktrees/publishing-integration -b feature/publishing-integration

# 2. Navigate to worktree
cd worktrees/publishing-integration

# 3. Install dependencies (if needed)
npm install

# 4. Start dev server (use different port to avoid conflicts with Workstream A)
PORT=3001 npm run dev
```

---

## CONTEXT FILES TO READ

1. `/Users/byronhudson/Projects/Synapse/COMPREHENSIVE_GAP_ANALYSIS_NOV17.md`
   - Section 3: Publishing Automation

2. `/Users/byronhudson/Projects/Synapse/src/services/socialpilot.service.ts`
   - Understand existing SocialPilot integration

3. `/Users/byronhudson/Projects/Synapse/src/services/publishing-automation.service.ts`
   - Understand current publishing logic

4. `/Users/byronhudson/Projects/Synapse/src/components/content-calendar/PublishingQueue.tsx`
   - Understand publishing queue UI

---

## TASK 1: Create Auto-Scheduler Service (4 hours)

### File to Create: `src/services/publishing/auto-scheduler.service.ts`

**Requirements:**
- Bulk schedule all posts from a generated campaign
- Respect platform posting limits (Instagram 1/day, Facebook 3/day, etc.)
- Optimize posting times by platform and industry
- Handle timezone conversion
- Distribute posts evenly over campaign duration

**Key Functions:**
```typescript
interface BulkScheduleInput {
  campaignId: string;
  posts: GeneratedPost[];
  platforms: Platform[];
  startDate: Date;
  timezone: string;
  industry?: string;
}

interface ScheduleResult {
  scheduled: number;
  failed: number;
  schedule: ScheduledPost[];
  errors: ScheduleError[];
}

class AutoScheduler {
  async bulkSchedule(input: BulkScheduleInput): Promise<ScheduleResult>
  async getOptimalPostingTimes(platform: Platform, industry: string): Promise<Date[]>
  async distributePosts(posts: GeneratedPost[], duration: number): Promise<ScheduledPost[]>
}
```

**Platform Limits:**
```typescript
const PLATFORM_LIMITS = {
  instagram: { postsPerDay: 1, optimalTimes: ['9:00', '17:00', '21:00'] },
  facebook: { postsPerDay: 3, optimalTimes: ['9:00', '13:00', '19:00'] },
  twitter: { postsPerDay: 5, optimalTimes: ['8:00', '12:00', '17:00', '21:00', '23:00'] },
  linkedin: { postsPerDay: 2, optimalTimes: ['8:00', '17:00'] },
  tiktok: { postsPerDay: 2, optimalTimes: ['18:00', '21:00'] }
};
```

**Integration Points:**
- Use `socialpilot.service.ts` for actual API calls
- Use `scheduling/content-scheduler.ts` for date calculations
- Save to `content_calendar_items` table
- Update `publishing_queue` table

---

## TASK 2: Wire Campaign Generation → Auto-Scheduling (4 hours)

### Files to Modify:
1. `src/pages/OnboardingPageV5.tsx`
2. `src/services/campaign/CampaignOrchestrator.ts`

### OnboardingPageV5.tsx Changes:

**Add auto-schedule handler:**
```typescript
const handleScheduleCampaign = async () => {
  if (!generatedCampaign || !refinedData) {
    setExtractionError('Missing campaign data');
    return;
  }

  try {
    setIsScheduling(true);

    const autoScheduler = new AutoScheduler();
    const result = await autoScheduler.bulkSchedule({
      campaignId: generatedCampaign.id,
      posts: generatedCampaign.posts,
      platforms: ['linkedin', 'facebook', 'instagram'], // TODO: Let user select
      startDate: new Date(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      industry: businessData?.industryCode
    });

    if (result.failed > 0) {
      setExtractionError(`Scheduled ${result.scheduled} posts, ${result.failed} failed`);
    }

    setScheduleResult(result);
    setIsScheduling(false);
    setCurrentStep('schedule_confirmation');

  } catch (error) {
    console.error('[OnboardingPageV5] Scheduling failed:', error);
    setExtractionError(error instanceof Error ? error.message : 'Scheduling failed');
    setIsScheduling(false);
  }
};
```

**Add schedule confirmation view:**
```typescript
{currentStep === 'schedule_confirmation' && scheduleResult && (
  <ScheduleConfirmation
    result={scheduleResult}
    onViewCalendar={() => navigate('/calendar')}
    onScheduleMore={() => setCurrentStep('suggestions')}
  />
)}
```

**Add state:**
```typescript
const [isScheduling, setIsScheduling] = useState(false);
const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
```

---

## TASK 3: Add Publishing Analytics Tracking (6 hours)

### Files to Create:
1. `src/services/analytics/publishing-analytics.service.ts`
2. `src/components/analytics/PublishingDashboard.tsx`

### publishing-analytics.service.ts:

**Requirements:**
- Track publishing success/failure rates
- Track by platform, campaign type, time of day
- Store in `analytics_events` table
- Calculate metrics: success rate, avg engagement (placeholder for now)

**Key Functions:**
```typescript
interface PublishingEvent {
  id: string;
  postId: string;
  campaignId?: string;
  platform: Platform;
  status: 'scheduled' | 'published' | 'failed';
  scheduledFor: Date;
  publishedAt?: Date;
  error?: string;
  brandId: string;
}

class PublishingAnalytics {
  async trackPublishEvent(event: PublishingEvent): Promise<void>
  async getSuccessRate(brandId: string, timeframe: '7d' | '30d'): Promise<number>
  async getFailuresByPlatform(brandId: string): Promise<Record<Platform, number>>
  async getPublishingMetrics(brandId: string): Promise<PublishingMetrics>
}
```

**Database Schema (add migration):**
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  brand_id UUID REFERENCES brands(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_brand ON analytics_events(brand_id);
```

---

## TASK 4: Create Schedule Confirmation Component (4 hours)

### File to Create: `src/components/onboarding-v5/ScheduleConfirmation.tsx`

**Component Requirements:**
- Show summary: X posts scheduled over Y days
- Show platform breakdown
- Show posting schedule calendar view
- Show any failures with retry option
- "View Full Calendar" button
- "Schedule More Content" button

**Design:**
- Success state with confetti animation
- Green checkmarks for scheduled posts
- Calendar preview showing next 7 days
- Platform icons with post counts

---

## TESTING CHECKLIST

### Manual Testing:
- [ ] Generate campaign from onboarding
- [ ] Click "Schedule Campaign"
- [ ] Verify posts scheduled to SocialPilot
- [ ] Check content_calendar_items table
- [ ] Check publishing_queue table
- [ ] Verify optimal posting times used
- [ ] Test platform limits respected
- [ ] Test timezone conversion

### Unit Testing:
- [ ] Test AutoScheduler.bulkSchedule()
- [ ] Test optimal time calculation
- [ ] Test post distribution algorithm
- [ ] Test platform limit enforcement

### Integration Testing:
- [ ] Test SocialPilot API integration
- [ ] Test database saves
- [ ] Test analytics tracking
- [ ] Test error handling

---

## MERGE CHECKLIST

Before merging to main:
- [ ] All tests passing
- [ ] Manual testing complete
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] Build succeeds (`npm run build`)
- [ ] Code reviewed (self-review)
- [ ] Database migrations run successfully
- [ ] SocialPilot API tested in sandbox
- [ ] No merge conflicts with main

---

## MERGE COMMAND

```bash
# From main workspace
cd /Users/byronhudson/Projects/Synapse

# Pull latest main (including Workstream A if merged)
git checkout main
git pull origin main

# Merge feature branch
git merge feature/publishing-integration

# Resolve conflicts if any

# Run migrations
npx supabase db push

# Test merged code
npm install
npm run build
npm test

# Push to main
git push origin main

# Clean up worktree
git worktree remove worktrees/publishing-integration
git branch -d feature/publishing-integration
```

---

## SUCCESS CRITERIA

✅ **Complete when:**
1. Generated campaigns auto-schedule to SocialPilot
2. Platform limits respected (1/day Instagram, 3/day Facebook, etc.)
3. Optimal posting times used based on industry
4. Publishing events tracked in analytics
5. Schedule confirmation UI shows success
6. Users can navigate to full calendar
7. All posts saved to database
8. Manual testing passes

---

## ESTIMATED TIMELINE

- **Day 1 (8h):** Task 1 - AutoScheduler service
- **Day 2 (6h):** Task 2 & 3 - Wire to onboarding + analytics

**Total:** 14 hours over 1.5-2 days

**Can run in parallel with Workstream A**

---

## DEPENDENCIES

**Required:**
- ✅ SocialPilot API access
- ✅ socialpilot.service.ts (exists)
- ✅ Supabase tables (exist)

**Optional (can complete without):**
- 🟡 Workstream A (campaign generation) - Can test with mock data

**No blockers - can start immediately**

---

## NOTES

- Use SocialPilot sandbox for testing
- Add rate limiting to avoid API throttling
- Consider adding "Custom Schedule" option for advanced users
- Log all scheduling events for debugging
- Add retry mechanism for failed publishes

---

**STATUS:** Ready to execute
**NEXT:** Execute this build in the publishing-integration worktree (can run in parallel with Workstream A)
