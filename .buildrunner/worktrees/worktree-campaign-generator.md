# Worktree Task: AI Campaign Generation Engine

**Feature ID:** `campaign-generator`
**Branch:** `feature/campaign-generator`
**Estimated Time:** 16 hours
**Priority:** CRITICAL
**Dependencies:** Profile Management, Social Analyzer, Bannerbear (ALL must be merged)
**Worktree Path:** `../synapse-campaign`

---

## Context

**The Grand Finale.** Generates complete content campaigns combining UVP, products/services, social insights, and local intelligence. This is where all 17 data sources come together to create magic.

**4 Campaign Types:**
1. Quick Win (7 days, 7-14 posts)
2. Monthly Domination (30 days, 30-60 posts)
3. Event Blitz (14 days, 14-21 posts)
4. Evergreen Library (90 days, 90 posts)

**7 Content Types:**
1. Authority Posts (UVP-based)
2. Problem/Solution Series (review insights)
3. Case Study Templates (differentiators)
4. Seasonal Campaigns (local events + services)
5. Competitor Contrast (gap analysis)
6. Social Proof Amplification (reviews)
7. Educational Series (industry expertise)

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-campaign feature/campaign-generator
cd ../synapse-campaign
git pull origin main  # MUST have all dependencies merged
npm install
```

---

## Task Checklist

### File: `src/services/campaign-generator.service.ts`

**Main Function:**
- [ ] `generateCampaign(config: CampaignConfig): Promise<Campaign>`
  - Takes campaign type, duration, selected products, business profile
  - Uses intelligence from all 17 sources
  - Generates post schedule
  - Creates post content
  - Generates Bannerbear visuals
  - Returns complete campaign

**Campaign Generation Flow:**
```typescript
async function generateCampaign(config: CampaignConfig) {
  // 1. Load all context
  const profile = await loadBusinessProfile(config.businessProfileId)
  const intelligence = await loadIntelligence(config.businessProfileId)
  const socialInsights = await loadSocialInsights(config.businessProfileId)
  const industryProfile = await loadIndustryProfile(profile.naicsCode)

  // 2. Determine optimal posting schedule
  const schedule = await createPostingSchedule(
    config.duration,
    config.postFrequency,
    socialInsights.optimalPostingTimes
  )

  // 3. Generate content for each post
  const posts = await generatePosts(schedule, {
    profile,
    intelligence,
    industryProfile,
    selectedProducts: config.productIds
  })

  // 4. Generate visuals
  const postsWithVisuals = await addVisualsToPosts(posts)

  // 5. Save campaign
  const campaign = await saveCampaign({
    ...config,
    posts: postsWithVisuals,
    status: 'draft'
  })

  return campaign
}
```

**Post Generation:**
- [ ] `generatePosts(schedule: PostSchedule[], context: CampaignContext): Promise<Post[]>`
  - For each scheduled slot:
    - Determine content type (rotate through 7 types)
    - Generate post copy with Claude
    - Attach product info if product campaign
    - Add platform-specific formatting
    - Select Bannerbear template
  - Return array of posts

**Content Type Generators:**

- [ ] `generateAuthorityPost(profile: BusinessProfile): string`
  - Uses UVP and specialty
  - "We're the only [specialty] in [location] that [differentiator]"

- [ ] `generateProblemSolutionPost(reviews: Review[], service: Service): string`
  - Extract pain point from reviews
  - Position service as solution

- [ ] `generateCaseStudyPost(profile: BusinessProfile, testimonial: string): string`
  - Success story format
  - Highlight specific results

- [ ] `generateSeasonalPost(event: SeasonalEvent, service: Service): string`
  - Tie service to upcoming event
  - "Get ready for [event] with our [service]"

- [ ] `generateCompetitorContrastPost(competitors: Competitor[], differentiator: string): string`
  - "Unlike others, we [differentiator]"
  - No naming competitors directly

- [ ] `generateSocialProofPost(reviews: Review[]): string`
  - Feature high-rated review
  - Add stats: "4.9 stars from 247 customers"

- [ ] `generateEducationalPost(industryProfile: IndustryProfile, topic: string): string`
  - Industry tips/insights
  - Position as expert

**Posting Schedule:**
- [ ] `createPostingSchedule(duration: number, frequency: number, optimalTimes: OptimalTime[]): PostSchedule[]`
  - Distribute posts across duration
  - Prefer optimal times from social analyzer
  - Respect platform-specific best times
  - Avoid over-posting (max 2-3 per day per platform)

### File: `src/services/campaign-optimizer.service.ts`

- [ ] `optimizeCampaign(campaign: Campaign): Campaign`
  - Balance content types (not all promotional)
  - Ensure product variety (if product campaign)
  - Check for engagement variety (text, images, videos)
  - Adjust timing for maximum reach

- [ ] `selectBestContentMix(posts: Post[]): ContentMix`
  - 40% educational
  - 30% promotional
  - 20% social proof
  - 10% engagement/community

### File: `src/components/campaigns/CampaignBuilder.tsx`

**Campaign Creation UI:**
- [ ] Step 1: Select campaign type (4 cards)
- [ ] Step 2: Select products (optional) → uses ProductSelector
- [ ] Step 3: Configure settings (duration, platforms, frequency)
- [ ] Step 4: Generate campaign (loading state)
- [ ] Step 5: Preview campaign → CampaignPreview
- [ ] Step 6: Deploy to SocialPilot or save draft

### File: `src/components/campaigns/CampaignPreview.tsx`

**Preview UI:**
- [ ] Calendar view of all scheduled posts
- [ ] Post cards with content + visual
- [ ] Platform indicators (FB, IG, LI icons)
- [ ] Engagement predictions (based on social analyzer)
- [ ] Edit individual posts
- [ ] Regenerate specific posts
- [ ] Approve all button

### File: `src/components/campaigns/CampaignSelector.tsx`

**Campaign Type Selection:**
- [ ] 4 cards showing campaign types
- [ ] Each card shows:
  - Duration
  - Post count
  - Best for: description
  - Price estimate (if applicable)
- [ ] Click to select
- [ ] Smart recommendations: "Based on your [something], we recommend Monthly Domination"

---

## Claude Opus Integration

**Post Generation Prompt:**
```typescript
const prompt = `
Generate a ${contentType} social media post for this business:

Business: ${profile.business_name}
Specialty: ${profile.specialty}
Location: ${profile.location}
UVP: ${profile.uvp_statement}
Industry: ${industryProfile.name}

${productContext ? `Featured Products: ${products.join(', ')}` : ''}

Platform: ${platform}
Audience Pain Points: ${painPoints.join(', ')}
Brand Voice: ${industryProfile.messagingFramework.tone}

Requirements:
- ${platform === 'linkedin' ? '100-150 words, professional' : '50-80 words, engaging'}
- Include relevant hashtags
- End with clear CTA
- ${productContext ? 'Mention specific products naturally' : 'Focus on value proposition'}

Generate post content only, no explanations.
`
```

**Campaign-Level Intelligence:**
```typescript
const campaignPrompt = `
Create a ${config.duration}-day content campaign for:

Business Context:
${JSON.stringify(profile, null, 2)}

Intelligence:
${JSON.stringify(intelligence, null, 2)}

Social Insights:
- Best posting times: ${optimalTimes}
- Top performing content types: ${topTypes}
- Engagement patterns: ${patterns}

Generate:
1. Content themes for each week
2. Mix of content types (educational, promotional, social proof)
3. Product feature schedule (if products selected)
4. Hashtag strategy
5. Engagement hooks

Return as structured JSON.
`
```

---

## Product-Specific Campaign Logic

**When products are selected:**
```typescript
if (config.productIds?.length > 0) {
  const products = await loadProducts(config.productIds)

  // Dedicate % of posts to products
  const productPosts = Math.floor(totalPosts * 0.4) // 40% product-focused

  // Distribute products across campaign
  const productSchedule = distributeProducts(products, productPosts)

  // Generate product-specific posts
  for (const item of productSchedule) {
    const post = await generateProductPost(item.product, item.contentType)
    posts.push(post)
  }
}
```

**Product Post Examples:**
- New Product Launch: "Introducing our [product]..."
- Product Showcase: "Why customers love our [product]..."
- Product Comparison: "What makes our [product] different..."
- Sale/Promo: "Limited time: [discount] off [product]..."

---

## Bannerbear Integration

**For each post:**
```typescript
// Determine template based on content type
const templateType = mapContentTypeToTemplate(post.contentType)

