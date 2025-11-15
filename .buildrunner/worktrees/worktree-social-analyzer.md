# Worktree Task: Social Media Intelligence & Content Analyzer

**Feature ID:** `social-media-analyzer`
**Branch:** `feature/social-analyzer`
**Estimated Time:** 14 hours (2 days)
**Priority:** CRITICAL (includes YouTube content analysis)
**Dependencies:** Foundation, SocialPilot Integration (already complete)
**Worktree Path:** `../synapse-social`

---

## Context

**This is THE comprehensive social media intelligence system.** Combines YouTube content analysis, light public social scraping, SocialPilot metadata, Google Business review mining, and continuous learning loop from generated content.

**What This Enables:**
- Learn what topics work from YouTube
- Extract brand voice from existing posts
- Understand timing and format preferences
- Track generated content performance
- Continuously improve content quality

**The 20+ Data Sources Reality:**
- YouTube Data API (full access) ✅
- SocialPilot metadata (timing, format) ✅
- Apify social scraping (FB, IG - limited but useful) ⚠️
- Google Business reviews (customer language) ✅
- Generated content tracking (our learning loop) ✅

---

## Prerequisites

- Foundation merged (database schema includes new tables)
- SocialPilot integration complete (already done)
- YouTube Data API key
- Apify API key (already have)
- OutScraper API key (already have)

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-social feature/social-analyzer
cd ../synapse-social
git pull origin main
npm install

# YouTube SDK
npm install @google-cloud/youtube
# OR just use axios with YouTube API directly
```

Add to `.env`:
```
VITE_YOUTUBE_API_KEY=AIzaSy...
```

---

## Task Checklist

This is divided into 5 major components:

### **PART 1: YouTube Content Analyzer** (5 hours)

#### File: `src/services/youtube-content-analyzer.service.ts`

**Main Functions:**

- [ ] `connectYouTubeChannel(userId: string): Promise<void>`
  - OAuth flow to connect user's YouTube channel
  - Get channel ID and basic info
  - Save to `youtube_channels` table

- [ ] `analyzeYouTubeChannel(channelId: string): Promise<YouTubeInsights>`
  - Fetch last 100 videos
  - Analyze engagement patterns
  - Extract topics and keywords
  - Identify top performers
  - Mine comments for audience questions
  - Return comprehensive insights

- [ ] `fetchChannelVideos(channelId: string, maxResults: number = 100): Promise<Video[]>`
  - Use YouTube Data API
  - Get video IDs, titles, descriptions, stats
  - Sort by publish date

- [ ] `analyzeVideoPerformance(videos: Video[]): Promise<PerformanceAnalysis>`
  - Calculate views per day (normalize for age)
  - Engagement rate (likes + comments / views)
  - Identify top 10 performers
  - Detect patterns in successful videos

- [ ] `extractTopics(videos: Video[]): Promise<string[]>`
  - Extract topics from top-performing video titles
  - Use Claude to cluster topics
  - Return winning themes

- [ ] `extractKeywords(videos: Video[]): Promise<string[]>`
  - Pull keywords from titles and descriptions
  - Weight by video performance
  - Return high-value keywords

- [ ] `fetchVideoComments(videoId: string, maxResults: number = 50): Promise<Comment[]>`
  - Get top comments
  - Extract audience questions
  - Return for content idea mining

- [ ] `generateContentRepurposingIdeas(videos: Video[]): Promise<RepurposingIdea[]>`
  - Identify videos suitable for social posts
  - Suggest: blog post, carousel, infographic, quote graphic
  - Return prioritized list

**YouTube API Calls:**
```typescript
// Fetch channel videos
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &channelId={channelId}
  &order=date
  &maxResults=100
  &key={API_KEY}

// Get video statistics
GET https://www.googleapis.com/youtube/v3/videos
  ?part=statistics,snippet
  &id={videoIds}
  &key={API_KEY}

// Get comments
GET https://www.googleapis.com/youtube/v3/commentThreads
  ?part=snippet
  &videoId={videoId}
  &maxResults=50
  &key={API_KEY}
```

**Database Integration:**
```typescript
// Save channel connection
await supabase.from('youtube_channels').insert({
  user_id: userId,
  channel_id: channelId,
  channel_name: channelName,
  connected_at: new Date()
})

