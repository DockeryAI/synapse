# Worktree Task: Product Scanner + Enhanced UVP Wizard (Sequential)

**Feature IDs:** `product-service-intelligence`, `enhanced-uvp-wizard`
**Branch:** `feature/product-scanner-uvp`
**Estimated Time:** 20 hours (8h + 12h)
**Priority:** CRITICAL
**Dependencies:** Foundation, Intelligence Gatherer (optional)
**Worktree Path:** `../synapse-product-uvp`

**NOTE:** These are built sequentially in SAME worktree because UVP Wizard depends on Product Scanner

---

## Context

**Part 1: Product/Service Scanner** - Automatically scans websites to extract products, services, pricing, and offers during UVP wizard.

**Part 2: Enhanced UVP Wizard** - Interactive UVP builder with product detection integration, evidence citations, and content generation gating.

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-product-uvp feature/product-scanner-uvp
cd ../synapse-product-uvp
npm install

# Additional dependencies
npm install cheerio axios
```

---

## PART 1: Product/Service Scanner (8 hours)

### File: `src/services/product-scanner.service.ts`

- [ ] `scanProducts(websiteUrl: string): Promise<DetectedProduct[]>`
  - Use Apify to crawl product/service pages
  - Extract product names, SKUs, pricing
  - Return structured product list

- [ ] `scanServices(websiteUrl: string): Promise<DetectedService[]>`
  - Crawl /services, /what-we-do, /pricing pages
  - Extract service names, tiers, descriptions
  - Detect pricing (hourly, package, subscription)

- [ ] `detectPromotionalOffers(websiteUrl: string): Promise<PromotionalOffer[]>`
  - Look for: "20% off", "limited time", "sale", "special offer"
  - Extract discount amounts, dates, conditions
  - Return active/upcoming offers

### File: `src/services/service-mapper.service.ts`

- [ ] `mapProductsToPillars(products: DetectedProduct[]): ContentPillar[]`
  - Each product → potential content topic
  - Generate promotional hooks
  - Map to content calendar

### File: `src/services/promotional-detector.service.ts`

- [ ] `detectSeasonalProducts(products: DetectedProduct[]): SeasonalProduct[]`
  - Identify: "Christmas", "Summer", "Back to School"
  - Flag for seasonal campaigns

**Types:**
```typescript
export interface DetectedProduct {
  name: string
  description?: string
  sku?: string
  price?: number
  currency?: string
  category?: string
  imageUrl?: string
  productUrl: string
  confidence: number
  source: 'auto-detected'
}

export interface DetectedService {
  name: string
  tier?: string
  description: string
  pricing?: {
    amount?: number
    type: 'hourly' | 'package' | 'subscription' | 'quote'
  }
  duration?: string
  confidence: number
}

export interface PromotionalOffer {
  title: string
  discount?: number
  discountType: 'percentage' | 'fixed' | 'other'
  startDate?: Date
  endDate?: Date
  conditions?: string
  active: boolean
}
```

**Database Integration:**
```typescript
await supabase.from('detected_products').insert(products)
await supabase.from('detected_services').insert(services)
await supabase.from('promotional_offers').insert(offers)
```

---

## PART 2: Enhanced UVP Wizard (12 hours)

### Files to Create:

#### `src/components/uvp-wizard/EnhancedUVPWizard.tsx`
- [ ] Main wizard orchestrator
- [ ] Step progression (Who, What, How, Why)
- [ ] Product detection runs in background on start
- [ ] Progress tracking
- [ ] Save/exit functionality
- [ ] Gates content generation (can't proceed until complete)

#### `src/components/uvp-wizard/screens/SimpleWizardStepScreen.tsx`
- [ ] Reusable step component
- [ ] Input fields with AI suggestions
- [ ] Evidence tags on suggestions
- [ ] Next/Back navigation

#### `src/components/uvp-wizard/EvidenceTag.tsx`
- [ ] Small badge showing evidence source
- [ ] "Found on About page" | "Mentioned 47x on site" | "From Google reviews"
- [ ] Tooltip with details

#### `src/components/uvp-wizard/ProductServiceDetection.tsx`
- [ ] Shows detected products/services
- [ ] User can confirm/edit/remove
- [ ] Loading state while scanning
- [ ] "Add manually" button

### Wizard Steps:

**Step 1: Who You Serve**
- AI suggests target audiences from intelligence
- Evidence: "Found in 'About Us' page"
- User selects/edits

**Step 2: What You Offer**
- Show detected products/services
- User confirms and adds missing items
- Auto-saved to database

**Step 3: How You're Different**
- AI suggests differentiators from reviews/specialty
- Evidence citations for each
- User selects top 3

**Step 4: Why They Should Choose You**
- Combine previous steps into UVP statement
- AI generates variations
- User edits/approves

**Final: Save & Continue**
- Save complete UVP to `business_profiles.uvp_data`
- Save products to `products` table
- Save services to `services` table
- Unlock content generation features

### Background Product Detection:

```typescript
useEffect(() => {
  async function detectOnMount() {
    setDetecting(true)
    const products = await ProductScanner.scanProducts(websiteUrl)
    const services = await ProductScanner.scanServices(websiteUrl)
    setDetectedProducts(products)
    setDetectedServices(services)
    setDetecting(false)
  }

  detectOnMount()
}, [websiteUrl])
```

### Evidence System:

```typescript
interface UVPSuggestion {
  text: string
  evidence: Evidence[]
  confidence: number
}

