/**
 * B2B Cost Equivalence Database
 *
 * Same behavioral economics as V1's B2C costs, but for enterprise anchors.
 * Used to create hooks like: "Your 2% churn costs more than 3 senior developers"
 */

export type EmotionalWeight = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type TargetPersona = 'CTO' | 'CFO' | 'CEO' | 'CRO' | 'COO' | 'CHRO' | 'Board' | 'Legal' | 'All B2B';

export interface CostEquivalence {
  id: string;
  item: string;
  monthly?: number;
  annual?: number;
  formula?: string;  // For variable costs like "revenue * 0.01"
  emotionalWeight: EmotionalWeight;
  targetPersona: TargetPersona | TargetPersona[];
  description: string;
}

/**
 * B2C Cost Equivalences (Original V1)
 */
export const B2C_COSTS: CostEquivalence[] = [
  {
    id: 'starbucks',
    item: 'Daily Starbucks',
    monthly: 195,  // $6.50 × 30
    annual: 2340,
    emotionalWeight: 'HIGH',
    targetPersona: 'All B2B',  // Works for consumer-facing
    description: 'Daily coffee habit',
  },
  {
    id: 'netflix',
    item: 'Netflix subscription',
    monthly: 15,
    annual: 180,
    emotionalWeight: 'MEDIUM',
    targetPersona: 'All B2B',
    description: 'Monthly streaming',
  },
  {
    id: 'gym',
    item: 'Gym membership',
    monthly: 50,
    annual: 600,
    emotionalWeight: 'MEDIUM',
    targetPersona: 'All B2B',
    description: 'Monthly gym dues',
  },
  {
    id: 'takeout',
    item: 'Weekly takeout',
    monthly: 360,  // $90/week × 4
    annual: 4320,
    emotionalWeight: 'HIGH',
    targetPersona: 'All B2B',
    description: 'Regular takeout habit',
  },
  {
    id: 'happy-hour',
    item: 'Happy hour drinks',
    monthly: 240,  // $30 × 2/week × 4
    annual: 2880,
    emotionalWeight: 'HIGH',
    targetPersona: 'All B2B',
    description: 'Social drinking expenses',
  },
];

/**
 * B2B Cost Equivalences (New)
 */
