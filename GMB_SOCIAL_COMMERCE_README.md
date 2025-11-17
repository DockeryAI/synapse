# GMB + Social Commerce Integration

**Status:** MVP Complete ✅
**Created:** 2025-01-17
**Worktree:** `feature/gmb-social-commerce`

## Overview

This feature adds Google My Business posting automation and Instagram/Facebook social commerce capabilities to Synapse. Enables businesses to:

1. **Google My Business:** Auto-post 2x/week to GMB locations with campaign integration
2. **Instagram Shopping:** Product catalog sync, shoppable posts, product tagging
3. **Facebook Shop:** Storefront creation, marketplace integration, shoppable posts

## Architecture

### Services Created

#### 1. `GMBService.ts` (546 lines)
- OAuth 2.0 flow with Google
- Account and location management
- Post creation (UPDATE, OFFER, EVENT, PRODUCT types)
- Token refresh automation
- Error handling with retries

**Key Methods:**
- `getAuthUrl()` - Generate OAuth URL
- `handleAuthCallback()` - Exchange code for tokens
- `listLocations()` - Get GMB locations
- `createPost()` - Create GMB post (NOTE: Posts API deprecated by Google in 2021)
- `loadConnection()` - Restore saved OAuth connection

#### 2. `GMBScheduler.ts` (500+ lines)
- 2x/week posting schedule (default: Tuesday & Friday, 10 AM)
- Post type rotation (UPDATE → OFFER → EVENT → UPDATE)
- Campaign integration
- Auto-generate content from campaigns
- Retry logic with exponential backoff (max 3 retries)
- Queue management

**Key Methods:**
- `createSchedule()` - Set up posting schedule for location
- `autoScheduleFromCampaign()` - Generate 4 posts from campaign
- `processDuePosts()` - Run on cron to publish pending posts
- `getPostingStats()` - Analytics

#### 3. `InstagramShoppingService.ts` (550+ lines)
- Product catalog creation/management
- Batch product uploads (efficient for 100+ products)
- Product tagging on Instagram posts/Stories
- Shop eligibility checking
- Sync from internal product database

**Key Methods:**
- `createProductCatalog()` - Create new catalog
- `batchAddProducts()` - Upload products in bulk
- `tagProductsInPost()` - Add product tags to existing post
- `enableInstagramShopping()` - Enable shopping on IG account
- `syncProductsFromDatabase()` - Sync Synapse products to IG catalog

#### 4. `FacebookShopService.ts` (450+ lines)
- Facebook Shop creation on Page
- Shoppable post creation
- Marketplace integration
- Direct checkout links
- Unified catalog (shared with Instagram)
- Post template generation

**Key Methods:**
- `createShop()` - Create shop on Facebook Page
- `createShoppablePost()` - Post with product tags
- `enableMarketplace()` - Enable Facebook Marketplace
- `getCatalogInsights()` - View/click/purchase analytics

### Database Tables (9 total)

#### GMB Tables
1. **`gmb_connections`** - OAuth tokens, account info, locations
2. **`gmb_posting_schedules`** - Posting frequency, days, times per location
3. **`gmb_scheduled_posts`** - Post queue (pending/published/failed)

#### Social Commerce Tables
4. **`instagram_shop_setup`** - IG shopping config, catalog ID, review status
5. **`facebook_shop_setup`** - FB shop config, storefront URL, marketplace status
6. **`product_catalogs`** - Unified catalogs (shared IG/FB)
7. **`catalog_product_sync`** - Tracks sync status for each product
8. **`shoppable_posts`** - Posts with product tags
9. **`product_performance`** - Views, clicks, purchases per product per day

All tables have:
- Row Level Security (RLS) enabled
- `updated_at` auto-update triggers
- User isolation (users only see their own data)
- Proper indexes for query performance

## Setup Instructions

### 1. Environment Variables

Add to `.env`:

```bash
# Google My Business
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Facebook (for IG Shopping + FB Shop)
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Google My Business API
   - Business Information API (v1)
   - Account Management API (v1)
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5173/auth/google/callback`
   - Download credentials

**IMPORTANT:** Google deprecated the Posts API in 2021. You'll need to:
- Use Business Profile Performance API instead
- Or post manually through GMB dashboard
- Or wait for Google to provide a new posting endpoint

