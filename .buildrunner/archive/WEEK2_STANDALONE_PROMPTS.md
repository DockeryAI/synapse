# Week 2 Standalone Prompts - Campaign System Core

## Overview
**Goal:** Build functional campaign creation system with industry customization
**Testing Phase:** Week 3 (after this build)
**Base Branch:** `feature/dashboard-v2-week1`

---

## Prompt 0: Campaign Builder UI Components

```
You are building Week 2 of the Dashboard V2 system. Your task is to create the Campaign Builder UI components.

## Setup
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout feature/dashboard-v2-week1
4. git pull origin feature/dashboard-v2-week1
5. npm install
6. mkdir -p /Users/byronhudson/Projects/synapse-worktrees
7. git worktree add /Users/byronhudson/Projects/synapse-worktrees/wt-campaign-builder -b wt-campaign-builder
8. cd /Users/byronhudson/Projects/synapse-worktrees/wt-campaign-builder

## Build Tasks
Create the following files in src/components/v2/campaign-builder/:

### 1. CampaignBuilder.tsx
Main container component with:
- State management for campaign creation flow
- Step-based wizard interface
- Integration with ModeContext

### 2. PurposeSelector.tsx
Campaign purpose selection UI:
- Display all 15 campaign templates as cards
- Show template metadata (name, description, expected ROI)
- Filter by category (premium/authority/quickwin)
- Performance predictions for each option
- Selection callback to parent

### 3. TimelineVisualizer.tsx
Visual timeline for campaign pieces:
- Horizontal timeline with date markers
- Drag-drop piece reordering (use @dnd-kit)
- Visual representation of emotional progression
- Color-coded emotional triggers
- Piece duration indicators

### 4. CampaignPieceCard.tsx
Individual piece card component:
- Display piece title, content preview, emotional trigger
- Edit/delete actions
- Drag handle for reordering
- Status indicator (pending/generated/published)
- Scheduled date display

### 5. CampaignPreview.tsx
Full campaign preview panel:
- Show all pieces in order
- Narrative flow visualization
- Total duration and piece count
- Export/save actions

### 6. index.ts
Export all components

## Testing
Create src/__tests__/v2/campaign-builder/campaign-builder.test.tsx:
- Test PurposeSelector renders all 15 templates
- Test TimelineVisualizer drag-drop reordering
- Test CampaignPieceCard displays correctly
- Test CampaignPreview shows all pieces

## Completion
1. Run: npm run build
2. Run: npx vitest run src/__tests__/v2/campaign-builder/
3. Commit: "feat(v2): add campaign builder UI components"
4. Report files created and test results
```

---

## Prompt 1: Campaign Arc Generator Service

```
You are building Week 2 of the Dashboard V2 system. Your task is to create the Campaign Arc Generator service.

## Setup
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout feature/dashboard-v2-week1
4. git pull origin feature/dashboard-v2-week1
5. npm install
6. mkdir -p /Users/byronhudson/Projects/synapse-worktrees
7. git worktree add /Users/byronhudson/Projects/synapse-worktrees/wt-arc-generator -b wt-arc-generator
8. cd /Users/byronhudson/Projects/synapse-worktrees/wt-arc-generator

## Build Tasks
Create src/services/v2/campaign-arc-generator.service.ts:

### Core Functionality
1. **generateArc(templateId, brandContext, config)**
   - Takes a campaign template ID
   - Generates complete arc structure with all pieces
   - Populates piece content based on brand context
   - Returns Campaign object with all pieces

2. **calculateEmotionalProgression(pieces)**
   - Analyze emotional flow across pieces
   - Ensure variety (no repeated triggers)
   - Return progression score and suggestions

3. **generatePieceContent(pieceTemplate, brandContext, position)**
   - Generate actual content for a single piece
   - Adapt based on position in arc (opening/middle/closing)
   - Include appropriate emotional trigger

4. **optimizeTimeline(pieces, constraints)**
   - Optimize piece scheduling
   - Respect min/max intervals
   - Balance content distribution

### Interfaces
```typescript
interface ArcGeneratorConfig {
  startDate: Date;
  targetAudience: string;
  primaryGoal: string;
  industryCode?: string;
  customConstraints?: {
    maxPieces?: number;
    intervalDays?: number;
    excludeTriggers?: string[];
  };
}

