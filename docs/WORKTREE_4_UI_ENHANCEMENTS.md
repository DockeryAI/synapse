# Worktree 4: UI Enhancements - Complete Build Guide

**Branch:** `feature/ui-enhancements`
**Timeline:** Week 2-3 (10 days)
**Estimated Lines:** 1,400
**Your Role:** Build the complete user-facing UI for Synapse

---

## 📋 QUICK START

You are Claude Instance #4. Your job is to build the Synapse UI that brings everything together into a seamless user experience. Read this entire document, then execute tasks in order.

**⚠️ CRITICAL:** You are the ONLY developer who can modify `SynapsePage.tsx`. Lock this file to prevent conflicts.

**Status Tracking:** Update `.buildrunner/features.json` after each task completion.

---

## 🎯 YOUR MISSION

Build the complete Synapse user interface:

1. **Enhanced SynapsePage** - Main intelligence gathering UI
2. **Enhanced UVP Wizard** - Evidence-based value proposition builder
3. **Evidence Tag Components** - Show proof for suggestions
4. **Content Preview Components** - Display generated content
5. **Intelligence Display** - Show all gathered intelligence

**Success Criteria:**
- Complete end-to-end user flow works
- Beautiful, intuitive UI
- Mobile responsive
- <2 second page loads
- Zero accessibility issues

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Create Your Worktree

```bash
cd /Users/byronhudson/Projects/Synapse

# Create your worktree
git worktree add ../Synapse-ui -b feature/ui-enhancements

# Navigate to your worktree
cd /Users/byronhudson/Projects/Synapse-ui

# Verify you're on the right branch
git branch
# Should show: * feature/ui-enhancements
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Verify installation
npm run build
# Should complete successfully
```

### Step 3: Understand Current SynapsePage

The current `SynapsePage.tsx` is a placeholder (57 lines). You'll expand it to 500+ lines with full functionality.

**Current structure:**
```typescript
export function SynapsePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1>Synapse SMB Platform</h1>
        <p>Fast, intelligent SMB onboarding</p>
        <Button>Get Started</Button>
      </div>
    </div>
  )
}
```

**Your job:** Transform this into the full intelligence gathering and content generation interface.

---

## 📝 ATOMIC TASK LIST

### TASK 1: Enhanced SynapsePage
**File:** `src/pages/SynapsePage.tsx`
**Lines:** 57 → 500
**Status:** ⏸️ Not Started

**⚠️ FILE LOCK:** This is YOUR file. No other developer should modify it.

**Requirements:**
Build the complete Synapse onboarding experience:

**User Flow:**
1. Enter business URL
2. Click "Analyze Business"
3. See 30-second intelligence gathering progress
4. Review detected specialty and intelligence
5. Click "Generate Content Calendar"
6. Preview 30 days of content
7. Click "Save to Calendar" → redirects to calendar

