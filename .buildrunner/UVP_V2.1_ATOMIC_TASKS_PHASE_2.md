# UVP V2.1 - ATOMIC TASKS - PHASE 2
## Smart Product Detection

**Execution Order:** Sequential
**Estimated Time:** 4 hours
**Prerequisites:** Phase 1 complete (navigation scraping fixed)
**Goal:** Navigation-first product detection with OpenDialog.ai validation

---

## PHASE 2A: NAVIGATION PRODUCT DETECTOR SERVICE (2 hours)

### Task 2A-1: Create Navigation Product Detector Service
**File:** `src/services/intelligence/navigation-product-detector.service.ts` (NEW)
**Action:** Create service to identify products from navigation structure
**Dependencies:** Phase 1 complete

**Code to Write:**
```typescript
/**
 * Navigation Product Detector Service
 *
 * Identifies products and services by analyzing website navigation structure
 * Priority: Navigation structure > Page content (more reliable for SaaS/Tech)
 *
 * Example: OpenDialog.ai has "Selma", "Jamie", "Rhea" as nav items
 * These are product names, not just random links
 */

import type { NavigationItem } from '@/services/scraping/websiteScraper';

interface ProductNavSection {
  sectionName: string;
  items: NavigationItem[];
  confidence: number;
}

interface NamedProduct {
  name: string;
  href: string;
  confidence: number;
  source: 'navigation' | 'pricing' | 'comparison';
}

/**
 * Keywords that indicate product/service sections
 */
const PRODUCT_SECTION_KEYWORDS = [
  'product',
  'products',
  'solution',
  'solutions',
  'platform',
  'platforms',
  'service',
  'services',
  'offering',
  'offerings',
  'plan',
  'plans',
  'pricing',
  'features'
];

/**
 * Pricing tier keywords (not actual product names)
 */
const PRICING_TIER_KEYWORDS = [
  'free',
  'trial',
  'basic',
  'starter',
  'standard',
  'professional',
  'pro',
  'premium',
  'business',
  'enterprise',
  'ultimate',
  'custom'
];

/**
 * Generic nav items that are NOT products
 */
const GENERIC_NAV_KEYWORDS = [
  'home',
  'about',
  'contact',
  'blog',
  'resources',
  'support',
  'help',
  'faq',
  'login',
  'signup',
  'sign up',
  'sign in',
  'get started',
  'learn more',
  'careers',
  'company',
  'team',
  'privacy',
  'terms',
  'legal'
];

class NavigationProductDetectorService {
  /**
   * Identify navigation items that likely represent product sections
   */
  identifyProductNavSection(navigation: NavigationItem[]): ProductNavSection | null {
    // Look for nav items with product-related keywords
    const productNavItems = navigation.filter(item =>
      this.isProductSectionKeyword(item.text.toLowerCase())
    );

    if (productNavItems.length === 0) {
      return null;
    }

    // For each product nav item, find child items (via href patterns)
    // Example: /products → [/products/selma, /products/jamie]
    const productSections = productNavItems.map(parentItem => {
      const parentHref = parentItem.href.toLowerCase();
      const childItems = navigation.filter(item =>
        item.href.toLowerCase().startsWith(parentHref) &&
        item.href !== parentItem.href
      );

      return {
        sectionName: parentItem.text,
        items: childItems,
        confidence: childItems.length > 0 ? 0.9 : 0.6
      };
    });

    // Return section with most child items
    return productSections.sort((a, b) => b.items.length - a.items.length)[0] || null;
  }

  /**
   * Extract named products from navigation items
   * Looks for proper nouns and product-like names
   */
  extractNamedProducts(navItems: NavigationItem[]): NamedProduct[] {
    const products: NamedProduct[] = [];

    // First, try to find product section
    const productSection = this.identifyProductNavSection(navItems);

    if (productSection && productSection.items.length > 0) {
      // Products found under product section → high confidence
      productSection.items.forEach(item => {
        if (this.isLikelyProductName(item.text)) {
          products.push({
            name: item.text,
            href: item.href,
            confidence: 0.9,
            source: 'navigation'
          });
        }
      });
    }

    // Also scan all nav items for proper noun patterns
    navItems.forEach(item => {
      if (
        this.isProperNoun(item.text) &&
        !this.isGenericNavItem(item.text) &&
        !products.find(p => p.name === item.text)
      ) {
        products.push({
          name: item.text,
          href: item.href,
          confidence: 0.7,
          source: 'navigation'
        });
      }
    });

    return products;
  }

  /**
   * Detect URLs that might contain product details
   */
  detectProductPageUrls(navItems: NavigationItem[]): string[] {
    const urls: string[] = [];

    // URLs from product section
    const productSection = this.identifyProductNavSection(navItems);
    if (productSection) {
      productSection.items.forEach(item => urls.push(item.href));
    }

    // URLs with product-related paths
    navItems.forEach(item => {
      if (this.hasProductPath(item.href)) {
        urls.push(item.href);
      }
    });

    // Remove duplicates
    return [...new Set(urls)];
  }

  /**
   * Check if nav item is product-related
   */
  isProductNavItem(item: NavigationItem): boolean {
    const lowerText = item.text.toLowerCase();
    const lowerHref = item.href.toLowerCase();

    return (
      this.isProductSectionKeyword(lowerText) ||
      this.hasProductPath(lowerHref) ||
      this.isProperNoun(item.text)
    );
  }

  /**
   * Check if text contains product section keywords
   */
  private isProductSectionKeyword(text: string): boolean {
    return PRODUCT_SECTION_KEYWORDS.some(keyword => text.includes(keyword));
  }

  /**
   * Check if text is a proper noun (capitalized, not all caps)
   */
  private isProperNoun(text: string): boolean {
    if (!text || text.length < 2) return false;

    // Must start with capital letter
    if (text[0] !== text[0].toUpperCase()) return false;

    // Not all caps (that's usually acronyms or CTA)
    if (text === text.toUpperCase()) return false;

    // Not all lowercase
    if (text === text.toLowerCase()) return false;

    // Should be a single word or 2-3 word phrase
    const wordCount = text.split(' ').length;
    if (wordCount > 3) return false;

    return true;
  }

  /**
   * Check if text is likely a product name vs generic nav
   */
  private isLikelyProductName(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Filter out generic items
    if (this.isGenericNavItem(text)) return false;

    // Filter out pricing tiers
    if (PRICING_TIER_KEYWORDS.some(keyword => lowerText === keyword)) return false;

    // Proper nouns are good candidates
    if (this.isProperNoun(text)) return true;

    // Short, specific names (2-15 chars)
    if (text.length >= 2 && text.length <= 15) return true;

    return false;
  }

  /**
   * Check if text is generic nav item (not a product)
   */
  private isGenericNavItem(text: string): boolean {
    const lowerText = text.toLowerCase();
    return GENERIC_NAV_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Check if URL path contains product indicators
   */
  private hasProductPath(href: string): boolean {
    const lowerHref = href.toLowerCase();

    return (
      lowerHref.includes('/product') ||
      lowerHref.includes('/solution') ||
      lowerHref.includes('/platform') ||
      lowerHref.includes('/service') ||
      lowerHref.includes('/pricing') ||
      lowerHref.includes('/plan')
    );
  }
}

// Export singleton instance
export const navigationProductDetector = new NavigationProductDetectorService();
export default navigationProductDetector;
```