interface GeneratedArc {
  campaign: Campaign;
  pieces: CampaignPiece[];
  emotionalProgression: {
    score: number;
    flow: string[];
    suggestions: string[];
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    totalDuration: number;
  };
}
```

### Integration
- Import from campaign templates in templates/campaigns/
- Use performancePredictor for piece predictions
- Export singleton instance

## Testing
Create src/__tests__/v2/services/campaign-arc-generator.test.ts:
- Test generateArc produces valid campaign structure
- Test emotional progression calculation
- Test piece content generation
- Test timeline optimization
- Test all 15 campaign templates generate correctly

## Completion
1. Run: npm run build
2. Run: npx vitest run src/__tests__/v2/services/
3. Commit: "feat(v2): add campaign arc generator service"
4. Report files created and test results
```

---

## Prompt 2: Narrative Continuity Engine

```
You are building Week 2 of the Dashboard V2 system. Your task is to create the Narrative Continuity Engine.

## Setup
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout feature/dashboard-v2-week1
4. git pull origin feature/dashboard-v2-week1
5. npm install
6. mkdir -p /Users/byronhudson/Projects/synapse-worktrees
7. git worktree add /Users/byronhudson/Projects/synapse-worktrees/wt-narrative-engine -b wt-narrative-engine
8. cd /Users/byronhudson/Projects/synapse-worktrees/wt-narrative-engine

## Build Tasks
Create src/services/v2/narrative-continuity.service.ts:

### Core Functionality
1. **analyzeNarrativeContinuity(pieces)**
   - Score narrative flow between pieces (0-100)
   - Detect story coherence issues
   - Identify missing transitions
   - Return detailed continuity report

2. **generateTransitions(piece1, piece2)**
   - Create smooth narrative bridges
   - Maintain story thread
   - Return transition suggestions

3. **enforceStoryCoherence(pieces)**
   - Ensure consistent messaging
   - Maintain character/brand voice
   - Check for contradictions
   - Return coherence score and issues

4. **suggestImprovements(pieces, targetScore)**
   - Analyze current narrative
   - Suggest specific improvements
   - Reorder recommendations
   - Content adjustment suggestions

### Interfaces
```typescript
interface ContinuityReport {
  overallScore: number; // 0-100
  pieceScores: { pieceId: string; score: number; issues: string[] }[];
  transitionQuality: { from: string; to: string; score: number }[];
  suggestions: ContinuitySuggestion[];
}

interface ContinuitySuggestion {
  type: 'reorder' | 'edit' | 'add' | 'remove';
  pieceId?: string;
  description: string;
  expectedImprovement: number;
}

interface CoherenceReport {
  score: number;
  voiceConsistency: number;
  messageAlignment: number;
  contradictions: { piece1: string; piece2: string; issue: string }[];
}
```

### Analysis Methods
- Semantic similarity between pieces
- Topic continuity tracking
- Emotional arc analysis
- Call-to-action progression

## Testing
Create src/__tests__/v2/services/narrative-continuity.test.ts:
- Test continuity analysis scoring
- Test transition generation
- Test coherence enforcement
- Test improvement suggestions
- Test with real campaign examples

## Completion
1. Run: npm run build
2. Run: npx vitest run src/__tests__/v2/services/
3. Commit: "feat(v2): add narrative continuity engine"
4. Report files created and test results
```

---

## Prompt 3: Industry Customization Layer

