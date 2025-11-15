# Implementation Plan - Complete Without SocialPilot API Keys
**Date:** November 14, 2025
**Objective:** Implement all remaining MVP features that can be completed without SocialPilot API access
**Reddit API:** Available in .env (can implement fully)
**SocialPilot API:** Mock implementation with production-ready architecture

---

## SCOPE: What CAN Be Implemented

### ✅ Fully Implementable (100%)
1. **Reddit Intelligence Service** - API keys available in .env
2. **Specialty Detection Service** - No external API needed
3. **URL Parser Service** - No external API needed
4. **Publishing Automation Engine** - Architecture with mocked SocialPilot calls
5. **Post Status Tracker Service** - Infrastructure ready
6. **SocialPilot Service Structure** - Mock implementation, production-ready interface
7. **Database Tables** - Publishing queue, SocialPilot accounts, post status
8. **UI Components** - Account connection UI, status displays
9. **Error Handling & Retry Logic** - Full implementation
10. **Integration Testing** - End-to-end with mocks

### 🟡 Partially Implementable
1. **SocialPilot OAuth Flow** - UI flow complete, actual OAuth needs API keys
2. **Platform Publishing** - Queue management complete, actual posting needs API keys

### ❌ Not Implementable Without API Keys
1. Live OAuth token exchange with SocialPilot
2. Real publishing to social platforms
3. Live account synchronization from SocialPilot

---

## IMPLEMENTATION STRATEGY

### Core Principle: Production-Ready Mock Architecture
All services will be implemented with:
- **Abstraction Layer:** Clean interfaces that hide implementation details
- **Mock Mode:** Environment variable `SOCIALPILOT_MOCK=true` enables mock responses
- **Production Ready:** Simply adding API keys will enable real functionality
- **Full Testing:** All logic tested with realistic mock data

---

## DETAILED TASK BREAKDOWN

### Phase 1: Foundation Services (No External APIs)

#### Task 1.1: Universal URL Parser Service
**File:** `src/services/url-parser.service.ts`
**Dependencies:** None
**Estimated Lines:** 250
**Complexity:** Low

**Requirements:**
- Parse any URL format (http, https, www, no-www)
- Support 50+ international TLDs (.com, .co.uk, .com.au, .de, etc.)
- Extract: protocol, subdomain, domain, path, query params
- Normalize URLs for consistency
- Validate URL structure
- Handle edge cases (IDN domains, punycode, IP addresses)

**Interface:**
```typescript
interface ParsedURL {
  original: string;
  normalized: string;
  protocol: string;
  subdomain: string | null;
  domain: string;
  tld: string;
  path: string;
  queryParams: Record<string, string>;
  isValid: boolean;
  validationErrors: string[];
}

export class URLParserService {
  parse(url: string): ParsedURL
  normalize(url: string): string
  isValid(url: string): boolean
  extractDomain(url: string): string
}
```

**Test Cases:**
- example.com → https://example.com
- www.example.co.uk → https://www.example.co.uk
- https://subdomain.example.com/path?query=value
- Invalid URLs should return errors
- International domains (IDN/punycode)

---

#### Task 1.2: Specialty Detection Service
**File:** `src/services/specialty-detection.service.ts`
**Dependencies:** OpenAI/Claude (already available), Industry profiles
**Estimated Lines:** 400
**Complexity:** Medium

**Requirements:**
- Analyze website content + business data to detect niche specialty
- Differentiate "wedding bakery" from "bakery"
- Differentiate "antique car insurance" from "insurance"
- Extract niche keywords (not just industry keywords)
- Identify target market segment
- Provide confidence score (0-100)
- Provide reasoning for detection

**Interface:**
```typescript
interface SpecialtyDetection {
  industry: string; // "bakery"
  specialty: string; // "wedding cakes & custom desserts"
  niche_keywords: string[]; // ["wedding cakes", "custom desserts", "bridal events"]
  target_market: string; // "engaged couples planning weddings"
  confidence: number; // 0-100
  reasoning: string;
  detected_from: string[]; // ["website_content", "business_description", "reviews"]
}

export class SpecialtyDetectionService {
  async detectSpecialty(
    websiteContent: string,
    businessName: string,
    intelligence: IntelligenceResult[]
  ): Promise<SpecialtyDetection>
}
```

