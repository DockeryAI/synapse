# Atomic Task List - All Worktrees & Weeks

**Purpose:** Complete task breakdown for parallel development
**Format:** Each task is atomic (testable, mergeable, independent)

---

## WEEK 1: Campaign Generation Core (5 Worktrees)

### Worktree 1: Campaign Type Selector (16h)
**Branch:** `feature/campaign-selector`
**Path:** `../synapse-campaign-selector`

#### Atomic Tasks:
1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Install dependencies (if any new ones needed)
   - [ ] Create directory structure: `src/components/campaign/`
   - [ ] Create types file: `src/types/campaign.types.ts`

2. **Campaign Type Data Model (1h)**
   - [ ] Define `CampaignType` interface (Authority Builder, Social Proof, Local Pulse)
   - [ ] Define `CampaignTypeMetadata` (description, icon, ideal for, platforms)
   - [ ] Create campaign type registry with all 3 types
   - [ ] Export from `src/types/campaign.types.ts`

3. **Campaign Recommender Service (4h)**
   - [ ] Create `src/services/campaign/CampaignRecommender.ts`
   - [ ] Implement `recommendCampaignType(context: DeepContext): CampaignType`
   - [ ] Logic: Authority Builder (high expertise data) vs Social Proof (reviews) vs Local Pulse (location data)
   - [ ] Add confidence scoring (0-1)
   - [ ] Add reasoning explanation ("Recommended because...")
   - [ ] Unit tests for recommender logic

4. **CampaignTypeCard Component (3h)**
   - [ ] Create `src/components/campaign/CampaignTypeCard.tsx`
   - [ ] Props: type, recommended, onClick, selected
   - [ ] Visual: Icon, title, description, "Best for" tag
   - [ ] Show "Recommended" badge if AI-selected
   - [ ] Hover effects and selection state
   - [ ] Responsive design (mobile + desktop)

5. **CampaignTypeSelector Component (5h)**
   - [ ] Create `src/components/campaign/CampaignTypeSelector.tsx`
   - [ ] Grid layout of 3 campaign type cards
   - [ ] Auto-select recommended type on load
   - [ ] Handle selection change
   - [ ] "Why this type?" tooltip/modal
   - [ ] "Continue" button (disabled until selection)
   - [ ] Integration with parent workflow

6. **Preview Section (2h)**
   - [ ] Add preview panel showing what each type generates
   - [ ] Example outputs for each campaign type
   - [ ] Platform icons showing where content works best
   - [ ] Data source indicators (shows which APIs used)

7. **Testing & Integration (30min)**
   - [ ] Test with real DeepContext data
   - [ ] Verify AI recommendations work
   - [ ] Test all 3 selections
   - [ ] Check responsive design
   - [ ] Commit and prepare for merge

---

### Worktree 2: Smart Picks UI (16h)
**Branch:** `feature/smart-picks`
**Path:** `../synapse-smart-picks`

