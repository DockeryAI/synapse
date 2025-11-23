# PHASE 1 - INSTANCE A: INTELLIGENCE PIPELINE
**Duration: 2 Days (16 hours)**
**Branch: `feature/phase1-intelligence-pipeline`**
**Base: `feature/dashboard-v2-week2`**

---

## ⚡ CLAUDE OPTIMIZATION NOTES

**How to use this task list:**
1. Read each task's CONTEXT section first to understand what exists
2. Review the EXAMPLE CODE to see the exact pattern expected
3. Implement following the example structure exactly
4. Verify against the VALIDATION checklist
5. Move to next task only when current task validates

**Quality standards:**
- Follow existing code patterns in the files you modify
- Preserve all TypeScript types strictly
- Match existing styling conventions (Tailwind classes)
- Test incrementally (don't wait until the end)

---

## SETUP & ENVIRONMENT (30 minutes)

### TASK 0.1: Environment Setup

**ACTIONS:**
```bash
cd /Users/byronhudson/Projects/Synapse
git checkout feature/dashboard-v2-week2
git pull origin feature/dashboard-v2-week2
git checkout -b feature/phase1-intelligence-pipeline
npm install
```

**VALIDATION:**
- [ ] On correct branch: `git branch` shows `* feature/phase1-intelligence-pipeline`
- [ ] Clean working directory: `git status` shows no uncommitted changes
- [ ] Dev server runs: `npm run dev` starts without errors

### TASK 0.2: Read Current Implementation

**READ THESE FILES IN ORDER:**
1. `src/services/intelligence/breakthrough-generator.service.ts`
   - Focus on: Lines 200-250 (current 8 title templates)
   - Focus on: `generateBreakthroughs()` method signature
   - Focus on: `Breakthrough` interface export
2. `src/components/dashboard/SmartPicks.tsx`
   - Focus on: Props interface
   - Focus on: Where mock data is defined
3. `src/types/synapse/deepContext.types.ts`
   - Focus on: `DeepContext` interface structure

**VALIDATION:**
- [ ] You can describe the current title template structure
- [ ] You know where SmartPicks gets its data
- [ ] You understand the DeepContext shape

---

## DAY 1: TITLE TEMPLATES & DATA FLOW (8 hours)

### TASK 1.1: Create 50+ Title Template Library (90 minutes)

**CONTEXT:**
Currently `breakthrough-generator.service.ts` has ~8 hardcoded title templates around line 200-250. We need 50+ templates organized by category with smart selection logic.

**LOCATE THIS CODE:**
```typescript
// Current implementation (around line 200)
const titleTemplates = [
  "Customers craving {insight}",
  // ... 7 more templates
];
```

**REPLACE WITH THIS STRUCTURE:**

```typescript
/**
 * Title templates categorized by insight type
 * Each category has 5-15 unique templates for variety
 */
const TITLE_TEMPLATES = {
  customerNeed: [
    "Customers silently craving {insight}",
    "The hidden desire for {insight} your competitors miss",
    "Why {segment} desperately needs {insight}",
    "{segment} secretly wants {insight} but won't ask",
    "Untapped demand for {insight} in {location}",
    "The {insight} gap nobody's filling",
    "{segment} would pay more for {insight}",
    "Customers choosing competitors for {insight}",
    "The {insight} your audience begs for online",
    "{segment} frustrated by lack of {insight}",
    "Emerging appetite for {insight}",
    "What {segment} really means when they say '{quote}'",
    "The {insight} opportunity hiding in reviews",
    "Why customers defect over missing {insight}",
    "Unmet expectations around {insight}"
  ],
  marketTrend: [
    "{industry} shifting toward {insight}",
    "Rising tide of {insight} in {location}",
    "{insight} becoming table stakes in {industry}",
    "Market momentum behind {insight}",
    "The {insight} wave competitors are riding",
    "{industry} leaders betting on {insight}",
    "Accelerating demand for {insight}",
    "{insight} reshaping {industry} expectations",
    "Why {industry} can't ignore {insight} anymore",
    "The {insight} trend reaching {location}",
    "Market validation for {insight} approach",
    "{industry} evolution toward {insight}"
  ],
  competitiveGap: [
    "Competitors neglecting {insight}",
    "The {insight} blindspot across {industry}",
    "Where rivals fail at {insight}",
    "Competitor weakness in {insight} creates opening",
    "{insight} advantage competitors can't copy quickly",
    "Industry-wide failure to deliver {insight}",
    "Exploitable gap in {insight} positioning",
    "Differentiation opportunity through {insight}",
    "The {insight} void in current market",
    "Competitors losing customers over {insight}"
  ],
  emotionalTrigger: [
    "{emotion} driving {segment} decisions",
    "The {emotion} your messaging must tap",
    "Fear of {pain} motivating {segment}",
    "{segment} seeking {aspiration}",
    "Anxiety around {pain} in {segment}",
    "Hope for {aspiration} among {audience}",
    "The {emotion} behind every purchase",
    "Emotional pull of {insight} for {segment}"
  ],
  seasonalTiming: [
    "{event} creating urgency for {insight}",
    "Limited window for {insight} before {timing}",
    "{season} demand spike for {insight}",
    "Time-sensitive {insight} opportunity",
    "{event} amplifying need for {insight}"
  ],
  localCultural: [
    "{location} culture values {insight}",
    "Local preference for {insight} in {location}",
    "{location} community rallying around {insight}",
    "Regional demand for {insight}",
    "{location} identity tied to {insight}"
  ]
} as const;

/**
 * Selects appropriate template based on insight type and content
 * Tracks used templates to ensure uniqueness within a session
 */
function selectTitleTemplate(
  insightType: string,
  content: string,
  usedTemplates: Set<string>
): string {
  // Determine category from insight type
  let categoryKey: keyof typeof TITLE_TEMPLATES = 'marketTrend';

  const lowerType = insightType.toLowerCase();
  if (lowerType.includes('customer') || lowerType.includes('need') || lowerType.includes('unarticulated')) {
    categoryKey = 'customerNeed';
  } else if (lowerType.includes('competition') || lowerType.includes('gap') || lowerType.includes('blindspot')) {
    categoryKey = 'competitiveGap';
  } else if (lowerType.includes('emotional') || lowerType.includes('trigger')) {
    categoryKey = 'emotionalTrigger';
  } else if (lowerType.includes('event') || lowerType.includes('seasonal') || lowerType.includes('timing')) {
    categoryKey = 'seasonalTiming';
  } else if (lowerType.includes('local') || lowerType.includes('cultural')) {
    categoryKey = 'localCultural';
  }

  const templates = TITLE_TEMPLATES[categoryKey];

  // Filter to unused templates
  const availableTemplates = templates.filter(t => !usedTemplates.has(t));

  // If all used, reset and start over
  if (availableTemplates.length === 0) {
    usedTemplates.clear();
    const selected = templates[0];
    usedTemplates.add(selected);
    return selected;
  }

  // Select random from available
  const selected = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
  usedTemplates.add(selected);
  return selected;
}

/**
 * Extracts variables from insight for template interpolation
 */
function extractTemplateVariables(insight: any, context: DeepContext): Record<string, string> {
  // Extract the core insight text
  const insightText = insight.insight || insight.need || insight.trend || insight.topic || 'this opportunity';

  // Truncate if too long for title
  const truncatedInsight = insightText.length > 50
    ? insightText.substring(0, 47) + '...'
    : insightText;

  return {
    insight: truncatedInsight,
    segment: context.business?.profile?.targetAudience || 'customers',
    location: context.business?.profile?.location || 'your area',
    industry: context.business?.profile?.industry || 'your industry',
    emotion: insight.emotionalDriver || insight.emotion || 'desire',
    pain: insight.pain || 'current frustrations',
    aspiration: insight.aspiration || 'better outcomes',
    event: insight.event || 'recent developments',
    timing: insight.timing || 'the opportunity passes',
    season: insight.season || 'this period',
    quote: insight.quote || insight.evidence?.[0] || 'customer feedback',
    audience: context.business?.profile?.targetAudience || 'your audience'
  };
}

/**
 * Interpolates template with variables
 */
function interpolateTemplate(template: string, variables: Record<string, string>): string {
  let result = template;

  // Replace each variable placeholder
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}
```

**VALIDATION:**
- [ ] Template object has 50+ total templates across all categories
- [ ] `selectTitleTemplate` function compiles without errors
- [ ] `extractTemplateVariables` function handles missing fields gracefully
- [ ] `interpolateTemplate` replaces all placeholders

---

### TASK 1.2: Update generateBreakthroughs to Use Templates (45 minutes)

**CONTEXT:**
The `generateBreakthroughs()` method currently generates titles inline. We need to use the new template system.

**FIND THIS METHOD:**
Look for `async generateBreakthroughs(` method in the BreakthroughGeneratorService class.

**MODIFY THE TITLE GENERATION SECTION:**

```typescript
// Inside generateBreakthroughs method, when creating each breakthrough:

// ADD at start of method
const usedTitles = new Set<string>();

// THEN for each breakthrough being created:
const breakthrough: Breakthrough = {
  id: `bt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Use template system for title
  title: (() => {
    const template = selectTitleTemplate(
      insight.type || 'general',
      insight.content || '',
      usedTitles
    );
    const variables = extractTemplateVariables(insight, context);
    return interpolateTemplate(template, variables);
  })(),

  description: insight.description || insight.content || '',
  category: this.categorizeBreakthrough(insight),
  score: this.calculateBreakthroughScore(insight, validation),
  // ... rest of breakthrough properties
};
```

**VALIDATION:**
- [ ] TypeScript compiles without errors
- [ ] Each breakthrough gets a unique title
- [ ] Titles are varied (not repetitive)
- [ ] Variables are interpolated correctly

---

### TASK 1.3: Test Title Generation (15 minutes)

**CREATE A QUICK TEST:**

Run this in your dev console or create a simple test file:

```typescript
// Quick validation test
const testContext = {
  business: {
    profile: {
      name: 'Test Bakery',
      industry: 'food',
      targetAudience: 'busy parents',
      location: 'Seattle'
    }
  }
} as DeepContext;

