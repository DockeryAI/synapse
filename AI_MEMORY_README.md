## AI Persistent Memory + Learning

**AI that remembers your business and learns from what works.**

Tone preferences persist forever. Content patterns are automatically learned. Business context is injected into every AI conversation.

---

## 🧠 Overview

The AI Memory system gives Synapse a persistent memory of each SMB's:
- **Business Profile**: Name, industry, location, target audience, USP
- **Brand Voice**: Customer-provided examples of how they like to sound
- **Tone Preferences**: Casual, professional, funny, etc. - set once, applies forever
- **Campaign Preferences**: Preferred platforms, campaign types, topics to avoid
- **Successful Content Patterns**: What works for this specific business
- **AI Learnings**: Insights like "your audience engages 3x more with behind-the-scenes content"

This context is automatically injected into every AI conversation, ensuring consistent, personalized content generation.

---

## 📂 Architecture

### Services

**4 Core Services**:

1. **BusinessContextService** (`BusinessContextService.ts`)
   - Stores business profile, brand voice samples, campaign preferences
   - Manages business-specific context that never changes

2. **TonePreferenceService** (`TonePreferenceService.ts`)
   - Manages tone presets (casual, professional, funny, etc.)
   - Natural language tone adjustments: "make it funnier", "more professional"
   - Tone persists across ALL future content

3. **ContentLearningService** (`ContentLearningService.ts`)
   - Tracks high-performing content
   - Discovers patterns: topics, formats, hooks, CTAs
   - Stores insights: "posts about X get 3x engagement"

4. **ContextInjector** (`ContextInjector.ts`)
   - Gathers all context from other services
   - Formats as Claude API system message
   - Injects into every AI conversation

### Database Tables

**4 Supabase Tables** (see `supabase/migrations/20250117_ai_persistent_memory.sql`):

1. `ai_business_context` - Business profile and preferences
2. `ai_tone_preferences` - Tone settings
3. `ai_content_patterns` - Learned content patterns
4. `ai_learnings` - AI-generated insights

---

## 🎯 Key Features

### 1. Business Context Memory

**What it stores**:
- Business name, industry, type (local-service, ecommerce, etc.)
- Location (city, state, country)
- Target audience
- Unique selling proposition (USP)
- Brand personality
- Brand voice samples (customer-provided text examples)
- Campaign preferences (preferred types, platforms, durations)

**Example Usage**:

```typescript
import { BusinessContextService } from '@/services/ai/memory';

// Create business context
await BusinessContextService.upsertContext(userId, {
  business_name: 'Acme Plumbing',
  industry: 'Home Services',
  business_type: 'local-service',
  location: {
    city: 'Austin',
    state: 'TX',
    country: 'USA',
  },
  target_audience: 'Homeowners in Austin metro area',
  unique_selling_proposition: '24/7 emergency service with 2-hour response time',
  brand_personality: 'Friendly, reliable, and professional',
});

// Add brand voice sample
await BusinessContextService.addBrandVoiceSample(userId, {
  text: 'Need a plumber ASAP? We\'re on it. Call us 24/7.',
  source: 'customer_provided',
  quality_score: 0.9,
});

// Update campaign preferences
await BusinessContextService.updateCampaignPreferences(userId, {
  preferred_campaign_types: ['community-champion', 'trust-builder'],
  preferred_platforms: ['facebook', 'google-business'],
  preferred_content_types: ['video', 'image'],
  preferred_durations: [7, 10],
});
```

### 2. Tone Preference System

**8 Tone Presets**:
- **Casual** - Friendly, relaxed, conversational
- **Professional** - Polished, credible, business-focused
- **Funny** - Witty, humorous, entertaining
- **Inspirational** - Motivating, uplifting, empowering
- **Bold** - Confident, direct, attention-grabbing
- **Friendly** - Warm, approachable, welcoming
- **Authoritative** - Expert, knowledgeable, commanding
- **Conversational** - Natural, authentic, like talking to a friend

**Natural Language Adjustments**:
- "make it funnier" → Increases humor level
- "more professional" → Increases formality
- "less formal" → Decreases formality
- "more enthusiastic" → Increases enthusiasm
- "way more casual" → Decreases formality by 2 levels

**Example Usage**:

