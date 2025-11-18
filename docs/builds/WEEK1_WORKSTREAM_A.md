# Week 1 Workstream A: Campaign Generation Pipeline
**Estimated Time:** 26 hours
**Priority:** P0 - BLOCKING
**Worktree:** `campaign-generation`
**Branch:** `feature/campaign-generation-pipeline`

---

## OBJECTIVE
Complete the campaign generation pipeline to enable real content creation from the new onboarding flow.

---

## SETUP INSTRUCTIONS

```bash
# 1. Create worktree
cd /Users/byronhudson/Projects/Synapse
git worktree add worktrees/campaign-generation -b feature/campaign-generation-pipeline

# 2. Navigate to worktree
cd worktrees/campaign-generation

# 3. Install dependencies (if needed)
npm install

# 4. Start dev server
npm run dev
```

---

## CONTEXT FILES TO READ

**Before starting, read these files to understand the system:**

1. `/Users/byronhudson/Projects/Synapse/COMPREHENSIVE_GAP_ANALYSIS_NOV17.md`
   - Section 7: Critical Gaps (Gaps #1, #2, #3)
   - Section 8: What's Actually Working

2. `/Users/byronhudson/Projects/Synapse/src/pages/OnboardingPageV5.tsx`
   - Lines 204-227: The TODO handlers
   - Lines 232-258: Placeholder content function

3. `/Users/byronhudson/Projects/Synapse/src/services/campaign/CampaignOrchestrator.ts`
   - Understand the existing orchestration pattern

4. `/Users/byronhudson/Projects/Synapse/src/services/synapse/generation/SynapseContentGenerator.ts`
   - Understand content generation capabilities

---

## TASK 1: Create CampaignGenerator Service (12 hours)

### File to Create: `src/services/campaign/CampaignGenerator.ts`

**Requirements:**
- Take campaign type ID + refined business data + UVP data
- Generate 7-10 posts per campaign using SynapseContentGenerator
- Integrate with Bannerbear for visual generation
- Save all posts to `content_calendar_items` table
- Return campaign object with all generated posts

**Key Functions:**
```typescript
interface CampaignGenerationInput {
  campaignId: string;
  campaignType: CampaignType;
  businessContext: RefinedBusinessData;
  uvpData: ExtractedUVPData;
  websiteAnalysis: WebsiteMessagingAnalysis;
}

interface GeneratedCampaign {
  id: string;
  campaignType: CampaignType;
  posts: GeneratedPost[];
  totalPosts: number;
  estimatedDuration: number; // days
}

class CampaignGenerator {
  async generateCampaign(input: CampaignGenerationInput): Promise<GeneratedCampaign>
  async generatePost(postType: PostType, context: BusinessContext): Promise<GeneratedPost>
  async generateVisuals(post: GeneratedPost): Promise<string[]>
}
```

**Integration Points:**
- Use `SynapseContentGenerator` for copy generation
- Use `bannerbear.service.ts` for visual generation
- Use `CampaignDB.ts` for saving to database
- Use campaign templates from `campaign-templates.config.ts`

**Database Tables:**
- `content_calendar_items` - Save generated posts
- `campaigns` - Save campaign metadata
- `generated_visuals` - Save Bannerbear visual URLs

---

## TASK 2: Wire SmartSuggestions to CampaignOrchestrator (6 hours)

### Files to Modify:
1. `src/pages/OnboardingPageV5.tsx`
2. `src/services/campaign/CampaignOrchestrator.ts`

### OnboardingPageV5.tsx Changes:

**Update handleCampaignSelected (lines 204-209):**
```typescript
const handleCampaignSelected = async (campaignId: string) => {
  console.log('[OnboardingPageV5] Campaign selected:', campaignId);

  if (!businessData || !websiteAnalysis || !refinedData) {
    setExtractionError('Missing required data for campaign generation');
    return;
  }

  try {
    setCurrentStep('content_generation');
    setIsGenerating(true);

    // Initialize campaign orchestrator
    const orchestrator = new CampaignOrchestrator();
    const session = await orchestrator.initialize({
      businessId: businessData.businessName, // TODO: Use actual brand ID from DB
      context: {
        businessData: refinedData,
        uvpData: businessData.uvpData!,
        websiteAnalysis: websiteAnalysis,
        specialization: businessData.specialization
      }
    });

    // Map campaignId to campaign type
    const campaignType = mapCampaignIdToType(campaignId);
    orchestrator.selectCampaignType(campaignType);

    // Generate campaign
    const campaign = await orchestrator.generateCampaign();

    setGeneratedCampaign(campaign);
    setIsGenerating(false);
    setCurrentStep('content_preview');

  } catch (error) {
    console.error('[OnboardingPageV5] Campaign generation failed:', error);
    setExtractionError(error instanceof Error ? error.message : 'Campaign generation failed');
    setIsGenerating(false);
  }
};
```

**Update handlePostSelected (lines 211-219):**
```typescript
const handlePostSelected = async (postId: string) => {
  console.log('[OnboardingPageV5] Post selected:', postId);

  if (!businessData || !websiteAnalysis || !refinedData) {
    setExtractionError('Missing required data for post generation');
    return;
  }

  try {
    setCurrentStep('content_generation');
    setIsGenerating(true);

    // Map postId to PostType
    const postType = mapPostIdToType(postId);

    // Generate single post using CampaignGenerator
    const generator = new CampaignGenerator();
    const post = await generator.generatePost(postType, {
      businessData: refinedData,
      uvpData: businessData.uvpData!,
      websiteAnalysis: websiteAnalysis,
      specialization: businessData.specialization
    });

    setGeneratedPost(post);
    setIsGenerating(false);
    setCurrentStep('content_preview');

  } catch (error) {
    console.error('[OnboardingPageV5] Post generation failed:', error);
    setExtractionError(error instanceof Error ? error.message : 'Post generation failed');
    setIsGenerating(false);
  }
};
```

**Update handleBuildCustom (lines 222-227):**
```typescript
const handleBuildCustom = () => {
  console.log('[OnboardingPageV5] Building custom content');

  // Navigate to ContentMixer with context
  navigate('/campaign/new', {
    state: {
      businessData: refinedData,
      uvpData: businessData?.uvpData,
      websiteAnalysis: websiteAnalysis,
      source: 'onboarding'
    }
  });
};
```

**Add new state variables:**
```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
```

**Add helper functions:**
```typescript
const mapCampaignIdToType = (campaignId: string): CampaignType => {
  const mapping: Record<string, CampaignType> = {
    'success-stories-campaign': 'trust_builder',
    'service-education-campaign': 'authority_builder',
    'problem-solution-campaign': 'problem_solver',
    'value-launch-campaign': 'differentiator'
  };
  return mapping[campaignId] || 'authority_builder';
};

const mapPostIdToType = (postId: string): PostType => {
  const typeMap: Record<string, PostType> = {
    'post-customer-success': 'customer_success',
    'post-service-spotlight': 'service_spotlight',
    'post-problem-solution': 'problem_solution',
    'post-value-prop': 'value_proposition',
    'post-community': 'community_engagement'
  };
  return typeMap[postId] || 'service_spotlight';
};
```

---

## TASK 3: Replace Placeholders with Real Generation (8 hours)

### Files to Modify:
1. `src/pages/OnboardingPageV5.tsx` (lines 232-258)
2. `src/components/onboarding-v5/ContentPreview.tsx`

### OnboardingPageV5.tsx Changes:

**Remove getContentPlaceholder function** and replace with:
```typescript
const renderContentPreview = () => {
  if (generatedCampaign) {
    return (
      <CampaignPreview
        campaign={generatedCampaign}
        onEdit={(postId) => handleEditPost(postId)}
        onSchedule={() => handleScheduleCampaign()}
        onBack={() => setCurrentStep('suggestions')}
      />
    );
  }

  if (generatedPost) {
    return (
      <SinglePostPreview
        post={generatedPost}
        onEdit={() => handleEditSinglePost()}
        onSchedule={() => handleScheduleSinglePost()}
        onBack={() => setCurrentStep('suggestions')}
      />
    );
  }

  return null;
};
```

**Update content_preview render:**
```typescript
{currentStep === 'content_preview' && (
  isGenerating ? (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Creating Your Content...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Generating {generatedCampaign ? 'campaign posts' : 'your post'} with AI
        </p>
      </div>
    </div>
  ) : (
    renderContentPreview()
  )
)}
```

---

## TASK 4: Add Content Generation Loading State (2 hours)

### File to Create: `src/components/onboarding-v5/GenerationProgress.tsx`

**Component to show:**
- Progress bar for campaign generation
- List of posts being generated (with checkmarks as they complete)
- Estimated time remaining
- "Cancel" option

**Usage in OnboardingPageV5:**
```typescript
{currentStep === 'content_generation' && (
  <GenerationProgress
    totalPosts={generatedCampaign ? 7 : 1}
    completedPosts={generationProgress}
    onCancel={() => setCurrentStep('suggestions')}
  />
)}
```

---

## TASK 5: Update Types (2 hours)

### File to Create: `src/types/campaign-generation.types.ts`

```typescript
export interface GeneratedCampaign {
  id: string;
  campaignType: CampaignType;
  name: string;
  description: string;
  posts: GeneratedPost[];
  totalPosts: number;
  estimatedDuration: number;
  createdAt: Date;
  businessId: string;
}

export interface GeneratedPost {
  id: string;
  type: PostType;
  platform: Platform;
  content: {
    headline?: string;
    body: string;
    hashtags: string[];
    callToAction?: string;
  };
  visuals: {
    url: string;
    type: 'image' | 'video';
    bannerbearTemplateId?: string;
  }[];
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  sources: ContentSource[];
}

export interface ContentSource {
  type: 'website' | 'uvp' | 'insight' | 'template';
  url?: string;
  excerpt?: string;
  confidence: number;
}
```

---

## TESTING CHECKLIST

### Manual Testing:
- [ ] Complete onboarding flow (URL → Insights → Suggestions)
- [ ] Click "Select" on a suggested campaign
- [ ] Verify loading state appears
- [ ] Verify real content generates (not placeholders)
- [ ] Verify visuals generate via Bannerbear
- [ ] Click "Select" on a quick post
- [ ] Verify single post generates
- [ ] Click "Build Custom Campaign"
- [ ] Verify navigation to campaign page with context

### Unit Testing:
- [ ] Test CampaignGenerator.generateCampaign()
- [ ] Test CampaignGenerator.generatePost()
- [ ] Test mapping functions (campaignId → type, postId → type)
- [ ] Test error handling for failed generation

### Integration Testing:
- [ ] Test end-to-end: URL → Campaign → Preview
- [ ] Test database saves (content_calendar_items, campaigns)
- [ ] Test Bannerbear integration
- [ ] Test SynapseContentGenerator integration

---

## MERGE CHECKLIST

Before merging to main:
- [ ] All tests passing
- [ ] Manual testing complete
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] Build succeeds (`npm run build`)
- [ ] Code reviewed (self-review)
- [ ] Documentation updated (if needed)
- [ ] No merge conflicts with main

