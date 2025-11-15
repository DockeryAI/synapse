/**
 * Breakthrough Types (Alias for Synapse Types)
 *
 * This file provides backwards compatibility for the content generation system
 * which was built when insights were called "Breakthrough" instead of "Synapse"
 *
 * Created: 2025-11-11
 */

import type { SynapseInsight } from './synapse.types';

// Re-export SynapseInsight as BreakthroughInsight for backwards compatibility
export type BreakthroughInsight = SynapseInsight;

// Re-export all other types from synapse.types
export * from './synapse.types';