const testInsights = [
  { type: 'customer-need', content: 'faster morning service', emotionalDriver: 'stress' },
  { type: 'market-trend', content: 'gluten-free demand', industry: 'food' },
  { type: 'competitive-gap', content: 'online ordering', industry: 'bakery' }
];

// Should produce 3 different titles
const breakthroughs = generateBreakthroughs(testContext, [], testInsights);
console.log(breakthroughs.map(bt => bt.title));
// Should see varied, contextual titles
```

**VALIDATION:**
- [ ] Generates 3+ different titles
- [ ] Titles include business context (Seattle, busy parents, etc.)
- [ ] No {placeholder} text remains in titles

---

### TASK 2.1: Transform Breakthroughs for Smart Picks (60 minutes)

**CONTEXT:**
SmartPicks currently uses mock data. We need to accept real breakthroughs and transform them.

**READ FIRST:**
`src/components/dashboard/SmartPicks.tsx` - understand the current recommendation format

**UPDATE THE INTERFACE:**

```typescript
// At top of SmartPicks.tsx
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';

export interface SmartPicksProps {
  context: DeepContext;
  breakthroughs?: Breakthrough[];  // ADD THIS LINE
  onSelectRecommendation?: (rec: any) => void;
}
```

**ADD TRANSFORMATION FUNCTION (before component):**

```typescript
/**
 * Transforms breakthrough into SmartPicks recommendation format
 */
