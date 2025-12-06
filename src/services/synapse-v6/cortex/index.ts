/**
 * Cortex Module Index
 */

export {
  type CortexPrinciple,
  B2C_PRINCIPLES,
  B2B_PRINCIPLES,
  ALL_PRINCIPLES,
  getPrinciple,
  getPrinciples,
} from './b2b-principles';

export {
  type CortexWeights,
  CORTEX_WEIGHTS,
  getCortexWeights,
  getTopPrinciples,
  getB2BPrincipleScores,
  getB2BIntensity,
} from './cortex-weights';
