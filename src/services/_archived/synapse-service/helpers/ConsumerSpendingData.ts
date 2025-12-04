/**
 * Consumer Spending Data
 *
 * Database of common consumer expenses for behavioral economics calculations
 * Used to create "your daily habit = our service" content hooks
 */

export interface ConsumerExpense {
  name: string;
  category: 'daily' | 'weekly' | 'monthly' | 'annual';
  costPer: number;
  frequency: string;
  annualCost: number;
  demographics: string[];
  emotionalValue: 'low' | 'medium' | 'high';
}

/**
 * Common Daily Expenses
 */
export const DAILY_EXPENSES: ConsumerExpense[] = [
  {
    name: 'Premium Coffee (Starbucks)',
    category: 'daily',
    costPer: 6.50,
    frequency: '5x/week',
    annualCost: 1690,
    demographics: ['professionals', 'urban', 'millennials'],
    emotionalValue: 'high'
  },
  {
    name: 'Fast Food Lunch',
    category: 'daily',
    costPer: 12,
    frequency: '5x/week',
    annualCost: 3120,
    demographics: ['working professionals', 'busy parents'],
    emotionalValue: 'low'
  },
  {
    name: 'Restaurant Lunch',
    category: 'daily',
    costPer: 18,
    frequency: '3x/week',
    annualCost: 2808,
    demographics: ['professionals', 'urban', 'foodies'],
    emotionalValue: 'medium'
  },
  {
    name: 'Vending Machine Snacks',
    category: 'daily',
    costPer: 3,
    frequency: '5x/week',
    annualCost: 780,
    demographics: ['office workers', 'students'],
    emotionalValue: 'low'
  },
  {
    name: 'Energy Drinks',
    category: 'daily',
    costPer: 4,
    frequency: '5x/week',
    annualCost: 1040,
    demographics: ['young professionals', 'shift workers'],
    emotionalValue: 'low'
  }
];

/**
 * Common Monthly Subscriptions
 */
export const MONTHLY_SUBSCRIPTIONS: ConsumerExpense[] = [
  {
    name: 'Netflix + Streaming Services',
    category: 'monthly',
    costPer: 45,
    frequency: 'monthly',
    annualCost: 540,
    demographics: ['all demographics'],
    emotionalValue: 'medium'
  },
  {
    name: 'Spotify Premium',
    category: 'monthly',
    costPer: 11,
    frequency: 'monthly',
    annualCost: 132,
    demographics: ['millennials', 'gen-z'],
    emotionalValue: 'high'
  },
  {
    name: 'Gym Membership',
    category: 'monthly',
    costPer: 50,
    frequency: 'monthly',
    annualCost: 600,
    demographics: ['health-conscious', 'professionals'],
    emotionalValue: 'medium'
  },
  {
    name: 'Meal Kit Subscription',
    category: 'monthly',
    costPer: 120,
    frequency: 'monthly',
    annualCost: 1440,
    demographics: ['busy families', 'foodies'],
    emotionalValue: 'medium'
  },
  {
    name: 'Amazon Prime',
    category: 'monthly',
    costPer: 15,
    frequency: 'monthly',
    annualCost: 180,
    demographics: ['all demographics'],
    emotionalValue: 'medium'
  }
];

/**
 * Common Weekly Expenses
 */
export const WEEKLY_EXPENSES: ConsumerExpense[] = [
  {
    name: 'Takeout/Delivery Dinner',
    category: 'weekly',
    costPer: 45,
    frequency: '2x/week',
    annualCost: 4680,
    demographics: ['busy families', 'professionals'],
    emotionalValue: 'high'
  },
  {
    name: 'Happy Hour Drinks',
    category: 'weekly',
    costPer: 30,
    frequency: '2x/week',
    annualCost: 3120,
    demographics: ['young professionals', 'social'],
    emotionalValue: 'high'
  },
  {
    name: 'Grocery Store Prepared Foods',
    category: 'weekly',
    costPer: 35,
    frequency: '2x/week',
    annualCost: 3640,
    demographics: ['busy professionals', 'families'],
    emotionalValue: 'low'
  },
  {
    name: 'Drive-Through Coffee',
    category: 'weekly',
    costPer: 25,
    frequency: '5x/week',
    annualCost: 6500,
    demographics: ['commuters', 'parents'],
    emotionalValue: 'high'
  }
];

/**
 * Common Annual/Occasional Expenses
 */
export const ANNUAL_EXPENSES: ConsumerExpense[] = [
  {
    name: 'Concert/Event Tickets',
    category: 'annual',
    costPer: 200,
    frequency: '4x/year',
    annualCost: 800,
    demographics: ['millennials', 'entertainment seekers'],
    emotionalValue: 'high'
  },
  {
    name: 'Vacation Dining',
    category: 'annual',
    costPer: 500,
    frequency: '2x/year',
    annualCost: 1000,
    demographics: ['travelers', 'foodies'],
    emotionalValue: 'high'
  },
  {
    name: 'Cell Phone Upgrade',
    category: 'annual',
    costPer: 1000,
    frequency: '1x/year',
    annualCost: 1000,
    demographics: ['tech-savvy', 'all demographics'],
    emotionalValue: 'medium'
  }
];

/**
 * All Consumer Expenses Combined
 */
export const ALL_CONSUMER_EXPENSES: ConsumerExpense[] = [
  ...DAILY_EXPENSES,
  ...WEEKLY_EXPENSES,
  ...MONTHLY_SUBSCRIPTIONS,
  ...ANNUAL_EXPENSES
];

/**
 * Get expenses relevant to specific demographics
 */
export function getExpensesForDemographic(demographic: string): ConsumerExpense[] {
  return ALL_CONSUMER_EXPENSES.filter(expense =>
    expense.demographics.some(d =>
      d.toLowerCase().includes(demographic.toLowerCase())
    )
  );
}

/**
 * Get expenses by emotional value (high emotional value = better for behavioral hooks)
 */
export function getHighEmotionalValueExpenses(): ConsumerExpense[] {
  return ALL_CONSUMER_EXPENSES.filter(expense =>
    expense.emotionalValue === 'high'
  );
}

/**
 * Get expenses in a specific cost range
 */
export function getExpensesInRange(minAnnual: number, maxAnnual: number): ConsumerExpense[] {
  return ALL_CONSUMER_EXPENSES.filter(expense =>
    expense.annualCost >= minAnnual && expense.annualCost <= maxAnnual
  );
}