function transformBreakthroughToRecommendation(breakthrough: Breakthrough): Recommendation {
  return {
    id: breakthrough.id,
    title: breakthrough.title,
    description: breakthrough.description,
    type: breakthrough.category === 'urgent' ? 'urgent' : 'opportunity',
    confidence: Math.min(breakthrough.score / 100, 1),

    // Key addition: Provenance showing validation
    metadata: {
      provenance: `Validated by ${breakthrough.validation.totalDataPoints} data points`,
      sources: breakthrough.validation.sourceBreakdown,
      eqScore: breakthrough.emotionalResonance.eqScore,
      urgency: breakthrough.timing.urgency,
      validationStatement: breakthrough.validation.validationStatement
    },

    actionable: breakthrough.actionableNext,
    rawBreakthrough: breakthrough
  };
}
```

**UPDATE COMPONENT TO USE REAL DATA:**

```typescript
export function SmartPicks({ context, breakthroughs, onSelectRecommendation }: SmartPicksProps) {
  // REPLACE mock data with this:
  const recommendations = useMemo(() => {
    if (!breakthroughs || breakthroughs.length === 0) {
      return []; // Empty state, NO mock data
    }

    // Transform top 5 breakthroughs
    return breakthroughs
      .slice(0, 5)
      .map(transformBreakthroughToRecommendation);
  }, [breakthroughs]);

  // Rest of component...
```

**ADD PROVENANCE DISPLAY TO CARDS:**

Find where recommendations are rendered and add:

```typescript
{/* Inside recommendation card rendering */}
<div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
  <Database className="w-3 h-3" />
  <span>{rec.metadata.provenance}</span>
</div>

{rec.metadata.eqScore && (
  <div className="mt-1 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
    <Target className="w-3 h-3" />
    <span>EQ Score: {rec.metadata.eqScore}/10</span>
  </div>
)}
```

**VALIDATION:**
- [ ] SmartPicks accepts `breakthroughs` prop
- [ ] Transformation function creates correct format
- [ ] Provenance displays in UI
- [ ] No mock data remains
- [ ] Empty state shows when no breakthroughs

---

### TASK 2.2: Wire DashboardPage to SmartPicks (30 minutes)

**CONTEXT:**
DashboardPage orchestrates everything. We need to pass breakthroughs to SmartPicks.

**READ FIRST:**
`src/pages/DashboardPage.tsx` - find where orchestration results are stored and where SmartPicks is rendered

**FIND WHERE SmartPicks IS RENDERED:**

```typescript
// Look for something like:
<SmartPicks
  context={deepContext}
  onSelectRecommendation={...}
/>
```

**UPDATE TO PASS BREAKTHROUGHS:**

```typescript
<SmartPicks
  context={deepContext}
  breakthroughs={orchestrationResults?.breakthroughs}  // ADD THIS
  onSelectRecommendation={handleSelectRecommendation}
/>
```

**VERIFY BREAKTHROUGHS EXIST IN ORCHESTRATION:**

Check that `orchestration.service.ts` adds breakthroughs to results. Look for:

```typescript
// In orchestration.service.ts, around Phase 3b
const breakthroughs = await breakthroughGeneratorService.generateBreakthroughs(...);

// Should be added to context or results
return {
  ...context,
  breakthroughs  // Make sure this exists
};
```

**VALIDATION:**
- [ ] DashboardPage passes breakthroughs prop
- [ ] SmartPicks receives breakthroughs from orchestration
- [ ] No TypeScript errors
- [ ] Can see real breakthrough titles in UI (once dev server running)

---

### TASK 3: Enhance Cluster Validation Display (60 minutes)

**CONTEXT:**
IntelligenceInsights already displays clusters, but validation isn't prominent enough.

**READ FIRST:**
`src/components/dashboard/IntelligenceInsights.tsx` - see current cluster display (around line 208-264)

**FIND THE CLUSTER CARD RENDERING:**

```typescript
// Around line 209-262
{topClusters.map((cluster, idx) => (
  <motion.div ... >
```

**ENHANCE VALIDATION DISPLAY:**

```typescript
{topClusters.map((cluster, idx) => (
  <motion.div
    key={cluster.id}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: idx * 0.05 }}
    className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
  >
    {/* Theme */}
    <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
      {cluster.theme}
    </div>

    {/* ENHANCED: Make validation more prominent */}
    <div className="flex items-center gap-2 mb-2">
      <div className="flex items-center gap-1">
        <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
          {cluster.size}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          data points
        </span>
      </div>
      <div className="flex-1 text-right">
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
          {Math.round(cluster.coherence * 100)}% coherence
        </span>
      </div>
    </div>

    {/* Sources */}
    <div className="flex flex-wrap gap-1 mb-2">
      {cluster.sources.slice(0, 3).map((source, i) => (
        <span
          key={i}
          className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700"
        >
          {source}
        </span>
      ))}
      {cluster.sources.length > 3 && (
        <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
          +{cluster.sources.length - 3}
        </span>
      )}
    </div>

    {/* Validation Statement - ADD TOOLTIP */}
    {cluster.validationStatement && (
      <div
        className="text-[10px] text-gray-500 dark:text-gray-500 bg-white dark:bg-slate-900 rounded p-1.5 line-clamp-2 cursor-help"
        title={cluster.validationStatement}
      >
        {cluster.validationStatement}
      </div>
    )}

    {/* Emotional Trigger */}
    {cluster.emotionalTrigger && (
      <div className="mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
        {cluster.emotionalTrigger}
      </div>
    )}
  </motion.div>
))}
```

**VALIDATION:**
- [ ] Cluster cards show larger validation count
- [ ] Coherence percentage visible
- [ ] Tooltip shows full validation statement on hover
- [ ] Visual hierarchy clear (validation is prominent)

---

## DAY 2: CONTENT MULTIPLICATION ENGINE (8 hours)

### TASK 4.1: Create Content Multiplier Service Structure (30 minutes)

**CREATE NEW FILE:**
`src/services/intelligence/content-multiplier.service.ts`

**EXACT STRUCTURE TO USE:**

```typescript
/**
 * Content Multiplication Service
 *
 * Transforms a single breakthrough into a complete content ecosystem:
 * 1. Generates 3-5 unique angles on the insight
 * 2. Creates platform-specific variants (LinkedIn, Instagram, Email, etc.)
 * 3. Builds a weekly content calendar
 *
 * Example: "Customers craving faster service"
 *  → Pain angle: "Are slow checkout times frustrating your customers?"
 *  → Aspiration angle: "Imagine checkout times cut in half"
 *  → Social proof angle: "15 reviews confirm customers want faster service"
 *  → Each angle × 5 platforms = 15+ pieces of content ready to publish
 *
 * Created: 2025-11-23
 */

import type { Breakthrough } from './breakthrough-generator.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ContentAngle {
  id: string;
  angle: string;               // "Customer Pain Point", "Aspirational Outcome", etc.
  perspective: string;         // The specific take on this angle
  hook: string;                // Opening line to grab attention
  cta: string;                 // Call to action
  emotionalTrigger: string;    // "frustration", "hope", "fomo", etc.
}

export interface PlatformVariant {
  platform: 'linkedin' | 'instagram' | 'facebook' | 'email' | 'twitter' | 'blog';
  content: string;
  format: string;              // "text-post", "carousel", "email", etc.
  hashtags?: string[];
  subject?: string;            // For email
  characterCount: number;
}

export interface MultipliedContent {
  breakthroughId: string;
  originalTitle: string;
  angles: ContentAngle[];
  platformVariants: Record<string, PlatformVariant[]>;  // angleId -> variants
  weeklyCalendar: WeeklyContent[];
}

export interface WeeklyContent {
  day: string;
  angleId: string;
  platform: string;
  content: string;
  timeSlot: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ContentMultiplierService {
  /**
   * Main entry point: Multiplies a single breakthrough into full content package
   */
  public multiplyBreakthrough(
    breakthrough: Breakthrough,
    context: DeepContext
  ): MultipliedContent {
    const angles = this.generateAngles(breakthrough, context);
    const platformVariants: Record<string, PlatformVariant[]> = {};

    angles.forEach(angle => {
      platformVariants[angle.id] = this.generatePlatformVariants(angle, breakthrough, context);
    });

    const multipliedContent: MultipliedContent = {
      breakthroughId: breakthrough.id,
      originalTitle: breakthrough.title,
      angles,
      platformVariants,
      weeklyCalendar: []
    };

    multipliedContent.weeklyCalendar = this.generateWeeklyCalendar(multipliedContent);

    return multipliedContent;
  }

  /**
   * Batch multiply multiple breakthroughs
   */
  public multiplyBreakthroughs(
    breakthroughs: Breakthrough[],
    context: DeepContext
  ): MultipliedContent[] {
    return breakthroughs.map(bt => this.multiplyBreakthrough(bt, context));
  }

  // Implementation methods follow...
  private generateAngles(breakthrough: Breakthrough, context: DeepContext): ContentAngle[] {
    // To be implemented
    return [];
  }

  private generatePlatformVariants(angle: ContentAngle, breakthrough: Breakthrough, context: DeepContext): PlatformVariant[] {
    // To be implemented
    return [];
  }

  private generateWeeklyCalendar(multipliedContent: MultipliedContent): WeeklyContent[] {
    // To be implemented
    return [];
  }
}

export const contentMultiplierService = new ContentMultiplierService();
```

**VALIDATION:**
- [ ] File created at correct path
- [ ] TypeScript compiles without errors
- [ ] All types exported
- [ ] Service instantiated and exported

---

### TASK 4.2: Implement Angle Generation (90 minutes)

**CONTEXT:**
Each breakthrough should generate 3-5 unique angles that approach the insight from different perspectives.

**IMPLEMENT `generateAngles` METHOD:**

```typescript
/**
 * Generates 3-5 unique content angles from a breakthrough
 * Each angle approaches the insight from a different psychological perspective
 */
private generateAngles(breakthrough: Breakthrough, context: DeepContext): ContentAngle[] {
  const angles: ContentAngle[] = [];
  const businessName = context.business?.profile?.name || 'we';

  // ANGLE 1: Customer Pain Point (always included)
  angles.push({
    id: `${breakthrough.id}-pain`,
    angle: 'Customer Pain Point',
    perspective: `Focus on the problem: ${breakthrough.description}`,
    hook: this.generatePainHook(breakthrough, context),
    cta: `Learn how ${businessName} solves this`,
    emotionalTrigger: 'frustration'
  });

  // ANGLE 2: Aspirational Outcome (always included)
  angles.push({
    id: `${breakthrough.id}-aspiration`,
    angle: 'Aspirational Outcome',
    perspective: `Show the desired state after addressing: ${breakthrough.title}`,
    hook: this.generateAspirationHook(breakthrough, context),
    cta: 'See what's possible',
    emotionalTrigger: 'hope'
  });

  // ANGLE 3: Social Proof (if enough validation)
  if (breakthrough.validation.totalDataPoints >= 5) {
    angles.push({
      id: `${breakthrough.id}-proof`,
      angle: 'Social Proof',
      perspective: breakthrough.validation.validationStatement,
      hook: this.generateProofHook(breakthrough, context),
      cta: `Join ${breakthrough.validation.totalDataPoints}+ others who discovered this`,
      emotionalTrigger: 'belonging'
    });
  }

  // ANGLE 4: Competitive Advantage (if available)
  if (breakthrough.competitiveContext?.exploitationStrategy) {
    angles.push({
      id: `${breakthrough.id}-competitive`,
      angle: 'Competitive Advantage',
      perspective: breakthrough.competitiveContext.exploitationStrategy,
      hook: this.generateCompetitiveHook(breakthrough, context),
      cta: 'Get what competitors can't offer',
      emotionalTrigger: 'exclusivity'
    });
  }

  // ANGLE 5: Urgency/Timing (if urgent)
  if (breakthrough.timing.urgency) {
    angles.push({
      id: `${breakthrough.id}-urgent`,
      angle: 'Time-Sensitive Opportunity',
      perspective: breakthrough.timing.reason || 'Act now before this opportunity passes',
      hook: this.generateUrgencyHook(breakthrough, context),
      cta: 'Don't miss out',
      emotionalTrigger: 'fomo'
    });
  }

  return angles;
}

// Helper methods for generating hooks
private generatePainHook(bt: Breakthrough, ctx: DeepContext): string {
  const audience = ctx.business?.profile?.targetAudience || 'customers';
  return `Are ${audience} struggling with ${bt.title.toLowerCase()}?`;
}

private generateAspirationHook(bt: Breakthrough, ctx: DeepContext): string {
  return `Imagine ${bt.description.toLowerCase()} — it's closer than you think.`;
}

private generateProofHook(bt: Breakthrough, ctx: DeepContext): string {
  return `${bt.validation.totalDataPoints}+ data points confirm: ${bt.title}`;
}

private generateCompetitiveHook(bt: Breakthrough, ctx: DeepContext): string {
  return `What if you could deliver ${bt.title.toLowerCase()} when competitors can't?`;
}

private generateUrgencyHook(bt: Breakthrough, ctx: DeepContext): string {
  return `${bt.title} — but only ${bt.timing.reason || 'for a limited time'}.`;
}
```

**VALIDATION:**
- [ ] Generates 3-5 angles per breakthrough
- [ ] Each angle has unique perspective
- [ ] Hooks are contextual and engaging
- [ ] Conditional angles only added when criteria met

---

### TASK 4.3: Implement Platform Variants (90 minutes)

**IMPLEMENT `generatePlatformVariants` METHOD:**

```typescript
/**
 * Generates platform-specific content variants for a given angle
 * Adapts tone, length, and format to each platform's best practices
 */
private generatePlatformVariants(
  angle: ContentAngle,
  breakthrough: Breakthrough,
  context: DeepContext
): PlatformVariant[] {
  const businessName = context.business?.profile?.name || 'us';

  return [
    this.createLinkedInVariant(angle, breakthrough, businessName),
    this.createInstagramVariant(angle, breakthrough, businessName),
    this.createFacebookVariant(angle, breakthrough, businessName),
    this.createEmailVariant(angle, breakthrough, businessName),
    this.createTwitterVariant(angle, breakthrough, businessName)
  ];
}

private createLinkedInVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
  const content = `${angle.hook}

${bt.description}

${angle.perspective}

At ${business}, we've noticed this pattern and built our approach around it.

${angle.cta} 👉 [link]

#${bt.category.replace('-', '')} #BusinessInsights #CustomerExperience`;

  return {
    platform: 'linkedin',
    content,
    format: 'text-post',
    hashtags: [bt.category.replace('-', ''), 'BusinessInsights', 'CustomerExperience'],
    characterCount: content.length
  };
}

private createInstagramVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
  // Instagram: Visual-first, shorter text, emoji-friendly
  const content = `✨ ${angle.hook}

${bt.description.substring(0, 100)}${bt.description.length > 100 ? '...' : ''}

${angle.cta} — link in bio 💫

#${bt.category.replace('-', '').toLowerCase()} #localbusiness #community #customerservice`;

  return {
    platform: 'instagram',
    content,
    format: 'carousel-post',
    hashtags: [bt.category.replace('-', '').toLowerCase(), 'localbusiness', 'community', 'customerservice'],
    characterCount: content.length
  };
}

private createFacebookVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
  // Facebook: Conversational, community-focused
  const content = `${angle.hook}

${bt.description}

We're ${business}, and we've built our entire approach around this insight.

${angle.cta} 💡`;

  return {
    platform: 'facebook',
    content,
    format: 'link-post',
    characterCount: content.length
  };
}

private createEmailVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
  // Email: Personal, direct, with clear structure
  const subject = angle.hook.length > 50
    ? angle.hook.substring(0, 47) + '...'
    : angle.hook;

  const content = `Hi there,

${angle.hook}

${bt.description}

${angle.perspective}

${angle.cta} by replying to this email or visiting [link].

Best,
The ${business} Team

P.S. ${bt.validation.validationStatement}`;

  return {
    platform: 'email',
    content,
    format: 'html-email',
    subject,
    characterCount: content.length
  };
}

private createTwitterVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
  // Twitter: Concise, punchy, under 280 characters
  const hook = angle.hook.length > 120 ? angle.hook.substring(0, 117) + '...' : angle.hook;
  const content = `${hook}

${angle.cta}

#${bt.category.replace('-', '')}`.substring(0, 280);

  return {
    platform: 'twitter',
    content,
    format: 'tweet',
    hashtags: [bt.category.replace('-', '')],
    characterCount: content.length
  };
}
```

**VALIDATION:**
- [ ] Each platform has distinct tone and format
- [ ] LinkedIn is professional and detailed
- [ ] Instagram is visual-friendly with emojis
- [ ] Email has subject line and personal tone
- [ ] Twitter is under 280 characters
- [ ] All variants include the CTA

---

### TASK 4.4: Implement Weekly Calendar (45 minutes)

**IMPLEMENT `generateWeeklyCalendar` METHOD:**

```typescript
/**
 * Creates a 7-day content calendar from multiplied content
 * Strategically distributes angles across platforms and days
 */
