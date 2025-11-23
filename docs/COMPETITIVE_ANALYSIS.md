# Competitive Analysis Feature (Phase 2C)

## Overview
Automated competitive intelligence that scrapes competitor websites, extracts messaging themes, identifies white spaces, and generates actionable differentiation strategies.

**Created:** 2025-11-23
**Version:** 1.0
**Status:** Production Ready

## Features

### 1. Web Scraping with Apify
- Automated competitor website crawling
- Respects robots.txt and rate limits
- Configurable page limits and timeouts
- Graceful error handling and fallback analysis

### 2. Messaging Theme Extraction
- Identifies 5-10 key messaging themes per competitor
- Frequency analysis with confidence scoring
- Emotional tone detection (trust, urgency, aspiration, value, etc.)
- Context-aware examples from actual content

### 3. White Space Identification
- Detects what competitors are NOT addressing
- Compares against your breakthrough insights
- Urgency assessment (high/medium/low)
- Impact scoring (0-100)
- Difficulty estimation (easy/medium/hard)

### 4. Differentiation Strategies
- Generates 3-5 specific, actionable strategies
- Detailed implementation steps
- Expected outcomes and benefits
- Competitor adoption tracking

### 5. Theme Comparison
- Visual comparison of your themes vs competitors
- Frequency-based analysis
- Identifies your unique positioning

## Setup

