# Product Section Merge Plan

**Status**: IMPLEMENTED
**Created**: 2025-11-29
**Completed**: 2025-11-29
**Branch**: feature/uvp-sidebar-ui
**Related**: feature/product-centric-marketing, BrandProfilePage

---

## Overview

Merge the product management capabilities from `feature/product-centric-marketing` branch into the current feature branch, integrating with the existing BrandProfilePage and UVP system.

### Goals
1. Allow users to view/manage products extracted during UVP onboarding
2. Enable manual product add/edit/delete
3. Provide "Rescan Website" to discover new products using AI
4. Make products available for campaign/content generation

---

## Current State Analysis

### UVP Product Data (Current - uvp-flow.types.ts:17-40)

```typescript
interface ProductService {
  id: string;
  name: string;
  description: string;
  category: string;
  confidence: number; // 0-100 extraction confidence
  source: 'website' | 'manual';
  sourceUrl?: string;
  sourceExcerpt?: string;
  confirmed: boolean;
}

interface ProductServiceData {
  categories: ProductServiceCategory[];
  extractionComplete: boolean;
  extractionConfidence: ConfidenceScore;
  sources: DataSource[];
}
```

**Location**: Stored in UVP JSON blob during onboarding
**Limitation**: No standalone management, edit, or rescan capability

### Product-Centric-Marketing Branch

**Files to merge:**
- `src/types/product.types.ts` - Extended product types with pricing/tiers
- `src/services/intelligence/product-scanner.service.ts` - AI-powered extraction

**Key additions:**
```typescript
interface Product {
  name: string;
  description?: string;
  type: ProductType; // 'product' | 'service' | 'hybrid'
  tier?: ProductTier; // 'basic' | 'premium' | 'enterprise' | 'custom'
  category: ProductCategory; // 'primary' | 'secondary' | 'addon'
  priceRange?: string;
  durationMinutes?: number;
  features?: string[];
  confidence: number;
}
```

### BrandProfilePage (Already in branch)

**Location**: `src/pages/BrandProfilePage.tsx`
**Route**: `/settings/brand-profile`
**Current sections**:
- Market Definition (customer type, geographic scope, profile type)
- UVP Confidence Score
- Value Proposition Statement
- Target Customer, Transformation Goal, Unique Solution, Key Benefit
- Data Sources

**Missing**: Products section

---

## Architecture Decision

### Option A: Extend UVP JSON (Not Recommended)
- Store enhanced products in existing UVP blob
- Cons: Hard to query, no normalization, migration complexity

### Option B: Separate Table + Sync (Recommended)
- Create `brand_products` table for normalized storage
- Sync to UVP JSON for backward compatibility
- Pros: Queryable, scalable, clean separation

### Decision: Option B - Separate Table + Sync

---

## Implementation Phases

### Phase 1: Data Layer

**1.1 Create Database Migration**

File: `supabase/migrations/YYYYMMDD_brand_products.sql`

```sql
-- Brand Products Table
CREATE TABLE IF NOT EXISTS brand_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Core fields (from UVP ProductService)
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,

  -- Extended fields (from product-centric-marketing)
  product_type TEXT CHECK (product_type IN ('product', 'service', 'hybrid')),
  tier TEXT CHECK (tier IN ('basic', 'premium', 'enterprise', 'custom')),
  priority TEXT CHECK (priority IN ('primary', 'secondary', 'addon')),
  price_range TEXT,
  duration_minutes INTEGER,
  features JSONB DEFAULT '[]'::jsonb,

  -- Extraction metadata
  source TEXT CHECK (source IN ('website', 'manual', 'rescan')),
  source_url TEXT,
  source_excerpt TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.0,
  is_confirmed BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_brand_products_brand_id ON brand_products(brand_id);
CREATE INDEX idx_brand_products_priority ON brand_products(priority);

-- RLS
ALTER TABLE brand_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand products"
  ON brand_products FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own brand products"
  ON brand_products FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own brand products"
  ON brand_products FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own brand products"
  ON brand_products FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));
```

**1.2 Create TypeScript Types**

File: `src/types/product.types.ts`

Merge UVP ProductService with product-centric-marketing types:

```typescript
export type ProductType = 'product' | 'service' | 'hybrid';
export type ProductTier = 'basic' | 'premium' | 'enterprise' | 'custom';
export type ProductPriority = 'primary' | 'secondary' | 'addon';
export type ProductSource = 'website' | 'manual' | 'rescan';

export interface BrandProduct {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  category?: string;
  product_type?: ProductType;
  tier?: ProductTier;
  priority?: ProductPriority;
  price_range?: string;
  duration_minutes?: number;
  features?: string[];
  source: ProductSource;
  source_url?: string;
  source_excerpt?: string;
  confidence: number;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
  last_scanned_at?: string;
}

export interface ProductScanResult {
  products: BrandProduct[];
  primary_offering?: string;
  secondary_offerings: string[];
  confidence: number;
  scanned_at: Date;
}
```

**1.3 Create useProducts Hook**

File: `src/hooks/useProducts.ts`

```typescript
export function useProducts(brandId: string) {
  // State
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Load products from brand_products table
  async function loadProducts() { ... }

  // Add product (manual)
  async function addProduct(product: Partial<BrandProduct>) { ... }

  // Update product
  async function updateProduct(id: string, updates: Partial<BrandProduct>) { ... }

  // Delete product
  async function deleteProduct(id: string) { ... }

  // Rescan website for products
  async function rescanProducts(websiteUrl: string) { ... }

  // Sync products to UVP JSON (for backward compat)
  async function syncToUVP() { ... }

  return {
    products,
    loading,
    scanning,
    addProduct,
    updateProduct,
    deleteProduct,
    rescanProducts,
    refresh: loadProducts
  };
}
```

