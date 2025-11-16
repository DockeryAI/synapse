# Smart Picks UI

AI-powered campaign recommendation system with intelligent scoring and data provenance.

## Overview

Smart Picks analyzes DeepContext business intelligence data and recommends 3-5 best campaign opportunities using a multi-factor scoring algorithm.

## Components

### `SmartPicks`
Main container component that orchestrates the entire Smart Picks experience.

**Props:**
- `context: DeepContext` - Business intelligence data
- `campaignType?: CampaignType` - Optional filter (authority-builder | social-proof | local-pulse)
- `onGenerateCampaign: (pick: SmartPick) => void` - Generate campaign callback
- `onSwitchToMixer?: () => void` - Fallback to Content Mixer
- `maxPicks?: number` - Maximum picks to show (default: 5)

**Usage:**
```tsx
import { SmartPicks } from '@/components/campaign/smart-picks'

<SmartPicks
  context={deepContext}
  onGenerateCampaign={(pick) => console.log('Generate:', pick)}
  onSwitchToMixer={() => console.log('Opening mixer...')}
/>
```

### `SmartPickCard`
Individual campaign recommendation card with preview and actions.

**Features:**
- Headline + hook preview
- Confidence/quality badges
- Data source provenance
- Expected performance metrics
- Time-sensitive indicators
- Generate and Preview CTAs

### `QuickPreview`
Modal for full campaign preview before generation.

**Features:**
- Platform selector tabs (LinkedIn, Facebook, Instagram, Twitter)
- Simulated social post preview
- Performance score visualization
- Reasoning explanation
- Data source details

## Scoring Algorithm

Each Smart Pick is scored using 4 weighted factors:

1. **Relevance (35%)**: How well the insight matches the business/industry
2. **Timeliness (25%)**: Time-sensitivity of the content
3. **Evidence Quality (25%)**: Strength of supporting data
4. **Confidence (15%)**: AI model certainty

**Overall Score Formula:**
```
score = (relevance × 0.35) + (timeliness × 0.25) + (evidenceQuality × 0.25) + (confidence × 0.15)
```

## Campaign Type Strategies

### Authority Builder
- **Best for:** B2B, professional services, consultants
- **Focus:** Industry expertise, data-driven insights
- **Platforms:** LinkedIn, Twitter, Blog
- **Filters:** Insights with strong evidence (2+ sources)

### Social Proof
- **Best for:** Local businesses, e-commerce, service providers
- **Focus:** Customer reviews, testimonials, success stories
- **Platforms:** Facebook, Instagram, Google Business
- **Filters:** Deep psychology insights, customer-related content

### Local Pulse
- **Best for:** Local retailers, restaurants, community brands
- **Focus:** Weather, events, local news, trending moments
- **Platforms:** Facebook, Instagram, Nextdoor
- **Filters:** Time-sensitive, location-specific insights

## Data Sources

Smart Picks tracks and displays provenance from:
- Weather data (hourly updates)
- Customer reviews (daily updates)
- Search trends (real-time)
- News articles (hourly updates)
- Reddit discussions (real-time)
- YouTube trends (daily updates)
- Competitor analysis (weekly updates)
- Industry data (static)

All sources include verification badges and freshness indicators.

## States

### Loading
Shows animated intelligence gathering with data source checklist.

### Empty
Displays when no high-quality picks found. Provides fallback to Content Mixer.

### Error
Shows error message with retry button.

### Success
Displays grid of ranked Smart Picks.

## Performance

- Generation time: ~2-5 seconds for 5 picks
- Caches Synapse insights to avoid regeneration
- Preview generation: ~1-2 seconds per platform

## Testing

**Manual Testing:**
```tsx
// Test with sample DeepContext
const mockContext: DeepContext = {
  business: {
    profile: {
      name: 'Test Business',
      industry: 'Software',
      location: { city: 'Austin', state: 'TX' }
    }
  },
  synthesis: {
    insights: [/* Synapse insights */]
  }
}

<SmartPicks context={mockContext} onGenerateCampaign={console.log} />
```

**Unit Testing:**
```typescript
import { generateSmartPicks } from '@/services/campaign/SmartPickGenerator'

const result = await generateSmartPicks(context, 'authority-builder', {
  maxPicks: 3,
  minConfidence: 0.7
})

expect(result.picks.length).toBeLessThanOrEqual(3)
expect(result.picks[0].confidence).toBeGreaterThanOrEqual(0.7)
```

## Integration

Smart Picks integrates with:
- **SynapseGenerator**: Generates/uses Synapse insights
- **OpenRouter**: Preview headline/hook generation
- **DeepContext**: Business intelligence source
- **Content Mixer**: Fallback option for manual selection

## Future Enhancements

- [ ] A/B testing different campaign variations
- [ ] Historical performance tracking
- [ ] Learning from user selections (feedback loop)
- [ ] Multi-insight combination recommendations
- [ ] Platform-specific optimization scores
- [ ] Competitor campaign analysis
