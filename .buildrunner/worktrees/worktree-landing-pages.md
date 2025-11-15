# Worktree Task: Landing Page Generator & Lead Capture

**Feature ID:** `landing-page-lead-capture`
**Branch:** `feature/landing-pages`
**Estimated Time:** 25 hours
**Priority:** HIGH
**Phase:** 1B - Content Marketing
**Dependencies:** Profile Management
**Worktree Path:** `../synapse-landing-pages`

---

## Context

Generate SEO-optimized landing pages from business profiles. 5 template types auto-populated with business data. Built-in lead capture, email notifications, CSV export. Self-hosted or export HTML.

**5 Template Types:**
1. Service Landing Page
2. Product Landing Page
3. Event Landing Page
4. Webinar Landing Page
5. Download/Lead Magnet Page

**Key Features:**
- Auto-populate from business profile
- Drag-and-drop form builder
- Lead capture to database
- Email notifications on new leads
- CSV export
- UTM parameter tracking
- Mobile-responsive
- GDPR compliance (consent checkbox)

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-landing-pages feature/landing-pages
cd ../synapse-landing-pages
npm install
```

---

## Task Checklist

### File: `src/services/landing-page-generator.service.ts`

- [ ] Create LandingPageGeneratorService class
```typescript
interface LandingPageTemplate {
  id: string
  name: string
  type: 'service' | 'product' | 'event' | 'webinar' | 'download'
  sections: LandingPageSection[]
  defaultFields: FormField[]
}

interface LandingPage {
  id: string
  template_id: string
  slug: string
  title: string
  meta_description: string
  sections: PopulatedSection[]
  form: LeadCaptureForm
  published: boolean
  url: string // synapse.com/l/{slug} or custom
}
```

- [ ] Implement `generateFromProfile()` method
  - Auto-populate all sections from business profile
  - Use intelligence data (reviews, products, UVP)
  - Generate compelling copy with OpenRouter
  - Include proof points (testimonials, stats)

- [ ] Implement `createTemplate()` for each type
  - Service: Hero + Benefits + Process + CTA + Form
  - Product: Hero + Features + Pricing + Reviews + Form
  - Event: Hero + Agenda + Speakers + Location + Form
  - Webinar: Hero + Topics + Speaker + Time + Form
  - Download: Hero + Preview + Benefits + Form

### File: `src/services/form-builder.service.ts`

- [ ] Create FormBuilderService class
```typescript
interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox'
  label: string
  placeholder: string
  required: boolean
  validation?: FieldValidation
}

interface LeadCaptureForm {
  id: string
  fields: FormField[]
  submit_button_text: string
  success_message: string
  redirect_url?: string
}
```

- [ ] Implement drag-and-drop field management
- [ ] Implement field validation rules
- [ ] Implement conditional logic (show field if...)
- [ ] Implement multi-step form support

### File: `src/services/lead-capture.service.ts`

- [ ] Create LeadCaptureService class
```typescript
interface Lead {
  id: string
  landing_page_id: string
  submitted_at: string
  form_data: Record<string, any>
  utm_params?: UTMParams
  ip_address?: string
  user_agent?: string
}

