/**
 * Cost Equivalence Hook Generator
 *
 * Generates behavioral economics hooks from cost equivalences.
 * Exploits loss aversion: framing as "what you'll stop spending" vs "what you'll start spending"
 */

import {
  type CostEquivalence,
  type TargetPersona,
  findBestEquivalence,
  getHighEmotionalCosts,
  B2B_COSTS,
} from './b2b-costs';

export interface CostHook {
  hook: string;
  equivalence: CostEquivalence;
  emotionalWeight: string;
  targetPersona: TargetPersona | TargetPersona[];
}

/**
 * B2B Hook Templates
 */
const B2B_HOOK_TEMPLATES = [
  // Churn-based
  {
    pattern: 'churn',
    template: (months: number, item: string) =>
      `Your ${months.toFixed(0)}% annual churn costs more than ${Math.ceil(months)} ${item.toLowerCase()}s`,
  },
  // Developer comparison
  {
    pattern: 'dev',
    template: (months: number, item: string) =>
      `This costs less than ${months.toFixed(1)} months of a ${item.toLowerCase()}`,
  },
  // Time-based
  {
    pattern: 'hours',
    template: (hours: number) =>
      `Your team wastes ${hours.toFixed(0)} hours per month on this - that's $${(hours * 50).toLocaleString()} in lost productivity`,
  },
  // Sales cycle
  {
    pattern: 'sales-cycle',
    template: (months: number, pipelineValue: number) =>
      `Every extra month in your sales cycle costs ${(pipelineValue * 0.08).toLocaleString()} in delayed revenue`,
  },
  // Implementation risk
  {
    pattern: 'implementation',
    template: () =>
      `The average failed implementation costs $500K + one executive's career`,
  },
];

/**
 * Generate hook from annual cost
 */
export function generateCostHook(
  annualCost: number,
  persona?: TargetPersona
): CostHook | null {
  const result = findBestEquivalence(annualCost, persona);
  if (!result) return null;

  const { equivalence, months } = result;

  // Generate hook based on equivalence type
  let hook: string;

  if (equivalence.id.includes('dev')) {
    hook = `This solution costs less than ${months.toFixed(1)} months of a ${equivalence.item.toLowerCase()}`;
  } else if (equivalence.id === 'churn-1pct') {
    hook = `Your churn is costing you the equivalent of ${months.toFixed(1)} months of this investment`;
  } else if (equivalence.monthly) {
    hook = `That's just ${months.toFixed(1)} months of your ${equivalence.item.toLowerCase()} budget`;
  } else {
    hook = `Compare this to your ${equivalence.item.toLowerCase()} costs`;
  }

  return {
    hook,
    equivalence,
    emotionalWeight: equivalence.emotionalWeight,
    targetPersona: equivalence.targetPersona,
  };
}

/**
 * Generate multiple hooks for different personas
 */
export function generateMultipleHooks(
  annualCost: number,
  personas: TargetPersona[]
): CostHook[] {
  const hooks: CostHook[] = [];

  for (const persona of personas) {
    const hook = generateCostHook(annualCost, persona);
    if (hook) {
      hooks.push(hook);
    }
  }

  return hooks;
}

/**
 * Generate fear-based B2B hooks
 */
export function generateFearHooks(): string[] {
  return [
    "The average failed implementation costs $500K + one executive's career",
    "Every extra month in your sales cycle = 8% of pipeline at risk",
    "Your 2% annual churn costs more than 3 senior developers",
    "That manual process is costing $50/hour × everyone touching it",
    "A data breach averages $4.45M. How much is prevention worth?",
    "Each bad hire costs ~$150K when you factor in recruiting, training, and lost productivity",
  ];
}

/**
 * Generate comparison hooks
 */
export function generateComparisonHooks(monthlyPrice: number): string[] {
  const hooks: string[] = [];

  // Find B2B costs that make good comparisons
  for (const cost of B2B_COSTS) {
    if (!cost.monthly) continue;

    const ratio = cost.monthly / monthlyPrice;

    if (ratio >= 5 && ratio <= 100) {
      hooks.push(
        `Less than ${(1/ratio * 100).toFixed(0)}% of a ${cost.item.toLowerCase()}`
      );
    }
  }

  return hooks;
}

/**
 * Generate ROI framing hooks
 */
export function generateROIHooks(
  annualCost: number,
  potentialSavings: number
): string[] {
  const roi = ((potentialSavings - annualCost) / annualCost) * 100;
  const paybackMonths = (annualCost / potentialSavings) * 12;

  return [
    `${roi.toFixed(0)}% ROI in the first year`,
    `Pays for itself in ${paybackMonths.toFixed(1)} months`,
    `$${(potentialSavings - annualCost).toLocaleString()} net positive in year one`,
  ];
}

/**
 * Full hook generation for content
 */
export function generateAllHooks(
  annualCost: number,
  personas: TargetPersona[] = ['CTO', 'CFO', 'CEO']
): {
  persona: CostHook[];
  fear: string[];
  comparison: string[];
} {
  return {
    persona: generateMultipleHooks(annualCost, personas),
    fear: generateFearHooks(),
    comparison: generateComparisonHooks(annualCost / 12),
  };
}
