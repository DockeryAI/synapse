# Worktree 2: Calendar Integration - Complete Build Guide

**Branch:** `feature/calendar-integration`
**Timeline:** Week 1-2 (10 days)
**Estimated Lines:** 800
**Your Role:** Bridge Synapse intelligence to Content Calendar

---

## 📋 QUICK START

You are Claude Instance #2. Your job is to connect the Synapse intelligence engine to the Content Calendar system. Read this entire document, then execute tasks in order.

**Status Tracking:** Update `.buildrunner/features.json` after each task completion.

---

## 🎯 YOUR MISSION

Build the integration layer that transforms Synapse intelligence into calendar-ready content:

1. **Synapse → Calendar Bridge** - Connect intelligence to calendar
2. **Intelligence Data Mapping** - Transform intelligence into content ideas
3. **Enhanced Content Generator** - Improve content quality with intelligence
4. **Intelligence Panel UI** - Display intelligence insights in calendar

**Success Criteria:**
- Intelligence data flows to calendar seamlessly
- Content quality improved with intelligence
- Zero conflicts with other worktrees
- Clean integration tests

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Create Your Worktree

```bash
cd /Users/byronhudson/Projects/Synapse

# Create your worktree
git worktree add ../Synapse-calendar -b feature/calendar-integration

# Navigate to your worktree
cd /Users/byronhudson/Projects/Synapse-calendar

# Verify you're on the right branch
git branch
# Should show: * feature/calendar-integration
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Verify installation
npm run build
# Should complete successfully
```

### Step 3: Read Context Documents

Before starting, read these files in your worktree:
1. `SYNAPSE_PRODUCT_OVERVIEW.md` - Full product vision
2. `SYNAPSE_CALENDAR_BUILD_PLAN.md` - Technical specifications
3. `PARALLEL_BUILD_SUMMARY.md` - Coordination strategy
4. `src/components/content-calendar/` - Existing calendar code

---

## 📝 ATOMIC TASK LIST

**CRITICAL:** Complete tasks in order. Update BuildRunner after each task.

### TASK 1: Synapse → Calendar Bridge Service
**File:** `src/services/synapse-calendar-bridge.service.ts`
**Lines:** ~250
**Status:** ⏸️ Not Started

**Requirements:**
Connect Synapse intelligence to the calendar system by transforming intelligence data into calendar-compatible format.

**Implementation:**
```typescript
export interface BridgeConfig {
  brandId: string;
  intelligenceData: IntelligenceResult[];
  specialty: SpecialtyDetection;
  startDate: Date;
  endDate: Date;
}

export interface CalendarReadyContent {
  contentIdeas: ContentItem[];
  pillars: ContentPillar[];
  opportunities: Opportunity[];
  metadata: {
    intelligenceSources: number;
    specialtyDetected: boolean;
    confidenceScore: number;
  };
}

export class SynapseCalendarBridge {
  async transformIntelligence(
    config: BridgeConfig
  ): Promise<CalendarReadyContent> {
    // 1. Extract content pillars from intelligence
    const pillars = this.extractPillars(config);

    // 2. Generate content ideas (30 items)
    const ideas = this.generateIdeas(config);

    // 3. Detect opportunities from intelligence
    const opportunities = this.detectOpportunities(config);

    return {
      contentIdeas: ideas,
      pillars,
      opportunities,
      metadata: this.buildMetadata(config)
    };
  }

  private extractPillars(config: BridgeConfig): ContentPillar[] {
    // Extract message pillars from specialty and intelligence
    // Example: For wedding bakery:
    // - "Custom Designs" pillar
    // - "Quality Ingredients" pillar
    // - "Customer Stories" pillar
  }

  private generateIdeas(config: BridgeConfig): ContentItem[] {
    // Generate 30 content ideas using:
    // - Specialty detection
    // - Intelligence insights
    // - Buyer personas
    // - Platform optimization
  }

  private detectOpportunities(config: BridgeConfig): Opportunity[] {
    // Find content opportunities:
    // - Weather-based (sunny weekend → outdoor events)
    // - Trending topics (from Serper)
    // - Seasonal events (from calendar data)
    // - Competitor gaps (from competitive intelligence)
  }
}
```

