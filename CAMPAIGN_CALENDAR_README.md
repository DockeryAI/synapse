# 📅 Campaign Calendar V3 - Multi-Platform Orchestration

**Status:** Complete
**Author:** Roy (the guy who's seen calendar systems come and go)
**Date:** 2024-12-17
**Context:** 5-14 day calendars with 2-3 platform orchestration

---

## 🎯 Overview

Complete campaign calendar system that generates, orchestrates, edits, approves, and schedules content across multiple social platforms. Because managing 14 days of content across 3 platforms manually is apparently a form of medieval torture.

### What This Does

- **Generates** 5-14 day content calendars
- **Orchestrates** 2-3 platforms simultaneously
- **Adapts** content for platform-specific requirements
- **Tracks** approvals with revision history
- **Schedules** to SocialPilot with retry logic
- **Prevents** hook fatigue with rotation
- **Validates** everything before it goes live

---

## 📦 What's Included

### Services

#### 1. CalendarGenerator
Generates complete campaign calendars with intelligent post distribution.

**Features:**
- 5, 7, 10, or 14-day calendars
- 2-3 platform distribution
- Content type variety (video 35%, image 25%, carousel 15%, story 15%, text 10%)
- Hook rotation to prevent fatigue
- Optimal timing per platform
- GMB posts for local businesses (2x/week)

**Usage:**
```typescript
import { CalendarGenerator } from '@/services/calendar-v3';

const calendar = await CalendarGenerator.generate({
  campaignId: 'camp_123',
  campaignType: 'authority-builder',
  duration: 7,
  platforms: ['instagram', 'facebook', 'linkedin'],
  startDate: new Date(),
  businessContext: {
    businessId: 'biz_456',
    businessName: 'Acme Corp',
    industry: 'Professional Services',
    isLocal: true,
    hasGMB: true,
  },
  contentStrategy: {
    goals: ['Increase brand awareness'],
    contentPillars: ['expertise', 'innovation', 'results'],
    hookTypes: ['question', 'curiosity', 'value'],
    contentMix: {
      video: 35,
      image: 25,
      carousel: 15,
      story: 15,
      text: 10,
    },
  },
  preferences: {
    postFrequency: 'moderate', // conservative | moderate | aggressive
    includeWeekends: true,
    hookRotationEnabled: true,
  },
});

console.log(`Generated ${calendar.posts.length} posts over ${calendar.duration} days`);
```

#### 2. PlatformOrchestrator
Coordinates content across multiple platforms with intelligent adaptation.

**Features:**
- Cross-platform content adaptation
- Character limit handling
- Hashtag optimization per platform
- Platform-specific formatting
- Duplicate content detection
- Timing strategies (simultaneous/staggered/sequential)
- GMB post scheduling

**Usage:**
```typescript
import { PlatformOrchestrator } from '@/services/calendar-v3';

// Orchestrate single post across platforms
const orchestratedPost = await PlatformOrchestrator.orchestratePost(
  post,
  ['facebook', 'linkedin'] // Additional platforms
);

// Validate orchestration (check for conflicts)
const validation = PlatformOrchestrator.validateOrchestration(calendar.posts);
if (!validation.isValid) {
  console.error('Orchestration issues:', validation.issues);
  console.warn('Warnings:', validation.warnings);
}

// Add GMB posts for local business
const withGMB = PlatformOrchestrator.addGMBPosts(
  calendar.posts,
  startDate,
  duration
);
```

#### 3. ApprovalWorkflow
Manages review, editing, and approval of posts before scheduling.

**Features:**
- Individual approval/rejection
- Bulk approval operations
- Revision requests with history
- Content editing with tracking
- Timing adjustments
- Platform add/remove
- Validation before approval
- Auto-approval for high-quality posts

**Usage:**
```typescript
import { ApprovalWorkflow } from '@/services/calendar-v3';

// Approve single post
const approved = ApprovalWorkflow.approvePost(post, 'user@example.com');

// Reject with reason
const rejected = ApprovalWorkflow.rejectPost(
  post,
  'reviewer@example.com',
  'Hook needs to be more engaging'
);

// Request revisions
const needsWork = ApprovalWorkflow.requestRevision(
  post,
  'editor@example.com',
  'Please add more specific metrics in the body'
);

// Bulk approve
const updated = ApprovalWorkflow.bulkApprove(calendar, {
  calendarId: calendar.id,
  postIds: ['post_1', 'post_2', 'post_3'],
  action: 'approve',
  approvedBy: 'manager@example.com',
});

// Edit content
const edited = ApprovalWorkflow.editContent(post, {
  postId: post.id,
  updates: {
    hook: 'New improved hook!',
    hashtags: ['marketing', 'socialmedia'],
  },
  editedBy: 'editor@example.com',
});

// Validate before approval
const validation = ApprovalWorkflow.validateBeforeApproval(post);
if (!validation.canApprove) {
  console.error('Cannot approve:', validation.errors);
}

// Get approval progress
const progress = ApprovalWorkflow.getApprovalProgress(calendar);
console.log(`${progress.approved}/${progress.total} posts approved (${progress.percentageApproved.toFixed(1)}%)`);

// Auto-approve high-quality posts
const autoApproved = ApprovalWorkflow.autoApprove(calendar, 85); // Min score: 85
```

#### 4. SocialPilotScheduler
Schedules approved posts to SocialPilot with retry logic and error handling.

**Features:**
- Single and bulk scheduling
- Retry logic (3 attempts)
- Platform-specific formatting
- Timezone support
- Error recovery
- Schedule cancellation
- Rescheduling
- Status tracking

**Usage:**
```typescript
import { SocialPilotScheduler } from '@/services/calendar-v3';

// Schedule single post
const scheduled = await SocialPilotScheduler.schedulePost(
  post,
  'America/New_York'
);

// Schedule multiple posts
const results = await SocialPilotScheduler.schedulePosts(
  approvedPosts,
  'America/Los_Angeles'
);

// Schedule entire calendar
const scheduledCalendar = await SocialPilotScheduler.scheduleCalendar(
  calendar,
  'America/Chicago'
);

// Get scheduling status
const status = SocialPilotScheduler.getSchedulingStatus(calendar);
console.log(`Scheduled: ${status.scheduled}/${status.total}`);
console.log(`Failed: ${status.failed}`);

// Retry failed
const retried = await SocialPilotScheduler.retryFailedScheduling(calendar);

// Cancel scheduled post
const cancelled = await SocialPilotScheduler.cancelScheduledPost(post);

// Reschedule
const rescheduled = await SocialPilotScheduler.reschedulePost(
  post,
  newDate,
  '15:00'
);
```

---

## 🚀 Complete Workflow Example

```typescript
import {
  CalendarGenerator,
  PlatformOrchestrator,
  ApprovalWorkflow,
  SocialPilotScheduler
} from '@/services/calendar-v3';

// 1. Generate calendar
const calendar = await CalendarGenerator.generate({
  campaignId: 'camp_123',
  campaignType: 'authority-builder',
  duration: 7,
  platforms: ['instagram', 'facebook', 'linkedin'],
  startDate: new Date(),
  businessContext: {
    businessId: 'biz_456',
    businessName: 'TechStartup Inc',
    industry: 'Technology',
    isLocal: false,
    hasGMB: false,
  },
  contentStrategy: {
    goals: ['Increase brand awareness', 'Generate leads'],
    contentPillars: ['innovation', 'expertise', 'results'],
    hookTypes: ['question', 'curiosity', 'value'],
    contentMix: { video: 40, image: 25, carousel: 20, story: 10, text: 5 },
  },
});

console.log(`✅ Generated ${calendar.posts.length} posts`);

// 2. Validate orchestration
const orchestrationCheck = PlatformOrchestrator.validateOrchestration(calendar.posts);
if (!orchestrationCheck.isValid) {
  console.error('⚠️  Orchestration issues:', orchestrationCheck.issues);
}

// 3. Review and approve posts
for (const post of calendar.posts) {
  // Validate
  const validation = ApprovalWorkflow.validateBeforeApproval(post);

  if (!validation.isValid) {
    console.log(`❌ Post ${post.id} has errors:`, validation.errors);
    continue;
  }

  // Auto-approve or manual review
  if (post.metadata.qualityScore && post.metadata.qualityScore >= 85) {
    // Auto-approve high-quality posts
    const approved = ApprovalWorkflow.approvePost(post, 'system');
    console.log(`✅ Auto-approved: ${post.content.hook.substring(0, 50)}...`);
  } else {
    // Manual review required
    console.log(`👀 Needs review: ${post.content.hook.substring(0, 50)}...`);
  }
}

// 4. Get approval progress
const progress = ApprovalWorkflow.getApprovalProgress(calendar);
console.log(`📊 Approval: ${progress.approved}/${progress.total} (${progress.percentageApproved.toFixed(1)}%)`);

// 5. Schedule to SocialPilot
if (progress.canSchedule) {
  const scheduledCalendar = await SocialPilotScheduler.scheduleCalendar(
    calendar,
    'America/Los_Angeles'
  );

  const status = SocialPilotScheduler.getSchedulingStatus(scheduledCalendar);
  console.log(`📅 Scheduled: ${status.scheduled}/${status.total}`);

  if (status.failed > 0) {
    console.warn(`⚠️  Failed to schedule ${status.failed} posts`);
    console.log('Failures:', status.failures);

    // Retry
    const retried = await SocialPilotScheduler.retryFailedScheduling(scheduledCalendar);
  }
}

console.log('🎉 Campaign calendar complete!');
```

---

## 📊 Platform Limits & Optimal Times

### Character Limits

| Platform | Limit | Hashtags | Optimal Times |
|----------|-------|----------|---------------|
| Facebook | 63,206 | 30 | 09:00, 13:00, 15:00, 19:00 |
| Instagram | 2,200 | 30 | 08:00, 12:00, 17:00, 20:00 |
| Twitter | 280 | 2 | 08:00, 12:00, 15:00, 17:00, 21:00 |
| LinkedIn | 3,000 | 5 | 07:30, 12:00, 17:00 |
| TikTok | 2,200 | 5 | 06:00, 10:00, 15:00, 19:00, 22:00 |
| YouTube | 5,000 | 15 | 14:00, 18:00 |
| GMB | 1,500 | 0 | 10:00, 18:00 |

### Posting Frequency Limits

| Platform | Max/Day | Min Gap (minutes) |
|----------|---------|-------------------|
| Facebook | 5 | 120 |
| Instagram | 3 | 180 |
| Twitter | 10 | 60 |
| LinkedIn | 2 | 240 |
| TikTok | 4 | 180 |
| YouTube | 1 | 1440 (24h) |
| GMB | 2 | 360 |

---

## 🎨 Content Mix Recommendations

### Default Mix (2025 Video-First)
- **Video:** 35% (Reels, Shorts, TikTok)
- **Image:** 25% (Static posts)
- **Carousel:** 15% (Multi-image/slide)
- **Story:** 15% (24h ephemeral)
- **Text:** 10% (LinkedIn thought leadership)

### Platform Adjustments
- **TikTok/Instagram:** +10% video, -5% image, -5% text
- **LinkedIn:** +10% text, -10% story
- **Local Business:** +15% GMB posts

---

## 🔄 Hook Rotation

Prevents audience fatigue by rotating hook types:

### Hook Types
1. **Question** - "Did you know...?"
2. **Shock** - "This will blow your mind..."
3. **Curiosity** - "Wait until you see..."
4. **Emotion** - "This made me cry..."
5. **Value** - "Here's exactly how to..."
6. **Story** - "Last week something incredible..."
7. **Challenge** - "Think you can't? Watch this..."

### Rotation Strategy
- **Max consecutive same type:** 2
- **Tracks usage count and effectiveness**
- **Selects least recently used**
- **Performance-based adjustment**

---

## ✅ Validation Rules

### Pre-Approval Validation

**Errors** (blocking):
- Missing hook
- Missing body content
- No platforms selected
- Scheduled in the past

**Warnings** (non-blocking):
- Missing CTA
- No media for video/image posts
- Low quality score

### Orchestration Validation

**Issues**:
- Duplicate content same platform same day
- Exceeds daily posting limits
- Posts too close together

**Warnings**:
- Posts closer than recommended gap
- Non-optimal posting times
- Imbalanced platform distribution

---

## 🔧 Configuration

### Post Frequency

```typescript
type Frequency = 'conservative' | 'moderate' | 'aggressive';

// Conservative: 1 post/day (7 total for 7 days)
// Moderate: 2 posts/day (14 total for 7 days)
// Aggressive: 3 posts/day (21 total for 7 days)
```

### Timing Strategies

```typescript
type TimingStrategy = 'simultaneous' | 'staggered' | 'sequential';

// Simultaneous: All platforms at same time
// Staggered: 15min gaps between platforms
// Sequential: Ordered posting (e.g., LinkedIn → Facebook → Instagram)
```

### Cross-Platform Strategy

```typescript
type CrossPlatformStrategy = 'identical' | 'adapted' | 'unique';

// Identical: Same content everywhere
// Adapted: Platform-specific formatting
// Unique: Different content per platform
```

---

## 📈 Statistics & Progress

### Calendar Statistics
```typescript
{
  totalPosts: 14,
  postsByPlatform: { instagram: 5, facebook: 5, linkedin: 4 },
  postsByType: { video: 5, image: 4, carousel: 3, story: 2 },
  postsByDay: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
  approvalRate: 85.7, // percentage
  scheduledCount: 12,
  publishedCount: 0
}
```

### Approval Progress
```typescript
{
  total: 14,
  pending: 2,
  approved: 10,
  rejected: 1,
  needsRevision: 1,
  percentageApproved: 71.4,
  isComplete: false,
  canSchedule: true
}
```

### Scheduling Status
```typescript
{
  total: 14,
  scheduled: 12,
  failed: 2,
  pending: 0,
  percentageScheduled: 85.7,
  isComplete: false,
  failures: [
    {
      postId: 'post_123',
      platform: 'instagram',
      error: 'Rate limit exceeded',
      attempts: 3,
      lastAttempt: Date
    }
  ]
}
```

---

## 🚨 Error Handling

### Retryable Errors
- Rate limiting (429)
- Timeouts
- Network errors
- 503 Service Unavailable

### Non-Retryable Errors
- Authentication failures
- Invalid content
- Platform API changes
- Content policy violations

### Retry Strategy
- **Max attempts:** 3
- **Delay:** 2s, 4s, 8s (exponential backoff)
- **Auto-retry on:** Rate limits, timeouts, network issues

---

## 🧪 Testing

### Unit Tests

```bash
npm test src/services/calendar-v3
```

### Integration Tests

```bash
npm test:integration calendar
```

### Manual Testing Checklist

- [ ] Generate 5-day calendar
- [ ] Generate 7-day calendar
- [ ] Generate 10-day calendar
- [ ] Generate 14-day calendar
- [ ] 2 platform orchestration
- [ ] 3 platform orchestration
- [ ] GMB posts for local business
- [ ] Approve individual post
- [ ] Bulk approve
- [ ] Edit content
- [ ] Edit timing
- [ ] Add/remove platform
- [ ] Schedule single post
- [ ] Schedule full calendar
- [ ] Retry failed scheduling
- [ ] Cancel scheduled post

---

## 🐛 Known Issues

### SocialPilot API
- Rate limits are aggressive (100 requests/hour)
- Occasional 503 errors during peak times
- GMB scheduling sometimes delayed

### Platform Quirks
- **Instagram:** Stories must be 9:16 aspect ratio
- **LinkedIn:** Video uploads slower than other platforms
- **TikTok:** Requires separate authentication flow
- **GMB:** Posts don't support hashtags (they're filtered out)

### Edge Cases
- Daylight Saving Time transitions (use UTC internally)
- Timezone changes mid-calendar
- Platform API changes breaking formatting
- Duplicate content detection with emoji/unicode

---

## 📚 Type Definitions

All types available in `src/types/calendar.types.ts`:

```typescript
import type {
  CampaignCalendar,
  CalendarPost,
  PostContent,
  OrchestrationConfig,
  ApprovalInfo,
  SchedulingInfo,
  CalendarGenerationRequest,
  SocialPlatform,
  ContentType,
  PostStatus,
  ApprovalStatus,
} from '@/types/calendar.types';
```

---

## 🤝 Contributing

When adding new features:

1. Update types in `calendar.types.ts`
2. Add service methods with JSDoc
3. Include error handling
4. Add tests
5. Update this README

---

## 📞 Support

Issues? Questions? Calendar nightmares?

1. Check this README
2. Check type definitions
3. Check existing tests
4. File issue with reproduction steps

---

**Built with calendar trauma and API battle scars by Roy** 📅💀

*"If scheduling social media was easy, SocialPilot wouldn't exist." - Murphy's Law, Social Media Edition*
