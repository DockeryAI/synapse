# V5 Content Engine Build Plan
## "V1 Soul, V5 Data"

### Philosophy
Rebuild V1's proven architecture with modern data sources. Template-first, psychology-gated, constrained creativity.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        V5 CONTENT ENGINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   INPUTS     │    │   ENGINE     │    │   OUTPUTS    │      │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤      │
│  │ • UVP Data   │───▶│ 1. Template  │───▶│ • Content    │      │
│  │ • EQ Score   │    │    Select    │    │ • Score      │      │
│  │ • Industry   │    │ 2. Populate  │    │ • Breakdown  │      │
│  │   Profile    │    │ 3. AI Enhance│    │ • Metadata   │      │
│  │ • Embeddings │    │ 4. Score     │    │              │      │
│  │ • Brand Data │    │ 5. Gate/Retry│    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core Services (Days 1-2)

### 1.1 Template Service
**File:** `src/services/v5/template.service.ts`

```typescript
interface V5Template {
  id: string;
  structure: 'authority' | 'list' | 'announcement' | 'offer' | 'transformation' | 'faq' | 'storytelling' | 'testimonial';
  contentType: 'promotional' | 'educational' | 'community' | 'authority' | 'announcement' | 'engagement';
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
  template: string;  // With {{variables}}
  psychologyTags: {
    primaryTrigger: string;
    secondaryTriggers: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    conversionPotential: number;
  };
  averageSynapseScore: number;
  industryFilters?: string[];  // Optional industry restrictions
}

class TemplateService {
  // Select templates based on:
  // 1. Platform
  // 2. Content type distribution (30% promo, 25% edu, 20% community, etc.)
  // 3. Industry match (from 380 profiles)
  // 4. Psychology alignment with EQ score
  // 5. Historical performance (averageSynapseScore)

  selectTemplate(params: {
    platform: string;
    industry: string;
    eqProfile: EQProfile;
    contentType?: string;
  }): V5Template;

  // Populate template with brand/UVP data
  populateTemplate(template: V5Template, context: GenerationContext): string;
}
```

**Key Insight:** Templates come from TWO sources:
1. Universal templates (like V1) - platform-optimized, structure-based
2. Industry profile templates (from 380 profiles) - `content_templates`, `headline_templates`, `social_post_templates`

### 1.2 Psychology Scoring Service
**File:** `src/services/v5/synapse-scorer.service.ts`

```typescript
interface SynapseScore {
  overall: number;  // 0-100
  breakdown: {
    powerWords: number;      // 20% weight - from industry profile power_words
    emotionalTriggers: number; // 25% weight - mapped to EQ triggers
    readability: number;     // 20% weight - Flesch-Kincaid
    callToAction: number;    // 15% weight - CTA detection
    urgency: number;         // 10% weight - urgency drivers
    trust: number;           // 10% weight - trust signals
  };
  qualityTier: 'excellent' | 'great' | 'good' | 'fair' | 'poor';
  improvementHints: string[];
}

class SynapseScorerService {
  // Power words from industry profile
  private analyzePowerWords(content: string, industryProfile: IndustryProfile): number;

  // Emotional triggers mapped to EQ calculator output
  private analyzeEmotionalTriggers(content: string, eqProfile: EQProfile): number;

  // Standard readability metrics
  private analyzeReadability(content: string): number;

  // CTA detection and strength
  private analyzeCTA(content: string): number;

  // Urgency from customer_triggers in profile
  private analyzeUrgency(content: string, industryProfile: IndustryProfile): number;

  // Trust from industry trust_signals
  private analyzeTrust(content: string, industryProfile: IndustryProfile): number;

  // Generate specific improvement hints for retry
  generateImprovementHints(score: SynapseScore): string[];
}
```

### 1.3 AI Enhancement Service
**File:** `src/services/v5/ai-enhancer.service.ts`

```typescript
interface EnhancementParams {
  baseContent: string;       // Populated template
  platform: string;
  uvp: UVPData;
  eqProfile: EQProfile;
  industryProfile: IndustryProfile;
  improvementHints?: string[];  // From retry
}

class AIEnhancerService {
  private readonly MODEL = 'anthropic/claude-sonnet-4-5-20250514';
  private readonly TEMPERATURE = 0.7;
  private readonly MAX_TOKENS = 500;  // Constrained!

  async enhance(params: EnhancementParams): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(params);
    const userPrompt = this.buildUserPrompt(params);

    return await this.callAI(systemPrompt, userPrompt);
  }

  private buildSystemPrompt(params: EnhancementParams): string {
    // Key elements:
    // 1. Role: "Professional content creator for {industry}"
    // 2. Voice: Use brand voice from UVP
    // 3. Psychology: Use power words from profile
    // 4. Constraints: Platform limits, avoid words
    // 5. EQ alignment: Match emotional temperature
  }

  private buildUserPrompt(params: EnhancementParams): string {
    // Key elements:
    // 1. Base content to enhance
    // 2. UVP context (target customer, transformation, key benefit)
    // 3. Platform constraints
    // 4. Improvement hints (if retry)
    // 5. Output format requirements
  }
}
```