**Dependency Handling:**
Developer 1 is building intelligence services. Use mocks initially:

```typescript
// services/mocks/intelligence.mock.ts
export const intelligenceMock: IntelligenceResult[] = [
  {
    source: 'apify',
    data: { /* sample website data */ },
    success: true,
    duration: 5000
  },
  // ... mock all 16 sources
];

export const specialtyMock: SpecialtyDetection = {
  industry: 'bakery',
  specialty: 'wedding cakes',
  nicheKeywords: ['custom cakes', 'wedding events'],
  targetMarket: 'engaged couples',
  confidence: 85,
  reasoning: 'Website mentions wedding cakes 47 times'
};
```

**Acceptance Criteria:**
- [ ] Transforms intelligence to calendar format
- [ ] Extracts 3-5 content pillars
- [ ] Generates 30 content ideas
- [ ] Detects opportunities
- [ ] Works with mocked intelligence
- [ ] Type-safe implementation

**Git Commit:**
```bash
git add src/services/synapse-calendar-bridge.service.ts
git add src/services/mocks/intelligence.mock.ts
git commit -m "feat(calendar): Add Synapse → Calendar bridge service

- Transform intelligence data to calendar format
- Extract content pillars from specialty
- Generate 30 content ideas
- Detect opportunities from intelligence
- Mock intelligence for independent development"
git push origin feature/calendar-integration
```

**Update BuildRunner:** Set completionPercentage: 25

---

### TASK 2: Intelligence Data Mapping
**File:** `src/services/intelligence-data-mapper.service.ts`
**Lines:** ~200
**Status:** ⏸️ Not Started
**Dependencies:** Bridge Service (Task 1)

**Requirements:**
Map raw intelligence data to structured content insights.

**Implementation:**
```typescript
export interface MappedIntelligence {
  // From Website Analysis
  brandVoice: {
    tone: string;           // "professional" | "casual" | "friendly"
    keywords: string[];     // Most frequent words
    style: string;          // "formal" | "conversational"
  };

  // From Reviews
  customerSentiment: {
    positive: string[];     // "great service", "amazing cakes"
    negative: string[];     // Areas to address
    neutral: string[];
    topMentions: string[];  // Most talked about features
  };

  // From Competitors
  competitiveGaps: {
    theyDo: string[];       // Competitor tactics
    weDont: string[];       // Opportunities
    differentiators: string[]; // Our unique angles
  };

  // From Trends
  trendingTopics: {
    topic: string;
    relevance: number;      // 0-100
    source: string;         // 'serper', 'youtube', etc
  }[];

  // From SEO
  topKeywords: {
    keyword: string;
    volume: number;
    difficulty: number;
  }[];
}

export class IntelligenceDataMapper {
  async mapIntelligence(
    intelligenceResults: IntelligenceResult[]
  ): Promise<MappedIntelligence>;
}
```

**Mapping Logic:**
1. **Brand Voice:** Analyze website text, extract tone indicators
2. **Customer Sentiment:** Parse reviews, categorize feedback
3. **Competitive Gaps:** Compare services, find opportunities
4. **Trending Topics:** Filter trends by relevance to specialty
5. **Top Keywords:** Extract SEO opportunities

**Acceptance Criteria:**
- [ ] Maps all 16 intelligence sources
- [ ] Categorizes insights
- [ ] Filters irrelevant data
- [ ] Scores relevance
- [ ] Comprehensive tests

**Git Commit:**
```bash
git add src/services/intelligence-data-mapper.service.ts
git commit -m "feat(calendar): Add intelligence data mapping service

- Map 16 intelligence sources to structured insights
- Extract brand voice from website analysis
- Parse customer sentiment from reviews
- Identify competitive gaps
- Filter trending topics by relevance"
git push origin feature/calendar-integration
```

