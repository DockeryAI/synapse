# Worktree Task: Global Location Detection Engine

**Feature ID:** `global-location-detection`
**Branch:** `feature/location-detection`
**Estimated Time:** 8 hours (1 day)
**Priority:** CRITICAL
**Dependencies:** Foundation (URL Parser, database)
**Worktree Path:** `../synapse-location`

---

## Context

Build a location detection engine that supports 50+ countries using 5 parallel strategies. This scans websites to extract physical business locations from contact pages, footers, metadata, etc.

**From features.json:**
- 5-parallel-strategy location detection
- Supports UK, US, Canada, Australia, European locations
- Contact page scraping, footer extraction, about page analysis, metadata inspection, IP geolocation
- Uses Google Maps API for geocoding

**Why This Matters:**
- Critical for local content generation
- Feeds into campaign optimization
- Required for specialty detection (local vs national business)

---

## Prerequisites

- Foundation worktree MUST be merged first (URL parser + database)
- Read `.buildrunner/features.json` - Focus on `global-location-detection`
- Google Maps API key (for geocoding)
- Node.js 18+, npm installed

---

## Setup Instructions

### 1. Create Worktree
```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-location feature/location-detection
cd ../synapse-location
git pull origin main  # Get foundation changes
```

### 2. Install Dependencies
```bash
npm install

# Location detection specific
npm install @googlemaps/google-maps-services-js
npm install node-geocoder
npm install cheerio  # HTML parsing for scraping
npm install axios    # HTTP requests
```

### 3. Environment Variables
Add to `.env`:
```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

---

## Task Checklist

### File: `src/services/location-detection.service.ts`

**Architecture:**
- 5 parallel strategies run simultaneously (Promise.all)
- First successful result wins (or combine results)
- Fallback chain: Contact page → Footer → About → Metadata → IP
- Google Maps API for geocoding address strings

**Implementation:**

- [ ] Create `src/services/location-detection.service.ts`

#### Main Function
- [ ] `detectLocation(websiteUrl: string): Promise<BusinessLocation>`
  - Takes normalized URL from URLParser
  - Runs all 5 strategies in parallel
  - Returns most confident result
  - Type: `BusinessLocation` (defined below)

#### Strategy 1: Contact Page Scraping
- [ ] `scrapeContactPage(url: string): Promise<AddressCandidate | null>`
  - Try common paths: `/contact`, `/contact-us`, `/locations`, `/find-us`
  - Parse HTML with Cheerio
  - Look for address patterns:
    - Street numbers + street names
    - City, State/Province, Postal code
    - Country names
  - Extract phone numbers (can indicate location)
  - Return structured address candidate

#### Strategy 2: Footer Address Extraction
- [ ] `extractFooterAddress(url: string): Promise<AddressCandidate | null>`
  - Fetch homepage HTML
  - Find `<footer>` tag or elements with class/id containing "footer"
  - Parse for address patterns (same as contact page)
  - Handle schema.org markup (PostalAddress)
  - Return address candidate

#### Strategy 3: About Page Analysis
- [ ] `analyzeAboutPage(url: string): Promise<AddressCandidate | null>`
  - Try paths: `/about`, `/about-us`, `/our-story`, `/company`
  - Look for location mentions in text
  - Extract city/region mentions
  - Weight by frequency (mentioned 5 times = high confidence)
  - Return location mentions

#### Strategy 4: Metadata Inspection
- [ ] `inspectMetadata(url: string): Promise<AddressCandidate | null>`
  - Check OpenGraph tags: `og:locality`, `og:region`, `og:country`
  - Check schema.org JSON-LD for Organization → address
  - Check meta tags for geo coordinates
  - Return structured data

#### Strategy 5: IP-Based Geolocation
- [ ] `geolocateByIP(url: string): Promise<AddressCandidate | null>`
  - Resolve domain to IP address
  - Use IP geolocation service (fallback strategy)
  - Return country/region (low confidence)
  - Note: This is the weakest signal

#### Helper Functions
- [ ] `parseAddressString(text: string): ParsedAddress | null`
  - Extract structured address from free text
  - Handle formats:
    - US: "123 Main St, Austin, TX 78701"
    - UK: "10 Downing Street, London SW1A 2AA"
    - AU: "123 Queen St, Melbourne VIC 3000"
    - CA: "123 King St, Toronto ON M5H 1A1"
  - Use regex patterns for each country

- [ ] `geocodeAddress(address: string): Promise<GeocodedLocation>`
  - Use Google Maps Geocoding API
  - Returns lat/lng, formatted address, confidence score
  - Handle API errors gracefully

- [ ] `combineResults(candidates: AddressCandidate[]): BusinessLocation`
  - Weight by confidence (contact page > footer > about > metadata > IP)
  - Prefer results from multiple sources (validation)
  - Return single best location

#### Country Support
**Must handle address formats for:**
- United States (street, city, state, zip)
- United Kingdom (street, city, postcode)
- Canada (street, city, province, postal code)
- Australia (street, suburb, state, postcode)
- Germany, France, Spain, Italy (European formats)
- Total: 50+ countries (use library patterns)

---

## Type Definitions

Add to `src/types/index.ts` or create `src/types/location.types.ts`:

```typescript
export interface BusinessLocation {
  address: {
    street?: string
    city: string
    state?: string
    province?: string
    postalCode?: string
    country: string
  }
  coordinates?: {
    lat: number
    lng: number
  }
  confidence: number // 0-1
  source: 'contact_page' | 'footer' | 'about' | 'metadata' | 'ip'
  detectedAt: Date
}