// Save video performance data
await supabase.from('youtube_video_performance').insert({
  channel_id: channelId,
  video_id: videoId,
  title: title,
  views: views,
  likes: likes,
  comments: commentCount,
  published_at: publishedAt,
  analyzed_at: new Date()
})
```

---

### **PART 2: Light Social Media Scraper** (3 hours)

#### File: `src/services/social-scraper.service.ts`

**Attempt to scrape public social data (graceful degradation if blocked):**

- [ ] `scrapeFacebookPage(pageUrl: string): Promise<SocialSample | null>`
  - Use Apify Facebook Pages Scraper
  - Attempt to get 10-20 recent posts
  - Extract: post text, engagement, post type
  - If blocked, return null (don't crash)

- [ ] `scrapeInstagramBusiness(username: string): Promise<SocialSample | null>`
  - Use Apify Instagram Scraper
  - Get bio, recent post captions (limited)
  - Extract hashtags used
  - If blocked, return null

- [ ] `scrapeTwitterProfile(handle: string): Promise<SocialSample | null>`
  - Use Apify Twitter Scraper (or Serper)
  - Get recent tweets (10-20)
  - Extract tweet patterns
  - If blocked, return null

- [ ] `extractBrandVoice(samples: SocialSample[]): Promise<BrandVoice>`
  - Analyze tone from scraped samples
  - Identify emoji usage patterns
  - Extract common hashtags
  - Determine formality level
  - Use Claude to summarize voice

**Graceful Degradation:**
```typescript
async function attemptSocialScraping(businessProfile) {
  const results = {
    facebook: null,
    instagram: null,
    twitter: null
  }

  try {
    results.facebook = await scrapeFacebookPage(profile.facebookUrl)
  } catch (error) {
    console.log('Facebook scraping failed (expected) - continuing...')
  }

  try {
    results.instagram = await scrapeInstagramBusiness(profile.igHandle)
  } catch (error) {
    console.log('Instagram scraping failed (expected) - continuing...')
  }

  // Return whatever we got (even if all null)
  return results
}
```

---

### **PART 3: SocialPilot Metadata Analyzer** (2 hours)

#### File: `src/services/engagement-pattern-detector.service.ts`

**Already partially defined, now enhance:**

- [ ] `analyzeSocialPilotPerformance(accountIds: string[]): Promise<PerformanceInsights>`
  - Fetch all scheduled posts from SocialPilot
  - Get engagement metrics
  - Analyze timing, format, frequency

- [ ] `detectEngagementPatterns(posts: Post[]): Promise<EngagementPattern[]>`
  - Find high-performing times/days
  - Identify content type preferences (image vs link)
  - Detect platform-specific trends

- [ ] `calculateOptimalPostingTimes(posts: Post[]): Promise<OptimalTime[]>`
  - Group by day of week and hour
  - Calculate average engagement per time slot
  - Return top 5 times per platform

- [ ] `analyzePostingFrequency(posts: Post[]): Promise<FrequencyAnalysis>`
  - Current posting frequency
  - Over/under-posting detection
  - Recommended frequency

- [ ] `compareAcrossPlatforms(posts: Post[]): Promise<PlatformComparison>`
  - Which platforms drive most engagement
  - Platform-specific insights

---

### **PART 4: Content Learning Loop** (2 hours)

#### File: `src/services/content-learning-loop.service.ts`

**Track performance of content WE generate to improve future campaigns:**

- [ ] `trackGeneratedContent(campaignId: string, posts: Post[])`
  - Save posts we generate with metadata
  - Tag with content type (Authority, Promotional, Educational, etc.)
  - Link to campaign

- [ ] `updateContentPerformance(postId: string, metrics: EngagementMetrics)`
  - Called after post is published and has engagement data
  - Save metrics to database
  - Calculate performance score

- [ ] `analyzeContentTypePerformance(timeframe: number = 90): Promise<ContentTypeAnalysis>`
  - Last 90 days of generated content
  - Group by content type (7 types)
  - Calculate avg engagement per type
  - Identify winners and losers

- [ ] `generateLearningInsights(): Promise<LearningInsight[]>`
  - "Educational posts get 2.3x more engagement than promotional"
  - "Authority posts perform best on LinkedIn"
  - "Problem/Solution series drive most comments"
  - Return actionable insights

- [ ] `optimizeNextCampaign(insights: LearningInsight[]): CampaignGuidance`
  - Based on what worked, suggest content mix
  - "Generate 40% educational, 30% authority, 20% social proof, 10% promotional"
  - Continuous improvement loop

**Database Tracking:**
```typescript
// When generating campaign
await supabase.from('content_performance_tracking').insert({
  campaign_id: campaignId,
  post_id: postId,
  content_type: 'educational',
  platform: 'linkedin',
  topic: 'industry_tips',
  generated_at: new Date()
})