**Update BuildRunner:** Set completionPercentage: 50

---

### TASK 3: Enhanced Content Generator
**File:** `src/services/enhanced-content-generator.service.ts`
**Lines:** ~350
**Status:** ⏸️ Not Started
**Dependencies:**
- Data Mapper (Task 2)
- **CRITICAL:** Industry Database (uses 147 industry profiles for optimization)

**Requirements:**
Upgrade existing content generator with intelligence + industry-specific psychology.

**Implementation:**
```typescript
export interface EnhancedGenerationParams {
  topic: string;
  platform: Platform;
  intelligence: MappedIntelligence;
  specialty: SpecialtyDetection;
  mode: 'marba' | 'synapse';
}

export interface EnhancedContentResult {
  variations: ContentVariation[];
  intelligenceUsed: {
    brandVoice: boolean;
    customerInsights: boolean;
    trendingTopics: boolean;
    competitorGaps: boolean;
    industryPowerWords: boolean;    // NEW
    emotionalTriggers: boolean;     // NEW
  };
  qualityScore: number;
  industryBenchmark: number;        // NEW
  improvements: string[];
}

export class EnhancedContentGenerator {
  private supabase = createClient(...)

  async generate(
    params: EnhancedGenerationParams
  ): Promise<EnhancedContentResult> {
    // 0. Fetch industry profile from database
    const industryProfile = await this.getIndustryProfile(
      params.specialty.industryProfileId
    );

    // 1. Use brand voice from intelligence
    const tone = params.intelligence.brandVoice.tone;

    // 2. Incorporate customer language
    const customerWords = params.intelligence.customerSentiment.positive;

    // 3. Reference trending topics
    const trends = params.intelligence.trendingTopics
      .filter(t => t.relevance > 70)
      .map(t => t.topic);

    // 4. Highlight differentiators
    const unique = params.intelligence.competitiveGaps.differentiators;

    // 5. Add industry-specific power words
    const powerWords = industryProfile.power_words;

    // 6. Add emotional triggers
    const emotionalTriggers = industryProfile.psychology_profile.primaryTriggers;

    // 7. Generate with OpenRouter using all optimization data
    const variations = await this.generateWithAI({
      topic: params.topic,
      platform: params.platform,
      tone,
      customerWords,
      trends,
      unique,
      specialty: params.specialty,
      powerWords,              // NEW - from industry profile
      emotionalTriggers,       // NEW - from industry profile
      industryTone: industryProfile.tone_of_voice  // NEW
    });

    return {
      variations,
      intelligenceUsed: this.trackIntelligenceUsage(industryProfile),
      qualityScore: this.calculateQuality(variations),
      industryBenchmark: industryProfile.typical_engagement_rate,
      improvements: this.suggestImprovements(variations)
    };
  }

  private async getIndustryProfile(profileId: string): Promise<IndustryProfile> {
    const { data } = await this.supabase
      .from('industry_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    return data
  }
}
```

**Quality Improvements:**
- Use actual customer language from reviews
- Match brand tone from website
- Reference trending topics naturally
- Highlight unique differentiators
- **Apply industry-specific power words** (from 147 profiles)
- **Use emotional triggers for industry** (psychology_profile)
- **Match industry tone of voice**
- **Benchmark against industry standards**
- Platform-specific formatting

**Acceptance Criteria:**
- [ ] Fetches industry profile from Supabase
- [ ] Uses intelligence in generation
- [ ] Applies industry power words
- [ ] Incorporates emotional triggers
- [ ] Matches industry tone
- [ ] Improves quality vs baseline
- [ ] Tracks intelligence usage (including industry data)
- [ ] Calculates quality score vs industry benchmark
- [ ] Suggests improvements