private generateWeeklyCalendar(multipliedContent: MultipliedContent): WeeklyContent[] {
  const calendar: WeeklyContent[] = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const platforms = ['linkedin', 'instagram', 'facebook', 'email', 'twitter'];

  multipliedContent.angles.forEach((angle, angleIndex) => {
    const dayIndex = angleIndex % days.length;
    const platformIndex = angleIndex % platforms.length;

    const variants = multipliedContent.platformVariants[angle.id];
    if (variants) {
      const variant = variants.find(v => v.platform === platforms[platformIndex]) || variants[0];

      calendar.push({
        day: days[dayIndex],
        angleId: angle.id,
        platform: variant.platform,
        content: variant.content,
        timeSlot: this.getOptimalTimeSlot(variant.platform)
      });
    }
  });

  return calendar;
}

/**
 * Returns optimal posting time for each platform based on research
 */
private getOptimalTimeSlot(platform: string): string {
  const timeSlots: Record<string, string> = {
    linkedin: '9:00 AM',    // Business hours, morning
    instagram: '11:00 AM',  // Late morning engagement peak
    facebook: '1:00 PM',    // Lunch scrolling time
    email: '10:00 AM',      // Mid-morning inbox check
    twitter: '3:00 PM',     // Afternoon engagement
    blog: '8:00 AM'         // Morning reading time
  };
  return timeSlots[platform] || '12:00 PM';
}
```

**VALIDATION:**
- [ ] Calendar has entries for each angle
- [ ] Days and platforms distributed evenly
- [ ] Each entry has optimal time slot
- [ ] Calendar length matches number of angles

---

### TASK 5: Integrate Content Multiplier into Orchestration (45 minutes)

**UPDATE DeepContext TYPES FIRST:**

File: `src/types/synapse/deepContext.types.ts`

```typescript
// Add import at top
import type { MultipliedContent } from '@/services/intelligence/content-multiplier.service';