#### Atomic Tasks:
1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/components/campaign/smart-picks/`
   - [ ] Create types: `src/types/smart-picks.types.ts`

2. **Smart Pick Generator Service (6h)**
   - [ ] Create `src/services/campaign/SmartPickGenerator.ts`
   - [ ] Implement `generateSmartPicks(context: DeepContext, campaignType: CampaignType): SmartPick[]`
   - [ ] Logic: Select 3-5 best insight combinations
   - [ ] Score each pick by: relevance, timeliness, evidence quality
   - [ ] Include confidence score (0-1)
   - [ ] Include data sources used
   - [ ] Add preview generation (headline + hook only)
   - [ ] Unit tests for scoring logic

3. **SmartPickCard Component (4h)**
   - [ ] Create `src/components/campaign/smart-picks/SmartPickCard.tsx`
   - [ ] Props: pick, onGenerate, onPreview
   - [ ] Display: Headline, hook preview, confidence badge
   - [ ] Show data sources (icons: weather, reviews, trends, etc.)
   - [ ] "Generate This Campaign" button (primary CTA)
   - [ ] "See Full Preview" button (secondary)
   - [ ] Trust indicators (checkmarks for verified data)
   - [ ] Responsive card design

4. **SmartPicks Component (3h)**
   - [ ] Create `src/components/campaign/smart-picks/SmartPicks.tsx`
   - [ ] Header: "AI-Recommended Campaigns" + explainer
   - [ ] Grid of 3-5 SmartPickCards
   - [ ] Loading state while generating picks
   - [ ] Empty state if no good picks found
   - [ ] "Show me more options" → switches to Content Mixer

5. **Quick Preview Modal (2h)**
   - [ ] Create `src/components/campaign/smart-picks/QuickPreview.tsx`
   - [ ] Shows full content preview for one platform
   - [ ] Platform selector tabs
   - [ ] "Generate Full Campaign" button
   - [ ] Close button

6. **Testing & Integration (30min)**
   - [ ] Test with various DeepContext inputs
   - [ ] Verify picks are relevant
   - [ ] Test generate button flow
   - [ ] Test preview modal
   - [ ] Commit and prepare for merge

---

### Worktree 3: Content Mixer (16h)
**Branch:** `feature/content-mixer`
**Path:** `../synapse-content-mixer`

#### Atomic Tasks:
1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Install `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop
   - [ ] Create directory: `src/components/campaign/content-mixer/`
   - [ ] Create types: `src/types/content-mixer.types.ts`

2. **Insight Pool Component (4h)**
   - [ ] Create `src/components/campaign/content-mixer/InsightPool.tsx`
   - [ ] Categorized tabs: Local, Trending, Seasonal, Industry, Reviews, Competitive
   - [ ] Tab content: List of available insights from DeepContext
   - [ ] Search/filter within each category
   - [ ] "Available: X insights" counter per tab
   - [ ] Responsive sidebar (collapsible on mobile)

3. **Draggable Insight Card (2h)**
   - [ ] Create `src/components/campaign/content-mixer/InsightCard.tsx`
   - [ ] Props: insight, draggable, onRemove (if in selected area)
   - [ ] Display: Icon, title, confidence score, data source
   - [ ] Drag handle indicator
   - [ ] Visual feedback during drag
   - [ ] Compact card design

4. **Selection Area Component (3h)**
   - [ ] Create `src/components/campaign/content-mixer/SelectionArea.tsx`
   - [ ] Drop zone for selected insights
   - [ ] Shows 0-5 selected insights
   - [ ] Drag to reorder selected insights
   - [ ] Remove button per insight
   - [ ] "Clear all" button
   - [ ] Visual indicators (drop zone outline)

5. **Live Preview Component (4h)**
   - [ ] Create `src/components/campaign/content-mixer/LivePreview.tsx`
   - [ ] Generates preview as insights are selected
   - [ ] Shows: Headline, Hook, partial Body
   - [ ] Platform selector (preview for different platforms)
   - [ ] Updates in real-time (debounced 500ms)
   - [ ] Loading state during preview generation
   - [ ] Preview uses existing Synapse generator

6. **Content Mixer Container (2h)**
   - [ ] Create `src/components/campaign/content-mixer/ContentMixer.tsx`
   - [ ] 3-column layout: Pool | Selection | Preview
   - [ ] Responsive: stacked on mobile
   - [ ] "Generate Full Campaign" button (bottom)
   - [ ] Button enabled when 1+ insights selected
   - [ ] Handle drag-and-drop events

7. **Testing & Integration (30min)**
   - [ ] Test drag-and-drop functionality
   - [ ] Test live preview updates
   - [ ] Test on mobile (stacked layout)
   - [ ] Verify preview quality
   - [ ] Commit and prepare for merge

---

### Worktree 4: Campaign Preview/Approval (12h)
**Branch:** `feature/campaign-preview`
**Path:** `../synapse-campaign-preview`