**Git Commit:**
```bash
git add src/services/enhanced-content-generator.service.ts
git commit -m "feat(calendar): Add enhanced content generator

- Use brand voice from intelligence
- Incorporate customer language from reviews
- Reference trending topics
- Highlight competitive differentiators
- Track intelligence usage in generation"
git push origin feature/calendar-integration
```

**Update BuildRunner:** Set completionPercentage: 75

---

### TASK 4: Intelligence Panel UI Component
**File:** `src/components/calendar/IntelligencePanel.tsx`
**Lines:** ~200
**Status:** ⏸️ Not Started
**Dependencies:** Enhanced Generator (Task 3)

**Requirements:**
Display intelligence insights in the calendar interface to help users understand content recommendations.

**Implementation:**
```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MappedIntelligence } from '@/services/intelligence-data-mapper.service';

interface IntelligencePanelProps {
  intelligence: MappedIntelligence;
  specialty: SpecialtyDetection;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  intelligence,
  specialty
}) => {
  return (
    <div className="space-y-4">
      {/* Specialty Badge */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Detected Specialty</h3>
        <Badge variant="primary">{specialty.specialty}</Badge>
        <p className="text-sm text-muted-foreground mt-2">
          {specialty.reasoning}
        </p>
        <div className="text-xs mt-2">
          Confidence: {specialty.confidence}%
        </div>
      </Card>

      {/* Brand Voice */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Brand Voice</h3>
        <div className="flex gap-2">
          <Badge>{intelligence.brandVoice.tone}</Badge>
          <Badge>{intelligence.brandVoice.style}</Badge>
        </div>
        <p className="text-sm mt-2">
          Top keywords: {intelligence.brandVoice.keywords.slice(0, 5).join(', ')}
        </p>
      </Card>

      {/* Customer Insights */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Customer Insights</h3>
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium">Top Mentions</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {intelligence.customerSentiment.topMentions.map(mention => (
                <Badge key={mention} variant="secondary" className="text-xs">
                  {mention}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Trending Topics */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Trending Topics</h3>
        <ul className="space-y-1">
          {intelligence.trendingTopics
            .filter(t => t.relevance > 70)
            .slice(0, 5)
            .map(topic => (
              <li key={topic.topic} className="text-sm flex items-center gap-2">
                <span className="text-green-500">📈</span>
                <span>{topic.topic}</span>
                <span className="text-xs text-muted-foreground">
                  ({topic.relevance}% relevant)
                </span>
              </li>
            ))}
        </ul>
      </Card>

      {/* Competitive Gaps */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Opportunities</h3>
        <ul className="space-y-1">
          {intelligence.competitiveGaps.differentiators.map(diff => (
            <li key={diff} className="text-sm flex items-center gap-2">
              <span className="text-blue-500">💡</span>
              <span>{diff}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
```

**Features:**
- Display specialty detection results
- Show brand voice analysis
- List customer insights
- Highlight trending topics
- Show competitive opportunities
- Responsive design
- Collapsible sections

**Acceptance Criteria:**
- [ ] Displays all intelligence insights
- [ ] Mobile responsive
- [ ] Accessible (ARIA labels)
- [ ] Smooth animations
- [ ] Integrates with calendar

**Git Commit:**
```bash
git add src/components/calendar/IntelligencePanel.tsx
git commit -m "feat(calendar): Add intelligence panel UI component

- Display specialty detection results
- Show brand voice analysis
- List customer insights from reviews
- Highlight trending topics
- Show competitive opportunities
- Mobile responsive design"
git push origin feature/calendar-integration
```

**Update BuildRunner:** Set completionPercentage: 100

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests

```typescript
// synapse-calendar-bridge.service.test.ts
describe('SynapseCalendarBridge', () => {
  it('should extract pillars from intelligence', () => {
    const pillars = bridge.extractPillars(mockConfig);
    expect(pillars).toHaveLength(3);
    expect(pillars[0].name).toBe('Custom Designs');
  });

  it('should generate 30 content ideas', () => {
    const ideas = bridge.generateIdeas(mockConfig);
    expect(ideas).toHaveLength(30);
  });

  it('should detect opportunities', () => {
    const opportunities = bridge.detectOpportunities(mockConfig);
    expect(opportunities.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
describe('Calendar Integration', () => {
  it('should transform intelligence to calendar', async () => {
    // 1. Use mocked intelligence
    const intelligence = intelligenceMock;
    const specialty = specialtyMock;

    // 2. Transform via bridge
    const calendarData = await bridge.transformIntelligence({
      brandId: 'test',
      intelligenceData: intelligence,
      specialty,
      startDate: new Date(),
      endDate: addDays(new Date(), 30)
    });

    // 3. Verify structure
    expect(calendarData.contentIdeas).toHaveLength(30);
    expect(calendarData.pillars).toHaveLength(3);
    expect(calendarData.metadata.intelligenceSources).toBe(16);
  });
});
```

### Coverage Target: 80%

```bash
npm run test:coverage
# Must show ≥80% coverage
```

---

## ✅ QUALITY GATES

Before pushing any code:

```bash
# TypeScript check
npm run typecheck

# Tests
npm run test

# Coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint
```

---

## 🚫 WHAT NOT TO DO

**DO NOT modify:**
- `services/url-parser.service.ts` (Developer 1)
- `services/parallel-intelligence.service.ts` (Developer 1)
- `services/specialty-detection.service.ts` (Developer 1)
- `services/socialpilot.service.ts` (Developer 3)
- `pages/SynapsePage.tsx` (Developer 4)

**DO modify/create:**
- `services/synapse-calendar-bridge.service.ts` (yours)
- `services/intelligence-data-mapper.service.ts` (yours)
- `services/enhanced-content-generator.service.ts` (yours)
- `components/calendar/IntelligencePanel.tsx` (yours)
- `services/mocks/*` (your mocks)

---

## 📊 PROGRESS TRACKING

### Daily Updates

**9:00 AM:** Post in `#synapse-calendar`:
```
Day X Progress:
- Completed: [task name]
- Today: [task name]
- Blockers: [none/details]
- Completion: X%
```

**5:00 PM:** Push code and update BuildRunner

### BuildRunner Updates

After each task:
```json
{
  "name": "Calendar Integration",
  "status": "in_progress",
  "completionPercentage": 50,  // Update this
  "lastUpdated": "2025-11-XX"
}
```

---

## 🔄 MERGE STRATEGY

**Week 2 End:** Merged after Backend Services (Worktree 1)

**Before merge:**
- [ ] All 4 tasks complete
- [ ] Tests passing (80% coverage)
- [ ] TypeScript strict mode passes
- [ ] Works with mocked backend (until real services merged)
- [ ] Documentation complete

**After Developer 1 merge:**
Replace mocks with real services:
```bash
# Remove mocks
rm src/services/mocks/intelligence.mock.ts

# Update imports
# Change: import { intelligenceMock } from '@/services/mocks/intelligence.mock'
# To: import { ParallelIntelligenceService } from '@/services/parallel-intelligence.service'
```

---

## 📞 GETTING HELP

**Slack Channels:**
- `#synapse-calendar` - Your updates
- `#synapse-blockers` - Urgent help

**Need Backend Services?**
Use mocks until Developer 1 merges (Week 2).

---

## 🎯 SUCCESS CRITERIA

You're done when:
- [ ] All 4 services/components implemented
- [ ] Tests passing (80% coverage)
- [ ] BuildRunner shows 100%
- [ ] Intelligence flows to calendar
- [ ] UI displays insights
- [ ] Ready for merge

**Estimated Time:** 10 days (Week 1-2)

**Your Impact:** You make the calendar intelligent!

---

**Ready to start? Begin with TASK 1: Synapse → Calendar Bridge**

**Good luck! 🚀**