### 1. Get Apify API Token
1. Sign up at [https://apify.com](https://apify.com)
2. Navigate to Settings → Integrations
3. Copy your API token

### 2. Configure Environment Variables

Add to `.env`:

```env
# Apify Configuration for Competitive Analysis (V2 Dashboard)
VITE_APIFY_API_TOKEN=your_apify_token_here
VITE_APIFY_TIMEOUT=60000
VITE_MAX_COMPETITORS=5
VITE_MAX_PAGES_PER_COMPETITOR=10
```

### 3. Provide Competitor URLs

Competitor URLs are configured in your business profile:

```typescript
const businessProfile = {
  // ... other fields
  competitors: [
    'https://competitor1.com',
    'https://competitor2.com',
    'https://competitor3.com'
  ]
};
```

## Usage

### Automatic Integration

The competitive analyzer runs automatically during orchestration if:
1. Apify API token is configured
2. Competitor URLs are provided in business profile

```typescript
import { orchestrationService } from '@/services/intelligence/orchestration.service';

const result = await orchestrationService.orchestrate(dataPoints, deepContext);
// Competitive analysis available at: deepContext.competitiveAnalysis
```

### Manual Usage

```typescript
import { competitiveAnalyzerService } from '@/services/intelligence/competitive-analyzer.service';

const analysis = await competitiveAnalyzerService.analyzeCompetitors(
  ['https://competitor1.com', 'https://competitor2.com'],
  deepContext
);

console.log('White Spaces:', analysis.whiteSpaces);
console.log('Strategies:', analysis.differentiationStrategies);
console.log('Theme Comparison:', analysis.themeComparison);
```

### UI Display

The CompetitiveGaps component automatically displays when analysis is available:

**Easy Mode:**
- Shows above the main strategy card
- Expandable white spaces and strategies
- Full-width layout

**Power Mode:**
- Shows at the top of the insights grid
- Integrated with existing panels
- Scrollable section

## API Reference

### CompetitiveAnalyzerService

#### `analyzeCompetitors(urls, context)`

Main analysis method.

**Parameters:**
- `urls: string[]` - Array of competitor website URLs (max 5)
- `context: DeepContext` - Your business intelligence context

**Returns:** `Promise<CompetitiveAnalysisResult>`

**Structure:**
```typescript
interface CompetitiveAnalysisResult {
  competitors: CompetitorData[];
  whiteSpaces: CompetitiveWhiteSpace[];
  differentiationStrategies: DifferentiationStrategy[];
  themeComparison: Record<string, { yours: number; theirs: number }>;
  analysisDate: Date;
  confidence: number; // 0-1
}
```

### CompetitiveWhiteSpace

```typescript
interface CompetitiveWhiteSpace {
  gap: string;                    // What's missing
  description: string;            // Why it matters
  opportunity: string;            // How to exploit it
  urgency: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  potentialImpact: number;        // 0-100
}
```

### DifferentiationStrategy

```typescript
interface DifferentiationStrategy {
  strategy: string;               // Strategy title
  rationale: string;              // Why this works
  implementation: string[];       // Action steps
  expectedOutcome: string;        // What to expect
  competitorsDoingThis: string[]; // Who's already doing it
  competitorsNotDoingThis: string[]; // Your advantage
}
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_APIFY_API_TOKEN` | - | Your Apify API token (required) |
| `VITE_APIFY_TIMEOUT` | 60000 | Scraping timeout in milliseconds |
| `VITE_MAX_COMPETITORS` | 5 | Maximum competitors to analyze |
| `VITE_MAX_PAGES_PER_COMPETITOR` | 10 | Max pages to scrape per site |

### Scraper Configuration

The service uses Apify's 'website-content-crawler' actor with:
- **Crawler Type:** cheerio (fast, suitable for static content)
- **Max Crawl Depth:** 2 (homepage + one level deep)
- **Retry Logic:** 3 attempts with 2-second delays

## Best Practices

### 1. Rate Limiting
- Limit to 5 competitors maximum
- Use 10 pages per competitor default
- Respect 60-second timeout per scrape

### 2. URL Selection
- Use competitor **websites**, not social media profiles
- Prioritize direct competitors in your market
- Include both large and small competitors for diverse insights

### 3. Interpreting Results

**High Confidence (>0.8):**
- Based on actual scraped data
- Multiple competitors analyzed
- Clear theme extraction

**Medium Confidence (0.5-0.8):**
- Partial scraping success
- Limited competitor data
- Some fallback analysis

**Low Confidence (<0.5):**
- Fallback analysis only
- No scraping data
- Based on context alone

## Fallback Behavior

When Apify is unavailable or scraping fails:

1. **Fallback Analysis Kicks In:**
   - Uses your context data (unarticulated needs, trends)
   - Generates generic white spaces
   - Creates basic differentiation strategies
   - Confidence set to 0.3

2. **No Crashes:**
   - Orchestration continues normally
   - UI displays available insights
   - Graceful degradation of features

## Limitations

### Technical
- **Requires Apify Credits:** Each scrape uses Apify compute units
- **Static Content Only:** Uses cheerio crawler (doesn't execute JavaScript)
- **Rate Limited:** Maximum 5 competitors, 10 pages each
- **English Only:** Theme extraction optimized for English content

### Functional
- **No Social Media:** Works with websites only
- **No Authentication:** Cannot scrape password-protected content
- **No Real-time:** Analysis runs during orchestration, not continuously

## Troubleshooting

### Issue: No competitive analysis appears

**Check:**
1. Is `VITE_APIFY_API_TOKEN` set in `.env`?
2. Are competitor URLs in business profile?
3. Check browser console for errors

### Issue: Low confidence scores

**Causes:**
- Scraping failed (check Apify logs)
- Competitor sites block bots
- Limited content extracted

**Solutions:**
- Try different competitor URLs
- Check robots.txt on competitor sites
- Increase timeout if scraping is slow

### Issue: Generic/vague strategies

**Causes:**
- Fallback analysis being used
- Limited context data
- No successful scraping

**Solutions:**
- Ensure Apify token is valid
- Provide richer DeepContext data
- Add more competitor URLs

## Cost Considerations

### Apify Pricing
- **Free Tier:** 5 compute units/month
- **Paid Plans:** Start at $49/month for 100 compute units
- **Website Content Crawler:** ~0.1-0.3 units per 10 pages

**Estimate:** Analyzing 5 competitors (10 pages each) ≈ 1-2 compute units

### Recommendations
- Use free tier for testing
- Upgrade for production usage
- Monitor usage in Apify dashboard
- Cache results to avoid re-scraping

## Testing

### Unit Tests
```bash
npm test -- competitive-analyzer.test.ts
```

Tests cover:
- Fallback analysis
- White space identification
- Strategy generation
- Theme comparison
- Industry-specific expectations

### Component Tests
```bash
npm test -- CompetitiveGaps.test.tsx
```

Tests cover:
- UI rendering
- User interactions (expand/collapse)
- Empty states
- Urgency/difficulty indicators
- Theme visualizations

## Files Created/Modified

### New Files
- `src/services/intelligence/competitive-analyzer.service.ts` - Main service
- `src/components/dashboard/intelligence-v2/CompetitiveGaps.tsx` - UI component
- `src/__tests__/v2/services/competitive-analyzer.test.ts` - Service tests
- `src/__tests__/v2/components/CompetitiveGaps.test.tsx` - Component tests
- `docs/COMPETITIVE_ANALYSIS.md` - This documentation

### Modified Files
- `src/services/intelligence/orchestration.service.ts` - Added Phase 4.5 integration
- `src/types/synapse/deepContext.types.ts` - Added competitiveAnalysis field
- `src/components/dashboard/intelligence-v2/EasyMode.tsx` - Added CompetitiveGaps display
- `src/components/dashboard/intelligence-v2/PowerMode.tsx` - Added CompetitiveGaps display
- `.env` - Added Apify configuration
- `.env.example` - Updated with Apify variables
- `package.json` - Added apify-client dependency

## Examples

### Example White Space

```json
{
  "gap": "Sustainability focus",
  "description": "Competitors are not addressing: Sustainability focus",
  "opportunity": "Position yourself as the only provider focusing on Sustainability focus",
  "urgency": "high",
  "difficulty": "medium",
  "potentialImpact": 75
}
```

### Example Differentiation Strategy

```json
{
  "strategy": "Lead with Quick meal prep solutions",
  "rationale": "Competitors are not addressing: Quick meal prep solutions",
  "implementation": [
    "Create content highlighting your focus on Quick meal prep solutions",
    "Feature Quick meal prep solutions prominently in all messaging",
    "Use customer testimonials about Quick meal prep solutions",
    "Position as the only [business] focused on Quick meal prep solutions"
  ],
  "expectedOutcome": "Become known as the go-to provider for Quick meal prep solutions",
  "competitorsDoingThis": [],
  "competitorsNotDoingThis": ["competitor1", "competitor2"]
}
```

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review Apify dashboard for scraping status
3. Verify environment configuration
4. Check test suite for expected behavior

## Future Enhancements

Potential improvements for future versions:
- [ ] Real-time competitive monitoring
- [ ] Social media competitor analysis
- [ ] Sentiment analysis on competitor content
- [ ] Automated strategy A/B testing
- [ ] Competitive benchmarking metrics
- [ ] Multi-language support
- [ ] JavaScript-rendered content support (Playwright crawler)