// After performance data comes in
await supabase.from('content_performance_tracking').update({
  likes: 150,
  comments: 23,
  shares: 12,
  engagement_score: calculateScore(150, 23, 12),
  updated_at: new Date()
}).eq('post_id', postId)
```

---

### **PART 5: Unified Intelligence Dashboard UI** (2 hours)

#### File: `src/components/analytics/SocialPerformanceInsights.tsx`

**Comprehensive dashboard showing all intelligence:**

- [ ] YouTube Insights Section
  - Top 10 performing videos
  - Winning topics chart
  - Keywords cloud
  - "Repurpose this video" buttons

- [ ] Social Scraping Results Section
  - Brand voice summary
  - Hashtags used
  - Posting patterns observed
  - Sample posts display

- [ ] SocialPilot Performance Section
  - Optimal posting times heatmap
  - Platform comparison chart
  - Frequency recommendations

- [ ] Learning Loop Section
  - Content type performance bar chart
  - "What's working" insights
  - "Generate more of this" recommendations

- [ ] Action Items
  - "Create campaign from top YouTube video"
  - "Repurpose content to social"
  - "Adjust posting schedule"

#### File: `src/components/analytics/YouTubeInsights.tsx`

**Dedicated YouTube insights component:**
- [ ] Channel overview card
- [ ] Top videos list with thumbnails
- [ ] Topics breakdown
- [ ] Keywords table
- [ ] Audience questions from comments
- [ ] Content gaps (topics competitors cover but you don't)

#### File: `src/components/social/YouTubeConnection.tsx`

**YouTube OAuth connection flow:**
- [ ] "Connect YouTube" button
- [ ] OAuth consent screen
- [ ] Channel selection (if multiple)
- [ ] Connection confirmation
- [ ] Background analysis trigger

---

## Type Definitions

```typescript
export interface YouTubeInsights {
  channelId: string
  totalVideos: number
  totalViews: number
  avgViewsPerVideo: number
  topVideos: Video[]
  winningTopics: string[]
  highValueKeywords: string[]
  audienceQuestions: string[]
  optimalPostingDays: string[]
  contentGaps: string[]
  repurposingOpportunities: RepurposingIdea[]
}

export interface Video {
  videoId: string
  title: string
  description: string
  publishedAt: Date
  views: number
  likes: number
  comments: number
  thumbnailUrl: string
  engagementRate: number
  viewsPerDay: number
}

export interface SocialSample {
  platform: 'facebook' | 'instagram' | 'twitter'
  posts: SampledPost[]
  brandVoice: BrandVoice
  commonHashtags: string[]
  postingFrequency: number
  scraped_at: Date
}

export interface BrandVoice {
  tone: 'professional' | 'casual' | 'playful' | 'authoritative'
  emojiUsage: 'heavy' | 'moderate' | 'minimal'
  avgPostLength: number
  formalityLevel: number // 1-10
}

export interface ContentTypeAnalysis {
  contentType: string // 'educational', 'promotional', etc.
  totalPosts: number
  avgEngagement: number
  bestPlatform: string
  performance: 'high' | 'medium' | 'low'
}

export interface LearningInsight {
  insight: string
  evidence: string
  recommendation: string
  impact: 'high' | 'medium' | 'low'
}

export interface RepurposingIdea {
  sourceVideo: Video
  suggestedFormats: ('blog_post' | 'instagram_carousel' | 'linkedin_article' | 'twitter_thread')[]
  estimatedReach: number
  effort: 'low' | 'medium' | 'high'
}
```

---

## Integration Points

**Used by Campaign Generator:**
```typescript
// Campaign generator imports all insights
const socialInsights = await loadSocialInsights(businessProfileId)

// Use YouTube topics
const topics = socialInsights.youtube.winningTopics
const keywords = socialInsights.youtube.highValueKeywords

// Use brand voice from scraped samples
const voice = socialInsights.socialSamples?.brandVoice

// Use optimal times from SocialPilot
const optimalTimes = socialInsights.optimalPostingTimes