export interface AddressCandidate {
  rawText: string
  parsed?: ParsedAddress
  confidence: number
  source: string
}

export interface ParsedAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface GeocodedLocation {
  formattedAddress: string
  coordinates: { lat: number; lng: number }
  components: {
    street?: string
    city?: string
    state?: string
    country?: string
  }
  confidence: number
}
```

---

## Integration Points

**Imports Needed:**
```typescript
import { URLParser } from './url-parser.service'
import { supabase } from '@/lib/supabase'
```

**Exports:**
```typescript
export const LocationDetector = {
  detectLocation,
  scrapeContactPage,
  extractFooterAddress,
  // ... other public functions
}
```

**Used By:**
- Intelligence Gatherer (needs location for local search)
- Specialty Detection (local vs national business)
- Campaign Generator (location-specific content)

---

## Testing Requirements

### Test Cases

```typescript
// src/services/__tests__/location-detection.test.ts

describe('LocationDetector', () => {
  it('detects US addresses', async () => {
    const location = await LocationDetector.detectLocation('https://example.com')
    expect(location.address.country).toBe('United States')
    expect(location.address.city).toBeDefined()
  })

  it('handles UK postcodes', () => {
    const parsed = parseAddressString('10 Downing Street, London SW1A 2AA, UK')
    expect(parsed.postalCode).toBe('SW1A 2AA')
  })

  it('falls back to IP geolocation', async () => {
    // Mock failed scraping attempts
    const location = await LocationDetector.detectLocation('https://minimal-site.com')
    expect(location.source).toBe('ip')
    expect(location.confidence).toBeLessThan(0.5)
  })

  it('prefers contact page over footer', async () => {
    // Mock both returning results
    const location = await LocationDetector.detectLocation('https://example.com')
    expect(location.source).toBe('contact_page')
  })
})
```

### Manual Testing
Test with real websites:
- https://www.joespizza.com (US - should find NYC location)
- https://www.harveynichols.com (UK - should find London)
- https://www.melbournecoffee.com.au (AU - should find Melbourne)

---

## Edge Cases to Handle

1. **Multiple Locations:**
   - Business has 5 offices → Return primary/headquarters
   - Or return all locations (array) - check features.json

2. **No Location Found:**
   - Return null or throw error?
   - Decide on failure behavior

3. **International Businesses:**
   - Headquarters in UK, site hosted in US
   - Prefer contact page info over IP

4. **Schema.org Conflicts:**
   - Different addresses in JSON-LD vs visible text
   - Prefer visible text (more likely current)

5. **Rate Limiting:**
   - Google Maps API has limits
   - Cache results by domain
   - Implement retry with backoff

---

## Performance Optimization

- [ ] Cache location results in database
  - Table: `business_locations` (url, location_data, cached_at)
  - TTL: 30 days (locations don't change often)
  - Check cache before scraping

- [ ] Parallel execution with timeout
  ```typescript
  const results = await Promise.race([
    Promise.all([strategy1(), strategy2(), ...]),
    timeout(10000) // 10 second max
  ])
  ```

- [ ] Graceful degradation
  - If all strategies fail, return null instead of crashing
  - Log failures for debugging

---

## Completion Criteria

**Ready to merge when:**
- [ ] All 5 strategies implemented
- [ ] Handles 50+ countries (use library for patterns)
- [ ] Google Maps geocoding integration working
- [ ] Location caching implemented
- [ ] Parallel execution with proper error handling
- [ ] Type definitions exported
- [ ] No TypeScript errors: `npm run build`
- [ ] Tested with 3+ real websites from different countries
- [ ] Location confidence scoring works
- [ ] Committed with good commit message

---

## Commit & Merge

```bash
git add .
git commit -m "feat: Add global location detection with 5 parallel strategies

- Contact page, footer, about page, metadata, IP geolocation
- Supports 50+ countries (US, UK, CA, AU, EU formats)
- Google Maps geocoding integration
- Location caching with 30-day TTL
- Parallel execution with confidence scoring

Implements global-location-detection feature"

git push origin feature/location-detection

# Back to main repo
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/location-detection
git push origin main
git worktree remove ../synapse-location
```

---

## Reference Files

- `.buildrunner/features.json` → `global-location-detection`
- `src/services/url-parser.service.ts` → Use for URL normalization
- Google Maps API Docs: https://developers.google.com/maps/documentation/geocoding

---

*Don't half-ass the international support. If it can't handle a UK postcode, it's broken.*
