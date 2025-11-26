# Social Scrapers Quick Reference

## 🚀 Quick Start

### Import the Service
```typescript
import { apifySocialScraper } from '@/services/intelligence/apify-social-scraper.service'
```

### Listen for Updates
```typescript
import { streamingApiManager } from '@/services/intelligence/streaming-api-manager'

// Twitter updates
streamingApiManager.on('apify-twitter-sentiment', (update) => {
  const { tweets, trending_topics, pain_points, overall_sentiment } = update.data
  console.log('Twitter pain points:', pain_points)
})

// Quora updates
streamingApiManager.on('apify-quora-insights', (update) => {
  const { questions, desires, fears } = update.data
  console.log('Customer desires:', desires)
})

// TrustPilot updates
streamingApiManager.on('apify-trustpilot-reviews', (update) => {
  const { reviews, satisfaction_patterns, psychological_triggers } = update.data
  console.log('Deal breakers:', satisfaction_patterns.deal_breakers)
})

// LinkedIn updates (B2B only)
streamingApiManager.on('apify-linkedin-b2b', (update) => {
  const { decision_maker_posts, buyer_intent_signals } = update.data
  console.log('Buyer intent:', buyer_intent_signals)
})

// G2 updates (B2B only)
streamingApiManager.on('apify-g2-reviews', (update) => {
  const { competitive_intelligence, buyer_intent_signals } = update.data
  console.log('Alternatives mentioned:', competitive_intelligence.alternatives_mentioned)
})
```

---

## 📊 Data Structures

### Twitter Sentiment
```typescript
{
  tweets: Array<{
    text: string
    likes: number
    retweets: number
    sentiment: 'positive' | 'negative' | 'neutral'
    engagement_rate: number
  }>
  trending_topics: string[]
  pain_points: PsychologicalTrigger[]
  viral_discussions: Array<{
    topic: string
    volume: number
    sentiment: string
  }>
  overall_sentiment: {
    positive: number  // 0-1
    negative: number  // 0-1
    neutral: number   // 0-1
  }
}
```

### Quora Insights
```typescript
{
  questions: Array<{
    question: string
    upvotes: number
    psychological_category: 'desire' | 'fear' | 'uncertainty' | 'problem'
  }>
  top_answers: Array<{
    answer: string
    upvotes: number
    key_insights: string[]
  }>
  desires: PsychologicalTrigger[]
  fears: PsychologicalTrigger[]
  engagement_metrics: {
    avg_upvotes: number
    avg_answers: number
  }
}
```

### LinkedIn B2B
```typescript
{
  company_posts: Array<{
    text: string
    engagement_rate: number
    topics: string[]
  }>
  decision_maker_posts: Array<{
    text: string
    title: string  // "VP of Engineering", etc.
    pain_points: string[]
  }>
  professional_pain_points: PsychologicalTrigger[]
  buyer_intent_signals: Array<{
    signal: string
    strength: number
    context: string
  }>
}
```

### TrustPilot Reviews
```typescript
{
  reviews: Array<{
    title: string
    text: string
    rating: number
    verified: boolean
  }>
  feature_requests: Array<{
    feature: string
    demand: number
    priority: 'high' | 'medium' | 'low'
  }>
  satisfaction_patterns: {
    common_praises: string[]
    common_complaints: string[]
    deal_breakers: string[]
    wow_factors: string[]
  }
  psychological_triggers: PsychologicalTrigger[]
  overall_rating: number
}
```

### G2 Reviews
```typescript
{
  reviews: Array<{
    rating: number
    pros: string
    cons: string
    user_role: string
    company_size: string
  }>
  buyer_intent_signals: Array<{
    signal: string
    category: 'evaluation' | 'consideration' | 'decision'
    strength: number
  }>
  competitive_intelligence: {
    alternatives_mentioned: string[]
    switching_reasons: string[]
    retention_factors: string[]
  }
  enterprise_insights: {
    avg_rating: number
    recommendation_rate: number
  }
}
```

### Psychological Trigger
```typescript
{
  type: 'desire' | 'fear' | 'frustration' | 'aspiration' | 'pain-point'
  text: string          // The trigger phrase
  intensity: number     // 0-1 (frequency/text_length)
  frequency: number     // How many times it appears
  context: string       // Surrounding text (200 chars)
  source: string        // 'Twitter', 'Quora', etc.
}
```

---