```
You are building Week 2 of the Dashboard V2 system. Your task is to create the Industry Customization Layer.

## Setup
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout feature/dashboard-v2-week1
4. git pull origin feature/dashboard-v2-week1
5. npm install
6. mkdir -p /Users/byronhudson/Projects/synapse-worktrees
7. git worktree add /Users/byronhudson/Projects/synapse-worktrees/wt-industry-customization -b wt-industry-customization
8. cd /Users/byronhudson/Projects/synapse-worktrees/wt-industry-customization

## Build Tasks
Create src/services/v2/industry-customization.service.ts:

### Core Functionality
1. **applyIndustryOverlay(content, industryCode)**
   - Transform universal template content
   - Apply industry-specific terminology
   - Adjust tone and examples
   - Return customized content

2. **getEmotionalTriggerWeights(industryCode)**
   - Return NAICS-based trigger weighting:
     - Insurance (524210): fear 35%, trust 30%, security 35%
     - SaaS (541511): efficiency 40%, growth 35%, innovation 25%
     - Healthcare (621111): safety 40%, hope 30%, trust 30%
     - Finance (523110): security 35%, opportunity 35%, trust 30%
     - Real Estate (531210): aspiration 35%, security 30%, urgency 35%
   - Support 10+ industries

3. **generateIndustryExamples(templateType, industryCode)**
   - Create industry-specific case studies
   - Generate relevant statistics
   - Return contextual examples

4. **checkCompliance(content, industryCode)**
   - Verify regulatory compliance
   - Flag potential issues
   - Suggest compliant alternatives
   - Industries: Healthcare (HIPAA), Finance (finra), Insurance (state regs)

5. **getIndustryVocabulary(industryCode)**
   - Return industry jargon dictionary
   - Preferred terminology
   - Terms to avoid

### Industry Profiles
Create src/services/v2/data/industry-profiles.ts with profiles for:
- Insurance, SaaS/Software, Healthcare, Finance, Real Estate
- Legal, Manufacturing, Retail, Education, Professional Services

Each profile includes:
- triggerWeights
- vocabulary
- complianceRules
- exampleFormats
- toneGuidelines

## Testing
Create src/__tests__/v2/services/industry-customization.test.ts:
- Test overlay application for each industry
- Test trigger weight retrieval
- Test example generation
- Test compliance checking
- Test vocabulary retrieval

## Completion
1. Run: npm run build
2. Run: npx vitest run src/__tests__/v2/services/
3. Commit: "feat(v2): add industry customization layer"
4. Report files created and test results
```

---

## Prompt 4: Purpose Detection & Categorization

```
You are building Week 2 of the Dashboard V2 system. Your task is to create the Purpose Detection and Categorization system.

## Setup
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout feature/dashboard-v2-week1
4. git pull origin feature/dashboard-v2-week1
5. npm install
6. mkdir -p /Users/byronhudson/Projects/synapse-worktrees
7. git worktree add /Users/byronhudson/Projects/synapse-worktrees/wt-purpose-detection -b wt-purpose-detection
8. cd /Users/byronhudson/Projects/synapse-worktrees/wt-purpose-detection

## Build Tasks
Create src/services/v2/purpose-detection.service.ts:

### Core Functionality
1. **detectPurpose(dataPoints, context)**
   - Analyze data points to determine breakthrough purpose
   - Return primary and secondary purposes
   - Confidence scores for each

2. **categorizeBreakthrough(purpose, dataPoints)**
   - Map purpose to appropriate campaign templates
   - Return ranked template recommendations
   - Include reasoning for each

3. **alignContentToPurpose(content, purpose)**
   - Adjust content to match detected purpose
   - Optimize messaging for purpose
   - Return aligned content

### Six Breakthrough Purposes
```typescript
type BreakthroughPurpose =
  | 'market_gap'      // Unmet need in market
  | 'timing_play'     // Time-sensitive opportunity
  | 'contrarian'      // Against conventional wisdom
  | 'validation'      // Social proof heavy
  | 'transformation'  // Before/after focus
  | 'authority';      // Expert positioning