export const B2B_COSTS: CostEquivalence[] = [
  {
    id: 'junior-dev',
    item: 'Junior developer salary',
    monthly: 8000,
    annual: 96000,
    emotionalWeight: 'HIGH',
    targetPersona: 'CTO',
    description: 'Loaded cost of a junior developer',
  },
  {
    id: 'senior-dev',
    item: 'Senior developer salary',
    monthly: 15000,
    annual: 180000,
    emotionalWeight: 'HIGH',
    targetPersona: 'CTO',
    description: 'Loaded cost of a senior developer',
  },
  {
    id: 'churn-1pct',
    item: 'Customer churn (1%)',
    formula: 'revenue * 0.01',
    emotionalWeight: 'VERY_HIGH',
    targetPersona: ['CEO', 'Board', 'CRO'],
    description: '1% of ARR lost to churn',
  },
  {
    id: 'failed-implementation',
    item: 'Failed implementation',
    annual: 500000,
    emotionalWeight: 'VERY_HIGH',
    targetPersona: 'All B2B',
    description: 'Average cost of failed enterprise software implementation',
  },
  {
    id: 'manual-hours',
    item: 'Manual process hours',
    formula: 'hours * 50',  // $50/hour average
    emotionalWeight: 'MEDIUM',
    targetPersona: 'COO',
    description: 'Cost of manual work at average wage',
  },
  {
    id: 'compliance-penalty',
    item: 'Compliance penalty exposure',
    formula: 'exposure',  // Variable
    emotionalWeight: 'VERY_HIGH',
    targetPersona: ['CFO', 'Legal'],
    description: 'Potential regulatory penalty',
  },
  {
    id: 'sales-cycle-month',
    item: 'Extra month in sales cycle',
    formula: 'pipeline * 0.08',
    emotionalWeight: 'HIGH',
    targetPersona: 'CRO',
    description: '~8% of pipeline value per month delay',
  },
  {
    id: 'consultant-day',
    item: 'Consultant day rate',
    monthly: 40000,  // 20 days × $2000
    annual: 480000,  // FTE equivalent
    emotionalWeight: 'MEDIUM',
    targetPersona: 'CFO',
    description: 'Build vs buy comparison point',
  },
  {
    id: 'bad-hire',
    item: 'Bad hire cost',
    annual: 150000,  // Salary + recruiting + lost productivity
    emotionalWeight: 'HIGH',
    targetPersona: 'CHRO',
    description: 'Total cost of hiring mistake',
  },
  {
    id: 'downtime-hour',
    item: 'System downtime (per hour)',
    formula: 'revenue / 8760',  // Annual revenue / hours in year
    emotionalWeight: 'VERY_HIGH',
    targetPersona: 'CTO',
    description: 'Revenue lost per hour of downtime',
  },
  {
    id: 'security-breach',
    item: 'Data breach average cost',
    annual: 4450000,  // IBM 2023 report
    emotionalWeight: 'VERY_HIGH',
    targetPersona: ['CTO', 'CEO', 'Legal'],
    description: 'Average cost of data breach (IBM 2023)',
  },
  {
    id: 'employee-turnover',
    item: 'Employee turnover cost',
    formula: 'salary * 0.5',  // 50% of annual salary
    emotionalWeight: 'HIGH',
    targetPersona: 'CHRO',
    description: 'Cost to replace an employee',
  },
];

/**
 * All cost equivalences
 */
export const ALL_COSTS = [...B2C_COSTS, ...B2B_COSTS];

/**
 * Get costs relevant to a persona
 */
export function getCostsForPersona(persona: TargetPersona): CostEquivalence[] {
  return ALL_COSTS.filter(cost => {
    if (Array.isArray(cost.targetPersona)) {
      return cost.targetPersona.includes(persona) || cost.targetPersona.includes('All B2B');
    }
    return cost.targetPersona === persona || cost.targetPersona === 'All B2B';
  });
}

/**
 * Get high-emotional-weight costs
 */
export function getHighEmotionalCosts(): CostEquivalence[] {
  return ALL_COSTS.filter(cost =>
    cost.emotionalWeight === 'HIGH' || cost.emotionalWeight === 'VERY_HIGH'
  );
}

/**
 * Calculate equivalent periods
 * "Your annual software cost equals X months of Y"
 */
export function calculateEquivalence(
  annualCost: number,
  equivalence: CostEquivalence
): { months: number; item: string } | null {
  if (!equivalence.monthly) return null;

  const months = annualCost / equivalence.monthly;
  return {
    months: Math.round(months * 10) / 10,
    item: equivalence.item,
  };
}

/**
 * Find best equivalence for a cost (most relatable)
 */
export function findBestEquivalence(
  annualCost: number,
  persona?: TargetPersona
): { equivalence: CostEquivalence; months: number } | null {
  const costs = persona ? getCostsForPersona(persona) : ALL_COSTS;

  // Filter to costs with monthly values
  const withMonthly = costs.filter(c => c.monthly);

  // Find equivalence in "sweet spot" of 3-12 months
  for (const cost of withMonthly) {
    const months = annualCost / cost.monthly!;
    if (months >= 3 && months <= 12) {
      return {
        equivalence: cost,
        months: Math.round(months * 10) / 10,
      };
    }
  }

  // Fall back to any reasonable equivalence
  if (withMonthly.length > 0) {
    const cost = withMonthly[0];
    return {
      equivalence: cost,
      months: Math.round((annualCost / cost.monthly!) * 10) / 10,
    };
  }

  return null;
}