## 🎯 Common Use Cases

### 1. Get Real-time Pain Points
```typescript
streamingApiManager.on('apify-twitter-sentiment', (update) => {
  const topPainPoints = update.data.pain_points
    .filter(t => t.type === 'pain-point')
    .slice(0, 5)

  console.log('Top 5 pain points:', topPainPoints)
})
```

### 2. Extract Customer Desires
```typescript
streamingApiManager.on('apify-quora-insights', (update) => {
  const customerDesires = update.data.desires
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 10)

  console.log('Top 10 desires:', customerDesires)
})
```

### 3. Monitor Sentiment Shifts
```typescript
streamingApiManager.on('apify-twitter-sentiment', (update) => {
  const { positive, negative } = update.data.overall_sentiment

  if (negative > 0.6) {
    console.warn('High negative sentiment detected!')
  }
})
```

### 4. Find Buyer Intent (B2B)
```typescript
streamingApiManager.on('apify-g2-reviews', (update) => {
  const activeEvaluation = update.data.buyer_intent_signals
    .filter(s => s.category === 'evaluation' && s.strength > 0.7)

  console.log('Active buyers:', activeEvaluation)
})
```

### 5. Competitive Intelligence
```typescript
streamingApiManager.on('apify-g2-reviews', (update) => {
  const { alternatives_mentioned, switching_reasons } =
    update.data.competitive_intelligence

  console.log('Competitors:', alternatives_mentioned)
  console.log('Why they switch:', switching_reasons)
})
```

---

## 🔧 Direct API Usage

### Scrape Twitter Directly
```typescript
const twitterData = await apifySocialScraper.scrapeTwitterSentiment(
  ['coffee', 'espresso', 'cafe'],  // keywords
  50                                 // max tweets
)

console.log('Trending topics:', twitterData.trending_topics)
console.log('Viral discussions:', twitterData.viral_discussions)
```

### Scrape Quora Directly
```typescript
const quoraData = await apifySocialScraper.scrapeQuoraInsights(
  ['project management', 'team collaboration'],  // keywords
  30                                              // max questions
)

console.log('Top questions:', quoraData.questions)
console.log('Customer fears:', quoraData.fears)
```

### Scrape LinkedIn (B2B)
```typescript
const linkedinData = await apifySocialScraper.scrapeLinkedInB2B(
  'Salesforce',           // company name
  'CRM Software',         // industry
  30                      // max posts
)

console.log('Decision maker posts:', linkedinData.decision_maker_posts)
console.log('Professional pain points:', linkedinData.professional_pain_points)
```

### Scrape TrustPilot
```typescript
const trustpilotData = await apifySocialScraper.scrapeTrustPilotReviews(
  'Stripe',  // company name
  50         // max reviews
)

console.log('Feature requests:', trustpilotData.feature_requests)
console.log('Deal breakers:', trustpilotData.satisfaction_patterns.deal_breakers)
```

### Scrape G2 (B2B)
```typescript
const g2Data = await apifySocialScraper.scrapeG2Reviews(
  'Asana',                    // product name
  'Project Management',       // category
  50                          // max reviews
)

console.log('Buyer intent:', g2Data.buyer_intent_signals)
console.log('Feature requests:', g2Data.feature_requests)
```

---

## 🏭 Industry Filtering

### Check if B2B Industry
```typescript
import { selectAPIsForIndustry } from '@/services/intelligence/industry-api-selector.service'

const apiSelection = selectAPIsForIndustry('541511') // Software Development
console.log('Is B2B:', apiSelection.useLinkedInAPI)  // true

const apiSelection2 = selectAPIsForIndustry('722515') // Coffee Shop
console.log('Is B2B:', apiSelection2.useLinkedInAPI) // false
```

### 112 B2B NAICS Codes
- Technology & IT Services (15 codes)
- Professional Services (27 codes)
- Business Consulting (12 codes)
- Architecture & Design (8 codes)
- Research & Development (7 codes)
- Manufacturing (8 codes)
- Healthcare B2B (9 codes)
- Real Estate (4 codes)
- Construction Commercial (10 codes)
- Business Support (10 codes)
- Staffing & Employment (8 codes)
- Media & Content (6 codes)

**Full list:** See `/src/services/intelligence/industry-api-selector.service.ts`

---

## 🎨 UI Integration Examples

