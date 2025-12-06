// PRD Feature: SYNAPSE-V6
/**
 * Connection Discovery Module
 *
 * Export all connection discovery services
 *
 * Created: 2025-11-10
 * Updated: 2025-12-05 - Added Universal Intelligence Engine components
 */

export { ConnectionDiscoveryEngine } from './ConnectionDiscoveryEngine';
export { EmbeddingService } from './EmbeddingService';
export { SimilarityCalculator } from './SimilarityCalculator';
export { TwoWayConnectionFinder } from './TwoWayConnectionFinder';
export { ThreeWayConnectionFinder } from './ThreeWayConnectionFinder';
export { ConnectionScorer } from './ConnectionScorer';

// Universal Intelligence Engine - New Components
export {
  ConnectionHintGenerator,
  cosineSimilarity,
  generateEmbeddings,
  type ConnectionHint,
  type EmbeddingResult,
} from './connection-hint-generator';

export {
  ThreeWayDetector,
  type ThreeWayConnection,
} from './three-way-detector';

export {
  ConnectionScorer as V1ConnectionScorer,
  scoreTwoWayConnection,
  scoreThreeWayConnection,
  type ConnectionScore,
  type ScoredConnection,
} from './connection-scorer';

export type { EmbeddingRequest, EmbeddingResponse } from './EmbeddingService';
export type { TwoWayConnectionCandidate } from './TwoWayConnectionFinder';
export type { ThreeWayConnectionCandidate } from './ThreeWayConnectionFinder';