```typescript
import { TonePreferenceService } from '@/services/ai/memory';

// Set tone preset
await TonePreferenceService.setTonePreset(userId, 'casual');

// Set custom tone
await TonePreferenceService.setCustomTone(
  userId,
  'Friendly but professional, like a trusted advisor',
  formality: 3,
  humor: 1,
  enthusiasm: 4
);

// Adjust tone naturally
const result = await TonePreferenceService.adjustToneNaturally(
  userId,
  'make it funnier'
);

console.log(result.changes); // ['Made tone funnier']
console.log(result.new_tone.humor_level); // 2 (increased from 1)
```

**Tone Parameters**:
- **Formality**: 1-5 (1 = very casual, 5 = very formal)
- **Humor**: 0-3 (0 = serious, 3 = very funny)
- **Enthusiasm**: 1-5 (1 = reserved, 5 = very enthusiastic)

### 3. Content Pattern Learning

**What it learns**:
- **Topics**: Which topics get the most engagement
- **Formats**: Video, image, carousel, text performance
- **Hooks**: Effective opening lines
- **CTAs**: Successful calls-to-action
- **Timing**: Best posting times
- **Platforms**: Which platforms perform best

**Pattern Discovery**:
- Automatically analyzes high-performing content (engagement > benchmark)
- Identifies commonalities
- Calculates confidence scores based on sample size
- Stores patterns for future use

**Example Usage**:

```typescript
import { ContentLearningService } from '@/services/ai/memory';

// Track content performance
await ContentLearningService.trackContentPerformance({
  post_id: 'post-123',
  user_id: userId,
  campaign_type: 'community-champion',
  platform: 'instagram',
  content_type: 'video',
  content_preview: 'Behind the scenes: How we tackle a tough job...',
  topic: 'behind-the-scenes',
  posted_at: new Date(),
  metrics: {
    reach: 1500,
    engagement: 120,
    engagement_rate: 0.08, // 8%
  },
  is_high_performing: true,
  benchmark_multiplier: 3.2, // 3.2x better than benchmark
});

// Get learned patterns
const patterns = await ContentLearningService.getPatterns(userId, {
  pattern_type: 'topic',
  min_confidence: 0.7,
});

// Get top patterns for AI
const patternsForAI = await ContentLearningService.getPatternsForAI(userId);
console.log(patternsForAI.topics); // ['behind-the-scenes', 'customer-testimonials', ...]

// Get insights
const learnings = await ContentLearningService.getLearnings(userId);
console.log(learnings[0].insight); // "Your audience engages 3x more with behind-the-scenes content"
```

### 4. Context Injection

**Formats all context for Claude API**:

```typescript
import { ContextInjector } from '@/services/ai/memory';

// Inject full context into AI conversation
const result = await ContextInjector.injectFullContext(userId);

console.log(result.system_message); // Formatted system message for Claude
console.log(result.tokens_used); // ~500-1000 tokens
console.log(result.components_included); // ['business_context', 'tone_preferences', ...]

// Use in Claude API call
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: result.system_message, // <-- Injected context
  messages: [
    {
      role: 'user',
      content: 'Create a Facebook post about our new service',
    },
  ],
});
```

**System Message Example**:

```
# Business Context
You are creating content for Acme Plumbing, a Home Services business (local-service).
Location: Austin, TX, USA
Target Audience: Homeowners in Austin metro area
Unique Selling Proposition: 24/7 emergency service with 2-hour response time
Brand Personality: Friendly, reliable, and professional

## Brand Voice Examples
Write in a similar style to these examples:
1. "Need a plumber ASAP? We're on it. Call us 24/7."
2. "Real talk: Plumbing emergencies don't wait. Neither do we."

## Tone Preferences
Use a casual tone.
Formality level: 2/5 (1=very casual, 5=very formal)
Humor level: 1/3 (0=serious, 3=very funny)
Enthusiasm level: 4/5 (1=reserved, 5=very enthusiastic)

## What Works for This Business
Based on past performance data, incorporate these proven patterns:

### High-Performing Topics
- behind-the-scenes
- emergency service stories
- customer testimonials

### Best-Performing Formats
- video
- carousel

### Effective Hooks
- "Need help fast?"
- "Here's what we learned after 15 years..."

## Key Insights
1. Your audience engages 3x more with behind-the-scenes content showing your team at work
   → Recommendation: Include more behind-the-scenes posts in your campaigns

## Instructions
Use all the above context to create content that feels authentic to this business.
Match the tone, incorporate successful patterns, and align with their preferences.
IMPORTANT: Apply these preferences to ALL content you generate, not just the first response.
```

---

## 🔄 How It Works

### Content Generation Flow

**Without AI Memory** (Before):
```
User: "Create a Facebook post"
AI: *generates generic content*
```