**Success Criteria:**
- [ ] File created with all functions
- [ ] Types properly defined
- [ ] Singleton exported
- [ ] No TypeScript errors

---

### Task 2A-2: Test Navigation Product Detector
**File:** `src/services/intelligence/__tests__/navigation-product-detector.test.ts` (NEW)
**Action:** Create unit tests for detector logic
**Dependencies:** Task 2A-1

**Code to Write:**
```typescript
import { navigationProductDetector } from '../navigation-product-detector.service';
import type { NavigationItem } from '@/services/scraping/websiteScraper';

describe('NavigationProductDetector', () => {
  describe('identifyProductNavSection', () => {
    it('should find product section', () => {
      const nav: NavigationItem[] = [
        { text: 'Home', href: '/' },
        { text: 'Products', href: '/products' },
        { text: 'Selma', href: '/products/selma' },
        { text: 'Jamie', href: '/products/jamie' }
      ];

      const section = navigationProductDetector.identifyProductNavSection(nav);

      expect(section).not.toBeNull();
      expect(section?.sectionName).toBe('Products');
      expect(section?.items.length).toBe(2);
    });

    it('should return null if no product section', () => {
      const nav: NavigationItem[] = [
        { text: 'Home', href: '/' },
        { text: 'About', href: '/about' }
      ];

      const section = navigationProductDetector.identifyProductNavSection(nav);
      expect(section).toBeNull();
    });
  });

  describe('extractNamedProducts', () => {
    it('should extract OpenDialog products', () => {
      const nav: NavigationItem[] = [
        { text: 'Products', href: '/products' },
        { text: 'Selma', href: '/selma' },
        { text: 'Jamie', href: '/jamie' },
        { text: 'Rhea', href: '/rhea' },
        { text: 'OpenDialog Platform', href: '/platform' }
      ];

      const products = navigationProductDetector.extractNamedProducts(nav);

      expect(products.length).toBeGreaterThanOrEqual(4);
      expect(products.map(p => p.name)).toContain('Selma');
      expect(products.map(p => p.name)).toContain('Jamie');
      expect(products.map(p => p.name)).toContain('Rhea');
    });

    it('should not extract generic nav items', () => {
      const nav: NavigationItem[] = [
        { text: 'Home', href: '/' },
        { text: 'About', href: '/about' },
        { text: 'Contact', href: '/contact' }
      ];

      const products = navigationProductDetector.extractNamedProducts(nav);

      expect(products.length).toBe(0);
    });

    it('should not extract pricing tiers as products', () => {
      const nav: NavigationItem[] = [
        { text: 'Pricing', href: '/pricing' },
        { text: 'Basic', href: '/pricing/basic' },
        { text: 'Pro', href: '/pricing/pro' },
        { text: 'Enterprise', href: '/pricing/enterprise' }
      ];

      const products = navigationProductDetector.extractNamedProducts(nav);

      // Should extract "Pricing" section but not tier names
      expect(products.every(p => !['Basic', 'Pro', 'Enterprise'].includes(p.name))).toBe(true);
    });
  });

  describe('isProductNavItem', () => {
    it('should identify product nav items', () => {
      expect(navigationProductDetector.isProductNavItem({
        text: 'Products',
        href: '/products'
      })).toBe(true);

      expect(navigationProductDetector.isProductNavItem({
        text: 'Selma',
        href: '/selma'
      })).toBe(true);
    });

    it('should reject generic nav items', () => {
      expect(navigationProductDetector.isProductNavItem({
        text: 'About',
        href: '/about'
      })).toBe(false);

      expect(navigationProductDetector.isProductNavItem({
        text: 'Contact',
        href: '/contact'
      })).toBe(false);
    });
  });
});
```