**Algorithm:**
1. Extract keywords from website content
2. Analyze business description and services
3. Review customer reviews for specialty mentions
4. Compare against NAICS industry profiles
5. Use Claude to identify niche positioning
6. Calculate confidence based on evidence strength

---

#### Task 1.3: Reddit Intelligence Service
**File:** `src/services/reddit-intelligence.service.ts`
**Dependencies:** Reddit API (keys in .env)
**Estimated Lines:** 600
**Complexity:** High

**Requirements:**
- Discover relevant subreddits for a business specialty
- Mine psychological triggers from Reddit discussions
- Extract customer pain points ("I hate when...")
- Extract customer desires ("I wish...")
- Identify trending topics in industry
- Find service request opportunities
- Public API implementation (60 req/min, no OAuth needed)

**Interface:**
```typescript
interface PsychologicalTrigger {
  type: 'curiosity' | 'fear' | 'desire' | 'belonging' | 'achievement' | 'trust' | 'urgency';
  text: string;
  upvotes: number;
  subreddit: string;
  post_url: string;
  confidence: number; // validated by upvotes
}

interface RedditOpportunity {
  post_title: string;
  post_text: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  opportunity_type: 'service_request' | 'pain_point' | 'trend' | 'competitor_mention';
  relevance_score: number;
  post_url: string;
}

interface RedditIntelligence {
  psychological_triggers: PsychologicalTrigger[];
  pain_points: string[];
  desires: string[];
  opportunities: RedditOpportunity[];
  relevant_subreddits: string[];
  trending_topics: string[];
  content_ideas: string[];
}

export class RedditIntelligenceService {
  async discoverSubreddits(specialty: string, location?: string): Promise<string[]>
  async minePsychologicalTriggers(subreddits: string[]): Promise<PsychologicalTrigger[]>
  async findOpportunities(specialty: string, subreddits: string[]): Promise<RedditOpportunity[]>
  async gatherIntelligence(specialty: string, location?: string): Promise<RedditIntelligence>
}
```

**Implementation Details:**
- Use Reddit JSON API (no auth required)
- Search patterns: "looking for [specialty]", "need help with [specialty]"
- Pain points: "I hate when", "frustrated with", "annoyed by"
- Desires: "I wish", "if only", "would love to"
- Rate limit: 60 req/min (implement request throttling)
- Cache results for 24 hours

---

### Phase 2: Publishing Infrastructure (Mock SocialPilot)

#### Task 2.1: Database Migrations for Publishing
**File:** `supabase/migrations/[timestamp]_publishing_infrastructure.sql`
**Dependencies:** None
**Estimated Lines:** 200
**Complexity:** Low

**Requirements:**
- `socialpilot_accounts` table
- `publishing_queue` table
- `post_status_history` table
- Indexes for performance
- RLS policies

**Schema:**
```sql
-- SocialPilot connected accounts
CREATE TABLE socialpilot_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL, -- Platform-specific account ID
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand_id, platform, account_id)
);

-- Publishing queue (links content items to accounts)
CREATE TABLE publishing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID REFERENCES content_calendar_items(id) ON DELETE CASCADE,
  socialpilot_account_id UUID REFERENCES socialpilot_accounts(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'publishing', 'published', 'failed', 'cancelled'
  socialpilot_post_id TEXT, -- ID from SocialPilot after publishing
  platform_post_id TEXT, -- ID from platform (Twitter ID, etc.)
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Post status history (audit trail)
CREATE TABLE post_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publishing_queue_id UUID REFERENCES publishing_queue(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_socialpilot_accounts_brand ON socialpilot_accounts(brand_id);
CREATE INDEX idx_socialpilot_accounts_user ON socialpilot_accounts(user_id);
CREATE INDEX idx_socialpilot_accounts_platform ON socialpilot_accounts(platform);
CREATE INDEX idx_publishing_queue_content ON publishing_queue(content_item_id);
CREATE INDEX idx_publishing_queue_account ON publishing_queue(socialpilot_account_id);
CREATE INDEX idx_publishing_queue_scheduled ON publishing_queue(scheduled_time);
CREATE INDEX idx_publishing_queue_status ON publishing_queue(status);
CREATE INDEX idx_post_status_history_queue ON post_status_history(publishing_queue_id);
```

