# Framework Context Preservation Guide
**Last Updated:** 2025-11-24
**Version:** 2.1.0

---

## 🎯 Overview

This guide documents how marketing framework context is preserved and utilized throughout the Dashboard V2.1 navigation flows. Framework alignment ensures consistent messaging, appropriate template selection, and cohesive campaign development.

---

## 📚 Supported Frameworks

### 1. AIDA (Attention, Interest, Desire, Action)
**Use Case:** Traditional sales funnel, new customer acquisition

**Stages:**
- **Attention:** Capture awareness
- **Interest:** Build engagement
- **Desire:** Create want/need
- **Action:** Drive conversion

**Campaign Templates:**
- Launch Campaign
- Awareness Campaign
- Conversion Campaign

**Context Preservation:**
```typescript
{
  framework: 'AIDA',
  frameworkStage: 'Attention', // or Interest, Desire, Action
  // Passed through navigation state
}
```

---

### 2. Jobs-to-be-Done (JTBD)
**Use Case:** Customer-centric product positioning

**Job Types:**
- **Functional:** Practical tasks to accomplish
- **Emotional:** Feelings to achieve
- **Social:** Image to project

**Campaign Templates:**
- Solution Campaign
- Testimonial Campaign
- Use Case Campaign

**Context Preservation:**
```typescript
{
  framework: 'Jobs-to-be-Done',
  jobType: 'Functional', // or Emotional, Social
  customerJobs: ['job1', 'job2'],
  // Passed through navigation state
}
```

---

### 3. FAB (Features, Advantages, Benefits)
**Use Case:** Product-led marketing, feature launches

**Levels:**
- **Features:** What it is/has
- **Advantages:** How it's better
- **Benefits:** Why it matters

**Campaign Templates:**
- Product Launch
- Feature Announcement
- Comparison Campaign

**Context Preservation:**
```typescript
{
  framework: 'FAB',
  focusLevel: 'Benefits', // or Features, Advantages
  // Passed through navigation state
}
```

---

### 4. PAS (Problem, Agitate, Solution)
**Use Case:** Pain point-driven campaigns

**Sequence:**
- **Problem:** Identify pain
- **Agitate:** Amplify urgency
- **Solution:** Present offering

**Campaign Templates:**
- Pain Point Campaign
- Crisis Management
- Solution Campaign

**Context Preservation:**
```typescript
{
  framework: 'PAS',
  problemType: 'Efficiency', // Domain-specific
  agitationLevel: 'Medium',
  // Passed through navigation state
}
```

---

### 5. Hook-Story-Offer
**Use Case:** Content marketing, storytelling campaigns

**Components:**
- **Hook:** Attention grabber
- **Story:** Emotional narrative
- **Offer:** Call to action

**Campaign Templates:**
- Content Series
- Storytelling Campaign
- Brand Narrative

**Context Preservation:**
```typescript
{
  framework: 'Hook-Story-Offer',
  storyTheme: 'Transformation',
  hookType: 'Provocative', // or Question, Statistic
  // Passed through navigation state
}
```

---

### 6. Value Proposition Canvas
**Use Case:** Customer value alignment, positioning

**Elements:**
- **Customer Jobs:** What they want to accomplish
- **Pains:** Obstacles and frustrations
- **Gains:** Desired outcomes

**Campaign Templates:**
- Value Proposition Campaign
- Customer Journey Campaign
- Retention Campaign

**Context Preservation:**
```typescript
{
  framework: 'Value Proposition Canvas',
  customerJobs: ['job1', 'job2'],
  pains: ['pain1', 'pain2'],
  gains: ['gain1', 'gain2'],
  // Passed through navigation state
}
```

---

## 🔄 Navigation Flow Context

### Flow 1: Individual Insight → Campaign Builder

**Context Passed:**
```typescript
navigate('/campaign/new', {
  state: {
    fromInsight: true,
    insightTitle: 'Customer wants faster checkout',
    insightType: 'pain-point',
    insightCategory: 'customer-pain',
    framework: 'PAS', // Problem-Agitate-Solution
    qualityScore: 87,
    customerSegments: ['e-commerce', 'mobile-first'],
  },
});
```

**Campaign Builder Usage:**
```typescript
const { state } = useLocation();

if (state?.fromInsight) {
  const framework = state.framework; // 'PAS'
  const type = state.insightType;    // 'pain-point'

  // Template pre-selection logic
  if (framework === 'PAS' && type === 'pain-point') {
    selectTemplate('pain-point-campaign');
  }

  // Content generation
  generateCampaignWithFramework(framework, {
    problem: state.insightTitle,
    segments: state.customerSegments,
  });
}
```