**Critical Constraints (from V1):**
- Temperature: 0.7 (not 0.8)
- Max tokens: 500 (not 2000)
- Model: Sonnet for speed, Opus for quality option

---

## Phase 2: Data Integration (Days 2-3)

### 2.1 Industry Profile Loader
**File:** `src/services/v5/industry-profile.service.ts`

```typescript
class IndustryProfileService {
  // Load from Supabase industry_profiles table (380 profiles)
  async getProfile(industrySlug: string): Promise<IndustryProfile>;

  // Extract psychology elements for scoring
  extractPsychology(profile: IndustryProfile): {
    powerWords: string[];
    avoidWords: string[];
    customerTriggers: CustomerTrigger[];
    trustSignals: string[];
    contentThemes: string[];
  };

  // Extract templates for generation
  extractTemplates(profile: IndustryProfile, platform: string): {
    headlines: HeadlineTemplate[];
    hooks: HookLibrary;
    contentTemplates: ContentTemplate[];
    socialPosts: SocialPostTemplate[];
  };

  // Match industry from UVP or brand data
  matchIndustry(brandData: BrandData): IndustryProfile;
}
```

### 2.2 UVP Data Provider
**File:** `src/services/v5/uvp-provider.service.ts`

```typescript
interface V5UVPContext {
  // Core UVP
  targetCustomer: string;
  transformation: { before: string; after: string };
  uniqueSolution: string;
  keyBenefit: string;
  differentiator: string;

  // Brand voice
  tone: string[];
  values: string[];
  personality: string[];

  // Variables for template population
  businessName: string;
  businessType: string;
  location?: string;
  offers?: string[];

  // From EQ calculator
  emotionalDrivers: string[];
  functionalDrivers: string[];
}

class UVPProviderService {
  // Extract UVP from brand/session
  async getUVP(brandId: string): Promise<V5UVPContext>;

  // Format for template variables
  toTemplateVariables(uvp: V5UVPContext): Record<string, string>;
}
```

### 2.3 EQ Integration
**File:** `src/services/v5/eq-integration.service.ts`

```typescript
interface EQProfile {
  emotionalResonance: number;  // 0-100
  identityAlignment: number;
  urgencySignals: number;
  classification: 'highly-emotional' | 'emotional' | 'balanced' | 'rational' | 'highly-rational';

  // Mapped triggers for scoring
  primaryTriggers: string[];
  secondaryTriggers: string[];

  // Content guidance
  emotionalTemperature: 'warm' | 'neutral' | 'cool';
  recommendedTone: string[];
}

class EQIntegrationService {
  // Get EQ from calculator results
  async getEQProfile(brandId: string): Promise<EQProfile>;

  // Map EQ to V1 psychology dimensions
  mapToScoringDimensions(eq: EQProfile): {
    targetEmotionalTriggers: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    trustImportance: 'low' | 'medium' | 'high';
  };

  // Determine content type distribution based on EQ
  getContentMix(eq: EQProfile): ContentTypeDistribution;
}
```

### 2.4 Embeddings Service
**File:** `src/services/v5/embeddings.service.ts`

```typescript
class EmbeddingsService {
  // Find similar content (for deduplication)
  async findSimilarContent(content: string, brandId: string, threshold?: number): Promise<SimilarContent[]>;

  // Match templates to UVP (semantic template selection)
  async matchTemplates(uvp: V5UVPContext, templates: V5Template[]): Promise<V5Template[]>;

  // Find relevant industry insights
  async findRelevantInsights(topic: string, industryProfile: IndustryProfile): Promise<Insight[]>;
}
```

---

## Phase 3: Orchestration (Days 3-4)

### 3.1 Content Orchestrator
**File:** `src/services/v5/content-orchestrator.ts`