---

#### Task 2.2: SocialPilot Service (Mock Implementation)
**File:** `src/services/socialpilot.service.ts`
**Dependencies:** None (mocked)
**Estimated Lines:** 500
**Complexity:** Medium

**Requirements:**
- OAuth flow structure (mock token exchange)
- Account listing and sync (mock accounts)
- Post creation (mock successful creation)
- Post scheduling (mock successful scheduling)
- Post status checking (mock status updates)
- Error simulation for testing

**Interface:**
```typescript
interface SocialPilotAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  account_name: string;
  account_id: string;
  is_active: boolean;
}

interface SocialPilotPost {
  id: string;
  platform: string;
  content: string;
  scheduled_time: string;
  status: 'scheduled' | 'published' | 'failed';
  platform_post_id?: string;
  error_message?: string;
}

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class SocialPilotService {
  // OAuth flow
  async getAuthorizationUrl(redirectUri: string): Promise<string>
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens>
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens>

  // Account management
  async listAccounts(accessToken: string): Promise<SocialPilotAccount[]>
  async syncAccounts(brandId: string, userId: string, accessToken: string): Promise<void>

  // Publishing
  async createPost(accountId: string, content: string, scheduledTime: Date): Promise<SocialPilotPost>
  async getPostStatus(postId: string): Promise<SocialPilotPost>
  async cancelPost(postId: string): Promise<void>

  // Webhook handling
  async handleWebhook(payload: any): Promise<void>
}
```

**Mock Implementation:**
- Environment variable: `SOCIALPILOT_MOCK=true`
- Mock OAuth returns fake tokens
- Mock accounts return sample accounts for each platform
- Mock publishing succeeds after 2-second delay
- Mock status updates simulate real-world timing
- Randomly simulate errors (5% failure rate) for testing

---

#### Task 2.3: Publishing Automation Engine
**File:** `src/services/publishing-automation.service.ts`
**Dependencies:** SocialPilot service, database
**Estimated Lines:** 450
**Complexity:** High

**Requirements:**
- Background job that runs every 5 minutes
- Query publishing queue for posts due now (±5 min window)
- Publish posts via SocialPilot service
- Update status in real-time
- Implement retry logic (3 attempts, exponential backoff)
- Handle errors gracefully
- Track publishing metrics
- Dead letter queue for failed posts

**Interface:**
```typescript
interface PublishingJob {
  id: string;
  content_item_id: string;
  account_id: string;
  scheduled_time: Date;
  retry_count: number;
}

interface PublishingResult {
  success: boolean;
  post_id?: string;
  error?: string;
  retry_after?: number; // seconds
}

export class PublishingAutomationService {
  async processQueue(): Promise<void>
  async publishPost(job: PublishingJob): Promise<PublishingResult>
  async retryFailedPost(job: PublishingJob): Promise<PublishingResult>
  async moveToDeadLetterQueue(job: PublishingJob, reason: string): Promise<void>
  async getQueueStats(): Promise<QueueStats>
}
```

**Algorithm:**
1. Every 5 minutes, query `publishing_queue` for posts due now
2. For each post:
   - Check retry count < max_retries
   - Update status to 'publishing'
   - Call SocialPilot API to create/schedule post
   - On success: update status to 'published', store post IDs
   - On failure: increment retry_count, schedule retry with backoff
   - If max_retries exceeded: move to dead letter queue
3. Log all actions to `post_status_history`
4. Update analytics

**Retry Strategy:**
- Attempt 1: Immediate
- Attempt 2: 5 minutes later
- Attempt 3: 15 minutes later
- After 3 failures: Move to dead letter queue, notify user

---

#### Task 2.4: Post Status Tracker Service
**File:** `src/services/post-status-tracker.service.ts`
**Dependencies:** SocialPilot service, database
**Estimated Lines:** 300
**Complexity:** Medium

**Requirements:**
- Real-time status updates via Supabase subscriptions
- Webhook handler for SocialPilot status updates
- Status polling for platforms without webhooks
- Update UI in real-time
- Track publishing analytics