**Success Criteria:**
- [ ] All tests written
- [ ] Tests run with `npm test`
- [ ] All tests pass
- [ ] Coverage for edge cases

---

## PHASE 2B: ENHANCED PRODUCT EXTRACTION PROMPT (1 hour)

### Task 2B-1: Update Product Extractor Prompt
**File:** `src/services/uvp-extractors/product-service-extractor.service.ts`
**Action:** Add navigation-first extraction logic to prompt
**Dependencies:** Task 2A-2

**Locate Lines 250-319** (buildExtractionPrompt function)

**Add new section BEFORE "EXTRACTION INSTRUCTIONS":**

```typescript
function buildExtractionPrompt(businessName: string, content: string): string {
  return `You are analyzing the website content for "${businessName}" to extract ALL their products and services.

**YOUR GOAL: Find EVERY product and service mentioned on this website.**

**CRITICAL: NAVIGATION-FIRST EXTRACTION**

The NAVIGATION MENU is your PRIMARY source for product discovery.
Products listed in navigation are MORE RELIABLE than products mentioned in content.

**PRIORITY ORDER:**
1. NAVIGATION ITEMS (under "Products", "Solutions", "Platform" sections) → 100% confidence
2. PRICING TABLES (explicitly listed with pricing) → 90% confidence
3. FEATURE COMPARISON TABLES → 85% confidence
4. PAGE CONTENT (mentioned in descriptions) → 70% confidence