**Implementation:**
```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { URLParserService } from '@/services/url-parser.service';
import { ParallelIntelligenceService } from '@/services/parallel-intelligence.service';
import { SpecialtyDetectionService } from '@/services/specialty-detection.service';
import { CalendarPopulationService } from '@/services/calendar-population.service';
import { IntelligenceDisplay } from '@/components/synapse/IntelligenceDisplay';
import { ContentPreview } from '@/components/synapse/ContentPreview';
import { EnhancedUVPWizard } from '@/components/uvp-wizard/EnhancedUVPWizard';

type Step = 'url-input' | 'analyzing' | 'specialty-review' | 'uvp-building' | 'content-preview';

export function SynapsePage() {
  const [step, setStep] = useState<Step>('url-input');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // State for intelligence data
  const [parsedURL, setParsedURL] = useState<ParsedURL | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligenceResult[] | null>(null);
  const [specialty, setSpecialty] = useState<SpecialtyDetection | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('analyzing');
    setProgress(0);

    try {
      // Step 1: Parse URL (10%)
      setProgress(10);
      const urlParser = new URLParserService();
      const parsed = await urlParser.parse(url);
      setParsedURL(parsed);

      if (!parsed.isValid) {
        throw new Error('Invalid URL format');
      }

      // Step 2: Gather Intelligence (10% → 70%)
      const intelligenceService = new ParallelIntelligenceService();

      // Simulate progress during intelligence gathering
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 70));
      }, 2000);

      const intelligenceData = await intelligenceService.gather(parsed.normalized);

      clearInterval(progressInterval);
      setProgress(70);
      setIntelligence(intelligenceData);

      // Step 3: Detect Specialty (70% → 85%)
      setProgress(85);
      const specialtyService = new SpecialtyDetectionService();
      const detectedSpecialty = await specialtyService.detectSpecialty(
        intelligenceData,
        parsed.domain
      );
      setSpecialty(detectedSpecialty);

      // Step 4: Complete (85% → 100%)
      setProgress(100);

      // Move to specialty review
      setTimeout(() => {
        setStep('specialty-review');
        setLoading(false);
      }, 500);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze business');
      setLoading(false);
      setStep('url-input');
    }
  };

  const handleGenerateCalendar = async () => {
    if (!specialty || !intelligence) return;

    setLoading(true);
    setStep('content-preview');

    try {
      const calendarService = new CalendarPopulationService();
      const ideas = await calendarService.populate(
        'brand-id', // TODO: Get from context
        specialty,
        intelligence
      );

      setContentIdeas(ideas);
      setLoading(false);
    } catch (err) {
      console.error('Calendar generation error:', err);
      setError('Failed to generate calendar');
      setLoading(false);
    }
  };

  const handleSaveToCalendar = async () => {
    if (!contentIdeas) return;

    // Save to database
    // TODO: Implement actual save

    // Redirect to calendar
    window.location.href = '/content-calendar';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Synapse SMB Platform</h1>
          <p className="text-lg text-muted-foreground">
            Fast, intelligent SMB onboarding with automated content generation
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="text-red-800">{error}</div>
          </Card>
        )}

        {/* Step 1: URL Input */}
        {step === 'url-input' && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Enter Your Business URL</h2>
            <p className="text-muted-foreground mb-6">
              We'll analyze your website and generate 30 days of optimized content in minutes.
            </p>

            <div className="flex gap-4">
              <Input
                type="url"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                size="lg"
              >
                Analyze Business
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">16</div>
                <div className="text-sm text-muted-foreground">Data Sources</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">30s</div>
                <div className="text-sm text-muted-foreground">Analysis Time</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">30</div>
                <div className="text-sm text-muted-foreground">Content Ideas</div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Analyzing {parsedURL?.domain}...</h2>

            <div className="space-y-4">
              <Progress value={progress} className="w-full" />

              <div className="text-center text-muted-foreground">
                {progress < 10 && 'Parsing URL...'}
                {progress >= 10 && progress < 70 && 'Gathering business intelligence from 16 sources...'}
                {progress >= 70 && progress < 85 && 'Detecting business specialty...'}
                {progress >= 85 && 'Finalizing analysis...'}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
                {['Apify', 'OutScraper', 'Serper', 'SEMrush', 'YouTube', 'News', 'Weather', 'Maps'].map((source, i) => (
                  <div
                    key={source}
                    className={`p-2 rounded text-center text-sm ${
                      progress > i * 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {source}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Specialty Review */}
        {step === 'specialty-review' && specialty && intelligence && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Business Intelligence</h2>

              {/* Specialty Detection */}
              <div className="mb-6">
                <div className="text-sm text-muted-foreground mb-2">Detected Specialty</div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary">
                    {specialty.specialty}
                  </div>
                  <Badge variant="secondary">
                    {specialty.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {specialty.reasoning}
                </p>
              </div>

              {/* Intelligence Display */}
              <IntelligenceDisplay
                intelligence={intelligence}
                specialty={specialty}
              />
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('url-input')}
              >
                ← Start Over
              </Button>
              <Button
                onClick={() => setStep('uvp-building')}
                size="lg"
              >
                Build Value Proposition →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: UVP Building */}
        {step === 'uvp-building' && specialty && intelligence && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Value Proposition Builder</h2>

              <EnhancedUVPWizard
                intelligence={intelligence}
                specialty={specialty}
                onComplete={handleGenerateCalendar}
              />
            </Card>
          </div>
        )}

        {/* Step 5: Content Preview */}
        {step === 'content-preview' && contentIdeas && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">30-Day Content Calendar</h2>
              <p className="text-muted-foreground mb-6">
                Generated {contentIdeas.length} content ideas optimized for your specialty.
              </p>

              <ContentPreview
                ideas={contentIdeas}
                specialty={specialty!}
              />

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('specialty-review')}
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleSaveToCalendar}
                  size="lg"
                >
                  Save to Calendar →
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] All 5 steps work sequentially
- [ ] Progress bar accurate
- [ ] Error handling comprehensive
- [ ] Mobile responsive
- [ ] Smooth transitions