```typescript
interface GenerationRequest {
  brandId: string;
  platform: string;
  contentType?: string;
  count?: number;
}

interface GeneratedContent {
  id: string;
  content: string;
  headline?: string;
  body: string;
  cta?: string;
  hashtags: string[];

  score: SynapseScore;
  qualityRating: 1 | 2 | 3 | 4 | 5;

  metadata: {
    template: string;
    industry: string;
    platform: string;
    model: string;
    attempts: number;
  };
}

class V5ContentOrchestrator {
  private readonly MIN_SCORE = 75;
  private readonly MAX_RETRIES = 2;

  async generate(request: GenerationRequest): Promise<GeneratedContent[]> {
    // 1. Load all context
    const uvp = await this.uvpProvider.getUVP(request.brandId);
    const eq = await this.eqIntegration.getEQProfile(request.brandId);
    const industry = await this.industryProfile.matchIndustry(uvp);

    // 2. Select templates
    const templates = this.templateService.selectTemplates({
      platform: request.platform,
      industry: industry.industry,
      eqProfile: eq,
      count: request.count || 1
    });

    // 3. Generate for each template
    const results: GeneratedContent[] = [];

    for (const template of templates) {
      let content = await this.generateSingle(template, uvp, eq, industry);

      // 4. Score and gate
      let score = this.scorer.score(content, industry, eq);
      let attempts = 1;

      // 5. Retry if below threshold
      while (score.overall < this.MIN_SCORE && attempts < this.MAX_RETRIES) {
        const hints = this.scorer.generateImprovementHints(score);
        content = await this.generateSingle(template, uvp, eq, industry, hints);
        score = this.scorer.score(content, industry, eq);
        attempts++;
      }

      // 6. Check deduplication
      const isDuplicate = await this.embeddings.findSimilarContent(content, request.brandId);
      if (isDuplicate.length > 0 && attempts < this.MAX_RETRIES) {
        // Regenerate with different template
        continue;
      }

      results.push(this.formatResult(content, score, template, attempts));
    }

    return results;
  }

  private async generateSingle(
    template: V5Template,
    uvp: V5UVPContext,
    eq: EQProfile,
    industry: IndustryProfile,
    hints?: string[]
  ): Promise<string> {
    // 1. Populate template with variables
    const populated = this.templateService.populateTemplate(template, {
      ...this.uvpProvider.toTemplateVariables(uvp),
      ...this.industryProfile.extractPsychology(industry)
    });

    // 2. Enhance with AI
    const enhanced = await this.aiEnhancer.enhance({
      baseContent: populated,
      platform: template.platform,
      uvp,
      eqProfile: eq,
      industryProfile: industry,
      improvementHints: hints
    });

    return enhanced;
  }
}
```

---

## Phase 4: API & UI (Days 4-5)

### 4.1 Supabase Edge Function
**File:** `supabase/functions/v5-generate/index.ts`

```typescript
// Simple proxy to OpenRouter with rate limiting
serve(async (req) => {
  const { systemPrompt, userPrompt, model, temperature, maxTokens } = await req.json();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'anthropic/claude-sonnet-4-5-20250514',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 500
    })
  });

  return new Response(JSON.stringify(await response.json()));
});
```

### 4.2 React Hook
**File:** `src/hooks/useV5ContentGeneration.ts`

```typescript
function useV5ContentGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (request: GenerationRequest) => {
    setIsGenerating(true);
    setError(null);

    try {
      const orchestrator = new V5ContentOrchestrator();
      const results = await orchestrator.generate(request);
      setContent(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generate, isGenerating, content, error };
}
```

### 4.3 Simple UI Component
**File:** `src/components/v5/V5ContentPanel.tsx`

```typescript
// Simple, focused UI
// - Platform selector
// - Content type selector (optional)
// - Generate button
// - Results with score visualization
// - Regenerate button for low scores

function V5ContentPanel({ brandId }: { brandId: string }) {
  const { generate, isGenerating, content } = useV5ContentGeneration();
  const [platform, setPlatform] = useState<string>('linkedin');

  return (
    <div>
      <PlatformSelector value={platform} onChange={setPlatform} />

      <Button
        onClick={() => generate({ brandId, platform })}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </Button>

      {content.map(item => (
        <ContentCard key={item.id}>
          <ContentPreview content={item.content} platform={platform} />
          <ScoreDisplay score={item.score} />
          <QualityBadge rating={item.qualityRating} />
        </ContentCard>
      ))}
    </div>
  );
}
```

---

## Phase 5: Template Library (Days 5-6)

### 5.1 Universal Templates
**File:** `src/data/v5/universal-templates.ts`

Port V1 templates + add new ones:

```typescript
export const UNIVERSAL_TEMPLATES: V5Template[] = [
  // AUTHORITY STRUCTURE
  {
    id: 'authority-tips',
    structure: 'authority',
    contentType: 'educational',
    platform: 'linkedin',
    template: `{{number}} things every {{targetCustomer}} should know about {{topic}}:

1. {{tip1}}
2. {{tip2}}
3. {{tip3}}

Which one surprised you most?