**With AI Memory** (After):
```
1. User: "Create a Facebook post"
2. ContextInjector fetches:
   - Business context (name, industry, USP)
   - Tone preferences (casual, humor level 1)
   - Successful patterns (behind-the-scenes gets 3x engagement)
   - Brand voice samples
3. System message injected into Claude API
4. AI: *generates personalized content matching brand voice, tone, and proven patterns*
```

### Tone Adjustment Flow

**Example: "Make it funnier"**

```
1. User says: "make it funnier"
2. TonePreferenceService.adjustToneNaturally(userId, "make it funnier")
3. Service parses intent:
   - attribute: 'humor'
   - direction: 'increase'
   - magnitude: 1
4. Current humor level: 1
5. New humor level: 2 (increased by 1)
6. Database updated
7. ALL future content uses humor level 2
```

### Pattern Learning Flow

**Example: Learning from high-performing post**

```
1. Post published: "Behind the scenes: How we fix a broken pipe"
2. Performance tracked: 8% engagement (vs 2.5% benchmark = 3.2x better)
3. ContentLearningService.trackContentPerformance() called
4. Pattern discovered:
   - Type: 'topic'
   - Value: 'behind-the-scenes'
   - Avg engagement: 8%
   - Confidence: 0.75 (based on 5 samples)
5. Pattern stored in database
6. Future campaigns include "behind-the-scenes" in content mix
```

---

## 🎬 User Scenarios

### Scenario 1: New User Onboarding

**Step 1: Set up business context**
```typescript
await BusinessContextService.upsertContext(userId, {
  business_name: 'Bella Vita Trattoria',
  industry: 'Restaurant',
  business_type: 'restaurant',
  location: { city: 'Boston', state: 'MA' },
  target_audience: 'Families and couples looking for authentic Italian dining',
  unique_selling_proposition: 'Family recipes passed down for 3 generations',
});
```

**Step 2: Add brand voice sample**
```typescript
await BusinessContextService.addBrandVoiceSample(userId, {
  text: 'Welcome to our table! Just like Nonna used to make. 🍝',
  source: 'customer_provided',
});
```

**Step 3: Set tone**
```typescript
await TonePreferenceService.setTonePreset(userId, 'friendly');
```

**Result**: All future content automatically sounds like Bella Vita Trattoria.

### Scenario 2: User Adjusts Tone Mid-Campaign

**Week 1**: Content is too formal
```
User: "This sounds too corporate. Make it more casual and friendly."
```

```typescript
await TonePreferenceService.adjustToneNaturally(userId, 'more casual and friendly');
```

**Result**: Formality drops from 4 to 2, all future posts are more casual.

### Scenario 3: AI Learns from Performance

**Week 1**: 5 posts published, various topics
**Week 2**: Analytics show "customer story" posts got 4x engagement

```typescript
// Automatically discovers pattern
const pattern = await ContentLearningService.discoverPatterns(userId);

// Creates learning
await ContentLearningService.storeLearning(
  userId,
  'content',
  'Your audience loves customer stories - they get 4x more engagement',
  5, // data points
  0.85, // confidence
  'Include 2-3 customer story posts in each campaign'
);
```

**Result**: Future campaigns automatically include more customer stories.

---

## 📊 Database Schema

### ai_business_context

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| business_name | TEXT | Business name |
| industry | TEXT | Industry (e.g., "Home Services") |
| business_type | TEXT | Type (local-service, ecommerce, etc.) |
| location_city | TEXT | City |
| location_state | TEXT | State |
| location_country | TEXT | Country |
| target_audience | TEXT | Target audience description |
| unique_selling_proposition | TEXT | USP |
| brand_personality | TEXT | Brand personality description |
| brand_voice_samples | JSONB | Array of voice samples |
| campaign_preferences | JSONB | Preferred campaigns, platforms |
| created_at | TIMESTAMPTZ | Created timestamp |
| updated_at | TIMESTAMPTZ | Updated timestamp |

### ai_tone_preferences

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| tone_preset | TEXT | Preset (casual, professional, etc.) |
| custom_description | TEXT | Custom tone description |
| formality_level | INTEGER | 1-5 |
| humor_level | INTEGER | 0-3 |
| enthusiasm_level | INTEGER | 1-5 |
| examples | TEXT[] | Tone examples |
| apply_to_all_content | BOOLEAN | Apply globally |
| created_at | TIMESTAMPTZ | Created timestamp |
| updated_at | TIMESTAMPTZ | Updated timestamp |