**PATTERNS TO RECOGNIZE:**

**SaaS/Tech Products (HIGH PRIORITY):**
- Proper noun names in navigation (e.g., "Selma", "Jamie", "Rhea")
- Platform names (e.g., "OpenDialog Platform", "Stripe Atlas")
- Named features/modules (e.g., "Radar", "Terminal", "Connect")
- Format: "[Name] - [Description]" or "[Name]: [Feature]"

**Services/Offerings:**
- Items under "Services" nav section
- Tiered offerings (e.g., "Consultation", "Implementation", "Support")
- Professional services (e.g., "Training", "Onboarding")

**Product Categories (NOT individual products):**
- "Insurance Solutions" → CATEGORY, not a product
- "Financial Services" → CATEGORY, not a product
- Look for SPECIFIC products within categories

**WHAT TO IGNORE:**
- Pricing tiers without product names (e.g., "Basic", "Pro", "Enterprise" alone)
- Generic features (e.g., "Security", "Analytics" without context)
- Testimonial names (people, not products)
- Company taglines or mission statements

**EXTRACTION INSTRUCTIONS:**
[... rest of existing prompt ...]`;
}
```

**Success Criteria:**
- [ ] Prompt updated with navigation-first logic
- [ ] SaaS pattern recognition added
- [ ] Category vs product distinction clarified
- [ ] No syntax errors

---

### Task 2B-2: Inject Navigation Products into Prompt
**File:** `src/services/uvp-extractors/product-service-extractor.service.ts`
**Action:** Pre-extract products from nav and inject into AI prompt
**Dependencies:** Task 2B-1

**Locate Lines 53-105** (extractProductsServices function body)

**Add BEFORE Claude API call:**

```typescript
// Import at top of file
import { navigationProductDetector } from '@/services/intelligence/navigation-product-detector.service';

// Inside extractProductsServices function, after content preparation:
export async function extractProductsServices(...) {
  // ... existing code ...

  // NEW: Pre-extract products from navigation
  let navProductsContext = '';
  if (isWebsiteData) {
    const data = websiteDataOrContent as WebsiteData;
    const navProducts = navigationProductDetector.extractNamedProducts(data.structure.navigation);

    if (navProducts.length > 0) {
      console.log('[ProductServiceExtractor] Found products in navigation:', navProducts.map(p => p.name));

      navProductsContext = `\n\n**CONFIRMED PRODUCTS FROM NAVIGATION (100% confidence):**\n${
        navProducts.map(p => `- ${p.name} (${p.href})`).join('\n')
      }\n\nThese are DEFINITE products. Include ALL of them in your extraction.\n`;
    }
  }

  // Build prompt with navigation context
  const prompt = buildExtractionPrompt(businessName, truncatedContent) + navProductsContext;

  // ... continue with API call ...
}
```

**Success Criteria:**
- [ ] Navigation products extracted before AI call
- [ ] Products injected into prompt
- [ ] High confidence assigned to nav products
- [ ] No TypeScript errors

---

## PHASE 2C: TWO-PASS DETECTION LOGIC (1 hour)