**Template Selection:**
- Framework: PAS → Pain Point Campaign template
- Quality Score: 87 → High-quality content generation
- Segments: Pre-populate target audience

---

### Flow 2: Insight Cluster → Campaign Builder

**Context Passed:**
```typescript
navigate('/campaign/new', {
  state: {
    fromCluster: true,
    clusterTheme: 'Mobile-first shopping experience',
    framework: 'Jobs-to-be-Done',
    clusterSize: 7,
    coherence: 82,
    sentiment: 'positive',
    qualityScore: 79,
  },
});
```

**Campaign Builder Usage:**
```typescript
const { state } = useLocation();

if (state?.fromCluster) {
  const framework = state.framework; // 'Jobs-to-be-Done'
  const theme = state.clusterTheme;

  // Template pre-selection logic
  if (framework === 'Jobs-to-be-Done') {
    selectTemplate('solution-campaign');
  }

  // Multi-piece campaign generation
  generateCampaignSeries(framework, {
    theme: theme,
    pieceCount: state.clusterSize, // 7 pieces
    coherence: state.coherence,
  });
}
```

**Template Selection:**
- Framework: JTBD → Solution Campaign template
- Cluster Size: 7 → Generate 7 related content pieces
- Coherence: 82 → Strong narrative arc

---

### Flow 3: Breakthrough → Synapse

**Context Passed:**
```typescript
navigate('/synapse', {
  state: {
    fromBreakthrough: true,
    insightText: 'Gen Z shoppers make decisions in micro-moments',
    framework: 'AIDA',
    qualityScore: {
      total: 91,
      relevance: 95,
      actionability: 88,
      uniqueness: 92,
    },
    whyProfound: 'Reframes customer journey for mobile-first era',
    whyNow: 'Holiday shopping season + mobile commerce growth',
  },
});
```

**Synapse Usage:**
```typescript
const { state } = useLocation();

if (state?.fromBreakthrough) {
  const framework = state.framework; // 'AIDA'
  const insight = state.insightText;

  // Content generation with framework alignment
  generateContent({
    insight: insight,
    framework: framework,
    platforms: ['instagram', 'tiktok'], // Mobile-first
    goal: 'attention', // AIDA first stage
  });

  // Leverage profound reasoning
  if (state.whyProfound) {
    enhanceContent({
      profoundReasoning: state.whyProfound,
      timingJustification: state.whyNow,
    });
  }
}
```

**Content Generation:**
- Framework: AIDA → Attention-grabbing content
- Quality: 91 → Breakthrough-level polish
- Platforms: Mobile-first based on insight
- Timing: Leverage "why now" for urgency

---

## 🎨 Framework Visualization

### Badge Colors
```typescript
const frameworkColors = {
  'AIDA': 'bg-blue-100 text-blue-800',
  'Jobs-to-be-Done': 'bg-green-100 text-green-800',
  'FAB': 'bg-purple-100 text-purple-800',
  'PAS': 'bg-red-100 text-red-800',
  'Hook-Story-Offer': 'bg-amber-100 text-amber-800',
  'Value Proposition Canvas': 'bg-indigo-100 text-indigo-800',
};
```

### Context Banner Display
```typescript
{navigationContext && (
  <Card className="mb-6 border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold">
            Building from {navigationContext.source}
          </h3>
          <p className="text-xs text-gray-600 mt-2">
            Framework: {navigationContext.framework || 'Not specified'}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## 🔧 Implementation Details

### Framework Detection

**Source: Intelligence Synthesis**
```typescript
// content-synthesis.service.ts
const detectFramework = (insight: RawInsight): MarketingFramework => {
  // Analyze insight content
  const keywords = extractKeywords(insight.description);

  // Pattern matching
  if (hasJobsLanguage(keywords)) return 'Jobs-to-be-Done';
  if (hasProblemLanguage(keywords)) return 'PAS';
  if (hasFeatureLanguage(keywords)) return 'FAB';
  if (hasStorytellingLanguage(keywords)) return 'Hook-Story-Offer';
  if (hasValueLanguage(keywords)) return 'Value Proposition Canvas';

  // Default to AIDA for general insights
  return 'AIDA';
};
```

---

### Framework Preservation

**Source: PowerMode Handlers**
```typescript
// PowerMode.tsx - handleInsightCampaign
const handleInsightCampaign = (insight: InsightCard) => {
  navigate('/campaign/new', {
    state: {
      fromInsight: true,
      framework: insight.frameworkUsed, // ✅ Preserved
      // ... other context
    },
  });
};