#### Atomic Tasks:
1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/components/campaign/preview/`
   - [ ] Create types: `src/types/campaign-preview.types.ts`

2. **Platform Tab Component (2h)**
   - [ ] Create `src/components/campaign/preview/PlatformTabs.tsx`
   - [ ] Tabs for: LinkedIn, Facebook, Instagram, X, TikTok, YouTube
   - [ ] Show platform logo + name
   - [ ] Active tab indicator
   - [ ] Character count per platform
   - [ ] "Preview" vs "Edit" mode toggle

3. **Campaign Preview Card (3h)**
   - [ ] Create `src/components/campaign/preview/CampaignPreviewCard.tsx`
   - [ ] Props: content, platform, editable
   - [ ] Shows: Headline, Hook, Body, CTA, Hashtags
   - [ ] Visual separator between sections
   - [ ] Character count per section
   - [ ] Warning if over platform limits
   - [ ] Platform-specific preview (simulates social media post)

4. **Edit Section Component (3h)**
   - [ ] Create `src/components/campaign/preview/EditSection.tsx`
   - [ ] Props: section (headline|hook|body|cta), value, onChange
   - [ ] Inline editor (textarea with auto-resize)
   - [ ] "Regenerate" button per section
   - [ ] Uses existing content generators
   - [ ] Shows character count
   - [ ] Save/Cancel buttons

5. **Campaign Preview Container (2h)**
   - [ ] Create `src/components/campaign/preview/CampaignPreview.tsx`
   - [ ] Header: Campaign name, type badge
   - [ ] Platform tabs
   - [ ] Preview card per platform
   - [ ] Footer actions: "Edit", "Approve", "Regenerate All"
   - [ ] Loading states

6. **Approval Workflow (1h)**
   - [ ] "Approve" button confirmation modal
   - [ ] "Are you sure?" with summary
   - [ ] On approve: Mark campaign as ready
   - [ ] Enable "Publish to SocialPilot" button
   - [ ] Save campaign to database

7. **Testing & Integration (30min)**
   - [ ] Test all platforms display correctly
   - [ ] Test edit functionality
   - [ ] Test regenerate sections
   - [ ] Test approval flow
   - [ ] Commit and prepare for merge

---

### Worktree 5: Campaign Orchestration Service (16h)
**Branch:** `feature/campaign-orchestrator`
**Path:** `../synapse-campaign-orchestrator`

#### Atomic Tasks:
1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/services/campaign/`
   - [ ] Create types: `src/types/campaign-workflow.types.ts`

2. **Campaign State Machine (4h)**
   - [ ] Create `src/services/campaign/CampaignState.ts`
   - [ ] States: SELECTING_TYPE → SELECTING_CONTENT → GENERATING → PREVIEWING → APPROVED → PUBLISHED
   - [ ] Transitions with validation
   - [ ] State persistence (save to localStorage + DB)
   - [ ] Error states and recovery
   - [ ] Event emitter for state changes

3. **Campaign Workflow Service (5h)**
   - [ ] Create `src/services/campaign/CampaignWorkflow.ts`
   - [ ] Method: `startCampaign(businessId: string): CampaignSession`
   - [ ] Method: `selectCampaignType(sessionId, type): void`
   - [ ] Method: `selectSmartPick(sessionId, pickId): void`
   - [ ] Method: `selectCustomInsights(sessionId, insights): void`
   - [ ] Method: `generateCampaign(sessionId): Promise<Campaign>`
   - [ ] Method: `approveCampaign(sessionId): void`
   - [ ] Method: `publishCampaign(sessionId, platforms): Promise<void>`
   - [ ] Progress tracking (0-100%)

4. **Campaign Orchestrator (4h)**
   - [ ] Create `src/services/campaign/CampaignOrchestrator.ts`
   - [ ] Integrates: Type Selector → Smart Picks/Mixer → Generator → Preview
   - [ ] Handles data flow between components
   - [ ] Manages campaign session
   - [ ] Error handling and retry logic
   - [ ] Logging for debugging

5. **Campaign Database Service (2h)**
   - [ ] Create `src/services/campaign/CampaignDB.ts`
   - [ ] Save campaign drafts
   - [ ] Save approved campaigns
   - [ ] Load campaign by ID
   - [ ] List campaigns (with filters)
   - [ ] Uses Supabase `campaigns` table