**Interface:**
```typescript
interface PostStatus {
  id: string;
  content_item_id: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled';
  platform: string;
  scheduled_time: Date;
  published_at?: Date;
  error_message?: string;
  retry_count: number;
  platform_post_url?: string;
}

export class PostStatusTrackerService {
  async getStatus(queueId: string): Promise<PostStatus>
  async updateStatus(queueId: string, status: string, metadata?: any): Promise<void>
  async subscribeToUpdates(contentItemId: string, callback: (status: PostStatus) => void): () => void
  async getPublishingHistory(contentItemId: string): Promise<PostStatus[]>
  async handleWebhook(platform: string, payload: any): Promise<void>
}
```

---

### Phase 3: UI Integration

#### Task 3.1: SocialPilot Connection UI
**File:** `src/components/publishing/SocialPilotConnect.tsx`
**Dependencies:** SocialPilot service
**Estimated Lines:** 350
**Complexity:** Medium

**Requirements:**
- "Connect SocialPilot" button
- OAuth flow initiation (opens popup/redirect)
- Account selection after OAuth
- Display connected accounts
- Disconnect account functionality
- Connection status indicator

**Component:**
```typescript
export function SocialPilotConnect() {
  // Features:
  // - "Connect Account" button
  // - OAuth popup/redirect flow
  // - Account list with platform icons
  // - Disconnect button per account
  // - Connection status badge
  // - Error messages
}
```

---

#### Task 3.2: Account Selector Component
**File:** `src/components/publishing/AccountSelector.tsx`
**Dependencies:** Database
**Estimated Lines:** 250
**Complexity:** Low

**Requirements:**
- Multi-select for platforms
- Display connected accounts
- Show platform icons
- Disable unconnected platforms
- Show account names
- Validation (at least one account selected)

**Component:**
```typescript
export function AccountSelector({
  selectedAccounts,
  onSelect,
  contentItem
}: AccountSelectorProps) {
  // Features:
  // - Checkbox per connected account
  // - Platform icons
  // - Account names
  // - "Connect new account" link
  // - Validation messages
}
```

---

#### Task 3.3: Publishing Status Display
**File:** `src/components/publishing/PublishingStatus.tsx`
**Dependencies:** Post status tracker
**Estimated Lines:** 300
**Complexity:** Medium

**Requirements:**
- Real-time status updates
- Platform-specific status icons
- Progress indicators
- Error messages with retry button
- Published post links
- Publishing history

**Component:**
```typescript
export function PublishingStatus({ contentItemId }: PublishingStatusProps) {
  // Features:
  // - Real-time status subscription
  // - Status badges (pending, publishing, published, failed)
  // - Platform icons
  // - Links to published posts
  // - Error messages
  // - Retry button for failed posts
  // - Publishing history timeline
}
```

---

#### Task 3.4: Integration with ContentCalendarHub
**File:** `src/components/content-calendar/ContentCalendarHub.tsx` (modify)
**Dependencies:** All publishing services
**Estimated Lines:** +150 (additions)
**Complexity:** Medium

**Requirements:**
- Add "Publish to SocialPilot" button to content items
- Account selector in publishing flow
- Status display for scheduled posts
- Bulk publishing option
- Publishing queue view

**Additions:**
```typescript
// Add to ContentCalendarHub:
// 1. Publishing button on each content item
// 2. Account selector modal
// 3. Publishing status indicators
// 4. Bulk select for multi-publish
// 5. Publishing queue tab
```

---

### Phase 4: Testing & Validation

#### Task 4.1: Unit Tests
**Files:** `*.test.ts` for each service
**Dependencies:** Jest, test utilities
**Estimated Lines:** 800
**Complexity:** Medium

**Requirements:**
- URL Parser: 50+ test cases
- Specialty Detection: 20+ test cases
- Reddit Intelligence: 30+ test cases
- SocialPilot Service: 40+ test cases (all mocked)
- Publishing Automation: 50+ test cases
- Status Tracker: 20+ test cases
- Target: 80% code coverage

---

#### Task 4.2: Integration Tests
**Files:** `integration/*.test.ts`
**Dependencies:** Test database
**Estimated Lines:** 500
**Complexity:** High