// Add to DeepContext interface
export interface DeepContext {
  // ... existing fields ...

  multipliedContent?: MultipliedContent[];  // ADD THIS
}
```

**UPDATE ORCHESTRATION SERVICE:**

File: `src/services/intelligence/orchestration.service.ts`

```typescript
// Add import at top
import { contentMultiplierService } from './content-multiplier.service';

// Find where breakthroughs are generated (Phase 3b)
// Add AFTER breakthrough generation:

console.log('Running Phase 3b: Breakthrough generation...');
const breakthroughs = await breakthroughGeneratorService.generateBreakthroughs(
  context,
  clusters,
  connections
);

// ADD: Multiply top breakthroughs into content
console.log('Multiplying breakthroughs into content angles and variants...');
const topBreakthroughs = breakthroughs.slice(0, 7); // Top 7 for weekly calendar
const multipliedContent = contentMultiplierService.multiplyBreakthroughs(
  topBreakthroughs,
  context
);

console.log(`Generated ${multipliedContent.length} multiplied content packages`);
console.log(`Total content pieces: ${multipliedContent.reduce((sum, mc) => sum + Object.keys(mc.platformVariants).length * 5, 0)}`);

// Add to context
context.multipliedContent = multipliedContent;
```

**VALIDATION:**
- [ ] Orchestration imports content multiplier
- [ ] Multiplication runs after breakthrough generation
- [ ] Results added to context
- [ ] Console logs show multiplication happening

---

### TASK 6: Create Content Multiplier UI Component (90 minutes)

**CREATE NEW FILE:**
`src/components/dashboard/intelligence-v2/ContentMultiplier.tsx`

**EXACT STRUCTURE:**

```typescript
/**
 * Content Multiplier Display
 *
 * Shows how 1 breakthrough becomes multiple content pieces:
 * Breakthrough → 3-5 Angles → 5 Platform Variants each → 15-25 ready-to-use pieces
 *
 * Users can:
 * - Expand to see all angles
 * - View platform-specific variants
 * - Copy content to clipboard
 * - See weekly calendar
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Calendar } from 'lucide-react';
import type { MultipliedContent } from '@/services/intelligence/content-multiplier.service';

export interface ContentMultiplierProps {
  multipliedContent: MultipliedContent[];
}

export function ContentMultiplier({ multipliedContent }: ContentMultiplierProps) {
  const [expandedBreakthrough, setExpandedBreakthrough] = useState<string | null>(null);
  const [expandedAngle, setExpandedAngle] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!multipliedContent || multipliedContent.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No multiplied content available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Content Multiplication
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {multipliedContent.length} breakthroughs × 3-5 angles × 5 platforms
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Each breakthrough becomes multiple content pieces ready to publish
      </p>

      {/* Multiplied Content List */}
      <div className="space-y-3">
        {multipliedContent.map(mc => (
          <div
            key={mc.breakthroughId}
            className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
          >
            {/* Breakthrough Header */}
            <button
              onClick={() => setExpandedBreakthrough(
                expandedBreakthrough === mc.breakthroughId ? null : mc.breakthroughId
              )}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white text-left">
                {mc.originalTitle}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {mc.angles.length} angles, {Object.keys(mc.platformVariants).length * 5} pieces
                </span>
                {expandedBreakthrough === mc.breakthroughId ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
              </div>
            </button>

            {/* Expanded Angles */}
            {expandedBreakthrough === mc.breakthroughId && (
              <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                {mc.angles.map(angle => (
                  <div
                    key={angle.id}
                    className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden"
                  >
                    {/* Angle Header */}
                    <button
                      onClick={() => setExpandedAngle(expandedAngle === angle.id ? null : angle.id)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {angle.angle}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {angle.hook}
                        </div>
                      </div>
                      {expandedAngle === angle.id ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded Platform Variants */}
                    {expandedAngle === angle.id && (
                      <div className="border-t border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 p-3 space-y-2">
                        {mc.platformVariants[angle.id]?.map(variant => (
                          <div
                            key={`${angle.id}-${variant.platform}`}
                            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3"
                          >
                            {/* Platform Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
                                  {variant.platform}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {variant.format}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(variant.content, `${angle.id}-${variant.platform}`)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                              >
                                {copiedId === `${angle.id}-${variant.platform}` ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Email Subject (if email) */}
                            {variant.subject && (
                              <div className="mb-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                                <div className="text-xs text-gray-500 mb-1">Subject:</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {variant.subject}
                                </div>
                              </div>
                            )}

                            {/* Content */}
                            <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {variant.content}
                            </div>

                            {/* Hashtags (if any) */}
                            {variant.hashtags && variant.hashtags.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                <div className="flex flex-wrap gap-1">
                                  {variant.hashtags.map(tag => (
                                    <span
                                      key={tag}
                                      className="text-xs text-purple-600 dark:text-purple-400"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Character Count */}
                            <div className="mt-2 text-xs text-gray-500">
                              {variant.characterCount} characters
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Weekly Calendar Preview */}
                {mc.weeklyCalendar && mc.weeklyCalendar.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Weekly Calendar
                    </h4>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {mc.weeklyCalendar.map((day, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded p-1"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {day.day.substring(0, 3)}
                          </div>
                          <div className="text-purple-600 dark:text-purple-400">
                            {day.platform}
                          </div>
                          <div className="text-gray-500">
                            {day.timeSlot}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**VALIDATION:**
- [ ] Component renders without errors
- [ ] Breakthroughs can be expanded
- [ ] Angles can be expanded
- [ ] Platform variants show correctly
- [ ] Copy button works
- [ ] Weekly calendar displays

---

### TASK 7: Integrate ContentMultiplier into PowerMode (30 minutes)

**UPDATE PowerMode.tsx:**

```typescript
// Add import
import { ContentMultiplier } from './ContentMultiplier';

// In the PowerMode component, add after YourMix or as a new bottom section:

{/* Content Multiplication - Bottom Section */}
{context.multipliedContent && context.multipliedContent.length > 0 && (
  <div className="col-span-full mt-6 border-t border-gray-200 dark:border-slate-700 pt-6">
    <ContentMultiplier multipliedContent={context.multipliedContent} />
  </div>
)}
```

**VALIDATION:**
- [ ] ContentMultiplier appears in PowerMode
- [ ] Only shows when multiplied content exists
- [ ] Integrates visually with rest of layout

---

### TASK 8: Testing & Final Validation (60 minutes)

**WRITE UNIT TESTS:**

Create: `src/__tests__/v2/services/content-multiplier.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { contentMultiplierService } from '@/services/intelligence/content-multiplier.service';
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';

describe('ContentMultiplierService', () => {
  const mockBreakthrough: Breakthrough = {
    id: 'bt-test-1',
    title: 'Customers craving faster service',
    description: 'Analysis shows strong demand for speed improvements',
    category: 'urgent',
    score: 85,
    validation: {
      totalDataPoints: 15,
      validationStatement: 'Confirmed by 15 customer reviews mentioning wait times',
      sourceBreakdown: { 'Google Reviews': 15 }
    },
    emotionalResonance: {
      eqScore: 8,
      dominantEmotion: 'frustration',
      triggers: ['waiting', 'slow service']
    },
    timing: {
      urgency: true,
      reason: 'Peak season approaching',
      windowDays: 30
    },
    provenance: 'Generated from customer review clustering',
    actionableNext: 'Highlight speed improvements in messaging'
  } as Breakthrough;

  const mockContext: DeepContext = {
    business: {
      profile: {
        name: 'Test Coffee Shop',
        industry: 'Food & Beverage',
        targetAudience: 'Busy professionals',
        location: 'Seattle, WA'
      }
    }
  } as DeepContext;

  it('generates 3-5 angles from a breakthrough', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    expect(multiplied.angles.length).toBeGreaterThanOrEqual(3);
    expect(multiplied.angles.length).toBeLessThanOrEqual(5);
  });

  it('includes pain and aspiration angles for every breakthrough', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    const hasPain = multiplied.angles.some(a => a.angle === 'Customer Pain Point');
    const hasAspiration = multiplied.angles.some(a => a.angle === 'Aspirational Outcome');

    expect(hasPain).toBe(true);
    expect(hasAspiration).toBe(true);
  });

  it('generates platform variants for each angle', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    multiplied.angles.forEach(angle => {
      const variants = multiplied.platformVariants[angle.id];
      expect(variants).toBeDefined();
      expect(variants.length).toBeGreaterThan(0);

      // Check for key platforms
      const platforms = variants.map(v => v.platform);
      expect(platforms).toContain('linkedin');
      expect(platforms).toContain('instagram');
    });
  });

  it('generates weekly calendar with optimal time slots', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    expect(multiplied.weeklyCalendar.length).toBeGreaterThan(0);

    multiplied.weeklyCalendar.forEach(day => {
      expect(day.day).toBeDefined();
      expect(day.platform).toBeDefined();
      expect(day.timeSlot).toBeDefined();
      expect(day.content).toBeDefined();
    });
  });

  it('creates platform-specific content variations', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);
    const firstAngle = multiplied.angles[0];
    const variants = multiplied.platformVariants[firstAngle.id];

    const linkedIn = variants.find(v => v.platform === 'linkedin');
    const twitter = variants.find(v => v.platform === 'twitter');

    expect(linkedIn).toBeDefined();
    expect(twitter).toBeDefined();

    // LinkedIn should be longer than Twitter
    expect(linkedIn!.characterCount).toBeGreaterThan(twitter!.characterCount);

    // Twitter should be under 280 characters
    expect(twitter!.characterCount).toBeLessThanOrEqual(280);
  });

  it('batch multiplies multiple breakthroughs', () => {
    const breakthroughs = [mockBreakthrough, { ...mockBreakthrough, id: 'bt-test-2' }];
    const multiplied = contentMultiplierService.multiplyBreakthroughs(breakthroughs, mockContext);

    expect(multiplied.length).toBe(2);
    expect(multiplied[0].breakthroughId).toBe('bt-test-1');
    expect(multiplied[1].breakthroughId).toBe('bt-test-2');
  });
});
```

**RUN TESTS:**
```bash
npm test content-multiplier
```

**MANUAL TESTING:**
```bash
npm run dev
```

Visit dashboard and verify:
- [ ] Smart Picks shows real breakthrough titles (varied, not repetitive)
- [ ] Breakthrough titles include business context
- [ ] Provenance visible ("Validated by X data points")
- [ ] Content Multiplier appears in PowerMode
- [ ] Can expand breakthroughs to see angles
- [ ] Can expand angles to see platform variants
- [ ] Copy button works
- [ ] No console errors

---

### TASK 9: Git Commit & Push (30 minutes)

**STAGE AND COMMIT:**

```bash
git add .
git commit -m "feat(phase1-a): Intelligence pipeline with content multiplication

COMPLETED:
✅ Expanded breakthrough title templates from 8 to 50+
✅ Implemented content-based template selection with uniqueness tracking
✅ Wired real breakthroughs to Smart Picks (removed all mock data)
✅ Added provenance display showing validation counts
✅ Enhanced cluster validation prominence in UI
✅ Built content multiplication engine (1 breakthrough → 3-5 angles)
✅ Created platform-specific variants (LinkedIn, Instagram, Facebook, Email, Twitter)
✅ Generated weekly content calendars with optimal posting times
✅ Integrated multiplication into orchestration pipeline
✅ Created ContentMultiplier UI component with expand/collapse
✅ Added copy-to-clipboard functionality
✅ Comprehensive unit tests for content multiplier

DELIVERABLES:
- 50+ title templates categorized by insight type
- Zero mock data in Smart Picks component
- Content multiplication service generating 15-25 pieces per breakthrough
- ContentMultiplier component with full platform variant display
- All tests passing (100% for new code)

FILES ADDED:
- src/services/intelligence/content-multiplier.service.ts (320 lines)
- src/components/dashboard/intelligence-v2/ContentMultiplier.tsx (280 lines)
- src/__tests__/v2/services/content-multiplier.test.ts (120 lines)

FILES MODIFIED:
- src/services/intelligence/breakthrough-generator.service.ts (+150 lines)
- src/services/intelligence/orchestration.service.ts (+15 lines)
- src/components/dashboard/SmartPicks.tsx (+40 lines)
- src/components/dashboard/IntelligenceInsights.tsx (+20 lines)
- src/components/dashboard/intelligence-v2/PowerMode.tsx (+10 lines)
- src/types/synapse/deepContext.types.ts (+2 lines)

HANDOFF TO INSTANCE B:
✅ Breakthrough data structure ready
✅ MultipliedContent types available
✅ Real breakthroughs generating with unique, contextual titles
✅ Ready for visualization integration

Generated with Claude Code"
```

**PUSH BRANCH:**
```bash
git push -u origin feature/phase1-intelligence-pipeline
```

**CREATE PR:**
Go to GitHub and create PR:
- Base: `feature/dashboard-v2-week2`
- Head: `feature/phase1-intelligence-pipeline`
- Title: "Phase 1A: Intelligence Pipeline & Content Multiplication"
- Description: [Paste commit message + add screenshots of Smart Picks showing real data]

**NOTIFY INSTANCE B:**
Post message: "✅ Instance A Day 1 complete. Breakthrough types ready at `feature/phase1-intelligence-pipeline`"

---

## COMPLETION CHECKLIST

### Day 1 Complete
- [ ] 50+ breakthrough title templates implemented
- [ ] Template selection logic working
- [ ] Smart Picks displays real breakthroughs
- [ ] Provenance visible in UI
- [ ] Cluster validation prominent
- [ ] All TypeScript compiles
- [ ] Tests passing

### Day 2 Complete
- [ ] Content multiplication engine complete
- [ ] Generates 3-5 angles per breakthrough
- [ ] Creates platform-specific variants (5 platforms)
- [ ] Weekly calendar generated
- [ ] ContentMultiplier UI component working
- [ ] Integration in PowerMode
- [ ] Unit tests written and passing
- [ ] Manual testing complete
- [ ] Git committed and pushed
- [ ] PR created
- [ ] Instance B notified

### Quality Verification
- [ ] No mock data anywhere in UI
- [ ] Breakthrough titles varied and contextual
- [ ] Content reads naturally (not template-like)
- [ ] Platform variants appropriate for each platform
- [ ] Copy functionality works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Dark mode working

---

**END OF INSTANCE A TASKS - READY FOR INSTANCE B TO START DAY 2**
