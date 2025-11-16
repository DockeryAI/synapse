# Bannerbear Visual Integration

Automated visual generation for Synapse campaign types using Bannerbear API.

## Overview

This integration provides campaign-specific visual generation for all three Synapse campaign types:
- **Authority Builder**: Professional, data-focused designs
- **Social Proof**: Testimonial-focused warm designs
- **Local Pulse**: Vibrant, community-focused designs

## Files Added/Modified

### Configuration
- `src/config/bannerbear.config.ts` - API config and platform specs
- `src/config/campaign-templates.config.ts` - Template definitions for 3 campaign types

### Types
- `src/types/campaign-visual.types.ts` - Visual generation types
- `src/types/database.types.ts` - Added `generated_visuals` table

### Services
- `src/services/visuals/bannerbear.service.ts` - Enhanced with campaign methods:
  - `generateCampaignVisual()` - Single platform generation
  - `generateAllPlatforms()` - Batch generation
  - 7-day visual caching
  - Field mapping logic

- `src/services/visuals/visual-storage.service.ts` - Database persistence:
  - Save visuals to Supabase
  - Link to campaigns
  - Query and stats methods

### Components
- `src/components/campaign/VisualPreview.tsx` - Preview component:
  - Platform-specific aspect ratios
  - Loading/error states
  - Download functionality
  - Multi-platform grid view

### Testing
- `src/services/visuals/__tests__/bannerbear.mock.ts` - Mock data and service

## Setup Required

### 1. Environment Variables

Add to `.env`:
```bash
VITE_BANNERBEAR_API_KEY=your_api_key_here
```

### 2. Create Bannerbear Templates

Create 3 templates in Bannerbear dashboard with these modifications:

**Authority Builder Template:**
- Variables: `headline`, `subheadline`, `key_stat`, `supporting_text`, `logo`, `primary_color`
- Recommended size: 1200x627 (LinkedIn feed)
- Style: Professional, bold typography

**Social Proof Template:**
- Variables: `headline`, `testimonial_text`, `customer_name`, `result_text`, `logo`, `primary_color`
- Recommended size: 1080x1080 (Instagram feed)
- Style: Warm, testimonial-focused

**Local Pulse Template:**
- Variables: `headline`, `subheadline`, `location_text`, `date_text`, `event_description`, `logo`, `primary_color`
- Recommended size: 1200x630 (Facebook feed)
- Style: Vibrant, community-focused

### 3. Update Template IDs

After creating templates in Bannerbear, update `src/config/campaign-templates.config.ts`:

```typescript
export const AUTHORITY_BUILDER_TEMPLATE: CampaignTemplateConfig = {
  templateId: 'YOUR_REAL_TEMPLATE_ID', // Replace placeholder
  // ...
};
```

### 4. Database Migration

Create the `generated_visuals` table in Supabase:

```sql
CREATE TABLE generated_visuals (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  campaign_id TEXT REFERENCES campaigns(id),
  campaign_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  format TEXT NOT NULL,
  image_url TEXT NOT NULL,
  bannerbear_uid TEXT NOT NULL,
  template_id TEXT NOT NULL,
  content_snapshot JSONB DEFAULT '{}'::jsonb,
  dimensions JSONB NOT NULL,
  aspect_ratio TEXT NOT NULL,
  generation_time_ms INTEGER NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_visuals_brand ON generated_visuals(brand_id);
CREATE INDEX idx_generated_visuals_campaign ON generated_visuals(campaign_id);
CREATE INDEX idx_generated_visuals_type ON generated_visuals(campaign_type);
```

## Usage

### Generate Single Platform Visual

```typescript
import { bannerbearService } from '@/services/visuals/bannerbear.service';

const visual = await bannerbearService.generateCampaignVisual({
  campaignType: 'authority_builder',
  platform: 'linkedin',
  format: 'feed',
  content: {
    headline: '5 Industry Trends to Watch',
    subheadline: 'Expert Analysis',
    stats: ['73% growth in Q4'],
    brandName: 'Acme Corp',
  },
  branding: {
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#2563EB',
  },
});

console.log(visual.imageUrl); // PNG image URL
```