// Generate visual
const visual = await generateImage(templateType, {
  business_name: profile.business_name,
  offer: post.extractedOffer,
  testimonial: post.extractedTestimonial,
  stat: post.extractedStat,
  cta: post.cta
})

post.imageUrl = visual.url
```

---

## Database Schema

```typescript
// campaigns table
interface Campaign {
  id: string
  business_profile_id: string
  name: string
  type: 'quick_win' | 'monthly_domination' | 'event_blitz' | 'evergreen'
  duration: number // days
  status: 'draft' | 'scheduled' | 'active' | 'completed'
  created_at: Date
}

// campaign_posts table
interface CampaignPost {
  id: string
  campaign_id: string
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter'
  content: string
  image_url?: string
  scheduled_for: Date
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  engagement_prediction?: number
  product_ids?: string[] // If product campaign
}
```

---

## SocialPilot Deployment

**Deploy campaign to SocialPilot:**
```typescript
async function deployCampaign(campaign: Campaign) {
  for (const post of campaign.posts) {
    // Use existing SocialPilot service
    await scheduleToSocialPilot({
      account_id: userSocialPilotAccount,
      platform: post.platform,
      content: post.content,
      media: post.image_url ? [post.image_url] : [],
      scheduled_time: post.scheduled_for
    })

    // Update post status
    await supabase
      .from('campaign_posts')
      .update({ status: 'scheduled' })
      .eq('id', post.id)
  }
}
```

---

## Smart Recommendations

**Auto-suggest campaign type:**
```typescript
function recommendCampaignType(context: {
  hasNewProducts: boolean
  upcomingEvent?: SeasonalEvent
  lastCampaign?: Date
  budget?: number
}): CampaignType {
  if (context.hasNewProducts) return 'event_blitz' // Launch new products fast
  if (context.upcomingEvent && daysUntil(context.upcomingEvent) < 30) return 'event_blitz'
  if (!context.lastCampaign || daysSince(context.lastCampaign) > 60) return 'monthly_domination'
  return 'quick_win' // Safe default
}
```

---

## Testing

```typescript
it('generates complete campaign', async () => {
  const campaign = await generateCampaign({
    businessProfileId: '123',
    type: 'monthly_domination',
    duration: 30,
    platforms: ['facebook', 'instagram'],
    productIds: ['p1', 'p2', 'p3']
  })

  expect(campaign.posts.length).toBeGreaterThan(30)
  expect(campaign.posts.every(p => p.content)).toBe(true)
  expect(campaign.posts.some(p => p.image_url)).toBe(true)
})