{{cta}}`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['authority', 'social'],
      urgencyLevel: 'low',
      conversionPotential: 0.6
    },
    averageSynapseScore: 78
  },

  // TRANSFORMATION STRUCTURE
  {
    id: 'transformation-story',
    structure: 'transformation',
    contentType: 'promotional',
    platform: 'facebook',
    template: `From {{beforeState}} to {{afterState}}.

That's the journey our {{targetCustomer}} take with {{businessName}}.

{{uniqueSolution}}

{{cta}}`,
    psychologyTags: {
      primaryTrigger: 'aspiration',
      secondaryTriggers: ['trust', 'social'],
      urgencyLevel: 'medium',
      conversionPotential: 0.75
    },
    averageSynapseScore: 82
  },

  // ... 50+ more templates across all structures and platforms
];
```

### 5.2 Industry Template Extractor
**File:** `src/services/v5/industry-template-extractor.ts`

```typescript
class IndustryTemplateExtractor {
  // Convert industry profile templates to V5Template format
  extractFromProfile(profile: IndustryProfile, platform: string): V5Template[] {
    const templates: V5Template[] = [];

    // Extract from headline_templates
    if (profile.headline_templates) {
      templates.push(...this.convertHeadlines(profile.headline_templates, platform));
    }

    // Extract from content_templates
    if (profile.content_templates?.[platform]) {
      templates.push(...this.convertContentTemplates(profile.content_templates[platform], platform));
    }

    // Extract from social_post_templates
    if (profile.social_post_templates) {
      templates.push(...this.convertSocialPosts(profile.social_post_templates, platform));
    }

    // Extract from hook_library
    if (profile.hook_library) {
      templates.push(...this.convertHooks(profile.hook_library, platform));
    }

    return templates;
  }
}
```

---

## File Structure

```
src/
├── services/
│   └── v5/
│       ├── index.ts                    # Central exports
│       ├── content-orchestrator.ts     # Main orchestration
│       ├── template.service.ts         # Template selection & population
│       ├── synapse-scorer.service.ts   # Psychology scoring
│       ├── ai-enhancer.service.ts      # AI enhancement
│       ├── industry-profile.service.ts # Industry data
│       ├── uvp-provider.service.ts     # UVP data
│       ├── eq-integration.service.ts   # EQ calculator integration
│       ├── embeddings.service.ts       # Deduplication & matching
│       ├── industry-template-extractor.ts
│       └── types.ts                    # Type definitions
├── data/
│   └── v5/
│       ├── universal-templates.ts      # Platform-agnostic templates
│       └── platform-constraints.ts     # Character limits, formats
├── hooks/
│   └── useV5ContentGeneration.ts       # React hook
├── components/
│   └── v5/
│       ├── V5ContentPanel.tsx          # Main UI
│       ├── ContentCard.tsx
│       ├── ScoreDisplay.tsx
│       └── QualityBadge.tsx
└── pages/
    └── V5ContentPage.tsx               # Route handler

supabase/
└── functions/
    └── v5-generate/
        └── index.ts                    # Edge function
```

---

## Key Differences from V4

| Aspect | V4 | V5 |
|--------|----|----|
| Template usage | Prompts only, AI creates from scratch | Templates first, AI enhances |
| Token limit | 2000 | 500 |
| Temperature | 0.8 | 0.7 |
| Quality gate | None (accept all) | Score ≥75 or retry |
| Scoring focus | Novelty (unexpectedness, virality) | Psychology (power words, emotion, trust) |
| Retry logic | Dedup only | Quality-based with hints |
| Prompt layers | 7 complex layers | 2 simple prompts (system + user) |
| Industry data | Hooks only | Full psychology extraction |
| EQ integration | Score boost | Scoring dimension mapping |

---

## Migration Path

1. **Week 1:** Build core services (template, scorer, enhancer)
2. **Week 2:** Data integration (industry, UVP, EQ, embeddings)
3. **Week 3:** Orchestration and API
4. **Week 4:** UI and testing
5. **Week 5:** Template library expansion
6. **Week 6:** A/B test V4 vs V5, iterate

---

## Success Metrics

- **Score distribution:** 70%+ content scores ≥75 (vs V4's ~50%)
- **Retry rate:** <30% of generations need retry
- **User satisfaction:** Higher "use this" rate in UI
- **Engagement lift:** Compare actual social performance V4 vs V5

---

## Non-Goals

- Complex multi-layer context (keep it simple)
- 30+ prompt templates (universal + industry is enough)
- Batch generation with funnel distribution (add later)
- TikTok scripts / Twitter threads (add later)
- Intelligence integration (trends, competitors) - defer to V6

**Philosophy:** Ship a V1-quality engine first, then layer sophistication back in where it proves valuable.