// PowerMode.tsx - handleClusterCampaign
const handleClusterCampaign = (cluster: InsightCluster) => {
  navigate('/campaign/new', {
    state: {
      fromCluster: true,
      framework: cluster.frameworkUsed, // ✅ Preserved
      // ... other context
    },
  });
};

// PowerMode.tsx - handleGenerateWithSynapse
const handleGenerateWithSynapse = (insight: SynapseInsight) => {
  navigate('/synapse', {
    state: {
      fromBreakthrough: true,
      framework: insight.frameworkUsed, // ✅ Preserved
      // ... other context
    },
  });
};
```

---

### Framework Extraction

**Destination: CampaignBuilderPage**
```typescript
// CampaignBuilderPage.tsx
const navigationContext = React.useMemo(() => {
  const { state } = location;
  if (!state) return null;

  if (state.fromCluster) {
    return {
      source: 'cluster',
      framework: state.framework, // ✅ Extracted
      // ... other context
    };
  }

  if (state.fromInsight) {
    return {
      source: 'insight',
      framework: state.framework, // ✅ Extracted
      // ... other context
    };
  }

  return null;
}, [location]);
```

**Destination: SynapsePage**
```typescript
// SynapsePage.tsx
const breakthroughContext = React.useMemo(() => {
  const { state } = routerLocation;
  if (state?.fromBreakthrough) {
    return {
      framework: state.framework, // ✅ Extracted
      // ... other context
    };
  }
  return null;
}, [routerLocation]);
```

---

## 📊 Framework → Template Mapping

### Template Selection Logic

```typescript
const selectTemplateByFramework = (
  framework: MarketingFramework,
  insightType?: InsightType,
  clusterTheme?: string
): CampaignTemplateId => {

  // PAS Framework
  if (framework === 'PAS') {
    if (insightType === 'pain-point') {
      return 'pain-point-campaign';
    }
    if (clusterTheme?.includes('crisis')) {
      return 'crisis-management';
    }
    return 'solution-campaign';
  }

  // AIDA Framework
  if (framework === 'AIDA') {
    if (insightType === 'awareness') {
      return 'launch-campaign';
    }
    if (insightType === 'conversion') {
      return 'conversion-campaign';
    }
    return 'awareness-campaign';
  }

  // Jobs-to-be-Done Framework
  if (framework === 'Jobs-to-be-Done') {
    if (clusterTheme?.includes('testimonial')) {
      return 'testimonial-campaign';
    }
    return 'solution-campaign';
  }

  // FAB Framework
  if (framework === 'FAB') {
    if (insightType === 'product-feature') {
      return 'product-launch';
    }
    return 'feature-announcement';
  }

  // Hook-Story-Offer Framework
  if (framework === 'Hook-Story-Offer') {
    if (clusterTheme?.includes('brand')) {
      return 'brand-narrative';
    }
    return 'content-series';
  }

  // Value Proposition Canvas
  if (framework === 'Value Proposition Canvas') {
    if (insightType === 'retention') {
      return 'retention-campaign';
    }
    return 'value-proposition-campaign';
  }

  // Default
  return 'standard-campaign';
};
```

---

### Template → Framework Validation

```typescript
const validateTemplateFrameworkAlignment = (
  template: CampaignTemplate,
  framework: MarketingFramework
): boolean => {

  const alignmentMap = {
    'pain-point-campaign': ['PAS', 'Jobs-to-be-Done'],
    'launch-campaign': ['AIDA', 'Hook-Story-Offer'],
    'solution-campaign': ['PAS', 'Jobs-to-be-Done', 'Value Proposition Canvas'],
    'product-launch': ['FAB', 'AIDA'],
    'content-series': ['Hook-Story-Offer', 'AIDA'],
    'retention-campaign': ['Value Proposition Canvas', 'Jobs-to-be-Done'],
  };

  const validFrameworks = alignmentMap[template.id];
  return validFrameworks?.includes(framework) ?? false;
};
```

---

## 🎯 Best Practices

### 1. Framework Consistency

**Do:**
- Use framework from navigation context
- Validate template alignment
- Maintain framework throughout campaign
- Document framework reasoning

**Don't:**
- Override framework without justification
- Mix frameworks within single campaign
- Ignore framework in content generation
- Skip framework validation

---

### 2. Quality Threshold by Framework

**Recommended Minimum Quality Scores:**
- **PAS:** 70+ (problem must be clear)
- **AIDA:** 65+ (attention stage more forgiving)
- **JTBD:** 75+ (customer jobs must be specific)
- **FAB:** 65+ (features can be straightforward)
- **Hook-Story-Offer:** 80+ (story requires depth)
- **Value Prop Canvas:** 75+ (value must be articulated)

---

### 3. Framework Adaptation

**When to adapt:**
- Cluster coherence < 70 (weak pattern)
- Quality score < minimum threshold
- Insight contradicts framework
- Template unavailable for framework

**How to adapt:**
- Use default framework (AIDA)
- Combine compatible frameworks
- Generate custom template
- Warn user of deviation

---

### 4. Framework Metrics

**Track these metrics:**
- Framework detection accuracy
- Template selection rate by framework
- Campaign performance by framework
- Framework switching frequency

**Example Analytics:**
```typescript
const trackFrameworkMetrics = (context: NavigationContext) => {
  analytics.track('framework_preserved', {
    framework: context.framework,
    source: context.source,
    qualityScore: context.qualityScore,
    templateSelected: selectedTemplate.id,
    alignmentValid: validateAlignment(selectedTemplate, context.framework),
  });
};
```

---

## 🔗 Integration Points

### For Template Developers

**Access framework context:**
```typescript
import { useLocation } from 'react-router-dom';