it('respects optimal posting times', async () => {
  const campaign = await generateCampaign(config)
  const postTimes = campaign.posts.map(p => p.scheduled_for.getHours())

  // Should match optimal times from social analyzer
  expect(postTimes).toContain(14) // 2pm if that's optimal
  expect(postTimes).not.toContain(3) // 3am unlikely to be optimal
})

it('balances content types', async () => {
  const campaign = await generateCampaign(config)
  const types = countContentTypes(campaign.posts)

  expect(types.educational).toBeGreaterThan(types.promotional)
  expect(types).toHaveProperty('authority')
  expect(types).toHaveProperty('social_proof')
})
```

---

## Completion Criteria

- [ ] All 4 campaign types generate correctly
- [ ] 7 content types all represented
- [ ] Product-specific campaigns work
- [ ] Optimal posting times respected
- [ ] Content mix balanced (not all promotional)
- [ ] Bannerbear visuals generate
- [ ] SocialPilot deployment functional
- [ ] Campaign preview UI complete
- [ ] Edit/regenerate individual posts works
- [ ] Campaign saved to database
- [ ] Engagement predictions displayed
- [ ] Smart recommendations working
- [ ] Tested end-to-end
- [ ] No TS errors

---

## Commit

```bash
git commit -m "feat: Add AI campaign generation engine - THE GRAND FINALE

Campaign Types:
- Quick Win (7 days)
- Monthly Domination (30 days)
- Event Blitz (14 days)
- Evergreen Library (90 days)

Content Types:
- Authority posts (UVP-based)
- Problem/Solution series
- Case studies
- Seasonal campaigns
- Competitor contrast
- Social proof
- Educational content

Features:
- 17-source intelligence integration
- Product-specific campaign support
- Optimal posting time scheduling
- Bannerbear visual generation
- Social performance prediction
- Content mix optimization
- SocialPilot deployment
- Campaign preview and editing

Implements campaign-generator feature

THIS IS IT. THE BIG ONE. SYNAPSE IS COMPLETE."
```

---

*This is where everything comes together. 17 data sources, all the intelligence, all the products, all the social insights - all feeding into AI-generated campaigns that actually work. Don't fuck it up.*
