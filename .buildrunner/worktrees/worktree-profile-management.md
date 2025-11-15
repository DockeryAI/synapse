# Worktree Task: Business Profile Management & Product Campaign Selection

**Feature ID:** `business-profile-management`
**Branch:** `feature/profile-management`
**Estimated Time:** 14 hours
**Priority:** CRITICAL
**Dependencies:** Foundation, Product Scanner + UVP Wizard (MUST be merged first)
**Worktree Path:** `../synapse-profile`

---

## Context

Persistent storage and management of UVP, products, services, offers. Full CRUD interface, product selection for campaigns, website re-scan, version history with rollback.

**This is the user's dashboard to manage everything discovered during onboarding.**

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-profile feature/profile-management
cd ../synapse-profile
git pull origin main  # MUST have product-scanner-uvp merged
npm install
```

---

## Task Checklist

### File: `src/components/profile/BusinessProfileDashboard.tsx`

**Main dashboard showing:**
- [ ] UVP summary card (click to edit)
- [ ] Products count card (12 products)
- [ ] Services count card (5 services)
- [ ] Promotions count card (2 active)
- [ ] "Re-scan Website" button
- [ ] "Create Campaign" button (goes to campaign builder)
- [ ] Last updated timestamp

### File: `src/components/profile/ProductEditor.tsx`

**Product Management UI:**
- [ ] Filterable list (search, category filter, active/inactive)
- [ ] Table view: Name | SKU | Price | Category | Status | Actions
- [ ] Bulk select checkboxes
- [ ] Bulk actions toolbar: "Mark Active", "Mark Inactive", "Delete", "Create Campaign"
- [ ] "Add Product" button → opens modal
- [ ] Edit icon per row → opens edit modal

**Product Edit Modal:**
```typescript
interface ProductForm {
  name: string
  description?: string
  sku?: string
  price?: number
  category?: string
  status: 'active' | 'inactive'
  promotional: boolean
  featured: boolean
  seasonal: boolean
}
```

- [ ] Form with validation
- [ ] Save updates to database
- [ ] Toast notification on success

### File: `src/components/profile/ServiceEditor.tsx`

**Same as ProductEditor but for services:**
- [ ] Service list table
- [ ] Edit/add modals
- [ ] Service-specific fields: tier, duration, booking_required

### File: `src/components/profile/UVPEditor.tsx`

- [ ] Display current UVP statement
- [ ] "Edit UVP" button → Re-opens wizard at any step
- [ ] Can navigate wizard steps freely
- [ ] Changes save immediately
- [ ] "Reset and Start Over" button (with confirmation)

### File: `src/components/profile/ProductSelector.tsx`

**Campaign Product Selection:**
- [ ] Modal overlay
- [ ] Product checkboxes
- [ ] "Select All" / "Select Category" options
- [ ] Selected count display (3 selected)
- [ ] "Create Campaign" button (disabled if none selected)
- [ ] Campaign type selection (Launch, Seasonal, Showcase, Sale, Comparison)

**Selection Logic:**
```typescript
const [selectedProducts, setSelectedProducts] = useState<string[]>([])

function handleCreateCampaign() {
  navigate('/campaigns/create', {
    state: { productIds: selectedProducts, type: campaignType }
  })
}
```

### File: `src/components/profile/WebsiteRescan.tsx`

**Re-scan Functionality:**
- [ ] "Re-scan Website" button
- [ ] Shows loading state
- [ ] Runs product/service scanner again
- [ ] Displays diff view:
  - New: 2 products found
  - Updated: 1 price change detected
  - Unchanged: 10 products
  - Removed: 1 product no longer found
- [ ] User approves changes before merging
- [ ] Conflict resolution: if manual edit conflicts with new scan, user chooses

**Diff Display:**
```typescript
interface ScanDiff {
  new: DetectedProduct[]
  updated: { old: Product; new: DetectedProduct }[]
  unchanged: Product[]
  removed: Product[]
}
```

### File: `src/components/profile/VersionHistory.tsx`

**Version Control:**
- [ ] Timeline of changes
- [ ] Each entry shows: timestamp, change_type, old → new values
- [ ] "Rollback to this version" button
- [ ] Confirmation modal before rollback

**Types:**
```typescript
interface ProfileVersion {
  id: string
  business_profile_id: string
  version_number: number
  snapshot: {
    uvp_data: any
    products: Product[]
    services: Service[]
  }
  created_at: Date
}

interface ChangeLog {
  id: string
  change_type: 'product_added' | 'product_updated' | 'product_deleted' | 'uvp_updated' | 'service_added' | etc.
  old_value: any
  new_value: any
  changed_at: Date
}
```

---

## Database Operations

**Load Profile:**
```typescript
const profile = await supabase
  .from('business_profiles')
  .select(`
    *,
    products(*),
    services(*),
    promotional_offers(*)
  `)
  .eq('id', profileId)
  .single()