### Task 2C-1: Implement Merge Logic for Nav + AI Products
**File:** `src/services/uvp-extractors/product-service-extractor.service.ts`
**Action:** Merge navigation products with AI-extracted products
**Dependencies:** Task 2B-2

**Locate parseClaudeResponse function** (lines 324-361)

**After parsing AI response, add merge logic:**

```typescript
function parseClaudeResponse(
  responseText: string,
  websiteUrls: string[],
  navProducts?: NamedProduct[]  // NEW parameter
): {
  products: ProductService[];
  categories: string[];
} {
  // ... existing parsing code ...

  // Transform AI products
  const aiProducts: ProductService[] = (parsedData.products || []).map((item: any, index: number) => ({
    id: `product-${Date.now()}-${index}`,
    name: item.name || 'Unknown',
    description: item.description || '',
    category: item.category || 'Uncategorized',
    confidence: item.confidence || 50,
    source: 'website' as const,
    sourceUrl: item.sourceUrl || websiteUrls[0],
    sourceExcerpt: item.sourceExcerpt || '',
    confirmed: false,
  }));

  // NEW: Merge with navigation products
  if (navProducts && navProducts.length > 0) {
    navProducts.forEach(navProduct => {
      // Check if AI already found this product
      const existingProduct = aiProducts.find(p =>
        p.name.toLowerCase() === navProduct.name.toLowerCase()
      );

      if (existingProduct) {
        // Boost confidence if AI also found it
        existingProduct.confidence = Math.max(existingProduct.confidence, 95);
        existingProduct.sourceExcerpt = `Found in navigation: ${navProduct.href}\n\n${existingProduct.sourceExcerpt}`;
      } else {
        // Add navigation product that AI missed
        aiProducts.unshift({
          id: `nav-product-${Date.now()}-${navProduct.name}`,
          name: navProduct.name,
          description: `Product found in website navigation (${navProduct.href})`,
          category: 'Products',
          confidence: 100, // High confidence for nav products
          source: 'website' as const,
          sourceUrl: navProduct.href,
          sourceExcerpt: `Found in navigation menu`,
          confirmed: false,
        });
      }
    });
  }

  // Sort by confidence (highest first)
  aiProducts.sort((a, b) => b.confidence - a.confidence);

  return { products: aiProducts, categories: parsedData.categories || [] };
}
```

**Update extractProductsServices to pass navProducts:**

```typescript
// After getting navProducts
const navProducts = navigationProductDetector.extractNamedProducts(...);

// ...

// Pass to parser
const extractionData = parseClaudeResponse(responseText, finalUrls, navProducts);
```

**Success Criteria:**
- [ ] Nav products merged with AI products
- [ ] Confidence boosted for products found in both
- [ ] Nav-only products added with 100% confidence
- [ ] Products sorted by confidence

---

### Task 2C-2: Add Navigation Product Detection Logging
**File:** `src/services/uvp-extractors/product-service-extractor.service.ts`
**Action:** Enhanced logging for debugging
**Dependencies:** Task 2C-1

**Add console logs at key points:**

```typescript
// After nav product extraction
if (navProducts.length > 0) {
  console.log('[ProductExtractor] Navigation-first detection:');
  console.log('  Nav products found:', navProducts.map(p => p.name).join(', '));
  console.log('  Confidence: 100% (from navigation structure)');
}

// After AI extraction
console.log('[ProductExtractor] AI extraction complete:');
console.log('  Products from AI:', extractionData.products.length);
console.log('  Products from nav:', navProducts?.length || 0);

// After merge
console.log('[ProductExtractor] Merged results:');
console.log('  Total products:', validatedProducts.length);
console.log('  High-confidence (90%+):', validatedProducts.filter(p => p.confidence >= 90).length);
```

**Success Criteria:**
- [ ] Logs added at extraction points
- [ ] Easy to debug product detection
- [ ] No excessive logging

---

## PHASE 2 VALIDATION