6. **Testing & Integration (30min)**
   - [ ] Test complete workflow end-to-end
   - [ ] Test state transitions
   - [ ] Test error recovery
   - [ ] Test database persistence
   - [ ] Commit and prepare for merge

---

## WEEK 2: Product Intelligence & Visuals (3 Worktrees)

### Worktree 6: Product/Service Scanner (16h)
**Branch:** `feature/product-scanner`
**Path:** `../synapse-product-scanner`

#### Atomic Tasks:
1. **Setup (30min)**
   - [ ] Create worktree from main
   - [ ] Create `src/services/intelligence/product-scanner.service.ts`
   - [ ] Create `src/types/product.types.ts`

2. **Product Extraction Service (6h)**
   - [ ] Method: `scanProducts(websiteContent: string, industry: string): Product[]`
   - [ ] Extract product names from website content
   - [ ] Extract service offerings
   - [ ] Detect pricing information (if available)
   - [ ] Categorize as product vs service
   - [ ] Confidence scoring per item
   - [ ] Uses Claude AI for extraction

3. **Product Categorization (3h)**
   - [ ] Match products to industry standards
   - [ ] Detect product tiers (basic, premium, enterprise)
   - [ ] Identify primary vs secondary offerings
   - [ ] Group related products/services

4. **Database Integration (2h)**
   - [ ] Save to `business_services` table
   - [ ] Link to business profile
   - [ ] Update existing services
   - [ ] Query methods for retrieval

5. **Product Review UI Component (3h)**
   - [ ] Create `src/components/onboarding/ProductReview.tsx`
   - [ ] Display extracted products in grid
   - [ ] Allow user to confirm/edit/remove
   - [ ] Add manual products
   - [ ] Save confirmation

6. **Integration with Onboarding (1h)**
   - [ ] Add step to onboarding wizard
   - [ ] Auto-trigger after industry selection
   - [ ] Pass to UVP wizard

7. **Testing (30min)**
   - [ ] Test extraction accuracy
   - [ ] Test UI workflow
   - [ ] Test database saves
   - [ ] Commit and merge

---

### Worktree 7: UVP Wizard Intelligence Integration (16h)
**Branch:** `feature/uvp-integration`
**Path:** `../synapse-uvp-integration`

#### Atomic Tasks:
1. **Setup (30min)**
   - [ ] Create worktree from main
   - [ ] Review existing UVP wizard code
   - [ ] Plan integration points

2. **Auto-Population Service (4h)**
   - [ ] Create `src/services/uvp/IntelligenceAutoPopulator.ts`
   - [ ] Method: `populateFromIntelligence(context: DeepContext): UVPData`
   - [ ] Extract: target audience, pain points, unique advantages
   - [ ] Extract: value propositions, differentiators
   - [ ] Map intelligence fields to wizard fields
   - [ ] Confidence scoring per field

3. **Wizard Context Updates (3h)**
   - [ ] Modify `src/contexts/UVPWizardContext.tsx`
   - [ ] Add `intelligenceData` field
   - [ ] Add `autoPopulated` flag per field
   - [ ] Method: `applyIntelligence(intelligence: DeepContext)`
   - [ ] Method: `clearAutoPopulated()`
   - [ ] Maintain backward compatibility

4. **Wizard Step Enhancements (5h)**
   - [ ] Update each wizard step component
   - [ ] Show "AI-detected" badge on pre-filled fields
   - [ ] Allow user to edit AI suggestions
   - [ ] "Use AI suggestion" vs "I'll write my own" toggle
   - [ ] Show confidence score for AI suggestions
   - [ ] Highlight high-confidence vs low-confidence

5. **Validation Mode (2h)**
   - [ ] Create validation workflow
   - [ ] User reviews AI findings step-by-step
   - [ ] Accept/Reject/Edit each field
   - [ ] Track what user changed (analytics)
   - [ ] Save validated data

