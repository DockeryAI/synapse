# Week 1 Claude Instance Prompts

**Instructions:** Give each prompt to a separate Claude Code instance
**Working Directory:** `/Users/byronhudson/Projects/Synapse`
**Timeline:** Each track should complete in 1-2 days
**Integration:** All 5 merge on Friday

---

## PROMPT 1: Campaign Type Selector (Instance 1)

```
You are building the Campaign Type Selector feature for the Synapse SMB Platform. Work autonomously until complete.

CONTEXT:
The Synapse platform has a sophisticated intelligence engine that gathers data from 10 APIs (DeepContext) and generates business insights (Synapse Generator). However, customers cannot currently generate campaigns because the UI workflow is missing. You're building the first step: campaign type selection.

OBJECTIVE:
Build a campaign type selector that lets users choose between 3 campaign types (Authority Builder, Social Proof, Local Pulse) with AI recommendations.

SETUP & ENVIRONMENT:
- Working directory: /Users/byronhudson/Projects/Synapse
- Git repo: Current main branch
- Create worktree: ../synapse-campaign-selector
- Branch: feature/campaign-selector
- Stack: React 18.3, TypeScript 5.2, Tailwind CSS, Vite

STEP 1: CREATE WORKTREE
```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-campaign-selector feature/campaign-selector
cd ../synapse-campaign-selector
npm install
```

STEP 2: CREATE TYPE DEFINITIONS
File: `src/types/campaign.types.ts`

```typescript
export type CampaignType = 'authority-builder' | 'social-proof' | 'local-pulse';

export interface CampaignTypeMetadata {
  id: CampaignType;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  idealFor: string[];
  platforms: string[];
  exampleOutput: {
    headline: string;
    preview: string;
  };
}

export interface CampaignTypeRecommendation {
  type: CampaignType;
  confidence: number; // 0-1
  reasoning: string;
}

export const CAMPAIGN_TYPES: Record<CampaignType, CampaignTypeMetadata> = {
  'authority-builder': {
    id: 'authority-builder',
    name: 'Authority Builder',
    description: 'Establish expertise with industry insights and thought leadership',
    icon: 'GraduationCap',
    idealFor: ['B2B services', 'Consulting', 'Professional services', 'Tech companies'],
    platforms: ['LinkedIn', 'Twitter', 'Blog'],
    exampleOutput: {
      headline: '5 Industry Trends Every [Business Type] Should Know in 2024',
      preview: 'Share cutting-edge insights backed by data...'
    }
  },
  'social-proof': {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'Build trust with customer testimonials and reviews',
    icon: 'Star',
    idealFor: ['Local businesses', 'Service providers', 'Restaurants', 'Retail'],
    platforms: ['Facebook', 'Instagram', 'Google Business'],
    exampleOutput: {
      headline: '"Best [Service] in [City]" - See What Customers Are Saying',
      preview: 'Showcase your 5-star reviews and happy customers...'
    }
  },
  'local-pulse': {
    id: 'local-pulse',
    name: 'Local Pulse',
    description: 'Connect with your community through local events and trends',
    icon: 'MapPin',
    idealFor: ['Local businesses', 'Franchises', 'Community services', 'Events'],
    platforms: ['Facebook', 'Instagram', 'Nextdoor'],
    exampleOutput: {
      headline: '[Local Event] is Coming! Here\'s How We\'re Getting Ready',
      preview: 'Tie your business to local happenings...'
    }
  }
};
```

STEP 3: CREATE RECOMMENDATION SERVICE
File: `src/services/campaign/CampaignRecommender.ts`

```typescript
import type { DeepContext } from '@/types/intelligence.types';
import type { CampaignType, CampaignTypeRecommendation } from '@/types/campaign.types';

export class CampaignRecommender {
  /**
   * Recommend best campaign type based on available intelligence data
   */
  recommendCampaignType(context: DeepContext): CampaignTypeRecommendation {
    const scores = {
      'authority-builder': this.scoreAuthority(context),
      'social-proof': this.scoreSocialProof(context),
      'local-pulse': this.scoreLocalPulse(context)
    };

    // Find highest scoring type
    const sorted = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
    const [type, result] = sorted[0];

    return {
      type: type as CampaignType,
      confidence: result.score,
      reasoning: result.reasoning
    };
  }