interface Evidence {
  source: string // "About page" | "Google reviews" | "Website content"
  quote?: string // "We've been serving Austin since 1995"
  url?: string
  frequency?: number // Mentioned N times
}
```

---

## Database Schema (from Foundation)

**Tables used:**
- `business_profiles.uvp_data` (JSON)
- `products` (id, business_profile_id, name, sku, price, ...)
- `services` (id, business_profile_id, name, tier, ...)
- `uvp_suggestions` (id, suggestion_text, evidence JSON, ...)
- `evidence_citations` (id, source, quote, ...)

---

## Integration Points

**On Wizard Completion:**
1. Save UVP to business_profiles
2. Migrate detected_products → products table
3. Migrate detected_services → services table
4. Set `uvp_completed_at` timestamp
5. Enable access to content generation features

**Content Generation Gating:**
```typescript
// In content generation page
if (!businessProfile.uvp_completed_at) {
  return <Redirect to="/uvp-wizard" />
}
```

---

## Testing

```typescript
it('detects products from website', async () => {
  const products = await scanProducts('https://bakery.com')
  expect(products.length).toBeGreaterThan(0)
  expect(products[0]).toHaveProperty('name')
  expect(products[0]).toHaveProperty('price')
})

it('completes UVP wizard with detected products', async () => {
  render(<EnhancedUVPWizard websiteUrl="https://example.com" />)

  // Wait for product detection
  await waitFor(() => {
    expect(screen.getByText(/3 products detected/)).toBeInTheDocument()
  })

  // Complete wizard steps
  fireEvent.click(screen.getByText('Next'))
  // ... complete all steps

  // Verify save
  const saved = await supabase.from('products').select('*')
  expect(saved.data.length).toBe(3)
})
```

---

## Completion Criteria

**Product Scanner:**
- [ ] Product detection working
- [ ] Service detection working
- [ ] Promotional offer detection working
- [ ] Database integration complete

**UVP Wizard:**
- [ ] All 4 steps functional
- [ ] Product detection integrates
- [ ] Evidence citations display
- [ ] UVP saves to database
- [ ] Content generation gating works
- [ ] UI polished and intuitive

**Both:**
- [ ] No TS errors
- [ ] Tested end-to-end
- [ ] Types exported

---

## Commit

```bash
git commit -m "feat: Add product scanner and enhanced UVP wizard

Product Scanner:
- Automatic product/service detection via Apify
- Pricing and SKU extraction
- Promotional offer detection
- Content pillar mapping

UVP Wizard:
- 4-step interactive wizard
- Product detection integration
- Evidence-based AI suggestions
- Content generation gating
- Complete business profile persistence

Implements product-service-intelligence and enhanced-uvp-wizard features"
```

---

*This is a BIG one. 20 hours. Take breaks. Don't try to finish it in one sitting or you'll burn out.*