interface UTMParams {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
}
```

- [ ] Implement `captureLead()` method
  - Validate form data
  - Extract UTM parameters from URL
  - Capture IP and user agent
  - Save to database
  - Trigger notifications
  - Track in analytics

- [ ] Implement `sendNotification()` method
  - Email to business owner
  - Include lead details
  - Link to lead management

- [ ] Implement `exportToCSV()` method
  - Generate CSV with all leads
  - Include timestamps and UTM data

### File: `src/services/landing-page-hosting.service.ts`

- [ ] Create LandingPageHostingService class
```typescript
interface HostingOptions {
  type: 'synapse' | 'custom' | 'export'
  customDomain?: string
  slug: string
}
```

- [ ] Implement Synapse subdomain hosting
  - URL: synapse.com/l/{user-slug}/{page-slug}
  - Auto-SSL
  - CDN delivery

- [ ] Implement HTML export
  - Generate standalone HTML file
  - Inline all CSS/JS
  - Include form submission endpoint
  - Ready for any host

- [ ] Implement custom domain support (Phase 2)
  - CNAME verification
  - SSL certificate generation

### File: `src/components/landing-pages/TemplateSelector.tsx`

- [ ] Create TemplateSelector component
```typescript
interface TemplateSelectorProps {
  onSelect: (template: LandingPageTemplate) => void
}
```

- [ ] UI Elements:
  - 5 template cards with previews
  - Template descriptions
  - Use case labels
  - Preview modal

### File: `src/components/landing-pages/PageEditor.tsx`

- [ ] Create PageEditor component
```typescript
interface PageEditorProps {
  template: LandingPageTemplate
  profile: BusinessProfile
  onSave: (page: LandingPage) => void
}
```

- [ ] UI Elements:
  - Section-by-section editor
  - Live preview toggle (desktop/mobile)
  - Text editing with formatting
  - Image upload/selection
  - Color scheme picker
  - Font selector
  - Form builder (drag-and-drop)
  - SEO settings (title, description)
  - UTM parameter builder
  - Publish toggle

### File: `src/components/landing-pages/FormBuilder.tsx`

- [ ] Create FormBuilder component
- [ ] Drag-and-drop field library
- [ ] Field property editor
- [ ] Validation rule builder
- [ ] Preview mode
- [ ] Test submission

### File: `src/components/landing-pages/LeadManagement.tsx`

- [ ] Create LeadManagement component
```typescript
interface LeadManagementProps {
  landingPageId: string
}
```

- [ ] UI Elements:
  - Lead list table (sortable, filterable)
  - Lead details modal
  - UTM source breakdown
  - Export to CSV button
  - Email notification settings
  - Lead status management

### Database: Add tables

```sql
-- Landing pages
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  business_profile_id UUID REFERENCES business_profiles(id),
  template_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  sections JSONB NOT NULL,
  form JSONB NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  landing_page_id UUID REFERENCES landing_pages(id),
  form_data JSONB NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new', -- new, contacted, qualified, converted
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead notifications
CREATE TABLE lead_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  landing_page_id UUID REFERENCES landing_pages(id),
  notification_type TEXT NOT NULL, -- email, webhook
  destination TEXT NOT NULL, -- email address or webhook URL
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing page analytics
CREATE TABLE landing_page_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID REFERENCES landing_pages(id),
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE
);

-- RLS policies
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own landing pages" ON landing_pages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit leads" ON leads
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can manage own notifications" ON lead_notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Track visits" ON landing_page_visits
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can view own analytics" ON landing_page_visits
  FOR SELECT USING (
    landing_page_id IN (
      SELECT id FROM landing_pages WHERE user_id = auth.uid()
    )
  );
```

---

## Template Specifications

### 1. Service Landing Page
**Sections:**
- Hero (headline, subheadline, CTA, hero image)
- Benefits (3-5 key benefits with icons)
- Process (3-4 step timeline)
- Testimonials (2-3 customer reviews)
- FAQ (5-7 common questions)
- Final CTA + Form

### 2. Product Landing Page
**Sections:**
- Hero (product image, headline, price, CTA)
- Features (6-8 feature grid with icons)
- Pricing (tiered pricing table)
- Reviews (star rating + testimonials)
- Comparison (vs competitors - optional)
- Final CTA + Form

### 3. Event Landing Page
**Sections:**
- Hero (event name, date, location, register CTA)
- About Event (description, purpose)
- Agenda (time-based schedule)
- Speakers (photos + bios)
- Location/Venue (map, directions)
- Registration Form

### 4. Webinar Landing Page
**Sections:**
- Hero (webinar topic, date/time, host, register CTA)
- What You'll Learn (5-7 bullet points)
- About the Speaker (photo, bio, credentials)
- Date & Time (with timezone selector)
- FAQ
- Registration Form

### 5. Download/Lead Magnet Page
**Sections:**
- Hero (lead magnet preview, headline, download CTA)
- Preview (table of contents, sample pages)
- Benefits (what they'll get)
- Social Proof (download count, testimonials)
- Download Form (email + name)

---

## Testing Checklist

- [ ] Generate landing page from each template
- [ ] Verify auto-population from business profile
- [ ] Test form submission and lead capture
- [ ] Verify email notifications sent
- [ ] Test CSV export (10+ leads)
- [ ] Verify UTM tracking working
- [ ] Test mobile responsiveness (all templates)
- [ ] Verify GDPR consent checkbox
- [ ] Test published page URL access
- [ ] Export HTML and verify standalone functionality
- [ ] Test lead status management
- [ ] Verify analytics tracking (visits vs conversions)

---

## Integration Points

1. **Business Profile** - Auto-populate content
2. **Intelligence Data** - Testimonials, proof points
3. **OpenRouter** - Copy generation
4. **Database** - Lead storage
5. **Email Service** - Notifications

---

## Success Criteria

- ✅ All 5 templates functional
- ✅ Auto-population from business profile working
- ✅ Lead capture and storage working
- ✅ Email notifications triggered
- ✅ CSV export functional
- ✅ UTM tracking accurate
- ✅ Mobile-responsive on all devices
- ✅ Published pages accessible via URL
- ✅ GDPR compliant

---

**Estimated Completion:** 25 hours (3-4 days)
