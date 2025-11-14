/**
 * Cost Equivalence Calculator
 *
 * Calculates behavioral economics hooks by finding consumer spending equivalents
 * to business services. Enables "your daily habit = our service" content style.
 */

import {
  ALL_CONSUMER_EXPENSES,
  getHighEmotionalValueExpenses,
  getExpensesInRange,
  type ConsumerExpense
} from './ConsumerSpendingData';

export interface ServiceCost {
  name: string;
  price: number;
  unit: string; // 'one-time', 'monthly', 'annual'
  category?: string;
}

export interface CostEquivalence {
  service: ServiceCost;
  expense: ConsumerExpense;
  equivalenceType: 'exact' | 'months' | 'weeks' | 'days';
  timeframe: string; // e.g., "3 months of lattes"
  hook: string; // Ready-to-use content hook
  calculation: string; // The math breakdown
  emotionalWeight: 'high' | 'medium' | 'low';
}

export interface CostEquivalenceResult {
  bestMatches: CostEquivalence[];
  allEquivalences: CostEquivalence[];
  totalExpensesAnalyzed: number;
  highEmotionalMatches: CostEquivalence[];
}

/**
 * Calculate cost equivalences for a business service
 */
export function calculateCostEquivalences(
  serviceCost: ServiceCost,
  targetDemographic?: string
): CostEquivalenceResult {
  // Convert service cost to annual for comparison
  const serviceAnnualCost = normalizeToAnnual(serviceCost);

  // Get relevant expenses
  const expensesToCheck = targetDemographic
    ? ALL_CONSUMER_EXPENSES.filter(e =>
        e.demographics.some(d => d.toLowerCase().includes(targetDemographic.toLowerCase()))
      )
    : ALL_CONSUMER_EXPENSES;

  // Find equivalences
  const allEquivalences: CostEquivalence[] = [];

  for (const expense of expensesToCheck) {
    const equivalences = findEquivalences(serviceCost, serviceAnnualCost, expense);
    allEquivalences.push(...equivalences);
  }

  // Sort by relevance (emotional value + time frame reasonableness)
  allEquivalences.sort((a, b) => {
    const aScore = getRelevanceScore(a);
    const bScore = getRelevanceScore(b);
    return bScore - aScore;
  });

  // Get best matches (top 5)
  const bestMatches = allEquivalences.slice(0, 5);

  // Get high emotional matches
  const highEmotionalMatches = allEquivalences.filter(
    eq => eq.emotionalWeight === 'high'
  );

  return {
    bestMatches,
    allEquivalences,
    totalExpensesAnalyzed: expensesToCheck.length,
    highEmotionalMatches: highEmotionalMatches.slice(0, 3)
  };
}

/**
 * Calculate multiple services at once
 */
export function calculateMultiServiceEquivalences(
  services: ServiceCost[],
  targetDemographic?: string
): Map<string, CostEquivalenceResult> {
  const results = new Map<string, CostEquivalenceResult>();

  for (const service of services) {
    results.set(service.name, calculateCostEquivalences(service, targetDemographic));
  }

  return results;
}

/**
 * Normalize service cost to annual for comparison
 */
function normalizeToAnnual(service: ServiceCost): number {
  switch (service.unit) {
    case 'one-time':
      return service.price;
    case 'monthly':
      return service.price * 12;
    case 'annual':
      return service.price;
    default:
      return service.price;
  }
}

/**
 * Find all possible equivalences between service and expense
 */
function findEquivalences(
  service: ServiceCost,
  serviceAnnualCost: number,
  expense: ConsumerExpense
): CostEquivalence[] {
  const equivalences: CostEquivalence[] = [];

  // Calculate different timeframes
  const expenseDaily = expense.annualCost / 365;
  const expenseWeekly = expense.annualCost / 52;
  const expenseMonthly = expense.annualCost / 12;

  // Check for reasonable timeframes (1 day to 24 months)

  // Daily equivalence
  const days = Math.round(serviceAnnualCost / expenseDaily);
  if (days >= 1 && days <= 365) {
    equivalences.push(createEquivalence(service, expense, days, 'days'));
  }

  // Weekly equivalence
  const weeks = Math.round(serviceAnnualCost / expenseWeekly);
  if (weeks >= 1 && weeks <= 104) {
    equivalences.push(createEquivalence(service, expense, weeks, 'weeks'));
  }

  // Monthly equivalence
  const months = Math.round(serviceAnnualCost / expenseMonthly);
  if (months >= 1 && months <= 24) {
    equivalences.push(createEquivalence(service, expense, months, 'months'));
  }

  // Exact match (within 10%)
  const diff = Math.abs(serviceAnnualCost - expense.annualCost) / serviceAnnualCost;
  if (diff <= 0.10) {
    equivalences.push(createExactEquivalence(service, expense));
  }

  return equivalences;
}

/**
 * Create a cost equivalence object
 */