  private scoreAuthority(context: DeepContext): { score: number; reasoning: string } {
    let score = 0;
    const reasons: string[] = [];

    // High expertise data from YouTube, industry trends
    if (context.industryTrends?.length > 5) {
      score += 0.3;
      reasons.push('Rich industry trend data available');
    }

    // Business type matters (B2B, consulting, tech)
    const industry = context.businessProfile?.industry.toLowerCase() || '';
    if (industry.includes('consulting') || industry.includes('software') || industry.includes('tech')) {
      score += 0.4;
      reasons.push('Industry benefits from thought leadership');
    }

    // Has competitive intelligence
    if (context.competitiveIntelligence?.blindspots?.length > 0) {
      score += 0.3;
      reasons.push('Can highlight unique expertise vs competitors');
    }

    return {
      score: Math.min(score, 1.0),
      reasoning: reasons.join('. ')
    };
  }

  private scoreSocialProof(context: DeepContext): { score: number; reasoning: string } {
    let score = 0;
    const reasons: string[] = [];

    // Has review data from OutScraper
    const reviewCount = context.competitiveIntelligence?.reviewSummary?.totalReviews || 0;
    if (reviewCount > 10) {
      score += 0.5;
      reasons.push(`${reviewCount} reviews available to showcase`);
    }

    // Has customer psychology triggers (testimonials)
    if (context.customerPsychology?.desires?.length > 0) {
      score += 0.2;
      reasons.push('Customer desire data available');
    }

    // Local business type
    const industry = context.businessProfile?.industry.toLowerCase() || '';
    if (industry.includes('restaurant') || industry.includes('retail') || industry.includes('service')) {
      score += 0.3;
      reasons.push('Local business benefits from social proof');
    }

    return {
      score: Math.min(score, 1.0),
      reasoning: reasons.join('. ')
    };
  }

  private scoreLocalPulse(context: DeepContext): { score: number; reasoning: string } {
    let score = 0;
    const reasons: string[] = [];

    // Has location data
    if (context.businessProfile?.location) {
      score += 0.2;
      reasons.push('Location detected');
    }

    // Has local events from Perplexity
    if ((context.realTimeData?.localEvents?.length || 0) > 0) {
      score += 0.4;
      reasons.push(`${context.realTimeData.localEvents.length} local events found`);
    }

    // Has weather opportunities
    if ((context.realTimeData?.weatherOpportunities?.length || 0) > 0) {
      score += 0.2;
      reasons.push('Weather-based content opportunities');
    }

    // Has seasonal data
    if (context.industryTrends?.seasonality) {
      score += 0.2;
      reasons.push('Seasonal patterns detected');
    }

    return {
      score: Math.min(score, 1.0),
      reasoning: reasons.join('. ')
    };
  }
}
```

STEP 4: CREATE CAMPAIGN TYPE CARD COMPONENT
File: `src/components/campaign/CampaignTypeCard.tsx`

```tsx
import { motion } from 'framer-motion';
import { GraduationCap, Star, MapPin, CheckCircle } from 'lucide-react';
import type { CampaignTypeMetadata } from '@/types/campaign.types';

interface CampaignTypeCardProps {
  type: CampaignTypeMetadata;
  recommended?: boolean;
  selected?: boolean;
  onClick: () => void;
}

const iconMap = {
  GraduationCap,
  Star,
  MapPin
};