### 3. Facebook Developer Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app or use existing
3. Add products:
   - Facebook Login
   - Instagram Graph API
   - Commerce Platform
4. Configure OAuth redirect: `http://localhost:5173/auth/facebook/callback`
5. Request permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_shopping_tag_products`
   - `catalog_management`
6. Submit for App Review (required for production)

### 4. Run Database Migration

```bash
# Apply migration to Supabase
supabase db push

# Or manually:
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/20250117_gmb_social_commerce.sql
```

### 5. Install Dependencies

Already installed in worktree:
```bash
npm install googleapis
```

## Usage Examples

### GMB: Connect and Schedule Posts

```typescript
import { getGMBService, getGMBScheduler } from './services/gmb';

// Step 1: OAuth flow
const gmbService = getGMBService();
const authUrl = gmbService.getAuthUrl(userId);
// Redirect user to authUrl...

// Step 2: Handle callback
const connection = await gmbService.handleAuthCallback(code, userId);

// Step 3: Set up 2x/week posting
const scheduler = getGMBScheduler();
await scheduler.createSchedule(userId, locationId, {
  frequency: 'twice_weekly',
  days_of_week: [2, 5], // Tuesday, Friday
  time_of_day: '10:00',
  enabled: true,
});

// Step 4: Auto-schedule from campaign
const posts = await scheduler.autoScheduleFromCampaign(
  userId,
  locationId,
  campaignId,
  {
    type: 'Authority Builder',
    theme: 'Local expert',
    business_name: 'Acme Plumbing',
    industry: 'Home Services',
    location: 'Austin, TX',
  }
);
```

### Instagram Shopping: Sync Products

```typescript
import { getInstagramShoppingService } from './services/social-commerce';

const igService = getInstagramShoppingService();

// Step 1: Create catalog
const catalog = await igService.createProductCatalog(
  businessId,
  'Acme Products',
  accessToken
);

// Step 2: Sync products from database
const result = await igService.syncProductsFromDatabase(
  userId,
  catalog.id,
  accessToken
);
console.log(`Synced ${result.synced} products, ${result.failed} failed`);

// Step 3: Enable shopping
await igService.enableInstagramShopping(
  instagramBusinessAccountId,
  catalog.id,
  accessToken
);

// Step 4: Tag products in post
await igService.tagProductsInPost(
  mediaId,
  [
    { product_id: 'prod_123', x: 0.5, y: 0.3 },
    { product_id: 'prod_456', x: 0.7, y: 0.6 },
  ],
  accessToken
);
```

### Facebook Shop: Create Shoppable Post

```typescript
import { getFacebookShopService } from './services/social-commerce';

const fbService = getFacebookShopService();

// Step 1: Create shop
const shop = await fbService.createShop(pageId, catalogId, accessToken);

// Step 2: Create shoppable post
const postId = await fbService.createShoppablePost(
  {
    page_id: pageId,
    message: '🛍️ Check out our new arrivals!',
    product_tags: ['prod_123', 'prod_456', 'prod_789'],
    call_to_action: { type: 'SHOP_NOW' },
  },
  accessToken
);

// Step 3: Get performance
const insights = await fbService.getProductInsights('prod_123', accessToken);
console.log(`Views: ${insights.views}, Clicks: ${insights.clicks}`);
```

## Cron Jobs Needed

Set up these recurring jobs:

### 1. Process GMB Due Posts (every 5 minutes)
```typescript
import { getGMBScheduler } from './services/gmb';