**Requirements:**
- End-to-end content creation → publishing flow
- OAuth flow (mocked)
- Queue processing
- Retry logic
- Status updates
- Error scenarios

---

#### Task 4.3: API Endpoint Verification
**File:** `ENDPOINT_VERIFICATION_REPORT.md`
**Dependencies:** All services
**Complexity:** Medium

**Requirements:**
- Test all Reddit API endpoints
- Verify all Supabase queries
- Check all database migrations applied
- Validate all indexes exist
- Test caching layer
- Verify error handling

---

### Phase 5: Documentation & Handoff

#### Task 5.1: API Documentation
**File:** `docs/API_DOCUMENTATION.md`
**Estimated Lines:** 600
**Complexity:** Low

**Requirements:**
- Document all service interfaces
- Code examples for each service
- Mock vs production mode explanation
- Environment variables
- Error codes and handling

---

#### Task 5.2: SocialPilot Integration Guide
**File:** `docs/SOCIALPILOT_INTEGRATION_GUIDE.md`
**Estimated Lines:** 400
**Complexity:** Low

**Requirements:**
- How to obtain SocialPilot API keys
- OAuth app setup instructions
- Webhook configuration
- Switching from mock to production
- Testing checklist
- Troubleshooting guide

---

## TASK EXECUTION ORDER

### Sprint 1: Foundation (Tasks 1.1 - 1.3)
1. Task 1.1: URL Parser Service
2. Task 1.2: Specialty Detection Service
3. Task 1.3: Reddit Intelligence Service

### Sprint 2: Publishing Infrastructure (Tasks 2.1 - 2.4)
4. Task 2.1: Database Migrations
5. Task 2.2: SocialPilot Service (Mock)
6. Task 2.3: Publishing Automation Engine
7. Task 2.4: Post Status Tracker

### Sprint 3: UI Integration (Tasks 3.1 - 3.4)
8. Task 3.1: SocialPilot Connect UI
9. Task 3.2: Account Selector
10. Task 3.3: Publishing Status Display
11. Task 3.4: ContentCalendarHub Integration

### Sprint 4: Testing & Validation (Tasks 4.1 - 4.3)
12. Task 4.1: Unit Tests
13. Task 4.2: Integration Tests
14. Task 4.3: Endpoint Verification

### Sprint 5: Documentation (Tasks 5.1 - 5.2)
15. Task 5.1: API Documentation
16. Task 5.2: SocialPilot Integration Guide

---

## SUCCESS CRITERIA

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] ESLint with zero errors
- [ ] 80%+ test coverage
- [ ] All services have JSDoc documentation
- [ ] No console.log statements
- [ ] Proper error handling throughout

### Functionality
- [ ] URL parser handles 50+ test cases
- [ ] Specialty detection provides accurate results
- [ ] Reddit intelligence returns real data from API
- [ ] Publishing queue processes posts
- [ ] Status updates work in real-time
- [ ] Retry logic handles failures
- [ ] UI components render correctly
- [ ] End-to-end flow works with mocks

### Production Readiness
- [ ] Environment variables documented
- [ ] Mock mode clearly indicated in UI
- [ ] Database migrations applied
- [ ] Indexes created
- [ ] RLS policies active
- [ ] Error messages user-friendly
- [ ] Loading states implemented
- [ ] Responsive design

### Documentation
- [ ] All interfaces documented
- [ ] Code examples provided
- [ ] Integration guide complete
- [ ] Handoff document clear

---

## ESTIMATED TIMELINE

**Total Tasks:** 16
**Estimated Time:** 15-20 hours (with Claude assistance)
**Breakdown:**
- Sprint 1 (Foundation): 4-6 hours
- Sprint 2 (Publishing): 4-6 hours
- Sprint 3 (UI): 3-4 hours
- Sprint 4 (Testing): 2-3 hours
- Sprint 5 (Documentation): 1-2 hours

---

## NOTES FOR HANDOFF

This plan is designed for seamless handoff between Claude sessions:
1. Each task is atomic and self-contained
2. Dependencies clearly marked
3. Interfaces specified upfront
4. Test cases defined
5. Success criteria measurable

Any Claude can pick up at any task and continue without context loss.

---

**Document Version:** 1.0
**Created:** November 14, 2025
**Status:** Ready for Execution