**Git Commit:**
```bash
git add src/pages/SynapsePage.tsx
git commit -m "feat(ui): Build enhanced SynapsePage with 5-step flow

- URL input with validation
- Real-time intelligence gathering progress
- Specialty detection display
- UVP wizard integration
- Content calendar preview
- Mobile responsive design
- Comprehensive error handling"
git push origin feature/ui-enhancements
```

**Update BuildRunner:** Set completionPercentage: 35

---

### TASK 2: Enhanced UVP Wizard
**File:** `src/components/uvp-wizard/EnhancedUVPWizard.tsx`
**Lines:** ~600
**Status:** ⏸️ Not Started
**Dependencies:** SynapsePage (Task 1)

**Requirements:**
Upgrade UVP wizard to show evidence and citations for all suggestions.

**Implementation:**
```typescript
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EvidenceTag } from './EvidenceTag';

interface EnhancedUVPWizardProps {
  intelligence: IntelligenceResult[];
  specialty: SpecialtyDetection;
  onComplete: () => void;
}

export const EnhancedUVPWizard: React.FC<EnhancedUVPWizardProps> = ({
  intelligence,
  specialty,
  onComplete
}) => {
  const [suggestions, setSuggestions] = useState<UVPSuggestion[]>([]);
  const [selected, setSelected] = useState<UVPSuggestion | null>(null);

  useEffect(() => {
    generateSuggestions();
  }, [intelligence, specialty]);

  const generateSuggestions = async () => {
    // Extract UVP suggestions from intelligence
    const suggestions: UVPSuggestion[] = [];

    // From website about page
    const websiteData = intelligence.find(i => i.source === 'apify');
    if (websiteData) {
      const aboutText = websiteData.data.aboutPage || '';
      const mentions = extractMentions(aboutText);

      mentions.forEach(mention => {
        suggestions.push({
          text: mention.text,
          evidence: {
            source: 'About Page',
            frequency: mention.frequency,
            confidence: 90,
            quote: mention.quote
          }
        });
      });
    }

    // From reviews
    const reviewsData = intelligence.find(i => i.source === 'outscraper-reviews');
    if (reviewsData) {
      const topMentions = extractTopMentions(reviewsData.data.reviews);

      topMentions.forEach(mention => {
        suggestions.push({
          text: mention.text,
          evidence: {
            source: 'Customer Reviews',
            frequency: mention.count,
            confidence: 85,
            quote: mention.exampleQuote
          }
        });
      });
    }

    // From specialty
    suggestions.push({
      text: `Specialized in ${specialty.specialty}`,
      evidence: {
        source: 'AI Analysis',
        frequency: specialty.confidence,
        confidence: specialty.confidence,
        quote: specialty.reasoning
      }
    });

    setSuggestions(suggestions);
  };

  const extractMentions = (text: string) => {
    // Extract key phrases that could be UVPs
    // Count frequency
    // Return top mentions
    return [];
  };

  const extractTopMentions = (reviews: any[]) => {
    // Analyze reviews for repeated positive mentions
    // Count frequency
    // Return top mentions
    return [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Suggested Value Propositions</h3>
        <p className="text-sm text-muted-foreground">
          Based on analysis of your website and {intelligence.length} data sources
        </p>
      </div>

      <div className="grid gap-4">
        {suggestions.map((suggestion, index) => (
          <Card
            key={index}
            className={`p-4 cursor-pointer transition-all ${
              selected === suggestion
                ? 'border-primary border-2'
                : 'hover:border-gray-300'
            }`}
            onClick={() => setSelected(suggestion)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium mb-2">{suggestion.text}</div>

                <EvidenceTag evidence={suggestion.evidence} />

                <div className="text-sm text-muted-foreground mt-2 italic">
                  "{suggestion.evidence.quote}"
                </div>
              </div>

              {selected === suggestion && (
                <Badge className="ml-4">Selected</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onComplete}
          disabled={!selected}
          size="lg"
        >
          Generate Calendar with This UVP
        </Button>
      </div>
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Shows evidence for each suggestion
- [ ] Extracts from website, reviews, specialty
- [ ] Displays frequency and confidence
- [ ] Allows selection
- [ ] Triggers calendar generation

**Git Commit:**
```bash
git add src/components/uvp-wizard/EnhancedUVPWizard.tsx
git commit -m "feat(ui): Add enhanced UVP wizard with evidence