```

**Update Product:**
```typescript
await supabase
  .from('products')
  .update({ name, price, category, status })
  .eq('id', productId)

// Log change
await supabase.from('profile_changes_log').insert({
  business_profile_id: profileId,
  change_type: 'product_updated',
  old_value: oldProduct,
  new_value: updatedProduct
})
```

**Create Version Snapshot:**
```typescript
await supabase.from('profile_versions').insert({
  business_profile_id: profileId,
  version_number: nextVersion,
  snapshot: {
    uvp_data: profile.uvp_data,
    products: profile.products,
    services: profile.services
  }
})
```

**Rollback:**
```typescript
const version = await supabase
  .from('profile_versions')
  .select('*')
  .eq('id', versionId)
  .single()

// Restore snapshot
await supabase.from('business_profiles').update({
  uvp_data: version.snapshot.uvp_data
}).eq('id', profileId)

// Restore products (delete current, insert snapshot)
await supabase.from('products').delete().eq('business_profile_id', profileId)
await supabase.from('products').insert(version.snapshot.products)
```

---

## Integration with Campaign Generator

**When user selects products and clicks "Create Campaign":**
```typescript
// Navigate to campaign builder with product context
navigate('/campaigns/create', {
  state: {
    productIds: selectedProductIds,
    campaignType: 'product_showcase',
    products: selectedProducts
  }
})

// Campaign generator will use this to create product-specific posts
```

---

## Re-scan Merge Logic

```typescript
async function mergeScanResults(diff: ScanDiff, userApprovals: Approval[]) {
  // Add new products (if user approved)
  for (const newProduct of diff.new.filter(p => userApprovals.includes(p.id))) {
    await supabase.from('products').insert({
      ...newProduct,
      source: 'auto-detected'
    })
  }

  // Update changed products (if user approved)
  for (const update of diff.updated.filter(u => userApprovals.includes(u.new.id))) {
    if (update.old.source === 'manual') {
      // Conflict: manual edit vs new scan
      // Show conflict resolution UI
    } else {
      await supabase.from('products').update(update.new).eq('id', update.old.id)
    }
  }

  // Mark removed products as inactive (don't delete)
  for (const removed of diff.removed) {
    await supabase.from('products').update({ status: 'inactive' }).eq('id', removed.id)
  }
}
```

---

## Testing

```typescript
it('loads business profile with products', async () => {
  render(<BusinessProfileDashboard profileId="123" />)
  await waitFor(() => {
    expect(screen.getByText(/12 products/)).toBeInTheDocument()
  })
})

it('updates product and logs change', async () => {
  render(<ProductEditor />)
  fireEvent.click(screen.getByText('Edit Product'))
  fireEvent.change(screen.getByLabelText('Price'), { target: { value: '29.99' } })
  fireEvent.click(screen.getByText('Save'))

  const log = await supabase.from('profile_changes_log').select('*').single()
  expect(log.change_type).toBe('product_updated')
})

it('selects products for campaign', async () => {
  render(<ProductSelector />)
  fireEvent.click(screen.getAllByRole('checkbox')[0])
  fireEvent.click(screen.getAllByRole('checkbox')[1])

  expect(screen.getByText(/2 selected/)).toBeInTheDocument()

  fireEvent.click(screen.getByText('Create Campaign'))
  expect(mockNavigate).toHaveBeenCalledWith('/campaigns/create', {
    state: expect.objectContaining({ productIds: expect.any(Array) })
  })
})
```

---

## Completion Criteria

- [ ] Dashboard displays all profile sections
- [ ] Product CRUD fully functional
- [ ] Service CRUD fully functional
- [ ] UVP editing works (re-opens wizard)
- [ ] Product selection for campaigns works
- [ ] Website re-scan with diff view functional
- [ ] Conflict resolution handles manual edits
- [ ] Version history displays correctly
- [ ] Rollback works without data loss
- [ ] Change logging tracks all updates
- [ ] UI polished and intuitive
- [ ] All database operations tested
- [ ] No TS errors

---

## Commit

```bash
git commit -m "feat: Add business profile management with product campaign selection

Dashboard:
- UVP, products, services, promotions overview
- Quick actions for editing and campaigns

Product/Service Management:
- Full CRUD with bulk actions
- Filterable tables
- Status management

Campaign Selection:
- Multi-select products for campaigns
- Campaign type selection
- Integration with campaign generator

Website Re-scan:
- Diff view for changes
- User approval workflow
- Conflict resolution for manual edits

Version Control:
- Change history tracking
- Version snapshots
- Rollback functionality

Implements business-profile-management feature"
```

---

*This is the "control center" of the app. Make it bulletproof.*