### Display Trending Topics
```typescript
streamingApiManager.on('apify-twitter-sentiment', (update) => {
  const topics = update.data.trending_topics

  return (
    <div className="trending-topics">
      <h3>Trending Topics</h3>
      <ul>
        {topics.map(topic => (
          <li key={topic}>#{topic}</li>
        ))}
      </ul>
    </div>
  )
})
```

### Show Pain Points
```typescript
streamingApiManager.on('apify-twitter-sentiment', (update) => {
  const painPoints = update.data.pain_points.slice(0, 5)

  return (
    <div className="pain-points">
      <h3>Customer Pain Points</h3>
      {painPoints.map(trigger => (
        <div key={trigger.text} className="trigger">
          <strong>{trigger.text}</strong>
          <span>Intensity: {(trigger.intensity * 100).toFixed(0)}%</span>
          <p>{trigger.context}</p>
        </div>
      ))}
    </div>
  )
})
```

### Display Sentiment Meter
```typescript
streamingApiManager.on('apify-twitter-sentiment', (update) => {
  const { positive, negative, neutral } = update.data.overall_sentiment

  return (
    <div className="sentiment-meter">
      <div className="positive" style={{width: `${positive * 100}%`}}>
        {(positive * 100).toFixed(0)}% Positive
      </div>
      <div className="negative" style={{width: `${negative * 100}%`}}>
        {(negative * 100).toFixed(0)}% Negative
      </div>
      <div className="neutral" style={{width: `${neutral * 100}%`}}>
        {(neutral * 100).toFixed(0)}% Neutral
      </div>
    </div>
  )
})
```

---

## ⚡ Performance Tips

### 1. Adjust Limits Based on Need
```typescript
// Light scraping (fast, less data)
await apifySocialScraper.scrapeTwitterSentiment(keywords, 20)

// Heavy scraping (slow, more data)
await apifySocialScraper.scrapeTwitterSentiment(keywords, 100)
```

### 2. Use Fallback Data
```typescript
streamingApiManager.on('api-error', ({ type, error }) => {
  if (type === 'apify-twitter-sentiment') {
    // Use cached data or show placeholder
    console.warn('Twitter scraping failed, using fallback')
  }
})
```

### 3. Progressive Enhancement
```typescript
// Show loading state
const [twitterData, setTwitterData] = useState(null)

streamingApiManager.on('apify-twitter-sentiment', (update) => {
  setTwitterData(update.data)
})

return twitterData ? <TwitterInsights data={twitterData} /> : <LoadingSpinner />
```

---

## 🔒 Security Notes

### ✅ Correct Usage
```typescript
// Client-side - use Supabase credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Edge Function - use secrets
const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY')
```

### ❌ Never Do This
```typescript
// WRONG - Never expose API keys in client
const APIFY_API_KEY = import.meta.env.VITE_APIFY_API_KEY
```

### Set Edge Function Secrets
```bash
# In Supabase Dashboard or CLI
supabase secrets set APIFY_API_KEY=apify_api_your_key_here
```

---

## 🐛 Debugging

### Enable Verbose Logging
```typescript
// Check browser console for:
[Apify Social] Starting TWITTER scraper...
[Apify Social] TWITTER completed: 30 results
[StreamingAPI] apify-twitter-sentiment completed successfully
```

### Monitor Edge Function Logs
```bash
# In Supabase Dashboard
Functions → apify-scraper → Logs

# Look for:
[Apify Edge] Starting actor: apify/twitter-scraper (TWITTER)
[Apify Edge] Status: SUCCEEDED
[Apify Edge] Success! Results count: 30
```

### Check Status
```typescript
const statuses = streamingApiManager.getApiStatuses()
console.log('Twitter status:', statuses.get('apify-twitter-sentiment'))
// { type: 'apify-twitter-sentiment', status: 'success', duration: 12500 }
```

---

## 📚 Additional Resources

- **Main Implementation:** `/src/services/intelligence/apify-social-scraper.service.ts`
- **Streaming Manager:** `/src/services/intelligence/streaming-api-manager.ts`
- **Industry Selector:** `/src/services/intelligence/industry-api-selector.service.ts`
- **Edge Function:** `/supabase/functions/apify-scraper/index.ts`
- **Full Documentation:** `/.buildrunner/APIFY_SOCIAL_SCRAPERS_IMPLEMENTATION.md`

---

**Quick Reference Last Updated:** November 25, 2025