### ai_content_patterns

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| pattern_type | TEXT | Type (topic, format, hook, cta, etc.) |
| pattern_value | TEXT | The pattern (e.g., "behind-the-scenes") |
| campaign_type | TEXT | Which campaign type |
| platform | TEXT | Which platform |
| avg_engagement_rate | NUMERIC | Average engagement rate |
| avg_reach | INTEGER | Average reach |
| sample_size | INTEGER | Number of posts |
| confidence_score | NUMERIC | 0-1 confidence |
| examples | JSONB | Example posts |
| discovered_at | TIMESTAMPTZ | Discovered timestamp |
| last_validated_at | TIMESTAMPTZ | Last validation |
| is_active | BOOLEAN | Is pattern active |

### ai_learnings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| learning_category | TEXT | Category (content, timing, etc.) |
| insight | TEXT | Human-readable insight |
| data_points | INTEGER | Number of supporting data points |
| confidence | NUMERIC | 0-1 confidence |
| recommendation | TEXT | Actionable recommendation |
| created_at | TIMESTAMPTZ | Created timestamp |
| is_dismissed | BOOLEAN | Has user dismissed |

---

## 🔧 API Reference

### BusinessContextService

```typescript
// Get context
const context = await BusinessContextService.getContext(userId);

// Create/update context
await BusinessContextService.upsertContext(userId, { ...contextData });

// Add brand voice sample
await BusinessContextService.addBrandVoiceSample(userId, {
  text: 'Sample text',
  source: 'customer_provided',
});

// Update campaign preferences
await BusinessContextService.updateCampaignPreferences(userId, {
  preferred_campaign_types: ['community-champion'],
  preferred_platforms: ['facebook', 'instagram'],
});

// Get context for AI
const aiContext = await BusinessContextService.getContextForAI(userId);
```

### TonePreferenceService

```typescript
// Set tone preset
await TonePreferenceService.setTonePreset(userId, 'casual');

// Set custom tone
await TonePreferenceService.setCustomTone(userId, 'friendly but professional', 3, 1, 4);

// Adjust tone naturally
const result = await TonePreferenceService.adjustToneNaturally(userId, 'make it funnier');

// Get tone for AI
const toneForAI = await TonePreferenceService.getToneForAI(userId);

// Get all presets
const presets = TonePreferenceService.getTonePresets();
```

### ContentLearningService

```typescript
// Track performance
await ContentLearningService.trackContentPerformance(performanceData);

// Get patterns
const patterns = await ContentLearningService.getPatterns(userId, {
  pattern_type: 'topic',
  min_confidence: 0.7,
});

// Get patterns for AI
const patternsForAI = await ContentLearningService.getPatternsForAI(userId);

// Get learnings
const learnings = await ContentLearningService.getLearnings(userId, limit: 10);

// Store learning
await ContentLearningService.storeLearning(userId, 'content', 'Insight text', 5, 0.85);
```

### ContextInjector

```typescript
// Inject full context
const result = await ContextInjector.injectFullContext(userId);

// Inject lightweight context (fewer tokens)
const lightResult = await ContextInjector.injectLightweightContext(userId);

// Custom injection
const customResult = await ContextInjector.injectContext(userId, {
  include_business_context: true,
  include_tone_preferences: true,
  include_content_patterns: false,
  include_learnings: true,
  max_learnings: 5,
});

// Estimate token usage
const tokens = await ContextInjector.estimateTokenUsage(userId);
```

---

## ✅ Success Criteria

- ✅ Tone preferences persist forever (stored in database, applied to all content)
- ✅ AI learns from successful content (patterns discovered and stored)
- ✅ Context auto-injected into every AI conversation (via ContextInjector)
- ✅ Natural language tone adjustments work ("make it funnier" increases humor)
- ✅ Brand voice samples influence content generation
- ✅ Campaign preferences auto-applied to new campaigns
- ✅ Learnings displayed to user ("Posts about X get 3x engagement")

---

## 🧪 Testing

See test file (coming in next commit).

---

## 🚀 Next Steps

**Immediate**:
1. Create React components for tone preference UI
2. Create "More like this" button for successful posts
3. Add learning insights to dashboard

**Future Enhancements**:
1. A/B test tone variations
2. Auto-detect brand voice from website
3. Recommend tone preset based on industry
4. Pattern discovery using NLP/ML
5. Predict content performance before publishing

---

**Built with Claude Code** 🤖
