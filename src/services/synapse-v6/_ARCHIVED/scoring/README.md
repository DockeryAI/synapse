# Holy Shit Scoring System

**THE PREDICTION SECRET**: Predict "holy shit" audience reactions before you publish.

## Quick Start

```typescript
import { HolyShitScorer } from './index';

const scorer = new HolyShitScorer();
const score = await scorer.scoreBreakthrough(insight, deepContext);

console.log(`Score: ${score.total}/100`);
console.log(`Prediction: ${score.prediction}`); // 'holy shit' | 'great' | 'good' | 'meh'
```

## The 5 Dimensions

1. **Unexpectedness** (0-30, 30% weight) - How surprising
2. **Truthfulness** (0-25, 25% weight) - How well-supported
3. **Actionability** (0-20, 20% weight) - How immediately actionable
4. **Uniqueness** (0-15, 15% weight) - How unique vs competitors
5. **Virality** (0-10, 10% weight) - Potential for viral sharing

## Score Thresholds

- **85-100** = 🔥 holy shit (breakthrough)
- **70-84** = ⭐ great (strong)
- **50-69** = ✓ good (solid)
- **0-49** = ⚡ meh (needs work)

## Components

- **HolyShitScorer** - Main scorer
- **DimensionScorers** - 5 specialized scorers
- **ReactionPredictor** - Converts scores to predictions
- **ScoringLearningSystem** - ML-ready learning from outcomes

## Features

✅ **Transparent** - Know why scores are what they are
✅ **Multi-dimensional** - 5 factors, not just one number
✅ **Learning** - Improves over time with feedback
✅ **Batch processing** - Score multiple insights at once
✅ **Detailed breakdown** - See exactly what contributed

## Documentation

- **[Complete Guide](../../../../docs/HOLY_SHIT_SCORING_GUIDE.md)** - Full usage guide with examples

## Status

✅ **100% Complete and Operational**
