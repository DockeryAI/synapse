# Worktree 3: SocialPilot Integration - Complete Build Guide

**Branch:** `feature/socialpilot`
**Timeline:** Week 2-3 (10 days)
**Estimated Lines:** 1,400
**Your Role:** Build automated publishing to all social platforms

---

## 📋 QUICK START

You are Claude Instance #3. Your job is to integrate SocialPilot for automated publishing across 7 social platforms. Read this entire document, then execute tasks in order.

**Status Tracking:** Update `.buildrunner/features.json` after each task completion.

---

## 🎯 YOUR MISSION

Build the complete social media publishing automation:

1. **SocialPilot API Service** - Core API integration
2. **OAuth Authentication Flow** - Connect user accounts securely
3. **Publishing Automation Engine** - Auto-publish at scheduled times
4. **Status Tracker** - Monitor publishing success/failures
5. **UI Components** - Account connection and management

**Success Criteria:**
- OAuth flow works end-to-end
- Posts publish successfully to all 7 platforms
- Error handling and retry logic robust
- Real-time status updates
- >99% publishing reliability

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Create Your Worktree

```bash
cd /Users/byronhudson/Projects/Synapse

# Create your worktree
git worktree add ../Synapse-social -b feature/socialpilot

# Navigate to your worktree
cd /Users/byronhudson/Projects/Synapse-social

# Verify you're on the right branch
git branch
# Should show: * feature/socialpilot
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Verify installation
npm run build
# Should complete successfully
```

### Step 3: Get SocialPilot API Access

**IMPORTANT:** You'll need SocialPilot API credentials.

For development, use these test credentials:
```env
VITE_SOCIALPILOT_CLIENT_ID=test_client_id
VITE_SOCIALPILOT_CLIENT_SECRET=test_client_secret
VITE_SOCIALPILOT_REDIRECT_URI=http://localhost:5173/auth/socialpilot/callback
```

Add to `/Users/byronhudson/Projects/Synapse-social/.env.local`

---

## 📝 ATOMIC TASK LIST

### TASK 1: SocialPilot API Service
**File:** `src/services/socialpilot.service.ts`
**Lines:** ~450
**Status:** ⏸️ Not Started

**Requirements:**
Complete API integration with SocialPilot for all platform operations.

**SocialPilot API Endpoints:**
- POST `/oauth/authorize` - Start OAuth flow
- POST `/oauth/token` - Exchange code for token
- GET `/accounts` - List connected social accounts
- POST `/posts` - Create new post
- POST `/posts/schedule` - Schedule post for later
- GET `/posts/:id` - Get post status
- DELETE `/posts/:id` - Delete scheduled post
- GET `/posts/:id/analytics` - Get post performance

