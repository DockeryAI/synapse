# Psychology Principles Integration - Synapse V6

## Overview

The V6 Content Pipeline now automatically analyzes Voice of Customer (VoC) insights against 9 psychology principles to identify which psychological triggers are present and how to leverage them for breakthrough content.

## The 9 Psychology Principles

1. **Curiosity Gap** - Creates information gaps that compel closure
2. **Loss Aversion** - Frames potential losses (2.5x stronger than gains)
3. **Social Proof** - Leverages what others are doing/thinking
4. **Authority** - Establishes credibility through expertise and data
5. **Scarcity** - Creates urgency through limited availability
6. **Reciprocity** - Provides value first to trigger obligation
7. **Commitment & Consistency** - Aligns with stated identity/preferences
8. **Liking/Similarity** - Creates connection through relatability
9. **Contrast** - Uses before/after and comparison effects

## How It Works

### 1. Automatic VoC Analysis

When VoC insights are processed by the content pipeline, each insight is automatically scored against all 9 principles:

```typescript
import { ContentPsychologyEngine } from './generation/ContentPsychologyEngine';

const engine = new ContentPsychologyEngine();

const vocInsight = {
  id: 'voc-123',
  title: 'Customer Review',
  text: 'I was losing so much time manually doing this. My competitors were getting ahead...',
};

const analysis = engine.analyzeVoCInsight(vocInsight);
```

### 2. Scoring System (0-10 scale)

Each principle receives a score based on:
- **Keyword detection** - Specific words that signal psychological triggers
- **Pattern matching** - Questions, comparisons, temporal references
- **Context analysis** - How strongly the insight aligns with the principle

**Score Interpretation:**
- 7-10: High - Strongly triggers this principle
- 4-6: Moderate - Some triggering present
- 0-3: Low - Minimal or no triggering

### 3. Analysis Output

```typescript
{
  insight_id: "voc-123",
  insight_text: "I was losing so much time manually...",
  principle_scores: [
    {
      principle: "Loss Aversion",
      score: 8.5,
      explanation: "Strong loss aversion trigger - customer fears falling behind...",
      triggers: [
        "\"losing\" expresses fear of loss",
        "\"competitors\" comparison triggers loss aversion"
      ],
      content_application: "Frame as: 'Don't let [pain] cost you [loss]'"
    },
    // ... 8 more principles
  ],
  top_principles: [/* Top 3 scoring principles */],
  overall_psychology_score: 7.2,
  recommended_content_angle: "Lead with what they're losing/missing, then show prevention"
}
```

### 4. Content Generation Integration

The V6 content pipeline automatically includes psychology analysis in generated content:

```typescript
import { v6ContentPipeline } from './v6-content-pipeline.service';

const contentPieces = await v6ContentPipeline.generateFromConnections(
  connections,
  profile,
  { includeExplanations: true }
);

// Each piece includes psychology analysis
contentPieces[0].psychology.psychology_analysis; // Full 9-principle breakdown
contentPieces[0].psychology.explanation; // Human-readable explanation
```

### 5. Batch Analysis

Analyze multiple VoC insights to find patterns:

```typescript
const vocInsights = [
  { id: '1', text: 'Customer pain point 1...', title: 'Review 1' },
  { id: '2', text: 'Customer pain point 2...', title: 'Review 2' },
  // ... more insights
];

const batchAnalysis = await v6ContentPipeline.analyzeVoCPsychology(vocInsights);

// Results include:
// - All insights sorted by psychology score
// - Top performers (highest scoring insights)
// - Principle frequency (which principles appear most)
// - Strategic recommendations
```

## Batch Analysis Output

