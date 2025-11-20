# SocialPilot API Integration Documentation

**API Version:** v1.0.11
**Base URL:** `https://api.socialpilot.co/v1`
**Documentation:** https://apidocs.socialpilot.co/
**Created:** November 20, 2025
**Status:** Research Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Synapse Integration Plan](#synapse-integration-plan)
7. [Implementation Checklist](#implementation-checklist)

---

## Overview

SocialPilot provides a REST API for managing social media accounts, scheduling posts, uploading media, and retrieving analytics. This API will enable Synapse to programmatically publish AI-generated campaign content to clients' social media platforms.

### Supported Platforms
- Facebook (Pages, Groups)
- Instagram (Business accounts)
- LinkedIn (Personal, Company Pages)
- Twitter/X
- TikTok
- Pinterest
- Google My Business
- Tumblr
- Bluesky

### Key Capabilities
- Multi-platform post scheduling
- Media upload (images, videos, GIFs)
- Account/group management
- Mention monitoring
- Content library (save templates)
- AI caption generation (OpenAI integration)

---

## Authentication

### Method: API Key Authentication

**Header Name:** `x-api-key`
**Required:** All endpoints require authentication

**Example Request:**
```bash
curl -X GET "https://api.socialpilot.co/v1/accounts/list" \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

**Obtaining API Key:**
- Contact SocialPilot team for API access
- API keys are tied to your SocialPilot account
- Keep keys secure in environment variables (never commit to repo)

**Synapse Implementation:**
```typescript
// Store in .env
SOCIALPILOT_API_KEY=your_api_key_here

// Use in service
const headers = {
  'x-api-key': process.env.SOCIALPILOT_API_KEY,
  'Content-Type': 'application/json'
};
```

---

## Core Endpoints

### 1. Account Management

#### GET /accounts/list
**Purpose:** Retrieve connected social media accounts

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Results per page (default: 10) |
| q | string | No | Search query for account name/username |
| groupId | string | No | Filter by specific group UUID |
| clientId | string | No | Filter by client UUID |
| platform | string | No | Filter by platform (facebook, instagram, linkedin, etc.) |
| sortBy | string | No | Sort field (name, platform, createdAt) |
| team | boolean | No | Include team accounts |
| multiFilter | object | No | Complex filtering options |
| ignoreAccountIds | array | No | Exclude specific account UUIDs |
| onlyAccountData | boolean | No | Return minimal account data only |

**Response Schema:**
```json
{
  "message": "Success",
  "response": {
    "accounts": [
      {
        "loginId": "uuid",
        "username": "account_handle",
        "profilePicture": "https://...",
        "platform": "instagram",
        "accessToken": "encrypted_token",
        "hasAnalytics": true,
        "hasInbox": true,
        "isActive": true,
        "connectedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 10
  }
}
```

**Synapse Use Case:**
- Display available social accounts to clients during campaign setup
- Filter accounts by platform for campaign type (e.g., only Instagram for Viral Spark campaigns)
- Verify account connectivity before scheduling posts

---

#### GET /group/list
**Purpose:** Retrieve account groups (collections of social accounts)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Results per page |
| q | string | No | Search query |
| sortBy | string | No | Sort field |
| sortOrder | string | No | asc or desc |

**Response Schema:**
```json
{
  "message": "Success",
  "response": {
    "groups": [
      {
        "groupId": "uuid",
        "groupName": "Client XYZ - All Platforms",
        "groupDesc": "Main social accounts",
        "accountCount": 3,
        "platforms": ["facebook", "instagram", "linkedin"],
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 12,
    "page": 1
  }
}
```

**Synapse Use Case:**
- Organize client accounts into logical groups
- Select all accounts for a client with one groupId
- Display account groups in campaign setup UI

---

### 2. Group Operations

#### POST /group/create
**Purpose:** Create new account group

**Request Body:**
```json
{
  "groupName": "Phoenix Insurance - Social Media",
  "groupDesc": "All social accounts for Phoenix Insurance client",
  "loginIds": [
    "fb-account-uuid",
    "ig-account-uuid",
    "linkedin-account-uuid"
  ]
}
```

**Response:**
```json
{
  "message": "Group created successfully",
  "response": {
    "groupId": "new-group-uuid"
  }
}
```

**Synapse Use Case:**
- Auto-create groups when new clients complete onboarding
- Group naming: "[Business Name] - Social Media"
- Associate all connected accounts with client record

---

#### GET /group/view/{groupId}
**Purpose:** View specific group details with all accounts

**Path Parameter:** `groupId` (UUID)

**Response:**
```json
{
  "message": "Success",
  "response": {
    "groupId": "uuid",
    "groupName": "Client Group",
    "groupDesc": "Description",
    "accounts": [
      {
        "loginId": "uuid",
        "username": "handle",
        "platform": "instagram",
        "profilePicture": "url"
      }
    ],
    "platformScenarios": {
      "facebook": { "canPost": true, "canSchedule": true },
      "instagram": { "canPost": true, "canSchedule": true }
    }
  }
}
```

**Synapse Use Case:**
- Verify group configuration before campaign launch
- Check platform capabilities (can schedule, can post now)
- Display group overview in dashboard

---

#### PUT /group/update/{groupId}
**Purpose:** Update group properties

**Path Parameter:** `groupId` (UUID)

**Request Body:**
```json
{
  "groupName": "Updated Group Name",
  "groupDesc": "Updated description",
  "loginIds": ["account-uuid-1", "account-uuid-2"]
}
```

**Synapse Use Case:**
- Update group when client adds/removes social accounts
- Rename groups to match business name changes
- Modify account associations

---

#### DELETE /group/delete
**Purpose:** Delete specific groups

**Request Body:**
```json
{
  "groupIds": ["group-uuid-1", "group-uuid-2"]
}
```

**Synapse Use Case:**
- Clean up groups when clients churn
- Remove test groups

---

#### DELETE /group/deleteall
**Purpose:** Delete groups by search term

**Request Body:**
```json
{
  "q": "test"
}
```

**Synapse Use Case:**
- Bulk cleanup operations
- Remove all test data

---

### 3. Post Creation (PRIMARY ENDPOINT)

#### POST /posts/create
**Purpose:** Schedule or immediately publish posts to social media platforms

**Request Body Schema:**
```json
{
  "scheduleDateTime": "2025-11-21T14:30:00Z",
  "shareType": 3,
  "loginIds": ["account-uuid-1", "account-uuid-2"],
  "posts": [
    {
      "postDesc": "Your post caption text here 🚀",
      "mediaId": ["media-uuid-1"],
      "postTitle": "Optional: Article title",
      "postUrl": "Optional: Article URL",
      "longPostDesc": "Optional: Longer description for LinkedIn articles"
    }
  ]
}
```

**Key Parameters:**

**scheduleDateTime** (string, UTC ISO 8601)
- When to publish the post
- Must be future datetime for scheduled posts
- Ignored if shareType is 1 (share now)

**shareType** (integer enum)
| Value | Type | Description |
|-------|------|-------------|
| 0 | Queue | Add to posting queue (uses account's queue schedule) |
| 1 | Share Now | Publish immediately |
| 2 | Share Next | Post at next scheduled queue time |
| 3 | Schedule | Post at specific scheduleDateTime |

**loginIds** (array of UUIDs)
- Social media account IDs to post to
- Can post to multiple accounts simultaneously
- Cross-platform posting supported (e.g., Facebook + Instagram + LinkedIn in one request)

**posts** (array of post objects)
- Supports 4 post types via oneOf schema:

**Post Type 1: Text-only**
```json
{
  "postDesc": "Text content here"
}
```

**Post Type 2: Image Post**
```json
{
  "postDesc": "Caption text",
  "mediaId": ["image-media-uuid"]
}
```

**Post Type 3: Article/Link Post**
```json
{
  "postDesc": "Short caption",
  "mediaId": ["thumbnail-media-uuid"],
  "postTitle": "Article headline",
  "postUrl": "https://example.com/article",
  "longPostDesc": "Full article excerpt (LinkedIn)"
}
```

**Post Type 4: Video Post**
```json
{
  "postDesc": "Video caption",
  "mediaId": ["video-media-uuid"]
}
```

**Response Schema:**
```json
{
  "message": "Posts created successfully",
  "response": {
    "postIds": ["post-uuid-1", "post-uuid-2"],
    "postCreatedCount": 2,
    "postScheduleLimitOver": false
  }
}
```

**Response Fields:**
- **postIds**: Array of created post UUIDs (use for tracking/editing)
- **postCreatedCount**: Number of posts successfully created
- **postScheduleLimitOver**: Boolean indicating if account hit scheduling limits

**Error Response (400):**
```json
{
  "message": "Validation failed",
  "reasons": [
    {
      "message": "scheduleDateTime must be in the future",
      "field": "scheduleDateTime",
      "extraData": { "provided": "2025-11-15T10:00:00Z" }
    },
    {
      "message": "Invalid loginId",
      "field": "loginIds[0]",
      "extraData": { "loginId": "invalid-uuid" }
    }
  ]
}
```

**Platform-Specific Notes:**

**Instagram:**
- Business accounts only
- Image/video posts supported
- Text-only posts not allowed
- Character limit: 2,200
- Hashtag limit: 30
- First comment can be used for additional hashtags

**Facebook:**
- Pages and Groups supported
- All post types supported
- Character limit: 63,206 (but recommended <500 for engagement)
- Link previews auto-generated for postUrl

**LinkedIn:**
- Personal profiles and Company Pages supported
- longPostDesc used for article-style posts
- Character limit: 3,000
- Video: Up to 10 minutes

**Twitter/X:**
- Character limit: 280 (or 4,000 for Twitter Blue)
- Image limit: 4 per post
- Video limit: 1 per post

**TikTok:**
- Video only (no text-only or image posts)
- Video length: 15 seconds to 10 minutes
- Caption limit: 150 characters

**Synapse Use Case (CRITICAL):**
This is the core endpoint for campaign execution. Synapse will:

1. Generate campaign posts via AI (CampaignGenerator service)
2. Upload media assets via /uploadmedia endpoint
3. Map Synapse campaign types to SocialPilot posts:
   - Authority Builder → LinkedIn + Facebook (article posts)
   - Community Champion → Facebook + Instagram (image/text posts)
   - Trust Builder → Facebook + Instagram (video posts)
   - Revenue Rush → Instagram Shop (product image posts)
   - Viral Spark → TikTok + Instagram Reels (video posts)
4. Schedule entire campaign in one batch:
   ```typescript
   // Example: 14-day Community Champion campaign
   const campaignPosts = await campaignGenerator.generate(...);

   for (const post of campaignPosts) {
     await socialPilotAPI.createPost({
       scheduleDateTime: post.scheduledTime,
       shareType: 3, // Schedule
       loginIds: clientAccountIds,
       posts: [{
         postDesc: post.content,
         mediaId: post.mediaIds
       }]
     });
   }
   ```
5. Store postIds in Supabase for tracking
6. Monitor postScheduleLimitOver to alert clients

---

### 4. Media Management

#### POST /uploadmedia
**Purpose:** Upload images, videos, or GIFs before posting

**Request Body:**
```json
{
  "mediaType": "IMAGE",
  "media": "https://example.com/image.jpg"
}
```

**mediaType Enum:**
- `IMAGE` - JPEG, PNG, GIF (animated GIFs processed as VIDEO)
- `VIDEO` - MP4, MOV, AVI (platform-specific limits)
- `GIF` - Animated GIFs

**media Parameter:**
- Must be publicly accessible URL
- SocialPilot fetches and processes the file
- Alternative: Use multipart/form-data for direct upload (not documented, may require support inquiry)

**Response:**
```json
{
  "message": "Media uploaded successfully",
  "response": {
    "mediaId": ["media-uuid-1"],
    "validationStatus": "success",
    "fileSize": 2048576,
    "dimensions": { "width": 1080, "height": 1080 },
    "duration": null
  }
}
```

**Error Response (400):**
```json
{
  "message": "Media validation failed",
  "reasons": [
    {
      "message": "File size exceeds limit (5MB for images)",
      "field": "media"
    }
  ]
}
```

**Platform Limits:**

**Images:**
- Facebook: 5MB, 2048x2048px recommended
- Instagram: 8MB, 1080x1080px (square), 1080x1350px (portrait), 1080x566px (landscape)
- LinkedIn: 5MB, 1200x627px recommended
- Twitter: 5MB, 1200x675px recommended

**Videos:**
- Facebook: 4GB, up to 240 minutes, 1280x720px min
- Instagram Feed: 100MB, 60 seconds max, 1080x1920px
- Instagram Reels: 1GB, 90 seconds max, 1080x1920px (9:16 ratio)
- LinkedIn: 200MB, 10 minutes max, 1920x1080px
- TikTok: 287MB, 10 minutes max, 1080x1920px (9:16 ratio)
- Twitter: 512MB, 2 minutes 20 seconds, 1920x1080px

**Synapse Use Case:**
1. Generate image assets via Bannerbear (Week 2 tree)
2. Upload to public CDN (Supabase Storage or similar)
3. Call /uploadmedia with public URL
4. Store returned mediaId in post metadata
5. Use mediaId in /posts/create request

**Implementation Flow:**
```typescript
// 1. Generate image via Bannerbear
const imageUrl = await bannerbear.createImage(template, data);

// 2. Upload to Supabase Storage (make public)
const publicUrl = await supabase.storage.upload(imageUrl);

// 3. Upload to SocialPilot
const mediaResponse = await socialPilotAPI.uploadMedia({
  mediaType: 'IMAGE',
  media: publicUrl
});

// 4. Use in post creation
const mediaId = mediaResponse.response.mediaId[0];
```

---

### 5. Mentions Monitoring

#### GET /groupMention/list
**Purpose:** Retrieve mentions and interactions across platforms

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Results per page |
| q | string | No | Search query for mentions |

**Response Schema:**
```json
{
  "message": "Success",
  "response": {
    "mentions": [
      {
        "mentionId": "uuid",
        "platform": "instagram",
        "type": "comment",
        "text": "@yourbusiness love this!",
        "author": {
          "username": "customer123",
          "profilePicture": "url"
        },
        "postId": "post-uuid",
        "createdAt": "2025-11-20T10:30:00Z",
        "isRead": false
      }
    ],
    "total": 45,
    "unreadCount": 12
  }
}
```

**Supported Platforms:**
- Instagram (comments, mentions)
- Facebook (comments, tags)
- LinkedIn (comments)
- Twitter (mentions, replies)
- Bluesky (mentions)

**Synapse Use Case:**
- Display client mentions in dashboard
- Alert clients to high-engagement posts
- Feed mention data into EQ performance tracking
- Identify user-generated content opportunities

**Future Enhancement:**
- Auto-respond to mentions using AI chat system
- Sentiment analysis on mentions
- Mention-based performance metrics

---

### 6. Content Library

#### GET /library/list
**Purpose:** Browse saved content templates and hashtag sets

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| currentPage | integer | No | Page number |
| q | string | No | Search query |
| type | string | No | Filter by type: "post" or "hashTag" |
| sortBy | string | No | Sort field |
| sortOrder | string | No | asc or desc |

**Response Schema:**
```json
{
  "message": "Success",
  "response": {
    "libraryItems": [
      {
        "contentId": "uuid",
        "type": "post",
        "title": "Holiday Promotion Template",
        "content": "🎁 Special offer text here...",
        "tags": ["promotion", "holiday", "sales"],
        "usageCount": 12,
        "createdAt": "2025-01-01T00:00:00Z",
        "lastUsedAt": "2025-11-15T14:30:00Z"
      },
      {
        "contentId": "uuid",
        "type": "hashTag",
        "title": "Tech Industry Hashtags",
        "content": "#TechStartup #Innovation #AI #MachineLearning",
        "usageCount": 45,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 87
  }
}
```

**Synapse Use Case:**
- Save successful campaign posts as templates
- Store industry-specific hashtag sets
- Reuse high-performing content variations
- Build library of EQ-optimized posts by specialty

**Implementation Idea:**
```typescript
// Auto-save posts that exceed engagement benchmarks
if (postEngagement > industryBenchmark * 1.5) {
  await socialPilotAPI.saveToLibrary({
    type: 'post',
    title: `High-performing: ${campaign.type} - ${business.specialty}`,
    content: post.content,
    tags: [business.specialty, campaign.type, `eq-${post.eqScore}`]
  });
}
```

---

#### GET /library/view/{contentid}
**Purpose:** View specific library item details

**Path Parameter:** `contentid` (UUID)

**Response:**
```json
{
  "message": "Success",
  "response": {
    "contentId": "uuid",
    "type": "post",
    "title": "Template name",
    "content": "Full content text",
    "tags": ["tag1", "tag2"],
    "usageCount": 23,
    "createdAt": "2025-01-01T00:00:00Z",
    "createdBy": {
      "userId": "uuid",
      "username": "user@example.com"
    },
    "lastEditedAt": "2025-11-15T10:00:00Z"
  }
}
```

**Synapse Use Case:**
- Retrieve full template when user selects from library
- Display usage statistics in template selector
- Track which templates perform best across clients

---

### 7. AI Caption Generation

#### POST /openai/generatecaption
**Purpose:** Generate content via OpenAI integration (SocialPilot's API key)

**Request Body:**
```json
{
  "text": "Generate a social media post about launching a new product for a tech startup"
}
```

**Response:**
```json
{
  "message": "Caption generated successfully",
  "response": {
    "data": "🚀 Exciting news! We're thrilled to announce the launch of our latest innovation..."
  }
}
```

**Synapse Use Case:**
- **Backup AI**: If Synapse's Claude API fails, fallback to SocialPilot's OpenAI
- **Quick edits**: Allow clients to regenerate captions on the fly
- **Cost optimization**: Use SocialPilot's included AI credits before consuming Claude tokens

**Note:**
- SocialPilot uses their own OpenAI API key (no extra cost to Synapse)
- May have usage limits per account
- Quality/tone may differ from Synapse's Claude-generated content

---

## Data Models

### Account Object
```typescript
interface SocialPilotAccount {
  loginId: string; // UUID
  username: string; // Handle/username
  profilePicture: string; // URL
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'pinterest' | 'gmb' | 'tumblr' | 'bluesky';
  accountType?: 'page' | 'profile' | 'group' | 'business'; // Platform-specific
  accessToken: string; // Encrypted, don't store in Synapse
  refreshToken?: string;
  tokenExpiresAt?: string; // ISO 8601
  hasAnalytics: boolean; // Can retrieve performance data
  hasInbox: boolean; // Can access messages/mentions
  isActive: boolean; // Account connection status
  connectedAt: string; // ISO 8601
  lastSyncAt?: string; // Last successful post/sync
}
```

### Group Object
```typescript
interface SocialPilotGroup {
  groupId: string; // UUID
  groupName: string;
  groupDesc: string;
  accounts: SocialPilotAccount[];
  accountCount: number;
  platforms: string[]; // Array of platform names
  createdAt: string; // ISO 8601
  updatedAt?: string;
  platformScenarios?: {
    [platform: string]: {
      canPost: boolean;
      canSchedule: boolean;
      canAnalyze: boolean;
    };
  };
}
```

### Post Object
```typescript
interface SocialPilotPost {
  postId?: string; // UUID (returned after creation)
  postDesc: string; // Main caption/text
  mediaId?: string[]; // Array of media UUIDs
  postTitle?: string; // Article/link title
  postUrl?: string; // Article/link URL
  longPostDesc?: string; // Extended description (LinkedIn)
  scheduleDateTime?: string; // ISO 8601 UTC
  shareType: 0 | 1 | 2 | 3; // Queue, Now, Next, Schedule
  loginIds: string[]; // Target account UUIDs
  status?: 'scheduled' | 'published' | 'failed' | 'pending';
  publishedAt?: string; // ISO 8601
  analytics?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
    engagement: number;
    clicks?: number;
  };
}
```

### Media Object
```typescript
interface SocialPilotMedia {
  mediaId: string; // UUID
  mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
  url: string; // Original upload URL
  validationStatus: 'success' | 'failed' | 'processing';
  fileSize: number; // Bytes
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // Seconds (video only)
  uploadedAt: string; // ISO 8601
}
```

### Library Item Object
```typescript
interface SocialPilotLibraryItem {
  contentId: string; // UUID
  type: 'post' | 'hashTag';
  title: string;
  content: string; // Full text content
  tags: string[];
  usageCount: number;
  createdAt: string; // ISO 8601
  createdBy?: {
    userId: string;
    username: string;
  };
  lastUsedAt?: string;
  lastEditedAt?: string;
}
```

### Mention Object
```typescript
interface SocialPilotMention {
  mentionId: string; // UUID
  platform: string;
  type: 'comment' | 'mention' | 'reply' | 'tag';
  text: string; // Mention content
  author: {
    userId?: string;
    username: string;
    profilePicture?: string;
  };
  postId: string; // Associated post UUID
  createdAt: string; // ISO 8601
  isRead: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative'; // If sentiment analysis enabled
}
```

---

## Error Handling

### Standard Error Response Format
```typescript
interface SocialPilotError {
  message: string; // Human-readable error message
  reasons?: Array<{
    message: string; // Specific validation error
    field: string; // Field that failed validation
    extraData?: Record<string, any>; // Additional context
  }>;
}
```

### HTTP Status Codes

**400 Bad Request** - Validation errors
```json
{
  "message": "Validation failed",
  "reasons": [
    {
      "message": "scheduleDateTime must be in the future",
      "field": "scheduleDateTime",
      "extraData": { "provided": "2025-11-15T10:00:00Z" }
    }
  ]
}
```

**401 Unauthorized** - Invalid or missing API key
```json
{
  "message": "Invalid API key",
  "reasons": [
    {
      "message": "API key is invalid or expired",
      "field": "x-api-key"
    }
  ]
}
```

**404 Not Found** - Resource doesn't exist
```json
{
  "message": "Resource not found",
  "reasons": [
    {
      "message": "Group with ID xyz not found",
      "field": "groupId"
    }
  ]
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "message": "Rate limit exceeded",
  "reasons": [
    {
      "message": "Maximum 100 requests per minute exceeded",
      "field": null,
      "extraData": { "retryAfter": 45 }
    }
  ]
}
```

**500 Internal Server Error** - Server-side issues
```json
{
  "message": "Internal server error",
  "reasons": [
    {
      "message": "Temporary service disruption, please retry"
    }
  ]
}
```

### Synapse Error Handling Strategy

```typescript
class SocialPilotService {
  async createPost(data: PostCreateRequest): Promise<PostCreateResponse> {
    try {
      const response = await this.request('/posts/create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;

    } catch (error) {
      if (error.status === 400) {
        // Validation errors - log and surface to user
        console.error('[SocialPilot] Validation failed:', error.reasons);
        throw new ValidationError(
          'Post creation failed validation',
          error.reasons
        );

      } else if (error.status === 401) {
        // Auth error - critical, alert developers
        console.error('[SocialPilot] Authentication failed - check API key');
        await this.alertDevelopers('SocialPilot API key invalid');
        throw new AuthenticationError('SocialPilot API authentication failed');

      } else if (error.status === 429) {
        // Rate limit - implement exponential backoff
        const retryAfter = error.reasons?.[0]?.extraData?.retryAfter || 60;
        console.warn(`[SocialPilot] Rate limit hit, retrying after ${retryAfter}s`);
        await this.sleep(retryAfter * 1000);
        return this.createPost(data); // Retry once

      } else if (error.status === 500) {
        // Server error - retry with backoff, fallback to queue
        console.error('[SocialPilot] Server error:', error);
        await this.queueForRetry(data);
        throw new ServiceError('SocialPilot temporarily unavailable');

      } else {
        // Unknown error
        console.error('[SocialPilot] Unexpected error:', error);
        throw error;
      }
    }
  }
}
```

---

## Synapse Integration Plan

### Phase 1: Foundation (Week 3) - 8 hours

**Goal:** Establish basic connectivity and account management

**Tasks:**
1. **Environment Setup** (1 hour)
   - Add SOCIALPILOT_API_KEY to .env
   - Create service stub: `src/services/integrations/socialpilot.service.ts`
   - Add TypeScript types: `src/types/socialpilot.types.ts`

2. **Authentication & Health Check** (1 hour)
   - Implement API key authentication
   - Create test endpoint to verify connectivity
   - Error handling for 401 responses

3. **Account Management** (2 hours)
   - Implement GET /accounts/list
   - Implement GET /group/list
   - Create UI component: AccountSelector.tsx
   - Allow clients to view connected accounts

4. **Group Management** (2 hours)
   - Implement POST /group/create
   - Auto-create group during onboarding
   - Naming convention: "[Business Name] - Social Media"
   - Link groupId to brand record in Supabase

5. **Database Schema** (2 hours)
   - Add to brands table:
     - `socialpilot_group_id` (UUID, nullable)
     - `socialpilot_account_ids` (UUID[], nullable)
   - Create new table: `social_media_accounts`
     ```sql
     CREATE TABLE social_media_accounts (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
       platform TEXT NOT NULL,
       account_username TEXT NOT NULL,
       socialpilot_login_id UUID NOT NULL,
       is_active BOOLEAN DEFAULT true,
       connected_at TIMESTAMPTZ DEFAULT NOW(),
       last_sync_at TIMESTAMPTZ,
       has_analytics BOOLEAN DEFAULT false,
       has_inbox BOOLEAN DEFAULT false,
       metadata JSONB
     );
     ```

**Deliverable:** Clients can connect social accounts and view them in dashboard

---

### Phase 2: Post Scheduling (Week 4) - 12 hours

**Goal:** Enable campaign post scheduling

**Tasks:**
1. **Media Upload Service** (3 hours)
   - Implement POST /uploadmedia
   - Create media upload flow:
     - Generate image via Bannerbear
     - Upload to Supabase Storage (public bucket)
     - Upload to SocialPilot via API
     - Store mediaId in campaign_posts table
   - Handle video uploads
   - Error handling for file size/format issues

2. **Post Creation Service** (4 hours)
   - Implement POST /posts/create
   - Map Synapse campaign types to SocialPilot post formats
   - Handle different post types (text, image, article, video)
   - Platform-specific formatting (character limits, hashtag placement)
   - Batch post scheduling (entire campaign at once)

3. **Database Schema Updates** (2 hours)
   - Add to campaign_posts table:
     - `socialpilot_post_id` (UUID, nullable)
     - `socialpilot_media_ids` (UUID[], nullable)
     - `scheduled_at` (TIMESTAMPTZ)
     - `published_at` (TIMESTAMPTZ, nullable)
     - `post_status` (TEXT: 'scheduled', 'published', 'failed')
   - Create new table: `post_analytics`
     ```sql
     CREATE TABLE post_analytics (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       campaign_post_id UUID REFERENCES campaign_posts(id) ON DELETE CASCADE,
       platform TEXT NOT NULL,
       likes INTEGER DEFAULT 0,
       comments INTEGER DEFAULT 0,
       shares INTEGER DEFAULT 0,
       reach INTEGER DEFAULT 0,
       impressions INTEGER DEFAULT 0,
       engagement_rate DECIMAL(5,2),
       clicks INTEGER DEFAULT 0,
       retrieved_at TIMESTAMPTZ DEFAULT NOW()
     );
     ```

4. **Campaign Generator Integration** (3 hours)
   - Modify `CampaignGenerator.ts`:
     - Add SocialPilot scheduling after campaign generation
     - Calculate optimal post times (spread across campaign duration)
     - Handle scheduling errors gracefully (save to Supabase, retry later)
   - Create scheduling UI:
     - Show campaign calendar with scheduled post times
     - Allow editing post times before final scheduling
     - "Schedule Campaign" button (calls SocialPilot API)

**Deliverable:** Generated campaigns automatically schedule to client social accounts

---

### Phase 3: Analytics & Monitoring (Week 5) - 8 hours

**Goal:** Track post performance and feed into EQ system

**Tasks:**
1. **Analytics Retrieval** (3 hours)
   - Implement analytics polling service
   - Retrieve post performance data (likes, comments, shares, reach)
   - Store in post_analytics table
   - Daily sync via cron job

2. **Performance Dashboard** (3 hours)
   - Create dashboard widget: CampaignPerformance.tsx
   - Display engagement metrics by post
   - Show campaign-level aggregates
   - Highlight top-performing posts

3. **EQ Performance Tracking** (2 hours)
   - Link post analytics to EQ scores
   - Store in eq_performance_metrics table (already exists from EQ v2.0)
   - Calculate correlation: EQ score → engagement rate
   - Feed into learning engine for future optimization

**Deliverable:** Clients see real-time campaign performance, EQ system learns from results

---

### Phase 4: Advanced Features (Week 6+) - 16 hours

**Goal:** Mentions monitoring, content library, AI enhancements

**Tasks:**
1. **Mentions Monitoring** (4 hours)
   - Implement GET /groupMention/list
   - Display mentions in dashboard
   - Alert clients to high-engagement comments
   - Sentiment analysis on mentions
   - Feed into user-generated content opportunities

2. **Content Library Integration** (4 hours)
   - Implement GET /library/list
   - Auto-save high-performing posts
   - Template selector in campaign creation
   - Hashtag set management

3. **AI Caption Fallback** (2 hours)
   - Implement POST /openai/generatecaption
   - Use as backup if Claude API fails
   - Allow clients to regenerate captions

4. **Optimization Engine** (6 hours)
   - Optimal posting time calculation (based on analytics)
   - Platform selection optimization (which platforms perform best for client)
   - Content format recommendations (image vs video vs text)
   - EQ adjustment recommendations (if posts underperform)

**Deliverable:** Full-featured social media management with AI optimization

---

## Implementation Checklist

### Prerequisites
- [ ] Obtain SocialPilot API key (contact sales/support)
- [ ] Verify API access tier (ensure post scheduling included)
- [ ] Clarify rate limits with SocialPilot team
- [ ] Confirm pricing model (per-account fees, API call limits)

### Phase 1: Foundation
- [ ] Add SOCIALPILOT_API_KEY to .env
- [ ] Create socialpilot.service.ts
- [ ] Create socialpilot.types.ts
- [ ] Implement authentication
- [ ] Implement GET /accounts/list
- [ ] Implement GET /group/list
- [ ] Implement POST /group/create
- [ ] Create AccountSelector.tsx component
- [ ] Add database fields to brands table
- [ ] Create social_media_accounts table
- [ ] Test account connectivity
- [ ] Test group creation during onboarding

### Phase 2: Post Scheduling
- [ ] Implement POST /uploadmedia
- [ ] Setup Supabase Storage public bucket for media
- [ ] Create media upload flow (Bannerbear → Supabase → SocialPilot)
- [ ] Implement POST /posts/create
- [ ] Map campaign types to post formats
- [ ] Handle platform-specific formatting
- [ ] Add socialpilot fields to campaign_posts table
- [ ] Create post_analytics table
- [ ] Integrate scheduling into CampaignGenerator
- [ ] Create campaign calendar UI
- [ ] Test end-to-end: Generate → Schedule → Verify in SocialPilot

### Phase 3: Analytics
- [ ] Implement analytics retrieval (if endpoint available)
- [ ] Create analytics polling service
- [ ] Setup cron job for daily sync
- [ ] Create CampaignPerformance.tsx widget
- [ ] Link analytics to eq_performance_metrics
- [ ] Test EQ learning from performance data

### Phase 4: Advanced Features
- [ ] Implement GET /groupMention/list
- [ ] Create mentions dashboard component
- [ ] Implement sentiment analysis
- [ ] Implement GET /library/list
- [ ] Auto-save high-performing posts
- [ ] Create template selector UI
- [ ] Implement OpenAI fallback
- [ ] Build optimization engine

---

## Technical Considerations

### Rate Limits
**Unknown** - Need to clarify with SocialPilot:
- Requests per minute/hour/day
- Post scheduling limits per account
- Media upload limits (file size, quantity)
- Analytics polling frequency

**Mitigation:**
- Implement request queuing
- Exponential backoff on 429 errors
- Cache account/group data (reduce list calls)
- Batch operations where possible

---

### Authentication
**API Key Storage:**
```typescript
// .env
SOCIALPILOT_API_KEY=your_api_key_here

// Never commit API keys to repo
// Use environment variables in production
// Rotate keys periodically
```

**Security Best Practices:**
- Store API key in Supabase Vault (encrypted)
- Never expose key to client-side code
- All SocialPilot calls from backend only
- Log API usage for monitoring

---

### Platform Differences
Each social platform has unique constraints:

**Character Limits:**
- Instagram: 2,200
- Facebook: 63,206 (recommend <500)
- LinkedIn: 3,000
- Twitter: 280 (4,000 for Blue)
- TikTok: 150

**Synapse Strategy:**
- Generate base content at shortest limit (Twitter: 280)
- Create extended versions for platforms that support longer text
- Use longPostDesc for LinkedIn
- Store multiple versions in campaign_posts table:
  ```typescript
  {
    content_short: "280 char version",
    content_medium: "500 char version (FB/IG)",
    content_long: "3000 char version (LinkedIn)"
  }
  ```

**Media Requirements:**
- Generate assets at highest quality (1080x1920 for vertical video)
- SocialPilot handles platform-specific optimization
- Fallback: Generate multiple sizes if SocialPilot doesn't optimize

**Platform Availability:**
- Client connects Instagram but not Facebook → Skip FB posts
- Handle missing accounts gracefully
- Alert clients if campaign requires disconnected platform

---

### Scheduling Strategy

**Optimal Posting Times:**
Research-based defaults:
- Facebook: Tue-Thu 1-3pm
- Instagram: Mon-Fri 11am-2pm
- LinkedIn: Tue-Wed 10am-12pm
- Twitter: Mon-Fri 9am-12pm
- TikTok: Tue-Thu 6-9pm

**Synapse Implementation:**
```typescript
// Spread posts across campaign duration
// Avoid posting too frequently (min 4 hours between posts per platform)
function calculatePostSchedule(
  campaignDuration: number, // days
  postCount: number,
  platforms: string[]
): Date[] {
  const schedule: Date[] = [];
  const startDate = new Date();
  const hoursPerPost = (campaignDuration * 24) / postCount;

  for (let i = 0; i < postCount; i++) {
    const postTime = new Date(startDate);
    postTime.setHours(startDate.getHours() + (i * hoursPerPost));

    // Adjust to optimal time window for platform
    const optimalTime = adjustToOptimalWindow(postTime, platforms[0]);
    schedule.push(optimalTime);
  }

  return schedule;
}
```

---

### Error Handling & Retries

**Retry Strategy:**
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[SocialPilot] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Fallback Queue:**
- If SocialPilot API fails, save posts to database queue
- Background job retries every 15 minutes
- Alert clients if posts fail to schedule after 3 hours
- Manual retry option in dashboard

---

### Testing Strategy

**Unit Tests:**
- Mock SocialPilot API responses
- Test error handling (400, 401, 429, 500)
- Test retry logic
- Test post formatting for each platform

**Integration Tests:**
- Test with SocialPilot sandbox/test account (if available)
- Verify end-to-end: Generate → Upload media → Schedule → Retrieve analytics
- Test group creation during onboarding
- Test multi-platform scheduling

**Manual Testing Checklist:**
- [ ] Create test SocialPilot account
- [ ] Connect test social accounts (Facebook, Instagram)
- [ ] Run onboarding flow, verify group creation
- [ ] Generate test campaign, verify scheduling
- [ ] Check posts appear in SocialPilot dashboard
- [ ] Wait for scheduled time, verify posts publish
- [ ] Retrieve analytics, verify data storage

---

## Cost Considerations

**Unknown Pricing** - Need to clarify with SocialPilot:
- API access fee (monthly/annual)
- Per-account costs (if different from standard plans)
- API call limits and overage fees
- Media storage costs
- Analytics access fees

**Questions for SocialPilot Sales:**
1. What is the cost structure for API access?
2. Are there per-account fees or is it unlimited accounts?
3. What are the rate limits (requests per minute/day)?
4. Are there limits on scheduled posts per account?
5. Is analytics data included or additional cost?
6. Do you offer sandbox/test environment?
7. What is the SLA for API uptime?
8. Are there webhook notifications for post status changes?

---

## Next Steps

### Immediate Actions:
1. **Schedule call with SocialPilot product team** (as requested in their email)
2. **Clarify API access requirements:**
   - Pricing structure
   - Rate limits
   - Platform coverage (especially TikTok, Instagram Reels)
   - Analytics depth
3. **Obtain API credentials** for development
4. **Review API access tier** (ensure scheduling/analytics included)

### Email Response Draft:
*See "Suggested Response" section earlier in this document*

### Development Timeline:
- **Week 3** (8 hours): Foundation + account management
- **Week 4** (12 hours): Post scheduling integration
- **Week 5** (8 hours): Analytics + EQ performance tracking
- **Week 6+** (16 hours): Mentions, library, optimization

**Total Effort:** 44 hours (5.5 days of development)

---

## Documentation References

- **API Docs:** https://apidocs.socialpilot.co/
- **OpenAPI Spec:** https://apidocs.socialpilot.co/docs.json
- **Support:** [Contact through email thread]

---

**Last Updated:** November 20, 2025
**Synapse Version:** v1.0 (MVP Phase)
**Status:** Research Complete, Awaiting API Access
