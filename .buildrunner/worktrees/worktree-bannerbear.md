# Worktree Task: Bannerbear Universal Template System

**Feature ID:** `bannerbear-templates`
**Branch:** `feature/bannerbear`
**Estimated Time:** 10 hours
**Priority:** HIGH
**Dependencies:** Foundation
**Worktree Path:** `../synapse-bannerbear`

---

## Context

Industry-agnostic visual template system using Bannerbear API. Auto-populates templates with business data, adapts visuals by industry, generates multi-platform versions.

**8 Template Variables:**
{business_name}, {specialty}, {location}, {offer}, {pain_point}, {testimonial}, {stat}, {cta}

**7 Template Types:**
Testimonial cards, Service grids, Before/after, Stats showcase, Quote graphics, Promotional offers, Educational infographics

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-bannerbear feature/bannerbear
cd ../synapse-bannerbear
npm install

# Bannerbear SDK
npm install @bannerbear/node-sdk
```

Add to `.env`:
```
VITE_BANNERBEAR_API_KEY=bb_api_xxx
```

---

## Task Checklist

### File: `src/services/bannerbear.service.ts`

- [ ] Initialize Bannerbear client
```typescript
import { Bannerbear } from '@bannerbear/node-sdk'
const bb = new Bannerbear(process.env.VITE_BANNERBEAR_API_KEY)
```

- [ ] `generateImage(templateId: string, variables: TemplateVariables): Promise<GeneratedImage>`
  - Call Bannerbear API
  - Pass variables
  - Wait for image generation
  - Return image URL

- [ ] `generateMultiPlatform(templateId: string, variables: TemplateVariables): Promise<GeneratedImage[]>`
  - Generate 3 versions: 1:1 (Instagram), 16:9 (LinkedIn), 9:16 (Stories)
  - Return array of images

- [ ] `createTemplateFromBase(baseTemplate: string, industry: string): Promise<Template>`
  - Clone base template
  - Adapt colors for industry (healthcare = blue, food = red/orange)
  - Adapt icons (dentist = tooth, lawyer = scales)
  - Save customized template

### File: `src/services/template-adapter.service.ts`

- [ ] `adaptTemplateForIndustry(template: Template, industry: string): Template`
  - Map industry → color scheme
  - Map industry → icon set
  - Adjust font for industry tone (playful vs professional)

**Industry Mappings:**
```typescript
const industryColors = {
  healthcare: { primary: '#0066CC', secondary: '#00B4D8' },
  food: { primary: '#FF4500', secondary: '#FFD700' },
  legal: { primary: '#1C3A70', secondary: '#8B0000' },
  fitness: { primary: '#FF6B35', secondary: '#4ECDC4' },
  // ... 20+ industries
}

const industryIcons = {
  dental: 'tooth',
  legal: 'scales',
  restaurant: 'fork-knife',
  fitness: 'dumbbell',
  // ... 20+ industries
}
```

### File: `src/components/templates/TemplateSelector.tsx`

- [ ] Display template library
- [ ] Filter by type (testimonial, offer, stat, etc.)
- [ ] Preview templates
- [ ] Select template for campaign

### File: `src/components/templates/TemplatePreview.tsx`

- [ ] Live preview with variables filled in
- [ ] Show all 3 platform versions
- [ ] Edit variables inline
- [ ] Download/save to campaign

---

## Bannerbear Templates to Create

**1. Testimonial Card**
- Background layer (industry color)
- Customer photo placeholder
- Quote text {testimonial}
- Business name {business_name}
- Star rating graphic

**2. Service Grid**
- 3-4 service blocks
- Service names {services}
- Icons (auto-detected by industry)
- CTA button {cta}

**3. Promotional Offer**
- Bold offer text {offer}
- Discount amount (if applicable)
- CTA button
- Urgency text ("Limited time!")
- Business logo {business_name}

**4. Statistics Showcase**
- Large number {stat}
- Context text
- Brand colors
- Icon representing metric

**5. Quote Graphic**
- Inspirational quote {quote}
- Business name attribution
- Background image (industry-appropriate)

**6. Before/After**
- Split screen layout
- Labels "Before" / "After"
- Result text {result}
- Business name

**7. Educational Infographic**
- 3-5 tips/facts
- Icons for each
- Business name footer
- Readable layout

---

## Type Definitions

```typescript
export interface TemplateVariables {
  business_name?: string
  specialty?: string
  location?: string
  offer?: string
  pain_point?: string
  testimonial?: string
  stat?: string
  cta?: string
  [key: string]: string | undefined
}

export interface GeneratedImage {
  url: string
  width: number
  height: number
  platform: '1:1' | '16:9' | '9:16'
  templateId: string
}

export interface Template {
  id: string
  name: string
  type: 'testimonial' | 'service_grid' | 'offer' | 'stat' | 'quote' | 'before_after' | 'infographic'
  bannerbearTemplateId: string
  variables: string[] // List of required variables
  previewUrl: string
  industry?: string
}
```

---

## Database Integration

```typescript
// Save template library
await supabase.from('template_library').insert({
  name: 'Testimonial Card - Healthcare',
  bannerbear_template_id: 'bb_tmpl_xxx',
  variables: ['business_name', 'testimonial', 'location'],
  preview_url: 'https://...'
})

// Save generated images
await supabase.from('generated_visuals').insert({
  campaign_post_id: postId,
  template_id: templateId,
  image_url: generatedUrl,
  generated_at: new Date()
})
```

---

## Bannerbear API Usage

**Create Image:**
```typescript
const image = await bb.create_image({
  template: 'bb_tmpl_xxxxx',
  modifications: [
    {
      name: 'business_name',
      text: 'Joe\'s Pizza'
    },
    {
      name: 'offer',
      text: '20% Off All Large Pizzas'
    }
  ]
})

// Wait for completion
const completed = await bb.get_image(image.uid)
return completed.image_url
```

---

## Testing

```typescript
it('generates image from template', async () => {
  const image = await generateImage('bb_tmpl_test', {
    business_name: 'Test Business',
    offer: '50% Off'
  })

  expect(image.url).toBeDefined()
  expect(image.url).toContain('https://')
})

it('adapts template for industry', async () => {
  const template = await adaptTemplateForIndustry(baseTemplate, 'healthcare')
  expect(template.colors.primary).toBe('#0066CC')
  expect(template.icon).toBe('medical-cross')
})

it('generates multi-platform versions', async () => {
  const images = await generateMultiPlatform('bb_tmpl_test', variables)
  expect(images).toHaveLength(3)
  expect(images.map(i => i.platform)).toContain('1:1')
  expect(images.map(i => i.platform)).toContain('16:9')
})
```

---

## Completion Criteria

- [ ] Bannerbear SDK integrated
- [ ] 7 base templates created in Bannerbear dashboard
- [ ] Template generation working
- [ ] Multi-platform support functional
- [ ] Industry adaptation working
- [ ] Template selector UI built
- [ ] Database integration complete
- [ ] Types exported
- [ ] Tested with 3+ templates
- [ ] No TS errors

---

## Commit

```bash
git commit -m "feat: Add Bannerbear universal template system

- 7 template types (testimonial, offer, stat, etc.)
- Industry-specific color/icon adaptation
- Multi-platform generation (1:1, 16:9, 9:16)
- 8 dynamic variables support
- Template library management
- Real-time preview UI

Implements bannerbear-templates feature"
```

---

**Note:** You'll need to create the actual templates in Bannerbear dashboard first, then use their template IDs in the code.