**Implementation:**
```typescript
export interface SocialPilotConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  name: string;
  handle: string;
  avatar: string;
  connected: boolean;
}

export interface PostSchedule {
  accountIds: string[];
  content: string;
  scheduledTime: Date;
  media?: string[];
  hashtags?: string[];
}

export interface PostResponse {
  id: string;
  status: 'scheduled' | 'published' | 'failed';
  accountsPosted: number;
  accountsFailed: number;
  error?: string;
}

export class SocialPilotService {
  private config: SocialPilotConfig;
  private accessToken?: string;
  private refreshToken?: string;

  constructor(config: SocialPilotConfig) {
    this.config = config;
  }

  // OAuth Methods
  async getAuthorizationUrl(): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'accounts:read posts:write analytics:read'
    });

    return `https://api.socialpilot.co/oauth/authorize?${params}`;
  }

  async exchangeCodeForToken(code: string): Promise<void> {
    const response = await fetch('https://api.socialpilot.co/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;

    // Store tokens securely in Supabase
    await this.storeTokens(data);
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://api.socialpilot.co/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;

    await this.storeTokens(data);
  }

  // Account Methods
  async getAccounts(): Promise<SocialAccount[]> {
    const response = await this.apiCall('GET', '/accounts');
    return response.accounts;
  }

  // Post Methods
  async schedulePost(params: PostSchedule): Promise<PostResponse> {
    const response = await this.apiCall('POST', '/posts/schedule', {
      account_ids: params.accountIds,
      text: params.content,
      scheduled_at: params.scheduledTime.toISOString(),
      media_urls: params.media,
      hashtags: params.hashtags
    });

    return response;
  }

  async getPostStatus(postId: string): Promise<PostResponse> {
    const response = await this.apiCall('GET', `/posts/${postId}`);
    return response;
  }

  async deletePost(postId: string): Promise<void> {
    await this.apiCall('DELETE', `/posts/${postId}`);
  }

  // Helper Methods
  private async apiCall(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `https://api.socialpilot.co${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (response.status === 401) {
        // Token expired, refresh and retry
        await this.refreshAccessToken();
        return this.apiCall(method, endpoint, body);
      }

      if (!response.ok) {
        throw new Error(`SocialPilot API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SocialPilot] API call failed:', error);
      throw error;
    }
  }

  private async storeTokens(data: any): Promise<void> {
    // Store in Supabase socialpilot_connections table
    const { supabase } = await import('@/lib/supabase');

    await supabase
      .from('socialpilot_connections')
      .upsert({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });
  }
}
```

**Error Handling:**
- Retry on network failures (max 3 attempts)
- Refresh token on 401 errors
- Log all errors with context
- Return user-friendly error messages

**Acceptance Criteria:**
- [ ] All API endpoints implemented
- [ ] OAuth flow complete
- [ ] Token refresh works
- [ ] Error handling robust
- [ ] Tokens stored securely

**Git Commit:**
```bash
git add src/services/socialpilot.service.ts
git commit -m "feat(social): Add SocialPilot API service

- Complete OAuth 2.0 flow implementation
- Account management endpoints
- Post scheduling and status tracking
- Token refresh automation
- Secure token storage in Supabase
- Comprehensive error handling"
git push origin feature/socialpilot
```

**Update BuildRunner:** Set completionPercentage: 30

---

### TASK 2: OAuth Authentication Flow & UI
**Files:**
- `src/components/calendar/SocialPilotSync.tsx` (~300 lines)
- `src/pages/SocialPilotCallback.tsx` (~100 lines)
**Status:** ⏸️ Not Started
**Dependencies:** SocialPilot Service (Task 1)

**Requirements:**
Build UI for users to connect their social accounts via OAuth.

**SocialPilotSync Component:**
```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SocialPilotService } from '@/services/socialpilot.service';
import { SocialAccount } from '@/services/socialpilot.service';