---

## MERGE COMMAND

```bash
# From main workspace
cd /Users/byronhudson/Projects/Synapse

# Pull latest main
git checkout main
git pull origin main

# Merge feature branch
git merge feature/campaign-generation-pipeline

# Resolve conflicts if any (especially OnboardingPageV5.tsx)

# Test merged code
npm install
npm run build
npm test

# Push to main
git push origin main

# Clean up worktree
git worktree remove worktrees/campaign-generation
git branch -d feature/campaign-generation-pipeline
```

---

## SUCCESS CRITERIA

✅ **Complete when:**
1. Users can click campaign suggestions and get real content
2. Users can click post suggestions and get real single posts
3. Content preview shows actual generated copy (not placeholders)
4. Visuals are generated via Bannerbear
5. All posts saved to database
6. No critical errors in console
7. Build succeeds
8. Manual testing passes

---

## ESTIMATED TIMELINE

- **Day 1 (8h):** Task 1 - CampaignGenerator service (partial)
- **Day 2 (8h):** Task 1 - Complete CampaignGenerator, start Task 2
- **Day 3 (8h):** Task 2 - Wire handlers, Task 3 - Replace placeholders
- **Day 4 (2h):** Task 4 & 5 - Loading state + Types, testing

**Total:** 26 hours over 3-4 days

---

## DEPENDENCIES

**Required APIs/Services:**
- ✅ SynapseContentGenerator (exists)
- ✅ Bannerbear service (exists)
- ✅ CampaignDB (exists)
- ✅ Campaign templates (exists)
- ✅ Supabase tables (exist)

**No blockers - can start immediately**

---

## NOTES

- Focus on Authority Builder and Trust Builder campaign types first
- Ensure all generated content has proper source citations
- Add error handling for API failures (Bannerbear, OpenRouter)
- Log all generation events for debugging
- Consider adding a "Regenerate" button for poor content

---

**STATUS:** Ready to execute
**NEXT:** Execute this build in the campaign-generation worktree