interface PurposeDetectionResult {
  primaryPurpose: BreakthroughPurpose;
  secondaryPurpose?: BreakthroughPurpose;
  confidence: number;
  signals: { signal: string; weight: number }[];
  recommendedTemplates: {
    templateId: string;
    matchScore: number;
    reason: string;
  }[];
}
```

### Detection Algorithm
- Keyword analysis for each purpose
- Pattern matching in data points
- Context weighting
- Historical success correlation

### Purpose-Template Mapping
- market_gap → comparison_campaign, objection_crusher
- timing_play → seasonal_urgency, scarcity_sequence
- contrarian → authority_builder, education_first
- validation → social_proof, trust_ladder
- transformation → heros_journey, race_journey
- authority → authority_builder, education_first

## Testing
Create src/__tests__/v2/services/purpose-detection.test.ts:
- Test purpose detection for each type
- Test categorization accuracy
- Test content alignment
- Test with various data point combinations
- Test confidence scoring

## Completion
1. Run: npm run build
2. Run: npx vitest run src/__tests__/v2/services/
3. Commit: "feat(v2): add purpose detection and categorization"
4. Report files created and test results
```

---

## Prompt 5: Integration & Week 2 Completion

```
You are completing Week 2 of the Dashboard V2 system. Your task is to integrate all Week 2 components and ensure everything works together.

## Setup
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout feature/dashboard-v2-week1
4. git pull origin feature/dashboard-v2-week1
5. npm install

## Integration Tasks

### 1. Merge All Week 2 Branches
```bash
git merge wt-campaign-builder --no-edit
git merge wt-arc-generator --no-edit
git merge wt-narrative-engine --no-edit
git merge wt-industry-customization --no-edit
git merge wt-purpose-detection --no-edit
```

### 2. Update Service Index
Edit src/services/v2/index.ts to export:
- campaignArcGenerator
- narrativeContinuityService
- industryCustomizationService
- purposeDetectionService

### 3. Update Component Index
Edit src/components/v2/index.ts to export:
- CampaignBuilder
- PurposeSelector
- TimelineVisualizer
- CampaignPieceCard
- CampaignPreview

### 4. Create Integration Tests
Create src/__tests__/v2/integration/week2-integration.test.ts:
- Test full campaign creation flow
- Generate 3 campaigns using different templates
- Verify narrative continuity scores > 85%
- Test industry customization on all templates
- Verify purpose detection accuracy

### 5. Run Full Test Suite
```bash
npm run build
npx vitest run src/__tests__/v2/
```

### 6. Clean Up Worktrees
```bash
cd /Users/byronhudson/Projects/Synapse
git worktree remove /Users/byronhudson/Projects/synapse-worktrees/wt-campaign-builder --force
git worktree remove /Users/byronhudson/Projects/synapse-worktrees/wt-arc-generator --force
git worktree remove /Users/byronhudson/Projects/synapse-worktrees/wt-narrative-engine --force
git worktree remove /Users/byronhudson/Projects/synapse-worktrees/wt-industry-customization --force
git worktree remove /Users/byronhudson/Projects/synapse-worktrees/wt-purpose-detection --force
git branch -D wt-campaign-builder wt-arc-generator wt-narrative-engine wt-industry-customization wt-purpose-detection
```

### 7. Final Commit
Commit message: "feat(v2): complete Week 2 - Campaign System Core with industry customization"

## Week 2 Testing Checkpoint Verification
Verify these requirements from the build plan:
- [ ] Generate 3 complete campaigns using different templates
- [ ] Verify narrative continuity across campaign pieces (>85%)
- [ ] Test template assignment for 10 AI suggestions
- [ ] Test user connections (2-way → content, 3+ way → campaign)
- [ ] Test 10 breakthroughs with template recommendations
- [ ] Validate industry customization overlay works on all templates

## Completion Report
Report:
- Total files created
- Total lines of code
- All test results
- Week 2 testing checkpoint results
- Any issues encountered
```

---

## Execution Order

1. **Prompts 0-4 can run in parallel** (separate worktrees)
2. **Prompt 5 runs after all others complete** (integration)

## Notes
- Week 3 is Testing & Gap Analysis - no build prompts needed
- First full user testing happens after Week 2 completion
- All prompts build on Week 1 foundation (feature/dashboard-v2-week1)
