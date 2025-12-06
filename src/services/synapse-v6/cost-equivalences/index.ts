/**
 * Cost Equivalences Module Index
 */

export {
  type EmotionalWeight,
  type TargetPersona,
  type CostEquivalence,
  B2C_COSTS,
  B2B_COSTS,
  ALL_COSTS,
  getCostsForPersona,
  getHighEmotionalCosts,
  calculateEquivalence,
  findBestEquivalence,
} from './b2b-costs';

export {
  type CostHook,
  generateCostHook,
  generateMultipleHooks,
  generateFearHooks,
  generateComparisonHooks,
  generateROIHooks,
  generateAllHooks,
} from './hook-generator';