6. **Testing & Integration (1.5h)**
   - [ ] Test with various industries
   - [ ] Test validation workflow
   - [ ] Ensure backward compatibility
   - [ ] Test timing (should be 5 min vs 20 min)
   - [ ] Commit and merge

---

### Worktree 8: Bannerbear Template Integration (16h)
**Branch:** `feature/bannerbear-integration`
**Path:** `../synapse-bannerbear-v2`

#### Atomic Tasks:
1. **Setup (30min)**
   - [ ] Create worktree from main
   - [ ] Install Bannerbear SDK (if needed)
   - [ ] Create `src/services/visuals/`
   - [ ] Create `src/types/visual.types.ts`

2. **Bannerbear Service Enhancement (3h)**
   - [ ] Enhance `src/services/visuals/bannerbear.service.ts`
   - [ ] Method: `createTemplate(type: CampaignType): BannerbearTemplate`
   - [ ] Method: `generateVisual(template, content): Promise<VisualAsset>`
   - [ ] Method: `generateAllPlatforms(content): Promise<VisualAsset[]>`
   - [ ] Error handling and retries
   - [ ] Caching generated visuals

3. **Template Creation (6h)**
   - [ ] Create Bannerbear templates (via Bannerbear dashboard):
     - [ ] Authority Builder template (professional, stats-focused)
     - [ ] Social Proof template (testimonial-style)
     - [ ] Local Pulse template (location-focused)
   - [ ] Define template configs in code
   - [ ] Map content fields to template variables
   - [ ] Create fallback designs (if API fails)

4. **Visual Preview Component (3h)**
   - [ ] Create `src/components/campaign/VisualPreview.tsx`
   - [ ] Props: visual, platform, campaign
   - [ ] Display generated image
   - [ ] Platform-specific aspect ratio
   - [ ] "Regenerate" button
   - [ ] Download button
   - [ ] Loading placeholder

5. **Integration with Campaign Preview (2h)**
   - [ ] Add visual section to campaign preview
   - [ ] Auto-generate visuals when campaign approved
   - [ ] Show visual for each platform
   - [ ] Allow regeneration per platform

6. **Database Storage (1h)**
   - [ ] Save to `generated_visuals` table
   - [ ] Link to campaign
   - [ ] Store Bannerbear IDs for tracking
   - [ ] Query methods

7. **Testing (30min)**
   - [ ] Test template generation
   - [ ] Test visual quality
   - [ ] Test all 3 campaign types
   - [ ] Commit and merge

---

## WEEK 3: Authentication & Billing (2 Worktrees)

### Worktree 9: Enable Authentication (24h)
**Branch:** `feature/auth-enable`
**Path:** `../synapse-auth-enable`

#### Atomic Tasks:
1. **Setup (30min)**
   - [ ] Create worktree from main
   - [ ] Review auth code status
   - [ ] Review database migration

2. **Database Migration (2h)**
   - [ ] Apply migration to Supabase (already written)
   - [ ] Verify all auth tables created
   - [ ] Create admin user: admin@dockeryai.com / admin123
   - [ ] Test admin login
   - [ ] Verify RLS policies work

3. **Enable Auth in App.tsx (4h)**
   - [ ] Uncomment auth wrapper
   - [ ] Uncomment protected routes
   - [ ] Test routing behavior
   - [ ] Fix any TypeScript errors
   - [ ] Fix any runtime errors
   - [ ] Test public vs protected routes

4. **Login/Signup Flow Testing (6h)**
   - [ ] Test signup flow (new user)
   - [ ] Test email verification
   - [ ] Test login flow (existing user)
   - [ ] Test logout
   - [ ] Test password reset
   - [ ] Test session persistence
   - [ ] Test "remember me"
   - [ ] Test session expiry

5. **Protected Route Testing (4h)**
   - [ ] Test all protected pages redirect to login
   - [ ] Test authenticated access works
   - [ ] Test admin-only routes
   - [ ] Test user role permissions
   - [ ] Fix any access control issues