- Extract UVP suggestions from intelligence
- Show evidence from website and reviews
- Display frequency and confidence scores
- Quote original sources
- Select UVP for calendar generation"
git push origin feature/ui-enhancements
```

**Update BuildRunner:** Set completionPercentage: 60

---

### TASK 3: Evidence Tag Component
**File:** `src/components/uvp-wizard/EvidenceTag.tsx`
**Lines:** ~100
**Status:** ⏸️ Not Started

**Implementation:**
```typescript
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';

export interface Evidence {
  source: string;
  frequency: number;
  confidence: number;
  quote: string;
}

interface EvidenceTagProps {
  evidence: Evidence;
}

export const EvidenceTag: React.FC<EvidenceTagProps> = ({ evidence }) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tooltip content={`Found in: ${evidence.source}`}>
        <Badge variant="secondary" className="text-xs">
          📍 {evidence.source}
        </Badge>
      </Tooltip>

      <Tooltip content={`Mentioned ${evidence.frequency} times`}>
        <Badge variant="secondary" className="text-xs">
          🔄 {evidence.frequency}x
        </Badge>
      </Tooltip>

      <Tooltip content={`${evidence.confidence}% confidence`}>
        <Badge variant="secondary" className="text-xs">
          ✓ {evidence.confidence}%
        </Badge>
      </Tooltip>
    </div>
  );
};
```

**Git Commit:**
```bash
git add src/components/uvp-wizard/EvidenceTag.tsx
git commit -m "feat(ui): Add evidence tag component

- Display evidence source
- Show frequency count
- Display confidence percentage
- Tooltip for additional context"
git push origin feature/ui-enhancements
```

**Update BuildRunner:** Set completionPercentage: 75

---

### TASK 4: Content Preview Component
**File:** `src/components/synapse/ContentPreview.tsx`
**Lines:** ~300
**Status:** ⏸️ Not Started

**Implementation:**
```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContentIdea, SpecialtyDetection } from '@/types';