export const SocialPilotSync: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new SocialPilotService({
    clientId: import.meta.env.VITE_SOCIALPILOT_CLIENT_ID,
    clientSecret: import.meta.env.VITE_SOCIALPILOT_CLIENT_SECRET,
    redirectUri: import.meta.env.VITE_SOCIALPILOT_REDIRECT_URI
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await service.getAccounts();
      setAccounts(accounts);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const authUrl = await service.getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to start authorization');
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Connected Accounts</h2>
        <Button onClick={handleConnect}>
          Connect Social Accounts
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            No social accounts connected yet
          </p>
          <Button onClick={handleConnect}>
            Get Started
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(account => (
            <Card key={account.id} className="p-4">
              <div className="flex items-center gap-3">
                <img
                  src={account.avatar}
                  alt={account.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="font-semibold">{account.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {account.platform} • @{account.handle}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  account.connected ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
```

**OAuth Callback Page:**
```typescript
// src/pages/SocialPilotCallback.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SocialPilotService } from '@/services/socialpilot.service';

export const SocialPilotCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      return;
    }

    if (!code) {
      setStatus('error');
      return;
    }

    try {
      const service = new SocialPilotService({
        clientId: import.meta.env.VITE_SOCIALPILOT_CLIENT_ID,
        clientSecret: import.meta.env.VITE_SOCIALPILOT_CLIENT_SECRET,
        redirectUri: import.meta.env.VITE_SOCIALPILOT_REDIRECT_URI
      });

      await service.exchangeCodeForToken(code);
      setStatus('success');

      // Redirect to content calendar after 2 seconds
      setTimeout(() => {
        navigate('/content-calendar');
      }, 2000);
    } catch (err) {
      console.error('OAuth callback error:', err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {status === 'loading' && <div>Connecting accounts...</div>}
      {status === 'success' && (
        <div className="text-center">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <div className="text-xl font-semibold">Successfully Connected!</div>
          <div className="text-muted-foreground mt-2">
            Redirecting to calendar...
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">✗</div>
          <div className="text-xl font-semibold">Connection Failed</div>
          <Button onClick={() => navigate('/content-calendar')} className="mt-4">
            Return to Calendar
          </Button>
        </div>
      )}
    </div>
  );
};
```

**Add Route to App.tsx:**
```typescript
<Route path="/auth/socialpilot/callback" element={<SocialPilotCallback />} />
```

**Acceptance Criteria:**
- [ ] OAuth flow works end-to-end
- [ ] Accounts display correctly
- [ ] Connection status shown
- [ ] Error states handled
- [ ] Mobile responsive

**Git Commit:**
```bash
git add src/components/calendar/SocialPilotSync.tsx
git add src/pages/SocialPilotCallback.tsx
git add src/App.tsx
git commit -m "feat(social): Add OAuth UI and callback handling

- SocialPilotSync component for account management
- OAuth callback page with success/error states
- Account list with connection status
- Add OAuth callback route to App.tsx
- Mobile responsive design"
git push origin feature/socialpilot
```

**Update BuildRunner:** Set completionPercentage: 50

---

### TASK 3: Publishing Automation Engine
**File:** `src/services/publishing-automation.service.ts`
**Lines:** ~400
**Status:** ⏸️ Not Started
**Dependencies:** SocialPilot Service (Task 1)

**Requirements:**
Background service that monitors the publishing queue and auto-publishes content at scheduled times.

**Implementation:**
```typescript
export interface PublishingJob {
  contentId: string;
  scheduledTime: Date;
  accountIds: string[];
  content: string;
  media?: string[];
  hashtags?: string[];
  retryCount: number;
  maxRetries: number;
}

export class PublishingAutomationService {
  private intervalId?: NodeJS.Timer;
  private isRunning = false;

  // Start the automation engine (runs every 5 minutes)
  start(): void {
    if (this.isRunning) {
      console.warn('[Publishing] Already running');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('[Publishing] Automation started');

    // Process immediately on start
    this.processQueue();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('[Publishing] Automation stopped');
  }

  private async processQueue(): Promise<void> {
    console.log('[Publishing] Processing queue...');

    try {
      // Get all items due for publishing
      const dueItems = await this.getDueItems();

      console.log(`[Publishing] Found ${dueItems.length} items to publish`);

      // Process each item
      for (const item of dueItems) {
        await this.publishItem(item);
      }
    } catch (error) {
      console.error('[Publishing] Queue processing error:', error);
    }
  }

  private async getDueItems(): Promise<PublishingJob[]> {
    const { supabase } = await import('@/lib/supabase');

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const { data, error } = await supabase
      .from('publishing_queue')
      .select('*')
      .eq('status', 'pending')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', fiveMinutesFromNow.toISOString());

    if (error) throw error;

    return data || [];
  }

  private async publishItem(job: PublishingJob): Promise<void> {
    const { supabase } = await import('@/lib/supabase');
    const service = new SocialPilotService({
      clientId: import.meta.env.VITE_SOCIALPILOT_CLIENT_ID,
      clientSecret: import.meta.env.VITE_SOCIALPILOT_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_SOCIALPILOT_REDIRECT_URI
    });

    try {
      // Update status to 'publishing'
      await supabase
        .from('publishing_queue')
        .update({ status: 'publishing' })
        .eq('content_id', job.contentId);

      // Publish via SocialPilot
      const result = await service.schedulePost({
        accountIds: job.accountIds,
        content: job.content,
        scheduledTime: job.scheduledTime,
        media: job.media,
        hashtags: job.hashtags
      });

      // Update status to 'published'
      await supabase
        .from('publishing_queue')
        .update({
          status: 'published',
          platform_post_id: result.id,
          published_at: new Date().toISOString()
        })
        .eq('content_id', job.contentId);

      // Update content item status
      await supabase
        .from('content_calendar_items')
        .update({
          status: 'published',
          platform_post_id: result.id,
          published_time: new Date().toISOString()
        })
        .eq('id', job.contentId);

      console.log(`[Publishing] ✓ Published ${job.contentId}`);
    } catch (error) {
      console.error(`[Publishing] ✗ Failed ${job.contentId}:`, error);

      // Retry logic
      if (job.retryCount < job.maxRetries) {
        await this.scheduleRetry(job);
      } else {
        await this.markAsFailed(job, error);
      }
    }
  }

  private async scheduleRetry(job: PublishingJob): Promise<void> {
    const { supabase } = await import('@/lib/supabase');

    const nextRetry = new Date(Date.now() + 15 * 60 * 1000); // Retry in 15 minutes

    await supabase
      .from('publishing_queue')
      .update({
        status: 'pending',
        retry_count: job.retryCount + 1,
        next_retry: nextRetry.toISOString()
      })
      .eq('content_id', job.contentId);

    console.log(`[Publishing] Scheduled retry ${job.retryCount + 1}/${job.maxRetries} for ${job.contentId}`);
  }

  private async markAsFailed(job: PublishingJob, error: any): Promise<void> {
    const { supabase } = await import('@/lib/supabase');

    await supabase
      .from('publishing_queue')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('content_id', job.contentId);

    await supabase
      .from('content_calendar_items')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', job.contentId);

    console.log(`[Publishing] Marked ${job.contentId} as failed after ${job.maxRetries} retries`);
  }
}

// Export singleton instance
export const publishingAutomation = new PublishingAutomationService();
```

**Start Automation in main.tsx:**
```typescript
import { publishingAutomation } from '@/services/publishing-automation.service';

// Start publishing automation
publishingAutomation.start();
```

**Acceptance Criteria:**
- [ ] Runs every 5 minutes
- [ ] Publishes items on time
- [ ] Retry logic works (3 attempts)
- [ ] Updates statuses correctly
- [ ] Logs all activity

**Git Commit:**
```bash
git add src/services/publishing-automation.service.ts
git add src/main.tsx
git commit -m "feat(social): Add publishing automation engine

- Background service runs every 5 minutes
- Auto-publishes scheduled content
- Retry logic (max 3 attempts, 15 min intervals)
- Status updates in real-time
- Comprehensive error logging
- Singleton pattern for global access"
git push origin feature/socialpilot
```

**Update BuildRunner:** Set completionPercentage: 75

---

### TASK 4: Post Status Tracker & UI
**File:** `src/services/post-status-tracker.service.ts` (~250 lines)
**Status:** ⏸️ Not Started
**Dependencies:** Publishing Automation (Task 3)

**Requirements:**
Track publishing status and display real-time updates in UI.

**Implementation:**
```typescript
export interface PostStatus {
  contentId: string;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  scheduledTime: Date;
  publishedTime?: Date;
  accountsPosted: number;
  accountsFailed: number;
  platformPostId?: string;
  error?: string;
  retryCount: number;
  lastChecked: Date;
}

export class PostStatusTracker {
  async getStatus(contentId: string): Promise<PostStatus> {
    const { supabase } = await import('@/lib/supabase');

    const { data, error } = await supabase
      .from('publishing_queue')
      .select('*')
      .eq('content_id', contentId)
      .single();

    if (error) throw error;

    return this.formatStatus(data);
  }

  async getQueueStatus(days: number = 7): Promise<PostStatus[]> {
    const { supabase } = await import('@/lib/supabase');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from('publishing_queue')
      .select('*')
      .gte('scheduled_time', startDate.toISOString())
      .lte('scheduled_time', endDate.toISOString())
      .order('scheduled_time', { ascending: true });

    if (error) throw error;

    return data.map(item => this.formatStatus(item));
  }

  async subscribeToUpdates(
    contentId: string,
    callback: (status: PostStatus) => void
  ): Promise<() => void> {
    const { supabase } = await import('@/lib/supabase');

    const subscription = supabase
      .channel(`post-status-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'publishing_queue',
          filter: `content_id=eq.${contentId}`
        },
        (payload) => {
          callback(this.formatStatus(payload.new));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  private formatStatus(data: any): PostStatus {
    return {
      contentId: data.content_id,
      status: data.status,
      scheduledTime: new Date(data.scheduled_time),
      publishedTime: data.published_at ? new Date(data.published_at) : undefined,
      accountsPosted: data.accounts_posted || 0,
      accountsFailed: data.accounts_failed || 0,
      platformPostId: data.platform_post_id,
      error: data.error_message,
      retryCount: data.retry_count || 0,
      lastChecked: new Date()
    };
  }
}
```

**Update PublishingQueue Component:**
Add real-time status updates:
```typescript
useEffect(() => {
  const unsubscribe = statusTracker.subscribeToUpdates(contentId, (status) => {
    setPostStatus(status);
  });

  return () => unsubscribe();
}, [contentId]);
```

**Acceptance Criteria:**
- [ ] Real-time status updates
- [ ] WebSocket subscriptions work
- [ ] Error messages displayed
- [ ] Retry count shown
- [ ] Performance optimized

**Git Commit:**
```bash
git add src/services/post-status-tracker.service.ts
git commit -m "feat(social): Add post status tracker with real-time updates

- Track publishing status for all posts
- Real-time updates via Supabase subscriptions
- Display retry count and error messages
- 7-day queue status monitoring
- WebSocket cleanup on unmount"
git push origin feature/socialpilot
```

**Update BuildRunner:** Set completionPercentage: 100

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests

```typescript
// socialpilot.service.test.ts
describe('SocialPilotService', () => {
  it('should generate auth URL', () => {
    const url = service.getAuthorizationUrl();
    expect(url).toContain('socialpilot.co/oauth/authorize');
  });

  it('should handle token refresh', async () => {
    await service.refreshAccessToken();
    expect(service.accessToken).toBeDefined();
  });

  it('should schedule posts', async () => {
    const result = await service.schedulePost({
      accountIds: ['account-1'],
      content: 'Test post',
      scheduledTime: new Date()
    });
    expect(result.id).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('SocialPilot Integration', () => {
  it('should complete OAuth flow', async () => {
    // 1. Get auth URL
    const authUrl = await service.getAuthorizationUrl();

    // 2. Simulate callback with code
    await service.exchangeCodeForToken('test_code');

    // 3. Verify token stored
    expect(service.accessToken).toBeDefined();
  });

  it('should publish post end-to-end', async () => {
    // 1. Schedule post
    const result = await service.schedulePost(testPost);

    // 2. Check status
    const status = await tracker.getStatus(result.id);
    expect(status.status).toBe('published');
  });
});
```

### Coverage Target: 80%

---

## ✅ QUALITY GATES

```bash
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run lint
```

---

## 🚫 WHAT NOT TO DO

**DO NOT modify:**
- `services/parallel-intelligence.service.ts` (Developer 1)
- `services/synapse-calendar-bridge.service.ts` (Developer 2)
- `pages/SynapsePage.tsx` (Developer 4)
- `components/content-calendar/CalendarView.tsx` (Exists)

**DO modify:**
- `services/socialpilot.service.ts` (yours)
- `services/publishing-automation.service.ts` (yours)
- `services/post-status-tracker.service.ts` (yours)
- `components/calendar/SocialPilotSync.tsx` (yours)

---

## 📊 PROGRESS TRACKING

**Daily Updates** in `#synapse-social`
**BuildRunner Updates** after each task

---

## 🎯 SUCCESS CRITERIA

- [ ] OAuth flow works
- [ ] Posts publish to all 7 platforms
- [ ] >99% reliability
- [ ] Error handling robust
- [ ] Real-time updates work

**Estimated Time:** 10 days (Week 2-3)

**Your Impact:** You make publishing automatic!

---

**Ready to start? Begin with TASK 1: SocialPilot API Service**

**Good luck! 🚀**