6. **User Session Improvements (5h)**
   - [ ] Add "last active" tracking
   - [ ] Add session timeout warnings
   - [ ] Add "logged in from new device" notifications
   - [ ] Improve session management
   - [ ] Add logout from all devices

7. **Bug Fixes & Polish (2h)**
   - [ ] Fix any discovered bugs
   - [ ] Improve error messages
   - [ ] Add loading states
   - [ ] Test on mobile

8. **Testing (30min)**
   - [ ] Full authentication flow test
   - [ ] Security testing
   - [ ] Commit and merge

---

### Worktree 10: Basic Stripe Billing (16h)
**Branch:** `feature/billing-basic`
**Path:** `../synapse-billing-basic`

**Note:** Start AFTER authentication is enabled

#### Atomic Tasks:
1. **Setup (1h)**
   - [ ] Create worktree from main (after auth merged)
   - [ ] Install Stripe SDK: `npm install @stripe/stripe-js stripe`
   - [ ] Create Stripe account + API keys
   - [ ] Add keys to `.env`
   - [ ] Create directory: `src/services/billing/`

2. **Stripe Service (4h)**
   - [ ] Create `src/services/billing/stripe.service.ts`
   - [ ] Method: `createCheckoutSession(userId, priceId): Promise<Session>`
   - [ ] Method: `createCustomer(user): Promise<Customer>`
   - [ ] Method: `getSubscription(subscriptionId): Promise<Subscription>`
   - [ ] Method: `cancelSubscription(subscriptionId): Promise<void>`
   - [ ] Method: `updatePaymentMethod(customerId, pmId): Promise<void>`
   - [ ] Error handling

3. **Stripe Products & Prices (1h)**
   - [ ] Create product in Stripe dashboard: "Synapse SMB - Basic"
   - [ ] Create price: $99/month recurring
   - [ ] Create test product/price
   - [ ] Document product IDs

4. **Billing Page UI (4h)**
   - [ ] Create `src/pages/BillingPage.tsx`
   - [ ] Show current subscription status
   - [ ] "Upgrade to Pro" button
   - [ ] Payment method display
   - [ ] Billing history table
   - [ ] Cancel subscription button
   - [ ] Responsive design

5. **Subscription Card Component (2h)**
   - [ ] Create `src/components/billing/SubscriptionCard.tsx`
   - [ ] Show: Plan name, price, status
   - [ ] Show: Next billing date
   - [ ] Show: Usage (campaigns generated this month)
   - [ ] "Manage" button

6. **Stripe Webhook Handler (3h)**
   - [ ] Create Supabase Edge Function: `supabase/functions/stripe-webhook/`
   - [ ] Handle events: `checkout.session.completed`
   - [ ] Handle events: `customer.subscription.created`
   - [ ] Handle events: `customer.subscription.updated`
   - [ ] Handle events: `customer.subscription.deleted`
   - [ ] Update user subscription status in DB
   - [ ] Verify webhook signatures

7. **Usage Limits (1h)**
   - [ ] Check subscription status before campaign generation
   - [ ] Enforce: 10 campaigns/month for $99 tier
   - [ ] Show usage counter in UI
   - [ ] Block generation if limit reached
   - [ ] Prompt to upgrade

8. **Testing (30min)**
   - [ ] Test checkout flow (test mode)
   - [ ] Test webhook events
   - [ ] Test usage limits
   - [ ] Test cancellation
   - [ ] Commit and merge

---

## WEEK 4: Content Marketing Features (3 Worktrees)

### Worktree 11: Blog Article Expander UI (16h)
**Branch:** `feature/blog-ui`
**Path:** `../synapse-blog-ui`