// Use learning insights
const contentMix = socialInsights.learningInsights.recommendedMix
```

---

## Testing

```typescript
describe('YouTube Analyzer', () => {
  it('fetches and analyzes YouTube channel', async () => {
    const insights = await analyzeYouTubeChannel('UCxxxxx')
    expect(insights.topVideos).toHaveLength(10)
    expect(insights.winningTopics.length).toBeGreaterThan(0)
  })

  it('extracts keywords from high-performing videos', async () => {
    const keywords = await extractKeywords(topVideos)
    expect(keywords).toContain('tutorial')
  })
})

describe('Social Scraper', () => {
  it('attempts Facebook scrape with graceful degradation', async () => {
    const result = await scrapeFacebookPage('https://facebook.com/test')
    // May be null if blocked - that's OK
    if (result) {
      expect(result.posts.length).toBeGreaterThan(0)
    }
  })
})

describe('Learning Loop', () => {
  it('tracks content performance', async () => {
    await trackGeneratedContent(campaignId, posts)
    await updateContentPerformance(postId, metrics)

    const analysis = await analyzeContentTypePerformance()
    expect(analysis.some(a => a.contentType === 'educational')).toBe(true)
  })

  it('generates actionable insights', async () => {
    const insights = await generateLearningInsights()
    expect(insights[0]).toHaveProperty('recommendation')
  })
})
```

---

## Completion Criteria

**YouTube Analysis:**
- [ ] YouTube OAuth connection working
- [ ] Channel video fetching functional
- [ ] Performance analysis accurate
- [ ] Topic extraction working
- [ ] Keyword extraction working
- [ ] Comment mining functional
- [ ] Repurposing suggestions generated
- [ ] Data saved to database

**Social Scraping:**
- [ ] Facebook scraping attempted (graceful fail)
- [ ] Instagram scraping attempted (graceful fail)
- [ ] Twitter scraping attempted (graceful fail)
- [ ] Brand voice extraction working
- [ ] Hashtag extraction working
- [ ] Returns partial results if some fail

**SocialPilot Analysis:**
- [ ] Performance data fetching works
- [ ] Optimal times calculated
- [ ] Frequency analysis accurate
- [ ] Platform comparison functional

**Learning Loop:**
- [ ] Generated content tracking works
- [ ] Performance updates save correctly
- [ ] Content type analysis accurate
- [ ] Learning insights generated
- [ ] Campaign guidance provides value

**UI:**
- [ ] Comprehensive dashboard displays all data
- [ ] YouTube insights component functional
- [ ] Connection flow works
- [ ] Charts and visualizations clear
- [ ] Action buttons functional

**Overall:**
- [ ] All database tables working
- [ ] No TypeScript errors
- [ ] Tested with real YouTube channel
- [ ] Tested with real social accounts
- [ ] Graceful degradation confirmed
- [ ] Integration with campaign generator verified

---

## Commit & Merge

```bash
git add .
git commit -m "feat: Add comprehensive social media intelligence & content analyzer

YouTube Content Analysis:
- Full video history scanning and performance analysis
- Topic and keyword extraction from top performers
- Comment mining for audience questions
- Content repurposing recommendations
- OAuth connection flow

Light Social Scraping:
- Facebook, Instagram, Twitter public data scraping
- Brand voice extraction
- Hashtag and posting pattern analysis
- Graceful degradation if blocked

SocialPilot Metadata Analysis:
- Optimal posting time calculation
- Platform performance comparison
- Posting frequency optimization
- Engagement pattern detection

Content Learning Loop:
- Track all generated content performance
- Content type effectiveness analysis
- Continuous improvement insights
- Campaign optimization guidance

Unified Intelligence Dashboard:
- Comprehensive insights display
- YouTube dedicated section
- Social scraping results
- Learning loop recommendations
- Actionable next steps

Implements social-media-analyzer feature (now with YouTube + 20 data sources)"

git push origin feature/social-analyzer
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/social-analyzer
git push origin main
git worktree remove ../synapse-social
```

---

## API Quota Management

**YouTube Data API:**
- Free tier: 10,000 units/day
- Channel videos list: ~100 units
- Video details: ~1 unit each
- Comments: ~1 unit per request
- **Budget:** ~200 units per full analysis
- **Can analyze:** ~50 channels/day before hitting limit

**Cost:**
- YouTube: FREE
- Apify scraping: ~$0.05 per attempt
- Total per business: ~$0.15

---

*This is the intelligence backbone of the entire content system. YouTube alone is worth the effort. Everything else is bonus.*