---

### Phase 2: Merge Product Scanner

**2.1 Cherry-pick Product Scanner Service**

From: `feature/product-centric-marketing:src/services/intelligence/product-scanner.service.ts`
To: `src/services/intelligence/product-scanner.service.ts`

**Adaptations needed:**
- Update import paths
- Use existing AI proxy patterns from competitor-intelligence services
- Return `BrandProduct[]` instead of branch-specific types
- Add save-to-database capability

**2.2 Scanner Integration Points**

```typescript
class ProductScannerService {
  // Scan website content for products (existing from branch)
  async scanProducts(websiteContent: string, brandName: string, industry?: string): Promise<ProductScanResult>

  // NEW: Scan and save to database
  async scanAndSave(brandId: string, websiteUrl: string): Promise<BrandProduct[]>

  // NEW: Fetch website content (reuse from deepcontext-builder)
  private async fetchWebsiteContent(url: string): Promise<string>
}
```

---

### Phase 3: Products UI in BrandProfilePage

**3.1 Add Products Section**

Location: `src/pages/BrandProfilePage.tsx` (after Market Definition section)

```tsx
{/* Products Section */}
<Card className="mb-6">
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Package className="w-5 h-5 text-indigo-600" />
        Products & Services
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleRescan}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rescan Website
        </Button>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>
    </CardTitle>
    <CardDescription>
      Products and services extracted from your website
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Product list with edit/delete */}
    <ProductList
      products={products}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  </CardContent>
</Card>
```

**3.2 Create ProductList Component**

File: `src/components/settings/ProductList.tsx`

Features:
- Grid/list view of products
- Primary badge for main offerings
- Edit button → opens modal
- Delete button with confirmation
- Confidence indicator
- Source badge (website/manual/rescan)

**3.3 Create AddEditProductModal Component**

File: `src/components/settings/AddEditProductModal.tsx`

Fields:
- Name (required)
- Description
- Category
- Type (product/service/hybrid)
- Tier (basic/premium/enterprise/custom)
- Priority (primary/secondary/addon)
- Price Range
- Features (tag input)

---

### Phase 4: Campaign Integration

**4.1 Pass Products to Content Generation**

Update `V4PowerModePanel.tsx` to include products in context:

```typescript
// In buildContentContext()
const products = await loadBrandProducts(brandId);
return {
  ...existingContext,
  products: products.map(p => ({
    name: p.name,
    description: p.description,
    isPrimary: p.priority === 'primary',
    features: p.features
  }))
};
```

**4.2 Product Selector in Power Mode**

Add optional product focus:
- Dropdown to select specific product for content
- "All Products" default option
- Selected product injects into content hooks

**4.3 Product-Specific Content Hooks**

In `CalendarGenerator.ts` or content templates:
- `{{product.name}}` - Product name
- `{{product.description}}` - Product description
- `{{product.features}}` - Feature list
- `{{product.priceRange}}` - Pricing info

---

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `supabase/migrations/YYYYMMDD_brand_products.sql` | Database table |
| `src/types/product.types.ts` | Merged product types |
| `src/hooks/useProducts.ts` | Product CRUD hook |
| `src/services/intelligence/product-scanner.service.ts` | AI scanner (merged) |
| `src/components/settings/ProductList.tsx` | Product list UI |
| `src/components/settings/AddEditProductModal.tsx` | Add/edit modal |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/BrandProfilePage.tsx` | Add Products section |
| `src/components/v4/V4PowerModePanel.tsx` | Add products to context |
| `src/services/calendar/CalendarGenerator.ts` | Add product hooks |

---

## Migration Strategy

### From UVP to brand_products

On first load of BrandProfilePage:
1. Check if `brand_products` has any records for this brand
2. If empty, extract products from UVP JSON (`productsServices.categories[].items`)
3. Insert into `brand_products` table
4. Mark migration complete in localStorage

```typescript
async function migrateUVPProducts(brandId: string, uvp: CompleteUVP) {
  const existingProducts = await supabase
    .from('brand_products')
    .select('id')
    .eq('brand_id', brandId);

  if (existingProducts.data?.length > 0) return; // Already migrated

  const uvpProducts = uvp.productsServices?.categories?.flatMap(c => c.items) || [];

  for (const product of uvpProducts) {
    await supabase.from('brand_products').insert({
      brand_id: brandId,
      name: product.name,
      description: product.description,
      category: product.category,
      source: product.source,
      source_url: product.sourceUrl,
      source_excerpt: product.sourceExcerpt,
      confidence: product.confidence / 100,
      is_confirmed: product.confirmed
    });
  }
}
```

---

## Testing Checklist

- [ ] Products load from database on BrandProfilePage
- [ ] UVP products migrate correctly on first load
- [ ] Add product modal creates record in database
- [ ] Edit product updates record correctly
- [ ] Delete product removes record with confirmation
- [ ] Rescan website extracts new products
- [ ] Rescan merges with existing (no duplicates)
- [ ] Products appear in content generation context
- [ ] Product selector works in Power Mode
- [ ] Product hooks render in generated content

---

## Dependencies

- Supabase migration must run before UI can load
- AI proxy function must support product extraction prompts
- Website content fetcher (reuse from deepcontext-builder)

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Data Layer | Medium |
| Phase 2: Product Scanner | Low (mostly cherry-pick) |
| Phase 3: Products UI | Medium |
| Phase 4: Campaign Integration | Low |
| **Total** | **~1 day** |

---

## Open Questions

1. Should we show products from UVP that weren't confirmed by user?
2. Rate limit on website rescan? (24h like competitor rescan?)
3. Should products sync back to UVP JSON or just read from brand_products?