interface ContentPreviewProps {
  ideas: ContentIdea[];
  specialty: SpecialtyDetection;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  ideas,
  specialty
}) => {
  const groupedByWeek = ideas.reduce((acc, idea) => {
    const week = Math.floor((new Date(idea.scheduledDate).getDate() - 1) / 7) + 1;
    if (!acc[week]) acc[week] = [];
    acc[week].push(idea);
    return acc;
  }, {} as Record<number, ContentIdea[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByWeek).map(([week, weekIdeas]) => (
        <div key={week}>
          <h3 className="font-semibold mb-3">Week {week}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weekIdeas.map((idea) => (
              <Card key={idea.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium mb-1">{idea.topic}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(idea.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>

                  <Badge variant={
                    idea.contentType === 'educational' ? 'default' :
                    idea.contentType === 'promotional' ? 'secondary' :
                    'outline'
                  }>
                    {idea.contentType}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    {idea.platform}
                  </Badge>

                  {idea.specialty === specialty.specialty && (
                    <Badge variant="secondary" className="text-xs">
                      🎯 Specialty-focused
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  {idea.reasoning}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

**Git Commit:**
```bash
git add src/components/synapse/ContentPreview.tsx
git commit -m "feat(ui): Add content preview component

- Group ideas by week
- Display content type badges
- Show platform assignments
- Highlight specialty-focused content
- Show reasoning for each idea"
git push origin feature/ui-enhancements
```

**Update BuildRunner:** Set completionPercentage: 90

---

### TASK 5: Intelligence Display Component
**File:** `src/components/synapse/IntelligenceDisplay.tsx`
**Lines:** ~300
**Status:** ⏸️ Not Started

**Implementation:**
```typescript
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IntelligenceResult, SpecialtyDetection } from '@/types';

interface IntelligenceDisplayProps {
  intelligence: IntelligenceResult[];
  specialty: SpecialtyDetection;
}

export const IntelligenceDisplay: React.FC<IntelligenceDisplayProps> = ({
  intelligence,
  specialty
}) => {
  const successfulSources = intelligence.filter(i => i.success);
  const failedSources = intelligence.filter(i => !i.success);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {successfulSources.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Data Sources
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {specialty.confidence}%
          </div>
          <div className="text-sm text-muted-foreground">
            Confidence
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {specialty.nicheKeywords.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Keywords Found
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(intelligence.reduce((sum, i) => sum + i.duration, 0) / 1000)}s
          </div>
          <div className="text-sm text-muted-foreground">
            Analysis Time
          </div>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="specialty">Specialty</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card className="p-4">
            <div className="space-y-2">
              {intelligence.map((result) => (
                <div
                  key={result.source}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      result.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{result.source}</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {result.duration}ms
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="specialty">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Detected Specialty
                </div>
                <div className="text-xl font-bold">{specialty.specialty}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Target Market
                </div>
                <div>{specialty.targetMarket}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Reasoning
                </div>
                <div className="text-sm">{specialty.reasoning}</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="keywords">
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {specialty.nicheKeywords.map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

**Git Commit:**
```bash
git add src/components/synapse/IntelligenceDisplay.tsx
git commit -m "feat(ui): Add intelligence display component

- Show data source success/failure status
- Display specialty detection results
- List niche keywords
- Show analysis performance metrics
- Tabbed interface for organization"
git push origin feature/ui-enhancements
```

**Update BuildRunner:** Set completionPercentage: 100

---

## 🧪 TESTING REQUIREMENTS

### Component Tests

```typescript
// SynapsePage.test.tsx
describe('SynapsePage', () => {
  it('should render URL input initially', () => {
    render(<SynapsePage />);
    expect(screen.getByPlaceholderText(/yourwebsite/)).toBeInTheDocument();
  });

  it('should show progress during analysis', async () => {
    render(<SynapsePage />);
    // ... test logic
  });
});
```

### Coverage Target: 80%

---

## ✅ QUALITY GATES

```bash
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run lint
```

---

## 🚫 WHAT NOT TO DO

**⚠️ CRITICAL - File Ownership:**
- `pages/SynapsePage.tsx` - YOU own this (no one else modifies)
- Other developers should NOT touch your files

**DO NOT modify:**
- `services/parallel-intelligence.service.ts` (Developer 1)
- `services/synapse-calendar-bridge.service.ts` (Developer 2)
- `services/socialpilot.service.ts` (Developer 3)

---

## 📊 PROGRESS TRACKING

**Daily Updates** in `#synapse-ui`
**BuildRunner Updates** after each task

---

## 🎯 SUCCESS CRITERIA

- [ ] Complete 5-step user flow
- [ ] Evidence-based UVP wizard
- [ ] Beautiful, responsive UI
- [ ] <2 second page loads
- [ ] Zero accessibility issues

**Estimated Time:** 10 days (Week 2-3)

**Your Impact:** You create the user experience!

---

**Ready to start? Begin with TASK 1: Enhanced SynapsePage**

**Good luck! 🚀**