// In your cron job handler:
const scheduler = getGMBScheduler();
await scheduler.processDuePosts();
```

### 2. Sync Product Catalogs (daily at 2 AM)
```typescript
// Re-sync products to keep inventory/pricing updated
await instagramService.syncProductsFromDatabase(userId, catalogId, accessToken);
```

### 3. Refresh GMB Tokens (daily)
```typescript
// Auto-refresh happens on API calls, but can be proactive:
const connection = await gmbService.loadConnection(userId);
// Token refresh happens automatically if expired
```

## Known Issues & Limitations

### Google My Business
1. **Posts API Deprecated (2021)** - Google removed the Posts API. Current implementation is a placeholder. Options:
   - Use Business Profile Performance API (different structure)
   - Post manually through GMB dashboard
   - Wait for Google to provide new API (lol)

2. **Quota Limits** - GMB API has strict quotas. Be conservative with requests.

3. **Verification Required** - Locations must be verified to post.

### Instagram Shopping
1. **Manual Review** - Instagram manually reviews shopping eligibility (can take weeks)

2. **Product Requirements:**
   - Clear product images
   - Accurate descriptions
   - Valid prices
   - Proper categorization
   - Compliance with Commerce Policies

3. **Image Requirements:**
   - Can only tag products in photos (not videos, not carousels)
   - Max 5 products per image
   - Products must be from connected catalog

### Facebook Shop
1. **Checkout Requirements:**
   - Must comply with commerce policies
   - Business verification required
   - Payout setup needed

2. **Marketplace Eligibility:**
   - Available in limited countries
   - Category restrictions

## Testing

### Manual Testing Checklist

**GMB:**
- [ ] OAuth flow connects successfully
- [ ] Locations are fetched
- [ ] Schedule creates posts
- [ ] Posts are published on time
- [ ] Failed posts retry correctly

**Instagram Shopping:**
- [ ] Catalog is created
- [ ] Products upload successfully
- [ ] Product tags appear on posts
- [ ] Shopping eligibility check works

**Facebook Shop:**
- [ ] Shop is created on Page
- [ ] Shoppable posts publish correctly
- [ ] Product tags are visible
- [ ] Storefront URL is accessible

### Automated Tests (TODO)

Test files to create:
- `GMBService.test.ts` - OAuth, API calls, error handling
- `GMBScheduler.test.ts` - Scheduling logic, queue processing
- `InstagramShoppingService.test.ts` - Catalog CRUD, product sync
- `FacebookShopService.test.ts` - Shop creation, posts

## Future Enhancements

### Phase 2: Advanced Features
- [ ] **GMB Insights** - Track post views, clicks, calls, directions
- [ ] **A/B Testing** - Test post variations
- [ ] **Smart Scheduling** - ML-powered optimal posting times
- [ ] **Multi-location** - Bulk posting to multiple GMB locations
- [ ] **GMB Q&A** - Auto-respond to GMB questions

### Phase 3: Analytics Dashboard
- [ ] **Unified Dashboard** - GMB + IG + FB performance in one view
- [ ] **Product Performance** - Best-selling products, ROI tracking
- [ ] **Revenue Attribution** - Track sales from social commerce
- [ ] **Heatmaps** - Product tag click patterns

### Phase 4: Automation
- [ ] **Auto-tagging** - AI suggests products to tag in posts
- [ ] **Dynamic Pricing** - Update catalog prices based on inventory
- [ ] **Abandoned Cart** - Retarget users who viewed products
- [ ] **Cross-platform Sync** - Update product availability across all platforms

## Troubleshooting

### GMB Connection Fails
- Check OAuth credentials in Google Cloud Console
- Verify redirect URI matches exactly
- Ensure APIs are enabled
- Check token expiry and refresh

### Instagram Shopping Not Approved
- Review [Commerce Policies](https://www.facebook.com/policies/commerce)
- Ensure product images are high quality
- Verify business information is complete
- Check for policy violations

### Products Not Syncing
- Verify catalog_id is correct
- Check access_token has proper permissions
- Ensure products have all required fields
- Review sync error messages in `catalog_product_sync` table

### Posts Not Publishing
- Check `gmb_scheduled_posts` table for error messages
- Verify location is verified in GMB
- Check retry count (max 3)
- Review GMB API quotas

## Support & Resources

- [Google My Business API Docs](https://developers.google.com/my-business)
- [Instagram Shopping Setup](https://www.facebook.com/business/help/1627278110823990)
- [Facebook Commerce Platform](https://developers.facebook.com/docs/commerce-platform)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)

---

**Built by:** Roy (The Burnt-Out Sysadmin)
**Estimated Time:** 13 hours (optimistic)
**Actual Time:** Probably more once you hit all the OAuth edge cases
**Success Metric:** GMB 2x/week posts + shoppable IG/FB posts = 5x local visibility + revenue