function createEquivalence(
  service: ServiceCost,
  expense: ConsumerExpense,
  amount: number,
  unit: 'days' | 'weeks' | 'months'
): CostEquivalence {
  const timeframe = `${amount} ${unit} of ${expense.name}`;

  // Generate hook based on expense type
  let hook = '';
  if (unit === 'months' && amount <= 12) {
    hook = `Why your ${expense.name.toLowerCase()} habit proves you can afford ${service.name.toLowerCase()}`;
  } else if (unit === 'weeks' && amount <= 26) {
    hook = `${amount} ${unit} of ${expense.name.toLowerCase()} = one ${service.name.toLowerCase()}`;
  } else {
    hook = `Skip ${expense.name.toLowerCase()} for ${amount} ${unit} → ${service.name.toLowerCase()}`;
  }

  // Generate calculation breakdown
  const calculation = generateCalculation(service, expense, amount, unit);

  return {
    service,
    expense,
    equivalenceType: unit,
    timeframe,
    hook,
    calculation,
    emotionalWeight: expense.emotionalValue
  };
}

/**
 * Create exact match equivalence
 */
function createExactEquivalence(
  service: ServiceCost,
  expense: ConsumerExpense
): CostEquivalence {
  const hook = `Your ${expense.name.toLowerCase()} costs the same as ${service.name.toLowerCase()} - which creates lasting value?`;
  const calculation = `${expense.name}: $${expense.annualCost}/year = ${service.name}: $${normalizeToAnnual(service)}/year`;

  return {
    service,
    expense,
    equivalenceType: 'exact',
    timeframe: 'Annual equivalence',
    hook,
    calculation,
    emotionalWeight: expense.emotionalValue
  };
}

/**
 * Generate calculation breakdown
 */
function generateCalculation(
  service: ServiceCost,
  expense: ConsumerExpense,
  amount: number,
  unit: 'days' | 'weeks' | 'months'
): string {
  const serviceAnnual = normalizeToAnnual(service);
  const expensePer = unit === 'days'
    ? expense.annualCost / 365
    : unit === 'weeks'
    ? expense.annualCost / 52
    : expense.annualCost / 12;

  return `${expense.name}: $${expensePer.toFixed(2)}/${unit.slice(0, -1)} × ${amount} ${unit} = $${(expensePer * amount).toFixed(2)} ≈ ${service.name} ($${serviceAnnual})`;
}

/**
 * Calculate relevance score for sorting
 */
function getRelevanceScore(equivalence: CostEquivalence): number {
  let score = 0;

  // Prefer high emotional value
  if (equivalence.emotionalWeight === 'high') score += 30;
  else if (equivalence.emotionalWeight === 'medium') score += 15;

  // Prefer reasonable timeframes (3-12 months is sweet spot)
  if (equivalence.equivalenceType === 'months') {
    const months = parseInt(equivalence.timeframe);
    if (months >= 3 && months <= 12) score += 25;
    else if (months >= 1 && months <= 3) score += 15;
    else if (months >= 13 && months <= 18) score += 10;
  } else if (equivalence.equivalenceType === 'weeks') {
    const weeks = parseInt(equivalence.timeframe);
    if (weeks >= 4 && weeks <= 26) score += 20;
  } else if (equivalence.equivalenceType === 'exact') {
    score += 35; // Exact matches are golden
  }

  // Prefer shorter, punchier timeframes for days
  if (equivalence.equivalenceType === 'days') {
    const days = parseInt(equivalence.timeframe);
    if (days <= 30) score += 15;
    else if (days <= 90) score += 10;
  }

  return score;
}

/**
 * Generate formatted output for Sonnet
 */
export function formatForPrompt(result: CostEquivalenceResult): string {
  let output = '### Cost Equivalences (Behavioral Economics Hooks)\n\n';

  output += '**Best Matches** (ready-to-use in content):\n';
  for (const eq of result.bestMatches) {
    output += `- ${eq.hook}\n`;
    output += `  *Calculation*: ${eq.calculation}\n\n`;
  }

  if (result.highEmotionalMatches.length > 0) {
    output += '\n**High Emotional Impact** (strongest psychological resonance):\n';
    for (const eq of result.highEmotionalMatches.slice(0, 3)) {
      output += `- ${eq.hook}\n`;
    }
  }

  return output;
}

/**
 * Generate industry-specific examples
 */
export function getIndustryExamples(industry: string): ServiceCost[] {
  const examples: { [key: string]: ServiceCost[] } = {
    restaurant: [
      { name: "Chef's Tasting Menu", price: 150, unit: 'one-time', category: 'fine dining' },
      { name: 'Monthly Date Night Package', price: 200, unit: 'monthly', category: 'romantic' },
      { name: 'Private Dining Experience', price: 500, unit: 'one-time', category: 'special occasion' }
    ],
    dental: [
      { name: 'Teeth Whitening', price: 400, unit: 'one-time', category: 'cosmetic' },
      { name: 'Dental Veneers', price: 4500, unit: 'one-time', category: 'cosmetic' },
      { name: 'Invisalign Treatment', price: 5000, unit: 'one-time', category: 'orthodontic' }
    ],
    roofing: [
      { name: 'Roof Repair Section', price: 2500, unit: 'one-time', category: 'maintenance' },
      { name: 'Full Roof Replacement', price: 15000, unit: 'one-time', category: 'replacement' },
      { name: 'Emergency Leak Repair', price: 500, unit: 'one-time', category: 'emergency' }
    ],
    salon: [
      { name: 'Hair Color Treatment', price: 180, unit: 'one-time', category: 'color' },
      { name: 'Keratin Treatment', price: 350, unit: 'one-time', category: 'treatment' },
      { name: 'Monthly Maintenance Package', price: 120, unit: 'monthly', category: 'subscription' }
    ]
  };

  return examples[industry.toLowerCase()] || [];
}
