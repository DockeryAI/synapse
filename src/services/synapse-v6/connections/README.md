# Connection Discovery Module

**THE BREAKTHROUGH SECRET**: Uses OpenAI embeddings to find non-obvious connections between data from different sources.

## Quick Start

```typescript
import { ConnectionDiscoveryEngine } from './index';

const engine = new ConnectionDiscoveryEngine(process.env.VITE_OPENAI_API_KEY);
const result = await engine.findConnections(deepContext);

console.log(`Found ${result.breakthroughs.length} breakthroughs!`);
```

## Documentation

- **[Usage Guide](../../../../docs/CONNECTION_DISCOVERY_USAGE_GUIDE.md)** - Comprehensive guide with examples
- **[Architecture](../../../../docs/CONNECTION_DISCOVERY_ENGINE.md)** - Technical details
- **[Build Summary](../../../../docs/CONNECTION_DISCOVERY_COMPLETE.md)** - What was built

## Components

### ConnectionDiscoveryEngine
Main orchestrator. Use this for everything.

### EmbeddingService
OpenAI API integration with aggressive caching.

### SimilarityCalculator
Cosine similarity calculations between embeddings.

### TwoWayConnectionFinder
Finds connections between pairs of data points.

### ThreeWayConnectionFinder
Finds "holy shit" connections between three independent sources.

### ConnectionScorer
Calculates breakthrough potential scores (0-100).

## Example

```typescript
import { ConnectionDiscoveryEngine } from '@/services/breakthrough/connections';

async function analyzeContentOpportunities(deepContext: DeepContext) {
  const engine = new ConnectionDiscoveryEngine();

  const result = await engine.findConnections(deepContext, {
    minBreakthroughScore: 70,
    enableThreeWay: true,
    maxConnections: 15
  });

  // Get highest-impact insights
  const holyShitInsights = result.connections.filter(
    conn => conn.breakthroughPotential.expectedImpact === 'holy shit'
  );

  return holyShitInsights.map(insight => ({
    title: insight.breakthroughPotential.contentAngle,
    score: insight.breakthroughPotential.score,
    sources: [
      insight.sources.primary.source,
      insight.sources.secondary.source,
      insight.sources.tertiary?.source
    ].filter(Boolean),
    explanation: insight.relationship.explanation
  }));
}
```

## Status

✅ **100% Complete and Operational**

All components built, tested, and documented. Ready for integration with V6 Mirror Dashboard.