#### Atomic Tasks:
1. **Setup (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/components/content/blog/`
   - [ ] Review existing blog generator service

2. **Blog Expander Component (4h)**
   - [ ] Create `src/components/content/blog/BlogExpander.tsx`
   - [ ] Input: Select campaign to expand
   - [ ] Word count selector (500, 1000, 1500, 2000 words)
   - [ ] Tone selector (professional, casual, technical)
   - [ ] "Expand to Blog Article" button
   - [ ] Loading state during generation

3. **Blog Editor Component (5h)**
   - [ ] Create `src/components/content/blog/BlogEditor.tsx`
   - [ ] Rich text editor (using existing or new lib)
   - [ ] Formatting toolbar (bold, italic, lists, links, images)
   - [ ] Live word count
   - [ ] Auto-save to drafts
   - [ ] Full-screen mode

4. **SEO Fields Component (2h)**
   - [ ] Create `src/components/content/blog/SEOFields.tsx`
   - [ ] Meta title input (with character count)
   - [ ] Meta description input (with character count)
   - [ ] Focus keyword input
   - [ ] URL slug input
   - [ ] SEO score indicator

5. **Blog Preview (2h)**
   - [ ] Create `src/components/content/blog/BlogPreview.tsx`
   - [ ] Preview mode toggle
   - [ ] Rendered HTML view
   - [ ] Mobile preview
   - [ ] Desktop preview

6. **Export Functionality (1.5h)**
   - [ ] Export to WordPress (REST API)
   - [ ] Export to Ghost (Admin API)
   - [ ] Export as HTML file
   - [ ] Export as Markdown
   - [ ] Copy to clipboard

7. **Content Calendar Integration (1h)**
   - [ ] Save blog articles to calendar
   - [ ] Link to original campaign
   - [ ] Show in calendar view
   - [ ] Schedule publishing date

8. **Testing (30min)**
   - [ ] Test expansion quality
   - [ ] Test editor functionality
   - [ ] Test exports
   - [ ] Commit and merge

---

### Worktree 12: Landing Page Builder UI (16h)
**Branch:** `feature/landing-ui`
**Path:** `../synapse-landing-ui`

#### Atomic Tasks:
1. **Setup (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/components/landing/`
   - [ ] Review existing landing page generator

2. **Template Selector Component (2h)**
   - [ ] Create `src/components/landing/TemplateSelector.tsx`
   - [ ] 5 templates: Service, Product, Event, Webinar, Download
   - [ ] Template preview thumbnails
   - [ ] Template descriptions
   - [ ] "Use This Template" button

3. **Landing Page Builder (6h)**
   - [ ] Create `src/components/landing/LandingPageBuilder.tsx`
   - [ ] Section editor (Hero, Features, Testimonials, CTA, Footer)
   - [ ] Drag-and-drop section reordering
   - [ ] Edit section content inline
   - [ ] Add/remove sections
   - [ ] Preview mode
   - [ ] Responsive preview (desktop/tablet/mobile)

4. **Form Builder Component (3h)**
   - [ ] Create `src/components/landing/FormBuilder.tsx`
   - [ ] Add form fields: text, email, phone, select, textarea
   - [ ] Reorder fields
   - [ ] Mark required fields
   - [ ] Custom labels and placeholders
   - [ ] Submit button text

5. **Landing Page Preview (2h)**
   - [ ] Create `src/components/landing/LandingPagePreview.tsx`
   - [ ] Full-page preview
   - [ ] Mobile/desktop toggle
   - [ ] Live URL generation
   - [ ] "Publish" button

6. **Form Submission Handling (1.5h)**
   - [ ] Create Edge Function: `supabase/functions/landing-form-submit/`
   - [ ] Save submissions to `landing_page_submissions` table
   - [ ] Send email notification
   - [ ] Return success/error response

7. **Submissions Dashboard (1h)**
   - [ ] Create `src/components/landing/SubmissionsTable.tsx`
   - [ ] List all submissions for a landing page
   - [ ] Export to CSV
   - [ ] Filter by date
   - [ ] Mark as contacted

8. **Testing (30min)**
   - [ ] Test all 5 templates
   - [ ] Test form builder
   - [ ] Test submissions
   - [ ] Commit and merge

---

### Worktree 13: SEO Intelligence Dashboard (16h)
**Branch:** `feature/seo-dashboard`
**Path:** `../synapse-seo-dashboard`

#### Atomic Tasks:
1. **Setup (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/components/seo/`
   - [ ] Create `src/services/seo/`

2. **SEO Analyzer Service (4h)**
   - [ ] Create `src/services/seo/seo-analyzer.service.ts`
   - [ ] Method: `analyzeContent(content: string): SEOScore`
   - [ ] Check: keyword density, title length, meta description
   - [ ] Check: heading structure (H1, H2, H3)
   - [ ] Check: readability score
   - [ ] Check: image alt tags
   - [ ] Check: internal links
   - [ ] Overall score (0-100)

3. **Keyword Analyzer Component (3h)**
   - [ ] Create `src/components/seo/KeywordAnalyzer.tsx`
   - [ ] Input: focus keyword
   - [ ] Show: keyword density (ideal: 1-2%)
   - [ ] Show: keyword in title/meta/H1
   - [ ] Show: related keywords (LSI)
   - [ ] Suggestions to improve

4. **Local SEO Analyzer (3h)**
   - [ ] Create `src/components/seo/LocalSEOAnalyzer.tsx`
   - [ ] Check: location keywords
   - [ ] Check: "near me" optimization
   - [ ] Check: Google My Business data
   - [ ] Check: local schema markup
   - [ ] Suggestions for local SEO

5. **Quick Wins Finder (3h)**
   - [ ] Create `src/components/seo/QuickWinsFinder.tsx`
   - [ ] Integrate SEMrush API
   - [ ] Find: keywords ranking 11-20 (page 2)
   - [ ] Calculate: effort vs reward
   - [ ] Show: actionable improvements
   - [ ] "Optimize for this keyword" button

6. **SEO Dashboard Container (2h)**
   - [ ] Create `src/components/seo/SEODashboard.tsx`
   - [ ] Overall SEO score (large number)
   - [ ] Score breakdown by category
   - [ ] Top 3 issues to fix
   - [ ] Quick wins section
   - [ ] Local SEO section

7. **SEO Suggestions Panel (1h)**
   - [ ] Create `src/components/seo/SEOSuggestions.tsx`
   - [ ] Prioritized list of improvements
   - [ ] "Fix this" buttons
   - [ ] Show before/after score

8. **Testing (30min)**
   - [ ] Test with various content
   - [ ] Test local SEO features
   - [ ] Test quick wins accuracy
   - [ ] Commit and merge

---

## Integration Days (Each Friday)

### Week 1 Integration (4h)
- [ ] Merge Campaign Type Selector
- [ ] Merge Smart Picks UI
- [ ] Merge Content Mixer
- [ ] Merge Campaign Preview
- [ ] Merge Campaign Orchestrator
- [ ] Integration testing
- [ ] Fix merge conflicts (if any)
- [ ] End-to-end test: URL → Campaign Type → Generate → Preview

### Week 2 Integration (4h)
- [ ] Merge Product Scanner
- [ ] Merge UVP Integration
- [ ] Merge Bannerbear Templates
- [ ] Integration testing
- [ ] Test: URL → Products → UVP → Campaign with Visuals

### Week 3 Integration (4h)
- [ ] Merge Auth Enable
- [ ] Merge Billing
- [ ] Integration testing
- [ ] Test: Signup → Subscribe → Generate Campaign

### Week 4 Integration (4h)
- [ ] Merge Blog UI
- [ ] Merge Landing UI
- [ ] Merge SEO Dashboard
- [ ] Integration testing
- [ ] Test: Campaign → Blog → Landing Page → SEO Score

---

## Completion Criteria (Per Worktree)

### Definition of Done:
- [ ] All atomic tasks completed
- [ ] Unit tests pass (if applicable)
- [ ] Integration tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Committed to feature branch
- [ ] Ready to merge to main
- [ ] Documentation updated (if needed)
- [ ] Performance acceptable (<3s load)

---

*Last Updated: 2025-11-15*
*This is a comprehensive task breakdown for all 13 worktrees across 4 weeks*
*Each task is atomic, testable, and can be completed independently*
