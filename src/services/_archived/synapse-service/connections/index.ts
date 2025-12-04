/**
 * Connection Discovery Module
 *
 * Export all connection discovery services
 *
 * Created: 2025-11-10
 */

export { ConnectionDiscoveryEngine } from './ConnectionDiscoveryEngine';
export { EmbeddingService } from './EmbeddingService';
export { SimilarityCalculator } from './SimilarityCalculator';
export { TwoWayConnectionFinder } from './TwoWayConnectionFinder';
export { ThreeWayConnectionFinder } from './ThreeWayConnectionFinder';
export { ConnectionScorer } from './ConnectionScorer';

export type { EmbeddingRequest, EmbeddingResponse } from './EmbeddingService';
export type { TwoWayConnectionCandidate } from './TwoWayConnectionFinder';
export type { ThreeWayConnectionCandidate } from './ThreeWayConnectionFinder';