### Validation 1: OpenDialog.ai Test
**Procedure:**
1. Start dev server: `npm run dev`
2. Navigate to onboarding flow
3. Enter URL: `https://opendialog.ai`
4. Wait for product extraction
5. Check console logs
6. Verify products detected

**Expected Products:**
- [ ] Selma (100% confidence, from nav)
- [ ] Jamie (100% confidence, from nav)
- [ ] Rhea (100% confidence, from nav)
- [ ] OpenDialog Platform (100% confidence, from nav)

**Expected Console Output:**
```
[ProductExtractor] Navigation-first detection:
  Nav products found: Selma, Jamie, Rhea, OpenDialog Platform
  Confidence: 100% (from navigation structure)
[ProductExtractor] AI extraction complete:
  Products from AI: 6
  Products from nav: 4
[ProductExtractor] Merged results:
  Total products: 4-6
  High-confidence (90%+): 4
```

**Success Criteria:**
- [ ] All 4 OpenDialog products detected
- [ ] All have 100% confidence
- [ ] No false positives (random words)
- [ ] Products appear in UI

---

### Validation 2: Generic SaaS Test
**Test URLs:**
- https://stripe.com
- https://segment.com
- https://amplitude.com

**Procedure:**
1. Test each URL
2. Verify products detected from navigation
3. Check that nav products prioritized over content

**Success Criteria:**
- [ ] Products detected for each site
- [ ] Nav products have higher confidence
- [ ] No generic features extracted as products

---

### Validation 3: E-commerce Test (Negative Case)
**Test URL:** Any e-commerce site with many products

**Procedure:**
1. Enter e-commerce URL
2. Verify service doesn't extract every product variant
3. Should extract categories or product lines

**Success Criteria:**
- [ ] Doesn't extract 100+ individual products
- [ ] Extracts meaningful categories
- [ ] Performance acceptable

---

### Validation 4: Unit Tests
**Command:** `npm test navigation-product-detector`

**Expected:**
- [ ] All tests pass
- [ ] OpenDialog test case passes
- [ ] Generic nav rejection works
- [ ] Pricing tier filtering works

---

## PHASE 2 COMPLETION CHECKLIST

- [ ] All 2A tasks complete (Navigation Product Detector)
- [ ] All 2B tasks complete (Enhanced Prompt)
- [ ] All 2C tasks complete (Two-Pass Logic)
- [ ] Validation 1 passed (OpenDialog test)
- [ ] Validation 2 passed (Generic SaaS test)
- [ ] Validation 3 passed (E-commerce test)
- [ ] Validation 4 passed (Unit tests)
- [ ] No TypeScript errors
- [ ] No console errors

---

## COMMIT

**Only commit if ALL checklist items checked:**

```bash
git add .
git commit -m "feat(uvp-v2): Phase 2 - Smart product detection with navigation-first strategy

NEW SERVICES:
- NavigationProductDetectorService: Analyzes nav structure for products
- Two-pass extraction: Nav products + AI content analysis

DETECTION IMPROVEMENTS:
- Navigation-first priority (100% confidence for nav products)
- Proper noun recognition for SaaS product names
- Product section identification (Products, Solutions, Platform)
- Pricing tier filtering (Basic/Pro/Enterprise not products)
- Category vs product distinction

OPENDIALOG.AI TEST:
✓ Detects Selma, Jamie, Rhea, OpenDialog Platform
✓ All 4 products at 100% confidence
✓ No false positives

ENHANCED PROMPT:
- Priority order: Nav > Pricing > Comparison > Content
- SaaS pattern recognition
- Category filtering

TESTING:
- Unit tests for nav product detector ✓
- OpenDialog.ai validation ✓
- Generic SaaS sites validated ✓
- No performance regressions ✓

Phase 2 of 3 complete."
```

---

## NEXT: PHASE 3
After Phase 2 completion, proceed to:
- `.buildrunner/UVP_V2.1_ATOMIC_TASKS_PHASE_3.md`
- Unified Ideal Customer Profile page
- Customer-driver mapping
- UVP flow integration