```typescript
{
  total_analyzed: 50,
  analyses: [/* All 50 analyses sorted by score */],
  top_performers: [/* Top 5 highest-scoring insights */],
  average_psychology_score: 6.3,
  principle_frequency: {
    "Loss Aversion": 15,    // Appears as top principle in 15 insights
    "Social Proof": 12,
    "Curiosity Gap": 8,
    // ...
  },
  recommendations: [
    "30% of insights trigger Loss Aversion. Create content series focused on this principle...",
    "Create content variety using your top 3 principles: Loss Aversion, Social Proof, Authority...",
    "12 insights scored 7+ overall. Prioritize these for immediate content creation."
  ]
}
```

## Use Cases

### 1. Content Prioritization
Identify which VoC insights have the strongest psychological triggers and prioritize them for content creation.

### 2. Content Strategy
Understand which psychology principles resonate most with your audience and build content themes around them.

### 3. Gap Analysis
Identify underutilized principles and gather more VoC data to cover those angles.

### 4. A/B Testing
Create content variants using different psychology principles and test which performs best.

### 5. Breakthrough Scoring
Psychology analysis contributes to the overall breakthrough score, helping identify content with the highest engagement potential.

## Technical Details

### Scoring Algorithm

Each principle uses a weighted keyword and pattern detection system:

```typescript
// Example: Loss Aversion scoring
const lossWords = ['losing', 'lose', 'miss out', 'behind', 'wasting'];
lossWords.forEach(word => {
  if (contentLower.includes(word)) {
    score += 2;  // Each loss word adds 2 points
    triggers.push(`"${word}" expresses fear of loss`);
  }
});
```

### Performance

- **Analysis Speed:** ~1ms per insight (synchronous keyword matching)
- **No API Calls:** Pure local analysis, no external dependencies
- **No Mock Data:** Analyzes real VoC content text

### Integration Points

1. **V6ContentPipeline.generateFromBreakthrough()** - Auto-analyzes VoC insights in breakthroughs
2. **V6ContentPipeline.analyzeVoCPsychology()** - Standalone batch analysis
3. **ContentPsychologyEngine.analyzeVoCInsight()** - Single insight analysis

## Example Workflow

```typescript
// 1. Collect VoC insights from API orchestrator
const vocData = await apiOrchestrator.fetchTab('voc', profile);

// 2. Convert to VoCInsight format
const vocInsights: VoCInsight[] = vocData.map(item => ({
  id: item.id,
  text: item.text,
  title: item.title,
}));

// 3. Analyze psychology principles
const psychologyAnalysis = await v6ContentPipeline.analyzeVoCPsychology(vocInsights);

// 4. Use top performers for content generation
const topInsights = psychologyAnalysis.top_performers;

// 5. Generate content with psychology explanations
const content = await v6ContentPipeline.generateFromConnections(
  { topBreakthroughs: topInsights },
  profile,
  { includeExplanations: true }
);

// 6. Content now includes detailed psychology breakdowns
content[0].psychology.psychology_analysis.top_principles.forEach(p => {
  console.log(`${p.principle}: ${p.score}/10 - ${p.explanation}`);
  console.log(`Strategy: ${p.content_application}`);
});
```

## Testing

Run the example tests to see the system in action:

```bash
npm test -- psychology-analysis-example
```

Tests demonstrate:
- Loss Aversion detection in customer complaints
- Curiosity Gap detection in questions
- Social Proof detection in peer references
- Batch analysis with prioritization
- Strategic recommendations generation

## Future Enhancements

1. **Machine Learning**: Train models on high-performing content to refine scoring weights
2. **Dynamic Weights**: Adjust principle weights based on industry/audience
3. **Combination Detection**: Identify when multiple principles work together
4. **Temporal Analysis**: Track which principles perform best at different customer journey stages
5. **A/B Test Integration**: Feed performance data back to improve scoring

## Architecture Principles

- **No Mock Data**: Uses real VoC text content
- **No External APIs**: Fully local analysis
- **Fast & Synchronous**: Keyword matching, not AI inference
- **Transparent**: Clear explanations for each score
- **Extensible**: Easy to add new principles or adjust weights