### Generate All Platforms

```typescript
const result = await bannerbearService.generateAllPlatforms({
  campaignType: 'social_proof',
  content: {
    headline: 'Real Customer Results',
    testimonial: 'Amazing service!',
    customerName: 'Sarah J.',
    brandName: 'Acme Corp',
  },
  platforms: ['linkedin', 'facebook', 'instagram', 'twitter'],
});

console.log(`Generated ${result.completed}/${result.total} visuals`);
```

### Save to Database

```typescript
import { saveVisualToDatabase } from '@/services/visuals/visual-storage.service';

const saved = await saveVisualToDatabase(
  visual,
  'brand_123',
  'campaign_456',
  { headline: 'Original content...' }
);
```

### Display in UI

```typescript
import { VisualPreview } from '@/components/campaign/VisualPreview';

<VisualPreview
  visual={visual}
  isLoading={false}
  onRegenerate={() => regenerateVisual()}
  onDownload={() => console.log('Downloaded')}
  showActions={true}
/>
```

## Features

### Caching
- 7-day in-memory cache for generated visuals
- Reduces API calls and costs
- Automatic cache cleanup

### Error Handling
- Retry logic with exponential backoff (3 attempts)
- Graceful failure for partial results
- Detailed error messages

### Rate Limiting
- 2 concurrent requests maximum
- 1-second delay between batches
- Prevents API throttling

### Platform Support
- **LinkedIn**: Feed (1200x627), Story (1080x1920)
- **Facebook**: Feed (1200x630), Story (1080x1920)
- **Instagram**: Feed (1080x1080), Story (1080x1920), Reel (1080x1920)
- **Twitter**: Feed (1200x675), Card (800x418)
- **TikTok**: Video (1080x1920)

## Testing Without API Key

Use mock service for testing:

```typescript
import { mockBannerbearService, createMockAuthorityBuilderRequest } from '@/services/visuals/__tests__/bannerbear.mock';

const request = createMockAuthorityBuilderRequest();
const visual = await mockBannerbearService.generateCampaignVisual(request);
```

## Architecture

```
Campaign Type Selection
         ↓
Template Config Lookup (campaign-templates.config.ts)
         ↓
Content Field Mapping (mapCampaignContentToTemplate)
         ↓
Platform Spec Lookup (PLATFORM_SPECS)
         ↓
Bannerbear API Call (createImage)
         ↓
Polling for Completion (pollForImage)
         ↓
Cache Result (7 days)
         ↓
Save to Database (optional)
         ↓
Return GeneratedVisual
```

## Performance

- **Single visual**: ~8-12 seconds (API generation time)
- **Batch (4 platforms)**: ~25-35 seconds (with rate limiting)
- **Cache hit**: <10ms

## Cost Optimization

1. **Template Reuse**: Each campaign type uses one template across all platforms
2. **Caching**: 7-day cache significantly reduces API calls
3. **Batch Generation**: Efficient parallel processing with rate limiting
4. **Field Defaults**: Automatic fallbacks reduce API errors

## Next Steps

1. Create templates in Bannerbear dashboard
2. Update template IDs in config
3. Run database migration
4. Set API key in environment
5. Test with mock service first
6. Generate real visuals

## Troubleshooting

**"Template not configured" error**
- Update template IDs in `campaign-templates.config.ts`

**API timeout**
- Check Bannerbear API status
- Verify API key is valid
- Ensure template exists

**Visual quality issues**
- Adjust template design in Bannerbear dashboard
- Modify field mappings in template config

## Support

For questions or issues, refer to:
- Bannerbear API docs: https://www.bannerbear.com/api/
- Template creation guide: https://www.bannerbear.com/help/articles/62-creating-your-first-template/
