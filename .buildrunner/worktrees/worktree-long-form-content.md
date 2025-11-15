# Worktree Task: Long-Form Content Generator (Blog & Newsletter)

**Feature ID:** `long-form-content-generator`
**Branch:** `feature/long-form-content`
**Estimated Time:** 20 hours
**Priority:** HIGH
**Phase:** 1B - Content Marketing
**Dependencies:** Campaign Generator
**Worktree Path:** `../synapse-long-form`

---

## Context

Repurpose campaign posts into blog articles (500-2000 words) and newsletters. Auto-expand short-form content using business intelligence. Export to Mailchimp, ConvertKit, Substack.

**Key Features:**
- Blog article expander (1 post → 500-2000 word article)
- Newsletter template builder (3-5 layouts)
- Weekly digest compiler (auto-curate week's posts)
- Email-optimized formatting
- SEO meta description generator
- Direct export to email platforms

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-long-form feature/long-form-content
cd ../synapse-long-form
npm install
```

---

## Task Checklist

### File: `src/services/blog-expander.service.ts`

- [ ] Create BlogExpanderService class
```typescript
interface BlogExpansionRequest {
  originalPost: string
  targetLength: number // 500, 1000, 1500, 2000
  businessContext: BusinessProfile
  includeStats: boolean
  includeCTA: boolean
}

interface BlogArticle {
  title: string
  content: string // markdown
  metaDescription: string
  estimatedReadTime: number
  sections: BlogSection[]
}
```

- [ ] Implement `expandPostToBlog()` method
  - Use OpenRouter to expand content
  - Add introduction (hook + context)
  - Develop 3-5 main points
  - Add data/stats from intelligence
  - Include examples/case studies
  - Add conclusion with CTA
  - Generate SEO meta description

- [ ] Implement `generateSections()` method
  - Break content into logical sections
  - Add H2/H3 headers
  - Ensure flow and coherence

- [ ] Implement `estimateReadTime()` utility
  - Calculate: wordCount / 200 (avg reading speed)

### File: `src/services/newsletter-builder.service.ts`

- [ ] Create NewsletterBuilderService class
```typescript
interface NewsletterTemplate {
  id: string
  name: string // 'Classic', 'Minimal', 'Bold', 'Newsletter', 'Digest'
  layout: NewsletterLayout
  styles: NewsletterStyles
}

interface NewsletterContent {
  subject: string
  preheader: string
  sections: NewsletterSection[]
  footer: NewsletterFooter
}
```

- [ ] Implement 5 newsletter templates
  - Classic: Header + hero + posts + CTA
  - Minimal: Text-only with clean spacing
  - Bold: Large images + bold headers
  - Newsletter: Traditional newsletter format
  - Digest: Curated list with summaries

- [ ] Implement `buildNewsletter()` method
  - Populate template with content
  - Auto-format for email (inline CSS)
  - Mobile-responsive design
  - Ensure email client compatibility

- [ ] Implement `generateSubjectLines()` method
  - Use OpenRouter to generate 5 options
  - Include A/B test variations
  - Optimize for open rates

### File: `src/services/weekly-digest.service.ts`

- [ ] Create WeeklyDigestService class
```typescript
interface DigestOptions {
  topPostsCount: number // 3-10
  includePlatformPerformance: boolean
  includeUpcoming: boolean
  personalizationLevel: 'basic' | 'advanced'
}
```

- [ ] Implement `compileWeeklyDigest()` method
  - Fetch posts from past week
  - Select top performers (engagement)
  - Group by topic/theme
  - Add intro summary
  - Include performance metrics
  - Generate preview section

- [ ] Implement `curateContent()` method
  - Smart selection algorithm
  - Ensure topic diversity
  - Balance content types

### File: `src/services/email-export.service.ts`

- [ ] Create EmailExportService class
```typescript
interface ExportDestination {
  platform: 'mailchimp' | 'convertkit' | 'substack' | 'html'
  apiKey?: string
  listId?: string
}
```

- [ ] Implement Mailchimp export
  - Create campaign via API
  - Set content
  - Schedule/send

- [ ] Implement ConvertKit export
  - Create broadcast
  - Set content and segments

- [ ] Implement Substack export
  - Format as draft post
  - Export as markdown

- [ ] Implement HTML export
  - Generate standalone HTML file
  - Include inline CSS
  - Ready for any email platform

### File: `src/components/long-form/BlogExpander.tsx`

- [ ] Create BlogExpander component
```typescript
interface BlogExpanderProps {
  post: CampaignPost
  onExpand: (article: BlogArticle) => void
}
```

- [ ] UI Elements:
  - Post preview
  - Target length slider (500-2000 words)
  - Options: Include stats, Add CTA, SEO optimize
  - Preview pane (live markdown render)
  - Export buttons (Copy, Download, Publish)

### File: `src/components/long-form/NewsletterBuilder.tsx`

- [ ] Create NewsletterBuilder component
```typescript
interface NewsletterBuilderProps {
  posts: CampaignPost[]
  onPublish: (newsletter: NewsletterContent) => void
}
```

- [ ] UI Elements:
  - Template selector (5 templates with previews)
  - Drag-and-drop post selection
  - Subject line generator
  - Preview toggle (desktop/mobile)
  - Export destination selector
  - Send/schedule controls

### File: `src/components/long-form/DigestCompiler.tsx`

- [ ] Create DigestCompiler component
- [ ] Auto-curate top posts
- [ ] Allow manual re-ordering
- [ ] Preview compiled digest
- [ ] Schedule for specific day/time

### Database: Add tables

```sql
-- Blog articles
CREATE TABLE blog_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  business_profile_id UUID REFERENCES business_profiles(id),
  original_post_id UUID REFERENCES campaign_posts(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- markdown
  meta_description TEXT,
  word_count INTEGER,
  estimated_read_time INTEGER, -- minutes
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletters
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  business_profile_id UUID REFERENCES business_profiles(id),
  template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  content JSONB NOT NULL, -- newsletter sections
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email exports
CREATE TABLE email_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  content_type TEXT NOT NULL, -- 'blog' | 'newsletter'
  content_id UUID,
  platform TEXT NOT NULL,
  external_id TEXT, -- ID from email platform
  status TEXT DEFAULT 'pending',
  exported_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own blog articles" ON blog_articles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own newsletters" ON newsletters
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own exports" ON email_exports
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Testing Checklist

- [ ] Expand single post to 500-word blog article
- [ ] Expand to 2000-word comprehensive article
- [ ] Ensure markdown formatting is correct
- [ ] Verify SEO meta descriptions generated
- [ ] Test all 5 newsletter templates
- [ ] Compile weekly digest from 10 posts
- [ ] Export to HTML (verify email client compatibility)
- [ ] Test subject line generation (10 options)
- [ ] Verify mobile responsiveness
- [ ] Test read time estimation accuracy

---

## Integration Points

1. **Campaign Generator** - Source posts for expansion
2. **Business Profile** - Context for content expansion
3. **OpenRouter** - Content generation
4. **Email Platforms** - Export destinations

---

## Success Criteria

- ✅ Can expand any post to blog article (500-2000 words)
- ✅ 5 newsletter templates working
- ✅ Weekly digest auto-compilation functional
- ✅ Export to at least 2 email platforms
- ✅ Mobile-responsive email formatting
- ✅ SEO metadata auto-generated
- ✅ Content maintains brand voice

---

**Estimated Completion:** 20 hours (2-3 days)