export function CampaignTypeCard({ type, recommended, selected, onClick }: CampaignTypeCardProps) {
  const Icon = iconMap[type.icon as keyof typeof iconMap];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      {/* Recommended Badge */}
      {recommended && (
        <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          ✨ Recommended
        </div>
      )}

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-4 right-4">
          <CheckCircle className="w-6 h-6 text-blue-500" />
        </div>
      )}

      {/* Icon */}
      <div className="mb-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {type.name}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
        {type.description}
      </p>

      {/* Ideal For */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-500 mb-2">IDEAL FOR:</p>
        <div className="flex flex-wrap gap-1">
          {type.idealFor.slice(0, 3).map((item, i) => (
            <span key={i} className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-500 mb-2">PLATFORMS:</p>
        <div className="flex gap-1">
          {type.platforms.map((platform, i) => (
            <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              {platform}
            </span>
          ))}
        </div>
      </div>

      {/* Example Output */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-500 mb-2">EXAMPLE:</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {type.exampleOutput.headline}
        </p>
      </div>
    </motion.div>
  );
}
```

STEP 5: CREATE CAMPAIGN TYPE SELECTOR COMPONENT
File: `src/components/campaign/CampaignTypeSelector.tsx`

```tsx
import { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { CampaignTypeCard } from './CampaignTypeCard';
import { CampaignRecommender } from '@/services/campaign/CampaignRecommender';
import { CAMPAIGN_TYPES } from '@/types/campaign.types';
import type { CampaignType } from '@/types/campaign.types';
import type { DeepContext } from '@/types/intelligence.types';

interface CampaignTypeSelectorProps {
  context: DeepContext;
  onSelect: (type: CampaignType) => void;
  selectedType?: CampaignType;
}

export function CampaignTypeSelector({ context, onSelect, selectedType }: CampaignTypeSelectorProps) {
  const [selected, setSelected] = useState<CampaignType | undefined>(selectedType);
  const [recommendation, setRecommendation] = useState<any>(null);

  useEffect(() => {
    // Get AI recommendation
    const recommender = new CampaignRecommender();
    const rec = recommender.recommendCampaignType(context);
    setRecommendation(rec);

    // Auto-select recommended type if none selected
    if (!selected) {
      setSelected(rec.type);
    }
  }, [context]);

  const handleSelect = (type: CampaignType) => {
    setSelected(type);
    onSelect(type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose Your Campaign Type
        </h2>
        <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
          We've analyzed your business data and recommend the best campaign type for you.
          You can choose a different type if you prefer.
        </p>
      </div>

      {/* Recommendation Info */}
      {recommendation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                AI Recommendation ({Math.round(recommendation.confidence * 100)}% confidence)
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {recommendation.reasoning}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(CAMPAIGN_TYPES).map((type) => (
          <CampaignTypeCard
            key={type.id}
            type={type}
            recommended={recommendation?.type === type.id}
            selected={selected === type.id}
            onClick={() => handleSelect(type.id)}
          />
        ))}
      </div>

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue to Content Selection
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

STEP 6: TESTING
Create a test page to verify the component works:
File: `src/pages/TestCampaignSelector.tsx`

```tsx
import { CampaignTypeSelector } from '@/components/campaign/CampaignTypeSelector';
import type { DeepContext } from '@/types/intelligence.types';

// Mock DeepContext for testing
const mockContext: DeepContext = {
  businessProfile: {
    name: 'Test Business',
    industry: 'Restaurant',
    location: {
      city: 'Austin',
      state: 'TX'
    }
  },
  industryTrends: [
    { trend: 'Local food movement', confidence: 0.8 },
    { trend: 'Farm-to-table dining', confidence: 0.9 }
  ],
  competitiveIntelligence: {
    reviewSummary: {
      totalReviews: 45,
      averageRating: 4.5
    }
  },
  realTimeData: {
    localEvents: [
      { name: 'Austin Food Festival', date: '2024-03-15' }
    ]
  }
} as any;

export function TestCampaignSelector() {
  const handleSelect = (type: string) => {
    console.log('Selected type:', type);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <CampaignTypeSelector
        context={mockContext}
        onSelect={handleSelect}
      />
    </div>
  );
}
```

STEP 7: COMMIT & DOCUMENT
```bash
git add .
git commit -m "feat: Add campaign type selector with AI recommendations

- Created campaign type definitions (Authority Builder, Social Proof, Local Pulse)
- Built AI recommender service using DeepContext intelligence
- Created CampaignTypeCard component with visual design
- Created CampaignTypeSelector container component
- Auto-selects recommended type based on business data
- Tested with mock data"
```

STEP 8: VERIFY & REPORT
- Run `npm run dev` and test the component
- Verify TypeScript compiles with no errors
- Verify component renders correctly
- Verify AI recommendation logic works
- Report completion status

COMPLETION CRITERIA:
✅ Worktree created successfully
✅ All type definitions created
✅ Recommender service implemented and tested
✅ CampaignTypeCard component built
✅ CampaignTypeSelector component built
✅ No TypeScript errors
✅ Component renders and functions correctly
✅ AI recommendations work properly
✅ Committed to feature branch
✅ Ready to merge

DO NOT:
- Modify main branch
- Change any existing components
- Modify database schema
- Add new dependencies without justification

WORK AUTONOMOUSLY until all tasks complete. Report progress as you go.
```

---

## PROMPT 2: Smart Picks UI (Instance 2)

```
You are building the Smart Picks UI feature for the Synapse SMB Platform. Work autonomously until complete.

CONTEXT:
The Synapse platform generates breakthrough insights from 10 APIs. After the user selects a campaign type, they need an "easy button" to generate campaigns. Smart Picks is AI-curated campaign suggestions with one-click generation.

OBJECTIVE:
Build a Smart Picks interface that shows 3-5 AI-recommended campaign ideas with trust indicators and one-click generation.

SETUP & ENVIRONMENT:
- Working directory: /Users/byronhudson/Projects/Synapse
- Create worktree: ../synapse-smart-picks
- Branch: feature/smart-picks
- Stack: React 18.3, TypeScript 5.2, Tailwind CSS

STEP 1: CREATE WORKTREE
```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-smart-picks feature/smart-picks
cd ../synapse-smart-picks
npm install
```

STEP 2: CREATE TYPE DEFINITIONS
File: `src/types/smart-picks.types.ts`

```typescript
import type { CampaignType } from './campaign.types';

export interface SmartPick {
  id: string;
  campaignType: CampaignType;
  title: string;
  headline: string;
  hookPreview: string;
  dataSources: DataSource[];
  confidence: number; // 0-1
  relevanceScore: number; // 0-1
  timelinessScore: number; // 0-1
  evidenceQuality: number; // 0-1
  insightIds: string[]; // References to Synapse insights used
}

export interface DataSource {
  name: string;
  icon: 'weather' | 'news' | 'reviews' | 'trends' | 'youtube' | 'reddit' | 'perplexity' | 'semrush';
  verified: boolean;
}
```

STEP 3: CREATE SMART PICK GENERATOR SERVICE
File: `src/services/campaign/SmartPickGenerator.ts`

```typescript
import type { DeepContext } from '@/types/intelligence.types';
import type { CampaignType } from '@/types/campaign.types';
import type { SmartPick, DataSource } from '@/types/smart-picks.types';
import type { BreakthroughInsight } from '@/types/synapse.types';

export class SmartPickGenerator {
  /**
   * Generate 3-5 smart pick recommendations
   */
  async generateSmartPicks(
    context: DeepContext,
    campaignType: CampaignType,
    insights: BreakthroughInsight[]
  ): Promise<SmartPick[]> {
    // Score each insight for this campaign type
    const scored = insights.map(insight => ({
      insight,
      scores: this.scoreInsight(insight, campaignType, context)
    }));

    // Sort by composite score
    const sorted = scored.sort((a, b) => b.scores.composite - a.scores.composite);

    // Take top 3-5
    const topPicks = sorted.slice(0, 5);

    // Convert to SmartPick format
    return topPicks.map(({ insight, scores }) => this.createSmartPick(insight, scores, campaignType, context));
  }

  private scoreInsight(insight: BreakthroughInsight, type: CampaignType, context: DeepContext) {
    const relevance = this.scoreRelevance(insight, type);
    const timeliness = this.scoreTimeliness(insight);
    const evidence = this.scoreEvidence(insight);

    const composite = (relevance * 0.4) + (timeliness * 0.3) + (evidence * 0.3);

    return { relevance, timeliness, evidence, composite };
  }

  private scoreRelevance(insight: BreakthroughInsight, type: CampaignType): number {
    // Authority Builder: prefers industry trends, expertise
    if (type === 'authority-builder') {
      if (insight.psychologyPrinciple === 'AUTHORITY' || insight.type === 'unexpected_connection') {
        return 0.9;
      }
    }

    // Social Proof: prefers reviews, testimonials
    if (type === 'social-proof') {
      if (insight.psychologyPrinciple === 'SOCIAL_PROOF' || insight.dataUsed.includes('reviews')) {
        return 0.9;
      }
    }

    // Local Pulse: prefers local events, weather
    if (type === 'local-pulse') {
      if (insight.dataUsed.includes('weather') || insight.dataUsed.includes('local-events')) {
        return 0.9;
      }
    }

    return 0.5;
  }

  private scoreTimeliness(insight: BreakthroughInsight): number {
    // Check if insight references current events, trends, or seasonal data
    const hasTimingContext = insight.whyNow && insight.whyNow.length > 20;
    const hasRecentData = insight.dataUsed.includes('news') || insight.dataUsed.includes('trends');

    if (hasTimingContext && hasRecentData) return 0.9;
    if (hasTimingContext || hasRecentData) return 0.7;
    return 0.5;
  }

  private scoreEvidence(insight: BreakthroughInsight): number {
    const evidenceCount = insight.evidence?.length || 0;
    const hasProvenance = insight.provenance?.rawDataSources?.length > 0;

    if (evidenceCount >= 3 && hasProvenance) return 0.9;
    if (evidenceCount >= 2) return 0.7;
    if (evidenceCount >= 1) return 0.5;
    return 0.3;
  }

  private createSmartPick(
    insight: BreakthroughInsight,
    scores: any,
    type: CampaignType,
    context: DeepContext
  ): SmartPick {
    return {
      id: `pick-${insight.id}`,
      campaignType: type,
      title: insight.title,
      headline: insight.contentAngle || insight.insight,
      hookPreview: insight.whyProfound || insight.insight.substring(0, 150),
      dataSources: this.extractDataSources(insight),
      confidence: insight.confidence,
      relevanceScore: scores.relevance,
      timelinessScore: scores.timeliness,
      evidenceQuality: scores.evidence,
      insightIds: [insight.id]
    };
  }

  private extractDataSources(insight: BreakthroughInsight): DataSource[] {
    const sources: DataSource[] = [];

    if (insight.dataUsed.includes('weather')) {
      sources.push({ name: 'Weather', icon: 'weather', verified: true });
    }
    if (insight.dataUsed.includes('news')) {
      sources.push({ name: 'News', icon: 'news', verified: true });
    }
    if (insight.dataUsed.includes('reviews')) {
      sources.push({ name: 'Reviews', icon: 'reviews', verified: true });
    }
    if (insight.dataUsed.includes('trends')) {
      sources.push({ name: 'Trends', icon: 'trends', verified: true });
    }
    if (insight.dataUsed.includes('youtube')) {
      sources.push({ name: 'YouTube', icon: 'youtube', verified: true });
    }

    return sources;
  }
}
```

STEP 4: CREATE SMART PICK CARD COMPONENT
File: `src/components/campaign/smart-picks/SmartPickCard.tsx`

```tsx
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, TrendingUp, Clock, Award } from 'lucide-react';
import type { SmartPick } from '@/types/smart-picks.types';

interface SmartPickCardProps {
  pick: SmartPick;
  onGenerate: (pickId: string) => void;
  onPreview: (pickId: string) => void;
}

const dataSourceIcons: Record<string, any> = {
  weather: '☀️',
  news: '📰',
  reviews: '⭐',
  trends: '📈',
  youtube: '📺',
  reddit: '💬',
  perplexity: '🔮',
  semrush: '🔍'
};

export function SmartPickCard({ pick, onGenerate, onPreview }: SmartPickCardProps) {
  const confidencePercent = Math.round(pick.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
    >
      {/* Confidence Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            AI Pick
          </span>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full">
          {confidencePercent}% Match
        </div>
      </div>

      {/* Headline */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {pick.headline}
      </h3>

      {/* Hook Preview */}
      <p className="text-gray-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
        {pick.hookPreview}
      </p>

      {/* Score Indicators */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-gray-600 dark:text-slate-400">
            {Math.round(pick.relevanceScore * 100)}% Relevant
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-600 dark:text-slate-400">
            {Math.round(pick.timelinessScore * 100)}% Timely
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Award className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-600 dark:text-slate-400">
            {Math.round(pick.evidenceQuality * 100)}% Quality
          </span>
        </div>
      </div>

      {/* Data Sources */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-500 mb-2">
          DATA SOURCES:
        </p>
        <div className="flex flex-wrap gap-2">
          {pick.dataSources.map((source, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs"
            >
              <span>{dataSourceIcons[source.icon]}</span>
              <span className="text-gray-700 dark:text-slate-300">{source.name}</span>
              {source.verified && (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onGenerate(pick.id)}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-all"
        >
          Generate This Campaign
        </button>
        <button
          onClick={() => onPreview(pick.id)}
          className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
        >
          Preview
        </button>
      </div>
    </motion.div>
  );
}
```

STEP 5: CREATE SMART PICKS CONTAINER
File: `src/components/campaign/smart-picks/SmartPicks.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { SmartPickCard } from './SmartPickCard';
import { SmartPickGenerator } from '@/services/campaign/SmartPickGenerator';
import type { SmartPick } from '@/types/smart-picks.types';
import type { DeepContext } from '@/types/intelligence.types';
import type { CampaignType } from '@/types/campaign.types';
import type { BreakthroughInsight } from '@/types/synapse.types';

interface SmartPicksProps {
  context: DeepContext;
  campaignType: CampaignType;
  insights: BreakthroughInsight[];
  onGenerate: (pickId: string) => void;
  onSwitchToMixer: () => void;
}

export function SmartPicks({
  context,
  campaignType,
  insights,
  onGenerate,
  onSwitchToMixer
}: SmartPicksProps) {
  const [picks, setPicks] = useState<SmartPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generatePicks();
  }, [context, campaignType, insights]);

  const generatePicks = async () => {
    setLoading(true);
    try {
      const generator = new SmartPickGenerator();
      const smartPicks = await generator.generateSmartPicks(context, campaignType, insights);
      setPicks(smartPicks);
    } catch (error) {
      console.error('Failed to generate smart picks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-slate-400">
          AI is analyzing your data to find the best campaigns...
        </p>
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          No strong campaign recommendations found. Try the Content Mixer for manual selection.
        </p>
        <button
          onClick={onSwitchToMixer}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          Open Content Mixer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI-Recommended Campaigns
          </h2>
        </div>
        <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
          We've analyzed {insights.length} breakthrough insights and selected the best {picks.length} campaigns
          tailored for your business. Click "Generate" to create a full campaign instantly.
        </p>
      </div>

      {/* Smart Pick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {picks.map((pick) => (
          <SmartPickCard
            key={pick.id}
            pick={pick}
            onGenerate={onGenerate}
            onPreview={(id) => console.log('Preview:', id)}
          />
        ))}
      </div>

      {/* Alternative Option */}
      <div className="text-center pt-6 border-t border-gray-200 dark:border-slate-700">
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          Want to create your own custom combination?
        </p>
        <button
          onClick={onSwitchToMixer}
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold"
        >
          Switch to Content Mixer
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

STEP 6: COMMIT
```bash
git add .
git commit -m "feat: Add Smart Picks UI with AI-curated campaigns

- Created SmartPickGenerator service with scoring logic
- Built SmartPickCard component with trust indicators
- Built SmartPicks container with loading states
- Shows 3-5 AI-recommended campaigns per type
- Confidence scoring based on relevance, timeliness, evidence
- One-click generate button per pick
- Data source verification indicators"
```

COMPLETION CRITERIA:
✅ All components built and tested
✅ AI scoring logic implemented
✅ No TypeScript errors
✅ Ready to merge

WORK AUTONOMOUSLY until complete.
```

---

## PROMPT 3: Content Mixer (Instance 3)

```
You are building the Content Mixer feature for the Synapse SMB Platform. Work autonomously until complete.

CONTEXT:
Content Mixer is a 3-column drag-and-drop interface for power users who want to manually combine insights from different data sources to create custom campaigns.

OBJECTIVE:
Build a drag-and-drop interface with: (1) Insight Pool with categorized tabs, (2) Selection area, (3) Live preview

SETUP:
- Working directory: /Users/byronhudson/Projects/Synapse
- Create worktree: ../synapse-content-mixer
- Branch: feature/content-mixer
- Install: @dnd-kit/core and @dnd-kit/sortable

STEP 1: CREATE WORKTREE
```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-content-mixer feature/content-mixer
cd ../synapse-content-mixer
npm install @dnd-kit/core @dnd-kit/sortable
```

STEP 2: CREATE TYPE DEFINITIONS
File: `src/types/content-mixer.types.ts`

```typescript
export type InsightCategory = 'local' | 'trending' | 'seasonal' | 'industry' | 'reviews' | 'competitive';

export interface CategorizedInsight {
  id: string;
  category: InsightCategory;
  title: string;
  preview: string;
  confidence: number;
  dataSource: string;
  icon: string;
}
```

STEP 3: CREATE INSIGHT CARD COMPONENT
File: `src/components/campaign/content-mixer/InsightCard.tsx`

```tsx
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, X } from 'lucide-react';

interface InsightCardProps {
  insight: any;
  draggable?: boolean;
  onRemove?: () => void;
}

export function InsightCard({ insight, draggable = true, onRemove }: InsightCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: insight.id,
    disabled: !draggable
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-slate-700 p-3 hover:border-blue-300 transition-all cursor-move"
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <div {...listeners} {...attributes}>
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {insight.title}
          </p>
          <p className="text-gray-600 dark:text-slate-400 text-xs line-clamp-2">
            {insight.preview}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
              {insight.dataSource}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(insight.confidence * 100)}% confident
            </span>
          </div>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
```

STEP 4: CREATE REMAINING COMPONENTS
Follow similar pattern for:
- InsightPool.tsx (categorized tabs)
- SelectionArea.tsx (drop zone)
- LivePreview.tsx (real-time preview)
- ContentMixer.tsx (3-column layout)

STEP 5: COMMIT
```bash
git add .
git commit -m "feat: Add Content Mixer with drag-and-drop interface"
```

WORK AUTONOMOUSLY until complete.
```

---

## PROMPT 4: Campaign Preview/Approval (Instance 4)

```
You are building the Campaign Preview and Approval feature for the Synapse SMB Platform. Work autonomously until complete.

CONTEXT:
After campaign generation, users need to preview content across all platforms, edit sections, and approve before publishing.

OBJECTIVE:
Build a multi-platform preview with edit capabilities and approval workflow.

SETUP:
- Working directory: /Users/byronhudson/Projects/Synapse
- Create worktree: ../synapse-campaign-preview
- Branch: feature/campaign-preview

[Follow similar autonomous structure as above prompts]

WORK AUTONOMOUSLY until complete.
```

---

## PROMPT 5: Campaign Orchestrator (Instance 5)

```
You are building the Campaign Orchestration Service for the Synapse SMB Platform. Work autonomously until complete.

CONTEXT:
This service coordinates the entire campaign workflow from type selection through publishing. It's the "glue" that connects all other Week 1 components.

OBJECTIVE:
Build a state machine and workflow service that manages campaign sessions, handles data flow, and persists campaigns to the database.

SETUP:
- Working directory: /Users/byronhudson/Projects/Synapse
- Create worktree: ../synapse-campaign-orchestrator
- Branch: feature/campaign-orchestrator

[Follow similar autonomous structure as above prompts]

WORK AUTONOMOUSLY until complete.
```

---

*These are context-complete prompts designed for autonomous execution by Claude Code instances.*