const location = useLocation();
const framework = location.state?.framework;

// Use framework to customize template
if (framework === 'AIDA') {
  // Generate 4-stage campaign (Attention, Interest, Desire, Action)
} else if (framework === 'PAS') {
  // Generate 3-stage campaign (Problem, Agitate, Solution)
}
```

---

### For Content Generators

**Leverage framework for content:**
```typescript
const generateContent = (insight: string, framework: MarketingFramework) => {
  const systemPrompt = getFrameworkPrompt(framework);

  return openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: insight },
    ],
  });
};

const getFrameworkPrompt = (framework: MarketingFramework): string => {
  const prompts = {
    'AIDA': 'Generate content following AIDA framework: Attention, Interest, Desire, Action...',
    'PAS': 'Generate content following PAS framework: Problem, Agitate, Solution...',
    'Jobs-to-be-Done': 'Generate content focusing on customer jobs: functional, emotional, social...',
    // ... other frameworks
  };

  return prompts[framework] || prompts['AIDA'];
};
```

---

### For Analytics Developers

**Track framework performance:**
```typescript
const trackCampaignPerformance = (
  campaignId: string,
  framework: MarketingFramework,
  metrics: CampaignMetrics
) => {
  analytics.track('campaign_performance', {
    campaignId,
    framework,
    engagementRate: metrics.engagement,
    conversionRate: metrics.conversion,
    qualityScore: metrics.quality,
    sourceContext: metrics.sourceContext, // cluster, insight, breakthrough
  });
};
```

---

## 📋 Framework Preservation Checklist

### For Developers

- [ ] Framework extracted from intelligence synthesis
- [ ] Framework passed through navigation state
- [ ] Framework extracted at destination
- [ ] Framework displayed in context banner
- [ ] Framework used for template pre-selection
- [ ] Framework validated for alignment
- [ ] Framework tracked in analytics
- [ ] Framework documented in campaign metadata

### For Users

- [ ] Framework badge visible on insight/cluster cards
- [ ] Framework shows in context banner after navigation
- [ ] Framework influences template options
- [ ] Framework consistent throughout campaign
- [ ] Framework reasoning clear and logical

---

## 🎓 Framework Selection Guide

### Choosing the Right Framework

**AIDA - Use when:**
- New customer acquisition
- Traditional sales funnel
- Broad awareness goals
- General marketing campaigns

**Jobs-to-be-Done - Use when:**
- Customer-centric positioning
- Product-market fit validation
- Use case demonstration
- Customer journey mapping

**FAB - Use when:**
- Product launches
- Feature announcements
- Competitive comparisons
- Technical audiences

**PAS - Use when:**
- Pain point campaigns
- Problem-solving content
- Urgent messaging
- Crisis management

**Hook-Story-Offer - Use when:**
- Content marketing
- Brand storytelling
- Emotional engagement
- Long-form content

**Value Proposition Canvas - Use when:**
- Value communication
- Customer retention
- Positioning refinement
- Value alignment

---

**Version:** 2.1.0
**Last Updated:** 2025-11-24
**Status:** Production Documentation
